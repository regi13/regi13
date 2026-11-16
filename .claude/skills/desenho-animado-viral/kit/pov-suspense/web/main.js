import * as THREE from './lib/three.module.js';
import * as T from './toon.js';
import * as P from './paint.js';
import { M as E, ramp } from './motion.js';
import { SHOTS, TOTAL, shotAt, camAt, dofAt, LIGHTS, lightFor, actorsAt, worldAt, fxAt } from './story.js';

const W = 1080, H = 1920;
const canvas = document.getElementById('c');
const renderer = new THREE.WebGLRenderer({ canvas, antialias: false, preserveDrawingBuffer: true });
renderer.setPixelRatio(1); renderer.setSize(W, H, false);
renderer.shadowMap.enabled = true; renderer.shadowMap.type = THREE.PCFSoftShadowMap;
renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.toneMapping = THREE.NoToneMapping;

const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(40, W / H, 0.08, 1500);
const rx = (a) => a * Math.PI / 180;

// ---------- materials ----------
const grad = (() => { const d = new Uint8Array([90, 90, 90, 255, 255, 255, 255, 255]); const t = new THREE.DataTexture(d, 2, 1); t.minFilter = t.magFilter = THREE.NearestFilter; t.needsUpdate = true; return t; })();
const toon = (opts) => new THREE.MeshToonMaterial({ gradientMap: grad, ...opts });
const texM = (c, rx_ = 1, ry_ = 1, color = '#ffffff') => toon({ map: P.tex(c, rx_, ry_), color });
const M = {
  plank: texM(P.planks(1), 1, 6), beam: texM(P.beam(2), 1, 2), beamDark: texM(P.beam(3, [28, 36, 30]), 1, 2),
  rot: texM(P.rotten(4), 1, 1), rotB: texM(P.rotten(14), 1, 1),
  stone: texM(P.stone(4), 1, 1), stoneMoss: texM(P.mossy(P.stone(4), 5, 1.2), 1, 1),
  grass: texM(P.grass(6), 40, 40), dirt: texM(P.dirt(7), 6, 30), plaster: texM(P.plaster(8), 1, 1), plaster2: texM(P.plaster(18, 28), 1, 1),
  roof: texM(P.roof(9), 2, 2), marble: texM(P.marble(10), 1, 1), marbleTop: toon({ color: '#ece2cf' }),
  trunk: toon({ color: '#6a4a32' }), cypress: toon({ color: '#3f6b36' }), pine: toon({ color: '#5c8a3c' }), bush: toon({ color: '#6c9a42' }),
  hill: toon({ color: '#7aa64c' }), hillFar: toon({ color: '#86ad60' }), mount: toon({ color: '#8fa7b8' }), snow: toon({ color: '#f4f6fa' }),
  iron: toon({ color: '#5c5a57' }), bronze: toon({ color: '#b08a4a' }), wood: toon({ color: '#7a5434' }), door: toon({ color: '#5a3a24' }),
  window: toon({ color: '#2b2430' }), red: toon({ color: '#b8282b' }),
};
M.banner = new THREE.MeshToonMaterial({ gradientMap: grad, map: P.tex(P.banner()), alphaTest: 0.5, side: THREE.DoubleSide });
// helmet
const helmetIn = P.tex(P.helmetInside()); helmetIn.wrapS = helmetIn.wrapT = THREE.ClampToEdgeWrapping;
M.helmIn = new THREE.MeshToonMaterial({ gradientMap: grad, map: helmetIn, side: THREE.BackSide });
M.helmOut = toon({ color: '#8f8a7e' });

// ---------- ink / normal-depth contract ----------
const NOINK = 'noink'; // userData flag: never outlined (cards, fx, water handled specially)
const ndMat = new THREE.ShaderMaterial({
  vertexShader: `varying vec3 vN; varying float vD; void main(){ vN = normalize(normalMatrix*normal); vec4 mv = modelViewMatrix*vec4(position,1.); vD = -mv.z; gl_Position = projectionMatrix*mv; }`,
  fragmentShader: `varying vec3 vN; varying float vD; void main(){ vec3 n = normalize(vN); if(!gl_FrontFacing) n = -n; gl_FragColor = vec4(n*.5+.5, vD); }`,
  side: THREE.DoubleSide,
});
const cardNd = (map) => new THREE.ShaderMaterial({
  uniforms: { map: { value: map } },
  vertexShader: `varying vec2 vUv; varying float vD; void main(){ vUv=uv; vec4 mv = modelViewMatrix*vec4(position,1.); vD=-mv.z; gl_Position=projectionMatrix*mv; }`,
  fragmentShader: `uniform sampler2D map; varying vec2 vUv; varying float vD; void main(){ if(texture2D(map,vUv).a<.5) discard; gl_FragColor=vec4(0.,0.,0.,vD); }`,
  side: THREE.DoubleSide,
});
const waterNd = new THREE.ShaderMaterial({
  vertexShader: `varying float vD; void main(){ vec4 mv = modelViewMatrix*vec4(position,1.); vD=-mv.z; gl_Position=projectionMatrix*mv; }`,
  fragmentShader: `varying float vD; void main(){ gl_FragColor=vec4(.5,1.,.5,vD); }`,
});

