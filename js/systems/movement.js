import { distance } from '../config.js';

export function walkable(world, x, y, radius = 0.25) {
  for (const dx of [-radius, radius]) for (const dy of [-radius, radius]) {
    if (world.blocked[Math.floor(y+dy)]?.[Math.floor(x+dx)] !== false) return false;
  }
  return true;
}
export function clearLine(world, a, b) {
  const steps = Math.ceil(distance(a,b) * 10);
  for(let i=1;i<=steps;i++) if(!walkable(world,a.x+(b.x-a.x)*i/steps,a.y+(b.y-a.y)*i/steps,0.25)) return false;
  return true;
}
// Bounded A*: grid navigation produces waypoints, while entity motion stays continuous.
export function findPath(world, start, goal) {
  if (!walkable(world,goal.x,goal.y)) return [];
  if (clearLine(world,start,goal)) return [{x:goal.x,y:goal.y}];
  const width = world.map.width, key = (x,y) => y*width+x;
  const sx=Math.floor(start.x), sy=Math.floor(start.y), gx=Math.floor(goal.x), gy=Math.floor(goal.y);
  const open=[{x:sx,y:sy,g:0,f:0}], costs=new Map([[key(sx,sy),0]]), parents=new Map(), closed=new Set();
  let iterations=0;
  while(open.length && iterations++ < 6000) {
    let best=0; for(let i=1;i<open.length;i++) if(open[i].f<open[best].f) best=i;
    const node=open.splice(best,1)[0], id=key(node.x,node.y);
    if(closed.has(id)) continue;
    if(node.x===gx && node.y===gy) {
      const path=[{x:goal.x,y:goal.y}]; let cursor=id;
      while(cursor!==key(sx,sy)) { path.push({x:cursor%width+0.5,y:Math.floor(cursor/width)+0.5}); cursor=parents.get(cursor); }
      path.push({x:sx+0.5,y:sy+0.5});
      return path.reverse();
    }
    closed.add(id);
    for(const [dx,dy] of [[1,0],[-1,0],[0,1],[0,-1],[1,1],[-1,1],[1,-1],[-1,-1]]) {
      const x=node.x+dx,y=node.y+dy,next=key(x,y);
      if(!walkable(world,x+0.5,y+0.5) || closed.has(next)) continue;
      if(dx && dy && (!walkable(world,node.x+dx+0.5,node.y+0.5) || !walkable(world,node.x+0.5,node.y+dy+0.5))) continue;
      const g=node.g+Math.hypot(dx,dy);
      if(g >= (costs.get(next) ?? Infinity)) continue;
      costs.set(next,g);parents.set(next,id);open.push({x,y,g,f:g+Math.hypot(gx-x,gy-y)});
    }
  }
  return [];
}
export function setDestination(world, entity, goal) {
  entity.destination={x:goal.x,y:goal.y}; entity.path=findPath(world,entity,goal);
  if(!entity.path.length) entity.destination=null;
  return entity.path.length>0;
}
export function move(world, entity, speed, dt) {
  let remaining=speed*dt;
  while(entity.path?.length && remaining>0) {
    const point=entity.path[0], d=distance(entity,point);
    if(d<0.04) {entity.path.shift();continue;}
    const step=Math.min(remaining,d), dx=(point.x-entity.x)/d,dy=(point.y-entity.y)/d;
    const x=entity.x+dx*step,y=entity.y+dy*step;
    if(!walkable(world,x,y,entity.radius)) {entity.path=[];entity.destination=null;break;}
    entity.x=x;entity.y=y;entity.facing={x:dx,y:dy};remaining-=step;
    if(step===d) entity.path.shift();
  }
  if(!entity.path?.length) entity.destination=null;
}

export function moveDirect(world, entity, input, speed, dt) {
  const magnitude = Math.hypot(input.x, input.y);
  if (!magnitude) return false;
  const dx = input.x / Math.max(1, magnitude) * speed * dt;
  const dy = input.y / Math.max(1, magnitude) * speed * dt;
  const steps = Math.max(1, Math.ceil(Math.hypot(dx, dy) / 0.1));
  const startX = entity.x, startY = entity.y;
  for (let i = 0; i < steps; i++) {
    // Slide along walls; substeps prevent crossing narrow obstacles on a slow frame.
    if (walkable(world, entity.x + dx / steps, entity.y, entity.radius)) entity.x += dx / steps;
    if (walkable(world, entity.x, entity.y + dy / steps, entity.radius)) entity.y += dy / steps;
  }
  const moved = Math.hypot(entity.x - startX, entity.y - startY);
  if (moved) entity.facing = { x: (entity.x - startX) / moved, y: (entity.y - startY) / moved };
  return moved > 0.001;
}
