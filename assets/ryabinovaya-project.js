/* Рябиновая: approximate reconstruction of the loaded guest-view geometry.
   Dimensions, floors, hidden faces and planting are estimates, not surveyed data. */
(function(global){
 'use strict';if(!global.THREE)return;const T=global.THREE;
 function build(){
  const root=new T.Group(),vpm=new T.Group(),g={vpm},geo=[],materials=[],batches=new Map(),dummy=new T.Object3D();root.add(vpm);
  const mat=(c,o={})=>{const m=new T.MeshStandardMaterial(Object.assign({color:new T.Color(c).convertSRGBToLinear(),roughness:.8},o));materials.push(m);return m};
  const M={body:mat(0x343c41),frame:mat(0x505a60),cap:mat(0xbfc6c7),roof:mat(0x555d60),pave:mat(0xd2d4ce),pink:mat(0xb78a89),lawn:mat(0x899a75),base:mat(0xc5c5ba),trunk:mat(0x716555)};
  const glass=[0x4e5d64,0x596b75,0x6d7c83,0x43525b].map(c=>GranVisual.glass(mat(c,{roughness:.45,metalness:.08})));
  const paver=[0xad827d,0xb48a83,0xb99188].map(c=>mat(c,{roughness:1}));
  const leaf=[0x728765,0x91a07b,0xa1ac8b].map(c=>mat(c,{flatShading:true}));
  const unit=new T.BoxGeometry(1,1,1);geo.push(unit);
  function box(m,x,y,z,w,h,d,angle=0,shadow=true){let l=batches.get(m);if(!l)batches.set(m,l=[]);l.push([x,y,z,w,h,d,angle,shadow]);}
  function shape(points,round=0){const s=new T.Shape();const n=points.length;
   for(let i=0;i<n;i++){const p=points[i],a=points[(i+n-1)%n],b=points[(i+1)%n];const before=new T.Vector2(a[0]-p[0],a[1]-p[1]).normalize().multiplyScalar(round),after=new T.Vector2(b[0]-p[0],b[1]-p[1]).normalize().multiplyScalar(round);
    const x=p[0]+before.x,z=p[1]+before.y;i?s.lineTo(x,-z):s.moveTo(x,-z);s.quadraticCurveTo(p[0],-p[1],p[0]+after.x,-p[1]-after.y);
   }s.closePath();return s;
  }
  function volume(points,y,h,m,round=0,tilt=0,whole=false,taper=false){const G=new T.ExtrudeGeometry(shape(points,round),{depth:h,bevelEnabled:false,curveSegments:10});G.rotateX(-Math.PI/2);
   if(tilt||taper){const pos=G.attributes.position;for(let i=0;i<pos.count;i++){const x=pos.getX(i),z=pos.getZ(i),top=pos.getY(i)>h-.001;if(tilt&&(whole||top))pos.setY(i,pos.getY(i)+tilt*(x+3));if(taper&&top){pos.setX(i,(x+17)*.93-17);pos.setZ(i,(z+7)*.93-7);}}pos.needsUpdate=true;G.computeVertexNormals();}
   geo.push(G);const mesh=new T.Mesh(G,m);mesh.position.y=y;mesh.castShadow=mesh.receiveShadow=true;vpm.add(mesh);return mesh;}
  function polygon(points,y,m){const G=new T.ShapeGeometry(shape(points));G.rotateX(-Math.PI/2);geo.push(G);const mesh=new T.Mesh(G,m);mesh.position.y=y;mesh.receiveShadow=true;vpm.add(mesh);}
  let pathLevel=0;
  function ribbon(points,w,m,y=.1){const curve=new T.CatmullRomCurve3(points.map(([x,z])=>new T.Vector3(x,y,z))),p=curve.getPoints(80),left=[],right=[];
   p.forEach((v,i)=>{const a=p[Math.max(0,i-1)],b=p[Math.min(p.length-1,i+1)],d=new T.Vector2(b.x-a.x,b.z-a.z).normalize();left.push([v.x-d.y*w/2,v.z+d.x*w/2]);right.push([v.x+d.y*w/2,v.z-d.x*w/2]);});const level=y+pathLevel++*.025;
   if(m===M.pink){const borderLeft=[],borderRight=[];p.forEach((v,i)=>{const a=p[Math.max(0,i-1)],b=p[Math.min(p.length-1,i+1)],d=new T.Vector2(b.x-a.x,b.z-a.z).normalize();borderLeft.push([v.x-d.y*(w+.35)/2,v.z+d.x*(w+.35)/2]);borderRight.push([v.x+d.y*(w+.35)/2,v.z-d.x*(w+.35)/2]);});polygon(borderLeft.concat(borderRight.reverse()),level-.012,M.pave);}
   polygon(left.concat(right.reverse()),level,m);
   if(m===M.pink){for(let i=0;i<p.length-1;i++){const a=p[i],b=p[i+1],dx=b.x-a.x,dz=b.z-a.z,L=Math.hypot(dx,dz),count=Math.max(1,Math.ceil(L/.65)),rows=Math.max(1,Math.floor((w-.22)/.48)),cw=(w-.22)/rows;
    for(let j=0;j<count;j++)for(let k=0;k<rows;k++){const t=(j+.5)/count,off=(k+.5-rows/2)*cw;box(paver[(i+j+k)%3],a.x+dx*t-dz/L*off,level+.016,a.z+dz*t+dx/L*off,L/count-.028,.024,cw-.023,-Math.atan2(dz,dx),false);}
   }}
  }
  const site=[[-53,-40],[35,-46],[52,-30],[49,39],[12,46],[-49,34]];
  volume(site,-.8,.8,M.base,2);polygon(site,.025,M.lawn);
  // The source shows a pedestrian park, not the generic road grid of the old project.
  ribbon([[-47,-23],[-29,-29],[-2,-28],[27,-32],[46,-19]],4.5,M.pink);
  ribbon([[-48,27],[-28,22],[-6,33],[23,34],[44,23]],4.5,M.pink);
  ribbon([[-46,-22],[-40,0],[-46,26]],3.5,M.pink);
  ribbon([[45,-19],[44,1],[46,22]],3.5,M.pink);
  ribbon([[-5,33],[0,29],[8,26]],3,M.pave,.12);
  // Paved entrance courts with planted islands, rather than an undifferentiated lawn.
  polygon([[-41,7],[-27,5],[-19,12],[-24,23],[-40,22]],.24,M.pave);
  polygon([[23,31],[40,22],[47,27],[42,39],[28,40]],.24,M.pave);
  const islands=[{x:-31,z:14,w:8,d:5},{x:35,z:31,w:7,d:4}];
  islands.forEach(({x,z,w,d})=>{const p=[[x-w/2,z-d/2],[x+w/2,z-d/2],[x+w/2,z+d/2],[x-w/2,z+d/2]];volume(p,.24,.28,M.cap,.8);volume([[x-w/2+.2,z-d/2+.2],[x+w/2-.2,z-d/2+.2],[x+w/2-.2,z+d/2-.2],[x-w/2+.2,z+d/2-.2]],.52,.03,M.lawn,.6);});
  const tower=[[-25,-17],[-9,-17],[-9,3],[-25,3]];
  const wedge=[[-3,-12],[38,1],[9,28]];
  const towerH=56.1,lowH=19.8,roofY=x=>lowH+.49+.09*(x+3);
  volume(tower,.14,towerH,M.body,1.8,0,false,true);
  volume(wedge,.14,lowH,M.body,3.5,.09);volume(wedge,lowH+.14,.35,M.roof,3.5,.09,true);
  // Supplied photos supersede the earlier incorrect browser-agent description.
  // A ground-level glazed connecting volume with a broad, gently sloped grey roof.
  const bridgeGlass=GranVisual.glass(mat(0x9aa8b5,{roughness:.32,metalness:.08}));
  const roofHeight=(x,z)=>3.6+.035*(x+9.3)+.01*(z+11);
  const facadeCurve=new T.CatmullRomCurve3([[-9.35,3],[-6.6,4.5],[-3.7,5.6],[.2,7.6],[4.2,11.8]].map(([x,z])=>new T.Vector3(x,0,z)));
  const front=facadeCurve.getPoints(40).map(p=>[p.x,p.z]);
  const connectorPlan=[[-9.45,-11],[-2.4,-11],[4.2,11.8],...front.slice(0,-1).reverse()];
  volume(connectorPlan,.10,.12,M.pave,.16);
  const roofG=new T.ExtrudeGeometry(shape(connectorPlan,.16),{depth:.18,bevelEnabled:false,curveSegments:8});roofG.rotateX(-Math.PI/2);
  const rp=roofG.attributes.position;for(let i=0;i<rp.count;i++)rp.setY(i,rp.getY(i)+roofHeight(rp.getX(i),rp.getZ(i)));rp.needsUpdate=true;roofG.computeVertexNormals();geo.push(roofG);
  const connectorRoof=new T.Mesh(roofG,M.roof);connectorRoof.castShadow=connectorRoof.receiveShadow=true;vpm.add(connectorRoof);
  function glazedWall(points){
   for(let i=0;i<points.length-1;i++){
    const a=points[i],b=points[i+1],dx=b[0]-a[0],dz=b[1]-a[1],L=Math.hypot(dx,dz),n=Math.max(1,Math.round(L/1.05)),angle=-Math.atan2(dz,dx);
    for(let k=0;k<n;k++){const t=(k+.5)/n,x=a[0]+dx*t,z=a[1]+dz*t,h=roofHeight(x,z)-.34;box(bridgeGlass,x,.24+h/2,z,L/n-.055,h,.10,angle,false);}
    for(let k=0;k<=n;k++){const t=k/n,x=a[0]+dx*t,z=a[1]+dz*t,h=roofHeight(x,z)-.22;box(M.frame,x,.22+h/2,z,.055,h,.18,angle,false);}
    beam(M.roof,[a[0],roofHeight(...a)+.05,a[1]],[b[0],roofHeight(...b)+.05,b[1]],.21,.18);
    beam(M.cap,[a[0],.23,a[1]],[b[0],.23,b[1]],.15,.18);
   }
  }
  // Glazed bays follow the curved courtyard elevation; both ends enter the buildings.
  glazedWall(facadeCurve.getSpacedPoints(14).map(p=>[p.x,p.z]));
  glazedWall([[-9.45,-11],[-2.4,-11]]);
  ribbon([[-6,14],[-8,22],[-6,32]],3.2,M.pave,.2);
  function entrance(x,z,angle){const nx=Math.sin(angle),nz=Math.cos(angle),tx=Math.cos(angle),tz=-Math.sin(angle);
   box(bridgeGlass,x,2.1,z,3.6,3,.10,angle,false);
   for(const side of [-1,0,1])box(M.frame,x+tx*side*1.8,2.1,z+tz*side*1.8,.07,3.15,.22,angle,false);
   box(M.cap,x,3.76,z,4.4,.16,1.6,angle,false);
   for(let i=0;i<3;i++)box(M.pave,x+nx*(.45+i*.4),.16*(3-i),z+nz*(.45+i*.4),4.7,.32*(3-i),.5,angle,false);
   for(const side of [-1,1])box(M.cap,x+tx*side*.23+nx*.12,1.8,z+tz*side*.23+nz*.12,.04,.5,.045,angle,false);
  }
  entrance(-17,3.18,0);entrance(23.55,14.55,-Math.atan2(27,-29));
  function facade(points,floors,spacing,y0=1.2,margin=1){
   points.forEach((a,i)=>{const b=points[(i+1)%points.length],dx=b[0]-a[0],dz=b[1]-a[1],L=Math.hypot(dx,dz),n=Math.max(1,Math.floor((L-2*margin)/spacing)),angle=-Math.atan2(dz,dx),nx=dz/L,nz=-dx/L;
    for(let f=0;f<floors;f++)for(let j=0;j<n;j++){
     const t=(margin+(j+.5)*(L-2*margin)/n)/L;let cx=a[0]+dx*t,cz=a[1]+dz*t;const cy=y0+f*3.3+1.15,scale=points===tower?1-.07*cy/towerH:1,pitch=(L-2*margin)/n*scale,ww=pitch-.25,wh=2.25;
     if(points===tower){cx=(cx+17)*scale-17;cz=(cz+7)*scale-7;}
     box(f===0?bridgeGlass:glass[(f*3+j+i)%glass.length],cx+nx*.08,cy,cz+nz*.08,ww,wh,.12,angle,false);
     // Physical aluminium jambs, recessed glass, projecting sill and transom.
     for(const side of [-1,1]){
      const sx=cx+dx/L*side*(ww/2+.04),sz=cz+dz/L*side*(ww/2+.04);
      box(M.frame,sx+nx*.16,cy,sz+nz*.16,.085,wh+.16,.28,angle,false);
      box(M.frame,cx+nx*.18,cy+side*(wh/2+.04),cz+nz*.18,ww+.18,.085,.32,angle,false);
     }
     box(M.frame,cx+nx*.2,cy-.32,cz+nz*.2,ww,.045,.16,angle,false);
     box(M.body,cx+nx*.2,cy-1.28,cz+nz*.2,ww+.22,.12,.4,angle,false);
    }
    for(let f=1;f<=floors;f++){const scale=points===tower?1-.07*(f*3.3)/towerH:1;box(M.frame,((a[0]+b[0])/2+17)*scale-17+nx*.12,f*3.3+.25,((a[1]+b[1])/2+7)*scale-7+nz*.12,L*scale-.3,.14,.2,angle,false);}
   });
  }
  facade(tower,17,1.7,.6,1.9);facade(wedge,6,2.4,.6,4);
  // Stepped light crown, parapets and the visible low-building roof feature.
  // Layered crown with glazing, rather than the previous solid white cap.
  box(M.cap,-17,towerH+.6,-7,15.5,.65,19.2);box(M.roof,-17,towerH+1,-7,14.8,.12,18.5,0,false);
  box(glass[2],-17,towerH+2.2,-8,12,2.4,14,0,false);box(M.cap,-17,towerH+3.5,-8,12.8,.3,14.8);
  for(const x of [-22.7,-20.8,-18.9,-17,-15.1,-13.2,-11.3])box(M.frame,x,towerH+2.2,-.92,.07,2.4,.13,0,false);
  box(M.roof,-17,towerH+4.5,-9,9.3,1.7,10);box(M.cap,-17,towerH+5.4,-9,9.8,.18,10.6);
  const skylightY=roofY(14);
  box(M.cap,14,skylightY+.3,6,8,.6,5);box(glass[2],14,skylightY+.67,6,7.3,.14,4.3,0,false);
  for(let x=10.4;x<18;x+=1.45)box(M.frame,x,skylightY+.78,6,.065,.12,4.5,0,false);
  box(M.frame,14,skylightY+.78,6,7.5,.12,.065,0,false);
  function beam(m,a,b,w,h){const va=new T.Vector3(...a),vb=new T.Vector3(...b),v=vb.clone().sub(va),G=new T.BoxGeometry(v.length(),h,w);geo.push(G);const o=new T.Mesh(G,m);o.position.copy(va.add(vb).multiplyScalar(.5));o.quaternion.setFromUnitVectors(new T.Vector3(1,0,0),v.normalize());o.castShadow=o.receiveShadow=true;vpm.add(o);}
  for(const [a,b] of wedge.map((a,i)=>[a,wedge[(i+1)%wedge.length]])){
   const dx=b[0]-a[0],dz=b[1]-a[1],L=Math.hypot(dx,dz),aa=[a[0]+dx/L*3.6,a[1]+dz/L*3.6],bb=[b[0]-dx/L*3.6,b[1]-dz/L*3.6];beam(M.frame,[aa[0],roofY(aa[0])+.15,aa[1]],[bb[0],roofY(bb[0])+.15,bb[1]],.22,.3);
  }
  // Planting is a restrained interpretation of the visible green perimeter.
  const crown=new T.IcosahedronGeometry(1,2);geo.push(crown);const foliage=[];
  const trees=[[-31,14],[35,31],[-45,-34],[-32,-36],[-15,-37],[4,-36],[23,-38],[40,-30],[-45,-9],[-43,9],[-42,31],[-26,32],[-13,38],[5,39],[24,39],[40,30],[45,9],[43,-5]];
  trees.forEach(([x,z],i)=>{box(M.trunk,x,1.1,z,.22,2.2,.22);foliage.push([x,3.2+(i%3)*.2,z,1.8+(i%2)*.3,2.2,1.8,0,true]);});
  function instances(G,m,list){const mesh=new T.InstancedMesh(G,m,list.length);list.forEach((a,i)=>{dummy.position.set(a[0],a[1],a[2]);dummy.rotation.set(0,a[6],0);dummy.scale.set(a[3],a[4],a[5]);dummy.updateMatrix();mesh.setMatrixAt(i,dummy.matrix);});mesh.castShadow=list.some(a=>a[7]);mesh.receiveShadow=true;vpm.add(mesh);}
  batches.forEach((list,m)=>instances(unit,m,list));leaf.forEach((m,i)=>instances(crown,m,foliage.filter((_,j)=>j%3===i)));
  root.userData.geo=geo;root.userData.materials=materials;root.userData.reference={name:'Рябиновая',estimated:true,source:'user supplied photos for connector; other dimensions estimated',mainMasses:2,wedge:true,heightRatio:towerH/lowH,connector:{type:'ground-glazed',base:.1,roofMin:3.6,roofMax:4.3,curvedFront:true,roofOpaque:true},slopedRoof:true,plantedIslands:2,entranceStairs:true,paverGeometry:true};
  return{root,g,radius:Math.max(Math.hypot(105,92)/2,(towerH+5.6)*.95),maxH:towerH+5.6};
 }
 global.GranRyabinovaya={build};
})(window);
