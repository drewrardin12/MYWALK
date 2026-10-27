const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');
const merge=fs.readFileSync('sync-merge.js','utf8');
const code=fs.readFileSync('cloud-sync.js','utf8');
function setup({local,remote,base,offline=false,race=false,accountSetup=false,canRefresh=()=>true,normalize}){
  const storage=new Map(base?[['mywalk_cloud_v1',JSON.stringify({owner:'one',base})]]:[]);
  let writes=0, revision=remote?1:0, value=local; const panels=[]; let refreshes=0; const intervals=[],listeners={},windowListeners={};
  const context={console,JSON,Set,Blob,URL,navigator:{onLine:!offline},location:{search:accountSetup?'?account=setup':'',reload(){}},
    localStorage:{getItem:k=>storage.get(k)||null,setItem:(k,v)=>storage.set(k,v)},
    document:{visibilityState:'visible',getElementById:()=>null,querySelector:()=>null,querySelectorAll:()=>[],addEventListener:(name,fn)=>listeners[name]=fn},
    setTimeout:()=>1,clearTimeout(){},setInterval:fn=>intervals.push(fn),addEventListener:(name,fn)=>windowListeners[name]=fn,
    MYWALK_SYNC_CONFIG:{url:'https://test.supabase.co',publishableKey:'public'},
    supabase:{createClient:()=>({auth:{onAuthStateChange(){},getSession:async()=>({data:{session:{user:{id:'one'}}}})},
      from:()=>({select:()=>({eq:()=>({maybeSingle:async()=>({data:remote?{data:remote,revision}:null})})})}),
      rpc:async(name,args)=>{writes++;if(race&&writes===1){remote={...remote,other:'new remote edit'};revision++;return {data:null};}assert.equal(args.expected_revision,revision);remote=args.new_data;return {data:++revision};}})} };
  context.window=context;vm.createContext(context);vm.runInContext(merge,context);vm.runInContext(code,context);
  const cloud=context.MyWalkCloud({storageKey:'state',snapshot:()=>value,normalize,apply:d=>value=d,canRefresh,refresh(){refreshes++;},escape:x=>x,modal:html=>{panels.push(html);return {dataset:{},isConnected:true,remove(){this.isConnected=false;}};}});
  return {cloud,storage,panels,storage:windowListeners.storage,tick:()=>intervals[0](),click:()=>listeners.click(),state:()=>({writes,remote,value,refreshes})};
}
test('different reading days merge without dropping either',()=>{
  const c={};vm.createContext(c);vm.runInContext(merge,c);
  const result=c.MyWalkMerge.merge({reads:{}},{reads:{Monday:true}},{reads:{Tuesday:true}});
  assert.equal(result.conflicts.length,0);assert.equal(result.data.reads.Monday,true);assert.equal(result.data.reads.Tuesday,true);
});
test('conflicting note edits pause without uploading',async()=>{
  const s=setup({base:{notes:['old']},local:{notes:['phone']},remote:{notes:['ipad']}});await s.cloud.start();assert.equal(s.state().writes,0);assert.deepEqual(s.state().value,{notes:['phone']});
});
test('offline entries stay local',async()=>{
  const s=setup({local:{notes:['offline']},offline:true});await s.cloud.start();assert.equal(s.state().writes,0);assert.deepEqual(s.state().value,{notes:['offline']});
});
test('new account uploads existing entries',async()=>{
  const s=setup({local:{notes:['existing']}});await s.cloud.start();assert.equal(s.state().writes,1);assert.deepEqual(s.state().remote,{notes:['existing']});
});
test('first sign-in with existing cloud data requires a choice',async()=>{
  const s=setup({local:{notes:[]},remote:{notes:['existing cloud']}});await s.cloud.start();assert.equal(s.state().writes,0);
});
test('concurrent device save is re-read and merged on CAS failure',async()=>{
  const s=setup({base:{reads:{},other:'old'},local:{reads:{Monday:true},other:'old'},remote:{reads:{Tuesday:true},other:'old'},race:true});
  await s.cloud.start();assert.equal(s.state().writes,2);assert.equal(s.state().remote.other,'new remote edit');assert.equal(s.state().remote.reads.Monday,true);assert.equal(s.state().remote.reads.Tuesday,true);
});

test('a panel opened during sign-in refreshes after the session arrives',async()=>{
  const s=setup({local:{notes:['existing']}});s.cloud.panel();
  assert.match(s.panels.at(-1),/Email me a sign-in link/);
  await s.cloud.start();
  assert.match(s.panels.at(-1),/Signed in as/);
  assert.doesNotMatch(s.panels.at(-1),/id="cloud-email"/);
});

