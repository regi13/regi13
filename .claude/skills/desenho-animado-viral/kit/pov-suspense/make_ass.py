import json, re
meta = json.load(open("work/clips.json")); TLJ = json.load(open("work/timeline.json")); MP = TLJ["map"]
def TM(x):
    for (o0, n0), (o1, n1) in zip(MP, MP[1:]):
        if x <= o1: return n0 + (n1 - n0) * (x - o0) / (o1 - o0)
    return MP[-1][1]
PHONE = [(TM(a), TM(b)) for a, b in ((29.5, 36.6), (47.4, 53.8), (70.0, 72.6))]; CARD = (TM(83.6), TM(89.0))
def pos(t):   # captions must never cover the phone chat or the end-card buttons
    if any(a <= t < b for a, b in PHONE): return r"{\an5\pos(540,780)}"
    if CARD[0] <= t < CARD[1]: return r"{\an2\pos(540,1810)}"
    return ""
def ts(t): h = int(t // 3600); m = int(t % 3600 // 60); s = t % 60; return f"{h}:{m:02d}:{s:05.2f}"
STY = {"N": "Narr", "E": "Pens"}
ev = []
for c in meta:
    pieces = [p for p in re.split(r"(?<=\.\.\.)\s+|(?<=[.?!])\s+", c["text"]) if p]
    segs = c["segs"]
    if len(segs) != len(pieces):  # fallback: proportional over the whole clip
        tot = sum(len(p) for p in pieces); t = 0; segs = []
        for p in pieces: d = c["dur"] * len(p) / tot; segs.append([t, t + d]); t += d
    style = STY[c["spk"]]
    for p, (a, b) in zip(pieces, segs):
        words = p.split(); lim = 22; chunks = []; cur = []
        for w_ in words:
            if cur and len(" ".join(cur + [w_])) > lim: chunks.append(cur); cur = [w_]
            else: cur.append(w_)
        if cur: chunks.append(cur)
        tl = sum(len(" ".join(w)) for w in chunks); t = c["start"] + a; end_all = c["start"] + b + 0.15
        for w in chunks:
            d = (end_all - c["start"] - a) * len(" ".join(w)) / tl
            ev.append(f"Dialogue: 0,{ts(t)},{ts(t + d)},{style},,0,0,0,,{pos(t)}{' '.join(w)}"); t += d
hdr = """[Script Info]
ScriptType: v4.00+
PlayResX: 1080
PlayResY: 1920
WrapStyle: 2

[V4+ Styles]
Format: Name,Fontname,Fontsize,PrimaryColour,SecondaryColour,OutlineColour,BackColour,Bold,Italic,Underline,StrikeOut,ScaleX,ScaleY,Spacing,Angle,BorderStyle,Outline,Shadow,Alignment,MarginL,MarginR,MarginV,Encoding
Style: Narr,DejaVu Sans,66,&H00FFFFFF,&H000000FF,&H00101010,&H80000000,-1,0,0,0,100,100,0,0,1,7,2,2,50,50,560,1
Style: Pens,DejaVu Sans,62,&H00FFE14D,&H000000FF,&H00101010,&H80000000,-1,-1,0,0,100,100,0,0,1,6,2,2,50,50,560,1

[Events]
Format: Layer,Start,End,Style,Name,MarginL,MarginR,MarginV,Effect,Text
"""
open("legendas.ass", "w").write(hdr + "\n".join(ev) + "\n"); print(len(ev), "legendas")
