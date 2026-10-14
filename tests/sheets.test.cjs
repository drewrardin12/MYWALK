const {test}=require('node:test');const assert=require('node:assert/strict');require('../sheet-gesture.js');const {shouldDismiss}=globalThis.MyWalkSheets;
test('deliberate long pull dismisses a sheet',()=>{assert.equal(shouldDismiss(125,800,600),true);});
test('short slow pull returns the sheet to its position',()=>{assert.equal(shouldDismiss(30,500,600),false);});
test('quick downward flick dismisses without a full long pull',()=>{assert.equal(shouldDismiss(45,50,600),true);});
test('tiny movement and upward movement do not dismiss',()=>{assert.equal(shouldDismiss(5,1,600),false);assert.equal(shouldDismiss(-100,100,600),false);});
