import { createWorld, acquireTarget } from '../js/world/world.js';
import { ABILITIES, ITEMS, RECIPES, SHOP } from '../js/data/definitions.js';
import { unlock, useAbility } from '../js/systems/abilities.js';
import { canCraft, craft, useItem, trade, gather } from '../js/systems/inventory.js';
import { updateCombat } from '../js/systems/combat.js';
import { saveGame, loadGame } from '../js/systems/save.js';
import { maxima } from '../js/systems/progression.js';

export function runExpansionTests() {
  const results=[],notify=()=>{};
  const assert=(ok,message)=>{if(!ok)throw new Error(message);};
  const test=(name,fn)=>{try{fn();results.push(`PASS ${name}`);}catch(e){results.push(`FAIL ${name}: ${e.message}`);}};
  function arena() {
    const w=createWorld();w.enemies=w.enemies.slice(0,2);
    w.enemies.forEach((e,i)=>{e.x=35;e.y=37+i;e.spawn={x:e.x,y:e.y};});return w;
  }
  test('Offensive skills acquire nearest living enemy and preserve manual selection',()=>{
    const w=arena(),p=w.player,[near,far]=w.enemies;p.points=3;unlock(p,'spark');
    assert(useAbility(w,'spark',notify)&&p.targetId===near.id&&near.health<34,'No automatic skill target');
    p.cooldowns.spark=0;p.targetId=far.id;assert(useAbility(w,'spark',notify)&&far.health<34,'Manual target not honored');
    near.health=0;p.targetId=near.id;assert(acquireTarget(w)===far,'Dead target not replaced');
    far.health=0;p.cooldowns.spark=0;const mana=p.mana;
    assert(!useAbility(w,'spark',notify)&&p.mana===mana,'Empty world consumed resources');
    far.health=34;far.y=60;p.targetId=null;assert(!useAbility(w,'spark',notify)&&p.mana===mana,'Out-of-range skill spent mana');
  });
  test('All added skills function, charge costs and enforce cooldowns',()=>{
    for(const id of ['powerStrike','spark','frostNova','lifeDrain','whirlwind','secondWind']) {
      const w=arena(),p=w.player,def=ABILITIES[id];unlock(p,id);
      if(id==='secondWind')p.stamina=0;
      if(id==='lifeDrain'){p.health-=30;p.recoverableHealth=30;}
      const resource=p[def.resource];assert(useAbility(w,id,notify),`${id} failed`);
      assert(p[def.resource]===resource-def.cost,`${id} wrong cost`);
      assert(!useAbility(w,id,notify),`${id} ignored cooldown`);
      if(id==='secondWind')assert(p.stamina>0,'No stamina restoration');
      if(id==='lifeDrain')assert(p.health>maxima(p).health-30,'No life drain healing');
    }
  });
  test('Frost Nova slows nearby enemies temporarily and persists through save',()=>{
    const w=arena(),p=w.player;unlock(p,'frostNova');assert(useAbility(w,'frostNova',notify),'Nova failed');
    assert(w.enemies.every(e=>e.slowUntil===4&&e.health<34),'Area slow/damage missing');
    let raw;const storage={setItem(k,v){raw=v;},getItem(){return raw;}};
    saveGame(w,storage);const loaded=loadGame(storage).world;
    assert(loaded.enemies[0].slowFactor===0.5&&loaded.enemies[0].slowUntil===4,'Slow not saved');
    const fast=arena(),slow=arena();fast.enemies=fast.enemies.slice(0,1);slow.enemies=slow.enemies.slice(0,1);
    for(const world of [fast,slow]){world.enemies[0].y=39;world.enemies[0].aggro=true;}
    slow.enemies[0].slowUntil=4;slow.enemies[0].slowFactor=0.5;
    updateCombat(fast,0.1,notify);updateCombat(slow,0.1,notify);
    assert(39-slow.enemies[0].y < 39-fast.enemies[0].y,'Slow did not affect movement');
    slow.elapsed=5;const before=slow.enemies[0].y;updateCombat(slow,0.1,notify);
    assert(Math.abs(before-slow.enemies[0].y-(39-fast.enemies[0].y))<1e-6,'Slow did not expire');
  });
  test('Herbs heal, brew recipes consume ingredients atomically and grant skill XP',()=>{
    const w=createWorld(),p=w.player;p.inventory.herb=4;
    assert(!useItem(p,'herb',notify)&&p.inventory.herb===4,'Full health consumed herb');p.health-=20;
    assert(useItem(p,'herb',notify)&&p.inventory.herb===3,'Herb not usable');
    assert(craft(w,'potion',notify)&&p.inventory.herb===1&&p.inventory.potion===3,'Brewing quantities incorrect');
    assert(p.skills.alchemy.xp>0||p.skills.alchemy.level>1,'No alchemy XP');
    const inventory=JSON.stringify(p.inventory),xp=p.xp;
    assert(!craft(w,'potion',notify)&&JSON.stringify(p.inventory)===inventory&&p.xp===xp,'Failed craft consumed ingredients or gave XP');
  });
  test('Every recipe is craftable and smith recipes require a nearby blacksmith',()=>{
    for(const [id,recipe] of Object.entries(RECIPES)) {
      const w=createWorld(),p=w.player,npc=w.npcs.find(n=>n.occupation==='Blacksmith');
      for(const [item,n] of Object.entries(recipe.ingredients))p.inventory[item]=n;
      if(recipe.station){assert(!craft(w,id,notify),'Forged away from smith');p.x=npc.x;p.y=npc.y;}
      const before=p.inventory[recipe.output]||0;
      assert(canCraft(p,recipe)&&craft(w,id,notify,npc)&&p.inventory[recipe.output]===before+1,`Recipe ${id} failed`);
      assert(p.skills[recipe.skill].level>1||p.skills[recipe.skill].xp>0,'Crafting skill XP missing');
    }
  });
  test('New item acquisition, consumables and merchant prices work',()=>{
    const w=createWorld(),p=w.player;
    for(const kind of ['berry','mushroom','wood','ore']){
      const node=w.map.resources.find(n=>n.kind===kind);p.x=node.x;p.y=node.y;
      assert(gather(w,node,notify)&&p.inventory[kind]>0,`Cannot gather ${kind}`);
    }
    assert(p.skills.mining.xp>0&&p.skills.woodcutting.xp>0,'Gathering skill XP missing');
    p.inventory.manaPotion=1;p.mana=0;assert(useItem(p,'manaPotion',notify)&&p.mana===40,'Mana potion failed');
    p.inventory.trailRations=1;p.health-=15;p.stamina-=30;assert(useItem(p,'trailRations',notify)&&!p.inventory.trailRations,'Food failed');
    const npc=w.npcs.find(n=>n.occupation==='Merchant');p.x=npc.x;p.y=npc.y;p.gold=200;
    for(const [id,price] of Object.entries(SHOP))assert(price>ITEMS[id].value,'Profitable buy/sell loop');
    assert(trade(w,npc,'buy','manaPotion',notify)&&p.inventory.manaPotion===1,'Merchant cannot supply new item');
    assert(!trade(w,npc,'sell',p.weapon,notify),'Sold equipped weapon');
  });
  test('Older saves initialize new skills and retain progression and new items',()=>{
    const w=createWorld();let raw;const storage={setItem(k,v){raw=v;},getItem(){return raw;}};
    w.player.level=4;w.player.inventory.manaPotion=2;saveGame(w,storage);
    const old=JSON.parse(raw);for(const id of ['alchemy','cooking','mining','woodcutting'])delete old.player.skills[id];raw=JSON.stringify(old);
    const p=loadGame(storage).world.player;
    assert(p.level===4&&p.skills.alchemy.level===1&&p.inventory.manaPotion===2,'Save compatibility failed');
  });
  return results;
}
