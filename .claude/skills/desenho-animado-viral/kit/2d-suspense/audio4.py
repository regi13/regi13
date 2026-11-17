"""Stems for "O interfone": music.wav + sfx.wav (no mixing here; mix.py does the level lock)."""
import numpy as np, subprocess, wave
SR = 48000
import json as _json
_SH = _json.load(open("work/shots.json")); DUR = _SH["total"] + 0.0
N = int(DUR * SR)
def _unused(s):   # design-time seconds -> final seconds
    for (o0, n0), (o1, n1) in zip(_MAP, _MAP[1:]):
        if s <= o1: return n0 + (n1 - n0) * (s - o0) / (o1 - o0)
    return _MAP[-1][1] + (s - _MAP[-1][0])
def INV(arr):   # final seconds (array) -> design-time seconds
    on = np.array([m[0] for m in _MAP]); nn = np.array([m[1] for m in _MAP]); return np.interp(arr, nn, on)
rng = np.random.default_rng(7)
def load_voice():
    raw = subprocess.run(["ffmpeg", "-v", "error", "-i", "voice.mp3", "-ac", "1", "-ar", str(SR), "-f", "f32le", "-"], capture_output=True).stdout
    v = np.frombuffer(raw, np.float32).copy()
    out = np.zeros(N, np.float32); out[:min(N, len(v))] = v[:N]; return out

def env(n, a=0.005, r=0.2, sus=None):
    t = np.arange(n) / SR
    e = np.minimum(1, t / max(a, 1e-4)) * np.exp(-t / r)
    return e

def lp(x, k):  # one-pole low-pass, k in (0,1)
    y = np.empty_like(x); acc = 0.0
    for i in range(len(x)): acc += k * (x[i] - acc); y[i] = acc
    return y

def lp_fast(x, cutoff):
    # FFT brick-ish low-pass (fast, fine for beds)
    X = np.fft.rfft(x); f = np.fft.rfftfreq(len(x), 1 / SR)
    X *= 1 / (1 + (f / cutoff) ** 4); return np.fft.irfft(X, len(x)).astype(np.float32)

def hp_fast(x, cutoff):
    X = np.fft.rfft(x); f = np.fft.rfftfreq(len(x), 1 / SR)
    X *= 1 - 1 / (1 + (f / cutoff) ** 4); return np.fft.irfft(X, len(x)).astype(np.float32)

def place(buf, sig, t0, gain=1.0):
    i = int(t0 * SR); j = min(N, i + len(sig))
    if i < N and j > i: buf[i:j] += sig[: j - i] * gain

midi = lambda m: 440 * 2 ** ((m - 69) / 12)

midi = lambda m: 440 * 2 ** ((m - 69) / 12)
def pluck(f, dur=0.35, bright=0.5):
    n = int(dur * SR); t = np.arange(n) / SR
    s = sum((bright ** k) * np.sin(2 * np.pi * f * (k + 1) * t) / (k + 1) for k in range(6))
    return (s * env(n, 0.003, dur * 0.35)).astype(np.float32)
def brass(fs, dur):
    n = int(dur * SR); t = np.arange(n) / SR; s = np.zeros(n)
    for f in fs:
        ph = 2 * np.pi * f * t + 0.003 * np.sin(2 * np.pi * 5 * t)
        s += sum(np.sin((k + 1) * ph) / (k + 1) ** 1.3 for k in range(8))
    a = np.minimum(1, t / 0.08) * np.minimum(1, (dur - t) / 0.15).clip(0)
    return lp_fast((s * a).astype(np.float32), 1800) / len(fs)
def drum(kind):
    if kind == "kick":
        n = int(0.35 * SR); t = np.arange(n) / SR; f = 50 + 90 * np.exp(-t * 30)
        return (np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-t * 9)).astype(np.float32)
    n = int(0.18 * SR); t = np.arange(n) / SR
    s = rng.standard_normal(n) * np.exp(-t * 28) * 0.6 + np.sin(2 * np.pi * 190 * t) * np.exp(-t * 20) * 0.5
    return hp_fast(s.astype(np.float32), 300)



