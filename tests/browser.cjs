// Optional browser integration checks. Install Playwright in your development environment.
const { chromium: playwright } = require('playwright');
(async () => {
  const browser = await playwright.launch({ executablePath: process.env.WILDHOLLOW_BROWSER || undefined, args: ['--no-sandbox', '--disable-gpu', '--disable-dev-shm-usage', '--no-zygote'], headless: true });
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
  const screenshot = async name => {
    if (process.env.WILDHOLLOW_SCREENSHOTS) {
      require('fs').mkdirSync(process.env.WILDHOLLOW_SCREENSHOTS, { recursive: true });
      await page.screenshot({ path: require('path').join(process.env.WILDHOLLOW_SCREENSHOTS, name + '.png') });
    }
  };
  const errors = [];
  page.on('pageerror', error => errors.push(error.message));
  await page.goto((process.env.WILDHOLLOW_TEST_URL || 'http://127.0.0.1:8000'));
  await page.locator('#new-game').waitFor();
  await screenshot('wildhollow-menu');
  await page.locator('#help-button').click();
  await page.locator('#panel-body').getByText('Xbox controller', { exact: true }).waitFor();
  await page.locator('#close-panel').click();
  await page.locator('#new-game').click();
  await page.locator('#hud').waitFor({state:'visible'});
  await page.keyboard.press('c');
  await page.locator('.character-profile').waitFor();
  await screenshot('wildhollow-character');
  await page.getByRole('button',{name:'Manage equipment'}).click();
  await page.locator('[data-inventory-filter="consumable"]').click();
  await page.locator('[data-item="potion"]').click();
  await page.locator('#panel-tabs [data-section="abilities"]').click();
  await page.locator('[data-unlock]').first().click();
  const select = page.locator('[data-slot-ability]').first();
  await select.selectOption('2');
  if (await select.inputValue() !== '2') throw Error('Ability assignment failed');
  await page.locator('#panel-tabs [data-section="crafting"]').click();
  await page.locator('.recipe-card').first().waitFor();
  await page.locator('#close-panel').click();
  if (await page.locator('#controls').evaluate(e=>e.inert)) throw Error('HUD remained inert');
  await page.locator('#menu-button').click();
  await page.locator('#new-game').click();
  await page.locator('#confirm-cancel').click();
  await page.locator('#continue').click();
  await screenshot('wildhollow-game');
  for (const [width,height] of [[390,844],[360,640],[844,390]]) {
    await page.setViewportSize({width,height});
    await page.keyboard.press('c');
    await page.locator('.character-profile').waitFor();
    const overflow = await page.locator('.character-shell').evaluate(e=>e.scrollWidth>e.clientWidth+1);
    if (overflow) throw Error(`Horizontal overflow at ${width}x${height}`);
    await screenshot(`wildhollow-character-${width}`);
    await page.locator('#panel-tabs [data-section="inventory"]').click();
    await page.locator('[data-inventory-filter="all"]').click();
    await screenshot(`wildhollow-inventory-${width}`);
    await page.locator('#close-panel').click();
  }
  // Leave gameplay first so its pagehide autosave cannot overwrite the fixture.
  await page.goto((process.env.WILDHOLLOW_TEST_URL || 'http://127.0.0.1:8000') + '/tests/');
  await page.evaluate(async () => {
    const { createWorld } = await import('/js/world/world.js');
    const { saveGame } = await import('/js/systems/save.js');
    const world = createWorld({ legacy: true });
    world.player.health = 30;
    world.player.inventory.ironSword = 1;
    world.player.inventory.herb = 5;
    saveGame(world);
  });
  await page.goto(process.env.WILDHOLLOW_TEST_URL || 'http://127.0.0.1:8000');
  await page.locator('#continue').click();
  await page.keyboard.press('c');
  await page.locator('[data-item="ironSword"]').click();
  await page.locator('[data-item="potion"]').click();
  const savedPlayer = () => page.evaluate(async () => (await import('/js/systems/save.js')).loadGame().world.player);
  let saved = await savedPlayer();
  if (saved.weapon !== 'ironSword' || saved.inventory.potion !== 1 || saved.health < 70) throw Error('Character item actions failed');
  await page.locator('#panel-tabs [data-section="crafting"]').click();
  await page.locator('[data-craft="salve"]').click();
  saved = await savedPlayer();
  if (saved.inventory.herb !== 4 || saved.inventory.salve !== 1) throw Error('Crafting failed');
  await page.locator('#close-panel').click();
  if (await page.locator('#controls').evaluate(e => e.inert)) throw Error('Close left HUD inert');
  await page.goto((process.env.WILDHOLLOW_TEST_URL || 'http://127.0.0.1:8000') + '/tests/');
  await page.waitForFunction(()=>document.title==='PASS'||document.title==='FAIL');
  if(await page.title()!=='PASS') throw Error(await page.locator('#results').innerText());
  if(errors.length) throw Error(errors.join('\n'));
  console.log('PASS browser workflows, 3 responsive sizes, browser suite, no JavaScript errors');
  await browser.close();
})().catch(e=>{console.error(e);process.exit(1);});
