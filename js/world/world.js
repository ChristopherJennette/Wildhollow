import { generateMap } from './generator.js';
import { createMap } from './map.js';
import { ENEMIES, NPCS, SKILLS } from '../data/definitions.js';
import { CONFIG, distance } from '../config.js';
import { refreshAttributes, maxima } from '../systems/progression.js';

export function createWorld({seed,legacy=false} = {}) {
  const map = legacy ? createMap() : generateMap(seed);
  const player = { id: 'player', ...map.spawn, radius: 0.25, level: 1, xp: 0, points: 1,
    skills: Object.fromEntries(Object.keys(SKILLS).map(id => [id, { level: 1, xp: 0 }])),
    attributes: {}, inventory: { rustySword: 1, potion: 2 }, weapon: 'rustySword', gold: 8,
    abilities: [], hotbar: Array(5).fill(null), cooldowns: {}, explored: [], stealthEncounters: [],
    targetId: null, destination: null, path: [], sneaking: false, attackTimer: 0,
    penalty: 0, recoverableHealth: 0, facing: { x: 0, y: 1 } };
  refreshAttributes(player);
  Object.assign(player, maxima(player));
  const world = { map, player, time: CONFIG.startHour / 24 * CONFIG.daySeconds, elapsed: 0, drops: [], effects: [],
    enemies: map.spawns.map(([kind,x,y],i) => ({ id: `enemy-${i}`, kind, x, y, spawn: { x,y },
      radius: 0.25, health: ENEMIES[kind].health, attackTimer: 0, respawnAt: 0, aggro: false,
      path: [], destination: null, facing: { x: 0, y: 1 }, armorXP: 0, generation: 0 })),
    npcs: NPCS.map(def => { const home = map.buildings.find(b => b.id === def.home);
      return { ...def, x: home.door.x, y: home.door.y, radius: 0.23, state: 'home', path: [], destination: null }; }),
  };
  // Static occupancy is shared by pathfinding, line of sight, and collision checks.
  world.blocked = Array.from({ length: map.height }, (_, y) => map.terrain[y].map(t => t === 'water'));
  for (const b of map.buildings) for (let y=b.y; y<b.y+b.collisionFootprint.h; y++) for(let x=b.x;x<b.x+b.collisionFootprint.w;x++) world.blocked[y][x]=true;
  for (const t of map.trees) world.blocked[Math.floor(t.y)][Math.floor(t.x)] = true;
  return world;
}
export function hour(world) { return (world.time / CONFIG.daySeconds * 24) % 24; }
export function target(world) { return world.enemies.find(e => e.id === world.player.targetId && e.health > 0); }

export function acquireTarget(world,eligible=()=>true) {
  const selected=target(world);
  if(selected)return selected;
  let closest=null;
  for(const enemy of world.enemies) {
    if(enemy.health>0 && eligible(enemy) && (!closest || distance(world.player,enemy)<distance(world.player,closest)))closest=enemy;
  }
  world.player.targetId=closest?.id || null;
  return closest;
}