// ---------- helpers ----------
const add = (geo, mat, x = 0, y = 0, z = 0, parent = scene, opts = {}) => {
  const m = new THREE.Mesh(geo, mat); m.position.set(x, y, z); m.castShadow = opts.cast ?? true; m.receiveShadow = true; parent.add(m); return m;
};
const box = (w, h, d) => new THREE.BoxGeometry(w, h, d);
const uvScale = (geo, su, sv) => { const uv = geo.attributes.uv; for (let i = 0; i < uv.count; i++) uv.setXY(i, uv.getX(i) * su, uv.getY(i) * sv); return geo; };
/** box with world-scaled UVs per face (texel density 1 tile per `t` metres) */
const tbox = (w, h, d, t = 2) => {
  const g = box(w, h, d), uv = g.attributes.uv;
  const dims = [[d, h], [d, h], [w, d], [w, d], [w, h], [w, h]];
  for (let f = 0; f < 6; f++) for (let k = 0; k < 4; k++) { const i = f * 4 + k; uv.setXY(i, uv.getX(i) * dims[f][0] / t, uv.getY(i) * dims[f][1] / t); }
  return g;
};

// ---------- sky ----------
const skyU = { top: { value: new THREE.Color() }, hor: { value: new THREE.Color() }, sunDir: { value: new THREE.Vector3() }, sunCol: { value: new THREE.Color() }, sunSize: { value: 0 } };
const sky = new THREE.Mesh(new THREE.SphereGeometry(1200, 32, 16), new THREE.ShaderMaterial({
  uniforms: skyU, side: THREE.BackSide, depthWrite: false, fog: false,
  vertexShader: `varying vec3 vP; void main(){ vP = normalize(position); gl_Position = projectionMatrix*modelViewMatrix*vec4(position,1.); }`,
  fragmentShader: `uniform vec3 top, hor, sunDir, sunCol; uniform float sunSize; varying vec3 vP;
    void main(){ float h = clamp(vP.y,0.,1.); vec3 c = mix(hor, top, pow(h, .55)); if(vP.y<0.) c = hor;
      float s = dot(normalize(vP), normalize(sunDir)); c += sunCol * (smoothstep(1.-sunSize, 1.-sunSize*.6, s) + .35*pow(max(s,0.), 24.)*step(.001,sunSize));
      gl_FragColor = vec4(c,1.); }`,
}));
sky.userData.sky = true; scene.add(sky);

// ---------- lights ----------
const hemi = new THREE.HemisphereLight('#ffffff', '#ffffff', 1); scene.add(hemi);
const sun = new THREE.DirectionalLight('#ffffff', 2); sun.castShadow = true;
sun.shadow.mapSize.set(2048, 2048); sun.shadow.bias = -0.0006; sun.shadow.normalBias = 0.03; sun.shadow.radius = 2;
scene.add(sun); scene.add(sun.target);
scene.fog = new THREE.Fog('#ffffff', 40, 600);

// ---------- world ----------
// Apartment (single room) seen in first person: kitchen counter (left), table, sofa + window (right), front door + intercom (back wall).
const DECK = 0;
const world = new THREE.Group(); scene.add(world);
const setG = {};
const labelTex = (text, w, h, bg, fg, font = 'bold 120px DejaVu Sans, sans-serif', border = '#2a1a10') => {
  const c = document.createElement('canvas'); c.width = w; c.height = h; const g = c.getContext('2d');
  g.fillStyle = bg; g.fillRect(0, 0, w, h); if (border) { g.strokeStyle = border; g.lineWidth = 14; g.strokeRect(7, 7, w - 14, h - 14); }
  g.font = font; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillStyle = fg; g.fillText(text, w / 2, h / 2);
  const t = P.tex(c); t.wrapS = t.wrapT = THREE.ClampToEdgeWrapping; return t;
};
M.glow = new THREE.MeshBasicMaterial({ color: '#ffbe6a', fog: true });
M.wallA = texM(P.plaster(8, 40), 1, 1, '#f1e1c6'); M.floorA = toon({ map: P.tex(P.planks(3)) });
M.cab = toon({ color: '#e9e2d2' }); M.cabTop = toon({ color: '#7d8791' }); M.fridge = toon({ color: '#dfe5e8' }); M.sofa = toon({ color: '#a6546a' }); M.cushion = toon({ color: '#c26b82' });
M.tableW = toon({ color: '#b08556' }); M.dark = toon({ color: '#23222a' }); M.metal = toon({ color: '#b9c1c8' }); M.cream = toon({ color: '#efe6d2' }); M.curtain = toon({ color: '#5f7fb0' });
M.strip = new THREE.MeshBasicMaterial({ color: '#fff6d8', fog: false }); M.led = new THREE.MeshBasicMaterial({ color: '#ff3b30', fog: false }); M.burner = new THREE.MeshBasicMaterial({ color: '#ff7a2e' });
// background city seen through the window (dusk / night)
const skyline = (night) => { const c = document.createElement('canvas'); c.width = 512; c.height = 300; const g = c.getContext('2d'); const gr = g.createLinearGradient(0, 0, 0, 300);
  if (night) { gr.addColorStop(0, '#0c1230'); gr.addColorStop(1, '#2a2f5c'); } else { gr.addColorStop(0, '#f4a85a'); gr.addColorStop(0.5, '#f7c48a'); gr.addColorStop(1, '#8d6aa8'); }
  g.fillStyle = gr; g.fillRect(0, 0, 512, 300); const r = P.rng(5);
  for (let i = 0; i < 11; i++) { const w = 36 + r() * 40, h = 90 + r() * 150, x = i * 48 + r() * 10; g.fillStyle = night ? '#0a0d1f' : '#4b3a5a'; g.fillRect(x, 300 - h, w, h);
    for (let k = 0; k < 14; k++) if (r() > (night ? 0.8 : 0.55)) { g.fillStyle = night ? '#ffd27a' : '#ffe6b0'; g.fillRect(x + 6 + (k % 4) * 9, 300 - h + 12 + Math.floor(k / 4) * 20, 6, 9); } }
  const t = P.tex(c); t.wrapS = t.wrapT = THREE.ClampToEdgeWrapping; return t; };
