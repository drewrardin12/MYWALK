const V='mywalk-v1';
const SHELL=['./','index.html','data/plan.json','data/hymns.json','data/content.json','data/naves.json','data/kjv.json','data/bios.json','data/strongs.json'];
self.addEventListener('install',e=>{
  e.waitUntil(caches.open(V).then(c=>c.addAll(SHELL)).then(()=>self.skipWaiting()));
});
self.addEventListener('activate',e=>{
  e.waitUntil(caches.keys().then(ks=>Promise.all(ks.filter(k=>k!==V).map(k=>caches.delete(k)))).then(()=>self.clients.claim()));
});
self.addEventListener('fetch',e=>{
  if(e.request.method!=='GET') return;
  e.respondWith(
    caches.match(e.request).then(hit=>hit||fetch(e.request).then(res=>{
      if(res.ok && (e.request.url.startsWith(self.location.origin)||e.request.url.includes('fonts.g'))){
        const copy=res.clone(); caches.open(V).then(c=>c.put(e.request,copy));
      }
      return res;
    }).catch(()=>caches.match('index.html')))
  );
});
