/* Account-scoped sync. The legacy devotional state remains usable offline. */
window.MyWalkCloud = function(adapter) {
  const cfg=window.MYWALK_SYNC_CONFIG||{}, key='mywalk_cloud_v1';
  let meta={}; try{meta=JSON.parse(localStorage.getItem(key)||'{}')||{};}catch(e){}
  let client, user, busy=false, timer, conflict, panelElement;
  let status='Sign in to sync your devices.';
  const snapshot=()=>JSON.parse(JSON.stringify(adapter.snapshot()));
  const persist=()=>localStorage.setItem(key,JSON.stringify(meta));
  const notify=message=>{ status=message; const el=document.getElementById('cloud-status'); if(el) el.textContent=message; };
  const configured=()=>!!(cfg.url&&cfg.publishableKey);
  function changed(){ clearTimeout(timer); timer=setTimeout(sync,1200); }
  function apply(data){
    if(MyWalkMerge.equal(snapshot(),data)) return;
    adapter.apply(data);
    if(!document.querySelector('textarea:focus, input:focus, .modal')) adapter.refresh();
    else notify('Synced. Reopen this page to see updates from your other devices.');
  }
  async function sync(){
    if(!client||!user||busy||conflict||document.querySelector('.modal:not([data-cloud-panel])')) return;
    if(!navigator.onLine){ notify('Saved on this device. Will sync when you reconnect.'); return; }
    busy=true;
    try {
      for(let attempt=0;attempt<4;attempt++) {
        const {data:remote,error}=await client.from('mywalk_sync').select('data,revision').eq('user_id',user.id).maybeSingle();
        if(error) throw error;
        if(!user) return;
        const local=snapshot();
        // First sign-in never guesses which pre-existing device is authoritative.
        const result=remote ? (meta.base ? MyWalkMerge.merge(meta.base,local,remote.data) :
          (MyWalkMerge.equal(local,remote.data)?{data:local,conflicts:[]}:{data:local,conflicts:['Existing device data']})) : {data:local,conflicts:[]};
        if(result.conflicts.length){
          conflict=remote;
          notify('Both devices have changes. Open Sync to review before continuing.');
          return;
        }
        if(remote&&MyWalkMerge.equal(result.data,remote.data)){
          meta.base=remote.data; persist(); apply(remote.data); notify('All changes synced.'); return;
        }
        const {data:revision,error:writeError}=await client.rpc('mywalk_save',{expected_revision:remote?.revision||0,new_data:result.data});
        if(writeError) throw writeError;
        if(revision===null) continue;
        meta.base=result.data; persist();
        // Preserve edits made while the request was in flight.
        const latest=MyWalkMerge.merge(local,snapshot(),result.data);
        if(latest.conflicts.length){ changed(); return; }
        apply(latest.data);
        notify(MyWalkMerge.equal(latest.data,result.data)?'All changes synced.':'Saving your latest changes…');
        if(!MyWalkMerge.equal(latest.data,result.data)) changed();
        return;
      }
      notify('Another device is saving. Will retry shortly.'); changed();
    } catch(e){ notify('Saved on this device. Sync could not finish: '+e.message); }
    finally{busy=false;}
  }
  function download(data,label){
    const a=document.createElement('a'), url=URL.createObjectURL(new Blob([JSON.stringify({_app:'MY WALK',data},null,2)],{type:'application/json'}));
    a.href=url; a.download='mywalk-'+label+'-'+Date.now()+'.json'; a.click(); setTimeout(()=>URL.revokeObjectURL(url),1000);
  }
  async function resolve(useCloud){
    if(!conflict||busy) return;
    // Retain a local recovery copy BEFORE any explicit replacement.
    localStorage.setItem('mywalk_before_sync_choice',JSON.stringify({local:snapshot(),cloud:conflict.data,saved:new Date().toISOString()}));
    if(useCloud) apply(conflict.data);
    meta.base=conflict.data; persist(); conflict=null;
    await sync(); panel();
  }
  function panel(){
    if(panelElement) panelElement.remove();
    panelElement=adapter.modal(`<div class="sheet-h">Sync your devices</div>
      <p class="small">Your notes, prayers, study and reading progress travel with you.</p>
      <p id="cloud-status" class="small" role="status" aria-live="polite"></p>
      ${!configured()?'<p class="small">Cloud sync is waiting for the one-time account setup. Your entries are still saved on this device.</p>':
      user?`<p class="small">Signed in as ${adapter.escape(user.email||'')}</p><div class="btnrow"><button class="btn solid" id="cloud-now">Sync now</button><button class="btn ghost" id="cloud-out">Sign out</button></div>`:
      '<label class="small" for="cloud-email">Email address</label><input id="cloud-email" type="email" autocomplete="email" class="input" placeholder="you@example.com"><button class="btn solid" id="cloud-login">Email me a sign-in code</button><label class="small" for="cloud-code">Code from your email</label><input id="cloud-code" inputmode="numeric" autocomplete="one-time-code" class="input"><button class="btn ghost" id="cloud-verify">Sign in</button>'}
      ${conflict?'<p class="small">This device and the cloud have different entries. Download both copies before choosing which complete version to keep. A recovery copy is also saved on this device.</p><div class="btnrow"><button class="btn ghost" id="cloud-copies">Download both copies</button><button class="btn solid" id="cloud-use">Use cloud version</button><button class="btn ghost" id="cloud-keep">Use this device’s version</button></div>':''}
      <p class="tiny">Edits save offline and sync when you reconnect. Sign in with the same email on your phone, iPad and laptop.</p>`);
    panelElement.dataset.cloudPanel='true';
    notify(status);
    const bind=(id,fn)=>{const el=document.getElementById(id);if(el) el.onclick=async()=>{el.disabled=true;try{await fn();}catch(e){notify(e.message);}finally{el.disabled=false;}};};
    bind('cloud-now',async()=>{await sync();panel();});
    bind('cloud-login',async()=>{
      if(!client) throw new Error('Connect to the internet and reopen the app to sign in.');
      const email=document.getElementById('cloud-email'); if(!email.reportValidity()||!email.value.trim()) return;
      const {error}=await client.auth.signInWithOtp({email:email.value.trim()});if(error) throw error;notify('Check your email, then enter the code below.');
    });
    bind('cloud-verify',async()=>{
      if(!client) throw new Error('Connect to the internet to sign in.');
      const {data,error}=await client.auth.verifyOtp({email:document.getElementById('cloud-email').value.trim(),token:document.getElementById('cloud-code').value.trim(),type:'email'});
      if(error) throw error; await session(data.session); panel();
    });
    bind('cloud-out',async()=>{if(busy) throw new Error('Wait for the current sync to finish.');const {error}=await client.auth.signOut();if(error)throw error;user=null;conflict=null;notify('Signed out. Your entries remain on this device.');panel();});
    bind('cloud-copies',()=>{download(snapshot(),'device');download(conflict.data,'cloud');});
    bind('cloud-use',()=>resolve(true)); bind('cloud-keep',()=>resolve(false));
  }
  async function session(value){
    const next=value?.user;
    if(!next){user=null;return;}
    if(meta.owner&&meta.owner!==next.id){
      await client.auth.signOut(); user=null;
      notify('This device’s entries belong to another account. Sign back into that account to sync.');return;
    }
    user=next;meta.owner=user.id;persist();await sync();
  }
  async function start(){
    if(!configured()) return;
    try {
      if(!window.supabase) throw new Error('Connect to the internet to enable sync.');
      client=window.supabase.createClient(cfg.url,cfg.publishableKey);
      client.auth.onAuthStateChange((event,value)=>{
        if(event==='SIGNED_OUT'){user=null;conflict=null;}
        else setTimeout(()=>session(value),0);
      });
      const {data,error}=await client.auth.getSession();if(error) throw error;await session(data.session);
      setInterval(()=>{if(document.visibilityState==='visible'&&!document.querySelector('textarea:focus,input:focus')) sync();},15000);
    }catch(e){notify('Sync unavailable: '+e.message);}
  }
  window.addEventListener('online',sync);
  document.addEventListener('visibilitychange',()=>{if(document.visibilityState==='visible')sync();});
  // A stale browser tab must reload local changes before it can save.
  window.addEventListener('storage',event=>{if(event.key===adapter.storageKey&&event.newValue) location.reload();});
  return {start,changed,panel};
};
