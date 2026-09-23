import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {Window} from 'happy-dom';
import {installProfileUI,agentProfile,CONTACT_LINKS,RESUME} from '../profile-ui.js';
import {ABOUT} from '../about-content.js';
import {PROJECTS} from '../projects.js';

function setup(){
  const window=new Window();globalThis.window=window;globalThis.document=window.document;
  document.body.innerHTML=readFileSync(new URL('../index.html',import.meta.url),'utf8');
  let entered=0,exited=0;const ui=installProfileUI({onEnter(){entered++;},onExit(){exited++;}});
  const dialog=document.querySelector('#profile-panel');
  dialog.showModal=function(){this.open=true;};dialog.close=function(){this.open=false;this.dispatchEvent(new window.Event('close'));};
  return {window,ui,dialog,get entered(){return entered;},get exited(){return exited;}};
}
test('About and Contact each offer human and agent views grounded in the existing profile',async()=>{
  const s=setup();
  for(const section of ['about','contact']){
    const trigger=document.querySelector(`[data-profile-section=${section}]`);trigger.click();assert.equal(s.ui.open,true);
    const textarea=document.querySelector('#agent-profile-text');assert.equal(textarea.value,agentProfile(section));
    document.querySelector('[data-profile-view=agent]').click();assert.equal(document.querySelector('#profile-agent').hidden,false);assert.equal(document.querySelector('#profile-human').hidden,true);
    const tab=document.querySelector('[role=tablist]');tab.dispatchEvent(new s.window.KeyboardEvent('keydown',{key:'ArrowLeft',bubbles:true}));assert.equal(document.querySelector('[data-profile-view=human]').getAttribute('aria-selected'),'true');
    if(section==='contact')for(const l of CONTACT_LINKS)assert.ok([...document.querySelectorAll('#profile-human a')].some(a=>a.href===l.url));
    assert.equal(document.querySelector('.profile-resume').getAttribute('href'),RESUME.file);assert.ok(agentProfile(section).includes(RESUME.url));
    document.querySelector('#close-profile').click();assert.equal(s.ui.open,false);assert.equal(document.activeElement,trigger);
  }
  assert.equal(s.entered,2);assert.equal(s.exited,2);
  for(const value of ['Kernel','Host','Currently','Languages.Programming'])assert.ok(agentProfile('about').includes(ABOUT.fields.find(f=>f.label===value).value));
  for(const p of Object.values(PROJECTS)){assert.ok(agentProfile('about').includes(p.title));for(const l of p.links)assert.ok(agentProfile('about').includes(l.href));}
  await s.window.happyDOM.close();
});
test('Copy uses the selected section, and denied clipboard access selects the text without claiming success',async()=>{
  const s=setup();let copied='';
  Object.defineProperty(globalThis,'navigator',{value:{clipboard:{async writeText(value){copied=value;}}},configurable:true});
  document.querySelector('[data-profile-section=about]').click();document.querySelector('[data-profile-view=agent]').click();
  const copy=document.querySelector('#copy-profile');copy.click();await Promise.resolve();assert.equal(copied,agentProfile('about'));assert.equal(copy.textContent,'Copied');
  s.dialog.close();document.querySelector('[data-profile-section=contact]').click();copy.click();await Promise.resolve();assert.equal(copied,agentProfile('contact'));
  navigator.clipboard.writeText=async()=>{throw Error('Denied');};copy.click();await Promise.resolve();await Promise.resolve();
  assert.match(document.querySelector('#profile-copy-status').textContent,/Text selected/);
  const text=document.querySelector('#agent-profile-text');assert.equal(text.selectionStart,0);assert.equal(text.selectionEnd,text.value.length);
  s.dialog.close();await s.window.happyDOM.close();
});
