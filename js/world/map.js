// Map providers return this same Cartesian structure; a seeded provider can replace this one.
export function createMap() {
  const width = 80, height = 72;
  const buildings = [
    { id: 'smithy', name: 'Bram’s forge', x: 29, y: 29, w: 4, h: 3, roof: '#78544a' },
    { id: 'store', name: 'General store', x: 38, y: 29, w: 4, h: 3, roof: '#637b69' },
    { id: 'inn', name: 'The Hollow Inn', x: 29, y: 38, w: 5, h: 4, roof: '#8f6650' },
    { id: 'house-west', name: 'Bram’s home', x: 23, y: 33, w: 3, h: 3, roof: '#747161' },
    { id: 'house-east', name: 'Mara & Wren’s home', x: 45, y: 32, w: 3, h: 3, roof: '#737b60' },
    { id: 'house-south', name: 'Oswin’s home', x: 39, y: 43, w: 3, h: 3, roof: '#817568' },
    { id: 'farm', name: 'Hollow farm', x: 44, y: 40, w: 4, h: 3, roof: '#9b7d50' },
  ].map(b => ({ ...b, settlementId: 'wildhollow', door: { x: b.x + b.w / 2, y: b.y + b.h + 0.9 } }));
  const terrain = Array.from({ length: height }, (_, y) => Array.from({ length: width }, (_, x) => {
    if (x < 2 || y < 2 || x >= width - 2 || y >= height - 2) return 'water';
    if (Math.abs(x - 35) < 2 || (y >= 34 && y <= 36 && x > 21 && x < 51)) return 'road';
    if (x >= 44 && x < 51 && y >= 44 && y < 49) return 'field';
    return 'grass';
  }));
  const trees = [];
  for (let y = 4; y < height - 4; y += 2) for (let x = 4; x < width - 4; x += 2) {
    const hash = (x * 73856093 ^ y * 19349663) >>> 0;
    if (x > 20 && x < 53 && y > 25 && y < 51) continue;
    if (terrain[y][x] !== 'grass' || Math.abs(x - 35) < 4 || hash % 10 > 5) continue;
    trees.push({ id: `tree-${x}-${y}`, x: x + (hash % 5) / 10, y: y + (hash % 7) / 10, radius: 0.45, variant: hash % 3 });
  }
  const resources = [
    ...[[26,39],[25,29],[43,37],[49,38],[50,50],[21,43],[31,23],[40,24],[20,32],[53,34]].map(([x,y],i) => ({ id: `herb-${i}`, kind: 'herb', x, y, readyAt: 0 })),
    ...[[28,25],[42,24],[22,41],[49,29],[54,47],[20,25],[57,36],[43,54]].map(([x,y],i) => ({ id: `ore-${i}`, kind: 'ore', x, y, readyAt: 0 })),
  ];
  const spawns = [
    ...[[25,26],[43,26],[24,42],[49,37],[29,47],[41,49]].map(p => ['rat', ...p]),
    ...[[18,30],[55,32],[25,19],[46,19],[54,51],[24,54]].map(p => ['wolf', ...p]),
    ...[[15,19],[59,22],[59,55],[17,56],[43,60]].map(p => ['goblin', ...p]),
  ];
  // Keep spawn/resource centers clear without introducing random world data.
  const clear = [...resources, ...spawns.map(([,x,y]) => ({ x, y }))];
  return { id: 'hollow-valley', width, height, terrain, buildings,
    trees: trees.filter(t => !clear.some(p => Math.hypot(t.x-p.x,t.y-p.y) < 1.6)),
    resources, spawns, spawn: { x: 35, y: 36 }, settlement: { id: 'wildhollow', name: 'Wildhollow' } };
}
