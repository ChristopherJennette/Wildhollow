import { generateMap as generateVillage, seededRandom } from './generator-v1.js';
import { routeBetween, paintRoute } from './region-routes.js';

export const REGION_SIZE = 512;
const hash = (x, y, seed) => {
  let n = Math.imul(x, 374761393) ^ Math.imul(y, 668265263) ^ seed;
  n = Math.imul(n ^ (n >>> 13), 1274126177);
  return ((n ^ (n >>> 16)) >>> 0) / 4294967296;
};
function noise(x, y, scale, seed) {
  x /= scale; y /= scale;
  const ix = Math.floor(x), iy = Math.floor(y);
  const smooth = t => t * t * (3 - 2 * t);
  const fx = smooth(x - ix), fy = smooth(y - iy);
  const top = hash(ix, iy, seed) * (1 - fx) + hash(ix + 1, iy, seed) * fx;
  const bottom = hash(ix, iy + 1, seed) * (1 - fx) + hash(ix + 1, iy + 1, seed) * fx;
  return top * (1 - fy) + bottom * fy;
}

export function generateRegion(seed) {
  seed >>>= 0;
  const random = seededRandom(seed ^ 0x946b39a1);
  const width = REGION_SIZE, height = REGION_SIZE;
  const center = width / 2;
  const phase = random() * Math.PI * 2;
  const riverX = y => center + 74 + Math.sin(y / 47 + phase) * 18 + Math.sin(y / 17) * 4;
  const riverCells = new Set();
  const terrain = Array.from({ length: height }, (_, y) => Array.from({ length: width }, (_, x) => {
    const coast = 37 + noise(0, y, 48, seed) * 35;
    const south = height - 35 - noise(x, 0, 55, seed + 1) * 27;
    const elevation = noise(x, y, 36, seed + 2);
    let tile = 'grass';
    if (x < coast || y > south) tile = 'water';
    else if (x < coast + 5 || y > south - 5) tile = 'sand';
    else if (y < 25 + elevation * 28 || x > width - 30 - elevation * 30 ||
      (Math.hypot(x - center, y - center) > 75 && elevation > .79)) tile = 'mountain';
    else if (noise(x, y, 25, seed + 3) > .62) tile = 'forest';
    // River runs from the northern mountains to the southern sea.
    const tributaryY = 176 + Math.sin(x / 29 + phase) * 9;
    const inTributary = x > 108 && x < riverX(y) && Math.abs(y - tributaryY) < 2;
    if (tile !== 'water' && ((y > 44 && Math.abs(x - riverX(y)) < 3) || inTributary)) {
      tile = 'water'; riverCells.add(y * width + x);
    }
    if (x < 2 || y < 2 || x >= width - 2 || y >= height - 2) tile = x < center || y > center ? 'water' : 'mountain';
    return tile;
  }));
  const town = generateVillage(seed);
  const offsetX = center - Math.floor(town.spawn.x), offsetY = center - Math.floor(town.spawn.y);
  const shift = point => ({ ...point, x: point.x + offsetX, y: point.y + offsetY });
  // Embed the established settlement and its nearby encounters, without its old water border.
  for (let y = 2; y < town.height - 2; y++) for (let x = 2; x < town.width - 2; x++) {
    terrain[y + offsetY][x + offsetX] = town.terrain[y][x];
  }
  const bounds = town.settlement.bounds;
  const map = {
    id: `hollow-region-${seed}`, seed, generatorVersion: 2, width, height, terrain,
    spawn: shift(town.spawn),
    settlement: { ...town.settlement, bounds: { left: bounds.left + offsetX, right: bounds.right + offsetX, top: bounds.top + offsetY, bottom: bounds.bottom + offsetY } },
    buildings: town.buildings.map(building => ({ ...shift(building), door: shift(building.door) })),
    trees: town.trees.map(shift), resources: town.resources.map(shift),
    spawns: town.spawns.map(([kind, x, y]) => [kind, x + offsetX, y + offsetY]),
    landmarks: [], decorations: [], routes: [], riverCells,
    regions: [
      { name: 'Westreach Coast', x: 82, y: 258 }, { name: 'Northwood', x: 227, y: 116 },
      { name: 'Greyspine Highlands', x: 423, y: 107 }, { name: 'Eastbank Forest', x: 404, y: 271 },
      { name: 'Southmere Woods', x: 244, y: 388 }, { name: 'Saltwind Shore', x: 223, y: 447 },
    ],
  };
  const occupied = new Set(), reserved = new Set();
  for (const building of map.buildings) for (let y = building.y; y < building.y + building.h; y++) for (let x = building.x; x < building.x + building.w; x++) occupied.add(y * width + x);
  const townRect = { left: offsetX + 2, right: offsetX + town.width - 2, top: offsetY + 2, bottom: offsetY + town.height - 2 };
  const inTown = (x, y) => x >= townRect.left && x < townRect.right && y >= townRect.top && y < townRect.bottom;
  const specs = [
    ['harbor', 'Westreach Landing', 85, 250, 'road'], ['camp', 'Northwood Camp', 220, 110, 'road'],
    ['ruin', 'Greywatch Keep', 417, 113, 'road'], ['camp', 'Eastbank Lodge', 410, 271, 'road'],
    ['ruin', 'Southmere Abbey', 251, 399, 'road'], ['harbor', 'Saltwind Landing', 215, 445, 'road'],
    ['ruin', 'The Broken Gate', 141, 151, 'trail'], ['shrine', 'Mosslight Stones', 167, 332, 'trail'],
    ['camp', 'Foxglove Camp', 113, 391, 'trail'], ['ruin', 'Old Quarry', 397, 181, 'trail'],
    ['shrine', 'Riverward Shrine', 365, 359, 'trail'], ['ruin', 'Briarwatch Ruins', 420, 408, 'trail'],
    ['shrine', 'Whispering Circle', 294, 158, 'trail'], ['camp', 'Pinefall Clearing', 119, 219, 'trail'],
    ['ruin', 'The Sunken Cloister', 146, 426, 'trail'], ['shrine', 'Stag’s Rest', 280, 340, 'trail'],
  ];
  // Connect destinations to an existing network; A* avoids cliffs and oceans, bridging only rivers.
  const connected = [{ id: 'wildhollow', ...map.spawn }];
  for (const [kind, name, nominalX, nominalY, routeType] of specs) {
    let x = nominalX + Math.floor(random() * 15) - 7;
    let y = nominalY + Math.floor(random() * 15) - 7;
    if (kind === 'harbor' && nominalX < 100) {
      x = terrain[y].findIndex(tile => tile === 'sand') + 5;
    } else if (kind === 'harbor') {
      y = height - 3;
      while (y > center && terrain[y][x] === 'water') y--;
      y -= 5;
    }
    let location = null, points = null, source = null;
    for (let radius = 0; radius < 35 && !location; radius += 3) {
      for (const [dx, dy] of [[radius,0],[-radius,0],[0,radius],[0,-radius]]) {
        const px = x + dx, py = y + dy;
        if (px < 5 || py < 5 || px >= width - 5 || py >= height - 5) continue;
        if (!['grass', 'forest', 'sand'].includes(terrain[py][px])) continue;
        const candidate = { x: px + .5, y: py + .5 };
        source = [...connected].sort((a, b) => Math.hypot(a.x - px, a.y - py) - Math.hypot(b.x - px, b.y - py))[0];
        points = routeBetween(map, source, candidate, occupied);
        if (points.length) { location = candidate; break; }
      }
    }
    if (!location) throw new Error(`Could not connect regional landmark: ${name}`);
    const landmark = { id: `poi-${map.landmarks.length}`, kind, name, ...location };
    map.landmarks.push(landmark);
    map.routes.push({ from: source.id, to: landmark.id, type: routeType, points });
    paintRoute(map, points, routeType, occupied, reserved);
    // Clearings and sparse stone remains give each destination a visible footprint.
    const lx = Math.floor(location.x), ly = Math.floor(location.y);
    for (let dy = -4; dy <= 4; dy++) for (let dx = -4; dx <= 4; dx++) {
      const tx = lx + dx, ty = ly + dy;
      if (Math.hypot(dx,dy) > 4 || ['water','mountain','bridge','road'].includes(terrain[ty][tx])) continue;
      terrain[ty][tx] = 'dirt'; reserved.add(ty * width + tx);
    }
    const shape = kind === 'ruin' ? 'ruin' : kind === 'shrine' ? 'standingStone' : kind === 'camp' ? 'tent' : 'sign';
    map.decorations.push({ id: `marker-${landmark.id}`, type: shape, x: location.x, y: location.y - 2 });
    if (kind === 'ruin') for (const [dx,dy] of [[-3,-2],[3,-2],[-3,2]]) map.decorations.push({id:`wall-${landmark.id}-${dx}-${dy}`,type:'ruin',x:location.x+dx,y:location.y+dy});
    connected.push(landmark);
    // Supplies are placed on the guaranteed reachable center, not in isolated terrain.
    const kinds = kind === 'ruin' ? ['ore','wood'] : kind === 'harbor' ? ['berry','wood'] : ['herb','mushroom'];
    for (let i = 0; i < kinds.length; i++) {
      const routePoint = points[Math.max(0, points.length - 3 - i * 3)];
      map.resources.push({ id: `${landmark.id}-${kinds[i]}`, kind: kinds[i], x: routePoint[0] + .5, y: routePoint[1] + .5, readyAt: 0 });
    }
    if (kind !== 'harbor') map.spawns.push([kind === 'ruin' ? 'goblin' : 'wolf', location.x, location.y]);
  }
  // Join the old north/south village road ends into the new network; no dead stubs.
  for (const y of [townRect.top, townRect.bottom - 1]) {
    const exits = terrain[y].map((tile,x) => tile === 'road' && inTown(x,y) ? x : -1).filter(x => x >= 0);
    if (!exits.length) continue;
    const from = { x: exits[Math.floor(exits.length / 2)] + .5, y: y + .5 };
    const to = map.landmarks[y < center ? 1 : 4];
    const points = routeBetween(map, from, to, occupied);
    paintRoute(map, points, 'road', occupied, reserved);
    map.routes.push({ from: 'wildhollow', to: to.id, type: 'road', points });
  }
  // Resource stops along routes reward long journeys without placing items behind cliffs.
  for (let routeIndex = 0; routeIndex < map.routes.length; routeIndex++) {
    const route = map.routes[routeIndex];
    for (let index = 30; index < route.points.length - 15; index += 35) {
      const [x,y] = route.points[index];
      if (inTown(x,y) || terrain[y][x] === 'bridge') continue;
      const kinds = ['wood','berry','herb','mushroom','ore'];
      const kind = kinds[Math.floor(random()*kinds.length)];
      map.resources.push({id:`route-${routeIndex}-${index}`,kind,x:x+.5,y:y+.5,readyAt:0});
    }
  }
  // The established village forest stays compatible; regional trees have noise-driven density.
  map.trees = map.trees.filter(tree => !reserved.has(Math.floor(tree.y) * width + Math.floor(tree.x)));
  for (let y = 3; y < height - 3; y++) for (let x = 3; x < width - 3; x++) {
    if (inTown(x,y) || reserved.has(y * width + x)) continue;
    const tile = terrain[y][x];
    if (tile === 'mountain') {
      if (x % 3 === 0 && y % 3 === 0) map.decorations.push({id:`peak-${x}-${y}`,type:'mountain',x:x+.5,y:y+.5});
      continue;
    }
    if (!['grass','forest'].includes(tile)) continue;
    const density = .12 + noise(x,y,19,seed + 4) * .28 + (tile === 'forest' ? .09 : 0);
    // Narrow unplanted corridors ensure the dense canopy never seals off a region.
    if (x % 5 && y % 5 && hash(x,y,seed + 5) < density) {
      map.trees.push({id:`forest-${x}-${y}`,type:'tree',x:x+.5,y:y+.5,radius:.45,variant:Math.floor(hash(x,y,seed+6)*3)});
    }
  }
  // Drop generation-only structures; terrain and routes reproduce from seed on load.
  delete map.riverCells;
  return map;
}
