// Shot plan for "O cheiro do pão" (conto popular, versão original) — timed to voice.wav (23.35 s, 30 fps, 700 frames).
// Word frames: homem 10, juiz 48, pão 69 | Numa 90, vila 100, pobre 130, pão seco 149-154, padaria 184 | só sentindo 207, cheiro 231, forno 245 |
// padeiro 276, furioso 301, cobrou 320, cheiro 340 | vila inteira 371-380, julgamento 416 | juiz 456, pegou 461, bolsa 476, pobre 491,
// sacudiu 501, moedas 520, ouvido 535, padeiro 555 | Pronto 587 | cheiro 621, pão 635, pago 644, som 664, dinheiro 673.
import { M as E, camFromKeys, idle, blinkAt, q, clamp, lerp, lerp3, ramp } from './motion.js';
export const FPS = 30, TOTAL = 700, DECK = 0;
export const SHOTS = [
  { id: 'hook', a: 0, b: 89, light: 'day' },
  { id: 'vila', a: 90, b: 269, light: 'day' },
  { id: 'padeiro', a: 270, b: 365, light: 'day' },
  { id: 'julg', a: 366, b: 449, light: 'day' },
  { id: 'moedas', a: 450, b: 586, light: 'day' },
  { id: 'pronto', a: 587, b: 699, light: 'day' },
];
export const shotAt = (f) => SHOTS.find((s) => f >= s.a && f <= s.b) || SHOTS[SHOTS.length - 1];
const smooth = E.smooth;

// ---------- lights ----------
export const LIGHTS = {
  day: { az: 60, el: 42, sky: '#c4d6f2', ground: '#8a8262', hemi: 1.15, sun: '#fff1dc', sunI: 2.5, fog: '#cadcf0', fogNear: 70, fogFar: 900,
    skyTop: '#3f80d4', skyHor: '#c3daf2', sat: 1.1, vig: 0.2, shadowExt: 10 },
};
export const lightFor = (S, f) => {
  const L = { ...LIGHTS[S.light] };
  if (S.id === 'vila') L.shadowExt = f < 190 ? 22 : 10;
  if (S.id === 'julg') L.shadowExt = 14;
  if (S.id === 'pronto' && f >= 587) { L.sat = 1.06; L.vig = 0.26; }
  return L;
};

// ---------- positions ----------
const EY = 1.47;                        // eye height of a card
const POB = [2.75, 0, -3.75];          // poor man by the bakery door
const DOOR = [1.2, 0, -4.3], BOUT = [1.85, 0, -3.6];
const JZ = [0, 0, 1.75], BK = [-0.64, 0, 1.55], PB = [0.86, 0, 1.95]; // trial
const eye = (p, dy = 0) => [p[0], EY + dy, p[2]];