# ---------------- sfx ----------------
sfx = np.zeros(N, np.float32)
def noise(d): return rng.standard_normal(int(d * SR)).astype(np.float32)
def thunk(f0=90, d=0.3):
    n = int(d * SR); t = np.arange(n) / SR
    return (np.sin(2 * np.pi * f0 * t * (1 + 0.6 * np.exp(-t * 40))) * np.exp(-t * 14) + lp_fast(noise(d), 1200) * np.exp(-t * 30) * 0.5).astype(np.float32)
def rumble(d):
    n = int(d * SR); t = np.arange(n) / SR
    s = lp_fast(noise(d), 160) * 3 * np.minimum(1, t / 0.15) * np.exp(-t / (d * 0.45))
    return s.astype(np.float32)
def crash(d=1.2):
    n = int(d * SR); t = np.arange(n) / SR; s = np.zeros(n, np.float32)
    for k in range(14):
        tk = rng.uniform(0, d * 0.6); i = int(tk * SR); g = thunk(rng.uniform(60, 160), 0.35) * rng.uniform(0.3, 0.9)
        s[i:i + len(g)] += g[: n - i]
    s += lp_fast(noise(d), 2500) * np.exp(-t * 3) * 0.25
    return s
def cuckoo():
    out = []
    for f, d in [(740, 0.16), (587, 0.24)]:
        n = int(d * SR); t = np.arange(n) / SR
        out.append(np.sin(2 * np.pi * f * t) * np.minimum(1, t / 0.01) * np.exp(-t * 6)); out.append(np.zeros(int(0.06 * SR)))
    return np.concatenate(out).astype(np.float32)
def scrape(d=0.8):
    n = int(d * SR); t = np.arange(n) / SR
    s = noise(d) * (0.5 + 0.5 * np.sin(2 * np.pi * 13 * t)) * np.sin(np.pi * t / d)
    s = hp_fast(lp_fast(s, 5000), 1500)
    ring = np.sin(2 * np.pi * 1870 * t) * np.exp(-t * 3) * 0.2
    return (s * 0.6 + ring).astype(np.float32)
def ting():
    n = int(1.2 * SR); t = np.arange(n) / SR
    return (sum(np.sin(2 * np.pi * f * t) * np.exp(-t * k) for f, k in [(2093, 4), (3136, 6), (4186, 8)]) * 0.3).astype(np.float32)
def sting():
    n = int(2.0 * SR); t = np.arange(n) / SR
    low = np.sin(2 * np.pi * 41 * t) * np.exp(-t * 1.5) * 1.2
    hit = lp_fast(noise(2.0), 900) * np.exp(-t * 6) * 0.8
    stab = brass([midi(45), midi(48), midi(51)], 1.4); s = low + hit; s[: len(stab)] += stab * 2.2 * np.exp(-np.arange(len(stab)) / SR * 2)
    return s.astype(np.float32)
def creak(d=0.6, f0=140):
    n = int(d * SR); t = np.arange(n) / SR
    rate = f0 * (1 + 0.35 * np.sin(2 * np.pi * 1.3 * t / d))
    ph = np.cumsum(rate) / SR; pulses = (np.mod(ph, 1) < 0.08).astype(np.float32)
    s = lp_fast(pulses * (0.6 + 0.4 * rng.random(n).astype(np.float32)), 2200) * np.sin(np.pi * t / d)
    return hp_fast(s, 200) * 2.5
def snap():
    d = 0.5; n = int(d * SR); t = np.arange(n) / SR
    return (hp_fast(noise(d), 800) * np.exp(-t * 18) * 1.4 + np.pad(thunk(120, 0.4), (0, n - int(0.4 * SR))) * 0.6).astype(np.float32)
def splash(d=1.0):
    n = int(d * SR); t = np.arange(n) / SR
    s = lp_fast(noise(d), 4000) * (np.exp(-t * 4) * np.minimum(1, t / 0.01)) + lp_fast(noise(d), 400) * np.exp(-t * 7) * 1.5
    return s.astype(np.float32)
def whoosh(d=0.5):
    n = int(d * SR); t = np.arange(n) / SR
    return (lp_fast(noise(d), 1500) * np.sin(np.pi * t / d) ** 2 * 0.6).astype(np.float32)
