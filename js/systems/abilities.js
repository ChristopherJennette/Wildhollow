import { cueAnimation } from '../graphics/animation.js';
import { emitEffect } from '../graphics/effects.js';
import { ABILITIES, ITEMS } from '../data/definitions.js';
import { FORMULAS, distance } from '../config.js';
import { maxima, skillXP, characterXP } from './progression.js';
import { damageEnemy } from './combat.js';
import { clearLine } from './movement.js';
import { target } from '../world/world.js';

export function unlock(player,id) {
  if(!ABILITIES[id] || player.points<1 || player.abilities.includes(id)) return false;
  player.points--;player.abilities.push(id);return true;
}
export function useAbility(world,id,notify) {
  const p=world.player,def=ABILITIES[id];
  if(!def || !p.abilities.includes(id)) {notify('Unlock this ability in the Abilities panel.');return false;}
  if(p.cooldowns[id]>0) {notify('That ability is cooling down.');return false;}
  if(p[def.resource]<def.cost) {notify(`Not enough ${def.resource}.`);return false;}
  const enemy=target(world);
  if(id==='healingWord') {
    const missing=maxima(p).health-p.health;
    if(missing<1) {notify('Health is already full.');return false;}
    const healed=Math.min(missing,FORMULAS.healingWord(p.attributes,p.skills));
    const credit=Math.min(healed,p.recoverableHealth);
    p.health+=healed;p.recoverableHealth=Math.max(0,p.recoverableHealth-healed);
    skillXP(p,'restoration',credit*0.6);characterXP(p,credit*0.12,notify);
    emitEffect(world,'text',p,{text:`+${Math.round(healed)}`,color:'#b8ef9e',lifetime:1});
    emitEffect(world,'heal',p);
  } else {
    if(!enemy) {notify('Select an enemy first.');return false;}
    if(distance(p,enemy)>def.range || !clearLine(world,p,enemy)) {notify('Move closer with a clear line to your target.');return false;}
    if(id==='backstab') {
      const d=distance(p,enemy)||1;
      const dot=((p.x-enemy.x)*enemy.facing.x+(p.y-enemy.y)*enemy.facing.y)/d;
      if(!p.sneaking || enemy.aggro || dot>-0.25) {notify('Backstab requires sneaking behind an unalerted enemy.');return false;}
    }
    const power=FORMULAS[id](p.attributes,p.skills,ITEMS[p.weapon].damage);
    const victims=world.enemies.filter(e=>e.health>0 && (e===enemy || (id==='cleave' && distance(p,e)<=2 && clearLine(world,p,e)) || (id==='fireball' && distance(enemy,e)<1.8 && clearLine(world,enemy,e))));
    for(const victim of victims) damageEnemy(world,victim,power*(id==='fireball' && victim!==enemy?0.5:1),def.skill,notify);
    if(id==='fireball') emitEffect(world,'projectile',p,{to:{x:enemy.x,y:enemy.y}});
    emitEffect(world,'ring',enemy,{color:id==='fireball'?'#ffb15c':'#e8d594'});
    if(id==='backstab') p.sneaking=false;
  }
  cueAnimation(p,def.resource==='mana'?'cast':'attack',def.resource==='mana'?0.5:0.35);
  p[def.resource]-=def.cost;p.cooldowns[id]=def.cooldown;
  return true;
}