// ---------- cameras ----------
const CAMS = {
  hook: [
    { f: 0, pos: [2.68, 1.52, -1.45], look: eye(POB, 0.02), fov: 34 },
    { f: 44, pos: [2.68, 1.52, -1.6], look: eye(POB, 0.02), fov: 33.5 },
    { f: 89, pos: [2.35, 1.8, 0.9], look: [2.05, 1.45, -4.0], fov: 42 },
  ],
  vila: [
    { f: 90, pos: [2.35, 1.8, 0.9], look: [2.05, 1.45, -4.0], fov: 42 },
    { f: 140, pos: [7.5, 8.5, 14.5], look: [0.2, 2.4, -6], fov: 46, path: [[4.6, 4.2, 7.0]] },
    { f: 172, pos: [7.2, 8.1, 14.0], look: [0.4, 2.3, -6], fov: 45 },
    { f: 205, pos: [3.6, 1.62, 0.25], look: [2.25, 1.38, -3.9], fov: 42, path: [[5.6, 4.2, 6.0]] },
    { f: 242, pos: [2.8, 1.52, -1.6], look: eye(POB, 0.02), fov: 34 },
    { f: 269, pos: [2.79, 1.52, -1.72], look: eye(POB, 0.02), fov: 33.5 },
  ],
  padeiro: [
    { f: 270, pos: [2.79, 1.52, -1.72], look: eye(POB, 0.02), fov: 33.5 },
    { f: 283, pos: [2.3, 1.58, -0.2], look: [2.3, 1.38, -3.7], fov: 44, ease: 'easeOut' },
    { f: 365, pos: [2.3, 1.55, -0.5], look: [2.3, 1.4, -3.7], fov: 42 },
  ],
  julg: [
    { f: 366, pos: [0, 7.4, 13.5], look: [0, 1.3, 1.2], fov: 48 },
    { f: 449, pos: [0, 3.2, 9.4], look: [0, 1.45, 1.6], fov: 50 },
  ],
  moedas: [
    { f: 450, pos: [0.05, 1.62, 5.1], look: [0.02, 1.45, 1.75], fov: 50 },
    { f: 494, pos: [0.0, 1.6, 4.9], look: [0.0, 1.45, 1.75], fov: 49 },
    { f: 508, pos: [-0.45, 1.56, 3.5], look: [-0.5, 1.52, 1.6], fov: 36 },
    { f: 556, pos: [-0.45, 1.56, 3.6], look: [-0.5, 1.52, 1.6], fov: 35 },
    { f: 586, pos: [0.05, 1.62, 5.0], look: [0.02, 1.45, 1.75], fov: 50 },
  ],
  pronto: [
    { f: 587, pos: [0.05, 1.62, 5.0], look: [0.02, 1.45, 1.75], fov: 50 },
    { f: 640, pos: [-0.8, 1.6, 4.7], look: [-0.92, 1.47, 1.6], fov: 48 },
    { f: 699, pos: [-1.0, 1.56, 4.05], look: [-1.02, 1.5, 1.55], fov: 45, roll: 3.5 },
  ],
};
const KICKS = [{ f: 278, a: 0.03 }, { f: 301, a: 0.05 }, { f: 322, a: 0.03 }, { f: 590, a: 0.06 }, { f: 673, a: 0.05 }];
export const camAt = (f) => {
  const S = shotAt(f);
  const c = camFromKeys(CAMS[S.id], f, { kicks: KICKS });
  c.flash = f >= 366 && f < 372 ? (1 - (f - 366) / 6) * 0.85 : f >= 587 && f < 590 ? 0.3 * (1 - (f - 587) / 3) : 0;
  if (S.id === 'julg') c.shadowAt = [0, 0, 1.8];
  if (S.id === 'vila' && f > 100 && f < 190) c.shadowAt = [1.5, 0, -4];
  return c;
};

// ---------- lens ----------
const dist = (a, b) => Math.hypot(a[0] - b[0], a[1] - b[1], a[2] - b[2]);
export const dofAt = (f) => {
  const S = shotAt(f), C = camAt(f);
  switch (S.id) {
    case 'hook': return { focus: dist(C.pos, eye(POB)), cinf: lerp(12, 3, smooth(ramp(f, 46, 86))) };
    case 'vila': { const w = f < 195 ? 0 : smooth(ramp(f, 195, 230)); return { focus: dist(C.pos, eye(POB)), cinf: lerp(0, 11, w) }; }
    case 'padeiro': return { focus: dist(C.pos, [2.3, EY, -3.65]), cinf: 7 };
    case 'julg': return { focus: dist(C.pos, eye(JZ)), cinf: 0 };
    case 'moedas': { const k = smooth(ramp(f, 494, 508)) * (1 - smooth(ramp(f, 560, 586))); return { focus: lerp(dist(C.pos, eye(JZ)), dist(C.pos, [-0.5, 1.5, 1.6]), k), cinf: lerp(6, 13, k) }; }
    case 'pronto': return { focus: dist(C.pos, eye(BK)), cinf: lerp(5, 11, smooth(ramp(f, 600, 690))) };
  }
  return { focus: 10, cinf: 0 };
};

