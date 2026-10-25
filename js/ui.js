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
    $('new-game').onclick = actions.newGame;
    $('continue').onclick = actions.continueGame;
    $('reset').onclick = actions.reset;
    $('menu-button').onclick = actions.menu;
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
    }, (_, slot) => `<button data-slot="${slot}" aria-keyshortcuts="${slot+1}"><b>${slot+1}<span class="pad-label"> / ${['X','Y','LB','RB','RT'][slot]}</span></b><span>Empty</span><small>Assign</small></button>`).join('');
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
      assignSlot(getWorld().player, select.dataset.slotAbility, Number(select.value));
      this.renderPanel();
      this.update();
      actions.save();
    };
    $('panel-body').onclick = event => {
      const button = event.target.closest('button');
      if (!button) return;
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
        return;
      }
      if (event.key === 'Escape') {
        if (this.panel) this.closePanel();
        else if (!$('menu').hidden && getWorld()) actions.continueGame();
        else if (getWorld()) actions.menu();
      }
      if (event.key === 'Tab' && this.panel) {
        const focusable = [...$('panel').querySelectorAll('button:not(:disabled),select:not(:disabled)')],
          first = focusable[0],
          last = focusable.at(-1);
        if (event.shiftKey && document.activeElement === first) {
          event.preventDefault();
          last.focus();
        } else if (!event.shiftKey && document.activeElement === last) {
          event.preventDefault();
          first.focus();
        }
      }
    });
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
    $('confirm-cancel').focus();
  }
  cancelConfirmation() {
    this.confirmedAction = null;
    $('confirmation').hidden = true;
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
    $('continue').disabled = !canContinue;
    $('save-status').textContent = error || `Version ${VERSION} · Local saves`;
  }
  closePanel() {
    this.panel = null;
    $('panel').hidden = true;
    this.returnFocus?.focus();
  }
  openPanel(name, npcId) {
    this.returnFocus = document.activeElement;
    this.panel = name;
    this.npcId = npcId;
    $('panel').hidden = false;
    this.renderPanel();
    $('close-panel').focus();
  }
  renderPanel() {
    const { title, body } = renderPanelContent(this.panel, this.getWorld(), this.npcId);
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
    $('target').textContent = enemy ? `${ENEMIES[enemy.kind].name} · ${Math.ceil(enemy.health)} HP${p.sneaking?' · Sneaking':''}` : 'WASD / arrows / touch-drag · click to target';
    $('sneak').setAttribute('aria-pressed', String(p.sneaking));
    const bounds = world.map.settlement.bounds || {
      left: 21,
      right: 53,
      top: 25,
      bottom: 51
    };
    $('location').textContent = p.penalty > 0 ? `Weary ${Math.ceil(p.penalty)}s` : p.x > bounds.left && p.x < bounds.right && p.y > bounds.top && p.y < bounds.bottom ? 'Wildhollow village' : 'The wilds';
    for (const button of $('hotbar').children) {
      const slot = Number(button.dataset.slot),
        id = p.hotbar[slot],
        def = ABILITIES[id],
        cooldown = p.cooldowns[id] || 0;
      button.querySelector('span').textContent = def?.name || 'Empty';
      button.querySelector('small').textContent = !def ? 'Assign' : cooldown > 0 ? `${cooldown.toFixed(1)}s` : `${def.cost} ${def.resource==='mana'?'MP':'ST'}`;
      button.setAttribute('aria-label', `Slot ${slot+1}: ${def?.name||'Assign ability'}`);
      button.disabled = !!def && (cooldown > 0 || p[def.resource] < def.cost);

    }
  }
}
