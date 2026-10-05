import * as THREE from 'three';
import {OrbitControls} from 'three/addons/controls/OrbitControls.js';
import {HDRLoader} from 'three/addons/loaders/HDRLoader.js';
import {RoomEnvironment} from 'three/addons/environments/RoomEnvironment.js';
import {RoundedBoxGeometry} from 'three/addons/geometries/RoundedBoxGeometry.js';
import {EffectComposer} from 'three/addons/postprocessing/EffectComposer.js';
import {RenderPass} from 'three/addons/postprocessing/RenderPass.js';
import {UnrealBloomPass} from 'three/addons/postprocessing/UnrealBloomPass.js';
import {OutputPass} from 'three/addons/postprocessing/OutputPass.js';

const ja = document.documentElement.lang === 'ja', t = (a, b) => ja ? b : a;
const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;
const S = {view: 0, spread: .65, r: 1, g: .45, b: .12, play: !reducedMotion, phase: 0, layer: 4, dist: .15};
// Bottom to top, as deposited. th = drawn thickness (exaggerated, not to scale).
const layers = [
  {name: t('Substrate', '基板'), col: '#c08035', th: .08, body: t('The base film. Many phone panels are built on flexible polyimide; rigid panels use glass. Everything above is deposited on it, layer by layer.', '全体の土台となるフィルムです。スマートフォン用パネルの多くは柔軟なポリイミド上に作られ、硬いパネルではガラスを使います。この上に各層を順に形成します。')},
  {name: t('TFT backplane', 'TFTバックプレーン'), col: '#5f8794', th: .1, body: t('Thin-film transistors address every subpixel. In each pixel circuit a switching transistor writes a data voltage, a storage capacitor holds it, and a driving transistor sets the current through the OLED until the next update. Real phone circuits add transistors that compensate for variation. Gate lines run across; data lines run along.', '薄膜トランジスタが各サブピクセルを制御します。画素回路では、スイッチング用トランジスタがデータ電圧を書き込み、保持容量がそれを保ち、駆動用トランジスタが次の書き込みまでOLEDに流れる電流を決めます。実際のスマートフォン用回路には、特性のばらつきを補償するトランジスタも加わります。走査線は横方向、データ線は縦方向に走ります。')},
  {name: t('Anode + pixel-defining layer', '陽極＋画素定義層'), col: '#c9d2d8', th: .05, body: t('Under forward bias, the anode injects holes: missing electrons that behave as positive charge carriers. In a top-emitting panel each subpixel has its own reflective anode, and an insulating pixel-defining layer frames the openings where light is made.', '順方向に電圧を加えると、陽極から正孔が注入されます。正孔とは電子の抜けた状態で、正の電荷のように移動します。上面発光パネルではサブピクセルごとに反射性の陽極があり、絶縁性の画素定義層が発光部の開口を区切ります。')},
  {name: t('Hole transport layers', '正孔輸送層'), col: '#e0a865', th: .045, body: t('Organic injection and transport layers help holes reach the emission region. Several real layers are grouped here.', '有機物の注入層と輸送層が、正孔を発光領域へ導きます。ここでは複数の層をまとめて表示しています。')},
  {name: t('Emissive layer (RGB)', '発光層（RGB）'), col: '#7fd6ae', th: .05, body: t('An electron and a hole can form an excited state (an exciton). Radiative relaxation releases a photon; some energy is lost without producing light. The emitter determines the spectrum. Red, green and blue materials are deposited separately; this model uses a diamond-type arrangement with twice as many green subpixels as red or blue.', '電子と正孔は励起状態（励起子）を形成します。光を伴う緩和で光子が放出されますが、光にならず失われるエネルギーもあります。発光材料が光のスペクトルを決めます。赤・緑・青の材料は別々に形成され、このモデルでは緑のサブピクセルが赤や青の2倍あるダイヤモンド型の配列を用いています。')},
  {name: t('Electron transport layers', '電子輸送層'), col: '#86b6e3', th: .045, body: t('These organic layers deliver electrons toward the emissive region. Real devices may add blocking layers to confine charge and excitons.', '有機層が電子を発光領域へ運びます。実際の素子では、電荷や励起子を閉じ込める阻止層を追加する場合もあります。')},
  {name: t('Cathode', '陰極'), col: '#c7c0dc', th: .02, body: t('The cathode injects electrons and is shared by every subpixel. In a top-emitting panel it is a thin, semitransparent metal film, so light can leave toward the viewer.', '陰極は電子を注入し、全てのサブピクセルに共通です。上面発光パネルでは薄い半透明の金属膜で、光は観察者側へ抜けていきます。')},
  {name: t('Thin-film encapsulation', '薄膜封止層'), col: '#9bb8c7', th: .08, body: t('Water and oxygen damage the organic layers. Alternating inorganic and organic films seal the stack without a glass lid, which keeps flexible panels thin. Touch electrodes often sit on top of it; they are omitted here.', '水分や酸素は有機層を傷めます。無機膜と有機膜を交互に重ねて、ガラスのふたを使わずに封止するため、フレキシブルパネルを薄くできます。この上にタッチ電極を置くことが多いですが、ここでは省略しています。')},
  {name: t('Circular polariser', '円偏光板'), col: '#8e98a3', th: .06, body: t('A linear polariser plus a quarter-wave retarder. Room light reflected by the metal electrodes returns with its handedness reversed and is blocked, so black stays black in daylight. The trade-off: the filter also absorbs a large share of the panel’s own light.', '直線偏光板と1/4波長板を組み合わせたものです。金属電極で反射した外光は回転方向が逆になって戻るため遮断され、明るい場所でも黒が黒く見えます。その代わり、パネル自身の光もかなりの割合が吸収されます。')},
  {name: t('Cover glass', 'カバーガラス'), col: '#d6efe9', th: .16, body: t('Chemically strengthened cover glass protects the stack and carries the touch surface. Optically clear adhesive layers are omitted.', '化学強化されたカバーガラスが積層全体を保護し、指で触れる面になります。光学用透明接着層は省略しています。')},
];
const EML = 4;
const views = [t('01 / Inside the panel', '01 / パネルの内部'), t('02 / Charge → light', '02 / 電荷から光へ'), t('03 / Build a colour', '03 / 色をつくる')];
document.querySelector('#app').innerHTML = `
<header><a class="brand" href="${ja ? '/ja/' : '/'}">ISEGORIA <span>/ ${t('Display notebook', 'ディスプレイノート')}</span></a><a id="language" lang="${ja ? 'en' : 'ja'}" href="${ja ? '../' : 'ja/'}">${ja ? 'English' : '日本語'}</a></header>
<main><div class="intro"><div><p class="eyebrow">${t('OLED / ORGANIC LIGHT-EMITTING DIODE', 'OLED / 有機発光ダイオード')}</p><h1>${t('A panel made of light.', '画素そのものが、光になる。')}</h1></div><p>${t('No backlight. Each subpixel makes its own light. Explore the layers, follow a charge pair, then mix a colour.', 'バックライトはありません。各サブピクセルが自ら発光します。層を広げ、電荷の動きを追い、色を混ぜてみましょう。')}</p></div>
<nav class="tabs" aria-label="${t('Explore', '探索')}">${views.map((v, i) => `<button data-view="${i}" aria-pressed="${i === 0}">${v}</button>`).join('')}</nav>
<section class="lab"><div class="stage"><div class="stage-top"><span id="scene-title"></span><span>3D · ${t('TEACHING MODEL', '教材モデル')}</span></div><div id="canvas-host"></div><div id="tags" aria-hidden="true"><svg class="leaders"></svg></div><div id="stage-legend" aria-hidden="true"></div><div id="fallback" hidden>${t('3D could not start. Use the layer list and explanations to explore the same mechanism.', '3Dを起動できませんでした。層の一覧と解説で仕組みをご覧いただけます。')}</div><div class="stage-bottom"><span id="hint">${t('Drag to orbit · pinch / scroll to zoom · tap a layer', 'ドラッグで回転・ピンチ／スクロールで拡大・層をタップで選択')}</span><button id="reset">${t('Reset view', '視点を戻す')}</button></div></div>
<aside><div id="stack-controls"><label for="spread">${t('Separate the layers', '層を広げる')}<output id="spread-out">65%</output></label><input id="spread" type="range" min="0" max="100" value="65"><p class="eyebrow list-head">${t('LAYERS, TOP TO BOTTOM', '層（上から下へ）')}</p><div class="layer-list">${layers.map((l, i) => `<button data-layer="${i}" aria-pressed="${i === EML}"><span style="background:${l.col}"></span>${l.name}</button>`).reverse().join('')}</div></div>
<div id="charge-controls" hidden><p class="eyebrow">${t('A SINGLE RECOMBINATION EVENT', '一つの再結合過程')}</p><div class="legend"><span><b class="q e">−</b>${t('Electron', '電子')}</span><span><b class="q h">+</b>${t('Hole', '正孔')}</span><span><b class="q p">~</b>${t('Photon', '光子')}</span></div><label for="phase">${t('Event progress (illustrative)', '過程の進行（模式表示）')}<output id="phase-out"></output></label><input id="phase" type="range" min="0" max="100" value="0"><div class="phase-steps" aria-hidden="true"><span>${t('Inject', '注入')}</span><span>${t('Transport', '輸送')}</span><span>${t('Exciton', '励起子')}</span><span>${t('Photon', '光子')}</span></div><button id="play"></button><p class="note">${t('Motion is slowed and schematic. Holes are not particles orbiting atoms, and not every injected pair produces an escaping photon.', '動きは模式的に遅く表示しています。正孔は原子の周りを回る粒子ではなく、注入した全ての対が外へ出る光子になるわけでもありません。')}</p></div>
<div id="pixel-controls" hidden><p class="eyebrow">${t('RELATIVE LINEAR CHANNEL OUTPUT', '各色の相対的な線形光出力')}</p>${['r', 'g', 'b'].map((k, i) => `<label for="${k}" class="ch ch-${k}">${[t('Red', '赤'), t('Green', '緑'), t('Blue', '青')][i]}<output id="${k}-out"></output></label><input id="${k}" class="ch-${k}" type="range" min="0" max="100" value="${S[k] * 100}">`).join('')}<div class="presets"><button data-rgb="0,0,0">${t('Black', '黒')}</button><button data-rgb="1,1,1">${t('White', '白')}</button><button data-rgb="1,1,0">${t('Yellow', '黄')}</button><button data-rgb="1,0,1">${t('Magenta', 'マゼンタ')}</button></div><label for="dist">${t('Viewing distance', '見る距離')}<output id="dist-out"></output></label><input id="dist" type="range" min="0" max="100" value="15"><div class="mix"><div id="swatch"></div><p>${t('Seen from a distance', '離れて見た色')}<strong id="hex"></strong></p></div><p class="note">${t('A diamond-type layout: green subpixels at twice the density of red and blue, as in many phone panels. Real shapes and sizes vary by manufacturer. Step back with the distance slider and the subpixels merge into one colour. The preview uses sRGB encoding; it is not a calibrated spectrum or power estimate.', 'ダイヤモンド型の配列です。多くのスマートフォン用パネルと同じく、緑のサブピクセルは赤や青の2倍の密度で並びます。実際の形や大きさはメーカーによって異なります。距離のスライダーで離れると、サブピクセルが一つの色に溶け合います。色表示はsRGB変換を用いたもので、校正済みのスペクトルや消費電力の推定ではありません。')}</p></div>
<div class="detail" aria-live="polite"><p class="eyebrow" id="detail-kicker"></p><h2 id="detail-title"></h2><p id="detail-body"></p></div>
</aside></section>
<div class="model-note">${t('TOP-EMISSION RGB AMOLED · Thicknesses, gaps, colours, subpixel and particle sizes are exaggerated: real organic layers are tens of nanometres thick, while cover glass is several hundred micrometres. The exploded state is for inspection, not an operating panel.', '上面発光RGB AMOLED · 層の厚さ、間隔、色、サブピクセルや粒子の大きさは誇張しています。実際の有機層の厚さは数十ナノメートル、カバーガラスは数百マイクロメートルです。分解表示は観察用で、動作中のパネルの状態ではありません。')}</div>
<section class="reading"><div><p class="eyebrow">${t('THE BIG PICTURE', '全体像')}</p><h2>${t('Electricity in. Light out.', '電気を入れ、光を取り出す。')}</h2><p>${t('OLED means organic light-emitting diode. “Organic” refers to carbon-based semiconductor materials. A forward voltage injects electrons and holes from opposite electrodes; transport layers guide them into a region where excited states can release light. [1, 2]', 'OLEDは有機発光ダイオードの略です。「有機」は炭素を基盤とする半導体材料を指します。順方向の電圧で両側の電極から電子と正孔を注入し、輸送層がそれらを発光領域へ導きます。そこで生じた励起状態から光が放出されます。[1, 2]')}</p><p>${t('The photon energy is E = hc/λ. Shorter wavelengths carry more energy per photon. Changing current mainly changes light output; changing the emissive material changes the spectrum. A brightness slider does not turn a red emitter into a blue one.', '光子のエネルギーは E = hc/λ です。波長が短いほど、一つの光子のエネルギーが大きくなります。主に電流が光量を、発光材料がスペクトルを決めます。明るさを調整しても赤の発光材料が青に変わるわけではありません。')}</p></div><div><p class="eyebrow">${t('FROM ONE DIODE TO A DISPLAY', '一つの素子からディスプレイへ')}</p><h2>${t('Millions of independent decisions.', '無数の画素を、個別に制御する。')}</h2><p>${t('An AMOLED backplane addresses subpixels and controls their drive current. A pixel programmed off emits essentially no light of its own: OLED does not need to block a shared backlight to make black. Room light can still reflect from the panel. [3]', 'AMOLEDのバックプレーンはサブピクセルを選択し、駆動電流を制御します。消灯した画素はほぼ自発光しないため、黒を作るのに共通のバックライトを遮る必要がありません。ただし室内光はパネル表面で反射します。[3]')}</p><p>${t('That does not mean a black image makes the whole display consume zero power: driver electronics still operate. Water and oxygen can damage the organic stack, so encapsulation is essential. [4]', '黒い画像でもディスプレイ全体の消費電力がゼロになるわけではありません。駆動回路などは動作しています。水分や酸素は有機層を傷めるため、封止が重要です。[4]')}</p></div></section>
<section class="variants"><p class="eyebrow">${t('ONE PRINCIPLE, DIFFERENT COLOUR ARCHITECTURES', '発光原理は共通、色の作り方は多様')}</p><h2>${t('Not every OLED is an RGB stack.', 'すべてのOLEDがRGB発光ではありません。')}</h2><div class="variant-grid"><article><h3>RGB OLED</h3><p>${t('Separate red, green and blue organic emitters produce the primaries directly. This is the architecture illustrated above. [1]', '赤・緑・青の有機発光材料で、それぞれの色を直接作ります。上の教材モデルはこの方式です。[1]')}</p></article><article><h3>WOLED</h3><p>${t('A white-emitting OLED stack supplies light to colour filters. Common TV implementations also include an unfiltered white subpixel. White emission can come from multiple emissive units. [5]', '白色光を作るOLED積層とカラーフィルターを組み合わせます。一般的なテレビ用では、フィルターを通さない白サブピクセルも使います。複数の発光ユニットで白色光を作る場合があります。[5]')}</p></article><article><h3>QD-OLED</h3><p>${t('Blue OLED emission excites quantum dots that convert some light to red or green; the blue channel transmits blue light. It remains self-emissive at the subpixel level. [6]', '青色OLEDの光で量子ドットを励起し、一部を赤や緑に変換します。青の経路は青色光を通します。サブピクセル単位で自発光する方式です。[6]')}</p></article></div></section>
<footer><h2>${t('Sources & model boundaries', '出典とモデルの範囲')}</h2><ol><li><a href="https://oled.com/oleds/">Universal Display Corporation: OLED structure</a></li><li><a href="https://news.samsungdisplay.com/4660">Samsung Display: OLED principle & structure</a></li><li><a href="https://global.samsungdisplay.com/30927">Samsung Display: Backplane</a></li><li><a href="https://global.samsungdisplay.com/29626">Samsung Display: Encapsulation</a></li><li><a href="https://www.lgdisplay.com/eng/technology/tandem-woled">LG Display: Tandem WOLED</a></li><li><a href="https://global.samsungdisplay.com/31428">Samsung Display: QD-OLED emission architecture</a></li></ol><p>${t('A conceptual explainer, not a device simulation. No measured layer dimensions, carrier mobility, quantum efficiency, lifetime or luminance are inferred. Circuit details are reduced to one transistor, one capacitor and the two address lines per subpixel; optical interference and the polariser’s wavelength dependence are omitted.', '概念を理解するための解説であり、素子シミュレーションではありません。層寸法、キャリア移動度、量子効率、寿命、輝度の測定値を示すものではありません。回路は各サブピクセルにつきトランジスタ1個、容量1個、2本の配線に簡略化しています。光の干渉や偏光板の波長依存性は省略しています。')}</p><p>${t('14 September 2026, revised 6 October 2026 · English / Japanese', '2026年9月14日、2026年10月6日改訂 · 英語・日本語')}</p></footer></main>`;

