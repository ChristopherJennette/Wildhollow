import { CONFIG } from '../config.js';
import { ANIMATIONS, DIRECTIONS, SPRITES } from '../data/graphics.js';
import { spriteFrame } from './animation.js';
import { generatePlaceholder } from './placeholders.js';

const browserCanvas = (width, height) => {
  const canvas = document.createElement('canvas'); canvas.width = width; canvas.height = height; return canvas;
};
export class SpriteManager {
  constructor({ createCanvas = browserCanvas, createImage = () => new Image() } = {}) {
    this.createCanvas = createCanvas; this.createImage = createImage;
    this.images = new Map(); this.sprites = new Map();
  }
  load(src) {
    const url = new URL(`../../${src}`, import.meta.url).href;
    if (this.images.has(url)) return this.images.get(url);
    const asset = { image: null, status: 'loading' }; this.images.set(url, asset);
    try {
      const image = this.createImage(); asset.image = image;
      image.onload = () => { asset.status = image.naturalWidth > 0 ? 'ready' : 'missing'; };
      image.onerror = () => { asset.status = 'missing'; };
      image.src = url;
    } catch { asset.status = 'missing'; }
    return asset;
  }
  register(id, definition, variant = {}) {
    if (this.sprites.has(id)) return this.sprites.get(id);
    let fallback = definition.fallback || definition;
    if (definition.placeholder.kind === 'actor') fallback = {
      ...definition, frameWidth: 64, frameHeight: 64, anchor: { x: 32, y: 56 }, offset: { x: 0, y: 0 },
      animations: ANIMATIONS, directions: DIRECTIONS, scale: 1,
    };
    const record = { definition, fallback, placeholder: generatePlaceholder(fallback, this.createCanvas, variant),
      asset: definition.src ? this.load(definition.src) : null };
    this.sprites.set(id, record); return record;
  }
  frame(record, animation, facing) {
    let definition = record.definition, image = record.asset?.image;
    let frame = spriteFrame(definition, animation, facing);
    if (record.asset?.status !== 'ready' || frame.x < 0 || frame.y < 0 ||
      frame.x + definition.frameWidth > image.width || frame.y + definition.frameHeight > image.height) {
      definition = record.fallback; image = record.placeholder; frame = spriteFrame(definition, animation, facing);
    }
    return { definition, image, frame };
  }
  bounds(record, x, y, zoom) {
    // Include both sizes so a late-loading replacement cannot be incorrectly culled.
    const a = this.rectangle(record.definition, x, y, zoom), b = this.rectangle(record.fallback, x, y, zoom);
    return { left: Math.min(a.left,b.left), top: Math.min(a.top,b.top), right: Math.max(a.right,b.right), bottom: Math.max(a.bottom,b.bottom) };
  }
  rectangle(definition, x, y, zoom) {
    const scale = (definition.scale ?? 1) * zoom, anchor = definition.anchor || { x: 0, y: 0 };
    const left = x + (definition.offset?.x || 0) * zoom - anchor.x * scale;
    const top = y + (definition.offset?.y || 0) * zoom - anchor.y * scale;
    return { left, top, right: left + definition.frameWidth * scale, bottom: top + definition.frameHeight * scale };
  }
  draw(ctx, record, x, y, zoom, animation, facing, alpha = 1) {
    const { definition, image, frame } = this.frame(record, animation, facing);
    const bounds = this.rectangle(definition,x,y,zoom);
    ctx.save(); ctx.globalAlpha *= alpha;
    ctx.drawImage(image,frame.x,frame.y,definition.frameWidth,definition.frameHeight,
      bounds.left,bounds.top,bounds.right-bounds.left,bounds.bottom-bounds.top);ctx.restore();
  }
}
export function buildingSprite(building, layer, overrides = {}) {
  const { w, h } = building.footprint;
  const definition = {
    src: null, frameWidth: Math.ceil((w+h)*CONFIG.tileWidth/2)+4,
    frameHeight: Math.ceil((w+h)*CONFIG.tileHeight/2)+72,
    anchor: { x: h*CONFIG.tileWidth/2+2, y: 68 }, scale: 1,
    placeholder: { kind: 'building', w, h, roof: building.roof, type: building.type, layer },
  };
  return { ...definition, ...overrides, fallback: definition };
}
export function entitySprite(entity) {
  return entity.id === 'player' ? 'player' : SPRITES[entity.kind] ? entity.kind : 'npc';
}
