// Original, deterministic sprite art. Painted once into cached atlases, never per frame.
export function polygon(c, points, color, stroke) {
  c.beginPath(); points.forEach((p,i) => i ? c.lineTo(p.x,p.y) : c.moveTo(p.x,p.y)); c.closePath();
  if(color){c.fillStyle=color;c.fill();}if(stroke){c.strokeStyle=stroke;c.lineWidth=1;c.stroke();}
}
export function ellipse(c,x,y,rx,ry,color) {
  c.beginPath();c.ellipse(x,y,rx,ry,0,0,Math.PI*2);c.fillStyle=color;c.fill();
}
const rect=(c,x,y,w,h,color)=>{c.fillStyle=color;c.fillRect(Math.round(x),Math.round(y),w,h);};
const line=(c,x,y,xx,yy,color,width=1)=>{c.strokeStyle=color;c.lineWidth=width;c.beginPath();c.moveTo(x,y);c.lineTo(xx,yy);c.stroke();};
export function shade(hex,amount) {
  const n=parseInt(hex.slice(1),16);
  return '#'+[n>>16,n>>8&255,n&255].map(v=>Math.max(0,Math.min(255,v+amount)).toString(16).padStart(2,'0')).join('');
}
function random(seed) {let n=seed>>>0;return()=>{n=(Math.imul(n,1664525)+1013904223)>>>0;return n/4294967296;};}

