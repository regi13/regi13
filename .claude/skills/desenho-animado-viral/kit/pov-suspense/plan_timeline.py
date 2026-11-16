"""Linha do tempo guiada pelo áudio: estica cada grupo de planos o suficiente para a fala caber (sem acelerar a voz > 1,1x)."""
import json
TEMPO = {"N": 1.10, "E": 1.10}
R = json.load(open("work/qw_result.json")); S = {s["name"]: s for s in json.load(open("work/roteiro_v3.json"))}
dur = lambda n: R[n]["dur"] / TEMPO[S[n]["spk"]]
# (a_old, b_old, lead_old, [(linha, folga_antes)], tail)
G = [(0, 5.9, 0.5, ["n1"]), (5.9, 7.9, 0.1, ["e1"]), (7.9, 16.9, 0.1, ["n2"]), (16.9, 19.9, 0.2, ["e2"]), (19.9, 23.4, 0.0, ["e3"]),
     (23.4, 29.5, 0.15, ["n3", "e4"]), (29.5, 36.6, 0.3, ["n4"]), (36.6, 47.4, 0.4, ["e5", "n5", "e6"]), (47.4, 53.8, 0.3, ["n6"]),
     (53.8, 58.6, 0.4, ["e7"]), (58.6, 66.1, 2.4, ["n7"]), (66.1, 70.0, 0.2, ["e8"]), (70.0, 72.6, 0.1, ["n8"]), (72.6, 77.0, 0.1, ["e9"]),
     (77.0, 83.6, 0.2, ["e10", "n9"]), (83.6, 89.0, 0.3, ["n10"])]
GAP = 0.5; TAIL = 0.3
MAP = [[0.0, 0.0]]; clips = []; A = 0.0
for a, b, lead, names in G:
    Lold = b - a; Sd = sum(dur(n) for n in names) + GAP * (len(names) - 1) + TAIL
    r = max(1.0, Sd / max(Lold - lead, 0.5)) if lead < Lold else 1.0
    Ln = Lold * r; t = A + lead * r
    for n in names:
        clips.append({"name": n, "start": round(t, 3), "dur": round(dur(n), 3), "spk": S[n]["spk"], "text": S[n]["text"], "tempo": TEMPO[S[n]["spk"]]}); t += dur(n) + GAP
    A += Ln; MAP.append([b, round(A, 3)])
# interior anchors are linear inside each group; keep every group boundary
json.dump({"map": MAP, "total": round(A, 3), "clips": clips}, open("work/timeline.json", "w"), indent=1, ensure_ascii=False)
open("web/tmap.js", "w").write("export const MAP = " + json.dumps(MAP) + ";\nexport const NEW_TOTAL = " + str(round(A, 3)) + ";\n")
print("total", round(A, 1), "s;", round(A * 30), "quadros")
for c in clips: print(c["name"], c["start"], "+", c["dur"], "=", round(c["start"] + c["dur"], 1))
