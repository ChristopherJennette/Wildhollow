import { worldToIso } from '../camera.js';
import { ANIMATIONS, DIRECTIONS } from '../data/graphics.js';
import { paintActor, paintObject, paintTerrain, paintBuilding } from './art.js';

export function generatePlaceholder(definition, createCanvas, variant = {}) {
  const kind=definition.placeholder.kind;
  const rows=kind==='actor'?24:1,columns=kind==='actor'?4:1;
  const canvas=createCanvas(definition.frameWidth*columns,definition.frameHeight*rows),c=canvas.getContext('2d');
  c.imageSmoothingEnabled=false;
  if(kind==='actor'){
    for(const [state,clip] of Object.entries(ANIMATIONS))for(let row=0;row<4;row++)for(let frame=0;frame<4;frame++){
      c.save();
      // Prevent a long weapon or falling pose from spilling into adjacent atlas cells.
      c.beginPath();c.rect(frame*definition.frameWidth,(clip.row+row)*definition.frameHeight,definition.frameWidth,definition.frameHeight);c.clip();
      c.translate(frame*definition.frameWidth+definition.anchor.x,(clip.row+row)*definition.frameHeight+definition.anchor.y);
      paintActor(c,definition.placeholder.shape,variant.color||definition.placeholder.color,state,frame,DIRECTIONS[row]);c.restore();
    }
  }else if(kind==='terrain')paintTerrain(c,definition,variant);
  else if(kind==='building')paintBuilding(c,definition,worldToIso);
  else{
    c.translate(definition.anchor.x,definition.anchor.y);paintObject(c,definition.placeholder.shape,variant.index||0);
  }
  return canvas;
}
