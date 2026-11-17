"""9 candidatas (3 por personagem): referências derivadas (tom/timbre diferentes) + geração com referência (estável) + ASR palavra por palavra."""
import json, re, difflib, unicodedata, subprocess, torch, torchaudio as ta, numpy as np, librosa, soundfile as sf
from huggingface_hub import snapshot_download
from chatterbox.tts import ChatterboxTTS
from faster_whisper import WhisperModel
torch.set_num_threads(4)
m = ChatterboxTTS.from_local(snapshot_download("FearL0rd/Chatterbox-TTS-Portuguese"), device="cpu")
asr = WhisperModel("small", device="cpu", compute_type="int8", cpu_threads=4)
norm = lambda s: re.sub(r"[^a-z0-9 ]", "", unicodedata.normalize("NFD", s.lower()).encode("ascii", "ignore").decode()).strip().replace("20", "vinte")
def heard(y, sr):
    a = librosa.resample(y.astype(np.float32), orig_sr=sr, target_sr=16000); seg, _ = asr.transcribe(a, language="pt", beam_size=5); return " ".join(s.text for s in seg)
def strict(h, t):
    th, tt = norm(h).split(), norm(t).split(); miss = [w for w in tt if not any(difflib.SequenceMatcher(None, w, x).ratio() >= 0.84 for x in th)]
    return difflib.SequenceMatcher(None, " ".join(th), " ".join(tt)).ratio() - 0.2 * len(miss)
def f0(y, sr):
    a = librosa.resample(y.astype(np.float32), orig_sr=sr, target_sr=16000); v = librosa.yin(a, fmin=60, fmax=350, sr=16000); v = v[(v > 65) & (v < 340)]; return float(np.median(v)) if len(v) else 0
def shift(src, dst, pitch, formant=0):
    subprocess.run(["ffmpeg", "-v", "error", "-y", "-i", src, "-af", f"rubberband=pitch={pitch}:formant={formant}:pitchq=1", "-ar", "24000", "-ac", "1", dst], check=True)
TXT = {"N": "Primeiro plantão do Rafael. Prédio vazio. Cinco regras numa folha.", "R": "Cinco regras pra vigiar um prédio? Tá bom.", "C": "Regra um. Às duas da manhã, o elevador do sétimo andar chama sozinho. Não entre."}
# (id, base, pitch, formant, exaggeration, cfg, descrição)
V = [("N1", "N", 1.00, 0, 0.75, 0.45, "grave, lento, cúmplice"), ("N2", "N", 0.90, 0, 0.8, 0.4, "mais fundo, sombrio"), ("N3", "N", 1.07, 0, 0.7, 0.5, "mais claro, jornalístico"),
     ("R1", "E", 1.12, 0, 0.6, 0.5, "jovem, natural"), ("R2", "E", 1.22, 0, 0.65, 0.5, "mais agudo, ansioso"), ("R3", "E", 1.05, 0, 0.55, 0.5, "moleque, debochado"),
     ("C1", "N", 0.86, 0, 0.5, 0.5, "velho, seco, grave"), ("C2", "N", 0.80, 0, 0.45, 0.55, "muito grave, áspero"), ("C3", "N", 0.93, 0, 0.5, 0.5, "mais firme, supervisor")]
res = []
for vid, base, pit, form, ex, cfg, desc in V:
    ref = f"vozes/cand/ref_{vid}.wav"; shift(f"vozes/ref_base_{base}.wav", ref, pit, form); k = vid[0]; best = None
    for sd in range(4):
        torch.manual_seed(100 + sd * 13); w = m.generate(TXT[k], exaggeration=ex, cfg_weight=cfg, temperature=0.7, audio_prompt_path=ref).squeeze().numpy(); sr = m.sr
        sc = strict(heard(w, sr), TXT[k]); fz = f0(w, sr); print(vid, sd, round(sc, 3), round(fz), "Hz", flush=True)
        if best is None or sc > best[0]: best = (sc, w, sr, fz)
        if sc >= 0.97: break
    sf.write(f"vozes/cand/{vid}_raw.wav", best[1], best[2]); res.append({"id": vid, "desc": desc, "f0": round(best[3]), "score": round(best[0], 3), "ex": ex, "cfg": cfg, "pitch": pit})
    json.dump(res, open("work/cand.json", "w"), ensure_ascii=False, indent=1)
print("DONE", flush=True)
