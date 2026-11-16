FACE.snore = { eye: ["dash", "dash"], brow: [0, -1], mouth: "o" };
FACE.stubborn = { eye: ["lid", "lid"], brow: [4, -3], mouth: "frown" };
FACE.squint = { eye: ["slit", "slit"], brow: [3, -2], mouth: "dash" };
FACE.angry = { eye: ["dot", "dot"], brow: [7, -5], mouth: "teeth" };
FACE.greedy = { eye: ["slit", "slit"], brow: [-2, 2], mouth: "smirk" };
FACE.bliss = { eye: ["happy", "happy"], brow: [-3, 2], mouth: "o" };

// ---------------- Roman-era cast (our own designs), built on the Pen / blob / face helpers above ----------------
const STEEL = "#aeb6bf", BRASS = "#d9a845", LEATHER = "#7a4a2a";
export const OUTFITS = {
  legion: { tunic: "#b8322f", cape: "#8f2228", skin: SKIN, helmet: true, armor: true, spear: true, shield: true },
  old: { tunic: "#9c4a3c", cape: "#6e3330", skin: "#f3d6bb", helmet: "old", armor: true, spear: true, shield: false, beard: "#f4f1ea", brows: "#f4f1ea" },
  toga: { tunic: "#f1ead8", skin: "#f5c9a0", toga: "#6b3c8f", hair: "#3b2a20", stout: true },
  civA: { tunic: "#4f7fb8", skin: "#f5c9a0", hair: "#5a3b2a" },
  civB: { tunic: "#d9a441", skin: SKIN, hair: "#2b211c", dress: "#c25a7a" },
  civC: { tunic: "#5d8a3a", skin: "#c99067", hair: "#1e1714", stout: true },
  workA: { tunic: "#8a5d3b", skin: "#f5c9a0", cap: "#c2733a", apron: "#d8c9a6" },
  workB: { tunic: "#3f6a6f", skin: "#ecd0b6", cap: "#5b4a8a", moustache: "#4a3020" },
  pobre: { tunic: "#8a6a48", skin: "#eab58e", hair: "#4a3424", moustache: "#4a3424", patches: true },
  padeiro: { tunic: "#e2cfae", skin: "#f2bf96", cap: "#fbf8f2", apron: "#ffffff", stout: true, moustache: "#3a2414" },
  juiz: { tunic: "#30304a", toga: "#a5263a", skin: "#f3d6bb", beard: "#eeeae2", cap: "#23233a", stout: true },
  velha: { tunic: "#7d5a8c", skin: "#f1cfb1", hair: "#d9d4cc", dress: "#6f8f5a" },
  civD: { tunic: "#c9663a", skin: "#a8714d", hair: "#1e1714" },
  teen: { tunic: "#3f4f78", skin: "#e8b48c", hair: "#2a1c16" },
  mae: { tunic: "#e6c27c", skin: "#f1c9a5", hair: "#3a2418", dress: "#a45a8c" },
};
/** hand props drawn on the card at the hand point (hx,hy). u = head units. */
const PROP = {
  bread: (p, hx, hy, u, o) => { const g = p.g; g.save(); g.translate(hx, hy - 4 * u); g.rotate(-0.35);
    p.ell(0, 0, 30 * u, 13 * u, "#c98a3e", 3.2 * u); if (o.bite) p.ell(-27 * u, -4 * u, 9 * u, 9 * u, "#f3e3c2", 0);
    for (const d of [-14, 0, 14]) p.stroke([[d * u - 5 * u, -8 * u], [d * u + 5 * u, 6 * u]], 2.4 * u, "#8a5222"); g.restore(); },
  purse: (p, hx, hy, u, o) => { const g = p.g, dx = (o.holdDx || 0) * u, dy = (o.holdDy || 0) * u; g.save(); g.translate(hx + dx, hy + 14 * u + dy); g.rotate((o.holdRot || 0));
    const sack = [[-15 * u, -10 * u], [15 * u, -10 * u], [21 * u, 8 * u], [15 * u, 22 * u], [-15 * u, 22 * u], [-21 * u, 8 * u]];
    p.poly(sack, "#8a5a2e", 3 * u); p.stroke([[-9 * u, -10 * u], [-13 * u, -20 * u]], 3 * u); p.stroke([[9 * u, -10 * u], [13 * u, -20 * u]], 3 * u);
    p.band([[-15 * u, -9 * u], [15 * u, -9 * u]], "#d9a845", 4 * u, 1.4 * u, "round");
    p.ell(-4 * u, -14 * u, 6 * u, 3.5 * u, "#f2c84b", 1.6 * u); p.ell(5 * u, -15 * u, 6 * u, 3.5 * u, "#f2c84b", 1.6 * u); g.restore(); },
};