def snore(d=1.1):
    n = int(d * SR); t = np.arange(n) / SR
    buzz = (np.mod(np.cumsum(60 + 25 * np.sin(np.pi * t / d)) / SR, 1) < 0.3).astype(np.float32)
    return (lp_fast(buzz * 0.5 + noise(d) * 0.15, 700) * np.sin(np.pi * t / d) ** 2).astype(np.float32)
def leaves(d):
    n = int(d * SR); t = np.arange(n) / SR
    return (hp_fast(lp_fast(noise(d), 6000), 2500) * (0.3 + 0.3 * np.sin(2 * np.pi * 0.7 * t) ** 2) * np.minimum(1, t / 0.4) * np.minimum(1, (d - t) / 0.4)).astype(np.float32)
def water(d):
    n = int(d * SR); t = np.arange(n) / SR
    return (lp_fast(noise(d), 900) * 0.5 + hp_fast(lp_fast(noise(d), 3000), 1200) * 0.15 * (0.6 + 0.4 * np.sin(2 * np.pi * 0.4 * t))).astype(np.float32)


def sniff(d=0.45):
    n = int(d * SR); t = np.arange(n) / SR
    return (hp_fast(lp_fast(noise(d), 5000), 1800) * np.sin(np.pi * t / d) ** 1.5 * (0.6 + 0.4 * np.sin(2 * np.pi * 9 * t))).astype(np.float32)
def crunch(d=0.25):
    n = int(d * SR); t = np.arange(n) / SR; s = np.zeros(n, np.float32)
    for _ in range(9):
        i = int(rng.uniform(0, d * 0.7) * SR); m = int(0.02 * SR); s[i:i + m] += hp_fast(noise(0.02), 1500)[: n - i] * rng.uniform(0.4, 1)
    return s * np.exp(-t * 6)
def hiss(d=0.7):
    n = int(d * SR); t = np.arange(n) / SR
    return (hp_fast(noise(d), 3500) * np.minimum(1, t / 0.03) * np.exp(-t * 3) * 0.6).astype(np.float32)
def clink(f0):
    n = int(0.25 * SR); t = np.arange(n) / SR
    return (sum(np.sin(2 * np.pi * f0 * r * t) * np.exp(-t * (18 + 8 * j)) for j, r in enumerate([1, 2.76, 5.4])) * 0.35).astype(np.float32)
def murmur(d):
    n = int(d * SR); t = np.arange(n) / SR
    s = lp_fast(noise(d), 900) * (0.5 + 0.5 * np.abs(np.sin(2 * np.pi * 2.3 * t) * np.sin(2 * np.pi * 3.1 * t + 1)))
    return (hp_fast(s, 180) * np.minimum(1, t / 0.4) * np.minimum(1, (d - t) / 0.4)).astype(np.float32)
def laugh(d=1.2):
    n = int(d * SR); t = np.arange(n) / SR
    env_ = (np.mod(t * 6.5, 1) < 0.45).astype(np.float32) * np.exp(-t * 1.2)
    return (lp_fast(hp_fast(noise(d), 300), 1600) * lp_fast(env_, 40) * 1.5).astype(np.float32)


def hum(d):
    n = int(d * SR); t = np.arange(n) / SR
    s = (np.sin(2 * np.pi * 110 * t) + 0.5 * np.sin(2 * np.pi * 220 * t + 1) + 0.25 * np.sin(2 * np.pi * 330 * t)) * (0.7 + 0.3 * np.sin(2 * np.pi * 7 * t))
    return (s * np.minimum(1, t / 0.15) * np.minimum(1, (d - t) / 0.2) * 0.35).astype(np.float32)
def popc():
    d = 0.12; n = int(d * SR); t = np.arange(n) / SR
    return (hp_fast(noise(d), 1500) * np.exp(-t * 55) * 1.2 + np.sin(2 * np.pi * 220 * t) * np.exp(-t * 40) * 0.5).astype(np.float32)
def rise(d=1.0):
    n = int(d * SR); t = np.arange(n) / SR
    f = 200 + 900 * (t / d) ** 2
    return (np.sin(2 * np.pi * np.cumsum(f) / SR) * np.minimum(1, t / 0.1) * (t / d) * 0.4).astype(np.float32)
