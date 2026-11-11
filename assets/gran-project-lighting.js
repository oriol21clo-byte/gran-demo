/* Selected option 02: soft architectural light. Projects only; Three.js r128. */
(function(global){
  'use strict';
  if(!global.THREE)return;
  const T=global.THREE,backgrounds=new Map();
  function background(time){
    if(backgrounds.has(time))return backgrounds.get(time);
    const night=time==='night',colors=night?['#101a29','#344658','#52657a']:['#dce3e8','#f6f7f8','#ffffff'];
    const canvas=document.createElement('canvas');canvas.width=256;canvas.height=512;
    const ctx=canvas.getContext('2d'),gradient=ctx.createLinearGradient(0,0,0,512);
    gradient.addColorStop(0,colors[0]);gradient.addColorStop(1,colors[1]);ctx.fillStyle=gradient;ctx.fillRect(0,0,256,512);
    const halo=ctx.createRadialGradient(128,265,5,128,265,260);
    halo.addColorStop(0,colors[2]+(night?'33':'66'));halo.addColorStop(1,colors[2]+'00');ctx.fillStyle=halo;ctx.fillRect(0,0,256,512);
    const texture=new T.CanvasTexture(canvas);texture.encoding=T.sRGBEncoding;backgrounds.set(time,texture);return texture;
  }
  function prepare(viewer){
    if(!viewer.projectLightRig){
      const spots=[[-45,38],[40,-30]].map(([x,z])=>{
        const light=new T.SpotLight(0xffce8a,0,260,Math.PI/5,.65,1);light.castShadow=false;
        viewer.scene.add(light,light.target);return {light,x,z};
      });
      viewer.projectLightRig={spots,glass:[]};
    }
    const state=viewer.projectLightRig,clones=new Map(),root=viewer.p.root;
    // Common calculator materials are shared. Project lighting owns its glass copies.
    root.traverse(object=>{
      if(!object.material)return;
      const copy=material=>{
        if(!material.envMap||!material.emissive)return material;
        if(!clones.has(material)){
          const clone=material.clone();clones.set(material,clone);
          (root.userData.materials||(root.userData.materials=[])).push(clone);
        }
        return clones.get(material);
      };
      object.material=Array.isArray(object.material)?object.material.map(copy):copy(object.material);
    });
    state.glass=[...clones.values()].map((material,index)=>({material,lit:clones.size===1||index%3!==0,emissive:material.emissive.clone(),intensity:material.emissiveIntensity}));
    const scale=viewer.p.radius/(Math.hypot(132,122)/2);
    state.spots.forEach(({light,x,z})=>{
      light.position.set(x*scale,5,z*scale);light.target.position.set(x*scale*.2,viewer.p.maxH*.39,z*scale*.2);light.distance=viewer.p.radius*2.9;
    });
  }
  function apply(viewer,time){
    if(!viewer.p||!viewer.projectLightRig)return;
    const night=time==='night',rig=viewer.lighting;
    viewer.scene.background=background(night?'night':'day');viewer.scene.fog=null;viewer.projectGround.visible=false;
    rig.hemisphere.color.setHex(night?0x9fbce9:0xf2f1ed);rig.hemisphere.groundColor.setHex(night?0x172331:0x737b78);rig.hemisphere.intensity=night?.40:.92;
    rig.sun.color.setHex(0xe7f1ff);rig.sun.intensity=night?.26:1.12;rig.sun.shadow.radius=11;rig.sun.shadow.blurSamples=6;
    rig.fill.color.setHex(night?0xffd39a:0xdce3e7);rig.fill.intensity=night?.22:.32;
    viewer.projectLightRig.spots.forEach(({light})=>{light.visible=night;light.intensity=night?2.5:0});
    viewer.projectLightRig.glass.forEach(({material,lit,emissive,intensity})=>{
      material.roughness=.3;material.envMapIntensity=.32;
      if(night){material.emissive.setHex(lit?0xffd39a:0x142337).convertSRGBToLinear();material.emissiveIntensity=.62;}
      else{material.emissive.copy(emissive);material.emissiveIntensity=intensity;}
    });
    viewer.r.toneMappingExposure=night?.9:.99;viewer.r.shadowMap.enabled=true;viewer.r.shadowMap.needsUpdate=true;viewer.dirty=true;
  }
  global.GranProjectLighting={prepare,apply};
})(window);
