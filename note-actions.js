/* Explicit note actions. Keep reading/prayer checks separate from journal text. */
function mwNoteButton(parent,label,action){
  if(!parent)return;
  const b=document.createElement('button');b.className='mw-link';b.type='button';b.textContent=label;b.onclick=action;parent.appendChild(b);return b;
}
function mwConfirmNote(title,detail,action){
  const m=modal(`<h2>${esc(title)}</h2><p class="mw-sub">${esc(detail)} This change will sync to your other devices.</p><div class="mw-tools"><button class="mw-button" data-confirm-note>Confirm</button><button class="mw-button secondary" data-cancel-note>Cancel</button></div>`);
  m.querySelector('[data-cancel-note]').onclick=()=>m.remove();
  m.querySelector('[data-confirm-note]').onclick=()=>{action();save();m.remove();};
}
function mwClearReading(date,index,after){
  mwConfirmNote(index===undefined?'Clear this day’s notes?':'Clear this reflection?', 'The selected writing and Not applicable answers will be removed. Reading and prayer checks stay saved. WALK credit may change if no written reflection remains.',()=>{
    const d=MW.ensure(S).days[date];if(!d)return;
    if(index===undefined){d.notes={};d.question=0;}else delete d.notes[index];
    delete d.formCompleted;after();
  });
}
const mwNotesBeforeActions=mwRenderNotes;
mwRenderNotes=function(){mwNotesBeforeActions();const date=mwDate,index=mwQuestion;mwNoteButton(el('app'),'Clear this reflection',()=>mwClearReading(date,index,()=>mwRenderNotes()));};
const mwReviewBeforeActions=mwReviewNotes;
mwReviewNotes=function(){mwReviewBeforeActions();const date=mwDate;el('app').querySelectorAll('.mw-entry').forEach((entry,i)=>mwNoteButton(entry,'Clear reflection',()=>mwClearReading(date,i,()=>mwReviewNotes())));mwNoteButton(el('app'),'Clear all notes for this day',()=>mwClearReading(date,undefined,()=>mwReadingJournal()));};
const mwJournalBeforeActions=mwReadingJournal;
mwReadingJournal=function(query=''){mwJournalBeforeActions(query);const dates=Object.keys(MW.ensure(S).days).filter(date=>{const d=MW.ensure(S).days[date];return Object.keys(d.notes||{}).length&&(date+' '+Object.values(d.notes).map(a=>mwPlain(a.html)).join(' ')).toLowerCase().includes(query.toLowerCase());}).sort().reverse();el('app').querySelectorAll('article.mw-entry').forEach((entry,i)=>{const date=dates[i];mwNoteButton(entry,'Edit entry',()=>mwOpenNotes(date));mwNoteButton(entry,'Delete entry',()=>mwClearReading(date,undefined,()=>mwReadingJournal(query)));});};
const mwStandaloneBeforeActions=mwStandalone;
mwStandalone=function(edit=false){mwStandaloneBeforeActions(edit);mwNoteButton(el('app'),'Clear entire note',()=>mwConfirmNote('Clear standalone note?','All writing in this note will be removed.',()=>{delete MW.ensure(S).notes.general;mwStandalone();}));};
const mwStudyStepBeforeActions=mwStudyStep;
mwStudyStep=function(edit=false){mwStudyStepBeforeActions(edit);const st=mwStudy(),i=currentStepIdx;mwNoteButton(el('app'),'Clear findings for this step',()=>mwConfirmNote('Clear this study step?','Its writing, Not applicable answer, and completion check will be removed.',()=>{delete st.steps[i];st.updated=new Date().toISOString();mwStudyStep(true);}));};
const mwStudyJournalBeforeActions=mwStudyJournal;
mwStudyJournal=function(query='',filter='all'){mwStudyJournalBeforeActions(query,filter);const studies=Object.entries(MW.ensure(S).studies).filter(([key,st])=>{const n=mwStudyCount(st);return(filter==='all'||(filter==='complete'?n===7:n<7))&&(st.subject.title+' '+Object.values(st.steps).map(x=>mwPlain(x.html)).join(' ')).toLowerCase().includes(query.toLowerCase());});el('app').querySelectorAll('section.mw-entry').forEach((entry,i)=>{const [key,st]=studies[i];mwNoteButton(entry,'Delete study journal entry',()=>mwConfirmNote('Delete this study’s findings?', 'All seven steps of your saved findings for this subject will be removed.',()=>{delete MW.ensure(S).studies[key];mwStudyJournal(query,filter);}));});};
function mwEditPrayerRequest(hi,ii,ri){
 const it=S.prayer.headings[hi].items[ii],r=it.requests[ri];if(!r)return;
 const m=modal(`<h2>Edit prayer request</h2>${mwRich('mw-request-edit',r.html||esc(r.text||''),'')}<div class="mw-tools"><button class="mw-button" data-save-request>Save changes</button><button class="mw-button secondary" data-cancel-request>Cancel</button></div>`);
 m.querySelector('[data-cancel-request]').onclick=()=>m.remove();
 m.querySelector('[data-save-request]').onclick=()=>{const html=mwClean(m.querySelector('#mw-request-edit').innerHTML),text=mwPlain(html);if(!text){mwConfirmNote('Delete empty request?','This prayer request will be removed.',()=>{it.requests.splice(ri,1);m.remove();document.querySelectorAll('.modal').forEach(x=>x.remove());openItem(hi,ii);});return;}r.html=html;r.text=text;save();m.remove();document.querySelectorAll('.modal').forEach(x=>x.remove());openItem(hi,ii);};
}
const mwItemBeforeActions=openItem;
openItem=function(hi,ii){mwItemBeforeActions(hi,ii);const m=[...document.querySelectorAll('.modal')].at(-1);m.querySelectorAll('[data-remove]').forEach(b=>{const ri=+b.dataset.remove;mwNoteButton(b.parentElement,'Edit request',()=>mwEditPrayerRequest(hi,ii,ri));b.onclick=()=>mwConfirmNote('Delete prayer request?','This request will be removed from its prayer card.',()=>{S.prayer.headings[hi].items[ii].requests.splice(ri,1);m.remove();openItem(hi,ii);});});};
function mwEditPraise(t){
 const m=modal(`<h2>Edit answered prayer</h2><label for="mw-praise-request">Prayer request</label><textarea id="mw-praise-request" class="mw-search">${esc(t.text||'')}</textarea><h3>How did God answer?</h3>${mwRich('mw-praise-edit',t.noteHtml||esc(t.note||''),'')}<div class="mw-tools"><button class="mw-button" data-save-praise>Save changes</button><button class="mw-button secondary" data-cancel-praise>Cancel</button></div>`);
 m.querySelector('[data-cancel-praise]').onclick=()=>m.remove();m.querySelector('[data-save-praise]').onclick=()=>{t.text=m.querySelector('#mw-praise-request').value;t.noteHtml=mwClean(m.querySelector('#mw-praise-edit').innerHTML);t.note=mwPlain(t.noteHtml);save();m.remove();renderLog();};
}
const mwLogBeforeActions=renderLog;
renderLog=function(){mwLogBeforeActions();const now=new Date(),items=S.testimony.filter(t=>logFilter==='all'||(logFilter==='month'?t.date.slice(0,7)===todayKey(now).slice(0,7):t.date.slice(0,4)===String(now.getFullYear())));el('pv').querySelectorAll('section.mw-entry').forEach((entry,i)=>{const t=items[i];mwNoteButton(entry,'Edit entry',()=>mwEditPraise(t));mwNoteButton(entry,'Delete entry',()=>mwConfirmNote('Delete answered-prayer entry?','This saved prayer and praise report will be removed from your journal.',()=>{S.testimony.splice(S.testimony.indexOf(t),1);renderLog();}));});};
function mwEditLegacyNote(note){
 const m=modal(`<h2>Edit note</h2><textarea class="mw-search" rows="8" data-note-text>${esc(note.text||'')}</textarea><div class="mw-tools"><button class="mw-button" data-save-note>Save changes</button><button class="mw-button secondary" data-cancel-note>Cancel</button></div>`);
 m.querySelector('[data-cancel-note]').onclick=()=>m.remove();m.querySelector('[data-save-note]').onclick=()=>{note.text=m.querySelector('[data-note-text]').value;save();m.remove();renderNotes();};
}
const mwLegacyNotesBeforeActions=renderNotes;
renderNotes=function(){mwLegacyNotesBeforeActions();const notes=S.notes.filter(n=>noteFilter==='all'||(noteFilter==='topic'&&n.kind==='t')||(noteFilter==='char'&&n.kind==='c'));el('sv').querySelectorAll('button[aria-label="Delete note"]').forEach((b,i)=>mwNoteButton(b.closest('.card'),'Edit note',()=>mwEditLegacyNote(notes[i])));};
delNote=function(id){mwConfirmNote('Delete this note?','This personal note will be removed.',()=>{S.notes=S.notes.filter(n=>n.id!==id);renderNotes();});};
const mwPositionBeforeActions=renderPositionField;
renderPositionField=function(){mwPositionBeforeActions();const subject=currentSubject(),field=currentPosField;mwNoteButton(el('sv'),'Clear this field',()=>mwConfirmNote('Clear this position field?','Your writing in this field will be removed and its completion check reset.',()=>{setPosition(subject,field,'');const mastery=S.study.mastery[subjectKey(subject)];if(mastery)mastery[7]=false;renderPositionField();}));};