const $ = id => document.getElementById(id);
let renderer, composer, bloom, scene, camera, controls, stackGroup, layerObjs = [], charges, colourGrid, shafts, tags = [], needs = true, narrow = false;
const P = .36, NX = 14, NY = 9, PW = NX * P, PD = NY * P;
const EMIT = [new THREE.Color(1, .02, .01), new THREE.Color(.03, 1, .06), new THREE.Color(.02, .05, 1)];
// Relative emitting area per lattice cell (red and blue at half density, green at full): used so the
// distant average matches the linear RGB values in the swatch.
const AREA_W = [1, .98, .68];

// ------------------------------------------------------------ geometry helpers
function diamond(s, r = .025) { const sh = new THREE.Shape(); const k = s - r * 1.4; sh.moveTo(k, 0); sh.quadraticCurveTo(s, 0, k, r * 1.4 * .7); sh.lineTo(r * 1.4 * .7, k); sh.quadraticCurveTo(0, s, -r * 1.4 * .7, k); sh.lineTo(-k, r * 1.4 * .7); sh.quadraticCurveTo(-s, 0, -k, -r * 1.4 * .7); sh.lineTo(-r * 1.4 * .7, -k); sh.quadraticCurveTo(0, -s, r * 1.4 * .7, -k); sh.closePath(); return sh; }
function ellipse(a, b) { const sh = new THREE.Shape(); sh.absellipse(0, 0, a, b, 0, Math.PI * 2, false, 0); return sh; }
function flatExtrude(shape, h, bevel = .006) { const g = new THREE.ExtrudeGeometry(shape, {depth: Math.max(.001, h - 2 * bevel), bevelEnabled: true, bevelThickness: bevel, bevelSize: bevel, bevelSegments: 2, curveSegments: 18}); g.rotateX(-Math.PI / 2); g.translate(0, bevel, 0); return g; }
// Diamond-type layout: red and blue on a checkerboard of lattice sites, green at cell centres.
function sites(nx, ny, p) {
  const out = {R: [], B: [], G: []};
  for (let i = 0; i < nx; i++) for (let j = 0; j < ny; j++) { const x = (i - (nx - 1) / 2) * p, z = (j - (ny - 1) / 2) * p; ((i + j) % 2 ? out.B : out.R).push([x, z, 0]); }
  for (let i = 0; i < nx - 1; i++) for (let j = 0; j < ny - 1; j++) { const x = (i + .5 - (nx - 1) / 2) * p, z = (j + .5 - (ny - 1) / 2) * p; out.G.push([x, z, (i + j) % 2 ? Math.PI / 4 : -Math.PI / 4]); }
  return out;
}
const SUBGEO = {R: () => flatExtrude(diamond(.125), .045), B: () => flatExtrude(diamond(.152), .045), G: () => flatExtrude(ellipse(.088, .058), .045)};
function instanced(geo, mat, list, y, scale = 1, parent) {
  const m = new THREE.InstancedMesh(geo, mat, list.length), o = new THREE.Object3D();
  list.forEach(([x, z, rot], i) => { o.position.set(x, y, z); o.rotation.set(0, rot || 0, 0); o.scale.setScalar(scale); o.updateMatrix(); m.setMatrixAt(i, o.matrix); });
  parent.add(m); return m;
}
function canvasTex(w, h, draw, srgb = true) { const c = document.createElement('canvas'); c.width = w; c.height = h; draw(c.getContext('2d'), w, h); const tx = new THREE.CanvasTexture(c); if (srgb) tx.colorSpace = THREE.SRGBColorSpace; tx.anisotropy = 8; return tx; }
const slab = (th, r = .012) => new RoundedBoxGeometry(PW, th, PD, 2, Math.min(r, th / 2.2));

