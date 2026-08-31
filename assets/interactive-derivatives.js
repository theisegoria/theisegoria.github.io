(() => {
  const shell = document.querySelector('[data-lesson="derivative-arrays"]');
  if (!shell) return;
  const mount = shell.querySelector('[data-interactive-mount]');
  if (!mount) return;
  const ja = document.documentElement.lang.startsWith('ja');
  const t = (en, jp) => ja ? jp : en;
  const fmt = (v, d = 2) => Math.abs(v) < 10 ** (-d) / 2 ? '0' : v.toLocaleString(ja ? 'ja-JP' : 'en-US', { maximumFractionDigits: d });
  const css = getComputedStyle(document.documentElement);
  const colors = { ink: css.getPropertyValue('--ink').trim(), soft: css.getPropertyValue('--ink-soft').trim(), line: css.getPropertyValue('--line').trim(), teal: css.getPropertyValue('--teal').trim(), coral: css.getPropertyValue('--coral').trim(), gold: css.getPropertyValue('--gold').trim(), card: css.getPropertyValue('--card').trim() };
  const state = { mode: 'jacobian', x: 1, y: 2, pair: 'trig', time: 0, a: 2, b: 0.7, c: 1, theta: 28 };

  mount.innerHTML = `
    <div class="workbench-bar">
      <div class="segmented" data-modes>
        <button type="button" data-mode="jacobian" aria-pressed="true">${t('Jacobian', 'ヤコビアン')}</button>
        <button type="button" data-mode="wronskian" aria-pressed="false">${t('Wronskian', 'ロンスキー行列式')}</button>
        <button type="button" data-mode="hessian" aria-pressed="false">${t('Hessian', 'ヘッセ行列')}</button>
      </div>
      <p data-workbench-hint>${t('One matrix, three geometric jobs.', 'ひとつの行列、三つの幾何学的な役割。')}</p>
    </div>
    <div class="workbench-grid">
      <div class="workbench-controls" data-controls></div>
      <div class="workbench-stage"><div class="canvas-stage"><canvas class="lesson-canvas" width="720" height="420" data-canvas></canvas><p class="stage-caption" data-caption></p></div></div>
    </div>
    <div class="readout-grid" data-readouts aria-live="polite"></div>
    <div class="equation-strip" data-equation></div>`;

  const controls = mount.querySelector('[data-controls]');
  const canvas = mount.querySelector('[data-canvas]');
  const ctx = canvas.getContext('2d');
  const readouts = mount.querySelector('[data-readouts]');
  const equation = mount.querySelector('[data-equation]');
  const caption = mount.querySelector('[data-caption]');

  function axes(cx, cy, scale = 1) {
    ctx.strokeStyle = colors.line; ctx.lineWidth = 1;
    ctx.beginPath(); ctx.moveTo(cx - 115 * scale, cy); ctx.lineTo(cx + 115 * scale, cy); ctx.moveTo(cx, cy - 115 * scale); ctx.lineTo(cx, cy + 115 * scale); ctx.stroke();
  }
  function arrow(cx, cy, x, y, color, label) {
    const ex = cx + x, ey = cy - y;
    ctx.strokeStyle = color; ctx.fillStyle = color; ctx.lineWidth = 4; ctx.lineCap = 'round';
    ctx.beginPath(); ctx.moveTo(cx, cy); ctx.lineTo(ex, ey); ctx.stroke();
    const angle = Math.atan2(ey - cy, ex - cx);
    ctx.beginPath(); ctx.moveTo(ex, ey); ctx.lineTo(ex - 12 * Math.cos(angle - .5), ey - 12 * Math.sin(angle - .5)); ctx.lineTo(ex - 12 * Math.cos(angle + .5), ey - 12 * Math.sin(angle + .5)); ctx.closePath(); ctx.fill();
    ctx.font = '700 13px system-ui'; ctx.fillText(label, ex + 8, ey - 8);
  }
  function rangeRow(label, key, min, max, step) {
    return `<div class="control-group"><label class="control-label" for="control-${key}">${label}</label><div class="range-row"><input class="lesson-range" id="control-${key}" data-key="${key}" type="range" min="${min}" max="${max}" step="${step}" value="${state[key]}"><output class="range-value" data-value="${key}">${fmt(state[key], 2)}</output></div></div>`;
  }
  function wireRanges(update) {
    controls.querySelectorAll('[data-key]').forEach((input) => input.addEventListener('input', () => { state[input.dataset.key] = Number(input.value); controls.querySelector(`[data-value="${input.dataset.key}"]`).textContent = fmt(Number(input.value), 2); update(); }));
  }
  function renderReadouts(items) { readouts.innerHTML = items.map(([label, value]) => `<div class="readout-item"><span>${label}</span><strong>${value}</strong></div>`).join(''); }

  function jacobian() {
    controls.innerHTML = `<h2 class="control-heading">${t('Local map', '局所写像')}</h2><p class="control-equation">F(x,y) = (x² − y, xy + y²)</p>${rangeRow('x', 'x', -2, 2, .05)}${rangeRow('y', 'y', -2, 2, .05)}<div class="control-group"><span class="control-label">DF(x,y)</span><div class="matrix-readout" data-matrix></div><p class="control-note">${t('Rows are outputs; columns are inputs.', '行は出力、列は入力です。')}</p></div>`;
    const draw = () => {
      const m = [[2 * state.x, -1], [state.y, state.x + 2 * state.y]];
      const det = m[0][0] * m[1][1] - m[0][1] * m[1][0];
      controls.querySelector('[data-matrix]').innerHTML = m.flat().map((v) => `<span>${fmt(v)}</span>`).join('');
      ctx.clearRect(0,0,720,420); ctx.fillStyle = colors.soft; ctx.font = '800 12px system-ui'; ctx.textAlign = 'center';
      ctx.fillText(t('INPUT: UNIT SQUARE', '入力：単位正方形'), 185, 35); ctx.fillText(t('OUTPUT: LOCAL PARALLELOGRAM', '出力：局所平行四辺形'), 535, 35);
      axes(185,230); axes(535,230);
      const s1 = 72; ctx.fillStyle = `${colors.teal}30`; ctx.strokeStyle = colors.teal; ctx.lineWidth = 3;
      ctx.beginPath(); ctx.moveTo(185,230); ctx.lineTo(185+s1,230); ctx.lineTo(185+s1,230-s1); ctx.lineTo(185,230-s1); ctx.closePath(); ctx.fill(); ctx.stroke();
      arrow(185,230,s1,0,colors.teal,'e₁'); arrow(185,230,0,s1,colors.gold,'e₂');
      const maxNorm = Math.max(1, Math.hypot(m[0][0],m[1][0]), Math.hypot(m[0][1],m[1][1]), Math.hypot(m[0][0]+m[0][1],m[1][0]+m[1][1]));
      const s2 = 105 / maxNorm; const v1=[m[0][0]*s2,m[1][0]*s2], v2=[m[0][1]*s2,m[1][1]*s2];
      ctx.fillStyle = det >= 0 ? `${colors.teal}30` : `${colors.coral}30`; ctx.strokeStyle = det >= 0 ? colors.teal : colors.coral;
      ctx.beginPath(); ctx.moveTo(535,230); ctx.lineTo(535+v1[0],230-v1[1]); ctx.lineTo(535+v1[0]+v2[0],230-v1[1]-v2[1]); ctx.lineTo(535+v2[0],230-v2[1]); ctx.closePath(); ctx.fill(); ctx.stroke();
      arrow(535,230,v1[0],v1[1],colors.teal,'col 1'); arrow(535,230,v2[0],v2[1],colors.gold,'col 2');
      ctx.fillStyle=colors.soft; ctx.font='600 13px system-ui'; ctx.fillText(t('area = 1', '面積 = 1'),185,365); ctx.fillText(`${t('signed area', '符号付き面積')} = ${fmt(det)}`,535,365);
      renderReadouts([[t('Rows × columns','行 × 列'),'2 × 2'],['det DF',fmt(det)], [t('Area scale','面積倍率'),fmt(Math.abs(det))], [t('Orientation','向き'), Math.abs(det)<1e-8?t('collapsed','潰れる'):(det>0?t('preserved','保存'):t('reversed','反転'))]]);
      equation.innerHTML = `<strong>DF(${fmt(state.x)}, ${fmt(state.y)})</strong> = [[${fmt(m[0][0])}, −1], [${fmt(m[1][0])}, ${fmt(m[1][1])}]]`;
      caption.innerHTML = `<span><i class="legend-swatch swatch-teal"></i>${t('first column = response to x', '第1列 = x 方向への応答')}</span><span><i class="legend-swatch swatch-gold"></i>${t('second column = response to y', '第2列 = y 方向への応答')}</span>`;
    };
    wireRanges(draw); draw();
  }

  const pairs = {
    trig: { label: t('cos t, sin t', 'cos t, sin t'), values: (z) => [Math.cos(z), -Math.sin(z), Math.sin(z), Math.cos(z)], w: () => 1 },
    repeated: { label: t('eᵗ, t eᵗ', 'eᵗ, t eᵗ'), values: (z) => { const e=Math.exp(z); return [e,e,z*e,(z+1)*e]; }, w: (z) => Math.exp(2*z) },
    exponential: { label: t('eᵗ, e²ᵗ', 'eᵗ, e²ᵗ'), values: (z) => { const e=Math.exp(z), e2=Math.exp(2*z); return [e,e,e2,2*e2]; }, w: (z) => Math.exp(3*z) },
  };
  function wronskian() {
    controls.innerHTML = `<h2 class="control-heading">${t('Two solution states', '二つの解の状態')}</h2><p class="control-equation">W(t) = det [[y₁, y₂], [y₁′, y₂′]]</p><div class="control-group"><label class="control-label" for="pair">${t('Function pair', '関数の組')}</label><select class="lesson-select" id="pair" data-pair>${Object.entries(pairs).map(([k,v])=>`<option value="${k}" ${state.pair===k?'selected':''}>${v.label}</option>`).join('')}</select></div>${rangeRow('t', 'time', -1.2, 1.2, .02)}<div class="control-group"><span class="control-label">${t('State matrix', '状態行列')}</span><div class="matrix-readout" data-matrix></div><p class="control-note">${t('Columns are the state vectors (y, y′).', '各列は状態ベクトル (y, y′) です。')}</p></div>`;
    const draw = () => {
      const pair=pairs[state.pair], v=pair.values(state.time), w=v[0]*v[3]-v[2]*v[1];
      controls.querySelector('[data-matrix]').innerHTML=[v[0],v[2],v[1],v[3]].map(n=>`<span>${fmt(n)}</span>`).join('');
      ctx.clearRect(0,0,720,420); const cx=360,cy=220; axes(cx,cy,1.35);
      const max=Math.max(1,...v.map(Math.abs)); const s=125/max; const a=[v[0]*s,v[1]*s], b=[v[2]*s,v[3]*s];
      ctx.fillStyle=`${w>=0?colors.teal:colors.coral}28`; ctx.strokeStyle=w>=0?colors.teal:colors.coral; ctx.lineWidth=3;
      ctx.beginPath(); ctx.moveTo(cx,cy); ctx.lineTo(cx+a[0],cy-a[1]); ctx.lineTo(cx+a[0]+b[0],cy-a[1]-b[1]); ctx.lineTo(cx+b[0],cy-b[1]); ctx.closePath(); ctx.fill(); ctx.stroke();
      arrow(cx,cy,a[0],a[1],colors.teal,'(y₁,y₁′)'); arrow(cx,cy,b[0],b[1],colors.gold,'(y₂,y₂′)');
      ctx.fillStyle=colors.soft; ctx.textAlign='center';ctx.font='700 13px system-ui';ctx.fillText(`${t('signed state-space area','状態空間の符号付き面積')} W = ${fmt(w)}`,360,388);
      renderReadouts([['y₁',fmt(v[0])],['y₂',fmt(v[2])],['W(t)',fmt(w)], [t('Independence','独立性'),Math.abs(w)>1e-8?t('certified here','ここで保証'):t('not certified','保証されない')]]);
      equation.innerHTML=`<strong>W(${fmt(state.time)})</strong> = y₁y₂′ − y₂y₁′ = ${fmt(v[0])}·${fmt(v[3])} − ${fmt(v[2])}·${fmt(v[1])} = ${fmt(w)}`;
      caption.innerHTML=`<span><i class="legend-swatch swatch-teal"></i>${t('first state vector','第1状態ベクトル')}</span><span><i class="legend-swatch swatch-gold"></i>${t('second state vector','第2状態ベクトル')}</span>`;
    };
    controls.querySelector('[data-pair]').addEventListener('change',e=>{state.pair=e.target.value;draw();}); wireRanges(draw); draw();
  }

  function hessian() {
    controls.innerHTML=`<h2 class="control-heading">${t('Quadratic curvature model', '二次曲率モデル')}</h2><p class="control-equation">q(u,v) = ½(au² + 2buv + cv²)</p>${rangeRow('a = H₁₁','a',-3,3,.05)}${rangeRow('b = H₁₂','b',-3,3,.05)}${rangeRow('c = H₂₂','c',-3,3,.05)}${rangeRow(t('direction θ (degrees)','方向 θ（度）'),'theta',0,180,1)}<div class="control-group"><span class="control-label">H</span><div class="matrix-readout" data-matrix></div></div>`;
    const draw=()=>{
      const {a,b,c}=state; const disc=Math.sqrt((a-c)**2+4*b*b), l1=(a+c+disc)/2,l2=(a+c-disc)/2,det=a*c-b*b;
      const th=state.theta*Math.PI/180, curvature=a*Math.cos(th)**2+2*b*Math.sin(th)*Math.cos(th)+c*Math.sin(th)**2;
      controls.querySelector('[data-matrix]').innerHTML=[a,b,b,c].map(n=>`<span>${fmt(n)}</span>`).join('');
      const image=ctx.createImageData(720,420); let p=0;
      for(let py=0;py<420;py++){for(let px=0;px<720;px++){const u=(px-360)/95,v=(210-py)/95,q=.5*(a*u*u+2*b*u*v+c*v*v), n=Math.tanh(q/3); const pos=[11,141,160],neg=[223,106,69],base=[244,239,229],mix=n>=0?pos:neg,amt=Math.min(.75,Math.abs(n)*.75); image.data[p++]=base[0]*(1-amt)+mix[0]*amt;image.data[p++]=base[1]*(1-amt)+mix[1]*amt;image.data[p++]=base[2]*(1-amt)+mix[2]*amt;image.data[p++]=255;}}
      ctx.putImageData(image,0,0); axes(360,210,1.55); arrow(360,210,115*Math.cos(th),115*Math.sin(th),colors.coral,'u');
      ctx.fillStyle=colors.ink;ctx.textAlign='left';ctx.font='800 13px system-ui';ctx.fillText(t('teal: q > 0','青緑：q > 0'),24,30);ctx.fillText(t('coral: q < 0','珊瑚：q < 0'),24,50);
      let kind=t('inconclusive / flat','判定不能・平坦'); if(l2>1e-7)kind=t('local minimum','局所最小');else if(l1< -1e-7)kind=t('local maximum','局所最大');else if(l1>1e-7&&l2< -1e-7)kind=t('saddle','鞍点');
      renderReadouts([[t('Eigenvalue λ₁','固有値 λ₁'),fmt(l1)],[t('Eigenvalue λ₂','固有値 λ₂'),fmt(l2)],['det H',fmt(det)],[t('Critical point','臨界点'),kind]]);
      equation.innerHTML=`<strong>uᵀHu</strong> ${t('in the chosen direction','選択方向の曲率')} = ${fmt(curvature)} · θ = ${fmt(state.theta,0)}°`;
      caption.innerHTML=`<span>${t('Colour encodes the sign and strength of the local quadratic change.','色は局所的な二次変化の符号と強さを表します。')}</span>`;
    }; wireRanges(draw);draw();
  }

  function renderMode() {
    mount.querySelectorAll('[data-mode]').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.mode===state.mode)));
    ({jacobian,wronskian,hessian})[state.mode]();
  }
  mount.querySelectorAll('[data-mode]').forEach(button=>button.addEventListener('click',()=>{state.mode=button.dataset.mode;renderMode();}));
  renderMode();
})();
