"""Gera web/timeline.js a partir das falas: cada fala vira um plano; o corte entra 0,12 s antes da fala e segura até o início do próximo plano.
Uso: python3 plan_cuts.py [work/clips.json]  (sem argumento: usa durações estimadas, só para testar o visual)"""
import json, sys, re
S = json.load(open("work/script_v5.json")); real = None
if len(sys.argv) > 1: real = {c["name"]: c for c in json.load(open(sys.argv[1]))}
t = 0.6; clips = []
for s in S:
    if real:
        c = real[s["name"]]; dur = c["dur"]; ph = c["phrases"]
    else:
        n = len(s["text"].split()); dur = n * 0.42 + 0.5 * len(re.findall(r"[.?!:]", s["text"])); ph = [{"text": s["text"], "start": 0, "end": dur}]
    st = t + s["gap"] if not real else c["start"]
    clips.append({**s, "start": round(st, 3), "dur": round(dur, 3), "phrases": [{"text": p["text"], "start": round((p["start"] if real else st + p["start"]), 3), "end": round((p["end"] if real else st + p["end"]), 3)} for p in ph]})
    t = st + dur
TOTAL = round(t + 1.6, 2); shots = []
for i, c in enumerate(clips):
    a = 0.0 if i == 0 else round(c["start"] - 0.12, 3); b = round(clips[i + 1]["start"] - 0.12, 3) if i + 1 < len(clips) else TOTAL
    shots.append({"id": c["name"], "type": c["shot"], "a": a, "b": b, "rule": c.get("rule"), "spk": c["spk"], "start": c["start"], "end": round(c["start"] + c["dur"], 3), "phrases": c["phrases"]})
talk = {"C": [], "R": [], "RAD": []}
for c in clips:
    if c["spk"] in talk: talk[c["spk"]] += [[p["start"], p["end"]] for p in c["phrases"]]
open("web/timeline.js", "w").write("export const SHOTS = " + json.dumps(shots, ensure_ascii=False) + ";\nexport const TALK = " + json.dumps(talk) + ";\nexport const TOTAL = " + str(TOTAL) + ";\n")
json.dump(clips, open("work/clips_plan.json", "w"), ensure_ascii=False, indent=1); json.dump({"total": TOTAL, "shots": shots}, open("work/shots.json", "w"), ensure_ascii=False, indent=1); print("total", TOTAL, "s", round(TOTAL * 30), "quadros;", len(shots), "planos")
