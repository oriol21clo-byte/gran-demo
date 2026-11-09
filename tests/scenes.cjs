const fs=require('fs'),assert=require('assert'),{JSDOM}=require('jsdom'),THREE=require('three');
const html=fs.readFileSync('index.html','utf8'),dom=new JSDOM(html,{url:'http://localhost/',runScripts:'outside-only',pretendToBeVisual:true}),w=dom.window,d=w.document,renderers=[];
const native2d={createLinearGradient:()=>({addColorStop(){}}),fillRect(){}};
w.HTMLCanvasElement.prototype.getContext=()=>native2d;w.HTMLCanvasElement.prototype.setPointerCapture=function(){};
w.matchMedia=()=>({matches:false});w.IntersectionObserver=class{observe(){} disconnect(){}};w.ResizeObserver=class{observe(){} disconnect(){}};const animationCallbacks=[];w.requestAnimationFrame=cb=>{animationCallbacks.push(cb);return 0};w.scrollTo=()=>{};w.HTMLElement.prototype.scrollIntoView=function(){};
class Renderer{constructor(o){this.domElement=o.canvas;this.shadowMap={};renderers.push(this)}getContext(){return {}}setPixelRatio(){}setSize(){}render(s,c){s.updateMatrixWorld(true);c.updateMatrixWorld(true);this.scene=s;this.camera=c}}
THREE.WebGLRenderer=Renderer;w.THREE=THREE;
for(const p of ['assets/gran-visual.js','assets/reference-project.js','assets/ryabinovaya-project.js','assets/photo-tower-project.js'])w.eval(fs.readFileSync(p,'utf8'));
const errors=[];w.addEventListener('error',e=>errors.push(String(e.error)));
for(const match of html.matchAll(/<script(?:\s[^>]*)?>([\s\S]*?)<\/script>/g)){let code=match[1];if(!code.trim())continue;if(code.includes('let calcViewer'))code+='\nwindow.__check={get:()=>({calcViewer,modalViewer,lastCalc,PROJECTS,buildProject,calcPrice,mats,setMode})};';w.eval(code)}
const get=()=>w.__check.get();
function check(){
 const heroFrame=animationCallbacks[0], hc=renderers[0].camera;let clock=w.performance.now()+4000;heroFrame(clock);
 const angle=()=>Math.atan2(hc.position.x,hc.position.z-2);const start=angle();for(let i=0;i<60;i++)heroFrame(clock+=1000/60);const at60=angle();for(let i=0;i<120;i++)heroFrame(clock+=1000/120);const at120=angle();assert(Math.abs((at60-start)-.035)<1e-6);assert(Math.abs((at120-at60)-.035)<1e-6,'rotation speed independent of 60/120 Hz');
 const cv=get().calcViewer;assert(cv.p,'calculator geometry built');if(cv.lv)cv.lv.grp.visible=false;
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
 for(let i=0;i<4;i++){d.querySelector(`[data-open="${i}"]`).click();const mv=get().modalViewer;assert.equal(mv.o.modes.join(),'vpm');mv.setMode('npm');assert.equal(mv.mode,'vpm');assert(mv.p.g.vpm.visible);d.querySelector('#mClose').click()}
 // Hero selection still resolves actual floor and building metadata on the CPU.
 const hero=renderers[0];d.querySelector('#viewer canvas').getBoundingClientRect=()=>({left:0,top:0,width:600,height:600});get().setMode('cim');hero.scene.updateMatrixWorld(true);hero.camera.updateMatrixWorld(true);
 const pt=new THREE.Vector3(-13,31.5,-.5).project(hero.camera);const event=new w.MouseEvent('pointerup',{clientX:(pt.x+1)*300,clientY:(1-pt.y)*300,bubbles:true});d.querySelector('#viewer canvas').dispatchEvent(event);
 assert.equal(d.querySelector('#vinfo').style.display,'block','hero IFC selection');assert(d.querySelector('#vinfoBody').textContent.includes('Корпус'));
 get().setMode('npm');assert.equal(hero.shadowMap.enabled,true);assert(!hero.scene.getObjectByName('context-ground-shadows').visible);get().setMode('vpm');assert.equal(hero.shadowMap.enabled,true);const floor=hero.scene.getObjectByName('context-ground'),shadow=hero.scene.getObjectByName('context-ground-shadows');assert.equal(floor.material.toneMapped,false);assert.equal(floor.material.color.clone().convertLinearToSRGB().getHex(),w.GranVisual.presets.vpm.background);assert(shadow.visible&&shadow.receiveShadow);assert(hero.scene.children.filter(o=>o.isGroup).some(g=>g.children.filter(o=>o.isMesh&&o.geometry.type==='BoxGeometry').length>=8),'background buildings remain');get().setMode('cim');assert.equal(hero.shadowMap.enabled,false);
 assert.deepEqual(errors,[]);console.log('CPU scene lifecycle, mode visibility/styles, VPM-only project modal, IFC picking: PASS');
 w.close();
}
setTimeout(check,750);
