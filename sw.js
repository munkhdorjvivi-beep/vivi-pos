/* VIVI POS — офлайн эхлүүлэх (service worker).
   Өөрийн хуудсууд: эхлээд интернэтээс (4 сек), чадахгүй бол хадгалсан хуулбараас — интернэтгүй үед ч касс нээгдэнэ.
   Firebase, Excel сангууд: хадгалсан хуулбараас. Хувилбар, цаг шалгах хүсэлтийг шууд интернэтээр. */
const CACHE='vivipos-v1';
self.addEventListener('install',()=>self.skipWaiting());
self.addEventListener('activate',e=>e.waitUntil(self.clients.claim()));
const key=req=>{const u=new URL(req.url);return u.origin+u.pathname};
async function netFirst(req){
  const c=await caches.open(CACHE);
  try{
    const ctl=new AbortController(),t=setTimeout(()=>ctl.abort(),4000);
    const r=await fetch(req,{signal:ctl.signal});clearTimeout(t);
    if(r&&r.ok&&r.status===200)c.put(key(req),r.clone());
    return r;
  }catch(e){
    const hit=await c.match(key(req));if(hit)return hit;
    throw e;
  }
}
async function cacheFirst(req){
  const c=await caches.open(CACHE),hit=await c.match(req.url);if(hit)return hit;
  const r=await fetch(req);if(r&&r.ok)c.put(req.url,r.clone());return r;
}
self.addEventListener('fetch',e=>{
  const req=e.request;if(req.method!=='GET'||req.headers.get('range'))return;
  const u=new URL(req.url);
  if(u.origin===self.location.origin){if(/[?&](vc|ct)=/.test(u.search))return;e.respondWith(netFirst(req));return}
  if(/(^|\.)gstatic\.com$|(^|\.)cdnjs\.cloudflare\.com$/.test(u.hostname))e.respondWith(cacheFirst(req));
});
