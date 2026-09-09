import { CONFIG, distance } from './config.js';
import { createWorld } from './world/world.js';
import { Camera } from './camera.js';
import { Renderer } from './renderer.js';
import { installInput } from './input.js';
import { UI } from './ui.js';
import { updateCombat } from './systems/combat.js';
import { updateNPCs } from './systems/npcSimulation.js';
import { explore } from './systems/progression.js';
import { gather, pickup } from './systems/inventory.js';
import { loadGame, saveGame, resetSave } from './systems/save.js';

const canvas=document.getElementById('world'),camera=new Camera(canvas),renderer=new Renderer(canvas,camera);
let world=null,menuOpen=true,accumulator=0,last=0,npcTimer=0,saveTimer=0,uiTimer=0;
const stored=loadGame();
const ui=new UI(()=>world,{
  newGame(){
    if((world||loadGame().world)&&!confirm('Start a new game? This replaces your saved progress.'))return;
    start(createWorld());save();ui.notify('Welcome to Wildhollow. Open Abilities to spend your starting point.');
  },
  continueGame(){const loaded=world?{world}:loadGame();if(loaded.world)start(loaded.world);else ui.notify(loaded.error||'No saved game.');},
  reset(){if(!confirm('Permanently delete your Wildhollow progress?'))return;if(!resetSave()){ui.notify('Could not clear browser storage.');return;}world=null;menuOpen=true;ui.closePanel();ui.menu(true,false);ui.notify('Progress cleared. Start a new game.');},
  menu(){save();menuOpen=true;ui.closePanel();ui.menu(true,!!world);},
  zoom:amount=>camera.scale(amount), save,
});
ui.menu(true,!!stored.world,stored.error);
const preview=createWorld();renderer.draw(preview);
function start(next) {world=next;menuOpen=false;camera.x=world.player.x;camera.y=world.player.y;accumulator=0;ui.menu(false);ui.update();}
function save() {if(world){const result=saveGame(world);if(!result.ok)ui.notify(result.error);}}
function interact() {
  const pending=world.interaction;if(!pending)return;
  const list=pending.type==='npc'?world.npcs:pending.type==='resource'?world.map.resources:world.drops;
  const entity=list.find(e=>e.id===pending.id);
  if(!entity){world.interaction=null;return;}
  if(distance(world.player,entity)<=1.6) {
    world.player.path=[];world.player.destination=null;world.interaction=null;
    if(pending.type==='npc')ui.openPanel('npc',entity.id);
    else if(pending.type==='resource')gather(world,entity,ui.notify);
    else pickup(world,entity,ui.notify);
  }
}
const input=installInput(canvas,camera,()=>world,()=>world&&!menuOpen&&!ui.panel,ui.notify);
window.addEventListener('resize',()=>{camera.resize();renderer.draw(world||preview);});
document.addEventListener('visibilitychange',()=>{if(document.hidden)save();last=0;accumulator=0;});
window.addEventListener('pagehide',save);
function frame(timestamp) {
  const dt=last?Math.min((timestamp-last)/1000,0.1):0;last=timestamp;
  input.update();
  if(world&&!menuOpen&&!ui.panel&&!document.hidden) {
    accumulator+=dt;
    while(accumulator>=CONFIG.tick) {
      world.time+=CONFIG.tick;world.elapsed+=CONFIG.tick;
      updateCombat(world,CONFIG.tick,ui.notify);explore(world,ui.notify);
      npcTimer+=CONFIG.tick;
      if(npcTimer>=CONFIG.npcInterval){updateNPCs(world,npcTimer);npcTimer=0;}
      interact();
      for(const e of world.effects)e.life-=CONFIG.tick;
      world.effects=world.effects.filter(e=>e.life>0);
      accumulator-=CONFIG.tick;
      if(ui.panel) {accumulator=0;break;}
    }
    camera.follow(world.player,dt);saveTimer+=dt;
    if(saveTimer>=CONFIG.autosaveSeconds){save();saveTimer=0;}
  }
  uiTimer+=dt;if(uiTimer>=0.1){if(!menuOpen)ui.update();uiTimer=0;}
  renderer.draw(world||preview);requestAnimationFrame(frame);
}
requestAnimationFrame(frame);