const skyDusk = new THREE.MeshBasicMaterial({ map: skyline(false) }), skyNight = new THREE.MeshBasicMaterial({ map: skyline(true) });
// ground outside (so nothing is void)
const groundMat = M.grass.clone(); groundMat.map = M.grass.map.clone(); groundMat.map.repeat.set(240, 240); groundMat.map.needsUpdate = true;
add(new THREE.PlaneGeometry(2400, 2400), groundMat, 0, -0.5, 0, world, { cast: false }).rotation.x = -Math.PI / 2;
const apt = new THREE.Group(); scene.add(apt);
const RW = 7, RD = 6, RH = 2.7;
add(tbox(RW + 0.4, 0.2, RD + 0.4, 2), M.floorA, 0, -0.088, 0, apt);
const DX = 0.2, DZ = -RD / 2 - 0.1, DW = 1.0, DH = 2.2;
{ const lw = (DX - DW / 2) - (-RW / 2 - 0.2), rw = (RW / 2 + 0.2) - (DX + DW / 2);
  add(tbox(lw, RH, 0.2, 2), M.wallA, -RW / 2 - 0.2 + lw / 2, RH / 2, DZ, apt); add(tbox(rw, RH, 0.2, 2), M.wallA, DX + DW / 2 + rw / 2, RH / 2, DZ, apt);
  add(tbox(DW, RH - DH, 0.2, 2), M.wallA, DX, DH + (RH - DH) / 2, DZ, apt); }
