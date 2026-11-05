import sys, json
from faster_whisper import WhisperModel
m = WhisperModel("small", device="cpu", compute_type="int8")
import subprocess, numpy as np
raw = subprocess.run(["ffmpeg","-v","error","-i",sys.argv[1],"-ac","1","-ar","16000","-f","f32le","-"],capture_output=True).stdout
audio = np.frombuffer(raw, np.float32)
segs, _ = m.transcribe(audio, language="de", word_timestamps=True)
words = []
for s in segs:
    for w in s.words:
        words.append({"w": w.word.strip(), "s": round(w.start, 2), "e": round(w.end, 2)})
json.dump(words, open(sys.argv[2], "w"), ensure_ascii=False, indent=0)
print(" ".join(f"{x['w']}[{x['s']}]" for x in words))
