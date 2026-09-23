import * as THREE from './vendor/three.module.js';
import {createPrimitives} from './primitives.js';

export function addRacingSim(desk){
  const {group,box,cyl,material}=createPrimitives(desk);
  const wheel=group(-.43,1.275,.49);wheel.name='racing-yoke';
  // An open-top racing yoke with upright grips, paddle shifters and a button plate.
  box(.40,.12,.26,'#20272b',0,.055,-.10,wheel);box(.19,.13,.075,'#303a40',0,-.04,.035,wheel);
  const hub=group(0,.25,.055,wheel);hub.rotation.x=-.25;
  box(.40,.105,.065,'#283236',0,-.065,0,hub);box(.26,.10,.054,'#424c51',0,.014,0,hub);
  for(const side of [-1,1]){
    const grip=box(.076,.28,.098,'#171f22',side*.208,.018,0,hub);grip.rotation.z=-side*.12;
    cyl(.039,.039,.027,'#c4493b',side*.224,.161,0,hub,12);
    for(let i=0;i<4;i++)box(.016,.018,.102,'#353f42',side*.226,-.072+i*.052,0,hub);
  }
  const center=cyl(.083,.083,.058,'#232c30',0,0,.028,hub,20);center.rotation.x=Math.PI/2;
  const badge=cyl(.025,.025,.005,'#d6b45d',0,0,.061,hub,12);badge.rotation.x=Math.PI/2;
  for(const side of [-1,1]){
    box(.059,.16,.023,'#98a2a3',side*.135,.045,-.064,hub).rotation.z=-side*.12;
    for(let i=0;i<2;i++){const button=cyl(.018,.018,.015,i?'#d6b45d':'#c64635',side*(.115+i*.046),.011,.034,hub,12);button.rotation.x=Math.PI/2;}
  }
  const pedals=group(-.43,.04,.02);pedals.name='racing-pedals';
  box(.56,.06,.52,'#242b2e',0,0,0,pedals);box(.50,.035,.17,'#424a4b',0,.044,.16,pedals);
  for(const x of [-.135,.135]){
    const pedal=group(x,.13,-.06,pedals);pedal.rotation.x=-.48;
    box(.052,.19,.055,'#20272b',0,-.014,-.04,pedal);box(.135,.23,.023,'#9aabad',0,.04,0,pedal);
    for(let row=0;row<3;row++)for(const side of [-1,1])box(.028,.015,.008,'#3d494d',side*.035,-.025+row*.056,.016,pedal);
  }
  return {wheel,pedals};
}
