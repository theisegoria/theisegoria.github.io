// Usage: node math-labs/dev/shoot3d.cjs <slug> [--ja] [--dark] [--width=1100] [--out=dir] [--wait=2500] [--q=query]
// Like shoot.cjs, but waits for 3D scenes, reports the backend, and also shoots each practice card.
const {chromium}=require('playwright');
const args=process.argv.slice(2),slug=args.find(a=>!a.startsWith('--'));
const ja=args.includes('--ja'),dark=args.includes('--dark');
const width=Number((args.find(a=>a.startsWith('--width='))||'--width=1100').split('=')[1]);
const wait=Number((args.find(a=>a.startsWith('--wait='))||'--wait=2500').split('=')[1]);
const out=(args.find(a=>a.startsWith('--out='))||'--out=/tmp/labshots').split('=')[1];
const port=process.env.LABPORT||8770;
const q=(args.find(a=>a.startsWith('--q='))||'--q=').slice(4);
(async()=>{require('fs').mkdirSync(out,{recursive:true});
 const b=await chromium.launch({args:['--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader','--ignore-gpu-blocklist']});
 const p=await b.newPage({viewport:{width,height:900},colorScheme:dark?'dark':'light',reducedMotion:'reduce'});
 const errs=[];p.on('pageerror',e=>errs.push('pageerror: '+e.message));p.on('console',m=>{if((m.type()==='error'||m.type()==='warning')&&!/favicon|lang\.js|analytics|Failed to load resource|GPU stall|swiftshader|WebGL|THREE\.WebGPURenderer|WebGPU is not available/i.test(m.text()))errs.push(m.type()+': '+m.text().slice(0,300));});
 await p.goto(`http://localhost:${port}/${ja?'ja/':''}${slug}/${q?'?'+q:''}`,{waitUntil:'load'});
 if(dark)await p.evaluate(()=>{document.documentElement.dataset.theme='dark';document.documentElement.style.colorScheme='dark';});
 const ids=await p.$$eval('[data-lab]',s=>s.map(x=>x.id));
 for(const id of ids){await p.locator('#'+id).scrollIntoViewIfNeeded();await p.waitForTimeout(400);
  const has3d=await p.$eval('#'+id,s=>!!s.querySelector('.lab3d'));if(has3d){await p.waitForFunction(i=>{const c=document.querySelector('#'+i+' .lab3d-canvas');return !document.querySelector('#'+i+' .lab3d.is-loading')&&(!c||c.dataset.backend);},id,{timeout:20000}).catch(()=>{});await p.waitForTimeout(wait);}
  const info=await p.$eval('#'+id,s=>{const c=s.querySelector('.lab3d-canvas');const plot=s.querySelector('.plot');return {backend:c?c.dataset.backend||'?':'2d',empty:!plot||plot.children.length===0,err:!!s.querySelector('.lab-error'),readout:(s.querySelector('.readout')||{}).textContent||'',q:(s.querySelector('.pr-q')||{}).textContent||'NO PRACTICE'};});
  await p.locator('#'+id+' .plot').screenshot({path:`${out}/${slug}${ja?'-ja':''}${dark?'-dark':''}-${id}.png`});
  const pr=p.locator('#'+id+' .practice');if(await pr.count())await pr.screenshot({path:`${out}/${slug}${ja?'-ja':''}${dark?'-dark':''}-${id}-practice.png`});
  console.log(`${id}: [${info.backend}] ${info.empty?'EMPTY ':''}${info.err?'ERROR ':''}| ${info.readout.slice(0,100)}\n   Q: ${info.q.slice(0,150)}`);}
 if(errs.length)console.log('ERRORS:\n'+[...new Set(errs)].slice(0,12).join('\n'));
 await b.close();})();
