/* Pure v2 state helpers. Legacy state is never modified or remapped by day number. */
(function(root){
const VERSION='schedule-350-v1';
const questions=['How would I summarize today’s reading?','What truth did I learn—or need to be reminded of?','Who is speaking, and to whom, in today’s passages?','What does today’s reading teach me to believe?','What does today’s reading teach me about God?','Is there a sin I need to confess and forsake?','How should I respond to today’s reading?','What else do I want to record from today’s reading?'];
function ensure(state){if(!state.walkV2)state.walkV2={version:VERSION,days:{},optional:{},studies:{},notes:{},memory:{}};for(const k of ['days','optional','studies','notes','memory'])if(!state.walkV2[k])state.walkV2[k]={};return state.walkV2;}
function text(html){return String(html||'').replace(/<[^>]*>/g,' ').replace(/&nbsp;/g,' ').trim();}
function written(day){return Object.values(day.notes||{}).some(a=>text(a.html).length>0);}
function reading(day,required){return required.length>0&&required.every(id=>day.reads?.[id]?.done);}
function walk(day,required){return reading(day,required)&&!!day.prayed&&written(day);}
function questionnaire(day){return questions.slice(0,7).every((q,i)=>text(day.notes?.[i]?.html)||day.notes?.[i]?.na);}
function record(state,date,dayNumber){const v=ensure(state);if(!v.days[date])v.days[date]={day:dayNumber,reads:{},notes:{},question:0};return v.days[date];}
function count(state,schedule,today){const days=ensure(state).days;const done=[];for(const [date,d] of Object.entries(days)){const plan=schedule[d.day-1];if(plan&&walk(d,[...plan.story,...plan.nonstory].map(c=>c.id)))done.push(date);}
let streak=0;let date=new Date(today+'T12:00:00');if(!days[today]?.onTime)date.setDate(date.getDate()-1);for(let i=0;i<3660;i++){const key=localDate(date);const row=days[key],plan=row&&schedule[row.day-1];if(!row?.onTime||!plan||!walk(row,[...plan.story,...plan.nonstory].map(c=>c.id)))break;streak++;date.setDate(date.getDate()-1);}return {streak,month:done.filter(x=>x.slice(0,7)===today.slice(0,7)).length,year:done.filter(x=>x.slice(0,4)===today.slice(0,4)).length,total:done.length};}
function localDate(d){return d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0')+'-'+String(d.getDate()).padStart(2,'0');}
root.MyWalkV2={VERSION,questions,ensure,text,written,reading,walk,questionnaire,record,count,localDate};
})(globalThis);
