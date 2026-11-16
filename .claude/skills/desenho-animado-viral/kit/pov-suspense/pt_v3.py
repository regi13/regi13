"""v3: narrador N (suspense: mais expressivo, grave, lento), mãe M (voz feminina) e pensamento E. Frase a frase, ASR palavra por palavra."""
import json, re, time, difflib, unicodedata, subprocess, torch, torchaudio as ta, numpy as np, librosa, soundfile as sf
from huggingface_hub import snapshot_download
from chatterbox.tts import ChatterboxTTS
from faster_whisper import WhisperModel
exec(open("pt_phrases.py").read().split("OUT = ")[0].split("torch.set_num_threads(4)")[1].split("m = ChatterboxTTS")[0]) if False else None
torch.set_num_threads(4)
m = ChatterboxTTS.from_local(snapshot_download("FearL0rd/Chatterbox-TTS-Portuguese"), device="cpu")
asr = WhisperModel("small", device="cpu", compute_type="int8", cpu_threads=4)
norm = lambda s: re.sub(r"[^a-z0-9 ]", "", unicodedata.normalize("NFD", s.lower()).encode("ascii", "ignore").decode()).strip().replace(" 6", " seis")
def heard(y, sr):
    a = librosa.resample(y.astype(np.float32), orig_sr=sr, target_sr=16000); seg, _ = asr.transcribe(a, language="pt", beam_size=5); return " ".join(s.text for s in seg)
def strict(h, t):
    th, tt = norm(h).split(), norm(t).split(); miss = [w for w in tt if not any(difflib.SequenceMatcher(None, w, x).ratio() >= 0.86 for x in th)]
    return difflib.SequenceMatcher(None, " ".join(th), " ".join(tt)).ratio() - 0.2 * len(miss) - 0.1 * max(0, len(th) - len(tt))
def clean_edges(y, sr):
    n = int(0.12 * sr); e = np.abs(y); mx = e.max() + 1e-9; return (e[-n:].mean() / mx < 0.12) and (e[: int(0.03 * sr)].mean() / mx < 0.2)
def f0(y, sr):
    a = librosa.resample(y.astype(np.float32), orig_sr=sr, target_sr=16000); v = librosa.yin(a, fmin=70, fmax=420, sr=16000); v = v[(v > 75) & (v < 410)]; return float(np.median(v)) if len(v) else 0
def split(text):
    parts = re.findall(r"[^.?!:;…]+(?:\.\.\.|[.?!:;…])?|[^.?!:;…]+$", text); out = []
    for p in parts:
        p = p.strip()
        if not p: continue
        ws = p.split()
        if len(ws) >= 7 and "," in p:
            idx = [i for i, w in enumerate(ws[:-2]) if w.endswith(",") and i >= 2]
            if idx:
                k = min(idx, key=lambda i: abs(i - len(ws) / 2)); out += [" ".join(ws[: k + 1]), " ".join(ws[k + 1:])]; continue
        out.append(p)
    mg = []; i = 0
    while i < len(out):
        if len(out[i].split()) == 1 and i + 1 < len(out): mg.append(out[i] + " " + out[i + 1]); i += 2
        else: mg.append(out[i]); i += 1
    return mg
def gen(text, seed, ex, cfg, temp, ref):
    torch.manual_seed(seed); kw = dict(exaggeration=ex, cfg_weight=cfg, temperature=temp)
    if ref: kw["audio_prompt_path"] = ref
    w = m.generate(text, **kw); return w.squeeze().numpy(), m.sr
OUT = "vozes/pt3/"; REF = {"N": "vozes/ptbr/ref_N.wav", "E": "vozes/ptbr/ref_E.wav", "M": OUT + "ref_M.wav"}
# --- voz feminina da mãe: busca na voz padrão; se não chegar a ~190 Hz, sobe o tom da melhor
import os
if not os.path.exists(REF["M"]):
    best = None; txt = "Filho, vou ao mercado. Vinte minutos. Tranca a porta."
    for sd in range(1, 25):
        y, sr = gen(txt, sd, 0.55, 0.5, 0.75, None); sc = strict(heard(y, sr), txt); fz = f0(y, sr); print("refM", sd, round(sc, 3), round(fz), "Hz", flush=True)
        key = (fz >= 185 and sc >= 0.9, sc if fz >= 175 else -1)
        if best is None or key > best[0]: best = (key, y, sr, fz)
    y, sr, fz = best[1], best[2], best[3]; sf.write(OUT + "refM_raw.wav", y, sr)
    if fz < 170:
        r = 195.0 / fz; p = subprocess.run(["ffmpeg", "-v", "error", "-i", OUT + "refM_raw.wav", "-af", f"rubberband=pitch={r:.3f}:formant=0:pitchq=1", "-ar", "24000", "-ac", "1", OUT + "ref_M.wav", "-y"], capture_output=True); print("ref M: tom ×", round(r, 2), p.returncode, flush=True)
    else: sf.write(REF["M"], y, sr)
P = {"N": dict(ex=0.75, cfg=0.4, temp=0.65, pace=0.46), "M": dict(ex=0.6, cfg=0.5, temp=0.7, pace=0.42), "E": dict(ex=0.4, cfg=0.45, temp=0.7, pace=0.44)}
CL = json.load(open("work/clips_v3.json")); PH = []; done = {}
try: done = json.load(open("work/pt3_done.json"))
except Exception: pass
old = json.load(open("work/pt2_done.json"))
for c in CL:
    for pi, ph in enumerate(split(c["text"])):
        key = f"{c['name']}_{pi}"; spoken = ph.replace(":", ",") if ph.endswith(":") else ph
        if c["spk"] == "E" and key in old and old[key]["text"] == ph: PH.append({**old[key], "clip": c["name"]}); continue
        if key in done and done[key]["text"] == ph and done[key].get("v") == 3: PH.append(done[key]); continue
        q = P[c["spk"]]; cands = []; nw = len(ph.split())
        for i in range(6):
            y, sr = gen(spoken, 900 + 37 * i, q["ex"], q["cfg"], q["temp"], REF[c["spk"]]); sc = strict(heard(y, sr), ph); d = len(y) / sr; ok = sc >= 0.97 and clean_edges(y, sr)
            cands.append((ok, -abs(d / nw - q["pace"]), sc, i, y, sr)); print(key, i, round(sc, 3), round(d, 2), "ok" if ok else "-", flush=True)
            if ok and i >= 2: break
        cands.sort(key=lambda z: (z[0], z[1], z[2]), reverse=True); ok, _, sc, i, y, sr = cands[0]
        ta.save(f"{OUT}{key}.wav", torch.tensor(y).unsqueeze(0), sr); rec = {"clip": c["name"], "idx": pi, "text": ph, "ok": bool(ok), "score": round(sc, 3), "file": f"{OUT}{key}.wav", "spk": c["spk"], "v": 3}
        done[key] = rec; PH.append(rec); json.dump(done, open("work/pt3_done.json", "w"), ensure_ascii=False, indent=1)
json.dump(PH, open("work/pt3_phrases.json", "w"), ensure_ascii=False, indent=1); print("DONE", flush=True)
