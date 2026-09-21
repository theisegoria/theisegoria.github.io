// Usage: node math-labs/dev/shoot.cjs <slug> [--ja] [--dark] [--width=1100] [--out=dir]
// Screenshots every experiment on a topic page and reports errors and non-finite geometry.
const {chromium}=require('playwright');
const args=process.argv.slice(2),slug=args.find(a=>!a.startsWith('--'));
const ja=args.includes('--ja'),dark=args.includes('--dark');
const width=Number((args.find(a=>a.startsWith('--width='))||'--width=1100').split('=')[1]);
const out=(args.find(a=>a.startsWith('--out='))||'--out=/tmp/labshots').split('=')[1];
const port=process.env.LABPORT||8770;
const q=(args.find(a=>a.startsWith('--q='))||'--q=').slice(4);
(async()=>{require('fs').mkdirSync(out,{recursive:true});
 const b=await chromium.launch();const p=await b.newPage({viewport:{width,height:900},colorScheme:dark?'dark':'light',reducedMotion:'reduce'});
 const errs=[];p.on('pageerror',e=>errs.push('pageerror: '+e.message));p.on('console',m=>{if(m.type()==='error'&&!/favicon|lang\.js|analytics|Failed to load resource/.test(m.text()))errs.push('console: '+m.text());});
 await p.goto(`http://localhost:${port}/${ja?'ja/':''}${slug}/${q?'?'+q:''}`,{waitUntil:'load'});
 if(dark)await p.evaluate(()=>{document.documentElement.dataset.theme='dark';document.documentElement.style.colorScheme='dark';});
 const ids=await p.$$eval('[data-lab]',s=>s.map(x=>x.id));
 for(const id of ids){await p.locator('#'+id).scrollIntoViewIfNeeded();await p.waitForTimeout(350);
  const bad=await p.$eval('#'+id,s=>{const r=[];s.querySelectorAll('path,line,circle,ellipse,rect,text').forEach(e=>{for(const a of ['d','x1','x2','y1','y2','cx','cy','rx','ry','x','y','width','height']){const v=e.getAttribute(a);if(v&&/NaN|Infinity/.test(v))r.push(e.tagName+'.'+a);}});const plot=s.querySelector('.plot');return {bad:[...new Set(r)].slice(0,5),empty:!plot||plot.children.length===0,err:!!s.querySelector('.lab-error'),readout:(s.querySelector('.readout')||{}).textContent||''};});
  await p.locator('#'+id).screenshot({path:`${out}/${slug}${ja?'-ja':''}${dark?'-dark':''}-${id}.png`});
  console.log(`${id}: ${bad.empty?'EMPTY ':''}${bad.err?'ERROR ':''}${bad.bad.length?'NONFINITE '+bad.bad.join(','):''} | ${bad.readout.slice(0,140)}`);}
 if(errs.length)console.log('ERRORS:\n'+errs.slice(0,10).join('\n'));
 await b.close();})();
