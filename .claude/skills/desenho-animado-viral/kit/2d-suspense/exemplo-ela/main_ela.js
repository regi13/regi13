// "Ela Mora Aqui" — 2D cartoon em camadas (Canvas 2D). Cada FALA = um plano; os cortes vêm de timeline.js (gerado pelo áudio).
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
const cardRule = (c, label, lt, show = true) => {   // carimbo da regra no topo
  if (!label) return; const p = back(lt * 3); c.save(); c.translate(540, 170); c.scale(p, p); c.rotate(-0.04);
  box(c, -300, -70, 600, 140, '#12192c', 22, 10); txt(c, label, 0, 4, 78, '#ffc24a'); c.restore();
};

const celular = (c, f, tela, gx = 70) => { box(c, gx, 140, W - 2 * gx, 1640, '#0b0f1c', 80, 14); box(c, gx + 28, 190, W - 2 * gx - 56, 1540, tela, 56, 6); box(c, 400, 168, 280, 30, '#05070f', 15, 4); };

// ---------- cenários de "Ela Mora Aqui" ----------
const ph = (sh, re) => { const p = sh.phrases.find((x) => re.test(x.text)); return p ? p.start : sh.start; };
const pulse = (f, p = 0.2) => 1 + 0.05 * Math.sin(f * p);
const painel = (c, y, h, fill, title, t0, s, f, draw) => { const k = back((s - t0) * 3); if (k <= 0.02) return; c.save(); c.translate(540, y + h / 2); c.scale(k, k); c.translate(-540, -(y + h / 2));
  c.save(); rr(c, 60, y, 960, h, 30); c.clip(); c.fillStyle = fill; c.fillRect(60, y, 960, h); draw(c, y); c.restore(); rr(c, 60, y, 960, h, 30); c.lineWidth = 10; c.strokeStyle = INK; c.stroke();
  box(c, 90, y + 18, 520, 64, 'rgba(15,20,32,.85)', 18, 5); txt(c, title, 110, y + 50, 38, '#ffe9c7', 'left');
  const r = 1 + 0.06 * Math.sin(f * 0.3); c.beginPath(); c.arc(820, y + h - 120, 60 * r, 0, 7); c.lineWidth = 12; c.strokeStyle = '#e8453a'; c.stroke(); c.restore(); };
