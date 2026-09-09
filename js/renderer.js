import { ENEMIES } from './data/definitions.js';
import { distance } from './config.js';
import { hour } from './world/world.js';
const GROUND={grass:['#526944','#576e47','#5c724a','#506641'],road:['#a49168'],water:['#34565d'],field:['#75643e','#847448']};
export class Renderer {
  constructor(canvas,camera) {this.ctx=canvas.getContext('2d');this.camera=camera;}
  polygon(points,color,stroke) {
    const ctx=this.ctx;ctx.beginPath();points.forEach((p,i)=>i?ctx.lineTo(p.x,p.y):ctx.moveTo(p.x,p.y));ctx.closePath();ctx.fillStyle=color;ctx.fill();
    if(stroke) {ctx.strokeStyle=stroke;ctx.lineWidth=1;ctx.stroke();}
  }
  ellipse(x,y,rx,ry,color) {const c=this.ctx;c.beginPath();c.ellipse(x,y,rx,ry,0,0,Math.PI*2);c.fillStyle=color;c.fill();}
  label(text,x,y,color='#eee9d8',size=11) {const c=this.ctx;c.font=`${size}px system-ui`;c.textAlign='center';c.lineWidth=3;c.strokeStyle='#14231ddc';c.strokeText(text,x,y);c.fillStyle=color;c.fillText(text,x,y);}
  draw(world) {
    const c=this.ctx,cam=this.camera,z=cam.zoom;
    c.setTransform(cam.dpr,0,0,cam.dpr,0,0);c.clearRect(0,0,cam.width,cam.height);c.fillStyle='#34565d';c.fillRect(0,0,cam.width,cam.height);
    const corners=[[0,-120],[cam.width,-120],[0,cam.height+120],[cam.width,cam.height+120]].map(([x,y])=>cam.unproject(x,y));
    const minX=Math.max(0,Math.floor(Math.min(...corners.map(p=>p.x)))-2),maxX=Math.min(world.map.width-1,Math.ceil(Math.max(...corners.map(p=>p.x)))+2);
    const minY=Math.max(0,Math.floor(Math.min(...corners.map(p=>p.y)))-2),maxY=Math.min(world.map.height-1,Math.ceil(Math.max(...corners.map(p=>p.y)))+2);
    for(let y=minY;y<=maxY;y++) for(let x=minX;x<=maxX;x++) {
      const terrain=world.map.terrain[y][x],colors=GROUND[terrain],color=colors[(x*7+y*13)%colors.length];
      this.polygon([cam.project(x,y),cam.project(x+1,y),cam.project(x+1,y+1),cam.project(x,y+1)],color);
      if(terrain==='field') {const a=cam.project(x+0.3,y),b=cam.project(x+0.3,y+1);c.strokeStyle='#acaa63';c.beginPath();c.moveTo(a.x,a.y);c.lineTo(b.x,b.y);c.stroke();}
    }
    if(world.player.destination) {const p=cam.project(world.player.destination.x,world.player.destination.y);this.ellipse(p.x,p.y,9*z,4*z,'#ead79399');}
    const drawable=[...world.map.trees.map(e=>({e,type:'tree',depth:e.x+e.y})),...world.map.buildings.map(e=>({e,type:'building',depth:e.x+e.y+e.w+e.h-1})),
      ...world.map.resources.filter(e=>e.readyAt<=world.elapsed).map(e=>({e,type:'resource',depth:e.x+e.y})),...world.drops.map(e=>({e,type:'drop',depth:e.x+e.y})),
      ...world.npcs.map(e=>({e,type:'npc',depth:e.x+e.y})),...world.enemies.filter(e=>e.health>0).map(e=>({e,type:'enemy',depth:e.x+e.y})),{e:world.player,type:'player',depth:world.player.x+world.player.y}];
    drawable.sort((a,b)=>a.depth-b.depth);
    for(const {e,type} of drawable) {
      const p=cam.project(e.x,e.y);
      if(p.x< -300*z || p.x>cam.width+300*z || p.y< -50 || p.y>cam.height+260*z) continue;
      if(type==='building') this.building(e,world.player);
      else if(type==='tree') this.tree(e,world.player);
      else if(type==='resource') {
        if(e.kind==='ore') this.polygon([{x:p.x-9*z,y:p.y},{x:p.x-5*z,y:p.y-10*z},{x:p.x+5*z,y:p.y-12*z},{x:p.x+10*z,y:p.y-1*z}], '#a3aaa1','#4b554b');
        else {this.ellipse(p.x,p.y-3*z,9*z,5*z,'#9db674');for(let i=-1;i<=1;i++) this.ellipse(p.x+i*5*z,p.y-8*z,2.5*z,3*z,'#dac5db');}
      } else if(type==='drop') {this.ellipse(p.x,p.y,9*z,4*z,'#cfb66e');this.label('◆',p.x,p.y-8*z,'#ffdc84',13*z);}
      else this.character(e,type,world);
    }
    // A final outline preserves player visibility behind any foreground object.
    const p=cam.project(world.player.x,world.player.y);
    c.strokeStyle='#f5e9b7';c.lineWidth=1.5;c.beginPath();c.ellipse(p.x,p.y-15*z,6*z,12*z,0,0,Math.PI*2);c.stroke();
    for(const effect of world.effects) {
      const p=cam.project(effect.x,effect.y,35+(1-effect.life)*20);
      if(effect.ring) {c.strokeStyle=effect.ring;c.lineWidth=3;c.beginPath();c.ellipse(p.x,p.y+30*z,(1-effect.life)*48*z,(1-effect.life)*24*z,0,0,Math.PI*2);c.stroke();}
      else this.label(effect.text,p.x,p.y,effect.color,14);
    }
    const h=hour(world);if(h<6 || h>20) {c.fillStyle='#18234244';c.fillRect(0,0,cam.width,cam.height);}
  }
  tree(e,player) {
    const cam=this.camera,p=cam.project(e.x,e.y),z=cam.zoom,c=this.ctx;
    const pp=cam.project(player.x,player.y);
    c.save();if(Math.abs(pp.x-p.x)<35*z && pp.y<p.y+8*z && pp.y>p.y-100*z) c.globalAlpha=0.28;
    this.ellipse(p.x,p.y+3*z,24*z,10*z,'#263d304b');c.fillStyle='#65513b';c.fillRect(p.x-3*z,p.y-38*z,6*z,38*z);
    for(let i=0;i<3;i++) this.polygon([{x:p.x-(28-i*6)*z,y:p.y-(25+i*19)*z},{x:p.x,y:p.y-(66+i*18)*z},{x:p.x+(28-i*6)*z,y:p.y-(25+i*19)*z}],['#304f3a','#3d5d41','#48694a'][i]);c.restore();
  }
  building(b,player) {
    const cam=this.camera,c=this.ctx,z=cam.zoom,h=42;
    const a=cam.project(b.x,b.y,h),d=cam.project(b.x,b.y+b.h,h),f=cam.project(b.x+b.w,b.y+b.h,h),r=cam.project(b.x+b.w,b.y,h);
    const bottomD=cam.project(b.x,b.y+b.h),bottomF=cam.project(b.x+b.w,b.y+b.h),bottomR=cam.project(b.x+b.w,b.y);
    const pp=cam.project(player.x,player.y);
    c.save();if(pp.x> d.x-12*z && pp.x<r.x+12*z && pp.y> a.y-25*z && pp.y<bottomF.y+5*z) c.globalAlpha=0.3;
    this.polygon([d,f,bottomF,bottomD],'#b6a782','#655d47');this.polygon([f,r,bottomR,bottomF],'#918768','#655d47');
    const peakA=cam.project(b.x+b.w/2,b.y,h+25),peakB=cam.project(b.x+b.w/2,b.y+b.h,h+25);
    this.polygon([a,peakA,peakB,d],b.roof,'#3e4837');this.polygon([peakA,r,f,peakB],b.roof,'#3e4837');this.polygon([d,peakB,f],'#d1bd90','#645740');
    const door=cam.project(b.door.x,b.y+b.h);c.fillStyle='#534b35';c.fillRect(door.x-6*z,door.y-22*z,12*z,22*z);
    c.restore();const label=cam.project(b.x+b.w/2,b.y+b.h+0.6);this.label(b.name,label.x,label.y+12*z,'#f0dfb7',10);
  }
  character(e,type,world) {
    const cam=this.camera,c=this.ctx,z=cam.zoom,p=cam.project(e.x,e.y),enemy=type==='enemy',def=enemy?ENEMIES[e.kind]:null;
    this.ellipse(p.x,p.y+1*z,9*z,4*z,'#1a2b2870');
    if(world.player.targetId===e.id) {c.strokeStyle='#efcb78';c.lineWidth=2;c.beginPath();c.ellipse(p.x,p.y,15*z,7*z,0,0,Math.PI*2);c.stroke();}
    if(enemy && e.kind!=='goblin') {
      const size=e.kind==='rat'?7:12;this.ellipse(p.x,p.y-6*z,size*z,6*z,def.color);this.ellipse(p.x+7*z,p.y-8*z,4*z,4*z,def.color);
      c.strokeStyle=def.color;c.beginPath();c.moveTo(p.x-size*z,p.y-5*z);c.lineTo(p.x-(size+7)*z,p.y-9*z);c.stroke();
    } else {
      c.fillStyle=type==='player'?'#517f9b':e.color||def.color;c.fillRect(p.x-6*z,p.y-22*z,12*z,17*z);
      this.ellipse(p.x,p.y-27*z,5*z,6*z,enemy?'#abb77a':'#dec29a');c.fillStyle='#334136';c.fillRect(p.x-5*z,p.y-5*z,3*z,6*z);c.fillRect(p.x+2*z,p.y-5*z,3*z,6*z);
      if(type==='player') {c.strokeStyle='#e5dfba';c.lineWidth=2*z;c.beginPath();c.moveTo(p.x+8*z,p.y-9*z);c.lineTo(p.x+12*z,p.y-25*z);c.stroke();}
    }
    if(enemy) {
      if(e.aggro || world.player.targetId===e.id || e.health<def.health) {c.fillStyle='#2c332b';c.fillRect(p.x-15*z,p.y-38*z,30*z,4*z);c.fillStyle='#cd7966';c.fillRect(p.x-15*z,p.y-38*z,30*z*Math.max(0,e.health/def.health),4*z);this.label(def.name,p.x,p.y-44*z,'#eadabd',10);}
      if(world.player.sneaking && distance(e,world.player)<7) {const tip=cam.project(e.x+e.facing.x*0.8,e.y+e.facing.y*0.8);this.ellipse(tip.x,tip.y,3*z,2*z,'#e5c181');}
    } else if(type==='npc') this.label(e.name,p.x,p.y-40*z,'#ead9a6',10);
  }
}
