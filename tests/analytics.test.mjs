import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import {readFileSync} from 'node:fs';
const source=readFileSync(new URL('../assets/analytics.js',import.meta.url),'utf8');
function run({privacy={},embedded=false,hostname='theisegoria.github.io',storage,clock,random,readyState='complete',deferred=false,referrer='https://example.org/private?q=secret',query='?private=secret#area'}={}){
  const events={},calls=[];
  const window={addEventListener:(name,fn)=>events[name]=fn};window.self=window;window.top=embedded?{}:window;
  const document={readyState,currentScript:{defer:deferred},documentElement:{lang:'ja'},referrer,addEventListener:(name,fn)=>events[name]=fn};
  const context=vm.createContext({window,document,localStorage:storage,Date:clock||Date,crypto:random,Uint8Array,navigator:privacy,location:{hostname,pathname:'/ja/explore/geometry-mensuration.html',href:'https://'+hostname+'/ja/explore/geometry-mensuration.html'+query,origin:'https://'+hostname},URL,MutationObserver:class {constructor(fn){events.languageMutation=fn}observe(){}},fetch:(url,options)=>{calls.push({url,options,body:JSON.parse(options.body)});return Promise.resolve({status:204});}});
  vm.runInContext(source,context);return {events,calls,context};
}
test('collector counts page views, real PDF links, language choices and restored views without private URL details',()=>{
  const {events,calls,context}=run();
  const click=anchor=>events.click({button:0,target:{closest:()=>anchor}});
  click({href:'https://theisegoria.github.io/explore/geometry-lab/formula-sheet.pdf?private=secret',dataset:{}});
  click({href:'https://theisegoria.github.io/explore/geometry-mensuration.html',hreflang:'en',dataset:{}});
  click({href:'https://example.org/external.pdf',dataset:{}});
  events.pageshow({persisted:false});events.pageshow({persisted:true});
  vm.runInContext(source,context);
  assert.deepEqual(calls.map(c=>c.body.event),['pageview','pdf','language','pageview']);
  assert.equal(calls[2].body.language,'en');
  for(const c of calls){assert.equal(c.options.credentials,'omit');assert.equal(c.body.referrer,'https://example.org');assert.ok(!JSON.stringify(c.body).includes('secret'));assert.ok(c.url.startsWith('https://isegoria-analytics.isegoria-analytics.workers.dev/'));}
});
test('collector stays silent for privacy preferences, embedded documents and local previews',()=>{
  for(const options of [{privacy:{doNotTrack:'1'}},{privacy:{globalPrivacyControl:true}},{embedded:true},{hostname:'localhost'}])assert.equal(run(options).calls.length,0);
});

test('sessions survive navigation, rotate after inactivity, and tolerate blocked storage',()=>{
 let now=1000000,seed=0;const store=new Map();const storage={getItem:k=>store.get(k),setItem:(k,v)=>store.set(k,v)};
 const random={getRandomValues:a=>{a.fill(++seed);return a}},clock={now:()=>now};
 const first=run({storage,random,clock}).calls[0].body.session_id;assert.match(first,/^[a-f0-9]{32}$/);
 now+=60000;assert.equal(run({storage,random,clock}).calls[0].body.session_id,first);
 now+=1800000;assert.notEqual(run({storage,random,clock}).calls[0].body.session_id,first);
 assert.equal(run({storage:{getItem(){throw Error()},setItem(){throw Error()}},random,clock}).calls[0].body.session_id,null);
 const before=JSON.stringify([...store]);run({storage,random,clock,privacy:{globalPrivacyControl:true}});assert.equal(JSON.stringify([...store]),before);
});

test('allowlisted source tags survive internal navigation without retaining arbitrary query data',()=>{
 let now=1000000,seed=0;const store=new Map();const storage={getItem:k=>store.get(k),setItem:(k,v)=>store.set(k,v)};
 const random={getRandomValues:a=>{a.fill(++seed);return a}},clock={now:()=>now};
 const first=run({storage,random,clock,referrer:'',query:'?utm_source=threads&utm_medium=social&email=private@example.com'}).calls[0].body;
 assert.equal(first.attribution.tag,'threads');assert.equal(first.attribution.referrer,'');
 now+=1000;const next=run({storage,random,clock,referrer:'https://theisegoria.github.io/'}).calls[0].body;
 assert.equal(next.session_id,first.session_id);assert.equal(next.attribution.tag,'threads');
 assert.ok(!JSON.stringify([...store]).includes('email'));assert.ok(!JSON.stringify(first).includes('private@'));
 now+=1800000;const newer=run({storage,random,clock,referrer:'https://www.google.com/search?q=private',query:''}).calls[0].body;
 assert.notEqual(newer.session_id,first.session_id);assert.equal(newer.attribution.tag,'');assert.equal(newer.attribution.referrer,'https://www.google.com');
 assert.equal(run({referrer:'',query:'?utm_source=private@example.com'}).calls[0].body.attribution.tag,'');
});

test('custom controls count actual language changes once and ignore no-op mutations',()=>{
 const {events,calls,context}=run();
 context.document.documentElement.lang='en';events.languageMutation();events.languageMutation();
 context.document.documentElement.lang='ja';events.languageMutation();
 assert.deepEqual(calls.map(c=>[c.body.event,c.body.language]),[['pageview','ja'],['language','en'],['language','ja']]);
});
test('a link and its in-place language mutation are deduplicated',()=>{
 const {events,calls,context}=run();
 events.click({type:'click',button:0,target:{closest:()=>({href:'https://theisegoria.github.io/?lang=en',hreflang:'en',dataset:{}})}});
 context.document.documentElement.lang='en';events.languageMutation();
 assert.equal(calls.filter(c=>c.body.event==='language').length,1);
});
test('initial page view waits for application language setup',()=>{
 const {events,calls,context}=run({readyState:'loading'});assert.equal(calls.length,0);
 context.document.documentElement.lang='en';events.DOMContentLoaded();
 assert.equal(calls.length,1);assert.equal(calls[0].body.language,'en');
});
test('middle-click PDFs count once while cancelled and right-click actions are ignored',()=>{
 const {events,calls}=run();const target={closest:()=>({href:'https://theisegoria.github.io/report.pdf',dataset:{}})};
 events.auxclick({type:'auxclick',button:1,target});events.auxclick({type:'auxclick',button:2,target});events.click({type:'click',button:0,target,defaultPrevented:true});
 assert.deepEqual(calls.map(c=>c.body.event),['pageview','pdf']);
});
test('privacy changes after initialization suppress further collection',()=>{
 const privacy={};const {events,calls,context}=run({privacy});privacy.globalPrivacyControl=true;
 context.document.documentElement.lang='en';events.languageMutation();events.pageshow({persisted:true});assert.equal(calls.length,1);
});

test('parser-deferred collector waits through interactive readyState for modules',()=>{
 const {events,calls,context}=run({readyState:'interactive',deferred:true});assert.equal(calls.length,0);
 context.document.documentElement.lang='en';events.DOMContentLoaded();assert.equal(calls[0].body.language,'en');
});
