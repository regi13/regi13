import json, numpy as np, subprocess, difflib, re, unicodedata
from faster_whisper import WhisperModel
asr=WhisperModel("small",device="cpu",compute_type="int8",cpu_threads=4)
raw=subprocess.run(["ffmpeg","-v","error","-i","voice.wav","-ac","1","-ar","16000","-f","f32le","-"],capture_output=True).stdout; V=np.frombuffer(raw,np.float32)
def nz(s): return re.sub(r"[^a-z0-9 ]"," ",unicodedata.normalize("NFD",s.lower()).encode("ascii","ignore").decode()).split()
for c in json.load(open('work/clips.json')):
    seg,_=asr.transcribe(V[int((c['start']-0.1)*16000):int((c['start']+c['dur']+0.1)*16000)],language="pt",beam_size=5); h=" ".join(x.text for x in seg)
    th=nz(re.sub(r"duas e (catorze|quarenta e um)|trinta","",c['text'],flags=re.I)); hh=nz(re.sub(r"\b\d{1,2}(h\d{0,2})?\b","",h)); miss=[w for w in th if len(w)>1 and not any(difflib.SequenceMatcher(None,w,x).ratio()>=0.8 for x in hh)]
    print(c['name'],'FALTA:',miss,'|',h.strip())
