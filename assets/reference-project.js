/* Six-volume reconstruction from the supplied views. Dimensions are estimates.
   Independent VPM-only model: no textures or geometry from another project. */
(function(global){
  'use strict';
  if(!global.THREE)return;
  const T=global.THREE;
  function build(spec,common){
    const root=new T.Group(),vpm=new T.Group(),g={vpm},geo=[],materials=[];root.add(vpm);
    const linear=c=>new T.Color(c).convertSRGBToLinear();
    const material=(c,o={})=>{const m=new T.MeshStandardMaterial(Object.assign({color:linear(c),roughness:.82,metalness:0},o));materials.push(m);return m};
    const R={white:material(0xe9e9e3),grey:material(0xb9c4c7),rib:material(0xcbd1d0),gold:material(0xc8aa61),red:material(0x9f543b),roof:material(0x414b50),joint:material(0xc8cccb),lawn:material(0x829565),pave:material(0xd3d7d2),light:material(0xe7e7df),play:material(0xb66f47),wood:material(0xae8255),steel:material(0x424e54),bark:material(0x797465),leaf:material(0xb5c4ab),silver:material(0xd4d9c5),shrub:material(0x91a47b),flower:material(0x9b8da4),grass:material(0xc3c7ae)};
    const glazing=[0x465d68,0x70868d,0x9aa9a9,0x536f7e,0xb5bdb7].map(c=>GranVisual.glass(material(c,{roughness:.3,metalness:.12})));
    const unit=new T.BoxGeometry(1,1,1),dummy=new T.Object3D(),batches=new Map();geo.push(unit);
    function box(mat,x,y,z,w,h,d,angle=0,shadow=true){let list=batches.get(mat);if(!list)batches.set(mat,list=[]);list.push([x,y,z,w,h,d,angle,shadow]);}
    function shape(w,d,r){const s=new T.Shape(),x=-w/2,z=-d/2;s.moveTo(x+r,z);s.lineTo(x+w-r,z);s.quadraticCurveTo(x+w,z,x+w,z+r);s.lineTo(x+w,z+d-r);s.quadraticCurveTo(x+w,z+d,x+w-r,z+d);s.lineTo(x+r,z+d);s.quadraticCurveTo(x,z+d,x,z+d-r);s.lineTo(x,z+r);s.quadraticCurveTo(x,z,x+r,z);s.closePath();return s;}
    function volume(mat,x,y,z,w,h,d,r=0){if(!r){box(mat,x,y+h/2,z,w,h,d);return}const G=new T.ExtrudeGeometry(shape(w,d,r),{depth:h,bevelEnabled:false,curveSegments:6});G.rotateX(-Math.PI/2);geo.push(G);const mesh=new T.Mesh(G,mat);mesh.position.set(x,y,z);mesh.castShadow=mesh.receiveShadow=true;vpm.add(mesh);}
    function polygon(mat,points,y){const s=new T.Shape();points.forEach(([x,z],i)=>i?s.lineTo(x,-z):s.moveTo(x,-z));s.closePath();const G=new T.ShapeGeometry(s);G.rotateX(-Math.PI/2);geo.push(G);const m=new T.Mesh(G,mat);m.position.y=y;m.receiveShadow=true;vpm.add(m);}
    const paths=[];
    function ribbon(points,width,mat,y=.12,record=true){const c=new T.CatmullRomCurve3(points.map(([x,z])=>new T.Vector3(x,y,z))),p=c.getPoints(64),left=[],right=[];p.forEach((v,i)=>{const a=p[Math.max(0,i-1)],b=p[Math.min(p.length-1,i+1)],dx=b.x-a.x,dz=b.z-a.z,L=Math.hypot(dx,dz)||1;left.push([v.x-dz/L*width/2,v.z+dx/L*width/2]);right.push([v.x+dz/L*width/2,v.z-dx/L*width/2]);});polygon(mat,left.concat(right.reverse()),y);if(record)paths.push({points:p,width});}
    box(common.slab,0,-.6,2,132,1.2,122);
    box(R.pave,0,.025,2,131,.05,121,0,false);
    const lawns=[
      [[-29,-18],[-9,-18],[-6,-5],[-13,5],[-22,23],[-28,25]],
      [[9,-17],[29,-17],[31,25],[20,27],[5,12],[0,3]],
      [[-58,-56],[60,-56],[59,-44],[-60,-44]]
    ];
    lawns.forEach(p=>polygon(R.lawn,p,.065));
    // Central paths follow the diagonals and S-bends visible in the plan view.
    ribbon([[-22,43],[-23,28],[-18,17],[-6,6],[2,-6],[-3,-24],[-14,-41]],4.2,R.light);
    ribbon([[35,39],[27,27],[18,18],[6,8],[-2,-4],[-2,-24],[-1,-42]],3.4,R.light,.13);
    ribbon([[-30,7],[-18,6],[-3,5],[14,1],[31,-7]],2.3,R.pave,.145);
    ribbon([[-60,-50],[-32,-50],[-8,-49],[20,-50],[60,-50]],2.25,R.light,.12);
    // Street garden: distinct planted and play islands, not a single empty lawn.
    const streetPads=[[-47,5.5],[-23,5],[4,5.5],[30,5],[49,4]];
    streetPads.forEach(([x,w],i)=>{if(i===0){const G=new T.CircleGeometry(2.7,32);G.rotateX(-Math.PI/2);geo.push(G);const pad=new T.Mesh(G,R.play);pad.position.set(x,.105,-50);pad.receiveShadow=true;vpm.add(pad);}else if(i===3){polygon(R.play,[[x-3,-53],[x+3,-52],[x+2,-47],[x-2.5,-46.5]],.105);}else{volume(R.pave,x,.09,-50,w,.04,7.6,1.6);}});
    for(let x=-55;x<57;x+=12){ribbon([[x,-57],[x+3,-50],[x+6,-43]],1.1,R.pave,.15,false);}
    const podiums=[[-18,-32,56,22],[43,-21,22,48],[-40,16,20,66],[27,35,30,21]];
    function facade(x,z,w,d,y0,f,mat,kind){
      const FH=3.1,h=f*FH;
      [[0,1],[0,-1],[1,0],[-1,0]].forEach(([nx,nz],face)=>{
        const L=nx?d:w,half=(nx?w:d)/2,rounded=kind==='grey',margin=rounded?2.2:1.05,n=Math.max(2,Math.round((L-margin*2)/3.05)),sp=(L-margin*2)/n;
        if(kind==='pod'){
          for(let j=0;j<n;j++){
            if((j+face)%5===1)continue;
            const t=-L/2+margin+(j+.5)*sp,px=x+(nx?nx*(half+.025):t),pz=z+(nz?nz*(half+.025):t),high=(j+face)%3!==0,wy=high?2.85:2.15,wh=high?4.95:3.55,ww=sp*.79;
            box(R.roof,px,wy,pz,nx?.12:ww+.18,wh+.14,nx?ww+.18:.12,0,false);
            box(glazing[(j+face)%3],px+nx*.08,wy,pz+nz*.08,nx?.06:ww,wh,nx?ww:.06,0,false);
            box(R.steel,px+nx*.13,wy,pz+nz*.13,nx?.04:.055,wh,nx?.055:.04,0,false);
          }return;
        }
        for(let k=0;k<f;k++)for(let j=0;j<n;j++){
          const t=-L/2+margin+(j+.5)*sp,off=half+.025,px=x+(nx?nx*off:t),pz=z+(nz?nz*off:t),wy=y0+k*FH+1.55;
          const exposed=kind==='gold'||kind==='red',ww=sp*(exposed?.72:.45),wh=exposed?2.45:2.02;
          box(R.roof,px,wy,pz,nx?.10:ww+.14,wh+.15,nx?ww+.14:.10,0,false);
          const index=(k*7+j*3+face*11)%19,gm=glazing[index===0?4:index<4?2:index<9?1:index<15?0:3];
          box(gm,px+nx*.07,wy,pz+nz*.07,nx?.05:ww,wh,nx?ww:.05,0,false);
          // Slim mullions and occasional pale spandrels match the supplied facades.
          if(exposed){box(R.steel,px+nx*.1,wy,pz+nz*.1,nx?.035:.05,wh,nx?.05:.035,0,false);
            if((j+face*2+k)%7===0)box(R.light,px+nx*.12,wy-.6,pz+nz*.12,nx?.04:ww*.36,1.1,nx?ww*.36:.04,0,false);}
        }
        if(kind==='gold'||kind==='red'){
          for(let k=0;k<=f;k++)box(mat,x+nx*(half+.24),y0+k*FH,z+nz*(half+.24),nx?.5:w+.54,.24,nx?d+.54:.5);
          for(let j=0;j<=n;j++){const t=-L/2+margin+sp*j;box(mat,x+(nx?nx*(half+.22):t),y0+h/2,z+(nz?nz*(half+.22):t),nx?.4:.24,h,nx?.24:.4);}
        }else if(rounded){
          // Rounded pale pilasters read as vertical flutes, rather than a window grid.
          for(let j=0;j<=n;j++){const t=-L/2+margin+sp*j;box(R.rib,x+(nx?nx*(half+.12):t),y0+h/2,z+(nz?nz*(half+.12):t),nx?.27:.4,h,nx?.4:.27);}
        }else{
          for(let j=0;j<=n;j++){const t=-L/2+margin+sp*j;box(R.joint,x+(nx?nx*(half+.01):t),y0+h/2,z+(nz?nz*(half+.01):t),nx?.02:.026,h,nx?.026:.02,0,false);}
        }
      });
    }
    podiums.forEach(([x,z,w,d])=>{volume(R.white,x,0,z,w,6.2,d);facade(x,z,w,d,0,2,R.white,'pod');volume(R.roof,x,6.22,z,w-.8,.1,d-.8);});
    const towers=spec.buildings;
    towers.forEach(b=>{const mat=R[b.finish],segments=b.tiers||[{w:b.w,d:b.d,f:b.f}],rounded=b.finish==='grey';let y=6.2;
      segments.forEach(t=>{const x=b.x+(t.x||0),z=b.z+(t.z||0),h=t.f*3.1,r=rounded?1.5:0;
        volume(mat,x,y,z,t.w,h,t.d,r);facade(x,z,t.w,t.d,y,t.f,mat,b.finish);
        volume(R.roof,x,y+h+.015,z,t.w-.65,.1,t.d-.65,Math.max(0,r-.3));
        if(rounded){
          // A thin raised rounded ring leaves the roof visible, like the reference.
          const outer=shape(t.w,t.d,r),hole=shape(t.w-.65,t.d-.65,Math.max(.15,r-.325));outer.holes.push(hole);
          const G=new T.ExtrudeGeometry(outer,{depth:.6,bevelEnabled:false,curveSegments:6});G.rotateX(-Math.PI/2);geo.push(G);const ring=new T.Mesh(G,mat);ring.position.set(x,y+h,z);ring.castShadow=true;vpm.add(ring);
        }else{
          [[0,t.d/2-.12,t.w,.24],[0,-t.d/2+.12,t.w,.24],[t.w/2-.12,0,.24,t.d],[-t.w/2+.12,0,.24,t.d]].forEach(([dx,dz,w,d])=>box(mat,x+dx,y+h+.35,z+dz,w,.7,d));
        }
        y+=h;
      });
      box(R.roof,b.x,y+.35,b.z,b.w*.24,.65,b.d*.22);
    });
    // Two-row white colonnade with a slender dark pergola, enclosing the courtyard.
    for(let x=-27;x<=28;x+=5.5){box(R.white,x,3.5,18,.48,7,.48);box(R.white,x,3.5,23,.48,7,.48);}
    [18,23].forEach(z=>box(R.white,.5,7.15,z,56,.42,.6));
    for(let x=-27;x<29;x+=1.25)box(R.steel,x,7.5,20.5,.1,.12,5.6,0,false);
    // Palette-specific instancing for planting: shared low-poly clusters, no alpha cards.
    const crown=new T.IcosahedronGeometry(1,1),smallCrown=new T.IcosahedronGeometry(1,0),trunk=new T.CylinderGeometry(.12,.2,1,7),cone=new T.ConeGeometry(1,1,8);geo.push(crown,smallCrown,trunk,cone);
    const foliage=new Map();let seed=941;const rnd=()=>(seed=seed*16807%2147483647)/2147483647;
    function item(G,mat,x,y,z,sx,sy,sz,shadow=true){const key=G.uuid+mat.uuid;let b=foliage.get(key);if(!b)foliage.set(key,b={G,mat,list:[],shadow});b.list.push([x,y,z,sx,sy,sz]);}
    function tree(x,z,s=1,type=0){item(trunk,R.bark,x,1.7*s,z,s,3.4*s,s);
      for(let i=0;i<11;i++){const a=i*2.399,rr=Math.sqrt(i/11)*1.45*s,c=i%4===0?R.silver:R.leaf;item(crown,c,x+Math.cos(a)*rr,3.9*s+(rnd()-.5)*1.6*s,z+Math.sin(a)*rr,.9*s,(.85+rnd()*.4)*s,.9*s);}
    }
    function conifer(x,z,s=1){item(trunk,R.bark,x,s,z,.6,2*s,.6);for(let j=0;j<4;j++)item(cone,R.shrub,x,(1+j*.65)*s,z,(1.1-j*.2)*s,1.8*s,(1.1-j*.2)*s);}
    const treePositions=[[-26,-14],[-24,-5],[-24,10],[-25,23],[-13,14],[17,-12],[25,-9],[25,7],[25,23],[12,23],[-2,27],[-7,-45],[50,8],[-56,36],[51,43]];
    treePositions.forEach(([x,z],i)=>tree(x,z,.9+(i%3)*.13));
    for(let i=0;i<19;i++)tree(-57+i*6.1,-46+(i%2)*1.2,.65+(i%3)*.08);
    [[-50,-53],[-31,-53],[-14,-46],[12,-54],[38,-47],[53,-53],[-19,-10],[18,12]].forEach(([x,z],i)=>conifer(x,z,.8+(i%3)*.12));
    function inside(x,z,poly){let ok=false;for(let i=0,j=poly.length-1;i<poly.length;j=i++){const a=poly[i],b=poly[j];if((a[1]>z)!=(b[1]>z)&&x<(b[0]-a[0])*(z-a[1])/(b[1]-a[1])+a[0])ok=!ok}return ok;}
    function free(x,z){return Math.hypot(x+18,z+1)>6.2&&Math.hypot(x-18,z)>6.5&&!towers.some(b=>Math.abs(x-b.x)<b.w/2+1.1&&Math.abs(z-b.z)<b.d/2+1.1)&&!paths.some(p=>p.points.some(v=>Math.hypot(v.x-x,v.z-z)<p.width/2+.6));}
    // Mixed low perennial drifts leave every major path clear.
    for(let i=0;i<5000;i++){const x=-59+rnd()*118,z=-56+rnd()*97;if(!lawns.some(p=>inside(x,z,p))||!free(x,z))continue;const s=.3+rnd()*.48;item(smallCrown,i%4===0?R.flower:i%3===0?R.grass:R.shrub,x,.35*s+.15,z,s,.65*s,s,false);}
    // Red-brown play pads, timber house, sandpit, swings and a circular play table.
    [[-18,-1,8.5,9.5],[18,0,9.5,11]].forEach(([x,z,w,d],k)=>{
      polygon(R.play,[[x-w/2,z-d/3],[x-w/5,z-d/2],[x+w/2,z-d/5],[x+w/3,z+d/2],[x-w/2,z+d/3]],.17);
      if(!k){box(R.wood,x-1,1,z,2,2,2);box(R.light,x-1,1,z+1.02,.7,1.5,.04,0,false);const G=new T.BufferGeometry();G.setAttribute('position',new T.Float32BufferAttribute([x-2.3,2,z-1.2,x-1,3,z-1.2,x+.3,2,z-1.2,x-2.3,2,z+1.2,x-1,3,z+1.2,x+.3,2,z+1.2],3));G.setIndex([0,3,4,0,4,1,1,4,5,1,5,2]);G.computeVertexNormals();geo.push(G);const roof=new T.Mesh(G,R.wood);roof.material.side=T.DoubleSide;roof.castShadow=true;vpm.add(roof);box(R.wood,x+1.1,.8,z,2.4,.15,.85,-.35);}
      else{for(const dx of [-2,2])box(R.wood,x+dx,1.5,z-1,.13,3,.13);box(R.wood,x,3,z-1,4.5,.14,.18);box(R.steel,x-.7,1.8,z-1,.04,2,.04,0,false);box(R.steel,x+.7,1.8,z-1,.04,2,.04,0,false);box(R.wood,x,.8,z-1,1.8,.12,.6);}
      box(R.wood,x+1.2,.25,z+2.5,2.6,.4,2.6);box(R.light,x+1.2,.48,z+2.5,2.3,.06,2.3);
    });
    const ringG=new T.TorusGeometry(1.6,.35,5,24);ringG.rotateX(Math.PI/2);geo.push(ringG);const playRing=new T.Mesh(ringG,R.wood);playRing.position.set(15,.9,5);playRing.castShadow=true;vpm.add(playRing);
    function bench(x,z,a=0){box(R.wood,x,.6,z,2.4,.18,.65,a);box(R.wood,x,.95,z-.28,2.4,.65,.12,a);[-.85,.85].forEach(dx=>box(R.steel,x+dx,.35,z,.1,.7,.5,a));}
    for(let i=0;i<11;i++)bench(-52+i*10.4,-53,i%2?.06:-.06);
    [[-24,3],[23,16],[11,8],[-10,18],[5,-38]].forEach(([x,z])=>bench(x,z));
    // Timber-framed small pavilions and gently curved twin-arm lamps.
    [[-35,-44],[16,-44],[-12,15]].forEach(([x,z])=>{for(let i=0;i<8;i++)box(R.wood,x-1.5+i*.42,2,z,.14,4,.18);box(R.wood,x,4.05,z+.7,3.3,.17,1.8);});
    [[-18,-41],[14,-42],[-28,9],[29,12],[-1,15],[44,8]].forEach(([x,z])=>{box(R.steel,x,2.6,z,.1,5.2,.1);for(const side of [-1,1]){box(R.steel,x+side*.55,5.2,z,1.2,.09,.09,side*.12);box(R.light,x+side*1.05,5.13,z,.6,.08,.25,0,false);}});
    // Flush batches keep the richer facade and planting economical on the GPU.
    function instances(G,mat,list,shadow){const im=new T.InstancedMesh(G,mat,list.length);list.forEach((a,i)=>{dummy.position.set(a[0],a[1],a[2]);dummy.scale.set(a[3],a[4],a[5]);dummy.rotation.set(0,a[6]||0,0);dummy.updateMatrix();im.setMatrixAt(i,dummy.matrix)});im.instanceMatrix.needsUpdate=true;im.castShadow=shadow;im.receiveShadow=true;vpm.add(im);}
    batches.forEach((list,mat)=>{for(const shadow of [true,false]){const subset=list.filter(a=>a[7]===shadow);if(subset.length)instances(unit,mat,subset,shadow)}});
    foliage.forEach(b=>instances(b.G,b.mat,b.list,b.shadow));
    const maxH=Math.max(...towers.map(b=>6.2+(b.tiers?b.tiers.reduce((s,t)=>s+t.f,0):b.f)*3.1))+1.4;
    root.userData.geo=geo;root.userData.materials=materials;root.userData.reference={towers:6,estimated:true,landscape:'two courtyards, public garden, diagonal paths, pergola'};
    return {root,g,radius:Math.max(Math.hypot(132,122)/2,maxH*.95),maxH};
  }
  global.GranReference={build};
})(window);
