import {t} from './i18n.js';
import * as T from 'three';
import {OrbitControls} from './vendor/OrbitControls.js';
import {buildArtModel} from './art-model.js';
const $=s=>document.querySelector(s), reduced=matchMedia('(prefers-reduced-motion: reduce)');
let step=0,presses=0,busy=false,inside=false,pressStarted=0,lastPressFinished=-10000,render=()=>{},cameraView=()=>{};
const chapters=[['THE DESIGN','A little leverage.','The side lever makes carbonation a hands-on ritual. The bottle hangs from the Snap-Lock beneath the metal-trimmed head, while a CO₂ cylinder sits inside the rear housing. No electricity required.'],['PREPARE THE BOTTLE','Fill. Lift. Lock.','Fill a compatible bottle with cold, plain water to its fill line. With the bottle rest tilted forward, insert the neck, then push up and back into the Snap-Lock. The bottle should hang above the base.'],['CARBONATE','Put the lever to work.','Push the lever fully down for one second, then release. The official guide suggests three presses for standard fizz or five for strong fizz. Try it here; actual carbonation also depends on water temperature and the cylinder.'],['RELEASE','Let the pressure go.','After releasing the lever, gently tilt the bottle fully forward. Wait for the sound of excess gas escaping before removing it. Add flavours only after carbonation, then pour and enjoy.']];
function sync(){const c=chapters[step];$('#chapter').textContent=`0${step+1} / ${c[0]}`;$('#title').textContent=c[1];$('#copy').textContent=c[2];document.querySelectorAll('[data-step]').forEach(b=>{b.classList.toggle('selected',+b.dataset.step===step);b.setAttribute('aria-current',+b.dataset.step===step?'step':'false')});$('#count').innerHTML=`${presses} <small>/ 5</small>`;$('#press').disabled=step!==2||busy||presses>=5;$('#status').textContent=step===0?'Select “Fill & lock” to prepare the bottle.':step===1?'Bottle filled and locked. Continue to make it fizz.':step===3?'Pressure released. Flavours go in afterwards.':busy?'Lever down: gas enters the water.':presses===5?'Five presses: strong fizz guidance. Ready to release.':presses===3?'Three presses: standard fizz guidance.':`${presses} of 5 demonstration presses. Each press lasts one second.`;$('#next').textContent=['Next: Fill & lock →','Next: Make it fizz →','Next: Release & enjoy →','Start again ↺'][step];render();}
function setStep(n){if(busy)return;step=n;if(n<2)presses=0;sync()}
document.querySelectorAll('[data-step]').forEach(b=>b.onclick=()=>setStep(+b.dataset.step));$('#next').onclick=()=>setStep((step+1)%4);$('#inside').onchange=e=>{inside=e.target.checked;render()};$('#press').onclick=()=>{if(busy||step!==2||presses>=5)return;busy=true;pressStarted=performance.now();sync();setTimeout(()=>{busy=false;presses++;lastPressFinished=performance.now();sync()},1000)};
document.querySelectorAll('[data-view]').forEach(b=>b.onclick=()=>cameraView(b.dataset.view));$('#reset').onclick=()=>{if(busy)return;inside=false;$('#inside').checked=false;setStep(0);cameraView('hero')};sync();
try {
  const holder=$('#viewport'),scene=new T.Scene(),camera=new T.PerspectiveCamera(31,1,.1,100);
  const renderer=new T.WebGLRenderer({antialias:true,alpha:true});
  renderer.setPixelRatio(Math.min(devicePixelRatio,1.8));renderer.shadowMap.enabled=true;
  renderer.shadowMap.type=T.PCFSoftShadowMap;renderer.toneMapping=T.ACESFilmicToneMapping;renderer.toneMappingExposure=1.0;
  holder.append(renderer.domElement);renderer.domElement.setAttribute('role','img');renderer.domElement.setAttribute('aria-label','Reference-based SodaStream ART model. Camera buttons provide keyboard views.');$('#fallback').hidden=true;
  const controls=new OrbitControls(camera,renderer.domElement);controls.enablePan=false;controls.minDistance=2.2;controls.maxDistance=12;controls.maxPolarAngle=Math.PI*.54;
  scene.add(new T.HemisphereLight(0xe8f2f7,0x76838a,1.55));
  const key=new T.DirectionalLight(0xfff9f0,2.8);key.position.set(-3,7,6);key.castShadow=true;key.shadow.mapSize.set(1024,1024);Object.assign(key.shadow.camera,{left:-4,right:4,top:6,bottom:-3});key.shadow.bias=-.001;key.shadow.normalBias=.012;scene.add(key);
  const fill=new T.DirectionalLight(0xd8eeff,1.3);fill.position.set(4,3,-4);scene.add(fill);
  const envScene=new T.Scene();envScene.background=new T.Color('#52606a');
  for(const [x,y,z,w,h,intensity] of [[-3.5,3,4,2.0,7,3],[4,3,1,1.3,7,2.5],[0,7,-1,5,4,2.5],[0,2,-5,4,4,1]]){const material=new T.MeshBasicMaterial({color:new T.Color(intensity,intensity,intensity),side:T.DoubleSide});const panel=new T.Mesh(new T.PlaneGeometry(w,h),material);panel.position.set(x,y,z);panel.lookAt(0,2,0);envScene.add(panel)}
  const pmrem=new T.PMREMGenerator(renderer),environment=pmrem.fromScene(envScene);scene.environment=environment.texture;pmrem.dispose();
  if(new URLSearchParams(location.search).get('lighting')==='neutral'){scene.environmentIntensity=.55;key.intensity=1.5;fill.intensity=1.0;document.querySelector('.stage').style.background='#e5e5e5';}
  const model=buildArtModel(scene);
  const floor=new T.Mesh(new T.PlaneGeometry(200,200),new T.ShadowMaterial({opacity:.15}));floor.rotation.x=-Math.PI/2;floor.receiveShadow=true;scene.add(floor);
  let frame=0,transition=null;const started=performance.now();
  function draw(){
    cancelAnimationFrame(frame);if(document.hidden)return;
    const now=performance.now();
    if(transition){const u=Math.min(1,(now-transition.started)/420),e=u*u*(3-2*u);camera.position.lerpVectors(transition.from,transition.to,e);controls.target.lerpVectors(transition.targetFrom,transition.targetTo,e);camera.lookAt(controls.target);if(u===1)transition=null;}
    const moving=busy||now-lastPressFinished<4500;
    model.update({inside,busy,presses,step,time:moving?(now-started)/1000:0,pressPhase:(now-pressStarted)/1000,reduced:reduced.matches||!moving});
    renderer.render(scene,camera);
    if(transition||(moving&&!reduced.matches))frame=requestAnimationFrame(draw);
  }
  render=draw;controls.addEventListener('start',()=>{transition=null});controls.addEventListener('change',draw);
  cameraView=name=>{
    const presets={hero:[[5.2,3.5,9.3],[0,2.10,0]],front:[[0,2.45,10.5],[0,2.12,0]],side:[[10.5,2.45,0],[0,2.12,0]],rear:[[3,3.1,-10],[0,2.12,-.2]],detail:[[3.3,4.3,4.6],[.45,3.61,.12]]};
    const [position,target]=presets[name];
    if(camera.position.length()>1&&!reduced.matches){transition={started:performance.now(),from:camera.position.clone(),to:new T.Vector3(...position),targetFrom:controls.target.clone(),targetTo:new T.Vector3(...target)}}else{camera.position.set(...position);controls.target.set(...target);controls.update()}
    document.querySelectorAll('[data-view]').forEach(b=>{b.classList.toggle('active',b.dataset.view===name);b.setAttribute('aria-pressed',String(b.dataset.view===name))});$('#view-label').textContent=({hero:'01 / THE WHOLE OBJECT',front:'02 / FRONT ELEVATION',side:'03 / SIDE PROFILE',rear:'04 / CYLINDER HOUSING',detail:'05 / THE CARBONATING LEVER'})[name];draw();
  };
  function resize(){camera.aspect=holder.clientWidth/holder.clientHeight;camera.updateProjectionMatrix();renderer.setSize(holder.clientWidth,holder.clientHeight);draw()}
  const observer=new ResizeObserver(resize);observer.observe(holder);document.addEventListener('visibilitychange',draw);reduced.addEventListener('change',draw);
  renderer.domElement.addEventListener('webglcontextlost',e=>{e.preventDefault();cancelAnimationFrame(frame);$('#fallback').hidden=false;$('#fallback').textContent='3D rendering paused. Reload to restore it; the chemistry guide still works.'});
  cameraView('hero');resize();
  addEventListener('pagehide',()=>{observer.disconnect();cancelAnimationFrame(frame);controls.dispose();environment.dispose();renderer.dispose()},{once:true});
} catch(error) {console.error(error);$('#fallback').hidden=false;$('#fallback').textContent='3D is unavailable in this browser. The guided steps and interactive chemistry still work.';}

if(document.modelContext?.registerTool){const lifecycle=new AbortController();addEventListener('pagehide',()=>lifecycle.abort(),{once:true});try{Promise.resolve(document.modelContext.registerTool({name:'explore_art_step',description:'Show a stage of the SodaStream ART educational guide and optionally reveal the illustrative gas path.',inputSchema:{type:'object',properties:{step:{type:'integer',minimum:0,maximum:3},revealGasPath:{type:'boolean'}},required:['step'],additionalProperties:false},annotations:{readOnlyHint:false,untrustedContentHint:false},execute(input){if(!input||!Number.isInteger(input.step)||input.step<0||input.step>3||Object.keys(input).some(k=>!['step','revealGasPath'].includes(k))||(input.revealGasPath!==undefined&&typeof input.revealGasPath!=='boolean'))throw new Error('Expected step 0–3 and an optional boolean revealGasPath');if(busy)throw new Error('Wait for the current lever press to finish');if(input.revealGasPath!==undefined){inside=input.revealGasPath;$('#inside').checked=inside}setStep(input.step);return {step,title:chapters[step][1],presses,revealGasPath:inside}}},{signal:lifecycle.signal})).catch(console.warn)}catch(e){console.warn(e)}}