function person(c,shape,color,state,frame,direction) {
  const side=direction==='east'||direction==='west',back=direction==='north',goblin=shape==='goblin';
  const step=state==='walk'?[0,3,0,-3][frame]:0,bob=state==='walk'&&(frame===1||frame===3)?-1:0;
  const skin=goblin?'#858f63':'#bea284',skinLight=goblin?'#adb58a':'#d3b89a';
  const dark='#272b27',trousers=shape==='player'?'#514c40':'#4b4940';
  c.save();if(direction==='west')c.scale(-1,1);if(goblin)c.scale(0.92,0.87);
  // Separate boots and trousers make stride and facing legible at phone scale.
  rect(c,side?-3:-6,-15,5,12+step,dark);rect(c,side?-2:-5,-14,3,10+step,trousers);
  rect(c,side?-4:-7,-4+step,7,4,'#272a25');rect(c,side?-3:-6,-4+step,5,1,'#736450');
  rect(c,side?1:2,-14,5,11-step,dark);rect(c,side?2:3,-13,3,9-step,shade(trousers,10));
  rect(c,side?1:2,-3-step,7,3,'#242922');rect(c,side?2:3,-3-step,5,1,'#88775e');
  c.translate(0,bob);
  const coat=state==='hurt'?'#b68a77':color;
  polygon(c,[{x:-6,y:-32},{x:5,y:-32},{x:8,y:-27},{x:7,y:-13},{x:-7,y:-13},{x:-8,y:-27}],dark);
  polygon(c,[{x:-5,y:-31},{x:4,y:-31},{x:6,y:-26},{x:5,y:-15},{x:-6,y:-15},{x:-6,y:-26}],coat);
  rect(c,-5,-29,3,12,shade(coat,14));rect(c,4,-28,2,13,shade(coat,-24));
  if(back){rect(c,-3,-28,7,12,'#645c47');rect(c,-2,-27,5,9,'#84775b');rect(c,-2,-24,5,1,'#514a38');}
  else{
    rect(c,side?2:-1,-30,2,14,shade(coat,-32));
    for(let y=-27;y<-17;y+=4)rect(c,side?3:0,y,1,1,'#c1b18b');
    if(shape==='human'){rect(c,-4,-23,8,10,'#a39476');rect(c,-3,-22,5,9,'#b1a183');}
    if(shape==='player'){line(c,-5,-31,5,-16,'#78634b',3);line(c,-5,-31,5,-16,'#a48b65');}
    if(goblin){rect(c,-6,-29,5,5,'#636660');rect(c,-5,-29,2,2,'#9a9b85');}
  }
  rect(c,-6,-16,12,3,'#40392d');rect(c,0,-16,3,2,'#baa375');rect(c,-6,-16,3,5,'#795c3e');
  // Arms are separate from torso, including a raised casting hand.
  const raised=state==='cast',swing=state==='attack'?[1,-4,3,0][frame]:step/2;
  line(c,-6,-28,-8,-19-step/2,dark,5);line(c,-6,-28,-8,-20-step/2,shade(coat,-12),3);
  rect(c,-9,-20-step/2,3,4,skin);
  line(c,6,-28,raised?12:9,raised?-33:-19+swing,dark,5);
  line(c,6,-28,raised?12:9,raised?-33:-20+swing,shade(coat,8),3);
  rect(c,raised?11:8,raised?-36:-20+swing,3,4,skinLight);
  // Neck, hair, profile nose and restrained face detail.
  rect(c,-2,-34,5,5,skin);rect(c,-4,-43,9,10,dark);
  rect(c,-3,-42,7,9,skin);rect(c,-3,-41,4,7,skinLight);
  if(back){rect(c,-4,-43,9,8,'#514434');rect(c,-3,-43,6,3,'#716048');}
  else{
    rect(c,-4,-43,9,3,goblin?'#556044':'#514434');rect(c,-4,-40,2,4,goblin?'#64714d':'#66543f');
    rect(c,side?4:2,-39,1,1,'#222922');if(!side)rect(c,-2,-39,1,1,'#222922');
    rect(c,side?4:0,-37,side?3:2,2,skinLight);rect(c,side?2:-1,-34,3,1,'#806c55');
  }
  if(goblin){polygon(c,[{x:-4,y:-41},{x:-10,y:-42},{x:-5,y:-36}],'#8f9b69');polygon(c,[{x:4,y:-41},{x:10,y:-42},{x:5,y:-36}],'#8f9b69');}
  if(shape==='player'){rect(c,-5,-33,11,3,'#83744f');rect(c,-5,-31,3,6,'#a08b61');}
  if(shape==='player'||goblin){
    c.save();c.translate(10,-18+swing);c.rotate(state==='attack'?[-0.7,1.2,0.3,0][frame]:0.18);
    rect(c,-1,-16,3,18,'#303832');rect(c,0,-16,1,14,'#c2c8b7');rect(c,1,-15,1,13,'#828e88');
    rect(c,-3,-3,7,2,'#9b895d');rect(c,0,-1,2,5,'#65503a');c.restore();
  }
  c.restore();
}
function animal(c,shape,color,state,frame,direction) {
  const wolf=shape==='wolf',side=direction==='east'||direction==='west',back=direction==='north';
  const step=state==='walk'?[0,2,0,-2][frame]:0;
  c.save();if(direction==='west')c.scale(-1,1);if(!wolf)c.scale(.85,.65);
  const fur=state==='hurt'?'#bb9283':color,outline='#343831';
  if(side){
    line(c,-10,-9,-21,-14,outline,wolf?4:2);line(c,-10,-9,-21,-14,wolf?'#797c70':'#98806c',wolf?2:1);
    for(const [x,phase] of [[-8,step],[6,-step]]){rect(c,x,-10,3,10+phase,outline);rect(c,x,-9,2,7+phase,shade(fur,-18));rect(c,x,-1+phase,5,2,'#32362e');}
    ellipse(c,-1,-12,wolf?13:9,wolf?7:5,outline);ellipse(c,-2,-13,wolf?12:8,wolf?6:4,fur);
    ellipse(c,-5,-15,wolf?8:5,3,shade(fur,17));ellipse(c,9,-15,wolf?7:4,wolf?6:4,fur);
    if(wolf)polygon(c,[{x:5,y:-18},{x:6,y:-27},{x:11,y:-19}],outline);
    else ellipse(c,7,-20,3,4,'#ae9383');
    if(wolf)polygon(c,[{x:6,y:-19},{x:7,y:-24},{x:10,y:-19}],'#a1a38e');
    polygon(c,[{x:11,y:-17},{x:wolf?21:16,y:-12},{x:16,y:-9},{x:9,y:-11}],shade(fur,24));
    rect(c,wolf?19:15,-13,3,3,'#262e28');rect(c,11,-17,2,1,wolf?'#d3bb73':'#2c302b');
    for(let i=0;i<7;i++)rect(c,-9+i*3,-16+(i%3),1,2,shade(fur,-22));
  }else{
    line(c,0,-15,back?4:-4,-25,outline,wolf?3:2);
    ellipse(c,0,-12,wolf?8:6,wolf?11:7,outline);ellipse(c,-1,-13,wolf?7:5,wolf?10:6,fur);
    rect(c,-7,-7,3,7+step,shade(fur,-20));rect(c,4,-7,3,7-step,shade(fur,-20));
    const headY=back?-23:-8;
    ellipse(c,0,headY,wolf?7:5,wolf?6:4,shade(fur,13));
    for(const x of [-5,4])polygon(c,[{x:x-2,y:headY-2},{x,y:headY-10},{x:x+3,y:headY-3}],shade(fur,-24));
    if(!back){rect(c,-4,headY-2,2,1,wolf?'#d3bb73':'#242b25');rect(c,3,headY-2,2,1,wolf?'#d3bb73':'#242b25');ellipse(c,0,headY+3,3,3,shade(fur,30));rect(c,-1,headY+3,3,2,'#252d27');}
    line(c,-2,-19,-2,-12,shade(fur,25),2);
  }
  c.restore();
}
export function paintActor(c,shape,color,state,frame,direction) {
  c.save();
  if(state==='death'){
    // Collapse within the frame rather than rotating a standing sprite out of its cell.
    c.translate(0,-2);c.scale(1+frame*0.18,1-frame*0.24);
  }
  if(shape==='rat'||shape==='wolf')animal(c,shape,color,state,frame,direction);
  else person(c,shape,color,state,frame,direction);
  if(state==='cast'){ellipse(c,12,-35,6,6,'#89a9ad44');ellipse(c,12,-35,2+frame/2,2+frame/2,'#d2e9db');}
  c.restore();
}

