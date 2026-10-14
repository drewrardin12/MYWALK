/* A real, pointer-operated handle for every app sheet, including account sheets. */
(function(root){
function shouldDismiss(distance,elapsed,height){
 const threshold=Math.min(140,Math.max(72,height*.2));
 return distance>=threshold||(distance>=28&&distance/Math.max(1,elapsed)>=.65);
}
function attach(modal){
 const box=modal.querySelector('.mbox');if(!box||box.querySelector('.mw-sheet-handle'))return;
 const opener=document.activeElement,handle=document.createElement('button');
 handle.type='button';handle.className='mw-sheet-handle';handle.setAttribute('aria-label','Close sheet');handle.title='Drag down to close';
 handle.innerHTML='<span aria-hidden="true"></span>';box.prepend(handle);
 let drag=null,suppressClick=false,closing=false;
 const reduced=()=>root.matchMedia('(prefers-reduced-motion: reduce)').matches;
 function restore(){box.style.transition=reduced()?'none':'transform 180ms ease-out';box.style.transform='';modal.style.opacity='';}
 function dismiss(){if(closing)return;closing=true;const remove=()=>{modal.remove();if(opener?.isConnected)opener.focus({preventScroll:true});};if(reduced())return remove();box.style.animation='none';box.style.transition='transform 180ms ease-in';box.style.transform=`translateY(${box.getBoundingClientRect().height+32}px)`;modal.style.transition='opacity 180ms ease-in';modal.style.opacity='0';setTimeout(remove,180);}
 handle.addEventListener('pointerdown',e=>{if(closing||!e.isPrimary||(e.pointerType==='mouse'&&e.button!==0))return;drag={id:e.pointerId,y:e.clientY,start:performance.now(),distance:0};box.style.animation='none';box.style.transition='none';handle.setPointerCapture(e.pointerId);e.preventDefault();});
 handle.addEventListener('pointermove',e=>{if(!drag||e.pointerId!==drag.id)return;drag.distance=Math.max(0,e.clientY-drag.y);box.style.transform=`translateY(${drag.distance}px)`;modal.style.opacity=String(Math.max(.4,1-drag.distance/Math.max(1,box.getBoundingClientRect().height)));});
 function finish(e,cancelled){if(!drag||e.pointerId!==drag.id)return;const d=drag;drag=null;suppressClick=d.distance>5;if(handle.hasPointerCapture(e.pointerId))handle.releasePointerCapture(e.pointerId);if(!cancelled&&shouldDismiss(d.distance,performance.now()-d.start,box.getBoundingClientRect().height))dismiss();else restore();if(suppressClick)setTimeout(()=>{suppressClick=false;},250);}
 handle.addEventListener('pointerup',e=>finish(e,false));handle.addEventListener('pointercancel',e=>finish(e,true));handle.addEventListener('lostpointercapture',e=>{if(drag)finish(e,true);});
 handle.addEventListener('click',e=>{if(suppressClick){e.preventDefault();return;}dismiss();});
 box.addEventListener('keydown',e=>{if(e.key==='Escape'&&Array.from(document.querySelectorAll('.modal')).at(-1)===modal){e.preventDefault();dismiss();}});
}
root.MyWalkSheets={attach,shouldDismiss};
})(globalThis);
