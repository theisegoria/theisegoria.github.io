/* Inside an Automatic Watch: interactive mechanism (illustrated). Parts drawn with watch-art.js.
   Follows the site theme: labels use the page tokens; metal parts keep their own colours. */
(() => {
  const shell = document.querySelector('[data-lesson="watch"]'); if (!shell) return;
  const mount = shell.querySelector('[data-interactive-mount]'); const A = window.WatchArt; if (!mount || !A) return;
  const ja = document.documentElement.lang.startsWith('ja'), t = (en, jp) => ja ? jp : en;
  const fmt = (v, d = 1) => v.toLocaleString(ja ? 'ja-JP' : 'en-US', { maximumFractionDigits: d });
  const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches, D2R = Math.PI / 180, TAU = Math.PI * 2;
  const rot = (el, a, x, y) => el && el.setAttribute('transform', `rotate(${a.toFixed(3)} ${x} ${y})`);
  const stages = {
    rotor: { title: t('1. Rotor', '1. ローター'), body: t('Wrist motion swings an eccentric mass. Reversing gears route either one or both directions into winding.', '腕の動きが偏心した錘を揺らします。切替車が一方向または両方向の回転を巻上げへ伝えます。') },
    barrel: { title: t('2. Mainspring barrel', '2. ゼンマイ香箱'), body: t('Winding stores elastic energy in the coiled mainspring. Watch the coils: wound tight round the arbor when full, lying against the wall when empty. A slipping bridle normally prevents destructive overwinding.', '巻上げは渦巻き状の主ゼンマイに弾性エネルギーを蓄えます。コイルを見てください。満タンなら真にきつく巻き付き、空なら壁に沿って寝ています。滑りブライドルが通常は過巻きを防ぎます。') },
    train: { title: t('3. Going train', '3. 輪列'), body: t('Meshing wheels trade torque for speed and establish the ratios that eventually turn the hands. Adjacent gears rotate in opposite directions.', '噛み合う歯車はトルクと速度を交換し、針を回す比率を作ります。隣り合う歯車は逆向きに回転します。') },
    escape: { title: t('4. Escape wheel and pallet fork', '4. ガンギ車とアンクル'), body: t('The escape wheel cannot run freely. The pallet locks it, releases half a tooth, receives impulse, and locks it again, so it moves in steps.', 'ガンギ車は自由には回れません。アンクルがロックし、半歯だけ解放し、衝撃を受け、再びロックするので、段階的に進みます。') },
    balance: { title: t('5. Balance oscillator', '5. テンプ振動子'), body: t('The balance and hairspring form an oscillator. Its rhythm gates the escapement; the escapement only maintains the swing.', 'テンプとヒゲゼンマイが振動子を作ります。その周期が脱進機を刻み、脱進機は振動を維持します。') },
    hands: { title: t('6. Motion work and hands', '6. 筒車・針'), body: t('The regulated train is divided into seconds, minutes, and hours. The hands display accumulated, counted oscillations.', '調速された輪列を秒・分・時へ分割します。針は数え上げられた振動の累積を表示します。') }
  };
  document.body.insertAdjacentHTML('afterbegin', A.defsSvg());
  const state = { energy: 72, rate: 28800, playing: !reduced, selected: 'barrel' };
  // geometry
  const RO = [112, 250], BA = [262, 250], CE = [262 + 64 + 9, 250], TH = [CE[0] + 44 + 6, 214], ES = [TH[0] + 30 + 5, 262];
  const PA = [ES[0] + 1.0824 * 26, ES[1]], BL = [PA[0] + 34 + 56, 236], DI = [700, 392];
  let art = '';
  art += `<rect class="aw-tray" x="8" y="8" width="804" height="454" rx="18"/>`;
  art += `<g class="aw-flow"><path d="M112 250H${BL[0]}" class="aw-flow-line"/><path d="M${CE[0]} 250C${CE[0] + 60} 330 ${DI[0] - 90} ${DI[1]} ${DI[0] - 50} ${DI[1]}" class="aw-flow-line hands"/></g>`;
  art += `<g class="watch-node" data-stage="rotor">${A.rotor({ x: RO[0], y: RO[1], r: 82, from: 20, to: 160, id: 'aw-rotor' })}</g>`;
  art += `<g class="watch-node" data-stage="barrel">${A.barrel({ x: BA[0], y: BA[1], r: 64, z: 72, id: 'aw-barrel', wind: .72, turns: 9 })}</g>`;
  art += `<g class="watch-node" data-stage="train">${A.wheel({ x: TH[0], y: TH[1], z: 60, r: 30, id: 'aw-third', pinion: { z: 8, r: 5 } })}${A.wheel({ x: CE[0], y: CE[1], z: 72, r: 44, id: 'aw-centre', armsN: 4, curved: true })}${A.pinion(CE[0], CE[1], 10, 9, { id: 'aw-centre-pin' })}</g>`;
  art += `<g class="watch-node" data-stage="escape">${A.escapeWheel({ x: ES[0], y: ES[1], r: 26, id: 'aw-escape', pinion: { z: 7, r: 5 } })}${A.palletFork({ x: PA[0], y: PA[1], R: 26, dir: -14, id: 'aw-pallet' })}</g>`;
  art += `<g class="watch-node" data-stage="balance">${A.balanceWheel({ x: BL[0], y: BL[1], r: 56, id: 'aw-balance', screwsN: 14, pinAngle: 166 })}${A.hairspring({ x: BL[0], y: BL[1], r0: 6, r1: 34, turns: 10, id: 'aw-hs', w: .9 })}${A.jewel(BL[0], BL[1], 4.5, { sink: false })}</g>`;
  // small dial
  let dial = `<circle cx="${DI[0] + 3}" cy="${DI[1] + 5}" r="54" fill="#000" opacity=".2" filter="url(#wa-soft)"/><circle cx="${DI[0]}" cy="${DI[1]}" r="52" fill="url(#wa-case)" stroke="#5c646b"/><circle cx="${DI[0]}" cy="${DI[1]}" r="45" fill="url(#wa-dial)"/>`;
  for (let i = 0; i < 12; i++) dial += `<rect x="${DI[0] - 1.6}" y="${DI[1] - 42}" width="3.2" height="8" rx="1" fill="url(#wa-steel-lin)" stroke="#59616a" stroke-width=".4" transform="rotate(${i * 30} ${DI[0]} ${DI[1]})"/>`;
  dial += `<path id="aw-hh" d="M${DI[0] - 2.6} ${DI[1] + 6}L${DI[0]} ${DI[1] - 24}L${DI[0] + 2.6} ${DI[1] + 6}Z" fill="url(#wa-hand)"/><path id="aw-mh" d="M${DI[0] - 2} ${DI[1] + 7}L${DI[0]} ${DI[1] - 36}L${DI[0] + 2} ${DI[1] + 7}Z" fill="url(#wa-hand)"/><path id="aw-sh" d="M${DI[0] - .6} ${DI[1] + 10}V${DI[1] - 40}h1.2V${DI[1] + 10}z" fill="#c2342a"/><circle cx="${DI[0]}" cy="${DI[1]}" r="3" fill="url(#wa-steel)"/>`;
  art += `<g class="watch-node" data-stage="hands">${dial}</g>`;
  const L = (k, ax, ay, lx, ly, a, b, side) => `<g class="aw-lbl" data-stage="${k}">${A.leader(ax, ay, lx, ly, [a, b], { side })}</g>`;
  art += L('rotor', RO[0] - 40, RO[1] + 52, 40, 400, t('ROTOR', 'ローター'), t('captures motion', '動きを取り込む'), 'start');
  art += L('barrel', BA[0], BA[1] + 52, 200, 430, t('BARREL', '香箱'), t('stores energy', 'エネルギーを蓄える'), 'start');
  art += L('train', CE[0] + 20, CE[1] - 36, 330, 56, t('TRAIN', '輪列'), t('trades torque for speed', 'トルクを速さに'), 'start');
  art += L('escape', ES[0] + 10, ES[1] + 22, 470, 430, t('ESCAPEMENT', '脱進機'), t('releases in steps', '段階的に解放'), 'start');
  art += L('balance', BL[0] + 30, BL[1] - 48, 640, 56, t('BALANCE', 'テンプ'), t('sets the rhythm', 'リズムを決める'), 'start');
  art += L('hands', DI[0] + 40, DI[1] - 30, 770, 300, t('HANDS', '針'), t('display the count', '数を表示'), 'end');
  art += `<text class="aw-key" x="40" y="40">${t('STORED ENERGY', '蓄積エネルギー')}</text><rect class="watch-energy-track" x="40" y="52" width="210" height="12" rx="6"/><rect class="watch-energy-fill" data-energy-fill x="40" y="52" width="150" height="12" rx="6"/>`;
  art += `<text class="aw-note" x="790" y="452" text-anchor="end" data-speed-note></text>`;
  mount.innerHTML = `<div class="workbench-bar"><span class="workbench-status">${t('Energy to time', 'エネルギーから時刻へ')}</span><p>${t('Select any component to follow its job in the chain.', '部品を選ぶと、連鎖の中での役割を確認できます。')}</p></div><div class="workbench-grid"><div class="workbench-controls"><div class="control-group"><button class="lesson-button is-active" type="button" data-play>${t('Pause mechanism', '機構を一時停止')}</button></div><div class="control-group"><label class="control-label" for="energy">${t('Stored mainspring energy', '主ゼンマイの蓄積エネルギー')}</label><div class="range-row"><input class="lesson-range" id="energy" type="range" min="0" max="100" step="1" value="${state.energy}"><output class="range-value" data-energy>${state.energy}%</output></div><p class="control-note">${t('Drag to zero and the coils settle against the barrel wall, the balance stops, and so do the hands.', 'ゼロまで下げると、コイルは香箱の壁に寝て、テンプが止まり、針も止まります。')}</p></div><div class="control-group"><label class="control-label" for="beat-rate">${t('Beat rate (vph)', '振動数（vph）')}</label><select class="lesson-select" id="beat-rate"><option>21600</option><option selected>28800</option><option>36000</option></select><p class="control-note">${t('vph counts beats (half-oscillations) per hour.', 'vph は1時間当たりのビート（半振動）数です。')}</p></div><div class="watch-detail" data-detail aria-live="polite"></div></div><div class="workbench-stage"><div class="watch-stage" data-watch-stage><svg class="watch-diagram aw-diagram" viewBox="0 0 820 470" role="img" aria-labelledby="watch-title watch-desc"><title id="watch-title">${t('Illustrated mechanism of an automatic watch', '自動巻き時計の機構の図')}</title><desc id="watch-desc">${t('Energy flows from the rotor into the mainspring barrel, through the going train to the escape wheel and pallet fork, which release it in steps timed by the balance and hairspring; the train also turns the hands.', 'エネルギーはローターから香箱の主ゼンマイへ入り、輪列を通ってガンギ車とアンクルへ進み、テンプとひげゼンマイが刻む間隔で段階的に解放されます。輪列は針も回します。')}</desc>${art}</svg></div></div></div><div class="readout-grid" data-readouts></div><div class="equation-strip" data-equation></div>`;
  const svg = mount.querySelector('svg'), Q = id => svg.querySelector('#' + id);
  const detail = mount.querySelector('[data-detail]'), readouts = mount.querySelector('[data-readouts]'), equation = mount.querySelector('[data-equation]'), play = mount.querySelector('[data-play]');
  const el = { rotor: Q('aw-rotor'), barrel: Q('aw-barrel'), spring: Q('aw-barrel-spring'), springHi: Q('aw-barrel-spring-hi'), centre: Q('aw-centre'), centrePin: Q('aw-centre-pin'), third: Q('aw-third'), escape: Q('aw-escape'), pallet: Q('aw-pallet'), balance: Q('aw-balance'), hs: Q('aw-hs'), hsHi: Q('aw-hs-hi'), hh: Q('aw-hh'), mh: Q('aw-mh'), sh: Q('aw-sh') };
  const wall = A.teethPoints(BA[0], BA[1], 72, 64, { ha: 1.2, hf: 1.4 }).rf - 64 * .07;
  function update() {
    play.classList.toggle('is-active', state.playing); play.textContent = state.playing ? t('Pause mechanism', '機構を一時停止') : t('Run mechanism', '機構を動かす');
    mount.querySelector('[data-energy]').textContent = `${state.energy}%`;
    mount.querySelector('[data-energy-fill]').setAttribute('width', String(2.1 * state.energy));
    svg.classList.add('has-sel');
    mount.querySelectorAll('[data-stage]').forEach(n => n.classList.toggle('is-active', n.dataset.stage === state.selected));
    detail.innerHTML = `<strong>${stages[state.selected].title}</strong><p>${stages[state.selected].body}</p>`;
    const beats = state.rate / 3600, hz = state.rate / 7200;
    readouts.innerHTML = [[t('Beat rate', '振動数'), `${state.rate.toLocaleString()} vph`], [t('Escapes per second', '1秒当たり解放'), fmt(beats)], [t('Balance frequency', 'テンプ周波数'), `${fmt(hz)} Hz`], [t('Stored energy', '蓄積エネルギー'), `${state.energy}%`]].map(([k, v]) => `<div class="readout-item"><span>${k}</span><strong>${v}</strong></div>`).join('');
    equation.innerHTML = `<strong>${state.rate.toLocaleString()} vph ÷ 3,600 = ${fmt(beats)} ${t('beats per second', 'ビート/秒')}</strong> · ${t('one complete oscillation contains two beats', '1往復は2ビート')}`;
    const d = A.mainspringPath(BA[0], BA[1], 64 * .2, wall, 9, state.energy / 100); el.spring.setAttribute('d', d); el.springHi.setAttribute('d', d);
    svg.querySelector('[data-speed-note]').textContent = t(`balance shown at 1/8 speed`, `テンプは1/8の速さで表示`);
  }
  play.addEventListener('click', () => { state.playing = !state.playing; update(); });
  mount.querySelector('#energy').addEventListener('input', e => { state.energy = Number(e.target.value); update(); });
  mount.querySelector('#beat-rate').addEventListener('change', e => { state.rate = Number(e.target.value); update(); });
  mount.querySelectorAll('[data-stage]').forEach(node => { node.setAttribute('tabindex', '0'); node.setAttribute('role', 'button'); node.setAttribute('aria-label', stages[node.dataset.stage].title);
    const choose = () => { state.selected = node.dataset.stage; update(); };
    node.addEventListener('click', choose); node.addEventListener('keydown', e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); choose(); } }); });
  update();
  let last = performance.now(), ph = 0, beats = 0, wrist = 0, simT = 10 * 3600 + 8 * 60;
  (function frame(now) {
    const dt = Math.min((now - last) / 1000, .05); last = now;
    const on = state.playing && state.energy > 0, f = state.rate / 7200, amp = state.energy > 0 ? 140 + 1.3 * state.energy : 0;
    if (state.playing) wrist += dt;
    if (on) { const dts = dt / 8; ph += dts * f * TAU; beats += dts * 2 * f; simT += dt * 20; }
    rot(el.rotor, 30 * Math.sin(wrist * 1.3) + 14 * Math.sin(wrist * 2.9 + 1), ...RO);
    const th = amp * Math.sin(ph); rot(el.balance, th, ...BL);
    const hd = A.spiral(BL[0], BL[1], 6, 34, 10, 0, th * D2R); el.hs.setAttribute('d', hd); el.hsHi.setAttribute('d', hd);
    const bi = Math.floor(beats), fr = beats - bi, esc = (bi + Math.min(1, fr / .15)) * 9;
    rot(el.escape, -esc, ...ES); rot(el.pallet, (bi % 2 ? 1 : -1) * 6 * (1 - 2 * Math.min(1, fr / .15)), ...PA);
    rot(el.third, esc * 7 / 60 * 3, ...TH); rot(el.centre, -esc * 7 / 60 * 3 * 8 / 72 * 4, ...CE); rot(el.centrePin, -esc * 7 / 60 * 3 * 8 / 72 * 4, ...CE);
    rot(el.barrel, esc * 7 / 60 * 3 * 8 / 72 * 4 * 10 / 72, ...BA);
    const s = Math.floor(simT);
    rot(el.sh, (s % 60) * 6, ...DI); rot(el.mh, (simT / 10) % 360, ...DI); rot(el.hh, (simT / 120) % 360, ...DI);
    svg.classList.toggle('is-running', on);
    requestAnimationFrame(frame);
  })(last);
})();