export function paintObject(c,shape,variant=0) {
  const rng=random(811+variant*721);
  if(shape==='berry'){
    paintObject(c,'bush',variant);for(const [x,y] of [[-7,-8],[5,-6],[0,-11],[8,-10]])ellipse(c,x,y,2,2,'#a26364');
  }else if(shape==='mushroom'){
    for(const [x,y] of [[-6,-2],[4,0],[1,-7]]){rect(c,x-1,y-7,3,7,'#c8b699');ellipse(c,x,y-8,5,3,'#9f7955');rect(c,x-2,y-9,2,1,'#d5bc8e');}
  }else if(shape==='wood'){
    line(c,-13,-3,11,-12,'#514534',9);line(c,-13,-5,11,-14,'#93805c',3);ellipse(c,-13,-3,4,5,'#bea477');ellipse(c,-13,-3,2,3,'#87704b');
  }else if(shape==='tree'){
    ellipse(c,3,3,28,10,'#26362b50');
    polygon(c,[{x:-6,y:1},{x:-4,y:-65},{x:4,y:-68},{x:5,y:1},{x:10,y:5},{x:1,y:3},{x:-9,y:5}],'#403e2c');
    rect(c,-2,-59,2,57,'#84745a');rect(c,1,-50,2,49,'#5f5741');
    line(c,0,-45,-15,-61,'#675b42',3);line(c,2,-39,18,-65,'#4c4933',3);
    if(variant===1){
      // Broadleaf silhouette breaks up the forest without changing trunk collision.
      for(const [x,y,r] of [[0,-79,23],[-16,-63,18],[15,-65,19],[-11,-89,16],[13,-87,17],[0,-59,19]]){
        ellipse(c,x,y,r,r*0.73,'#354735');ellipse(c,x-3,y-5,r*0.88,r*0.57,'#536044');
      }
      for(let i=0;i<170;i++){const x=rng()*57-29,y=rng()*47-100;if(((x+2)/30)**2+((y+78)/25)**2<1)rect(c,x,y,2+rng()*3,1,['#778062','#63714f','#3c513a'][i%3]);}
    }else{
      for(let tier=0;tier<5;tier++){
        const y=-27-tier*15,width=30-tier*5;
        const points=[{x:-width,y},{x:-width+8,y:-8+y},{x:-width+4,y:y-8},{x:0,y:y-31},{x:width-4,y:y-8},{x:width-8,y:y-8},{x:width,y},{x:width*0.35,y:y+3},{x:0,y:y},{x:-width*0.4,y:y+4}];
        polygon(c,points,tier%2?'#3f523c':'#354b37');
        polygon(c,[{x:-width+3,y:y-2},{x:0,y:y-28},{x:3,y:y-7},{x:-width*0.25,y:y+1}],'#596949');
        for(let i=0;i<18;i++){const x=(rng()-.5)*width*1.4,yy=y-rng()*12;line(c,x,yy,x+3,yy-2,i%2?'#71805a':'#2d4333');}
      }
    }
    for(let i=0;i<8;i++)line(c,-12+i*3,4,-13+i*3,rng()*-5,'#78815d');
  }else if(shape==='rock'){
    ellipse(c,1,0,12,4,'#27342d44');polygon(c,[{x:-12,y:-1},{x:-10,y:-10},{x:-4,y:-16},{x:5,y:-17},{x:13,y:-7},{x:10,y:1},{x:0,y:4}],'#5b625c','#3e4941');
    polygon(c,[{x:-10,y:-10},{x:-4,y:-16},{x:5,y:-17},{x:8,y:-9},{x:-2,y:-5}],'#93988a');polygon(c,[{x:-2,y:-5},{x:8,y:-9},{x:13,y:-7},{x:10,y:1},{x:0,y:4}],'#747f74');
    line(c,-6,-8,1,-12,'#b8baa1');line(c,1,-12,6,-11,'#48594d');rect(c,3,-7,3,2,'#b59970');rect(c,-7,-5,2,2,'#8c9d80');
  }else if(shape==='bush'){
    ellipse(c,0,0,13,4,'#283a2c55');
    for(let i=0;i<22;i++){const x=rng()*20-10,y=rng()*10-12;line(c,x,0,x,y,'#526344');ellipse(c,x,y,3,2,['#526849','#708157','#87936a'][i%3]);}
    for(const [x,y] of [[-6,-13],[5,-11],[-1,-17]]){line(c,x,-2,x,y,'#7c865a');ellipse(c,x,y,2,2,'#b5a1a7');rect(c,x,y,1,1,'#e0c9ad');}
  }else if(shape==='fence'){
    for(const y of [-9,-21]){line(c,-30,y-13,30,y+13,'#403c2c',6);line(c,-30,y-15,30,y+11,'#a3916c',2);line(c,-30,y-12,30,y+14,'#766a4f',2);}
    for(const x of [-28,0,28]){rect(c,x-3,x/2-29,6,31,'#534a36');rect(c,x-3,x/2-29,2,31,'#a18c65');rect(c,x-1,x/2-25,1,17,'#76684e');}
  }else if(shape==='sign'){
    rect(c,-3,-31,6,33,'#514632');rect(c,-3,-31,2,33,'#9b825d');rect(c,-17,-41,34,20,'#453c2d');rect(c,-16,-40,32,17,'#ac956a');
    for(let y=-36;y<-24;y+=5)line(c,-15,y,15,y,'#82704c');rect(c,-10,-34,15,2,'#4d4935');polygon(c,[{x:4,y:-37},{x:10,y:-33},{x:4,y:-29}],'#4d4935');
  }else if(shape==='loot'){
    ellipse(c,0,1,10,4,'#27352b55');polygon(c,[{x:-8,y:0},{x:-9,y:-9},{x:-4,y:-15},{x:5,y:-14},{x:9,y:-8},{x:7,y:2}],'#9f8963','#4c4633');
    rect(c,-3,-12,2,12,'#beaa7d');line(c,-6,-11,5,-10,'#534734',2);line(c,0,-12,2,-18,'#c1b48a');
  }else if(shape==='fireball'){
    ellipse(c,0,0,14,12,'#c8603144');ellipse(c,0,0,10,9,'#d58343');ellipse(c,-2,-1,6,6,'#f1c576');ellipse(c,-3,-2,3,3,'#fff0b7');
  }else if(shape==='hit'){
    for(let i=0;i<6;i++){const a=i*Math.PI/3;line(c,Math.cos(a)*6,Math.sin(a)*6,Math.cos(a)*17,Math.sin(a)*17,'#e3d6aa',2);}
  }else if(shape==='heal'){
    c.strokeStyle='#adc399';c.lineWidth=2;c.beginPath();c.ellipse(0,5,20,9,0,0,Math.PI*2);c.stroke();
    for(let i=0;i<6;i++){const a=i*Math.PI/3;rect(c,Math.cos(a)*15,-8+Math.sin(a)*8,2,3,'#d3e4be');}
    rect(c,-2,-19,4,14,'#d0dfb4');rect(c,-7,-14,14,4,'#d0dfb4');
  }
}

