"""Todas as falas do 'Plantão das Cinco Regras' com as vozes escolhidas (N2, R3, C1), frase a frase, ASR palavra por palavra."""
import json, re, time, difflib, unicodedata, torch, torchaudio as ta, numpy as np, librosa
from huggingface_hub import snapshot_download
from f5_tts.api import F5TTS
from faster_whisper import WhisperModel
torch.set_num_threads(4)
from huggingface_hub import hf_hub_download
m = F5TTS(model="F5TTS_Base", ckpt_file=hf_hub_download("firstpixel/F5-TTS-pt-br", "pt-br/model_last.safetensors"), device="cpu")
asr = WhisperModel("small", device="cpu", compute_type="int8", cpu_threads=4)
NUM = {"1": "um", "2": "dois", "3": "tres", "4": "quatro", "5": "cinco", "6": "seis", "7": "sete", "8": "oito", "9": "nove", "10": "dez", "20": "vinte", "30": "trinta"}
def norm(s):
    s = re.sub(r"\b\d{1,2}h\d{0,2}\b", " ", s); s = re.sub(r"(?i)duas e (catorze|quarenta e um)", " ", s)
    s = unicodedata.normalize("NFD", s.lower()).encode("ascii", "ignore").decode(); s = re.sub(r"(\d+)o\b", r"\1", s)
    return " ".join(NUM.get(w, w) for w in re.sub(r"[^a-z0-9 ]", " ", s).split())
def heard(y, sr):
    a = librosa.resample(y.astype(np.float32), orig_sr=sr, target_sr=16000); seg, _ = asr.transcribe(a, language="pt", beam_size=5); return " ".join(s.text for s in seg)
def strict(h, t):
    th, tt = norm(h).split(), norm(t).split(); miss = [w for w in tt if not any(difflib.SequenceMatcher(None, w, x).ratio() >= 0.86 for x in th)]
    return difflib.SequenceMatcher(None, " ".join(th), " ".join(tt)).ratio() - 0.2 * len(miss) - 0.1 * max(0, len(th) - len(tt))
def clean_edges(y, sr):
    n = int(0.12 * sr); e = np.abs(y); mx = e.max() + 1e-9; return (e[-n:].mean() / mx < 0.12) and (e[: int(0.03 * sr)].mean() / mx < 0.2)
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
        if len(out[i].split()) <= 2 and i + 1 < len(out): mg.append(out[i] + " " + out[i + 1]); i += 2
        else: mg.append(out[i]); i += 1
    return mg
REF = {"N": "vozes/cand/ref_N2.wav", "R": "vozes/cand/ref_R3.wav", "C": "vozes/cand/ref_C1.wav", "RAD": "vozes/cand/ref_R3.wav"}
P = {"N": dict(ex=0.8, cfg=0.4, temp=0.65, pace=0.46), "R": dict(ex=0.55, cfg=0.5, temp=0.7, pace=0.42), "C": dict(ex=0.5, cfg=0.5, temp=0.65, pace=0.44), "RAD": dict(ex=0.5, cfg=0.5, temp=0.7, pace=0.5)}
OUT = "vozes/p4/"; S = json.load(open("work/script_v5.json")); done = {}; PH = []
try: done = json.load(open("work/p4_done.json"))
except Exception: pass
REFTXT = {}
def reftext(ref):
    if ref not in REFTXT:
        y, sr = librosa.load(ref, sr=16000); seg, _ = asr.transcribe(y, language="pt", beam_size=5); REFTXT[ref] = " ".join(x.text for x in seg).strip().lower()
    return REFTXT[ref]
SPEEDS = [0.68, 0.62, 0.74, 0.66, 0.58, 0.7]
def gen(text, seed, q, ref):
    i = (seed - 1100) // 41; w, sr, _ = m.infer(ref_file=ref, ref_text=reftext(ref), gen_text=text.lower(), nfe_step=22, speed=SPEEDS[i % 6], seed=seed, remove_silence=False)
    return np.asarray(w, dtype=np.float32), sr
for c in S:
    for pi, ph in enumerate(split(c["text"])):
        key = f"{c['name']}_{pi}"; spoken = ph.replace(":", ",") if ph.endswith(":") else ph
        if key in done and done[key]["text"] == ph: PH.append(done[key]); continue
        q = dict(P[c["spk"]]); 
        pass
        cands = []; nw = len(ph.split())
        for i in range(4):
            y, sr = gen(spoken, 1100 + 41 * i, q, REF[c["spk"]]); sc = strict(heard(y, sr), ph); d = len(y) / sr; ok = sc >= 0.97 and clean_edges(y, sr)
            cands.append((ok, -abs(d / nw - q["pace"]), sc, i, y, sr)); print(key, i, round(sc, 3), round(d, 2), "ok" if ok else "-", flush=True)
            if ok and i >= 1: break
        cands.sort(key=lambda z: (z[0], z[1], z[2]), reverse=True); ok, _, sc, i, y, sr = cands[0]
        ta.save(f"{OUT}{key}.wav", torch.tensor(y).unsqueeze(0), sr)
        rec = {"clip": c["name"], "idx": pi, "text": ph, "ok": bool(ok), "score": round(sc, 3), "file": f"{OUT}{key}.wav", "spk": c["spk"]}
        done[key] = rec; PH.append(rec); json.dump(done, open("work/p4_done.json", "w"), ensure_ascii=False, indent=1)
json.dump(PH, open("work/p4_phrases.json", "w"), ensure_ascii=False, indent=1); print("DONE", flush=True)
