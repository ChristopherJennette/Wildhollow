import { regionName } from '../world/exploration.js';

const COLORS = { water:'#45656b', mountain:'#90968b', sand:'#c5b78e', grass:'#7d8c61', forest:'#435f43', road:'#e1c28c', trail:'#ae9972', bridge:'#e5d2ac', dirt:'#9c8d6b', field:'#a5a363' };
const cache = new WeakMap();
function atlasTerrain(map) {
  if (cache.has(map)) return cache.get(map);
  const paths = {};
  // Four-tile samples preserve coastlines without creating thousands of SVG DOM nodes.
  for (let y=0;y<map.height;y+=4) {
    for (let x=0;x<map.width;) {
      const type=map.terrain[y][x];
      let end=x+4;
      while(end<map.width && map.terrain[y][end]===type) end+=4;
      paths[type]=(paths[type]||'')+`M${x} ${y}h${end-x}v4H${x}z`;
      x=end;
    }
  }
  const markup=Object.entries(paths).map(([type,path])=>`<path d="${path}" fill="${COLORS[type]||COLORS.grass}"/>`).join('');
  cache.set(map,markup);
  return markup;
}

export function renderAtlas(world) {
  const {map,player}=world;
  const landmarks=map.landmarks || [];
  const points=[{id:'wildhollow',name:'Wildhollow',kind:'Town',...map.spawn},...landmarks];
  const routes=(map.routes||[]).map(route=>`<polyline points="${route.points.map(([x,y])=>`${x+.5},${y+.5}`).join(' ')}" fill="none" stroke="${route.type==='road'?'#f3d8a1':'#cbb483'}" stroke-width="${route.type==='road'?2:1}" ${route.type==='trail'?'stroke-dasharray="3 2"':''}/>`).join('');
  const markers=points.map((point,index)=>`<g><circle cx="${point.x}" cy="${point.y}" r="${point.id===player.trackedPoi?6:4}" fill="${point.id===player.trackedPoi?'#fff0ba':'#263a32'}" stroke="#e5d19d"/><text x="${point.x+6}" y="${point.y-5}" font-size="8" fill="#fff3d0" stroke="#1b2921" stroke-width="2" paint-order="stroke">${index===0?'Town':index}</text></g>`).join('');
  const current=`<circle cx="${player.x}" cy="${player.y}" r="5" fill="#f2ffff" stroke="#204c55" stroke-width="2"/>`;
  const buttons=points.map((point,index)=>`<div class="row"><div><strong>${index?`${index}. `:''}${point.name}</strong><small>${point.kind} · ${Math.round(Math.hypot(point.x-player.x,point.y-player.y))} tiles · ${index===0||player.discovered?.includes(point.id)?'Discovered':'Charted, not visited'}</small></div><button data-track-poi="${point.id}" aria-pressed="${player.trackedPoi===point.id}">${player.trackedPoi===point.id?'Tracked':'Track'}</button></div>`).join('');
  return `<div class="section-heading"><div><h3>${regionName(map,player)}</h3><p class="muted">${map.width} × ${map.height} tiles · ${player.discovered?.length||0} / ${landmarks.length} landmarks discovered</p></div></div>${landmarks.length?'':'<p class="tag">This save keeps its original map. Begin a new journey from the main menu to explore the expanded regions; this replaces the active save after confirmation.</p>'}<div class="atlas-layout"><div><svg class="world-atlas" viewBox="0 0 ${map.width} ${map.height}" role="img" aria-label="Regional map. North is up. White marker: your position. Numbered landmarks match the destination list.">${atlasTerrain(map)}${routes}${markers}${current}</svg><p class="atlas-legend">N ↑ · White: you · Gold lines: roads · Dashed: trails<br>Blue: water · Grey: impassable mountains · Pale edges: shore<br>Destinations are charted; discovering them grants experience.</p><button data-track-poi="">Clear destination</button></div><div>${buttons}</div></div>`;
}
