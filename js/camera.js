import { CONFIG, clamp } from './config.js';
export class Camera {
  constructor(canvas) {this.canvas=canvas;this.x=35;this.y=36;this.zoom=1;this.width=1;this.height=1;this.resize();}
  resize() {
    this.width=innerWidth;this.height=innerHeight;this.dpr=Math.min(devicePixelRatio||1,CONFIG.maxDpr);
    this.canvas.width=Math.round(this.width*this.dpr);this.canvas.height=Math.round(this.height*this.dpr);
  }
  scale(amount) {this.zoom=clamp(this.zoom*amount,CONFIG.minZoom,CONFIG.maxZoom);}
  follow(player,dt) {const t=1-Math.exp(-10*dt);this.x+=(player.x-this.x)*t;this.y+=(player.y-this.y)*t;}
  project(x,y,z=0) {
    const point=worldToIso(x-this.x,y-this.y,z);
    return {x:this.width/2+point.x*this.zoom,y:this.height/2+point.y*this.zoom};
  }

  unproject(x,y) {
    const dx=(x-this.width/2)/(CONFIG.tileWidth/2*this.zoom),dy=(y-this.height/2)/(CONFIG.tileHeight/2*this.zoom);
    return {x:this.x+(dx+dy)/2,y:this.y+(dy-dx)/2};
  }
}

export function worldToIso(x,y,z=0) {
  return {x:(x-y)*CONFIG.tileWidth/2,y:(x+y)*CONFIG.tileHeight/2-z};
}
// Input uses the inverse projection; gameplay receives only a Cartesian vector.
export function screenDirection(x,y) {
  const strength=Math.min(1,Math.hypot(x,y));
  const ratio=CONFIG.tileWidth/CONFIG.tileHeight;
  const worldX=x+y*ratio,worldY=y*ratio-x,length=Math.hypot(worldX,worldY);
  return length?{x:worldX/length*strength,y:worldY/length*strength}:{x:0,y:0};
}
