// Static scenery is indexed once, so drawing costs depend on the viewport, not world area.
export class SceneryIndex {
  constructor(entries, cellSize = 16) {
    this.cellSize = cellSize;
    this.cells = new Map();
    for (const entry of entries) {
      const key = `${Math.floor(entry.e.x / cellSize)},${Math.floor(entry.e.y / cellSize)}`;
      if (!this.cells.has(key)) this.cells.set(key, []);
      this.cells.get(key).push(entry);
    }
  }
  query(camera) {
    const corners = [[0,0],[camera.width,0],[0,camera.height],[camera.width,camera.height]].map(([x,y]) => camera.unproject(x,y));
    // Padding includes large mountain sprites and overhanging building roofs.
    const minX = Math.floor((Math.min(...corners.map(p=>p.x)) - 10) / this.cellSize);
    const maxX = Math.floor((Math.max(...corners.map(p=>p.x)) + 10) / this.cellSize);
    const minY = Math.floor((Math.min(...corners.map(p=>p.y)) - 10) / this.cellSize);
    const maxY = Math.floor((Math.max(...corners.map(p=>p.y)) + 10) / this.cellSize);
    const entries = [];
    for (let y = minY; y <= maxY; y++) for (let x = minX; x <= maxX; x++) {
      const cell = this.cells.get(`${x},${y}`);
      if (cell) entries.push(...cell);
    }
    return entries;
  }
}