// ------------------------------------------------------------ the stack
function buildStack() {
  stackGroup = new THREE.Group(); scene.add(stackGroup);
  const st = sites(NX, NY, P);
  const glassy = (col, op, extra = {}) => new THREE.MeshPhysicalMaterial({color: col, roughness: .18, metalness: 0, transparent: true, opacity: op, clearcoat: .6, clearcoatRoughness: .15, depthWrite: false, ...extra});
  for (const [i, L] of layers.entries()) {
    const g = new THREE.Group(); g.userData.layer = i; stackGroup.add(g);
    const obj = {g, mats: [], th: L.th, pick: null, outline: null};
    const add = (geo, mat, y = 0) => { const m = new THREE.Mesh(geo, mat); m.position.y = y; g.add(m); obj.mats.push([mat, mat.opacity ?? 1, mat.transparent]); return m; };
    const base = {
      0: () => add(slab(L.th), new THREE.MeshPhysicalMaterial({color: '#b5711f', roughness: .32, clearcoat: .7, clearcoatRoughness: .2, transmission: .25, thickness: .1, sheen: .3, sheenColor: '#ffd29a'})),
      1: () => add(slab(L.th), new THREE.MeshPhysicalMaterial({color: '#1d2b2f', roughness: .35, metalness: .2, clearcoat: .5})),
      2: () => add(slab(L.th * .5), new THREE.MeshPhysicalMaterial({color: '#20282d', roughness: .45})),
      3: () => add(slab(L.th), glassy('#e7a85c', .32)),
      4: () => add(slab(.012), glassy('#c9e9dc', .16)),
      5: () => add(slab(L.th), glassy('#7fb3e6', .3)),
      6: () => add(slab(L.th, .006), new THREE.MeshPhysicalMaterial({color: '#cfc8e4', metalness: .9, roughness: .16, transparent: true, opacity: .5, depthWrite: false})),
      7: () => { add(slab(.018, .006), glassy('#a8c9da', .38), -.031); add(slab(.044, .01), glassy('#eef6f8', .16), 0); add(slab(.018, .006), glassy('#a8c9da', .38), .031); return g.children[1]; },
      8: () => add(slab(L.th), new THREE.MeshPhysicalMaterial({color: '#59626c', roughness: .3, transparent: true, opacity: .62, depthWrite: false, clearcoat: .8, map: canvasTex(512, 512, (c, w, h) => { c.fillStyle = '#8d96a0'; c.fillRect(0, 0, w, h); c.strokeStyle = '#6a737c'; c.lineWidth = 1; for (let k = -h; k < w; k += 6) { c.beginPath(); c.moveTo(k, 0); c.lineTo(k + h, h); c.stroke(); } })})),
      9: () => add(slab(L.th, .03), new THREE.MeshPhysicalMaterial({color: '#ffffff', roughness: .03, metalness: 0, transmission: 1, thickness: .16, ior: 1.5, attenuationColor: '#cfeee6', attenuationDistance: 2.5, specularIntensity: 1, clearcoat: 1, clearcoatRoughness: .02})),
    }[i]();
    obj.pick = base;
    // Details per layer.
    if (i === 1) {
      const metal = new THREE.MeshPhysicalMaterial({color: '#c9ced3', metalness: 1, roughness: .28}), poly = new THREE.MeshPhysicalMaterial({color: '#6f6a8c', metalness: .3, roughness: .3, iridescence: .5}), cap = new THREE.MeshPhysicalMaterial({color: '#b88d5a', metalness: 1, roughness: .3});
      const y0 = L.th / 2 + .004, all = [...st.R, ...st.B, ...st.G];
      for (let j = 0; j < NY * 2 - 1; j++) { const m = add(new THREE.BoxGeometry(PW - .1, .008, .022), metal, y0); m.position.z = (j / 2 - (NY - 1) / 2) * P + .09; }
      for (let k = 0; k < NX * 2 - 1; k++) { const m = add(new THREE.BoxGeometry(.018, .008, PD - .1), metal, y0); m.position.x = (k / 2 - (NX - 1) / 2) * P - .1; }
      instanced(new THREE.BoxGeometry(.12, .012, .05), poly, all.map(([x, z]) => [x + .03, z + .03]), y0 + .008, 1, g);
      instanced(new THREE.BoxGeometry(.03, .02, .1), metal, all.map(([x, z]) => [x + .03, z + .03]), y0 + .012, 1, g);
      instanced(new THREE.BoxGeometry(.075, .01, .075), cap, all.map(([x, z]) => [x - .055, z - .03]), y0 + .006, 1, g);
      instanced(new THREE.CylinderGeometry(.016, .016, .03, 12), metal, all.map(([x, z]) => [x + .07, z - .05]), y0 + .015, 1, g);
      obj.mats.push([metal, 1, false], [poly, 1, false], [cap, 1, false]);
    }
    if (i === 2) {
      const ag = new THREE.MeshPhysicalMaterial({color: '#e9eef2', metalness: 1, roughness: .12});
      for (const k of ['R', 'B', 'G']) instanced(SUBGEO[k](), ag, st[k], -.012, 1.12, g);
      obj.mats.push([ag, 1, false]);
      const pdl = canvasTex(1024, Math.round(1024 * PD / PW), (c, w, h) => { c.fillStyle = '#fff'; c.fillRect(0, 0, w, h); c.fillStyle = '#000'; const sx = w / PW, X = x => (x + PW / 2) * sx, Z = z => (z + PD / 2) * sx; for (const [x, z] of [...st.R]) { c.save(); c.translate(X(x), Z(z)); c.rotate(Math.PI / 4); c.fillRect(-.1 * sx, -.1 * sx, .2 * sx, .2 * sx); c.restore(); } for (const [x, z] of st.B) { c.save(); c.translate(X(x), Z(z)); c.rotate(Math.PI / 4); c.fillRect(-.122 * sx, -.122 * sx, .244 * sx, .244 * sx); c.restore(); } for (const [x, z, r] of st.G) { c.save(); c.translate(X(x), Z(z)); c.rotate(-r); c.beginPath(); c.ellipse(0, 0, .1 * sx, .07 * sx, 0, 0, 7); c.fill(); c.restore(); } }, false);
      const pm = new THREE.MeshPhysicalMaterial({color: '#6b5236', roughness: .5, alphaMap: pdl, transparent: true, opacity: .95, clearcoat: .4});
      const pdlMesh = new THREE.Mesh(new THREE.BoxGeometry(PW, .03, PD), pm); pdlMesh.position.y = .012; g.add(pdlMesh); obj.mats.push([pm, .95, true]);
    }
    if (i === EML) {
      obj.sub = {};
      for (const [ci, k] of ['R', 'G', 'B'].entries()) {
        const m = new THREE.MeshBasicMaterial({color: EMIT[ci].clone()});
        const im = instanced(SUBGEO[k](), m, st[k], .004, 1, g); im.userData.ci = ci; obj.sub[k] = im; obj.mats.push([m, 1, false]);
        for (let n = 0; n < st[k].length; n++) im.setColorAt(n, new THREE.Color(1, 1, 1));
      }
    }
    // Selection outline.
    const out = new THREE.LineSegments(new THREE.EdgesGeometry(new THREE.BoxGeometry(PW + .04, Math.max(L.th, .03) + .02, PD + .04)), new THREE.LineBasicMaterial({color: '#9ff0c8', transparent: true, opacity: .9}));
    out.visible = false; g.add(out); obj.outline = out;
    layerObjs.push(obj);
  }
  // Light leaving each subpixel, upward through the layers above (top emission).
  const st2 = sites(NX, NY, P), all = [...st2.R.map(s => [...s, 0]), ...st2.G.map(s => [...s, 1]), ...st2.B.map(s => [...s, 2])];
  const geo = new THREE.CylinderGeometry(.05, .08, 1, 16, 1, true); geo.translate(0, .5, 0);
  const mat = new THREE.ShaderMaterial({transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, vertexColors: false,
    vertexShader: 'varying vec3 vC; varying float vY; void main(){ vC=instanceColor; vY=position.y; gl_Position=projectionMatrix*modelViewMatrix*instanceMatrix*vec4(position,1.); }',
    fragmentShader: 'varying vec3 vC; varying float vY; void main(){ float a=(1.-vY)*(1.-vY)*.24; gl_FragColor=vec4(vC*1.4,a); }'});
  shafts = new THREE.InstancedMesh(geo, mat, all.length); shafts.userData.all = all; shafts.instanceColor = new THREE.InstancedBufferAttribute(new Float32Array(all.length * 3), 3);
  stackGroup.add(shafts);
}
function layerGap(view) { return view === 1 ? .46 : .03 + S.spread * .6; }
function layoutStack() {
  const gap = layerGap(S.view); let y = 0; const ys = [];
  const sc = S.view === 1 ? .42 : 1; stackGroup.scale.set(sc, 1, sc);
  for (const L of layers) { ys.push(y + L.th / 2); y += L.th + gap; }
  const mid = (y - gap) / 2;
  layerObjs.forEach((o, i) => { o.g.position.y = ys[i] - mid; });
  // Shafts: from the emissive layer to the top of the cover glass.
  const y0 = layerObjs[EML].g.position.y + .03, y1 = layerObjs[9].g.position.y + layers[9].th / 2, o = new THREE.Object3D(), c = new THREE.Color();
  const lv = [S.view === 2 ? S.r : .85, S.view === 2 ? S.g : .7, S.view === 2 ? S.b : .8];
  shafts.userData.all.forEach(([x, z, , ci], n) => { o.position.set(x, y0, z); o.scale.set(ci === 1 ? .9 : 1.25, Math.max(.01, y1 - y0), ci === 1 ? .9 : 1.25); o.updateMatrix(); shafts.setMatrixAt(n, o.matrix); c.copy(EMIT[ci]).multiplyScalar(lv[ci] * .55); shafts.instanceColor.setXYZ(n, c.r, c.g, c.b); });
  shafts.instanceMatrix.needsUpdate = true; shafts.instanceColor.needsUpdate = true;
  shafts.visible = S.view === 0 && S.spread > .05;
}
function styleStack() {
  const sel = S.layer;
  layerObjs.forEach((o, i) => {
    const ghost = S.view === 1 ? (i >= 2 && i <= 6 ? (i === EML ? 1 : .55) : .18) : (S.view === 0 && sel !== null && i !== sel ? .62 : 1);
    for (const [m, op, tr] of o.mats) { const target = op * ghost; const needT = tr || target < .999; if (m.transparent !== needT) { m.transparent = needT; m.needsUpdate = true; } m.opacity = target; if (m.transmission !== undefined && m.transmission > .5) m.transmission = ghost < 1 ? .6 : 1; }
    o.outline.visible = S.view === 0 && i === sel;
    o.g.visible = S.view !== 2 || i === EML || i === 2;
  });
  // Subpixel emission: view 0 shows a balanced, softly lit panel; view 1 lights only the active green subpixel; view 2 follows the sliders.
  const sub = layerObjs[EML].sub, lv = S.view === 2 ? [S.r, S.g, S.b] : S.view === 1 ? [0, 0, 0] : [.85, .7, .8];
  for (const [k, im] of Object.entries(sub)) { const ci = im.userData.ci; im.material.color.copy(EMIT[ci]).multiplyScalar(.03 + 1.7 * lv[ci]); im.material.color.lerp(new THREE.Color(.03, .03, .035), lv[ci] < .01 ? .6 : 0); }
  layerObjs[2].g.visible = S.view !== 2;
}

