const fs=require('fs'),assert=require('assert'),{JSDOM}=require('jsdom'),THREE=require('three');
const html=fs.readFileSync('index.html','utf8'),dom=new JSDOM(html,{url:'http://localhost/',runScripts:'outside-only',pretendToBeVisual:true}),w=dom.window,d=w.document,renderers=[];
const native2d={createLinearGradient:()=>({addColorStop(){}}),createRadialGradient:()=>({addColorStop(){}}),fillRect(){}};
w.HTMLCanvasElement.prototype.getContext=()=>native2d;w.HTMLCanvasElement.prototype.setPointerCapture=function(){};
w.matchMedia=()=>({matches:false});const pendingCards=[];w.IntersectionObserver=class{constructor(cb,options){this.cb=cb;this.options=options}observe(){if(this.options&&this.options.rootMargin)pendingCards.push(this.cb);else this.cb([{isIntersecting:true}])} disconnect(){}};w.ResizeObserver=class{observe(){} disconnect(){}};const animationCallbacks=[];w.requestAnimationFrame=cb=>{animationCallbacks.push(cb);return 0};w.scrollTo=()=>{};w.HTMLElement.prototype.scrollIntoView=function(){};
class Renderer{constructor(o){this.domElement=o.canvas;this.shadowMap={};renderers.push(this)}getContext(){return {}}setPixelRatio(){}setSize(){}render(s,c){this.draws=(this.draws||0)+1;s.updateMatrixWorld(true);c.updateMatrixWorld(true);this.scene=s;this.camera=c}}
THREE.WebGLRenderer=Renderer;w.THREE=THREE;
for(const p of ['assets/gran-visual.js','assets/gran-project-lighting.js','assets/reference-project.js','assets/ryabinovaya-project.js','assets/photo-tower-project.js','assets/twin-quarter-project.js'])w.eval(fs.readFileSync(p,'utf8'));
const errors=[];w.addEventListener('error',e=>errors.push(String(e.error)));
for(const match of html.matchAll(/<script(?:\s[^>]*)?>([\s\S]*?)<\/script>/g)){let code=match[1];if(!code.trim())continue;if(code.includes('let calcViewer'))code+='\nwindow.__check={get:()=>({calcViewer,modalViewer,lastCalc,PROJECTS,buildProject,calcPrice,mats,setMode})};';w.eval(code)}
const get=()=>w.__check.get();
async function check(){
 assert.equal(renderers.length,1,'only hero context created at startup');assert.equal(pendingCards.length,5);d.querySelector('#projects [data-project-time="night"]').click();pendingCards.forEach(cb=>cb([{isIntersecting:true}]));assert.equal(renderers.length,6,'cards and calculator load when approaching viewport');assert([...d.querySelectorAll('#projList .stage')].every(el=>el.dataset.light==='night'),'lazy cards inherit selected light');d.querySelector('#projects [data-project-time="day"]').click();await new Promise(resolve=>setTimeout(resolve,600));
 const initialFrames=animationCallbacks.slice();
 const heroFrame=animationCallbacks[0], hc=renderers[0].camera;let clock=w.performance.now()+4000;heroFrame(clock);
 const angle=()=>Math.atan2(hc.position.x,hc.position.z-2);for(let i=0;i<300;i++)heroFrame(clock+=50);const start=angle();for(let i=0;i<60;i++)heroFrame(clock+=1000/60);const at60=angle();for(let i=0;i<120;i++)heroFrame(clock+=1000/120);const at120=angle();assert(Math.abs((at60-start)-.035)<.0015);assert(Math.abs((at120-at60)-.035)<.0015,'rotation speed independent of 60/120 Hz');
 const cv=get().calcViewer;assert(cv.p,'calculator geometry built');if(cv.lv)cv.lv.grp.visible=false;
 // Regression: zero must not poison live geometry or camera; repeated increases recover.
 for(const area of [0,35000,0,12000]){const input=d.querySelector('#cArea');input.value=area;input.dispatchEvent(new w.Event('change',{bubbles:true}));
  assert(Object.values(cv.lv.st).every(Number.isFinite),'finite live site at '+area);
  await new Promise(resolve=>setTimeout(resolve,600));
  for(let i=0;i<240;i++)cv.tick(1000/120);
  assert(cv.cam.position.toArray().every(Number.isFinite),'finite camera after '+area);
  assert(cv.p.g[cv.mode].visible,'detail model restored after '+area);
  cv.p.root.traverse(o=>{if(o.geometry)assert(Array.from(o.geometry.attributes.position.array).every(Number.isFinite),'finite geometry after '+area)});
 }
 // Orthographic fitting must preserve scale through aspect changes and user zoom.
 const camera=new THREE.OrthographicCamera(-1,1,1,-1,.5,2000);
 w.GranVisual.project(camera,2,200);const height=camera.top-camera.bottom;
 assert(Math.abs((camera.right-camera.left)/height-2)<1e-10);
 camera.zoom=1.8;w.GranVisual.project(camera,.65,200);
 assert.equal(camera.zoom,1.8);assert.equal(camera.top-camera.bottom,height);
 assert(Math.abs((camera.right-camera.left)/height-.65)<1e-10);
 w.GranVisual.project(camera,.65,100);assert.equal(camera.top-camera.bottom,height/2);
 assert(cv.cam.isOrthographicCamera,'calculator uses fitted architectural projection');
 cv.cam.zoom=2;cv.view('top');assert.equal(cv.cam.zoom,1,'view presets restore framing');cv.anim=null;
 for(const mode of ['npm','vpm','cim']){cv.setMode(mode);assert.equal(cv.lighting.mode,mode);assert.equal(cv.r.shadowMap.enabled,mode!=='cim');assert.equal(Object.entries(cv.p.g).filter(([k,v])=>v.visible).map(([k])=>k).join(),mode)}
 const originalGlass=get().mats().glass, originalEmission=originalGlass.emissive.clone(), originalEnvironment=originalGlass.envMapIntensity;
 let sharedDayTexture;
 for(let i=0;i<4;i++){
  d.querySelector(`[data-open="${i}"]`).click();const mv=get().modalViewer;
  assert.equal(mv.o.modes.join(),'vpm');mv.setMode('npm');assert.equal(mv.mode,'vpm');assert(mv.p.g.vpm.visible);
  const root=mv.p.root,position=mv.cam.position.clone(),zoom=mv.cam.zoom;
  d.querySelector('#modal [data-project-time="day"]').click();
  assert(mv.scene.background.isTexture);if(sharedDayTexture)assert.strictEqual(mv.scene.background,sharedDayTexture);else sharedDayTexture=mv.scene.background;
  assert.equal(mv.r.toneMappingExposure,.99);assert.equal(mv.lighting.hemisphere.intensity,.92);
  d.querySelector('#modal [data-project-time="night"]').click();
  assert.equal(mv.projectTime,'night');assert.notStrictEqual(mv.scene.background,sharedDayTexture);
  assert.equal(mv.r.toneMappingExposure,.9);assert.equal(mv.projectLightRig.spots.length,2);
  assert(mv.projectLightRig.spots.every(({light})=>!light.castShadow&&light.intensity===2.5));
  assert(mv.projectLightRig.glass.every(({material})=>material!==originalGlass&&material.emissiveIntensity===.62));
  assert(mv.projectLightRig.glass.some(({lit})=>lit),'night includes warm glazing in every project');
  assert.strictEqual(mv.p.root,root,'lighting does not rebuild geometry');assert(mv.cam.position.equals(position));assert.equal(mv.cam.zoom,zoom);
  assert([...d.querySelectorAll('[data-project-time="night"]')].every(b=>b.getAttribute('aria-pressed')==='true'),'lighting controls stay synchronized');
  assert(originalGlass.emissive.equals(originalEmission));assert.equal(originalGlass.envMapIntensity,originalEnvironment,'project light does not affect calculator materials');
  d.querySelector('#mClose').click();
 }
 d.querySelector('#projects [data-project-time="day"]').click();
 assert([...d.querySelectorAll('#projList .stage')].every(el=>el.dataset.light==='day'));

 // Opening a full model must stop all background renderers without losing the active view.
 const before=renderers.slice(0,6).map(r=>r.draws||0);d.querySelector('[data-open="1"]').click();
 const modalFrame=animationCallbacks.at(-1);initialFrames.forEach(cb=>cb(clock+=8.33));assert.deepEqual(renderers.slice(0,6).map(r=>r.draws||0),before,'background viewers pause in modal');
 const active=get().modalViewer;const count=active.r.draws||0;modalFrame(clock+=8.33);assert((active.r.draws||0)>count,'active modal still renders');
 active.p.root.traverse(o=>assert.equal(o.matrixAutoUpdate,false,'static model transforms cached'));
 assert.equal(active.projectGround.material.color.getHex(),renderers[0].scene.getObjectByName('context-ground').material.color.getHex(),'shared lit ground colour');
 d.querySelector('#mClose').click();
 // Hero selection still resolves actual floor and building metadata on the CPU.
 const hero=renderers[0];d.querySelector('#viewer canvas').getBoundingClientRect=()=>({left:0,top:0,width:600,height:600});get().setMode('cim');hero.scene.updateMatrixWorld(true);hero.camera.updateMatrixWorld(true);
 const pt=new THREE.Vector3(-13,31.5,-.5).project(hero.camera);const event=new w.MouseEvent('pointerup',{clientX:(pt.x+1)*300,clientY:(1-pt.y)*300,bubbles:true});d.querySelector('#viewer canvas').dispatchEvent(event);
 assert.equal(d.querySelector('#vinfo').style.display,'block','hero IFC selection');assert(d.querySelector('#vinfoBody').textContent.includes('Корпус'));
 get().setMode('npm');assert.equal(hero.shadowMap.enabled,true);assert(!hero.scene.getObjectByName('context-ground-shadows').visible);get().setMode('vpm');assert.equal(hero.shadowMap.enabled,true);const floor=hero.scene.getObjectByName('context-ground'),shadow=hero.scene.getObjectByName('context-ground-shadows');assert.equal(floor.material.color.clone().convertLinearToSRGB().getHex(),0xbfc1c0);assert(!shadow.visible);assert(floor.receiveShadow);assert(hero.scene.children.filter(o=>o.isGroup).some(g=>g.children.filter(o=>o.isMesh&&o.geometry.type==='BoxGeometry').length>=8),'background buildings remain');get().setMode('cim');assert.equal(hero.shadowMap.enabled,false);
 assert.deepEqual(errors,[]);console.log('CPU scene lifecycle, mode visibility/styles, VPM-only project modal, IFC picking: PASS');
 w.close();
}
setTimeout(check,750);
