import { regionName, navigationHint } from './world/exploration.js';
import { renderPanelContent } from './ui/panels.js';
import { VERSION } from './version.js';
import { HOTBAR_SIZE, assignSlot, useSlot } from './systems/hotbar.js';
import { ABILITIES, ENEMIES } from './data/definitions.js';
import { FORMULAS } from './config.js';
import { maxima } from './systems/progression.js';
import { unlock } from './systems/abilities.js';
import { useItem, trade, craft } from './systems/inventory.js';
import { hour, target } from './world/world.js';
const $ = id => document.getElementById(id);
export class UI {
  constructor(getWorld, actions) {
    this.getWorld = getWorld;
    this.actions = actions;
    this.panel = null;
    this.noticeTimer = 0;
    this.inventoryFilter = 'all';
    $('new-game').onclick = actions.newGame;
    $('continue').onclick = actions.continueGame;
    $('reset').onclick = actions.reset;
    $('menu-button').onclick = actions.menu;
    $('help-button').onclick = () => this.openPanel('guide');
    $('panel-tabs').onclick = event => {
      const button = event.target.closest('[data-section]');
      if (button) this.openPanel(button.dataset.section);
    };
    $('close-panel').onclick = () => this.closePanel();
    document.querySelectorAll('[data-panel]').forEach(button => button.onclick = () => this.openPanel(button.dataset.panel));
    $('sneak').onclick = () => {
      const p = getWorld().player;
      p.sneaking = !p.sneaking;
      this.notify(p.sneaking ? 'Sneaking: automatic attacks paused.' : 'Walking: automatic attacks enabled.');
      this.update();
    };
    $('zoom-in').onclick = () => actions.zoom(1.15);
    $('zoom-out').onclick = () => actions.zoom(1 / 1.15);
    $('hotbar').innerHTML = Array.from({
      length: HOTBAR_SIZE
    }, (_, slot) => `<button data-slot="${slot}" aria-keyshortcuts="${slot+1}"><b>${slot+1}<span class="pad-label"> / ${['X','Y','LB','RB','RT'][slot]}</span></b><span class="ability-name">Empty</span><small>Assign</small></button>`).join('');
    $('hotbar').onclick = event => {
      const button = event.target.closest('[data-slot]');
      if (!button) return;
      const slot = Number(button.dataset.slot);
      if (!getWorld().player.hotbar[slot]) this.openPanel('abilities');
      else useSlot(getWorld(), slot, this.notify);
      this.update();
    };
    $('panel-body').onchange = event => {
      const select = event.target.closest('[data-slot-ability]');
      if (!select) return;
      const abilityId = select.dataset.slotAbility;
      assignSlot(getWorld().player, abilityId, Number(select.value));
      this.renderPanel();
      $('panel-body').querySelector(`[data-slot-ability="${abilityId}"]`).focus();
      this.update();
      actions.save();
    };
    $('panel-body').onclick = event => {
      const button = event.target.closest('button');
      if (!button) return;
      if (button.dataset.trackPoi !== undefined) {
        getWorld().player.trackedPoi = button.dataset.trackPoi || null;
        this.renderPanel();
        $('panel-body').querySelector(`[data-track-poi="${button.dataset.trackPoi}"]`)?.focus();
        this.update();
        actions.save();
        return;
      }
      if (button.dataset.section) {
        this.openPanel(button.dataset.section);
        return;
      }
      if (button.dataset.inventoryFilter) {
        this.inventoryFilter = button.dataset.inventoryFilter;
        this.renderPanel();
        $('panel-body').querySelector(`[data-inventory-filter="${this.inventoryFilter}"]`).focus();
        return;
      }
      const focusKey = ['unlock', 'item', 'craft', 'trade'].find(key => button.dataset[key]);
      const focusValue = focusKey ? button.dataset[focusKey] : null;
      const itemId = button.dataset.id;
      if (button.dataset.hotbarMenu !== undefined) {
        this.openPanel('abilities');
        return;
      }
      const world = getWorld(),
        p = world.player;
      if (button.dataset.unlock && unlock(p, button.dataset.unlock)) this.notify(`${ABILITIES[button.dataset.unlock].name} unlocked.`);
      if (button.dataset.item) useItem(p, button.dataset.item, this.notify);
      if (button.dataset.craft) craft(world, button.dataset.craft, this.notify);
      if (button.dataset.trade) trade(world, world.npcs.find(n => n.id === this.npcId), button.dataset.trade, button.dataset.id, this.notify);
      this.renderPanel();
      this.restoreActionFocus(focusKey, focusValue, itemId);
      this.update();
      actions.save();
    };
    $('confirm-cancel').onclick = () => this.cancelConfirmation();
    $('confirm-accept').onclick = () => {
      const action = this.confirmedAction;
      this.cancelConfirmation();
      action?.();
    };
    document.addEventListener('keydown', event => {
      if (!$('confirmation').hidden) {
        if (event.key === 'Escape') this.cancelConfirmation();
        if (event.key === 'Tab') this.trapFocus(event, $('confirmation'));
        return;
      }
      if (event.key === 'Escape') {
        if (this.panel) this.closePanel();
        else if (!$('menu').hidden && getWorld()) actions.continueGame();
        else if (getWorld()) actions.menu();
      }
      const editing = event.target.closest?.('input, textarea, select, [contenteditable="true"]');
      const shortcut = { KeyC: 'character', KeyI: 'inventory', KeyK: 'abilities', KeyM: 'map' }[event.code];
      if (shortcut && !editing && !event.ctrlKey && !event.altKey && !event.metaKey && getWorld() && $('menu').hidden) {
        event.preventDefault();
        if (!event.repeat) this.openPanel(shortcut);
      }
      if (event.key === 'Tab') this.trapFocus(event, this.controllerRoot());
    });
  }
  trapFocus(event, root) {
    if (!root) return;
    const controls = [...root.querySelectorAll('button:not(:disabled),select:not(:disabled)')]
      .filter(element => !element.closest('[hidden]'));
    const first = controls[0], last = controls.at(-1);
    if (!first) return;
    if (!controls.includes(document.activeElement) || (!event.shiftKey && document.activeElement === last)) {
      event.preventDefault();
      first.focus();
    } else if (event.shiftKey && document.activeElement === first) {
      event.preventDefault();
      last.focus();
    }
  }
  restoreActionFocus(key, value, itemId) {
    if (!key) return;
    const root = $('panel-body');
    const selector = `[data-${key}="${value}"]${itemId ? `[data-id="${itemId}"]` : ''}`;
    const control = root.querySelector(selector) || root.querySelector(`[data-slot-ability="${value}"]`);
    if (control && !control.disabled) control.focus({ preventScroll: true });
    else $('panel-tabs').querySelector('[aria-current="page"]')?.focus({ preventScroll: true });
  }
  cyclePanel(direction) {
    const sections = ['character', 'inventory', 'crafting', 'skills', 'abilities', 'map'];
    const index = sections.indexOf(this.panel);
    if (index < 0) return;
    this.openPanel(sections[(index + direction + sections.length) % sections.length]);
  }
  controllerRoot() {
    return !$('confirmation').hidden ? $('confirmation') : this.panel ? $('panel') : !$('menu').hidden ? $('menu') : null;
  }
  controllerBack() {
    if (!$('confirmation').hidden) this.cancelConfirmation();
    else if (this.panel) this.closePanel();
    else if (this.getWorld()) this.actions.continueGame();
  }
  confirmAction(message, action) {
    this.confirmedAction = action;
    this.confirmReturn = document.activeElement;
    $('confirm-message').textContent = message;
    $('confirmation').hidden = false;
    $('panel').inert = true;
    $('menu').inert = true;
    $('confirm-cancel').focus();
  }
  cancelConfirmation() {
    this.confirmedAction = null;
    $('confirmation').hidden = true;
    $('panel').inert = false;
    $('menu').inert = !!this.panel;
    this.confirmReturn?.focus();
  }
  notify = (message) => {
    clearTimeout(this.noticeTimer);
    $('notice').textContent = message;
    $('notice').classList.add('visible');
    this.noticeTimer = setTimeout(() => $('notice').classList.remove('visible'), 4200);
  };
  menu(show, canContinue = true, error = '') {
    $('menu').hidden = !show;
    $('hud').hidden = show;
    $('controls').hidden = show;
    $('hud').inert = show || !!this.panel;
    $('controls').inert = show || !!this.panel;
    $('menu').inert = !!this.panel;
    $('continue').disabled = !canContinue;
    $('save-status').textContent = error || `Version ${VERSION} · Local saves`;
    if (show) (canContinue ? $('continue') : $('new-game')).focus();
  }
  closePanel() {
    this.panel = null;
    $('panel').hidden = true;
    const playing = $('menu').hidden;
    $('hud').inert = !playing;
    $('controls').inert = !playing;
    $('menu').inert = false;
    this.returnFocus?.focus();
  }
  openPanel(name, npcId) {
    if (!this.panel) this.returnFocus = document.activeElement;
    this.panel = name;
    $('hud').inert = true;
    $('controls').inert = true;
    $('menu').inert = true;
    $('panel-tabs').hidden = name === 'npc' || name === 'guide';
    $('panel-kicker').textContent = name === 'npc' ? 'VILLAGE LIFE' : name === 'guide' ? 'A FEW THINGS TO KNOW' : 'THE WANDERER’S JOURNAL';
    $('panel-tabs').querySelectorAll('button').forEach(button => {
      if (button.dataset.section === name) button.setAttribute('aria-current', 'page');
      else button.removeAttribute('aria-current');
    });
    this.npcId = npcId;
    $('panel').hidden = false;
    this.renderPanel();
    $('panel').querySelector('.card').scrollTop = 0;
    ($('panel-tabs').querySelector('[aria-current="page"]') || $('close-panel')).focus();
  }
  renderPanel() {
    const { title, body } = renderPanelContent(this.panel, this.getWorld(), this.npcId, { inventoryFilter: this.inventoryFilter });
    $('panel-title').textContent = title;
    $('panel-body').innerHTML = body;
  }
  update() {
    const world = this.getWorld();
    if (!world) return;
    const p = world.player,
      max = maxima(p);
    $('resources').innerHTML = [
      ['health', 'HP', '#c78370'],
      ['stamina', 'ST', '#b7bf79'],
      ['mana', 'MP', '#80b4d2']
    ].map(([id, label, color]) => `<div class="resource"><span>${label}</span><div class="track"><div class="fill" style="--color:${color};width:${Math.max(0,p[id]/max[id]*100)}%"></div></div><span>${Math.ceil(p[id])} / ${Math.round(max[id])}</span></div>`).join('');
    $('level').textContent = `Lv ${p.level} · ${p.points} AP`;
    $('xp').value = p.xp;
    $('xp').max = FORMULAS.characterXP(p.level);
    const h = hour(world);
    $('clock').textContent = `${String(Math.floor(h)).padStart(2,'0')}:${String(Math.floor(h%1*60)).padStart(2,'0')}`;
    const enemy = target(world);
    $('target').textContent = enemy ? `${ENEMIES[enemy.kind].name} · ${Math.ceil(enemy.health)} HP${p.sneaking?' · Sneaking':''}` : p.sneaking ? 'Sneaking · Automatic attacks paused' : '';
    $('sneak').setAttribute('aria-pressed', String(p.sneaking));
    $('location').textContent = p.penalty > 0 ? `Weary ${Math.ceil(p.penalty)}s` : regionName(world.map,p);
    $('navigation').textContent = navigationHint(world);
    for (const button of $('hotbar').children) {
      const slot = Number(button.dataset.slot),
        id = p.hotbar[slot],
        def = ABILITIES[id],
        cooldown = p.cooldowns[id] || 0;
      button.querySelector('.ability-name').textContent = def?.name || 'Empty';
      button.querySelector('small').textContent = !def ? 'Assign' : cooldown > 0 ? `${cooldown.toFixed(1)}s` : `${def.cost} ${def.resource==='mana'?'MP':'ST'}`;
      button.setAttribute('aria-label', `Slot ${slot+1}: ${def?.name||'Assign ability'}`);
      button.disabled = !!def && (cooldown > 0 || p[def.resource] < def.cost);

    }
  }
}
