// "O interfone" — POV thriller. Master timeline in SECONDS (S table); frames = round(s*30). Audio is placed on the same table.
import { M as E, camFromKeys, idle, blinkAt, q, clamp, lerp, lerp3, ramp } from './motion.js';
import { MAP, NEW_TOTAL } from './tmap.js';
export const FPS = 30;
export const TS = {  // timeline anchors (seconds)
  mae: [1.3, 5.4], door_open: 4.55, door_close: 5.5, lock: [5.9, 7.4], intercom: [8.0, 16.8],
  react1: [17.0, 19.9], baixinho: [19.9, 23.0], blackout: 23.4, calma: [24.2, 29.3],
  phone1: [29.6, 36.6], hall: [36.6, 47.4], feet: 42.6, phone2: [47.4, 53.8], maçaneta: [53.8, 58.6], knock: [58.6, 60.7],
  voz: [60.9, 66.0], vb5: [66.2, 79.6], por_favor: [80.4, 83.0], card: [83.6, 89.0], end: 89.0,
};
export const TOTAL = Math.round(NEW_TOTAL * 30);
// new-time -> design-time (piecewise linear between group boundaries)
const sOld = (sn) => { for (let i = 1; i < MAP.length; i++) { const [o1, n1] = MAP[i], [o0, n0] = MAP[i - 1]; if (sn <= n1 || i === MAP.length - 1) return o0 + (o1 - o0) * clamp((sn - n0) / Math.max(n1 - n0, 1e-6), 0, 1.0001); } return 0; };
const O = (f) => sOld(f / 30) * 30;   // fractional design-frame: animation stays smooth when a group is stretched
const F = (s) => Math.round(s * 30);
export const SHOTS = [
  { id: 'cozinha', a: 0, b: 1.3, light: 'warm', set: 'apt' }, { id: 'mae', a: 1.3, b: 5.9, light: 'warm' }, { id: 'tranca', a: 5.9, b: 7.9, light: 'warm' },
  { id: 'interfone', a: 7.9, b: 16.9, light: 'warm' }, { id: 'react1', a: 16.9, b: 19.9, light: 'warm' }, { id: 'janela', a: 19.9, b: 23.4, light: 'warm' },
  { id: 'react2', a: 23.4, b: 29.5, light: 'dark' }, { id: 'phone1', a: 29.5, b: 36.6, light: 'dark' }, { id: 'hall', a: 36.6, b: 47.4, light: 'dark' },
  { id: 'phone2', a: 47.4, b: 53.8, light: 'dark' }, { id: 'macaneta', a: 53.8, b: 58.6, light: 'dark' }, { id: 'knock', a: 58.6, b: 66.1, light: 'dark' },
  { id: 'react3', a: 66.1, b: 70.0, light: 'dark' }, { id: 'phone3', a: 70.0, b: 72.6, light: 'dark' }, { id: 'react4', a: 72.6, b: 77.0, light: 'dark' },
  { id: 'porta2', a: 77.0, b: 83.6, light: 'dark' }, { id: 'card', a: 83.6, b: 89.0, light: 'dark' },
].map((s) => ({ ...s, a: F(s.a), b: F(s.b) - 1, set: 'apt' }));
const shotAt0 = (f) => SHOTS.find((s) => f >= s.a && f < s.b + 1) || SHOTS[SHOTS.length - 1];
const smooth = E.smooth;

// ---------- lights ----------
const base = { fogNear: 90, fogFar: 1100, az: 120, el: 60, sky: '#fff3dc', ground: '#c9a56e', hemi: 1.45, sun: '#ffe6bf', sunI: 1.0, fog: '#cadcf0', skyTop: '#3f80d4', skyHor: '#c3daf2', sat: 1.12, vig: 0.28, shadowExt: 9, gain: '#ffffff', lift: '#000000' };
const DARK = { ...base, az: 0, el: 35, sky: '#7a8fe0', ground: '#34406a', hemi: 1.5, sunI: 1.3, sun: '#8fa8ff', sat: 1.0, vig: 0.38, gain: '#bccbff', lift: '#101640', shadowExt: 6 };
const mix = (a, b, t) => { const pa = [1, 3, 5].map((i) => parseInt(a.slice(i, i + 2), 16)), pb = [1, 3, 5].map((i) => parseInt(b.slice(i, i + 2), 16)); return '#' + pa.map((v, i) => Math.round(lerp(v, pb[i], t)).toString(16).padStart(2, '0')).join(''); };
export const LIGHTS = { warm: base, dark: DARK };
const lightFor0 = (S, f) => {
  const t = smooth(ramp(f, F(TS.blackout), F(TS.blackout) + 5));
  const o = { ...base };
  for (const k of ['sky', 'ground', 'sun', 'gain', 'lift']) o[k] = mix(base[k], DARK[k], t);
  for (const k of ['hemi', 'sunI', 'sat', 'vig']) o[k] = lerp(base[k], DARK[k], t);
  return o;
};

