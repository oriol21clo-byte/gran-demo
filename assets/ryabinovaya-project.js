/* Рябиновая: approximate reconstruction of the loaded guest-view geometry.
   Dimensions, floors, hidden faces and planting are estimates, not surveyed data. */
(function(global){
 'use strict';if(!global.THREE)return;const T=global.THREE;
 function build(){
  const root=new T.Group(),vpm=new T.Group(),g={vpm},geo=[],materials=[],batches=new Map(),dummy=new T.Object3D();root.add(vpm);
  const mat=(c,o={})=>{const m=new T.MeshStandardMaterial(Object.assign({color:new T.Color(c).convertSRGBToLinear(),roughness:.8},o));materials.push(m);return m};
  const M={body:mat(0x343c41),frame:mat(0x505a60),cap:mat(0xbfc6c7),roof:mat(0x555d60),pave:mat(0xd2d4ce),pink:mat(0xb78a89),lawn:mat(0x899a75),base:mat(0xc5c5ba),trunk:mat(0x716555)};
  const glass=[0x4e5d64,0x596b75,0x6d7c83,0x43525b].map(c=>GranVisual.glass(mat(c,{roughness:.45,metalness:.08})));
  const leaf=[0x728765,0x91a07b,0xa1ac8b].map(c=>mat(c,{flatShading:true}));
  const unit=new T.BoxGeometry(1,1,1);geo.push(unit);
  function box(m,x,y,z,w,h,d,angle=0,shadow=true){let l=batches.get(m);if(!l)batches.set(m,l=[]);l.push([x,y,z,w,h,d,angle,shadow]);}
  function shape(points,round=0){const s=new T.Shape();const n=points.length;
   for(let i=0;i<n;i++){const p=points[i],a=points[(i+n-1)%n],b=points[(i+1)%n];const before=new T.Vector2(a[0]-p[0],a[1]-p[1]).normalize().multiplyScalar(round),after=new T.Vector2(b[0]-p[0],b[1]-p[1]).normalize().multiplyScalar(round);
    const x=p[0]+before.x,z=p[1]+before.y;i?s.lineTo(x,-z):s.moveTo(x,-z);s.quadraticCurveTo(p[0],-p[1],p[0]+after.x,-p[1]-after.y);
   }s.closePath();return s;
  }
  function volume(points,y,h,m,round=0){const G=new T.ExtrudeGeometry(shape(points,round),{depth:h,bevelEnabled:false,curveSegments:10});G.rotateX(-Math.PI/2);geo.push(G);const mesh=new T.Mesh(G,m);mesh.position.y=y;mesh.castShadow=mesh.receiveShadow=true;vpm.add(mesh);return mesh;}
  function polygon(points,y,m){const G=new T.ShapeGeometry(shape(points));G.rotateX(-Math.PI/2);geo.push(G);const mesh=new T.Mesh(G,m);mesh.position.y=y;mesh.receiveShadow=true;vpm.add(mesh);}
  let pathLevel=0;
  function ribbon(points,w,m,y=.1){const curve=new T.CatmullRomCurve3(points.map(([x,z])=>new T.Vector3(x,y,z))),p=curve.getPoints(80),left=[],right=[];
   p.forEach((v,i)=>{const a=p[Math.max(0,i-1)],b=p[Math.min(p.length-1,i+1)],d=new T.Vector2(b.x-a.x,b.z-a.z).normalize();left.push([v.x-d.y*w/2,v.z+d.x*w/2]);right.push([v.x+d.y*w/2,v.z-d.x*w/2]);});const level=y+pathLevel++*.025;
   if(m===M.pink){const borderLeft=[],borderRight=[];p.forEach((v,i)=>{const a=p[Math.max(0,i-1)],b=p[Math.min(p.length-1,i+1)],d=new T.Vector2(b.x-a.x,b.z-a.z).normalize();borderLeft.push([v.x-d.y*(w+.35)/2,v.z+d.x*(w+.35)/2]);borderRight.push([v.x+d.y*(w+.35)/2,v.z-d.x*(w+.35)/2]);});polygon(borderLeft.concat(borderRight.reverse()),level-.012,M.pave);}
   polygon(left.concat(right.reverse()),level,m);
  }
  const site=[[-53,-40],[35,-46],[52,-30],[49,39],[12,46],[-49,34]];
  volume(site,-.8,.8,M.base,2);polygon(site,.025,M.lawn);
  // The source shows a pedestrian park, not the generic road grid of the old project.
  ribbon([[-47,-23],[-29,-29],[-2,-28],[27,-32],[46,-19]],4.5,M.pink);
  ribbon([[-48,27],[-28,22],[-6,33],[23,34],[44,23]],4.5,M.pink);
  ribbon([[-46,-22],[-40,0],[-46,26]],3.5,M.pink);
  ribbon([[45,-19],[44,1],[46,22]],3.5,M.pink);
  ribbon([[-5,33],[0,29],[8,26]],3,M.pave,.12);
  const tower=[[-25,-17],[-9,-17],[-9,3],[-25,3]];
  const wedge=[[-3,-12],[38,1],[9,28]];
  // Estimated ratio 2.7:1 from the loaded view; no absolute height advertised.
  volume(tower,.14,76,M.body,.7);volume(wedge,.14,28,M.body,3.5);
  volume(wedge,28.14,.7,M.roof,3.5);
  // Low connecting lobby and a shared pale entrance apron.
  box(M.pave,-6,.10,1,15,.12,20,0,false);box(M.body,-6,2.7,-3,8,5.4,9);
  box(glass[1],-6,2.8,1.57,6.7,4.5,.12,0,false);
  for(const x of [-9.4,-7.7,-6,-4.3,-2.6])box(M.frame,x,2.8,1.72,.08,4.6,.25,0,false);
  box(M.cap,-6,5.55,2,8.5,.22,2.4);box(M.frame,-6,3.7,1.74,6.9,.09,.25,0,false);
  for(const x of [-6.32,-5.68])box(M.cap,x,1.7,1.86,.045,.6,.055,0,false);
  function facade(points,floors,spacing,y0=1.2,margin=1){
   points.forEach((a,i)=>{const b=points[(i+1)%points.length],dx=b[0]-a[0],dz=b[1]-a[1],L=Math.hypot(dx,dz),n=Math.max(1,Math.floor((L-2*margin)/spacing)),angle=-Math.atan2(dz,dx),nx=dz/L,nz=-dx/L;
    for(let f=0;f<floors;f++)for(let j=0;j<n;j++){
     const t=(margin+(j+.5)*(L-2*margin)/n)/L,cx=a[0]+dx*t,cz=a[1]+dz*t,cy=y0+f*3.3+1.15,pitch=(L-2*margin)/n,ww=pitch-.25,wh=2.25;
     box(glass[(f*3+j+i)%glass.length],cx+nx*.08,cy,cz+nz*.08,ww,wh,.12,angle,false);
     // Physical aluminium jambs, recessed glass, projecting sill and transom.
     for(const side of [-1,1]){
      const sx=cx+dx/L*side*(ww/2+.04),sz=cz+dz/L*side*(ww/2+.04);
      box(M.frame,sx+nx*.16,cy,sz+nz*.16,.085,wh+.16,.28,angle,false);
      box(M.frame,cx+nx*.18,cy+side*(wh/2+.04),cz+nz*.18,ww+.18,.085,.32,angle,false);
     }
     box(M.frame,cx+nx*.2,cy-.32,cz+nz*.2,ww,.045,.16,angle,false);
     box(M.body,cx+nx*.2,cy-1.28,cz+nz*.2,ww+.22,.12,.4,angle,false);
    }
    for(let f=1;f<=floors;f++)box(M.frame,(a[0]+b[0])/2+nx*.12,f*3.3+.25,(a[1]+b[1])/2+nz*.12,L-.3,.14,.2,angle,false);
   });
  }
  facade(tower,22,1.7,1.3,.9);facade(wedge,8,2.4,.7,4);
  // Stepped light crown, parapets and the visible low-building roof feature.
  box(M.cap,-17,76.8,-7,16.5,1.4,20.5);box(M.roof,-17,77.55,-7,14.5,.12,18.5,0,false);
  box(M.cap,-17,79,-8.5,12,2.6,14);box(glass[2],-17,79.1,-1.44,10.6,1.6,.14,0,false);
  box(M.roof,-17,80.5,-8.5,12.3,.4,14.3);
  box(M.cap,14,29.15,6,8,.6,5);box(glass[2],14,29.52,6,7.3,.14,4.3,0,false);
  for(let x=10.4;x<18;x+=1.45)box(M.frame,x,29.63,6,.065,.12,4.5,0,false);
  box(M.frame,14,29.63,6,7.5,.12,.065,0,false);
  for(const [a,b] of wedge.map((a,i)=>[a,wedge[(i+1)%wedge.length]])){
   const dx=b[0]-a[0],dz=b[1]-a[1],L=Math.hypot(dx,dz);box(M.frame,(a[0]+b[0])/2,28.85,(a[1]+b[1])/2,L-7,.45,.22,-Math.atan2(dz,dx),false);
  }
  // Planting is a restrained interpretation of the visible green perimeter.
  const crown=new T.IcosahedronGeometry(1,2);geo.push(crown);const foliage=[];
  const trees=[[-45,-34],[-32,-36],[-15,-37],[4,-36],[23,-38],[40,-30],[-45,-9],[-43,9],[-42,31],[-26,32],[-13,38],[5,39],[24,39],[40,30],[45,9],[43,-5]];
  trees.forEach(([x,z],i)=>{box(M.trunk,x,1.1,z,.22,2.2,.22);foliage.push([x,3.2+(i%3)*.2,z,1.8+(i%2)*.3,2.2,1.8,0,true]);});
  function instances(G,m,list){const mesh=new T.InstancedMesh(G,m,list.length);list.forEach((a,i)=>{dummy.position.set(a[0],a[1],a[2]);dummy.rotation.set(0,a[6],0);dummy.scale.set(a[3],a[4],a[5]);dummy.updateMatrix();mesh.setMatrixAt(i,dummy.matrix);});mesh.castShadow=list.some(a=>a[7]);mesh.receiveShadow=true;vpm.add(mesh);}
  batches.forEach((list,m)=>instances(unit,m,list));leaf.forEach((m,i)=>instances(crown,m,foliage.filter((_,j)=>j%3===i)));
  root.userData.geo=geo;root.userData.materials=materials;root.userData.reference={name:'Рябиновая',estimated:true,source:'guest view, 1/3 models loaded',mainMasses:2,wedge:true,heightRatio:76/28};
  return{root,g,radius:Math.max(Math.hypot(105,92)/2,81*.95),maxH:81};
 }
 global.GranRyabinovaya={build};
})(window);
