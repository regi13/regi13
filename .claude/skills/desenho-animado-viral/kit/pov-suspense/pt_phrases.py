"""Narração profissional: cada FRASE é gerada à parte (entonação do ponto/interrogação) e montada depois com pausas dramáticas.
Seleção por tomada: ASR palavra por palavra + sem corte no início/fim + ritmo natural."""
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
def strict(h, t):
    th, tt = norm(h).split(), norm(t).split(); miss = [w for w in tt if not any(difflib.SequenceMatcher(None, w, x).ratio() >= 0.86 for x in th)]
    extra = max(0, len(th) - len(tt)); return difflib.SequenceMatcher(None, " ".join(th), " ".join(tt)).ratio() - 0.2 * len(miss) - 0.1 * extra
def clean_edges(y, sr):
    n = int(0.12 * sr); e = np.abs(y); mx = e.max() + 1e-9
    return (e[-n:].mean() / mx < 0.12) and (e[: int(0.03 * sr)].mean() / mx < 0.2)
def split(text):
    parts = re.findall(r"[^.?!:;…]+(?:\.\.\.|[.?!:;…])?|[^.?!:;…]+$", text); out = []
    for p in parts:
        p = p.strip()
        if not p: continue
        ws = p.split()
        if len(ws) >= 7 and "," in p:   # long phrase: breathe at the comma nearest the middle
            idx = [i for i, w in enumerate(ws[:-2]) if w.endswith(",") and i >= 2]
            if idx:
                k = min(idx, key=lambda i: abs(i - len(ws) / 2)); out += [" ".join(ws[: k + 1]), " ".join(ws[k + 1:])]; continue
        out.append(p)
    merged = []; i = 0
    while i < len(out):
        if len(out[i].split()) == 1 and i + 1 < len(out): merged.append(out[i] + " " + out[i + 1]); i += 2
        else: merged.append(out[i]); i += 1
    return merged
OUT = "vozes/pt2/"; REF = {"N": "vozes/ptbr/ref_N.wav", "E": "vozes/ptbr/ref_E.wav"}; CFG = {"N": (0.5, 0.5), "E": (0.4, 0.45)}; PACE = {"N": 0.40, "E": 0.44}
TL = json.load(open("work/timeline.json"))["clips"]; PH = []; done = {}
try: done = json.load(open("work/pt2_done.json"))
except Exception: pass
def gen(text, seed, ex, cfg, ref):
    torch.manual_seed(seed); w = m.generate(text, exaggeration=ex, cfg_weight=cfg, temperature=0.7, audio_prompt_path=ref); return w.squeeze().numpy(), m.sr
for c in TL:
    for pi, ph in enumerate(split(c["text"])):
        key = f"{c['name']}_{pi}"; spoken = ph.replace(":", ",") if ph.endswith(":") else ph
        if key in done and done[key]["text"] == ph: PH.append(done[key]); continue
        ex, cfg = CFG[c["spk"]]; cands = []; nw = len(ph.split())
        for i in range(6):
            y, sr = gen(spoken, 700 + 31 * i, ex, cfg, REF[c["spk"]]); sc = strict(heard(y, sr), ph); d = len(y) / sr; ok = sc >= 0.97 and clean_edges(y, sr)
            cands.append((ok, -abs(d / nw - PACE[c["spk"]]), sc, i, y, sr)); print(key, i, round(sc, 3), round(d, 2), "ok" if ok else "-", flush=True)
            if ok and i >= 2: break
        cands.sort(key=lambda z: (z[0], z[1], z[2]), reverse=True); ok, _, sc, i, y, sr = cands[0]
        ta.save(f"{OUT}{key}.wav", torch.tensor(y).unsqueeze(0), sr); rec = {"clip": c["name"], "idx": pi, "text": ph, "ok": bool(ok), "score": round(sc, 3), "file": f"{OUT}{key}.wav", "spk": c["spk"]}
        done[key] = rec; PH.append(rec); json.dump(done, open("work/pt2_done.json", "w"), ensure_ascii=False, indent=1)
json.dump(PH, open("work/pt2_phrases.json", "w"), ensure_ascii=False, indent=1); print("DONE", flush=True)
