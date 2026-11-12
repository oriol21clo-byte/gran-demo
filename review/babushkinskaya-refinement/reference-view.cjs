const fs=require('fs'),{chromium}=require('playwright'),fit=JSON.parse(fs.readFileSync(__dirname+'/reference-camera.json'));
(async()=>{
 const b=await chromium.launch({executablePath:'/usr/bin/chromium',args:['--no-sandbox','--use-angle=swiftshader','--enable-unsafe-swiftshader']});
 try{
  const p=await b.newPage({viewport:{width:1440,height:1050}});
  await p.addInitScript(()=>{window.__frames=[];window.requestAnimationFrame=cb=>(__frames.push(cb),__frames.length)});
  await p.goto(process.env.GRAN_REVIEW_URL||'http://127.0.0.1:8052/',{waitUntil:'load'});
  await p.evaluate(()=>document.querySelector('[data-open="1"]').click());
  const shots=await p.evaluate(fit=>{
   const v=modalViewer,c=new THREE.PerspectiveCamera(fit.fov,432/525,1,6000);
   c.position.fromArray(fit.eye);c.lookAt(new THREE.Vector3(...fit.target));
   c.setViewOffset(432,525,-fit.shift[0],-fit.shift[1],432,525);
   v.r.setPixelRatio(1);v.r.setSize(864,1050,false);v.scene.background=new THREE.Color(0x454545);
   v.projectGround.visible=false;v.scene.children.filter(n=>n.material?.isShadowMaterial).forEach(n=>n.visible=false);
   v.r.render(v.scene,c);const full=v.canvas.toDataURL('image/jpeg',.94);
   // Render a tighter viewport with the same perspective for the roof outline.
   c.setViewOffset(432,525,-fit.shift[0]+30,-fit.shift[1]+280,340,245);
   v.r.setSize(680,490,false);v.r.render(v.scene,c);
   return{full,lower:v.canvas.toDataURL('image/jpeg',.94)};
  },fit);
  for(const [name,key]of [['reference-view','full'],['podium-top','lower']])fs.writeFileSync(__dirname+'/'+name+'.jpg',Buffer.from(shots[key].split(',')[1],'base64'));
 }finally{await b.close()}
})().catch(e=>{console.error(e);process.exit(1)});