const salaBg = (c, f) => {
  c.fillStyle = lin(c, 0, 1500, '#c9a67f', '#9a7a58'); c.fillRect(0, 0, W, 1500); c.fillStyle = lin(c, 1500, 1920, '#6b4a30', '#4a3220'); c.fillRect(0, 1500, W, 420);
  box(c, 90, 250, 330, 440, '#a9d4f0', 10, 10); c.fillStyle = lin(c, 260, 680, '#d6ecfb', '#8cc3e8'); c.fillRect(100, 260, 310, 420); c.fillStyle = INK; c.fillRect(250, 260, 10, 420); c.fillRect(100, 462, 310, 10);
  box(c, 560, 360, 320, 230, '#e9dcc4', 8, 9); txt(c, 'vovó', 720, 475, 56, '#7a5a3a');   // quadro
  box(c, 640, 1100, 400, 300, '#5a6b8a', 40, 10); box(c, 600, 1250, 480, 180, '#6b7da0', 40, 10);   // sofá
  box(c, 120, 1300, 120, 200, '#7a4a2a', 20, 9); c.beginPath(); c.arc(180, 1260, 90, 0, 7); c.fillStyle = '#4f8a46'; c.fill(); c.lineWidth = 9; c.strokeStyle = INK; c.stroke();
};
const biaCena = (c, f, s, exprs, plain, k = 1.3) => { salaBg(c, f); drawChar(c, 'bia', { seed: 17, ...idle(f, 17), expr: talking('R', s) ? exprs[Math.floor(f / 5) % exprs.length] : plain, facing: 0, L: 'hang', R: 'hang' }, 480, 1790, k); box(c, -30, 1520, W + 60, 460, '#4a3220', 10, 10); c.fillStyle = '#5a3f28'; c.fillRect(0, 1530, W, 14); };
const casaManha = (c, f, s, sh) => {
  c.fillStyle = lin(c, 0, 1920, '#f3c48a', '#b98a58'); c.fillRect(0, 0, W, 1920); const t0 = clamp((s - sh.a) / 3);
  c.beginPath(); c.arc(780, lerp(900, 520, easeOut(t0)), 140, 0, 7); c.fillStyle = '#ffd978'; c.fill(); c.fillStyle = '#7da35a'; c.fillRect(0, 1300, W, 620);
  c.beginPath(); c.moveTo(210, 880); c.lineTo(540, 600); c.lineTo(870, 880); c.closePath(); c.fillStyle = '#8a4a3a'; c.fill(); c.lineWidth = 10; c.strokeStyle = INK; c.lineJoin = 'round'; c.stroke();
  box(c, 250, 870, 580, 450, '#d8c3a0', 10, 10); box(c, 480, 1020, 120, 300, '#6b4a30', 8, 9); box(c, 300, 960, 130, 130, '#a9d4f0', 6, 8); box(c, 650, 960, 130, 130, '#a9d4f0', 6, 8);
  box(c, 250, 90 + 0, 580, 90, 'rgba(15,20,32,.82)', 24, 6); txt(c, 'ELA MORA AQUI • PARTE 1', 540, 135, 38, '#ffe9c7');
  painel(c, 120, 440, '#bfe2e6', 'A ESCOVA ÚMIDA', ph(sh, /escova/i) - 0.1, s, f, (g) => { g.fillStyle = '#9ec9d0'; g.fillRect(60, 120, 960, 440); box(g, 380, 330, 240, 120, '#e8f2f4', 20, 8); box(g, 640, 250, 70, 210, '#cfe3e7', 12, 8);
    box(g, 730, 190, 26, 260, '#3f7ad6', 8, 7); box(g, 724, 160, 38, 60, '#e8e8e8', 8, 7); for (let i = 0; i < 4; i++) { const t = ((f * 0.04 + i / 4) % 1); g.beginPath(); g.arc(743, 460 + t * 80, 9, 0, 7); g.fillStyle = '#7ec4ff'; g.fill(); } });
  painel(c, 590, 440, '#e6c58e', 'O POTE DE ARROZ', ph(sh, /arroz/i) - 0.1, s, f, (g) => { g.fillStyle = '#d6b078'; g.fillRect(60, 590, 960, 440); box(g, 150, 860, 780, 36, '#7a4a2a', 8, 8);
    g.save(); g.translate(540, 800); g.beginPath(); g.moveTo(-170, -120); g.lineTo(170, -120); g.lineTo(150, 80); g.lineTo(-150, 80); g.closePath(); g.fillStyle = '#e9e2d0'; g.fill(); g.lineWidth = 9; g.strokeStyle = INK; g.stroke();
    const lv = lerp(-90, 10, easeOut((s - ph(sh, /arroz/i)) / 1.2)); g.fillStyle = '#ffffffcc'; g.fillRect(-146, lv, 292, 90 - lv + 0); g.setLineDash([14, 10]); g.strokeStyle = '#e8453a'; g.lineWidth = 6; g.beginPath(); g.moveTo(-170, -90); g.lineTo(170, -90); g.stroke(); g.setLineDash([]); g.restore(); });
  painel(c, 1060, 440, '#c9a679', 'A CADEIRA FORA DO LUGAR', ph(sh, /cadeira/i) - 0.1, s, f, (g) => { g.fillStyle = '#b48f62'; g.fillRect(60, 1060, 960, 440); box(g, 300, 1240, 500, 40, '#7a4a2a', 8, 8); box(g, 330, 1280, 30, 190, '#7a4a2a', 6, 7); box(g, 740, 1280, 30, 190, '#7a4a2a', 6, 7);
    g.setLineDash([16, 12]); g.lineWidth = 8; g.strokeStyle = '#2a1c16'; g.strokeRect(120, 1250, 130, 210); g.setLineDash([]); const sl = lerp(0, 120, easeOut((s - ph(sh, /cadeira/i)) / 0.8)); box(g, 120 + sl, 1250, 130, 210, '#c0553a', 14, 8); });
  const dim = clamp((s - ph(sh, /sozinha/i)) * 1.5) * 0.45; c.fillStyle = `rgba(10,12,28,${dim})`; c.fillRect(0, 0, W, 1920);
};
const casaAvo = (c, f, s, sh) => {
  c.fillStyle = lin(c, 0, 1920, '#6b5a4a', '#3a2f28'); c.fillRect(0, 0, W, 1920); c.fillStyle = 'rgba(0,0,0,.12)'; for (let i = 0; i < 9; i++) c.fillRect(i * 130, 0, 40, 1920);
  c.fillStyle = '#2a211b'; c.fillRect(0, 0, W, 520); const tr = ph(sh, /trancado/i), sh_ = s > tr ? 6 * Math.sin((s - tr) * 40) * Math.exp(-(s - tr) * 3) : 0;
  box(c, 330 + sh_, 150, 420, 250, '#5a4a3a', 12, 10); box(c, 350 + sh_, 170, 380, 210, '#4a3b2e', 8, 7); c.fillStyle = '#c9a040'; c.beginPath(); c.arc(540 + sh_, 400, 38, Math.PI, 0); c.lineWidth = 14; c.strokeStyle = '#c9a040'; c.stroke(); box(c, 495 + sh_, 400, 90, 80, '#d9a845', 10, 8);
  box(c, 120, 640, 420, 540, '#7a5a3a', 14, 12); box(c, 150, 670, 360, 480, '#e9dcc4', 8, 8); c.beginPath(); c.arc(330, 860, 110, 0, 7); c.fillStyle = '#f1cfb1'; c.fill(); c.lineWidth = 9; c.strokeStyle = INK; c.stroke(); c.beginPath(); c.arc(330, 790, 112, Math.PI * 1.05, Math.PI * 1.95); c.fillStyle = '#d9d4cc'; c.fill(); c.stroke();
  c.beginPath(); c.ellipse(330, 1100, 140, 80, 0, Math.PI, 0); c.fillStyle = '#6f8f5a'; c.fill(); c.stroke();
  const rb = back((s - ph(sh, /morreu/i)) * 2.5); if (rb > 0.02) { c.save(); c.translate(150, 670); c.scale(rb, rb); c.fillStyle = '#10141f'; c.beginPath(); c.moveTo(0, 0); c.lineTo(150, 0); c.lineTo(0, 150); c.closePath(); c.fill(); c.restore(); }
  const kt = ph(sh, /chave/i), kk = back((s - kt) * 2.5); if (kk > 0.02) { c.save(); c.translate(780, 900); c.scale(kk, kk); c.rotate(-0.5); c.fillStyle = '#d9a845'; c.beginPath(); c.arc(-60, 0, 46, 0, 7); c.fill(); c.lineWidth = 9; c.strokeStyle = INK; c.stroke(); box(c, -20, -14, 150, 28, '#d9a845', 6, 8); box(c, 90, 10, 20, 50, '#d9a845', 4, 7); c.restore(); c.save(); c.translate(780, 900); c.lineWidth = 22; c.strokeStyle = '#e8453a'; c.lineCap = 'round'; c.beginPath(); c.moveTo(-90, -90); c.lineTo(90, 90); c.moveTo(90, -90); c.lineTo(-90, 90); c.stroke(); c.restore(); }
  c.fillStyle = lin(c, 1500, 1920, '#3a2f28', '#241c17'); c.fillRect(0, 1500, W, 420);
};
const cameraInstala = (c, f, s, sh) => {
  salaBg(c, f); c.fillStyle = 'rgba(0,0,0,.35)'; c.fillRect(0, 0, W, 1920); box(c, 140, 1060, 800, 50, '#6b4a30', 10, 9);
  const k = pulse(f, 0.1) , t = clamp((s - sh.a) / 1.2); c.save(); c.translate(540, 900); c.scale(1.2 + 0.2 * t, 1.2 + 0.2 * t); box(c, -180, -130, 360, 260, '#eee9df', 36, 12); c.beginPath(); c.arc(0, 0, 90, 0, 7); c.fillStyle = '#10141f'; c.fill(); c.lineWidth = 10; c.strokeStyle = INK; c.stroke(); c.beginPath(); c.arc(0, 0, 44, 0, 7); c.fillStyle = '#2f3a66'; c.fill(); c.beginPath(); c.arc(-22, -22, 12, 0, 7); c.fillStyle = '#6a7cc8'; c.fill();
  c.beginPath(); c.arc(130, -90, 14, 0, 7); c.fillStyle = Math.floor(f / 10) % 2 ? '#ff3b30' : '#5a1410'; c.fill(); c.restore();
  const p = clamp((s - ph(sh, /corredor/i)) * 2); if (p > 0) { c.save(); c.globalAlpha = p; c.strokeStyle = '#ffc24a'; c.lineWidth = 8; for (const [x, y, dx, dy] of [[150, 340, 1, 1], [930, 340, -1, 1], [150, 1480, 1, -1], [930, 1480, -1, -1]]) { c.beginPath(); c.moveTo(x, y + dy * 70); c.lineTo(x, y); c.lineTo(x + dx * 70, y); c.stroke(); } txt(c, 'CÂMERA • SALA', 540, 300, 46, '#ffc24a'); c.restore(); }
};
const quartoNoite = (c, f, s, sh) => {
  c.fillStyle = lin(c, 0, 1920, '#0b1226', '#141c36'); c.fillRect(0, 0, W, 1920); box(c, 120, 240, 360, 460, '#1c2a52', 10, 10); c.fillStyle = lin(c, 250, 690, '#0e1a3a', '#233a74'); c.fillRect(130, 250, 340, 440); c.beginPath(); c.arc(360, 400, 54, 0, 7); c.fillStyle = '#e9e4cc'; c.fill();
  box(c, 560, 1050, 460, 420, '#2d3e6a', 24, 12); box(c, 560, 1180, 460, 300, '#3b4f84', 20, 12);
  c.beginPath(); c.arc(700, 1130, 70, 0, 7); c.fillStyle = '#2a1c16'; c.fill(); c.lineWidth = 9; c.strokeStyle = INK; c.stroke(); box(c, 650, 1090, 100, 70, '#c99067', 24, 8);
  box(c, 120, 1130, 180, 150, '#10141f', 14, 9); txt(c, '03:12', 210, 1205, 46, '#ff3b30', 'center', 'DejaVu Sans Mono');
  box(c, 40, 700, 70, 520, '#05070f', 6, 6);   // porta entreaberta
  c.fillStyle = lin(c, 1500, 1920, '#10172c', '#0a0f20'); c.fillRect(0, 1500, W, 420);
};
const woman = (c, x, y, k, pose, t) => {
  c.save(); c.translate(x, y); c.scale(k, k); c.lineJoin = 'round'; c.lineWidth = 9; c.strokeStyle = '#06210f';
  c.beginPath(); c.moveTo(-70, -340); c.lineTo(70, -340); c.lineTo(110, 0); c.lineTo(-110, 0); c.closePath(); c.fillStyle = '#4b7a58'; c.fill(); c.stroke();   // roupão
  c.fillStyle = '#9ec9a8'; if (pose === 'lips') { c.beginPath(); c.moveTo(60, -310); c.lineTo(40, -400); c.lineTo(58, -406); c.lineTo(86, -318); c.closePath(); c.fill(); c.stroke(); c.beginPath(); c.moveTo(-60, -310); c.lineTo(-90, -200); c.lineTo(-70, -196); c.lineTo(-40, -300); c.closePath(); c.fill(); c.stroke(); }
  else if (pose === 'drink') { c.beginPath(); c.moveTo(60, -310); c.lineTo(50, -420); c.lineTo(74, -420); c.lineTo(90, -318); c.closePath(); c.fill(); c.stroke(); box(c, 46, -470, 40, 60, 'rgba(220,255,230,.6)', 6, 5); c.beginPath(); c.moveTo(-60, -310); c.lineTo(-90, -200); c.lineTo(-70, -196); c.lineTo(-40, -300); c.closePath(); c.fill(); c.stroke(); }
  else { for (const sx of [-1, 1]) { c.beginPath(); c.moveTo(sx * 60, -320); c.lineTo(sx * 96, -190); c.lineTo(sx * 74, -184); c.lineTo(sx * 40, -310); c.closePath(); c.fill(); c.stroke(); } }
  c.beginPath(); c.arc(0, -410, 62, 0, 7); c.fillStyle = '#0c1a10'; c.fill(); c.stroke(); c.beginPath(); c.arc(0, -392, 48, 0.1, Math.PI - 0.1); c.fillStyle = pose === 'lips' ? '#b9dcc2' : '#0c1a10'; c.fill();
  if (pose === 'lips') { c.fillStyle = '#143a22'; c.fillRect(-26, -392, 8, 8); c.fillRect(18, -392, 8, 8); }
  c.fillStyle = '#9ec9a8'; for (const sx of [-1, 1]) c.fillRect(sx * 40 - 18, 0, 36, 30); c.restore(); };