// ------------------------------------------------------------ charge pair (view 2 of the story)
function buildCharges() {
  charges = new THREE.Group(); scene.add(charges);
  const glow = (c, r) => new THREE.Mesh(new THREE.SphereGeometry(r, 20, 14), new THREE.MeshBasicMaterial({color: new THREE.Color(c).multiplyScalar(2.2)}));
  const label = ch => { const cv = document.createElement('canvas'); cv.width = cv.height = 128; const x = cv.getContext('2d'); x.fillStyle = '#fff'; x.font = 'bold 96px sans-serif'; x.textAlign = 'center'; x.textBaseline = 'middle'; x.fillText(ch, 64, 70); const s = new THREE.Sprite(new THREE.SpriteMaterial({map: new THREE.CanvasTexture(cv), depthTest: false})); s.scale.set(.3, .3, 1); s.position.y = .26; s.renderOrder = 5; return s; };
  charges.userData.pairs = [];
  for (let k = 0; k < 6; k++) {
    const main = k === 0, e = glow('#4f9dff', main ? .11 : .05), h = glow('#ffa64d', main ? .11 : .05), ph = glow('#7dffa8', main ? .07 : .045), ex = glow('#c8ffd8', main ? .16 : .1);
    if (main) { e.add(label('−')); h.add(label('+')); }
    ex.material.transparent = true;
    const trail = []; for (let n = 0; n < 6; n++) { const s = glow('#7dffa8', (main ? .05 : .03) * (1 - n / 7)); s.material.transparent = true; s.material.opacity = .6 * (1 - n / 6); charges.add(s); trail.push(s); }
    charges.add(e, h, ph, ex);
    charges.userData.pairs.push({e, h, ph, ex, trail, x: main ? 0 : (k % 2 ? -1 : 1) * (.1 + .07 * k), z: main ? 0 : (k % 3 - 1) * .14, off: main ? 0 : k * .17, tilt: main ? 0 : (k % 2 ? -.18 : .2), main});
  }
  // The single green subpixel that this event belongs to.
  const sp = new THREE.Mesh(SUBGEO.G(), new THREE.MeshBasicMaterial({color: EMIT[1].clone().multiplyScalar(.1)})); sp.scale.setScalar(3.6); charges.add(sp); charges.userData.sp = sp;
}
const smooth = x => x * x * (3 - 2 * x), clamp01 = x => Math.max(0, Math.min(1, x));
function animateCharges() {
  if (!charges) return;
  const yc = layerObjs[6].g.position.y, ye = layerObjs[EML].g.position.y, ya = layerObjs[2].g.position.y, top = layerObjs[9].g.position.y + .3;
  charges.userData.sp.position.set(0, ye + .004, 0);
  let flash = 0;
  for (const pr of charges.userData.pairs) {
    const p = (S.phase + pr.off) % 1, m = smooth(clamp01((p - .08) / .47));
    pr.e.position.set(pr.x - .06 * (1 - m), yc + (ye - yc) * m, pr.z); pr.h.position.set(pr.x + .06 * (1 - m), ya + (ye - ya) * m, pr.z);
    const pairVis = p < .56; pr.e.visible = pr.h.visible = pairVis; pr.e.scale.setScalar(p < .08 ? p / .08 : 1); pr.h.scale.setScalar(p < .08 ? p / .08 : 1);
    const exa = clamp01((p - .5) / .08) * (1 - clamp01((p - .74) / .06)); pr.ex.visible = exa > .01; pr.ex.position.set(pr.x, ye, pr.z); pr.ex.material.opacity = exa; pr.ex.scale.setScalar(.6 + .6 * exa + .15 * Math.sin(p * 90));
    if (pr.main) flash = exa;
    const f = clamp01((p - .74) / .26); pr.ph.visible = p >= .74;
    const py = ye + (top - ye) * f; pr.ph.position.set(pr.x + pr.tilt * (py - ye) + .05 * Math.sin(f * 40), py, pr.z);
    pr.trail.forEach((s, n) => { const ff = clamp01(f - (n + 1) * .025), yy = ye + (top - ye) * ff; s.visible = pr.ph.visible && ff > 0; s.position.set(pr.x + pr.tilt * (yy - ye) + .05 * Math.sin(ff * 40), yy, pr.z); });
  }
  charges.userData.sp.material.color.copy(EMIT[1]).multiplyScalar(.08 + 1.1 * flash + (S.phase > .74 ? .4 * (1 - S.phase) : 0));
}

