// Room geometry and navigation share these locations, including the doorway.
export const DOOR = {x:2.65,z:-3.82,width:1.34,height:2.82,rotation:0,axis:'z',sign:-1};
export const BEDROOM_DOOR = {x:3.82,z:2.55,width:1.34,height:2.82,rotation:Math.PI/2,axis:'x',sign:1};
export const obstacles = [
  {minX:-3.56,maxX:-.64,minZ:-1.46,maxZ:2.85}, // bed and draped blanket
  {minX:-3.24,maxX:-2.36,minZ:2.73,maxZ:3.51}, // bedside table
  {minX:2.42,maxX:2.88,minZ:2.98,maxZ:3.44}, // lamp to the left of the doorway
  {minX:-1.98,maxX:-1.48,minZ:-3.68,maxZ:-3.18}, // racecar reading lamp
  {minX:.01,maxX:3.19,minZ:-2.28,maxZ:-1.10}, // desk
  {minX:.89,maxX:1.98,minZ:-.28,maxZ:.86}, // gaming chair
  {minX:2.99,maxX:3.78,minZ:-2.27,maxZ:-.78}, // PC and side shelves
  {minX:3.03,maxX:3.57,minZ:-.68,maxZ:-.13}, // wastebasket
];
export const stations = {
  gallery:{label:'View the wall gallery',shortLabel:'Wall gallery',icon:'▧',position:{x:-1.95,z:3.24},anchor:{x:-3.70,y:4.08,z:1.63},type:'gallery',galleryGroup:'main'},
  prints:{label:'View the paintings by the window',shortLabel:'Window gallery',icon:'▧',position:{x:2.57,z:-.52},anchor:{x:3.13,y:4.15,z:-3.73},type:'gallery',galleryGroup:'small',hideHotspot:true},
  projects:{label:'Explore projects',shortLabel:'Projects',icon:'↗',position:{x:2.3,z:-.54},anchor:{x:1.38,y:2.40,z:-1.8},type:'panel',region:{minX:-.25,maxX:3.65,minZ:-1.1,maxZ:1.55}},
  'ferrari-rack':{label:'Cheer for Ferrari by the car collection',shortLabel:'Go Ferrari!',position:{x:-2.65,z:-3.21},anchor:{x:-2.71,y:3.45,z:-3.735},type:'cheer',hideHotspot:true},
  ferrari:{label:'Cheer for Ferrari',shortLabel:'Go Ferrari!',position:{x:-.65,z:-2.75},anchor:{x:-.67,y:1.87,z:-3.38},type:'cheer',hideHotspot:true},
  about:{label:'A little about me',shortLabel:'About me',icon:'☺',position:{x:-.20,z:1.3},anchor:{x:-2.05,y:2.02,z:.40},type:'panel'},
  door:{label:'Go to the living room',shortLabel:'Living room',icon:'→',position:{x:3.36,z:BEDROOM_DOOR.z},anchor:{x:BEDROOM_DOOR.x,y:3.25,z:BEDROOM_DOOR.z},type:'door',destination:'living'},
};
export const ROOMS = {
  bedroom:{title:'The bedroom',number:'01',caption:'A few of my favorite things.',door:BEDROOM_DOOR,obstacles,stations,spawn:{x:.3,z:2.3},arrival:{x:2.65,z:BEDROOM_DOOR.z}},
  living:{title:'The living room',number:'02',door:DOOR,caption:'A good place to stay a little longer.',spawn:{x:1.75,z:-1.65},arrival:{x:DOOR.x,z:-2.67},
    obstacles:[
      {minX:-3.64,maxX:-2.61,minZ:-1.72,maxZ:1.56}, // TV console
      {minX:-3.72,maxX:-2.53,minZ:2.04,maxZ:3.28}, // bamboo and radiator
      {minX:-3.64,maxX:-1.7,minZ:-3.67,maxZ:-2.74}, // bookcase
      {minX:-.44,maxX:1.6,minZ:-3.8,maxZ:-2.97}, // fireplace and hearth
      {minX:-1.04,maxX:1.21,minZ:-.83,maxZ:.63}, // coffee table
      {minX:-1.05,maxX:2.28,minZ:2.20,maxZ:3.49}, // sofa
      {minX:-1.91,maxX:-1.18,minZ:2.50,maxZ:3.29}, // side table
      {minX:-1.68,maxX:-.48,minZ:-3.65,maxZ:-2.64}, // pull-up station
    ],
    stations:{
      switch:{label:'Turn on the TV or change the game',shortLabel:'Change game',position:{x:-2.08,z:.24},anchor:{x:-2.68,y:1.6,z:-.40},type:'console',hideHotspot:true},
      pullup:{label:'Do a set of pull-ups',shortLabel:'Pull-ups',position:{x:-1.08,z:-2.14},anchor:{x:-1.08,y:2.64,z:-3.12},type:'exercise'},
      library:{label:'Read the bookshelf',shortLabel:'Reading shelf',position:{x:-2.12,z:-2.34},anchor:{x:-2.67,y:3.45,z:-3.05},type:'library'},
      couch:{label:'Sit on the couch',shortLabel:'Take a seat',position:{x:.615,z:1.68},anchor:{x:.615,y:1.40,z:2.845},type:'seat'},
      door:{label:'Go back to the bedroom',shortLabel:'Bedroom',icon:'←',position:{x:DOOR.x,z:-3.36},anchor:{x:DOOR.x,y:3.25,z:DOOR.z},type:'door',destination:'bedroom'}},
  },
};
export function doorDestination(roomId,position){
  const room=ROOMS[roomId];if(!room)return null;
  const door=room.door,along=door.axis==='x'?position.x:position.z,cross=door.axis==='x'?position.z:position.x,center=door.axis==='x'?door.z:door.x;
  return Math.abs(cross-center)<.46&&along*door.sign>3.20&&along*door.sign<=3.48?room.stations.door.destination:null;
}

export const COUCH_SEAT={x:.615,y:.35,z:2.56};
export const COUCH_EXIT={x:.615,y:.06,z:1.68};

// A broad desk region lets E work naturally beside the keyboard or chair.
export function interactionDistance(station,position){
  const r=station.region;if(r)return position.x>=r.minX&&position.x<=r.maxX&&position.z>=r.minZ&&position.z<=r.maxZ?.25:Infinity;
  return Math.hypot(position.x-station.position.x,position.z-station.position.z);
}
