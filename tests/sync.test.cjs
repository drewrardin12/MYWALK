const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');
const merge=fs.readFileSync('sync-merge.js','utf8');
const code=fs.readFileSync('cloud-sync.js','utf8');
function setup({local,remote,base,offline=false,race=false}){
  const storage=new Map(base?[['mywalk_cloud_v1',JSON.stringify({owner:'one',base})]]:[]);
  let writes=0, revision=remote?1:0, value=local; const panels=[];
  const context={console,JSON,Set,Blob,URL,navigator:{onLine:!offline},location:{reload(){}},
    localStorage:{getItem:k=>storage.get(k)||null,setItem:(k,v)=>storage.set(k,v)},
    document:{visibilityState:'visible',getElementById:()=>null,querySelector:()=>null,querySelectorAll:()=>[],addEventListener(){}},
    setTimeout:()=>1,clearTimeout(){},setInterval(){},addEventListener(){},
    MYWALK_SYNC_CONFIG:{url:'https://test.supabase.co',publishableKey:'public'},
    supabase:{createClient:()=>({auth:{onAuthStateChange(){},getSession:async()=>({data:{session:{user:{id:'one'}}}})},
      from:()=>({select:()=>({eq:()=>({maybeSingle:async()=>({data:remote?{data:remote,revision}:null})})})}),
      rpc:async(name,args)=>{writes++;if(race&&writes===1){remote={...remote,other:'new remote edit'};revision++;return {data:null};}assert.equal(args.expected_revision,revision);remote=args.new_data;return {data:++revision};}})} };
  context.window=context;vm.createContext(context);vm.runInContext(merge,context);vm.runInContext(code,context);
  const cloud=context.MyWalkCloud({snapshot:()=>value,apply:d=>value=d,refresh(){},escape:x=>x,modal:html=>{panels.push(html);return {dataset:{},isConnected:true,remove(){this.isConnected=false;}};}});
  return {cloud,storage,panels,state:()=>({writes,remote,value})};
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
