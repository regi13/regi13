"""Monta voice.wav a partir da linha do tempo guiada pelo áudio (work/timeline.json) e das falas do Qwen3-TTS (narrador N + pensamento E)."""
import numpy as np, subprocess, json, wave
SR = 48000
N = int(300 * SR)
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
CH = {"N": "highpass=f=70,equalizer=f=130:t=q:w=1.0:g=3.0,equalizer=f=3000:t=q:w=1.2:g=1.8,deesser=i=0.3:m=0.5,acompressor=threshold=0.08:ratio=3.0:attack=10:release=180:makeup=1.4,aecho=0.8:0.55:70|130|210:0.22|0.14|0.08",
      "E": "highpass=f=90,deesser=i=0.3:m=0.5,equalizer=f=2600:t=q:w=1.2:g=1.2,acompressor=threshold=0.07:ratio=2.0:attack=8:release=120:makeup=1.3",
      "C": "highpass=f=80,equalizer=f=180:t=q:w=1.0:g=2.5,equalizer=f=3200:t=q:w=1.2:g=1.2,deesser=i=0.3:m=0.5,acompressor=threshold=0.08:ratio=2.4:attack=8:release=150:makeup=1.3",
      "RAD": "highpass=f=450,lowpass=f=3300,equalizer=f=1500:t=q:w=1.0:g=4,acompressor=threshold=0.05:ratio=4:makeup=2,aecho=0.7:0.4:30:0.25",
      "M": "highpass=f=110,equalizer=f=250:t=q:w=1.0:g=1.5,equalizer=f=3500:t=q:w=1.2:g=1.5,deesser=i=0.3:m=0.5,acompressor=threshold=0.08:ratio=2.2:attack=8:release=150:makeup=1.3,aecho=0.85:0.5:40|90:0.12|0.06",
      "MD": "highpass=f=120,lowpass=f=2800,equalizer=f=500:t=q:w=1.0:g=2.0,acompressor=threshold=0.08:ratio=2.0:makeup=1.2,aecho=0.8:0.5:35|70|120:0.3|0.18|0.1"}
def deeper(x): return ff(x, "rubberband=pitch=0.95:formant=0:pitchq=1:transients=smooth")
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
CH["R"] = CH["E"]
PAUSE = {"...": 0.85, "…": 0.85, ".": 0.55, "?": 0.6, "!": 0.5, ":": 0.42, ";": 0.35, ",": 0.26}
FAC = {"N": 1.05, "R": 0.9, "C": 0.8, "RAD": 1.0}
def pause_after(t, spk):
    for k in ("...", "…", ".", "?", "!", ":", ";", ","):
        if t.rstrip().endswith(k): return PAUSE[k] * FAC[spk]
    return 0.3
LEV = {"N": -19, "R": -21, "C": -19, "RAD": -21}
PH = json.load(open("work/p4_phrases.json")); S = json.load(open("work/script_v5.json")); by = {}
for p in PH: by.setdefault(p["clip"], []).append(p)
out = np.zeros(N, np.float32); meta = []; t_end = 0.6
for c in S:
    spk = c["spk"]; seq = sorted(by[c["name"]], key=lambda p: p["idx"]); t = 0.0; buf = []; segs = []
    for k, p in enumerate(seq):
        x = trim(load(p["file"])); nw = len(p["text"].split()); pace = (len(x) / SR) / nw
        if pace < 0.34: x = trim(ff(x, f"atempo={max(0.9, pace / 0.36):.4f}"))
        x = trim(ff(x, CH[spk])); y = setrms(x, LEV[spk] - (3 if c["name"] in ("r5", "r6", "r7") else 0))
        fi = int(0.012 * SR); y[:fi] *= np.linspace(0, 1, fi); y[-fi:] *= np.linspace(1, 0, fi)
        segs.append({"text": p["text"], "start": round(t, 3), "end": round(t + len(y) / SR, 3)}); buf.append(y); t += len(y) / SR
        if k < len(seq) - 1:
            g = pause_after(p["text"], spk); buf.append((0.0008 * rng.standard_normal(int(g * SR))).astype(np.float32)); t += g
    y = np.concatenate(buf); st = t_end + c["gap"]; i = int(st * SR); out[i:i + len(y)] += y[: N - i]
    meta.append({"name": c["name"], "start": round(st, 3), "dur": round(len(y) / SR, 3), "text": c["text"], "spk": spk, "shot": c["shot"], "phrases": [{"text": s_["text"], "start": round(st + s_["start"], 3), "end": round(st + s_["end"], 3)} for s_ in segs]})
    t_end = st + len(y) / SR
total = round(t_end + 1.6, 2); out = out[: int(total * SR)] + (0.0006 * rng.standard_normal(int(total * SR))).astype(np.float32)
pk = np.abs(out).max(); out = out / pk * 0.9 if pk > 0.9 else out
with wave.open("voice.wav", "wb") as w: w.setnchannels(1); w.setsampwidth(2); w.setframerate(SR); w.writeframes((np.clip(out, -1, 1) * 32767).astype(np.int16).tobytes())
json.dump(meta, open("work/clips.json", "w"), ensure_ascii=False, indent=1); print("total", total, "s;", len(meta), "falas")
for m_ in meta: print(m_["name"], round(m_["start"], 2), "->", round(m_["start"] + m_["dur"], 2))
