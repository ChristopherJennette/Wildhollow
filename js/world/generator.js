
export const GENERATOR_VERSION = 1;
export function newSeed() {
  if (globalThis.crypto?.getRandomValues) return crypto.getRandomValues(new Uint32Array(1))[0];
  return (Date.now() ^ Math.floor(Math.random()*0xffffffff)) >>> 0;
}
export function seededRandom(seed) {
  let state = seed >>> 0;
  return () => { state = (Math.imul(state,1664525)+1013904223) >>> 0; return state / 4294967296; };
}
export function generateMap(seed = newSeed()) {
  seed = seed >>> 0;
  const random = seededRandom(seed), integer = (min,max) => min+Math.floor(random()*(max-min+1));
  const width=80,height=72,cx=integer(35,43),cy=integer(31,39);
  const spawn={x:cx+0.5,y:cy+0.5};
  const terrain=Array.from({length:height},(_,y)=>Array.from({length:width},(_,x)=>x<2||y<2||x>=width-2||y>=height-2?'water':'grass'));
  // Broad, connected roads; only the wilderness portion meanders.
  const roadPhase=random()*Math.PI*2;
  for(let y=2;y<height-2;y++) {
    const x=Math.abs(y-cy)<16?cx:cx+Math.round(Math.sin(y/9+roadPhase)*4);
    for(let dx=-1;dx<=1;dx++)terrain[y][x+dx]='road';
    if(y>2){const previous=Math.abs(y-1-cy)<16?cx:cx+Math.round(Math.sin((y-1)/9+roadPhase)*4);for(let xx=Math.min(previous,x)-1;xx<=Math.max(previous,x)+1;xx++)terrain[y][xx]='road';}
  }
  for(let y=cy-1;y<=cy+1;y++)for(let x=cx-17;x<=cx+17;x++)terrain[y][x]='road';
  // Interchangeable plots keep village layouts varied and door routes connected.
  const plots=[[-10,-9],[4,-9],[-10,5],[4,5],[-17,-8],[11,-8],[-17,5],[11,5]];
  for(let i=plots.length-1;i>0;i--){const j=integer(0,i);[plots[i],plots[j]]=[plots[j],plots[i]];}
  const specs=[
    ['smithy','Bram’s forge','blacksmith',4,3,'#78544a'],['store','General store','store',4,3,'#637b69'],
    ['inn','The Hollow Inn','inn',5,4,'#8f6650'],['house-west','Bram’s home','house',3,3,'#747161'],
    ['house-east','Mara & Wren’s home','house',3,3,'#737b60'],['house-south','Oswin’s home','house',3,3,'#817568'],
    ['farm','Hollow farm','farm',4,3,'#9b7d50'],
  ];
  const buildings=specs.map(([id,name,type,w,h,roof],index)=>{
    const [dx,dy]=plots[index],x=cx+dx+integer(0,1),y=cy+dy+integer(0,1);
    return {id,name,type,x,y,w,h,roof,footprint:{w,h},collisionFootprint:{w,h},settlementId:'wildhollow',door:{x:x+w/2,y:y+h+0.9}};
  });
  const occupied=(x,y,pad=0)=>buildings.some(b=>x>=b.x-pad&&x<b.x+b.w+pad&&y>=b.y-pad&&y<b.y+b.h+pad);
  const reserve=new Set();
  function pathTile(x,y){
    if(!occupied(x,y)){if(terrain[y][x]!=='road')terrain[y][x]='dirt';reserve.add(`${x},${y}`);}
  }
  for(const b of buildings){
    const doorX=Math.floor(b.door.x),doorY=Math.floor(b.door.y);
    const lane=doorY>cy?b.x-1:doorX;
    for(let x=Math.min(doorX,lane);x<=Math.max(doorX,lane);x++)pathTile(x,doorY);
    for(let y=Math.min(doorY,cy);y<=Math.max(doorY,cy);y++)pathTile(lane,y);
  }
  const farm=buildings.find(b=>b.id==='farm');
  for(let y=farm.y+farm.h+2;y<farm.y+farm.h+6;y++)for(let x=farm.x;x<farm.x+5;x++){
    if(!occupied(x,y)&&terrain[y][x]!=='road'&&!reserve.has(`${x},${y}`))terrain[y][x]='field';
  }
  const patches=Array.from({length:12},()=>({x:integer(5,width-6),y:integer(5,height-6),radius:integer(2,5)}));
  for(const patch of patches)for(let y=Math.max(2,patch.y-patch.radius);y<=Math.min(height-3,patch.y+patch.radius);y++)for(let x=Math.max(2,patch.x-patch.radius);x<=Math.min(width-3,patch.x+patch.radius);x++){
    if(Math.hypot(x-patch.x,y-patch.y)<patch.radius && terrain[y][x]==='grass' && random()<0.7)terrain[y][x]='dirt';
  }
  const resources=[],spawns=[],claimed=new Set();
  function place(min,max) {
    for(let attempt=0;attempt<3000;attempt++){
      const angle=random()*Math.PI*2,r=min+random()*(max-min),x=Math.floor(cx+Math.cos(angle)*r)+0.5,y=Math.floor(cy+Math.sin(angle)*r)+0.5;
      if(x<4||y<4||x>width-5||y>height-5||occupied(x,y,1)||claimed.has(`${x},${y}`))continue;
      claimed.add(`${x},${y}`);return {x,y};
    }
    // Bounded deterministic fallback avoids incomplete content even with dense future layouts.
    for(let y=4;y<height-4;y++)for(let x=4;x<width-4;x++)if(!occupied(x+.5,y+.5,1)&&!claimed.has(`${x+.5},${y+.5}`)){
      claimed.add(`${x+.5},${y+.5}`);return{x:x+.5,y:y+.5};
    }
    throw new Error('No space left for world content');
  }
  for(const [kind,count] of [['herb',14],['ore',10],['berry',9],['mushroom',9],['wood',9]])for(let i=0;i<count;i++)resources.push({id:`${kind}-${i}`,kind,...place(8,kind==='ore'?27:22),readyAt:0});
  for(const [kind,count,min,max] of [['rat',7,15,20],['wolf',6,22,28],['goblin',5,29,36]])for(let i=0;i<count;i++){
    const p=place(min,max);spawns.push([kind,p.x,p.y]);
  }
  const protectedPoints=[spawn,...resources,...spawns.map(([,x,y])=>({x,y})),...buildings.map(b=>b.door)];
  const trees=[];
  const density=0.27+random()*0.12;
  // Keep a sparse grid of walkable corridors through the forest for reliable navigation.
  for(let y=4;y<height-4;y++)for(let x=4;x<width-4;x++){
    if(x%4===0||y%4===0||terrain[y][x]!=='grass'||Math.abs(x-cx)<19&&Math.abs(y-cy)<14||random()>density)continue;
    if(occupied(x,y,1)||protectedPoints.some(p=>Math.hypot(p.x-(x+.5),p.y-(y+.5))<1.8))continue;
    trees.push({id:`tree-${x}-${y}`,type:'tree',x:x+.5,y:y+.5,radius:.45,variant:integer(0,2)});
  }
  return {id:`hollow-${seed}`,seed,generatorVersion:GENERATOR_VERSION,width,height,terrain,buildings,trees,resources,spawns,spawn,
    settlement:{id:'wildhollow',name:'Wildhollow',bounds:{left:cx-19,right:cx+19,top:cy-14,bottom:cy+14}}};
}
