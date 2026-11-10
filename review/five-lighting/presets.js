// Review-only: five paired palettes, same geometry/camera/renderer.
function installFiveLighting(){
 const v=modalViewer,T=THREE,base=window.setReviewLight;
 const presets=[
  {name:'Серебро и графит',day:['#dce3e8','#f6f7f8','#ffffff'],night:['#101a29','#344658','#52657a'],sun:0xe7f1ff,daySun:1.12,nightSun:.26,ambient:.38,glow:0xffd39a,power:1.0},
  {name:'Небо и индиго',day:['#98b6ce','#e7eef2','#ffffff'],night:['#091429','#243c61','#435a80'],sun:0xb9d4ff,daySun:1.2,nightSun:.3,ambient:.36,glow:0xffc377,power:1.12},
  {name:'Тёплый камень',day:['#d6cec1','#f4eee3','#fff7e8'],night:['#211e25','#45404a','#746451'],sun:0xffdcb0,daySun:1.02,nightSun:.2,ambient:.4,glow:0xffb65f,power:1.08},
  {name:'Скандинавский свет',day:['#c2d3d8','#edf3f2','#fbffff'],night:['#12262e','#34515a','#658087'],sun:0xd5f3f7,daySun:.84,nightSun:.24,ambient:.48,glow:0xffe1ad,power:.85},
  {name:'Архитектурная галерея',day:['#bbc4cf','#edf0f5','#ffffff'],night:['#080d17','#192432','#364459'],sun:0xd1e0ff,daySun:1.4,nightSun:.18,ambient:.27,glow:0xffce87,power:1.25}
 ];
 const textures=new Map();
 function background(p,mode){const key=p.name+mode;if(textures.has(key))return textures.get(key);const c=document.createElement('canvas');c.width=256;c.height=512;const x=c.getContext('2d'),colors=p[mode],g=x.createLinearGradient(0,0,0,512);g.addColorStop(0,colors[0]);g.addColorStop(1,colors[1]);x.fillStyle=g;x.fillRect(0,0,256,512);const h=x.createRadialGradient(128,265,5,128,265,260);h.addColorStop(0,colors[2]+(mode==='day'?'66':'33'));h.addColorStop(1,colors[2]+'00');x.fillStyle=h;x.fillRect(0,0,256,512);const texture=new T.CanvasTexture(c);texture.encoding=T.sRGBEncoding;textures.set(key,texture);return texture;}
 window.setFiveLighting=(index,mode)=>{
  base(mode);const p=presets[index],night=mode==='night';
  v.scene.background=background(p,mode);v.scene.fog=null;v.projectGround.visible=false;
  v.lighting.sun.color.setHex(p.sun);v.lighting.sun.intensity=night?p.nightSun:p.daySun;
  if(night){v.lighting.hemisphere.intensity=p.ambient;v.lighting.fill.color.setHex(p.glow);v.lighting.fill.intensity=index===4?.36:.26;
   const seen=new Set();let i=0;v.p.root.traverse(o=>{for(const m of [].concat(o.material||[])){if(seen.has(m)||!m.envMap||!m.emissive)continue;seen.add(m);const lit=i++%3!==0;m.emissive.setHex(lit?p.glow:0x142337).convertSRGBToLinear();m.emissiveIntensity=lit?p.power:.02;}});
  }else{v.lighting.hemisphere.intensity=index===3?1:.78;v.lighting.fill.intensity=.25;}
  v.r.toneMappingExposure=night?.91:.94;v.r.shadowMap.needsUpdate=true;v.dirty=true;v.r.render(v.scene,v.cam);
 };
 window.setFiveLighting(0,'day');
}
