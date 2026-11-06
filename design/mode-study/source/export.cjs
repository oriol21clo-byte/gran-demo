const fs=require('fs'),vm=require('vm'),THREE=require('three');
fs.mkdirSync('work/mode-study',{recursive:true});
const html=fs.readFileSync('index.html','utf8');
const modelCode=html.slice(html.indexOf('let MAT = null;'),html.indexOf('class Viewer'));
const hero=html.slice(html.indexOf('  const M=(c,o='),html.indexOf('  function tris(g)'));
const setup=`const scene=new THREE.Scene();${modelCode}\n${hero}\nconst p=buildProject({site:{w:1,d:1},bim:true,facade:1,buildings:B.filter(b=>!b.podium).map(b=>({x:b.x,z:b.z,w:b.w,d:b.d,f:b.f,y0:b.y0/FH*3.2,kind:'res'}))});const bG=new THREE.Group();p.g.cim.children.filter(o=>o.isInstancedMesh).forEach(o=>bG.add(o));bG.scale.y=FH/3.2;cimAR.add(bG);arMat.opacity=.035;arEdge.opacity=.45;globalThis.groups={ctx,npm:gNPM,vpm:gVPM,cim:gCIM};globalThis.palette=MAT;globalThis.cars=cars;globalThis.cimParts={cimAR,cimPS,cimBIO};`;
const c={THREE,console};vm.createContext(c);vm.runInContext(setup,c);const names=new Map(Object.entries(c.palette).filter(([k,v])=>v&&v.color).map(([k,v])=>[v,k]));
for(const mode of ['npm','vpm','cim']){
 c.cars.visible=mode==='vpm';const objects=[];
 for(const [group,root] of [['context',c.groups.ctx],[mode,c.groups[mode]]]){
 root.updateMatrixWorld(true);root.traverse(o=>{if(!o.isMesh&&!o.isLine)return;let p=o;while(p){if(p.visible===false)return;p=p.parent;}const g=o.geometry,pos=g.attributes.position;if(!pos)return;const m=o.material;for(let instance=0;instance<(o.isInstancedMesh?o.count:1);instance++){const mat=o.matrixWorld.clone();if(o.isInstancedMesh){const t=new THREE.Matrix4();o.getMatrixAt(instance,t);mat.multiply(t)}const verts=[];for(let i=0;i<pos.count;i++){const v=new THREE.Vector3().fromBufferAttribute(pos,i).applyMatrix4(mat);verts.push([v.x,-v.z,v.y])}const idx=g.index?Array.from(g.index.array):Array.from({length:pos.count},(_,i)=>i);let role=names.get(m)||group;if(group==='cim'&&!names.has(m)){let node=o;while(node){const part=Object.entries(c.cimParts).find(([k,v])=>v===node);if(part){role=part[0];break}node=node.parent}}objects.push({verts,idx,color:m.color?[m.color.r,m.color.g,m.color.b]:[.5,.5,.5],roughness:m.roughness??.85,metalness:m.metalness??0,opacity:m.transparent?m.opacity:1,role,line:!!o.isLine,segments:!!o.isLineSegments})}})
 }fs.writeFileSync(`work/mode-study/${mode}.json`,JSON.stringify(objects));console.log(mode,objects.length)
}