add(tbox(RW + 0.4, RH, 0.2, 2), M.wallA, 0, RH / 2, RD / 2 + 0.1, apt);
add(tbox(0.2, RH, RD, 2), M.wallA, -RW / 2 - 0.1, RH / 2, 0, apt); add(tbox(0.2, RH, RD, 2), M.wallA, RW / 2 + 0.1, RH / 2, 0, apt);
{ const c = add(new THREE.PlaneGeometry(RW + 0.4, RD + 0.4), M.cream.clone(), 0, RH, 0, apt, { cast: false }); c.rotation.x = Math.PI / 2; c.material.side = THREE.DoubleSide; }
for (const [w, d, x, z] of [[RW, 0.05, 0, -RD / 2 + 0.03], [RW, 0.05, 0, RD / 2 - 0.03]]) add(tbox(w, 0.14, d, 1), M.beamDark, x, 0.07, z, apt, { cast: false });
// ---- front door (real doorway in the back wall, corridor behind it) ----
M.doorWood = texM(P.planks(5), 1, 1, '#a36e46'); M.doorDark = toon({ color: '#6a4228' }); M.molding = toon({ color: '#5a3820' });
M.hallWall = toon({ color: '#e8dcc0' }); M.hallFloor = toon({ color: '#9a8e7e' });
// casing (room side)
for (const sx of [-1, 1]) add(tbox(0.12, DH + 0.1, 0.14, 1), M.beam, DX + sx * (DW / 2 + 0.06), (DH + 0.1) / 2, DZ + 0.12, apt, { cast: false });
add(tbox(DW + 0.36, 0.12, 0.14, 1), M.beam, DX, DH + 0.06, DZ + 0.12, apt, { cast: false });
// corridor beyond the door: floor, side walls, ceiling, far wall with a neighbour door, lamp
const corr = new THREE.Group(); apt.add(corr);
add(tbox(3.2, 0.1, 2.8, 2), M.hallFloor, DX, -0.05, DZ - 1.5, corr, { cast: false });
for (const sx of [-1, 1]) add(tbox(0.1, RH, 2.8, 2), M.hallWall, DX + sx * 1.6, RH / 2, DZ - 1.5, corr, { cast: false });
add(tbox(3.2, RH, 0.1, 2), M.hallWall, DX, RH / 2, DZ - 2.9, corr, { cast: false });
add(tbox(3.2, 0.1, 2.8, 2), M.cream, DX, RH + 0.05, DZ - 1.5, corr, { cast: false });
add(tbox(0.9, 2.1, 0.06, 1), M.doorWood, DX - 0.7, 1.05, DZ - 2.84, corr, { cast: false });
const lamp = add(new THREE.SphereGeometry(0.12, 12, 8), new THREE.MeshBasicMaterial({ color: '#fff3c8' }), DX, RH - 0.25, DZ - 1.4, corr, { cast: false }); lamp.userData.ndSkip = true;
const hall = lamp; // (kept name; visibility handled by door state)
// door leaf on a hinge (opens OUTWARD into the corridor)
const doorHinge = new THREE.Group(); doorHinge.position.set(DX - DW / 2 + 0.02, 0, DZ); apt.add(doorHinge);
add(tbox(0.96, 2.16, 0.06, 1), M.doorWood, 0.48, 1.08, 0, doorHinge);
for (const [yy, hh] of [[1.62, 0.8], [0.56, 0.78]]) {
  add(tbox(0.6, hh, 0.012, 1), M.doorDark, 0.48, yy, 0.036, doorHinge, { cast: false });
  for (const sy of [-1, 1]) add(tbox(0.66, 0.035, 0.02, 1), M.molding, 0.48, yy + sy * (hh / 2 + 0.018), 0.04, doorHinge, { cast: false });
  for (const sx of [-1, 1]) add(tbox(0.035, hh + 0.07, 0.02, 1), M.molding, 0.48 + sx * 0.318, yy, 0.04, doorHinge, { cast: false });
}
add(tbox(0.92, 0.12, 0.016, 1), toon({ color: '#5a3a1e' }), 0.48, 0.16, 0.036, doorHinge, { cast: false });        // kick plate
for (const yy of [0.35, 1.08, 1.8]) add(new THREE.CylinderGeometry(0.018, 0.018, 0.1, 8), toon({ color: '#d1a23c' }), 0.0, yy, 0.0, doorHinge); // hinges
const peep = add(new THREE.TorusGeometry(0.02, 0.008, 6, 14), toon({ color: '#d1a23c' }), 0.48, 1.58, 0.046, doorHinge, { cast: false }); add(new THREE.CylinderGeometry(0.013, 0.013, 0.012, 10), M.dark, 0.48, 1.58, 0.046, doorHinge, { cast: false }).rotation.x = Math.PI / 2;
add(box(0.09, 0.34, 0.012), toon({ color: '#c9a040' }), 0.84, 1.04, 0.04, doorHinge, { cast: false });   // lock plate
const lever = new THREE.Group(); lever.position.set(0.84, 1.02, 0.05); doorHinge.add(lever);
add(new THREE.CylinderGeometry(0.04, 0.04, 0.02, 14), M.brass || toon({ color: '#d1a23c' }), 0, 0, 0, lever).rotation.x = Math.PI / 2;
add(box(0.24, 0.04, 0.04), new THREE.MeshToonMaterial({ gradientMap: grad, color: '#e0b04a', emissive: '#6a4a12' }), -0.1, 0, 0.035, lever); add(new THREE.SphereGeometry(0.03, 10, 8), new THREE.MeshToonMaterial({ gradientMap: grad, color: '#e0b04a', emissive: '#6a4a12' }), -0.22, 0, 0.035, lever);
const bolt = new THREE.Group(); bolt.position.set(0.84, 1.3, 0.045); doorHinge.add(bolt);
add(new THREE.CylinderGeometry(0.035, 0.035, 0.03, 12), toon({ color: '#c9ced6' }), 0, 0, 0, bolt).rotation.x = Math.PI / 2;
add(box(0.07, 0.014, 0.02), M.dark, 0, 0, 0.02, bolt, { cast: false });
const stripG = new THREE.Group(); stripG.position.set(DX, 0, DZ + 0.035); apt.add(stripG);
const stripM = add(box(0.92, 0.014, 0.012), M.strip, 0, 0.012, 0, stripG, { cast: false }); stripM.userData.ndSkip = true;
const spill = add(new THREE.PlaneGeometry(1.9, 1.1), new THREE.MeshBasicMaterial({ map: P.tex(P.radial('255,240,200', 0.3)), transparent: true, depthWrite: false }), 0, 0.016, 0.5, stripG, { cast: false }); spill.rotation.x = -Math.PI / 2; spill.userData.ndSkip = true;
const glowD = add(new THREE.PlaneGeometry(0.95, 0.4), new THREE.MeshBasicMaterial({ map: (() => { const c = document.createElement('canvas'); c.width = 8; c.height = 128; const g = c.getContext('2d'); const gr = g.createLinearGradient(0, 128, 0, 0); gr.addColorStop(0, 'rgba(255,244,205,0.8)'); gr.addColorStop(1, 'rgba(255,244,205,0)'); g.fillStyle = gr; g.fillRect(0, 0, 8, 128); return P.tex(c); })(), transparent: true, depthWrite: false }), 0, 0.2, 0.004, stripG, { cast: false }); glowD.userData.ndSkip = true;
const feet = [-0.18, 0.2].map((x) => { const f = add(box(0.17, 0.02, 0.016), M.dark, x, 0.012, 0.004, stripG, { cast: false }); f.userData.ndSkip = true; return f; });
// ---- intercom unit ----
const icom = new THREE.Group(); icom.position.set(-0.95, 1.45, -RD / 2 + 0.07); apt.add(icom);
add(tbox(0.18, 0.32, 0.05, 1), M.cream, 0, 0, 0, icom); add(new THREE.CylinderGeometry(0.055, 0.055, 0.02, 14), M.dark, 0, 0.05, 0.03, icom).rotation.x = Math.PI / 2;
add(box(0.09, 0.03, 0.02), M.dark, 0, -0.08, 0.03, icom);
const led = add(new THREE.SphereGeometry(0.014, 8, 6), M.led, 0.06, 0.13, 0.03, icom, { cast: false }); led.userData.ndSkip = true;
// ---- kitchen (left wall) ----
add(tbox(0.7, 0.9, 3.4, 1), M.cab, -RW / 2 + 0.4, 0.45, 0.9, apt); add(tbox(0.72, 0.05, 3.42, 1), M.cabTop, -RW / 2 + 0.4, 0.92, 0.9, apt);
add(tbox(0.4, 0.8, 3.4, 1), M.cab, -RW / 2 + 0.25, 2.0, 0.9, apt);
add(tbox(0.7, 1.85, 0.72, 1), M.fridge, -RW / 2 + 0.4, 0.92, -2.4, apt);
add(new THREE.CylinderGeometry(0.17, 0.17, 0.02, 20), M.burner, -RW / 2 + 0.4, 0.955, 0.8, apt, { cast: false });
add(new THREE.CylinderGeometry(0.17, 0.17, 0.02, 20), M.dark, -RW / 2 + 0.4, 0.955, 1.3, apt, { cast: false });
// ---- table + chairs ----
add(new THREE.CylinderGeometry(0.62, 0.62, 0.05, 24), M.tableW, 0.9, 0.76, 0.5, apt); add(new THREE.CylinderGeometry(0.06, 0.08, 0.74, 10), M.dark, 0.9, 0.37, 0.5, apt);
for (const [x, z] of [[0.9, -0.4], [1.8, 0.5]]) { add(tbox(0.42, 0.05, 0.42, 1), M.tableW, x, 0.46, z, apt); add(tbox(0.42, 0.5, 0.05, 1), M.tableW, x, 0.72, z + (z < 0 ? -0.2 : 0.2), apt); for (const [dx, dz] of [[-0.18, -0.18], [0.18, -0.18], [-0.18, 0.18], [0.18, 0.18]]) add(tbox(0.04, 0.45, 0.04, 1), M.dark, x + dx, 0.22, z + dz, apt); }
add(new THREE.CylinderGeometry(0.1, 0.07, 0.1, 12), toon({ color: '#d85a4a' }), 0.7, 0.84, 0.5, apt);
// ---- sofa + window (right wall) ----
add(tbox(0.95, 0.45, 2.2, 1), M.sofa, RW / 2 - 0.7, 0.23, 1.5, apt); add(tbox(0.28, 0.6, 2.2, 1), M.sofa, RW / 2 - 0.27, 0.6, 1.5, apt);
add(tbox(0.7, 0.14, 0.9, 1), M.cushion, RW / 2 - 0.8, 0.52, 1.1, apt); add(tbox(0.7, 0.14, 0.9, 1), M.cushion, RW / 2 - 0.8, 0.52, 2.0, apt);
const win = add(new THREE.PlaneGeometry(2.4, 1.5), skyDusk, RW / 2 - 0.005, 1.6, -0.8, apt, { cast: false }); win.rotation.y = -Math.PI / 2; win.userData.ndSkip = false;
for (const [yy, hh, ww, dz] of [[2.38, 0.1, 2.6, 0], [0.82, 0.1, 2.6, 0]]) add(tbox(0.12, hh, ww, 1), M.beam, RW / 2 - 0.04, yy, -0.8, apt, { cast: false });
for (const dz of [-2.1, 0.5, -0.8]) add(tbox(0.12, 1.6, dz === -0.8 ? 0.06 : 0.1, 1), M.beam, RW / 2 - 0.04, 1.6, dz, apt, { cast: false });
add(tbox(0.12, 2.0, 0.5, 1), M.curtain, RW / 2 - 0.12, 1.4, -2.3, apt); add(tbox(0.12, 2.0, 0.5, 1), M.curtain, RW / 2 - 0.12, 1.4, 0.75, apt);
// wall clock + picture on the back wall
add(new THREE.CylinderGeometry(0.2, 0.2, 0.04, 20), M.cream, 1.6, 2.0, -RD / 2 + 0.05, apt, { cast: false }).rotation.x = Math.PI / 2;
add(box(0.012, 0.15, 0.01), M.dark, 1.6, 2.04, -RD / 2 + 0.08, apt, { cast: false }); add(box(0.1, 0.012, 0.01), M.dark, 1.64, 2.0, -RD / 2 + 0.08, apt, { cast: false });
add(new THREE.PlaneGeometry(0.8, 0.55), toon({ color: '#6fa6b8' }), -1.9, 1.8, -RD / 2 + 0.05, apt, { cast: false });

