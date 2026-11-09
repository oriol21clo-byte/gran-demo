/* Project 2: detailed reconstruction from the seven supplied views.
   Geometry and landscape positions are estimates; no survey dimensions supplied. */
(function(global){
 'use strict';if(!global.THREE)return;const T=global.THREE;
 function build(){
  const root=new T.Group(),vpm=new T.Group(),g={vpm},geo=[],materials=[],batches=new Map(),dummy=new T.Object3D();root.add(vpm);
  const color=c=>new T.Color(c).convertSRGBToLinear();
  const material=(c,o={})=>{const m=new T.MeshStandardMaterial(Object.assign({color:color(c),roughness:.78,metalness:0},o));materials.push(m);return m};
  function texture(kind){const c=document.createElement('canvas');c.width=256;c.height=128;const x=c.getContext('2d');if(!x)return null;
   x.fillStyle=kind==='brick'?'#3d2e28':'#b8bfbd';x.fillRect(0,0,256,128);
   for(let row=0;row<8;row++)for(let col=-1;col<8;col++){const ox=col*48+(row%2)*24,oy=row*16;
    x.fillStyle=kind==='brick'?['#674333','#6e4838','#614030','#754b37'][(row+col+8)%4]:['#c3c8c5','#ced1cb','#c8cdc9'][(row+col+8)%3];x.fillRect(ox+1,oy+1,46,14);
   }
   const tex=new T.CanvasTexture(c);tex.wrapS=tex.wrapT=T.RepeatWrapping;tex.encoding=T.sRGBEncoding;tex.anisotropy=4;return tex;
  }
  const M={white:material(0xe8e8df),edge:material(0xf2f0e7),brick:material(0xffffff,{map:texture('brick'),roughness:.94}),brown:material(0x583a2e),bronze:material(0x614333),frame:material(0x3a4448),screen:material(0x525e64),roof:material(0xbfc3c0),pave:material(0xffffff,{map:texture('pave'),roughness:1}),curb:material(0x7c654c),soil:material(0x687c57),wood:material(0xaf9272),steel:material(0x52605f),light:material(0xf1f0df),trunk:material(0x73624f)};
  const glass=[0x99a9aa,0x7f949b,0xb4bdb5,0x879b82,0xa0ae87,0x647b87].map(c=>GranVisual.glass(material(c,{roughness:.32,metalness:.08})));
  const plants=[0x6f895c,0x8ea27f,0xb4c0ad,0xa79461,0x96736a,0xa35142,0xc1b582,0xabc0a3].map(c=>material(c,{roughness:1,flatShading:true}));
  const unit=new T.BoxGeometry(1,1,1),ball=new T.IcosahedronGeometry(1,2),shrub=new T.IcosahedronGeometry(1,1),cylinder=new T.CylinderGeometry(1,1,1,8),cone=new T.ConeGeometry(1,1,6);geo.push(unit,ball,shrub,cylinder,cone);
  function stamp(G,m,x,y,z,sx,sy,sz,ry=0,q=null){let b=batches.get(G.uuid+':'+m.uuid);if(!b)batches.set(G.uuid+':'+m.uuid,b={G,m,list:[]});dummy.position.set(x,y,z);dummy.scale.set(sx,sy,sz);dummy.rotation.set(0,ry,0);if(q)dummy.quaternion.copy(q);dummy.updateMatrix();b.list.push(dummy.matrix.clone());}
  const box=(m,x,y,z,w,h,d,a=0)=>stamp(unit,m,x,y,z,w,h,d,a);
  function branch(a,b,r){const va=new T.Vector3(...a),vb=new T.Vector3(...b),v=vb.clone().sub(va),mid=va.add(vb).multiplyScalar(.5),q=new T.Quaternion().setFromUnitVectors(new T.Vector3(0,1,0),v.clone().normalize());stamp(cylinder,M.trunk,mid.x,mid.y,mid.z,r,v.length(),r,0,q);}
  function shape(p,round=0){const s=new T.Shape();p.forEach(([x,z],i)=>{const a=p[(i+p.length-1)%p.length],b=p[(i+1)%p.length],pa=new T.Vector2(a[0]-x,a[1]-z).normalize().multiplyScalar(round),pb=new T.Vector2(b[0]-x,b[1]-z).normalize().multiplyScalar(round);i?s.lineTo(x+pa.x,-z-pa.y):s.moveTo(x+pa.x,-z-pa.y);s.quadraticCurveTo(x,-z,x+pb.x,-z-pb.y)});s.closePath();return s;}
  function solid(p,y,h,m,round=0,topSlope=0){const G=new T.ExtrudeGeometry(shape(p,round),{depth:h,bevelEnabled:false,curveSegments:8});G.rotateX(-Math.PI/2);const a=G.attributes.position,uv=G.attributes.uv;
   if(topSlope)for(let i=0;i<a.count;i++)if(a.getY(i)>h-.001)a.setY(i,h-Math.max(0,a.getZ(i))*topSlope);
   if(m.map)for(let i=0;i<uv.count;i++)uv.setXY(i,a.getX(i)/2.4+a.getZ(i)/2.4,a.getY(i)/1.2);G.computeVertexNormals();geo.push(G);const o=new T.Mesh(G,m);o.position.y=y;o.castShadow=o.receiveShadow=true;vpm.add(o);return o;
  }
  function polygon(p,y,m){const G=new T.ShapeGeometry(shape(p));G.rotateX(-Math.PI/2);const a=G.attributes.position,uv=G.attributes.uv;for(let i=0;i<uv.count;i++)uv.setXY(i,a.getX(i)/2.4,a.getZ(i)/1.2);geo.push(G);const o=new T.Mesh(G,m);o.position.y=y;o.receiveShadow=true;vpm.add(o);}
  function brickBox(x,y,z,w,h,d){const G=new T.BoxGeometry(w,h,d),uv=G.attributes.uv;for(let f=0;f<6;f++){const uw=f<2?d:w,vh=f===2||f===3?d:h;for(let k=0;k<4;k++){const i=f*4+k;uv.setXY(i,uv.getX(i)*uw/2.4,uv.getY(i)*vh/1.2)}}geo.push(G);const o=new T.Mesh(G,M.brick);o.position.set(x,y,z);o.castShadow=o.receiveShadow=true;vpm.add(o);}
  const site=[[-31,-27],[27,-27],[32,20],[20,30],[-28,26]];
  solid(site,-.8,.8,M.roof,.5);polygon(site,.025,M.pave);
  const brown={x:7,z:-.5,w:14,d:27,f:24,y0:6.2},whitePlan=[[-14,-12],[-.15,-12],[-.15,15],[-9,12],[-14,8]],FH=3.15,whiteFloors=19,whiteTop=66.05,brownTop=81.8;
  const podium=[[-17,-18],[18,-18],[18,16],[14,20],[-1,20],[-1,-10],[-17,-10]];
  solid(podium,.12,5.95,M.brick,1.3);solid(podium.map(([x,z])=>[x*1.035,z*1.035]),6.12,.3,M.roof,1.4);
  brickBox(brown.x,brown.y0+brown.f*FH/2,brown.z,brown.w,brown.f*FH,brown.d);
  solid(whitePlan,.12,whiteTop,M.white,1.15,.10);
  const brownPlan=[[0,-14],[14,-14],[14,13],[0,13]];
  function windows(plan,floors,start,brownFacade){plan.forEach((a,i)=>{const b=plan[(i+1)%plan.length],dx=b[0]-a[0],dz=b[1]-a[1],L=Math.hypot(dx,dz),nx=dz/L,nz=-dx/L,angle=-Math.atan2(dz,dx),margin=brownFacade?.7:1.25,n=Math.max(1,Math.floor((L-2*margin)/(brownFacade?2.25:2.7))),pitch=(L-2*margin)/n;
   for(let j=0;j<n;j++){const t=(margin+(j+.5)*pitch)/L,x=a[0]+dx*t,z=a[1]+dz*t,ww=pitch-(brownFacade?.95:.65);
    for(let f=0;f<floors;f++){const y=start+f*FH+FH/2,gm=glass[(j+Math.floor(f/3)+i)%glass.length];box(gm,x+nx*.10,y,z+nz*.10,ww,FH-.28,.14,angle);
     for(const k of [-1,1]){const px=x+dx/L*k*ww/2,pz=z+dz/L*k*ww/2;box(M.frame,px+nx*.16,y,pz+nz*.16,.055,FH-.20,.20,angle);box(M.frame,x+nx*.16,y+k*(FH-.28)/2,z+nz*.16,ww+.10,.055,.20,angle);}
     box(M.frame,x+nx*.18,y-.22,z+nz*.18,ww,.055,.22,angle);if(!brownFacade)box(M.frame,x+nx*.18,y+.72,z+nz*.18,ww,.035,.20,angle);
     if(brownFacade){box(M.brown,x+nx*.24,y-FH/2+.30,z+nz*.24,ww,.50,.20,angle);}
     if(!brownFacade){box(M.white,x+nx*.25,y-FH/2+.06,z+nz*.25,pitch,.16,.46,angle);
      for(const side of [-1,1]){const px=x+dx/L*side*(ww/2+.19),pz=z+dz/L*side*(ww/2+.19);box(M.white,px+nx*.24,y,pz+nz*.24,.33,FH,.55,angle);}
     }
    }
    // Multi-step portal mouldings spanning three storeys on the white facades.
    if(!brownFacade)for(let f=0;f<floors;f+=3){const gh=Math.min(3,floors-f)*FH;for(let layer=0;layer<4;layer++){const breadth=ww+.28+layer*.12,depth=.42-layer*.085,y=start+f*FH;
      for(const side of [-1,1])box(M.edge,x+dx/L*side*breadth/2+nx*depth,y+gh/2,z+dz/L*side*breadth/2+nz*depth,.065,gh,.16,angle);
      for(const yy of [y+.05,y+gh-.05])box(M.edge,x+nx*depth,yy,z+nz*depth,breadth,.07,.16,angle);
    }}
   }
   if(brownFacade){for(let j=0;j<=n;j++){const t=(margin+j*pitch)/L;box(M.bronze,a[0]+dx*t+nx*.18,start+floors*FH/2,a[1]+dz*t+nz*.18,.27,floors*FH,.48,angle)}
    for(let f=0;f<=floors;f++)box(M.brown,(a[0]+b[0])/2+nx*.2,start+f*FH,(a[1]+b[1])/2+nz*.2,L,.16+(f%4===0?.14:0),.5,angle);
   }
  });}
  windows(brownPlan,brown.f,brown.y0,true);windows(whitePlan,whiteFloors,6.2,false);
  // White lower-storey entrances and stone panel joints remain exposed on the west/front.
  for(const z of [-7,-1,5]){box(glass[1],-14.14,2.4,z,.12,4.2,1.8);for(const d of [-1,1])box(M.white,-14.28,2.5,z+d*1.0,.40,4.6,.16);box(M.white,-14.27,4.7,z,.42,.18,2.1);box(M.steel,-14.3,1.8,z,.07,.5,.06);}
  for(let z=-10;z<8;z+=1.25)box(M.roof,-14.18,3,z,.016,5.8,.025);
  // Broad brick-base portal, glazing and slender entrance mullions.
  box(glass[3],7,2.3,20.04,10,3.9,.12);for(let x=2;x<=12;x+=1.25)box(M.bronze,x,2.3,20.15,.075,4.1,.2);box(M.brown,7,4.4,20.14,10.4,.18,.25);
  // Two projecting glazed bays on the brown wall, as visible in the close reference.
  for(const z of [-1.6,1.3]){box(M.bronze,14.50,39.3,z,1.05,5.8,2.4);box(glass[2],15.05,39.3,z,.12,5.5,2.15);for(const y of [36.5,39.3,42.1])box(M.edge,15.14,y,z,.16,.1,2.4);}
  // Brown roof coping, raised roof hatch and recessed grey roof plane.
  box(M.roof,7,brownTop+.08,-.5,13.5,.15,26.5);
  for(const x of [.04,13.96])box(M.brown,x,brownTop+.48,-.5,.28,.8,27.2);
  for(const z of [-14.04,13.04])box(M.brown,7,brownTop+.48,z,14.2,.8,.28);
  box(M.brown,7,brownTop+.50,-2.8,6,.8,5.4);box(M.roof,7,brownTop+.96,-2.8,5.6,.15,5);
  // Ribbed dark mechanical screen above the lower white wing.
  box(M.screen,-7,whiteTop+3.2,-6,9.8,6.4,11);
  for(let z=-11.5;z<=-.5;z+=.55)box(M.roof,-12.05,whiteTop+3.2,z,.13,6.5,.065);
  for(let x=-11.7;x<=-2.3;x+=.55)box(M.roof,x,whiteTop+3.2,-.42,.065,6.5,.13);
  for(const x of [-11.9,-8.65,-5.4,-2.15]){box(M.edge,x,whiteTop+3.25,-.25,.22,6.7,.25);box(M.frame,x,whiteTop+6.65,-6,.20,.13,11.5);}
  // Angular planted beds, cut by the paved circulation network.
  const beds=[
   [[-29,-24],[-18,-24],[-18,-18],[-29,-16]], [[-29,-14],[-19,-16],[-19,-6],[-28,-3]],
   [[-28,0],[-18,-3],[-18,5],[-28,8]], [[-28,19],[-15,20],[-9,26],[-27,24]],
   [[-12,22],[-2,23],[3,28],[-6,28]], [[3,24],[15,24],[18,28],[7,28]],
   [[21,21],[29,18],[24,27],[20,28]], [[21,5],[29,2],[30,14],[21,18]],
   [[21,-9],[29,-12],[30,-1],[21,2]], [[19,-23],[27,-24],[28,-15],[20,-12]],
   [[-14,-25],[1,-25],[1,-21],[-13,-20]], [[4,-25],[16,-25],[17,-21],[4,-21]]
  ];
  function inside(x,z,p){let yes=false;for(let i=0,j=p.length-1;i<p.length;j=i++){const a=p[i],b=p[j];if((a[1]>z)!==(b[1]>z)&&x<(b[0]-a[0])*(z-a[1])/(b[1]-a[1])+a[0])yes=!yes;}return yes;}
  let seed=292;const rnd=()=>{seed=seed*16807%2147483647;return(seed-1)/2147483646};
  // Fine grass blades: real crossed tapered geometry, not featureless low-poly blobs.
  const bladePos=[];for(let i=0;i<6;i++){const a=i*Math.PI/3,dx=Math.cos(a),dz=Math.sin(a),h=.5+(i%3)*.13;const p0=[-dz*.04,0,dx*.04],p1=[dz*.04,0,-dx*.04],mid=[dx*.19,h*.55,dz*.19],tip=[dx*.31,h,dz*.31];bladePos.push(...p0,...p1,...mid,...p1,...tip,...mid);}
  const blades=new T.BufferGeometry();blades.setAttribute('position',new T.Float32BufferAttribute(bladePos,3));blades.computeVertexNormals();geo.push(blades);const grass=material(0xb8c1ae,{side:T.DoubleSide,roughness:1});
  beds.forEach((p,bi)=>{solid(p,.04,.18,M.curb);const cx=p.reduce((s,v)=>s+v[0],0)/p.length,cz=p.reduce((s,v)=>s+v[1],0)/p.length,inner=p.map(([x,z])=>[cx+(x-cx)*.95,cz+(z-cz)*.95]);polygon(inner,.23,M.soil);
   const xs=p.map(v=>v[0]),zs=p.map(v=>v[1]),xmin=Math.min(...xs),xmax=Math.max(...xs),zmin=Math.min(...zs),zmax=Math.max(...zs);
   for(let i=0;i<125;i++){const x=xmin+rnd()*(xmax-xmin),z=zmin+rnd()*(zmax-zmin);if(!inside(x,z,inner))continue;const sc=.35+rnd()*.55;
    if(i%3===0)stamp(blades,grass,x,.24,z,sc*1.4,sc*1.7,sc*1.4,rnd()*Math.PI*2);
    else if(i%3===1)stamp(shrub,plants[(bi+i)%plants.length],x,.35+sc*.35,z,sc,.25+sc*.5,sc*.8,rnd()*6.28);
    else {stamp(cone,plants[(bi+i)%plants.length],x,.5,z,.15,.55+rnd()*.35,.15);stamp(shrub,plants[(bi+6)%plants.length],x,.82,z,.19,.12,.18);}
   }
  });
  // Mixed green and autumn trees with visible trunks/branches and multiple crown masses.
  const trees=[[-24,-21],[-24,-9],[-24,3],[-22,22],[-9,25],[10,26],[26,18],[25,8],[25,-5],[24,-20],[-7,-23],[9,-23]];
  trees.forEach(([x,z],i)=>{const h=3.0+(i%3)*.65;branch([x,.25,z],[x,h,z],.10);
   for(let j=0;j<7;j++){const a=j*2.399,rad=.45+(j%3)*.35,ex=x+Math.cos(a)*rad,ez=z+Math.sin(a)*rad,ey=h+(j%3)*.5;branch([x,h*.65,z],[ex,ey,ez],.035);stamp(ball,plants[i%4===0?5:(i%4===1?4:(j%2?0:7))],ex,ey+.45,ez,.55+(j%2)*.16,.85,.62,j);}
  });
  // Pergola/play pavilion: slim posts, layered roof, timber platform, hanging white rings.
  const px=-22,pz=13;
  for(let i=0;i<28;i++)box(M.wood,px-5.4+i*.4,.18,pz,.37,.25,5.7);
  for(const x of [px-5.5,px,px+5.5])for(const z of [pz-2.8,pz+2.8])box(M.light,x,2.05,z,.09,3.8,.09);
  for(const x of [px-2.8,px+2.8]){box(M.roof,x,4.02,pz,5.8,.10,6.9);box(M.light,x,3.91,pz,5.8,.08,6.6);}
  for(let x=px-5.6;x<=px+5.6;x+=.55)box(M.light,x,3.80,pz,.055,.10,6.4);
  const ringG=new T.TorusGeometry(.72,.10,10,36);geo.push(ringG);const smaller=new T.TorusGeometry(.54,.09,10,32);geo.push(smaller);
  stamp(ringG,M.light,px-2.7,2.35,pz+2.65,1,1,1);stamp(smaller,M.light,px+3.1,2.2,pz+2.65,1,1,1);
  for(const x of [px-2.7,px+3.1])box(M.steel,x,3.45,pz+2.65,.025,.8,.025);
  for(const [x,z] of [[-14,13],[-12,15],[-10,17]])stamp(ball,M.light,x,.4,z,.65,.35,.45);
  for(const [x,z] of [[-28,14],[-17,15],[-21,9]])stamp(cylinder,M.light,x,.45,z,.28,.8,.28);
  function bench(x,z,angle=0){for(let j=0;j<5;j++)box(M.wood,x,.65,z+(j-2)*.14,2.4,.08,.12,angle);for(const d of [-.9,.9])box(M.steel,x+d,.35,z,.08,.6,.6,angle);for(let j=0;j<3;j++)box(M.wood,x,1.0+j*.13,z-.36,2.4,.10,.08,angle);}
  bench(-20,16);bench(-25,10);bench(22,19);bench(23,-15);
  for(const [x,z] of [[-16,18],[-27,-3],[21,-17],[22,12],[-4,24]]){stamp(cylinder,M.steel,x,2.3,z,.055,4.3,.055);stamp(cylinder,M.steel,x,4.46,z,.43,.075,.43);stamp(cylinder,M.light,x,4.40,z,.35,.045,.35);}
  // Fine paving joints at the entrance plaza and low cylindrical site furniture.
  for(const [x,z] of [[-16,8],[-17,20],[20,-7],[18,23]])stamp(cylinder,M.steel,x,.5,z,.16,.95,.16);
  batches.forEach(({G,m,list})=>{const mesh=new T.InstancedMesh(G,m,list.length);list.forEach((matrix,i)=>mesh.setMatrixAt(i,matrix));mesh.instanceMatrix.needsUpdate=true;mesh.castShadow=mesh.receiveShadow=true;vpm.add(mesh)});
  root.userData.geo=geo;root.userData.materials=materials;root.userData.reference={name:'Project 2 from supplied photos',estimated:true,brownWhiteTower:true,whitePortalMouldings:true,brickPodium:true,roofScreen:true,pergola:true,hangingRings:2,mixedPlanting:true};
  return{root,g,radius:Math.max(Math.hypot(63,57)/2,82.6*.95),maxH:82.6};
 }
 global.GranPhotoTower={build};
})(window);
