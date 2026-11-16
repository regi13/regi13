"""Monta voice.wav a partir da linha do tempo guiada pelo áudio (work/timeline.json) e das falas do Qwen3-TTS (narrador N + pensamento E)."""
import numpy as np, subprocess, json, wave
SR = 48000
TL = json.load(open("work/timeline.json")); N = int(TL["total"] * SR)
def load(p):
    raw = subprocess.run(["ffmpeg", "-v", "error", "-i", p, "-ac", "1", "-ar", str(SR), "-f", "f32le", "-"], capture_output=True, check=True).stdout
    return np.frombuffer(raw, np.float32).copy()
def ff(x, af):
    p = subprocess.run(["ffmpeg", "-v", "error", "-f", "f32le", "-ar", str(SR), "-ac", "1", "-i", "-", "-af", af, "-f", "f32le", "-"], input=x.astype(np.float32).tobytes(), capture_output=True, check=True).stdout
    return np.frombuffer(p, np.float32).copy()
def trim(x, db=-42):
    th = 10 ** (db / 20) * max(np.abs(x).max(), 1e-6); idx = np.where(np.abs(x) > th)[0]
    return x[max(0, idx[0] - int(0.03 * SR)): idx[-1] + int(0.08 * SR)] if len(idx) else x
rms = lambda x: float(np.sqrt(np.mean(x ** 2)) + 1e-9)
setrms = lambda x, db: x * (10 ** (db / 20) / rms(x))
CH = {"N": "highpass=f=70,deesser=i=0.3:m=0.5,equalizer=f=140:t=q:w=1.0:g=2.0,equalizer=f=3200:t=q:w=1.2:g=1.5,acompressor=threshold=0.09:ratio=2.0:attack=10:release=150:makeup=1.2",
      "E": "highpass=f=90,deesser=i=0.3:m=0.5,equalizer=f=2600:t=q:w=1.2:g=1.2,acompressor=threshold=0.07:ratio=2.0:attack=8:release=120:makeup=1.3"}
rng = np.random.default_rng(3)
def stft(x, n=512, hop=128):
    w = np.hanning(n).astype(np.float32); pad = np.pad(x, (n, n)); fr = np.lib.stride_tricks.sliding_window_view(pad, n)[::hop] * w
    return np.fft.rfft(fr, axis=1), w, len(pad)
def istft(X, w, L, n=512, hop=128):
    fr = np.fft.irfft(X, n=n, axis=1) * w; out = np.zeros(L, np.float32); nw = np.zeros(L, np.float32)
    for i, f in enumerate(fr): out[i * hop: i * hop + n] += f; nw[i * hop: i * hop + n] += w * w
    return (out / np.maximum(nw, 1e-6))[n:-n]
def whisper(x, breath=0.0, n=2048, hop=512, K=70):
    X, w, L = stft(x, n, hop); mag = np.abs(X) + 1e-7
    cep = np.fft.irfft(np.log(mag), axis=1); lif = np.zeros(cep.shape[1]); lif[:K] = 1; lif[-K + 1:] = 1; lif[0] = 1
    env = np.exp(np.fft.rfft(cep * lif, axis=1).real)                      # smooth spectral envelope (no harmonics)
    noise = rng.standard_normal(len(x) + 2 * n).astype(np.float32)
    Nx, _, _ = stft(noise[n:-n][: len(x)], n, hop); Nx = Nx / (np.abs(Nx) + 1e-9)
    f = np.linspace(0, 1, env.shape[1]); tilt = 1.0 + 1.2 * f
    m_ = min(len(env), len(Nx)); y = istft(env[:m_] * Nx[:m_] * tilt, w, L, n, hop)[: len(x)]
    if breath: y = y + breath * rms(y) * rng.standard_normal(len(y)).astype(np.float32)
    return y
def ff(x, af):
    p = subprocess.run(["ffmpeg", "-v", "error", "-f", "f32le", "-ar", str(SR), "-ac", "1", "-i", "-", "-af", af, "-f", "f32le", "-"], input=x.astype(np.float32).tobytes(), capture_output=True, check=True).stdout
    return np.frombuffer(p, np.float32).copy()
