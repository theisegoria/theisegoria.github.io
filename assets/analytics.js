/* First-party aggregate event collection; short-lived anonymous sessions; no cookies or persistent visitor IDs. */
(()=>{
  'use strict';
  const endpoint='https://isegoria-analytics.isegoria-analytics.workers.dev/collect';
  if(!endpoint||location.hostname!=='theisegoria.github.io'||window.self!==window.top||window.__isegoriaAnalytics)return;
  if(navigator.globalPrivacyControl||navigator.doNotTrack==='1'||window.doNotTrack==='1')return;
  window.__isegoriaAnalytics=true;
  const disabled=()=>{try{return localStorage.getItem('isegoria.analytics.disabled')==='1';}catch{return false;}};
  const allowed=()=>!disabled()&&!navigator.globalPrivacyControl&&navigator.doNotTrack!=='1'&&window.doNotTrack!=='1';
  const randomId=()=>{try{return [...crypto.getRandomValues(new Uint8Array(16))].map(b=>b.toString(16).padStart(2,'0')).join('');}catch{return null;}};
  const entry=()=>{
    const tags=['threads','instagram','google','bing','duckduckgo','yahoo','brave','ecosia'];
    let tag='',referrer='',campaign='';
    try{const value=new URL(location.href).searchParams.get('utm_source')?.toLowerCase();if(tags.includes(value))tag=value;}catch{}
    try{const url=new URL(document.referrer);if(['http:','https:'].includes(url.protocol))referrer=url.origin;}catch{}
    try{const value=new URL(location.href).searchParams.get('utm_campaign');if(/^[a-z0-9][a-z0-9-]{0,63}$/.test(value||''))campaign=value;}catch{}
    return {tag,referrer,campaign};
  };
  const session=()=>{
    try{
      const now=Date.now(),key='isegoria.analytics.session.v1';
      let value;try{value=JSON.parse(localStorage.getItem(key));}catch{}
      if(!value||!/^[a-f0-9]{32}$/.test(value.id)||!Number.isFinite(value.last)||now-value.last>=1800000||now<value.last){
        value={id:[...crypto.getRandomValues(new Uint8Array(16))].map(b=>b.toString(16).padStart(2,'0')).join(''),last:now};
      }
      if(!value.attribution)value.attribution=entry();
      value.last=now;localStorage.setItem(key,JSON.stringify(value));return {id:value.id,attribution:value.attribution};
    }catch{return {id:null,attribution:entry()};}
  };
  const language=()=>document.documentElement.lang.startsWith('ja')?'ja':'en';
  let measurement=null;
  const post=body=>fetch(endpoint,{method:'POST',mode:'cors',credentials:'omit',keepalive:true,headers:{'Content-Type':'text/plain;charset=UTF-8'},body:JSON.stringify(body)}).catch(()=>{});
  const emit=(event,path,lang=language())=>{
    if(!allowed())return;
    let referrer='';try{referrer=document.referrer?new URL(document.referrer).origin:'';}catch{}
    const current=session();
    if(event==='pageview'||!measurement||measurement.session.id!==current.id){flush();measurement={page_id:randomId(),session:current,visible:0,since:document.visibilityState==='visible'?Date.now():null,scroll:0,interactions:0};}
    post({event,path,language:lang,referrer,session_id:current.id,attribution:current.attribution,page_id:measurement.page_id});
  };
  const flush=()=>{
    if(!measurement)return;
    if(!allowed()){measurement=null;return;}
    const now=Date.now();
    if(measurement.since!==null)measurement.visible=Math.min(14400000,measurement.visible+Math.max(0,now-measurement.since));
    measurement.since=document.visibilityState==='visible'?now:null;
    const signature=[measurement.visible,measurement.scroll,measurement.interactions].join(':');
    if(signature===measurement.sent)return;measurement.sent=signature;
    if(measurement.page_id)post({event:'engagement',path:location.pathname,language:language(),session_id:measurement.session.id,attribution:measurement.session.attribution,page_id:measurement.page_id,visible_ms:Math.floor(measurement.visible),scroll_depth:measurement.scroll,interactions:measurement.interactions});
  };
  const start=()=>{
    let lastLanguage=language();
    emit('pageview',location.pathname);
    window.addEventListener('pageshow',event=>{if(event.persisted){lastLanguage=language();emit('pageview',location.pathname);}});
    const linkEvent=event=>{
      if(event.defaultPrevented||(event.type==='auxclick'?event.button!==1:event.button>0))return;
      const anchor=event.target.closest?.('a[href]');if(!anchor)return;
      let target;try{target=new URL(anchor.href,location.href);}catch{return;}
      if(target.origin!==location.origin)return;
      if(/\.pdf$/i.test(target.pathname))emit('pdf',target.pathname);
      const lang=(anchor.hreflang||anchor.dataset.languageSelect||'').slice(0,2);
      if(['en','ja'].includes(lang)&&lang!==lastLanguage){
        emit('language',location.pathname,lang);lastLanguage=lang;
      }
    };
    const interact=event=>{
      if(!allowed()||document.visibilityState!=='visible'||event.defaultPrevented||event.isTrusted===false)return;
      const target=event.target;
      if(target.closest?.('header,nav,.ig-header,[data-language-select],a[href],.theme-toggle'))return;
      const control=event.type==='pointerup'?target.closest?.('canvas'):target.closest?.('button,input[type="range"],select');
      if(!control||(event.type==='click'&&control.tagName!=='BUTTON'))return;
      const current=session();
      if(!measurement||measurement.session.id!==current.id){flush();measurement={page_id:randomId(),session:current,visible:0,since:Date.now(),scroll:0,interactions:0};}
      measurement.interactions=Math.min(10000,measurement.interactions+1);flush();
    };
    document.addEventListener('pointerup',interact);
    document.addEventListener('change',interact);
    // Keep a single click listener for navigation and control measurement.
    document.addEventListener('click',event=>{linkEvent(event);if(event.target.closest?.('button'))interact(event);});
    window.addEventListener('scroll',()=>{
      if(!measurement||!allowed()||document.visibilityState!=='visible')return;
      const height=document.documentElement.scrollHeight-window.innerHeight;
      if(height<=0)return;
      const depth=Math.min(100,Math.floor(Math.max(0,window.scrollY)/height*100/25)*25);
      if(depth>measurement.scroll){measurement.scroll=depth;flush();}
    },{passive:true});
    document.addEventListener('visibilitychange',flush);
    window.addEventListener('pagehide',()=>{flush();if(measurement)measurement.since=null;});
    window.addEventListener('storage',event=>{if(event.key==='isegoria.analytics.disabled'){measurement=null;if(allowed())emit('pageview',location.pathname);}});
    if(typeof setInterval==='function')setInterval(flush,30000);
    document.addEventListener('auxclick',linkEvent);
    // Custom buttons/selects change the document language without navigating.
    // Observe the actual result, so unrelated buttons and repeated selections
    // do not create language events. Anchor events above share this deduplication.
    new MutationObserver(()=>{
      const current=language();
      if(current!==lastLanguage){lastLanguage=current;emit('language',location.pathname,current);}
    }).observe(document.documentElement,{attributes:true,attributeFilter:['lang']});
  };
  // Deferred application modules initialize query-selected translations first.
  if(document.readyState==='loading'||(document.currentScript?.defer&&document.readyState==='interactive'))document.addEventListener('DOMContentLoaded',start,{once:true});
  else start();
})();
