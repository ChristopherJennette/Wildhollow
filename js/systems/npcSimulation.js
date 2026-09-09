import { distance } from '../config.js';
import { hour } from '../world/world.js';
import { setDestination, move } from './movement.js';

export function updateNPCs(world,dt) {
  const daytime=hour(world)>=7 && hour(world)<19;
  for(const npc of world.npcs) {
    const state=daytime?'work':'home';
    const building=world.map.buildings.find(b=>b.id===npc[daytime?'workplace':'home']);
    if(npc.state!==state || (!npc.destination && distance(npc,building.door)>0.2)) {
      npc.state=state;setDestination(world,npc,building.door);
    }
    move(world,npc,1.25,dt);
  }
}
