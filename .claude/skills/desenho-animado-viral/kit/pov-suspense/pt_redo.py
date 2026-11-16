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
OUT = "vozes/ptbr/"; R = {"N": OUT + "ref_N.wav", "E": OUT + "ref_E.wav"}
REDO = json.load(open("work/pt_redo.json"))
TL = [c for c in json.load(open("work/timeline.json"))["clips"] if c["name"] in REDO]; res = json.load(open("work/pt_result.json"))
CFG = {"N": (0.5, 0.5), "E": (0.4, 0.45)}
for c in TL:
    ex, cfg = CFG[c["spk"]]; cands = []
    for i in range(8):
        t1 = time.time(); y, sr = gen(c["text"], 500 + 29 * i, ex, cfg, ref=R[c["spk"]]); d = len(y) / sr; sc = strict(heard(y, sr), c["text"])
        cands.append((sc >= 0.97, -abs(d - c["dur"]) / c["dur"], sc, i, y, sr, d)); print(c["name"], i, round(sc, 3), round(d, 2), "target", c["dur"], round(time.time() - t1), "s", flush=True)
    cands.sort(key=lambda z: (z[0], z[1]), reverse=True); ok, _, sc, i, y, sr, d = cands[0]
    ta.save(f"{OUT}{c['name']}.wav", torch.tensor(y).unsqueeze(0), sr); res[c["name"]] = {"score": round(sc, 3), "dur": round(d, 2), "target": c["dur"], "ok": bool(ok)}
    json.dump(res, open("work/pt_result.json", "w"), indent=1)
print("DONE", flush=True)