def step(d=0.1):
    n = int(d * SR); t = np.arange(n) / SR
    return (lp_fast(noise(d), 500) * np.exp(-t * 45) * 1.5).astype(np.float32)


def knock():
    n = int(0.28 * SR); t = np.arange(n) / SR
    return (np.sin(2 * np.pi * 150 * t * (1 + 0.5 * np.exp(-t * 60))) * np.exp(-t * 22) + lp_fast(noise(0.28), 1400) * np.exp(-t * 45) * 0.8).astype(np.float32)
def buzz(d=0.35):
    n = int(d * SR); t = np.arange(n) / SR
    return ((np.sign(np.sin(2 * np.pi * 180 * t)) * 0.35 + np.sin(2 * np.pi * 90 * t) * 0.5) * np.minimum(1, t / 0.01) * np.minimum(1, (d - t) / 0.02)).astype(np.float32)
def pop_msg():
    n = int(0.22 * SR); t = np.arange(n) / SR
    return (np.sin(2 * np.pi * 880 * t * (1 + 0.5 * t)) * np.exp(-t * 18) * 0.5 + np.sin(2 * np.pi * 1320 * t) * np.exp(-t * 25) * 0.3).astype(np.float32)
def tick(d=0.04):
    n = int(d * SR); t = np.arange(n) / SR
    return (hp_fast(noise(d), 2500) * np.exp(-t * 90)).astype(np.float32)
def squeak(d=0.9):
    n = int(d * SR); t = np.arange(n) / SR
    f = 700 + 500 * np.sin(2 * np.pi * 1.7 * t) + 300 * t / d
    return (np.sin(2 * np.pi * np.cumsum(f) / SR) * np.sin(np.pi * t / d) ** 1.5 * 0.18 + hp_fast(noise(d), 3000) * 0.04 * np.sin(np.pi * t / d)).astype(np.float32)
def click(f0=1800):
    n = int(0.08 * SR); t = np.arange(n) / SR
    return (np.sin(2 * np.pi * f0 * t) * np.exp(-t * 70) * 0.6 + hp_fast(noise(0.08), 2000) * np.exp(-t * 90) * 0.5).astype(np.float32)
def bubbles(d):
    n = int(d * SR); s = np.zeros(n, np.float32)
    for _ in range(int(d * 14)):
        i = int(rng.uniform(0, d - 0.1) * SR); m = int(0.06 * SR); t = np.arange(m) / SR
        s[i:i + m] += (np.sin(2 * np.pi * rng.uniform(300, 700) * t * (1 + 3 * t)) * np.exp(-t * 40) * 0.15).astype(np.float32)
    return s + lp_fast(noise(d), 1500) * 0.03
def intercom_buzz():
    return (buzz(0.5) * 0.9 + lp_fast(noise(0.5), 2000) * 0.1).astype(np.float32)
def whine(d=1.2):
    n = int(d * SR); t = np.arange(n) / SR; f = 1800 * np.exp(-t * 2.2)
    return (np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-t * 2.0) * 0.12).astype(np.float32)


def riser(d, f0=120, f1=1500):
    n = int(d * SR); t = np.arange(n) / SR; f = f0 * (f1 / f0) ** (t / d)
    return ((np.sin(2 * np.pi * np.cumsum(f) / SR) * 0.6 + lp_fast(noise(d), 3000) * 0.5) * (t / d) ** 2.2).astype(np.float32)
def screech(d, base=2100):
    n = int(d * SR); t = np.arange(n) / SR; vib = 1 + 0.012 * np.sin(2 * np.pi * 6.5 * t)
    sg = sum(np.sin(2 * np.pi * base * r * vib * t) / (1 + 2 * k_) for k_, r in enumerate([1.0, 1.06, 1.414, 1.5]))
    return (sg * np.minimum(1, t / 0.25) * np.minimum(1, (d - t) / 0.4) * 0.35).astype(np.float32)
def pad(d, notes):
    n = int(d * SR); t = np.arange(n) / SR; s = np.zeros(n)
    for fN in notes: s += np.sin(2 * np.pi * fN * t + np.sin(2 * np.pi * 0.2 * t)) + 0.4 * np.sin(2 * np.pi * fN * 2.003 * t)
    return (lp_fast(s.astype(np.float32), 900) * np.minimum(1, t / 1.5) * np.minimum(1, (d - t) / 1.0) / len(notes)).astype(np.float32)
