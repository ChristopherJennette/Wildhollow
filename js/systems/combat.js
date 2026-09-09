import { cueAnimation } from '../graphics/animation.js';
import { emitEffect } from '../graphics/effects.js';
import { CONFIG, FORMULAS, distance } from '../config.js';
import { ENEMIES, ITEMS } from '../data/definitions.js';
import { characterXP, skillXP, maxima } from './progression.js';
import { move, moveDirect, setDestination, clearLine } from './movement.js';
import { target } from '../world/world.js';

export function damageEnemy(world, enemy, amount, skill, notify) {
  if(enemy.health<=0) return;
  const actual=Math.min(enemy.health,amount);
  enemy.health-=actual; enemy.aggro=true;
  skillXP(world.player,skill,Math.max(1,actual*0.4));
  cueAnimation(enemy,enemy.health<=0?'death':'hurt',0.18);
  emitEffect(world,'text',enemy,{text:`−${Math.round(actual)}`,color:'#ffd18b'});
  emitEffect(world,'hit',enemy);
  if(enemy.health<=0) {
    const def=ENEMIES[enemy.kind];
    characterXP(world.player,def.xp,notify);
    world.drops.push({id:`loot-${enemy.id}-${enemy.generation}`,x:enemy.x,y:enemy.y,item:def.loot,quantity:1});
    enemy.respawnAt=world.elapsed+CONFIG.respawnSeconds;
    enemy.path=[];enemy.aggro=false;
    if(world.player.targetId===enemy.id) world.player.targetId=null;
  }
}
export function respawnPlayer(world,notify) {
  const p=world.player;
  Object.assign(p,world.map.spawn,maxima(p));
  p.penalty=CONFIG.deathPenaltySeconds;p.recoverableHealth=0;p.targetId=null;p.path=[];p.destination=null;p.sneaking=false;
  world.interaction=null;p.moveInput={x:0,y:0};
  for(const enemy of world.enemies) {
    enemy.aggro=false;enemy.path=[];enemy.destination=null;
    if(enemy.health>0) {Object.assign(enemy,enemy.spawn);enemy.health=ENEMIES[enemy.kind].health;}
  }
  notify('You wake in Wildhollow. Weary: reduced resource recovery for 45 seconds.');
}
export function updateCombat(world, dt, notify) {
  const p=world.player;
  p.attackTimer=Math.max(0,p.attackTimer-dt);
  p.penalty=Math.max(0,p.penalty-dt);
  for(const id of Object.keys(p.cooldowns)) p.cooldowns[id]=Math.max(0,p.cooldowns[id]-dt);
  p.path=[];p.destination=null;
  const moving=moveDirect(world,p,p.moveInput||{x:0,y:0},CONFIG.playerSpeed*(p.sneaking?0.5:1),dt);
  const inReach=enemy=>enemy && enemy.health>0 && distance(p,enemy)<=CONFIG.meleeRange && clearLine(world,p,enemy);
  let foe=target(world);
  if(!inReach(foe)) {
    foe=null;
    for(const enemy of world.enemies) if(inReach(enemy) && (!foe || distance(p,enemy)<distance(p,foe))) foe=enemy;
  }
  if(foe && !p.sneaking && p.attackTimer<=0) {
    if(!target(world)) p.targetId=foe.id;
    cueAnimation(p,'attack');
    damageEnemy(world,foe,FORMULAS.melee(p.attributes,p.skills,ITEMS[p.weapon].damage),'oneHanded',notify);
    p.attackTimer=CONFIG.attackInterval;
  }
  let threatened=false;
  for(const enemy of world.enemies) {
    const def=ENEMIES[enemy.kind];
    if(enemy.health<=0) {
      if(world.elapsed>=enemy.respawnAt) {Object.assign(enemy,enemy.spawn);enemy.health=def.health;enemy.aggro=false;enemy.armorXP=0;enemy.generation++;}
      continue;
    }
    const d=distance(enemy,p);
    if(d>CONFIG.activeRadius) {
      if(enemy.aggro) {enemy.aggro=false;enemy.path=[];Object.assign(enemy,enemy.spawn);enemy.health=def.health;}
      continue;
    }
    enemy.attackTimer=Math.max(0,enemy.attackTimer-dt);
    const visible=clearLine(world,enemy,p);
    const toPlayer={x:(p.x-enemy.x)/(d||1),y:(p.y-enemy.y)/(d||1)};
    const inFront=toPlayer.x*enemy.facing.x+toPlayer.y*enemy.facing.y>0.25;
    const detects=p.sneaking ? d<0.65 || (d<def.aggro*0.65 && inFront) : d<def.aggro;
    if(detects && visible) enemy.aggro=true;
    const encounter=`${enemy.id}:${enemy.generation}`;
    if(p.sneaking && moving && !enemy.aggro && d<4 && visible && !p.stealthEncounters.includes(encounter)) {
      p.stealthEncounters.push(encounter);skillXP(p,'stealth',12);
      if(p.stealthEncounters.length>200) p.stealthEncounters.shift();
    }
    if(!enemy.aggro) continue;
    if(distance(enemy,enemy.spawn)>13 || d>14) {
      enemy.aggro=false;enemy.health=def.health;setDestination(world,enemy,enemy.spawn);
      // Return abstractly after a leash break, avoiding stuck remote pursuers.
      Object.assign(enemy,enemy.spawn);enemy.path=[];continue;
    }
    threatened=true;
    if(d<=def.range && visible) {
      enemy.path=[];
      if(enemy.attackTimer<=0) {
        const damage=def.damage*(1-FORMULAS.armor(p.attributes,p.skills));
        p.health-=damage;p.recoverableHealth=Math.min(maxima(p).health,p.recoverableHealth+damage);
        const credit=Math.min(4,Math.max(0,20-enemy.armorXP));
        skillXP(p,'lightArmor',credit);enemy.armorXP+=credit;
        enemy.attackTimer=def.interval;
        cueAnimation(enemy,'attack');cueAnimation(p,'hurt',0.18);
        emitEffect(world,'text',p,{text:`−${Math.round(damage)}`,color:'#ff998a',lifetime:0.7});
        emitEffect(world,'hit',p);
        if(p.health<=0) {respawnPlayer(world,notify);return;}
      }
    } else {
      enemy.repath=(enemy.repath||0)-dt;
      if(enemy.repath<=0) {setDestination(world,enemy,p);enemy.repath=0.65;}
      move(world,enemy,def.speed,dt);
    }
  }
  const max=maxima(p), recovery=p.penalty>0?0.5:1;
  p.stamina=Math.min(max.stamina,p.stamina+7*dt*recovery);
  p.mana=Math.min(max.mana,p.mana+2.2*dt*recovery);
  if(!threatened) {
    const healed=Math.min(max.health-p.health,1.3*dt*recovery);
    p.health+=healed;p.recoverableHealth=Math.max(0,p.recoverableHealth-healed);
  }
}