// ---------- cameras ----------
const eye = (p, dy = 0) => [p[0], 1.47 + dy, p[2]];
const RX = [0.0, 0, -0.1];               // where the reaction card stands
const K = (s, pos, look, fov, extra = {}) => ({ f: F(s), pos, look, fov, ...extra });
const CAMS = {
  cozinha: [K(0, [-1.7, 1.5, 0.9], [-3.0, 0.95, 0.9], 74), K(1.3, [-1.65, 1.5, 0.9], [-3.0, 0.95, 0.9], 74)],
  mae: [K(1.3, [-0.4, 1.55, 2.4], [0.0, 1.3, -2.8], 68), K(3.5, [-0.2, 1.55, 1.9], [0.05, 1.3, -2.8], 62), K(5.9, [0.0, 1.55, 1.0], [0.2, 1.2, -2.9], 58)],
  tranca: [K(5.9, [0.0, 1.5, 0.3], [0.45, 1.25, -2.9], 62), K(7.9, [0.1, 1.5, -0.2], [0.55, 1.3, -2.9], 55)],
  interfone: [K(7.9, [-0.3, 1.5, -0.4], [-0.9, 1.45, -2.9], 52), K(12.0, [-0.6, 1.5, -1.1], [-0.95, 1.45, -2.9], 42), K(16.9, [-0.8, 1.48, -1.7], [-0.95, 1.45, -2.9], 34)],
  react1: [K(16.9, [0.1, 1.5, 2.5], eye(RX, 0.08), 36), K(19.9, [0.1, 1.5, 2.2], eye(RX, 0.08), 33)],
  janela: [K(19.9, [1.0, 1.5, 0.4], [3.4, 1.6, -0.4], 64), K(23.4, [1.6, 1.5, 0.3], [3.4, 1.6, -0.5], 56)],
  react2: [K(23.4, [0.1, 1.5, 2.5], eye(RX, 0.08), 36), K(29.5, [0.1, 1.5, 2.1], eye(RX, 0.08), 31)],
  phone1: [K(29.5, [0, 1.5, 1.0], [0, 1.5, -1.0], 62), K(36.6, [0, 1.5, 1.0], [0, 1.5, -1.0], 62)],
  hall: [K(36.6, [-0.3, 0.85, 1.4], [0.2, 0.3, -2.9], 62), K(42.6, [-0.1, 0.65, 0.6], [0.2, 0.15, -2.9], 56), K(47.4, [0.0, 0.5, -0.4], [0.2, 0.1, -2.9], 50)],
  phone2: [K(47.4, [0, 1.5, 1.0], [0, 1.5, -1.0], 62), K(53.8, [0, 1.5, 1.0], [0, 1.5, -1.0], 62)],
  macaneta: [K(53.8, [0.25, 1.25, -1.2], [0.56, 1.05, -2.9], 44), K(56.0, [0.42, 1.12, -1.9], [0.56, 1.03, -2.9], 30), K(58.6, [0.5, 1.08, -2.0], [0.56, 1.02, -2.9], 28)],
  knock: [K(58.6, [0.2, 1.4, -0.4], [0.22, 1.2, -2.9], 52), K(66.1, [0.22, 1.35, -1.2], [0.25, 1.15, -2.9], 40)],
  react3: [K(66.1, [0.15, 1.5, 2.4], eye(RX, 0.08), 35), K(70.0, [0.1, 1.5, 2.1], eye(RX, 0.08), 31)],
  phone3: [K(70.0, [0, 1.5, 1.0], [0, 1.5, -1.0], 62), K(72.6, [0, 1.5, 1.0], [0, 1.5, -1.0], 62)],
  react4: [K(72.6, [0.1, 1.5, 2.1], eye(RX, 0.08), 31), K(77.0, [0.1, 1.5, 1.8], eye(RX, 0.08), 27)],
  porta2: [K(77.0, [0.2, 1.2, 0.2], [0.25, 0.6, -2.9], 56), K(83.6, [0.2, 0.5, -1.3], [0.25, 0.1, -2.9], 40)],
  card: [K(83.6, [0.2, 0.5, -1.4], [0.25, 0.1, -2.9], 40), K(89.0, [0.2, 0.5, -1.5], [0.25, 0.1, -2.9], 38)],
};
const KICKS = [{ f: F(TS.blackout), a: 0.04 }, { f: F(58.8), a: 0.05 }, { f: F(59.4), a: 0.05 }, { f: F(60.0), a: 0.06 }, { f: F(8.0), a: 0.015 }];
const camAt0 = (f) => {
  const S = shotAt0(f);
  const c = camFromKeys(CAMS[S.id], f, { kicks: KICKS, creep: S.id.startsWith('react') ? 0 : 0.0006 });
  if (['hall', 'macaneta', 'porta2', 'card'].includes(S.id)) { c.pos = [c.pos[0] + 0.006 * Math.sin(f * 0.37), c.pos[1] + 0.005 * Math.sin(f * 0.53), c.pos[2]]; }
  c.flash = 0;
  const bo = F(TS.blackout); if (f >= bo - 1 && f < bo + 6) c.flash = -0.0; // (blackout is done via lights)
  return c;
};

