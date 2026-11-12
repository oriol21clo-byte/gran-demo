const fs=require('fs'),vm=require('vm'),assert=require('assert');
const THREE=require('three');
const ctx={THREE,console,matchMedia:()=>({matches:false}),document:{createElement:()=>({getContext:()=>({createLinearGradient:()=>({addColorStop(){}}),fillRect(){}})})}};ctx.window=ctx;vm.createContext(ctx);
for(const p of ['assets/gran-visual.js','assets/reference-project.js','assets/ryabinovaya-project.js','assets/photo-tower-project.js','assets/twin-quarter-project.js'])vm.runInContext(fs.readFileSync(p,'utf8'),ctx);
const h=fs.readFileSync('index.html','utf8');vm.runInContext(h.slice(h.indexOf('let MAT = null;'),h.indexOf('class Viewer'))+h.slice(h.indexOf('const PROJECTS = ['),h.indexOf('let modalViewer'))+';globalThis.PROJECTS=PROJECTS;globalThis.build=buildProject',ctx);
for(const [i,p] of ctx.PROJECTS.entries()){
 const m=ctx.build(p.spec);assert(m.root.userData.geo.length);let tris=0,meshes=0;
 m.root.updateMatrixWorld(true);m.root.traverse(o=>{if(!o.geometry)return;const a=o.geometry.attributes.position.array;assert(Array.from(a).every(Number.isFinite),'nonfinite mesh');if(o.isMesh){meshes++;tris+=(o.geometry.index?o.geometry.index.count:o.geometry.attributes.position.count)/3*(o.count||1)}if(o.isInstancedMesh)assert(Array.from(o.instanceMatrix.array).every(Number.isFinite),'bad instance');});
 if(i===0){assert.deepEqual(Object.keys(m.g),['vpm']);assert.equal(m.root.userData.reference.towers,6);assert(tris<600000,'reference geometry budget');assert(m.maxH>80&&m.maxH<100)}
 if(i===1){assert.deepEqual(Object.keys(m.g),['vpm']);const ref=m.root.userData.reference;assert(ref.brownWhiteTower&&ref.whitePortalMouldings&&ref.brickPodium&&ref.roofScreen&&ref.pergola&&ref.mixedPlanting);assert.equal(ref.hangingRings,2);assert(ref.estimated);assert(m.maxH>80&&m.maxH<85);
  const brownWidthHit=new THREE.Raycaster(new THREE.Vector3(30,40,8),new THREE.Vector3(-1,0,0)).intersectObject(m.root,true);assert(brownWidthHit.length&&brownWidthHit[0].point.x<9,'brown tower is a thin blade, not a deep rectangular slab');
  const roofHits=[[-7.86,-8],[-8.41,-2],[-8.30,4],[-7.53,10]].map(([x,z])=>{const h=new THREE.Raycaster(new THREE.Vector3(x,90,z),new THREE.Vector3(0,-1,0)).intersectObject(m.root,true);assert(h.length,'roof blade exists');return h[0].point.y});
  assert(roofHits.every(y=>y>76&&y<m.maxH),'four roof faces stand below brown crown');
  const shoulderHit=new THREE.Raycaster(new THREE.Vector3(-2,90,12.9),new THREE.Vector3(0,-1,0)).intersectObject(m.root,true);assert(shoulderHit.length&&shoulderHit[0].point.y>77,'raised white shoulder exists');
  for(const side of [-1,1]){const hit=new THREE.Raycaster(new THREE.Vector3(-4,71,side*20),new THREE.Vector3(0,0,-side)).intersectObject(m.root,true);assert(hit.length&&hit[0].distance<7,'upper storey end wall closes the recess on both sides');}
  const roomHit=new THREE.Raycaster(new THREE.Vector3(-3,90,0),new THREE.Vector3(0,-1,0)).intersectObject(m.root,true);assert(roomHit.length&&roomHit[0].point.y>82,'service room projects in front of narrow brown roof');
  // The forward roof is a clear wedge; blades must not occupy it.
  for(const [x,z] of [[-11,9],[-11,-1]]){const h=new THREE.Raycaster(new THREE.Vector3(x,90,z),new THREE.Vector3(0,-1,0)).intersectObject(m.root,true);assert(h.length&&h[0].point.y<67,'triangular roof terrace is unobstructed');}
  const lowHit=new THREE.Raycaster(new THREE.Vector3(-30,30,-8),new THREE.Vector3(1,0,0)).intersectObject(m.root,true),highHit=new THREE.Raycaster(new THREE.Vector3(-30,30,8),new THREE.Vector3(1,0,0)).intersectObject(m.root,true);assert(lowHit.length&&highHit.length);assert(highHit[0].point.x<lowHit[0].point.x-3,'white facade projects farther at positive Z, matching reference roof wedge');
  const whiteBody=m.g.vpm.children.find(o=>o.isMesh&&!o.isInstancedMesh&&o.geometry.type==='ExtrudeGeometry'&&new THREE.Box3().setFromObject(o).getSize(new THREE.Vector3()).y>60);assert(whiteBody,'white facade volume exists');
  const facetNormals=[-7,0,10].map(z=>{const hit=new THREE.Raycaster(new THREE.Vector3(-30,30,z),new THREE.Vector3(1,0,0)).intersectObject(whiteBody);assert(hit.length,'faceted front is closed');return hit[0].face.normal;});assert(facetNormals[0].dot(facetNormals[1])<.998&&facetNormals[1].dot(facetNormals[2])<.998,'three front facets turn gradually in plan');
  assert(tris<300000&&meshes<100,'refined tower and landscape stay within geometry/draw budget');
  const podiumRoof=new THREE.Raycaster(new THREE.Vector3(-21,20,4),new THREE.Vector3(0,-1,0)).intersectObject(m.root,true);assert(podiumRoof.length&&podiumRoof[0].point.y>6&&podiumRoof[0].point.y<7,'projecting podium has its own roof in front of the tower');
  const podiumWall=new THREE.Raycaster(new THREE.Vector3(-40,3,4),new THREE.Vector3(1,0,0)).intersectObject(m.root,true);assert(podiumWall.length&&podiumWall[0].point.x<-21,'projecting podium is closed down to ground level');
 }
 if(i===2){assert.deepEqual(Object.keys(m.g),['vpm']);assert.equal(m.root.userData.reference.blocks,2);assert.equal(m.root.userData.reference.towers,2);assert.equal(m.maxH,99.45);assert(tris<650000,'twin-quarter geometry budget');assert(meshes<100,'instanced facade draw budget');
  const roofY=x=>{const hits=new THREE.Raycaster(new THREE.Vector3(x,130,-44),new THREE.Vector3(0,-1,0)).intersectObject(m.root,true);assert(hits.length,'tower roof hit');return hits[0].point.y};
  assert(roofY(-26)>roofY(-14)+8,'red tower high edge faces away from central passage');
  assert(roofY(26)>roofY(14)+8,'mint tower high edge faces away from central passage');
 }
 if(i===3){assert.deepEqual(Object.keys(m.g),['vpm']);assert.equal(m.root.userData.reference.name,'Рябиновая');assert.equal(m.maxH,89.3);assert.deepEqual(Array.from(m.root.userData.reference.terraceLevels),[69,77.1]);assert.equal(m.root.userData.reference.mainMasses,2);assert(m.root.userData.reference.wedge);assert(m.root.userData.reference.estimated);assert.equal(m.root.userData.reference.connector.type,'ground-glazed');assert(m.root.userData.reference.connector.curvedFront);assert(m.root.userData.reference.connector.roofOpaque);const upward=new THREE.Raycaster(new THREE.Vector3(-4.3,1,-4),new THREE.Vector3(0,1,0));const linkHits=upward.intersectObject(m.root,true);assert(linkHits.length,'ground connector roof exists');assert(linkHits[0].point.y>3&&linkHits[0].point.y<5,'one-storey roof, not elevated bridge');const frontRay=new THREE.Raycaster(new THREE.Vector3(-4,1.7,17),new THREE.Vector3(0,0,-1));const wallHits=frontRay.intersectObject(m.root,true);assert(wallHits.length&&wallHits[0].distance<14,'glazing closes the connector down to ground level');assert(m.root.userData.reference.slopedRoof);assert(m.root.userData.reference.paverGeometry);assert.equal(m.root.userData.reference.plantedIslands,2);assert(tris<600000,'detailed reconstruction geometry budget');}
 console.log(JSON.stringify({project:i+1,triangles:Math.round(tris),meshes,maxH:m.maxH}));
}
const rects=ctx.GranVisual.rectangles([[0,-31,160,10],[0,35,160,10],[-37,2,10,160],[37,2,10,160]],.03,new THREE.MeshBasicMaterial());
const a=rects.geometry.attributes.position.array;let area=0;for(let i=0;i<a.length;i+=9){const x=new THREE.Vector3(...a.slice(i,i+3)),y=new THREE.Vector3(...a.slice(i+3,i+6)),z=new THREE.Vector3(...a.slice(i+6,i+9));area+=y.sub(x).cross(z.sub(x)).length()/2;}
assert.equal(area,6000,'road union area');
// A crossing sidewalk must leave the carriageway completely clear.
const cut=ctx.GranVisual.rectangles([[0,0,20,4]],.09,new THREE.MeshBasicMaterial(),[[0,0,6,20]]);
const cp=cut.geometry.attributes.position.array;let ca=0;
for(let i=0;i<cp.length;i+=9){const x=new THREE.Vector3(...cp.slice(i,i+3)),y=new THREE.Vector3(...cp.slice(i+3,i+6)),z=new THREE.Vector3(...cp.slice(i+6,i+9));const center=x.clone().add(y).add(z).divideScalar(3);assert(Math.abs(center.x)>=3,'sidewalk covers road');ca+=y.sub(x).cross(z.sub(x)).length()/2;}
assert.equal(ca,56,'sidewalk area minus crossing');

const mat=vm.runInContext('mats()',ctx);assert.equal(mat.npm.color.getHex(),mat.npmTree.color.getHex());
const fakeRenderer={shadowMap:{}};const rig=ctx.GranVisual.create(new THREE.Scene(),fakeRenderer,false);for(const mode of ['npm','vpm','cim']){ctx.GranVisual.apply(rig,mode);assert.equal(fakeRenderer.shadowMap.enabled,mode!=='cim')}
console.log('Geometry, road union, mode styles: PASS');
