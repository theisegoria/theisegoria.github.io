/* Navigation enhancement is optional: all routes remain ordinary HTML links. */
(()=>{
  'use strict';
  if(document.documentElement.dataset.igShellLoaded)return;
  document.documentElement.dataset.igShellLoaded='true';
  const themeable=document.documentElement.classList.contains('ig-editorial');
  let theme;try{theme=localStorage.getItem('isegoria-theme')}catch{}
  theme=theme==='light'||theme==='dark'?theme:(matchMedia('(prefers-color-scheme:dark)').matches?'dark':'light');
  if(themeable){document.documentElement.dataset.theme=theme;document.documentElement.style.colorScheme=theme}
  if(window.self!==window.top)document.documentElement.classList.add('ig-embedded');
  function ready(){
    if(!document.querySelector('script[data-isegoria-analytics]')&&location.hostname==='theisegoria.github.io'&&window.self===window.top&&!navigator.globalPrivacyControl&&navigator.doNotTrack!=='1'&&window.doNotTrack!=='1'){
      const analytics=document.createElement('script');analytics.src='/assets/analytics.js?v=20260913';analytics.async=true;document.head.append(analytics);
    }
    const header=document.getElementById('ig-header');if(!header)return;
    const menu=header.querySelector('.ig-menu'),nav=header.querySelector('nav');
    if(!menu||!nav)return;
    // Older project releases share these assets but may still have the old header.
    if(!header.querySelector('.ig-header-actions')){
      const actions=document.createElement('div');actions.className='ig-header-actions';
      const language=nav.querySelector('.ig-language');
      if(language)actions.append(language.cloneNode(true));
      actions.append(menu);nav.before(actions);
    }
    const mathJa=document.documentElement.lang.startsWith('ja');
    header.querySelectorAll('a[href="/#guides"],a[href="/ja/#guides"]').forEach(a=>{
      a.href=mathJa?'/ja/math-encyclopedia/':'/math-encyclopedia/';
      a.textContent=mathJa?'数学百科事典':'Math encyclopedia';
    });
    header.dataset.enhanced='';
    const themeButton=header.querySelector('.ig-theme'),ja=document.documentElement.lang.startsWith('ja');
    if(themeable&&themeButton){
      const label=()=>{const dark=document.documentElement.dataset.theme==='dark';themeButton.textContent=ja?(dark?'ライト表示':'ダーク表示'):(dark?'Light':'Dark');themeButton.setAttribute('aria-label',ja?(dark?'ライトテーマに切り替える':'ダークテーマに切り替える'):(dark?'Switch to light theme':'Switch to dark theme'))};
      themeButton.hidden=false;label();themeButton.addEventListener('click',()=>{const next=document.documentElement.dataset.theme==='dark'?'light':'dark';document.documentElement.dataset.theme=next;document.documentElement.style.colorScheme=next;try{localStorage.setItem('isegoria-theme',next)}catch{}label()});
    }
    const close=()=>{header.removeAttribute('data-open');menu.setAttribute('aria-expanded','false')};
    menu.addEventListener('click',()=>{const open=!header.hasAttribute('data-open');header.toggleAttribute('data-open',open);menu.setAttribute('aria-expanded',String(open))});
    header.addEventListener('keydown',e=>{if(e.key==='Escape'&&header.hasAttribute('data-open')){close();menu.focus()}});
    nav.addEventListener('click',e=>{if(e.target.closest('a'))close()});
    document.addEventListener('click',e=>{if(!header.contains(e.target))close()});
    matchMedia('(min-width:1001px)').addEventListener('change',close);
    // One language preference shared with lang.js and older guide controls.
    document.addEventListener('click',e=>{const a=e.target.closest?.('a[hreflang]');if(!a)return;const lang=a.hreflang.slice(0,2);if(!['en','ja'].includes(lang))return;try{localStorage.setItem('isegoria:lang',lang);localStorage.setItem('isegoria-language',lang)}catch{}});
    // Matching editions keep the selected chapter or experiment.
    const counterpart=document.querySelector(`link[rel="alternate"][hreflang="${ja?'en':'ja'}"]`);
    if(counterpart){
      const syncLanguageLinks=()=>{const target=new URL(counterpart.href,location.href);target.hash=location.hash;if(location.search)target.search=location.search;header.querySelectorAll('.ig-language').forEach(a=>{a.href=target.pathname+target.search+target.hash})};
      syncLanguageLinks();window.addEventListener('hashchange',syncLanguageLinks);
      header.addEventListener('click',e=>{if(e.target.closest?.('.ig-language'))syncLanguageLinks()},true);
    }
  }
  /* Site-wide search. The catalogue is the library page itself, fetched once on first use, so there is no separate index
     to keep in step. Without JavaScript the Library link in the header does the same job. */
  function search(){
    const header=document.getElementById('ig-header');if(!header||header.querySelector('.ig-search')||window.self!==window.top)return;
    const ja=document.documentElement.lang.startsWith('ja'),t=(en,j)=>ja?j:en,home=ja?'/ja/':'/';
    const button=document.createElement('button');button.className='ig-search';button.type='button';button.setAttribute('aria-haspopup','dialog');
    button.innerHTML='<svg viewBox="0 0 16 16" width="14" height="14" aria-hidden="true"><circle cx="7" cy="7" r="4.6" fill="none" stroke="currentColor" stroke-width="1.5"/><path d="M10.5 10.5 14 14" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/></svg><span>'+t('Search','検索')+'</span><kbd>/</kbd>';
    const theme=header.querySelector('nav .ig-theme');if(theme)theme.before(button);else header.querySelector('nav')?.append(button);
    const actions=header.querySelector('.ig-header-actions');let mobile=null;
    if(actions){mobile=button.cloneNode(true);mobile.classList.add('ig-search-compact');mobile.setAttribute('aria-label',t('Search','検索'));actions.prepend(mobile)}
    const dialog=document.createElement('dialog');dialog.className='ig-search-dialog';dialog.setAttribute('aria-label',t('Search this site','サイト内検索'));
    dialog.innerHTML='<form method="dialog" class="ig-search-form"><input type="search" autocomplete="off" spellcheck="false" enterkeyhint="go" placeholder="'+t('Search every page: a topic, a device, a word','すべてのページから探す：分野、機器、ことば')+'" aria-label="'+t('Search','検索')+'" aria-controls="ig-search-results"><button class="ig-search-close" value="close" aria-label="'+t('Close','閉じる')+'">Esc</button></form><div class="ig-search-status" role="status"></div><ul id="ig-search-results" role="listbox"></ul><p class="ig-search-foot">'+t('↑ ↓ to move · Enter to open · <a href="'+home+'library.html">Browse the whole library</a>','↑ ↓ で移動 · Enter で開く · <a href="'+home+'library.html">全コンテンツの一覧</a>')+'</p>';
    document.body.append(dialog);
    const input=dialog.querySelector('input'),list=dialog.querySelector('ul'),status=dialog.querySelector('.ig-search-status');
    const quick=[[t('Math encyclopedia','数学百科事典'),t('Every subject, with experiments','すべての分野と実験'),home+'math-encyclopedia/'],[t('Knowledge graph','知識グラフ'),t('How the topics connect','項目どうしのつながり'),home+'math-encyclopedia/graph.html'],[t('Interactive explainers','操作できる解説'),t('Mechanisms and devices to take apart','分解して動かせる仕組みと機器'),home+'#interactive'],[t('Research and explainers','研究と解説'),t('Long-form writing','長文の記事'),home+'#preoccupations'],[t('Books','書籍'),'',home+'#books'],[t('Library','全コンテンツ'),t('Everything, filterable','すべてを絞り込んで探す'),home+'library.html']];
    let items=null,loading=null,active=0,shown=[];
    const norm=(x)=>x.toLowerCase().normalize('NFKC');
    const load=()=>loading||(loading=fetch(home+'library.html').then((r)=>r.ok?r.text():Promise.reject()).then((html)=>{
      const doc=new DOMParser().parseFromString(html,'text/html');
      items=[...doc.querySelectorAll('a.publication-card[href]')].map((a)=>({href:a.getAttribute('href'),title:a.querySelector('.t')?.textContent||a.textContent,desc:a.querySelector('.d')?.textContent||'',tags:a.dataset.tags||'',hay:norm((a.dataset.search||a.textContent))}));
      items.forEach((it)=>{it.nt=norm(it.title)});
    }).catch(()=>{items=[];status.textContent=t('The catalogue could not be loaded. Use the Library link below.','一覧を読み込めませんでした。下の全コンテンツのリンクをお使いください。')}));
    const render=()=>{
      const q=norm(input.value.trim()),words=q.split(/\s+/).filter(Boolean);
      if(!words.length){shown=quick.map(([title,desc,href])=>({title,desc,href}));status.textContent=t('Places to start','ここから始める')}
      else if(!items){shown=[];status.textContent=t('Loading the catalogue…','一覧を読み込んでいます…')}
      else{
        const scored=[];for(const it of items){let score=0,ok=true;for(const w of words){const inTitle=it.nt.indexOf(w);if(inTitle>=0)score+=inTitle===0?12:it.nt[inTitle-1]===' '?8:5;else if(it.hay.includes(w))score+=1;else{ok=false;break}}if(ok)scored.push([score-it.title.length/400,it])}
        scored.sort((a,b)=>b[0]-a[0]);shown=scored.slice(0,12).map((x)=>x[1]);
        status.textContent=scored.length?t(scored.length+(scored.length===1?' page':' pages'),scored.length+' 件'):t('Nothing matches. Try a shorter word.','一致するページがありません。短いことばで試してください。');
      }
      active=Math.min(active,Math.max(0,shown.length-1));list.replaceChildren();
      shown.forEach((it,i)=>{const li=document.createElement('li');li.setAttribute('role','option');li.id='ig-search-opt-'+i;if(i===active)li.setAttribute('aria-selected','true');const a=document.createElement('a');a.href=it.href;const b=document.createElement('span');b.className='ig-search-title';b.textContent=it.title;a.append(b);if(it.desc){const d=document.createElement('span');d.className='ig-search-desc';d.textContent=it.desc;a.append(d)}if(it.tags&&/interactive/.test(it.tags)){const k=document.createElement('span');k.className='ig-search-tag';k.textContent=t('interactive','操作できる');a.append(k)}li.append(a);list.append(li)});
      input.setAttribute('aria-activedescendant',shown.length?'ig-search-opt-'+active:'');
    };
    const open=()=>{if(dialog.open)return;active=0;input.value='';dialog.showModal();render();load().then(render);input.focus()};
    button.addEventListener('click',open);mobile?.addEventListener('click',open);
    input.addEventListener('input',()=>{active=0;render()});
    dialog.addEventListener('keydown',(e)=>{
      if(e.key==='ArrowDown'||e.key==='ArrowUp'){e.preventDefault();if(!shown.length)return;active=(active+(e.key==='ArrowDown'?1:shown.length-1))%shown.length;render();list.children[active]?.scrollIntoView({block:'nearest'})}
      else if(e.key==='Enter'&&e.target===input){e.preventDefault();const it=shown[active];if(it)location.href=it.href}
    });
    dialog.addEventListener('click',(e)=>{if(e.target===dialog)dialog.close()});
    document.addEventListener('keydown',(e)=>{
      if(e.defaultPrevented||dialog.open)return;const el=e.target,typing=el&&(el.isContentEditable||/^(INPUT|TEXTAREA|SELECT)$/.test(el.tagName));
      if((e.key==='/'&&!typing&&!e.ctrlKey&&!e.metaKey&&!e.altKey)||((e.key==='k'||e.key==='K')&&(e.metaKey||e.ctrlKey))){e.preventDefault();open()}
    });
  }
  /* Instant navigation: ask the browser to fetch a same-site page when a link is hovered or touched. Browsers without the
     Speculation Rules API ignore the block. PDFs, downloads and other origins are left alone. */
  function speculate(){
    if(!HTMLScriptElement.supports?.('speculationrules')||window.self!==window.top||navigator.connection?.saveData)return;
    const rules=document.createElement('script');rules.type='speculationrules';
    rules.textContent=JSON.stringify({prefetch:[{where:{and:[{href_matches:'/*'},{not:{href_matches:'/*.pdf'}},{not:{href_matches:'/*.zip'}},{not:{selector_matches:'[download],[target=_blank],[rel~=nofollow]'}}]},eagerness:'moderate'}]});
    document.head.append(rules);
  }
  /* Jump links on long pages stay in view under the header and mark the section being read. */
  function spy(){
    const nav=document.querySelector('nav.ig-page-nav');if(!nav||window.self!==window.top)return;
    const pairs=[...nav.querySelectorAll('a[href^="#"]')].map((a)=>[a,document.getElementById(decodeURIComponent(a.hash.slice(1)))]).filter((p)=>p[1]);
    if(pairs.length<3||!('IntersectionObserver' in window))return;
    const header=document.getElementById('ig-header'),root=document.documentElement;
    const size=()=>root.style.setProperty('--ig-header-h',(header?header.offsetHeight:0)+'px');size();addEventListener('resize',size);
    root.classList.add('ig-spy');
    const visible=new Set();let current=null;
    const mark=()=>{const first=pairs.find((p)=>visible.has(p[1]));const next=first?first[0]:current;if(next===current)return;current=next;pairs.forEach(([a])=>{if(a===current)a.setAttribute('aria-current','true');else a.removeAttribute('aria-current')});if(current&&nav.scrollWidth>nav.clientWidth)nav.scrollTo({left:current.offsetLeft-nav.clientWidth/2+current.offsetWidth/2,behavior:'smooth'})};
    const io=new IntersectionObserver((entries)=>{for(const e of entries){if(e.isIntersecting)visible.add(e.target);else visible.delete(e.target)}mark()},{rootMargin:'-22% 0px -55% 0px'});
    pairs.forEach((p)=>io.observe(p[1]));
  }
  function start(){ready();try{search()}catch{}try{speculate()}catch{}try{spy()}catch{}}
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',start);else start();
})();
