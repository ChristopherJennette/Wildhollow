// Small binary heap keeps long regional road searches bounded and deterministic.
class MinHeap {
  constructor() { this.items = []; }
  push(value) {
    const items = this.items;
    let index = items.length;
    items.push(value);
    while (index > 0) {
      const parent = (index - 1) >> 1;
      if (items[parent].score <= value.score) break;
      items[index] = items[parent]; index = parent;
    }
    items[index] = value;
  }
  pop() {
    const items = this.items, result = items[0], last = items.pop();
    if (!items.length) return result;
    let index = 0;
    while (index * 2 + 1 < items.length) {
      let child = index * 2 + 1;
      if (child + 1 < items.length && items[child + 1].score < items[child].score) child++;
      if (last.score <= items[child].score) break;
      items[index] = items[child]; index = child;
    }
    items[index] = last;
    return result;
  }
}

export function routeBetween(map, from, to, occupied) {
  const { width, height, terrain, riverCells } = map;
  const start = Math.floor(from.y) * width + Math.floor(from.x);
  const goal = Math.floor(to.y) * width + Math.floor(to.x);
  const costs = new Float64Array(width * height).fill(Infinity);
  const parents = new Int32Array(width * height).fill(-1);
  const open = new MinHeap();
  const distance = id => Math.abs(id % width - goal % width) + Math.abs(Math.floor(id / width) - Math.floor(goal / width));
  costs[start] = 0;
  open.push({ id: start, cost: 0, score: distance(start) });
  while (open.items.length) {
    const node = open.pop(), id = node.id;
    if (node.cost !== costs[id]) continue;
    if (id === goal) {
      const result = [];
      for (let cursor = goal; cursor !== -1; cursor = parents[cursor]) result.push([cursor % width, Math.floor(cursor / width)]);
      return result.reverse();
    }
    const x = id % width, y = Math.floor(id / width);
    for (const [dx, dy] of [[1,0], [0,1], [-1,0], [0,-1]]) {
      const nx = x + dx, ny = y + dy, next = ny * width + nx;
      if (nx < 2 || ny < 2 || nx >= width - 2 || ny >= height - 2 || occupied.has(next)) continue;
      const tile = terrain[ny][nx];
      if (tile === 'mountain' || (tile === 'water' && !riverCells.has(next))) continue;
      const weight = tile === 'water' ? 12 : tile === 'road' || tile === 'bridge' ? 1 : 2;
      const cost = node.cost + weight;
      if (cost >= costs[next]) continue;
      costs[next] = cost; parents[next] = id;
      open.push({ id: next, cost, score: cost + distance(next) });
    }
  }
  return [];
}

export function paintRoute(map, points, type, occupied, reserved) {
  for (const [x, y] of points) {
    // Roads are three tiles wide. Trails have narrow shoulders to avoid tree choke points.
    for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) {
      const nx = x + dx, ny = y + dy, id = ny * map.width + nx;
      const tile = map.terrain[ny]?.[nx];
      if (!tile || tile === 'mountain' || occupied.has(id)) continue;
      if (tile === 'water' && !map.riverCells.has(id)) continue;
      reserved.add(id);
      if (type === 'trail' && (dx || dy)) continue;
      if (tile === 'water') map.terrain[ny][nx] = 'bridge';
      else if (!['bridge', 'road'].includes(tile)) map.terrain[ny][nx] = type;
    }
  }
}