// ---------- lens ----------
const dist = (a, b) => Math.hypot(a[0] - b[0], a[1] - b[1], a[2] - b[2]);
const POVS = ['cozinha', 'mae', 'tranca', 'interfone', 'janela', 'phone1', 'hall', 'phone2', 'macaneta', 'knock', 'phone3', 'porta2', 'card'];
const dofAt0 = (f) => {
  const S = shotAt0(f), C = camAt0(f);
  if (S.id.startsWith('react')) return { focus: dist(C.pos, eye(RX)), cinf: 11 };
  if (S.id === 'card') return { focus: 0.7, cinf: 9 };
  if (S.id === 'macaneta') return { focus: dist(C.pos, [0.56, 1.02, -2.89]), cinf: 5 };
  if (S.id === 'hall' || S.id === 'porta2') return { focus: dist(C.pos, [0.2, 0.1, -2.9]), cinf: 3 };
  return { focus: 6, cinf: 0 };
};

// ---------- world state ----------
const worldAt0 = (f) => {
  const s = f / 30, w = { set: 'apt' };
  w.night = s >= TS.blackout; w.dark = w.night; w.led = s < TS.blackout && Math.floor(s * 2) % 2 === 0 && s >= 7.4;
  // door: mom leaves (open 4.7→5.2, closed 5.2→5.45), knocks shake it later
  const o = TS.door_open; w.door = s < o ? 0 : s < o + 0.55 ? E.smooth((s - o) / 0.55) : s < 5.1 ? 1 : s < TS.door_close ? 1 - E.smooth((s - 5.1) / (TS.door_close - 5.1)) : 0;
  // lock turning
  w.bolt = s < TS.lock[0] ? 0 : s < TS.lock[0] + 0.7 ? E.smooth((s - TS.lock[0]) / 0.7) * 1.57 : 1.57;
  // door handle moves slowly from 54.5 (tries twice), then rests
  const lv = (t0, t1, a) => s >= t0 && s <= t1 ? Math.sin(Math.PI * (s - t0) / (t1 - t0)) * a : 0;
  w.lever = lv(54.4, 55.8, 0.55) + lv(56.6, 58.2, 0.65) + lv(44.0, 44.8, 0.14) + lv(45.1, 45.7, 0.1);
  w.shake = [58.8, 59.4, 60.0].some((t) => s >= t && s < t + 0.25) ? 1 : 0;
  w.strip = true; w.feet = s >= TS.feet ? [true, s >= TS.feet + 0.6] : [false, false];
  return w;
};

