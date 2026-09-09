export const SKILLS = {
  alchemy: { name: 'Alchemy', attributes: { Intelligence: 0.7, Wisdom: 0.3 }, use: 'Brew potions and prepare herbal remedies.' },
  cooking: { name: 'Cooking', attributes: { Wisdom: 0.5, Constitution: 0.5 }, use: 'Prepare food from gathered ingredients.' },
  mining: { name: 'Mining', attributes: { Strength: 0.7, Constitution: 0.3 }, use: 'Gather iron ore.' },
  woodcutting: { name: 'Woodcutting', attributes: { Strength: 0.7, Constitution: 0.3 }, use: 'Collect usable wood from fallen timber.' },
  oneHanded: { name: 'One-Handed', attributes: { Strength: 1 }, use: 'Land melee attacks.' },
  stealth: { name: 'Stealth', attributes: { Dexterity: 1 }, use: 'Sneak past nearby threats or backstab.' },
  lightArmor: { name: 'Light Armor', attributes: { Dexterity: 1 }, use: 'Survive enemy attacks; limited per enemy.' },
  destruction: { name: 'Destruction', attributes: { Intelligence: 1 }, use: 'Damage enemies with offensive magic.' },
  restoration: { name: 'Restoration', attributes: { Wisdom: 1 }, use: 'Restore health lost in combat.' },
  bartering: { name: 'Bartering', attributes: { Charisma: 1 }, use: 'Sell gathered goods to Mara.' },
  smithing: { name: 'Smithing', attributes: { Strength: 0.5, Intelligence: 0.5 }, use: 'Forge equipment using ore.' },
  survival: { name: 'Survival', attributes: { Constitution: 0.7, Wisdom: 0.3 }, use: 'Explore new areas and gather resources.' },
};
export const ABILITIES = {
  cleave: { name: 'Cleave', resource: 'stamina', cost: 24, cooldown: 6, range: 1.6, skill: 'oneHanded', area: 2, center: 'player', description: 'Strike your target and enemies within 2 paces of you.' },
  backstab: { name: 'Backstab', resource: 'stamina', cost: 20, cooldown: 7, range: 1.5, skill: 'stealth', description: 'Sneak behind an unalerted enemy and strike. Normal attacks pause while sneaking.' },
  fireball: { name: 'Fireball', resource: 'mana', cost: 22, cooldown: 4, range: 7, skill: 'destruction', area: 1.8, splash: 0.5, projectile: true, color: '#ffb15c', description: 'Hit your target with magic; nearby enemies take half damage.' },
  healingWord: { name: 'Healing Word', resource: 'mana', cost: 20, cooldown: 8, skill: 'restoration', restore: 'health', description: 'Restore your health. Power grows with Wisdom and Restoration.' },
  powerStrike: { name: 'Power Strike', resource: 'stamina', cost: 18, cooldown: 4, range: 1.5, skill: 'oneHanded', description: 'A heavy single-target blow, scaling with Strength and One-Handed.' },
  spark: { name: 'Spark', resource: 'mana', cost: 10, cooldown: 2, range: 6, skill: 'destruction', projectile: true, color: '#acd8ee', description: 'A quick, inexpensive ranged bolt.' },
  frostNova: { name: 'Frost Nova', resource: 'mana', cost: 28, cooldown: 10, range: 3, area: 3, center: 'player', skill: 'destruction', slow: { factor: 0.5, duration: 4 }, color: '#c4e7ed', description: 'Damage enemies within 3 paces and halve their movement speed for 4 seconds.' },
  lifeDrain: { name: 'Life Drain', resource: 'mana', cost: 24, cooldown: 8, range: 5, skill: 'destruction', drain: 0.5, projectile: true, color: '#bc91bd', description: 'Drain a target, healing for half the damage actually dealt.' },
  whirlwind: { name: 'Whirlwind', resource: 'stamina', cost: 38, cooldown: 10, range: 2.5, area: 2.5, center: 'player', skill: 'oneHanded', description: 'Strike all nearby enemies with a sweeping weapon attack.' },
  secondWind: { name: 'Second Wind', resource: 'mana', cost: 16, cooldown: 12, skill: 'restoration', restore: 'stamina', description: 'Restore stamina. Scales with Wisdom and Restoration; no XP for resource cycling.' },

};
export const ENEMIES = {
  rat: { name: 'Rat', health: 34, damage: 4, speed: 2.4, range: 0.9, interval: 1.25, aggro: 3.3, xp: 25, color: '#ad927e', loot: 'scrap' },
  wolf: { name: 'Wolf', health: 85, damage: 10, speed: 3.4, range: 1.1, interval: 1.15, aggro: 4.8, xp: 55, color: '#9aa9aa', loot: 'pelt', extraLoot: 'fang' },
  goblin: { name: 'Goblin', health: 110, damage: 13, speed: 2.65, range: 1.2, interval: 1.3, aggro: 4.5, xp: 75, color: '#9fa65c', loot: 'ore' },
};
export const ITEMS = {
  rustySword: { name: 'Rusty sword', type: 'weapon', damage: 7, value: 3 },
  ironSword: { name: 'Iron sword', type: 'weapon', damage: 13, value: 16 },
  potion: { name: 'Healing draught', type: 'consumable', heal: 40, value: 6 },
  herb: { name: 'Wild herb', type: 'material', heal: 5, value: 3 },
  ore: { name: 'Iron ore', type: 'material', value: 5 },
  scrap: { name: 'Salvaged scrap', type: 'material', value: 2 },
  pelt: { name: 'Wolf pelt', type: 'material', value: 8 },
  manaPotion: { name: 'Mana draught', type: 'consumable', restore: { mana: 40 }, value: 7 },
  staminaPotion: { name: 'Vigor tonic', type: 'consumable', restore: { stamina: 50 }, value: 6 },
  salve: { name: 'Herbal salve', type: 'consumable', heal: 22, value: 4 },
  berry: { name: 'Forest berries', type: 'material', restore: { stamina: 6 }, value: 2 },
  mushroom: { name: 'Edible mushroom', type: 'material', value: 3 },
  wood: { name: 'Dry timber', type: 'material', value: 3 },
  fang: { name: 'Wolf fang', type: 'material', value: 4 },
  ingot: { name: 'Iron ingot', type: 'material', value: 8 },
  ironDagger: { name: 'Iron dagger', type: 'weapon', damage: 10, value: 10 },
  temperedSword: { name: 'Tempered sword', type: 'weapon', damage: 19, value: 26 },
  trailRations: { name: 'Trail rations', type: 'consumable', restore: { health: 15, stamina: 30 }, value: 7 },
  mushroomStew: { name: 'Mushroom stew', type: 'consumable', restore: { health: 25, mana: 12 }, value: 8 },

};
export const NPCS = [
  { id: 'npc-bram', name: 'Bram', occupation: 'Blacksmith', home: 'house-west', workplace: 'smithy', color: '#c08757' },
  { id: 'npc-mara', name: 'Mara', occupation: 'Merchant', home: 'house-east', workplace: 'store', color: '#ba82a4' },
  { id: 'npc-elin', name: 'Elin', occupation: 'Innkeeper', home: 'inn', workplace: 'inn', color: '#d4b670' },
  { id: 'npc-oswin', name: 'Oswin', occupation: 'Farmer', home: 'house-south', workplace: 'farm', color: '#b5b974' },
  { id: 'npc-wren', name: 'Wren', occupation: 'Villager', home: 'house-east', workplace: 'farm', color: '#7dabaa' },
];

