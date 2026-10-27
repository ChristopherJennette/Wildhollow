import { ITEMS } from '../data/definitions.js';
import { restoration } from '../systems/inventory.js';

const FILTERS = { all: 'All items', weapon: 'Weapons', consumable: 'Supplies', material: 'Materials' };

function category(item) {
  if (item.type === 'tool') return 'material';
  if (item.type === 'weapon') return 'weapon';
  return Object.keys(restoration(item)).length ? 'consumable' : 'material';
}

export function renderInventoryItems(player, filter = 'all') {
  const entries = Object.entries(player.inventory).filter(([id, count]) =>
    count > 0 && ITEMS[id] && (filter === 'all' || category(ITEMS[id]) === filter));
  if (!entries.length) return '<p class="empty">No items here yet. Gather resources or visit a village merchant.</p>';
  return entries.map(([id, count]) => {
    const item = ITEMS[id];
    const kind = category(item);
    const equipped = player.weapon === id;
    const restore = Object.entries(restoration(item)).map(([resource, amount]) => `${amount} ${resource}`).join(' + ');
    const detail = item.type === 'tool' ? `${item.tier === 2 ? 'Improved' : 'Basic'} ${item.tool === 'axe' ? 'woodcutting' : 'mining'} tool · carried automatically` : item.damage ? `${item.damage} weapon damage` : restore ? `Restores ${restore}` : `Sells for ${item.value} gold`;
    const icon = kind === 'weapon' ? '†' : kind === 'consumable' ? '◈' : '◇';
    const action = kind === 'weapon'
      ? `<button data-item="${id}" ${equipped ? 'disabled' : ''}>${equipped ? 'Equipped' : 'Equip weapon'}</button>`
      : restore ? `<button data-item="${id}">Use item</button>` : '<small>Crafting material</small>';
    return `<article class="item-card ${equipped ? 'equipped' : ''}"><div class="item-top"><span class="item-icon" aria-hidden="true">${icon}</span><div><strong>${item.name}</strong><small>Quantity ${count}</small></div></div><p>${detail}</p>${action}</article>`;
  }).join('');
}

export function renderInventory(world, filter = 'all') {
  const player = world.player;
  const count = Object.values(player.inventory).reduce((total, quantity) => total + quantity, 0);
  const filters = Object.entries(FILTERS).map(([id, label]) =>
    `<button data-inventory-filter="${id}" aria-pressed="${filter === id}">${label}</button>`).join('');
  return `<div class="section-heading"><div><h3>Your belongings</h3><p>${count} items · No carrying limit</p></div><span class="tag">${player.gold} gold</span></div><div class="filters" aria-label="Filter inventory">${filters}</div><div class="inventory-grid">${renderInventoryItems(player, filter)}</div>`;
}
