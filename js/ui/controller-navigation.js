// Drive the existing accessible controls; trading/crafting keep one implementation.
export class ControllerNavigation {
  constructor(document) { this.document = document; this.direction = 0; this.nextRepeat = 0; }
  reset() { this.direction = 0; this.nextRepeat = 0; }
  controls(root) { return [...root.querySelectorAll('button:not(:disabled), select:not(:disabled)')]
    .filter(element => !element.closest('[hidden]')); }
  focus(element) {
    this.document.querySelectorAll('.controller-focus').forEach(item => item.classList.remove('controller-focus'));
    if (!element) return;
    element.classList.add('controller-focus');
    element.focus({ preventScroll: true });
    element.scrollIntoView({ block: 'nearest' });
  }
  step(root, direction, now) {
    const controls = this.controls(root);
    if (!controls.length) return;
    let index = controls.indexOf(this.document.activeElement);
    if (index < 0) { index = 0; this.focus(controls[0]); }
    if (!direction) { this.reset(); return; }
    if (direction === this.direction && now < this.nextRepeat) return;
    this.nextRepeat = now + (direction === this.direction ? 160 : 380);
    this.direction = direction;
    this.focus(controls[(index + direction + controls.length) % controls.length]);
  }
  activate(root, delta = 1) {
    const controls = this.controls(root);
    const element = controls.includes(this.document.activeElement) ? this.document.activeElement : controls[0];
    if (!element) return;
    const index = controls.indexOf(element);
    if (element.tagName === 'SELECT') {
      element.selectedIndex = (element.selectedIndex + delta + element.options.length) % element.options.length;
      element.dispatchEvent(new Event('change', { bubbles: true }));
    } else if (delta > 0) element.click();
    // Dialogs may deliberately move focus (for example to Cancel). Preserve it.
    if (this.document.activeElement !== element && this.document.activeElement !== this.document.body) return;
    // Panels replace their body after actions. Recover focus at the same row.
    const updated = this.controls(root);
    this.focus(updated[Math.min(index, updated.length - 1)]);
  }
}
