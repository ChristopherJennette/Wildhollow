import { installController } from '../js/input/controller.js';
import { ControllerNavigation } from '../js/ui/controller-navigation.js';
import { BUTTON as B } from '../js/input/gamepad.js';
import { createWorld } from '../js/world/world.js';
import { unlock } from '../js/systems/abilities.js';
import { assignSlot } from '../js/systems/hotbar.js';

export function runControllerTests() {
  const results=[];
  const assert=(value,message)=>{if(!value)throw Error(message);};
  const test=(name,fn)=>{try{fn();results.push(`PASS ${name}`);}catch(e){results.push(`FAIL ${name}: ${e.message}`);}};
  function surface() {
    const listeners={};
    return {addEventListener:(type,fn)=>(listeners[type]||=[]).push(fn),emit:type=>(listeners[type]||[]).forEach(fn=>fn()),
      classList:{toggle(){},add(){},remove(){}},querySelectorAll:()=>[],querySelector:()=>null};
  }
  function setup() {
    const document=surface(),window=surface(),world=createWorld({legacy:true});document.body=surface();
    document.getElementById=()=>({click:()=>{world.player.sneaking=!world.player.sneaking;}});
    const pad={index:0,id:'Xbox',connected:true,mapping:'standard',axes:[0,0,0,0],buttons:Array.from({length:17},()=>({pressed:false,value:0}))};
    let paused=false,now=0,zoom=1,pads=[pad],root=null;
    const ui={panel:null,notify(){},controllerRoot:()=>root,controllerBack(){paused=false;root=null;},openPanel(name){this.panel=name;paused=true;root=surface();},actions:{menu(){paused=true;root=surface();}}};
    const controller=installController({getWorld:()=>world,isPlaying:()=>!paused,camera:{scale:n=>{zoom*=n;}},ui,platform:{document,window,navigator:{getGamepads:()=>pads}}});
    const tick=()=>controller.update(now+=20);
    const press=button=>{pad.buttons[button].pressed=true;const movement=tick();pad.buttons[button].pressed=false;tick();return movement;};
    tick();return {document,window,world,ui,pad,tick,press,zoom:()=>zoom,paused:()=>paused,disconnect:()=>{pads=[];tick();},resume:()=>{ui.controllerBack();}};
  }
  test('Controller moves, pauses, opens all panels and returns without gameplay leakage',()=>{
    const t=setup();t.pad.axes[0]=1;assert(t.tick().x===1,'Stick movement');
    assert(t.press(B.MENU).x===0&&t.paused(),'Pause did not zero movement');
    t.press(B.B);assert(!t.paused(),'Back did not resume');
    for(const [button,panel] of [[B.UP,'character'],[B.LEFT,'skills'],[B.RIGHT,'abilities'],[B.DOWN,'inventory'],[B.VIEW,'inventory']]) {
      t.press(button);assert(t.ui.panel===panel&&t.paused(),'Panel '+panel);t.press(B.B);
    }
  });
  test('Controller covers all five ability buttons, rising edges, and paused suppression',()=>{
    for(const [slot,button] of [B.X,B.Y,B.LB,B.RB,B.RT].entries()) {
      const t=setup(),p=t.world.player;p.points=10;unlock(p,'spark');assignSlot(p,'spark',slot);
      const e=t.world.enemies[0];e.x=p.x;e.y=p.y+1;p.targetId=e.id;
      t.pad.buttons[button].pressed=true;t.tick();assert(p.cooldowns.spark>0,'Slot '+slot);
      p.cooldowns.spark=0;const mana=p.mana;t.tick();assert(p.mana===mana,'Held recast');
      t.pad.buttons[button].pressed=false;t.tick();t.press(B.MENU);t.press(button);assert(p.mana===mana,'Paused cast');
    }
  });
  test('Controller interaction, sneak, target clearing and zoom use existing actions',()=>{
    const t=setup(),p=t.world.player;t.world.npcs=[{id:'near',x:p.x,y:p.y}];
    t.press(B.A);assert(t.world.interaction.id==='near','Interaction');
    t.press(B.LS);assert(p.sneaking,'Sneak');p.targetId='any';t.press(B.B);assert(!p.targetId&&!t.world.interaction,'Clear');
    t.pad.buttons[B.LT].pressed=true;t.pad.axes[3]=-1;t.tick();assert(t.zoom()>1,'Zoom');
  });
  test('Controller disconnect pauses and blur/focus requires neutral input',()=>{
    const t=setup();t.pad.axes[0]=1;t.tick();t.window.emit('blur');assert(t.tick().x===0,'Blur movement');
    t.window.emit('focus');assert(t.tick().x===0,'Focus held movement');
    t.pad.axes[0]=0;t.tick();t.pad.axes[0]=1;assert(t.tick().x===1,'Neutral recovery');
    t.disconnect();assert(t.paused(),'Disconnected without pause');
  });
  function navigationSetup() {
    const document={activeElement:null,querySelectorAll:()=>[]};
    const make=(tag='BUTTON')=>({tagName:tag,classList:{add(){},remove(){}},closest:()=>null,
      focus(){document.activeElement=this;},scrollIntoView(){},click(){this.clicks=(this.clicks||0)+1;},dispatchEvent(){this.changes=(this.changes||0)+1;}});
    const a=make(),select=make('SELECT'),b=make();select.options=[1,2,3];select.selectedIndex=0;
    const root={querySelectorAll:()=>[a,select,b]};return {document,a,b,select,root,nav:new ControllerNavigation(document)};
  }
  test('Controller menu navigation repeats at a bounded rate, wraps and changes selectors',()=>{
    const t=navigationSetup();t.nav.step(t.root,0,0);assert(t.document.activeElement===t.a,'Initial focus');
    t.nav.step(t.root,1,10);assert(t.document.activeElement===t.select,'Next');
    t.nav.step(t.root,1,50);assert(t.document.activeElement===t.select,'Repeated too fast');
    t.nav.activate(t.root,-1);assert(t.select.selectedIndex===2&&t.select.changes===1,'Selector left wrap');
    t.nav.activate(t.root);assert(t.select.selectedIndex===0,'Selector right wrap');
    t.nav.step(t.root,1,400);assert(t.document.activeElement===t.b,'Repeat');
    t.nav.activate(t.root);assert(t.b.clicks===1,'Button activation');
    t.nav.step(t.root,1,600);assert(t.document.activeElement===t.a,'Navigation wrap');
  });
  test('Controller activation preserves a newly opened dialog focus',()=>{
    const t=navigationSetup(),cancel={};t.a.focus();t.a.click=()=>{t.document.activeElement=cancel;};
    t.nav.activate(t.root);assert(t.document.activeElement===cancel,'Dialog Cancel focus stolen');
  });
  return results;
}
