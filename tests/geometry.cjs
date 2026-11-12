const fs=require('fs'),vm=require('vm'),assert=require('assert');
const THREE=require('three');
const ctx={THREE,console,matchMedia:()=>({matches:false}),document:{createElement:()=>({getContext:()=>({createLinearGradient:()=>({addColorStop(){}}),fillRect(){}})})}};ctx.window=ctx;vm.createContext(ctx);
for(const p of ['assets/gran-visual.js','assets/reference-project.js','assets/ryabinovaya-project.js','assets/photo-tower-project.js','assets/twin-quarter-project.js'])vm.runInContext(fs.readFileSync(p,'utf8'),ctx);
const h=fs.readFileSync('index.html','utf8');vm.runInContext(h.slice(h.indexOf('let MAT = null;'),h.indexOf('class Viewer'))+h.slice(h.indexOf('const PROJECTS = ['),h.indexOf('let modalViewer'))+';globalThis.PROJECTS=PROJECTS;globalThis.build=buildProject',ctx);
for(const [i,p] of ctx.PROJECTS.entries()){
 const m=ctx.build(p.spec);assert(m.root.userData.geo.length);let tris=0,meshes=0;
 m.root.updateMatrixWorld(true);m.root.traverse(o=>{if(!o.geometry)return;const a=o.geometry.attributes.position.array;assert(Array.from(a).every(Number.isFinite),'nonfinite mesh');if(o.isMesh){meshes++;tris+=(o.geometry.index?o.geometry.index.count:o.geometry.attributes.position.count)/3*(o.count||1)}if(o.isInstancedMesh)assert(Array.from(o.instanceMatrix.array).every(Number.isFinite),'bad instance');});
 if(i===0){assert.deepEqual(Object.keys(m.g),['vpm']);assert.equal(m.root.userData.reference.towers,6);assert(tris<600000,'reference geometry budget');assert(m.maxH>80&&m.maxH<100)}
 if(i===1){assert.deepEqual(Object.keys(m.g),['vpm']);const ref=m.root.userData.reference;assert(ref.brownWhiteTower&&ref.whitePortalMouldings&&ref.brickPodium&&ref.roofScreen&&ref.pergola&&ref.mixedPlanting);assert.equal(ref.hangingRings,2);assert(ref.estimated);assert(m.maxH>80&&m.maxH<85)}
 if(i===2){assert.deepEqual(Object.keys(m.g),['vpm']);assert.equal(m.root.userData.reference.blocks,2);assert.equal(m.root.userData.reference.towers,2);assert.equal(m.maxH,99.45);assert(tris<650000,'twin-quarter geometry budget');assert(meshes<100,'instanced facade draw budget');}
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
