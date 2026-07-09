/* MY WALK service worker — permanent file.
   Version comes from the registration URL (sw.js?v=N in index.html),
   so updates only ever require editing index.html. */
const V='mywalk-'+(new URL(self.location).searchParams.get('v')||'1');
const SHELL=['./','index.html','icon-180.png','icon-192.png','icon-512.png','icon-152.png','icon-167.png','icon-120.png','data/plan.json','data/hymns.json','data/content.json','data/naves.json','data/kjv.json','data/bios.json','data/strongs.json'];
self.addEventListener('install',e=>{
  e.waitUntil(caches.open(V).then(c=>Promise.all(SHELL.map(u=>c.add(u).catch(()=>{})))).then(()=>self.skipWaiting()));
});
self.addEventListener('activate',e=>{
  e.waitUntil(caches.keys().then(ks=>Promise.all(ks.filter(k=>k!==V).map(k=>caches.delete(k)))).then(()=>self.clients.claim()));
});
self.addEventListener('fetch',e=>{
  if(e.request.method!=='GET') return;
  // Never cache/intercept the backup API — it must always hit the network.
  if(e.request.url.indexOf('api.github.com')>-1 || e.request.url.indexOf('gist.githubusercontent.com')>-1) return;
  e.respondWith(
    caches.match(e.request,{ignoreSearch:e.request.url.includes('sw.js')}).then(hit=>hit||fetch(e.request).then(res=>{
      if(res.ok && (e.request.url.startsWith(self.location.origin)||e.request.url.includes('fonts.g'))){
        const copy=res.clone(); caches.open(V).then(c=>c.put(e.request,copy));
      }
      return res;
    }).catch(()=>caches.match('index.html')))
  );
});
