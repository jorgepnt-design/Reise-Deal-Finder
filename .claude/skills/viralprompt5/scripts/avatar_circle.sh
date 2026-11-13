#!/usr/bin/env bash
# /viralprompt5 – Punkt 18b: HeyGen-Avatar als Kreis unten rechts + Overlays + Untertitelstreifen + Ton
# Aufruf: scripts/avatar_circle.sh base.mp4 avatar.mp4 voice.wav over.ass subs.ass out.mp4 [CROP_X]
#   base.mp4   Bildfolge 480x650, 25 fps, ohne Ton
#   avatar.mp4 HeyGen-Avatar 720x720 (1:1)
#   voice.wav  geprüfte Higgsfield-Stimme (Master-Ton)
#   over.ass   Bild-Overlays (PlayRes 480x650)
#   subs.ass   Untertitel (PlayRes 480x204)
#   CROP_X     optional, Kopfmitte - 150 (Standard 180)
set -euo pipefail
BASE="$1"; AV="$2"; VOICE="$3"; OVER="$4"; SUBS="$5"; OUT="$6"; CROP_X="${7:-180}"
TMP="$(mktemp -d)"
python3 - "$TMP" <<'PY'
import sys
from PIL import Image, ImageDraw
d = sys.argv[1]
m = Image.new('L', (176, 176), 0); ImageDraw.Draw(m).ellipse((0, 0, 175, 175), fill=255); m.save(f'{d}/mask.png')
r = Image.new('RGBA', (182, 182), (0, 0, 0, 0)); ImageDraw.Draw(r).ellipse((0, 0, 181, 181), fill=(255, 255, 255, 255)); r.save(f'{d}/ring.png')
PY
DUR="$(ffprobe -v error -show_entries format=duration -of csv=p=0 "$BASE")"
ffmpeg -v error -y -i "$BASE" -i "$AV" -loop 1 -i "$TMP/mask.png" -loop 1 -i "$TMP/ring.png" -i "$VOICE" \
  -f lavfi -i "color=c=0x111111:s=480x204:r=25" \
  -filter_complex "[1:v]tpad=stop_mode=clone:stop_duration=5,crop=300:300:${CROP_X}:0,scale=176:176,format=rgba[av];\
[2:v]format=gray[mk];[av][mk]alphamerge[avc];\
[0:v][3:v]overlay=480-182-12:650-182-12:shortest=1[b1];\
[b1][avc]overlay=480-176-15:650-176-15:eof_action=repeat[b2];\
[b2]ass=${OVER}[top];[5:v]ass=${SUBS}[bot];\
[top][bot]vstack=shortest=1,format=yuv420p[v];\
[4:a]loudnorm=I=-15:TP=-1.5,apad=pad_dur=1[a]" \
  -map "[v]" -map "[a]" -t "$DUR" -c:v libx264 -profile:v high -pix_fmt yuv420p -crf 20 \
  -c:a aac -b:a 160k -ar 48000 -movflags +faststart "$OUT"
rm -rf "$TMP"
echo "fertig: $OUT ($(ffprobe -v error -show_entries format=duration -of csv=p=0 "$OUT") s)"
