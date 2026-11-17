import sys, torch, soundfile as sf
from huggingface_hub import hf_hub_download
from f5_tts.api import F5TTS
ck = hf_hub_download("firstpixel/F5-TTS-pt-br", "pt-br/model_last.safetensors")
last = None
for name in ("F5TTS_Base", "F5TTS_v1_Base"):
    try: m = F5TTS(model=name, ckpt_file=ck, device="cpu"); print("loaded", name); last = name; break
    except Exception as e: print("fail", name, str(e)[:300])
if not last: sys.exit(1)
T = {"N": "Primeiro dia do Rafael. Prédio vazio. Seu Cláudio entrega uma folha com cinco regras.", "R": "Cinco regras para vigiar um prédio? Tá bom.", "C": "Regra três. Nunca olhe as câmeras do sétimo andar."}
for k in ("N", "R", "C"):
    ref = {"N": "N2", "R": "R3", "C": "C1"}[k]
    wav, sr, _ = m.infer(ref_file=f"vozes/cand/ref_{ref}.wav", ref_text="", gen_text=T[k].lower(), nfe_step=32, speed=0.9, seed=7)
    sf.write(f"vozes/ab/f5_{k}.wav", wav, sr); print("ok", k, len(wav) / sr)
