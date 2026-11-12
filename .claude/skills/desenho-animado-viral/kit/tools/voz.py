"""Narração grátis em português do Brasil (Kokoro, roda offline depois do primeiro download).
uso:  python3 voz.py roteiro.txt voice.wav [--voz pm_alex|pm_santa|pf_dora] [--vel 1.0] [--fit work/phrases.json]
- As 3 vozes pt-BR vêm no kit (vozes_ptbr.npz). O modelo (~92 MB) vem do npm, que já é liberado por padrão
  no Claude (pacote kokoro-q8-shards@1.0.0, conferido por sha256). Reserva: GitHub.
- Corrige vícios de pronúncia de Portugal do espeak (vogal extra em "porta/forno", "a" final, r de "cobrou/pronto",
  r final de "cheirar/por").
- --fit encaixa cada frase no tempo de uma narração anterior (troca a voz sem precisar renderizar de novo)."""
import os, re, sys, json, glob, hashlib, shutil, subprocess, tempfile, urllib.request
HERE = os.path.dirname(os.path.abspath(__file__))
CACHE = os.path.expanduser("~/.cache/kokoro-ptbr")
MODEL = os.path.join(CACHE, "model.onnx")
SHA = "fbae9257e1e05ffc727e951ef9b9c98418e6d79f1c9b6b13bd59f5c9028a1478"
GH = "https://github.com/thewh1teagle/kokoro-onnx/releases/download/model-files-v1.0/kokoro-v1.0.int8.onnx"
def sha(p):
    h = hashlib.sha256()
    with open(p, "rb") as f:
        for b in iter(lambda: f.read(1 << 20), b""): h.update(b)
    return h.hexdigest()
def get_model():
    if os.path.exists(MODEL) and os.path.getsize(MODEL) > 1_000_000: return
    os.makedirs(CACHE, exist_ok=True); tmp = tempfile.mkdtemp()
    print("baixando o modelo de voz pelo npm (~92 MB)...", flush=True)
    r = subprocess.run(["npm", "pack", "kokoro-q8-shards@1.0.0", "--silent"], cwd=tmp, capture_output=True, text=True)
    tgz = glob.glob(os.path.join(tmp, "*.tgz"))
    if r.returncode == 0 and tgz:
        subprocess.run(["tar", "xzf", tgz[0]], cwd=tmp, check=True)
        with open(MODEL + ".part", "wb") as out:
            for i in range(6):
                with open(os.path.join(tmp, "package", f"kokoro-q8.part{i}.bin"), "rb") as f: shutil.copyfileobj(f, out)
        if sha(MODEL + ".part") == SHA: os.replace(MODEL + ".part", MODEL); shutil.rmtree(tmp, True); return
        print("arquivo do npm não confere (sha256); tentando o GitHub...")
    try:
        urllib.request.urlretrieve(GH, MODEL + ".part"); os.replace(MODEL + ".part", MODEL)
    except Exception as e:
        sys.exit(f"Não consegui baixar o modelo de voz ({e}).\nConfira se 'Permitir acesso de rede externo' está ligado nas "
                 "configurações do Claude, ou gere a narração em outra ferramenta (ElevenLabs, Higgsfield...) e envie o arquivo.")
def deps():
    try: import kokoro_onnx, soundfile  # noqa
    except ImportError:
        cmd = [sys.executable, "-m", "pip", "install", "-q", "kokoro-onnx", "soundfile"]
        if subprocess.run(cmd + ["--break-system-packages"]).returncode: subprocess.run(cmd, check=True)
    get_model()
V = "aeiouɐɛɔɪʊɨõãẽĩũ̃"
def br(ph):
    ph = ph.replace("æ", "ɐ").replace("y", "ɪ").replace("r", "ɾ")
    ph = re.sub(r"ɾə(?=[^\s" + V + r"ˈˌ,.!?;:])", "h", ph)      # porta, forno: sem vogal extra; r de coda = [h]
    ph = re.sub(r"(?<=[" + V + r"])ɾ(?=[\s,.!?;:]|$)", "h", ph)  # r final: cheirar, por
    return ph.replace("ə", "")
def main():
    a = sys.argv[1:]
    opt = lambda k, d=None: (a.pop(a.index(k) + 1), a.remove(k))[0] if k in a else d
    voice, speed, fit = opt("--voz", "pm_alex"), float(opt("--vel", "1.0")), opt("--fit")
    txt, out = a[0], a[1]
    deps()
    import numpy as np, soundfile as sf
    from kokoro_onnx import Kokoro
    k = Kokoro(MODEL, os.path.join(HERE, "vozes_ptbr.npz")); sr = 24000
    F = json.load(open(fit)) if fit else None
    phrases = [p["text"] for p in F["phrases"]] if F else \
        [s for line in open(txt, encoding="utf-8").read().split("\n") for s in re.split(r"(?<=[.!?])\s+", line.strip()) if s]
    clips = []
    for t in phrases:
        y, sr = k.create(br(k.tokenizer.phonemize(t, "pt-br")), voice=voice, speed=speed, is_phonemes=True)
        nz = np.where(np.abs(y) > 0.01)[0]
        clips.append((y[max(0, nz[0] - 240): nz[-1] + 480] if len(nz) else y).astype(np.float32))
    if not F:
        gap = np.zeros(int(sr * 0.38), np.float32); parts = [np.zeros(int(sr * 0.12), np.float32)]
        for i, c in enumerate(clips): parts += [c] + ([gap] if i < len(clips) - 1 else [])
        y = np.concatenate(parts + [np.zeros(int(sr * 0.3), np.float32)])
    else:
        y = np.zeros(int(F["duration"] * sr), np.float32); tmp = tempfile.mkdtemp()
        for p, c in zip(F["phrases"], clips):
            r = (len(c) / sr) / (p["e"] - p["s"]); f = []
            while r > 2: f.append("atempo=2"); r /= 2
            while r < 0.5: f.append("atempo=0.5"); r /= 0.5
            f.append(f"atempo={r:.5f}"); sf.write(tmp + "/i.wav", c, sr)
            subprocess.run(["ffmpeg", "-v", "error", "-y", "-i", tmp + "/i.wav", "-af", ",".join(f), tmp + "/o.wav"], check=True)
            z, _ = sf.read(tmp + "/o.wav", dtype="float32"); i0 = int(p["s"] * sr); z = z[: len(y) - i0]; y[i0: i0 + len(z)] += z
    sf.write(out, y, sr)
    w = sum(len(t.split()) for t in phrases)
    print(f"{out}: {len(y) / sr:.1f} s, {w} palavras ({w / (len(y) / sr):.2f} palavras/s), voz {voice}")
main()
