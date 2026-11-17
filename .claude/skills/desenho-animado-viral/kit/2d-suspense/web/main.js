// "Plantão das Cinco Regras" — 2D cartoon em camadas (Canvas 2D). Cada FALA = um plano; os cortes vêm de timeline.js (gerado pelo áudio).
import * as T from './toon.js';
import { SHOTS, TALK, TOTAL } from './timeline.js';
const W = 1080, H = 1920, INK = '#0f1420';
const cv = document.getElementById('c'), g = cv.getContext('2d');
const clamp = (x, a = 0, b = 1) => Math.max(a, Math.min(b, x)), lerp = (a, b, t) => a + (b - a) * t;
const ease = (t) => t * t * (3 - 2 * t), easeOut = (t) => 1 - Math.pow(1 - clamp(t), 3), back = (t) => { t = clamp(t) - 1; return t * t * (2.7 * t + 1.7) + 1; };
const rnd = (s) => { let x = Math.sin(s * 127.1) * 43758.5453; return x - Math.floor(x); };
// ---------- primitivas ----------
const rr = (c, x, y, w, h, r) => { c.beginPath(); c.moveTo(x + r, y); c.arcTo(x + w, y, x + w, y + h, r); c.arcTo(x + w, y + h, x, y + h, r); c.arcTo(x, y + h, x, y, r); c.arcTo(x, y, x + w, y, r); c.closePath(); };
const box = (c, x, y, w, h, fill, r = 14, lw = 8) => { rr(c, x, y, w, h, r); c.fillStyle = fill; c.fill(); c.lineWidth = lw; c.strokeStyle = INK; c.lineJoin = 'round'; c.stroke(); };
const lin = (c, y0, y1, a, b) => { const gr = c.createLinearGradient(0, y0, 0, y1); gr.addColorStop(0, a); gr.addColorStop(1, b); return gr; };
const txt = (c, s, x, y, size, fill, align = 'center', font = 'DejaVu Sans', weight = 'bold', stroke = INK, lw = 0) => { c.font = `${weight} ${size}px ${font}, sans-serif`; c.textAlign = align; c.textBaseline = 'middle'; if (lw) { c.lineJoin = 'round'; c.strokeStyle = stroke; c.lineWidth = lw; c.strokeText(s, x, y); } c.fillStyle = fill; c.fillText(s, x, y); };
// ---------- personagens (cartões do motor Pen) ----------
const cache = new Map();
const charCanvas = (who, o) => {
  const key = who + JSON.stringify(o); let c = cache.get(key);
  if (!c) { c = document.createElement('canvas'); c.width = 900; c.height = 1500; const x = c.getContext('2d'); x.setTransform(900 / 600, 0, 0, 1500 / 1000, 0, 0); T.romanFront(new T.Pen(x), who, o); cache.set(key, c); if (cache.size > 500) cache.delete(cache.keys().next().value); }
  return c;
};
const q = (x, n = 2) => Math.round(x * 10 ** n) / 10 ** n;
const idle = (f, seed) => ({ bob: q(0.006 * Math.sin((f + seed * 11) * 0.11), 3), tilt: q(1.2 * Math.sin((f + seed * 7) * 0.05), 1), headTilt: q(1.5 * Math.sin((f + seed * 5) * 0.037 + 1), 1), blink: (() => { const per = 38 + (seed * 17) % 31, ph = (f + seed * 13) % per; return ph < 2 ? 0.5 : ph < 4 ? 1 : 0; })() });
const talking = (who, s) => (TALK[who] || []).some(([a, b]) => s >= a && s <= b);
const drawChar = (c, who, o, x, feetY, k = 1.05, flip = false) => {
  const cc = charCanvas(who, o), w = 900 / 1000 * 1500 * 0.6 * k * 1.0, h = 1500 * 0.6 * k;   // 900x1500 canvas drawn at 0.6*k
  c.save(); c.translate(x, feetY - h * 0.975); if (flip) { c.scale(-1, 1); c.translate(-w / 2, 0); } else c.translate(-w / 2, 0); c.drawImage(cc, 0, 0, w, h); c.restore();
};
// ---------- cenários ----------
const skyline = (c, x, y, w, h, night = true) => {
  c.save(); rr(c, x, y, w, h, 18); c.clip(); c.fillStyle = lin(c, y, y + h, '#0b1230', '#2a3262'); c.fillRect(x, y, w, h);
  for (let i = 0; i < 9; i++) { const bw = 50 + rnd(i) * 50, bh = 80 + rnd(i + 9) * 170, bx = x + i * (w / 9) + rnd(i + 3) * 8; c.fillStyle = '#080c1c'; c.fillRect(bx, y + h - bh, bw, bh); for (let k = 0; k < 10; k++) if (rnd(i * 13 + k) > 0.65) { c.fillStyle = '#ffc24a'; c.fillRect(bx + 8 + (k % 3) * 14, y + h - bh + 10 + Math.floor(k / 3) * 22, 8, 12); } }
  c.restore(); rr(c, x, y, w, h, 18); c.lineWidth = 10; c.strokeStyle = INK; c.stroke();
};
const clock = (c, x, y, r, hh, mm) => {
  c.beginPath(); c.arc(x, y, r, 0, 7); c.fillStyle = '#e8dfc8'; c.fill(); c.lineWidth = 9; c.strokeStyle = INK; c.stroke();
  for (let i = 0; i < 12; i++) { const a = i * Math.PI / 6; c.beginPath(); c.moveTo(x + Math.sin(a) * r * 0.82, y - Math.cos(a) * r * 0.82); c.lineTo(x + Math.sin(a) * r * 0.92, y - Math.cos(a) * r * 0.92); c.lineWidth = 6; c.stroke(); }
  const h = (hh % 12 + mm / 60) * Math.PI / 6, m = mm * Math.PI / 30;
  c.lineCap = 'round'; c.lineWidth = 10; c.beginPath(); c.moveTo(x, y); c.lineTo(x + Math.sin(h) * r * 0.5, y - Math.cos(h) * r * 0.5); c.stroke(); c.lineWidth = 7; c.beginPath(); c.moveTo(x, y); c.lineTo(x + Math.sin(m) * r * 0.75, y - Math.cos(m) * r * 0.75); c.stroke();
};
const portaria = (c, f, dark = 0) => {
  c.fillStyle = lin(c, 0, 1400, '#1d4652', '#16333d'); c.fillRect(0, 0, W, 1400);
  c.fillStyle = 'rgba(0,0,0,.18)'; for (let i = 0; i < 6; i++) c.fillRect(i * 190 + 40, 0, 6, 1400);
  skyline(c, 80, 300, 330, 420); clock(c, 770, 460, 110, 2, 0);
  box(c, 440, 100, 560, 110, '#2a3550', 18, 8); txt(c, 'EDIFÍCIO AURORA', 720, 156, 54, '#ffc24a');
  c.fillStyle = lin(c, 1400, 1920, '#262b3b', '#1a1e2b'); c.fillRect(0, 1400, W, 520); c.strokeStyle = 'rgba(0,0,0,.35)'; c.lineWidth = 4; for (let i = 0; i < 6; i++) { c.beginPath(); c.moveTo(0, 1500 + i * 70); c.lineTo(W, 1500 + i * 70); c.stroke(); }
  const gl = c.createRadialGradient(540, 40, 20, 540, 40, 1100); gl.addColorStop(0, 'rgba(255,196,90,.28)'); gl.addColorStop(1, 'rgba(255,196,90,0)'); c.fillStyle = gl; c.fillRect(0, 0, W, 1400);
};
const deskFront = (c, f, withProps = true) => {
  box(c, -30, 1390, W + 60, 70, '#8a6a44', 16, 9); box(c, -30, 1450, W + 60, 480, '#5d4630', 6, 9);
  for (const x of [80, 400, 720]) { box(c, x, 1520, 280, 170, '#6d5438', 12, 7); box(c, x + 110, 1590, 60, 22, '#c9a040', 8, 5); }
  if (!withProps) return;
  box(c, 70, 1190, 250, 190, '#3b4350', 22, 9); box(c, 92, 1212, 206, 138, '#06150f', 8, 6);
  for (let i = 0; i < 4; i++) { c.fillStyle = `rgba(80,220,140,${0.22 + 0.1 * Math.sin(f * 0.2 + i)})`; c.fillRect(100 + (i % 2) * 96, 1222 + Math.floor(i / 2) * 62, 88, 54); }
  box(c, 150, 1380, 90, 16, '#2f3643', 6, 6);
  radioProp(c, 900, 1210, 0.55, f, false);
  box(c, 640, 1330, 70, 62, '#c0392b', 12, 7); c.beginPath(); c.arc(720, 1360, 20, -1.4, 1.4); c.lineWidth = 8; c.strokeStyle = INK; c.stroke();   // caneca
};
const radioProp = (c, x, y, k, f, on, waves = 0) => {   // walkie-talkie
  c.save(); c.translate(x, y); c.scale(k, k);
  box(c, -8, -90, 18, 120, '#1b2030', 6, 7);
  box(c, -90, 20, 200, 420, '#2b3140', 36, 12);
  for (let i = 0; i < 6; i++) { c.beginPath(); c.moveTo(-60, 70 + i * 22); c.lineTo(80, 70 + i * 22); c.lineWidth = 8; c.strokeStyle = '#151a26'; c.stroke(); }
  box(c, -60, 230, 140, 70, '#0a1a14', 10, 8); txt(c, on ? 'CANAL 3' : 'STANDBY', 10, 266, 26, on ? '#6bff9e' : '#2e6a4a');
  c.beginPath(); c.arc(60, 40, 14, 0, 7); c.fillStyle = on ? (Math.floor(f / 6) % 2 ? '#ff3b30' : '#7a1d18') : '#4a2020'; c.fill(); c.lineWidth = 6; c.strokeStyle = INK; c.stroke();
  box(c, -50, 330, 40, 40, '#171c28', 10, 6); box(c, 10, 330, 40, 40, '#171c28', 10, 6);
  c.restore();
  if (waves) for (let i = 0; i < 4; i++) { const t = ((f * 0.03 + i / 4) % 1); c.beginPath(); c.arc(x + 10 * k, y + 120 * k, (60 + t * 260) * k, 0, 7); c.strokeStyle = `rgba(255,176,32,${(1 - t) * 0.75})`; c.lineWidth = 10 * (1 - t) + 2; c.stroke(); }
};
const cardRule = (c, label, lt, show = true) => {   // carimbo da regra no topo
  if (!label) return; const p = back(lt * 3); c.save(); c.translate(540, 170); c.scale(p, p); c.rotate(-0.04);
  box(c, -300, -70, 600, 140, '#12192c', 22, 10); txt(c, label, 0, 4, 78, '#ffc24a'); c.restore();
};
const elevator = (c, f, open, lamp, btnOn, tShake) => {
  c.fillStyle = lin(c, 0, 1500, '#243b4a', '#1a2a36'); c.fillRect(0, 0, W, 1500); c.fillStyle = lin(c, 1500, 1920, '#2a2f3e', '#1a1e2b'); c.fillRect(0, 1500, W, 420);
  box(c, 170, 470, 740, 1060, '#8f98a6', 20, 12); box(c, 220, 520, 640, 1010, '#0b0e16', 6, 8);   // vão
  const d = open * 300; box(c, 220 - d, 520, 322, 1010, '#aab3c0', 6, 8); box(c, 538 + d, 520, 322, 1010, '#aab3c0', 6, 8);
  if (open > 0.05) { c.fillStyle = '#141a28'; c.fillRect(500, 700, 80, 800); c.fillStyle = '#ffc24a'; c.globalAlpha = 0.5 * open; c.fillRect(220, 540, 640, 14); c.globalAlpha = 1; box(c, 232, 1100, 616, 18, '#3a4150', 6, 5); }
  box(c, 400, 330, 280, 110, '#0a0f1a', 16, 10); txt(c, lamp, 540, 386, 82, '#ffc24a', 'center', 'DejaVu Sans Mono');
  box(c, 950, 820, 90, 260, '#4a5262', 14, 9);
  for (let i = 0; i < 2; i++) { const on = i === 1 && btnOn; c.beginPath(); c.arc(995, 890 + i * 120, 26, 0, 7); c.fillStyle = on ? '#ffc24a' : '#2b3140'; c.fill(); c.lineWidth = 7; c.strokeStyle = INK; c.stroke(); if (on) { c.beginPath(); c.arc(995, 890 + i * 120, 44, 0, 7); c.strokeStyle = 'rgba(255,194,74,.55)'; c.lineWidth = 8; c.stroke(); } txt(c, i ? 'T' : '7', 995, 891 + i * 120, 30, on ? '#1a1205' : '#aab3c0'); }
};
const camFeed = (c, x, y, w, h, kind, f) => {
  c.save(); rr(c, x, y, w, h, 10); c.clip(); c.fillStyle = '#06130d'; c.fillRect(x, y, w, h); c.strokeStyle = 'rgba(80,220,140,.5)'; c.lineWidth = 3;
  if (kind === 0) { for (let i = 0; i < 5; i++) { c.beginPath(); c.moveTo(x, y + h * 0.5 + i * 22); c.lineTo(x + w, y + h * 0.5 + i * 22); c.stroke(); } c.strokeRect(x + w * 0.3, y + h * 0.15, w * 0.4, h * 0.45); }
  if (kind === 1) { for (let i = 0; i < 6; i++) { c.beginPath(); c.moveTo(x + w * 0.5, y + h * 0.3); c.lineTo(x + i * w / 5, y + h); c.stroke(); } c.strokeRect(x + w * 0.4, y + h * 0.2, w * 0.2, h * 0.3); }
  if (kind === 2) { for (let i = 0; i < 7; i++) { c.beginPath(); c.moveTo(x + i * 18, y + h); c.lineTo(x + w * 0.5 + i * 8, y); c.stroke(); } }
  if (kind === 3) { c.strokeRect(x + w * 0.1, y + h * 0.15, w * 0.8, h * 0.7); c.fillStyle = '#133a28'; c.fillRect(x + w * 0.38, y + h * 0.42, w * 0.24, h * 0.5); c.beginPath(); c.arc(x + w * 0.5, y + h * 0.36, w * 0.09, 0, 7); c.fill();   // vigia de costas (boné)
    c.fillStyle = '#0d2a1d'; c.fillRect(x + w * 0.42, y + h * 0.26, w * 0.16, h * 0.05); c.strokeStyle = 'rgba(80,220,140,.7)'; c.strokeRect(x + w * 0.38, y + h * 0.42, w * 0.24, h * 0.5); }
  for (let i = 0; i < h; i += 6) { c.fillStyle = 'rgba(0,0,0,.18)'; c.fillRect(x, y + i, w, 2); }
  c.restore(); rr(c, x, y, w, h, 10); c.lineWidth = 6; c.strokeStyle = '#0a2018'; c.stroke();
  c.fillStyle = Math.floor(f / 15) % 2 ? '#ff3b30' : '#6a1f1a'; c.beginPath(); c.arc(x + 22, y + 22, 8, 0, 7); c.fill(); txt(c, 'CAM 0' + (kind + 1), x + 120, y + 24, 22, '#6bff9e', 'center', 'DejaVu Sans Mono');
};
const sheet = (c, lt, mode) => {   // folha das regras (close)
  c.save(); c.translate(540, 980); c.rotate(-0.035); box(c, -430, -640, 860, 1280, '#e8dfc6', 12, 10);
  const ink = '#27408b'; txt(c, 'REGRAS DO PLANTÃO', 0, -560, 60, ink, 'center', 'DejaVu Serif', 'bold');
  const R = ['1. Às 2h, o elevador do 7º andar', '    chama sozinho. Não entre.', '2. Se o rádio chamar seu nome,', '    não responda.', '3. Nunca olhe as câmeras', '    do 7º andar.', '4. Não atenda o telefone', '    da portaria.', '5. ________________________'];
  R.forEach((s, i) => txt(c, s, -390, -450 + i * 92, 44, ink, 'left', 'DejaVu Sans', 'normal'));
  if (mode === 'g') { const p = clamp(lt * 1.4); c.beginPath(); c.ellipse(-292, -556, 30 + 18 * p, 40 + 16 * p, 0, 0, 7); c.strokeStyle = '#d62828'; c.lineWidth = 9; c.globalAlpha = p; c.stroke(); c.globalAlpha = 1; }
  if (mode === 'data') { const p = back(lt * 2.5); c.save(); c.translate(120, 470); c.rotate(-0.16); c.scale(p, p); box(c, -250, -60, 500, 120, 'rgba(0,0,0,0)', 10, 10); c.strokeStyle = '#d62828'; c.lineWidth = 10; rr(c, -250, -60, 500, 120, 10); c.stroke(); txt(c, 'DATA: AMANHÃ', 0, 4, 66, '#d62828'); c.restore(); }
  c.restore();
};
// ---------- planos ----------
const shake = (f, a) => [Math.sin(f * 1.9) * a, Math.cos(f * 2.3) * a];
const SC = {
  claudio: (c, f, s, sh, lt) => { portaria(c, f); const o = { seed: 21, ...idle(f, 21), expr: talking('C', s) ? ['stern', 'whistle', 'neutral', 'whistle'][Math.floor(f / 4) % 4] : 'stern', facing: 0, L: 'hang', R: 'hang' }; drawChar(c, 'claudio', o, 420, 1580); drawChar(c, 'rafael', { seed: 11, ...idle(f, 11), expr: 'nervous', facing: -1, look: -0.4, L: 'hang', R: 'hang' }, 800, 1580); deskFront(c, f); },
  claudio_cima: (c, f, s, sh, lt) => { portaria(c, f); drawChar(c, 'claudio', { seed: 21, ...idle(f, 21), expr: talking('C', s) ? ['stern', 'whistle', 'neutral', 'whistle'][Math.floor(f / 4) % 4] : 'stern', facing: 0, L: 'hang', R: 'up' }, 420, 1580); drawChar(c, 'rafael', { seed: 11, ...idle(f, 11), expr: 'smile', facing: -1, look: -0.4, L: 'hang', R: 'hang' }, 800, 1580); deskFront(c, f); },
  claudio_monitor: (c, f, s, sh, lt) => { portaria(c, f); drawChar(c, 'claudio', { seed: 21, ...idle(f, 21), expr: talking('C', s) ? ['stern', 'whistle', 'neutral', 'whistle'][Math.floor(f / 4) % 4] : 'stern', facing: -1, L: 'point', R: 'hang' }, 520, 1580); drawChar(c, 'rafael', { seed: 11, ...idle(f, 11), expr: 'nervous', facing: -1, look: -0.4, L: 'hang', R: 'hang' }, 830, 1580); deskFront(c, f); },
  radio: (c, f, s, sh, lt) => { c.fillStyle = lin(c, 0, 1920, '#16333d', '#0e1d25'); c.fillRect(0, 0, W, 1920); box(c, -40, 1500, W + 80, 500, '#5d4630', 6, 9); radioProp(c, 540, 560, 1.5, f, true, 0); },
  radio_chia: (c, f, s, sh, lt) => { c.fillStyle = lin(c, 0, 1920, '#101e27', '#0a141a'); c.fillRect(0, 0, W, 1920); box(c, -40, 1500, W + 80, 500, '#4b3826', 6, 9); radioProp(c, 540, 560, 1.5, f, true, 1); for (let i = 0; i < 40; i++) { c.fillStyle = `rgba(180,200,210,${rnd(f * 3 + i) * 0.25})`; c.fillRect(rnd(f + i * 7) * W, rnd(f * 2 + i * 5) * H, 90 + rnd(i) * 160, 4); } },
  radio_voz: (c, f, s, sh, lt) => { c.fillStyle = lin(c, 0, 1920, '#101e27', '#0a141a'); c.fillRect(0, 0, W, 1920); box(c, -40, 1500, W + 80, 500, '#4b3826', 6, 9); radioProp(c, 540, 560, 1.5, f, true, 1); for (let i = 0; i < 70; i++) { c.fillStyle = `rgba(255,176,32,${rnd(f * 5 + i) * 0.3})`; c.fillRect(rnd(f + i * 7) * W, rnd(f * 2 + i * 5) * H, 120 + rnd(i) * 200, 5); } },
  predio: (c, f, s, sh, lt) => {   // exterior noturno
    c.fillStyle = lin(c, 0, 1920, '#0a1128', '#1b2547'); c.fillRect(0, 0, W, 1920);
    for (let i = 0; i < 40; i++) { c.fillStyle = `rgba(255,255,255,${0.2 + rnd(i) * 0.5})`; c.fillRect(rnd(i + 1) * W, rnd(i + 2) * 700, 4, 4); }
    box(c, 190, 360, 700, 1250, '#233354', 10, 11);
    for (let r = 0; r < 10; r++) for (let k = 0; k < 4; k++) { const lit = rnd(r * 7 + k) > 0.8 || (r === 3 && k === 2); const flick = r === 3 && k === 2 ? (Math.floor(f / 5) % 3 ? 1 : 0.35) : 1; c.globalAlpha = lit ? flick : 1; box(c, 240 + k * 160, 420 + r * 118, 110, 80, lit ? '#ffc24a' : '#0f1830', 8, 6); c.globalAlpha = 1; }
    box(c, 450, 1500, 180, 110, '#0f1830', 8, 8); box(c, 280, 1250, 520, 60, '#2a3550', 10, 8); txt(c, 'AURORA', 540, 1280, 40, '#ffc24a');
    c.fillStyle = '#12192c'; c.fillRect(0, 1610, W, 310); c.strokeStyle = INK; c.lineWidth = 8; c.beginPath(); c.moveTo(0, 1610); c.lineTo(W, 1610); c.stroke();
    box(c, 640, 1380, 20, 230, '#0a0f1a', 4, 6); c.beginPath(); c.arc(650, 1370, 36, 0, 7); c.fillStyle = '#ffc24a'; c.fill(); c.lineWidth = 7; c.strokeStyle = INK; c.stroke(); },
  rafael_deboche: (c, f, s, sh, lt) => { portaria(c, f); drawChar(c, 'rafael', { seed: 11, ...idle(f, 11), expr: talking('R', s) ? ['smile', 'grin'][Math.floor(f / 5) % 2] : 'smile', facing: 0, L: 'hang', R: 'hang' }, 640, 1580, 1.25); deskFront(c, f); },
  rafael_medo: (c, f, s, sh, lt) => { portaria(c, f); drawChar(c, 'rafael', { seed: 11, ...idle(f, 11), expr: talking('R', s) ? ['nervous', 'whistle'][Math.floor(f / 5) % 2] : 'nervous', facing: 0, L: 'hang', R: 'hang' }, 640, 1580, 1.25); deskFront(c, f); },
  rafael_choque: (c, f, s, sh, lt) => { portaria(c, f); drawChar(c, 'rafael', { seed: 11, ...idle(f, 11), expr: talking('R', s) ? ['shock', 'nervous'][Math.floor(f / 6) % 2] : 'shock', facing: 0, L: 'hang', R: 'hang' }, 640, 1580, 1.25); deskFront(c, f); },
  rafael_folha: (c, f, s, sh, lt) => { portaria(c, f); drawChar(c, 'rafael', { seed: 11, ...idle(f, 11), expr: talking('R', s) ? ['nervous', 'whistle'][Math.floor(f / 5) % 2] : 'nervous', facing: 0, L: 'hang', R: 'hang' }, 640, 1580, 1.25); deskFront(c, f); },
  rafael_pensa: (c, f, s, sh, lt) => { portaria(c, f); drawChar(c, 'rafael', { seed: 11, ...idle(f, 11), expr: talking('R', s) ? ['pained', 'nervous'][Math.floor(f / 6) % 2] : 'pained', facing: 0, L: 'hang', R: 'hang' }, 640, 1580, 1.25); deskFront(c, f); },
  elevador: (c, f, s, sh, lt) => { const tt = s - sh.start; const open = tt < 1.5 ? 0 : easeOut((tt - 1.5) / 0.7); const btn = tt > 3.2; elevator(c, f, open, tt < 1.5 ? '--' : '7', btn, 0); txt(c, '02:00', 540, 200, 96, '#ffc24a', 'center', 'DejaVu Sans Mono', 'bold', INK, 10); },
  monitor: (c, f, s, sh, lt) => { c.fillStyle = lin(c, 0, 1920, '#101e27', '#0a141a'); c.fillRect(0, 0, W, 1920); box(c, 50, 380, 980, 1150, '#2f3643', 36, 14); box(c, 90, 420, 900, 1070, '#050e0a', 12, 8);
    camFeed(c, 100, 430, 430, 520, 0, f); camFeed(c, 550, 430, 430, 520, 1, f); camFeed(c, 100, 970, 430, 510, 2, f); camFeed(c, 550, 970, 430, 510, 3, f);
    const p = clamp((s - sh.start) / 3.5); c.strokeStyle = `rgba(255,59,48,${0.4 + 0.5 * Math.abs(Math.sin(f * 0.15))})`; c.lineWidth = 12; c.strokeRect(550, 970, 430, 510); box(c, 380, 1560, 320, 60, '#2a3140', 10, 7); },
  folha_g: (c, f, s, sh, lt) => { c.fillStyle = '#17232c'; c.fillRect(0, 0, W, 1920); c.fillStyle = '#5d4630'; c.fillRect(0, 0, W, 1920); c.fillStyle = 'rgba(0,0,0,.2)'; for (let i = 0; i < 12; i++) c.fillRect(0, i * 170, W, 6); sheet(c, clamp((s - sh.start) / 4), 'g'); },
  folha_data: (c, f, s, sh, lt) => { c.fillStyle = '#5d4630'; c.fillRect(0, 0, W, 1920); c.fillStyle = 'rgba(0,0,0,.2)'; for (let i = 0; i < 12; i++) c.fillRect(0, i * 170, W, 6); sheet(c, clamp((s - sh.start - 2.0) / 2), 'data'); },
  celular: (c, f, s, sh, lt) => {
    c.fillStyle = '#0b1220'; c.fillRect(0, 0, W, 1920); const tt = s - sh.start; box(c, 140, 160, 800, 1600, '#1b2236', 70, 14); box(c, 175, 215, 730, 1490, '#222a42', 36, 6);
    box(c, 175, 215, 730, 130, '#2f3956', 36, 6); c.beginPath(); c.arc(250, 280, 36, 0, 7); c.fillStyle = '#4f7aa8'; c.fill(); c.lineWidth = 6; c.strokeStyle = INK; c.stroke(); txt(c, 'Rafael (meu número)', 330, 282, 42, '#d9e2f7', 'left');
    txt(c, 'hoje 02:41', 540, 410, 30, '#8c98b8');
    const msg = ['Amanhã chega um', 'vigia novo.', 'Quem entrega a folha,', 'vai embora.', 'Quem não entrega...', 'fica.']; const n = clamp((tt - 3.2) / 6.5) * msg.length;
    box(c, 215, 470, 650, 620, '#3b4a7a', 40, 8); msg.forEach((m, i) => { if (i < n) txt(c, m, 250, 540 + i * 88, 52, '#eef2ff', 'left', 'DejaVu Sans', 'normal'); });
    if (tt < 3.2) { box(c, 215, 470, 220, 110, '#3b4a7a', 40, 8); for (let i = 0; i < 3; i++) { c.beginPath(); c.arc(270 + i * 55, 525 + Math.sin(f * 0.3 + i) * 8, 12, 0, 7); c.fillStyle = '#d9e2f7'; c.fill(); } }
    box(c, 215, 1180, 650, 330, '#2a3350', 30, 6); txt(c, 'REGRA 5:', 270, 1240, 44, '#8c98b8', 'left'); txt(c, '________________', 270, 1330, 50, '#8c98b8', 'left'); },
  final: (c, f, s, sh, lt) => {
    c.fillStyle = lin(c, 0, 1920, '#0b1220', '#16233a'); c.fillRect(0, 0, W, 1920); const tt = s - sh.start;
    const ph = sh.phrases; const t1 = (ph.find((p) => /Entregar a folha/.test(p.text)) || ph[0]).start, t2 = (ph.find((p) => /queimar/i.test(p.text)) || ph[1] || ph[0]).start, t3 = (ph.find((p) => /Você decide|Parte 2/i.test(p.text)) || ph[ph.length - 1]).start;
    txt(c, 'O QUE O RAFAEL FAZ?', 540, 330, 68, '#ffc24a', 'center', 'DejaVu Sans', 'bold', INK, 14);
    const b1 = back((s - t1) * 3), b2 = back((s - t2) * 3);
    c.save(); c.translate(540, 760); c.scale(clamp(b1, 0, 1.1), clamp(b1, 0, 1.1)); box(c, -400, -150, 800, 300, '#2e8b57', 36, 12); txt(c, '1', -300, 0, 150, '#0f1420'); txt(c, 'ENTREGAR', 60, -40, 82, '#f3fff6'); txt(c, 'A FOLHA', 60, 50, 82, '#f3fff6'); c.restore();
    c.save(); c.translate(540, 1140); c.scale(clamp(b2, 0, 1.1), clamp(b2, 0, 1.1)); box(c, -400, -150, 800, 300, '#c0392b', 36, 12); txt(c, '2', -300, 0, 150, '#0f1420'); txt(c, 'QUEIMAR', 60, -40, 82, '#fff3f1'); txt(c, 'A FOLHA', 60, 50, 82, '#fff3f1'); c.restore();
    const wob = Math.sin(f * 0.35);
    if (b1 > 0.3) { c.save(); c.translate(900 + 8 * Math.sin(f * 0.1), 630); c.rotate(-0.12); box(c, -48, -62, 96, 124, '#e8dfc6', 8, 7); for (let i = 0; i < 4; i++) { c.beginPath(); c.moveTo(-30, -34 + i * 24); c.lineTo(30, -34 + i * 24); c.lineWidth = 5; c.strokeStyle = '#27408b'; c.stroke(); } c.restore(); }
    if (b2 > 0.3) { c.save(); c.translate(900, 1060); const h = 90 + 14 * wob; c.beginPath(); c.moveTo(-44, 60); c.quadraticCurveTo(-60, 0, -10, -h); c.quadraticCurveTo(0, -h * 0.4, 30, -h * 0.9); c.quadraticCurveTo(70, 0, 44, 60); c.closePath(); c.fillStyle = '#ff7a1a'; c.fill(); c.lineWidth = 8; c.strokeStyle = INK; c.stroke(); c.beginPath(); c.moveTo(-18, 56); c.quadraticCurveTo(-26, 10, 4, -h * 0.45); c.quadraticCurveTo(26, 10, 18, 56); c.closePath(); c.fillStyle = '#ffc24a'; c.fill(); c.restore(); }
    const pulse = 1 + 0.025 * Math.sin(f * 0.18);
    const b3 = back((s - t3) * 3); c.save(); c.translate(540, 1500); c.scale(clamp(b3, 0, 1.05) * pulse, clamp(b3, 0, 1.05) * pulse); txt(c, 'COMENTE 1 OU 2', 0, 0, 78, '#ffc24a', 'center', 'DejaVu Sans', 'bold', INK, 12); txt(c, 'A PARTE 2 SEGUE A MAIORIA', 0, 100, 48, '#d9e2f7', 'center', 'DejaVu Sans', 'bold', INK, 8); c.restore(); },
};
// câmera por plano: [cx, cy, zoom0, zoom1]
const CAM = {
  claudio: [600, 1060, 1.12, 1.24], claudio_cima: [600, 1040, 1.12, 1.26], claudio_monitor: [640, 1050, 1.12, 1.24], radio: [540, 900, 1.0, 1.14], radio_chia: [540, 900, 1.05, 1.2], radio_voz: [540, 900, 1.1, 1.3], predio: [540, 1100, 1.0, 1.12],
  rafael_deboche: [660, 1000, 1.25, 1.4], rafael_medo: [660, 1000, 1.35, 1.55], rafael_choque: [660, 1000, 1.45, 1.7], rafael_folha: [660, 1000, 1.3, 1.45], rafael_pensa: [660, 1000, 1.3, 1.45],
  elevador: [540, 960, 1.0, 1.1], monitor: [540, 960, 1.0, 1.5], folha_g: [540, 700, 1.0, 1.7], folha_data: [540, 1100, 1.1, 1.3], celular: [540, 960, 1.0, 1.08], final: [540, 960, 1.0, 1.0],
};
const MOVE = { monitor: [790, 1225], folha_g: [540, 700] };   // alvo do zoom
const FLASH = [];
const off = document.createElement('canvas'); off.width = W; off.height = H; const og = off.getContext('2d');
window.renderFrame = (f) => {
  const s = f / 30, sh = SHOTS.find((x) => s >= x.a && s < x.b) || SHOTS[SHOTS.length - 1], lt = clamp((s - sh.a) / Math.max(sh.b - sh.a, 0.01));
  og.setTransform(1, 0, 0, 1, 0, 0); og.clearRect(0, 0, W, H); SC[sh.type](og, f, s, sh, lt);
  const [cx0, cy0, z0, z1] = CAM[sh.type] || [540, 960, 1, 1.06], mv = MOVE[sh.type], k = ease(lt), z = lerp(z0, z1, k);
  const cx = mv ? lerp(cx0, mv[0], k) : cx0, cy = mv ? lerp(cy0, mv[1], k) : cy0, [sx, sy] = shake(f, sh.type.startsWith('rafael') || sh.type === 'radio_voz' ? 3 : 1.2);
  g.setTransform(1, 0, 0, 1, 0, 0); g.fillStyle = '#05080f'; g.fillRect(0, 0, W, H);
  g.setTransform(z, 0, 0, z, W / 2 - cx * z + sx, H / 2 - cy * z + sy); g.drawImage(off, 0, 0); g.setTransform(1, 0, 0, 1, 0, 0);
  cardRule(g, sh.rule, s - sh.a);
  const vg = g.createRadialGradient(540, 960, 500, 540, 960, 1250); vg.addColorStop(0, 'rgba(0,0,0,0)'); vg.addColorStop(1, 'rgba(0,0,0,.55)'); g.fillStyle = vg; g.fillRect(0, 0, W, H);
  const dk = clamp((s - 20) / 80) * 0.22; g.fillStyle = `rgba(4,8,20,${dk})`; g.fillRect(0, 0, W, H);   // escurece com o tempo
  for (let i = 0; i < 260; i++) { g.fillStyle = `rgba(255,255,255,${rnd(f * 91 + i) * 0.05})`; g.fillRect(rnd(f * 7 + i * 3) * W, rnd(f * 11 + i * 5) * H, 3, 3); }   // grão
  return true;
};
window.TOTAL = Math.round(TOTAL * 30); window.ready = true;
