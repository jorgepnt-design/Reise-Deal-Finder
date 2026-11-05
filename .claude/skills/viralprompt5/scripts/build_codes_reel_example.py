#!/usr/bin/env python3
"""Reel 054: 5 Foto-Codes. 480x854 = Bild 480x650 + Untertitelstreifen 480x204."""
import subprocess, sys, os
from PIL import Image, ImageDraw, ImageFont

D = sys.argv[1]; os.chdir(D)
K = 1.0                      # Sprechtempo
VOICE_END = 27.65
TOTAL = round(VOICE_END / K + 0.45, 2)
FB = "/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf"
FM = "/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf"
def t(x): return round(x / K, 3)

def run(cmd):
    r = subprocess.run(cmd, capture_output=True, text=True)
    if r.returncode: print(r.stderr[-3000:]); sys.exit(1)

def fit(src, out, ypos="(ih-650)/2"):
    im = Image.open(src).convert("RGB")
    s = max(480 / im.width, 650 / im.height); im = im.resize((round(im.width * s), round(im.height * s)), Image.LANCZOS)
    x = (im.width - 480) // 2
    y = eval(ypos.replace("ih", str(im.height)))
    y = int(max(0, min(im.height - 650, y)))
    im.crop((x, y, x + 480, y + 650)).save(out)

def codebar(code, out):
    im = Image.new("RGBA", (480, 650), (0, 0, 0, 0)); d = ImageDraw.Draw(im)
    d.rounded_rectangle([24, 548, 456, 612], radius=32, fill=(255, 255, 255, 245))
    f = ImageFont.truetype(FB, 30); fp = ImageFont.truetype(FM, 34)
    d.text((48, 556), "+", font=fp, fill=(120, 120, 120))
    d.text((88, 560), code, font=f, fill=(25, 25, 25))
    d.line([(88 + d.textlength(code, font=f) + 4, 562), (88 + d.textlength(code, font=f) + 4, 596)], fill=(30, 120, 255), width=3)
    im.save(out)

def card(out):
    im = Image.new("RGB", (480, 650), (30, 47, 79)); d = ImageDraw.Draw(im)
    f1 = ImageFont.truetype(FB, 40); f2 = ImageFont.truetype(FB, 28); f3 = ImageFont.truetype(FM, 20)
    d.text((240, 95), "4 Style-Codes", font=f1, fill=(255, 212, 0), anchor="mm")
    d.text((240, 140), "einmal speichern, dann nur noch tippen", font=f3, fill=(200, 211, 230), anchor="mm")
    for i, c in enumerate(["/frisuren", "/farbtyp", "/brillen", "/winkel"]):
        y = 210 + i * 86
        d.rounded_rectangle([60, y, 420, y + 58], radius=29, fill=(255, 255, 255))
        d.text((84, y + 29), "+", font=f3, fill=(120, 120, 120), anchor="lm")
        d.text((112, y + 29), c, font=f2, fill=(25, 25, 25), anchor="lm")
    im.save(out)

def still(src, dur, out, zoom=0.04):
    n = int(round(dur * 24))
    run(["ffmpeg", "-v", "error", "-y", "-loop", "1", "-i", src, "-vf",
         f"scale=960:1300,zoompan=z='1+{zoom}*on/{n}':x='iw/2-(iw/zoom/2)':y='ih/2-(ih/zoom/2)':d={n}:s=480x650:fps=24,setsar=1,format=yuv420p",
         "-frames:v", str(n), "-c:v", "libx264", "-crf", "16", out])

def overlay_still(src, ov, dur, out):
    n = int(round(dur * 24))
    run(["ffmpeg", "-v", "error", "-y", "-loop", "1", "-i", src, "-loop", "1", "-i", ov, "-filter_complex",
         f"[0]scale=960:1300,zoompan=z='1+0.03*on/{n}':x='iw/2-(iw/zoom/2)':y='ih/2-(ih/zoom/2)':d={n}:s=480x650:fps=24,setsar=1[a];[a][1]overlay=0:0,format=yuv420p",
         "-frames:v", str(n), "-c:v", "libx264", "-crf", "16", out])

def wipe(a, b, out, off):
    run(["ffmpeg", "-v", "error", "-y", "-i", a, "-i", b, "-filter_complex",
         f"[0][1]xfade=transition=wiperight:duration=0.4:offset={off},format=yuv420p", "-c:v", "libx264", "-crf", "16", out])

