import { characterXP, skillXP } from '../systems/progression.js';

export function regionName(map, point) {
  const bounds = map.settlement.bounds;
  if (bounds && point.x > bounds.left && point.x < bounds.right && point.y > bounds.top && point.y < bounds.bottom) return map.settlement.name;
  if (!map.regions?.length) return 'The wilds';
  return [...map.regions].sort((a,b) => Math.hypot(a.x-point.x,a.y-point.y)-Math.hypot(b.x-point.x,b.y-point.y))[0].name;
}

export function discoverLandmarks(world, notify) {
  const player = world.player;
  player.discovered ||= [];
  for (const landmark of world.map.landmarks || []) {
    if (Math.hypot(player.x-landmark.x,player.y-landmark.y) > 9 || player.discovered.includes(landmark.id)) continue;
    player.discovered.push(landmark.id);
    skillXP(player, 'survival', 35);
    characterXP(player, 60, notify);
    notify(`Discovered ${landmark.name}. +60 XP`);
  }
}

export function navigationHint(world) {
  const target = world.player.trackedPoi === 'wildhollow' ? { ...world.map.spawn, name: 'Wildhollow' }
    : world.map.landmarks?.find(point => point.id === world.player.trackedPoi);
  if (!target) return '';
  const dx = target.x - world.player.x, dy = target.y - world.player.y;
  const distance = Math.round(Math.hypot(dx,dy));
  if (distance < 5) return `${target.name} · Arrived`;
  // Screen-space bearing agrees with the isometric view, not atlas north.
  const angle = Math.atan2((dx+dy)*.5, dx-dy);
  const arrows = ['→','↘','↓','↙','←','↖','↑','↗'];
  return `${arrows[(Math.round(angle/(Math.PI/4))+8)%8]} ${target.name} · ${distance} tiles`;
}
