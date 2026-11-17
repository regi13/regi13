// "O Último Pedido" — 2D cartoon em camadas (Canvas 2D). Cada FALA = um plano; os cortes vêm de timeline.js (gerado pelo áudio).
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

// ---------- cenários do Último Pedido ----------
const noiteCeu = (c) => { c.fillStyle = lin(c, 0, 1920, '#070b1a', '#18203a'); c.fillRect(0, 0, W, 1920); for (let i = 0; i < 40; i++) { c.fillStyle = `rgba(255,255,255,${0.2 + 0.5 * rnd(i)})`; c.fillRect(rnd(i + 5) * W, rnd(i + 9) * 700, 4, 4); } };
const predios = (c, base = 1250) => { for (let i = 0; i < 8; i++) { const bw = 150 + rnd(i) * 90, bh = 260 + rnd(i + 4) * 420, bx = i * 140 - 30; c.fillStyle = i % 2 ? '#0c1226' : '#0f162d'; c.fillRect(bx, base - bh, bw, bh); for (let k = 0; k < 14; k++) if (rnd(i * 17 + k) > 0.72) { c.fillStyle = '#e8b04a'; c.fillRect(bx + 14 + (k % 4) * 30, base - bh + 20 + Math.floor(k / 4) * 50, 16, 24); } } };
const rua = (c, f) => {
  noiteCeu(c); predios(c, 1250); c.fillStyle = lin(c, 1250, 1920, '#20263a', '#10141f'); c.fillRect(0, 1250, W, 670);
  c.fillStyle = '#2a3148'; c.fillRect(0, 1250, W, 24); c.strokeStyle = 'rgba(230,200,90,.55)'; c.lineWidth = 10; c.setLineDash([90, 70]); c.beginPath(); c.moveTo(0, 1700); c.lineTo(W, 1700); c.stroke(); c.setLineDash([]);
  // poste com luz quente (sem brilho branco no chão)
  box(c, 120, 520, 26, 780, '#1b2133', 8, 7); box(c, 70, 500, 130, 40, '#1b2133', 14, 7); c.beginPath(); c.arc(135, 556, 30, 0, 7); c.fillStyle = '#ffd27a'; c.fill();
  const gl = c.createRadialGradient(135, 556, 10, 135, 556, 420); gl.addColorStop(0, 'rgba(255,190,90,.30)'); gl.addColorStop(1, 'rgba(255,190,90,0)'); c.fillStyle = gl; c.fillRect(0, 100, 560, 1000);
  // moto estacionada
  c.save(); c.translate(860, 1560); c.fillStyle = '#10141f'; for (const x of [-90, 90]) { c.beginPath(); c.arc(x, 40, 52, 0, 7); c.fill(); c.lineWidth = 8; c.strokeStyle = INK; c.stroke(); c.beginPath(); c.arc(x, 40, 22, 0, 7); c.fillStyle = '#2f3750'; c.fill(); c.fillStyle = '#10141f'; }
  box(c, -90, -60, 180, 70, '#c93a25', 24, 8); box(c, 20, -110, 90, 60, '#e45a3d', 16, 8); box(c, -120, -140, 120, 110, '#e4572e', 14, 8); txt(c, 'ENTREGA', -60, -86, 22, '#fff4e8'); c.restore();
};
const casaCena = (c, f, luz = 1) => {
  noiteCeu(c); c.fillStyle = '#0b1020'; c.fillRect(0, 1300, W, 620); c.fillStyle = lin(c, 1300, 1920, '#1d2236', '#0e1220'); c.fillRect(0, 1300, W, 620);
  predios(c, 1060);
  box(c, 220, 620, 640, 640, '#46506b', 14, 10); c.beginPath(); c.moveTo(180, 640); c.lineTo(540, 360); c.lineTo(900, 640); c.closePath(); c.fillStyle = '#2b2236'; c.fill(); c.lineWidth = 10; c.strokeStyle = INK; c.lineJoin = 'round'; c.stroke();
  box(c, 440, 900, 200, 360, '#5a3a2a', 10, 9); c.beginPath(); c.arc(610, 1090, 12, 0, 7); c.fillStyle = '#d9a845'; c.fill();
  const wx = 270, wy = 760; box(c, wx - 10, wy - 10, 200, 220, '#1a2030', 8, 8); box(c, wx, wy, 180, 200, luz > 0.5 ? '#ffd88a' : '#141a2a', 6, 6);
  if (luz > 0.5) { c.fillStyle = 'rgba(255,200,110,.18)'; c.beginPath(); c.moveTo(wx, wy + 200); c.lineTo(wx - 140, 1500); c.lineTo(wx + 320, 1500); c.lineTo(wx + 180, wy + 200); c.closePath(); c.fill(); }
  box(c, 700, 760, 130, 130, '#141a2a', 6, 6); box(c, 120, 1262, 840, 24, '#2c3452', 6, 7);
  box(c, 830, 1130, 70, 130, '#8a8f9c', 8, 7); txt(c, '48', 865, 1195, 36, '#10141f');
};
const celular = (c, f, tela, gx = 70) => { box(c, gx, 140, W - 2 * gx, 1640, '#0b0f1c', 80, 14); box(c, gx + 28, 190, W - 2 * gx - 56, 1540, tela, 56, 6); box(c, 400, 168, 280, 30, '#05070d', 15, 4); };
const wrap = (c, s, x, y, w, lh, size, col) => { const ws = s.split(' '); let line = '', yy = y; for (const w_ of ws) { const t = line ? line + ' ' + w_ : w_; c.font = `bold ${size}px DejaVu Sans, sans-serif`; if (c.measureText(t).width > w && line) { txt(c, line, x, yy, size, col, 'left'); line = w_; yy += lh; } else line = t; } txt(c, line, x, yy, size, col, 'left'); };
const typed = (s, tt, cps = 22) => s.slice(0, Math.max(0, Math.floor(tt * cps)));
const waves = (c, f, x, y, on, col) => { for (let i = 0; i < 13; i++) { const h = on ? 20 + 90 * Math.abs(Math.sin(f * 0.35 + i * 0.9) * Math.sin(f * 0.13 + i * 1.7)) : 12; box(c, x - 195 + i * 30, y - h / 2, 18, h, col, 8, 4); } };
const appScene = (c, f, s, sh) => {
  const tt = s - sh.a; celular(c, f, '#111827');
  box(c, 120, 240, 840, 120, '#1f2a44', 24, 6); txt(c, 'ENTREGAS • ONLINE', 540, 300, 52, '#7dd3a8');
  const p = 1 + 0.03 * Math.sin(f * 0.25); c.save(); c.translate(540, 560); c.scale(p, p); txt(c, 'NOVO PEDIDO', 0, 0, 92, '#ffc24a', 'center', 'DejaVu Sans', 'bold', INK, 12); c.restore();
  box(c, 120, 680, 840, 600, '#1b2438', 30, 8);
  const rows = [['CLIENTE', 'Thiago', 0.9], ['ENDEREÇO', 'Rua das Acácias, 48', 1.9], ['OBSERVAÇÃO', 'Não toque a campainha.', 3.2]];
  rows.forEach(([a, b, t0], i) => { const y = 750 + i * 175; txt(c, a, 170, y, 34, '#8aa0c8', 'left'); txt(c, typed(b, tt - t0), 170, y + 70, 60, i === 0 ? '#ffffff' : '#e8eefc', 'left'); });
  const bt = back((tt - 0.4) * 2); box(c, 120, 1330, 840, 160, '#2e8b57', 40, 10); txt(c, 'ACEITAR', 540, 1410, 80, '#f3fff6');
  if (tt > 1.9) { c.beginPath(); c.arc(880, 1410, 26, 0, 7); c.fillStyle = Math.floor(f / 8) % 2 ? '#ff5a4a' : '#9a2f26'; c.fill(); }
};
const callScene = (c, f, s, sh, on, ringing) => {
  celular(c, f, '#101a2e'); const tt = s - sh.a;
  txt(c, 'CENTRAL DO APP', 540, 330, 60, '#cfe0ff'); txt(c, ringing ? 'chamando…' : '00:' + String(Math.floor(5 + tt)).padStart(2, '0'), 540, 420, 44, '#7aa2e0');
  const sh_ = ringing ? 6 * Math.sin(f * 1.6) : 0; c.save(); c.translate(540 + sh_, 800); c.beginPath(); c.arc(0, 0, 230, 0, 7); c.fillStyle = '#243253'; c.fill(); c.lineWidth = 12; c.strokeStyle = INK; c.stroke();
  c.beginPath(); c.arc(0, -50, 80, 0, 7); c.fillStyle = '#8fa4d0'; c.fill(); c.beginPath(); c.ellipse(0, 150, 140, 100, 0, Math.PI, 0); c.fill();   // silhueta
  c.lineWidth = 16; c.strokeStyle = '#ffc24a'; c.beginPath(); c.arc(0, -60, 100, Math.PI * 1.08, Math.PI * 1.92); c.stroke(); box(c, -118, -62, 36, 70, '#ffc24a', 10, 6); box(c, 82, -62, 36, 70, '#ffc24a', 10, 6); c.restore();
  waves(c, f, 540, 1130, on, '#6aa0ff');
  box(c, 340, 1300, 400, 140, '#c0392b', 60, 10); txt(c, 'ENCERRAR', 540, 1370, 54, '#fff1ee');
};
const reciboCena = (c, f, s, sh) => {
  const tt = s - sh.a; c.fillStyle = '#1a1620'; c.fillRect(0, 0, W, 1920); c.fillStyle = lin(c, 0, 1920, '#2a2230', '#14101a'); c.fillRect(0, 0, W, 1920);
  c.save(); c.translate(540, 980); c.rotate(-0.04); box(c, -340, -640, 680, 1280, '#f1ead8', 8, 9);
  txt(c, 'PEDIDO #0214', 0, -540, 66, '#1b1b24'); c.fillStyle = '#c9bfa6'; c.fillRect(-290, -480, 580, 5);
  txt(c, 'Cliente: Thiago', -290, -400, 46, '#1b1b24', 'left'); txt(c, 'Itens', -290, -310, 46, '#1b1b24', 'left');
  txt(c, '1 x o entregador', -290, -230, 52, '#7a1d18', 'left');
  c.fillStyle = '#c9bfa6'; c.fillRect(-290, -170, 580, 5); txt(c, 'Pedido:', -290, -80, 42, '#1b1b24', 'left'); txt(c, '02:14 (hoje)', 290, -80, 42, '#1b1b24', 'right');
  txt(c, 'Entrega:', -290, 40, 42, '#1b1b24', 'left');
  const st = back((tt - 3.2) * 3); if (st > 0.02) { c.save(); c.translate(0, 220); c.rotate(-0.1); c.scale(st, st); box(c, -300, -90, 600, 180, 'rgba(0,0,0,0)', 14, 12); c.strokeStyle = '#c0392b'; c.strokeRect(-300, -90, 600, 180); txt(c, 'AMANHÃ 02:41', 0, 0, 78, '#c0392b'); c.restore(); }
  c.restore();
};
const janelaCena = (c, f, s, sh, luz = 1, anda = false) => {
  const tt = s - sh.a; c.fillStyle = lin(c, 0, 1920, '#0a0e1c', '#141a2e'); c.fillRect(0, 0, W, 1920);
  box(c, 150, 330, 780, 1060, '#2a3350', 20, 12); const lit = luz > 0.5;
  box(c, 190, 370, 700, 980, lit ? '#c98a3e' : '#0c1020', 8, 8);
  if (lit) { c.fillStyle = lin(c, 370, 1350, '#f0b865', '#a8692c'); c.fillRect(194, 374, 692, 972); }
  // figura sentada, de costas, de capacete, com mochila
  c.save(); c.translate(540, 1000); const bob = 4 * Math.sin(f * 0.07); c.translate(0, bob);
  const col = lit ? '#1b1a22' : '#07090f'; c.fillStyle = col; c.lineWidth = 8; c.strokeStyle = INK; c.lineJoin = 'round';
  c.beginPath(); c.ellipse(0, 150, 190, 230, 0, 0, 7); c.fill(); c.stroke();
  box(c, -150, 20, 300, 330, lit ? '#e4572e' : '#2a1410', 40, 8); txt(c, 'ENTREGA', 0, 190, 40, lit ? '#fff4e8' : '#3a2a28');
  const ha = anda ? 0.55 * Math.sin(Math.max(0, tt - 3) * 4.5) * (tt > 3 ? 1 : 0) : 0; c.save(); c.translate(0, -140); c.rotate(ha); c.beginPath(); c.arc(0, 0, 120, 0, 7); c.fillStyle = lit ? '#1c2233' : '#0a0d16'; c.fill(); c.stroke(); box(c, -90, -10, 180, 60, lit ? '#2f3a58' : '#12182a', 24, 7); c.restore(); c.restore();
  box(c, 190, 1270, 700, 80, '#5a3a2a', 6, 8);   // mesa
  c.fillStyle = 'rgba(10,14,28,.55)'; c.fillRect(190, 370, 38, 980); c.fillRect(852, 370, 38, 980);   // cortinas
  box(c, 150, 330, 780, 1060, 'rgba(0,0,0,0)', 20, 12);
};
const contagemCena = (c, f, s, sh) => {
  const tt = s - sh.a, left = Math.max(0, 30 - tt * (30 / Math.max(sh.b - sh.a, 1))), luz = tt < (sh.b - sh.a) * 0.3 ? 1 : 0;
  janelaCena(c, f, s, sh, luz, true);
  const urg = left < 10; c.save(); c.translate(540, 1500); const p = 1 + (urg ? 0.05 : 0.02) * Math.sin(f * (urg ? 0.7 : 0.25)); c.scale(p, p); box(c, -330, -130, 660, 260, '#0b0f1c', 30, 12);
  txt(c, '00:' + String(Math.ceil(left)).padStart(2, '0'), 0, 4, 150, urg ? '#ff5a4a' : '#ffc24a', 'center', 'DejaVu Sans Mono'); c.restore();
  txt(c, 'NÃO ABRA', 540, 190, 0, '#fff', 'center');
};
const thiagoCena = (c, f, s, exprs, plain, k = 1.3, x = 560) => { rua(c, f); drawChar(c, 'thiago', { seed: 11, ...idle(f, 11), expr: talking('R', s) ? exprs[Math.floor(f / 5) % exprs.length] : plain, facing: 0, L: 'hang', R: 'hang' }, x, 1760, k); box(c, -30, 1500, W + 60, 480, '#2a3148', 10, 10); c.fillStyle = '#353d58'; c.fillRect(0, 1510, W, 14); };
const SC = {
  app: (c, f, s, sh) => appScene(c, f, s, sh),
  thiago_duvida: (c, f, s) => thiagoCena(c, f, s, ['neutral', 'whistle'], 'neutral'),
  thiago_medo: (c, f, s) => thiagoCena(c, f, s, ['nervous', 'whistle'], 'nervous', 1.4),
  thiago_choque: (c, f, s) => thiagoCena(c, f, s, ['shock', 'nervous'], 'shock', 1.5),
  thiago_pensa: (c, f, s) => thiagoCena(c, f, s, ['pained', 'nervous'], 'pained', 1.4),
  ligacao: (c, f, s, sh) => callScene(c, f, s, sh, false, true),
  suporte: (c, f, s, sh) => callScene(c, f, s, sh, talking('C', s), false),
  casa: (c, f, s, sh) => casaCena(c, f, 1),
  recibo: (c, f, s, sh) => reciboCena(c, f, s, sh),
  janela: (c, f, s, sh) => janelaCena(c, f, s, sh, 1, false),
  contagem: (c, f, s, sh) => contagemCena(c, f, s, sh),
  final: (c, f, s, sh) => {
    c.fillStyle = lin(c, 0, 1920, '#0b1220', '#16233a'); c.fillRect(0, 0, W, 1920); const tt = s - sh.a;
    const ph = sh.phrases; const t1 = (ph.find((p) => /Abrir a porta/i.test(p.text)) || ph[0]).start, t2 = (ph.find((p) => /cancelar/i.test(p.text)) || ph[1] || ph[0]).start, t3 = (ph.find((p) => /Você decide|Parte 2/i.test(p.text)) || ph[ph.length - 1]).start;
    txt(c, 'O QUE O THIAGO FAZ?', 540, 330, 68, '#ffc24a', 'center', 'DejaVu Sans', 'bold', INK, 14);
    const b1 = back((s - t1) * 3), b2 = back((s - t2) * 3), wob = Math.sin(f * 0.35);
    c.save(); c.translate(540, 760); c.scale(clamp(b1, 0, 1.1), clamp(b1, 0, 1.1)); box(c, -400, -150, 800, 300, '#2e8b57', 36, 12); txt(c, '1', -300, 0, 150, '#0f1420'); txt(c, 'ABRIR', -40, -40, 82, '#f3fff6', 'left'); txt(c, 'A PORTA', -40, 50, 82, '#f3fff6', 'left'); c.restore();
    c.save(); c.translate(540, 1140); c.scale(clamp(b2, 0, 1.1), clamp(b2, 0, 1.1)); box(c, -400, -150, 800, 300, '#c0392b', 36, 12); txt(c, '2', -300, 0, 150, '#0f1420'); txt(c, 'CANCELAR', -40, -40, 82, '#fff3f1', 'left'); txt(c, 'O PEDIDO', -40, 50, 82, '#fff3f1', 'left'); c.restore();
    if (b1 > 0.3) { c.save(); c.translate(890, 625); box(c, -42, -60, 84, 120, '#7a4a2a', 8, 7); c.beginPath(); c.arc(18, 4, 7, 0, 7); c.fillStyle = '#d9a845'; c.fill(); c.restore(); }
    if (b2 > 0.3) { c.save(); c.translate(890, 1010 + 4 * wob); c.lineWidth = 16; c.strokeStyle = INK; c.lineCap = 'round'; c.beginPath(); c.moveTo(-34, -34); c.lineTo(34, 34); c.moveTo(34, -34); c.lineTo(-34, 34); c.stroke(); c.lineWidth = 8; c.strokeStyle = '#ffd7d2'; c.beginPath(); c.moveTo(-34, -34); c.lineTo(34, 34); c.moveTo(34, -34); c.lineTo(-34, 34); c.stroke(); c.restore(); }
    const pulse = 1 + 0.025 * Math.sin(f * 0.18), b3 = back((s - t3) * 3); c.save(); c.translate(540, 1500); c.scale(clamp(b3, 0, 1.05) * pulse, clamp(b3, 0, 1.05) * pulse);
    txt(c, 'COMENTE 1 OU 2', 0, 0, 78, '#ffc24a', 'center', 'DejaVu Sans', 'bold', INK, 12); txt(c, 'A PARTE 2 SEGUE A MAIORIA', 0, 90, 44, '#b9c4dc', 'center'); c.restore();
  },
};
const CAM = {
  app: [540, 900, 1.0, 1.03], thiago_duvida: [600, 1300, 1.1, 1.22], thiago_medo: [600, 1300, 1.15, 1.35], thiago_choque: [600, 1300, 1.25, 1.55], thiago_pensa: [600, 1300, 1.15, 1.3],
  ligacao: [540, 960, 1.0, 1.1], suporte: [540, 900, 1.05, 1.18], casa: [540, 1000, 1.0, 1.3], recibo: [540, 960, 1.0, 1.15], janela: [540, 900, 1.0, 1.35], contagem: [540, 1000, 1.0, 1.12], final: [540, 960, 1.0, 1.0],
};
const MOVE = {};
const shake = (f, a) => [Math.sin(f * 1.9) * a, Math.cos(f * 2.3) * a];

const off = document.createElement('canvas'); off.width = W; off.height = H; const og = off.getContext('2d');
window.renderFrame = (f) => {
  const s = f / 30, sh = SHOTS.find((x) => s >= x.a && s < x.b) || SHOTS[SHOTS.length - 1], lt = clamp((s - sh.a) / Math.max(sh.b - sh.a, 0.01));
  og.setTransform(1, 0, 0, 1, 0, 0); og.clearRect(0, 0, W, H); SC[sh.type](og, f, s, sh, lt);
  const [cx0, cy0, z0, z1] = CAM[sh.type] || [540, 960, 1, 1.06], mv = MOVE[sh.type], k = ease(lt), z = lerp(z0, z1, k) * (1 + 0.045 * Math.pow(1 - easeOut((s - sh.a) / 0.28), 2));   // punch-in no corte (antecipação/assentamento)
  const imp = (sh.id === 't4' || sh.id === 'n7') && (s - sh.a) < 0.1;   // quadros de impacto
  const cx = mv ? lerp(cx0, mv[0], k) : cx0, cy = mv ? lerp(cy0, mv[1], k) : cy0, [sx, sy] = shake(f, sh.type.startsWith('thiago') ? 3 : 1.2);
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
