"""mix v2: voz intacta; trilha de suspense e efeitos mais altos (pedido do usuário), com limite de pico."""
import numpy as np, subprocess, wave
SR = 48000
def load(p):
    raw = subprocess.run(["ffmpeg", "-v", "error", "-i", p, "-ac", "1", "-ar", str(SR), "-f", "f32le", "-"], capture_output=True, check=True).stdout
    return np.frombuffer(raw, np.float32).copy()
def grms(x, win=0.4, gate=-30):
    n = int(win * SR); m = len(x) // n; r = np.sqrt(np.mean(x[: m * n].reshape(m, n) ** 2, axis=1)) + 1e-12
    a = r[r > r.max() * 10 ** (gate / 20)]; return float(np.sqrt(np.mean(a ** 2)))
v, mu, sf = load("voice.wav"), load("music.wav"), load("sfx.wav")
N = len(v); mu = np.pad(mu, (0, max(0, N - len(mu))))[:N]; sf = np.pad(sf, (0, max(0, N - len(sf))))[:N]
rv = grms(v)
sf = np.tanh(sf / (np.percentile(np.abs(sf), 99.0) + 1e-9) * 1.1)   # comprime os picos dos efeitos para poderem ficar altos (≈ -2 dB da voz)
gm = 0.95 * rv / grms(mu); gs = min(0.8 * rv / grms(sf), 1.1 * np.abs(v).max() / max(np.abs(sf).max(), 1e-9))
env = np.convolve(np.abs(v), np.ones(int(0.12 * SR)) / int(0.12 * SR), "same"); act = np.clip(env / (0.35 * env.max() + 1e-9) * 6, 0, 1); act = np.convolve(act, np.ones(int(0.25 * SR)) / int(0.25 * SR), "same")
duck = 1 - 0.38 * np.clip(act, 0, 1)
mix = v + mu * gm * duck + sf * gs * (1 - 0.15 * np.clip(act, 0, 1))
db = lambda r: 20 * np.log10(max(r, 1e-12))
print(f"musica {db(grms(mu*gm))-db(rv):+.1f} dB, efeitos {db(grms(sf*gs))-db(rv):+.1f} dB vs voz")
pk = np.abs(mix).max()
if pk > 0.98: mix = np.tanh(mix / pk * 1.2) / np.tanh(1.2) * 0.98
with wave.open("mix_raw.wav", "wb") as w: w.setnchannels(1); w.setsampwidth(2); w.setframerate(SR); w.writeframes((np.clip(mix, -1, 1) * 32767).astype(np.int16).tobytes())
