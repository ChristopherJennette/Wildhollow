import { ENEMIES } from './data/definitions.js';
import { SPRITES, TERRAIN, WORLD_OBJECTS, RESOURCE_SPRITES, BUILDINGS, EFFECTS } from './data/graphics.js';
import { SpriteManager, buildingSprite, entitySprite } from './graphics/sprites.js';
import { animationFor } from './graphics/animation.js';
import { distance } from './config.js';
import { hour } from './world/world.js';

export function compareDepth(a, b) {
  // Footprints keep a person in front of either facade ahead of the entire building.
  const af = a.e.footprint, bf = b.e.footprint;
  const aBehind = a.e.x + (af?.w || 0) <= b.e.x || a.e.y + (af?.h || 0) <= b.e.y;
  const bBehind = b.e.x + (bf?.w || 0) <= a.e.x || b.e.y + (bf?.h || 0) <= a.e.y;
  if ((af || bf) && aBehind !== bBehind) return aBehind ? -1 : 1;
  return a.depth - b.depth || a.order - b.order;
}
const onScreen = (bounds, camera) => bounds.right >= 0 && bounds.left <= camera.width && bounds.bottom >= 0 && bounds.top <= camera.height;

export class Renderer {
  constructor(canvas, camera, assets = new SpriteManager()) {
    this.ctx = canvas.getContext('2d'); this.camera = camera; this.assets = assets;
    this.world = null; this.staticEntries = []; this.actors = []; this.queue = [];
    this.records = new WeakMap(); this.tiles = {}; this.order = 0;
    for (const [id, definition] of Object.entries(SPRITES)) assets.register(id, definition);
    for(let index=0;index<3;index++)assets.register(`tree:variant:${index}`,SPRITES.tree,{index});
    for (const [id, definition] of Object.entries(TERRAIN)) {
      const sprite = SPRITES[definition.sprite], count = sprite.placeholder.colors.length;
      this.tiles[id] = Array.from({length:count},(_,index) => assets.register(`${id}:${index}`,sprite,{index}));
    }
  }
  prepare(world) {
    this.world = world; this.staticEntries.length = 0; this.actors.length = 0; this.records = new WeakMap(); this.order = 0;
    for (const entity of world.map.trees) this.staticEntries.push(this.record(entity,'object',WORLD_OBJECTS[entity.type || 'tree'].sprite));
    for (const entity of world.map.buildings) {
      const entry = this.record(entity,'building'); entry.layers = {};
      for (const layer of ['floor','walls','roof']) {
        const definition = buildingSprite(entity,layer,BUILDINGS[entity.type]?.layers[layer]);
        entry.layers[layer] = this.assets.register(`building:${entity.id}:${layer}:${entity.w}:${entity.h}:${entity.roof}`,definition);
      }
      entry.sprite = entry.layers.walls;
      this.staticEntries.push(entry);
    }
    for (const entity of world.map.resources) this.staticEntries.push(this.record(entity,'resource',RESOURCE_SPRITES[entity.kind]));
    this.actors.push(this.record(world.player,'player',entitySprite(world.player)));
    for (const entity of world.npcs) this.actors.push(this.record(entity,'npc',entitySprite(entity)));
    for (const entity of world.enemies) this.actors.push(this.record(entity,'enemy',entitySprite(entity)));
  }
  record(e, type, spriteId) {
    let entry = this.records.get(e);
    if (entry) return entry;
    entry = {e,type,depth:0,order:this.order++,x:0,y:0,sprite:null,overlays:[]};
    if (spriteId) {
      const definition = SPRITES[spriteId];
      entry.sprite = spriteId==='tree' ? this.assets.sprites.get(`tree:variant:${e.variant||0}`) : e.color ? this.assets.register(`${spriteId}:${e.color}`,definition,{color:e.color}) : this.assets.sprites.get(spriteId);
      for (const [index,layer] of (definition.layers || []).entries()) {
        if (SPRITES[layer.sprite]) entry.overlays.push(this.assets.register(`${spriteId}:layer:${index}`,{...SPRITES[layer.sprite],...layer}));
      }
    }
    this.records.set(e,entry); return entry;
  }
  position(entry) {
    const p = this.camera.project(entry.e.x,entry.e.y);
    entry.x = p.x; entry.y = p.y;
    entry.depth = entry.e.x + entry.e.y + ((entry.e.footprint?.w || 0) + (entry.e.footprint?.h || 0)) / 2;
    return entry;
  }
  visible(entry) {
    const cam = this.camera;
    if (entry.layers) {
      for (const sprite of Object.values(entry.layers)) if (onScreen(this.assets.bounds(sprite,entry.x,entry.y,cam.zoom),cam)) return true;
      return false;
    }
    if (onScreen(this.assets.bounds(entry.sprite,entry.x,entry.y,cam.zoom),cam)) return true;
    for (const sprite of entry.overlays) if (onScreen(this.assets.bounds(sprite,entry.x,entry.y,cam.zoom),cam)) return true;
    return false;
  }
  ellipse(x,y,rx,ry,color) {
    const c=this.ctx;c.beginPath();c.ellipse(x,y,rx,ry,0,0,Math.PI*2);c.fillStyle=color;c.fill();
  }
  label(text,x,y,color='#eee9d8',size=11) {
    const c=this.ctx;c.font=`${size}px system-ui`;c.textAlign='center';c.lineWidth=3;c.strokeStyle='#14231ddc';c.strokeText(text,x,y);c.fillStyle=color;c.fillText(text,x,y);
  }
  terrain(world) {
    const cam=this.camera,map=world.map;
    const corners=[cam.unproject(0,0),cam.unproject(cam.width,0),cam.unproject(0,cam.height),cam.unproject(cam.width,cam.height)];
    const minX=Math.max(0,Math.floor(Math.min(...corners.map(p=>p.x)))-1), maxX=Math.min(map.width-1,Math.ceil(Math.max(...corners.map(p=>p.x)))+1);
    const minY=Math.max(0,Math.floor(Math.min(...corners.map(p=>p.y)))-1), maxY=Math.min(map.height-1,Math.ceil(Math.max(...corners.map(p=>p.y)))+1);
    for(let y=minY;y<=maxY;y++) for(let x=minX;x<=maxX;x++) {
      const tiles=this.tiles[map.terrain[y][x]] || this.tiles.grass;
      const p=cam.project(x,y);
      this.assets.draw(this.ctx,tiles[(x*7+y*13)%tiles.length],p.x,p.y,cam.zoom);
    }
  }
  draw(world) {
    if(this.world!==world)this.prepare(world);
    const c=this.ctx,cam=this.camera,z=cam.zoom;
    c.setTransform(cam.dpr,0,0,cam.dpr,0,0);c.imageSmoothingEnabled=false;
    c.clearRect(0,0,cam.width,cam.height);c.fillStyle='#34565d';c.fillRect(0,0,cam.width,cam.height);
    this.terrain(world);this.queue.length=0;
    const player=this.position(this.records.get(world.player));
    for(const entry of this.staticEntries) {
      if(entry.type==='resource' && entry.e.readyAt>world.elapsed)continue;
      this.position(entry);if(!this.visible(entry))continue;
      if(entry.layers)this.assets.draw(c,entry.layers.floor,entry.x,entry.y,z);
      this.queue.push(entry);
    }
    for(const entry of this.actors) {
      if(entry.e.health<=0 && animationFor(entry.e).time>0.9)continue;
      this.position(entry);if(this.visible(entry))this.queue.push(entry);
    }
    for(const drop of world.drops) {
      const entry=this.position(this.record(drop,'drop','loot'));
      if(this.visible(entry))this.queue.push(entry);
    }
    this.queue.sort(compareDepth);
    for(const entry of this.queue) {
      if(entry.layers)this.building(entry,player);
      else if(['player','npc','enemy'].includes(entry.type))this.character(entry,world);
      else {
        const alpha=entry.type==='object' && this.occludes(entry,player)?0.28:1;
        this.assets.draw(c,entry.sprite,entry.x,entry.y,z,undefined,undefined,alpha);
      }
    }
    // Keep the player locatable even if a replacement has opaque overhanging pixels.
    if(this.queue.some(entry=>entry!==player && (entry.layers || entry.type==='object') && this.occludes(entry,player))){
      c.strokeStyle='#e1dfb7';c.lineWidth=1.5;c.beginPath();c.ellipse(player.x,player.y-24*z,8*z,22*z,0,0,Math.PI*2);c.stroke();
    }
    this.effects(world);
    const h=hour(world);if(h<6 || h>20){c.fillStyle='#18234244';c.fillRect(0,0,cam.width,cam.height);}
  }
  occludes(entry,player) {
    const bounds=this.assets.bounds(entry.layers?.roof || entry.sprite,entry.x,entry.y,this.camera.zoom);
    return compareDepth(player,entry)<0 && player.x>=bounds.left && player.x<=bounds.right && player.y>=bounds.top && player.y-30*this.camera.zoom<=bounds.bottom;
  }
  building(entry,player) {
    const c=this.ctx,z=this.camera.zoom,e=entry.e,occluded=this.occludes(entry,player);
    this.assets.draw(c,entry.layers.walls,entry.x,entry.y,z,undefined,undefined,occluded?0.3:(e.visual?.wallsOpacity ?? 1));
    if(!e.visual?.roofHidden)this.assets.draw(c,entry.layers.roof,entry.x,entry.y,z,undefined,undefined,occluded?0.25:(e.visual?.roofOpacity ?? 1));
    const label=this.camera.project(e.x+e.footprint.w/2,e.y+e.footprint.h+0.6);
    this.label(e.name,label.x,label.y+12*z,'#f0dfb7',10);
  }
  character(entry,world) {
    const e=entry.e,c=this.ctx,z=this.camera.zoom,p=entry,enemy=entry.type==='enemy',def=enemy?ENEMIES[e.kind]:null;
    const animation=animationFor(e);
    this.ellipse(p.x,p.y+z,9*z,4*z,'#1a2b2870');
    if(world.player.targetId===e.id){c.strokeStyle='#efcb78';c.lineWidth=2;c.beginPath();c.ellipse(p.x,p.y,15*z,7*z,0,0,Math.PI*2);c.stroke();}
    this.assets.draw(c,entry.sprite,p.x,p.y,z,animation,e.facing);
    for(const sprite of entry.overlays)this.assets.draw(c,sprite,p.x,p.y,z,animation,e.facing);
    if(enemy && e.health>0){
      if(e.aggro || world.player.targetId===e.id || e.health<def.health){
        c.fillStyle='#2c332b';c.fillRect(p.x-15*z,p.y-38*z,30*z,4*z);c.fillStyle='#cd7966';c.fillRect(p.x-15*z,p.y-38*z,30*z*Math.max(0,e.health/def.health),4*z);
        this.label(def.name,p.x,p.y-44*z,'#eadabd',10);
      }
      if(world.player.sneaking && distance(e,world.player)<7){const tip=this.camera.project(e.x+e.facing.x*0.8,e.y+e.facing.y*0.8);this.ellipse(tip.x,tip.y,3*z,2*z,'#e5c181');}
    }else if(entry.type==='npc')this.label(e.name,p.x,p.y-40*z,'#ead9a6',10);
  }
  effects(world) {
    const c=this.ctx,cam=this.camera,z=cam.zoom;
    for(const effect of world.effects) {
      const progress=Math.min(1,effect.age/effect.lifetime);
      const x=effect.to?effect.x+(effect.to.x-effect.x)*progress:effect.x;
      const y=effect.to?effect.y+(effect.to.y-effect.y)*progress:effect.y;
      const p=cam.project(x,y,effect.type==='text'?35+progress*20:effect.type==='projectile'?20:15);
      if(p.x< -60||p.x>cam.width+60||p.y< -60||p.y>cam.height+60)continue;
      if(effect.type==='text')this.label(effect.text,p.x,p.y,effect.color,14);
      else if(effect.type==='ring'){
        c.save();c.globalAlpha=1-progress;c.strokeStyle=effect.color;c.lineWidth=3;c.beginPath();c.ellipse(p.x,p.y+15*z,(8+progress*40)*z,(4+progress*20)*z,0,0,Math.PI*2);c.stroke();c.restore();
      }else{
        const sprite=this.assets.sprites.get(EFFECTS[effect.type]?.sprite);
        if(sprite)this.assets.draw(c,sprite,p.x,p.y,z,{state:'idle',time:effect.age},undefined,1-progress*0.7);
      }
    }
  }
}
