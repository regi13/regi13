"""Entonação + pontuação: exagera o contorno de F0 (Praat/PSOLA), cai no ponto, sobe na interrogação, sobe levemente antes da vírgula, alonga um pouco o ritmo e INSERE pausas nas vírgulas/dois-pontos (alinhadas por ASR)."""
import json, re, sys, difflib, unicodedata, numpy as np, librosa, soundfile as sf, parselmouth
from parselmouth.praat import call
from faster_whisper import WhisperModel
asr = WhisperModel("small", device="cpu", compute_type="int8", cpu_threads=4)
CFG = {"N": dict(rng=(70, 260), exp=1.5, stretch=1.12, fall=0.86, rise=1.2, cont=1.07), "R": dict(rng=(80, 320), exp=1.4, stretch=1.05, fall=0.88, rise=1.22, cont=1.07), "C": dict(rng=(70, 260), exp=1.3, stretch=1.08, fall=0.86, rise=1.18, cont=1.05)}
CFG["RAD"] = CFG["R"]; PAUSE = {",": 0.30, ":": 0.42, ";": 0.4}
def nz(w): return re.sub(r"[^a-z0-9]", "", unicodedata.normalize("NFD", w.lower()).encode("ascii", "ignore").decode())
def shape(y, sr, text, spk, words_t):
    c = CFG[spk]; snd = parselmouth.Sound(y.astype(np.float64), sampling_frequency=sr)
    man = call(snd, "To Manipulation", 0.01, c["rng"][0], c["rng"][1]); pt = call(man, "Extract pitch tier"); n = call(pt, "Get number of points")
    if n < 8: return y, 0
    T = np.array([call(pt, "Get time from index", i + 1) for i in range(n)]); V = np.array([call(pt, "Get value at index", i + 1) for i in range(n)])
    med = float(np.median(V)); V2 = med * (V / med) ** c["exp"]; dur = len(y) / sr; end_t = T[-1]
    kind = "?" if text.rstrip().endswith("?") else ("." if text.rstrip()[-1:] in ".!" else "c")
    for i, t in enumerate(T):
        d = end_t - t
        if d < 0.4:
            k = 1 - d / 0.4
            V2[i] *= (1 + (c["rise"] - 1) * k ** 1.5) if kind == "?" else ((1 + (c["fall"] - 1) * k ** 1.3) if kind == "." else (1 + (c["cont"] - 1) * k))
        for wt in words_t:
            if 0 <= wt - t < 0.28: V2[i] *= 1 + (c["cont"] - 1) * (1 - (wt - t) / 0.28)   # sobe antes da vírgula
    V2 = np.clip(V2, med * 0.6, med * 1.8)
    new = call("Create PitchTier", "p", 0, dur)
    for t, v in zip(T, V2): call(new, "Add point", float(t), float(v))
    call([man, new], "Replace pitch tier")
    dt = call("Create DurationTier", "d", 0, dur); call(dt, "Add point", 0.0, c["stretch"]); call(dt, "Add point", dur, c["stretch"]); call([man, dt], "Replace duration tier")
    out = call(man, "Get resynthesis (overlap-add)").values[0].astype(np.float32)
    return out, c["stretch"]
def okasr(out, sr, text):
    a = librosa.resample(out, orig_sr=sr, target_sr=16000); seg, _ = asr.transcribe(a, language="pt", beam_size=5); h = [nz(w) for w in " ".join(x.text for x in seg).split()]
    t = [nz(re.sub(r"duas e (catorze|quarenta e um)|trinta", "", text, flags=re.I)).strip() for _ in [0]][0]
    tw = [nz(w) for w in re.sub(r"duas e (catorze|quarenta e um)|trinta", "", text, flags=re.I).split() if nz(w)]
    return all(any(difflib.SequenceMatcher(None, w, x).ratio() >= 0.8 for x in h) or w in ("a", "e", "o") for w in tw)
def process(p):
    base = dict(CFG[p["spk"]]); 
    for scale in (1.0, 0.6, 0.0):
        CFG[p["spk"]]["exp"] = 1 + (base["exp"] - 1) * scale
        out, sr = process1(p)
        if okasr(out, sr, p["text"]): break
    CFG[p["spk"]].update(base); p["_scale"] = scale; return out, sr
def process1(p):
    y, sr = sf.read(p["file"], dtype="float32"); y = y if y.ndim == 1 else y[:, 0]; text = p["text"]; spk = p["spk"]
    a = librosa.resample(y, orig_sr=sr, target_sr=16000); seg, _ = asr.transcribe(a, language="pt", word_timestamps=True, beam_size=5)
    aw = [(nz(w.word), w.start, w.end) for s in seg for w in s.words if nz(w.word)]; tw = text.split(); sm = difflib.SequenceMatcher(None, [nz(w) for w in tw], [x[0] for x in aw]); pts = []
    for i, j, nn in sm.get_matching_blocks():
        for k in range(nn):
            ch = tw[i + k][-1]
            if ch in PAUSE and i + k < len(tw) - 1: pts.append((aw[j + k][2], PAUSE[ch]))
    out, st = shape(y, sr, text, spk, [t for t, _ in pts])
    if st:
        pts = [(t * st, g) for t, g in pts]; pieces = []; last = 0; rng = np.random.default_rng(3)
        for t, g in sorted(pts):
            i = min(len(out), int(t * sr)); pieces.append(out[last:i]); pieces.append((0.0007 * rng.standard_normal(int(g * sr))).astype(np.float32)); last = i
        pieces.append(out[last:]); out = np.concatenate(pieces)
    return out, sr
if __name__ == "__main__":
    import os
    PH = json.load(open("work/p4_phrases.json")); os.makedirs("vozes/p5", exist_ok=True); res = []
    only = sys.argv[1] if len(sys.argv) > 1 else None
    for p in PH:
        if only and p["clip"] != only: continue
        out, sr = process(p); f = p["file"].replace("p4", "p5"); sf.write(f, out, sr)
        f0a = librosa.yin(sf.read(p["file"], dtype="float32")[0], fmin=60, fmax=400, sr=sr); f0b = librosa.yin(out, fmin=60, fmax=400, sr=sr)
        print(p["clip"], p["idx"], "F0 std %.0f -> %.0f Hz" % (np.std(f0a), np.std(f0b)), "dur %.2f -> %.2f" % (len(sf.read(p["file"])[0]) / sr, len(out) / sr), flush=True)
        res.append({**p, "file": f})
    if not only: json.dump(res, open("work/p5_phrases.json", "w"), ensure_ascii=False, indent=1)