const cctv = (c, f, s, sh, est) => {
  c.fillStyle = '#0b130d'; c.fillRect(0, 0, W, 1920);
  c.fillStyle = lin(c, 0, 1920, '#14231a', '#0c160f'); c.fillRect(0, 0, W, 1920);
  c.fillStyle = '#1b2f21'; c.beginPath(); c.moveTo(0, 0); c.lineTo(W, 0); c.lineTo(760, 560); c.lineTo(320, 560); c.closePath(); c.fill();   // teto
  c.fillStyle = '#0f1c13'; c.beginPath(); c.moveTo(0, 0); c.lineTo(320, 560); c.lineTo(320, 1320); c.lineTo(0, 1920); c.closePath(); c.fill();
  c.fillStyle = '#122016'; c.beginPath(); c.moveTo(W, 0); c.lineTo(760, 560); c.lineTo(760, 1320); c.lineTo(W, 1920); c.closePath(); c.fill();
  c.fillStyle = '#18291d'; c.beginPath(); c.moveTo(0, 1920); c.lineTo(320, 1320); c.lineTo(760, 1320); c.lineTo(W, 1920); c.closePath(); c.fill();
  c.fillStyle = '#070d09'; c.fillRect(320, 560, 440, 760);   // fundo do corredor
  box(c, 340, 640, 120, 640, '#050a07', 4, 5); c.fillStyle = '#244230'; c.fillRect(600, 640, 150, 640);   // porta do quarto / abertura cozinha
  // alçapão
  const open = est.open || 0; c.save(); c.translate(540, 250); c.fillStyle = '#2a4634'; c.fillRect(-170, -110, 340, 220); if (open > 0) { c.fillStyle = '#020503'; c.fillRect(-150, -90, 300, 180); } c.restore();
  c.save(); c.translate(540, 360); c.transform(1, 0, 0, 1 - 0.0, 0, 0); const sw = est.open || 0; c.fillStyle = '#35553f'; c.strokeStyle = '#06210f'; c.lineWidth = 8; c.beginPath(); c.moveTo(-160, -110 + 220 * 0); c.lineTo(160, -110); c.lineTo(160 - 20 * sw, -110 + 240 * sw); c.lineTo(-160 + 20 * sw, -110 + 240 * sw); c.closePath(); if (sw > 0.02) { c.fill(); c.stroke(); } c.restore();
  if (est.ladder) { const L = est.ladder; c.strokeStyle = '#7bd69a'; c.lineWidth = 10; c.beginPath(); c.moveTo(500, 330); c.lineTo(470, 330 + 760 * L); c.moveTo(580, 330); c.lineTo(610, 330 + 760 * L); c.stroke(); c.lineWidth = 7; for (let i = 0; i < 7; i++) { const yy = 400 + i * 110; if (yy < 330 + 760 * L) { const k = (yy - 330) / (760 * L + 1e-6) * 0.3; c.beginPath(); c.moveTo(500 - 30 * (yy - 330) / 760, yy); c.lineTo(580 + 30 * (yy - 330) / 760, yy); c.stroke(); } } }
  if (est.w) { const w = est.w; c.save(); c.beginPath(); c.rect(0, w.clipY === undefined ? 0 : w.clipY, W, 1920); c.clip(); woman(c, w.x, w.y, w.k, w.pose, s); c.restore(); }
  // efeito câmera de segurança
  c.fillStyle = 'rgba(40,255,120,.10)'; c.fillRect(0, 0, W, 1920); c.fillStyle = 'rgba(0,0,0,.22)'; for (let y = 0; y < 1920; y += 6) c.fillRect(0, y, W, 2);
  for (let i = 0; i < 160; i++) { c.fillStyle = `rgba(160,255,190,${rnd(f * 53 + i) * 0.09})`; c.fillRect(rnd(f * 3 + i * 7) * W, rnd(f * 5 + i * 11) * 1920, 6, 2); }
  const gl = est.glitch || 0; if (gl > 0 && rnd(f * 9) < gl) { const yy = rnd(f * 17) * 1700; c.drawImage(c.canvas, 0, yy, W, 80, 14 + 30 * rnd(f), yy, W, 80); }
  const sec = 12 + Math.floor((s - sh.a) * 1); txt(c, 'CAM 01  ' + '03:12:' + String(sec % 60).padStart(2, '0'), 80, 90, 44, '#7bff9e', 'left', 'DejaVu Sans Mono'); c.beginPath(); c.arc(960, 90, 16, 0, 7); c.fillStyle = Math.floor(f / 12) % 2 ? '#ff3b30' : '#6a1a14'; c.fill(); txt(c, 'REC', 925, 90, 40, '#ff6a60', 'right', 'DejaVu Sans Mono');
};
const feedA = (c, f, s, sh) => { const t0 = ph(sh, /teto/i) + 0.5; cctv(c, f, s, sh, { open: clamp((s - t0) / 1.2) ** 1.5 }); };
const feedB = (c, f, s, sh) => { const d = sh.b - sh.a, p = clamp((s - sh.a - 0.8) / (d * 0.85)); cctv(c, f, s, sh, { open: 1, ladder: clamp((s - sh.a) / 0.8), w: { x: lerp(560, 600, p), y: lerp(380, 1500, ease(p)), k: lerp(0.45, 1.3, ease(p)), pose: 'down', clipY: 330 } }); };
const feedC = (c, f, s, sh) => { const tw = ph(sh, /Passa/i), p = clamp((s - tw) / 1.8), x = lerp(850, 330, ease(p)); cctv(c, f, s, sh, { open: 1, ladder: 1, w: { x, y: 1480, k: 1.2, pose: s < tw ? 'drink' : 'down' } }); };
const feedD = (c, f, s, sh) => { const p = clamp((s - sh.a) / 1.2); cctv(c, f, s, sh, { open: 1, ladder: 1, glitch: 0.2 + 0.6 * clamp((s - ph(sh, /dedo/i)) / 1.5), w: { x: lerp(330, 540, ease(p)), y: lerp(1480, 1620, ease(p)), k: lerp(1.2, 1.7, ease(p)), pose: p > 0.7 ? 'lips' : 'down' } }); };
const alertaCena = (c, f, s, sh) => {
  const tt = s - sh.a; c.fillStyle = lin(c, 0, 1920, '#1a1e2c', '#0e111c'); c.fillRect(0, 0, W, 1920); celular(c, f, '#101624');
  const bn = back(tt * 2.5); c.save(); c.translate(0, -300 * (1 - bn)); box(c, 120, 250, 840, 190, '#242d44', 36, 8); txt(c, 'CÂMERA SALA', 170, 300, 38, '#ffc24a', 'left'); txt(c, 'Movimento detectado agora', 170, 370, 52, '#ffffff', 'left'); c.restore();
  const vib = tt < 2 ? 5 * Math.sin(f * 2.4) : 0; c.save(); c.translate(vib, 0); box(c, 120, 560, 840, 760, '#0b130d', 24, 8); c.save(); rr(c, 120, 560, 840, 760, 24); c.clip(); c.fillStyle = '#16281c'; c.fillRect(120, 560, 840, 760); c.fillStyle = '#050a07'; c.fillRect(440, 700, 200, 360); c.fillStyle = '#35553f'; c.fillRect(470, 590, 140, 80); c.fillStyle = '#020503'; c.fillRect(480, 600, 120, 60); c.fillStyle = 'rgba(40,255,120,.10)'; c.fillRect(120, 560, 840, 760); c.fillStyle = 'rgba(0,0,0,.2)'; for (let y = 560; y < 1320; y += 6) c.fillRect(120, y, 840, 2); c.restore(); box(c, 150, 590, 260, 56, '#e8453a', 14, 6); txt(c, 'AO VIVO', 280, 618, 34, '#fff', 'center'); c.restore();
  txt(c, 'Corredor • teto aberto', 540, 1380, 44, '#9fe3b5'); txt(c, 'Clara  •  no trabalho', 540, 1450, 38, '#8aa0c8');
};
const SC = {
  casa_manha: casaManha, bia_duvida: (c, f, s) => biaCena(c, f, s, ['pained', 'nervous'], 'pained'), bia_choque: (c, f, s) => biaCena(c, f, s, ['shock', 'nervous'], 'shock', 1.45), bia_medo: (c, f, s) => biaCena(c, f, s, ['nervous', 'pained'], 'nervous', 1.45),
  casa_avo: casaAvo, camera_instala: cameraInstala, quarto_noite: quartoNoite, feed_a: feedA, feed_b: feedB, feed_c: feedC, feed_d: feedD, alerta: alertaCena,
  final: (c, f, s, sh) => {
    c.fillStyle = lin(c, 0, 1920, '#0b1220', '#16233a'); c.fillRect(0, 0, W, 1920);
    const phs = sh.phrases; const t1 = (phs.find((p) => /sozinha/i.test(p.text)) || phs[0]).start, t2 = (phs.find((p) => /polícia/i.test(p.text)) || phs[1] || phs[0]).start, t3 = (phs.find((p) => /Você decide|Parte 2/i.test(p.text)) || phs[phs.length - 1]).start;
    txt(c, 'O QUE A CLARA FAZ?', 540, 330, 72, '#ffc24a', 'center', 'DejaVu Sans', 'bold', INK, 14);
    const b1 = back((s - t1) * 3), b2 = back((s - t2) * 3), wob = Math.sin(f * 0.35);
    c.save(); c.translate(540, 760); c.scale(clamp(b1, 0, 1.1), clamp(b1, 0, 1.1)); box(c, -400, -150, 800, 300, '#2e8b57', 36, 12); txt(c, '1', -300, 0, 150, '#0f1420'); txt(c, 'VOLTAR', -40, -40, 82, '#f3fff6', 'left'); txt(c, 'SOZINHA', -40, 50, 82, '#f3fff6', 'left'); c.restore();
    c.save(); c.translate(540, 1140); c.scale(clamp(b2, 0, 1.1), clamp(b2, 0, 1.1)); box(c, -400, -150, 800, 300, '#2c5fc0', 36, 12); txt(c, '2', -300, 0, 150, '#0f1420'); txt(c, 'CHAMAR', -40, -40, 80, '#eef3ff', 'left'); txt(c, 'A POLÍCIA', -40, 50, 80, '#eef3ff', 'left'); c.restore();
    if (b1 > 0.3) { c.save(); c.translate(890, 625); box(c, -42, -60, 84, 120, '#7a4a2a', 8, 7); c.beginPath(); c.arc(18, 4, 7, 0, 7); c.fillStyle = '#d9a845'; c.fill(); c.restore(); }
    if (b2 > 0.3) { c.save(); c.translate(890, 1010 + 4 * wob); c.beginPath(); c.arc(0, 8, 40, Math.PI, 0); c.lineTo(40, 40); c.lineTo(-40, 40); c.closePath(); c.fillStyle = Math.floor(f / 8) % 2 ? '#ff3b30' : '#3b6bff'; c.fill(); c.lineWidth = 8; c.strokeStyle = INK; c.stroke(); c.restore(); }
    const pl = 1 + 0.025 * Math.sin(f * 0.18), b3 = back((s - t3) * 3); c.save(); c.translate(540, 1500); c.scale(clamp(b3, 0, 1.05) * pl, clamp(b3, 0, 1.05) * pl);
    txt(c, 'COMENTE 1 OU 2', 0, 0, 78, '#ffc24a', 'center', 'DejaVu Sans', 'bold', INK, 12); txt(c, 'A PARTE 2 SEGUE A MAIORIA', 0, 90, 44, '#b9c4dc', 'center'); c.restore();
  },
};
const CAM = {
  casa_manha: [540, 960, 1.0, 1.03], bia_duvida: [520, 1250, 1.1, 1.22], bia_choque: [520, 1250, 1.2, 1.5], bia_medo: [520, 1250, 1.15, 1.4], casa_avo: [540, 900, 1.0, 1.18], camera_instala: [540, 960, 1.0, 1.1], quarto_noite: [540, 960, 1.0, 1.15],
  feed_a: [540, 800, 1.0, 1.12], feed_b: [540, 960, 1.0, 1.1], feed_c: [540, 1000, 1.0, 1.1], feed_d: [540, 1100, 1.0, 1.25], alerta: [540, 960, 1.0, 1.04], final: [540, 960, 1.0, 1.0],
};
const MOVE = {};
const shake = (f, a) => [Math.sin(f * 1.9) * a, Math.cos(f * 2.3) * a];