// ------------------------------------------------------------ colour mixing grid (view 3 of the story)
function buildColourGrid() {
  colourGrid = new THREE.Group(); scene.add(colourGrid);
  const NX2 = 40, NY2 = 26, st = sites(NX2, NY2, P);
  const base = new THREE.Mesh(new THREE.BoxGeometry(NX2 * P, .05, NY2 * P), new THREE.MeshPhysicalMaterial({color: '#0d0c0b', roughness: .35, clearcoat: 1, clearcoatRoughness: .1}));
  base.position.y = -.03; colourGrid.add(base);
  const mats = EMIT.map(c => new THREE.MeshBasicMaterial({color: c.clone()}));
  colourGrid.userData.mats = mats;
  instanced(SUBGEO.R(), mats[0], st.R, 0, 1, colourGrid); instanced(SUBGEO.G(), mats[1], st.G, 0, 1, colourGrid); instanced(SUBGEO.B(), mats[2], st.B, 0, 1, colourGrid);
}

// ------------------------------------------------------------ labels with leader lines
function makeTag(text, anchor, view, dx, dy, opts = {}) {
  const el = document.createElement('span'); el.className = 'tag'; el.textContent = text; $('tags').append(el);
  const svg = $('tags').querySelector('svg'), line = document.createElementNS('http://www.w3.org/2000/svg', 'path'), dot = document.createElementNS('http://www.w3.org/2000/svg', 'circle'); dot.setAttribute('r', '2.5'); svg.append(line, dot);
  const tag = {el, line, dot, anchor, view, dx, dy, ...opts}; tags.push(tag); return tag;
}
function layoutTags() {
  const host = $('canvas-host'), box = host.getBoundingClientRect(), off = host.offsetTop, v = new THREE.Vector3(), placed = [];
  const svg = $('tags').querySelector('svg'); svg.setAttribute('viewBox', `0 0 ${$('tags').clientWidth} ${$('tags').clientHeight}`);
  const sorted = tags.slice().sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
  for (const T of sorted) {
    const show = T.view === S.view && (!T.when || T.when());
    const hide = () => { T.el.hidden = true; T.line.style.display = T.dot.style.display = 'none'; };
    if (!show) { hide(); continue; }
    T.anchor(v); v.project(camera);
    const ax = (v.x * .5 + .5) * box.width, ay = off + (-v.y * .5 + .5) * box.height;
    if (v.z > 1 || ax < 0 || ax > box.width || ay < off || ay > off + box.height) { hide(); continue; }
    T.el.hidden = false; T.el.classList.toggle('on', !!(T.active && T.active()));
    const w = T.el.offsetWidth, h = T.el.offsetHeight, k = narrow ? .5 : 1;
    let left = T.dx >= 0 ? ax + T.dx * k : ax + T.dx * k - w, top = ay + T.dy * k - h / 2;
    if (T.column !== undefined) { left = T.column >= 0 ? box.width - w - 12 : 12; }
    left = Math.max(6, Math.min(box.width - w - 6, left)); top = Math.max(off + 4, Math.min(off + box.height - h - 4, top));
    for (let pass = 0; pass < 8; pass++) for (const p of placed) if (left < p.left + p.w + 3 && left + w + 3 > p.left && top < p.top + p.h + 3 && top + h + 3 > p.top) top = (T.stackUp ? p.top - h - 4 : p.top + p.h + 4);
    placed.push({left, top, w, h});
    T.el.style.left = left + 'px'; T.el.style.top = top + 'px';
    const right = left > ax, ex = right ? left : left + w, ey = top + h / 2;
    T.line.style.display = T.dot.style.display = '';
    T.line.setAttribute('d', `M${ax.toFixed(1)},${ay.toFixed(1)} L${(ex + (right ? -12 : 12)).toFixed(1)},${ey.toFixed(1)} L${ex.toFixed(1)},${ey.toFixed(1)}`);
    T.dot.setAttribute('cx', ax.toFixed(1)); T.dot.setAttribute('cy', ay.toFixed(1));
    T.line.classList.toggle('on', T.el.classList.contains('on')); T.dot.classList.toggle('on', T.el.classList.contains('on'));
  }
}

