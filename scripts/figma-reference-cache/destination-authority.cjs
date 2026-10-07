'use strict';
const fs=require('node:fs');const path=require('node:path');const crypto=require('node:crypto');
const owned=require('./owned-cleanup.cjs');const fsp=fs.promises;const contexts=new WeakMap();const digest=b=>crypto.createHash('sha256').update(b).digest('hex');
function check(ok,message){if(!ok)throw new Error(message);}
function shape(v,names){check(v&&typeof v==='object'&&!Array.isArray(v)&&Object.keys(v).sort().join('|')===names.sort().join('|'),'Invalid destination-authority schema');}
async function realDirectory(p){
 check(typeof p==='string'&&path.isAbsolute(p)&&path.resolve(p)===p,'Root must be canonical absolute path');
 let cursor=path.parse(p).root;for(const bit of p.slice(cursor.length).split('/').filter(Boolean)){cursor=path.join(cursor,bit);const stat=await fsp.lstat(cursor);check(stat.isDirectory()&&!stat.isSymbolicLink(),'Root/ancestor symlink or non-directory');}
 const s=await fsp.lstat(p);check((await fsp.realpath(p))===p,'Root realpath mismatch');return {path:p,dev:s.dev,ino:s.ino};
}
function overlaps(a,b){return a===b||a.startsWith(b+path.sep)||b.startsWith(a+path.sep);}
function inside(a,b){return a===b||a.startsWith(b+path.sep);}
function verifyContextSync(c, requireMarker=true){
 check(c,'Unminted/foreign cache authority');for(const p of [...c.protected,c.parent]){owned.assertAncestors(p.path);owned.assertIdentity({...p,type:'directory'});check(!overlaps(c.root,p.path)||p===c.parent,'Cache/protected-root overlap');}
 owned.assertAncestors(c.root);owned.assertIdentity(c.identity);const stat=fs.lstatSync(c.root);check(stat.uid===process.getuid()&&(stat.mode&0o077)===0,'Owned cache permissions/owner drift');
 if(requireMarker){check(c.markerIdentity,'Marker identity not captured');owned.assertIdentity(c.markerIdentity);const m=fs.lstatSync(c.markerIdentity.path);check(m.uid===process.getuid()&&(m.mode&0o077)===0&&m.size===c.marker.length,'Authority marker type/ownership/size drift');const fd=fs.openSync(c.markerIdentity.path,fs.constants.O_RDONLY|fs.constants.O_NOFOLLOW);try{const f=fs.fstatSync(fd);check(f.dev===c.markerIdentity.dev&&f.ino===c.markerIdentity.ino,'Authority opened marker drift');check(fs.readFileSync(fd).equals(c.marker),'Authority marker drift');}finally{fs.closeSync(fd);}}
}
function verifyAuthoritySync(authority){const c=contexts.get(authority);verifyContextSync(c);return c.root;}
async function verifyAuthority(authority){
 const c=contexts.get(authority);check(c,'Unminted/foreign cache authority');
 for(const p of c.protected){const now=await realDirectory(p.path);check(now.dev===p.dev&&now.ino===p.ino,'Protected root identity drift');check(!overlaps(c.root,p.path),'Cache/protected-root overlap');}
 const parent=await realDirectory(c.parent.path);check(parent.dev===c.parent.dev&&parent.ino===c.parent.ino,'Cache-parent identity drift');
 const root=await realDirectory(c.root);check(root.dev===c.identity.dev&&root.ino===c.identity.ino,'Owned cache identity drift');
 const s=await fsp.lstat(c.root);check(s.uid===process.getuid()&&(s.mode&0o077)===0,'Owned cache permissions/owner drift');
 const marker=path.join(c.root,'.reference-authority.json');const stat=await fsp.lstat(marker);check(stat.isFile()&&!stat.isSymbolicLink()&&stat.uid===process.getuid()&&(stat.mode&0o077)===0,'Authority marker type/ownership drift');
 const h=await fsp.open(marker,fs.constants.O_RDONLY|fs.constants.O_NOFOLLOW);let bytes;try{bytes=await h.readFile();}finally{await h.close();}
 check(bytes.equals(c.marker),'Authority marker drift');verifyContextSync(c);return c.root;
}
async function createAuthority(configBytes,reviewedSHA256){
 const journal={attemptedPaths:[],createdPaths:[],cleanupErrors:[]};let root,context;const ownership=[];
 try{
 check(Buffer.isBuffer(configBytes)&&configBytes.length<=65536&&/^[a-f0-9]{64}$/.test(reviewedSHA256)&&digest(configBytes)===reviewedSHA256,'Destination config checksum/size mismatch');
 const text=new TextDecoder('utf-8',{fatal:true}).decode(configBytes);const config=JSON.parse(text);check(Buffer.from(JSON.stringify(config)).equals(configBytes),'Destination config not canonical JSON');
 shape(config,['version','sourceRoot','toolRoot','outputRoots','cacheParent']);check(config.version===1&&Array.isArray(config.outputRoots)&&config.outputRoots.length<=32&&new Set(config.outputRoots).size===config.outputRoots.length,'Destination config version/output roots');
 const protectedRoots=[];for(const p of [config.sourceRoot,config.toolRoot,...config.outputRoots])protectedRoots.push(await realDirectory(p));
 const parent=await realDirectory(config.cacheParent);for(const p of protectedRoots)check(!inside(parent.path,p.path),'Cache parent is inside protected source/tool/output root');
 journal.attemptedPaths.push(path.join(parent.path,'.mangrove-reference-cache-*'));root=await fsp.mkdtemp(path.join(parent.path,'.mangrove-reference-cache-'));journal.createdPaths.push(root);const minted=owned.capture(root);ownership.push(minted);context={root,parent,identity:minted,protected:protectedRoots};await fsp.chmod(root,0o700);verifyContextSync(context,false);
 for(const p of protectedRoots)check(!overlaps(root,p.path),'Created cache overlaps protected root');
 const identity=context.identity;const nonce=crypto.randomBytes(32).toString('hex');const marker=Buffer.from(JSON.stringify({version:1,destinationConfigSHA256:reviewedSHA256,nonce,root,protectedRoots:protectedRoots.map(p=>p.path)}));
 const markerPath=path.join(root,'.reference-authority.json');journal.attemptedPaths.push(markerPath);const handle=await fsp.open(markerPath,fs.constants.O_WRONLY|fs.constants.O_CREAT|fs.constants.O_EXCL|fs.constants.O_NOFOLLOW,0o600);journal.createdPaths.push(markerPath);const markerIdentity=owned.captureHandle(handle.fd,markerPath);ownership.push(markerIdentity);Object.assign(context,{marker,markerIdentity});try{await handle.writeFile(marker);await handle.sync();}finally{await handle.close();}
 const authority=Object.freeze({version:1,cacheRoot:root,destinationConfigSHA256:reviewedSHA256});contexts.set(authority,context);await verifyAuthority(authority);
 return {ok:true,authority,journal};
 }catch(error){if(root)try{check(context,'Cleanup minted-root context absent');owned.remove(context.identity,ownership,()=>verifyContextSync(context,Boolean(context.markerIdentity)));}catch(clean){journal.cleanupErrors.push({path:root,error:clean.message});}return {ok:false,error:error.message,journal};}
}
module.exports={createAuthority,verifyAuthority,verifyAuthoritySync};
