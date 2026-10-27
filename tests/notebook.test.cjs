const {test}=require('node:test');const assert=require('node:assert/strict');const fs=require('node:fs');const vm=require('node:vm');
function api(){const c={};vm.createContext(c);vm.runInContext(fs.readFileSync('notebook.js','utf8'),c);vm.runInContext(fs.readFileSync('sync-merge.js','utf8'),c);return c;}
test('existing notebook entries become distinct pages without changing their text',()=>{
 const c=api(),raw='<p>Original notebook</p><hr><section><p><strong>Reading notes — 2026-10-15</strong></p><p>First paragraph.</p><p>Second paragraph.</p></section>',state={walkV2:{notes:{general:raw}}};
 const {book,changed}=c.MyWalkNotebook.ensure(state),pages=Object.values(book.pages);assert.equal(changed,true);assert.equal(pages.length,2);assert.equal(pages[0].html,'<p>Original notebook</p>');assert.match(pages[1].html,/Second paragraph/);assert.equal(pages[1].title,'Reading notes — 2026-10-15');assert.equal(state.walkV2.notes.general,raw);assert.equal(c.MyWalkNotebook.ensure(state).changed,false);
});
test('deleted imported page stays deleted when the notebook reopens',()=>{
 const c=api(),state={walkV2:{notes:{general:'<p>Preserved original</p>'}}};const id=Object.keys(c.MyWalkNotebook.ensure(state).book.pages)[0];c.MyWalkNotebook.remove(state,id);assert.equal(Object.keys(c.MyWalkNotebook.ensure(state).book.pages).length,0);
});
test('create, rename, clear and delete affect only the selected page',()=>{
 const c=api(),s={};const a=c.MyWalkNotebook.create(s,'one','2026-10-27T12:00:00Z');c.MyWalkNotebook.create(s,'two','2026-10-27T13:00:00Z');
 c.MyWalkNotebook.update(s,'one',{title:'My subject',html:'<p>Notes</p>'},'updated');c.MyWalkNotebook.update(s,'two',{html:'Keep other page'},'updated');c.MyWalkNotebook.clear(s,'one','cleared');assert.equal(a.title,'My subject');assert.equal(a.html,'');assert.equal(s.walkV2.notebook.pages.two.html,'Keep other page');c.MyWalkNotebook.remove(s,'one');assert.equal(s.walkV2.notebook.pages.one,undefined);assert.equal(Object.keys(s.walkV2.notebook.pages).length,1);
});
test('two devices import the same old entries with the same stable IDs',()=>{
 const c=api(),a={walkV2:{notes:{general:'<p>Same writing</p><hr><p>Another entry</p>'}}},b=JSON.parse(JSON.stringify(a));c.MyWalkNotebook.ensure(a);c.MyWalkNotebook.ensure(b);assert.deepEqual(Object.keys(a.walkV2.notebook.pages),Object.keys(b.walkV2.notebook.pages));
});
test('different page edits merge without overwriting either device',()=>{
 const c=api(),base={};c.MyWalkNotebook.create(base,'a','');c.MyWalkNotebook.create(base,'b','');const phone=JSON.parse(JSON.stringify(base)),ipad=JSON.parse(JSON.stringify(base));c.MyWalkNotebook.update(phone,'a',{html:'Phone writing'},'');c.MyWalkNotebook.update(ipad,'b',{html:'iPad writing'},'');const merged=c.MyWalkMerge.merge(base,phone,ipad);assert.equal(merged.conflicts.length,0);assert.equal(merged.data.walkV2.notebook.pages.a.html,'Phone writing');assert.equal(merged.data.walkV2.notebook.pages.b.html,'iPad writing');
});
test('editing a deleted page does not recreate it behind the user’s back',()=>{const c=api(),s={};c.MyWalkNotebook.create(s,'a','');c.MyWalkNotebook.remove(s,'a');assert.equal(c.MyWalkNotebook.update(s,'a',{html:'stale editor'},''),false);assert.equal(Object.keys(s.walkV2.notebook.pages).length,0);});