/** galea: iron bowl, brass brow band, cheek guards, transverse red crest */
const galea = (p, H, cx, hc, light, thick, ow, old, u) => {
  const crest = old ? "#8d4b3f" : "#d2372f", bowl = old ? "#8f8a7e" : STEEL;
  // crest (behind the bowl top)
  const cy0 = hc - H.b * 0.98;
  const cr = ellPts(cx, cy0, 0.66 * 2 * H.a, 0.42 * 2 * H.b, 180, 360, 0, 40);
  cr.push([cx + 0.66 * 2 * H.a * 0.98, cy0 + 4 * u], [cx - 0.66 * 2 * H.a * 0.98, cy0 + 4 * u]);
  const crP = [...ellPts(cx, cy0 + 2 * u, 0.62 * 2 * H.a, 0.36 * 2 * H.b, 180, 360, 0, 40)];
  p.shadedFill(crP, crest, mul(crest, [0.7, 0.62, 0.7]), light, 0.62 * 2 * H.a, 0.3);
  p.clip(crP, () => { for (let i = -9; i <= 9; i++) p.stroke([[cx + i * 7.4 * u, cy0], [cx + i * 9.4 * u, cy0 - 0.62 * H.b * Math.cos(i / 11)]], 1.4 * u, mul(crest, [0.62, 0.55, 0.62])); });
  if (old) p.clip(crP, () => { for (let i = 0; i < 6; i++) p.ell(cx + (i - 3) * 22 * u, cy0 - 18 * u - (i % 2) * 10 * u, 9 * u, 5 * u, "#6f6a5e", 0); });
  p.inkRing(crP, ow * 0.85, thick);
  p.poly(rrect(cx - 10 * u, cy0 - 6 * u, cx + 10 * u, cy0 + 6 * u, 3 * u), BRASS, 2 * u);
  // bowl: upper head cap
  const bandY = hc - H.b * 0.42;
  const bp = ellPts(cx, bandY, H.a * 1.05, H.b * 0.66, 180, 360, 0, 48);
  p.shadedFill(bp, bowl, mul(bowl, [0.62, 0.64, 0.72]), light, H.a, 0.4);
  p.clip(bp, () => {
    p.stroke(ellPts(cx - 20 * u, bandY - 0.3 * H.b, 0.25 * H.a, 0.18 * H.b, 200, 300, 0, 16), 4 * u, "#ffffff55");
    if (old) for (let i = 0; i < 9; i++) p.ell(cx + Math.sin(i * 2.3) * 0.8 * H.a, bandY - (0.08 + 0.5 * ((i * 0.37) % 1)) * H.b, (3 + (i % 3) * 2) * u, (2 + (i % 2)) * u, "#8a4b22", 0);
  });
  p.inkRing(bp, ow * 0.9, thick);
  p.band([[cx - H.a * 1.04, bandY], [cx + H.a * 1.04, bandY]], old ? "#a88a4a" : BRASS, 7 * u, 1.8 * u, "round");
  for (const s of [-1, 1]) p.dot(cx + s * 0.55 * H.a, bandY, 2.2 * u, "#fff3c4");
};
const cheeks = (p, H, cx, hc, light, ow, old, u) => {
  const bowl = old ? "#8f8a7e" : STEEL;
  for (const s of [-1, 1]) {
    const x0 = cx + s * 0.78 * H.a, x1 = cx + s * 1.07 * H.a, y0 = hc - H.b * 0.42, y1 = hc + H.b * 0.48;
    const pts = [[x0, y0], [x1, y0], [x1 - s * 0.04 * H.a, y1 - 0.1 * H.b], [x0 + s * 0.06 * H.a, y1], [x0 - s * 0.05 * H.a, (y0 + y1) / 2]];
    p.shadedFill(pts, bowl, mul(bowl, [0.62, 0.64, 0.72]), light, 0.2 * H.a, 0.3);
    p.poly(pts, null, ow * 0.8);
    p.dot((x0 + x1) / 2, (y0 + y1) / 2 - 0.05 * H.b, 2.2 * u, BRASS);
  }
};
const cobweb = (p, cx, cy, r, u) => {
  const g = p.g; g.save(); g.globalAlpha = 0.8;
  for (let i = 0; i < 7; i++) { const a = -Math.PI * (0.05 + 0.9 * i / 6); p.stroke([[cx, cy], [cx + Math.cos(a) * r, cy + Math.sin(a) * r]], 1.1 * u, "#f2f2f2"); }
  for (let k = 1; k <= 4; k++) { const rr = r * k / 4.3, pts = []; for (let i = 0; i < 7; i++) { const a = -Math.PI * (0.05 + 0.9 * i / 6); pts.push([cx + Math.cos(a) * rr, cy + Math.sin(a) * rr]); } p.stroke(pts, 1 * u, "#f2f2f2"); }
  g.restore();
};

