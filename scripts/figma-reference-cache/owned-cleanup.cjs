'use strict';
const fs=require('node:fs');const path=require('node:path');
function check(ok,message){if(!ok)throw new Error(message);}
function capture(p){const stat=fs.lstatSync(p);check(!stat.isSymbolicLink()&&(stat.isFile()||stat.isDirectory()),'Owned path type invalid');return {path:p,dev:stat.dev,ino:stat.ino,type:stat.isDirectory()?'directory':'file'};}
function captureHandle(fd,p){const s=fs.fstatSync(fd);check(s.isFile(),'Owned opened handle not ordinary file');return {path:p,dev:s.dev,ino:s.ino,type:'file'};}
function assertIdentity(expected){check(expected,'Owned identity not captured');const now=capture(expected.path);check(now.dev===expected.dev&&now.ino===expected.ino&&now.type===expected.type,'Owned cleanup identity drift: '+expected.path);}
function assertAncestors(p){let cursor=path.parse(p).root;for(const bit of p.slice(cursor.length).split('/').filter(Boolean)){cursor=path.join(cursor,bit);const s=fs.lstatSync(cursor);check(s.isDirectory()&&!s.isSymbolicLink(),'Cleanup ancestor drift');}check(fs.realpathSync(p)===p,'Cleanup realpath drift');}
function assertTree(root,owned){assertIdentity(root);const expected=new Map(owned.filter(e=>e.path===root.path||e.path.startsWith(root.path+path.sep)).map(e=>[e.path,e]));check(expected.has(root.path),'Cleanup root not owned');function visit(p){const e=expected.get(p);check(e,'Unowned cleanup descendant: '+p);assertIdentity(e);expected.delete(p);if(e.type==='directory')for(const n of fs.readdirSync(p))visit(path.join(p,n));}visit(root.path);check(expected.size===0,'Owned cleanup descendant absent');}
function remove(root,owned,finalFence){finalFence();assertAncestors(path.dirname(root.path));assertTree(root,owned);fs.rmSync(root.path,{recursive:true,force:false});}
module.exports={capture,captureHandle,assertIdentity,assertAncestors,assertTree,remove};