// clouds: painted billboards far away (no fog, no ink)
const clouds = [];
{ const r = P.rng(90);
  for (let i = 0; i < 14; i++) {
    const c = document.createElement('canvas'); c.width = 600; c.height = 400; const pen = new T.Pen(c.getContext('2d')); pen.ol = 0;
    pen.g.translate(300, 200); pen.g.scale(1.4, 1.2); pen.g.translate(-300, -200); T.fxCloud(pen, i + 1);
    const m = new THREE.Mesh(new THREE.PlaneGeometry(1, 0.667), new THREE.MeshBasicMaterial({ map: P.tex(c), transparent: true, fog: false, depthWrite: false }));
    const a = r() * Math.PI * 2, d = 650 + r() * 250; m.position.set(Math.cos(a) * d, 120 + r() * 160, Math.sin(a) * d); m.scale.setScalar(160 + r() * 140);
    m.userData.ndSkip = true; m.renderOrder = -1; scene.add(m); clouds.push(m);
  } }

// ---------- cards ----------
const CW = 1200, CH = 2000, CM = 2.25; // canvas px, card height in metres (design 600x1000 -> 2.25 m)
const cardGeo = new THREE.PlaneGeometry(CM * 0.6, CM); cardGeo.translate(0, CM / 2 - CM * 0.025, 0);
const blobTex = P.tex(P.radial('20,14,30', 0.6));
class Card {
  constructor(scale = 1) {
    [this.c, this.g] = (() => { const c = document.createElement('canvas'); c.width = CW; c.height = CH; return [c, c.getContext('2d')]; })();
    this.t = new THREE.CanvasTexture(this.c); this.t.colorSpace = THREE.SRGBColorSpace; this.t.anisotropy = 4;
    this.mat = new THREE.MeshBasicMaterial({ map: this.t, transparent: true, alphaTest: 0.02, side: THREE.DoubleSide, fog: true });
    this.mesh = new THREE.Mesh(cardGeo, this.mat); this.mesh.userData.nd = cardNd(this.t); this.mesh.castShadow = true;
    this.mesh.customDepthMaterial = new THREE.MeshDepthMaterial({ depthPacking: THREE.RGBADepthPacking, map: this.t, alphaTest: 0.5 });
    this.blob = new THREE.Mesh(new THREE.PlaneGeometry(1, 1), new THREE.MeshBasicMaterial({ map: blobTex, transparent: true, depthWrite: false, fog: true }));
    this.blob.rotation.x = -Math.PI / 2; this.blob.userData.ndSkip = true; this.blob.renderOrder = 1;
    scene.add(this.mesh); scene.add(this.blob); this.key = ''; this.mesh.visible = this.blob.visible = false;
  }
  draw(key, fn) {
    if (key === this.key) return; this.key = key;
    const g = this.g; g.setTransform(1, 0, 0, 1, 0, 0); g.clearRect(0, 0, CW, CH); g.setTransform(CW / 600, 0, 0, CH / 1000, 0, 0);
    const p = new T.Pen(g); fn(p); this.t.needsUpdate = true;
  }
}
const cards = []; const getCard = (i) => cards[i] || (cards[i] = new Card());

