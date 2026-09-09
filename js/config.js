export const CONFIG = {
  version: '0.1.0', saveVersion: 1, saveKey: 'wildhollow.save',
  tileWidth: 64, tileHeight: 32, minZoom: 0.55, maxZoom: 1.7, maxDpr: 2, tick: 1 / 30,
  daySeconds: 480, startHour: 8, npcInterval: 0.25, autosaveSeconds: 15,
  playerSpeed: 3, meleeRange: 1.25, attackInterval: 0.85,
  activeRadius: 23, respawnSeconds: 75, deathPenaltySeconds: 45,
  baseAttribute: 8, attributePerSkillLevel: 0.16,
};
export const clamp = (value, min, max) => Math.max(min, Math.min(max, value));
export const distance = (a, b) => Math.hypot(a.x - b.x, a.y - b.y);
// All balance formulas live here. Skills and attributes stay on different scales.
export const FORMULAS = {
  skillXP: level => Math.round(18 + level * 7 + level * level * 0.6),
  characterXP: level => Math.round(70 + level * 40 + level * level * 10),
  health: a => 55 + a.Constitution * 6,
  stamina: a => 40 + a.Constitution * 3 + a.Dexterity * 2,
  mana: a => 30 + a.Intelligence * 5 + a.Wisdom * 2,
  melee: (a, s, weapon) => weapon + a.Strength * 0.7 + s.oneHanded.level * 0.35,
  cleave: (a, s, weapon) => weapon * 1.5 + a.Strength + s.oneHanded.level * 0.5,
  backstab: (a, s, weapon) => weapon * 2 + a.Dexterity * 1.5 + s.stealth.level * 0.8,
  fireball: (a, s) => 17 + a.Intelligence * 1.5 + s.destruction.level * 0.85,
  healingWord: (a, s) => 18 + a.Wisdom * 1.5 + s.restoration.level * 0.7,
  powerStrike: (a,s,weapon) => weapon*1.6+a.Strength+s.oneHanded.level*0.5,
  spark: (a,s) => 9+a.Intelligence+s.destruction.level*0.5,
  frostNova: (a,s) => 13+a.Intelligence+s.destruction.level*0.6,
  lifeDrain: (a,s) => 14+a.Intelligence+s.destruction.level*0.7,
  whirlwind: (a,s,weapon) => weapon*1.4+a.Strength+s.oneHanded.level*0.6,
  secondWind: (a,s) => 25+a.Wisdom+s.restoration.level*0.5,
  armor: (a, s) => Math.min(0.55, a.Dexterity * 0.005 + s.lightArmor.level * 0.003),
};
