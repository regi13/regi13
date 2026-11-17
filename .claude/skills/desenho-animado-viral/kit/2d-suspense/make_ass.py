import json
clips = json.load(open("work/clips_plan.json")); SH = json.load(open("work/shots.json"))["shots"]; tmap = {s["id"]: s for s in SH}
def ts(t): h = int(t // 3600); m = int(t % 3600 // 60); s = t % 60; return f"{h}:{m:02d}:{s:05.2f}"
STY = {"N": "Narr", "R": "Raf", "C": "Cla", "RAD": "Rad"}
ev = []
for c in clips:
    final = c["shot"] == "final"
    for ph in c["phrases"]:
        words = ph["text"].split(); chunks = []; cur = []
        for w in words:
            if cur and len(" ".join(cur + [w])) > 22: chunks.append(cur); cur = [w]
            else: cur.append(w)
        if cur: chunks.append(cur)
        tl = sum(len(" ".join(w)) for w in chunks); t = ph["start"]; end_all = ph["end"] + 0.15; pos = r"{\an2\pos(540,1840)}" if final or c["shot"] == "celular" else ""
        for w in chunks:
            d = (end_all - ph["start"]) * len(" ".join(w)) / tl; ev.append(f"Dialogue: 0,{ts(t)},{ts(t + d)},{STY[c['spk']]},,0,0,0,,{pos}{' '.join(w)}"); t += d
hdr = """[Script Info]
ScriptType: v4.00+
PlayResX: 1080
PlayResY: 1920
WrapStyle: 2

[V4+ Styles]
Format: Name,Fontname,Fontsize,PrimaryColour,SecondaryColour,OutlineColour,BackColour,Bold,Italic,Underline,StrikeOut,ScaleX,ScaleY,Spacing,Angle,BorderStyle,Outline,Shadow,Alignment,MarginL,MarginR,MarginV,Encoding
Style: Narr,DejaVu Sans,68,&H00FFFFFF,&H000000FF,&H00101010,&H80000000,-1,0,0,0,100,100,0,0,1,7,2,2,50,50,250,1
Style: Raf,DejaVu Sans,64,&H00FFE14D,&H000000FF,&H00101010,&H80000000,-1,-1,0,0,100,100,0,0,1,6,2,2,50,50,250,1
Style: Cla,DejaVu Sans,68,&H0020B0FF,&H000000FF,&H00101010,&H80000000,-1,0,0,0,100,100,0,0,1,7,2,2,50,50,250,1
Style: Rad,DejaVu Sans,70,&H003B30FF,&H000000FF,&H00101010,&H80000000,-1,0,0,0,100,100,0,0,1,7,2,2,50,50,250,1

[Events]
Format: Layer,Start,End,Style,Name,MarginL,MarginR,MarginV,Effect,Text
"""
open("legendas.ass", "w").write(hdr + "\n".join(ev) + "\n"); print(len(ev), "legendas")
