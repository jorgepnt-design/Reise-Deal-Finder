#!/usr/bin/env python3
"""Schnitt Reel 053: Wichtel. 480x854 = Bild 480x650 + Untertitelstreifen 480x204."""
import json, subprocess, sys, os

D = sys.argv[1]
os.chdir(D)
TOTAL = 24.15
FONT = "DejaVu Sans"

def run(cmd):
    r = subprocess.run(cmd, capture_output=True, text=True)
    if r.returncode:
        print(r.stderr[-3000:]); sys.exit(1)

FIT = "scale=-2:650,crop=480:650,setsar=1,fps=24,format=yuv420p"

def clip(src, ss, dur, out):
    run(["ffmpeg", "-v", "error", "-y", "-ss", str(ss), "-t", str(dur), "-i", src,
         "-vf", FIT, "-an", "-c:v", "libx264", "-crf", "16", out])

def still(src, dur, out, zoom=False):
    vf = FIT
    if zoom:  # langsame Fahrt nach vorne
        n = int(dur * 24)
        vf = ("scale=-2:1300,crop=960:1300,zoompan=z='1+0.06*on/%d':x='iw/2-(iw/zoom/2)':"
              "y='ih/2-(ih/zoom/2)':d=%d:s=480x650:fps=24,setsar=1,format=yuv420p" % (n, n))
    run(["ffmpeg", "-v", "error", "-y", "-loop", "1", "-t", str(dur), "-i", src,
         "-vf", vf, "-frames:v", str(int(dur * 24)), "-c:v", "libx264", "-crf", "16", out])

# Segmente (Zeiten aus den Wort-Zeitstempeln der Stimme)
clip("c1.mp4", 0.0, 4.0, "sA.mp4")
still("v_familie.png", 1.7, "b1.mp4")
still("n_pulli.png", 0.9, "b2.mp4")
run(["ffmpeg", "-v", "error", "-y", "-i", "b1.mp4", "-i", "b2.mp4", "-filter_complex",
     "[0][1]xfade=transition=wipeleft:duration=0.4:offset=1.3,format=yuv420p",
     "-c:v", "libx264", "-crf", "16", "sB.mp4"])          # 4.0-6.2
clip("c1.mp4", 1.0, 3.3, "sC.mp4")                       # 6.2-9.5
clip("c2.mp4", 0.0, 3.5, "sD.mp4")                       # 9.5-13.0
clip("c3.mp4", 0.0, 3.0, "sE.mp4")                       # 13.0-16.0
run(["ffmpeg", "-v", "error", "-y", "-loop", "1", "-t", "2.6", "-i", "n_pulli.png",
     "-loop", "1", "-t", "2.6", "-i", "n_pulli.png", "-loop", "1", "-t", "2.6", "-i", "n_pyjama.png",
     "-loop", "1", "-t", "2.6", "-i", "n_schnee.png", "-filter_complex",
     "[0]scale=-2:650,crop=480:650,gblur=sigma=18,eq=brightness=-0.15[bg];"
     "[1]scale=150:200,setsar=1[a];[2]scale=150:200,setsar=1[b];[3]scale=150:200,setsar=1[c];"
     "[bg][a]overlay=8:230[t1];[t1][b]overlay=165:230[t2];[t2][c]overlay=322:230,fps=24,format=yuv420p",
     "-frames:v", str(int(2.6 * 24)), "-c:v", "libx264", "-crf", "16", "sF.mp4"])   # 16.0-18.6
still("n_pulli.png", round(TOTAL - 18.6, 2), "sG.mp4", zoom=True)              # 18.6-Ende

with open("list.txt", "w") as f:
    for s in "ABCDEFG":
        f.write(f"file 's{s}.mp4'\n")
run(["ffmpeg", "-v", "error", "-y", "-f", "concat", "-safe", "0", "-i", "list.txt",
     "-c:v", "libx264", "-crf", "16", "-pix_fmt", "yuv420p", "pic.mp4"])

