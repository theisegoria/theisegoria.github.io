/* {{TITLE}}: scene and model.
 * Everything page-generic (renderer, resize, pausing, theme, disposal) lives in
 * /assets/lab-kit/lab-kit.js. This file is only the thing being explained. */
import * as THREE from 'three/webgpu';
import { Fn, positionLocal, normalLocal, sin, time, uniform, vec3, float, mix } from 'three/tsl';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { mountLab, bindControls, readColors, onThemeChange, isDark } from '/assets/lab-kit/lab-kit.js';

const canvas = document.getElementById('stage');
const panel = document.getElementById('controls');
const readout = document.getElementById('readout');

// Model parameters live in one plain object that the controls write to.
const params = { amplitude: 0.25, frequency: 3, speed: 1, wire: false };

// Uniforms are the bridge from params into the shader; TSL keeps them typed.
const uAmp = uniform(params.amplitude);
const uFreq = uniform(params.frequency);
const uSpeed = uniform(params.speed);
const uInk = uniform(new THREE.Color());
const uAccent = uniform(new THREE.Color());

const lab = await mountLab(canvas, {
  async setup({ renderer, scene, camera, lab }) {   // use this lab, not the outer const: it is not assigned until mountLab resolves
    camera.position.set(3.6, 2.4, 4.6);
    const controls = new OrbitControls(camera, canvas);
    controls.enableDamping = true;
    controls.addEventListener('change', () => lab.invalidate());

    scene.add(new THREE.HemisphereLight(0xffffff, 0x444444, 1.2));
    const key = new THREE.DirectionalLight(0xffffff, 2.5);
    key.position.set(3, 5, 2);
    scene.add(key);

    // A displaced surface: the vertex shader (TSL, compiles to WGSL or GLSL)
    // moves each vertex along its normal by a travelling wave.
    const material = new THREE.MeshStandardNodeMaterial({ roughness: 0.55, metalness: 0.05 });
    const phase = positionLocal.x.mul(uFreq).add(time.mul(uSpeed));
    const bump = sin(phase).mul(uAmp);
    material.positionNode = positionLocal.add(normalLocal.mul(bump));
    material.colorNode = mix(uInk, uAccent, bump.div(uAmp).mul(0.5).add(0.5));
    const geometry = new THREE.TorusKnotGeometry(0.9, 0.3, 220, 40);
    const mesh = new THREE.Mesh(geometry, material);
    scene.add(mesh);

    const grid = new THREE.GridHelper(6, 12);
    grid.position.y = -1.4;
    grid.material.transparent = true; grid.material.opacity = 0.25;
    scene.add(grid);

    const applyTheme = () => {
      const c = readColors(['--ink', '--accent', '--rule']);
      uInk.value.copy(c.ink); uAccent.value.copy(c.accent);
      grid.material.color.copy(c.rule);
      lab.invalidate();
    };
    applyTheme();
    const stopTheme = onThemeChange(applyTheme);

    let vertexCount = geometry.attributes.position.count;
    return {
      update(dt, t) {
        controls.update();
        material.wireframe = params.wire;
        if (readout) readout.innerHTML = `<span>backend <b>${lab.backend}</b></span><span>vertices <b>${vertexCount.toLocaleString()}</b></span><span>t <b>${t.toFixed(1)} s</b></span>`;
      },
      dispose() { controls.dispose(); stopTheme(); },
    };
  },
});

if (lab) {
  bindControls(panel, params, (p, name) => {
    uAmp.value = p.amplitude; uFreq.value = p.frequency; uSpeed.value = p.speed;
    // A speed of zero is a static scene: switch to on-demand rendering so the
    // GPU idles, and back to continuous when it moves again.
    lab.setOnDemand(p.speed === 0 || lab.reducedMotion);
    lab.invalidate();
  });
  if (lab.reducedMotion) { params.speed = 0; uSpeed.value = 0; }
}
