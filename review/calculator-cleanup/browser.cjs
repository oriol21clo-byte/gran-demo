const fs=require('fs'),path=require('path'),{chromium}=require('playwright');
(async()=>{const b=await chromium.launch({executablePath:'/usr/bin/chromium',args:['--no-sandbox','--use-angle=swiftshader','--enable-unsafe-swiftshader']});try{
 const p=await b.newPage({viewport:{width:1440,height:1000}}),errors=[];p.on('pageerror',e=>errors.push(e.message));
 await p.addInitScript(()=>{window.__frames=[];window.requestAnimationFrame=cb=>(__frames.push(cb),__frames.length)});
 await p.goto(process.env.GRAN_REVIEW_URL||'http://127.0.0.1:8058/',{waitUntil:'load'});
 await p.addStyleTag({content:'html{scroll-behavior:auto!important}'});
 await p.evaluate(()=>{const a=document.querySelector('#cArea');a.value='24000';a.dispatchEvent(new Event('change',{bubbles:true}))});
 for(const [name,width]of [['desktop',1440],['mobile',390]]){
  await p.setViewportSize({width,height:1000});
  const clip=await p.evaluate(()=>{const el=document.querySelector('#calc .res2');el.scrollIntoView({block:'center'});const r=el.getBoundingClientRect();return{x:r.x,y:r.y,width:r.width,height:r.height}});
  await p.screenshot({path:path.join(__dirname,name+'.png'),clip,animations:'disabled'});
  const result=await p.evaluate(()=>({formulaVisible:/₽\/м²|×|Цена =|коэффициент площади/.test(document.querySelector('#calc .res2').innerText),rows:document.querySelectorAll('#rLines>div').length,total:document.querySelector('#rTotal').textContent,overflow:document.documentElement.scrollWidth>innerWidth}));
  console.log(JSON.stringify({name,...result}));if(result.formulaVisible||result.rows!==3||result.overflow)throw Error('Calculator presentation check failed');
 }
 console.log(JSON.stringify({errors}));if(errors.length)throw Error('Browser JS errors');
 }finally{await b.close()}})().catch(e=>{console.error(e);process.exit(1)});
