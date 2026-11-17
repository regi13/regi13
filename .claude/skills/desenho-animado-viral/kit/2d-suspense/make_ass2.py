"""Legendas palavra a palavra: alinha cada palavra do roteiro ao áudio final (faster-whisper) e destaca a palavra falada."""
import json, re, unicodedata, difflib, subprocess, numpy as np
from faster_whisper import WhisperModel
clips = json.load(open("work/clips_plan.json")); SH = json.load(open("work/shots.json"))["shots"]
asr = WhisperModel("small", device="cpu", compute_type="int8", cpu_threads=4)
raw = subprocess.run(["ffmpeg", "-v", "error", "-i", "voice.wav", "-ac", "1", "-ar", "16000", "-f", "f32le", "-"], capture_output=True).stdout
V = np.frombuffer(raw, np.float32)
def ts(t): h = int(t // 3600); m = int(t % 3600 // 60); s = t % 60; return f"{h}:{m:02d}:{s:05.2f}"
def nz(w): return re.sub(r"[^a-z0-9]", "", unicodedata.normalize("NFD", w.lower()).encode("ascii", "ignore").decode())
STY = {"N": "Narr", "R": "Raf", "C": "Cla", "RAD": "Rad"}; HL = r"{\1c&H0000F0FF&\fscx112\fscy112}"
ev = []
for c in clips:
    final = c["shot"] == "final"; pos = r"{\an2\pos(540,1840)}" if final or c["shot"] == "celular" else ""
    for ph in c["phrases"]:
        words = ph["text"].split(); a0 = max(0, ph["start"] - 0.15); seg = V[int(a0 * 16000): int((ph["end"] + 0.2) * 16000)]
        res, _ = asr.transcribe(seg, language="pt", word_timestamps=True, beam_size=5); aw = [(nz(w.word), w.start + a0, w.end + a0) for s_ in res for w in s_.words if nz(w.word)]
        tw = [nz(w) for w in words]; sm = difflib.SequenceMatcher(None, tw, [x[0] for x in aw]); tm = [None] * len(words)
        for i, j, n in sm.get_matching_blocks():
            for k in range(n): tm[i + k] = (aw[j + k][1], aw[j + k][2])
        # preenche lacunas por interpolação
        L = ph["end"] - ph["start"]
        for i in range(len(words)):
            if tm[i] is None:
                prev = next((tm[k][1] for k in range(i - 1, -1, -1) if tm[k]), ph["start"]); nxt = next((tm[k][0] for k in range(i + 1, len(words)) if tm[k]), ph["end"])
                gaps = [k for k in range(len(words)) if tm[k] is None]; run = [k for k in gaps if prev <= (tm[k][0] if tm[k] else 1e9)]
                n = 1; kk = i
                while kk + 1 < len(words) and tm[kk + 1] is None: n += 1; kk += 1
                back = 0; kk = i
                while kk - 1 >= 0 and tm[kk - 1] is None: back += 1; kk -= 1
                d = (nxt - prev) / (n + back); tm[i] = (prev + back * d, prev + (back + 1) * d)
        chunks = []; cur = []
        for i, w in enumerate(words):
            if cur and len(" ".join(words[k] for k in cur + [i])) > 22: chunks.append(cur); cur = [i]
            else: cur.append(i)
        if cur: chunks.append(cur)
        for ci, ch in enumerate(chunks):
            for n, i in enumerate(ch):
                t0 = tm[i][0] if (n or ci) else ph["start"] - 0.05
                if n == 0 and ci > 0: t0 = tm[i][0]
                t1 = tm[ch[n + 1]][0] if n + 1 < len(ch) else (tm[chunks[ci + 1][0]][0] if ci + 1 < len(chunks) else ph["end"] + 0.18)
                if t1 - t0 < 0.05: t1 = t0 + 0.05
                txt = " ".join((HL + words[k] + r"{\1c\fscx100\fscy100}") if k == i else words[k] for k in ch)
                ev.append(f"Dialogue: 0,{ts(t0)},{ts(t1)},{STY[c['spk']]},,0,0,0,,{pos}{txt}")
hdr = open("legendas.ass").read().split("[Events]")[0]
open("legendas2.ass", "w").write(hdr + "[Events]\nFormat: Layer,Start,End,Style,Name,MarginL,MarginR,MarginV,Effect,Text\n" + "\n".join(ev) + "\n"); print(len(ev), "eventos")
