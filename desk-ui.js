import {PROJECTS} from './projects.js';
import {createProjectScreens,PROJECT_SUMMARIES} from './project-screens.js';
const esc=value=>String(value).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
export function installDeskUI(world,{onEnter,onExit}){
  const dialog=document.createElement('dialog');dialog.id='desk-view';dialog.setAttribute('aria-label','Dheer’s project desktop');
  dialog.innerHTML='<div class="desk-controls"><div class="desk-actions"><button class="desk-home">All projects</button><button class="desk-prev" aria-label="Previous project">←</button><span class="desk-project-name" aria-live="polite">Desktop</span><button class="desk-next" aria-label="Next project">→</button><button class="leave-desk">Leave desk <kbd>Esc</kbd></button></div></div><div class="visually-hidden desk-accessible"><h2>Projects on the desktop</h2><div class="desk-project-grid"></div><div class="desk-project-document" tabindex="0"></div></div>';
  document.body.append(dialog);let entered=false,wasBusy=false,drag=null;
  const entries=Object.entries(PROJECTS),grid=dialog.querySelector('.desk-project-grid'),documentPanel=dialog.querySelector('.desk-project-document');
  function openLink(url){const a=document.createElement('a');a.href=url;a.target='_blank';a.rel='noopener noreferrer';a.click();}
  function desktop(){
    dialog.dataset.display='desktop';dialog.querySelector('.desk-project-name').textContent='Desktop';documentPanel.replaceChildren();
    for(const b of grid.children)b.setAttribute('aria-pressed','false');
    dialog.querySelector('.desk-prev').disabled=true;dialog.querySelector('.desk-next').disabled=true;
  }
  function announce(index){
    const [id,p]=entries[index],link=p.links.find(l=>l.href.includes('github.com'))||p.links[0];
    dialog.dataset.display='project';dialog.querySelector('.desk-project-name').textContent=p.title;
    documentPanel.innerHTML='<h3>'+esc(p.title)+'</h3><p>'+esc(PROJECT_SUMMARIES[id])+'</p><img src="'+esc(p.img)+'" alt="'+esc(p.title)+' preview" /><a href="'+esc(link.href)+'" target="_blank" rel="noopener noreferrer">'+(link.href.includes('github.com')?'View on GitHub':'Visit project')+'</a>';
    for(const b of grid.children)b.setAttribute('aria-pressed',String(b.dataset.project===id));
    dialog.querySelector('.desk-prev').disabled=index===0;dialog.querySelector('.desk-next').disabled=index===entries.length-1;
    world.desk.interact();
  }
  const screens=createProjectScreens(world.monitors,{onSelect:announce,onLink:openLink,onDesktop:desktop});
  entries.forEach(([id,p],i)=>{const b=document.createElement('button');b.dataset.project=id;b.textContent=p.title;b.onclick=()=>screens.select(i);grid.append(b);});
  dialog.querySelector('.desk-home').onclick=()=>screens.desktop();
  dialog.querySelector('.desk-prev').onclick=()=>screens.select(screens.selected-1);dialog.querySelector('.desk-next').onclick=()=>screens.select(screens.selected+1);
  function close(){if(dialog.open)dialog.close();world.desk.close();}
  dialog.querySelector('.leave-desk').onclick=close;dialog.addEventListener('cancel',e=>{e.preventDefault();close();});
  dialog.addEventListener('pointerdown',e=>{if(e.target!==dialog)return;drag={x:e.clientX,y:e.clientY};dialog.setPointerCapture?.(e.pointerId);});
  dialog.addEventListener('pointermove',e=>{if(e.target===dialog)dialog.style.cursor=screens.pointer(world.pickMonitor(e.clientX,e.clientY))?'pointer':'default';});
  dialog.addEventListener('pointerup',e=>{if(drag&&Math.hypot(e.clientX-drag.x,e.clientY-drag.y)<8)screens.pointer(world.pickMonitor(e.clientX,e.clientY),true);drag=null;});
  dialog.addEventListener('pointercancel',()=>drag=null);
  const keydown=e=>{
    if(!world.desk.busy)return;
    if(e.key==='Escape'){
      e.preventDefault();e.stopImmediatePropagation();
      if(dialog.open&&screens.phase!=='desktop')screens.desktop();else close();
    }else if(dialog.open&&['ArrowLeft','ArrowRight'].includes(e.key)){
      e.preventDefault();e.stopImmediatePropagation();
      screens.select(screens.phase==='desktop'?0:screens.selected+(e.key==='ArrowLeft'?-1:1));
    }
  };
  window.addEventListener('keydown',keydown);
  return {
    get busy(){return world.desk.busy;},get screens(){return screens;},
    launch(){
      if(world.activeRoom!=='bedroom'||!world.desk.open())return false;
      onEnter();entered=false;wasBusy=true;world.desk.focusMonitor('library');screens.wake();desktop();return true;
    },
    update(dt=0,reduced=false){
      if(!world.desk.busy){if(dialog.open)dialog.close();if(wasBusy){wasBusy=false;screens.sleep();onExit();}return;}
      screens.update(dt,reduced);dialog.classList.toggle('compact',window.innerWidth<760);
      if(world.desk.ready&&!entered){entered=true;dialog.showModal();dialog.querySelector('.leave-desk').focus();}
    },
    close,dispose(){screens.sleep();window.removeEventListener('keydown',keydown);dialog.remove();},
  };
}