/** front-facing Roman-era character. opts: expr, blink, look, facing, seed, L/R arm poses, tilt, headTilt, bob, nohelmet, light */
export const romanFront = (p, key, opts = {}) => {
  const O = typeof key === "string" ? OUTFITS[key] : key;
  const { expr = "neutral", blink = 0, look = 0, facing = 0, seed = 3, L = "hang", R = O.spear ? "spear" : "hang", tilt = 0, headTilt = 0,
    bob = 0, nohelmet = false, light = rad(-120), web = false, step = 0 } = opts;
  const lid = lidOf(blink), skin = O.skin ?? SKIN;
  const H = headBlob(seed, 118, facing), W = 2 * H.a, HH = 2 * H.b, u = W / 100;
  const torsoL = O.stout ? 1.12 : 1.08, legsL = 1.38, sole = 975;
  const torsoBot = sole - legsL * HH - bob * HH, chin = torsoBot - torsoL * HH, hc = chin - H.b, hipY = torsoBot - 0.12 * HH;
  const thick = thickAngle(light), ow = 5 * u, cx = 300;
  const legCol = mix(O.tunic, INK, 0.62), armCol = mix(O.tunic, INK, 0.5);
  const helmet = !!O.helmet && !nohelmet, old = O.helmet === "old";
  p.rot = null;
  // ---- cape behind everything ----
  if (O.cape) {
    const cp = [[cx - 0.48 * W, chin + 0.08 * HH], [cx + 0.48 * W, chin + 0.08 * HH], [cx + 0.62 * W, sole - 0.55 * HH], [cx + 0.2 * W, sole - 0.45 * HH], [cx - 0.2 * W, sole - 0.5 * HH], [cx - 0.62 * W, sole - 0.55 * HH]];
    p.gradFill(cp, O.cape, mul(O.cape, [0.6, 0.6, 0.7]), light); p.inkRing(cp, ow * 0.8, thick);
  }
  // ---- legs ----
  const dress = !!O.dress;
  for (const side of [-1, 1]) {
    const up = Math.max(0, Math.sin(Math.PI * 2 * (step + (side > 0 ? 0.5 : 0)))) * 30 * (step ? 1 : 0);
    const hx = cx + side * 16 * u, fx = cx + side * 22 * u, fy = sole - 4 * u - up;
    p.stroke(curve([hx, hipY], [(hx + fx) / 2 + side * 2 * u, (hipY + fy) / 2], [fx, fy]), 5.8 * u, legCol);
    const sandal = O.helmet ? LEATHER : "#5a3b2a";
    p.stroke([[fx - side * 3 * u, fy], [fx + side * 13 * u, fy + 0.5 * u]], 7.5 * u + 3, INK);
    p.stroke([[fx - side * 3 * u, fy], [fx + side * 13 * u, fy + 0.5 * u]], 7.5 * u, sandal);
    if (O.helmet) for (let k = 1; k <= 3; k++) p.stroke([[fx - 4 * u, fy - k * 0.07 * HH], [fx + 4 * u, fy - k * 0.07 * HH - 2 * u]], 2 * u, LEATHER);
  }
  // ---- upper body ----
  p.rot = tilt ? [rad(tilt), cx, hipY] : null;
  const T = { a: (0.4 * W) / 1.06 * (O.stout ? 1.12 : 1), b: 0.5 * (torsoBot - (chin - 0.25 * HH)), nTop: 2.2, nBot: 2.6, egg: O.stout ? 0.17 : 0.12, asym: 0.04 * facing, rot: 0, noise: 0.006, seed: seed + 7 };
  const tcx = cx + 3 * u * facing, tcy = torsoBot - T.b, tp = blobPts(tcx, tcy, T);
  const S = (side) => [tcx + side * 0.85 * T.a, chin + 0.12 * HH];
  const arm = (side, pose) => {
    const s = S(side), X = (k) => tcx + side * (T.a * 1.1 + k * u);
    switch (pose) {
      case "spear": return { pts: [s, [X(6), s[1] + 0.42 * HH], [X(10), s[1] + 0.2 * HH]], front: false };
      case "point": return { pts: [s, [X(28), s[1] - 0.02 * HH], [X(62), s[1] - 0.1 * HH]], front: false, finger: true };
      case "up": return { pts: [s, [X(14), s[1] - 0.3 * HH], [X(22), s[1] - 0.75 * HH]], front: false };
      case "wave": return { pts: [s, [X(16), s[1] - 0.2 * HH], [X(30 + 10 * Math.sin(opts.wv || 0)), s[1] - 0.62 * HH]], front: false };
      case "hip": return { pts: [s, [X(22), s[1] + 0.3 * HH], [tcx + side * T.a * 0.95, torsoBot - 0.3 * HH]], front: false };
      case "belly": return { pts: [s, [X(8), s[1] + 0.45 * HH], [tcx + side * 0.25 * T.a, torsoBot - 0.35 * HH]], front: true };
      case "temple": return { pts: [s, [X(26), s[1] + 0.05 * HH], [cx + side * (H.a + 16 * u), hc - 0.1 * HH]], front: false, swirl: true };
      case "lift": return { pts: [s, [X(20), s[1] - 0.25 * HH], [X(4), s[1] - 0.82 * HH]], front: false };
      case "shield": return { pts: [s, [X(4), s[1] + 0.4 * HH], [tcx + side * 0.6 * T.a, torsoBot - 0.1 * HH]], front: true };
      case "cross": return { pts: [s, [X(2), s[1] + 0.38 * HH], [tcx - side * 0.45 * T.a, s[1] + 0.32 * HH]], front: true };
      case "reach": { const lf = (opts.lift || 0) * 0.62 * HH; return { pts: [s, [X(42), s[1] - 0.12 * HH - lf * 0.6], [X(82), s[1] - 0.5 * HH - lf]], front: false }; }
      case "cheek": return { pts: [s, [X(16), s[1] + 0.05 * HH], [cx + side * (H.a + 2 * u), hc + 0.25 * H.b]], front: false };
      case "thumb": return { pts: [s, [X(20), s[1] + 0.12 * HH], [X(44), s[1] - 0.12 * HH]], front: false, thumb: true };
      default: return { pts: [s, [X(4), s[1] + 0.48 * HH], [X(3), chin + 1.04 * HH]], front: false };
    }
  };
  const arms = [arm(-1, L), arm(1, R)];
  const drawArm = (a) => {
    p.stroke(curve(a.pts[0], a.pts[1], a.pts[2]), 5.2 * u, armCol);
    const [hx, hy] = a.pts[2];
    p.dot(hx, hy, 5.5 * u);
    if (a.finger) { const dx = a.pts[2][0] - a.pts[1][0], dy = a.pts[2][1] - a.pts[1][1], l = Math.hypot(dx, dy); p.stroke([[hx, hy], [hx + dx / l * 14 * u, hy + dy / l * 14 * u]], 2.6 * u); }
    if (a.thumb) p.stroke([[hx, hy], [hx + Math.sign(hx - cx) * 6 * u, hy - 12 * u]], 2.6 * u);
    if (opts.holdL && a === arms[0]) PROP[opts.holdL](p, hx, hy, u, opts);
    if (opts.holdR && a === arms[1]) PROP[opts.holdR](p, hx, hy, u, opts);
  };
  // spear behind
  if (O.spear && R === "spear") {
    const [hx, hy] = arms[1].pts[2], s0 = [hx + 2 * u, sole - 2 * u], s1 = [hx - 3 * u, 70];
    p.band([s0, s1], old ? "#6d5236" : "#8a5a34", 4.2 * u, 1.4 * u, "round");
    const tip = [[s1[0] - 7 * u, s1[1] + 6 * u], [s1[0], s1[1] - 34 * u], [s1[0] + 7 * u, s1[1] + 6 * u], [s1[0], s1[1] + 14 * u]];
    p.poly(tip, old ? "#8b7c6a" : "#c9cfd6", 2 * u);
    if (web) cobweb(p, s1[0] - 2 * u, s1[1] + 60 * u, 70 * u, u);
  }
  for (const a of arms) if (!a.front) drawArm(a);
  // torso
  if (dress) {
    const D = { a: 0.5 * W * 0.98, b: 0.5 * ((sole - 0.35 * HH) - (chin - 0.2 * HH)), nTop: 2.0, nBot: 3.0, egg: 0.35, asym: 0, rot: 0, noise: 0.006, seed: seed + 9 };
    const dp = blobPts(cx, sole - 0.35 * HH - D.b, D);
    p.gradFill(dp, O.dress, mul(O.dress, SH_CLOTH), light); p.inkRing(dp, ow, thick);
  }
  // skirt / pteruges below the torso
  if (!dress) {
    const sk = [[tcx - 0.92 * T.a, torsoBot - 0.2 * HH], [tcx + 0.92 * T.a, torsoBot - 0.2 * HH], [tcx + 1.0 * T.a, torsoBot + 0.3 * HH], [tcx - 1.0 * T.a, torsoBot + 0.3 * HH]];
    p.gradFill(sk, O.tunic, mul(O.tunic, SH_CLOTH), light); p.poly(sk, null, ow * 0.8);
    if (O.armor) for (let i = -3; i <= 3; i++) { const x = tcx + i * 0.27 * T.a, st = [[x - 9 * u, torsoBot - 0.05 * HH], [x + 9 * u, torsoBot - 0.05 * HH], [x + 9 * u, torsoBot + 0.22 * HH], [x - 9 * u, torsoBot + 0.22 * HH]]; p.poly(st, old ? "#5e4632" : LEATHER, 1.6 * u); }
  }
  p.gradFill(tp, O.tunic, mul(O.tunic, SH_CLOTH), light);
  p.clip(tp, () => {
    if (O.armor) {
      const top = chin - 0.1 * HH, bot = torsoBot - 0.25 * HH, n = 5;
      for (let i = 0; i < n; i++) {
        const y0 = top + (bot - top) * i / n, y1 = top + (bot - top) * (i + 1) / n;
        const c = old ? (i % 2 ? "#8d8679" : "#9a9384") : (i % 2 ? "#a7b0ba" : "#bcc4cc");
        p.poly([[tcx - 1.5 * T.a, y0], [tcx + 1.5 * T.a, y0 + 3 * u], [tcx + 1.5 * T.a, y1 + 3 * u], [tcx - 1.5 * T.a, y1]], c, 1.8 * u);
      }
      p.band([[tcx - 1.4 * T.a, torsoBot - 0.2 * HH], [tcx + 1.4 * T.a, torsoBot - 0.2 * HH]], LEATHER, 0.08 * HH, 1.5 * u);
      for (let i = -2; i <= 2; i++) p.dot(tcx + i * 0.3 * T.a, torsoBot - 0.2 * HH, 2.4 * u, BRASS);
      if (old) for (let i = 0; i < 5; i++) p.ell(tcx + Math.sin(i * 1.7) * 0.7 * T.a, top + (bot - top) * ((i * 0.31) % 1), 6 * u, 3 * u, "#8a4b22", 0);
    } else {
      p.band([[tcx - 1.4 * T.a, torsoBot - 0.24 * HH], [tcx + 1.4 * T.a, torsoBot - 0.24 * HH]], O.apron ? "#5a3b2a" : "#e2c27a", 0.05 * HH, 1.2 * u);
      if (O.toga) p.band([[tcx - 1.0 * T.a, chin - 0.1 * HH], [tcx + 1.1 * T.a, torsoBot - 0.1 * HH]], O.toga, 0.16 * HH, 1.6 * u);
      if (O.apron) p.poly([[tcx - 0.55 * T.a, torsoBot - 0.2 * HH], [tcx + 0.55 * T.a, torsoBot - 0.2 * HH], [tcx + 0.6 * T.a, torsoBot + 0.2 * HH], [tcx - 0.6 * T.a, torsoBot + 0.2 * HH]], O.apron, 1.6 * u);
      p.stroke([[tcx - 0.2 * T.a, chin + 0.02 * HH], [tcx, chin + 0.16 * HH], [tcx + 0.2 * T.a, chin + 0.02 * HH]], 2 * u);
      if (O.patches) { p.poly(rrect(tcx - 0.62 * T.a, chin + 0.3 * HH, tcx - 0.22 * T.a, chin + 0.62 * HH, 2 * u), "#a8865c", 1.6 * u);
        p.poly(rrect(tcx + 0.25 * T.a, chin + 0.62 * HH, tcx + 0.62 * T.a, chin + 0.88 * HH, 2 * u), "#6d5236", 1.6 * u);
        for (let i = 0; i < 4; i++) p.stroke([[tcx - 0.6 * T.a + i * 0.12 * T.a, chin + 0.28 * HH], [tcx - 0.6 * T.a + i * 0.12 * T.a, chin + 0.33 * HH]], 1.2 * u); }
    }
  });
  p.inkRing(tp, ow, thick);
  if (O.armor) for (const s of [-1, 1]) { // shoulder plates
    const sp = ellPts(tcx + s * 0.72 * T.a, chin + 0.1 * HH, 0.42 * T.a, 0.13 * HH, 180, 360, s * 8, 20);
    p.poly(sp, old ? "#9a9384" : "#c5ccd3", 1.8 * u);
  }
  if (O.moss) {/* reserved */}
  for (const a of arms) if (a.front) drawArm(a);
  // shield in front, held by the left hand
  if (O.shield && L === "shield") {
    const sx = tcx - 0.55 * T.a, sy = torsoBot + 0.05 * HH, sw = 0.36 * W, sh = 0.78 * HH;
    const sp = rrect(sx - sw, sy - sh, sx + sw, sy + sh, 8 * u);
    p.gradFill(sp, "#c0302c", "#7d1d22", light);
    p.clip(sp, () => {
      p.band([[sx - sw, sy], [sx + sw, sy]], BRASS, 6 * u, 1.2 * u);
      p.band([[sx, sy - sh], [sx, sy + sh]], BRASS, 6 * u, 1.2 * u);
      for (const s of [-1, 1]) { p.stroke([[sx + s * 12 * u, sy - 14 * u], [sx + s * 34 * u, sy - 46 * u], [sx + s * 22 * u, sy - 44 * u], [sx + s * 46 * u, sy - 74 * u]], 3.5 * u, BRASS); p.stroke([[sx + s * 12 * u, sy + 14 * u], [sx + s * 34 * u, sy + 46 * u], [sx + s * 22 * u, sy + 44 * u], [sx + s * 46 * u, sy + 74 * u]], 3.5 * u, BRASS); }
      p.stroke(ellPts(sx - sw * 0.5, sy - sh * 0.7, sw * 0.3, sh * 0.1, 200, 320, 0, 10), 3 * u, "#ffffff44");
    });
    p.ell(sx, sy, 13 * u, 13 * u, "#e6c068", 2.2 * u);
    p.inkRing(sp, ow, thick);
  }
  // ---- head ----
  const [cpx, cpy] = rotAbout([cx, chin], rad(tilt), [cx, hipY]);
  const Ah = tilt + headTilt;
  p.rot = Ah ? [rad(Ah), cx, chin, cpx - cx, cpy - chin] : null;
  if (helmet) galea(p, H, cx, hc, light, thick, ow, old, u);
  const hp = blobPts(cx, hc, H);
  if (O.hair && !helmet) { const hb = blobPts(cx, hc - 0.03 * HH, { ...H, a: H.a * 1.04, b: H.b * 1.05 }); p.poly(hb, O.hair, 0); }
  p.shadedFill(hp, skin, mul(skin, SH_SKIN), light, H.a);
  p.inkRing(hp, ow, thick);
  if (helmet) {
    const bandY = hc - H.b * 0.42, bp = ellPts(cx, bandY, H.a * 1.05, H.b * 0.66, 180, 360, 0, 48);
    p.shadedFill(bp, old ? "#8f8a7e" : STEEL, mul(old ? "#8f8a7e" : STEEL, [0.62, 0.64, 0.72]), light, H.a, 0.4);
    p.clip(bp, () => { p.stroke(ellPts(cx - 20 * u, bandY - 0.3 * H.b, 0.25 * H.a, 0.18 * H.b, 200, 300, 0, 16), 5 * u, "#ffffff66");
      if (old) for (let i = 0; i < 9; i++) p.ell(cx + Math.sin(i * 2.3) * 0.8 * H.a, bandY - (0.08 + 0.5 * ((i * 0.37) % 1)) * H.b, (4 + (i % 3) * 2) * u, (2.5 + (i % 2)) * u, "#8a4b22", 0); });
    p.poly(bp, null, ow * 0.9);
    p.band([[cx - H.a * 1.05, bandY], [cx + H.a * 1.05, bandY]], old ? "#a88a4a" : BRASS, 7 * u, 1.8 * u, "round");
    p.poly(rrect(cx - 4 * u, bandY - 0.55 * H.b, cx + 4 * u, bandY - 3 * u, 2 * u), old ? "#a88a4a" : BRASS, 1.5 * u);
    cheeks(p, H, cx, hc, light, ow, old, u);
  } else if (O.cap) hatOn(p, { hat: "cap", cap: O.cap, jacket: O.tunic }, hp, H, cx, hc, light, seed, facing, false);
  else if (O.hair) hatOn(p, { hat: "hair", hair: O.hair, jacket: O.tunic }, hp, H, cx, hc, light, seed, facing, false);
  else if (O.helmet && nohelmet) { // bald old head with white side tufts
    for (const s of [-1, 1]) p.ell(cx + s * 0.9 * H.a, hc - 0.1 * H.b, 0.22 * H.a, 0.3 * H.b, "#f4f1ea", 3 * u);
  }
  if (O.beard) {
    const bd = blobPts(cx + 6 * u * facing, hc + 0.85 * H.b, { a: 0.62 * H.a, b: 0.75 * H.b, nTop: 2.4, nBot: 1.6, egg: -0.35, asym: 0, rot: 0, noise: 0.02, seed: seed + 4 });
    p.shadedFill(bd, O.beard, mul(O.beard, [0.86, 0.86, 0.92]), light, 0.6 * H.a, 0.3);
    p.clip(bd, () => { for (let i = -3; i <= 3; i++) p.stroke([[cx + i * 9 * u, hc + 0.45 * H.b], [cx + i * 7 * u, hc + 1.35 * H.b]], 1.2 * u, "#c9c4bb"); });
    p.inkRing(bd, ow * 0.8, thick);
  }
  faceFront(p, cx, hc, W, expr, facing, look, lid, helmet, skin, O.beard ? O.beard : O.moustache, !!O.stout);
  if (O.brows) for (const s of [-1, 1]) p.ell(cx + 7 * u * facing + s * 14 * u, hc - 20 * u, 11 * u, 5 * u, O.brows, 2 * u);
  if (O.beard) { // re-draw the mouth over the beard for open mouths
    if (expr === "shock" || expr === "snore") p.ell(cx + 8 * u * facing, hc + 22 * u, 6 * u, 7 * u, "#5a1e28", 2 * u);
  }
  p.rot = null;
  if (arms.some((a) => a.swirl)) { // cuckoo swirl next to the temple
    const a = arms.find((x) => x.swirl), [hx, hy] = a.pts[2], ph = opts.swirl || 0, pts = [];
    for (let i = 0; i < 40; i++) { const t = i / 40 * Math.PI * 4 + ph, r = (4 + i * 0.7) * u; pts.push([hx + Math.cos(t) * r, hy - 40 * u + Math.sin(t) * r]); }
    p.stroke(pts, 3 * u, "#ffffff"); p.stroke(pts, 1.4 * u, INK);
  }
};

