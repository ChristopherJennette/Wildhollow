import { CONFIG, FORMULAS } from '../config.js';
import { SKILLS } from '../data/definitions.js';

export function refreshAttributes(player) {
  const attributes = Object.fromEntries(['Strength','Dexterity','Constitution','Intelligence','Wisdom','Charisma'].map(name => [name, CONFIG.baseAttribute]));
  for (const [id, definition] of Object.entries(SKILLS)) {
    for (const [attribute, weight] of Object.entries(definition.attributes)) attributes[attribute] += (player.skills[id].level - 1) * weight * CONFIG.attributePerSkillLevel;
  }
  player.attributes = attributes;
}
export function maxima(player) {
  return Object.fromEntries(['health','stamina','mana'].map(id => [id, FORMULAS[id](player.attributes)]));
}
export function skillXP(player, id, amount) {
  const skill = player.skills[id];
  if (!skill || amount <= 0 || skill.level >= 100) return;
  skill.xp += amount;
  while (skill.level < 100 && skill.xp >= FORMULAS.skillXP(skill.level)) {
    skill.xp -= FORMULAS.skillXP(skill.level++);
  }
  if (skill.level === 100) skill.xp = 0;
  refreshAttributes(player);
}
export function characterXP(player, amount, notify = () => {}) {
  player.xp += amount;
  while (player.xp >= FORMULAS.characterXP(player.level)) {
    player.xp -= FORMULAS.characterXP(player.level++);
    player.points++;
    notify(`Level ${player.level}! You gained an ability point.`);
  }
}
export function explore(world, notify) {
  const p = world.player, key = `${Math.floor(p.x / 8)},${Math.floor(p.y / 8)}`;
  if (!p.explored.includes(key)) {
    p.explored.push(key); skillXP(p, 'survival', 9); characterXP(p, 12, notify);
  }
}