// ---------- actors / cards ----------
const R = (T, who, o, pos, extra = {}) => ({ key: who + JSON.stringify(o), draw: (p) => T.romanFront(p, who, o), x: pos[0], y: pos[1], z: pos[2], ...extra });
const life = (f, seed) => { const i = idle(f, seed); return { bob: q(i.bob, 3), tilt: q(i.tilt, 1), headTilt: q(i.headTilt, 1), blink: blinkAt(f, seed) }; };
const stp = (f) => q((f * 0.05) % 1, 2);
const FX = (key, draw, pos, s, extra = {}) => ({ key, draw, x: pos[0], y: pos[1], z: pos[2], s, blob: false, shadow: false, order: 9, ...extra });
const FXC = (key, draw, C, s, cx = 300, cy = 500, extra = {}) => FX(key, draw, [C[0] - (cx - 300) * 0.00225 * s, C[1] - ((1000 - cy) * 0.00225 - 0.056) * s, C[2]], s, extra);
/** a card glued in front of the camera (hands, phone): fills the screen */
const camCard = (f, key, draw, d = 0.7) => {
  const C = camAt0(f), fw = [C.look[0] - C.pos[0], C.look[1] - C.pos[1], C.look[2] - C.pos[2]], L = Math.hypot(...fw);
  const n = fw.map((v) => v / L), P0 = [C.pos[0] + n[0] * d, C.pos[1] + n[1] * d, C.pos[2] + n[2] * d];
  const vis = 2 * d * Math.tan(C.fov * Math.PI / 360) * 1.0, s = vis / 2.25 * 1.02;
  return FXC(key, draw, [P0[0], P0[1] + 0.0, P0[2]], s, 300, 500, { order: 9, blob: false, shadow: false });
};
const talk = (f, a, b) => f >= F(a) && f < F(b) && Math.floor(f / 4) % 2 === 0;

