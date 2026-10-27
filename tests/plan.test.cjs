const {test}=require('node:test');const assert=require('node:assert/strict');const fs=require('node:fs');const schedule=JSON.parse(fs.readFileSync('data/schedule.json'));const kjv=JSON.parse(fs.readFileSync('data/kjv.json'));const optional=JSON.parse(fs.readFileSync('data/optional-readings.json'));
function expand(ref){return ref.split(';').flatMap(part=>{const m=part.trim().match(/^(.*?) (\d+):(\d+)(?:-(\d+))?$/);assert.ok(m,part);const b=m[1],c=+m[2],a=+m[3],z=+(m[4]||m[3]);assert.ok(a>=1&&z>=a&&z<=kjv[b][c-1].length,part);return Array.from({length:z-a+1},(_,i)=>b+'|'+c+'|'+(a+i));});}
test('all days obey corrected schedule constraints',()=>{assert.equal(schedule.length,350);const ids=new Set();for(const [i,d] of schedule.entries()){assert.equal(d.day,i+1);for(const t of ['story','nonstory']){assert.ok(d[t].length);let n=0;for(const c of d[t]){assert.ok(!ids.has(c.id));ids.add(c.id);const verses=expand(c.ref);assert.equal(c.n,verses.length);n+=verses.length;}assert.equal(d[t+'_verses'],n);assert.ok(n>=20);}assert.equal(d.total,d.story_verses+d.nonstory_verses);assert.ok(d.total<=110);}});
test('main and optional coverage form the entire verified Bible',()=>{const main=new Set(schedule.flatMap(d=>[...d.story,...d.nonstory].flatMap(c=>expand(c.ref))));const extra=new Set();for(const o of optional){const verses=expand(o.ref);assert.equal(verses.length,o.verses);for(const v of verses){assert.ok(!main.has(v));assert.ok(!extra.has(v));extra.add(v);}}assert.equal(main.size+extra.size,31102);});
test('missing Matthew verse is present at standard numbering',()=>{assert.equal(kjv.Matthew[25].length,75);assert.match(kjv.Matthew[25][37],/My soul is exceeding sorrowful/);assert.match(kjv.Matthew[25][38],/went a little further/);});
test('the complete Mark healing scene remains together',()=>{const card=schedule.flatMap(d=>d.story).find(c=>expand(c.ref).includes('Mark|7|31'));assert.ok(card);for(let v=31;v<=37;v++)assert.ok(expand(card.ref).includes('Mark|7|'+v));});
test('all within-chapter story endings have review records',()=>{const boundaries=JSON.parse(fs.readFileSync('validation/story-boundaries.json'));assert.ok(boundaries.length>0);for(const b of boundaries)assert.ok(b.review,b.ref);});
test('independent sources agree on all chapter numbering',()=>{const r=JSON.parse(fs.readFileSync('validation/independent-source-report.json'));assert.equal(r.numbering_matches,true);assert.equal(r.verses,31102);});

test('standard plan has two cards daily, no repeats, and ordered tracks',()=>{
 const books=Object.keys(kjv),nt=books.indexOf('Matthew');const seen=new Set();
 for(const track of ['story','nonstory']){const order=track==='story'?books:[...books.slice(nt),...books.slice(0,nt)];let prev=-1;
  for(const day of schedule){assert.equal(day[track].length,1);const card=day[track][0];assert.ok(card.title&&card.what_to_expect&&card.headings.length);assert.ok(!card.what_to_expect.includes('This reading covers'));assert.equal(day.plan_version,'standard-headings-350-v1');assert.deepEqual(card.headings.flatMap(h=>expand(h.ref)),expand(card.ref));
   for(const verse of expand(card.ref)){assert.ok(!seen.has(verse),'Repeated '+verse);seen.add(verse);const [b,c,v]=verse.split('|');const pos=order.indexOf(b)*1000000+(+c)*1000+(+v);assert.ok(pos>prev,'Out of order '+verse);prev=pos;}
  }
 }
 assert.equal(seen.size,26432);assert.equal(Math.max(...schedule.map(d=>d.total)),87);
});
test('approved restorations, omissions and classifications are retained',()=>{
 const track=t=>new Set(schedule.flatMap(d=>d[t].flatMap(c=>expand(c.ref))));const story=track('story'),non=track('nonstory'),extra=new Set(optional.flatMap(c=>expand(c.ref)));
 for(const [b,c,a,z] of [['Matthew',22,1,1],['1 Samuel',20,11,42],['Genesis',10,1,1],['Exodus',12,43,51],['1 Chronicles',4,9,14]])for(let v=a;v<=z;v++)assert.ok(story.has(`${b}|${c}|${v}`));
 for(let v=1;v<=63;v++)assert.ok(extra.has('Ezra|2|'+v));for(let v=12;v<=17;v++)assert.ok(story.has('Ezra|10|'+v));for(let v=18;v<=44;v++)assert.ok(extra.has('Ezra|10|'+v));
 for(const b of ['Acts','2 Samuel'])for(const verse of non)assert.ok(!verse.startsWith(b+'|'));
});
