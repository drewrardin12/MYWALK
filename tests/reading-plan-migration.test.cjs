const {test}=require('node:test');const assert=require('node:assert/strict');require('../reading-plan-migration.js');const {migrate,VERSION}=globalThis.MyWalkReadingMigration;
test('moves writing without losing existing notebook; resets reading; preserves prayer and study; runs once',()=>{
 const state={reads:{1:true},notes:[{subject:'Old note',text:'Keep <this>',date:'2026-10-01'}],walkV2:{notes:{general:'Existing notebook'},days:{'2026-10-02':{reads:{old:{done:true}},notes:{0:{html:'<p>My reflection</p>'}},prayed:true,onTime:true,manualCompletion:{confirmedAt:'old'}}},optional:{old:true},studies:{keep:{text:'Study'}}}};
 assert.equal(migrate(state,[{}]),false);assert.equal(state.reads[1],true);
 assert.equal(migrate(state,[{plan_version:VERSION}],'now'),true);
 const v=state.walkV2;assert.match(v.notes.general,/Existing notebook/);assert.match(v.notes.general,/My reflection/);assert.match(v.notes.general,/Keep &lt;this&gt;/);assert.deepEqual(v.days['2026-10-02'].reads,{});assert.deepEqual(v.days['2026-10-02'].notes,{});assert.equal(v.days['2026-10-02'].prayed,true);assert.equal(v.days['2026-10-02'].onTime,undefined);assert.deepEqual(v.optional,{});assert.deepEqual(state.reads,{});assert.deepEqual(state.notes,[]);assert.equal(v.studies.keep.text,'Study');assert.equal(v.freshStart.backup.days['2026-10-02'].notes[0].html,'<p>My reflection</p>');
 const before=JSON.stringify(state);assert.equal(migrate(state,[{plan_version:VERSION}]),false);assert.equal(JSON.stringify(state),before);
});
