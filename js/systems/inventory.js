import { ITEMS } from '../data/definitions.js';
import { distance } from '../config.js';
import { maxima, skillXP, characterXP } from './progression.js';

export function addItem(player,id,quantity=1) { player.inventory[id]=(player.inventory[id]||0)+quantity; }
export function removeItem(player,id,quantity=1) {
  if((player.inventory[id]||0)<quantity) return false;
  player.inventory[id]-=quantity;
  if(!player.inventory[id]) delete player.inventory[id];
  return true;
}
export function useItem(player,id,notify) {
  const def=ITEMS[id];
  if(!def || !player.inventory[id]) return false;
  if(def.type==='weapon') {player.weapon=id;notify(`${def.name} equipped.`);return true;}
  if(def.heal) {
    const healed=Math.min(def.heal,maxima(player).health-player.health);
    if(healed<1) {notify('Health is already full.');return false;}
    removeItem(player,id);player.health+=healed;player.recoverableHealth=Math.max(0,player.recoverableHealth-healed);
    notify(`Recovered ${Math.round(healed)} health.`);return true;
  }
  return false;
}
export function gather(world,node,notify) {
  if(distance(world.player,node)>1.8 || node.readyAt>world.elapsed) return false;
  node.readyAt=world.elapsed+180;addItem(world.player,node.kind);
  skillXP(world.player,'survival',12);characterXP(world.player,10,notify);
  notify(`Gathered ${ITEMS[node.kind].name}.`);return true;
}
export function pickup(world,drop,notify) {
  if(distance(world.player,drop)>1.8) return false;
  addItem(world.player,drop.item,drop.quantity);world.drops=world.drops.filter(d=>d.id!==drop.id);
  notify(`Picked up ${ITEMS[drop.item].name}.`);return true;
}
export function trade(world,npc,action,id,notify) {
  const p=world.player;
  if(!npc || distance(p,npc)>2.5) {notify('Move closer to the villager.');return false;}
  if(npc.occupation==='Merchant' && action==='sell' && ITEMS[id]?.type==='material' && removeItem(p,id)) {
    const value=ITEMS[id].value;p.gold+=value;skillXP(p,'bartering',6);characterXP(p,4,notify);notify(`Sold ${ITEMS[id].name} for ${value} gold.`);return true;
  }
  if(npc.occupation==='Merchant' && action==='buy' && p.gold>=12) {p.gold-=12;addItem(p,'potion');notify('Bought a healing draught.');return true;}
  if(npc.occupation==='Blacksmith' && action==='craft' && (p.inventory.ore||0)>=3) {
    removeItem(p,'ore',3);addItem(p,'ironSword');skillXP(p,'smithing',45);characterXP(p,35,notify);notify('Forged an iron sword. Equip it in your pack.');return true;
  }
  if(npc.occupation==='Innkeeper' && action==='rest' && p.gold>=4) {
    p.gold-=4;Object.assign(p,maxima(p));p.penalty=0;p.recoverableHealth=0;notify('Rested and recovered.');return true;
  }
  notify('You do not have the required materials or gold.');return false;
}
