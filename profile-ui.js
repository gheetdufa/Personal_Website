import {ABOUT} from './about-content.js';
import {PROJECTS} from './projects.js';

const field=label=>ABOUT.fields.find(f=>f.label===label);
export const RESUME={file:'./assets/Resume_2025.pdf',url:'https://dheerguda.com/assets/Resume_2025.pdf'};
export const CONTACT_LINKS=[
  {label:'Email',text:field('Email.Personal').value,url:field('Email.Personal').links[0].href},
  {label:'LinkedIn',text:'Dheer Guda',url:field('LinkedIn').links[0].href},
  {label:'GitHub',text:field('GitHub').value,url:field('GitHub').links[0].href},
  {label:'Website',text:'dheerguda.com',url:ABOUT.source},
];
export function agentProfile(section){
  if(section==='contact')return '# Contact Dheer Guda\n\n'+CONTACT_LINKS.map(l=>`${l.label}: ${l.url.replace(/^mailto:/,'')}`).join('\n')+'\nRésumé (PDF): '+RESUME.url+'\n\nSource: '+ABOUT.source;
  return [
    '# Dheer Guda','',
    'Source: '+ABOUT.source,
    'Role: '+field('Kernel').value,
    'Education: '+field('Uptime').value,
    'Location: '+field('Host').value,
    'Experience: '+field('Experience').value,
    'Current work: '+field('Currently').value+' (https://synari.org/)',
    'Focus: '+field('Focus').value,
    'Programming languages: '+field('Languages.Programming').value,
    'Web and data: '+field('Languages.Computer').value,
    'Tools: '+field('IDE').value,
    'Interests: '+field('Hobbies.Software').value+'; '+field('Hobbies.Hardware').value,
    '', '## Projects',
    ...Object.values(PROJECTS).map(p=>'- '+p.title+': '+p.paragraphs[0].split(/(?<=\.)\s/)[0]+'\n  '+p.links.map(l=>l.href).join(' | ')),
    '',agentProfile('contact'),
  ].join('\n');
}

export function installProfileUI({canOpen=()=>true,onEnter=()=>{},onExit=()=>{}}={}){
  const dialog=document.querySelector('#profile-panel'),title=document.querySelector('#profile-title');
  const tabs=[...dialog.querySelectorAll('[data-profile-view]')],human=document.querySelector('#profile-human'),agent=document.querySelector('#profile-agent');
  const text=document.querySelector('#agent-profile-text'),status=document.querySelector('#profile-copy-status'),copy=document.querySelector('#copy-profile');
  const triggers=[...document.querySelectorAll('[data-profile-section]')];
  let section='about',view='human',opener=null,copyAttempt=0;
  function humanContent(){
    human.replaceChildren();
    if(section==='about'){
      const heading=document.createElement('h3');heading.textContent='I’m Dheer.';
      const bio=document.createElement('p');bio.textContent='A full-stack developer and junior at the University of Maryland, based in College Park. I build tools that help people, with a focus on accessibility, empathy, and practical impact.';
      const now=document.createElement('p');now.append('Currently building ');const link=document.createElement('a');link.href='https://synari.org/';link.textContent='Synari';link.target='_blank';link.rel='noopener noreferrer';now.append(link,' for clinicians.');
      const toolkit=document.createElement('p');toolkit.className='profile-toolkit';toolkit.textContent=field('Languages.Programming').value;
      human.append(heading,bio,now,toolkit);
    }else{
      const heading=document.createElement('h3');heading.textContent='Let’s talk.';human.append(heading);
      for(const l of CONTACT_LINKS){
        const link=document.createElement('a');link.className='contact-row';link.href=l.url;if(!l.url.startsWith('mailto:')){link.target='_blank';link.rel='noopener noreferrer';}
        const label=document.createElement('span');label.textContent=l.label;const value=document.createElement('strong');value.textContent=l.text;link.append(label,value);human.append(link);
      }
    }
  }
  function setView(value,focus=false){
    view=value;human.hidden=view!=='human';agent.hidden=view!=='agent';
    for(const t of tabs){const selected=t.dataset.profileView===view;t.setAttribute('aria-selected',String(selected));t.tabIndex=selected?0:-1;if(selected&&focus)t.focus();}
  }
  function open(value,trigger){
    if(dialog.open||!canOpen())return false;
    section=value;opener=trigger;title.textContent=section==='about'?'About me':'Contact me';
    status.textContent='';copy.textContent='Copy for ChatGPT';text.value=agentProfile(section);humanContent();
    const resume=document.createElement('a');resume.className='profile-resume';resume.href=RESUME.file;resume.target='_blank';resume.rel='noopener noreferrer';resume.textContent='View résumé ↗';resume.setAttribute('aria-label','View résumé (PDF, opens in a new tab)');human.append(resume);setView(view);
    onEnter();document.body.classList.add('profile-open');dialog.showModal();return true;
  }
  triggers.forEach(trigger=>trigger.addEventListener('click',()=>open(trigger.dataset.profileSection,trigger)));
  tabs.forEach(t=>t.addEventListener('click',()=>setView(t.dataset.profileView)));
  dialog.querySelector('[role=tablist]').addEventListener('keydown',event=>{
    if(!['ArrowLeft','ArrowRight','Home','End'].includes(event.key))return;
    event.preventDefault();setView(event.key==='Home'?'human':event.key==='End'?'agent':view==='human'?'agent':'human',true);
  });
  dialog.querySelector('#close-profile').addEventListener('click',()=>dialog.close());
  dialog.addEventListener('click',event=>{if(event.target!==dialog)return;const r=dialog.getBoundingClientRect();if(event.clientX<r.left||event.clientX>r.right||event.clientY<r.top||event.clientY>r.bottom)dialog.close();});
  dialog.addEventListener('close',()=>{copyAttempt++;document.body.classList.remove('profile-open');onExit();opener?.focus({preventScroll:true});});
  copy.addEventListener('click',async()=>{
    const attempt=++copyAttempt,payload=text.value;
    copy.textContent='Copy for ChatGPT';status.textContent='';
    try{
      await navigator.clipboard.writeText(payload);
      if(attempt!==copyAttempt)return;
      copy.textContent='Copied';status.textContent='Ready to paste into ChatGPT or another assistant.';
    }catch{
      if(attempt!==copyAttempt)return;
      text.focus();text.select();status.textContent='Text selected. Press ⌘C or Ctrl+C to copy.';
    }
  });
  return {get open(){return dialog.open;}};
}
