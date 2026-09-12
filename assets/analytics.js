/* First-party aggregate event collection; no visitor identifiers or cookies. */
(()=>{
  'use strict';
  const endpoint='https://isegoria-analytics.isegoria-analytics.workers.dev/collect';
  if(!endpoint||location.hostname!=='theisegoria.github.io'||window.self!==window.top||window.__isegoriaAnalytics)return;
  if(navigator.globalPrivacyControl||navigator.doNotTrack==='1'||window.doNotTrack==='1')return;
  window.__isegoriaAnalytics=true;
  const language=()=>document.documentElement.lang.startsWith('ja')?'ja':'en';
  const emit=(event,path,lang=language())=>{
    let referrer='';try{referrer=document.referrer?new URL(document.referrer).origin:'';}catch{}
    fetch(endpoint,{method:'POST',mode:'cors',credentials:'omit',keepalive:true,
      headers:{'Content-Type':'text/plain;charset=UTF-8'},
      body:JSON.stringify({event,path,language:lang,referrer})}).catch(()=>{});
  };
  emit('pageview',location.pathname);
  window.addEventListener('pageshow',event=>{if(event.persisted)emit('pageview',location.pathname);});
  document.addEventListener('click',event=>{
    if(event.defaultPrevented||event.button>0)return;
    const anchor=event.target.closest?.('a[href]');if(!anchor)return;
    let target;try{target=new URL(anchor.href,location.href);}catch{return;}
    if(target.origin!==location.origin)return;
    if(/\.pdf$/i.test(target.pathname))emit('pdf',target.pathname);
    const lang=(anchor.hreflang||anchor.dataset.languageSelect||'').slice(0,2);
    if(['en','ja'].includes(lang))emit('language',location.pathname,lang);
  });
})();