test('password recovery setup does not upload a fresh browser’s devotional state',async()=>{
  const s=setup({local:{notes:[]},accountSetup:true});await s.cloud.start();
  assert.equal(s.state().writes,0);s.cloud.panel();
  assert.match(s.panels.at(-1),/Set a MYWALK sign-in password/);
});

test('new plan notes and separate optional checks merge without losing legacy data',()=>{
 const c={};vm.createContext(c);vm.runInContext(merge,c);
 const base={reads:{old:true},notes:['keep'],walkV2:{days:{},optional:{}}};
 const local={...base,walkV2:{days:{'2026-10-12':{notes:{0:{html:'phone'}}}},optional:{}}};
 const remote={...base,walkV2:{days:{},optional:{passage:{done:true}}}};
 const result=c.MyWalkMerge.merge(base,local,remote);assert.equal(result.conflicts.length,0);assert.equal(result.data.notes[0],'keep');assert.equal(result.data.reads.old,true);assert.equal(result.data.walkV2.days['2026-10-12'].notes[0].html,'phone');assert.equal(result.data.walkV2.optional.passage.done,true);
});
test('account summary distinguishes signed out from a completed sync',async()=>{const s=setup({local:{notes:[]}});assert.equal(s.cloud.getAccount().signedIn,false);assert.equal(s.cloud.getAccount().lastSynced,null);await s.cloud.start();assert.equal(s.cloud.getAccount().signedIn,true);assert.equal(s.cloud.getAccount().status,'All changes synced.');assert.ok(Date.parse(s.cloud.getAccount().lastSynced));});
test('offline sign-in never claims a successful sync',async()=>{const s=setup({local:{notes:[]},offline:true});await s.cloud.start();assert.equal(s.cloud.getAccount().signedIn,true);assert.equal(s.cloud.getAccount().lastSynced,null);assert.match(s.cloud.getAccount().status,/reconnect/);});
test('account summary surfaces conflicting devices without replacing data',async()=>{const s=setup({local:{notes:['phone']},remote:{notes:['ipad']}});await s.cloud.start();assert.equal(s.cloud.getAccount().needsReview,true);assert.equal(s.state().writes,0);assert.deepEqual(s.state().value,{notes:['phone']});});

test('remote sync preserves active prayer UI while retaining new local prayer marks',async()=>{
 let active=true;
 const base={prayerChecks:{},other:'old'};
 const local={prayerChecks:{Monday:['card-2']},other:'old'};
 const remote={prayerChecks:{},other:'updated on iPad'};
 const s=setup({base,local,remote,canRefresh:()=>!active});
 await s.cloud.start();
 assert.equal(s.state().refreshes,0);
 assert.deepEqual(s.state().remote.prayerChecks.Monday,['card-2']);
 assert.equal(s.state().value.other,'updated on iPad');
 active=false;await s.tick();assert.equal(s.state().refreshes,1);
 await s.tick();assert.equal(s.state().refreshes,1);
});
test('unchanged sync does not redraw prayer cards',async()=>{
 const data={prayerChecks:{Monday:['one']}};
 const s=setup({base:data,local:data,remote:data});await s.cloud.start();await s.tick();
 assert.equal(s.state().refreshes,0);assert.equal(s.state().writes,0);
});
test('returning to Today preserves current prayer card',()=>{
 const source=fs.readFileSync('index.html','utf8');
 const fn=source.match(/function setPrayerView\(v\)\{[^\n]+/)[0];
 const context={prayFocusOpen:false,prayerView:'overview',flashPos:4,renderPrayer(){},navRecord(){}};
 vm.createContext(context);vm.runInContext(fn,context);context.setPrayerView('today');
 assert.equal(context.flashPos,4);assert.equal(context.prayerView,'today');
});

test('old devices are normalized before merging the fresh-start schedule',async()=>{
 require('../reading-plan-migration.js');const {migrate,VERSION}=globalThis.MyWalkReadingMigration;
 const normalize=data=>{const copy=JSON.parse(JSON.stringify(data));migrate(copy,[{plan_version:VERSION}]);return copy;};
 const old={reads:{1:true},notes:[],walkV2:{days:{'2026-01-02':{reads:{old:{done:true}},notes:{0:{html:'Keep my reflection'}},onTime:true}},notes:{general:'Existing notebook'},optional:{old:true}}};
 const c=setup({local:normalize(old),remote:old,base:old,normalize});await c.cloud.start();const result=c.state();assert.equal(c.panels.length,0);assert.deepEqual(result.value.reads,{});assert.deepEqual(result.value.walkV2.days['2026-01-02'].reads,{});assert.match(result.value.walkV2.notes.general,/Keep my reflection/);
});