export const RECIPES = {
  salve: { name: 'Prepare herbal salve', ingredients: { herb: 1 }, output: 'salve', skill: 'alchemy', xp: 12, characterXP: 8 },
  potion: { name: 'Brew healing draught', ingredients: { herb: 2 }, output: 'potion', skill: 'alchemy', xp: 24, characterXP: 14 },
  manaPotion: { name: 'Brew mana draught', ingredients: { herb: 2, mushroom: 1 }, output: 'manaPotion', skill: 'alchemy', xp: 30, characterXP: 18 },
  staminaPotion: { name: 'Brew vigor tonic', ingredients: { herb: 1, berry: 2 }, output: 'staminaPotion', skill: 'alchemy', xp: 24, characterXP: 14 },
  trailRations: { name: 'Prepare trail rations', ingredients: { berry: 2, mushroom: 1 }, output: 'trailRations', skill: 'cooking', xp: 26, characterXP: 15 },
  mushroomStew: { name: 'Cook mushroom stew', ingredients: { mushroom: 2, herb: 1, wood: 1 }, output: 'mushroomStew', skill: 'cooking', xp: 35, characterXP: 20 },
  ingot: { name: 'Smelt iron ingot', ingredients: { ore: 2, wood: 1 }, output: 'ingot', station: 'Blacksmith', skill: 'smithing', xp: 22, characterXP: 14 },
  ironDagger: { name: 'Forge iron dagger', ingredients: { ingot: 1, wood: 1 }, output: 'ironDagger', station: 'Blacksmith', skill: 'smithing', xp: 30, characterXP: 20 },
  ironSword: { name: 'Forge iron sword', ingredients: { ore: 3 }, output: 'ironSword', station: 'Blacksmith', skill: 'smithing', xp: 45, characterXP: 35 },
  temperedSword: { name: 'Forge tempered sword', ingredients: { ingot: 3, scrap: 2, wood: 1 }, output: 'temperedSword', station: 'Blacksmith', skill: 'smithing', xp: 65, characterXP: 45 },
};
export const SHOP = { potion: 12, manaPotion: 16, staminaPotion: 14, herb: 8, berry: 6, mushroom: 8, wood: 8, ore: 12, ironDagger: 24 };
export const GATHERING = { herb: 'survival', berry: 'survival', mushroom: 'survival', ore: 'mining', wood: 'woodcutting' };