// ---------- render targets & post ----------
const rtColor = new THREE.WebGLRenderTarget(W, H, { samples: 4, type: THREE.HalfFloatType });
const rtNd = new THREE.WebGLRenderTarget(W, H, { type: THREE.HalfFloatType, minFilter: THREE.NearestFilter, magFilter: THREE.NearestFilter });
const rtInk = new THREE.WebGLRenderTarget(W, H, { type: THREE.HalfFloatType });
const fsCam = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1), fsGeo = new THREE.PlaneGeometry(2, 2);
const fs = (mat) => { const s = new THREE.Scene(); s.add(new THREE.Mesh(fsGeo, mat)); return s; };
const inkU = { col: { value: rtColor.texture }, nd: { value: rtNd.texture }, res: { value: new THREE.Vector2(W, H) }, px: { value: 1.6 }, fogCol: { value: new THREE.Color() },
  sat: { value: 1.08 }, lift: { value: new THREE.Color(0, 0, 0) }, gain: { value: new THREE.Color(1, 1, 1) }, vig: { value: 0.22 }, flash: { value: 0 } };
const inkScene = fs(new THREE.ShaderMaterial({ uniforms: inkU, vertexShader: `varying vec2 vUv; void main(){ vUv=uv; gl_Position=vec4(position.xy,0.,1.); }`,
  fragmentShader: `uniform sampler2D col, nd; uniform vec2 res; uniform float px, sat, vig, flash; uniform vec3 fogCol, lift, gain; varying vec2 vUv;
  float edgeAt(vec2 uv, float r){
    vec4 c = texture2D(nd, uv); if (dot(c.rgb,c.rgb) < .01) return 0.; float d = c.a; vec3 n = c.rgb*2.-1.;
    float e = 0.; float rr = r * clamp(7./d, .62, 1.25);
    for (int i=0;i<16;i++){ float a = float(i)*.785398 + (i>7 ? .39 : 0.); float k = i>7 ? .5 : 1.;
      vec2 o = vec2(cos(a), sin(a))*rr*k/res; vec4 s = texture2D(nd, uv+o);
      float ds = s.a; bool card = dot(s.rgb,s.rgb) < .01;
      if (card && ds > 0.) continue;            // character cards: never outlined by the world ink
      if (card) ds = 1e4;                        // sky
      vec3 ns = s.rgb*2.-1.;
      e = max(e, smoothstep(.006, .02, (ds - d)/d));                           // depth jump, near side only
      if (!card && abs(ds-d)/d < .06) e = max(e, smoothstep(.88, .72, dot(n, ns)) * .9); // crease
    }
    return e * (1. - smoothstep(140., 520., d)*.8);
  }
  void main(){
    vec3 c = texture2D(col, vUv).rgb;
    float e = edgeAt(vUv, px);
    c = mix(c, vec3(.012,.01,.014), e);
    if (flash < -0.5) c = vec3(e);
    float l = dot(c, vec3(.299,.587,.114)); c = mix(vec3(l), c, sat);
    c = c*gain + lift;
    vec2 q = vUv-.5; c *= 1. - vig*dot(q*vec2(1.,.75), q*vec2(1.,.75))*2.2;
    c = mix(c, vec3(1.), flash);
    gl_FragColor = vec4(c,1.); }` }));
