import { SKILLS, ABILITIES, ITEMS, ENEMIES } from './data/definitions.js';
import { FORMULAS } from './config.js';
import { maxima } from './systems/progression.js';
import { unlock, useAbility } from './systems/abilities.js';
import { useItem, trade } from './systems/inventory.js';
import { hour, target } from './world/world.js';
const $=id=>document.getElementById(id);
const row=(title,detail,right='')=>`<div class="row"><div>${title}<small>${detail}</small></div>${right}</div>`;
export class UI {
  constructor(getWorld,actions) {
    this.getWorld=getWorld;this.actions=actions;this.panel=null;this.noticeTimer=0;
    $('new-game').onclick=actions.newGame;$('continue').onclick=actions.continueGame;$('reset').onclick=actions.reset;
    $('menu-button').onclick=actions.menu;
    $('close-panel').onclick=()=>this.closePanel();
    document.querySelectorAll('[data-panel]').forEach(button=>button.onclick=()=>this.openPanel(button.dataset.panel));
    $('sneak').onclick=()=>{const p=getWorld().player;p.sneaking=!p.sneaking;this.notify(p.sneaking?'Sneaking: automatic attacks paused.':'Walking: automatic attacks enabled.');this.update();};
    $('zoom-in').onclick=()=>actions.zoom(1.15);$('zoom-out').onclick=()=>actions.zoom(1/1.15);
    $('hotbar').innerHTML=Object.entries(ABILITIES).map(([id,def])=>`<button data-ability="${id}" aria-label="${def.name}">${def.name}<small></small></button>`).join('');
    $('hotbar').onclick=event=>{const b=event.target.closest('[data-ability]');if(!b)return;const p=getWorld().player;if(!p.abilities.includes(b.dataset.ability))this.openPanel('abilities');else useAbility(getWorld(),b.dataset.ability,this.notify);this.update();};
    $('panel-body').onclick=event=>{
      const button=event.target.closest('button');if(!button)return;
      const world=getWorld(),p=world.player;
      if(button.dataset.unlock && unlock(p,button.dataset.unlock))this.notify(`${ABILITIES[button.dataset.unlock].name} unlocked.`);
      if(button.dataset.item)useItem(p,button.dataset.item,this.notify);
      if(button.dataset.trade)trade(world,world.npcs.find(n=>n.id===this.npcId),button.dataset.trade,button.dataset.id,this.notify);
      this.renderPanel();this.update();actions.save();
    };
    document.addEventListener('keydown',event=>{
      if(event.key==='Escape') {if(this.panel)this.closePanel();else if(!$('menu').hidden&&getWorld())actions.continueGame();else if(getWorld())actions.menu();}
      if(event.key==='Tab' && this.panel) {
        const focusable=[...$('panel').querySelectorAll('button:not(:disabled)')],first=focusable[0],last=focusable.at(-1);
        if(event.shiftKey && document.activeElement===first){event.preventDefault();last.focus();}
        else if(!event.shiftKey&&document.activeElement===last){event.preventDefault();first.focus();}
      }
    });
  }
  notify=(message)=>{clearTimeout(this.noticeTimer);$('notice').textContent=message;$('notice').classList.add('visible');this.noticeTimer=setTimeout(()=>$('notice').classList.remove('visible'),4200);};
  menu(show,canContinue=true,error='') {
    $('menu').hidden=!show;$('hud').hidden=show;$('controls').hidden=show;
    $('continue').disabled=!canContinue;$('save-status').textContent=error||'Version 0.1.0 · Local saves';
  }
  closePanel() {this.panel=null;$('panel').hidden=true;this.returnFocus?.focus();}
  openPanel(name,npcId) {this.returnFocus=document.activeElement;this.panel=name;this.npcId=npcId;$('panel').hidden=false;this.renderPanel();$('close-panel').focus();}
  renderPanel() {
    const world=this.getWorld(),p=world.player;let body='';
    $('panel-title').textContent=this.panel==='npc'?'Village life':this.panel[0].toUpperCase()+this.panel.slice(1);
    if(this.panel==='character') {
      body=`<p class="description">Level ${p.level} · ${Math.floor(p.xp)} / ${FORMULAS.characterXP(p.level)} XP<br><span class="tag">${p.points} ability points · ${p.gold} gold</span></p>`;
      for(const [name,value] of Object.entries(p.attributes))body+=row(name,'Grows through associated skill levels.',`<strong>${value.toFixed(2)}</strong>`);
      body+=`<p class="muted">${p.penalty>0?`Weary: ${Math.ceil(p.penalty)}s of slower recovery.`:'Well rested.'} Attributes start at 8 and grow automatically.</p>`;
    }
    if(this.panel==='skills') for(const [id,def] of Object.entries(SKILLS)) {
      const s=p.skills[id],max=FORMULAS.skillXP(s.level);
      body+=row(`${def.name} <span class="tag">${s.level} / 100</span>`,`${def.use}<br>${Object.keys(def.attributes).join(' / ')}<progress aria-label="${def.name} experience" value="${s.xp}" max="${max}"></progress>${Math.floor(s.xp)} / ${max} XP`);
    }
    if(this.panel==='abilities') {
      body=`<p class="tag">${p.points} ability points available</p>`;
      for(const [id,def] of Object.entries(ABILITIES))body+=row(def.name,`${def.description}<br>${def.cost} ${def.resource} · ${def.cooldown}s cooldown`,p.abilities.includes(id)?'<span class="tag">Unlocked</span>':`<button data-unlock="${id}" ${p.points<1?'disabled':''}>Unlock · 1</button>`);
      body+='<p class="muted">Abilities scale with your skills and attributes. Earn points by leveling through combat, exploration, trade, or crafting.</p>';
    }
    if(this.panel==='inventory') {
      body=`<p class="tag">${p.gold} gold · No carrying limit</p>`;
      for(const [id,count] of Object.entries(p.inventory)) {
        const def=ITEMS[id];body+=row(`${def.name} ×${count}`,def.damage?`${def.damage} weapon damage`:def.heal?`Restores ${def.heal} health`:`Material · sells for ${def.value} gold`,def.type==='weapon'?`<button data-item="${id}" ${p.weapon===id?'disabled':''}>${p.weapon===id?'Equipped':'Equip'}</button>`:def.heal?`<button data-item="${id}">Use</button>`:'');
      }
    }
    if(this.panel==='npc') {
      const npc=world.npcs.find(n=>n.id===this.npcId);
      $('panel-title').textContent=`${npc.name} · ${npc.occupation}`;
      const home=world.map.buildings.find(b=>b.id===npc.home),work=world.map.buildings.find(b=>b.id===npc.workplace);
      body=`<p class="description">Home: ${home.name}<br>Work: ${work.name}<br>Schedule: work 07:00–19:00, then home.<br>Currently: ${npc.state} · Your gold: ${p.gold}</p>`;
      if(npc.occupation==='Merchant') {
        body+=row('Healing draught','Buy for 12 gold.',`<button data-trade="buy" ${p.gold<12?'disabled':''}>Buy · 12</button>`);
        for(const [id,count] of Object.entries(p.inventory))if(ITEMS[id].type==='material')body+=row(`${ITEMS[id].name} ×${count}`,`${ITEMS[id].value} gold each`,`<button data-trade="sell" data-id="${id}">Sell one</button>`);
      } else if(npc.occupation==='Blacksmith')body+=row('Forge iron sword',`Requires 3 iron ore. You have ${p.inventory.ore||0}.<br>Grants Smithing and character XP.`,`<button data-trade="craft" ${(p.inventory.ore||0)<3?'disabled':''}>Forge</button>`);
      else if(npc.occupation==='Innkeeper')body+=row('A quiet room','Restore resources and remove weariness.',`<button data-trade="rest" ${p.gold<4?'disabled':''}>Rest · 4</button>`);
      else body+='<p class="description">“Herbs grow around the village, and ore lies near the forest edge. Stay close to the road if you want to avoid the wolves.”</p>';
    }
    $('panel-body').innerHTML=body;
  }
  update() {
    const world=this.getWorld();if(!world)return;const p=world.player,max=maxima(p);
    $('resources').innerHTML=[['health','HP','#c78370'],['stamina','ST','#b7bf79'],['mana','MP','#80b4d2']].map(([id,label,color])=>`<div class="resource"><span>${label}</span><div class="track"><div class="fill" style="--color:${color};width:${Math.max(0,p[id]/max[id]*100)}%"></div></div><span>${Math.ceil(p[id])} / ${Math.round(max[id])}</span></div>`).join('');
    $('level').textContent=`Lv ${p.level} · ${p.points} AP`;$('xp').value=p.xp;$('xp').max=FORMULAS.characterXP(p.level);
    const h=hour(world);$('clock').textContent=`${String(Math.floor(h)).padStart(2,'0')}:${String(Math.floor(h%1*60)).padStart(2,'0')}`;
    const enemy=target(world);$('target').textContent=enemy?`${ENEMIES[enemy.kind].name} · ${Math.ceil(enemy.health)} HP${p.sneaking?' · Sneaking':''}`:'Tap ground to move · enemies to fight';
    $('sneak').setAttribute('aria-pressed',String(p.sneaking));
    $('location').textContent=p.penalty>0?`Weary ${Math.ceil(p.penalty)}s`:p.x>21&&p.x<53&&p.y>25&&p.y<51?'Wildhollow village':'The wilds';
    for(const button of $('hotbar').children) {
      const id=button.dataset.ability,def=ABILITIES[id],cooldown=p.cooldowns[id]||0;
      button.querySelector('small').textContent=!p.abilities.includes(id)?'Unlock':cooldown>0?`${cooldown.toFixed(1)}s`:`${def.cost} ${def.resource==='mana'?'MP':'ST'}`;
      button.disabled=p.abilities.includes(id)&&(cooldown>0||p[def.resource]<def.cost);
    }
  }
}
