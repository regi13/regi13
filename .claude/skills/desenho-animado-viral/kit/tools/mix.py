"""Level lock:  python3 mix.py voice.(mp3|wav) music.wav sfx.wav  ->  mix_raw.wav
Music gated RMS = 50 % of the voice's (-6 dB). SFX gated RMS <= 50 % and SFX peaks <= 0.7x the voice peak.
One linear gain per stem, no ducking or compression; the voice is untouched."""
import sys, subprocess, wave, numpy as np
SR = 48000
def load(p):
    raw = subprocess.run(["ffmpeg", "-v", "error", "-i", p, "-ac", "1", "-ar", str(SR), "-f", "f32le", "-"], capture_output=True, check=True).stdout
    return np.frombuffer(raw, np.float32).copy()
def gated_rms(x, win=0.4, gate_db=-20):
    n = int(win * SR); m = len(x) // n
    if m == 0: return float(np.sqrt(np.mean(x ** 2)) + 1e-12)
    r = np.sqrt(np.mean(x[: m * n].reshape(m, n) ** 2, axis=1)) + 1e-12
    act = r[r > r.max() * 10 ** (gate_db / 20)]          # ignore silent/near-silent blocks
    return float(np.sqrt(np.mean(act ** 2)))
db = lambda r: 20 * np.log10(max(r, 1e-12))
v, mu, sf = load(sys.argv[1]), load(sys.argv[2]), load(sys.argv[3])
N = len(v); fit = lambda x: np.pad(x, (0, max(0, N - len(x))))[:N]
mu, sf = fit(mu), fit(sf)
rv, vpk = gated_rms(v), np.abs(v).max()
gm = 0.5 * rv / gated_rms(mu)
gs = 0.5 * rv / gated_rms(sf); gs = min(gs, 0.7 * vpk / max(np.abs(sf).max(), 1e-9))
mix = v + mu * gm + sf * gs
print(f"voice {db(rv):.1f} dB | music {db(gated_rms(mu * gm)) - db(rv):+.1f} dB vs voice | sfx {db(gated_rms(sf * gs)) - db(rv):+.1f} dB vs voice, peak {np.abs(sf*gs).max()/vpk:.2f}x voice peak")
pk = np.abs(mix).max()
if pk > 0.99: mix *= 0.99 / pk                           # one linear gain only (finish.sh normalises loudness)
with wave.open("mix_raw.wav", "wb") as w:
    w.setnchannels(1); w.setsampwidth(2); w.setframerate(SR); w.writeframes((np.clip(mix, -1, 1) * 32767).astype(np.int16).tobytes())
print("mix_raw.wav", N / SR)
