/* Project 3, reconstructed from eight user-supplied views, 2026-11-12.
   Plans, hidden elevations and storey counts are visual estimates, not survey data. */
(function(global){
 'use strict';if(!global.THREE)return;const T=global.THREE;
 function build(){
  const root=new T.Group(),vpm=new T.Group(),geo=[],materials=[],batches=new Map(),dummy=new T.Object3D();root.add(vpm);
  const mat=(c,o={})=>{const m=new T.MeshStandardMaterial(Object.assign({color:new T.Color(c).convertSRGBToLinear(),roughness:.78},o));materials.push(m);return m};
  const M={dark:mat(0x303a3d),frame:mat(0x424d51),red:mat(0xb6423d),pink:mat(0xcea5a0),mint:mat(0xa4c8bf),green:mat(0x668e83),white:mat(0xe2e3db),roof:mat(0x9ca3a1),coping:mat(0x727e7f),pave:mat(0xbfc7c5),joint:mat(0x929f9d),lawn:mat(0x859d62),play:mat(0xc39768),walk:mat(0xa56c64),wood:mat(0xa3784d),trunk:mat(0x756553),flower:mat(0xbb514d),lamp:mat(0xd9dfc9)};
  const glass=[0xaebfc2,0xc9d2ce,0x758e97,0x98a9ae,0xd2d4bf,0x5f7780].map(c=>GranVisual.glass(mat(c,{roughness:.34,metalness:.08})));
  const leaves=[0x78935e,0x94ac79,0xa8b78b,0x658260,0x9f6553].map(c=>mat(c,{roughness:1,flatShading:true}));
  const unit=new T.BoxGeometry(1,1,1),ball=new T.IcosahedronGeometry(1,1),cyl=new T.CylinderGeometry(1,1,1,6),cone=new T.ConeGeometry(1,1,7);geo.push(unit,ball,cyl,cone);
  function stamp(G,m,x,y,z,w,h,d,angle=0){const key=G.uuid+':'+m.uuid;let b=batches.get(key);if(!b)batches.set(key,b={G,m,list:[]});dummy.position.set(x,y,z);dummy.scale.set(w,h,d);dummy.rotation.set(0,angle,0);dummy.updateMatrix();b.list.push(dummy.matrix.clone());}
  const box=(m,x,y,z,w,h,d,a=0)=>stamp(unit,m,x,y,z,w,h,d,a);
  function polygon(points,y,m){const shape=new T.Shape();points.forEach(([x,z],i)=>i?shape.lineTo(x,-z):shape.moveTo(x,-z));shape.closePath();const G=new T.ShapeGeometry(shape);G.rotateX(-Math.PI/2);geo.push(G);const o=new T.Mesh(G,m);o.position.y=y;o.receiveShadow=true;vpm.add(o);}
  function ribbon(points,width,y,m){const c=new T.CatmullRomCurve3(points.map(([x,z])=>new T.Vector3(x,y,z))),ps=c.getPoints(48),a=[],b=[];ps.forEach((p,i)=>{const d=ps[Math.min(i+1,ps.length-1)].clone().sub(ps[Math.max(0,i-1)]).normalize();a.push([p.x-d.z*width/2,p.z+d.x*width/2]);b.push([p.x+d.z*width/2,p.z-d.x*width/2]);});polygon(a.concat(b.reverse()),y,m);return ps;}
  const FH=3.1,BASE=5.6;
  // A facade is built from wall piers and spandrels surrounding recessed glazing.
  // This avoids painting a generic window grid onto a solid coloured box.
  function building(x,z,w,d,f,finish,kind='grid'){
   const top=BASE+f*FH;
   box(M.frame,x,BASE+f*FH/2,z,w-.30,f*FH,d-.30);
   [[1,0],[-1,0],[0,1],[0,-1]].forEach(([nx,nz],face)=>{
    const L=nx?d:w,half=(nx?w:d)/2,n=Math.max(2,Math.round(L/(kind==='tower'?2.35:2.7))),pitch=L/n;
    for(let k=0;k<f;k++){
     const y=BASE+k*FH;
     box(kind==='ribs'?M.dark:finish,x+nx*(half+.05),y+.24,z+nz*(half+.05),nx?.28:L,.48,nx?L:.28);
     for(let j=0;j<n;j++){
      const t=-L/2+(j+.5)*pitch,xx=x+(nx?nx*half:t),zz=z+(nz?nz*half:t),ww=pitch-(kind==='stripe'?.32:.62),wh=kind==='stripe'?2.35:2.12;
      const gm=glass[(j*3+k*7+face*2)%glass.length];box(gm,xx+nx*.025,y+1.65,zz+nz*.025,nx?.10:ww,wh,nx?ww:.10);
      box(M.frame,xx+nx*.12,y+1.65,zz+nz*.12,nx?.07:.065,wh,nx?.065:.07);
      box(M.frame,xx+nx*.13,y+1.28,zz+nz*.13,nx?.08:ww,.055,nx?ww:.08);
     }
    }
    if(kind==='ribs')for(let j=0;j<n;j++){const t=-L/2+(j+.18)*pitch;box(M.white,x+(nx?nx*(half+.10):t),BASE+f*FH/2,z+(nz?nz*(half+.10):t),nx?.19:pitch*.25,f*FH,nx?pitch*.25:.19);}
    if(kind!=='stripe')for(let j=0;j<=n;j++){
     const t=-L/2+j*pitch,xx=x+(nx?nx*(half+.10):t),zz=z+(nz?nz*(half+.10):t),pw=kind==='ribs'?.52:kind==='tower'?.22:.40;
     box(finish,xx,BASE+f*FH/2,zz,nx?.35:pw,f*FH,nx?pw:.35);
    }
    if(kind==='stripe')for(let k=0;k<=f;k++)box(finish,x+nx*(half+.36),BASE+k*FH,z+nz*(half+.36),nx?.75:w+.75,.42,nx?d+.75:.75);
    if(kind==='ribs')for(let j=0;j<n;j++){const t=-L/2+(j+.5)*pitch;box(M.dark,x+(nx?nx*(half+.13):t),top-.55,z+(nz?nz*(half+.13):t),nx?.12:pitch-.6,1.1,nx?pitch-.6:.12);}
   });
   box(M.roof,x,top+.08,z,w-.4,.16,d-.4);
   for(const side of [-1,1]){box(finish,x+side*(w/2-.10),top+.35,z,.20,.65,d);box(finish,x,top+.35,z+side*(d/2-.10),w,.65,.20);}
   box(M.coping,x+.6,top+.28,z-1.5,Math.min(4,w*.3),.4,Math.min(5,d*.3));
   if(kind==='stripe'){
    // Broad opaque crown and three receding terrace bands at the lower towers.
    box(finish,x,top+1.0,z,w,1.5,d);
    for(let i=1;i<=2;i++)box(finish,x-i*.55,top+1.0+i*1.15,z,d>w?w-1.1*i:w-.5*i,.70,d-1.8*i);
   }
  }
  function tower(x,z,mirror){
   const w=16,d=27,n=5;
   // Five full-height slices create a stepped knife-edge skyline on both ends.
   for(let j=0;j<n;j++){
    const f=26+j,sx=x+mirror*(-w/2+(j+.5)*w/n),top=BASE+f*FH;
    box(M.dark,sx,(BASE+top)/2,z,w/n,top-BASE,d);
    box(M.coping,sx,top+.78,z,w/n+.10,.13,d+.18);
    box(M.frame,sx,top+.38,z-d/2,w/n,.72,.14);box(M.frame,sx,top+.38,z+d/2,w/n,.72,.14);
   }
   [[1,0],[-1,0],[0,1],[0,-1]].forEach(([nx,nz],face)=>{
    const L=nx?d:w,n=nx?11:7,half=(nx?w:d)/2,pitch=L/n;
    for(let j=0;j<n;j++){
     const t=-L/2+(j+.5)*pitch,xx=x+(nx?nx*half:t),zz=z+(nz?nz*half:t);
     const tier=nx?(nx*mirror>0?4:0):Math.min(4,Math.floor((mirror*t+w/2)/w*5)),f=26+tier;
     for(let k=0;k<f;k++){
      const y=BASE+k*FH;box(glass[(k*3+j*7+face)%glass.length],xx+nx*.035,y+1.65,zz+nz*.035,nx?.10:pitch-.52,2.18,nx?pitch-.52:.10);
      box(M.frame,xx+nx*.16,y+1.65,zz+nz*.16,nx?.10:.055,2.18,nx?.055:.10);
      box(M.coping,xx+nx*.18,y+.20,zz+nz*.18,nx?.42:pitch,.18,nx?pitch:.42);
     }
     const p=t-pitch/2;box(M.frame,x+(nx?nx*(half+.17):p),BASE+f*FH/2,z+(nz?nz*(half+.17):p),nx?.35:.17,f*FH,nx?.17:.35);
    }
   });
  }
  function tree(x,z,i,small=false){const h=small?2.1:5.2+(i%4)*.55;stamp(cyl,M.trunk,x,h*.44,z,.11,h*.88,.11);const leaf=leaves[i%leaves.length];stamp(ball,leaf,x,h*.83,z,h*.27,h*.38,h*.27);stamp(ball,leaves[(i+1)%4],x+.6,h*.66,z-.35,h*.20,h*.28,h*.20);}
  function block(center,mirror,cool){
   const X=x=>center+x*mirror,accent=cool?M.mint:M.pink,strong=cool?M.green:M.red;
   box(M.lawn,center,-.65,0,64,1.3,137);
   // Perimeter podiums form one continuous base, leaving the two courts open.
   const pods=[[-24,0,14,122],[24,0,14,122],[0,56,34,14],[0,-56,34,10]];
   pods.forEach(([x,z,w,d])=>{
    box(M.dark,X(x),BASE/2,z,w,BASE,d);box(M.frame,X(x),BASE-.12,z,w+.4,.32,d+.4);
    [[1,0],[-1,0],[0,1],[0,-1]].forEach(([nx,nz])=>{const L=nx?d:w,half=(nx?w:d)/2,n=Math.round(L/3.8),p=L/n;for(let j=0;j<n;j++){const t=-L/2+(j+.5)*p,xx=X(x)+(nx?nx*half:t),zz=z+(nz?nz*half:t);box(glass[1],xx+nx*.04,2.6,zz+nz*.04,nx?.10:p-.6,4.5,nx?p-.6:.10);box(M.frame,xx+nx*.12,2.6,zz+nz*.12,nx?.16:.07,4.5,nx?.07:.16);}});
   });
   // Outer elevation: four distinct adjoining sections, including ribbed ends.
   [[-42,11,'grid'],[-17,14,'ribs'],[9,10,'grid'],[35,6,'ribs']].forEach(([z,f,kind],i)=>building(X(-24),z,14,24,f,cool?[M.mint,M.white,M.green,M.mint][i]:[M.pink,M.pink,M.red,M.red][i],kind));
   // The reference street view has the high edges outside, descending inward.
   tower(X(24),-44,-mirror);
   // Dark three-storey skirt below the tall tower, then street-facing infill.
   building(X(24),-34,14,43,3,cool?M.green:M.dark);
   building(X(24),2,14,27,cool?10:9,accent,'grid');
   building(X(24),27,14,23,6,cool?M.white:M.pink,'grid');
   building(X(24),49,14,20,13,accent,'stripe');
   building(X(0),56,34,14,6,strong,'ribs');
   building(X(0),-56,34,10,2,cool?M.green:M.dark);
   // Long paved walks along both residential fronts, central planted/play strip.
   box(M.lawn,center,.035,0,31,.07,100);
   for(const x of [-13.7,13.7]){box(M.pave,X(x),.10,0,3.4,.08,100);for(let z=-49;z<50;z+=1.3)for(let r=0;r<3;r++)box((r+Math.round(z*10))%3?M.joint:M.white,X(x+(r-1)*.8),.15,z,.32,.025,.60);}
   const path=ribbon([[-5,-49],[4,-30],[-3,-12],[4,6],[-4,25],[3,49]].map(([x,z])=>[X(x),z]),2.3,.17,M.walk);
   [-35,-13,12,35].forEach((z,i)=>{
    const x=(i%2?-4:4),cx=X(x),cz=z;
    const points=Array.from({length:28},(_,j)=>{const a=j/28*Math.PI*2;return[cx+Math.cos(a)*(5.4+Math.sin(a*2)*.7),cz+Math.sin(a)*9]});polygon(points,.14,M.play);
    // Playground frames, climbing cages, swings, sand and timber seating.
    if(i%2===0){for(const dx of [-2,2]){box(M.wood,cx+dx,1.25,cz,.12,2.5,.12);box(M.wood,cx+dx,1.25,cz+3,.12,2.5,.12);}box(M.wood,cx,2.5,cz,4.2,.14,.14);for(const dx of [-1,1]){box(M.frame,cx+dx,1.7,cz,.035,1.6,.035);box(M.wood,cx+dx,.8,cz,.65,.12,.45);}}
    else{for(let j=0;j<9;j++){const a=j/9*Math.PI*2;box(M.wood,cx+Math.cos(a)*1.6,1.6,cz+Math.sin(a)*1.6,.10,3.2,.10);}for(const y of [.65,1.3,2,2.7])box(M.wood,cx,y,cz,3.2,.10,.10);box(M.white,cx,.4,cz+4,2,.15,1.8);}
    for(let j=0;j<15;j++){const a=j/15*Math.PI*2;stamp(ball,M.flower,cx+Math.cos(a)*5.8,.32,cz+Math.sin(a)*9.3,.22,.22,.22);}
   });
   for(let i=0;i<13;i++){const z=-46+i*7.7;tree(X(i%2?-8:8),z,i+(cool?2:0));if(i%2===0){box(M.dark,X(-10),2,z,.065,4,.065);box(M.lamp,X(-10),4,z,.45,.15,.40);}}
   for(let i=0;i<9;i++){const z=-53+i*13;tree(X(34),z,i);box(M.pave,X(32),.08,z,7,.08,1.3);box(M.walk,X(31.5),.09,z+3,2,.10,3);}
   // Entrance approach strips and benches, retained on both sides of each court.
   for(let z=-43;z<48;z+=14)for(const x of [-16,16]){box(M.walk,X(x),.16,z,3,.08,2.2);box(M.wood,X(x*.56),.6,z,2.2,.12,.65);for(const s of [-.8,.8])box(M.frame,X(x*.56)+s,.3,z,.08,.6,.5);}
   path.forEach((p,i)=>{if(i%3===0)stamp(ball,leaves[i%4],p.x+(i%2?2:-2),.4,p.z,.35,.5,.35)});
  }
  block(-44,1,false);block(44,-1,true);
  batches.forEach(({G,m,list})=>{const mesh=new T.InstancedMesh(G,m,list.length);list.forEach((matrix,i)=>mesh.setMatrixAt(i,matrix));mesh.instanceMatrix.needsUpdate=true;mesh.castShadow=mesh.receiveShadow=true;vpm.add(mesh)});
  root.userData.geo=geo;root.userData.materials=materials;root.userData.reference={name:'Project 3 — twin courtyards',estimated:true,blocks:2,towers:2,steppedCrowns:5,maxHeight:99.45,sourceViews:8};
  return{root,g:{vpm},radius:105,maxH:99.45};
 }
 global.GranTwinQuarter={build};
})(window);
