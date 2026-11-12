const fs=require('fs'),{chromium}=require('playwright');
(async()=>{const b=await chromium.launch({executablePath:'/usr/bin/chromium',args:['--no-sandbox','--use-angle=swiftshader','--enable-unsafe-swiftshader']});const errors=[];try{const p=await b.newPage({viewport:{width:1440,height:1040}});p.on('pageerror',e=>errors.push(e.message));await p.addInitScript(()=>{window.__frames=[];window.requestAnimationFrame=cb=>(__frames.push(cb),__frames.length)});
for(const state of ['before','after']){
 await p.route('**/assets/twin-quarter-project.js',r=>r.fulfill({contentType:'application/javascript',body:fs.readFileSync('assets/twin-quarter-project.js','utf8').replace('tower(X(24),-44,-mirror)',state==='before'?'tower(X(24),-44,mirror)':'tower(X(24),-44,-mirror)')}));
 await p.goto('http://127.0.0.1:8041/',{waitUntil:'load',timeout:90000});await p.evaluate(()=>document.querySelector('[data-open="2"]').click());
 const uri=await p.evaluate(()=>{const v=modalViewer;v.ctl.autoRotate=false;v.r.setPixelRatio(1);v.r.setSize(1200,800,false);v.cam.zoom=1.07;v.place(Math.PI+.07,1.32,v.dist);GranVisual.project(v.cam,1.5,v.dist);v.r.render(v.scene,v.cam);return v.canvas.toDataURL('image/jpeg',.9)});fs.writeFileSync('review/tower-crown-direction/'+state+'.jpg',Buffer.from(uri.split(',')[1],'base64'));
 if(state==='after'){await p.evaluate(()=>document.querySelector('#modal [data-project-time="night"]').click());const u=await p.evaluate(()=>{const v=modalViewer;v.r.render(v.scene,v.cam);return v.canvas.toDataURL('image/jpeg',.9)});fs.writeFileSync('review/tower-crown-direction/night.jpg',Buffer.from(u.split(',')[1],'base64'));}
 await p.unroute('**/assets/twin-quarter-project.js');console.log(state+' captured');
}console.log(JSON.stringify({errors}));if(errors.length)process.exitCode=1;
}finally{await b.close()}})().catch(e=>{console.error(e);process.exit(1)});
