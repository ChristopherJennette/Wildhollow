import { ABILITIES } from '../data/definitions.js';
import { useAbility } from './abilities.js';
export const HOTBAR_SIZE = 5;

export function normalizeHotbar(player, saved = player.hotbar) {
  const source = Array.isArray(saved) ? saved : player.abilities;
  const seen = new Set();
  player.hotbar = Array.from({length:HOTBAR_SIZE},(_,slot) => {
    const id = source[slot];
    if (!ABILITIES[id] || !player.abilities.includes(id) || seen.has(id)) return null;
    seen.add(id); return id;
  });
  return player.hotbar;
}
export function assignSlot(player, id, slot) {
  if (!player.abilities.includes(id) || !ABILITIES[id] || !Number.isInteger(slot) || slot < -1 || slot >= HOTBAR_SIZE) return false;
  normalizeHotbar(player);
  player.hotbar = player.hotbar.map(value => value === id ? null : value);
  if (slot >= 0) player.hotbar[slot] = id;
  return true;
}
export function useSlot(world, slot, notify) {
  if (!Number.isInteger(slot) || slot < 0 || slot >= HOTBAR_SIZE) return false;
  const id = world.player.hotbar?.[slot];
  if (!id) { notify(`Slot ${slot+1} is empty. Assign a skill in Abilities.`); return false; }
  return useAbility(world,id,notify);
}
