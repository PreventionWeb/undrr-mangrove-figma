#!/usr/bin/env node
'use strict';
const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto'),assert=require('node:assert/strict'),{spawnSync}=require('node:child_process');
const digest=b=>crypto.createHash('sha256').update(b).digest('hex');
function parse(args){const parsed={};for(let i=0;i<args.length;i+=2){const key=args[i];assert(['--source-root','--config','--config-sha256','--test'].includes(key),'Unknown supporting option '+key);assert(!Object.hasOwn(parsed,key),'Duplicate option '+key);assert(typeof args[i+1]==='string'&&args[i+1]&&!args[i+1].startsWith('--'),'Missing value '+key);parsed[key]=args[i+1];}for(const key of ['--source-root','--config','--config-sha256'])assert(parsed[key],'Explicit '+key+' required');assert(/^[0-9a-f]{64}$/.test(parsed['--config-sha256']),'Exact config SHA256 required');return parsed;}
function run({args,toolRoot,cohortPath,cohortSHA256}){
 const opts=parse(args),actualTool=fs.realpathSync(toolRoot),sourceRoot=fs.realpathSync(opts['--source-root']);assert.notEqual(sourceRoot,actualTool,'Separate source/tool roots required');
 const bytes=fs.readFileSync(opts['--config']);assert.equal(digest(bytes),opts['--config-sha256'],'Supporting config checksum changed');const config=JSON.parse(bytes);
 assert.equal(fs.realpathSync(config.sourceRoot),sourceRoot,'Source-root option differs from config');assert.equal(fs.realpathSync(config.toolRoot),actualTool,'Config tool root differs from launcher');assert.equal(config.exporterExecutionAuthorized,false,'This launcher cannot enable the full producer');
 const inputBytes=fs.readFileSync(config.manifestPath);assert.equal(digest(inputBytes),config.manifestSHA256,'Input manifest checksum changed');const inputs=JSON.parse(inputBytes),rows=new Map(inputs.files.map(row=>[row.logicalPath,row]));assert.equal(rows.size,inputs.files.length,'Duplicate input row');
 const cohortBytes=fs.readFileSync(cohortPath);assert.equal(digest(cohortBytes),cohortSHA256,'Cohort bytes changed');const cohort=JSON.parse(cohortBytes);assert.equal(cohort.format,'mangrove-supporting-test-cohort-v1');assert.equal(cohort.id,'supporting-first19');assert.equal(cohort.tests.length,new Set(cohort.tests.map(x=>x.name)).size,'Duplicate test');
 for(const need of cohort.additionalSourceInputs||[]){const row=rows.get(need.logicalPath);assert(row?.owner==='source'&&row.executionAllowed===false,'Supporting source fixture declaration missing');assert.equal(row.sha256,need.sha256);assert.equal(row.bytes,need.bytes);const file=path.join(sourceRoot,need.logicalPath);assert.equal(fs.realpathSync(file),file,'Source fixture symlink not admitted');const raw=fs.readFileSync(file);assert.equal(raw.length,need.bytes);assert.equal(digest(raw),need.sha256,'Supporting source fixture bytes changed');}
 const tests=opts['--test']?cohort.tests.filter(row=>row.name===opts['--test']):cohort.tests;assert(tests.length,'Test is not in this admitted cohort');
 // Check the entire chosen cohort before any child; children retain normal configured-input guards.
 const planned=tests.map(test=>{assert(/^examples\/figma-plugin\/dev\/mock-[a-z0-9-]+\.cjs$/.test(test.path),'Invalid test path');const row=rows.get(test.path);assert(row?.owner==='tool'&&row.executionAllowed===true,'Test must be current TOOL code');assert.equal(row.sha256,test.sha256);assert.equal(row.bytes,test.bytes);const file=path.join(actualTool,test.path);assert.equal(fs.realpathSync(file),file,'Test symlink not admitted');const raw=fs.readFileSync(file);assert.equal(raw.length,test.bytes);assert.equal(digest(raw),test.sha256,'Current test body changed');return {...test,file};});
 const env={...process.env,MANGROVE_SOURCE_ROOT:sourceRoot,MANGROVE_EXPANDED_INPUTS_CONFIG:fs.realpathSync(opts['--config']),MANGROVE_EXPANDED_INPUTS_CONFIG_SHA256:opts['--config-sha256']};delete env.MANGROVE_SUPPORTING_TEST_ONLY;
 // Original facts are captured before the first child. Checks are sequential, not an OS race-free claim.
 const configFile=fs.realpathSync(opts['--config']),manifestFile=fs.realpathSync(config.manifestPath),cohortFile=fs.realpathSync(cohortPath);
 const checkedSources=(cohort.additionalSourceInputs||[]).map(need=>({...need,file:path.join(sourceRoot,need.logicalPath)}));
 const facts=[...new Set([actualTool,sourceRoot,configFile,manifestFile,cohortFile,...planned.map(test=>test.file),...checkedSources.map(need=>need.file)])].map(file=>{const stat=fs.lstatSync(file);assert(!stat.isSymbolicLink(),'Original supporting authority symlink');return{file,dev:stat.dev,ino:stat.ino,directory:stat.isDirectory()};});
 function fence(){
  assert.equal(fs.realpathSync(toolRoot),actualTool,'Launcher tool association drift');assert.equal(fs.realpathSync(opts['--source-root']),sourceRoot,'Source option association drift');assert.equal(fs.realpathSync(opts['--config']),configFile,'Config association drift');assert.equal(fs.realpathSync(config.manifestPath),manifestFile,'Manifest association drift');assert.equal(fs.realpathSync(cohortPath),cohortFile,'Cohort association drift');
  for(const fact of facts){const stat=fs.lstatSync(fact.file);assert(!stat.isSymbolicLink()&&stat.dev===fact.dev&&stat.ino===fact.ino&&stat.isDirectory()===fact.directory,'Original supporting authority identity drift: '+fact.file);}
  assert.equal(digest(fs.readFileSync(configFile)),opts['--config-sha256'],'Supporting config checksum changed');assert.equal(digest(fs.readFileSync(manifestFile)),config.manifestSHA256,'Input manifest checksum changed');assert.equal(digest(fs.readFileSync(cohortFile)),cohortSHA256,'Cohort bytes changed');
  for(const test of planned){assert.equal(fs.realpathSync(test.file),test.file,'Test path association drift');const raw=fs.readFileSync(test.file);assert.equal(raw.length,test.bytes,'Current test length drift');assert.equal(digest(raw),test.sha256,'Current test body changed');}
  for(const need of checkedSources){assert.equal(fs.realpathSync(need.file),need.file,'Source fixture path association drift');const raw=fs.readFileSync(need.file);assert.equal(raw.length,need.bytes,'Supporting source fixture length drift');assert.equal(digest(raw),need.sha256,'Supporting source fixture bytes changed');}
 }
 const results=[];let refusal=null;
 for(const test of planned){
  try{fence();}catch(error){refusal={stage:'before-child',test:test.name,error:error.message};break;}
  let child;try{child=spawnSync(process.execPath,[test.file],{cwd:actualTool,env,stdio:'inherit'});}catch(error){child={status:null,signal:null,error};}
  results.push({name:test.name,status:child.status,signal:child.signal,error:child.error?.message||null});
  try{fence();}catch(error){refusal={stage:'after-child',test:test.name,error:error.message};break;}
  if(child.status!==0||child.error||child.signal)break;
 }
 return {cohort:cohort.id,selected:planned.length,completed:results.length,passed:results.filter(x=>x.status===0&&!x.error&&!x.signal).length,ok:!refusal&&results.length===planned.length&&results.every(x=>x.status===0&&!x.error&&!x.signal),integrityVerified:!refusal,refusal,fullProducerExecuted:false,scope:cohort.scope,results};
}
if(require.main===module){try{const report=run({args:process.argv.slice(2),toolRoot:path.resolve(__dirname,'..'),cohortPath:path.join(__dirname,'supporting-first19.json'),cohortSHA256:'f8732f18e050259ddd6abdd56b2ac56940533d2d9b926b427c6b797175cafe7d'});console.log(JSON.stringify(report));process.exitCode=report.ok?0:1;}catch(error){console.error(JSON.stringify({ok:false,stage:'supporting-admission',error:error.message,fullProducerExecuted:false}));process.exitCode=1;}}
module.exports={parse,run};
