const fs=require('fs'),assert=require('assert'),{JSDOM}=require('jsdom');
const html=fs.readFileSync('index.html','utf8'),dom=new JSDOM(html,{url:'http://localhost/',runScripts:'outside-only',pretendToBeVisual:true}),w=dom.window;
if(process.argv.includes('--webgl-blocked'))w.THREE={WebGLRenderer:class{constructor(){throw new Error('WebGL context unavailable')}}};
w.matchMedia=()=>({matches:false,addListener(){},addEventListener(){}});w.IntersectionObserver=class{observe(){} unobserve(){} disconnect(){}};w.ResizeObserver=class{observe(){} disconnect(){}};
w.scrollTo=()=>{};w.HTMLElement.prototype.scrollIntoView=function(){};w.HTMLCanvasElement.prototype.getContext=()=>null;
const unexpected=[];w.addEventListener('error',e=>unexpected.push(String(e.error)));w.console.error=()=>{};w.console.warn=()=>{};
for(const code of html.matchAll(/<script(?:\s[^>]*)?>([\s\S]*?)<\/script>/g)){if(code[1].trim())w.eval(code[1]);}
const d=w.document;assert.equal(d.querySelectorAll('#why-us .why-metric').length,4);assert.equal(d.querySelectorAll('#why-us .why-metric strong')[2].textContent,'80+');assert.equal(d.querySelectorAll('#why-us .why-metric strong')[3].textContent,'20+');assert(!d.querySelector('#calc > .wrap > .label .demo-tag'));
assert.equal(d.querySelectorAll('#projList .prj').length,4);
const cards=[...d.querySelectorAll('#projList .prj')];
assert.equal(cards[0].querySelector('.nda dd').textContent,'Ав******ая');
assert.deepEqual(cards.slice(1).map(c=>c.querySelector('.nda>div+div dd').textContent),['ул. Баб***ая','ул. Авто****ая','ул. Реб***ая']);
assert(cards[1].textContent.includes('Многоквартирный жилой дом с подземной автостоянкой'));
assert(cards[2].textContent.includes('со встроенно-пристроенными помещениями'));
assert(cards[3].textContent.includes('Офисный центр с подземным паркингом'));
const expected=[['—','—','—'],['11 570,4','—','0,3306'],['104 403,8','99,45','2,8501'],['32 817,5','89,3','0,746']];
cards.forEach((c,i)=>{assert.deepEqual([...c.querySelectorAll('.prj-overlay strong')].map(e=>e.textContent),expected[i]);assert.deepEqual([...c.querySelectorAll('.prj-overlay span')].map(e=>e.textContent),['СПП в ГНС, м²','Высота, м','Участок, га']);d.querySelector('[data-open="'+i+'"]').click();assert.deepEqual([...d.querySelectorAll('#modalMetrics strong')].map(e=>e.textContent),expected[i]);d.querySelector('#mClose').click()});
assert(!d.querySelector('#projList').textContent.includes('NDA'));
const areaField=d.querySelector('#cArea'),areaSlider=d.querySelector('#cAreaR');assert.equal(areaField.min,'5000');areaField.value=100;areaField.dispatchEvent(new w.Event('change',{bubbles:true}));assert.equal(areaField.value,'5000');assert.equal(+areaSlider.value,0);areaSlider.value=0;areaSlider.dispatchEvent(new w.Event('input',{bubbles:true}));assert.equal(areaField.value,'5000');assert(areaSlider.getAttribute('aria-valuetext').includes('5'));areaSlider.value=100;areaSlider.dispatchEvent(new w.Event('input',{bubbles:true}));assert.equal(areaField.value,'400000');

assert(!d.querySelector('#modal [data-modes]'));assert.equal(d.querySelectorAll('#calcStage [data-m]').length,3);
d.querySelector('[data-open="0"]').click();assert.equal(d.querySelector('#modal').hidden,false);assert(d.querySelector('#mTitle').textContent.includes('Реконструкция'));d.querySelector('#mClose').click();assert(d.querySelector('#modal').hidden);
const read=()=>d.querySelector('#rTotal').textContent;
assert(/₽/.test(read()));console.log('Initial price:',read());
for(const area of [5000,12000,45000,400000]){const input=d.querySelector('#cArea');input.value=area;input.dispatchEvent(new w.Event('change',{bubbles:true}));assert(/₽/.test(read()));assert(!read().includes('NaN'));console.log('Area',area,'price',read());}
for(const id of ['cNPM','cVPM','cCIM']){d.getElementById(id).checked=false;d.getElementById(id).dispatchEvent(new w.Event('input',{bubbles:true}));}assert.equal(read(),'—');
d.getElementById('cCIM').checked=true;d.getElementById('cCIM').dispatchEvent(new w.Event('input',{bubbles:true}));assert(/₽/.test(read()));
assert(!d.querySelector('#grpNV').hidden);assert(!d.querySelector('#grpC').hidden);
for(const a of d.querySelectorAll('a[href^="#"]')){const id=a.getAttribute('href').slice(1);if(id)assert(d.getElementById(id),'missing anchor '+id)}
setTimeout(()=>{assert.deepEqual(unexpected,[]);console.log('DOM, navigation, modal VPM-only, calculator, unavailable-WebGL fallback: PASS');w.close()},700);
