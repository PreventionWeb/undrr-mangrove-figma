'use strict';
const nativeHTTPS=require('node:https'),crypto=require('node:crypto');
const digest=b=>crypto.createHash('sha256').update(b).digest('hex');
function requireThat(v,m){if(!v)throw new Error(m);}
function createProvider(parsedIndex,observations){
 requireThat(Array.isArray(parsedIndex.manifests)&&Array.isArray(observations),'Reviewed parsed index and observation journal required');
 const byPin=new Map(parsedIndex.manifests.map(entry=>[entry.pin,JSON.parse(JSON.stringify(entry.manifest))]));
 requireThat(byPin.size===parsedIndex.manifests.length,'Duplicate part pin');
 const https=Object.freeze({get(url,options,callback){
  const entry={host:url.hostname,path:url.pathname,status:null};observations.push(entry);
  return nativeHTTPS.get(url,options,response=>{entry.status=response.statusCode;callback(response);});
 }});
function checkedURL(raw, hosts) {
  const u = new URL(raw);
  requireThat(u.protocol === 'https:' && !u.username && !u.password && !u.hash && !u.port && hosts.includes(u.hostname), 'Unapproved HTTPS URL');
  return u;
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

 return async descriptor=>{
  const manifest=byPin.get(descriptor.manifestSHA256);requireThat(manifest,'Unknown multipart descriptor');
  requireThat(manifest.archive.bytes<=64*1024*1024&&manifest.archive.bytes>0,'Bounded reviewed part required');
  const bytes=await download(manifest);
  requireThat(bytes.length===manifest.archive.bytes&&digest(bytes)===manifest.archive.sha256,'Downloaded part checksum mismatch');
  observations.push({manifestSHA256:descriptor.manifestSHA256,bytes:bytes.length,sha256:digest(bytes)});return bytes;
 };
}
module.exports={createProvider};
