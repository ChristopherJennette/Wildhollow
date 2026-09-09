# Graphics assets

No image files are required: cached Canvas placeholders keep the game playable. Add PNG/WebP files under `terrain/`, `environment/`, `buildings/`, `characters/`, `creatures/`, `equipment/`, `effects/` or `ui/` when needed. These folders are intentionally not empty scaffolding.

Edit `js/data/graphics.js` to replace art. For example, change `SPRITES.wolf.src` to `assets/creatures/wolf.png`, then set `frameWidth`, `frameHeight`, `anchor`, `scale`, `offset`, `directions` and `animations` for that sheet. Paths are relative to the repository root and work under GitHub Pages project URLs. Images load once; missing or undersized images fall back to generated art.

The default entity sheet has 64×64 frames, four columns, and 24 rows. Each animation occupies four direction rows ordered north/east/south/west: idle starts at row 0, walk 4, attack 8, cast 12, hurt 16, death 20. Frame anchors mark the feet at (32,56). Each clip defines `row`, `count`, `fps` and `loop`; optional `start`, `frames: [{column,row}]` and `directions: {north: row, ...}` support other layouts. An eight-name compass direction list enables eight-way sheets. Missing states use idle; unavailable directions use an available direction.

Actors may define `layers: [{sprite: 'someEquipmentSprite', offset: {x: 0, y: 0}}]`; layers share the entity animation clock. Building types independently define floor/walls/roof sprite metadata in `BUILDINGS`. `building.visual.roofHidden`, `roofOpacity` and `wallsOpacity` affect rendering only. Collision uses `collisionFootprint`, never image dimensions.

World objects map logical types to sprites through `WORLD_OBJECTS`; resources use `RESOURCE_SPRITES`. Terrain uses `TERRAIN`. Effects are cosmetic, expire automatically, and do not delay combat damage. No runtime models, asset build step or art dependencies.
