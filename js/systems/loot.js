// Independent rolls allow a common material and occasional bonus in one drop.
export const LOOT = {
  rat: [{item:'scrap',min:1,max:2},{item:'fang',chance:.12}],
  wolf: [{item:'pelt',min:1,max:2},{item:'fang',chance:.65},{item:'herb',chance:.15}],
  goblin: [{item:'ore',min:1,max:2},{item:'scrap',chance:.65},{item:'potion',chance:.08},{item:'ironDagger',chance:.025}],
  herb: [{item:'herb',min:1,max:2},{item:'mushroom',chance:.12}],
  ore: [{item:'ore',min:1,max:2},{item:'scrap',chance:.2},{item:'crystal',chance:.12}],
  wood: [{item:'wood',min:1,max:3},{item:'hardwood',chance:.25},{item:'resin',chance:.12}],
  tree: [{item:'wood',min:2,max:4},{item:'hardwood',chance:.3},{item:'resin',chance:.15}],
  berry: [{item:'berry',min:1,max:3},{item:'herb',chance:.12}],
  mushroom: [{item:'mushroom',min:1,max:2},{item:'herb',chance:.12}],
};
export function rollLoot(kind, random = Math.random) {
  return (LOOT[kind] || []).flatMap(entry => {
    if (random() >= (entry.chance ?? 1)) return [];
    const min = entry.min ?? 1, max = entry.max ?? min;
    return [{item:entry.item, quantity:min + Math.floor(random() * (max-min+1))}];
  });
}
