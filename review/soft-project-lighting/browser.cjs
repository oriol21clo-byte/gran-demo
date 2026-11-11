const fs=require('fs'),assert=require('assert'),{chromium}=require('playwright');
(async()=>{const browser=await chromium.launch({executablePath:'/usr/bin/chromium',args:['--no-sandbox','--use-angle=swiftshader','--enable-unsafe-swiftshader']});const errors=[];
try{const page=await browser.newPage({viewport:{width:1440,height:1050}});page.on('pageerror',e=>errors.push(e.message));page.on('console',m=>{if(m.type()==='error'&&/shader|THREE.WebGLProgram/i.test(m.text()))errors.push(m.text())});await page.addInitScript(()=>{window.__frames=[];window.requestAnimationFrame=cb=>{__frames.push(cb);return __frames.length}});await page.route('https://fonts.**',r=>r.abort());await page.goto('http://127.0.0.1:8010/',{waitUntil:'domcontentloaded',timeout:90000});await page.evaluate(()=>document.querySelector('#ckNeed').click());
for(let i=0;i<4;i++){
 await page.evaluate(i=>document.querySelector('[data-open="'+i+'"]').click(),i);
 const initial=await page.evaluate(()=>modalViewer.cam.position.toArray());
 for(const mode of ['day','night']){
  await page.evaluate(mode=>{document.querySelector('#modal [data-project-time="'+mode+'"]').click();const v=modalViewer;v.ctl.autoRotate=false;v.r.setPixelRatio(1);v.r.setSize(v.canvas.clientWidth,v.canvas.clientHeight,false);v.r.render(v.scene,v.cam);},mode);
  assert.deepStrictEqual(await page.evaluate(()=>modalViewer.cam.position.toArray()),initial);
  await page.locator('#modal .mbox').screenshot({path:'review/soft-project-lighting/project-'+(i+1)+'-'+mode+'.png'});
  console.log('captured',i+1,mode);
 }
 await page.evaluate(()=>document.querySelector('#mClose').click());
}
// Actual mobile layout, project switching, keyboard close and night metrics.
await page.setViewportSize({width:390,height:844});await page.evaluate(()=>document.querySelector('[data-open="1"]').click());await page.evaluate(()=>{const v=modalViewer;v.r.setPixelRatio(1);v.r.setSize(v.canvas.clientWidth,v.canvas.clientHeight,false);GranVisual.project(v.cam,v.canvas.clientWidth/v.canvas.clientHeight,v.viewDistance);v.r.render(v.scene,v.cam)});await page.locator('#modal .mbox').screenshot({path:'review/soft-project-lighting/mobile-night.png'});
assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false);
await page.keyboard.press('Escape');assert(await page.locator('#modal').isHidden());
await page.setViewportSize({width:1440,height:1600});await page.evaluate(()=>{const e=document.querySelector('#projects');scrollTo(0,e.getBoundingClientRect().top+scrollY-80)});await page.waitForTimeout(400);
for(const mode of ['night','day']){
 await page.evaluate(mode=>document.querySelector('#projects [data-project-time="'+mode+'"]').click(),mode);
 await page.evaluate(()=>{window.__frameClock=(window.__frameClock||performance.now())+100;for(const cb of __frames.splice(0))cb(__frameClock)});
 await page.locator('#projects').screenshot({path:'review/soft-project-lighting/project-cards-'+mode+'.png'});
}

assert.deepStrictEqual(errors,[]);console.log(JSON.stringify({errors,mobileOverflow:false,projects:4,lightingStates:8}));
}finally{await browser.close()}})();
