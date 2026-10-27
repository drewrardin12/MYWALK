/* Notebook pages are keyed independently so different pages can sync together. */
(function(root){
 function hash(text){let n=2166136261;for(let i=0;i<text.length;i++){n^=text.charCodeAt(i);n=Math.imul(n,16777619);}return(n>>>0).toString(16);}
 function ensure(state){
  const v=state.walkV2||(state.walkV2={}),book=v.notebook||(v.notebook={pages:{},imports:{}});book.pages=book.pages||{};book.imports=book.imports||{};let changed=false;
  const chunks=String(v.notes?.general||'').split(/<hr\b[^>]*>/i).filter(x=>x.replace(/<[^>]*>/g,'').trim());
  chunks.forEach((html,i)=>{const id='import-'+i+'-'+hash(html);if(book.imports[id])return;
   const heading=html.match(/<strong\b[^>]*>([\s\S]*?)<\/strong>/i),date=html.match(/\b\d{4}-\d{2}-\d{2}\b/);
   book.pages[id]={id,title:heading?heading[1].replace(/<[^>]*>/g,'').trim():(i?'Saved entry '+(i+1):'My notes'),html,created:date?date[0]+'T12:00:00.000Z':'',updated:''};book.imports[id]=true;changed=true;
  });return {book,changed};
 }
 function create(state,id,at){const {book}=ensure(state);book.pages[id]={id,title:'Untitled page',html:'',created:at,updated:at};return book.pages[id];}
 function update(state,id,changes,at){const p=ensure(state).book.pages[id];if(!p)return false;for(const k of ['title','html'])if(changes[k]!==undefined)p[k]=changes[k];p.updated=at;return true;}
 function clear(state,id,at){return update(state,id,{html:''},at);}
 function remove(state,id){delete ensure(state).book.pages[id];}
 root.MyWalkNotebook={ensure,create,update,clear,remove};
})(globalThis);

let mwNotebookCurrent='';
function mwNotebookBook(){const result=MyWalkNotebook.ensure(S);if(result.changed)save();return result.book;}
function mwNotebookPages(){return Object.values(mwNotebookBook().pages).sort((a,b)=>(a.created||'').localeCompare(b.created||'')||a.id.localeCompare(b.id));}
function mwNotebookHeading(){return mwBack("go('home');openSettings()",'Settings')+mwHead('Catch All notebook','A page for every thought');}
function mwNotebookList(){
 window.scrollTo(0,0);const pages=mwNotebookPages();h(mwNotebookHeading()+`<div class="mw-row"><p class="mw-sub">${pages.length} ${pages.length===1?'page':'pages'} · Saved as you write</p><button class="mw-button" onclick="mwNotebookNew()">New page</button></div><div class="mw-notebook-pages">${pages.map((p,i)=>`<button class="mw-notebook-page" onclick="mwNotebookOpen('${p.id}')"><span class="mw-label">Page ${i+1}</span><h2>${esc(mwPlain(p.title)||'Untitled page')}</h2><p>${esc(mwPlain(p.html.replace(/<br\s*\/?\s*>|<\/(?:p|div|li)>/gi,' ')).slice(0,150)||'A fresh page, ready for your thoughts.')}</p><span class="mw-link">Open page</span></button>`).join('')}</div>${!pages.length?'<section class="mw-entry"><h2>Start a new page.</h2><p class="mw-sub">Keep each thought, entry, or subject on its own page.</p></section>':''}`);
}
function mwNotebookNew(){const id='page-'+(globalThis.crypto?.randomUUID?.()||Date.now().toString(36)+'-'+Math.random().toString(36).slice(2));MyWalkNotebook.create(S,id,new Date().toISOString());save();mwNotebookOpen(id,true);}
function mwNotebookOpen(id,edit=false){
 window.scrollTo(0,0);const pages=mwNotebookPages(),i=pages.findIndex(p=>p.id===id),p=pages[i];if(!p)return mwNotebookList();mwNotebookCurrent=id;
 const head=mwBack('mwNotebookList()','All pages')+mwHead(edit?'Edit page':mwPlain(p.title)||'Untitled page',`Catch All notebook · Page ${i+1} of ${pages.length}`);
 if(edit){h(head+`<label class="mw-label" for="mw-notebook-title">Page title</label><input id="mw-notebook-title" class="mw-search" value="${esc(mwPlain(p.title))}" oninput="mwNotebookWrite()"><div class="mw-notebook-editor">${mwRich('mw-notebook-editor',p.html,'mwNotebookWrite()')}</div><div class="mw-tools"><button class="mw-button" onclick="mwNotebookOpen('${id}')">Done writing</button><button class="mw-link" onclick="mwNotebookClear('${id}')">Clear page</button></div><p class="mw-sub">Your title and writing save automatically.</p>`);return;}
 h(head+`<div class="mw-tools"><button class="mw-button" onclick="mwNotebookOpen('${id}',true)">Edit page</button><button class="mw-button secondary" onclick="mwNotebookNew()">New page</button></div><article class="mw-notebook-paper"><div class="mw-journal-text mw-notebook-content">${mwClean(p.html)||'<p class="mw-sub">This page is empty. Tap Edit page to start writing.</p>'}</div></article><div class="mw-row mw-notebook-pager"><button class="mw-button secondary" ${i===0?'disabled':''} onclick="mwNotebookOpen('${pages[i-1]?.id||''}')">Previous page</button><span class="mw-sub">${i+1} / ${pages.length}</span><button class="mw-button secondary" ${i===pages.length-1?'disabled':''} onclick="mwNotebookOpen('${pages[i+1]?.id||''}')">Next page</button></div><div class="mw-tools"><button class="mw-link" onclick="mwNotebookClear('${id}')">Clear page</button><button class="mw-link" onclick="mwNotebookDelete('${id}')">Delete page</button></div>`);
}
function mwNotebookWrite(){const title=el('mw-notebook-title'),editor=el('mw-notebook-editor');if(!title||!editor)return;MyWalkNotebook.update(S,mwNotebookCurrent,{title:title.value,html:mwClean(editor.innerHTML)},new Date().toISOString());save();}
function mwNotebookClear(id){mwConfirmNote('Clear this page?','All writing on this page will be removed. The page and its title will stay.',()=>{MyWalkNotebook.clear(S,id,new Date().toISOString());mwNotebookOpen(id);});}
function mwNotebookDelete(id){mwConfirmNote('Delete this page?','This page and its writing will be removed from the notebook.',()=>{MyWalkNotebook.remove(S,id);mwNotebookList();});}
