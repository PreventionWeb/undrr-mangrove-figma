'use strict';
const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto');
const owned=require('./owned-cleanup.cjs');const {parseIndex}=require('./multipart-cache.cjs');
const hash=b=>crypto.createHash('sha256').update(b).digest('hex');
function check(v,m){if(!v)throw new Error(m);}
function bytes(p){const fd=fs.openSync(p,fs.constants.O_RDONLY|fs.constants.O_NOFOLLOW);try{const s=fs.fstatSync(fd);check(s.isFile()&&s.uid===process.getuid()&&(s.mode&0o077)===0,'Private ordinary file required');return fs.readFileSync(fd);}finally{fs.closeSync(fd);}}
function snapshot(root){const out=[];function walk(p){const e=owned.capture(p),s=fs.lstatSync(p);check(s.uid===process.getuid()&&(s.mode&0o077)===0,'Private cache owner/mode');if(e.type==='file')Object.assign(e,{bytes:s.size,sha256:hash(bytes(p))});out.push(e);if(e.type==='directory')for(const n of fs.readdirSync(p).sort())walk(path.join(p,n));}owned.assertAncestors(root);walk(root);return out;}
function verifyCommittedCache(receiptBytes,receiptSHA256,indexBytes,indexSHA256){
 check(Buffer.isBuffer(receiptBytes)&&receiptBytes.length<=4*1024*1024&&hash(receiptBytes)===receiptSHA256,'Operation receipt checksum/size');const r=JSON.parse(new TextDecoder('utf-8',{fatal:true}).decode(receiptBytes));
 check(r.version===1&&r.ok===true&&r.admitted===true&&r.indexSHA256===indexSHA256,'Successful exact operation receipt required');const p=parseIndex(indexBytes,indexSHA256);
 check(r.referenceRoot===path.join(r.cacheRoot,'reference-bundle-'+indexSHA256,'files'),'Reference root relation');
 check(r.initialAuthorityFacts&&JSON.stringify(r.initialAuthorityFacts.protectedIdentities)===JSON.stringify(r.protectedIdentities)&&JSON.stringify(r.initialAuthorityFacts.cacheParentIdentity)===JSON.stringify(r.cacheParentIdentity),'Receipt initial authority facts mismatch');
 check(Array.isArray(r.protectedIdentities)&&r.protectedIdentities.length>=2,'Protected roots absent');for(const e of [...r.protectedIdentities,r.cacheParentIdentity]){owned.assertAncestors(e.path);owned.assertIdentity(e);check(e.type==='directory','Protected root type');check(!(r.cacheRoot===e.path||r.cacheRoot.startsWith(e.path+'/'))||e===r.cacheParentIdentity,'Cache inside protected root');}
 check(r.cacheRoot.startsWith(r.cacheParentIdentity.path+'/.mangrove-reference-cache-'),'Minted cache path relation');owned.assertAncestors(r.cacheRoot);owned.assertTree(r.tree[0],r.tree);check(JSON.stringify(snapshot(r.cacheRoot))===JSON.stringify(r.tree),'Committed whole cache identity/bytes/tree drift');
 const authority=JSON.parse(bytes(path.join(r.cacheRoot,'.reference-authority.json')));check(authority.root===r.cacheRoot&&authority.destinationConfigSHA256===r.destinationConfigSHA256&&JSON.stringify(authority.protectedRoots)===JSON.stringify(r.protectedIdentities.map(e=>e.path)),'Authority marker context');
 const marker=JSON.parse(bytes(path.join(path.dirname(r.referenceRoot),'admitted.json')));const expected={version:1,indexSHA256,memberSetSHA256:p.index.memberSetSHA256,sourceRevision:p.index.sourceRevision,toolRevision:p.index.toolRevision,members:p.records.length,partManifestSHA256:p.manifests.map(x=>x.pin)};
 check(JSON.stringify(marker)===JSON.stringify(expected),'Whole committed marker mismatch');
 const expectedFiles=new Set(p.records.map(e=>path.join(r.referenceRoot,e.path)));const actualFiles=r.tree.filter(e=>e.type==='file'&&e.path.startsWith(r.referenceRoot+'/'));check(actualFiles.length===expectedFiles.size&&actualFiles.every(e=>expectedFiles.has(e.path)),'Exact whole member tree required');for(const e of p.records){const got=bytes(path.join(r.referenceRoot,e.path));check(got.length===e.bytes&&hash(got)===e.sha256,'Committed member checksum: '+e.path);}
 // No await occurs between this final identity/content verification and return.
 check(JSON.stringify(snapshot(r.cacheRoot))===JSON.stringify(r.tree),'Final committed cache drift');for(const e of [...r.protectedIdentities,r.cacheParentIdentity])owned.assertIdentity(e);
 return Object.freeze({version:1,readOnly:true,indexSHA256,operationReceiptSHA256:receiptSHA256,referenceRoot:r.referenceRoot,memberSetSHA256:p.index.memberSetSHA256,members:p.records.length,parts:p.manifests.length,executionAllowed:false});
}
module.exports={verifyCommittedCache,snapshot};
