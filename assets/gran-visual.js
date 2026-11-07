/* Approved styles: NPM 3 / VPM 5 / IFC 1. Shared by hero and Viewer. */
(function (global) {
  'use strict';
  if (!global.THREE) return;
  const T=global.THREE;
  const PRESETS={
    npm:{background:0xeee7dc,sky:0xfff4e6,ground:0xa99f8f,ambient:.9,sun:0xffe8c7,key:1.05,fill:0xdde8f4,fillPower:.28,exposure:.98,shadows:true},
    vpm:{background:0xb9bdbd,sky:0xf2f1ed,ground:0x737b78,ambient:.78,sun:0xfff5e4,key:1.12,fill:0xdce3e7,fillPower:.25,exposure:.94,shadows:true},
    cim:{background:0xe8edf2,sky:0xffffff,ground:0xb7c3cf,ambient:1.02,sun:0xf3f6fc,key:.72,fill:0xddeaff,fillPower:.25,exposure:1.06,shadows:false}
  };
  let studio;
  function environment(){
    if(studio)return studio;
    const faces=Array.from({length:6},(_,i)=>{const c=document.createElement('canvas');c.width=c.height=64;const x=c.getContext('2d');const g=x.createLinearGradient(0,0,0,64);g.addColorStop(0,'#eff4fa');g.addColorStop(.48,i%2?'#c3d1df':'#e2eaf3');g.addColorStop(1,'#718293');x.fillStyle=g;x.fillRect(0,0,64,64);x.fillStyle='rgba(255,255,255,.55)';x.fillRect(i%2?12:38,7,11,32);return c});
    studio=new T.CubeTexture(faces);studio.encoding=T.sRGBEncoding;studio.needsUpdate=true;return studio;
  }
  function glass(material){material.roughness=.42;material.metalness=.08;material.envMap=environment();material.envMapIntensity=.35;return material;}
  function create(scene,renderer,compact){
    renderer.outputEncoding=T.sRGBEncoding;renderer.toneMapping=T.ACESFilmicToneMapping;
    renderer.shadowMap.type=T.VSMShadowMap;renderer.shadowMap.autoUpdate=false;
    const hemisphere=new T.HemisphereLight(),sun=new T.DirectionalLight(),fill=new T.DirectionalLight();
    sun.castShadow=true;sun.shadow.mapSize.set(compact?1024:2048,compact?1024:2048);sun.shadow.bias=-.00012;sun.shadow.normalBias=.065;sun.shadow.radius=16;sun.shadow.blurSamples=8;
    scene.add(hemisphere,sun,sun.target,fill,fill.target);
    const rig={scene,renderer,hemisphere,sun,fill,compact,mode:'vpm'};apply(rig,'vpm');return rig;
  }
  function apply(rig,mode){
    const p=PRESETS[mode]||PRESETS.vpm;rig.mode=mode;
    rig.scene.background=new T.Color(p.background);if(rig.scene.fog)rig.scene.fog.color.set(p.background);
    rig.hemisphere.color.set(p.sky);rig.hemisphere.groundColor.set(p.ground);rig.hemisphere.intensity=p.ambient;
    rig.sun.color.set(p.sun);rig.sun.intensity=p.key;rig.fill.color.set(p.fill);rig.fill.intensity=p.fillPower;
    rig.renderer.toneMappingExposure=p.exposure;rig.renderer.shadowMap.enabled=p.shadows;rig.renderer.shadowMap.needsUpdate=true;
  }
  function frame(rig,radius,target){
    rig.sun.position.set(-radius*1.1,radius*3.2,radius*.85);rig.sun.target.position.copy(target);
    rig.fill.position.set(radius*1.3,radius*.85,-radius);rig.fill.target.position.copy(target);
    Object.assign(rig.sun.shadow.camera,{left:-radius*1.5,right:radius*1.5,top:radius*1.5,bottom:-radius*1.5,near:.5,far:radius*7});rig.sun.shadow.camera.updateProjectionMatrix();rig.renderer.shadowMap.needsUpdate=true;
  }
  // Coplanar road intersections must not overlap: preserves the original footprint.
  function rectangles(rects,y,material,cutouts=[]){
    const all=rects.concat(cutouts);
    const xs=[...new Set(all.flatMap(([x,z,w,d])=>[x-w/2,x+w/2]))].sort((a,b)=>a-b),zs=[...new Set(all.flatMap(([x,z,w,d])=>[z-d/2,z+d/2]))].sort((a,b)=>a-b),p=[];
    for(let i=0;i<xs.length-1;i++)for(let j=0;j<zs.length-1;j++){
      const x0=xs[i],x1=xs[i+1],z0=zs[j],z1=zs[j+1],cx=(x0+x1)/2,cz=(z0+z1)/2;
      if(!rects.some(([x,z,w,d])=>Math.abs(cx-x)<=w/2&&Math.abs(cz-z)<=d/2))continue;
      if(cutouts.some(([x,z,w,d])=>Math.abs(cx-x)<w/2&&Math.abs(cz-z)<d/2))continue;
      p.push(x0,y,z0,x0,y,z1,x1,y,z1,x0,y,z0,x1,y,z1,x1,y,z0);
    }
    const g=new T.BufferGeometry();g.setAttribute('position',new T.Float32BufferAttribute(p,3));g.computeVertexNormals();const m=new T.Mesh(g,material);m.receiveShadow=true;return m;
  }
  // Orthographic projection matches the architectural presentation used for selection.
  // Recompute the frustum when zooming/resizing; OrbitControls camera.zoom stays intact.
  function project(camera,aspect,distance){
    camera.aspect=aspect;
    if(camera.isOrthographicCamera){const half=Math.tan(16*Math.PI/180)*distance;camera.left=-half*aspect;camera.right=half*aspect;camera.top=half;camera.bottom=-half;}
    camera.updateProjectionMatrix();
  }
  global.GranVisual={presets:PRESETS,create,apply,frame,glass,rectangles,project};
})(window);
