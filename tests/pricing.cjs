const fs=require('fs'),vm=require('vm'),assert=require('assert');
const h=fs.readFileSync('index.html','utf8'),c={};vm.createContext(c);
vm.runInContext(h.slice(h.indexOf('const PRICING ='),h.indexOf('/* ===================== 3D:'))+';this.price=calcPrice;this.factor=areaFactor',c);
for(const [area,factor] of [[0,1.25],[49999,1.25],[50000,1],[99999,1],[100000,.9],[199999,.9],[200000,.85],[400000,.85]])assert.equal(c.factor(area),factor);
const p={area:10000,fac:0,land:0,bim:false,models:{npm:true,vpm:true,cim:true}};
let r=c.price(p);assert.equal(r.total,837500);assert.deepEqual(Array.from(r.lines,x=>x.sum),[137500,262500,437500]);assert.equal(r.disc,0);assert.equal(r.lines.length,3);
r=c.price({...p,fac:1,land:1,bim:true});assert.equal(r.lines[0].sum,151593.75);assert.equal(r.lines[1].sum,289406.25);assert.equal(r.lines[2].sum,385875);assert.equal(r.total,826875);
for(const area of [49999,50000,99999,100000,199999,200000])for(const [key,rate] of [['npm',11],['vpm',21],['cim',35]])for(let fac=0;fac<3;fac++)for(let land=0;land<3;land++)for(const bim of [false,true]){
 const r=c.price({...p,area,fac,land,bim,models:{[key]:true}});const expected=Math.round(area*rate*c.factor(area)*[1,1.05,1.1][fac]*[1,1.05,1.1][land]*(key==='cim'&&bim?.8:1)*100)/100;assert.equal(r.total,expected);
}
assert.equal(c.price({...p,models:{}}).total,0);assert.equal(c.price({...p,area:0}).total,0);
console.log('Pricing rates, area boundaries, all coefficient combinations, BIM isolation, no extra fees/discounts: PASS');
