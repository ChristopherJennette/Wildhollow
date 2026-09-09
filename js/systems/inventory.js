import { ITEMS, RECIPES, SHOP, GATHERING } from '../data/definitions.js';
import { distance } from '../config.js';
import { maxima, skillXP, characterXP } from './progression.js';

export function addItem(player,id,quantity=1) { player.inventory[id]=(player.inventory[id]||0)+quantity; }
export function removeItem(player,id,quantity=1) {
  if((player.inventory[id]||0)<quantity)return false;
  player.inventory[id]-=quantity;if(!player.inventory[id])delete player.inventory[id];return true;
}
export function restoration(item) { return item.restore || (item.heal?{health:item.heal}:{}); }
export function useItem(player,id,notify) {
  const def=ITEMS[id];
  if(!def || !player.inventory[id])return false;
  if(def.type==='weapon'){player.weapon=id;notify(`${def.name} equipped.`);return true;}
  const max=maxima(player),changes=[];
  for(const [resource,amount] of Object.entries(restoration(def))) {
    const actual=Math.min(amount,max[resource]-player[resource]);
    if(actual>0){player[resource]+=actual;if(resource==='health')player.recoverableHealth=Math.max(0,player.recoverableHealth-actual);changes.push(`${Math.round(actual)} ${resource}`);}
  }
  if(!changes.length){notify('Resources are already full.');return false;}
  removeItem(player,id);notify(`Recovered ${changes.join(' and ')}.`);return true;
}
export function canCraft(player,recipe) {
  return !!recipe && Object.entries(recipe.ingredients).every(([id,n])=>(player.inventory[id]||0)>=n);
}
export function craft(world,id,notify,npc=null) {
  const recipe=RECIPES[id],p=world.player;
  if(!recipe)return false;
  if(recipe.station && (!npc || !world.npcs.includes(npc) || npc.occupation!==recipe.station || distance(p,npc)>2.5)) {
    notify('Visit Bram the blacksmith for this recipe.');return false;
  }
  if(!canCraft(p,recipe)){notify('Missing ingredients.');return false;}
  for(const [item,quantity] of Object.entries(recipe.ingredients))removeItem(p,item,quantity);
  addItem(p,recipe.output);skillXP(p,recipe.skill,recipe.xp);characterXP(p,recipe.characterXP,notify);
  notify(`Made ${ITEMS[recipe.output].name}.`);return true;
}
export function gather(world,node,notify) {
  if(distance(world.player,node)>1.8 || node.readyAt>world.elapsed)return false;
  node.readyAt=world.elapsed+180;addItem(world.player,node.kind);
  skillXP(world.player,GATHERING[node.kind]||'survival',12);characterXP(world.player,10,notify);
  notify(`Gathered ${ITEMS[node.kind].name}.`);return true;
}
export function pickup(world,drop,notify) {
  if(distance(world.player,drop)>1.8)return false;
  addItem(world.player,drop.item,drop.quantity);world.drops=world.drops.filter(d=>d.id!==drop.id);
  notify(`Picked up ${ITEMS[drop.item].name}.`);return true;
}
export function trade(world,npc,action,id,notify) {
  const p=world.player;
  if(!npc || distance(p,npc)>2.5){notify('Move closer to the villager.');return false;}
  if(npc.occupation==='Merchant' && action==='sell' && ITEMS[id] && p.weapon!==id && removeItem(p,id)) {
    const value=ITEMS[id].value;p.gold+=value;skillXP(p,'bartering',6);characterXP(p,4,notify);notify(`Sold ${ITEMS[id].name} for ${value} gold.`);return true;
  }
  if(npc.occupation==='Merchant' && action==='buy') {
    const item=id||'potion',price=SHOP[item];
    if(price && p.gold>=price){p.gold-=price;addItem(p,item);notify(`Bought ${ITEMS[item].name}.`);return true;}
  }
  if(npc.occupation==='Blacksmith' && action==='craft')return craft(world,id||'ironSword',notify,npc);
  if(npc.occupation==='Innkeeper' && action==='rest' && p.gold>=4) {
    p.gold-=4;Object.assign(p,maxima(p));p.penalty=0;p.recoverableHealth=0;notify('Rested and recovered.');return true;
  }
  notify('You do not have the required materials or gold.');return false;
}