# Bilder vorbereiten
fit("v_jorge.png", "f_v.png", "ih*0.02")
for n in ["frisuren", "farbtyp", "brillen", "winkel"]: fit(f"n_{n}.png", f"f_{n}.png")
card("f_card.png")
def pad(src, out, top=84):
    im = Image.open(src).convert("RGB"); h = 650 - top
    im.thumbnail((480, h), Image.LANCZOS)
    c = Image.new("RGB", (480, 650), (30, 47, 79)); c.paste(im, ((480 - im.width) // 2, top + (h - im.height) // 2)); c.save(out)
for n in ["frisuren", "farbtyp", "brillen"]: pad(f"n_{n}.png", f"p_{n}.png")
B = [0, 1.33, 2.66, 4.0, 7.2, 10.2, 15.5, 19.2, 22.1]
segs = []
still("p_frisuren.png", t(B[1]) - t(B[0]), "s0.mp4", zoom=0.0); segs.append("s0.mp4")
still("p_brillen.png", t(B[2]) - t(B[1]), "s1.mp4", zoom=0.0); segs.append("s1.mp4")
still("p_farbtyp.png", t(B[3]) - t(B[2]), "s2.mp4", zoom=0.0); segs.append("s2.mp4")
still("f_card.png", t(B[4]) - t(B[3]), "s3.mp4", zoom=0.02); segs.append("s3.mp4")
codes = [("f_v.png", "f_frisuren.png", "/frisuren"), ("f_v.png", "f_farbtyp.png", "/farbtyp"),
         ("f_v.png", "f_brillen.png", "/brillen"), ("f_v.png", "f_winkel.png", "/winkel")]
wipes = []
for i, (vb, na, code) in enumerate(codes):
    a, b = t(B[4 + i]), t(B[5 + i])
    dur = b - a; before = round(min(1.2, dur * 0.35), 3)
    codebar(code, f"cb{i}.png")
    overlay_still(vb, f"cb{i}.png", before + 0.4, f"b{i}.mp4")
    still(na, dur - before, f"a{i}.mp4", zoom=0.03)
    wipe(f"b{i}.mp4", f"a{i}.mp4", f"c{i}.mp4", before)
    wipes.append((a + before, a + before + 0.4)); segs.append(f"c{i}.mp4")
still("p_brillen.png", TOTAL - t(B[8]), "s9.mp4", zoom=0.0); segs.append("s9.mp4")

with open("list.txt", "w") as f:
    for s in segs: f.write(f"file '{s}'\n")
run(["ffmpeg", "-v", "error", "-y", "-f", "concat", "-safe", "0", "-i", "list.txt", "-c:v", "libx264", "-crf", "16", "-pix_fmt", "yuv420p", "pic.mp4"])

def ts(x):
    return f"0:{int(x // 60):02d}:{x % 60:05.2f}"
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
subs = [(0, 1.75, "Deine perfekte Frisur,"), (1.8, 3.9, "Brille und Farben aus einem Foto?"),
        (4.06, 5.55, "Vier Codes,"), (5.63, 7.1, "einmal in ChatGPT gespeichert."),
        (7.32, 8.65, "/frisuren zeigt dich"), (8.7, 10.1, "mit zwölf Frisuren."),
        (10.25, 12.2, "/farbtyp zeigt, welche Farben"), (12.25, 14.15, "dir stehen"), (14.21, 15.5, "und welche blass machen."),
        (15.64, 17.25, "/brillen zeigt,"), (17.32, 19.1, "welche Brille wirklich passt."),
        (19.25, 21.95, "/winkel zeigt deinen besten Fotowinkel."),
        (22.27, 23.38, "Speicher dir das,"), (23.43, 24.3, "kommentiere PROMPT"), (24.37, VOICE_END, "und folge @jorge.ai.studio")]
with open("strip.ass", "w") as f:
    f.write(HEAD.format(h=204, style="Style: S,DejaVu Sans,30,&H00FFFFFF,&H00FFFFFF,&H00000000,&H80000000,-1,0,0,0,100,100,0,0,1,2,1,2,20,20,42,1"))
    for a, b, x in subs: f.write(f"Dialogue: 0,{ts(t(a))},{ts(t(b))},S,,0,0,0,,{x}\n")
ov = [(0, 3.9, 18, "Deine perfekte Frisur, Brille\\Nund Farben aus einem Foto?")]
for i in range(4):
    a = t(B[4 + i]); w0, w1 = wipes[i]
    ov.append((a, w0, 18, "Vorher"))
ov += [(t(B[8]), 24.37, 18, "Kommentiere PROMPT"), (24.37, TOTAL, 18, "Kommentiere PROMPT\\N@jorge.ai.studio")]
with open("top.ass", "w") as f:
    f.write(HEAD.format(h=650, style="Style: T,DejaVu Sans,23,&H00FFFFFF,&H00FFFFFF,&H73000000,&H73000000,-1,0,0,0,100,100,0,0,3,6,0,8,20,20,18,1"))
    for a, b, mv, x in ov: f.write(f"Dialogue: 0,{ts(a)},{ts(b)},T,,0,0,{mv},,{x}\n")

run(["ffmpeg", "-v", "error", "-y", "-i", "pic.mp4", "-f", "lavfi", "-t", str(TOTAL), "-i", "color=c=0x111111:s=480x204:r=24",
     "-i", "voice_tight.wav", "-filter_complex",
     f"[0:v]ass=top.ass[p];[1:v]ass=strip.ass[s];[p][s]vstack,format=yuv420p[v];[2:a]atempo={K},loudnorm=I=-15:TP=-1.5:LRA=11,apad,atrim=0:{TOTAL}[a]",
     "-map", "[v]", "-map", "[a]", "-t", str(TOTAL), "-ar", "48000",
     "-c:v", "libx264", "-profile:v", "high", "-pix_fmt", "yuv420p", "-crf", "18",
     "-c:a", "aac", "-b:a", "160k", "-movflags", "+faststart", "reel057_stylecodes.mp4"])
print("fertig", TOTAL)