/** loose helmet prop card (lifted off the old soldier) */
export const helmetCard = (p) => {
  const H = headBlob(3, 118, 0), u = 2 * H.a / 100, hc = 560, light = rad(-120), thick = thickAngle(light), ow = 5 * u;
  galea(p, H, 300, hc, light, thick, ow, true, u);
  const bandY = hc - H.b * 0.42, bp = ellPts(300, bandY, H.a * 1.05, H.b * 0.66, 180, 360, 0, 48);
  // dark inside visible from below
  p.ell(300, bandY, H.a * 1.05, 0.12 * H.b, "#2a221e", 0);
  p.shadedFill(bp, "#8f8a7e", mul("#8f8a7e", [0.62, 0.64, 0.72]), light, H.a, 0.4);
  p.clip(bp, () => { for (let i = 0; i < 9; i++) p.ell(300 + Math.sin(i * 2.3) * 0.8 * H.a, bandY - (0.08 + 0.5 * ((i * 0.37) % 1)) * H.b, (4 + (i % 3) * 2) * u, (2.5 + (i % 2)) * u, "#8a4b22", 0); });
  p.poly(bp, null, ow * 0.9);
  p.band([[300 - H.a * 1.05, bandY], [300 + H.a * 1.05, bandY]], "#a88a4a", 7 * u, 1.8 * u, "round");
  cheeks(p, H, 300, hc, light, ow, true, u);
};

