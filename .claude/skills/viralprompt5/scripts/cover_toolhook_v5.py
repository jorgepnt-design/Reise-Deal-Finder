"""Jorge.ai.studio – Cover-Stil „Tool-Hook“ (1080x1920).
Aufruf: python3 cover_toolhook.py person.png out.png --bg "#2E6B5E" \
  --l1 "DEIN KIND ALS" --l2 "FUSSBALL-STAR?" --script "mit einem Prompt" \
  --tools chatgpt [--result ergebnis.jpg]
Tool-Symbole: icons/<name>.png, z. B. --tools chatgpt,gemini,higgsfield
(Liste: ls icons). Fehlt eine Datei, wird eine Kachel mit dem Toolnamen gesetzt."""
import argparse, os
from PIL import Image, ImageDraw, ImageFilter, ImageFont, ImageEnhance

W, H = 1080, 1920
EXTRA = []
SAFE_L, SAFE_R = 60, 1020          # Text-Zone fast volle Breite (Jorge: Cover-Schrift groß!)
GRID_TOP, GRID_BOT = 240, 1680     # 3:4-Profilraster
HERE = os.path.dirname(os.path.abspath(__file__))
F_HEAD = os.path.join(HERE, "fonts/Anton-Regular.ttf")
F_SCRIPT = os.path.join(HERE, "fonts/PlayfairDisplay-Italic.ttf")
NAMES = {"chatgpt": "ChatGPT", "gemini": "Gemini", "claude": "Claude",
         "higgsfield": "Higgsfield", "heygen": "HeyGen", "canva": "Canva"}

def hexrgb(h): h = h.lstrip("#"); return tuple(int(h[i:i+2], 16) for i in (0, 2, 4))

def fit_font(path, text, max_w, start, var=None):
    s = start
    while s > 20:
        f = ImageFont.truetype(path, s)
        if var: f.set_variation_by_axes([var])
        if f.getbbox(text)[2] - f.getbbox(text)[0] <= max_w: return f
        s -= 2
    return f

def shadow_text(img, xy, text, font, fill, blur=10, off=(0, 6), alpha=170):
    sh = Image.new("RGBA", img.size, (0, 0, 0, 0))
    ImageDraw.Draw(sh).text((xy[0]+off[0], xy[1]+off[1]), text, font=font, fill=(0, 0, 0, alpha))
    img.alpha_composite(sh.filter(ImageFilter.GaussianBlur(blur)))
    ImageDraw.Draw(img).text(xy, text, font=font, fill=fill)

