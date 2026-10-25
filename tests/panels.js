import { renderPanelContent } from '../js/ui/panels.js';
import { createWorld } from '../js/world/world.js';
import { ABILITIES, ITEMS, RECIPES } from '../js/data/definitions.js';

export function runPanelTests() {
  const results = [];
  const assert = (condition, message) => { if (!condition) throw new Error(message); };
  const test = (name, fn) => {
    try { fn(); results.push(`PASS ${name}`); }
    catch (error) { results.push(`FAIL ${name}: ${error.message}`); }
  };
  test('Ability selectors contain five real options and the assigned selection', () => {
    const world = createWorld({ legacy: true });
    const id = Object.keys(ABILITIES)[0];
    world.player.abilities = [id];
    world.player.hotbar = [null, null, id, null, null];
    const { body } = renderPanelContent('abilities', world);
    assert(body.includes('value="2" selected>Slot 3</option>'), 'Assigned option missing');
    assert((body.match(/<option /g) || []).length === 6, 'Five slots plus unassigned required');
    assert(body.includes(`data-slot-ability="${id}"`), 'Assignment event hook missing');
  });
  test('Crafting shows actual ingredient quantities and enables affordable recipes', () => {
    const world = createWorld({ legacy: true });
    const [id, recipe] = Object.entries(RECIPES).find(([, recipe]) => !recipe.station);
    for (const [item, count] of Object.entries(recipe.ingredients)) world.player.inventory[item] = count;
    const { body } = renderPanelContent('crafting', world);
    for (const [item, count] of Object.entries(recipe.ingredients)) {
      assert(body.includes(`${ITEMS[item].name}: ${count}/${count}`), 'Ingredient interpolation broken');
    }
    assert(body.includes(`data-craft="${id}" >Make</button>`), 'Affordable recipe disabled');
  });
  test('NPC panels retain merchant, forge and inn event hooks', () => {
    const world = createWorld({ legacy: true });
    for (const [occupation, hook] of [['Merchant', 'buy'], ['Blacksmith', 'craft'], ['Innkeeper', 'rest']]) {
      const npc = world.npcs.find(npc => npc.occupation === occupation);
      const panel = renderPanelContent('npc', world, npc.id);
      assert(panel.title === `${npc.name} · ${occupation}`, 'NPC title mismatch');
      assert(panel.body.includes(`data-trade="${hook}"`), `${occupation} action missing`);
    }
  });
  test('Rendering every panel leaves gameplay and save data untouched', () => {
    const world = createWorld({ legacy: true });
    const before = JSON.stringify(world);
    for (const name of ['character', 'skills', 'abilities', 'inventory', 'crafting', 'guide']) renderPanelContent(name, world);
    for (const npc of world.npcs) renderPanelContent('npc', world, npc.id);
    assert(JSON.stringify(world) === before, 'Renderer mutated world');
  });
  return results;
}
