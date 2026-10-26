// Optional regional rendering and atlas checks; uses the same environment as browser.cjs.
const {chromium}=require('playwright');
(async()=>{
 const browser=await chromium.launch({executablePath:process.env.WILDHOLLOW_BROWSER||undefined,args:['--no-sandbox','--disable-gpu','--disable-dev-shm-usage','--no-zygote']});
 const page=await browser.newPage({viewport:{width:1280,height:900}});const errors=[];page.on('pageerror',e=>errors.push(e.message));
 const screenshot=async name=>{if(process.env.WILDHOLLOW_SCREENSHOTS){require('fs').mkdirSync(process.env.WILDHOLLOW_SCREENSHOTS,{recursive:true});await page.screenshot({path:require('path').join(process.env.WILDHOLLOW_SCREENSHOTS,name+'.png')});}};
 await page.route('**/js/game.js',route=>route.fulfill({body:'',contentType:'text/javascript'}));
 await page.goto((process.env.WILDHOLLOW_TEST_URL||'http://127.0.0.1:8000'));
 await page.evaluate(async()=>{
  const {createWorld}=await import('/js/world/world.js');const {Renderer}=await import('/js/renderer.js');const {Camera}=await import('/js/camera.js');const {UI}=await import('/js/ui.js');
  const canvas=document.getElementById('world');const camera=new Camera(canvas),world=createWorld({seed:42});const renderer=new Renderer(canvas,camera);
  const ui=new UI(()=>world,{save(){},zoom(){},menu(){},newGame(){},continueGame(){},reset(){}});ui.menu(false);ui.update();
  Object.assign(window,{fixture:{world,camera,renderer,ui}});camera.x=world.player.x;camera.y=world.player.y;renderer.draw(world);ui.openPanel('map');
 });
 await page.locator('.world-atlas').waitFor();await screenshot('region-atlas');
 await page.locator('[data-track-poi="poi-2"]').click();
 await page.locator('#close-panel').click();
 if(!(await page.locator('#navigation').innerText()).includes('Greywatch'))throw Error('Tracking HUD missing');
 for(const [name,kind] of [['ruins','ruin'],['coast','harbor']]){
  await page.evaluate(kind=>{const{world,camera,renderer,ui}=fixture;const p=world.map.landmarks.find(p=>p.kind===kind);world.player.x=p.x;world.player.y=p.y;camera.x=p.x;camera.y=p.y;renderer.draw(world);ui.update();},kind);
  await screenshot(`region-${name}`);
 }
 await page.evaluate(()=>{const{world,camera,renderer}=fixture;const y=world.map.terrain.findIndex((row,y)=>y>200&&row.includes('bridge'));const x=world.map.terrain[y].indexOf('bridge');world.player.x=x+.5;world.player.y=y+.5;camera.x=x+.5;camera.y=y+.5;renderer.draw(world);});
 await screenshot('region-bridge');
 const stats=await page.evaluate(()=>{const{world,camera,renderer}=fixture;const t=performance.now();for(let i=0;i<30;i++)renderer.draw(world);return{averageDrawMs:(performance.now()-t)/30,scenery:renderer.staticEntries.length,candidates:renderer.sceneryIndex.query(camera).length};});
 await page.setViewportSize({width:390,height:844});await page.evaluate(()=>{fixture.camera.resize();fixture.ui.openPanel('map');});
 if(await page.locator('#panel .card').evaluate(e=>e.scrollWidth>e.clientWidth+1))throw Error('Mobile overflow');
 await screenshot('region-atlas-mobile');
 if(errors.length)throw Error(errors.join('\n'));console.log('PASS regional UI and renderer',JSON.stringify(stats));await browser.close();
})().catch(e=>{console.error(e);process.exit(1)});
