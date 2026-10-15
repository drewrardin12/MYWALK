/* MY WALK service worker — permanent file.
   Version comes from the registration URL (sw.js?v=N in index.html),
   so updates only ever require editing index.html. */
const V='mywalk-'+(new URL(self.location).searchParams.get('v')||'1');
const SHELL=['./','index.html','sync-config.js?v=2','sync-merge.js?v=1','cloud-sync.js?v=9','vendor/supabase.js','icon-180.png','icon-192.png','icon-512.png','icon-152.png','icon-167.png','icon-120.png','overhaul.css?v=27','assets/fonts/rock-salt-original.ttf','assets/fonts/my-handwriting.ttf','sheet-gesture.js?v=1','walk-model.js?v=5','overhaul.js?v=21','data/schedule.json','data/optional-readings.json','data/bible-images.json','data/nature-scenes.json','data/home-scripture.json','data/legacy-plan.json','data/plan.json','data/hymns.json','data/content.json','data/naves.json','data/kjv.json','data/bios.json','data/strongs.json'];

self.addEventListener('install',e=>{
  e.waitUntil(caches.open(V).then(c=>Promise.all(SHELL.map(u=>c.add(u).catch(()=>{})))).then(()=>self.skipWaiting()));
});
self.addEventListener('activate',e=>{
  e.waitUntil(caches.keys().then(ks=>Promise.all(ks.filter(k=>k!==V).map(k=>caches.delete(k)))).then(()=>self.clients.claim()));
});

// Is this a request for the app shell (the HTML itself)?
function isShellDoc(req){
  if(req.mode==='navigate') return true;
  const u=new URL(req.url);
  return u.origin===self.location.origin && (u.pathname.endsWith('/')||u.pathname.endsWith('/index.html'));
}

self.addEventListener('fetch',e=>{
  const req=e.request;
  if(req.method!=='GET') return;
  if(new URL(req.url).origin!==self.location.origin && !req.url.includes('fonts.g')) return;
  // Never cache/intercept the backup API — it must always hit the network.
  if(req.url.indexOf('api.github.com')>-1 || req.url.indexOf('gist.githubusercontent.com')>-1) return;

  // NETWORK-FIRST for index.html so a new build is always picked up immediately.
  // Falls back to cache when offline, so the app still opens on a plane.
  if(isShellDoc(req)){
    e.respondWith(
      fetch(req,{cache:'no-store'}).then(res=>{
        if(res && res.ok){ const copy=res.clone(); caches.open(V).then(c=>c.put('index.html',copy)); }
        return res;
      }).catch(()=>caches.match('index.html').then(hit=>hit||caches.match('./')))
    );
    return;
  }

  // CACHE-FIRST for everything else (bible data, icons, fonts) — big and stable.
  e.respondWith(
    caches.match(req,{ignoreSearch:req.url.includes('sw.js')}).then(hit=>hit||fetch(req).then(res=>{
      if(res.ok && (req.url.startsWith(self.location.origin)||req.url.includes('fonts.g'))){
        const copy=res.clone(); caches.open(V).then(c=>c.put(req,copy));
      }
      return res;
    }).catch(()=>Response.error()))
  );
});

// Let the page tell us to activate a waiting worker immediately.
self.addEventListener('message',e=>{ if(e.data==='skipWaiting') self.skipWaiting(); });
// Generated category images are small; cache them for offline study.
self.addEventListener('install',e=>{e.waitUntil(caches.open(V).then(c=>Promise.all(['doctrine','people','topics','questions'].flatMap(k=>['champagne','ice-blue','teal','plum'].map(v=>'assets/study/'+k+'-'+v+'.webp')).concat(['assets/prayer-water.jpg']).map(u=>c.add(u).catch(()=>{})))));});
