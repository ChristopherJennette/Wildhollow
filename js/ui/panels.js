import { HOTBAR_SIZE } from '../systems/hotbar.js';
import { SKILLS, ABILITIES, ITEMS, RECIPES, SHOP } from '../data/definitions.js';
import { FORMULAS } from '../config.js';
import { canCraft, restoration } from '../systems/inventory.js';

// Rendering only: return markup without DOM access or changes to the world.
// Keep data-* attributes stable; UI owns events and controller navigation uses them.
const row = (title, detail, right = '') => `<div class="row"><div>${title}<small>${detail}</small></div>${right}</div>`;

const renderers = {
  character: renderCharacter,
  skills: renderSkills,
  abilities: renderAbilities,
  inventory: renderInventory,
};

export function renderPanelContent(name, world, npcId) {
  if (name === 'npc') return renderNpc(world, npcId);
  return {
    title: name[0].toUpperCase() + name.slice(1),
    body: renderers[name]?.(world) || '',
  };
}

function renderCharacter(world) {
  const p = world.player;
  let body = `<p class="description">Level ${p.level} · ${Math.floor(p.xp)} / ${FORMULAS.characterXP(p.level)} XP<br><span class="tag">${p.points} ability points · ${p.gold} gold</span></p>`;
  for (const [name, value] of Object.entries(p.attributes)) body += row(name, 'Grows through associated skill levels.', `<strong>${value.toFixed(2)}</strong>`);
  body += `<p class="muted">World: ${world.map.seed===undefined?'Original village':`Seed ${world.map.seed}`}.</p>`;
  body += `<p class="muted">${p.penalty>0?`Weary: ${Math.ceil(p.penalty)}s of slower recovery.`:'Well rested.'} Attributes start at 8 and grow automatically.</p>`;
  return body;
}

function renderSkills(world) {
  const p = world.player;
  let body = '';
  body += '<button data-hotbar-menu>Assign active skills to hotbar</button>';
  for (const [id, def] of Object.entries(SKILLS)) {
    const s = p.skills[id],
      max = FORMULAS.skillXP(s.level);
    body += row(`${def.name} <span class="tag">${s.level} / 100</span>`, `${def.use}<br>${Object.keys(def.attributes).join(' / ')}<progress aria-label="${def.name} experience" value="${s.xp}" max="${max}"></progress>${Math.floor(s.xp)} / ${max} XP`);
  }
  return body;
}

function renderAbilities(world) {
  const p = world.player;
  let body = `<p class="tag">${p.points} ability points available</p><p class="muted">Assign learned skills to slots 1–5. Press the matching number or click/tap the slot.</p>`;
  for (const [id, def] of Object.entries(ABILITIES)) {
    const action = p.abilities.includes(id)
      ? slotSelector(p, id)
      : `<button data-unlock="${id}" ${p.points < 1 ? 'disabled' : ''}>Unlock · 1</button>`;
    body += row(
      def.name,
      `${def.description}<br>${def.cost} ${def.resource} · ${def.cooldown}s cooldown`,
      action
    );
  }
  body += '<p class="muted">Offensive abilities select the nearest enemy when no target is selected. Abilities scale with your skills and attributes. Earn points by leveling through combat, exploration, trade, or crafting.</p>';
  return body;
}

function renderInventory(world) {
  const p = world.player;
  let body = `<p class="tag">${p.gold} gold · No carrying limit</p>`;
  for (const [id, count] of Object.entries(p.inventory)) {
    const def = ITEMS[id],
      restore = Object.entries(restoration(def)).map(([resource, n]) => `${n} ${resource}`).join(' + ');
    const detail = def.damage ? `${def.damage} weapon damage`
      : restore ? `Restores ${restore}` : `Material · sells for ${def.value} gold`;
    let action = '';
    if (def.type === 'weapon') {
      const equipped = p.weapon === id;
      action = `<button data-item="${id}" ${equipped ? 'disabled' : ''}>${equipped ? 'Equipped' : 'Equip'}</button>`;
    } else if (restore) {
      action = `<button data-item="${id}">Use</button>`;
    }
    body += row(`${def.name} ×${count}`, detail, action);
  }
  body += '<h3>Craft & brew</h3><p class="muted">Use herbs directly for 5 health, or turn them into stronger remedies. Forging requires Bram.</p>';
  for (const [id, recipe] of Object.entries(RECIPES))
    if (!recipe.station) body += recipeRow(id, recipe, p);
  return body;
}

function renderNpc(world, npcId) {
  const p = world.player;
  let body = '';
  const npc = world.npcs.find(n => n.id === npcId);
  const title = `${npc.name} · ${npc.occupation}`;
  const home = world.map.buildings.find(b => b.id === npc.home),
    work = world.map.buildings.find(b => b.id === npc.workplace);
  body = `<p class="description">Home: ${home.name}<br>Work: ${work.name}<br>Schedule: work 07:00–19:00, then home.<br>Currently: ${npc.state} · Your gold: ${p.gold}</p>`;
  if (npc.occupation === 'Merchant') {
    for (const [id, price] of Object.entries(SHOP)) body += row(ITEMS[id].name, `Buy for ${price} gold.`, `<button data-trade="buy" data-id="${id}" ${p.gold<price?'disabled':''}>Buy · ${price}</button>`);
    body += '<h3>Sell items</h3>';
    for (const [id, count] of Object.entries(p.inventory))
      if (id !== p.weapon) body += row(`${ITEMS[id].name} ×${count}`, `${ITEMS[id].value} gold each`, `<button data-trade="sell" data-id="${id}">Sell one</button>`);
  } else if (npc.occupation === 'Blacksmith') {
    for (const [id, recipe] of Object.entries(RECIPES))
      if (recipe.station === 'Blacksmith') body += recipeRow(id, recipe, p, true);
  } else if (npc.occupation === 'Innkeeper') body += row('A quiet room', 'Restore resources and remove weariness.', `<button data-trade="rest" ${p.gold<4?'disabled':''}>Rest · 4</button>`);
  else body += '<p class="description">“Herbs grow around the village, and ore lies near the forest edge. Stay close to the road if you want to avoid the wolves.”</p>';
  return { title, body };
}

function slotSelector(player, abilityId) {
  const assignedSlot = player.hotbar.indexOf(abilityId);
  const options = Array.from({ length: HOTBAR_SIZE }, (_, slot) => {
    const selected = assignedSlot === slot ? 'selected' : '';
    return `<option value="${slot}" ${selected}>Slot ${slot + 1}</option>`;
  }).join('');
  return `<select data-slot-ability="${abilityId}" aria-label="Hotbar slot for ${ABILITIES[abilityId].name}"><option value="-1" ${assignedSlot < 0 ? 'selected' : ''}>Unassigned</option>${options}</select>`;
}

function recipeRow(recipeId, recipe, player, atSmith = false) {
  const ingredients = Object.entries(recipe.ingredients).map(([itemId, required]) => {
    const owned = player.inventory[itemId] || 0;
    return `${ITEMS[itemId].name}: ${owned}/${required}`;
  }).join(' · ');
  const action = atSmith
    ? `data-trade="craft" data-id="${recipeId}"`
    : `data-craft="${recipeId}"`;
  const disabled = canCraft(player, recipe) ? '' : 'disabled';
  return row(
    recipe.name,
    `${ingredients}<br>Trains ${SKILLS[recipe.skill].name}.`,
    `<button ${action} ${disabled}>Make</button>`
  );
}
