'use strict';
const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto'),assert=require('node:assert/strict');
const {execFileSync}=require('node:child_process');
const {createRequire}=require('node:module');
const digest=b=>crypto.createHash('sha256').update(b).digest('hex');
const inside=(file,root)=>file===root||file.startsWith(root+path.sep);
const decode=x=>Buffer.from(x,'base64');
function reconstruct(current,mapping){
 assert.equal(digest(current),mapping.currentSHA256,'Current executable body changed');
 let cursor=0;const parts=[];
 for(const e of mapping.reverseEdits){assert(Number.isInteger(e.start)&&Number.isInteger(e.end)&&e.start>=cursor&&e.end>=e.start&&e.end<=current.length,'Invalid reverse mapping');parts.push(current.subarray(cursor,e.start),decode(e.originalBase64));cursor=e.end;}
 parts.push(current.subarray(cursor));const original=Buffer.concat(parts);assert.equal(original.length,mapping.originalBytes,'Historical body length changed');assert.equal(digest(original),mapping.originalSHA256,'Historical reverse body changed');return original;
}
function verifyConfiguredCache(config,manifest){
 const c=config.cacheAdmission;assert(c&&typeof c==='object'&&!Array.isArray(c),'Successful separately reviewed committed cache admission required');
 assert(/^[0-9a-f]{64}$/.test(c.operationReceiptSHA256||'')&&/^[0-9a-f]{64}$/.test(c.indexSHA256||''),'Exact cache receipt/index pins required');
 const toolRoot=fs.realpathSync(config.toolRoot);assert.equal(fs.realpathSync(path.join(__dirname,'..')),toolRoot,'Cache verifier/helper tool root differs');
 for(const name of ['committed-cache.cjs','multipart-cache.cjs','destination-authority.cjs','owned-cleanup.cjs','reference-cache.cjs']){const logicalPath='scripts/figma-reference-cache/'+name,row=manifest.files.find(r=>r.logicalPath===logicalPath);assert(row?.owner==='tool'&&row.executionAllowed===true,'Exact tool-owned verifier module required');const file=path.join(toolRoot,logicalPath);assert(inside(fs.realpathSync(file),toolRoot),'Verifier module escapes tool root');const raw=fs.readFileSync(file);assert.equal(raw.length,row.bytes);assert.equal(digest(raw),row.sha256,'Cache verifier module body drift');}
 const {verifyCommittedCache}=require('./figma-reference-cache/committed-cache.cjs');
 const descriptor=verifyCommittedCache(fs.readFileSync(c.operationReceiptPath),c.operationReceiptSHA256,fs.readFileSync(c.indexPath),c.indexSHA256);assert(Object.isFrozen(descriptor),'Frozen read-only cache descriptor required');
 assert.equal(descriptor.readOnly,true);assert.equal(descriptor.executionAllowed,false);assert.equal(descriptor.referenceRoot,fs.realpathSync(config.referenceRoot),'Configured reference root differs from committed cache');
 const records=manifest.files.filter(r=>r.owner==='reference').map(r=>{assert.equal(r.executionAllowed,false,'Executable reference input');return{path:r.logicalPath,bytes:r.bytes,sha256:r.sha256,kind:r.memberKind||'data',executionAllowed:false};}).sort((a,b)=>a.path<b.path?-1:a.path>b.path?1:0);
 assert.equal(descriptor.members,records.length,'Whole reference membership count');assert.equal(descriptor.memberSetSHA256,digest(Buffer.from(JSON.stringify(records))),'Whole typed reference member set differs');return descriptor;
}
function createAuthority(config,manifest){
 config=JSON.parse(JSON.stringify(config));manifest=JSON.parse(JSON.stringify(manifest));
 assert.equal(config.version,1);assert.equal(manifest.version,1);assert.equal(config.sourceRevision,manifest.sourceRevision);
 const roots={source:fs.realpathSync(config.sourceRoot),tool:fs.realpathSync(config.toolRoot),reference:fs.realpathSync(config.referenceRoot),output:fs.realpathSync(config.outputRoot)};
 for(const a of Object.keys(roots))for(const b of Object.keys(roots))if(a!==b)assert(!inside(roots[a],roots[b]),'Input/output roots overlap');
 const identities=Object.fromEntries(Object.entries(roots).map(([k,v])=>{const st=fs.statSync(v);return[k,{dev:st.dev,ino:st.ino}];}));
 function fenceRoots(){for(const [k,v]of Object.entries(roots)){assert.equal(fs.realpathSync(config[k+'Root']),v,'Configured root alias changed');assert.equal(fs.realpathSync(v),v,'Root authority changed');const st=fs.statSync(v);assert.equal(st.dev,identities[k].dev,'Root device changed');assert.equal(st.ino,identities[k].ino,'Root inode changed');}}
 const rows=new Map();for(const r of manifest.files){assert(typeof r.logicalPath==='string'&&!path.isAbsolute(r.logicalPath)&&!r.logicalPath.split('/').includes('..'),'Invalid logical path');assert(!rows.has(r.logicalPath),'Duplicate logical input');assert(['source','tool','reference'].includes(r.owner),'Invalid owner');assert(r.executionAllowed===false||r.owner==='tool','Executable reference/source admission');rows.set(r.logicalPath,r);}
 const canonical=config.canonicalSourcePaths||[];assert(Array.isArray(canonical)&&canonical.length<=1,'Finite canonical source mapping only');
 const mapped=new Map();for(const a of canonical){assert.deepEqual(a,{logicalPath:'stories/Atom/Tag/Tag.scss',physicalPath:'stories/Atom/Tag/tag.scss',owner:'source',bytes:5284,sha256:'d3541ba05d7186b5c0f8d18d12b08f46375e686916c37f587f88c2bd1f7c97f1'},'Unknown canonical source rule');const r=rows.get(a.logicalPath);assert(r&&r.owner==='source'&&r.executionAllowed===false&&r.bytes===a.bytes&&r.sha256===a.sha256,'Canonical source row changed');mapped.set(a.logicalPath,a.physicalPath);}
 function physical(r){return mapped.get(r.logicalPath)||r.logicalPath;}
 const sites=new Map();for(const s of manifest.sites){assert(!sites.has(s.id),'Duplicate site');sites.set(s.id,s);}
 function outputPath(request){fenceRoots();const absolute=path.resolve(request);assert.equal(absolute,path.resolve(config.outputFile),'Output differs from configured operation');assert((inside(absolute,roots.output)||inside(absolute,path.resolve(config.outputRoot)))&&absolute!==roots.output,'Output outside external authority');if(fs.existsSync(absolute))assert(inside(fs.realpathSync(absolute),roots.output),'Output symlink escapes authority');assert.equal(fs.realpathSync(path.dirname(absolute)),roots.output,'Output parent changed');return absolute;}
 function sourceMetadata(){fenceRoots();const revision=execFileSync('git',['rev-parse','HEAD'],{cwd:roots.source}).toString().trim(),workingInputs=execFileSync('git',['status','--porcelain','--untracked-files=all','--','tokens','scripts','stories','examples/figma-plugin'],{cwd:roots.source}).toString();assert.equal(revision,config.sourceRevision,'Source revision changed');assert.equal(workingInputs,config.expectedWorkingInputs,'Source working inputs changed');return{revision,workingInputs};}
 const authority=Object.freeze({sourceRoot:roots.source,toolRoot:roots.tool,referenceRoot:roots.reference,outputRoot:roots.output});
 function logical(request){
  assert(typeof request==='string'||Buffer.isBuffer(request),'Unsupported explicit input path argument');const str=Buffer.isBuffer(request)?request.toString('utf8'):request;const absolute=path.resolve(str);
  for(const owner of ['source','tool','reference'])for(const prefix of [roots[owner],path.resolve(config[owner+'Root'])])if(inside(absolute,prefix))return path.relative(prefix,absolute).split(path.sep).join('/');
  throw Error('Input path outside declared authorities');
 }
 function selected(siteID,request){fenceRoots();const site=sites.get(siteID);assert(site,'Unknown input site');const key=logical(request),r=rows.get(key);assert(r,'Unmapped logical input '+key);assert(site.logicalPaths.includes(key),'Input not admitted at site '+siteID);const file=path.join(roots[r.owner],physical(r)),real=fs.realpathSync(file);assert(inside(real,roots[r.owner]),'Input symlink escapes authority');assert(fs.statSync(real).isFile(),'Input must be regular file');return{site,r,file:real};}
 function readFileSync(siteID,receiver,...args){
  const {r,file}=selected(siteID,args[0]);const result=Reflect.apply(receiver.readFileSync,receiver,[file,...args.slice(1)]);
  const encoding=typeof args[1]==='string'?args[1]:args[1]?.encoding;
  const bytes=Buffer.isBuffer(result)?result:Buffer.from(result,encoding||'utf8');assert.equal(bytes.length,r.bytes,'Input size drift');assert.equal(digest(bytes),r.sha256,'Input byte drift');
  if(!r.bodyMapping)return result;const actual=reconstruct(bytes,r.bodyMapping);return Buffer.isBuffer(result)?actual:actual.toString(encoding||'utf8');
 }
 function sourcePinMatches(logicalPath,bytes,expected){
  fenceRoots();assert(Buffer.isBuffer(bytes),'Authored source bytes required');const r=rows.get(logicalPath);assert(r&&r.owner==='source'&&r.executionAllowed===false&&!r.bodyMapping,'Authored source row required');assert.equal(bytes.length,r.bytes,'Authored current source size drift');assert.equal(digest(bytes),r.sha256,'Authored current source byte drift');
  const expectedHash=typeof expected==='string'?expected:expected?.sha256,expectedBytes=typeof expected==='string'?undefined:expected?.bytes;assert(/^[0-9a-f]{64}$/.test(expectedHash||'')&&(expectedBytes===undefined||Number.isInteger(expectedBytes)),'Authored historical pin shape');
  if(digest(bytes)===expectedHash&&(expectedBytes===undefined||bytes.length===expectedBytes))return true;
  if(config.sourceProfile!=='thin-integration')return false;
  const finite={
   'package.json':[12530,'d68bf61e5d78334ec5ec069cf80c757eb2e292afeda686e6cef63ade20352519',12365,'9e4411c8ec2825ce4628b9df7c7b5f2797df9b6e39ef9c2693c7da1284fc2589'],
   'yarn.lock':[665294,'e1a0d72b1ea55b1534031eeb7f503a3249ceac567814785caabf9755feb919f9',665248,'6ab1441db299c8aa604003743da1e668c9b752b8f07a6833e7b7731f9c3c55f0']
  };const p=finite[logicalPath];return !!p&&expectedHash===p[1]&&(expectedBytes===undefined||expectedBytes===p[0])&&r.bytes===p[2]&&r.sha256===p[3];
 }
 function readOutputSync(siteID,receiver,...args){fenceRoots();assert(sites.get(siteID)?.kind==='output-check','Unknown output read site');return Reflect.apply(receiver.readFileSync,receiver,[outputPath(args[0]),...args.slice(1)]);}
 function inputPath(siteID,request){return selected(siteID,request).file;}
 function modulePath(siteID,request,caller){
  const site=sites.get(siteID);assert(site,'Unknown module site');
  if(!path.isAbsolute(request)&&!request.startsWith('.')){assert(site.packageSpecifiers?.includes(request),'Unadmitted package import');return request;}
  const target=path.isAbsolute(request)?request:path.resolve(path.dirname(caller),request);const {r,file}=selected(siteID,target);assert(r.owner==='tool'&&r.executionAllowed===true,'Only toolkit executable modules can load');assert.equal(digest(fs.readFileSync(file)),r.sha256,'Current module body changed');return file;
 }
 function preflight(){fenceRoots();for(const r of rows.values()){const file=path.join(roots[r.owner],physical(r)),real=fs.realpathSync(file);assert(inside(real,roots[r.owner])&&fs.statSync(real).isFile(),'Preflight input authority');const raw=fs.readFileSync(real);assert.equal(raw.length,r.bytes,'Preflight size drift');assert.equal(digest(raw),r.sha256,'Preflight hash drift');if(r.bodyMapping)reconstruct(raw,r.bodyMapping);}return{files:rows.size,complete:true};}
 function sourceRuntimeRequire(specifier,filename){fenceRoots();assert(config.sourceRuntimeSpecifiers?.includes(specifier),'Undeclared source runtime package');assert(inside(path.resolve(filename),roots.source),'Source runtime owner outside source root');const dependencyRoot=fs.realpathSync(config.sourceDependencyRoot);assert(inside(dependencyRoot,roots.source),'Source dependencies outside source authority');const sourceRequire=createRequire(filename),resolved=sourceRequire.resolve(specifier);assert(inside(fs.realpathSync(resolved),dependencyRoot),'Source runtime package escaped its dependency authority');return sourceRequire(specifier);}
 function requireProducerAuthorization(){fenceRoots();assert.equal(config.exporterExecutionAuthorized,true,'Expanded producer execution is disabled pending reviewed root authorization');verifyConfiguredCache(config,manifest);}
 return Object.freeze({...authority,outputPath,sourceMetadata,readFileSync,sourcePinMatches,readOutputSync,inputPath,modulePath,preflight,requireProducerAuthorization,sourceRuntimeRequire});
}
let active;
function configured(){
 if(active)return active;const file=process.env.MANGROVE_EXPANDED_INPUTS_CONFIG,pin=process.env.MANGROVE_EXPANDED_INPUTS_CONFIG_SHA256;assert(file&&/^[0-9a-f]{64}$/.test(pin||''),'Explicit expanded configuration and checksum required');const raw=fs.readFileSync(file);assert.equal(digest(raw),pin,'Expanded configuration changed');const config=JSON.parse(raw);const manifestRaw=fs.readFileSync(config.manifestPath);assert.equal(digest(manifestRaw),config.manifestSHA256,'Expanded manifest changed');const manifest=JSON.parse(manifestRaw);verifyConfiguredCache(config,manifest);const candidate=createAuthority(config,manifest);assert.equal(fs.realpathSync(process.env.MANGROVE_SOURCE_ROOT),candidate.sourceRoot,'Normal/source root must match explicit expanded authority');candidate.preflight();candidate.sourceMetadata();active=candidate;return active;
}
module.exports={createAuthority,reconstruct,configured};
