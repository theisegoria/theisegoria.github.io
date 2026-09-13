/* First-party aggregate event collection; short-lived anonymous sessions; no cookies or persistent visitor IDs. */
(()=>{
  'use strict';
  const endpoint='https://isegoria-analytics.isegoria-analytics.workers.dev/collect';
  if(!endpoint||location.hostname!=='theisegoria.github.io'||window.self!==window.top||window.__isegoriaAnalytics)return;
  if(navigator.globalPrivacyControl||navigator.doNotTrack==='1'||window.doNotTrack==='1')return;
  window.__isegoriaAnalytics=true;
  const entry=()=>{
    const tags=['threads','instagram','google','bing','duckduckgo','yahoo','brave','ecosia'];
    let tag='',referrer='';
    try{const value=new URL(location.href).searchParams.get('utm_source')?.toLowerCase();if(tags.includes(value))tag=value;}catch{}
    try{const url=new URL(document.referrer);if(['http:','https:'].includes(url.protocol))referrer=url.origin;}catch{}
    return {tag,referrer};
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
  const emit=(event,path,lang=language())=>{
    if(navigator.globalPrivacyControl||navigator.doNotTrack==='1'||window.doNotTrack==='1')return;
    let referrer='';try{referrer=document.referrer?new URL(document.referrer).origin:'';}catch{}
    const current=session();
    fetch(endpoint,{method:'POST',mode:'cors',credentials:'omit',keepalive:true,
      headers:{'Content-Type':'text/plain;charset=UTF-8'},
      body:JSON.stringify({event,path,language:lang,referrer,session_id:current.id,attribution:current.attribution})}).catch(()=>{});
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
    document.addEventListener('click',linkEvent);
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