def tile(name, size):
    t = Image.new("RGBA", (size, size), (0, 0, 0, 0))
    m = Image.new("L", (size, size), 0)
    ImageDraw.Draw(m).rounded_rectangle([0, 0, size-1, size-1], radius=int(size*0.24), fill=255)
    base = Image.new("RGBA", (size, size), (250, 247, 240, 255)); t.paste(base, (0, 0), m)
    p = os.path.join(HERE, "icons", f"{name.lower()}.png")
    if os.path.exists(p):
        ic = Image.open(p).convert("RGBA")
        if ic.getpixel((2, 2))[3] > 200:   # App-Icon mit eigenem Hintergrund (z. B. Higgsfield): Kachel ganz füllen
            ic = ic.resize((size, size), Image.LANCZOS); t = Image.new("RGBA", (size, size), (0, 0, 0, 0)); t.paste(ic, (0, 0), m)
        else:
            ic.thumbnail((int(size*.62),)*2, Image.LANCZOS)
            t.alpha_composite(ic, ((size-ic.width)//2, (size-ic.height)//2))
    else:
        label = NAMES.get(name, name)
        f = fit_font(F_HEAD, label, int(size*.8), int(size*.28))
        bb = f.getbbox(label); d = ImageDraw.Draw(t)
        d.text(((size-(bb[2]-bb[0]))//2-bb[0], (size-(bb[3]-bb[1]))//2-bb[1]), label, font=f, fill=(25, 25, 25))
    return t

def main():
    a = argparse.ArgumentParser()
    a.add_argument("person"); a.add_argument("out")
    a.add_argument("--bg", default="#2E6B5E"); a.add_argument("--l1", required=True)
    a.add_argument("--l2", default=""); a.add_argument("--script", default="mit einem Prompt")
    a.add_argument("--script-color", default="#7FE3D6"); a.add_argument("--tools", default="chatgpt")
    a.add_argument("--result"); a.add_argument("--extra", default="[]", help='JSON-Liste [[pfad, x, y, winkel, beschriftung|null, [maxB, maxH]], ...]'); a.add_argument("--snow", action="store_true"); a.add_argument("--person-top", type=int, default=250)
    o = a.parse_args()
    import json as _j
    global EXTRA
    EXTRA = [(p, (x, y), ang, lab, tuple(box)) for p, x, y, ang, lab, box in _j.loads(o.extra)]

    bg = hexrgb(o.bg)
    img = Image.new("RGBA", (W, H), bg + (255,))
    # weicher Lichtkegel hinter der Person
    glow = Image.new("RGBA", (W, H), (0, 0, 0, 0))
    ImageDraw.Draw(glow).ellipse([140, 200, 940, 1100], fill=tuple(min(255, c+45) for c in bg) + (255,))
    img.alpha_composite(glow.filter(ImageFilter.GaussianBlur(160)))
    import random; random.seed(7)
    if os.environ.get("NOSNOW"): random.seed(7)
    snow = Image.new("RGBA", (W, H), (0, 0, 0, 0)); sd = ImageDraw.Draw(snow)
    for _ in range(260 if o.snow else 0):
        x, y, r = random.randint(0, W), random.randint(0, H), random.choice([2, 3, 3, 4, 5, 7])
        sd.ellipse([x-r, y-r, x+r, y+r], fill=(255, 255, 255, random.randint(90, 200)))
    img.alpha_composite(snow.filter(ImageFilter.GaussianBlur(1.2)))

    # Person (freigestellt), Kopf frei und mittig
    p = Image.open(o.person).convert("RGBA"); p = p.crop(p.getbbox())
    p = ImageEnhance.Color(p).enhance(1.1)
    ph = H - o.person_top; pw = int(p.width * ph / p.height)
    p = p.resize((pw, ph), Image.LANCZOS)
    sh = Image.new("RGBA", (W, H), (0, 0, 0, 0))
    sh.paste((0, 0, 0, 110), ((W-pw)//2 + 18, o.person_top + 10), p.split()[3])
    img.alpha_composite(sh.filter(ImageFilter.GaussianBlur(22)))
    img.alpha_composite(p, ((W-pw)//2, o.person_top))

    for path, (px, py), ang, label, box in EXTRA:
        r = Image.open(path).convert("RGBA"); r.thumbnail(box, Image.LANCZOS)
        fr = Image.new("RGBA", (r.width+22, r.height+64), (255, 255, 255, 255)); fr.alpha_composite(r, (11, 11))
        if label:
            lf = ImageFont.truetype(F_SCRIPT, 44); lf.set_variation_by_axes([700]); bb = lf.getbbox(label)
            ImageDraw.Draw(fr).text(((fr.width-(bb[2]-bb[0]))//2-bb[0], r.height+11+(53-(bb[3]-bb[1]))//2-bb[1]), label, font=lf, fill=(40, 40, 40))
        fr = fr.rotate(ang, expand=True, resample=Image.BICUBIC)
        s3 = Image.new("RGBA", (W, H), (0, 0, 0, 0)); s3.paste((0, 0, 0, 130), (px+10, py+14), fr.split()[3])
        img.alpha_composite(s3.filter(ImageFilter.GaussianBlur(14))); img.alpha_composite(fr, (px, py))
    # Ergebnisbild optional (rechts, leicht schräg)
    if o.result:
        r = Image.open(o.result).convert("RGBA"); r.thumbnail((300, 380), Image.LANCZOS)
        fr = Image.new("RGBA", (r.width+24, r.height+24), (255, 255, 255, 255)); fr.alpha_composite(r, (12, 12))
        fr = fr.rotate(-7, expand=True, resample=Image.BICUBIC)
        img.alpha_composite(fr, (W - fr.width - 40, 560))

    # Abdunklung unten für Lesbarkeit
    grad = Image.new("L", (1, H), 0)
    for y in range(H):
        t = max(0, (y - 1000) / (H - 1000)); grad.putpixel((0, y), int(215 * min(1, t * 1.4)))
    dark = Image.new("RGBA", (W, H), tuple(int(c*.35) for c in bg) + (255,))
    img.paste(dark, (0, 0), grad.resize((W, H)))

    maxw = SAFE_R - SAFE_L
    # Textblock unten im Raster-Bereich
    lines = [l for l in o.l1.split("|")] + ([o.l2] if o.l2 else [])
    size = min(fit_font(F_HEAD, l, maxw, 190).size for l in lines)
    if size < 120: print(f'WARNUNG: Headline nur {size}px – Zeilen kürzer umbrechen (Ziel >= 120px)')
    fh = ImageFont.truetype(F_HEAD, size)
    fs = fit_font(F_SCRIPT, o.script, maxw, 110, var=700) if o.script else None
    hs = fs.getbbox(o.script) if fs else (0, 0, 0, 0)
    y = GRID_BOT - 40 - hs[3] - (14 if fs else 0)
    ys = []
    for l in reversed(lines):
        bb = fh.getbbox(l); y = y - (bb[3] - bb[1]) - 12; ys.insert(0, (l, y - bb[1], bb))
    y_script = GRID_BOT - 40 - hs[3]
    x = SAFE_L
    tools = [t.strip() for t in o.tools.split(",") if t.strip()]
    ts = 140; gap = 24
    l0, y0, b0 = ys[0]
    w0 = b0[2] - b0[0]; tiles_w = len(tools) * (ts + gap)
    if x + w0 + 36 + tiles_w <= SAFE_R:      # Icons rechts neben die (kurze) erste Zeile
        tx = x + w0 + 36; ty = y0 + b0[1] + (b0[3] - b0[1] - ts) // 2
    else:                                    # sonst über die Headline
        tx = x; ty = y0 + b0[1] - ts - 26
    for i, tname in enumerate(tools):
        tl = tile(tname, ts)
        s2 = Image.new("RGBA", (W, H), (0, 0, 0, 0)); s2.paste((0, 0, 0, 120), (tx + i*(ts+gap), ty + 10), tl.split()[3])
        img.alpha_composite(s2.filter(ImageFilter.GaussianBlur(12)))
        img.alpha_composite(tl, (tx + i*(ts+gap), ty))
    for l, yy, bb in ys:
        shadow_text(img, (x - bb[0], yy), l, fh, (255, 255, 255))
    if fs: shadow_text(img, (x - hs[0], y_script), o.script, fs, hexrgb(o.script_color) + (255,), blur=8, off=(0, 4))
    print("Headline", size, "px, Kacheln y", ty)

    out = img.convert("RGB"); out.save(o.out, quality=95)
    # Prüf-Vorschauen
    grid = out.crop((0, GRID_TOP, W, GRID_BOT)); grid.save(o.out.replace(".jpg", "_raster34.jpg"))
    print("ok", o.out, "| Kacheln y", ty, "| Text bis y", y_script + hs[3], "| Raster", GRID_TOP, GRID_BOT)

if __name__ == "__main__": main()
