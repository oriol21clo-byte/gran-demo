/* Project 2: detailed reconstruction from the supplied reference views.
   Geometry and landscape positions are estimates; no survey dimensions supplied. */
(function(global){
 'use strict';if(!global.THREE)return;const T=global.THREE;
 function build(){
  const root=new T.Group(),vpm=new T.Group(),g={vpm},geo=[],materials=[],batches=new Map(),dummy=new T.Object3D();root.add(vpm);
  const color=c=>new T.Color(c).convertSRGBToLinear();
  const material=(c,o={})=>{const m=new T.MeshStandardMaterial(Object.assign({color:color(c),roughness:.78,metalness:0},o));materials.push(m);return m};
  function texture(kind){const c=document.createElement('canvas');c.width=256;c.height=128;const x=c.getContext('2d');if(!x)return null;
   x.fillStyle=kind==='brick'?'#3d2e28':'#9ea6a5';x.fillRect(0,0,256,128);
   for(let row=0;row<8;row++)for(let col=-1;col<8;col++){const ox=col*48+(row%2)*24,oy=row*16;
    x.fillStyle=kind==='brick'?['#674333','#6e4838','#614030','#754b37'][(row+col+8)%4]:['#a9b0ad','#b9bdb8','#b0b7b2'][(row+col+8)%3];x.fillRect(ox+1,oy+1,46,14);
   }
   const tex=new T.CanvasTexture(c);tex.wrapS=tex.wrapT=T.RepeatWrapping;tex.encoding=T.sRGBEncoding;tex.anisotropy=4;return tex;
  }
  const M={white:material(0xe8e8df),edge:material(0xf2f0e7),brick:material(0xffffff,{map:texture('brick'),roughness:.94}),brown:material(0x583a2e),bronze:material(0x614333),frame:material(0x3a4448),screen:material(0x3f494e),roof:material(0x899290),pave:material(0xbbc0bd,{map:texture('pave'),roughness:1}),curb:material(0x7c654c),soil:material(0x687c57),wood:material(0xaf9272),steel:material(0x52605f),light:material(0xf1f0df),trunk:material(0x73624f)};
  const glass=[0x99a9aa,0x7f949b,0xb4bdb5,0x879b82,0xa0ae87,0x647b87].map(c=>GranVisual.glass(material(c,{roughness:.32,metalness:.08})));
  const upperGlass=GranVisual.glass(material(0xd9e0da,{roughness:.28,metalness:.09}));
  const playSurface=material(0xbd9478,{roughness:1});
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
  const site=[[16.14,-19.34],[8.86,32.95],[-33.99,27.57],[-37.67,-27.14],[-14.42,-25.8],[-13.81,-23.08]];
  solid(site,-.8,.8,M.roof,.5);polygon(site,.025,M.pave);
  // Broad diagonal circulation and small play pad traced in the reference view.
  const pavingJoints=[
   [[-13.58,-13.99],[-25.23,12.66]],[[-10.62,-10.81],[-21.95,16.27]],
   [[-25.88,-16.44],[-16.85,-10.04]],[[-29.65,-10.4],[-19.33,-4.22]],
   [[-34.12,1.09],[-23.19,7.4]],[[-34.77,11.15],[-24.99,18.81]],
   [[-27.26,17.68],[-29.35,27.22]]
  ];
  for(const [a,b] of pavingJoints){const dx=b[0]-a[0],dz=b[1]-a[1];box(M.roof,(a[0]+b[0])/2,.046,(a[1]+b[1])/2,Math.hypot(dx,dz),.025,.10,-Math.atan2(dz,dx));}
  const playPlan=[[-19.18,-19.49],[-16.83,-15.54],[-21.02,-10.75],[-24.79,-15.17]];
  solid(playPlan,.04,.035,playSurface,.25);
  for(const [x,z] of [[-19,-15],[-21.3,-16.8],[-20.2,-13.3],[-22.2,-14.5]])stamp(cylinder,M.light,x,.10,z,.28,.05,.28);
  // Three shallow facets give the white front its slight turn in plan.
  // The brown rear bar stays straight and vertical.
  const brown={x:3.5,z:-.5,w:7,d:27,f:24,y0:6.2},whitePlan=[[-8.5,-11.5],[-7.5,-13],[-.15,-13],[-.15,15],[-16,15],[-15,6.2],[-12.5,-2.6]],FH=3.15,whiteFloors=19,whiteTop=66.05,brownTop=81.8;
  const podium=[[0,-16],[8.8,-16],[8.8,16],[-18.7,17],[-18.7,14],[-17.3,6.2],[-14.7,-2.6],[-10.5,-12.2],[0,-12.2]];
  solid(podium,.12,5.95,M.brick,.42);solid(podium.map(([x,z])=>[x*1.025,z*1.025]),6.12,.3,M.roof,.50);
  brickBox(brown.x,brown.y0+brown.f*FH/2,brown.z,brown.w,brown.f*FH,brown.d);
  solid(whitePlan,.12,whiteTop-.12,M.white,.18);
  // Exposed wedge-shaped roof and thin parapet follow the actual five-sided plan.
  polygon(whitePlan,whiteTop+.025,M.roof);
  whitePlan.forEach((a,i)=>{const b=whitePlan[(i+1)%whitePlan.length],dx=b[0]-a[0],dz=b[1]-a[1],L=Math.hypot(dx,dz);box(M.white,(a[0]+b[0])/2,whiteTop+.26,(a[1]+b[1])/2,L,.5,.18,-Math.atan2(dz,dx));});
  const brownPlan=[[0,-14],[7,-14],[7,13],[0,13]];
  function windows(plan,floors,start,brownFacade){plan.forEach((a,i)=>{const b=plan[(i+1)%plan.length],dx=b[0]-a[0],dz=b[1]-a[1],L=Math.hypot(dx,dz),nx=dz/L,nz=-dx/L,angle=-Math.atan2(dz,dx),frontFacet=!brownFacade&&i>=4,margin=brownFacade?.7:frontFacet?.22:1.25,n=frontFacet?2:Math.max(1,Math.floor((L-2*margin)/(brownFacade?2.25:4.1))),pitch=(L-2*margin)/n;
   for(let j=0;j<n;j++){const t=(margin+(j+.5)*pitch)/L,x=a[0]+dx*t,z=a[1]+dz*t,ww=pitch-(brownFacade?.95:.65);
    for(let f=0;f<floors;f++){const y=start+f*FH+FH/2,gm=brownFacade&&f>=19?upperGlass:glass[(j+Math.floor(f/3)+i)%glass.length];box(gm,x+nx*.10,y,z+nz*.10,ww,FH-.28,.14,angle);
     for(const k of [-1,1]){const px=x+dx/L*k*ww/2,pz=z+dz/L*k*ww/2;box(M.frame,px+nx*.16,y,pz+nz*.16,.055,FH-.20,.20,angle);box(M.frame,x+nx*.16,y+k*(FH-.28)/2,z+nz*.16,ww+.10,.055,.20,angle);}
     box(M.frame,x+nx*.18,y-.22,z+nz*.18,ww,.055,.22,angle);if(!brownFacade)box(M.frame,x+nx*.18,y+.72,z+nz*.18,ww,.035,.20,angle);
     if(brownFacade){box(M.brown,x+nx*.24,y-FH/2+.30,z+nz*.24,ww,.50,.20,angle);if(f>=19)for(const side of [-1,1])box(M.edge,x+dx/L*side*(ww/2-.08)+nx*.20,y,z+dz/L*side*(ww/2-.08)+nz*.20,.07,FH-.16,.14,angle);}
     if(!brownFacade){box(M.frame,x+nx*.13,y-FH/2+.34,z+nz*.13,ww,.60,.10,angle);
      for(const side of [-1,1]){const px=x+dx/L*side*(ww/2+.19),pz=z+dz/L*side*(ww/2+.19);box(M.white,px+nx*.24,y,pz+nz*.24,.33,FH,.55,angle);}
     }
    }
    // Multi-step portal mouldings spanning three storeys on the white facades.
    if(!brownFacade)for(let f=0;f<floors;f+=3){const gh=Math.min(3,floors-f)*FH;for(let layer=0;layer<4;layer++){const breadth=ww+.24+layer*.16,depth=.94-layer*.17,y=start+f*FH;
      for(const side of [-1,1])box(M.edge,x+dx/L*side*breadth/2+nx*depth,y+gh/2,z+dz/L*side*breadth/2+nz*depth,.095,gh,.20,angle);
      for(const yy of [y+.05,y+gh-.05])box(M.edge,x+nx*depth,yy,z+nz*depth,breadth,.105,.20,angle);
    }}
   }
   if(brownFacade){for(let j=0;j<=n;j++){const t=(margin+j*pitch)/L;box(M.bronze,a[0]+dx*t+nx*.18,start+floors*FH/2,a[1]+dz*t+nz*.18,.38,floors*FH,.56,angle)}
    for(let f=0;f<=floors;f++)if(f<19||f===floors)box(M.brown,(a[0]+b[0])/2+nx*.2,start+f*FH,(a[1]+b[1])/2+nz*.2,L,f%4===0?.28:.10,.40,angle);
   }
  });}
  windows(brownPlan,brown.f,brown.y0,true);windows(whitePlan,whiteFloors,6.2,false);
  // Three entrance bays on the short exposed white end; the long face
  // stands over the continuous brick podium seen in the roof reference.
  for(const x of [-6.1,-3.65,-1.2]){box(glass[1],x,2.45,-13.10,1.5,4.1,.12);for(const side of [-1,1])box(M.white,x+side*.85,2.5,-13.2,.20,4.7,.35);box(M.white,x,4.75,-13.22,1.9,.22,.38);}
  box(glass[3],3.5,2.35,-16.04,5.4,4.0,.12);for(let x=1;x<6.2;x+=1.05)box(M.bronze,x,2.35,-16.15,.065,4.1,.20);
  // Two projecting glazed bays on the brown wall, as visible in the close reference.
  for(const z of [-1.6,1.3]){box(M.bronze,7.50,39.3,z,1.05,5.8,2.4);box(glass[2],8.05,39.3,z,.12,5.5,2.15);for(const y of [36.5,39.3,42.1])box(M.edge,8.14,y,z,.16,.1,2.4);}
  // Long narrow roof with a projecting central service enclosure: the
  // outline reads as a U from above rather than a hatch on the rear roof.
  box(M.roof,3.5,brownTop+.08,-.5,6.5,.15,26.5);
  box(M.brown,6.96,brownTop+.48,-.5,.28,.8,27.2);
  for(const [z,d] of [[-9.7,8.7],[9.2,7.6]])box(M.brown,.04,brownTop+.48,z,.28,.8,d);
  for(const z of [-14.04,13.04])box(M.brown,3.5,brownTop+.48,z,7.2,.8,.28);
  solid([[-4.7,-5.3],[.3,-5.3],[.3,5.3],[-4.7,5.3]],79.5,2.8,M.brown);
  box(M.roof,-2.2,82.34,0,4.65,.12,10.25);
  // Raised white U-shaped shoulder behind the four dark faces.
  // This is an enclosed upper storey, not a canopy over an open recess.
  // Keep the dark front panels/glazed slots exposed, close the core and ends.
  const upperBase=whiteTop,upperCeiling=77.4,upperHeight=upperCeiling-upperBase;
  const bow=z=>-1.8*(1-(z/14)**2),turn=z=>Math.atan(3.6*z/196);
  const curvedEdge=(x,extent)=>[-extent,-7,0,7,extent].map(z=>[x+bow(z),z]);
  solid([...curvedEdge(-5.8,13.5),[.1,13.5],[.1,-13.5]],upperBase,upperHeight,M.screen);
  for(const z of [-13.5,13.5])box(M.screen,-3.8,upperBase+upperHeight/2,z,7.8,upperHeight,.25);
  const shoulder=[...curvedEdge(-7.7,13.8),[.1,13.8],[.1,-13.8]];
  solid(shoulder,77.4,.45,M.white);
  box(M.white,-.30,79.5,0,.30,3.3,27.4);
  for(const z of [-13.5,13.5])box(M.white,-3.8,79.5,z,7.8,3.3,.25);
  const roofBlades=[];
  for(let j=0;j<4;j++){
   const z=-8+j*6,x=-6.65+bow(z),a=turn(z),h=12.0,top=whiteTop+h;roofBlades.push({x,z,top,angle:a});
   const panelBox=(m,lx,y,lz,w,hh,d)=>box(m,x+Math.cos(a)*lx+Math.sin(a)*lz,y,z-Math.sin(a)*lx+Math.cos(a)*lz,w,hh,d,a);
   panelBox(M.screen,0,whiteTop+h/2,0,1.7,h,5.3);
   panelBox(M.frame,0,top+.06,0,1.78,.12,5.38);
   // Broad dark planes with a cluster of thin vertical ribs on one edge.
   for(const off of [1.45,1.65,1.85,2.05,2.25])panelBox(M.roof,-.88,whiteTop+h/2,off,.035,h,.035);
   for(const side of [-1,1])panelBox(M.edge,-.94,whiteTop+h/2,side*2.62,.10,h,.055);
   if(j<3){const gz=z+3,gx=-7.4+bow(gz),ga=turn(gz);box(glass[(j+2)%glass.length],gx,whiteTop+h/2,gz,.10,h-.3,.62,ga);for(let y=whiteTop+.3;y<top;y+=3.15)box(M.frame,gx-.09,y,gz,.12,.065,.64,ga);}
  }
  // Angular planted beds, cut by the paved circulation network.
  const beds=[
   [[-15.45,-25.51],[-13.04,-21.16],[-22.04,-22.19],[-28.98,-26.24]],
   [[-30.76,-26.07],[-29.21,-21.01],[-35.65,-17.62],[-36.88,-26.84]],
   [[-29.66,-16.17],[-26.33,-11.39],[-32.57,-4.5],[-35.98,-6.02],[-36.43,-15.09]],
   [[-32.51,-3.55],[-29.41,1.28],[-33.31,7.14],[-35.4,4.93],[-36.04,-4.12]],
   [[-33.09,7.51],[-28.64,12.15],[-32.85,19.07],[-34.62,18.71],[-35.49,6.45]],
   [[-20.9,13.93],[-22.82,21.1],[-28.05,20.55],[-26.97,16.14]],
   [[-11.03,19.07],[-11.84,25.37],[-18.95,24.18],[-17.92,18.55]],
   [[15,-19.05],[14.07,-12.55],[8.1,-12.79],[9.2,-19.66]],
   [[13.2,-10.5],[9.8,29],[5.6,28.3],[9.2,16],[10.2,-10.5]],
   [[-25.5,26],[-19.5,25],[-20,29.2],[-28,27.7]]
  ];
  function inside(x,z,p){let yes=false;for(let i=0,j=p.length-1;i<p.length;j=i++){const a=p[i],b=p[j];if((a[1]>z)!==(b[1]>z)&&x<(b[0]-a[0])*(z-a[1])/(b[1]-a[1])+a[0])yes=!yes;}return yes;}
  let seed=292;const rnd=()=>{seed=seed*16807%2147483647;return(seed-1)/2147483646};
  // Fine grass blades: real crossed tapered geometry, not featureless low-poly blobs.
  const bladePos=[];for(let i=0;i<6;i++){const a=i*Math.PI/3,dx=Math.cos(a),dz=Math.sin(a),h=.5+(i%3)*.13;const p0=[-dz*.04,0,dx*.04],p1=[dz*.04,0,-dx*.04],mid=[dx*.19,h*.55,dz*.19],tip=[dx*.31,h,dz*.31];bladePos.push(...p0,...p1,...mid,...p1,...tip,...mid);}
  const blades=new T.BufferGeometry();blades.setAttribute('position',new T.Float32BufferAttribute(bladePos,3));blades.computeVertexNormals();geo.push(blades);const grass=material(0xb8c1ae,{side:T.DoubleSide,roughness:1});
  beds.forEach((p,bi)=>{solid(p,.04,.18,M.curb);const cx=p.reduce((s,v)=>s+v[0],0)/p.length,cz=p.reduce((s,v)=>s+v[1],0)/p.length,inner=p.map(([x,z])=>[cx+(x-cx)*.95,cz+(z-cz)*.95]);polygon(inner,.23,M.soil);
   const xs=p.map(v=>v[0]),zs=p.map(v=>v[1]),xmin=Math.min(...xs),xmax=Math.max(...xs),zmin=Math.min(...zs),zmax=Math.max(...zs);
   for(let i=0;i<320;i++){const x=xmin+rnd()*(xmax-xmin),z=zmin+rnd()*(zmax-zmin);if(!inside(x,z,inner))continue;const sc=.28+rnd()*.35,patch=(Math.floor((x-cx)/1.8)+Math.floor((z-cz)/1.8)+bi*3+64)%8;
    if(i%5<3)stamp(blades,grass,x,.24,z,sc*1.5,sc*1.9,sc*1.5,rnd()*Math.PI*2);
    else if(i%5===3)stamp(shrub,plants[[0,1,2,7,0,2,5,1][patch]],x,.27+sc*.3,z,sc,.14+sc*.35,sc*.8,rnd()*6.28);
    else {const hh=.4+rnd()*.35;stamp(cone,plants[patch===6?5:7],x,.24+hh/2,z,.10,hh,.10);stamp(shrub,plants[patch===6?5:2],x,.24+hh,z,.11,.07,.11);}
   }
  });
  // Mixed green and autumn trees with visible trunks/branches and multiple crown masses.
  const trees=[[-18,-24],[-31,-24],[-33,-13],[-33,-1],[-32,12],[-24,18],[-14,22],[11,-16],[11,2],[9,18]];
  trees.forEach(([x,z],i)=>{const h=3.0+(i%3)*.65;branch([x,.25,z],[x,h,z],.10);
   for(let j=0;j<12;j++){const a=j*2.399,rad=.35+(j%3)*.32,ex=x+Math.cos(a)*rad,ez=z+Math.sin(a)*rad,ey=h+(j%3)*.45;branch([x,h*.65,z],[ex,ey,ez],.025);stamp(shrub,plants[i%4===0?5:(i%4===1?4:(j%2?0:7))],ex,ey+.3,ez,.42+(j%2)*.13,.60,.47,j);}
  });
  // Pergola/play pavilion: slim posts, layered roof, timber platform, hanging white rings.
  const px=-11.5,pz=-18.7;
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
  bench(-24,-18,.5);bench(-22,-8,.5);bench(-20,22);bench(9,-9);
  for(const [x,z] of [[-22,-20],[-27,-6],[-21,23],[10,14],[-30,22]]){stamp(cylinder,M.steel,x,2.3,z,.055,4.3,.055);stamp(cylinder,M.steel,x,4.46,z,.43,.075,.43);stamp(cylinder,M.light,x,4.40,z,.35,.045,.35);}
  // Fine paving joints at the entrance plaza and low cylindrical site furniture.
  for(const [x,z] of [[-22,-16],[-19,19],[10,-8],[6,26]])stamp(cylinder,M.steel,x,.5,z,.16,.95,.16);
  batches.forEach(({G,m,list})=>{const mesh=new T.InstancedMesh(G,m,list.length);list.forEach((matrix,i)=>mesh.setMatrixAt(i,matrix));mesh.instanceMatrix.needsUpdate=true;mesh.castShadow=mesh.receiveShadow=true;vpm.add(mesh)});
  root.userData.geo=geo;root.userData.materials=materials;root.userData.reference={name:'Project 2 from supplied photos',estimated:true,brownWhiteTower:true,whitePortalMouldings:true,brickPodium:true,continuousPodium:true,raisedRoofShoulder:true,projectingServiceRoom:true,roofScreen:true,roofBlades,bladeAxis:'z',obliqueWhiteFront:true,whitePlan,facetedWhiteFront:true,frontFacets:3,fannedUpperPanels:true,diagonalLandscape:true,site,playPlan,portalDepth:.94,upperBrownBays:true,podiumOverhang:1.065,pergola:true,hangingRings:2,mixedPlanting:true};
  return{root,g,radius:Math.max(Math.hypot(63,57)/2,82.6*.95),maxH:82.6};
 }
 global.GranPhotoTower={build};
})(window);
