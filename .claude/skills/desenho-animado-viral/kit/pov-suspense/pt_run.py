"""Chatterbox pt-BR (FearL0rd): refs fixas (narrador/pensamento) + todas as falas, 4 tomadas, conferência palavra por palavra por ASR."""
import json, re, time, difflib, unicodedata, torch, torchaudio as ta, numpy as np, librosa
from huggingface_hub import snapshot_download
from chatterbox.tts import ChatterboxTTS
from faster_whisper import WhisperModel
torch.set_num_threads(4)
m = ChatterboxTTS.from_local(snapshot_download("FearL0rd/Chatterbox-TTS-Portuguese"), device="cpu")
asr = WhisperModel("small", device="cpu", compute_type="int8", cpu_threads=4)
norm = lambda s: re.sub(r"[^a-z0-9 ]", "", unicodedata.normalize("NFD", s.lower()).encode("ascii", "ignore").decode()).strip()
def heard(y, sr):
    a = librosa.resample(y.astype(np.float32), orig_sr=sr, target_sr=16000); seg, _ = asr.transcribe(a, language="pt", beam_size=5); return " ".join(s.text for s in seg)
def f0(y, sr):
    a = librosa.resample(y.astype(np.float32), orig_sr=sr, target_sr=16000); v = librosa.yin(a, fmin=60, fmax=350, sr=16000); v = v[(v > 65) & (v < 340)]; return float(np.median(v)) if len(v) else 0
def strict(h, t):
    th, tt = norm(h).split(), norm(t).split(); miss = [w for w in tt if not any(difflib.SequenceMatcher(None, w, x).ratio() >= 0.84 for x in th)]
    return difflib.SequenceMatcher(None, " ".join(th), " ".join(tt)).ratio() - 0.15 * len(miss)
def gen(text, seed, ex, cfg, ref=None, temp=0.75):
    torch.manual_seed(seed); kw = dict(exaggeration=ex, cfg_weight=cfg, temperature=temp)
    if ref: kw["audio_prompt_path"] = ref
    w = m.generate(text, **kw); return w.squeeze().numpy(), m.sr
OUT = "vozes/ptbr/"; R = {}
REF = {"N": ("A mãe sai para o mercado. Pede: tranque a porta.", 0.5, 0.5, (100, 140)),
       "E": ("Calma. Foi o disjuntor, né? Respira baixinho.", 0.4, 0.45, (125, 175))}
for k, (txt, ex, cfg, (lo, hi)) in REF.items():
    best = None
    for sd in range(1, 13):
        y, sr = gen(txt, sd, ex, cfg); sc = strict(heard(y, sr), txt); fz = f0(y, sr); ok = lo <= fz <= hi
        print("ref", k, sd, round(sc, 3), round(fz), "Hz", "ok" if ok else "-", flush=True)
        key = (ok and sc >= 0.95, sc)
        if best is None or key > best[0]: best = (key, y, sr, fz)
    ta.save(f"{OUT}ref_{k}.wav", torch.tensor(best[1]).unsqueeze(0), best[2]); R[k] = f"{OUT}ref_{k}.wav"; print("REF", k, "F0", round(best[3]), flush=True)
TL = json.load(open("work/timeline.json"))["clips"]; res = {}
CFG = {"N": (0.5, 0.5), "E": (0.4, 0.45)}
for c in TL:
    ex, cfg = CFG[c["spk"]]; cands = []
    for i in range(4):
        t1 = time.time(); y, sr = gen(c["text"], 100 + 13 * i, ex, cfg, ref=R[c["spk"]]); d = len(y) / sr; sc = strict(heard(y, sr), c["text"])
        cands.append((sc >= 0.97, -abs(d - c["dur"]) / c["dur"], sc, i, y, sr, d)); print(c["name"], i, round(sc, 3), round(d, 2), "target", c["dur"], round(time.time() - t1), "s", flush=True)
    cands.sort(key=lambda z: (z[0], z[1]), reverse=True); ok, _, sc, i, y, sr, d = cands[0]
    ta.save(f"{OUT}{c['name']}.wav", torch.tensor(y).unsqueeze(0), sr); res[c["name"]] = {"score": round(sc, 3), "dur": round(d, 2), "target": c["dur"], "ok": bool(ok)}
    json.dump(res, open("work/pt_result.json", "w"), indent=1)
print("DONE", flush=True)