def ts(t):
    h = int(t // 3600); m = int(t % 3600 // 60); s = t % 60
    return f"{h}:{m:02d}:{s:05.2f}"

HEAD = """[Script Info]
ScriptType: v4.00+
PlayResX: 480
PlayResY: {h}
WrapStyle: 0

[V4+ Styles]
Format: Name, Fontname, Fontsize, PrimaryColour, SecondaryColour, OutlineColour, BackColour, Bold, Italic, Underline, StrikeOut, ScaleX, ScaleY, Spacing, Angle, BorderStyle, Outline, Shadow, Alignment, MarginL, MarginR, MarginV, Encoding
{style}

[Events]
Format: Layer, Start, End, Style, Name, MarginL, MarginR, MarginV, Effect, Text
"""

# Untertitel im Streifen: DejaVu Sans Bold 30, weiss, Outline 2, Shadow 1, zentriert, MarginV 42
subs = [
    (0.00, 2.05, "Deine Familie im Weihnachtspulli,"), (2.1, 3.95, "im Pyjama oder als Schneemänner?"),
    (4.1, 5.9, "Ein normales Familienfoto reicht."),
    (6.3, 7.7, "Erster Prompt:"), (7.74, 9.4, "alle im hässlichen Weihnachtspulli."),
    (9.58, 11.3, "Zweiter: alle im passenden Pyjama"), (11.34, 12.95, "vor dem Kamin."),
    (13.14, 14.7, "Dritter: die ganze Familie"), (14.76, 15.95, "als Schneemänner."),
    (16.08, 17.0, "Alle drei Prompts"), (17.02, 18.55, "stehen in der Beschreibung."),
    (18.68, 19.85, "Speicher dir das,"), (19.92, 20.75, "kommentiere PROMPT"),
    (20.8, TOTAL - 0.1, "und folge @jorge.ai.studio"),
]
with open("strip.ass", "w") as f:
    f.write(HEAD.format(h=204, style=f"Style: S,{FONT},30,&H00FFFFFF,&H00FFFFFF,&H00000000,"
                        "&H80000000,-1,0,0,0,100,100,0,0,1,2,1,2,20,20,42,1"))
    for a, b, t in subs:
        f.write(f"Dialogue: 0,{ts(a)},{ts(b)},S,,0,0,0,,{t}\n")

# Overlays oben im Bild: DejaVu Sans Bold 23, weiss, Box schwarz 55 %
ov = [
    (0.0, 3.95, 18, "Deine Familie im Weihnachtspulli,\\Nim Pyjama oder als Schneemänner?"),
    (4.0, 5.3, 18, "Vorher"), (5.7, 6.2, 18, "Nachher"),
    (16.0, 18.6, 70, "3 Prompts\\Nstehen in der Beschreibung"),
    (18.6, TOTAL, 18, "Kommentiere PROMPT"), (20.8, TOTAL, 62, "@jorge.ai.studio"),
]
with open("top.ass", "w") as f:
    f.write(HEAD.format(h=650, style=f"Style: T,{FONT},23,&H00FFFFFF,&H00FFFFFF,&H73000000,"
                        "&H73000000,-1,0,0,0,100,100,0,0,3,6,0,8,20,20,18,1"))
    for a, b, mv, t in ov:
        f.write(f"Dialogue: 0,{ts(a)},{ts(b)},T,,0,0,{mv},,{t}\n")

run(["ffmpeg", "-v", "error", "-y", "-i", "pic.mp4", "-f", "lavfi", "-t", str(TOTAL), "-i",
     "color=c=0x111111:s=480x204:r=24", "-i", "voice.wav", "-filter_complex",
     "[0:v]ass=top.ass[p];[1:v]ass=strip.ass[s];[p][s]vstack,format=yuv420p[v];"
     f"[2:a]loudnorm=I=-15:TP=-1.5:LRA=11,apad,atrim=0:{TOTAL}[a]",
     "-map", "[v]", "-map", "[a]", "-t", str(TOTAL),
     "-c:v", "libx264", "-profile:v", "high", "-pix_fmt", "yuv420p", "-crf", "18",
     "-ar", "48000", "-c:a", "aac", "-b:a", "160k", "-movflags", "+faststart", "reel055_weihnachtspulli.mp4"])
print("fertig")
