import { distance } from './config.js';
import { setDestination } from './systems/movement.js';
export function installInput(canvas,camera,getWorld,isPlaying,notify) {
  const pointers=new Map();let pinchDistance=0,gesture=false;
  const pinch=()=>{const p=[...pointers.values()];return Math.hypot(p[0].x-p[1].x,p[0].y-p[1].y);};
  canvas.addEventListener('pointerdown',event=>{
    if(!isPlaying()) return;
    canvas.setPointerCapture(event.pointerId);
    pointers.set(event.pointerId,{x:event.clientX,y:event.clientY,startX:event.clientX,startY:event.clientY});
    if(pointers.size===2) {gesture=true;pinchDistance=pinch();}
  });
  canvas.addEventListener('pointermove',event=>{
    const point=pointers.get(event.pointerId);if(!point) return;
    point.x=event.clientX;point.y=event.clientY;
    if(pointers.size===2) {const current=pinch();if(pinchDistance>0) camera.scale(current/pinchDistance);pinchDistance=current;}
  });
  canvas.addEventListener('pointerup',event=>{
    const point=pointers.get(event.pointerId);
    if(point && !gesture && Math.hypot(event.clientX-point.startX,event.clientY-point.startY)<14 && isPlaying()) select(event.clientX,event.clientY);
    pointers.delete(event.pointerId);if(!pointers.size) gesture=false;
  });
  canvas.addEventListener('pointercancel',()=>{pointers.clear();gesture=false;});
  canvas.addEventListener('wheel',event=>{event.preventDefault();if(isPlaying()) camera.scale(Math.exp(-event.deltaY*0.001));},{passive:false});
  function select(x,y) {
    const world=getWorld(),p=world.player;
    const candidates=[...world.enemies.filter(e=>e.health>0).map(e=>({e,type:'enemy'})),...world.npcs.map(e=>({e,type:'npc'})),...world.map.resources.filter(e=>e.readyAt<=world.elapsed).map(e=>({e,type:'resource'})),...world.drops.map(e=>({e,type:'drop'}))];
    let chosen=null,best=26;
    for(const candidate of candidates) {
      const screen=camera.project(candidate.e.x,candidate.e.y,candidate.type==='npc'?18:8);
      const d=Math.hypot(screen.x-x,screen.y-y);
      if(d<best) {chosen=candidate;best=d;}
    }
    world.interaction=null;p.path=[];p.destination=null;p.targetId=null;
    if(chosen?.type==='enemy') {p.targetId=chosen.e.id;p.chaseTimer=0;notify(`Target: ${chosen.e.kind}. ${p.sneaking?'Sneak behind it for Backstab.':'Approaching to attack.'}`);return;}
    if(chosen) {
      world.interaction={id:chosen.e.id,type:chosen.type};
      if(distance(p,chosen.e)>1.6 && !setDestination(world,p,chosen.e)) {world.interaction=null;notify('No clear route there.');}
      return;
    }
    const destination=camera.unproject(x,y);
    if(!setDestination(world,p,destination)) notify('That spot is blocked. Choose open ground.');
  }
}
