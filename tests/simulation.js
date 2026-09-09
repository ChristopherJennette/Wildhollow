import { screenDirection } from '../js/camera.js';
import { createWorld } from '../js/world/world.js';
import { CONFIG, FORMULAS, distance } from '../js/config.js';
import { NPCS } from '../js/data/definitions.js';
import { findPath, setDestination, move, moveDirect, walkable } from '../js/systems/movement.js';
import { skillXP, characterXP, maxima } from '../js/systems/progression.js';
import { updateCombat, damageEnemy, respawnPlayer } from '../js/systems/combat.js';
import { unlock, useAbility } from '../js/systems/abilities.js';
import { trade, gather, useItem } from '../js/systems/inventory.js';
import { updateNPCs } from '../js/systems/npcSimulation.js';
import { saveGame, loadGame } from '../js/systems/save.js';
const assert=(condition,message)=>{if(!condition)throw new Error(message);};
const notify=()=>{};
export function runTests() {
  const results=[];
  const test=(name,fn)=>{try{fn();results.push(`PASS ${name}`);}catch(e){results.push(`FAIL ${name}: ${e.message}`);}};
  test('All spawns, resources, and NPC doors are walkable',()=>{
    const w=createWorld({legacy:true});for(const p of [w.player,...w.enemies,...w.npcs,...w.map.resources,...w.map.buildings.map(b=>b.door)])assert(walkable(w,p.x,p.y),p.id||JSON.stringify(p));
  });
  test('Continuous movement routes around solid buildings',()=>{
    const w=createWorld({legacy:true}),p=w.player;p.x=28;p.y=30;const goal={x:34,y:30};
    assert(findPath(w,p,goal).length>2,'Missing route around smithy');setDestination(w,p,goal);
    for(let i=0;i<600;i++){move(w,p,3,1/30);assert(walkable(w,p.x,p.y),'Entered obstacle');}
    assert(distance(p,goal)<0.1,'Did not reach destination');assert(!findPath(w,p,{x:30,y:30}).length,'Allowed blocked destination');
  });
  test('Skills grow attributes; character levels award ability points separately',()=>{
    const p=createWorld({legacy:true}).player;skillXP(p,'oneHanded',FORMULAS.skillXP(1));assert(p.skills.oneHanded.level===2,'Skill did not level');assert(p.attributes.Strength>8,'Attribute did not grow');assert(p.level===1,'Skill XP changed character level');
    characterXP(p,FORMULAS.characterXP(1));assert(p.level===2&&p.points===2,'No level point');skillXP(p,'oneHanded',1e9);assert(p.skills.oneHanded.level===100,'Skill cap failed');
  });
  test('Direct input follows screen directions without diagonal speed boosts',()=>{
    const up=screenDirection(0,-1),right=screenDirection(1,0);
    assert(up.x<0&&up.y<0&&right.x>0&&right.y<0,'Incorrect isometric mapping');
    assert(Math.abs(Math.hypot(...Object.values(screenDirection(1,1)))-1)<1e-9,'Diagonal speed boost');
    assert(Math.abs(Math.hypot(...Object.values(screenDirection(0.5,0)))-0.5)<1e-9,'Lost analog strength');
    const w=createWorld({legacy:true}),p=w.player,start={x:p.x,y:p.y};
    moveDirect(w,p,right,3,0.1);assert(Math.abs(distance(p,start)-0.3)<1e-9,'Wrong move speed');
    const stopped={x:p.x,y:p.y};moveDirect(w,p,{x:0,y:0},3,1);assert(distance(p,stopped)===0,'Did not stop');
    p.x=28.5;p.y=30;moveDirect(w,p,{x:1,y:0},3,2);
    assert(p.x<29&&walkable(w,p.x,p.y),'Passed through building');
  });
  test('Melee finds nearby hostiles without chasing distant selected enemies',()=>{
    const w=createWorld({legacy:true}),p=w.player,e=w.enemies[0];w.enemies=[e];e.x=35;e.y=37;e.spawn={x:35,y:37};
    updateCombat(w,1/30,notify);assert(e.health<34,'No automatic melee');
    for(let i=0;i<100&&e.health>0;i++)updateCombat(w,1/30,notify);
    assert(e.health<=0&&p.xp>0&&w.drops.length===1,'Combat progression failed');
    e.health=34;e.x=35;e.y=26;e.aggro=false;p.targetId=e.id;p.attackTimer=0;
    const start={x:p.x,y:p.y};updateCombat(w,1/30,notify);
    assert(distance(p,start)===0&&e.health===34,'Target selection caused chase or remote damage');
  });
  test('Melee honors selection, range, obstruction and stealth without stopping movement',()=>{
    const w=createWorld({legacy:true}),p=w.player,[a,b]=w.enemies;w.enemies=[a,b];
    a.x=35;a.y=36.6;b.x=35;b.y=37;a.spawn={x:a.x,y:a.y};b.spawn={x:b.x,y:b.y};p.targetId=b.id;
    updateCombat(w,1/30,notify);assert(b.health<34&&a.health===34,'Selected target not prioritized');
    b.x=35;b.y=26;p.attackTimer=0;updateCombat(w,1/30,notify);
    assert(a.health<34&&p.targetId===b.id,'Distant selection blocked melee or lost selection');
    p.sneaking=true;p.attackTimer=0;const health=a.health;updateCombat(w,1/30,notify);
    assert(a.health===health,'Sneaking triggered melee');
    p.sneaking=false;p.moveInput=screenDirection(1,0);const start={x:p.x,y:p.y};updateCombat(w,1/30,notify);
    assert(distance(p,start)>0,'Combat stopped manual movement');
    p.x=35.8;p.y=35.5;a.x=36.8;a.y=35.5;w.enemies=[a];a.health=34;p.attackTimer=0;p.moveInput={x:0,y:0};w.blocked[35][36]=true;
    updateCombat(w,1/30,notify);assert(a.health===34,'Melee passed through an obstacle');
  });
  test('Ability unlock, fireball damage, cost, cooldown, healing',()=>{
    const w=createWorld({legacy:true}),p=w.player,e=w.enemies[0];p.x=e.x+2;p.y=e.y;w.enemies=w.enemies.slice(0,1);p.targetId=e.id;
    assert(unlock(p,'fireball'),'Cannot unlock');assert(!unlock(p,'fireball'),'Duplicate unlock');const mana=p.mana;
    assert(useAbility(w,'fireball',notify),'Fireball failed');assert(p.mana===mana-22&&e.health<34,'Damage or mana wrong');assert(!useAbility(w,'fireball',notify),'Cooldown ignored');
    p.points=1;unlock(p,'healingWord');assert(!useAbility(w,'healingWord',notify),'Full health exploit');p.health-=35;p.recoverableHealth=35;
    assert(useAbility(w,'healingWord',notify)&&p.health>maxima(p).health-35,'Healing failed');assert(p.skills.restoration.xp>0||p.skills.restoration.level>1,'No restoration XP');
  });
  test('Cleave hits nearby enemies; Backstab requires sneak and rear position',()=>{
    const w=createWorld({legacy:true}),p=w.player,e=w.enemies[0],other=w.enemies[1];e.x=35;e.y=25;p.x=e.x;p.y=e.y-1;other.x=e.x+0.7;other.y=e.y;w.enemies=[e,other];p.points=2;unlock(p,'cleave');unlock(p,'backstab');p.targetId=e.id;
    assert(!useAbility(w,'backstab',notify),'Backstab allowed without stealth');p.sneaking=true;assert(useAbility(w,'backstab',notify),'Rear backstab denied');
    e.health=34;e.aggro=false;p.targetId=e.id;assert(useAbility(w,'cleave',notify),'Cleave denied');assert(other.health<34,'No area damage');
  });
  test('Noncombat gathering, sale, crafting and equipment work',()=>{
    const w=createWorld({legacy:true}),p=w.player,node=w.map.resources[0];p.x=node.x;p.y=node.y;assert(gather(w,node,notify),'Gather failed');assert(!gather(w,node,notify),'Gather farming allowed');
    const merchant=w.npcs.find(n=>n.occupation==='Merchant');p.x=merchant.x;p.y=merchant.y;assert(trade(w,merchant,'sell','herb',notify),'Sale failed');assert(!trade(w,merchant,'sell','herb',notify),'Sold nonexistent material');
    const smith=w.npcs.find(n=>n.occupation==='Blacksmith');p.x=smith.x;p.y=smith.y;p.inventory.ore=3;assert(trade(w,smith,'craft',null,notify),'Craft failed');assert(useItem(p,'ironSword',notify)&&p.weapon==='ironSword','Equip failed');assert(p.skills.smithing.level>1,'No crafting progression');
  });
  test('Death retains progression and applies temporary penalty',()=>{
    const w=createWorld({legacy:true});w.player.level=4;w.player.health=0;respawnPlayer(w,notify);assert(w.player.level===4&&w.player.penalty===45,'Death lost progression');assert(distance(w.player,w.map.spawn)===0&&w.player.health>0,'No respawn');
  });
  test('NPCs reach work and home on daily schedule',()=>{
    const w=createWorld({legacy:true});for(let i=0;i<200;i++)updateNPCs(w,0.25);
    for(const n of w.npcs){const b=w.map.buildings.find(b=>b.id===n.workplace);assert(distance(n,b.door)<0.2,`${n.name} failed to reach work`);}
    w.time=20/24*CONFIG.daySeconds;for(let i=0;i<200;i++)updateNPCs(w,0.25);
    for(const n of w.npcs){const b=w.map.buildings.find(b=>b.id===n.home);assert(distance(n,b.door)<0.2,`${n.name} failed to reach home`);}
  });
  test('Save round-trip preserves progression, NPCs, loot, cooldowns and depletion',()=>{
    const w=createWorld({legacy:true});let raw=null;const storage={setItem(k,v){raw=v;},getItem(){return raw;}};
    w.player.points=5;unlock(w.player,'fireball');w.player.cooldowns.fireball=3;skillXP(w.player,'smithing',70);w.player.inventory.ore=2;w.map.resources[0].readyAt=100;updateNPCs(w,1);
    damageEnemy(w,w.enemies[0],999,'oneHanded',notify);
    assert(saveGame(w,storage).ok,'Save failed');const result=loadGame(storage);assert(result.world,'Load failed');const r=result.world;
    assert(r.player.abilities.includes('fireball')&&r.player.cooldowns.fireball===3&&r.player.inventory.ore===2,'Lost player state');assert(r.player.attributes.Strength===w.player.attributes.Strength,'Attributes changed');assert(r.npcs[0].x===w.npcs[0].x&&r.npcs.length===NPCS.length,'NPC state lost');assert(r.drops.length===1&&r.enemies[0].health===0&&r.map.resources[0].readyAt===100,'Lost world state');
    raw='bad json';assert(loadGame(storage).error,'Corrupt save not handled');raw=JSON.stringify({version:999});assert(loadGame(storage).error,'Unknown version accepted');assert(!saveGame(w,{setItem(){throw new Error();}}).ok,'Storage failure ignored');
  });
  return results;
}
