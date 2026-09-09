import { CONFIG } from '../config.js';

export const DIRECTIONS = ['north', 'east', 'south', 'west'];
export const ANIMATIONS = {
  idle: { row: 0, count: 2, fps: 2, loop: true },
  walk: { row: 4, count: 4, fps: 8, loop: true },
  attack: { row: 8, count: 3, fps: 9, loop: false },
  cast: { row: 12, count: 4, fps: 8, loop: false },
  hurt: { row: 16, count: 1, fps: 5, loop: false },
  death: { row: 20, count: 4, fps: 6, loop: false },
};
const actor = (shape, color) => ({
  src: null, frameWidth: 64, frameHeight: 64, columns: 4,
  directions: DIRECTIONS, animations: ANIMATIONS,
  scale: 1, anchor: { x: 32, y: 56 }, offset: { x: 0, y: 0 }, layers: [],
  placeholder: { kind: 'actor', shape, color },
});
const object = (shape, width, height, x, y) => ({
  src: null, frameWidth: width, frameHeight: height, scale: 1,
  anchor: { x, y }, offset: { x: 0, y: 0 }, placeholder: { kind: 'object', shape },
});
const tile = (colors, material) => ({
  src: null, frameWidth: CONFIG.tileWidth, frameHeight: CONFIG.tileHeight,
  anchor: { x: CONFIG.tileWidth / 2, y: 0 }, scale: 1,
  placeholder: { kind: 'terrain', colors, material },
});
// Set src to a repository-relative asset path such as assets/creatures/wolf.png.
// null deliberately uses generated art without issuing missing-file requests.
export const SPRITES = {
  player: actor('player', '#657566'), npc: actor('human', '#c08757'),
  rat: actor('rat', '#8b8576'), wolf: actor('wolf', '#858c80'), goblin: actor('goblin', '#756e51'),
  grass: tile(['#697456', '#687355', '#6b7558', '#677153'], 'grass'),
  dirt: tile(['#8d8165', '#8b7e62'], 'dirt'), road: tile(['#a09679', '#9e9477', '#a2987b', '#9f9578'], 'road'),
  water: tile(['#4c6260'], 'water'), field: { ...tile(['#746e4e', '#797254'], 'field'), furrows: true },
  tree: object('tree', 72, 120, 36, 106), rock: object('rock', 32, 28, 16, 23),
  bush: object('bush', 32, 28, 16, 23),
  berry: object('berry',32,28,16,23), mushroom: object('mushroom',32,28,16,23), wood: object('wood',40,28,20,23), fence: object('fence', 76, 64, 38, 40),
  sign: object('sign', 40, 52, 20, 45), loot: object('loot', 32, 28, 16, 22),
  fireball: object('fireball', 32, 32, 16, 16),
  hit: object('hit', 40, 40, 20, 20), heal: object('heal', 48, 48, 24, 24),
};
export const TERRAIN = {
  grass: { sprite: 'grass' }, dirt: { sprite: 'dirt' }, road: { sprite: 'road' },
  water: { sprite: 'water' }, field: { sprite: 'field' },
};
export const WORLD_OBJECTS = {
  tree: { sprite: 'tree', collision: { radius: 0.45, blocksTile: true } },
  rock: { sprite: 'rock', collision: { radius: 0.4, blocksTile: true } },
  fence: { sprite: 'fence', collision: { radius: 0.25, blocksTile: true } },
  sign: { sprite: 'sign', collision: { radius: 0, blocksTile: false } },
  bush: { sprite: 'bush', collision: { radius: 0, blocksTile: false } },
};
export const RESOURCE_SPRITES = { ore: 'rock', herb: 'bush', berry: 'berry', mushroom: 'mushroom', wood: 'wood' };
// Each layer may independently define src, frameWidth/Height, anchor, scale and offset.
const building = () => ({ layers: { floor: { src: null }, walls: { src: null }, roof: { src: null } } });
export const BUILDINGS = {
  house: building(), inn: building(), blacksmith: building(), store: building(), farm: building(),
};
export const EFFECTS = {
  text: { lifetime: 0.8 }, hit: { lifetime: 0.18, sprite: 'hit' },
  heal: { lifetime: 0.7, sprite: 'heal' }, projectile: { lifetime: 0.28, sprite: 'fireball' },
  ring: { lifetime: 0.5 },
};