/** ZZZ for the sleeping guard */
export const fxZ = (p, t) => {
  const g = p.g; g.save(); g.font = "900 120px Arial Black, Arial"; g.lineJoin = "round";
  for (let i = 0; i < 3; i++) {
    const k = (t + i / 3) % 1, x = 220 + i * 70 + Math.sin(k * 6) * 20, y = 700 - k * 500, s = 0.5 + k * 0.7;
    g.save(); g.translate(x, y); g.scale(s, s); g.globalAlpha = Math.min(1, (1 - k) * 2.5);
    g.lineWidth = 16; g.strokeStyle = INK; g.strokeText("Z", 0, 0); g.fillStyle = "#ffffff"; g.fillText("Z", 0, 0); g.restore();
  }
  g.restore();
};
/** falling leaf */
export const fxLeaf = (p, col) => { p.poly([[300, 380], [420, 470], [300, 620], [180, 470]], col, 14); p.stroke([[300, 400], [300, 600]], 8); };
/** dust cloud puff (k 0..1 growth) */
export const fxDust = (p, k, col = "#e8dcc4") => {
  const g = p.g; g.save(); g.globalAlpha = Math.max(0, 1 - k * k);
  for (let i = 0; i < 7; i++) { const a = i / 7 * Math.PI * 2, r = 90 + 150 * k; p.ell(300 + Math.cos(a) * r, 520 + Math.sin(a) * r * 0.6, 120 + 60 * k, 100 + 50 * k, col, 12); }
  p.ell(300, 520, 170 + 110 * k, 140 + 80 * k, col, 0);
  g.restore();
};
export const fxDrip = (p) => p.ell(300, 500, 40, 64, "#9fd4ff", 10);
export const fxWood = (p, seed) => { p.poly([[200, 420], [400, 400], [420, 560], [230, 600]], "#5b3d22", 14); p.stroke([[240, 450], [380, 440]], 6, "#3a2614"); p.ell(330, 520, 26, 18, "#4d7a32", 0); };

