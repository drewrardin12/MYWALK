/* One-time migration, activated only by the new heading-based schedule. */
(function(root){
 const VERSION='standard-headings-350-v1';
 const escape=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
 function migrate(state,schedule,at='2026-10-26T00:00:00.000Z'){
  if(schedule?.[0]?.plan_version!==VERSION)return false;
  const v=state.walkV2||(state.walkV2={days:{},notes:{}});
  if(v.freshStart?.version===VERSION)return false;
  v.notes=v.notes||{};v.days=v.days||{};
  // Keep a recoverable snapshot before moving writing or clearing checks.
  const backup=JSON.parse(JSON.stringify({days:v.days,optional:v.optional||{},legacyReads:state.reads||{},legacyNotes:state.notes||[]}));
  const entries=[];
  for(const [date,day] of Object.entries(v.days).sort()){
   const writing=Object.entries(day.notes||{}).filter(([,a])=>a.html&&String(a.html).replace(/<[^>]*>/g,'').trim());
   if(writing.length)entries.push(`<section><p><strong>Reading notes — ${escape(date)}</strong></p>${writing.map(([i,a])=>`<p><strong>${escape(root.MyWalkV2?.questions?.[i]||'Reflection')}</strong></p>${a.html}`).join('')}</section>`);
   day.reads={};day.notes={};day.question=0;
   delete day.manualCompletion;delete day.onTime;delete day.completedAt;delete day.formCompleted;
  }
  for(const n of state.notes||[])if(n.text)entries.push(`<section><p><strong>${escape(n.subject||'Note')} — ${escape(n.date||'')}</strong></p><p>${escape(n.text).replace(/\n/g,'<br>')}</p></section>`);
  v.notes.general=[v.notes.general||'',...entries].filter(Boolean).join('<hr>');
  state.notes=[];state.reads={};v.optional={};
  v.freshStart={version:VERSION,at,backup};v.version=VERSION;
  return true;
 }
 root.MyWalkReadingMigration={VERSION,migrate};
})(globalThis);
