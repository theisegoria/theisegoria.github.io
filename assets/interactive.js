(() => {
  const shell = document.querySelector('[data-lesson]');
  if (!shell) return;

  const lang = document.documentElement.lang.toLowerCase().startsWith('ja') ? 'ja' : 'en';
  const topic = shell.dataset.lesson;
  const t = (en, ja) => (lang === 'ja' ? ja : en);
  const format = (value, digits = 2) => {
    if (!Number.isFinite(value)) return '—';
    const threshold = 10 ** -digits / 2;
    const safe = Math.abs(value) < threshold ? 0 : value;
    return safe.toLocaleString(lang === 'ja' ? 'ja-JP' : 'en-US', {
      minimumFractionDigits: 0,
      maximumFractionDigits: digits,
    });
  };

  const clamp = (value, min, max) => Math.min(max, Math.max(min, value));

  function renderScharr() {
    const mount = shell.querySelector('[data-interactive-mount]');
    if (!mount) return;

    const presets = {
      vertical: [0, 0, 255, 0, 0, 255, 0, 0, 255],
      horizontal: [0, 0, 0, 0, 0, 0, 255, 255, 255],
      diagonal: [0, 0, 255, 0, 255, 255, 255, 255, 255],
      ramp: [64, 96, 128, 64, 96, 128, 64, 96, 128],
      flat: [128, 128, 128, 128, 128, 128, 128, 128, 128],
    };
    const labels = {
      vertical: t('Vertical edge', '垂直エッジ'),
      horizontal: t('Horizontal edge', '水平エッジ'),
      diagonal: t('Diagonal edge', '対角エッジ'),
      ramp: t('Linear ramp', '線形ランプ'),
      flat: t('Flat field', '一様な領域'),
    };
    const state = { pixels: [...presets.diagonal], preset: 'diagonal' };

    mount.innerHTML = `
      <div class="workbench-bar">
        <span class="workbench-status">${t('Live convolution', 'ライブ畳み込み')}</span>
        <p>${t('Edit any pixel. Every readout updates from the normalized 3 × 3 Scharr kernels.', '任意の画素を編集できます。正規化された 3 × 3 Scharr カーネルから全ての値を即時更新します。')}</p>
      </div>
      <div class="workbench-grid">
        <div class="workbench-controls">
          <div class="control-group">
            <span class="control-label">${t('Start with an image patch', '画像パッチを選ぶ')}</span>
            <div class="segmented" data-presets>
              ${Object.keys(presets).map((key) => `<button type="button" data-preset="${key}" aria-pressed="${key === state.preset}">${labels[key]}</button>`).join('')}
            </div>
          </div>
          <div class="control-group">
            <label class="control-label" id="pixel-grid-label">${t('Pixel intensities (0–255)', '画素強度（0〜255）')}</label>
            <div class="pixel-editor" role="group" aria-labelledby="pixel-grid-label">
              ${state.pixels.map((value, index) => `
                <label class="pixel-cell" data-pixel-cell="${index}" style="--pixel:${value};--pixel-ink:${value > 145 ? '#101827' : '#ffffff'}">
                  <span class="visually-hidden">${t(`Pixel row ${Math.floor(index / 3) + 1}, column ${(index % 3) + 1}`, `画素 ${Math.floor(index / 3) + 1} 行 ${(index % 3) + 1} 列`)}</span>
                  <input class="pixel-input" data-pixel="${index}" type="number" min="0" max="255" step="1" value="${value}">
                </label>`).join('')}
            </div>
            <p class="control-note">${t('Dark is 0; white is 255. Calculations stay signed and floating-point.', '黒は 0、白は 255。計算は符号付き浮動小数点で行います。')}</p>
          </div>
        </div>
        <div class="workbench-stage">
          <div class="scharr-stage">
            <div class="scharr-visual">
              <div class="kernel-pair" aria-label="${t('Scharr kernels', 'Scharr カーネル')}">
                <div class="kernel-card is-x">
                  <h3>K<sub>x</sub> / 32</h3>
                  <div class="kernel-grid" aria-label="Horizontal Scharr kernel">
                    ${[-3,0,3,-10,0,10,-3,0,3].map((v) => `<span>${v}</span>`).join('')}
                  </div>
                </div>
                <div class="kernel-card is-y">
                  <h3>K<sub>y</sub> / 32</h3>
                  <div class="kernel-grid" aria-label="Vertical Scharr kernel">
                    ${[-3,-10,-3,0,0,0,3,10,3].map((v) => `<span>${v}</span>`).join('')}
                  </div>
                </div>
              </div>
              <svg class="gradient-dial" viewBox="0 0 320 320" role="img" aria-labelledby="gradient-title gradient-desc">
                <title id="gradient-title">${t('Gradient and edge direction', '勾配とエッジ方向')}</title>
                <desc id="gradient-desc">${t('The solid arrow is the gradient; the dashed line is the detected edge tangent.', '実線の矢印が勾配、破線が検出されたエッジの接線です。')}</desc>
                <circle class="dial-ring" cx="160" cy="160" r="126" />
                <line class="dial-axis" x1="24" y1="160" x2="296" y2="160" />
                <line class="dial-axis" x1="160" y1="24" x2="160" y2="296" />
                <text class="dial-label" x="286" y="150">+x</text>
                <text class="dial-label" x="168" y="294">+y</text>
                <line class="dial-edge" data-edge x1="80" y1="160" x2="240" y2="160" />
                <line class="dial-arrow" data-arrow x1="160" y1="160" x2="246" y2="160" />
                <polygon class="dial-arrowhead" data-arrowhead points="246,160 230,151 230,169" />
                <circle class="dial-origin" cx="160" cy="160" r="5" />
              </svg>
            </div>
          </div>
        </div>
      </div>
      <div class="readout-grid" aria-live="polite">
        <div class="readout-item"><span>G<sub>x</sub></span><strong data-gx>—</strong></div>
        <div class="readout-item"><span>G<sub>y</sub></span><strong data-gy>—</strong></div>
        <div class="readout-item"><span>${t('Magnitude', '大きさ')} |G|</span><strong data-mag>—</strong></div>
        <div class="readout-item"><span>${t('Direction', '方向')} θ</span><strong data-angle>—</strong></div>
      </div>
      <div class="equation-strip" data-equation></div>`;

    const kx = [-3, 0, 3, -10, 0, 10, -3, 0, 3];
    const ky = [-3, -10, -3, 0, 0, 0, 3, 10, 3];
    const inputs = [...mount.querySelectorAll('[data-pixel]')];
    const cells = [...mount.querySelectorAll('[data-pixel-cell]')];
    const presetButtons = [...mount.querySelectorAll('[data-preset]')];

    function update() {
      const gxNumerator = state.pixels.reduce((sum, value, index) => sum + value * kx[index], 0);
      const gyNumerator = state.pixels.reduce((sum, value, index) => sum + value * ky[index], 0);
      const gx = gxNumerator / 32;
      const gy = gyNumerator / 32;
      const magnitude = Math.hypot(gx, gy);
      const angle = magnitude < 1e-9 ? 0 : Math.atan2(gy, gx);
      const degrees = angle * 180 / Math.PI;
      mount.querySelector('[data-gx]').textContent = format(gx);
      mount.querySelector('[data-gy]').textContent = format(gy);
      mount.querySelector('[data-mag]').textContent = format(magnitude);
      mount.querySelector('[data-angle]').textContent = magnitude < 1e-9 ? t('undefined', '未定義') : `${format(degrees, 1)}°`;
      mount.querySelector('[data-equation]').innerHTML = magnitude < 1e-9
        ? `<strong>${t('No preferred direction:', '優先方向なし：')}</strong> G<sub>x</sub> = G<sub>y</sub> = 0`
        : `<strong>atan2(G<sub>y</sub>, G<sub>x</sub>)</strong> = atan2(${format(gy)}, ${format(gx)}) = ${format(degrees, 1)}° · ${t('edge tangent', 'エッジ接線')} = ${format(degrees + 90, 1)}°`;

      const radius = magnitude < 1e-9 ? 0 : 92;
      const endX = 160 + radius * Math.cos(angle);
      const endY = 160 + radius * Math.sin(angle);
      const arrow = mount.querySelector('[data-arrow]');
      arrow.setAttribute('x2', endX);
      arrow.setAttribute('y2', endY);
      const tip = `${endX},${endY}`;
      const backX = endX - 16 * Math.cos(angle);
      const backY = endY - 16 * Math.sin(angle);
      const side = 9;
      const left = `${backX + side * Math.cos(angle + Math.PI / 2)},${backY + side * Math.sin(angle + Math.PI / 2)}`;
      const right = `${backX + side * Math.cos(angle - Math.PI / 2)},${backY + side * Math.sin(angle - Math.PI / 2)}`;
      mount.querySelector('[data-arrowhead]').setAttribute('points', `${tip} ${left} ${right}`);
      mount.querySelector('[data-arrowhead]').style.opacity = magnitude < 1e-9 ? '0' : '1';

      const tangent = angle + Math.PI / 2;
      const edgeLength = magnitude < 1e-9 ? 0 : 88;
      const edge = mount.querySelector('[data-edge]');
      edge.setAttribute('x1', 160 - edgeLength * Math.cos(tangent));
      edge.setAttribute('y1', 160 - edgeLength * Math.sin(tangent));
      edge.setAttribute('x2', 160 + edgeLength * Math.cos(tangent));
      edge.setAttribute('y2', 160 + edgeLength * Math.sin(tangent));

      inputs.forEach((input, index) => {
        if (document.activeElement !== input) input.value = state.pixels[index];
        cells[index].style.setProperty('--pixel', state.pixels[index]);
        cells[index].style.setProperty('--pixel-ink', state.pixels[index] > 145 ? '#101827' : '#ffffff');
      });
    }

    inputs.forEach((input) => {
      input.addEventListener('input', () => {
        const index = Number(input.dataset.pixel);
        const next = clamp(Number(input.value) || 0, 0, 255);
        state.pixels[index] = next;
        state.preset = 'custom';
        presetButtons.forEach((button) => button.setAttribute('aria-pressed', 'false'));
        update();
      });
      input.addEventListener('change', () => {
        const index = Number(input.dataset.pixel);
        state.pixels[index] = Math.round(clamp(Number(input.value) || 0, 0, 255));
        update();
      });
    });

    presetButtons.forEach((button) => {
      button.addEventListener('click', () => {
        const key = button.dataset.preset;
        state.pixels = [...presets[key]];
        state.preset = key;
        presetButtons.forEach((item) => item.setAttribute('aria-pressed', String(item === button)));
        update();
      });
    });

    update();
  }

  const renderers = { scharr: renderScharr };
  renderers[topic]?.();
})();