def tinnitus(d):
    n = int(d * SR); t = np.arange(n) / SR
    return (np.sin(2 * np.pi * 5200 * t) * 0.12 * np.minimum(1, t / (d * 0.8)) * np.minimum(1, (d - t) / 0.05)).astype(np.float32)

def dingb():
    n = int(1.6 * SR); t = np.arange(n) / SR
    return ((np.sin(2 * np.pi * 988 * t) * np.exp(-t * 3.2) + 0.6 * np.sin(2 * np.pi * 1318 * t) * np.exp(-t * 3.6) + 0.25 * np.sin(2 * np.pi * 2637 * t) * np.exp(-t * 6)) * 0.5).astype(np.float32)
def stamp():
    n = int(0.5 * SR); t = np.arange(n) / SR
    return (np.sin(2 * np.pi * 70 * t * (1 + 0.7 * np.exp(-t * 40))) * np.exp(-t * 11) * 1.2 + lp_fast(noise(0.5), 1500) * np.exp(-t * 35) * 0.7).astype(np.float32)
def static(d, lvl=0.5):
    n = int(d * SR); t = np.arange(n) / SR
    return (hp_fast(noise(d), 800) * (0.55 + 0.45 * np.abs(np.sin(2 * np.pi * 7 * t) * np.sin(2 * np.pi * 3.1 * t + 1))) * lvl * np.minimum(1, t / 0.03) * np.minimum(1, (d - t) / 0.05)).astype(np.float32)
def rustle(d=0.8):
    n = int(d * SR); t = np.arange(n) / SR
    return (hp_fast(lp_fast(noise(d), 7000), 1800) * (0.4 + 0.6 * np.abs(np.sin(2 * np.pi * 9 * t))) * np.minimum(1, t / 0.05) * np.exp(-t * 2.2) * 0.8).astype(np.float32)
def marker(d=0.9):
    n = int(d * SR); t = np.arange(n) / SR
    return (hp_fast(lp_fast(noise(d), 5000), 2500) * 0.35 * (0.5 + 0.5 * np.sin(2 * np.pi * 14 * t)) * np.sin(np.pi * t / d)).astype(np.float32)
def slide(d=0.9):
    n = int(d * SR); t = np.arange(n) / SR
    return (lp_fast(noise(d), 900) * np.sin(np.pi * t / d) ** 1.5 * 0.7 + np.sin(2 * np.pi * 95 * t) * 0.15 * np.sin(np.pi * t / d)).astype(np.float32)
def pop():
    n = int(0.25 * SR); t = np.arange(n) / SR
    return (np.sin(2 * np.pi * 520 * t * (1 + 1.5 * t)) * np.exp(-t * 16) * 0.7).astype(np.float32)
def hit(f0=48, d=1.2):
    n = int(d * SR); t = np.arange(n) / SR
    return (np.sin(2 * np.pi * f0 * t * (1 + 1.2 * np.exp(-t * 18))) * np.exp(-t * 3.2) * 1.3 + lp_fast(noise(d), 600) * np.exp(-t * 9) * 0.6).astype(np.float32)
