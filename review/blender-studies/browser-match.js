// A browser counterpart, not a claim of parity with Cycles path tracing.
function installBrowserStudy(){
 const v=modalViewer,T=THREE,base=window.setReviewLight;
 v.p.root.traverse(o=>{if(!o.isMesh||!o.material?.envMap)return;
  const m=o.material=o.material.clone();m.roughness=.22;m.metalness=.2;m.envMapIntensity=.55;m.userData.studyGlass=true;
  if(o.isInstancedMesh){const values=new Float32Array(o.count);for(let i=0;i<o.count;i++){const n=(i*1664525+1013904223)%100;values[i]=n<62?0:n<87?1:.6;}o.geometry=o.geometry.clone();o.geometry.setAttribute('studyOccupancy',new T.InstancedBufferAttribute(values,1));
   m.onBeforeCompile=s=>{s.vertexShader='attribute float studyOccupancy; varying float vStudyOccupancy;\n'+s.vertexShader;s.vertexShader=s.vertexShader.replace('#include <begin_vertex>','#include <begin_vertex>\nvStudyOccupancy=studyOccupancy;');s.fragmentShader='varying float vStudyOccupancy;\n'+s.fragmentShader;s.fragmentShader=s.fragmentShader.replace('#include <emissivemap_fragment>','#include <emissivemap_fragment>\ntotalEmissiveRadiance *= vStudyOccupancy;');};m.customProgramCacheKey=()=> 'gran-window-occupancy-v1';
  }
 });
 window.setBrowserStudy=(mode)=>{
  base(mode);v.scene.fog=null;v.projectGround.visible=false;
  const c=document.createElement('canvas');c.width=16;c.height=256;const x=c.getContext('2d'),g=x.createLinearGradient(0,0,0,256);g.addColorStop(0,mode==='day'?'#c7d5df':'#0d1727');g.addColorStop(1,mode==='day'?'#edf0f2':'#34465c');x.fillStyle=g;x.fillRect(0,0,16,256);
  const old=v.scene.background,tex=new T.CanvasTexture(c);tex.encoding=T.sRGBEncoding;v.scene.background=tex;if(old?.isTexture)old.dispose();
  v.p.root.traverse(o=>{const m=o.material;if(!m?.userData.studyGlass)return;m.emissive.setHex(0xffce96).convertSRGBToLinear();m.emissiveIntensity=mode==='night'?1.4:0;});
  v.cam.zoom=1;v.cam.position.set(-172,145,-190);v.ctl.target.set(0,35,0);v.cam.lookAt(0,35,0);v.cam.left=-102.5;v.cam.right=102.5;v.cam.top=76.875;v.cam.bottom=-76.875;v.cam.updateProjectionMatrix();v.r.setSize(1200,900,false);v.r.shadowMap.needsUpdate=true;v.r.render(v.scene,v.cam);v.dirty=false;
 };
 window.setBrowserStudy('day');
}