// ------------------------------------------------------------ renderer
function paintBackground() {
  const c = document.createElement('canvas'); c.width = c.height = 512; const g = c.getContext('2d');
  const gr = g.createRadialGradient(256, 200, 10, 256, 260, 430); gr.addColorStop(0, '#24262a'); gr.addColorStop(.55, '#151719'); gr.addColorStop(1, '#0b0c0d');
  g.fillStyle = gr; g.fillRect(0, 0, 512, 512); const tx = new THREE.CanvasTexture(c); tx.colorSpace = THREE.SRGBColorSpace; return tx;
}
async function studioEnv(pmrem) {
  try {
    const hdr = await new HDRLoader().loadAsync('/assets/hdri/studio_small_09_1k.hdr'); hdr.mapping = THREE.EquirectangularReflectionMapping;
    const env = new THREE.Scene(); env.background = hdr;
    for (const [w, h, i, p] of [[3, .6, 6, [-.5, .8, .35]], [.4, 2.6, 4, [.9, .2, -.3]], [2.4, .3, 3, [.1, .3, .95]]]) { const m = new THREE.Mesh(new THREE.PlaneGeometry(w, h), new THREE.MeshBasicMaterial({color: new THREE.Color(1, .98, .95).multiplyScalar(i), side: THREE.DoubleSide})); m.position.set(...p).multiplyScalar(4.5); m.lookAt(0, 0, 0); env.add(m); }
    scene.environment = pmrem.fromScene(env, 0, .1, 100).texture; hdr.dispose(); needs = true;
  } catch (e) { /* RoomEnvironment remains */ }
}
try {
  const mobile = matchMedia('(max-width: 740px), (pointer: coarse)').matches;
  renderer = new THREE.WebGLRenderer({antialias: false, powerPreference: 'high-performance'}); renderer.setPixelRatio(Math.min(devicePixelRatio, mobile ? 1.6 : 1.75));
  renderer.outputColorSpace = THREE.SRGBColorSpace; renderer.toneMapping = THREE.NeutralToneMapping; renderer.toneMappingExposure = 1;
  $('canvas-host').append(renderer.domElement); renderer.domElement.setAttribute('aria-label', t('Interactive OLED teaching model', '操作できるOLED教材モデル')); renderer.domElement.setAttribute('role', 'img');
  scene = new THREE.Scene(); scene.background = paintBackground();
  camera = new THREE.PerspectiveCamera(30, 1, .1, 200);
  controls = new OrbitControls(camera, renderer.domElement); controls.enableDamping = false; controls.minDistance = 3; controls.maxDistance = 60; controls.enablePan = false;
  const pmrem = new THREE.PMREMGenerator(renderer); const room = new RoomEnvironment(); scene.environment = pmrem.fromScene(room, .04).texture; room.dispose(); studioEnv(pmrem);
  const key = new THREE.DirectionalLight(0xffffff, 1.2); key.position.set(-3, 8, 5); scene.add(key);
  buildStack(); buildCharges(); buildColourGrid();
  composer = new EffectComposer(renderer, new THREE.WebGLRenderTarget(1, 1, {type: THREE.HalfFloatType, samples: 4}));
  composer.addPass(new RenderPass(scene, camera));
  bloom = new UnrealBloomPass(new THREE.Vector2(256, 256), .6, .45, .95); composer.addPass(bloom);
  composer.addPass(new OutputPass());
  // Layer tags (view 0) on the right-hand edge of each slab; charge-view tags on the left.
  layers.forEach((L, i) => makeTag(L.name, v => layerObjs[i].g.localToWorld(v.set(PW / 2, 0, PD / 2)), 0, 46, 0, {order: -i, stackUp: false, when: () => !narrow || i === S.layer, active: () => i === S.layer}));
  [[8, t('Polariser', '偏光板')], [7, t('Encapsulation', '封止層')], [6, t('Cathode (−)', '陰極（−）')], [5, t('Electron transport', '電子輸送層')], [EML, t('Emissive layer', '発光層')], [3, t('Hole transport', '正孔輸送層')], [2, t('Anode (+)', '陽極（＋）')], [9, t('Cover glass', 'カバーガラス')]].forEach(([i, text]) => makeTag(text, v => layerObjs[i].g.localToWorld(v.set(-PW / 2, 0, PD / 2)), 1, -46, 0, {order: -i}));
  const ray = new THREE.Raycaster(), mouse = new THREE.Vector2(); let down;
  renderer.domElement.addEventListener('pointerdown', e => down = [e.clientX, e.clientY]);
  renderer.domElement.addEventListener('pointerup', e => { if (S.view !== 0 || !down || Math.hypot(e.clientX - down[0], e.clientY - down[1]) > 5) return; const b = renderer.domElement.getBoundingClientRect(); mouse.set((e.clientX - b.left) / b.width * 2 - 1, -(e.clientY - b.top) / b.height * 2 + 1); ray.setFromCamera(mouse, camera); const hit = ray.intersectObjects(layerObjs.map(o => o.pick), false)[0]; if (hit) { S.layer = hit.object.parent.userData.layer; update(); } });
  new ResizeObserver(() => { const b = $('canvas-host').getBoundingClientRect(); if (!b.width) return; renderer.setSize(b.width, b.height); composer.setSize(b.width, b.height); camera.aspect = b.width / b.height; camera.updateProjectionMatrix(); const was = narrow; narrow = camera.aspect < .9 || b.width < 520; if (was !== narrow) reset(); needs = true; }).observe($('canvas-host'));
  renderer.domElement.addEventListener('webglcontextlost', e => { e.preventDefault(); $('fallback').hidden = false; });
  controls.addEventListener('change', () => { needs = true; });
} catch (e) { $('fallback').hidden = false; console.error(e); renderer = null; }

