const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
const source=fs.readFileSync('overhaul.js','utf8'),scenes=JSON.parse(fs.readFileSync('data/nature-scenes.json','utf8'));
function setup(theme){const values={};let day=1;const ctx={MW:{ensure:s=>s.walkV2},S:{walkV2:{theme}},Date:class extends Date{constructor(...args){super(...(args.length?args:[2026,9,1]));if(!args.length)this.setDate(day);}},document:{documentElement:{dataset:{},style:{setProperty:(k,v)=>values[k]=v}},getElementById:()=>null,querySelectorAll:()=>[]},save:()=>{}};vm.createContext(ctx);vm.runInContext(source.slice(source.indexOf('let mwScenes='),source.indexOf('function mwYesterday')),ctx);vm.runInContext('mwScenes='+JSON.stringify(scenes),ctx);return {ctx,values,setDay:d=>day=d,run:s=>vm.runInContext(s,ctx)};}
test('default System follows assigned colors on all 41 days',()=>{const x=setup();for(let d=1;d<=41;d++){x.setDay(d);x.run('mwSceneStyle()');assert.equal(x.values['--bg'],scenes[d-1].bg);assert.equal(x.values['--accent'],scenes[d-1].accent);}assert.equal(x.ctx.S.walkV2.theme,'system');});
test('seven fixed palettes and returning to System',()=>{const x=setup(),palettes=x.run('mwPalettes');assert.equal(Object.keys(palettes).length,7);for(const [key,p] of Object.entries(palettes)){x.ctx.mwSetColor(key);x.setDay(18);x.run('mwSceneStyle()');assert.equal(x.values['--bg'],p.bg);assert.equal(x.ctx.S.walkV2.theme,key);}x.ctx.mwSetColor('system');assert.equal(x.values['--bg'],scenes[17].bg);});
test('preserves old plum choice; unknown choice defaults to System',()=>{const x=setup('coast');x.run('mwSceneStyle()');assert.equal(x.values['--bg'],'#242333');const y=setup('unknown');y.run('mwSceneStyle()');assert.equal(y.ctx.S.walkV2.theme,'system');});
test('resume across midnight refreshes home once',()=>{const x=setup();let date='2026-10-17',renders=0,refreshes=0,handler;Object.assign(x.ctx,{todayKey:()=>date,WING:'home',renderHome:()=>renders++,mwSceneStyle:()=>refreshes++,setInterval:()=>{},document:{visibilityState:'visible',querySelector:()=>null,addEventListener:(event,fn)=>handler=fn}});x.run(source.slice(source.indexOf('// Refresh daily colors')));handler();assert.equal(renders,0);date='2026-10-18';handler();assert.equal(renders,1);assert.equal(refreshes,1);handler();assert.equal(renders,1);});

test('continuous cycle reaches all assets across month, year, leap day and DST boundaries',()=>{
 const x=setup(),start=new Date(2026,9,1),seen=new Set();
 for(let i=0;i<41;i++){const d=new Date(start);d.setDate(d.getDate()+i);seen.add(x.ctx.mwScene(d).key);}assert.equal(seen.size,41);
 for(const date of ['2026-10-31','2026-12-31','2028-02-28','2028-02-29','2027-03-13','2026-11-01']){const d=new Date(date+'T12:00:00'),next=new Date(d);next.setDate(d.getDate()+1);const a=scenes.findIndex(s=>s.key===x.ctx.mwScene(d).key),b=scenes.findIndex(s=>s.key===x.ctx.mwScene(next).key);assert.equal(b,(a+1)%41);}
});
test('every scene exists and uses a supported palette; ten new scenes are interleaved',()=>{
 const x=setup(),palettes=Object.values(x.run('mwPalettes'));assert.equal(scenes.length,41);
 scenes.forEach((s,i)=>{assert.ok(fs.existsSync(s.image));assert.ok(palettes.some(p=>['bg','card','accent'].every(k=>p[k]===s[k])));if(s.key.startsWith('beach-')||s.key.startsWith('midwest-'))assert.equal((i+1)%4,0);});
});
