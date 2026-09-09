import { createWorld } from '../js/world/world.js';
import { generateMap } from '../js/world/generator.js';
import { walkable, findPath } from '../js/systems/movement.js';
import { saveGame, loadGame } from '../js/systems/save.js';
import { assignSlot, normalizeHotbar, useSlot } from '../js/systems/hotbar.js';
import { unlock } from '../js/systems/abilities.js';

export function runWorldTests() {
  const results=[],notify=()=>{};
  const assert=(value,message)=>{if(!value)throw new Error(message);};
  const test=(name,fn)=>{try{fn();results.push(`PASS ${name}`);}catch(error){results.push(`FAIL ${name}: ${error.message}`);}};
  test('Seeded maps repeat exactly and change across seeds',()=>{
    assert(JSON.stringify(generateMap(12345))===JSON.stringify(generateMap(12345)),'Same seed changed map');
    const a=generateMap(1),b=generateMap(2);
    for(const key of ['terrain','buildings','trees','resources','spawns'])assert(JSON.stringify(a[key])!==JSON.stringify(b[key]),`${key} did not vary`);
  });
  test('Generated worlds have reachable buildings, resources and enemies across 50 seeds',()=>{
    for(let seed=0;seed<50;seed++){
      const w=createWorld({seed}),map=w.map,visited=new Set(),queue=[{x:Math.floor(map.spawn.x),y:Math.floor(map.spawn.y)}];
      visited.add(`${queue[0].x},${queue[0].y}`);
      for(let i=0;i<queue.length;i++)for(const [dx,dy] of [[1,0],[-1,0],[0,1],[0,-1]]){
        const x=queue[i].x+dx,y=queue[i].y+dy,key=`${x},${y}`;
        if(!visited.has(key)&&walkable(w,x+.5,y+.5)){visited.add(key);queue.push({x,y});}
      }
      for(const p of [map.spawn,...map.buildings.map(b=>b.door),...map.resources,...w.enemies]){
        assert(walkable(w,p.x,p.y),`Seed ${seed}: blocked ${p.id||'spawn'}`);
        assert(visited.has(`${Math.floor(p.x)},${Math.floor(p.y)}`),`Seed ${seed}: unreachable ${p.id}`);
      }
      for(const e of w.enemies)assert(Math.hypot(e.x-map.spawn.x,e.y-map.spawn.y)>12,`Seed ${seed}: unsafe player spawn`);
      for(const npc of w.npcs){const home=map.buildings.find(b=>b.id===npc.home),work=map.buildings.find(b=>b.id===npc.workplace);assert(findPath(w,home.door,work.door).length>0,`Seed ${seed}: disconnected NPC schedule`);}
    }
  });
  test('Generated world save retains terrain, seed, player and resource depletion',()=>{
    const w=createWorld({seed:4294967295});let raw;const storage={setItem(k,v){raw=v;},getItem(){return raw;}};
    w.map.resources[0].readyAt=123;w.player.gold=91;unlock(w.player,'spark');assignSlot(w.player,'spark',4);
    assert(saveGame(w,storage).ok,'Could not save');const loaded=loadGame(storage).world;
    assert(loaded&&JSON.stringify(loaded.map)===JSON.stringify(w.map),'World changed on load');
    assert(loaded.player.gold===91&&loaded.player.hotbar[4]==='spark','Lost player/hotbar state');
    const invalid=JSON.parse(raw);invalid.map.generatorVersion=99;raw=JSON.stringify(invalid);
    assert(loadGame(storage).error,'Unknown generator version was regenerated');
  });
  test('Version-one saves keep original map and gain five hotbar slots',()=>{
    const w=createWorld({legacy:true});w.player.points=3;unlock(w.player,'cleave');unlock(w.player,'fireball');
    let raw;const storage={setItem(k,v){raw=v;},getItem(){return raw;}};saveGame(w,storage);
    const old=JSON.parse(raw);old.version=1;delete old.map;delete old.player.hotbar;raw=JSON.stringify(old);
    const loaded=loadGame(storage).world;
    assert(loaded.map.seed===undefined&&JSON.stringify(loaded.map)===JSON.stringify(w.map),'Legacy map replaced');
    assert(loaded.player.hotbar.length===5&&loaded.player.hotbar[0]==='cleave'&&loaded.player.hotbar[1]==='fireball','Legacy assignment missing');
  });
  test('Five slots assign, replace, clear and reject locked skills',()=>{
    const p=createWorld().player;p.points=3;unlock(p,'cleave');unlock(p,'fireball');unlock(p,'healingWord');
    assert(p.hotbar[0]==='cleave','Unlock did not use free slot');
    assert(assignSlot(p,'fireball',4)&&p.hotbar[4]==='fireball'&&p.hotbar[1]===null,'Reassignment duplicated skill');
    assignSlot(p,'cleave',4);assert(p.hotbar[4]==='cleave'&&!p.hotbar.includes('fireball'),'Occupied slot not replaced');
    assignSlot(p,'cleave',-1);assert(!p.hotbar.includes('cleave'),'Unassign failed');
    assert(!assignSlot(p,'spark',0)&&!assignSlot(p,'fireball',5),'Invalid assignment allowed');
    normalizeHotbar(p,['fireball','fireball','spark',null,'healingWord']);
    assert(p.hotbar[1]===null&&p.hotbar[2]===null&&p.hotbar[4]==='healingWord','Corrupt slot cleanup failed');
  });
  test('Slot activation uses the assigned skill with normal targeting and cooldowns',()=>{
    const w=createWorld({legacy:true}),p=w.player;unlock(p,'spark');assignSlot(p,'spark',4);
    const enemy=w.enemies[0];enemy.x=35;enemy.y=37;p.x=35;p.y=36;
    assert(useSlot(w,4,notify)&&p.targetId===enemy.id,'Slot activation failed');
    const mana=p.mana;assert(!useSlot(w,4,notify)&&p.mana===mana,'Slot bypassed cooldown');
    assert(!useSlot(w,0,notify),'Empty slot activated');
  });
  return results;
}
