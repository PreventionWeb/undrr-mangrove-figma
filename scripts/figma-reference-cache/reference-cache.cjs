'use strict';
const fs = require('node:fs');
const path = require('node:path');
const https = require('node:https');
const zlib = require('node:zlib');
const crypto = require('node:crypto');
const { TextDecoder } = require('node:util');
const {verifyAuthority,verifyAuthoritySync}=require('./destination-authority.cjs');const ownedCleanup=require('./owned-cleanup.cjs');
const fsp = fs.promises;
const SHA = /^[a-f0-9]{64}$/;
const MAX = 64 * 1024 * 1024; // Prototype bound; actual closure admission remains separate.
const utf8 = new TextDecoder('utf-8', { fatal: true });
const digest = b => crypto.createHash('sha256').update(b).digest('hex');
function requireThat(test, message) { if (!test) throw new Error(message); }
function keys(v, expected) {
  requireThat(v && typeof v === 'object' && !Array.isArray(v), 'Expected object');
  requireThat(Object.keys(v).sort().join('|') === expected.slice().sort().join('|'), 'Unexpected/missing schema fields');
}
function integer(v, max = MAX) { requireThat(Number.isSafeInteger(v) && v >= 0 && v <= max, 'Invalid bounded integer'); }
function memberPath(p) {
  requireThat(typeof p === 'string' && p.length > 0 && Buffer.byteLength(p) <= 255 && p.normalize('NFC') === p, 'Noncanonical path');
  requireThat(!/[\\\x00-\x1f\x7f:]/.test(p) && !p.startsWith('/') && !p.endsWith('/'), 'Unsafe path');
  for (const part of p.split('/')) {
    requireThat(part && part !== '.' && part !== '..' && !/[. ]$/.test(part) && !/^(con|prn|aux|nul|com[1-9]|lpt[1-9])(?:\.|$)/i.test(part), 'Unsafe path segment');
  }
  return p;
}
function checkedURL(raw, hosts) {
  const u = new URL(raw);
  requireThat(u.protocol === 'https:' && !u.username && !u.password && !u.hash && !u.port && hosts.includes(u.hostname), 'Unapproved HTTPS URL');
  return u;
}
function parseManifest(bytes, pin) {
  requireThat(Buffer.isBuffer(bytes) && bytes.length <= 1024 * 1024 && SHA.test(pin) && digest(bytes) === pin, 'Manifest checksum/size mismatch');
  const m = JSON.parse(utf8.decode(bytes));
  // Canonical JSON prevents duplicate-key and alternate representation ambiguity.
  requireThat(Buffer.from(JSON.stringify(m)).equals(bytes), 'Manifest must be canonical JSON');
  keys(m, ['version', 'sourceRevision', 'toolRevision', 'archive', 'members']);
  requireThat(m.version === 1 && /^[a-f0-9]{40}$/.test(m.sourceRevision) && /^[a-f0-9]{40}$/.test(m.toolRevision), 'Invalid version/revisions');
  keys(m.archive, ['url', 'allowedHosts', 'bytes', 'sha256', 'tarBytes']);
  requireThat(Array.isArray(m.archive.allowedHosts) && m.archive.allowedHosts.length > 0 && m.archive.allowedHosts.length <= 8 && new Set(m.archive.allowedHosts).size === m.archive.allowedHosts.length && m.archive.allowedHosts.every(h => typeof h === 'string' && /^[a-z0-9.-]+$/.test(h)), 'Invalid approved hosts');
  checkedURL(m.archive.url, m.archive.allowedHosts);
  integer(m.archive.bytes); integer(m.archive.tarBytes); requireThat(m.archive.bytes > 0 && m.archive.tarBytes >= 1024 && SHA.test(m.archive.sha256), 'Invalid archive bounds/hash');
  requireThat(Array.isArray(m.members) && m.members.length > 0 && m.members.length <= 10000, 'Invalid member count');
  const names = new Set();
  for (const entry of m.members) {
    keys(entry, ['path', 'bytes', 'sha256', 'provenance', 'licenseReference']);
    memberPath(entry.path); integer(entry.bytes); requireThat(SHA.test(entry.sha256), 'Invalid member hash');
    requireThat(typeof entry.provenance === 'string' && entry.provenance.length > 0 && entry.provenance.length <= 4096 && typeof entry.licenseReference === 'string' && entry.licenseReference.length > 0 && entry.licenseReference.length <= 4096, 'Missing bounded provenance/license reference');
    const key = entry.path.toLowerCase(); requireThat(!names.has(key), 'Duplicate/case-colliding manifest path'); names.add(key);
  }
  for (const e of m.members) for (const other of m.members) requireThat(!other.path.toLowerCase().startsWith(e.path.toLowerCase() + '/'), 'File/directory manifest collision');
  requireThat(m.members.reduce((n,e) => n + e.bytes, 0) <= m.archive.tarBytes, 'Impossible member byte budget');
  return m;
}
function cstring(b) {
  const end = b.indexOf(0); const n = end < 0 ? b.length : end;
  requireThat(end < 0 || b.subarray(end).every(v => v === 0), 'Nonzero string padding');
  return utf8.decode(b.subarray(0,n));
}
function octal(b) {
  const s = b.toString('ascii'); requireThat(/^[ 0]*[0-7]+[\0 ]*$/.test(s), 'Unsupported tar numeric encoding');
  const n = Number.parseInt(s.replace(/[\0 ]+$/,'').trim(),8); integer(n, Number.MAX_SAFE_INTEGER); return n;
}
function unpack(archive, m) {
  requireThat(Buffer.isBuffer(archive) && archive.length === m.archive.bytes && digest(archive) === m.archive.sha256, 'Archive checksum/size mismatch');
  const tar = zlib.gunzipSync(archive, { maxOutputLength: m.archive.tarBytes });
  requireThat(tar.length === m.archive.tarBytes && tar.length % 512 === 0, 'Tar exact size/block mismatch');
  const expected = new Map(m.members.map(e => [e.path,e])); const seen = new Set(); const directories = new Set(); const output = [];
  const allowedDirs = new Set(); for (const e of m.members) { const bits=e.path.split('/'); bits.pop(); while(bits.length) {allowedDirs.add(bits.join('/'));bits.pop();} }
  let pos = 0, ended = false;
  while (pos < tar.length) {
    const h=tar.subarray(pos,pos+512); pos+=512;
    if (h.every(v=>v===0)) { requireThat(tar.length-pos>=512 && tar.subarray(pos).every(v=>v===0), 'Invalid tar end blocks'); ended=true; break; }
    let sum=0; for(let i=0;i<512;i++) sum += i>=148&&i<156 ? 32 : h[i]; requireThat(octal(h.subarray(148,156))===sum, 'Tar header checksum mismatch');
    requireThat(h.subarray(257,263).equals(Buffer.from('ustar\0')) && h.subarray(263,265).equals(Buffer.from('00')), 'Only POSIX USTAR accepted');
    const type=h[156]; requireThat(type===0 || type===48 || type===53, 'Links/extended/special tar members refused');
    requireThat(cstring(h.subarray(157,257))==='', 'Link target refused');
    const mode=octal(h.subarray(100,108)); requireThat((mode & 0o7000)===0 && (type===53 || (mode & 0o111)===0), 'Executable/privileged mode refused');
    octal(h.subarray(108,116));octal(h.subarray(116,124));octal(h.subarray(136,148));
    const prefix=cstring(h.subarray(345,500)); let name=(prefix?prefix+'/':'')+cstring(h.subarray(0,100));
    if(type===53 && name.endsWith('/')) name=name.slice(0,-1); memberPath(name);
    const low=name.toLowerCase(); requireThat(!seen.has(low), 'Duplicate/case-colliding archive path'); seen.add(low);
    const size=octal(h.subarray(124,136)); requireThat(pos+size<=tar.length, 'Truncated member');
    if(type===53) {requireThat(size===0 && allowedDirs.has(name), 'Unexpected directory'); directories.add(name);}
    else { const e=expected.get(name); requireThat(e && size===e.bytes, 'Unexpected/member size mismatch'); const bytes=tar.subarray(pos,pos+size);requireThat(digest(bytes)===e.sha256,'Member checksum mismatch');output.push({entry:e,bytes});expected.delete(name); }
    const padded=Math.ceil(size/512)*512; requireThat(pos+padded<=tar.length && tar.subarray(pos+size,pos+padded).every(v=>v===0),'Invalid member padding');pos+=padded;
  }
  requireThat(ended && expected.size===0,'Missing member/end marker'); return output;
}
async function ancestors(parent) {
  requireThat(path.isAbsolute(parent) && path.resolve(parent)===parent, 'Cache parent must be canonical absolute path');
  let p=path.parse(parent).root;
  for (const segment of parent.slice(p.length).split('/').filter(Boolean)) {p=path.join(p,segment);const s=await fsp.lstat(p); requireThat(s.isDirectory()&&!s.isSymbolicLink(),'Cache ancestor not a real directory');}
}
async function download(m) {
  return new Promise((resolve,reject)=> {
    let current; const deadline=setTimeout(()=>{ if(current)current.destroy(new Error('Total download deadline')); fail(new Error('Total download deadline')); },60000);
    const fail=error=>{clearTimeout(deadline);reject(error);}; const finish=value=>{clearTimeout(deadline);resolve(value);};
    function request(raw, redirects) {
      let u;try {u=checkedURL(raw,m.archive.allowedHosts);}catch(e){fail(e);return;}
      const req=current=https.get(u,{headers:{'Accept':'application/octet-stream','Accept-Encoding':'identity'}},res=> {
        if ([301,302,303,307,308].includes(res.statusCode)) {res.resume();if(redirects>=4 || !res.headers.location){fail(new Error('Redirect bound/location'));return;}try {request(new URL(res.headers.location,u).href,redirects+1);} catch(error) {fail(new Error('Invalid redirect URL'));} return;}
        if(res.statusCode!==200 || (res.headers['content-encoding']&&res.headers['content-encoding']!=='identity')) {res.resume();fail(new Error('HTTP status/content encoding refused'));return;}
        if(res.headers['content-length'] && res.headers['content-length']!==String(m.archive.bytes)){res.resume();fail(new Error('HTTP length mismatch'));return;}
        const chunks=[];let count=0;
        res.on('data',b=>{count+=b.length;if(count>m.archive.bytes){res.destroy(new Error('Download byte overflow'));return;}chunks.push(b);});
        res.on('error',()=>fail(new Error('HTTP response failed')));res.on('aborted',()=>fail(new Error('HTTP response aborted')));res.on('end',()=>{if(count!==m.archive.bytes)fail(new Error('Download truncated'));else finish(Buffer.concat(chunks,count));});
      });
      req.setTimeout(30000,()=>req.destroy(new Error('Download timeout')));req.on('error',()=>fail(new Error('HTTPS request failed')));
    }
    request(m.archive.url,0);
  });
}
async function admit(manifestBytes, manifestSHA256, archive, authority) {
  const journal={attemptedPaths:[],createdPaths:[],cleanupErrors:[]}; let stage, reservation,stageIdentity,reservationIdentity;const ownership=[];let admitted=false;function locations(){verifyAuthoritySync(authority);for(const identity of [stageIdentity,reservationIdentity].filter(Boolean))ownedCleanup.assertTree(identity,ownership);}
  try {
    const cacheParent=await verifyAuthority(authority);locations();locations(); const m=parseManifest(manifestBytes,manifestSHA256); const members=unpack(archive,m); await ancestors(cacheParent); await verifyAuthority(authority);locations();
    await verifyAuthority(authority);locations(); stage=await fsp.mkdtemp(path.join(cacheParent,'.reference-stage-'));journal.createdPaths.push(stage);stageIdentity=ownedCleanup.capture(stage);ownership.push(stageIdentity);await fsp.chmod(stage,0o700);locations();
    for(const {entry,bytes} of members) {
      await verifyAuthority(authority);locations(); const target=path.join(stage,entry.path); const relative=path.relative(stage,target);requireThat(relative && !relative.startsWith('..')&&!path.isAbsolute(relative),'Extraction escaped stage');
      let dir=stage; for (const segment of entry.path.split('/').slice(0,-1)) { dir=path.join(dir,segment); try { const stat=await fsp.lstat(dir); requireThat(stat.isDirectory()&&!stat.isSymbolicLink(),'Staged parent not directory'); } catch (error) { if(error.code!=='ENOENT')throw error; journal.attemptedPaths.push(dir); await verifyAuthority(authority);locations(); await fsp.mkdir(dir,{mode:0o700});journal.createdPaths.push(dir);ownership.push(ownedCleanup.capture(dir)); } } journal.attemptedPaths.push(target);
      await verifyAuthority(authority);locations(); const handle=await fsp.open(target,fs.constants.O_WRONLY|fs.constants.O_CREAT|fs.constants.O_EXCL|fs.constants.O_NOFOLLOW,0o600);journal.createdPaths.push(target);ownership.push(ownedCleanup.captureHandle(handle.fd,target));
      try{await verifyAuthority(authority);locations(); await handle.writeFile(bytes);await handle.sync();}finally{await handle.close();}locations();
      requireThat(digest(await fsp.readFile(target))===entry.sha256,'Staged readback mismatch');await verifyAuthority(authority);locations();
    }
    const dest=path.join(cacheParent,'reference-'+manifestSHA256);journal.attemptedPaths.push(dest);
    await verifyAuthority(authority);locations(); await fsp.mkdir(dest,{mode:0o700});reservation=dest;journal.createdPaths.push(dest);reservationIdentity=ownedCleanup.capture(dest);ownership.push(reservationIdentity); // Exclusive reservation; never replaces existing cache.
    const content=path.join(dest,'files');await verifyAuthority(authority);locations(); const oldStage=stage;await fsp.rename(stage,content);for(const e of ownership)if(e.path===oldStage||e.path.startsWith(oldStage+path.sep))e.path=content+e.path.slice(oldStage.length);stage=undefined;stageIdentity=undefined;journal.createdPaths.push(content);
    const marker=path.join(dest,'.admission-pending');const final=path.join(dest,'admitted.json');
    await verifyAuthority(authority);locations(); await fsp.writeFile(marker,JSON.stringify({version:1,manifestSHA256,archiveSHA256:m.archive.sha256,members:m.members.length,sourceRevision:m.sourceRevision,toolRevision:m.toolRevision}),{flag:'wx',mode:0o600});journal.createdPaths.push(marker);ownership.push(ownedCleanup.capture(marker));
    await verifyAuthority(authority);locations(); await fsp.rename(marker,final);for(const e of ownership)if(e.path===marker)e.path=final;admitted=true;journal.createdPaths.push(final);
    await verifyAuthority(authority);locations(); return {ok:true,admitted:true,cacheRoot:dest,referenceRoot:content,manifestSHA256,journal};
  }catch(e){
    if(!admitted) for(const identity of [stageIdentity,reservationIdentity].filter(Boolean))try{await verifyAuthority(authority);locations();ownedCleanup.remove(identity,ownership,()=>verifyAuthoritySync(authority));}catch(clean){journal.cleanupErrors.push({path:identity.path,error:clean.message});}
    return {ok:false,admitted,error:e.message,manifestSHA256,journal};
  }
}
async function retrieve(manifestBytes,pin,authority) {
  try { await verifyAuthority(authority);const m=parseManifest(manifestBytes,pin);const archive=await download(m);await verifyAuthority(authority);return await admit(manifestBytes,pin,archive,authority); }
  catch(e){return {ok:false,admitted:false,error:e.message,manifestSHA256:pin,journal:{attemptedPaths:[],createdPaths:[],cleanupErrors:[]}};}
}
module.exports={retrieve,admit,parseManifest,unpack};