SH = {s["id"]: s for s in _SH["shots"]}; TT = np.arange(N) / SR
music = np.zeros(N, np.float32); sfx = np.zeros(N, np.float32)
# --- camada contínua: zumbido de luz fluorescente + drone que cresce; silêncio dramático antes da voz do rádio ---
hum = (np.sin(2 * np.pi * 100 * TT) * 0.5 + np.sin(2 * np.pi * 200 * TT) * 0.2) * 0.05
rad0 = SH["rad"]["start"]; sil = np.ones(N, np.float32)
sil[(TT > rad0 - 1.3) & (TT < rad0 + 0.1)] = 0.0; sil = np.convolve(sil, np.ones(int(0.15 * SR)) / int(0.15 * SR), "same")
grow = np.clip((TT - 0.6) / (DUR - 4), 0, 1) ** 0.8
drone = (np.sin(2 * np.pi * 55 * TT) + 0.6 * np.sin(2 * np.pi * 55.7 * TT) + 0.4 * np.sin(2 * np.pi * 82.4 * TT + 1.0) + 0.25 * np.sin(2 * np.pi * 116.5 * TT)) * (0.55 + 0.45 * np.sin(2 * np.pi * 0.11 * TT))
music += (drone * (0.25 + 0.75 * grow) * sil).astype(np.float32) + hum.astype(np.float32)
# pad dissonante (tritono) entra no elevador
place(music, pad(DUR - SH["n3a"]["a"] - 2, [55.0, 77.8, 110.0, 116.5]), SH["n3a"]["a"], 0.5)
# batimento cardíaco: começa no medo do Rafael (r3) e acelera
t_ = SH["r3"]["a"]; endhb = rad0 - 1.3
while t_ < DUR - 1.0:
    if not (endhb < t_ < rad0 + 0.2): place(music, thunk(55, 0.22), t_, 1.3); place(music, thunk(48, 0.2), t_ + 0.28, 0.85)
    bpm = 64 + 40 * min(1, (t_ - SH["r3"]["a"]) / (DUR - SH["r3"]["a"])); t_ += 60 / bpm
# --- efeitos por plano ---
for sid in [k for k, v in SH.items() if v.get("rule")]:                # cartão de regra/dia: carimbo + ding
    a = SH[sid]["a"] + 0.05; place(sfx, stamp(), a, 0.9); place(sfx, dingb(), a + 0.05, 0.7)
place(sfx, static(1.6, 0.35), SH["n1"]["a"], 0.7); place(sfx, click(1200), SH["n1"]["a"], 0.8)
place(sfx, lp_fast(noise(SH["n2"]["b"] - SH["n2"]["a"]), 500) * 0.25, SH["n2"]["a"], 0.5)           # vento
e = SH["n3"]["start"]; place(sfx, dingb(), e + 1.45, 0.9); place(sfx, slide(0.8), e + 1.5, 0.8); place(sfx, click(900), e + 3.2, 0.9); place(sfx, dingb(), e + 3.25, 0.6)
m_ = SH["n4"]["start"]; place(sfx, static(SH["n4"]["b"] - SH["n4"]["a"], 0.16), SH["n4"]["a"], 0.6); place(sfx, riser(3.0, 90, 800), m_ + 1.0, 0.5)
place(sfx, static(1.2, 0.8), SH["n5"]["start"] + 0.5, 0.9)
place(sfx, hit(), rad0 - 0.05, 0.9); place(sfx, static(SH["rad"]["b"] - SH["rad"]["a"], 0.3), SH["rad"]["a"], 0.7); place(sfx, screech(1.8, 2100), rad0 + 1.6, 0.25)
place(sfx, rustle(), SH["n6a"]["a"], 0.8); place(sfx, marker(), SH["n6a"]["start"] + 2.0, 0.8)
place(sfx, stamp(), SH["n6b"]["start"] + 2.0, 1.0)
c0 = SH["n7"]["a"]; place(sfx, buzz(0.3), c0 + 0.15, 0.8); place(sfx, buzz(0.3), c0 + 0.6, 0.8)
for k_ in range(6): place(sfx, pop(), SH["n7"]["start"] + 3.2 + k_ * 1.08, 0.5)
for p_ in SH["n8"]["phrases"]:
    if "Entregar a folha" in p_["text"]: place(sfx, pop(), p_["start"], 0.9); place(sfx, hit(70, 0.8), p_["start"], 0.5)
    if "queimar" in p_["text"].lower(): place(sfx, pop(), p_["start"], 0.9); place(sfx, hit(60, 0.8), p_["start"], 0.5)
    if "decide" in p_["text"].lower() or "Parte 2" in p_["text"]: place(sfx, hit(45, 1.5), p_["start"], 0.9)
def wav(name, x):
    pcm = (np.clip(x, -1, 1) * 32767).astype(np.int16)
    with wave.open(name, "wb") as w: w.setnchannels(1); w.setsampwidth(2); w.setframerate(SR); w.writeframes(pcm.tobytes())
pk = max(np.abs(music).max(), np.abs(sfx).max(), 1e-6)
wav("music.wav", music / pk * 0.9); wav("sfx.wav", sfx / pk * 0.9)
print("stems ok", DUR)
