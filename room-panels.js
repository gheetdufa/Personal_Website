import {READING_LIST} from './reading-list.js';

export function installRoomPanels({world,onEnter,onExit}){
  const library=document.createElement('dialog');library.id='reading-room';library.setAttribute('aria-labelledby','reading-title');
  library.innerHTML=`<header class="reading-header"><h2 id="reading-title">Hand-picked by me.</h2><button class="leave-library" aria-label="Close bookshelf">×</button></header><div class="shelf-books" role="group" aria-label="Books on the shelf"></div><div class="reading-controls"><p class="reading-hint" aria-live="polite">Choose a book from the shelf</p><div class="reading-actions" hidden><button class="shelf-back" aria-label="Return book to shelf">Back to shelf</button><button class="reading-prev" aria-label="Previous book">←</button><a class="reading-source" target="_blank" rel="noopener noreferrer">Read paper ↗</a><button class="reading-next" aria-label="Next book">→</button></div></div><article class="visually-hidden reading-accessible" aria-live="polite"><h3></h3><p></p></article>`;
  document.body.append(library);
  const collection=library.querySelector('.shelf-books'),hint=library.querySelector('.reading-hint'),actions=library.querySelector('.reading-actions'),source=library.querySelector('.reading-source'),accessible=library.querySelector('.reading-accessible');
  let wasBusy=false,entered=false,lastSelected=null,wasBrowsing=false;
  const buttons=READING_LIST.map((book,index)=>{
    const button=document.createElement('button');button.className='shelf-book';button.setAttribute('aria-label',book.title);button.title=book.title;
    button.onpointerenter=()=>{world.library.hover(index);hint.textContent=book.title;};button.onpointerleave=()=>{world.library.hover(null);hint.textContent='Choose a book from the shelf';};
    button.onfocus=()=>{world.library.hover(index);hint.textContent=book.title;};button.onblur=()=>world.library.hover(null);
    button.onclick=()=>select(index);collection.append(button);return button;
  });
  function select(index){
    if(!world.library.select(index))return;
    if(index!==null){const book=READING_LIST[index];lastSelected=index;source.href=book.url;source.textContent=book.year==='Book'?'Read the book ↗':'Read the paper ↗';accessible.querySelector('h3').textContent=book.title;accessible.querySelector('p').textContent=book.author+'. '+book.description;}
    sync();if(index!==null)library.querySelector('.shelf-back').focus();
  }
  function close(){if(library.open)library.close();world.library.close();}
  function back(){if(world.library.selected!==null||world.library.state.current!==null)select(null);else close();}
  library.querySelector('.leave-library').onclick=close;
  library.querySelector('.shelf-back').onclick=back;
  library.querySelector('.reading-prev').onclick=()=>select((world.library.selected+READING_LIST.length-1)%READING_LIST.length);
  library.querySelector('.reading-next').onclick=()=>select((world.library.selected+1)%READING_LIST.length);
  library.addEventListener('cancel',e=>{e.preventDefault();back();});
  source.addEventListener('click',e=>{if(!world.library.bookReady)e.preventDefault();});
  function keydown(e){
    if(!world.library.busy)return;
    if(e.key==='Escape'){e.preventDefault();e.stopImmediatePropagation();back();}
    else if(world.library.ready&&['ArrowLeft','ArrowRight','ArrowUp','ArrowDown'].includes(e.key)){
      e.preventDefault();e.stopImmediatePropagation();const delta=e.key==='ArrowLeft'||e.key==='ArrowUp'?-1:1;
      if(world.library.selected!==null)select((world.library.selected+delta+READING_LIST.length)%READING_LIST.length);
      else{const index=buttons.indexOf(document.activeElement);buttons[(index+delta+READING_LIST.length)%READING_LIST.length].focus();}
    }
  }
  window.addEventListener('keydown',keydown);
  function sync(){
    const browsing=world.library.selected===null&&world.library.state.current===null;
    collection.hidden=!browsing;hint.hidden=!browsing;actions.hidden=world.library.selected===null;
    source.setAttribute('aria-disabled',String(!world.library.bookReady));source.tabIndex=world.library.bookReady?0:-1;
    if(browsing){
      const surfaces=world.bookSurfaces();
      buttons.forEach((button,i)=>{const pts=surfaces[i],xs=pts.map(p=>p.x),ys=pts.map(p=>p.y);Object.assign(button.style,{left:Math.min(...xs)+'px',top:Math.min(...ys)+'px',width:(Math.max(...xs)-Math.min(...xs))+'px',height:(Math.max(...ys)-Math.min(...ys))+'px'});});
      if(!wasBrowsing&&lastSelected!==null)buttons[lastSelected].focus();
    }
    wasBrowsing=browsing;
  }
  return {get open(){return world.library.busy;},show(kind){if(kind!=='library'||world.activeRoom!=='living'||!world.library.open())return false;onEnter();wasBusy=true;entered=false;lastSelected=null;wasBrowsing=false;hint.textContent='Choose a book from the shelf';return true;},update(){
    if(!world.library.busy){if(library.open)library.close();if(wasBusy){wasBusy=false;onExit();}return;}
    if(world.library.ready&&!entered){entered=true;library.showModal();library.querySelector('.leave-library').focus();}
    if(library.open)sync();
  },close,dispose(){world.library.reset();if(wasBusy)onExit();window.removeEventListener('keydown',keydown);library.remove();}};
}
