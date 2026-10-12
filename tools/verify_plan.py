"""Validate corrected schedule and generate optional coverage without changing user state."""
import json,re
from pathlib import Path
ROOT=Path(__file__).resolve().parents[1]
def load(name):return json.loads((ROOT/name).read_text())
bible=load('data/kjv.json');schedule=load('data/schedule.json')
def expand(ref):
 out=[]
 for part in ref.split(';'):
  m=re.fullmatch(r'\s*(.*?) (\d+):(\d+)-(\d+)\s*',part)
  assert m,part
  b,c,a,z=m[1],int(m[2]),int(m[3]),int(m[4])
  assert b in bible and 1<=c<=len(bible[b]) and 1<=a<=z<=len(bible[b][c-1]),part
  out.extend((b,c,v) for v in range(a,z+1))
 return out
assert len(bible)==66 and sum(len(ch) for chapters in bible.values() for ch in chapters)==31102
assert [d['day'] for d in schedule]==list(range(1,351))
coverage=set();ids=set();boundaries=[]
for d in schedule:
 for track in ['story','nonstory']:
  assert d[track]
  n=0
  for chunk in d[track]:
   assert chunk['id'] not in ids;ids.add(chunk['id'])
   verses=expand(chunk['ref']);assert len(verses)==chunk['n'];n+=len(verses);coverage.update(verses)
   assert 1<=len(re.findall(r'[.!?](?:\s|$)',chunk['what_to_expect']))<=3
   last=verses[-1]
   if track=='story' and last[2]<len(bible[last[0]][last[1]-1]):
    b,c,v=last;boundaries.append({'day':d['day'],'ref':chunk['ref'],'ending':bible[b][c-1][v-1],'next':bible[b][c-1][v]})
  assert n==d[track+'_verses'] and n>=20
 assert d['total']==d['story_verses']+d['nonstory_verses']<=110
optional=[]
for b,chapters in bible.items():
 for c,verses in enumerate(chapters,1):
  missing=[v for v in range(1,len(verses)+1) if (b,c,v) not in coverage]
  runs=[]
  for v in missing:
   if runs and runs[-1][1]+1==v:runs[-1][1]=v
   else:runs.append([v,v])
  for a,z in runs:optional.append({'id':f'{b}:{c}:{a}-{z}','ref':f'{b} {c}:{a}-{z}','verses':z-a+1})
# Explicit retained passages must never fall into the optional complement.
for ref in ['Matthew 1:1-25','Luke 3:1-38','Genesis 5:21-24']+[f'Ezekiel {c}:1-{len(bible["Ezekiel"][c-1])}' for c in range(40,49)]:
 assert set(expand(ref))<=coverage,ref
(ROOT/'data/optional-readings.json').write_text(json.dumps(optional,ensure_ascii=False))
(ROOT/'validation/story-boundaries.json').write_text(json.dumps(boundaries,ensure_ascii=False,indent=2))
report={'days':350,'assigned_verses':sum(d['total'] for d in schedule),'unique_coverage':len(coverage),'optional_verses':sum(x['verses'] for x in optional),'optional_passages':len(optional),'min_daily':min(d['total'] for d in schedule),'max_daily':max(d['total'] for d in schedule),'within_chapter_story_endings':len(boundaries)}
assert len(coverage)+report['optional_verses']==31102
(ROOT/'validation/plan-report.json').write_text(json.dumps(report,indent=2));print(report)
