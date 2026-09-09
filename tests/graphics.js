import { Camera, worldToIso, screenDirection } from '../js/camera.js';
import { SPRITES, BUILDINGS } from '../js/data/graphics.js';
import { SpriteManager, buildingSprite } from '../js/graphics/sprites.js';
import { animationFor, cueAnimation, updateAnimation, spriteFrame, facingDirection } from '../js/graphics/animation.js';
import { emitEffect, updateEffects } from '../js/graphics/effects.js';
import { Renderer, compareDepth } from '../js/renderer.js';
import { createWorld } from '../js/world/world.js';

const assert = (condition, message) => { if (!condition) throw new Error(message); };
const context = () => new Proxy({ globalAlpha: 1 }, { get: (target,key) => key in target ? target[key] : () => {} });
const fakeCanvas = (width,height) => ({ width,height,getContext:()=>context() });
export function runGraphicsTests(createCanvas = fakeCanvas) {
  const results=[];
  const test=(name,fn)=>{try{fn();results.push(`PASS ${name}`);}catch(e){results.push(`FAIL ${name}: ${e.message}`);}};
  test('Assets load once, cache placeholders, and survive missing/invalid images',()=>{
    const images=[];
    const assets=new SpriteManager({createCanvas,createImage:()=>{const image={width:256,height:1536,naturalWidth:256};images.push(image);return image;}});
    const definition={...SPRITES.wolf,src:'assets/creatures/test-wolf.png'};
    const a=assets.register('wolf',definition),b=assets.register('wolf-copy',definition);
    assert(images.length===1&&a.asset===b.asset,'Reloaded the same image');
    assert(assets.register('wolf',definition)===a,'Regenerated a cached sprite');
    assert(assets.frame(a).image===a.placeholder,'No loading fallback');
    images[0].onerror();assert(assets.frame(a).image===a.placeholder,'No missing-image fallback');
    images[0].onload();assert(assets.frame(a).image===images[0],'Loaded image was not used');
    images[0].width=1;assert(assets.frame(a).image===a.placeholder,'Invalid atlas did not fall back');
    assert(images[0].src.endsWith('/assets/creatures/test-wolf.png'),'Asset path not relative to repository root');
  });
  test('Sprite frame ranges, direction fallback, looping and final-frame hold work',()=>{
    const def=SPRITES.player;
    const frame=spriteFrame(def,{state:'walk',time:0.25},{x:1,y:-1});
    assert(frame.x===128&&frame.y===320,'Wrong walk frame or east row');
    const death=spriteFrame(def,{state:'death',time:20},{x:0,y:1});assert(death.x===192,'Death did not hold last frame');
    const custom={...def,directions:['south'],animations:{idle:{frames:[{column:1,row:2},{column:3,row:1}],fps:2,loop:true}}};
    const fallback=spriteFrame(custom,{state:'cast',time:0.5},{x:-1,y:-1});assert(fallback.x===192&&fallback.y===64,'Missing-state/direction fallback failed');
    const directional={...def,animations:{idle:{row:0,count:1,directions:{south:2}}}};
    assert(spriteFrame(directional,undefined,{x:-1,y:-1}).y===128,'Missing direction did not use available row');
    const directions=['north','northeast','east','southeast','south','southwest','west','northwest'];
    assert(facingDirection(screenDirection(1,-1),directions)==='northeast','Eight-direction mapping failed');
  });
  test('One delta-time animation system handles movement, cues, hurt and death',()=>{
    const a={x:0,y:0,health:20},b={x:0,y:0,health:20};animationFor(a);animationFor(b);
    updateAnimation(a,1);for(let i=0;i<10;i++)updateAnimation(b,0.1);
    assert(Math.abs(animationFor(a).time-animationFor(b).time)<1e-9,'Animation depends on frame rate');
    a.x+=0.1;assert(updateAnimation(a,0.03).state==='walk','Moving actor stayed idle');
    cueAnimation(a,'cast',0.5);assert(updateAnimation(a,0.1).state==='cast','Cast cue ignored');
    cueAnimation(a,'hurt',0.1);assert(updateAnimation(a,0.03).state==='hurt','Hurt cue ignored');
    a.health=0;assert(updateAnimation(a,0.03).state==='death','Death ignored');
    a.health=20;updateAnimation(a,1);assert(animationFor(a).state==='idle','Respawn retained death');
  });
  test('Effects keep world positions, expire, and do not move entities or apply damage',()=>{
    const world=createWorld({legacy:true}),health=world.enemies[0].health;
    emitEffect(world,'projectile',world.player,{to:{x:world.player.x+4,y:world.player.y}});
    emitEffect(world,'hit',world.enemies[0]);updateEffects(world,0.2);
    assert(world.effects.length===1&&world.effects[0].type==='projectile','Effect lifetime wrong');
    assert(world.enemies[0].health===health,'Cosmetic effect altered combat');
    updateEffects(world,0.2);assert(world.effects.length===0,'Expired effects leaked');
  });
  test('Depth sorting respects trees and both building facades',()=>{
    const entry=(x,y,footprint)=>({e:{x,y,footprint},depth:x+y,order:0});
    const house=entry(10,10,{w:5,h:4}),behind=entry(12,9),front=entry(12,15),right=entry(16,12);
    assert(compareDepth(behind,house)<0&&compareDepth(front,house)>0&&compareDepth(right,house)>0,'Building footprint sorted incorrectly');
    assert(compareDepth(entry(4,4),entry(5,5))<0,'Point objects sorted incorrectly');
  });
  test('Building layers and sprite bounds remain independent of collision footprints',()=>{
    const world=createWorld({legacy:true}),building=world.map.buildings[0],before=JSON.stringify(world.blocked);
    const floor=buildingSprite(building,'floor',BUILDINGS.blacksmith.layers.floor);
    const roof=buildingSprite(building,'roof',{frameWidth:800,frameHeight:500,anchor:{x:400,y:490}});
    const assets=new SpriteManager({createCanvas}),record=assets.register('roof',roof);
    assert(floor.placeholder.layer==='floor'&&roof.placeholder.layer==='roof','Building components not separate');
    const bounds=assets.bounds(record,0,100,1);
    assert(bounds.left===-400&&bounds.right===400&&bounds.top===-390,'Large sprite offset bounds incorrect');
    assert(JSON.stringify(world.blocked)===before,'Visual dimensions altered collision');
  });
  test('Projection round-trips and zoom leave world coordinates unchanged',()=>{
    const camera=Object.assign(Object.create(Camera.prototype),{x:35,y:36,width:390,height:844,zoom:0.55});
    const world={x:23.25,y:29.75};
    for(const zoom of [0.55,1,1.7]){
      camera.zoom=zoom;const point=camera.project(world.x,world.y),inverse=camera.unproject(point.x,point.y);
      assert(Math.hypot(inverse.x-world.x,inverse.y-world.y)<1e-9,'Projection inverse failed');
    }
    const iso=worldToIso(1,0);assert(iso.x===32&&iso.y===16,'Tile scale changed');
  });
  test('Renderer reuses assets, culls distant objects and leaves simulation untouched',()=>{
    const canvas=createCanvas(780,1688),camera=Object.assign(Object.create(Camera.prototype),{x:35,y:36,width:390,height:844,zoom:1,dpr:2});
    let generated=0;
    const assets=new SpriteManager({createCanvas:(w,h)=>{generated++;return createCanvas(w,h);}});
    const renderer=new Renderer(canvas,camera,assets),world=createWorld({legacy:true}),before=JSON.stringify(world);
    renderer.draw(world);const count=generated;
    renderer.draw(world);assert(generated===count,'Render loop recreated assets');
    assert(renderer.queue.length<renderer.staticEntries.length,'Viewport culling failed');
    assert(JSON.stringify(world)===before,'Renderer changed gameplay state');
    const floor=renderer.staticEntries.find(e=>e.type==='building');floor.e.visual={roofHidden:true};renderer.draw(world);
    assert(generated===count,'Hiding a roof reloaded assets');
  });
  return results;
}
