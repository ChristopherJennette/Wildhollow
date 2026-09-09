export const SKILLS = {
  oneHanded: { name: 'One-Handed', attributes: { Strength: 1 }, use: 'Land melee attacks.' },
  stealth: { name: 'Stealth', attributes: { Dexterity: 1 }, use: 'Sneak past nearby threats or backstab.' },
  lightArmor: { name: 'Light Armor', attributes: { Dexterity: 1 }, use: 'Survive enemy attacks; limited per enemy.' },
  destruction: { name: 'Destruction', attributes: { Intelligence: 1 }, use: 'Damage enemies with Fireball.' },
  restoration: { name: 'Restoration', attributes: { Wisdom: 1 }, use: 'Restore health lost in combat.' },
  bartering: { name: 'Bartering', attributes: { Charisma: 1 }, use: 'Sell gathered goods to Mara.' },
  smithing: { name: 'Smithing', attributes: { Strength: 0.5, Intelligence: 0.5 }, use: 'Forge equipment using ore.' },
  survival: { name: 'Survival', attributes: { Constitution: 0.7, Wisdom: 0.3 }, use: 'Explore new areas and gather resources.' },
};
export const ABILITIES = {
  cleave: { name: 'Cleave', resource: 'stamina', cost: 24, cooldown: 6, range: 1.6, skill: 'oneHanded', description: 'Strike your target and enemies within 2 paces of you.' },
  backstab: { name: 'Backstab', resource: 'stamina', cost: 20, cooldown: 7, range: 1.5, skill: 'stealth', description: 'Sneak behind an unalerted enemy and strike. Normal attacks pause while sneaking.' },
  fireball: { name: 'Fireball', resource: 'mana', cost: 22, cooldown: 4, range: 7, skill: 'destruction', description: 'Hit your target with magic; nearby enemies take half damage.' },
  healingWord: { name: 'Healing Word', resource: 'mana', cost: 20, cooldown: 8, skill: 'restoration', description: 'Restore your health. Power grows with Wisdom and Restoration.' },
};
export const ENEMIES = {
  rat: { name: 'Rat', health: 34, damage: 4, speed: 2.4, range: 0.9, interval: 1.25, aggro: 3.3, xp: 25, color: '#ad927e', loot: 'scrap' },
  wolf: { name: 'Wolf', health: 85, damage: 10, speed: 3.4, range: 1.1, interval: 1.15, aggro: 4.8, xp: 55, color: '#9aa9aa', loot: 'pelt' },
  goblin: { name: 'Goblin', health: 110, damage: 13, speed: 2.65, range: 1.2, interval: 1.3, aggro: 4.5, xp: 75, color: '#9fa65c', loot: 'ore' },
};
export const ITEMS = {
  rustySword: { name: 'Rusty sword', type: 'weapon', damage: 7, value: 3 },
  ironSword: { name: 'Iron sword', type: 'weapon', damage: 13, value: 16 },
  potion: { name: 'Healing draught', type: 'consumable', heal: 40, value: 12 },
  herb: { name: 'Wild herb', type: 'material', value: 3 },
  ore: { name: 'Iron ore', type: 'material', value: 5 },
  scrap: { name: 'Salvaged scrap', type: 'material', value: 2 },
  pelt: { name: 'Wolf pelt', type: 'material', value: 8 },
};
export const NPCS = [
  { id: 'npc-bram', name: 'Bram', occupation: 'Blacksmith', home: 'house-west', workplace: 'smithy', color: '#c08757' },
  { id: 'npc-mara', name: 'Mara', occupation: 'Merchant', home: 'house-east', workplace: 'store', color: '#ba82a4' },
  { id: 'npc-elin', name: 'Elin', occupation: 'Innkeeper', home: 'inn', workplace: 'inn', color: '#d4b670' },
  { id: 'npc-oswin', name: 'Oswin', occupation: 'Farmer', home: 'house-south', workplace: 'farm', color: '#b5b974' },
  { id: 'npc-wren', name: 'Wren', occupation: 'Villager', home: 'house-east', workplace: 'farm', color: '#7dabaa' },
];
