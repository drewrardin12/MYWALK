const {test}=require('node:test');
const assert=require('node:assert/strict');
const vm=require('node:vm');
const fs=require('node:fs');
function setup(){
 let pending,saves=0;const ctx={MW:{ensure:s=>s.walkV2},S:{walkV2:{days:{'2026-10-15':{notes:{0:{html:'Keep this'},1:{na:true}},reads:{a:{done:true}},prayed:true,formCompleted:'yes',question:4}}}},document:{},save:()=>saves++};
 for(const name of ['mwRenderNotes','mwReviewNotes','mwReadingJournal','mwStandalone','mwStudyStep','mwStudyJournal','openItem','renderLog','renderNotes','delNote','renderPositionField'])ctx[name]=()=>{};
 vm.createContext(ctx);vm.runInContext(fs.readFileSync('note-actions.js','utf8'),ctx);ctx.mwConfirmNote=(title,detail,action)=>{pending=action;};
 return {ctx,confirm:()=>{pending();ctx.save();},saves:()=>saves};
}
test('clear reflection waits for confirmation and preserves other answers and activity',()=>{
 const x=setup(),d=x.ctx.S.walkV2.days['2026-10-15'];let refreshed=false;
 x.ctx.mwClearReading('2026-10-15',0,()=>refreshed=true);
 assert.equal(d.notes[0].html,'Keep this');assert.equal(x.saves(),0);
 x.confirm();assert.equal(d.notes[0],undefined);assert.equal(d.notes[1].na,true);assert.equal(d.reads.a.done,true);assert.equal(d.prayed,true);assert.equal(d.formCompleted,undefined);assert.equal(refreshed,true);assert.equal(x.saves(),1);
});
test('clear entire day removes writing and questionnaire state, not reading/prayer',()=>{
 const x=setup(),d=x.ctx.S.walkV2.days['2026-10-15'];x.ctx.mwClearReading('2026-10-15',undefined,()=>{});x.confirm();
 assert.equal(Object.keys(d.notes).length,0);assert.equal(d.question,0);assert.equal(d.reads.a.done,true);assert.equal(d.prayed,true);
});
test('abandoning confirmation leaves all writing intact',()=>{
 const x=setup();const before=JSON.stringify(x.ctx.S);x.ctx.mwClearReading('2026-10-15',undefined,()=>{});assert.equal(JSON.stringify(x.ctx.S),before);assert.equal(x.saves(),0);
});