const dofU = { src: { value: rtInk.texture }, nd: { value: rtNd.texture }, res: { value: new THREE.Vector2(W, H) }, focus: { value: 5 }, cinf: { value: 0 }, near: { value: 1 } };
const dofScene = fs(new THREE.ShaderMaterial({ uniforms: dofU, vertexShader: `varying vec2 vUv; void main(){ vUv=uv; gl_Position=vec4(position.xy,0.,1.); }`,
  fragmentShader: `uniform sampler2D src, nd; uniform vec2 res; uniform float focus, cinf, near; varying vec2 vUv;
  float coc(vec2 uv){ float d = texture2D(nd, uv).a; if (d <= 0.) d = 2000.; float k = 1. - focus/d; return k > 0. ? cinf*k : min(-k*cinf*near, cinf*1.4); }
  void main(){
    float c0 = coc(vUv);
    if (cinf < .5 || c0 < .6) { gl_FragColor = linearToOutputTexel(vec4(texture2D(src, vUv).rgb, 1.)); return; }
    vec3 acc = vec3(0.); float wsum = 0.;
    for (int i=0;i<48;i++){ float fi = float(i); float r = sqrt((fi+.5)/48.); float a = fi*2.39996;
      vec2 o = vec2(cos(a), sin(a))*r*c0/res; float cs = coc(vUv+o);
      float w = smoothstep(r*c0-1.5, r*c0+.5, cs + .5);
      acc += texture2D(src, vUv+o).rgb*w; wsum += w; }
    gl_FragColor = linearToOutputTexel(vec4(acc/max(wsum,1e-3), 1.)); }` }));
// final copy with sRGB handled by the renderer output (we render to screen with linear->sRGB in the shader chunk)
dofScene.children[0].material.toneMapped = false;

// ---------- per-frame state ----------
const tmpV = new THREE.Vector3();
function applyLight(L, f) {
  hemi.color.set(L.sky); hemi.groundColor.set(L.ground); hemi.intensity = L.hemi;
  sun.color.set(L.sun); sun.intensity = L.sunI;
  scene.fog.color.set(L.fog); scene.fog.near = L.fogNear; scene.fog.far = L.fogFar;
  skyU.top.value.set(L.skyTop); skyU.hor.value.set(L.skyHor); skyU.sunCol.value.set(L.sunDisc || '#000'); skyU.sunSize.value = L.sunSize || 0;
  inkU.sat.value = L.sat; inkU.gain.value.set(L.gain || '#ffffff'); inkU.lift.value.set(L.lift || '#000000');
}
function placeSun(L, focus) {
  // sun direction from azimuth/elevation in world space
  const az = rx(L.az), el = rx(L.el); tmpV.set(Math.cos(el) * Math.cos(az), Math.sin(el), Math.cos(el) * Math.sin(az));
  skyU.sunDir.value.copy(tmpV);
  sun.position.copy(focus).addScaledVector(tmpV, 80); sun.target.position.copy(focus);
  const ext = L.shadowExt || 30, sc = sun.shadow.camera; sc.left = -ext; sc.right = ext; sc.top = ext; sc.bottom = -ext; sc.near = 1; sc.far = 200; sc.updateProjectionMatrix();
}

