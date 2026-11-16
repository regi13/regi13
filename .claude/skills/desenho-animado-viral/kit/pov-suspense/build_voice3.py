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
out = np.zeros(N, np.float32); meta = []
for c in TL["clips"]:
    x = trim(load(f"vozes/qw/{c['name']}.wav"))
    if c["tempo"] != 1.0: x = ff(x, f"atempo={c['tempo']}")
    x = trim(ff(x, CH[c["spk"]])); y = setrms(x, -19 if c["spk"] == "N" else -23)
    # short fades
    fi = int(0.01 * SR); y[:fi] *= np.linspace(0, 1, fi); y[-fi:] *= np.linspace(1, 0, fi)
    i = int(c["start"] * SR); out[i:i + len(y)] += y[: N - i]
    env = np.convolve(np.abs(y), np.ones(int(0.03 * SR)) / int(0.03 * SR), "same"); act = env > 0.12 * env.max(); segs = []; s = None
    for k in range(0, len(act), int(0.01 * SR)):
        if act[k] and s is None: s = k
        if not act[k] and s is not None:
            if segs and (s - segs[-1][1]) < 0.22 * SR: segs[-1][1] = k
            else: segs.append([s, k])
            s = None
    if s is not None: segs.append([s, len(act)])
    meta.append({"name": c["name"], "start": c["start"], "dur": len(y) / SR, "text": c["text"], "spk": c["spk"], "segs": [[round(a / SR, 3), round(b / SR, 3)] for a, b in segs]})
pk = np.abs(out).max(); out = out / pk * 0.9 if pk > 0.9 else out
with wave.open("voice.wav", "wb") as w: w.setnchannels(1); w.setsampwidth(2); w.setframerate(SR); w.writeframes((np.clip(out, -1, 1) * 32767).astype(np.int16).tobytes())
json.dump(meta, open("work/clips.json", "w"), ensure_ascii=False, indent=1)
for m in meta: print(m["name"], round(m["start"], 2), "+", round(m["dur"], 2), "segs", len(m["segs"]))
