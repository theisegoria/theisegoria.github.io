/* Navigation enhancement is optional: all routes remain ordinary HTML links. */
(()=>{
  'use strict';
  const themeable=document.documentElement.classList.contains('ig-editorial');
  let theme;try{theme=localStorage.getItem('isegoria-theme')}catch{}
  theme=theme==='light'||theme==='dark'?theme:(matchMedia('(prefers-color-scheme:dark)').matches?'dark':'light');
  if(themeable){document.documentElement.dataset.theme=theme;document.documentElement.style.colorScheme=theme}
  if(window.self!==window.top)document.documentElement.classList.add('ig-embedded');
  function ready(){
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
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',ready);else ready();
})();
