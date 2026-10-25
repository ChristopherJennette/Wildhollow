import { ITEMS } from '../data/definitions.js';
import { FORMULAS } from '../config.js';
import { maxima } from '../systems/progression.js';
import { renderInventoryItems } from './inventory-panel.js';

// Decorative adventurer emblem; equipment values come from the actual player.
const PORTRAIT = `<div class="portrait" aria-hidden="true"><svg viewBox="0 0 120 160" fill="none"><circle cx="60" cy="68" r="51" stroke="#6d8058" stroke-dasharray="2 5"/><path d="M26 145 35 80 47 65 73 65 86 81 96 145Z" fill="#536749" stroke="#9bac76"/><path d="M44 69 40 43Q60 7 80 43L76 69 60 80Z" fill="#263c31" stroke="#b2bc89"/><path d="M49 43 50 61 60 69 70 61 71 43Z" fill="#bdab82"/><path d="M37 85 60 111 83 85M60 112V145" stroke="#b4bc8a" stroke-width="3"/><path d="M27 138 94 54M85 58 95 66" stroke="#dfc38b" stroke-width="4"/><path d="M36 124 44 134" stroke="#dfc38b" stroke-width="6"/></svg></div>`;

export function renderCharacter(world) {
  const player = world.player;
  const maximum = maxima(player);
  const weapon = ITEMS[player.weapon];
  const vitals = ['health', 'stamina', 'mana'].map(id =>
    `<div class="stat-tile"><small>${id[0].toUpperCase() + id.slice(1)}</small><strong>${Math.ceil(player[id])}</strong><small>of ${Math.round(maximum[id])}</small></div>`).join('');
  const attributes = Object.entries(player.attributes).map(([name, value]) =>
    `<div class="stat-tile"><small>${name}</small><strong>${value.toFixed(2)}</strong></div>`).join('');
  return `<div class="character-layout"><aside class="character-profile">${PORTRAIT}<h3>The Wanderer</h3><div class="profile-level">Level ${player.level} · ${player.points} ability points</div><div><small>${Math.floor(player.xp)} / ${FORMULAS.characterXP(player.level)} XP</small><progress aria-label="Experience to next level" value="${player.xp}" max="${FORMULAS.characterXP(player.level)}"></progress></div><div class="equipment"><span class="eyebrow">MAIN HAND</span><strong>${weapon?.name || 'Unarmed'}</strong><small>${weapon ? `${weapon.damage} weapon damage` : 'No weapon equipped'}</small><button data-section="inventory">Manage equipment →</button></div><div class="equipment"><small>${player.penalty > 0 ? `Weary · ${Math.ceil(player.penalty)}s recovery penalty` : 'Well rested · Ready to explore'}</small></div></aside><div><div class="section-heading"><h3>Condition</h3><span class="tag">${player.gold} gold</span></div><div class="stat-grid">${vitals}</div><h3>Attributes</h3><div class="stat-grid">${attributes}</div><div class="section-heading"><h3>Inventory</h3><button data-section="inventory">View & filter →</button></div><div class="inventory-grid">${renderInventoryItems(player)}</div></div></div>`;
}