const CAMS = [{p: [8.4, 5.6, 10.2], t: [0, -.3, 0]}, {p: [5.4, 2.0, 8.2], t: [0, 0, 0]}, {p: [0, 8, 4.2], t: [0, 0, 0]}];
function reset() {
  if (!camera) return; const c = CAMS[S.view], tg = new THREE.Vector3(...c.t);
  let pos = new THREE.Vector3(...c.p).sub(tg).multiplyScalar(narrow ? (S.view === 1 ? 1.5 : 1.32) : 1);
  if (S.view === 2) pos.multiplyScalar(.55 + 3.2 * S.dist * S.dist);
  camera.position.copy(pos.add(tg)); controls.target.copy(tg); controls.update(); needs = true;
}
function update() {
  document.querySelectorAll('[data-view]').forEach(b => b.setAttribute('aria-pressed', Number(b.dataset.view) === S.view));
  ['stack', 'charge', 'pixel'].forEach((v, i) => $(v + '-controls').hidden = S.view !== i);
  $('scene-title').textContent = views[S.view]; $('spread-out').textContent = Math.round(S.spread * 100) + '%'; $('phase-out').textContent = Math.round(S.phase * 100) + '%';
  $('dist-out').textContent = Math.round(S.dist * 100) + '%';
  $('play').textContent = S.play ? t('Pause', '一時停止') : t('Play', '再生'); $('play').setAttribute('aria-pressed', S.play);
  document.querySelectorAll('[data-layer]').forEach(b => b.setAttribute('aria-pressed', Number(b.dataset.layer) === S.layer));
  const phase = Math.min(3, Math.floor(S.phase * 4));
  document.querySelectorAll('.phase-steps span').forEach((s, i) => s.classList.toggle('on', i === phase));
  const titles = [t('Inject opposite charges', '反対符号の電荷を注入'), t('Transport toward the emissive layer', '発光層へ輸送'), t('Form an excited state', '励起状態を形成'), t('Release a photon', '光子を放出')];
  const bodies = [t('Electrons enter from the cathode above; holes enter from the anode below. − and + mark the two carrier types.', '上側の陰極から電子、下側の陽極から正孔が入ります。−と＋はキャリアの種類を示します。'), t('Electric fields and material energy levels govern transport. The straight paths shown here are explanatory, not molecular trajectories.', '電場と材料のエネルギー準位が輸送を左右します。直線の経路は説明用で、分子スケールの軌道ではありません。'), t('An electron and a hole form an excited state in the emissive region. The flash marks this state, not a miniature physical explosion.', '発光領域で電子と正孔が励起状態を形成します。光る球はこの状態の記号で、物理的な爆発を示していません。'), t('Radiative relaxation emits light. The highlighted photon leaves straight up through the cathode, encapsulation, polariser and glass; real emission has an angular distribution, and some light stays trapped or is absorbed.', '光を伴う緩和で発光します。強調した光子は陰極、封止層、偏光板、ガラスを通ってまっすぐ上へ出ますが、実際の発光は角度分布をもち、一部の光は閉じ込められたり吸収されたりします。')];
  $('detail-kicker').textContent = S.view === 0 ? t('SELECTED LAYER', '選択中の層') : S.view === 1 ? t('CURRENT STAGE', '現在の段階') : t('ADDITIVE COLOUR', '加法混色');
  $('detail-title').textContent = S.view === 0 ? layers[S.layer].name : S.view === 1 ? titles[phase] : t('Three channels. One perceived colour.', '三つの色を、一つの色として見る。');
  $('detail-body').textContent = S.view === 0 ? layers[S.layer].body : S.view === 1 ? bodies[phase] : t('Red plus green looks yellow. All channels off makes black; balanced channels make a neutral grey or white in this ideal sRGB model.', '赤と緑を重ねると黄色に見えます。全て消灯すると黒になります。この理想化したsRGBモデルでは、三色を同じ強さにすると無彩色になります。');
  ['r', 'g', 'b'].forEach(k => $(k + '-out').textContent = Math.round(S[k] * 100) + '%');
  const rgb = new THREE.Color().setRGB(S.r, S.g, S.b, THREE.LinearSRGBColorSpace), hex = '#' + rgb.getHexString(); $('swatch').style.background = hex; $('hex').textContent = hex.toUpperCase();
  $('stage-legend').innerHTML = S.view === 1 ? `<span><b class="q e">−</b>${t('Electron', '電子')}</span><span><b class="q h">+</b>${t('Hole', '正孔')}</span><span><b class="q x">✦</b>${t('Exciton', '励起子')}</span><span><b class="q p">~</b>${t('Photon', '光子')}</span>` : S.view === 2 ? `<span><i style="background:#ff3b30"></i>R</span><span><i style="background:#38e070"></i>G ×2</span><span><i style="background:#3d6bff"></i>B</span>` : `<span><i class="sw" style="background:linear-gradient(90deg,#ff3b30,#38e070,#3d6bff)"></i>${t('Light leaving each subpixel', '各サブピクセルから出る光')}</span>`;
  if (!scene) return;
  stackGroup.visible = S.view !== 2; charges.visible = S.view === 1; colourGrid.visible = S.view === 2;
  layoutStack(); styleStack(); animateCharges();
  if (S.view === 2) { colourGrid.userData.mats.forEach((m, i) => m.color.copy(EMIT[i]).multiplyScalar(.015 + .8 * AREA_W[i] * [S.r, S.g, S.b][i])); }
  renderer.domElement.style.filter = S.view === 2 && S.dist > .35 ? `blur(${((S.dist - .35) / .65 * 9).toFixed(2)}px)` : '';
  bloom.strength = S.view === 2 ? .45 + .25 * S.dist : S.view === 1 ? .7 : .5; bloom.threshold = S.view === 2 ? .12 : S.view === 1 ? .55 : .6; bloom.radius = S.view === 2 ? .35 + .3 * S.dist : .45;
  needs = true;
}
document.querySelectorAll('[data-view]').forEach(b => b.onclick = () => { S.view = +b.dataset.view; update(); reset(); save(); });
document.querySelectorAll('[data-layer]').forEach(b => b.onclick = () => { S.layer = +b.dataset.layer; update(); });
$('spread').oninput = e => { S.spread = +e.target.value / 100; update(); save(); };
$('phase').oninput = e => { S.play = false; S.phase = +e.target.value / 100; update(); };
$('play').onclick = () => { S.play = !S.play; update(); };
$('dist').oninput = e => { S.dist = +e.target.value / 100; update(); reset(); save(); };
['r', 'g', 'b'].forEach(k => $(k).oninput = e => { S[k] = +e.target.value / 100; update(); save(); });
document.querySelectorAll('[data-rgb]').forEach(b => b.onclick = () => { b.dataset.rgb.split(',').forEach((v, i) => { const k = ['r', 'g', 'b'][i]; S[k] = +v; $(k).value = +v * 100; }); update(); save(); });
$('reset').onclick = reset;
function langHref() { return (location.pathname.includes('oled-panel-lab') ? (ja ? '/oled-panel-lab/' : '/ja/oled-panel-lab/') : (ja ? '../' : 'ja/')) + location.search + location.hash; }
function save() { const p = new URLSearchParams(location.search); p.set('view', S.view); p.set('rgb', [S.r, S.g, S.b].join(',')); p.set('spread', S.spread); p.set('dist', S.dist); history.replaceState(null, '', location.pathname + '?' + p + location.hash); $('language').href = langHref(); }
const params = new URLSearchParams(location.search);
if (params.has('view')) S.view = Math.max(0, Math.min(2, Number(params.get('view')) || 0));
if (params.has('spread')) { S.spread = Math.max(0, Math.min(1, Number(params.get('spread')) || 0)); $('spread').value = S.spread * 100; }
if (params.has('dist')) { S.dist = Math.max(0, Math.min(1, Number(params.get('dist')) || 0)); $('dist').value = S.dist * 100; }
if (params.has('layer')) S.layer = Math.max(0, Math.min(layers.length - 1, Number(params.get('layer')) || 0));
if (params.has('phase')) { S.phase = Math.max(0, Math.min(.999, Number(params.get('phase')) || 0)); S.play = false; $('phase').value = S.phase * 100; }
if (params.has('rgb')) params.get('rgb').split(',').slice(0, 3).forEach((v, i) => { const k = ['r', 'g', 'b'][i]; S[k] = Math.max(0, Math.min(1, Number(v) || 0)); $(k).value = S[k] * 100; });
$('language').href = langHref();
update(); reset();
let prev = 0, lastPhase = -1;
function frame(now) {
  const dt = prev ? Math.min((now - prev) / 1000, .05) : 0; prev = now;
  if (!document.hidden && S.view === 1 && S.play) { S.phase = (S.phase + dt / 7) % 1; $('phase').value = S.phase * 100; $('phase-out').textContent = Math.round(S.phase * 100) + '%'; const ph = Math.floor(S.phase * 4); if (ph !== lastPhase) { lastPhase = ph; update(); } animateCharges(); needs = true; }
  if (needs && renderer && !document.hidden) { composer.render(); layoutTags(); needs = false; window.__labFrames = (window.__labFrames || 0) + 1; }
  requestAnimationFrame(frame);
}
requestAnimationFrame(frame);
