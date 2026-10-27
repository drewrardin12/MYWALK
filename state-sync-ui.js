/* Preserve live editor references when another device updates saved state. */
(function(root){
  const object=x=>x!==null&&typeof x==='object'&&!Array.isArray(x);
  function replaceInto(target,source){
    if(Array.isArray(target)&&Array.isArray(source)){
      const byId=new Map(target.filter(x=>object(x)&&x.id!==undefined).map(x=>[x.id,x]));
      const next=source.map((value,i)=>{
        const previous=object(value)&&value.id!==undefined?byId.get(value.id):target[i];
        return compatible(previous,value)?replaceInto(previous,value):value;
      });
      target.splice(0,target.length,...next);return target;
    }
    for(const key of Object.keys(target))if(!Object.prototype.hasOwnProperty.call(source,key))delete target[key];
    for(const [key,value] of Object.entries(source))target[key]=compatible(target[key],value)?replaceInto(target[key],value):value;
    return target;
  }
  function compatible(a,b){return(Array.isArray(a)&&Array.isArray(b))||(object(a)&&object(b));}
  function apply(target,source){for(const [key,value] of Object.entries(source))target[key]=compatible(target[key],value)?replaceInto(target[key],value):value;return target;}
  root.MyWalkState={replaceInto,apply};
})(globalThis);

// Incoming changes update storage immediately. Rebuild a screen only on request.
function mwOfferSyncedRefresh(){
  if(document.getElementById('mw-sync-update'))return;
  const notice=document.createElement('div');notice.id='mw-sync-update';notice.setAttribute('role','status');
  notice.style.cssText='position:fixed;top:calc(env(safe-area-inset-top) + 12px);left:16px;right:16px;max-width:560px;margin:auto;z-index:80;padding:12px 16px;border-radius:16px;background:var(--card);color:var(--text);border:1px solid var(--div);box-shadow:0 4px 20px #0004;display:flex;align-items:center;gap:12px;font-size:13px';
  const text=document.createElement('span');text.textContent='Updates from another device are ready.';text.style.flex='1';notice.append(text);
  const button=document.createElement('button');button.className='btn';button.textContent='Show updates';notice.append(button);
  const dismiss=document.createElement('button');dismiss.className='btn ghost';dismiss.textContent='×';dismiss.setAttribute('aria-label','Dismiss update notice');notice.append(dismiss);
  dismiss.onclick=()=>notice.remove();
  button.onclick=()=>{if(document.querySelector('.modal,[contenteditable]:focus,textarea:focus,input:focus,select:focus')){text.textContent='Finish editing or close the open panel to show updates.';return;}notice.remove();navApply(navDesc());};
  document.body.append(notice);
}
