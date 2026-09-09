import { worldToIso } from '../camera.js';
import { ANIMATIONS, DIRECTIONS } from '../data/graphics.js';

function polygon(c, points, color, stroke) {
  c.beginPath(); points.forEach((p,i) => i ? c.lineTo(p.x,p.y) : c.moveTo(p.x,p.y)); c.closePath();
  c.fillStyle=color;c.fill();if(stroke){c.strokeStyle=stroke;c.lineWidth=1;c.stroke();}
}
function ellipse(c,x,y,rx,ry,color) {
  c.beginPath();c.ellipse(x,y,rx,ry,0,0,Math.PI*2);c.fillStyle=color;c.fill();
}
function actor(c, shape, color, state, frame, direction) {
  const phase=frame/4*Math.PI*2, bob=state==='walk'?Math.sin(phase)*1.5:state==='idle'?frame*0.5:0;
  c.save();
  if(state==='death'){c.translate(0,-3);c.rotate(Math.min(1,frame/3)*Math.PI/2);c.scale(1,1-frame*0.12);}
  if(state==='hurt')color='#f5a08b';
  const animal=shape==='rat'||shape==='wolf';
  const dx=direction==='east'?1:direction==='west'?-1:0;
  const dy=direction==='north'?-1:direction==='south'?1:0;
  if(animal){
    const size=shape==='rat'?7:12;
    ellipse(c,0,-7+bob,size,6,color);
    ellipse(c,dx*(size-1),-8+dy*4+bob,4,4,color);
    polygon(c,[{x:dx*(size-1)-3,y:-10+dy*4+bob},{x:dx*(size-1)-2,y:-16+dy*4+bob},{x:dx*(size-1)+1,y:-11+dy*4+bob}],color);
    c.strokeStyle=color;c.lineWidth=2;c.beginPath();c.moveTo(-dx*size,-6);c.lineTo(-dx*(size+7),-10-dy*6);c.stroke();
    c.fillStyle='#465146';c.fillRect(-5,-3,2,4+(state==='walk'?Math.sin(phase)*2:0));c.fillRect(4,-3,2,4-(state==='walk'?Math.sin(phase)*2:0));
  }else{
    c.fillStyle=color;c.fillRect(-6,-22+bob,12,17);
    ellipse(c,0,-27+bob,5,6,shape==='goblin'?'#abb77a':'#dec29a');
    c.fillStyle='#334136';c.fillRect(-5,-5,3,6+(state==='walk'?Math.sin(phase)*2:0));c.fillRect(2,-5,3,6-(state==='walk'?Math.sin(phase)*2:0));
    if(direction!=='north'){c.fillStyle='#28342e';c.fillRect(dx*3-1,-28+bob,2,2);}
    if(shape==='player'||state==='attack'){
      const swing=state==='attack'?frame*0.65:0;
      c.save();c.translate(8,-10+bob);c.rotate(swing);c.strokeStyle='#e5dfba';c.lineWidth=2;c.beginPath();c.moveTo(0,0);c.lineTo(4,-15);c.stroke();c.restore();
    }
  }
  if(state==='cast')ellipse(c,10,-22,4+frame,4+frame,'#8fd5eeaa');
  c.restore();
}
function object(c,shape) {
  if(shape==='tree'){
    ellipse(c,0,3,24,10,'#263d304b');c.fillStyle='#65513b';c.fillRect(-3,-38,6,38);
    for(let i=0;i<3;i++)polygon(c,[{x:-(28-i*6),y:-(25+i*19)},{x:0,y:-(66+i*18)},{x:28-i*6,y:-(25+i*19)}],['#304f3a','#3d5d41','#48694a'][i]);
  }else if(shape==='rock')polygon(c,[{x:-9,y:0},{x:-5,y:-10},{x:5,y:-12},{x:10,y:-1}],'#a3aaa1','#4b554b');
  else if(shape==='bush'){ellipse(c,0,-3,9,5,'#9db674');for(let i=-1;i<=1;i++)ellipse(c,i*5,-8,2.5,3,'#dac5db');}
  else if(shape==='fence'){
    c.strokeStyle='#ac9468';c.lineWidth=4;
    for(const y of [-9,-19]){c.beginPath();c.moveTo(-30,y-13);c.lineTo(30,y+13);c.stroke();}
    for(const x of [-28,0,28]){c.fillStyle='#7b6247';c.fillRect(x-2,x/2-28,4,30);}
  }else if(shape==='sign'){
    c.fillStyle='#795e3c';c.fillRect(-2,-27,4,28);c.fillStyle='#c0a174';c.fillRect(-15,-38,30,17);c.fillStyle='#554b36';c.fillRect(-9,-31,18,2);
  }else if(shape==='loot'){ellipse(c,0,0,9,4,'#cfb66e');polygon(c,[{x:0,y:-17},{x:5,y:-11},{x:0,y:-5},{x:-5,y:-11}],'#ffdc84');}
  else if(shape==='fireball'){ellipse(c,0,0,13,10,'#ed673977');ellipse(c,0,0,8,7,'#ffac4d');ellipse(c,-2,-1,4,4,'#fff1aa');}
  else if(shape==='hit'){
    c.strokeStyle='#fff0c1';c.lineWidth=3;
    for(let i=0;i<6;i++){const angle=i*Math.PI/3;c.beginPath();c.moveTo(Math.cos(angle)*5,Math.sin(angle)*5);c.lineTo(Math.cos(angle)*17,Math.sin(angle)*17);c.stroke();}
  }else if(shape==='heal'){
    c.strokeStyle='#b8ef9e';c.lineWidth=3;c.beginPath();c.ellipse(0,5,20,10,0,0,Math.PI*2);c.stroke();c.fillStyle='#d0ffc2';c.fillRect(-2,-17,4,15);c.fillRect(-7,-12,14,4);
  }
}
export function generatePlaceholder(definition, createCanvas, variant = {}) {
  const kind=definition.placeholder.kind;
  const rows=kind==='actor'?24:1,columns=kind==='actor'?4:1;
  const canvas=createCanvas(definition.frameWidth*columns,definition.frameHeight*rows),c=canvas.getContext('2d');
  if(kind==='actor'){
    for(const [state,clip] of Object.entries(ANIMATIONS))for(let row=0;row<4;row++)for(let frame=0;frame<4;frame++){
      c.save();c.translate(frame*definition.frameWidth+definition.anchor.x,(clip.row+row)*definition.frameHeight+definition.anchor.y);
      actor(c,definition.placeholder.shape,variant.color||definition.placeholder.color,state,frame,DIRECTIONS[row]);c.restore();
    }
  }else if(kind==='terrain'){
    const colors=definition.placeholder.colors,w=definition.frameWidth,h=definition.frameHeight;
    polygon(c,[{x:w/2,y:0},{x:w,y:h/2},{x:w/2,y:h},{x:0,y:h/2}],colors[(variant.index||0)%colors.length]);
    if(definition.furrows){c.strokeStyle='#acaa63';c.beginPath();c.moveTo(w*0.65,h*0.15);c.lineTo(w*0.15,h*0.65);c.stroke();}
  }else if(kind==='building'){
    const {w,h,roof,layer}=definition.placeholder,wallHeight=42;
    const point=(x,y,z=0)=>{const p=worldToIso(x,y,z);return{x:p.x+definition.anchor.x,y:p.y+definition.anchor.y};};
    const a=point(0,0,wallHeight),d=point(0,h,wallHeight),f=point(w,h,wallHeight),r=point(w,0,wallHeight);
    if(layer==='floor')polygon(c,[point(0,0),point(w,0),point(w,h),point(0,h)],'#817153');
    if(layer==='walls'){
      polygon(c,[d,f,point(w,h),point(0,h)],'#b6a782','#655d47');polygon(c,[f,r,point(w,0),point(w,h)],'#918768','#655d47');
      const door=point(w/2,h);c.fillStyle='#534b35';c.fillRect(door.x-6,door.y-22,12,22);
    }
    if(layer==='roof'){
      const peakA=point(w/2,0,wallHeight+25),peakB=point(w/2,h,wallHeight+25);
      polygon(c,[a,peakA,peakB,d],roof,'#3e4837');polygon(c,[peakA,r,f,peakB],roof,'#3e4837');polygon(c,[d,peakB,f],'#d1bd90','#645740');
    }
  }else{
    c.translate(definition.anchor.x,definition.anchor.y);object(c,definition.placeholder.shape);
  }
  return canvas;
}