const off = document.createElement('canvas'); off.width = W; off.height = H; const og = off.getContext('2d');
window.renderFrame = (f) => {
  const s = f / 30, sh = SHOTS.find((x) => s >= x.a && s < x.b) || SHOTS[SHOTS.length - 1], lt = clamp((s - sh.a) / Math.max(sh.b - sh.a, 0.01));
  og.setTransform(1, 0, 0, 1, 0, 0); og.clearRect(0, 0, W, H); SC[sh.type](og, f, s, sh, lt);
  const [cx0, cy0, z0, z1] = CAM[sh.type] || [540, 960, 1, 1.06], mv = MOVE[sh.type], k = ease(lt), z = lerp(z0, z1, k) * (1 + 0.045 * Math.pow(1 - easeOut((s - sh.a) / 0.28), 2));   // punch-in no corte (antecipação/assentamento)
  const imp = (sh.id === 'n8' || sh.id === 'b3') && (s - sh.a) < 0.1;   // quadros de impacto
  const cx = mv ? lerp(cx0, mv[0], k) : cx0, cy = mv ? lerp(cy0, mv[1], k) : cy0, [sx, sy] = shake(f, sh.type.startsWith('bia') ? 3 : 1.2);
  g.setTransform(1, 0, 0, 1, 0, 0); g.fillStyle = '#05080f'; g.fillRect(0, 0, W, H);
  g.setTransform(z, 0, 0, z, W / 2 - cx * z + sx, H / 2 - cy * z + sy); g.drawImage(off, 0, 0); g.setTransform(1, 0, 0, 1, 0, 0);
  if (imp && Math.floor((s - sh.a) * 30) % 2 === 0) { g.globalCompositeOperation = 'difference'; g.fillStyle = '#fff'; g.fillRect(0, 0, W, H); g.globalCompositeOperation = 'source-over'; }
  cardRule(g, sh.rule, s - sh.a);
  const vg = g.createRadialGradient(540, 960, 500, 540, 960, 1250); vg.addColorStop(0, 'rgba(0,0,0,0)'); vg.addColorStop(1, 'rgba(0,0,0,.55)'); g.fillStyle = vg; g.fillRect(0, 0, W, H);
  const dk = clamp((s - 20) / 80) * 0.22; g.fillStyle = `rgba(4,8,20,${dk})`; g.fillRect(0, 0, W, H);   // escurece com o tempo
  for (let i = 0; i < 260; i++) { g.fillStyle = `rgba(255,255,255,${rnd(f * 91 + i) * 0.05})`; g.fillRect(rnd(f * 7 + i * 3) * W, rnd(f * 11 + i * 5) * H, 3, 3); }   // grão
  return true;
};
window.TOTAL = Math.round(TOTAL * 30); window.ready = true;