function worldState(S, f) {
  win.material = S.night ? skyNight : skyDusk;
  doorHinge.rotation.y = (S.door || 0) * 1.35 + (S.shake ? Math.sin(f * 2.4) * S.shake * 0.01 : 0);
  glowD.visible = false; spill.visible = false;
  lever.rotation.z = S.lever || 0; bolt.rotation.z = S.bolt || 0;
  led.visible = !!S.led; icom.position.y = 1.45;
  stripG.visible = false; feet.forEach((fo) => { fo.visible = false; });
  M.burner.color.set(S.dark ? '#3a1a10' : '#ff7a2e');
}

function drawActors(list, cam) {
  cards.forEach((c) => { c.mesh.visible = c.blob.visible = false; });
  list.forEach((a, i) => {
    const c = getCard(i);
    c.draw(a.key, a.draw);
    c.mesh.visible = true; c.mesh.position.set(a.x, a.y, a.z);
    const s = a.s || 1; c.mesh.scale.set(s * (a.flip ? -1 : 1), s, s);
    c.mesh.rotation.set(0, Math.atan2(cam.position.x - a.x, cam.position.z - a.z) + (a.yaw || 0), a.roll || 0);
    c.mat.color.set(a.tint || '#ffffff'); c.mat.opacity = a.alpha ?? 1;
    c.mesh.castShadow = a.shadow !== false;
    c.mesh.renderOrder = a.order || 2;
    if (a.blob !== false && a.y < DECK + 0.5) { c.blob.visible = true; c.blob.position.set(a.x, (a.ground ?? DECK) + 0.02, a.z); c.blob.scale.set(0.95 * s, 0.6 * s, 1); }
  });
}

const swapForNd = (on) => {
  scene.traverse((o) => {
    if (!o.isMesh) return;
    if (on) {
      o.userData.mat0 = o.material;
      if (o.userData.ndSkip) { o.userData.vis0 = o.visible; o.visible = false; return; }
      if (o === sky || o.userData.sky) { o.userData.vis0 = o.visible; o.visible = false; return; }
      o.material = o.userData.nd || ndMat;
    } else {
      o.material = o.userData.mat0; if (o.userData.vis0 !== undefined) { o.visible = o.userData.vis0; delete o.userData.vis0; }
    }
  });
};

window.renderFrame = (f) => {
  const S = shotAt(f), L = lightFor(S, f), C = camAt(f);
  applyLight(L, f);
  camera.position.set(...C.pos); camera.up.set(0, 1, 0); camera.lookAt(...C.look); camera.rotateZ(rx(C.roll || 0));
  camera.fov = C.fov; camera.updateProjectionMatrix(); camera.updateMatrixWorld();
  const W_ = worldAt(f); worldState(W_, f);
  placeSun(L, new THREE.Vector3(...(C.shadowAt || C.look)));
  drawActors([...actorsAt(f, T), ...fxAt(f, T)], camera);
  sky.position.copy(camera.position);
  for (const c of clouds) c.quaternion.copy(camera.quaternion);
  // pass A: colour
  renderer.setRenderTarget(rtColor); renderer.setClearColor(0x000000, 1); renderer.clear(); renderer.render(scene, camera);
  // pass B: normal + depth
  const fog = scene.fog; scene.fog = null; const sm = renderer.shadowMap.enabled; renderer.shadowMap.enabled = false; renderer.shadowMap.autoUpdate = false;
  swapForNd(true); renderer.setRenderTarget(rtNd); renderer.setClearColor(0x000000, 0); renderer.clear(); renderer.render(scene, camera); swapForNd(false);
  scene.fog = fog; renderer.shadowMap.enabled = sm; renderer.shadowMap.autoUpdate = true;
  if (window.DEBUG_ND) { const dm = new THREE.MeshBasicMaterial({ map: rtNd.texture }); const ds = fs(dm); renderer.setRenderTarget(null); renderer.render(ds, fsCam); return true; }
  // ink + grade
  const D = dofAt(f);
  inkU.px.value = 2.5; inkU.flash.value = window.DEBUG_E ? -1 : (C.flash || 0); inkU.vig.value = L.vig ?? 0.22;
  renderer.setRenderTarget(rtInk); renderer.render(inkScene, fsCam);
  // lens
  dofU.focus.value = D.focus; dofU.cinf.value = D.cinf; dofU.near.value = D.near ?? 1;
  renderer.setRenderTarget(null); renderer.render(dofScene, fsCam);
  return true;
};
window.TOTAL = TOTAL;
window.ready = true;
