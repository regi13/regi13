"""Frases com edge-tts (vozes neurais Microsoft) -> vozes/p5/*.wav + work/p5_phrases.json (mesmo formato do build_voice7)."""
import asyncio, json, os, re, subprocess, difflib, unicodedata, numpy as np, librosa, edge_tts
from faster_whisper import WhisperModel
V = {"N": ("en-US-BrianMultilingualNeural", "+0Hz", "-8%"), "R": ("pt-BR-AntonioNeural", "+8Hz", "+6%"), "C": ("pt-BR-AntonioNeural", "-3Hz", "-4%"), "RAD": ("pt-BR-AntonioNeural", "+8Hz", "+6%")}
PROXY = os.environ.get("HTTPS_PROXY")
asr = WhisperModel("small", device="cpu", compute_type="int8", cpu_threads=4)
NUM = {"1": "um", "2": "dois", "3": "tres", "4": "quatro", "30": "trinta"}
def norm(s):
    s = re.sub(r"\b\d{1,2}h\d{0,2}\b", " ", s); s = re.sub(r"(?i)duas e (catorze|quarenta e um)", " ", s)
    s = unicodedata.normalize("NFD", s.lower()).encode("ascii", "ignore").decode(); return " ".join(NUM.get(w, w) for w in re.sub(r"[^a-z0-9 ]", " ", s).split())
def okasr(y, text):
    seg, _ = asr.transcribe(y, language="pt", beam_size=5); h = norm(" ".join(x.text for x in seg)).split(); t = norm(text).split()
    miss = [w for w in t if w not in ("a", "e", "o") and not any(difflib.SequenceMatcher(None, w, x).ratio() >= 0.8 for x in h)]
    return not miss, miss
def split(text):
    parts = [p.strip() for p in re.findall(r"[^.?!:;…]+(?:\.\.\.|[.?!:;…])?|[^.?!:;…]+$", text) if p.strip()]; out = []; i = 0
    while i < len(parts):
        if len(parts[i].split()) <= 2 and i + 1 < len(parts): out.append(parts[i] + " " + parts[i + 1]); i += 2
        else: out.append(parts[i]); i += 1
    return out
async def one(text, spk, f):
    v, p, r = V[spk]; await edge_tts.Communicate(text.replace(":", ","), v, rate=r, pitch=p, proxy=PROXY).save(f)
async def main():
    os.makedirs("vozes/p5", exist_ok=True); S = json.load(open("work/script_v5.json")); res = []
    for c in S:
        for i, ph in enumerate(split(c["text"])):
            mp3 = f"vozes/p5/{c['name']}_{i}.mp3"; wav = mp3[:-4] + ".wav"
            await one(ph, c["spk"], mp3); subprocess.run(["ffmpeg", "-v", "error", "-y", "-i", mp3, "-ac", "1", "-ar", "24000", wav], check=True)
            y, _ = librosa.load(wav, sr=16000); ok, miss = okasr(y, ph); print(c["name"], i, "ok" if ok else f"FALTA {miss}", ph, flush=True)
            res.append({"clip": c["name"], "idx": i, "text": ph, "ok": ok, "score": 1.0 if ok else 0.5, "file": wav, "spk": c["spk"]})
    json.dump(res, open("work/p5_phrases.json", "w"), ensure_ascii=False, indent=1)
asyncio.run(main())
