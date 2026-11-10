// Review-only lighting prototype, rendered by the site's existing Three.js renderer.
function installLightingPreview(){
 const v=modalViewer,T=THREE;
 const style=document.createElement('style');style.textContent='.review-night #modal .project-metrics strong{color:#edf2fa}.review-night #modal .project-metrics span{color:#aebdd0}';document.head.append(style);
 v.ctl.autoRotate=false;v.ctl.enableDamping=false;
 const materials=new Map();v.p.root.traverse(o=>{for(const m of [].concat(o.material||[]))if(!materials.has(m))materials.set(m,{color:m.color?.clone(),emissive:m.emissive?.clone(),intensity:m.emissiveIntensity,env:m.envMapIntensity})});
 const ground=v.projectGround.material.color.clone();
 const spots=[];
 for(const [x,z] of [[-45,38],[40,-30]]){const l=new T.SpotLight(0xffce8a,0,260,Math.PI/5,.65,1);l.position.set(x,5,z);l.target.position.set(x*.2,35,z*.2);l.castShadow=false;v.scene.add(l,l.target);spots.push(l)}
 window.setReviewLight=mode=>{
  document.documentElement.classList.toggle('review-night',mode!=='day');
  GranVisual.apply(v.lighting,'vpm');v.projectGround.material.color.copy(ground);
  let i=0;for(const [m,original] of materials){if(m.color&&original.color)m.color.copy(original.color);if(m.emissive&&original.emissive)m.emissive.copy(original.emissive);m.emissiveIntensity=original.intensity;m.envMapIntensity=original.env;
   if(mode!=='day'&&m.envMap&&m.emissive){const lit=(i++%3)!==0;m.emissive.setHex(lit?0xffc078:0x172435).convertSRGBToLinear();m.emissiveIntensity=lit?(mode==='night'?1.15:.65):.03;m.envMapIntensity=.08;}
  }
  spots.forEach(l=>l.intensity=mode==='day'?0:mode==='dusk'?1.4:2.5);
  if(mode!=='day'){
   const night=mode==='night',bg=night?0x111c2c:0x65748c;
   v.scene.background.setHex(bg);if(v.scene.fog)v.scene.fog.color.setHex(bg);
   v.lighting.hemisphere.color.setHex(0x9fbce9);v.lighting.hemisphere.groundColor.setHex(0x172331);v.lighting.hemisphere.intensity=night?.32:.55;
   v.lighting.sun.color.setHex(0xaac9ff);v.lighting.sun.intensity=night?.22:.45;
   v.lighting.fill.color.setHex(0xffd3a0);v.lighting.fill.intensity=night?.28:.38;
   v.projectGround.material.color.setHex(night?0x304052:0x8996a6).convertSRGBToLinear();v.r.toneMappingExposure=night?.85:.94;
  }
  v.r.shadowMap.needsUpdate=true;v.dirty=true;v.r.render(v.scene,v.cam);
 };
 setReviewLight('day');
}