// ---------- world state ----------
export const worldAt = (f) => ({
  table: f >= 366,
  door: f < 272 ? 0.25 : f < 366 ? lerp(0.25, 1, E.back(ramp(f, 272, 279))) : 1,
});

// ---------- actors (2D cards) ----------
const R = (T, who, o, pos, extra = {}) => ({ key: who + JSON.stringify(o), draw: (p) => T.romanFront(p, who, o), x: pos[0], y: pos[1], z: pos[2], ...extra });
const life = (f, seed) => { const i = idle(f, seed); return { bob: q(i.bob, 3), tilt: q(i.tilt, 1), headTilt: q(i.headTilt, 1), blink: blinkAt(f, seed) }; };

export const actorsAt = (f, T) => {
  const S = shotAt(f), out = [];
  const pobre = (o, pos) => out.push(R(T, 'pobre', { seed: 11, ...life(f, 11), ...o }, pos));
  const padeiro = (o, pos) => out.push(R(T, 'padeiro', { seed: 21, ...life(f, 21), ...o }, pos));
  const juiz = (o, pos) => out.push(R(T, 'juiz', { seed: 41, ...life(f, 41), ...o }, pos, { s: 1.06 }));
  const crowd = (laugh) => {
    const lb = (k) => q(Math.abs(Math.sin((f + k * 5) * 0.55)) * 0.025, 3);
    const C = [['civA', [-2.0, 0, 0.2], 31, 1], ['civB', [-1.0, 0, -0.45], 32, 1], ['civC', [1.15, 0, -0.35], 33, -1], ['workA', [2.1, 0, 0.3], 34, -1],
      ['velha', [-2.3, 0, 2.6], 35, 1], ['civD', [1.6, 0, 3.35], 36, -1], ['workB', [0.2, 0, -1.0], 37, 0]];
    C.forEach(([who, pos, seed, fc], k) => {
      const o = laugh ? { seed, expr: 'laugh', L: k % 2 ? 'belly' : 'point', R: 'belly', facing: fc, bob: lb(k), tilt: q(4 * Math.sin(f * 0.5 + k), 1) }
        : { seed, ...life(f, seed), expr: k % 3 ? 'smile' : 'nervous', facing: fc, look: q(-0.4 * fc, 1), L: k === 2 ? 'cross' : 'hang', R: k === 2 ? 'cross' : 'hang' };
      out.push(R(T, who, o, pos));
    });
  };
  switch (S.id) {
    case 'hook': case 'vila': {
      // eats dry bread (bites on "pão seco"), then closes his eyes and smells the oven
      const bite = (f >= 147 && f < 160) || (f >= 60 && f < 66 && S.id === 'hook');
      const sniff = f < 52 || f >= 205;
      const up = sniff ? q(-4 - 2 * Math.sin(f * 0.25), 1) : 0;
      pobre({ expr: sniff ? 'bliss' : bite ? 'lick' : 'smile', facing: -1, L: bite ? 'cheek' : 'belly', R: 'hang', holdL: 'bread', bite: f >= 152, headTilt: up, blink: sniff ? 0 : blinkAt(f, 11) }, POB);
      if (S.id === 'vila' && f < 200) padeiro({ expr: 'neutral', facing: 1, L: 'hang', R: 'hang' }, [-1.4, 0, -4.05]);
      break;
    }
    case 'padeiro': {
      const out_ = E.back(ramp(f, 274, 286));
      const pos = lerp3(DOOR, BOUT, out_);
      const furious = f >= 299, demand = f >= 318;
      const stomp = f >= 299 && f < 303 ? -0.02 : 0;
      padeiro({ expr: f < 276 ? 'neutral' : 'angry', facing: 1, look: 0.6, L: furious ? 'up' : 'hip', R: demand ? 'reach' : 'hip', bob: stomp, headTilt: furious && f < 318 ? q(5 * Math.sin(f * 0.9), 1) : 0, blink: 0 }, pos);
      pobre({ expr: f < 280 ? 'bliss' : f < 318 ? 'shock' : 'nervous', facing: -1, look: -0.6, L: 'belly', R: f < 318 ? 'cheek' : 'hang', holdL: 'bread', bite: true, blink: f < 280 ? 0 : blinkAt(f, 11) }, POB);
      break;
    }
    case 'julg': {
      crowd(false);
      juiz({ expr: 'stern', L: 'hang', R: 'hang' }, JZ);
      padeiro({ expr: 'angry', facing: 1, look: 0.5, L: 'hip', R: 'reach' }, BK);
      pobre({ expr: 'nervous', facing: -1, look: -0.5, L: 'belly', R: 'hang', holdL: 'bread', bite: true, holdR: 'purse' }, PB);
      break;
    }
    case 'moedas': {
      crowd(false);
      const took = f >= 471;
      const shake = f >= 501 && f < 560;
      const jo = !took ? { expr: 'stern', L: 'hang', R: f >= 461 ? 'reach' : 'hang' }
        : !(f >= 496) ? { expr: 'smile', L: 'lift', R: 'hang', holdL: 'purse' }
        : { expr: shake ? 'grin' : 'smile', L: 'wave', R: 'hip', holdL: 'purse', wv: shake ? q(f * 1.7 % 6.283, 1) : 0, holdDy: shake ? q(5 * Math.cos(f * 2.3), 0) : 0, holdRot: shake ? q(0.3 * Math.sin(f * 1.7), 2) : 0, look: -0.5 };
      juiz(jo, JZ);
      padeiro({ expr: f < 500 ? 'angry' : f < 512 ? 'nervous' : 'greedy', facing: 1, look: 0.4, L: 'hip', R: f < 500 ? 'reach' : 'hip', headTilt: f >= 512 ? q(-6 + 2 * Math.sin(f * 0.3), 1) : 0 }, BK);
      pobre({ expr: took ? 'nervous' : 'shock', facing: -1, look: -0.5, L: 'belly', R: !took ? 'reach' : 'hang', holdL: 'bread', bite: true, ...(took ? {} : { holdR: 'purse' }) }, PB);
      break;
    }
    case 'pronto': {
      crowd(f >= 673);
      const back = f >= 604;
      juiz({ expr: f < 600 ? 'stern' : 'smile', L: f < 598 ? 'up' : 'hang', R: f >= 598 && f < 612 ? 'point' : 'hang', ...(back ? {} : { holdL: 'purse' }) }, JZ);
      const sad = f >= 664;
      padeiro({ expr: f < 640 ? 'nervous' : sad ? (f >= 673 ? 'shock' : 'pained') : 'greedy', facing: -1, look: -0.5, L: f >= 640 ? 'reach' : 'hang', R: 'hang', bob: f >= 673 && f < 677 ? -0.02 : 0 }, BK);
      pobre({ expr: back ? (f >= 673 ? 'laugh' : 'relief') : 'nervous', facing: -1, look: -0.4, L: 'belly', R: back ? 'lift' : 'hang', holdL: 'bread', bite: true, ...(back ? { holdR: 'purse' } : {}) }, PB);
      break;
    }
  }
  return out;
};

