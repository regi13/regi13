"""Qwen3-TTS: 1) desenha 2 vozes fixas (narrador / pensamento) com VoiceDesign; 2) clona as duas com o modelo Base p/ todas as falas (timbre consistente)."""
import sys, json, time, re, difflib, unicodedata, torch, soundfile as sf, numpy as np, librosa
from qwen_tts import Qwen3TTSModel
from faster_whisper import WhisperModel
torch.set_num_threads(4); torch.manual_seed(5)
S = json.load(open("work/roteiro_v3.json")); OUT = "vozes/qw/"
asr = WhisperModel("small", device="cpu", compute_type="int8", cpu_threads=4)
norm = lambda s: re.sub(r"[^a-z0-9 ]", "", unicodedata.normalize("NFD", s.lower()).encode("ascii", "ignore").decode()).strip()
def heard(y, sr):
    a = librosa.resample(y.astype(np.float32), orig_sr=sr, target_sr=16000); seg, _ = asr.transcribe(a, language="pt", beam_size=5); return " ".join(s.text for s in seg).strip()
def score(y, sr, text): return difflib.SequenceMatcher(None, norm(heard(y, sr)), norm(text)).ratio()
DESIGN = {
 "N": ("Voz masculina adulta brasileira, cerca de 40 anos, grave e rouca, narrador de histórias de suspense e terror, fala lenta e controlada, tom baixo e misterioso, pausas dramáticas, dicção clara e muito natural, como um locutor de podcast de true crime.",
       "Naquela noite, o prédio inteiro prendeu a respiração. Ninguém sabia ainda, mas alguém já estava subindo a escada, degrau por degrau, em direção ao sétimo andar."),
 "E": ("Voz masculina jovem brasileira, cerca de 22 anos, sussurrando muito baixo, assustado, respiração curta e trêmula, fala hesitante, íntimo, como quem tem medo de ser ouvido, totalmente natural.",
       "Calma. Foi só o disjuntor, né? Eu só preciso respirar baixinho e não fazer nenhum barulho, porque tem alguém do outro lado da porta."),
}
refs = {k: (f"{OUT}ref_{k}.wav", DESIGN[k][1]) for k in DESIGN}
t0 = time.time(); base = Qwen3TTSModel.from_pretrained("Qwen/Qwen3-TTS-12Hz-1.7B-Base", device_map="cpu", dtype=torch.float32); print("Base ok", round(time.time() - t0), flush=True)
prompts = {k: base.create_voice_clone_prompt(ref_audio=p, ref_text=t) for k, (p, t) in refs.items()}
res = {}
REG = json.load(open("work/regen.json"))
for ln in [x for x in S if x["name"] in REG]:
    cands = []
    for i in range(3):
        t1 = time.time(); wavs, sr = base.generate_voice_clone(text=ln["text"], language="Portuguese", voice_clone_prompt=prompts[ln["spk"]]); y = wavs[0]
        sc = score(y, sr, ln["text"]); cands.append((sc, i, y, sr)); print(ln["name"], i, round(sc, 3), round(len(y) / sr, 1), "s", round(time.time() - t1), "s gen", flush=True)
        if sc >= 0.98: break
    cands.sort(key=lambda c: -c[0]); sc, i, y, sr = cands[0]; sf.write(f"{OUT}{ln['name']}.wav", y, sr); res[ln["name"]] = {"score": round(sc, 3), "dur": round(len(y) / sr, 2)}
    R = json.load(open("work/qw_result.json")); R.update(res); json.dump(R, open("work/qw_result.json", "w"), indent=1)
print("DONE", flush=True)