def female(x): return ff(x, "rubberband=pitch=1.27:formant=0:pitchq=1:transients=smooth")
def master(x): return ff(x, "highpass=f=85,deesser=i=0.35:m=0.5,equalizer=f=2800:t=q:w=1.2:g=1.8,equalizer=f=220:t=q:w=1.0:g=1.2,acompressor=threshold=0.08:ratio=2.2:attack=8:release=120:makeup=1.3,aecho=0.85:0.5:28|52:0.10|0.05")

def tempo_fit(x, target, lo=0.88, hi=1.1):
    r = float(np.clip((len(x) / SR) / target, lo, hi))
    return ff(x, f"atempo={r:.4f}") if abs(r - 1) > 0.02 else x
def higher(x): return ff(x, "rubberband=pitch=1.07:formant=0:pitchq=1:transients=smooth")
PAUSE = {"...": 0.85, "…": 0.85, ".": 0.55, "?": 0.6, "!": 0.5, ":": 0.42, ";": 0.35, ",": 0.26}
def pause_after(t, spk):
    for k in ("...", "…", ".", "?", "!", ":", ";", ","):
        if t.rstrip().endswith(k): return PAUSE[k] * (1.15 if spk == "N" else 0.9)
    return 0.3
PH = json.load(open("work/pt2_phrases.json")); by = {}
for p in PH: by.setdefault(p["clip"], []).append(p)
out = np.zeros(N, np.float32); meta = []; tone = (0.0006 * rng.standard_normal(N)).astype(np.float32)   # room tone so pauses are never digital silence
for c in TL["clips"]:
    spk = c["spk"]; seq = sorted(by[c["name"]], key=lambda p: p["idx"]); t = 0.0; buf = []; segs = []
    for k, p in enumerate(seq):
        x = trim(load(p["file"]))
        nw = len(p["text"].split()); pace = (len(x) / SR) / nw
        if pace < 0.34: x = trim(ff(x, f"atempo={max(0.9, pace / 0.36):.4f}"))     # nunca corrido: no mínimo ~0,36 s por palavra
        if spk == "E":
            pass
        x = trim(ff(x, CH[spk])); y = setrms(x, -19 if spk == "N" else -23)
        fi = int(0.012 * SR); y[:fi] *= np.linspace(0, 1, fi); y[-fi:] *= np.linspace(1, 0, fi)
        segs.append({"text": p["text"], "start": round(t, 3), "end": round(t + len(y) / SR, 3)}); buf.append(y); t += len(y) / SR
        if k < len(seq) - 1:
            g = pause_after(p["text"], spk); buf.append((0.0008 * rng.standard_normal(int(g * SR))).astype(np.float32)); t += g
    y = np.concatenate(buf); i = int(c["start"] * SR); out[i:i + len(y)] += y[: N - i]
    meta.append({"name": c["name"], "start": c["start"], "dur": len(y) / SR, "text": c["text"], "spk": spk, "phrases": [{"text": s_["text"], "start": round(c["start"] + s_["start"], 3), "end": round(c["start"] + s_["end"], 3)} for s_ in segs]})
out += tone
pk = np.abs(out).max(); out = out / pk * 0.9 if pk > 0.9 else out
with wave.open("voice.wav", "wb") as w: w.setnchannels(1); w.setsampwidth(2); w.setframerate(SR); w.writeframes((np.clip(out, -1, 1) * 32767).astype(np.int16).tobytes())
json.dump(meta, open("work/clips.json", "w"), ensure_ascii=False, indent=1)
nxt = [m["start"] for m in meta[1:]] + [TL["total"]]
for m, n in zip(meta, nxt): print(m["name"], round(m["start"], 2), "->", round(m["start"] + m["dur"], 2), "prox. fala em", round(n, 2), "FOLGA" if m["start"] + m["dur"] < n else "SOBREPÕE")
