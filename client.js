window.__chaterAdd=(text,user=false)=>{const messages=document.querySelector('#messages'),body=document.querySelector('#body');if(!messages)return;const e=document.createElement('div');e.className='message '+(user?'user':'');e.innerHTML='<div class="avatar">'+(user?'YU':'C')+'</div><div class="bubble">'+text.replace(/</g,'&lt;').replace(/\n/g,'<br>')+'</div>';messages.appendChild(e);body.scrollTop=body.scrollHeight};
document.querySelector('#input')?.addEventListener('keydown',e=>{if(e.key==='Enter'&&!e.shiftKey){e.preventDefault();document.querySelector('#send')?.click()}},true);

