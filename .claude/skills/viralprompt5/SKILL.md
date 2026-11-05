---
name: viralprompt5
description: >-
  Masterprompt /viralprompt5 für Jorge.ai.studio: Jorge lädt ein fremdes Reel-Video hoch, und daraus
  entsteht vollautomatisch eine eigene, ehrliche Version (Remake) mit Jorges Stimme, eigenen Bildern,
  Untertiteln, Cover (nur ChatGPT-Icon), Beschreibung und Google Doc. Alles wird selbst erledigt;
  nur vor dem Veröffentlichen wird gefragt: Testreel oder normal. Danach ManyChat. Nutzen, wenn
  Jorge /viralprompt5 schreibt oder ein Video schickt und es „auf die gleiche Weise neu“ haben will.
---

# JORGE AI STUDIO — /viralprompt5 MASTERPROMPT

Version 5.0 | Stand 05.11.2026 | Baut auf /viralprompt4 auf (alle v4-Regeln zu Hook, Stimme, Untertiteln,
Datenschutz und Bibliothek gelten weiter, soweit hier nichts anderes steht).

## GRUNDPRINZIP

Jorge lädt ein Video hoch (meist ein fremdes Reel). Du analysierst es und baust eine **eigene Version**:
gleiche Idee und Dramaturgie, aber eigene Codes/Prompts, eigener Sprechertext, Jorges Fotos und Stimme.
**Du machst alles selbst bis zum Ende**, ohne Zwischenfreigaben. Einzige Pflicht-Rückfrage:
**vor dem Veröffentlichen** (Testreel oder normal). Am Ende bekommt Jorge: **Video, Beschreibung, Cover, Doc**.

## ABLAUF

### 1. Analyse des Videos
- Kopie in eigenen Ordner, `ffprobe` (Dauer, Format), Kontaktbögen: `ffmpeg -i src -vf "fps=1,scale=200:-2,tile=8x4" frames_%02d.jpg`, ansehen.
- Ton transkribieren: `python3 scripts/transcribe.py src.mov words.json` (faster-whisper, Wort-Zeitstempel).
- Kurz festhalten: Hook, Ablauf mit Sekunden, Anzahl Varianten/Codes, CTA, Länge, Original-Account.
- **Ehrlichkeits-Check:** „Slash-Befehle“ gibt es in ChatGPT nicht. Wenn das Original so tut, als ob,
  bekommt Jorges Version einen **Einrichtungstext** (ChatGPT → Einstellungen → Personalisierung →
  Benutzerdefinierte Anweisungen) – dann funktionieren die Codes wirklich. Keine erfundenen Behauptungen.

### 2. Eigene Version planen (ohne Rückfrage)
- Eigene **deutsche** Codes/Varianten (nicht die Namen des Originals kopieren), gleiche Anzahl.
- Hook nach v4-Regeln: „Du/Dein“ vorne, max. 12 Wörter, kein Toolname im ersten Satz, 1 Emoji am Ende.
- Sprechertext ca. 45–60 Wörter: Hook → „X Codes, einmal in ChatGPT gespeichert.“ (bei Codes) →
  je Code ein Satz → Abschluss „Speicher dir das, kommentiere Prompt und folge George Punkt A I Punkt Studio.“
- „Slash X“ im Sprechertext für Codes; im Bild/Untertitel „/x“.
- Kurz an Jorge melden: Analyse in 3–4 Zeilen, Codes, genaue Kosten – dann direkt weiterarbeiten.

### 3. Ausgangsfotos
- Fotos, die Jorge mitschickt, haben Vorrang.
- Sonst Jorges frontales Referenzfoto aus Higgsfield (media_id `2ee5aa8e-128b-4172-a3a3-f84cdd4b53ee`,
  lokal `/root/.claude/uploads/.../a8d02eb5-image.png` falls vorhanden).
- Themen mit Familie/Kindern ohne Foto: fiktive Personen per gpt_image_2_5 erzeugen und in der
  Beschreibung „KI-generiert“ angeben. Echte Kinderfotos nur, wenn Jorge sie schickt.
- Uploads: `media_upload` → `curl -X PUT -H "Content-Type: …" -H "If-None-Match: *" --data-binary @datei URL` → `media_confirm`.

### 4. Bilder, Ton, Animation (Higgsfield)
- **Vorher immer Kosten per `get_cost`** abfragen und Jorge die Summe nennen. Budget ohne Rückfrage: bis
  15 Credits pro Reel; darüber erst fragen.
- Ergebnisbilder: `gpt_image_2_5`, quality **medium**, 1k, 3:4, Referenz = Ausgangsfoto (0,5 Credits/Bild).
  Prompts vollständig auf Deutsch, „Gesicht exakt wie im Original“, Beschriftungen „gut lesbare deutsche
  Schrift ohne Tippfehler“.