export function paintTerrain(c,definition,variant) {
  const {colors,material}=definition.placeholder,w=definition.frameWidth,h=definition.frameHeight;
  const rng=random(9241+(variant.index||0)*391),base=colors[(variant.index||0)%colors.length];
  polygon(c,[{x:w/2,y:0},{x:w,y:h/2},{x:w/2,y:h},{x:0,y:h/2}],base,base);
  c.save();c.clip();
  const count=material==='grass'?100:material==='water'?15:70;
  for(let i=0;i<count;i++){
    const x=rng()*w,y=rng()*h;
    if(material==='grass'){
      rect(c,x,y,1+(i%4===0?2:0),1,shade(base,i%3===0?12:-9));
      if(i%11===0)line(c,x,y,x-1,y-2,shade(base,17));
    }else if(material==='water')line(c,x,y,x+4+rng()*6,y,shade(base,i%2?7:-6));
    else {rect(c,x,y,1+rng()*2,1,shade(base,i%3===0?16:-12));}
  }
  if(definition.furrows){
    for(let i=0;i<3;i++){
      const offset=i/3;line(c,w/2+offset*w/2,offset*h/2,offset*w/2,h/2+offset*h/2,'#514b34',2);
      for(let j=0;j<5;j++){const t=j/5,x=w/2+offset*w/2-t*w/2,y=offset*h/2+t*h/2;line(c,x,y,x-2,y-3,'#8e986a');}
    }
  }
  c.restore();
}

