import { createWorld } from '../js/world/world.js';
import { chopTree, gather, craft } from '../js/systems/inventory.js';
import { rollLoot } from '../js/systems/loot.js';
import { saveGame, loadGame } from '../js/systems/save.js';
import { nearestInteraction } from '../js/input/targets.js';
export function runGatheringTests() {
  const results=[];
  const test=(name,fn)=>{try{fn();results.push(`PASS ${name}`)}catch(e){results.push(`FAIL ${name}: ${e.message}`)}};
  const assert=(v,m)=>{if(!v)throw Error(m)};
  test('Trees require an axe, grant woodcutting XP, unblock and remain chopped after save',()=>{
    const w=createWorld({legacy:true}),p=w.player,t=w.map.trees[0];p.x=t.x-1;p.y=t.y;
    delete p.inventory.woodaxe;assert(!chopTree(w,t,()=>{}),'No axe required');
    p.inventory.woodaxe=1;assert(chopTree(w,t,()=>{}),'Tree chop failed');
    assert(t.chopped && !w.blocked[Math.floor(t.y)][Math.floor(t.x)] && p.inventory.wood>0 && p.skills.woodcutting.xp>0,'Chop effects missing');
    let raw;const store={setItem(k,v){raw=v},getItem(){return raw}};saveGame(w,store);
    const loaded=loadGame(store).world, restored=loaded.treeById.get(t.id);
    assert(restored.chopped&&!loaded.blocked[Math.floor(t.y)][Math.floor(t.x)],'Chop did not persist');
  });
  test('Mining requires a pick and improved picks increase yield',()=>{
    const w=createWorld({legacy:true}),p=w.player,node=w.map.resources.find(n=>n.kind==='ore');p.x=node.x;p.y=node.y;
    delete p.inventory.pickaxe;assert(!gather(w,node,()=>{}),'No pick required');
    p.inventory.ironPick=1;assert(gather(w,node,()=>{})&&p.inventory.ore>=2,'Improved pick failed');
  });
  test('Loot pools return common and bonus items and contextual action detects a nearby tree',()=>{
    const drops=rollLoot('goblin',()=>0);assert(drops.some(d=>d.item==='ore')&&drops.some(d=>d.item==='ironDagger'),'Bonus roll missing');
    const w=createWorld({legacy:true}),t=w.map.trees[0];w.npcs=[];w.map.resources=[];w.drops=[];w.player.x=t.x-1;w.player.y=t.y;
    assert(nearestInteraction(w)?.type==='tree','Nearby tree unavailable');
  });
  test('Upgrade recipes spend ingredients and enforce blacksmith proximity',()=>{
    const w=createWorld({legacy:true}),p=w.player;Object.assign(p.inventory,{ingot:2,plank:1});
    assert(!craft(w,'ironAxe',()=>{}),'Crafted smithing away from smith');
    const smith=w.npcs.find(n=>n.occupation==='Blacksmith');p.x=smith.x;p.y=smith.y;
    assert(craft(w,'ironAxe',()=>{},smith)&&p.inventory.ironAxe===1&&!p.inventory.plank,'Upgrade craft failed');
  });
  return results;
}