- Jedes Bild ansehen (Gesicht erkennbar? Text richtig? Logikfehler wie falsche Blickrichtung?). Bei
  klarem Fehler **einmal** neu erzeugen und Jorge sagen warum.
- Stimme: `seed_audio`, voice_type `element`, voice_id `292bf8af-9d89-4758-a455-c8c4cd473d97`
  („Jorge (HeyGen)“). Nach Erzeugung transkribieren und prüfen (vollständig, „Prompt“ als Wort,
  „George.ai.studio“ am Ende).
- **Länge max. 30 s**: Zuerst lange Pausen kürzen (silencedetect, jede Stille > 0,6 s auf ~0,44 s),
  erst danach falls nötig `atempo` bis max. 1,08. Nie gesprochene Wörter schneiden.
- Animation nur bei Szenen-Bildern (Personen, Orte): Seedance 2.0 Mini, 480p, 5 s, 3:4, ohne Ton,
  ruhige Bewegung (2,5 Credits/Clip). Raster/Karten/Infografiken **nicht** animieren.

### 5. Schnitt (lokal, ffmpeg)
- Format 480×854: Bild 480×650 oben, Untertitelstreifen 480×204 (0x111111) unten, ASS DejaVu Sans Bold 30.
- Vorlagen: `scripts/build_codes_reel_example.py` (Codes-Format mit Eingabezeile „+ /code“ und
  Vorher→Nachher-Wisch) und `scripts/build_variants_reel_example.py` (Varianten-Format mit Clips).
  Zeiten, Texte und Dateien anpassen; Grenzen aus den Wort-Zeitstempeln.
- Sekunde 0: fertiges Ergebnis + Hook-Overlay (DejaVu Sans Bold 23, Box schwarz 55 %).
- **Keine Overlays über Gesichtern.** Bei Rastern mit Gesichtern oben (Hook, CTA) das Bild mit einem
  84 px Streifen oben in Nachtblau einrücken und den Text dort platzieren. „Nachher“-Schild weglassen,
  wenn es ein Gesicht verdecken würde.
- Ende: „Kommentiere PROMPT“ + „@jorge.ai.studio“. Lautstärke `loudnorm=I=-15:TP=-1.5`.
- Prüfen: Dauer, 8–12 Einzelbilder als Kontaktbogen ansehen, Lautstärke.

