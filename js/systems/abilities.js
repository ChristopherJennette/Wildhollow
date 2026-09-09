import { cueAnimation } from '../graphics/animation.js';
import { emitEffect } from '../graphics/effects.js';
import { ABILITIES, ITEMS } from '../data/definitions.js';
import { FORMULAS, distance } from '../config.js';
import { maxima, skillXP, characterXP } from './progression.js';
import { damageEnemy } from './combat.js';
import { clearLine } from './movement.js';
import { acquireTarget } from '../world/world.js';

export function unlock(player,id) {
  if(!ABILITIES[id] || player.points<1 || player.abilities.includes(id)) return false;
  player.points--;player.abilities.push(id);
  if(!Array.isArray(player.hotbar))player.hotbar=Array(5).fill(null);
  const free=player.hotbar.indexOf(null);if(free>=0)player.hotbar[free]=id;
  return true;
}
function heal(world,amount,notify) {
  const p=world.player,healed=Math.min(amount,maxima(p).health-p.health);
  const credit=Math.min(healed,p.recoverableHealth);
  p.health+=healed;p.recoverableHealth=Math.max(0,p.recoverableHealth-healed);
  skillXP(p,'restoration',credit*0.6);characterXP(p,credit*0.12,notify);
  emitEffect(world,'text',p,{text:`+${Math.round(healed)}`,color:'#b8ef9e'});
  emitEffect(world,'heal',p);
}
export function useAbility(world,id,notify) {
  const p=world.player,def=ABILITIES[id];
  if(!def || !p.abilities.includes(id)) {notify('Unlock this ability in the Abilities panel.');return false;}
  if(p.cooldowns[id]>0) {notify('That ability is cooling down.');return false;}
  if(p[def.resource]<def.cost) {notify(`Not enough ${def.resource}.`);return false;}
  const power=FORMULAS[id](p.attributes,p.skills,ITEMS[p.weapon].damage);
  if(def.restore) {
    const missing=maxima(p)[def.restore]-p[def.restore];
    if(missing<1) {notify(`${def.restore} is already full.`);return false;}
    if(def.restore==='health')heal(world,power,notify);
    else {p[def.restore]+=Math.min(missing,power);emitEffect(world,'heal',p);}
  } else {
    const enemy=acquireTarget(world);
    if(!enemy) {notify('No living enemy to target.');return false;}
    if(distance(p,enemy)>def.range || !clearLine(world,p,enemy)) {notify('Move closer with a clear line to your target.');return false;}
    if(id==='backstab') {
      const d=distance(p,enemy)||1;
      const dot=((p.x-enemy.x)*enemy.facing.x+(p.y-enemy.y)*enemy.facing.y)/d;
      if(!p.sneaking || enemy.aggro || dot>-0.25) {notify('Backstab requires sneaking behind an unalerted enemy.');return false;}
    }
    const center=def.center==='player'?p:enemy;
    let dealt=0;
    for(const victim of world.enemies) {
      if(victim.health<=0)continue;
      if(victim!==enemy && (!def.area || distance(center,victim)>def.area || !clearLine(world,center,victim)))continue;
      const damage=power*(victim===enemy?1:(def.splash??1));
      dealt+=Math.min(victim.health,damage);
      damageEnemy(world,victim,damage,def.skill,notify);
      if(def.slow && victim.health>0){victim.slowUntil=world.elapsed+def.slow.duration;victim.slowFactor=def.slow.factor;}
    }
    if(def.drain && p.health<maxima(p).health)heal(world,dealt*def.drain,notify);
    if(def.projectile)emitEffect(world,'projectile',p,{to:{x:enemy.x,y:enemy.y},color:def.color});
    emitEffect(world,'ring',center,{color:def.color||'#e8d594'});
    if(id==='backstab')p.sneaking=false;
  }
  cueAnimation(p,def.resource==='mana'?'cast':'attack',def.resource==='mana'?0.5:0.35);
  p[def.resource]-=def.cost;p.cooldowns[id]=def.cooldown;
  return true;
}
