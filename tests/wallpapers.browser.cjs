const {chromium}=require('playwright'),assert=require('node:assert/strict');
(async()=>{
const browser=await chromium.launch({headless:true,channel:'chrome'}),context=await browser.newContext({viewport:{width:390,height:844}}),page=await context.newPage(),errors=[];page.on('pageerror',e=>errors.push(e.message));
await page.goto('http://127.0.0.1:8766');await page.waitForFunction(()=>typeof mwScenes!=='undefined'&&mwScenes.length===41&&typeof D!=='undefined'&&D.kjv);
await page.evaluate(()=>openSettings());assert.equal(await page.locator('[data-mw-theme]').count(),8);assert.equal(await page.locator('[data-mw-theme="system"]').getAttribute('aria-pressed'),'true');
for(const key of ['mountain','forest','coast','teal','brown','olive','rose','system']){await page.locator(`[data-mw-theme="${key}"]`).click();assert.equal(await page.locator(`[data-mw-theme="${key}"]`).getAttribute('aria-pressed'),'true');const expected=await page.evaluate(k=>(mwPalettes[k]||mwScene()).bg,key);assert.equal(await page.evaluate(()=>document.documentElement.style.getPropertyValue('--bg')),expected);}
await page.screenshot({path:'validation/wallpaper-settings.png',fullPage:true});
await page.evaluate(()=>document.querySelector('.modal').remove());
await page.waitForFunction(async()=>{const reg=await navigator.serviceWorker.getRegistration();return reg?.active;});
await page.waitForFunction(async()=>{const keys=await caches.keys();const c=await caches.open(keys.find(k=>k==='mywalk-103'));const urls=await c.keys();return urls.filter(u=>u.url.includes('/assets/nature/')).length===41;},null,{timeout:90000});
const loaded=await page.evaluate(async()=>{const results=await Promise.all(mwScenes.map(s=>new Promise(resolve=>{const i=new Image();i.onload=()=>resolve(i.naturalWidth>0);i.onerror=()=>resolve(false);i.src=s.image;})));return results.every(Boolean);});assert.ok(loaded);
await context.setOffline(true);await page.reload();await page.waitForFunction(()=>typeof mwScenes!=='undefined'&&mwScenes.length===41&&D.kjv);
assert.ok(await page.evaluate(async()=>{const all=await Promise.all(mwScenes.map(s=>fetch(s.image).then(r=>r.ok).catch(()=>false)));return all.every(Boolean);}));
assert.deepEqual(errors,[]);console.log('Mobile Settings, all 8 choices, all 41 decoded images, service-worker caching and offline reload passed.');await browser.close();
})().catch(e=>{console.error(e);process.exit(1);});
