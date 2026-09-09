import { CONFIG, clamp } from '../config.js';
import { SKILLS, ABILITIES, ITEMS } from '../data/definitions.js';
import { createWorld } from '../world/world.js';
import { refreshAttributes, maxima } from './progression.js';
import { walkable } from './movement.js';

const finite=(n,fallback,min=0,max=1e9)=>Number.isFinite(n)?clamp(n,min,max):fallback;
export function saveGame(world,storage=localStorage) {
  try {
    const fields=['x','y','level','xp','points','skills','attributes','inventory','weapon','gold','abilities','cooldowns','explored','stealthEncounters','health','stamina','mana','penalty','recoverableHealth'];
    const player=Object.fromEntries(fields.map(key=>[key,world.player[key]]));
    const data={version:CONFIG.saveVersion,player,time:world.time,elapsed:world.elapsed,
      npcs:world.npcs.map(({id,x,y,state})=>({id,x,y,state})),
      enemies:world.enemies.map(({id,x,y,health,respawnAt,armorXP,generation,slowUntil,slowFactor})=>({id,x,y,health,respawnAt,armorXP,generation,slowUntil,slowFactor})),
      resources:world.map.resources.map(({id,readyAt})=>({id,readyAt})),drops:world.drops};
    storage.setItem(CONFIG.saveKey,JSON.stringify(data));return {ok:true};
  } catch {return {ok:false,error:'Saving unavailable. Check browser storage settings or free space.'};}
}
export function loadGame(storage=localStorage) {
  try {
    const raw=storage.getItem(CONFIG.saveKey);
    if(!raw) return {world:null};
    const data=JSON.parse(raw);
    if(data.version!==CONFIG.saveVersion) return {world:null,error:'This save version is not supported. Existing data has been preserved.'};
    if(!data.player || !data.player.skills || !data.player.inventory) throw new Error('Invalid save');
    const world=createWorld(),p=world.player,s=data.player;
    world.time=finite(data.time,world.time);world.elapsed=finite(data.elapsed,0);
    for(const id of Object.keys(SKILLS)) {
      p.skills[id]={level:Math.floor(finite(s.skills[id]?.level,1,1,100)),xp:finite(s.skills[id]?.xp,0,0,1e6)};
    }
    refreshAttributes(p);const max=maxima(p);
    for(const id of ['health','stamina','mana']) p[id]=finite(s[id],max[id],0,max[id]);
    for(const id of ['level','points','gold','xp','penalty','recoverableHealth']) p[id]=finite(s[id],p[id],id==='level'?1:0);
    p.level=Math.floor(p.level);p.points=Math.floor(p.points);
    if(Number.isFinite(s.x)&&Number.isFinite(s.y)&&walkable(world,s.x,s.y)) {p.x=s.x;p.y=s.y;}
    p.inventory={};for(const [id,n] of Object.entries(s.inventory)) if(ITEMS[id]&&Number.isFinite(n)&&n>=1) p.inventory[id]=Math.floor(Math.min(n,999999));
    p.weapon=ITEMS[s.weapon]?.type==='weapon'&&p.inventory[s.weapon]?s.weapon:'rustySword';
    if(!p.inventory[p.weapon]) p.inventory[p.weapon]=1;
    p.abilities=Array.isArray(s.abilities)?[...new Set(s.abilities.filter(id=>ABILITIES[id]))]:[];
    p.cooldowns={};for(const id of p.abilities) p.cooldowns[id]=finite(s.cooldowns?.[id],0,0,ABILITIES[id].cooldown);
    p.explored=Array.isArray(s.explored)?s.explored.filter(v=>typeof v==='string').slice(0,200):[];
    p.stealthEncounters=Array.isArray(s.stealthEncounters)?s.stealthEncounters.filter(v=>typeof v==='string').slice(-200):[];
    for(const npc of world.npcs) {
      const saved=data.npcs?.find(n=>n.id===npc.id);
      if(saved && Number.isFinite(saved.x)&&Number.isFinite(saved.y)&&walkable(world,saved.x,saved.y)) {npc.x=saved.x;npc.y=saved.y;npc.state=saved.state==='work'?'work':'home';}
    }
    for(const enemy of world.enemies) {
      const saved=data.enemies?.find(e=>e.id===enemy.id);if(!saved) continue;
      enemy.health=finite(saved.health,enemy.health,0,enemy.health);
      enemy.slowUntil=finite(saved.slowUntil,0);enemy.slowFactor=finite(saved.slowFactor,1,0.1,1);
      enemy.respawnAt=finite(saved.respawnAt,0);enemy.armorXP=finite(saved.armorXP,0,0,20);enemy.generation=finite(saved.generation,0);
      if(Number.isFinite(saved.x)&&Number.isFinite(saved.y)&&walkable(world,saved.x,saved.y)) {enemy.x=saved.x;enemy.y=saved.y;}
    }
    for(const node of world.map.resources) node.readyAt=finite(data.resources?.find(r=>r.id===node.id)?.readyAt,0);
    world.drops=Array.isArray(data.drops)?data.drops.filter(d=>ITEMS[d.item]&&typeof d.id==='string'&&Number.isFinite(d.quantity)&&d.quantity>0&&Number.isFinite(d.x)&&Number.isFinite(d.y)&&walkable(world,d.x,d.y)).slice(0,500):[];
    return {world};
  } catch {return {world:null,error:'The save could not be read. Reset Progress can clear it.'};}
}
export function resetSave(storage=localStorage) {
  try {storage.removeItem(CONFIG.saveKey);return true;} catch {return false;}
}