export function paintBuilding(c,definition,project) {
  const {w,h,roof,layer,type}=definition.placeholder,wall=42;
  const point=(x,y,z=0)=>{const p=project(x,y,z);return{x:p.x+definition.anchor.x,y:p.y+definition.anchor.y};};
  const draw=(points,color,stroke)=>polygon(c,points.map(([x,y,z=0])=>point(x,y,z)),color,stroke);
  if(layer==='floor'){
    draw([[0,0],[w,0],[w,h],[0,h]],'#645c47');
    for(let x=0;x<w;x+=0.3)polygon(c,[point(x,0),point(x,h),point(x+.025,h),point(x+.025,0)],'#827258');
  }
  if(layer==='walls'){
    // Every detail lies on a facade plane, so windows and doorways share its perspective.
    const facade=(side,length)=>{
      const p=(u,z)=>side?point(w,u,z):point(u,h,z);
      const quad=(u,z,ww,hh,color,stroke)=>polygon(c,[p(u,z),p(u+ww,z),p(u+ww,z+hh),p(u,z+hh)],color,stroke);
      const base=side?'#8d8871':'#b5aa8d';
      quad(0,0,length,wall,base,'#514d3b');quad(0,0,length,9,side?'#696e60':'#858978');
      for(let z=0;z<9;z+=4){polygon(c,[p(0,z),p(length,z)],null,'#575e51');for(let u=(z%8?0.3:0);u<length;u+=0.6)polygon(c,[p(u,z),p(u,Math.min(9,z+4))],null,'#666c5b');}
      const rng=random(side?788:343);
      for(let i=0;i<length*10;i++){const u=rng()*length,z=10+rng()*27;quad(u,z,0.04+rng()*0.13,1+rng()*2,side?'#84826c':'#aaa084');}
      for(const u of [0,length/2,length-.09])quad(u,8,.09,34,'#5a503b');quad(0,37,length,4,'#60533b');quad(0,10,length,2,'#736448');
      for(let u=.45;u<length-.3;u+=1.2){
        if(!side&&Math.abs(u+.25-w/2)<.65)continue;
        quad(u,17,.6,15,'#4c4938');quad(u+.07,18,.46,12,type==='inn'?'#b6a275':side?'#53605b':'#718077');
        quad(u+.27,18,.055,12,'#d0bea0');quad(u+.07,24,.46,1.2,'#b6a68b');quad(u-.07,16,.74,2,'#635740');
        quad(u-.14,18,.12,13,'#70765b');quad(u+.62,18,.12,13,'#5d644d');
        quad(u+.1,26,.12,3,'#a3b0a0');
      }
      if(!side){
        const u=w/2-.36;quad(u-.06,0,.84,30,'#4e4837');quad(u,1,.72,27,'#796344');
        for(let j=0;j<4;j++)quad(u+j*.18,1,.025,26,'#554a36');quad(u,6,.72,2,'#4b4837');quad(u,24,.72,2,'#4b4837');quad(u+.56,14,.06,2,'#bba673');
        if(type==='blacksmith'){quad(.45,11,.65,12,'#393f37');quad(.52,12,.5,8,'#7f4b30');quad(.6,12,.33,4,'#c38b49');}
        if(type==='store'||type==='inn'){
          quad(u-.3,32,1.3,5,type==='inn'?'#637055':'#65796a');
          for(let j=0;j<5;j++)quad(u-.12+j*.18,33,.1,2,'#d6c39b');
        }
      }
    };
    facade(false,w);facade(true,h);
  }
  if(layer==='roof'){
    const elevation=x=>wall+25*(1-Math.abs(x-w/2)/(w/2));
    // Weathered shingle courses on each slope; alternate joints rather than a flat fill.
    for(const [start,end,tone] of [[0,w/2,shade(roof,5)],[w/2,w,shade(roof,-15)]]){
      draw([[start,0,elevation(start)],[end,0,elevation(end)],[end,h,elevation(end)],[start,h,elevation(start)]],tone,'#484b3b');
      const rng=random(start?247:334);
      for(let x=start;x<end;x+=.28)for(let y=0;y<h;y+=.45){
        const xx=Math.min(end,x+.28),yy=Math.min(h,y+.45),shadeBy=Math.floor(rng()*16)-8;
        draw([[x,y,elevation(x)],[xx,y,elevation(xx)],[xx,yy,elevation(xx)],[x,yy,elevation(x)]],shade(tone,shadeBy),'#595b493b');
        polygon(c,[point(x,y,elevation(x)),point(x,yy,elevation(x))],null,shade(tone,13));
      }
    }
    draw([[0,h,wall],[w/2,h,wall+25],[w,h,wall]],'#b4a688','#514b37');
    polygon(c,[point(0,h,wall),point(w/2,h,wall+25),point(w,h,wall)],null,'#5c5039');
    polygon(c,[point(w/2,h,wall),point(w/2,h,wall+25)],null,'#6a5d42');
    const peakA=point(w/2,0,wall+26),peakB=point(w/2,h,wall+26);line(c,peakA.x,peakA.y,peakB.x,peakB.y,shade(roof,22),2);
    const x=w*.68,y=h*.32,z=elevation(x)+2,top=z+17;
    draw([[x,y,z],[x+.32,y,z],[x+.32,y,top],[x,y,top]],'#807d6a','#515647');
    draw([[x+.32,y,z],[x+.32,y+.35,z],[x+.32,y+.35,top],[x+.32,y,top]],'#696e60','#515647');
    draw([[x,y,top],[x+.32,y,top],[x+.32,y+.35,top],[x,y+.35,top]],'#a8a58d','#585c4c');
    draw([[x+.05,y+.05,top+.2],[x+.27,y+.05,top+.2],[x+.27,y+.28,top+.2],[x+.05,y+.28,top+.2]],'#424b40');
    for(let zz=z+4;zz<top;zz+=5)polygon(c,[point(x,y,zz),point(x+.32,y,zz),point(x+.32,y+.35,zz)],null,'#5a6152');
  }
}
