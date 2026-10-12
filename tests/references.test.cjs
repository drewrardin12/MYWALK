const {test}=require('node:test');const assert=require('node:assert/strict');const fs=require('node:fs');const vm=require('node:vm');
const js=fs.readFileSync('overhaul.js','utf8');const fn=js.slice(js.indexOf('function mwTopicalRefs('),js.indexOf('\nfunction mwPassages'));
const bible={Genesis:Array.from({length:5},()=>Array.from({length:10},(_,i)=>String(i+1))),Hebrews:Array.from({length:13},()=>Array.from({length:30},(_,i)=>String(i+1)))};
const ctx={D:{kjv:bible},CODE_RE:'(?:GEN|HEB)',BOOKMAP:{GEN:'Genesis',HEB:'Hebrews'},navesSections:entry=>[{refs:entry}]};vm.createContext(ctx);vm.runInContext(fn,ctx);
const refs=x=>Array.from(ctx.mwTopicalRefs(x),r=>r.ref);
test('topical comma lists retain every selected verse',()=>assert.deepEqual(refs('GEN 1:1,3,5-6; 2:2'),['Genesis 1:1','Genesis 1:3','Genesis 1:5','Genesis 1:6','Genesis 2:2']));
test('topical cross-chapter ranges include both endpoints',()=>assert.deepEqual(refs('GEN 1:9-2:2'),['Genesis 1:9','Genesis 1:10','Genesis 2:1','Genesis 2:2']));
test('topical inherited book and whole-chapter ranges remain distinct',()=>{const r=refs('GEN 1:1; 2-3; HEB 11:4; 12:24');assert.equal(r.length,23);assert.ok(r.includes('Hebrews 12:24'));assert.ok(r.includes('Genesis 3:10'));});
