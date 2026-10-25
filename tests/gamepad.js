import { GamepadReader, deadzone, BUTTON as B } from '../js/input/gamepad.js';
import { cycleTarget, aimTarget, nearestInteraction } from '../js/input/targets.js';
import { createWorld } from '../js/world/world.js';

export function runGamepadTests() {
  const results = [];
  const assert = (value, message) => { if (!value) throw new Error(message); };
  const test = (name, fn) => { try { fn(); results.push(`PASS ${name}`); } catch (error) { results.push(`FAIL ${name}: ${error.message}`); } };
  const makePad = () => ({ index: 2, id: 'Xbox test', connected: true, mapping: 'standard', axes: [0,0,0,0], buttons: Array.from({length:17},()=>({pressed:false,value:0})) });
  test('Gamepad radial deadzone suppresses drift, rescales analog motion and caps diagonals', () => {
    assert(deadzone(0.1,0.1).x===0,'Drift');
    const half=deadzone(0.6,0);assert(Math.abs(half.x-0.5)<0.00001,'Analog scaling');
    assert(Math.abs(Math.hypot(...Object.values(deadzone(1,1)))-1)<0.00001,'Diagonal boost');
  });
  test('Gamepad discovers sparse slots and actions fire only on rising edges', () => {
    const pad=makePad(), reader=new GamepadReader({getGamepads:()=>[null,null,pad]});
    assert(reader.poll().connected,'Sparse slot');pad.buttons[B.RT].value=0.8;
    assert(reader.poll().pressed[B.RT],'Analog trigger');assert(!reader.poll().pressed[B.RT],'Repeated trigger');
    pad.buttons[B.RT].value=0;reader.poll();pad.buttons[B.RT].value=0.8;assert(reader.poll().pressed[B.RT],'Second press');
  });
  test('Gamepad reconnect and reset require neutral controls; missing/blocked APIs are safe', () => {
    const pad=makePad();let pads=[pad];const reader=new GamepadReader({getGamepads:()=>pads});
    pad.buttons[B.A].pressed=true;assert(!reader.poll().pressed[B.A],'Connected held A');
    pad.buttons[B.A].pressed=false;reader.poll();pad.axes[0]=1;assert(reader.poll().move.x===1,'Movement');
    reader.reset();assert(reader.poll().move.x===0,'Reset stuck movement');
    pad.axes[0]=0;reader.poll();pads=[];assert(!reader.poll().connected,'Disconnect');
    pads=[pad];pad.buttons[B.A].pressed=true;assert(!reader.poll().pressed[B.A],'Reconnection click');
    assert(!new GamepadReader({getGamepads(){throw Error('blocked');}}).poll().connected,'Blocked API');
    assert(!new GamepadReader({}).poll().connected,'Missing API');
    pad.mapping='';assert(!reader.poll().connected,'Unknown mapping accepted');
  });
  test('Controller target cycling excludes dead/distant enemies and directional targeting follows the screen', () => {
    const world=createWorld({legacy:true});world.player.x=35;world.player.y=36;
    world.enemies=[{id:'right',x:36,y:35,health:10},{id:'left',x:34,y:37,health:10},{id:'dead',x:35,y:36,health:0},{id:'far',x:70,y:70,health:10}];
    cycleTarget(world);const first=world.player.targetId;cycleTarget(world);assert(world.player.targetId!==first,'No cycle');
    cycleTarget(world);assert(world.player.targetId===first,'Did not wrap');
    aimTarget(world,{x:1,y:0});assert(world.player.targetId==='right','Wrong screen direction');
  });
  test('Controller interaction selects only ready nearby objects', () => {
    const world=createWorld({legacy:true});world.npcs=[];world.drops=[];world.map.resources=[{id:'ready',x:world.player.x+1,y:world.player.y,readyAt:0},{id:'spent',x:world.player.x,y:world.player.y,readyAt:99999}];
    assert(nearestInteraction(world).entity.id==='ready','Depleted selected');
    world.map.resources[0].x+=10;assert(!nearestInteraction(world),'Out of range');
  });
  return results;
}