const actorsAt0 = (f, T) => {
  const S = shotAt0(f), s = f / 30, out = [];
  const teen = (o) => out.push(R(T, 'teen', { seed: 7, ...life(f, 7), ...o }, RX, { tint: s >= TS.blackout ? '#dfe5fb' : '#ffffff' }));
  switch (S.id) {
    case 'cozinha': out.push(camCard(f, 'h' + q(f * 0.45, 1), (p) => T.povHands(p, { pose: 'stir', w: f * 0.45 }))); break;
    case 'mae': {
      const walk = clamp((s - 3.9) / 1.2), pos = lerp3([0.15, 0, -1.2], [DXm, 0, -4.4], walk);
      if (s < 5.12) out.push(R(T, 'mae', { seed: 9, ...life(f, 9), expr: (s >= 2.0 && s < 5.1 && Math.floor(f / 4) % 2 === 0) ? 'grin' : 'smile', facing: 0, look: 0, L: s > 3.9 ? 'hang' : 'wave', R: 'hang', wv: q(f * 0.35, 1), step: walk > 0 && walk < 1 ? stp(f) : 0 }, pos));
      out.push(camCard(f, 'hi' + q(Math.sin(f * 0.1) * 6, 0), (p) => T.povHands(p, { pose: 'idle', sway: Math.sin(f * 0.1) * 6 })));
      break;
    }
    case 'tranca': out.push(camCard(f, 'hl' + q(clamp((s - TS.lock[0]) / 0.7), 2), (p) => T.povHands(p, { pose: 'lock', rot: -clamp((s - TS.lock[0]) / 0.7) * 1.57 }))); break;
    case 'interfone': {
      out.push(camCard(f, 'hi' + q(Math.sin(f * 0.1) * 5, 0), (p) => T.povHands(p, { pose: 'idle', sway: Math.sin(f * 0.1) * 5 })));
      if (s >= TS.intercom[0] && s < TS.intercom[1]) { const t = q(((f - F(TS.intercom[0])) % 24) / 24); out.push(FXC('ir' + t, (p) => T.fxRing(p, t), [-0.95, 1.5, -2.8], 0.12, 300, 300, { alpha: 0.7 })); }
      break;
    }
    case 'react1': teen({ expr: s < 18.3 ? 'nervous' : 'squint', facing: 0, look: q(Math.sin(f * 0.07) * 0.5, 1), L: 'hang', R: 'hang' }); break;
    case 'janela': out.push(camCard(f, 'hi' + q(Math.sin(f * 0.1) * 4, 0), (p) => T.povHands(p, { pose: 'idle', sway: Math.sin(f * 0.1) * 4 }))); break;
    case 'react2': teen({ expr: s < 25 ? 'shock' : s < 27 ? 'nervous' : 'shock', facing: 0, look: q(Math.sin(f * 0.05) * 0.4, 1), L: 'hang', R: 'hang', blink: s < 26.5 ? 0 : blinkAt(f, 7) }); break;
    case 'phone1': case 'phone2': case 'phone3': out.push(phoneCard(f, T, S.id)); break;
    case 'hall': out.push(camCard(f, 'hg' + q(Math.sin(f * 0.2) * 3, 0), (p) => T.povHands(p, { pose: 'grip', sway: Math.sin(f * 0.2) * 3 }), 0.55)); break;
    case 'macaneta': case 'knock': break;
    case 'react3': teen({ expr: 'shock', facing: 0, look: q(Math.sin(f * 0.06) * 0.6, 1), L: 'hang', R: 'hang', blink: 0 }); break;
    case 'react4': teen({ expr: s < 76 ? 'shock' : 'pained', facing: 0, look: 0, L: 'hang', R: 'hang', blink: 0, headTilt: q(Math.sin(f * 0.3) * 1.5, 1) }); break;
    case 'porta2': out.push(camCard(f, 'hg' + q(Math.sin(f * 0.2) * 3, 0), (p) => T.povHands(p, { pose: 'grip', sway: Math.sin(f * 0.2) * 3 }), 0.5)); break;
    case 'card': out.push(camCard(f, 'end' + q(Math.min(1, (s - TS.card[0]) * 1.5), 2), (p) => T.endCard(p, s - TS.card[0]), 0.7)); break;
  }
  return out;
};
const DXm = 0.2;
const CHAT = {
  phone1: { title: 'Condomínio Bloco B', avatar: '#4f8fcf', msgs: [
    { t: 30.0, who: 'SÍNDICO', col: '#ff6b5a', text: 'NINGUÉM DESÇA. Não fui eu no interfone.' },
    { t: 31.9, who: 'SÍNDICO', col: '#ff6b5a', text: 'Alguém invadiu o sistema.' },
    { t: 33.8, who: 'DONA MARTA (302)', col: '#f6a04a', text: 'tem alguém batendo de porta em porta' }] },
  phone2: { title: 'Mãe', avatar: '#e26fa0', msgs: [
    { t: 0, who: 'MÃE', col: '#e26fa0', text: 'Cheguei no mercado. Já volto.' },
    { t: 51.9, mine: true, text: 'Mãe, não volta pra cá. Chama a polícia.' }] },
  phone3: { title: 'Mãe', avatar: '#e26fa0', msgs: [
    { t: 0, who: 'MÃE', col: '#e26fa0', text: 'Cheguei no mercado. Já volto.' },
    { t: 0, mine: true, text: 'Mãe, não volta pra cá. Chama a polícia.' },
    { t: 70.6, who: 'MÃE', col: '#e26fa0', text: 'Tô na fila do caixa, amor' }] },
};
const phoneCard = (f, T, id) => {
  const s = f / 30, C = CHAT[id], msgs = C.msgs.filter((m) => s >= m.t);
  let typing = '', banner = null;
  if (id === 'phone2') {
    if (s >= 49.2 && s < 51.9) typing = 'Mãe, não volta pra cá. Chama a polícia.'.slice(0, Math.floor((s - 49.2) / 2.7 * 39));
    if (s >= 47.7 && s < 49.5) banner = { who: 'MÃE', col: '#e26fa0', text: 'Cheguei no mercado. Já volto.', k: clamp((s - 47.7) / 0.25) };
    if (s >= 52.9) banner = { who: 'DONA MARTA (302)', col: '#f6a04a', text: 'ele tá testando as maçanetas', k: clamp((s - 52.9) / 0.25) };
  }
  if (id === 'phone2' && s < 47.7) msgs.length = 0;
  const key = id + msgs.length + '|' + typing + '|' + (banner ? banner.text + q(banner.k, 1) : '') + '|' + q(Math.sin(f * 0.12) * 4, 0);
  const shown = id === 'phone2' && s < 47.7 ? [] : msgs;
  return camCard(f, key, (p) => T.phoneUI(p, { title: C.title, avatar: C.avatar, msgs: shown, typing, banner }), 0.6);
};
const fxAt0 = (f, T) => [];

export const shotAt = (f) => shotAt0(O(f));
export const lightFor = (S, f) => lightFor0(S, O(f));
export const camAt = (f) => camAt0(O(f));
export const dofAt = (f) => dofAt0(O(f));
export const worldAt = (f) => worldAt0(O(f));
export const actorsAt = (f, T) => actorsAt0(O(f), T);
export const fxAt = (f, T) => fxAt0(O(f), T);