### 6. Cover (Tool-Hook-Stil)
- Personenbild: `gpt_image_2_5` quality low, 1k, 9:16 (0,25 Credits), Referenzen = Jorges Foto +
  ein Ergebnisbild. Olivfarbenes Overshirt + weißes T-Shirt, **niemals Sakko/Anzug**, mittig, Kopf im
  oberen Drittel, hält Handy mit Ergebnis und zeigt darauf, einfarbiger Hintergrund in der Reel-Farbe
  (Wechsel: Petrol #2E6B5E, Lila #5B4FB8, Rosé #C98A93, Ocker #B8862E, Nachtblau #1E2F4F), kein Text im Bild.
- Freistellen mit rembg `u2net_human_seg`; danach den **Handybildschirm** aus dem Original wieder
  einsetzen (rembg löscht ihn sonst).
- Zusammensetzen mit `scripts/cover_toolhook_v5.py`:
  `python3 scripts/cover_toolhook_v5.py person_cut.png cover.jpg --bg "#HEX" --l1 "ZEILE 1|ZEILE 2|ZEILE 3" --script "mit 4 Codes" --tools chatgpt --person-top 400 --extra '[["vorher.jpg",30,248,7,"vorher",[170,228]], ["ergebnis1.png",800,240,-7,null,[200,255]], …]' [--snow]`
- **Pflicht:**
  - **ALLE Ergebnisbilder** als schräge Polaroids + **ein Vorher-Foto** mit Beschriftung „vorher“
    (ein Ergebnis darf stattdessen auf dem Handy zu sehen sein). Nichts verdeckt Gesicht, Handy oder Text.
  - **Nur das ChatGPT-Icon** (`--tools chatgpt`). Kein Higgsfield-Icon, auch wenn intern Higgsfield genutzt wurde.
  - **Headline = der Hook** (bis 3 Zeilen, Großbuchstaben), darunter türkise Pointe („mit einem Foto“, „mit 4 Codes“).
  - Schnee (`--snow`) nur bei Weihnachtsthemen.
- Titelbild- und Raster-Vorschau (`*_raster34.jpg`) ansehen; nichts abgeschnitten.

### 7. Beschreibung
- Erster Satz = Hook. Zweiter Satz = was man bekommt. Bei Codes: Block „⚙️ EINMAL EINRICHTEN“ mit dem
  kompletten Einrichtungstext; sonst „So geht’s in ChatGPT“ + **alle Prompts vollständig**.
- Ehrlichkeitshinweis (KI-Interpretation / KI-generierte Personen / „keine professionelle Beratung“).
- CTA: „📌 Speicher dir das …“, „💬 Kommentiere PROMPT und folge @jorge.ai.studio“, „📤 Schick das jemandem, der …“.
- 8–12 Hashtags **mit echtem `#`** (niemals `%23`).
- **Max. 2.200 Zeichen** – vorher zählen; sonst Text rund um die Prompts kürzen, Prompts bleiben vollständig.

### 8. Google Doc + Bibliothek
- Nächste freie Nummer **in Drive** suchen (`title contains 'NNN |'`) – parallele Sitzungen vergeben auch
  Nummern. Titel „NNN | Thema | /viralprompt5“.
- Inhalt (als HTML per Drive create_file): Titel, Anleitung, Einrichtungstext, alle Prompts vollständig,
  Hinweis, „Mehr KI-Tricks: @jorge.ai.studio · Alle Prompts: jorge-prompts.vercel.app“. Keine internen Infos.
- Freigabe: Composio `GOOGLEDRIVE_CREATE_PERMISSION` (anyone, reader, allow_file_discovery false), prüfen.
- Bibliothek (Doc `1KWSctp9cdz7tMZ4EruC9yaogcJ1qmYofMO7c1qZhzHw`): Eintrag nach dem letzten Eintrag,
  Zusatz „noch nicht veröffentlicht“.

### 9. Übergabe an Jorge
- Video und Cover per `media_upload` zu Higgsfield hochladen → direkte cloudfront-Links (fürs Handy),
  zusätzlich `SendUserFile` mit Video, Cover, Beschreibung (.txt).
- Liefern: **Video-Link, Cover-Link, Beschreibung, Doc-Link**, Kosten gesamt, Auffälligkeiten.
- Dann fragen: **„Soll ich es als Testreel oder normal veröffentlichen?“**

### 10. Veröffentlichen (erst nach Jorges Antwort)
- **Normal:** Composio Instagram, Konto `instagram_savin-tee` (@jorge.ai.studio), ig_user_id
  `17841458432692282`: `INSTAGRAM_POST_IG_USER_MEDIA` (media_type REELS, share_to_feed true,
  video_url + cover_url als cloudfront-Links, caption mit echtem `#`) → `INSTAGRAM_POST_IG_USER_MEDIA_PUBLISH`
  (max_wait_seconds 240) → `INSTAGRAM_GET_IG_MEDIA` prüfen (Caption, Permalink). Niemals auf @jorgepnt.
- **Testreel:** Die Schnittstelle kann keine Probe-Reels. Jorge postet selbst in der App: Video und Cover
  speichern → + → Reel → Titelbild aus Galerie → Beschreibung einfügen → „Probe-Reel“ einschalten → Teilen.
  Danach den Link über `INSTAGRAM_GET_IG_USER_MEDIA` suchen.
- Danach: Bibliothekseintrag mit Instagram-Link ergänzen; Prompt-Seite **jorge-prompts.vercel.app**
  (Vercel-Projekt `jorge-prompts`, Team `team_1o75Rq6lTNMfbc9zjkkpvFDI`) aktualisieren: gelber „NEU“-Knopf
  auf das neue Doc, Eintrag in passende Kategorie, Anzahl hochzählen, neu deployen und online prüfen.

### 11. ManyChat (direkt nach Veröffentlichung)
- Mit Claude in Chrome (falls verbunden) wie in v4 Punkt 30 einrichten. Sonst fertige Texte liefern:
  Auslöser nur dieser Beitrag; Stichwörter PROMPT, Prompt, prompt, Promt; 3 öffentliche Antworten;
  Eröffnungs-DM mit Button; zweite DM mit Button zum Google Doc.
- Wenn Jorge „live“ meldet: in der Bibliothek „ManyChat-Automation LIVE“ eintragen.
- 48-Stunden-Check anbieten (Zeitpunkt nennen).

## ABSCHLUSSKONTROLLE
- [ ] Analyse + eigene Codes/Prompts, ehrlich (Einrichtungstext bei Codes)
- [ ] Kosten genannt, Budget eingehalten
- [ ] Stimme vollständig, ≤ 30 s, „George“ und „Prompt“ korrekt
- [ ] Keine Overlays über Gesichtern, Untertitel synchron
- [ ] Cover: alle Bilder + Vorher, nur ChatGPT-Icon, Hook als Headline, Raster-Vorschau ok
- [ ] Beschreibung ≤ 2.200 Zeichen, echte `#`
- [ ] Doc mit freier Nummer, Freigabe geprüft, Bibliothek
- [ ] Übergabe: Video, Beschreibung, Cover, Doc – dann Frage „Testreel oder normal?“
- [ ] Nach Veröffentlichung: Bibliothek, Prompt-Seite, ManyChat