// ---------- 2D effects ----------
const FX = (key, draw, pos, s, extra = {}) => ({ key, draw, x: pos[0], y: pos[1], z: pos[2], s, blob: false, shadow: false, order: 5, ...extra });
const wisp = (p, ph) => { // wavy smell ribbon
  const pts = []; for (let i = 0; i <= 24; i++) { const t = i / 24; pts.push([300 + Math.sin(t * 9 + ph) * 55, 860 - t * 640]); }
  p.stroke(pts, 34, '#241726'); p.stroke(pts, 20, '#fff2d6');
};
const note = (p, k) => { p.g.save(); p.g.translate(300, 780); p.g.scale(2.4, 2.4); p.g.translate(-125, -115); T_.fxNote(p, k % 2, '#ffd34d'); p.g.restore(); };
let T_ = null;
export const fxAt = (f, T) => {
  T_ = T;
  const S = shotAt(f), out = [];
  // smell ribbons drifting from the doorway to his nose
  if (S.id === 'hook' || S.id === 'vila' || (S.id === 'padeiro' && f < 284)) {
    for (let i = 0; i < 4; i++) {
      const t = ((f * 0.011 + i / 4) % 1), a = [1.35, 1.25, -4.2], b = [2.62, 1.62, -3.62];
      const p = lerp3(a, b, t); p[1] += Math.sin(t * 6 + i) * 0.08;
      const al = Math.min(1, t * 4, (1 - t) * 4);
      out.push(FX('wisp' + i, (pp) => wisp(pp, i * 1.7), p, 0.32, { alpha: al, roll: q(-1.2 + Math.sin(f * 0.07 + i) * 0.25, 2), order: 6 }));
    }
  }
  // chimney smoke in the wide shot
  if (S.id === 'vila' && f < 205) {
    for (let i = 0; i < 4; i++) { const t = ((f * 0.008 + i / 4) % 1), k = q(t * 0.6, 2);
      out.push(FX('smoke' + k, (p) => T.fxDust(p, k, '#f3efe8'), [2.6 + t * 0.8, 7.6 + t * 4, -8.0], 1.6 + t * 2.4, { alpha: q(1 - t, 2) })); }
  }
  // steam out of the baker's head on "furioso"
  if (S.id === 'padeiro' && f >= 300 && f < 322) {
    const t = q((f - 300) / 22); const pos = [BOUT[0], 1.9, BOUT[2] + 0.05];
    out.push(FX('puff' + t, (p) => { p.g.translate(150, 700); T.fxPuff(p, t); }, pos, 0.5));
    out.push(FX('puffB' + t, (p) => { p.g.translate(150, 700); T.fxPuff(p, (t + 0.4) % 1); }, [pos[0] + 0.25, 1.95, pos[2]], 0.4));
  }
  // coin jingle: sparkles + notes floating from the purse by the baker's ear
  if (S.id === 'moedas' && f >= 501 && f < 586) {
    for (let i = 0; i < 4; i++) { const t = ((f - 501) * 0.03 + i / 4) % 1;
      out.push(FX('note' + (i % 2), (p) => note(p, i), [-0.4 - t * 0.35 + i * 0.05, 1.58 + t * 0.5, 1.82], 0.16, { alpha: q(Math.min(1, (1 - t) * 3), 2), roll: q(Math.sin(t * 8 + i) * 0.3, 2) })); }
    const st = q(((f - 501) / 16) % 1, 2);
    out.push(FX('stars' + st, (p) => T.fxStars(p, st), [-0.42, 1.5, 1.85], 0.32));
  }
  // "Pronto": stars on the judge's raised hand
  if (S.id === 'pronto' && f >= 588 && f < 604) { const t = q((f - 588) / 16); out.push(FX('burst' + t, (p) => T.fxBurst(p, t), [-0.35, 2.05, 1.85], 0.7)); }
  // purse flies back to the poor man
  if (S.id === 'pronto' && f >= 598 && f < 606) { const t = q((f - 598) / 8); out.push(FX('puffP' + t, (p) => { p.g.translate(150, 700); T.fxPuff(p, t); }, [PB[0] + 0.45, 1.6, PB[2] + 0.1], 0.4)); }
  // payoff: a music note lands in the baker's open palm on "som"... and stays there on "dinheiro"
  if (S.id === 'pronto' && f >= 650) {
    const t = clamp((f - 650) / 14), y = f < 664 ? lerp(2.3, 1.5, E.easeIn(t)) : 1.5 + 0.06 * Math.max(0, Math.sin((f - 664) * 0.6)) * Math.exp(-(f - 664) * 0.15);
    out.push(FX('palmNote', (p) => note(p, 0), [BK[0] - 0.66, y + 0.02, BK[2] + 0.12], 0.2, { order: 6 }));
  }
  return out;
};
