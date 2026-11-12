"""Stems for "O cheiro do pão": music.wav + sfx.wav (no mixing here; mix.py does the level lock)."""
import numpy as np, subprocess, wave
SR = 48000
DUR = 700 / 30
N = int(DUR * SR)
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


# ---------------- music: light village jig (C major), stops on "Pronto." ----------------
music = np.zeros(N, np.float32)
BPM = 116; beat = 60 / BPM
prog = [(48, [60, 64, 67]), (53, [57, 60, 65]), (55, [59, 62, 67]), (48, [60, 64, 67])]  # C F G C
mel = [72, 74, 76, 72, 77, 76, 74, 71, 72, 76, 79, 77, 76, 74, 72, 67]
MUSIC_END = 19.55
bar = 0; tt = 0.0; k = 0
while tt < MUSIC_END:
    root, ch = prog[bar % 4]
    place(music, brass([midi(m) for m in ch], beat * 4 * 0.98), tt, 0.05)
    for b in range(4):
        tb = tt + b * beat
        if tb >= MUSIC_END: break
        place(music, drum("kick" if b % 2 == 0 else "snare"), tb, 0.45 if b % 2 == 0 else 0.22)
        place(music, pluck(midi(root - 12 + (7 if b % 2 else 0)), 0.32, 0.45), tb, 0.35)
        for h in range(2):
            th = tb + h * beat / 2
            if th < MUSIC_END: place(music, pluck(midi(mel[k % len(mel)]), 0.2, 0.7), th, 0.16); k += 1
    bar += 1; tt += beat * 4
i0 = int((MUSIC_END - 0.06) * SR); music[i0:] *= np.linspace(1, 0, N - i0) ** 10
dn = int((DUR - MUSIC_END) * SR); td = np.arange(dn) / SR
drone = (np.sin(2 * np.pi * 65.4 * td) + 0.5 * np.sin(2 * np.pi * 98 * td)) * np.minimum(1, td / 0.8)
place(music, lp_fast(drone.astype(np.float32), 500), MUSIC_END, 0.06)
# tiny comic button after the last word
for j, m in enumerate([67, 72]): place(music, pluck(midi(m), 0.3, 0.7), 22.55 + j * 0.16, 0.3)
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

F = lambda f: f / 30
for f0 in (6, 34, 205, 228): place(sfx, sniff(), F(f0), 0.5)
place(sfx, crunch(), F(60), 0.8); place(sfx, crunch(), F(149), 0.9)
place(sfx, whoosh(1.4), F(95), 0.35); place(sfx, whoosh(1.0), F(175), 0.3)
place(sfx, creak(0.35, 150), F(270), 0.6); place(sfx, thunk(80, 0.35), F(278), 1.0)
place(sfx, whoosh(0.35), F(276), 0.4)
place(sfx, thunk(95, 0.3), F(300), 0.9); place(sfx, hiss(0.8), F(301), 0.5)
place(sfx, whoosh(0.4), F(363), 0.6)
place(sfx, murmur(F(449) - F(366)), F(366), 0.45)
place(sfx, whoosh(0.3), F(469), 0.5)
for i in range(26): place(sfx, clink(rng.uniform(2600, 4200)), F(501) + i * 0.095 + rng.uniform(0, 0.03), rng.uniform(0.4, 0.8))
place(sfx, sting(), 19.57, 0.75); place(sfx, thunk(70, 0.35), F(590), 0.9)
place(sfx, whoosh(0.3), F(598), 0.5)
place(sfx, ting(), F(664), 0.55)
place(sfx, thunk(110, 0.25), F(673), 0.6); place(sfx, laugh(1.3), F(674), 0.5)

def wav(name, x):
    pcm = (np.clip(x, -1, 1) * 32767).astype(np.int16)
    with wave.open(name, "wb") as w: w.setnchannels(1); w.setsampwidth(2); w.setframerate(SR); w.writeframes(pcm.tobytes())
pk = max(np.abs(music).max(), np.abs(sfx).max(), 1e-6)
wav("music.wav", music / pk * 0.9); wav("sfx.wav", sfx / pk * 0.9)
print("stems ok", DUR)
