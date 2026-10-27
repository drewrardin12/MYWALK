const {test}=require('node:test');const assert=require('node:assert/strict');const fs=require('node:fs');const vm=require('node:vm');
function helpers(){const c={};vm.createContext(c);vm.runInContext(fs.readFileSync('state-sync-ui.js','utf8'),c);vm.runInContext(fs.readFileSync('sync-merge.js','utf8'),c);return c;}
test('incoming changes preserve open journal and study editor references',()=>{
 const c=helpers(),state={walkV2:{days:{today:{notes:{0:{html:'old'}}}},studies:{topic:{steps:{0:{html:'finding'}}}}}};
 const note=state.walkV2.days.today.notes[0],step=state.walkV2.studies.topic.steps[0];
 const incoming=JSON.parse(JSON.stringify(state));incoming.walkV2.notes={general:'from iPad'};
 c.MyWalkState.replaceInto(state,incoming);note.html='continued writing';step.html='continued findings';
 assert.equal(state.walkV2.days.today.notes[0].html,'continued writing');assert.equal(state.walkV2.studies.topic.steps[0].html,'continued findings');assert.equal(state.walkV2.notes.general,'from iPad');
});
test('prayer item editor stays attached when other cards reorder',()=>{
 const c=helpers(),state={cards:[{id:'a',requests:[]},{id:'b',requests:[]}]},editing=state.cards[0];
 c.MyWalkState.replaceInto(state,{cards:[{id:'b',requests:[]},{id:'a',requests:[]}]});
 editing.requests.push({id:'request',text:'saved'});assert.equal(state.cards[1],editing);assert.equal(state.cards[1].requests.length,1);
});
test('replacement respects deletions, array order, and null values',()=>{
 const c=helpers(),state={list:[{id:'a'},{id:'b'}],removed:true,value:{old:true}};
 c.MyWalkState.replaceInto(state,{list:[{id:'b'}],value:null});assert.equal(state.removed,undefined);assert.equal(state.list.length,1);assert.equal(state.list[0].id,'b');assert.equal(state.value,null);
});
test('object key order does not trigger a false sync change or conflict',()=>{
 const c=helpers(),a={notes:{today:'entry'},checks:['one']},b={checks:['one'],notes:{today:'entry'}};
 assert.equal(c.MyWalkMerge.equal(a,b),true);assert.equal(c.MyWalkMerge.equal({checks:['one','two']},{checks:['two','one']}),false);
});
test('cloud apply retains device-only defaults while removing deleted nested notes',()=>{
 const c=helpers(),state={dark:true,prayChime:true,notes:{a:'old',b:'keep'}};
 c.MyWalkState.apply(state,{notes:{b:'keep'}});assert.equal(state.dark,true);assert.equal(state.prayChime,true);assert.equal(state.notes.a,undefined);
});
test('service worker activation offers an update without forcing a reload',()=>{
 const source=fs.readFileSync('index.html','utf8');const handler=source.match(/addEventListener\('controllerchange',[^\n]+/)[0];assert.doesNotMatch(handler,/location\.reload/);assert.match(handler,/showUpdateBanner/);
});
