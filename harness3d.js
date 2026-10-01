/* Local Three.js r180. Two on-demand scenes share the same visual architecture.
   All geometry is generated here; no remote model, texture, or render service. */
import * as THREE from './assets/vendor/three.module.min.js';
import { RoundedBoxGeometry } from './assets/vendor/RoundedBoxGeometry.js';
import { RoomEnvironment } from './assets/vendor/RoomEnvironment.js';

const motionPreference = matchMedia('(prefers-reduced-motion: reduce)');
const clamp = THREE.MathUtils.clamp;
const colors = { models: 0x7298fa, agents: 0xedaa87, tools: 0x80cbb8, memory: 0xafa3e3 };
const modules = [
  { name: 'models', x: -2.95, z: -1.45 },
  { name: 'agents', x: -2.6, z: 2.3 },
  { name: 'tools', x: 2.65, z: -1.95 },
  { name: 'memory', x: 2.9, z: 1.8 }
];

function createScene(host) {
  const canvas = host.querySelector('canvas');
  const isFlow = host.dataset.scene === 'flow';
  const immersive = !isFlow;
  const flow = host.closest('.flow-art');
  let renderer;
  try {
    renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true, powerPreference: 'low-power' });
  } catch {
    host.classList.add('scene-unavailable');
    canvas.removeAttribute('tabindex');
    return null;
  }
  renderer.setPixelRatio(Math.min(devicePixelRatio || 1, innerWidth < 681 ? 1.35 : 1.75));
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = isFlow ? 1.35 : 1.3;
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  renderer.setClearColor(0x000000, 0);

  const scene = new THREE.Scene();
  const camera = new THREE.OrthographicCamera(-5, 5, 4, -4, .1, 80);
  const assembly = new THREE.Group();
  scene.add(assembly);
  const geometries = new Map();
  const resources = new Set();
  const keep = resource => { resources.add(resource); return resource; };
  const environment = new RoomEnvironment();
  const pmrem = new THREE.PMREMGenerator(renderer);
  const environmentMap = pmrem.fromScene(environment, .025);
  scene.environment = environmentMap.texture;
  environment.dispose();
  pmrem.dispose();

  scene.add(new THREE.HemisphereLight(0xe7efff, 0x8291ad, isFlow ? 2.2 : 2.5));
  const key = new THREE.DirectionalLight(0xffffff, 4);
  key.position.set(-3, 9, 5);
  key.castShadow = true;
  key.shadow.mapSize.set(isFlow ? 1024 : 1536, isFlow ? 1024 : 1536);
  Object.assign(key.shadow.camera, { left: -7, right: 7, top: 7, bottom: -7, near: 1, far: 25 });
  key.shadow.normalBias = .025;
  key.shadow.bias = -.0002;
  key.shadow.radius = 5;
  scene.add(key);
  const rim = new THREE.DirectionalLight(0x83acff, 2.8);
  rim.position.set(5, 3, -5);
  scene.add(rim);
  const fill = new THREE.DirectionalLight(0xc8eeec, 1.2);
  fill.position.set(-6, 2, -2);
  scene.add(fill);

  const material = (color, options = {}) => keep(new THREE.MeshPhysicalMaterial({
    color, roughness: .28, metalness: .18, clearcoat: .8, clearcoatRoughness: .2,
    envMapIntensity: 1.05, ...options
  }));
  const porcelain = material(immersive ? 0xb2c7ec : 0xf1f5ff, { roughness: .21, metalness: immersive ? .55 : .25 });
  const edgeMetal = material(0x8393b4, { metalness: .68, roughness: .3 });
  const navy = material(0x203e86, { metalness: .42, roughness: .23 });
  const coreBlue = material(0x477fff, { emissive: 0x1658ff, emissiveIntensity: immersive ? 1.8 : .6, roughness: .13, metalness: .18 });
  const blueLight = keep(new THREE.MeshBasicMaterial({ color: 0x71e2ff }));
  const roundGeometry = (w, h, d, radius = .09) => {
    const key = [w, h, d, radius].join(',');
    if (!geometries.has(key)) geometries.set(key, keep(new RoundedBoxGeometry(w, h, d, 3, Math.min(radius, h * .4))));
    return geometries.get(key);
  };
  const box = (parent, w, h, d, mat, x = 0, y = 0, z = 0, radius) => {
    const mesh = new THREE.Mesh(roundGeometry(w, h, d, radius), mat);
    mesh.position.set(x, y, z);
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    parent.add(mesh);
    return mesh;
  };
  const planeGeometry = keep(new THREE.PlaneGeometry(1, 1));

  // These canvas textures are drawn as part of the 3D materials, not image assets.
  const topTexture = (kind, background, color = '#fff') => {
    const surface = document.createElement('canvas');
    surface.width = surface.height = 512;
    const ctx = surface.getContext('2d');
    ctx.fillStyle = background;
    ctx.fillRect(0, 0, 512, 512);
    ctx.strokeStyle = color;
    ctx.fillStyle = color;
    ctx.lineWidth = 13;
    ctx.lineCap = ctx.lineJoin = 'round';
    ctx.translate(256, 222);
    if (kind === 'core') {
      ctx.lineWidth = 22;
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.bezierCurveTo(-170, -176, -190, 142, -30, 22);
      ctx.bezierCurveTo(170, -165, 183, 145, 30, 24);
      ctx.lineTo(0, 0); ctx.stroke();
      ctx.font = '500 26px sans-serif'; ctx.textAlign = 'center';
      ctx.fillText('C O N T I N U U M', 0, 145);
    } else if (kind === 'models') {
      for (const [x,z] of [[-73,-63],[73,-63],[0,68]]) {
        ctx.beginPath(); ctx.arc(x,z,28,0,Math.PI*2); ctx.stroke();
      }
      ctx.beginPath(); ctx.moveTo(-40,-63);ctx.lineTo(40,-63);ctx.moveTo(-57,-37);ctx.lineTo(-15,43);ctx.moveTo(57,-37);ctx.lineTo(15,43);ctx.stroke();
    } else if (kind === 'tools') {
      ctx.beginPath();ctx.moveTo(-43,-67);ctx.lineTo(-100,0);ctx.lineTo(-43,67);ctx.moveTo(43,-67);ctx.lineTo(100,0);ctx.lineTo(43,67);ctx.moveTo(18,-83);ctx.lineTo(-18,83);ctx.stroke();
    } else if (kind === 'agents') {
      ctx.strokeRect(-65,-65,130,130);
      ctx.strokeRect(-22,-22,44,44);
      for(const p of [-35,35]) {
        ctx.beginPath();ctx.moveTo(p,-100);ctx.lineTo(p,-65);ctx.moveTo(p,65);ctx.lineTo(p,100);ctx.moveTo(-100,p);ctx.lineTo(-65,p);ctx.moveTo(65,p);ctx.lineTo(100,p);ctx.stroke();
      }
    } else {
      for (let i=0;i<3;i++) {const y=-55+i*51;ctx.beginPath();ctx.moveTo(-93,y);ctx.lineTo(0,y-42);ctx.lineTo(93,y);ctx.lineTo(0,y+42);ctx.closePath();ctx.stroke();}
    }
    if (kind !== 'core') {
      ctx.font = '500 30px monospace';ctx.textAlign='center';ctx.fillText(kind.toUpperCase(),0,168);
    }
    const texture = keep(new THREE.CanvasTexture(surface));
    texture.colorSpace = THREE.SRGBColorSpace;
    texture.anisotropy = Math.min(4, renderer.capabilities.getMaxAnisotropy());
    return texture;
  };
  const topLabel = (parent, size, height, texture) => {
    const face = new THREE.Mesh(planeGeometry, keep(new THREE.MeshBasicMaterial({ map: texture, toneMapped: false })));
    face.scale.set(size, size, 1);
    face.rotation.x = -Math.PI / 2;
    face.position.y = height;
    parent.add(face);
  };

  const core = new THREE.Group();
  assembly.add(core);
  const layers = [];
  const layer = (y, w, h, d, mat) => {
    const part = new THREE.Group();
    part.position.y = y;
    box(part, w, h, d, mat);
    core.add(part);
    layers.push({ part, y });
    return part;
  };
  layer(-.49, 2.65, .23, 2.65, porcelain);
  const substrate = layer(-.23, 2.38, .16, 2.38, navy);
  const engine = layer(.09, 2.12, .42, 2.12, coreBlue);
  const cover = layer(.44, 2.45, .19, 2.45, porcelain);
  const processor = layer(.64, 1.86, .2, 1.86, navy);
  topLabel(processor, 1.68, .104, topTexture('core','#214480'));
  // Edge contacts and the illuminated bus make the object read as a system.
  for (let i = 0; i < 9; i++) {
    const at = (i - 4) * .225;
    box(substrate,.09,.075,.22,edgeMetal,at,0,1.25,.02);
    box(substrate,.09,.075,.22,edgeMetal,at,0,-1.25,.02);
    box(substrate,.22,.075,.09,edgeMetal,1.25,0,at,.02);
    box(substrate,.22,.075,.09,edgeMetal,-1.25,0,at,.02);
  }
  for (const z of [-1.069,1.069]) box(engine,1.82,.045,.012,blueLight,0,.06,z,.005);
  for (const x of [-1.069,1.069]) box(engine,.012,.045,1.82,blueLight,x,.06,0,.005);
  const screwGeometry = keep(new THREE.CylinderGeometry(.037,.037,.01,12));
  for(const x of [-1.04,1.04]) for(const z of [-1.04,1.04]) {
    const screw = new THREE.Mesh(screwGeometry,edgeMetal);screw.position.set(x,.102,z);cover.add(screw);
  }

  const sphereGeometry = keep(new THREE.SphereGeometry(.053,12,8));
  const glowSurface = document.createElement('canvas');
  glowSurface.width=glowSurface.height=128;
  const glowContext=glowSurface.getContext('2d');
  const glowGradient=glowContext.createRadialGradient(64,64,0,64,64,64);
  glowGradient.addColorStop(0,'rgba(255,255,255,1)');
  glowGradient.addColorStop(.14,'rgba(255,255,255,.8)');
  glowGradient.addColorStop(.4,'rgba(255,255,255,.17)');
  glowGradient.addColorStop(1,'rgba(255,255,255,0)');
  glowContext.fillStyle=glowGradient;glowContext.fillRect(0,0,128,128);
  const glowTexture=keep(new THREE.CanvasTexture(glowSurface));
  const glowMaterial=(color,opacity)=>keep(new THREE.SpriteMaterial({map:glowTexture,color,opacity,transparent:true,blending:THREE.AdditiveBlending,depthWrite:false}));
  const coreAura=new THREE.Sprite(glowMaterial(0x336aff,immersive?.56:.15));
  coreAura.scale.set(6.4,6.4,1);coreAura.position.set(0,.3,0);assembly.add(coreAura);
  const rings=[];
  for(let i=0;i<2;i++){
    const ring=new THREE.Mesh(keep(new THREE.TorusGeometry(1.73+i*.27,.012,6,128)),keep(new THREE.MeshBasicMaterial({color:i?0x9d87ff:0x61dfff,transparent:true,opacity:immersive?.8:.3})));
    ring.rotation.set(Math.PI/2,i?.26:-.18,i?.15:-.12);ring.position.y=.07+i*.22;assembly.add(ring);rings.push(ring);
  }
  const cylinderGeometry = keep(new THREE.CylinderGeometry(1,1,1,8));
  const worldUp = new THREE.Vector3(0,1,0);
  const direction = new THREE.Vector3();
  const projected = new THREE.Vector3();
  const nodes = modules.map((config, index) => {
    const group = new THREE.Group();
    group.position.set(config.x,-.34,config.z);
    assembly.add(group);
    const mat = material(colors[config.name], { metalness: .23, roughness: .25 });
    box(group,1.23,.16,1.23,porcelain,0,0,0);
    box(group,1.04,.37,1.04,mat,0,.25,0);
    box(group,.89,.055,.89,mat,0,.458,0);
    const hex = '#' + new THREE.Color(colors[config.name]).getHexString();
    topLabel(group,.79,.488,topTexture(config.name,hex,config.name==='models'?'#f3f7ff':'#263954'));
    for (const x of [-.36,.36]) box(group,.12,.035,.03,blueLight,x,-.035,.625,.008);
    const wireMaterial = keep(new THREE.MeshBasicMaterial({ color: colors[config.name], transparent:true, opacity:isFlow?.7:.85 }));
    const segments = Array.from({length:3},()=>{
      const mesh=new THREE.Mesh(cylinderGeometry,wireMaterial);assembly.add(mesh);return mesh;
    });
    const packets = Array.from({length:immersive?4:2},()=>{
      const mesh=new THREE.Mesh(sphereGeometry,keep(new THREE.MeshBasicMaterial({color:colors[config.name]})));
      const halo=new THREE.Sprite(glowMaterial(colors[config.name],immersive?.9:.5));halo.scale.set(.55,.55,1);mesh.add(halo);
      assembly.add(mesh);return mesh;
    });
    return { ...config,group,index,segments,packets, label:host.querySelector('[data-node-label="'+config.name+'"]'), points:[],lengths:[],total:0 };
  });

  const floor = new THREE.Mesh(keep(new THREE.PlaneGeometry(18,18)),keep(new THREE.ShadowMaterial({color:0x020616,opacity:.35})));
  floor.rotation.x=-Math.PI/2;floor.position.y=-.72;floor.receiveShadow=true;scene.add(floor);
  const grid = new THREE.GridHelper(15,30,isFlow?0x416185:0x315b96,isFlow?0x334b6b:0x244168);
  grid.material.dispose();
  grid.material=new THREE.ShaderMaterial({
    transparent:true,depthWrite:false,
    uniforms:{uColor:{value:new THREE.Color(isFlow?0x55759b:0x547eb8)},uOpacity:{value:isFlow?.16:.32}},
    vertexShader:'varying vec3 vGridPosition; void main(){vGridPosition=position;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.0);}',
    fragmentShader:'uniform vec3 uColor; uniform float uOpacity; varying vec3 vGridPosition; void main(){float fade=1.0-smoothstep(2.8,7.2,length(vGridPosition.xz));gl_FragColor=vec4(uColor,uOpacity*fade);}'
  });
  grid.position.y=-.71;
  scene.add(grid);keep(grid.geometry);keep(grid.material);

  let width=0,height=0,frame=0,lastTime=0,phase=0,visible=false,disposed=false,lost=false;
  let currentYaw=.63,targetYaw=.63,dragX=0,dragging=false,pointerId=null;
  let explosion=0,manualExplosion=0,scrollExplosion=0;
  let currentPitch=.62,targetPitch=.62,dragY=0;
  let userRotated=false;
  const paused=()=>motionPreference.matches||document.body.classList.contains('motion-paused');
  const updateConnection = node => {
    const x=node.group.position.x,z=node.group.position.z;
    node.points=[new THREE.Vector3(0,-.62,0),new THREE.Vector3(x,-.62,0),new THREE.Vector3(x,-.62,z),new THREE.Vector3(x,node.group.position.y-.06,z)];
    node.lengths=node.points.slice(1).map((p,i)=>p.distanceTo(node.points[i]));
    node.total=node.lengths.reduce((a,b)=>a+b,0);
    node.segments.forEach((segment,index)=>{
      const from=node.points[index],to=node.points[index+1];
      direction.subVectors(to,from);
      segment.position.copy(from).add(to).multiplyScalar(.5);
      segment.scale.set(.022,Math.max(.001,direction.length()),.022);
      segment.quaternion.setFromUnitVectors(worldUp,direction.normalize());
    });
  };
  const positionPacket = (mesh,node,t) => {
    let distance=t*node.total;
    for(let i=0;i<node.lengths.length;i++) {
      if(distance<=node.lengths[i]||i===node.lengths.length-1){mesh.position.lerpVectors(node.points[i],node.points[i+1],distance/Math.max(.001,node.lengths[i]));break;}
      distance-=node.lengths[i];
    }
  };
  const draw = time => {
    frame=0;
    if(disposed||lost||document.hidden||!visible)return;
    const dt=lastTime?Math.min((time-lastTime)/1000,.06):.016;
    lastTime=time;
    const still=paused();
    if(!still)phase+=dt;
    const blend=still?1:1-Math.exp(-dt*6);
    const stage = isFlow ? Number(flow.dataset.flowState) : 2;
    const targetExplosion=isFlow?(stage===0?.68:stage===1?.33:0):Math.max(manualExplosion,scrollExplosion,.12+(still?0:Math.sin(phase*.65)*.09));
    explosion=THREE.MathUtils.lerp(explosion,targetExplosion,blend);
    currentYaw=THREE.MathUtils.lerp(currentYaw,targetYaw,blend);
    currentPitch=THREE.MathUtils.lerp(currentPitch,targetPitch,blend);
    const distance=13;
    const orbitYaw=currentYaw+(immersive&&!userRotated&&!still?Math.sin(phase*.16)*.13:0);
    camera.position.set(Math.sin(orbitYaw)*Math.cos(currentPitch)*distance,Math.sin(currentPitch)*distance,Math.cos(orbitYaw)*Math.cos(currentPitch)*distance);
    camera.lookAt(0,.1+explosion*.35,0);
    layers.forEach(({part,y},i)=>{
      part.position.y=y+explosion*i*.37;
      part.position.x=explosion*(i-2)*.09;
    });
    core.position.y=still?0:Math.sin(phase*.9)*.13;
    rings.forEach((ring,i)=>{ring.rotation.z=(i?.15:-.12)+(still?0:phase*(i?.13:-.1));ring.position.y=.05+i*.28+explosion*.4;});
    coreAura.material.opacity=(immersive?.5:.15)+(still?0:Math.sin(phase*1.2)*.09);
    nodes.forEach(node=>{
      const scale=1+explosion*.12;
      const orbit=immersive?phase*.095:0;
      const nx=node.x*Math.cos(orbit)-node.z*Math.sin(orbit);
      const nz=node.x*Math.sin(orbit)+node.z*Math.cos(orbit);
      node.group.position.set(nx*scale,-.26+(!still?Math.sin(phase*.9+node.index*1.6)*(immersive?.28:.08):0),nz*scale);
      node.group.rotation.y=immersive?Math.sin(phase*.45+node.index)*.08:0;
      // The first chapter isolates the model; later chapters connect the system.
      const relevant=stage>0||node.name==='models'||!isFlow;
      const targetScale=relevant?1:.35;
      node.group.scale.lerp(new THREE.Vector3(targetScale,targetScale,targetScale),blend);
      node.segments.forEach(part=>{part.visible=relevant;});
      node.label.style.opacity=relevant?'1':'.18';
      updateConnection(node);
      node.packets.forEach((packet,i)=>{
        packet.visible=relevant&&(!isFlow||stage===2);
        positionPacket(packet,node,(phase*(immersive?.3:.22)+node.index*.22+i/node.packets.length)%1);
      });
    });
    scene.updateMatrixWorld(true);
    camera.updateMatrixWorld();
    nodes.forEach(node=>{
      projected.set(0,.82,0).applyMatrix4(node.group.matrixWorld).project(camera);
      const x=(projected.x*.5+.5)*width,y=(-projected.y*.5+.5)*height;
      node.label.style.transform='translate('+x.toFixed(1)+'px,'+y.toFixed(1)+'px) translate(-50%,-100%)';
      node.label.style.visibility=projected.z>1?'hidden':'visible';
    });
    renderer.render(scene,camera);
    host.classList.add('scene-ready');
    host.dataset.rendered='true';
    host.dataset.view=explosion>.45?'exploded':'assembled';
    if(!still)frame=requestAnimationFrame(draw);
  };
  function requestDraw(){if(!frame&&!disposed&&!lost&&visible&&!document.hidden)frame=requestAnimationFrame(draw);}
  const resize=()=>{
    const rect=host.getBoundingClientRect();width=rect.width;height=rect.height;
    if(!width||!height)return;
    renderer.setSize(width,height,false);
    const aspect=width/height;
    const viewWidth=isFlow?9.7:9.6;
    const viewHeight=Math.max(isFlow?7.2:8.3,viewWidth/aspect);
    camera.left=-viewHeight*aspect/2;camera.right=viewHeight*aspect/2;
    camera.top=viewHeight/2;camera.bottom=-viewHeight/2;
    camera.updateProjectionMatrix();requestDraw();
  };
  const observer=new IntersectionObserver(entries=>{
    visible=entries[0].isIntersecting;
    if(!visible){cancelAnimationFrame(frame);frame=0;lastTime=0;}else{resize();requestDraw();}
  },{rootMargin:'40px'});
  observer.observe(host);
  const resizeObserver=new ResizeObserver(resize);resizeObserver.observe(host);
  const pauseObserver=new MutationObserver(()=>{cancelAnimationFrame(frame);frame=0;lastTime=0;requestDraw();});
  pauseObserver.observe(document.body,{attributes:true,attributeFilter:['class']});
  const flowObserver=isFlow?new MutationObserver(requestDraw):null;
  flowObserver?.observe(flow,{attributes:true,attributeFilter:['data-flow-state']});
  const syncVisibility=()=>{cancelAnimationFrame(frame);frame=0;lastTime=0;if(!document.hidden)requestDraw();};
  document.addEventListener('visibilitychange',syncVisibility);
  motionPreference.addEventListener('change',syncVisibility);

  // Pointer capture keeps dragging local. Vertical touch gestures still scroll.
  const onDown=event=>{
    if(event.button!==0||paused())return;
    dragging=true;userRotated=true;pointerId=event.pointerId;dragX=event.clientX;dragY=event.clientY;
    canvas.setPointerCapture(event.pointerId);
  };
  const onMove=event=>{
    if(!dragging||paused())return;
    targetYaw+=(event.clientX-dragX)*.007;
    if(event.pointerType==='mouse')targetPitch=clamp(targetPitch+(event.clientY-dragY)*.003,.35,.95);
    dragX=event.clientX;dragY=event.clientY;requestDraw();
  };
  const onUp=()=>{dragging=false;if(pointerId!==null&&canvas.hasPointerCapture(pointerId))canvas.releasePointerCapture(pointerId);pointerId=null;};
  canvas.addEventListener('pointerdown',onDown);
  canvas.addEventListener('pointermove',onMove);
  canvas.addEventListener('pointerup',onUp);
  canvas.addEventListener('pointercancel',onUp);
  canvas.addEventListener('keydown',event=>{
    if(!['ArrowLeft','ArrowRight','Home'].includes(event.key))return;
    event.preventDefault();
    userRotated=true;
    if(event.key==='Home'){targetYaw=.63;targetPitch=.62;}else targetYaw+=event.key==='ArrowLeft'?-.18:.18;
    requestDraw();
  });
  canvas.addEventListener('webglcontextlost',event=>{
    event.preventDefault();lost=true;cancelAnimationFrame(frame);frame=0;
    host.classList.remove('scene-ready');host.classList.add('scene-unavailable');
  });
  canvas.addEventListener('webglcontextrestored',()=>{
    lost=false;host.classList.remove('scene-unavailable');resize();requestDraw();
  });
  let heroTop=0,heroHeight=1;
  const measureHero=()=>{if(!isFlow){const rect=host.closest('.hero').getBoundingClientRect();heroTop=rect.top+scrollY;heroHeight=rect.height;}};
  const onScroll=()=>{if(!isFlow&&!paused()){scrollExplosion=clamp((scrollY-heroTop)/heroHeight,0,1)*1.15;requestDraw();}};
  if(!isFlow){addEventListener('scroll',onScroll,{passive:true});addEventListener('resize',measureHero,{passive:true});measureHero();}
  const api={
    setView(value){manualExplosion=value==='exploded'?1:0;scrollExplosion=0;requestDraw();},
    reset(){targetYaw=.63;targetPitch=.62;manualExplosion=0;scrollExplosion=0;phase=0;userRotated=false;requestDraw();},
    dispose(){
      disposed=true;cancelAnimationFrame(frame);observer.disconnect();resizeObserver.disconnect();pauseObserver.disconnect();flowObserver?.disconnect();
      document.removeEventListener('visibilitychange',syncVisibility);motionPreference.removeEventListener('change',syncVisibility);
      removeEventListener('scroll',onScroll);removeEventListener('resize',measureHero);
      resources.forEach(resource=>resource.dispose?.());environmentMap.dispose();renderer.dispose();
    }
  };
  resize();
  return api;
}

const scenes=[];
document.querySelectorAll('[data-scene]').forEach(host=>{
  let instance;
  try{instance=createScene(host);}catch(error){
    host.classList.add('scene-unavailable');
    host.querySelector('canvas').removeAttribute('tabindex');
    console.warn('The 3D illustration is unavailable; the architecture fallback remains visible.',error);
  }
  if(instance)scenes.push(instance);
  if(!instance||host.dataset.scene!=='hero')return;
  const controls=host.parentElement.querySelectorAll('[data-system-view]');
  controls.forEach(button=>button.addEventListener('click',()=>{
    controls.forEach(item=>item.setAttribute('aria-pressed',String(item===button)));
    instance.setView(button.dataset.systemView);
  }));
  host.parentElement.querySelector('.reset-view').addEventListener('click',()=>{
    instance.reset();controls.forEach(item=>item.setAttribute('aria-pressed',String(item.dataset.systemView==='assembled')));
  });
});
addEventListener('pagehide',event=>{if(!event.persisted)scenes.forEach(scene=>scene.dispose());});
