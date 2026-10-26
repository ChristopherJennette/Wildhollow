import { createWorld } from '../js/world/world.js';
import { generateMap as villageMap } from '../js/world/generator-v1.js';
import { walkable } from '../js/systems/movement.js';
import { saveGame, loadGame } from '../js/systems/save.js';
import { discoverLandmarks, navigationHint } from '../js/world/exploration.js';
import { renderAtlas } from '../js/ui/atlas-panel.js';
import { SceneryIndex } from '../js/graphics/spatial-index.js';

export function runRegionTests() {
  const results = [];
  const assert = (value,message) => { if (!value) throw Error(message); };
  const test = (name,fn) => { try { fn();results.push(`PASS ${name}`); } catch(error) { results.push(`FAIL ${name}: ${error.message}`); } };
  test('Regional routes reach all 16 landmarks across diverse seeds, including river bridges', () => {
    for (const seed of [0,1,9,42,73,1000,98253,4294967295]) {
      const world = createWorld({seed}), map = world.map;
      assert(map.width===512 && map.height===512,'Incorrect region cap');
      assert(map.landmarks.length===16,'Missing landmarks');
      const connected=new Set(['wildhollow']);
      for(const route of map.routes) {
        assert(connected.has(route.from),'Road network disconnected');
        connected.add(route.to);
        assert(route.points.length>0,'Empty route');
        for(const [x,y] of route.points) assert(walkable(world,x+.5,y+.5),`Seed ${seed}: blocked route ${x},${y}`);
      }
      for(const poi of map.landmarks) assert(connected.has(poi.id)&&walkable(world,poi.x,poi.y),'Unreachable landmark');
      const types=new Set(map.terrain.flat());
      for(const type of ['forest','sand','mountain','water','bridge','trail','road']) assert(types.has(type),'Missing terrain '+type);
      const peak=map.terrain.findIndex(row=>row.includes('mountain'));
      const x=map.terrain[peak].indexOf('mountain');
      assert(!walkable(world,x+.5,peak+.5),'Mountain is passable');
      for(const poi of map.landmarks.filter(point=>point.kind==='harbor')) {
        let shoreline=false;
        for(let dy=-12;dy<=12;dy++)for(let dx=-12;dx<=12;dx++)if(map.terrain[Math.floor(poi.y)+dy]?.[Math.floor(poi.x)+dx]==='water')shoreline=true;
        assert(shoreline,'Landing too far from shoreline');
      }
    }
  });
  test('Original procedural saves retain generator-one geography and state', () => {
    const world=createWorld({seed:123,generatorVersion:1});
    let raw;const storage={setItem(k,v){raw=v;},getItem(){return raw;}};
    world.player.gold=112;saveGame(world,storage);
    const loaded=loadGame(storage).world;
    assert(loaded.player.gold===112,'Old progress lost');
    assert(JSON.stringify(loaded.map)===JSON.stringify(villageMap(123)),'Old geography changed');
  });
  test('Discovery grants XP once and survives save alongside tracking and exploration', () => {
    const world=createWorld({seed:42}),poi=world.map.landmarks[0];
    Object.assign(world.player,{x:poi.x,y:poi.y});
    discoverLandmarks(world,()=>{});
    const xp=world.player.xp;discoverLandmarks(world,()=>{});
    assert(world.player.discovered.includes(poi.id)&&world.player.xp===xp,'Repeated landmark reward');
    world.player.trackedPoi=poi.id;
    world.player.explored=Array.from({length:500},(_,i)=>`${i%64},${Math.floor(i/64)}`);
    let raw;const storage={setItem(k,v){raw=v;},getItem(){return raw;}};
    assert(saveGame(world,storage).ok,'Save failed');
    const loaded=loadGame(storage).world;
    assert(loaded.player.discovered.includes(poi.id)&&loaded.player.trackedPoi===poi.id,'Lost discovery/tracking');
    assert(loaded.player.explored.length===500,'Exploration truncated');
    assert(navigationHint(loaded).includes('Arrived'),'Arrival guidance missing');
    assert(raw.length<150000,'Save includes excessive static geography');
  });
  test('Atlas supports old and regional worlds and static scenery queries stay local', () => {
    const world=createWorld({seed:42});
    const html=renderAtlas(world);
    assert(html.includes('data-track-poi="wildhollow"')&&html.includes('Greywatch Keep'),'Missing map destinations');
    assert(renderAtlas(createWorld({legacy:true})).includes('original map'),'Legacy map explanation missing');
    const entries=world.map.trees.map(e=>({e}));
    const index=new SceneryIndex(entries);
    const visible=index.query({width:20,height:20,unproject:(x,y)=>({x:x+246,y:y+246})});
    assert(visible.length<entries.length/10,'Scenery query scans whole map');
  });
  return results;
}
