import { CONFIG, clamp } from './config.js';
export class Camera {
  constructor(canvas) {this.canvas=canvas;this.x=35;this.y=36;this.zoom=1;this.width=1;this.height=1;this.resize();}
  resize() {
    this.width=innerWidth;this.height=innerHeight;this.dpr=Math.min(devicePixelRatio||1,2);
    this.canvas.width=Math.round(this.width*this.dpr);this.canvas.height=Math.round(this.height*this.dpr);
  }
  scale(amount) {this.zoom=clamp(this.zoom*amount,0.55,1.7);}
  follow(player,dt) {const t=1-Math.exp(-10*dt);this.x+=(player.x-this.x)*t;this.y+=(player.y-this.y)*t;}
  project(x,y,z=0) {
    return {x:this.width/2+((x-this.x)-(y-this.y))*CONFIG.tileWidth/2*this.zoom,
      y:this.height/2+((x-this.x)+(y-this.y))*CONFIG.tileHeight/2*this.zoom-z*this.zoom};
  }
  unproject(x,y) {
    const dx=(x-this.width/2)/(CONFIG.tileWidth/2*this.zoom),dy=(y-this.height/2)/(CONFIG.tileHeight/2*this.zoom);
    return {x:this.x+(dx+dy)/2,y:this.y+(dy-dx)/2};
  }
}