export const headCenter = (seed = 3) => { const H = headBlob(seed, 118, 0), HH = 2 * H.b; return 975 - 1.38 * HH - 1.08 * HH - H.b; };

// ================= POV hands + phone UI (first-person view) =================
const SLEEVE = "#3e4a6e", SKINP = "#eab58e";
const arm = (p, pts, w = 74) => { p.line(pts, SLEEVE, w); const e = pts[pts.length - 1], q0 = pts[pts.length - 2], dx = e[0] - q0[0], dy = e[1] - q0[1], l = Math.hypot(dx, dy) || 1; p.line([[e[0] - dx / l * 22, e[1] - dy / l * 22], [e[0] - dx / l * 8, e[1] - dy / l * 8]], "#6b7aa6", w * 0.92); };
const hand = (p, x, y, rx = 40, ry = 32, rot = 0, flip = 1) => {
  const g = p.g; g.save(); g.translate(x, y); g.rotate(rot); g.scale(flip, 1);
  const k = rx / 40;
  for (const [dx, dy, l] of [[-24, -34, 30], [-8, -44, 36], [10, -44, 34], [26, -33, 27]]) p.ell(dx * k, dy * k, 11 * k, l * k, SKINP, 6 * k);
  p.ell(-38 * k, -2 * k, 11 * k, 25 * k, SKINP, 6 * k, 0, 360, 0.7);
  p.ell(0, 0, 37 * k, 34 * k, SKINP, 7 * k);
  for (const dx of [-16, 0, 16]) p.stroke([[dx * k, -10 * k], [dx * k + 2, -30 * k]], 3 * k, "#b9835f");
  g.restore();
};
const fist = (p, x, y, k = 1, rot = 0, flip = 1) => {
  const g = p.g; g.save(); g.translate(x, y); g.rotate(rot); g.scale(flip, 1);
  p.ell(0, 0, 38 * k, 30 * k, SKINP, 7 * k);
  for (let i = 0; i < 4; i++) p.ell((-27 + i * 18) * k, -20 * k, 11 * k, 13 * k, SKINP, 5 * k);
  for (let i = 0; i < 3; i++) p.stroke([[(-18 + i * 18) * k, -10 * k], [(-18 + i * 18) * k, 6 * k]], 3 * k, "#b9835f");
  p.ell(-34 * k, 8 * k, 17 * k, 10 * k, SKINP, 5 * k, 0, 360, -0.5);
  g.restore();
};
export const povHands = (p, o = {}) => {
  const pose = o.pose || "idle", sw = o.sway || 0;
  const L = (pts) => arm(p, pts.map(([x, y]) => [x + sw, y]));
  if (pose === "stir") {
    // pot (bottom centre-left) with noodles + steam handled outside; right hand stirs a fork
    p.poly(rrect(70, 800, 400, 1010, 18), "#8d939b", 9);
    p.ell(235, 800, 165, 42, "#4d535c", 8); p.ell(235, 804, 140, 30, "#f0cf6a", 4);
    for (let i = 0; i < 6; i++) p.stroke([[130 + i * 36, 800 + (i % 2) * 6], [150 + i * 36, 806 - (i % 2) * 7], [170 + i * 36, 800]], 5, "#d9b04a");
    const a = (o.w || 0), fx = 330 + 40 * Math.cos(a), fy = 770 + 14 * Math.sin(a);
    L([[40, 1030], [90, 930], [140, 880]]);
    arm(p, [[560, 1040], [470, 900], [fx + 20, fy - 30]], 78);
    p.line([[fx, fy - 20], [fx - 70, fy + 20]], "#c9ced6", 12); hand(p, fx + 18, fy - 34, 42, 36, -0.4);
  } else if (pose === "lock") {
    L([[40, 1030], [100, 930], [150, 880]]);
    arm(p, [[560, 1040], [470, 880], [350, 740]], 78);
    const r = o.rot || 0; p.g.save(); p.g.translate(318, 705); p.g.rotate(r);
    p.line([[0, 0], [-40, 6]], "#d1a23c", 12); p.ell(-52, 8, 14, 14, "#d1a23c", 6); p.g.restore();
    hand(p, 352, 722, 44, 36, -0.5);
  } else if (pose === "grip") {
    arm(p, [[40, 1050], [140, 990], [235, 945]], 80); arm(p, [[560, 1050], [460, 990], [365, 945]], 80);
    fist(p, 246, 938, 1.1, 0.25); fist(p, 354, 938, 1.1, -0.25, -1);
  } else {
    L([[40, 1050], [100, 990], [160, 940]]); arm(p, [[560, 1050], [500, 990], [440, 940]].map(([x, y]) => [x - sw, y]));
    fist(p, 170 + sw, 930, 1.05, 0.3); fist(p, 430 - sw, 930, 1.05, -0.3, -1);
  }
};
const wrap = (g, text, maxW) => { const out = []; let line = ""; for (const w of text.split(" ")) { const t = line ? line + " " + w : w; if (g.measureText(t).width > maxW && line) { out.push(line); line = w; } else line = t; } if (line) out.push(line); return out; };
/** chat on a phone held in both hands. S: {title, msgs:[{who,text,mine,col}], banner:{who,text,k}, typing:""} */
export const phoneUI = (p, S) => {
  const g = p.g;
  p.poly(rrect(60, 70, 540, 985, 46), "#1a1b22", 10);
  p.poly(rrect(78, 96, 522, 958, 30), "#303548", 0);
  g.fillStyle = "#454b63"; g.fillRect(78, 96, 444, 96);
  g.fillStyle = "#c8cbd6"; g.font = "bold 34px DejaVu Sans, sans-serif"; g.textAlign = "left"; g.textBaseline = "middle"; g.fillText(S.title || "", 150, 146);
  p.ell(116, 144, 26, 26, S.avatar || "#e26fa0", 4);
  // messages from the bottom up
  let y = 880; g.font = "26px DejaVu Sans, sans-serif";
  const vis = S.msgs.slice().reverse();
  for (const m of vis) {
    const lines = wrap(g, m.text, 330), h = lines.length * 34 + 26, bw = Math.min(360, Math.max(...lines.map((l) => g.measureText(l).width)) + 36);
    const x0 = m.mine ? 500 - bw : 100; y -= h + (m.who && !m.mine ? 34 : 14);
    if (m.who && !m.mine) { g.fillStyle = m.col || "#f6a04a"; g.font = "bold 20px DejaVu Sans, sans-serif"; g.textAlign = "left"; g.fillText(m.who, x0 + 6, y - 6); g.font = "26px DejaVu Sans, sans-serif"; }
    g.fillStyle = m.mine ? "#3b7bff" : "#4a4f66"; g.beginPath(); g.roundRect ? g.roundRect(x0, y, bw, h, 20) : g.rect(x0, y, bw, h); g.fill();
    g.fillStyle = "#ffffff"; g.textAlign = "left"; lines.forEach((l, i) => g.fillText(l, x0 + 18, y + 30 + i * 34));
    if (y < 200) break;
  }
  // input bar
  g.fillStyle = "#454b63"; g.beginPath(); g.roundRect ? g.roundRect(94, 898, 400, 48, 24) : g.rect(94, 898, 400, 48); g.fill();
  g.fillStyle = S.typing ? "#ffffff" : "#6d7080"; g.font = "22px DejaVu Sans, sans-serif"; g.textAlign = "left";
  const tt = S.typing || "Mensagem"; const lw = g.measureText(tt).width; g.fillText(lw > 360 ? "…" + tt.slice(-26) : tt, 112, 922);
  // banner (notification) on top
  if (S.banner) {
    const k = S.banner.k ?? 1, by = -140 + 230 * Math.min(1, k * 1.6);
    p.poly(rrect(40, by, 560, by + 130, 28), "#f4f1e8", 8);
    p.dot(92, by + 65, 32, S.banner.col || "#e26fa0");
    g.fillStyle = "#1b1b22"; g.font = "bold 26px DejaVu Sans, sans-serif"; g.textAlign = "left"; g.fillText(S.banner.who, 140, by + 38);
    g.font = "24px DejaVu Sans, sans-serif"; const ls = wrap(g, S.banner.text, 390); ls.slice(0, 2).forEach((l, i) => g.fillText(l, 140, by + 74 + i * 30));
  }
  // thumbs
  hand(p, 70, 905, 36, 40, 0.5); hand(p, 530, 905, 36, 40, -0.5, -1);
  arm(p, [[30, 1040], [60, 960]]); arm(p, [[570, 1040], [540, 960]]);
};
/** end card */
export const endCard = (p, t) => {
  const g = p.g, k = Math.min(1, t * 1.5), pop = 1 - Math.pow(1 - k, 3);
  g.save(); g.globalAlpha = pop; g.textAlign = "center"; g.textBaseline = "middle";
  g.font = "bold 74px DejaVu Sans, sans-serif"; g.lineJoin = "round"; g.strokeStyle = "#0c0c12"; g.lineWidth = 16;
  for (const [txt, y] of [["O QUE VOCÊ", 220], ["FARIA?", 310]]) { g.strokeText(txt, 300, y); g.fillStyle = "#ffffff"; g.fillText(txt, 300, y); }
  const btn = (y, col, label) => { p.poly(rrect(50, y, 550, y + 96, 16), col, 9); g.font = "bold 40px DejaVu Sans, sans-serif"; g.fillStyle = "#ffffff"; g.strokeStyle = "#0c0c12"; g.lineWidth = 10; g.strokeText(label, 330, y + 50); g.fillText(label, 330, y + 50); };
  btn(420, "#2ea64a", "ABRIR A PORTA"); g.font = "bold 36px DejaVu Sans, sans-serif"; g.fillStyle = "#ffffff"; g.strokeStyle = "#0c0c12"; g.lineWidth = 10; g.strokeText("OU", 300, 560); g.fillText("OU", 300, 560);
  btn(600, "#c0302c", "DEIXAR TRANCADA");
  g.font = "bold 36px DejaVu Sans, sans-serif"; g.fillStyle = "#ffe14d"; g.strokeText("Comente PARTE 2", 300, 780); g.fillText("Comente PARTE 2", 300, 780);
  g.restore();
};
