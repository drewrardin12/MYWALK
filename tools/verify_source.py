import json,re,zipfile,collections
from pathlib import Path
root=Path(__file__).resolve().parents[1]
bible=json.loads((root/'data/kjv.json').read_text())
codes=['GEN','EXO','LEV','NUM','DEU','JOS','JDG','RUT','1SA','2SA','1KI','2KI','1CH','2CH','EZR','NEH','EST','JOB','PSA','PRO','ECC','SNG','ISA','JER','LAM','EZK','DAN','HOS','JOL','AMO','OBA','JON','MIC','NAM','HAB','ZEP','HAG','ZEC','MAL','MAT','MRK','LUK','JHN','ACT','ROM','1CO','2CO','GAL','EPH','PHP','COL','1TH','2TH','1TI','2TI','TIT','PHM','HEB','JAS','1PE','2PE','1JN','2JN','3JN','JUD','REV']
books=dict(zip(codes,bible));source={};usage=collections.defaultdict(dict);paragraphs=set()
z=zipfile.ZipFile('/private/tmp/kjv-usfm.zip')
for name in z.namelist():
 if not name.endswith('.usfm'):continue
 raw=z.read(name).decode('utf-8-sig');m=re.search(r'\\id (\S+)',raw)
 if not m or m[1] not in books:continue
 book=books[m[1]];source[book]={};chapter=0;pending_paragraph=False
 for line in raw.splitlines():
  cm=re.match(r'\\c (\d+)',line)
  if cm:chapter=int(cm[1]);source[book][chapter]={}
  if re.match(r'\\(?:p|m|q\d?|s\d?)\b',line):pending_paragraph=True
  vm=re.match(r'\\v (\d+)\s+(.*)',line)
  if not vm:continue
  verse=int(vm[1]);text=vm[2];ref=f'{book} {chapter}:{verse}'
  if pending_paragraph:paragraphs.add((book,chapter,verse));pending_paragraph=False
  for word,num in re.findall(r'\\\+?w ([^|]+)\|[^\n]*?strong="([HG]\d+)"[^\n]*?\\\+?w\*',text):
   num=num[0]+str(int(num[1:]));usage[num][ref]=word
  clean=re.sub(r'\\f .*?\\f\*','',text)
  clean=re.sub(r'\\\+?w ([^|]+)\|.*?\\\+?w\*',lambda m:m[1],clean)
  clean=re.sub(r'\\\+?[a-z0-9]+\*? ?','',clean);clean=re.sub(r'\s+',' ',clean).strip();source[book][chapter][verse]=clean
assert set(source)==set(bible)
differences=[]
for b,chapters in bible.items():
 for c,verses in enumerate(chapters,1):
  assert list(source[b][c])==list(range(1,len(verses)+1)),(b,c,len(verses),list(source[b][c])[-1])
  for v,text in enumerate(verses,1):
   norm=lambda s:re.sub(r'[^a-z0-9]','',s.lower())
   if norm(text)!=norm(source[b][c][v]):differences.append({'ref':f'{b} {c}:{v}','first':text,'second':source[b][c][v]})
book_indices={b:i for i,b in enumerate(bible)}
def encode_ref(ref):
 b,cv=ref.rsplit(' ',1);c,v=map(int,cv.split(':'));return book_indices[b]*1000000+c*1000+v
(root/'data/strongs-usage.json').write_text(json.dumps({'books':list(bible),'entries':{k:[encode_ref(ref) for ref in rows] for k,rows in usage.items()}},separators=(',',':')))
bounds=json.loads((root/'validation/story-boundaries.json').read_text())
for row in bounds:
 m=re.search(r'([^;]+) (\d+):(\d+)-(\d+)$',row['ref']);row['source_paragraph_break_after']=bool(m and (m[1].strip(),int(m[2]),int(m[4])+1) in paragraphs)
(root/'validation/story-boundaries.json').write_text(json.dumps(bounds,ensure_ascii=False,indent=2))
report={'second_source':'https://ebible.org/Scriptures/eng-kjv_usfm.zip','books':66,'chapters':1189,'verses':31102,'numbering_matches':True,'text_variations':differences,'strongs_entries_with_usage':len(usage),'story_breaks_at_source_paragraph':sum(x['source_paragraph_break_after'] for x in bounds),'story_breaks_requiring_literary_review':sum(not x['source_paragraph_break_after'] for x in bounds)}
(root/'validation/independent-source-report.json').write_text(json.dumps(report,ensure_ascii=False,indent=2));print({k:v for k,v in report.items() if k!='text_variations'});print('Text variations:',len(differences))
review=json.loads((root/'validation/story-boundary-review.json').read_text())
for row in bounds:
 assert row['ref'] in review,('unreviewed story boundary',row['ref'])
 row['review']=review[row['ref']]
(root/'validation/story-boundaries.json').write_text(json.dumps(bounds,ensure_ascii=False,indent=2))
