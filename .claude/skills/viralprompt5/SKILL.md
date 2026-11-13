---
name: viralprompt5
description: >-
  Masterprompt /viralprompt5 für Jorge.ai.studio (zusammengeführte Fassung 13.11.2026): Reels für
  @jorge.ai.studio – aus einem hochgeladenen Fremd-Reel (Remake) oder einem Thema entsteht vollautomatisch
  eine eigene, ehrliche Version mit Jorges Higgsfield-Stimme, eigenen Bildern, großen Untertiteln, optional
  HeyGen-Avatar-Kreis (immer vorher fragen), Tool-Hook-Cover, Beschreibung, nummeriertem Google Doc,
  Bibliothek, öffentlicher Prompt-Seite, Veröffentlichung (Probe-Reel per API), ManyChat und Performance-Check.
  Nutzen, wenn Jorge /viralprompt5 schreibt, ein Video schickt und es „auf die gleiche Weise neu“ haben will
  oder ein Reel für @jorge.ai.studio produzieren, remaken oder veröffentlichen möchte. Ersetzt /viralprompt4.
---

# JORGE AI STUDIO — /viralprompt5 MASTERPROMPT (zusammengeführt)

Version 5.1 | Stand 13.11.2026 | Zusammenführung aus Repo-Skill (Remake-Ablauf, 05.11.) und claude.ai-Skill
(Strategie, Avatar, Cover, ManyChat, 04.11.) plus Jorges Vorgaben vom 13.11. Referenz-Doc in Google Drive:
„JORGE AI STUDIO – MASTERPROMPT /viralprompt5 (verbindlich)“
(https://docs.google.com/document/d/18cQhxJ6C5PeqWM3LDLo62X6-pCC-ri7LADkVNQ3omhU/edit).
Regeländerungen nur nach Jorges Freigabe – dann **Skill UND Doc** nachziehen.

Skripte: `scripts/transcribe.py` (Wort-Zeitstempel), `scripts/build_codes_reel_example.py` (Codes-Format),
`scripts/build_variants_reel_example.py` (Varianten-Format), `scripts/avatar_circle.sh` (HeyGen-Kreis),
`scripts/cover_toolhook_v5.py` (Cover), `scripts/icons/`, `scripts/fonts/` (Anton, Playfair Display Italic).

## GRUNDPRINZIP

Jorge schickt ein Video (meist ein fremdes Reel) oder ein Thema. Du baust eine **eigene Version**: gleiche
Idee und Dramaturgie, aber eigene deutsche Codes/Prompts, eigener Sprechertext, Jorges Fotos und Stimme.
**Du machst alles selbst bis zum Ende.** Pflicht-Rückfragen gibt es nur zwei:
1. **Am Anfang (zusammen mit der Kurzanalyse): „Soll der HeyGen-Avatar-Kreis mit rein – ja oder nein?“**
   Immer fragen, nie selbst entscheiden. Bis zur Antwort darf alles vorbereitet werden, was nicht davon
   abhängt (Bilder, Stimme); der Schnitt wartet auf die Antwort.
2. **Vor dem Veröffentlichen: „Testreel oder normal?“**
Ohne Video und ohne Thema: drei Themenvorschläge mit Themencheck und Hooks vorlegen.
Am Ende bekommt Jorge: **Video, Cover, Beschreibung, Doc** (Links + Dateien).

## PHASE 0 — STRATEGIE (was nachweislich funktioniert)

Fokus: KI-Tricks, bei denen der Zuschauer SICH SELBST oder SEIN EIGENES FOTO verwandelt sieht. Haupt-Kennzahl
ist **SPEICHERN**. Top-Belege (27.–31.10.): Weihnachtsposter 9.285 Aufrufe/300 Saves, Schneekugel 5.102/81,
Haustier als Filmstar 4.019/75. Schwach: reine Spar-/Bürotipps, themenfremde Inhalte, Reels über 35 s.

Themen-Priorität: **A Foto-Verwandlung ~70 %** (eigenes Foto, Haustier, Familie, Kinder-Ich) · **B Saison/
Emotion ~20 %** (3–6 Wochen vorher) · **C Alltag/Sparen max. 10 %** (nur mit sichtbarem Vorher-Nachher).

**Themencheck** (mind. 4 von 5 Ja, sonst Thema anpassen bzw. als Test-Kategorie C kennzeichnen):
1. Sieht der Zuschauer sich/sein Tier/seine Familie im Ergebnis? 2. Ist das Ergebnis ein BILD für Sekunde 0–1?
3. Mindestens drei Varianten? 4. Emotion oder Saison? 5. Grund zum Aufheben, Ausdrucken, Verschenken?

**Hook-Regeln:** „Du/Dein“ vorne · konkretes Bild · max. 12 Wörter · kein Toolname im ersten Satz · normale
Groß-/Kleinschreibung, 1 Emoji am Ende · gesprochener Hook = Bildschirm-Hook = erster Satz der Beschreibung.
Formeln: „Dein [Foto/Haustier/Familie] als [A], [B] oder [C]? ✨“ / „Hast du dich schon mal als … gesehen?“

**Länge:** 18–25 s, **max. 30 s**. Sekunde 0–1: fertiges Ergebnisbild + Hook. Danach Vorher→Nachher,
Varianten, kurzes „So geht’s“, CTA. Ziel: Abbruch 0–3 s < 55 %, Ø gesehen > 40 %.

## 1. ANALYSE DES VIDEOS

- Kopie in eigenen Ordner, `ffprobe`, Kontaktbogen: `ffmpeg -i src -vf "fps=1,scale=180:-2,tile=5x4" sheet_%02d.jpg`, ansehen.
- Ton transkribieren: `python3 scripts/transcribe.py src.mp4 words.json` (faster-whisper; ggf. `pip install faster-whisper`).
- Festhalten: Hook, Ablauf mit Sekunden, Anzahl Codes/Varianten, CTA, Länge, Original-Account.
- **Ehrlichkeits-Check:** Slash-Befehle gibt es in ChatGPT nicht. Codes bekommen einen **Einrichtungstext**
  (ChatGPT → Einstellungen → Personalisierung → Benutzerdefinierte Anweisungen). Keine erfundenen Behauptungen.
- Fremde Logos, Moderatoren, Untertitel nicht übernehmen.

## 2. EIGENE VERSION PLANEN + KURZMELDUNG

- Eigene **deutsche** Codes/Varianten (nicht die Namen des Originals), gleiche Anzahl.
- Sprechertext ca. 45–60 Wörter: Hook → „X Codes, einmal in ChatGPT gespeichert.“ (bei Codes) → je Code ein Satz →
  Abschluss „Speicher dir das, kommentiere Prompt und folge George Punkt A I Punkt Studio.“
- „Slash X“ im Sprechertext, im Bild/Untertitel „/x“.
- **Kurzmeldung an Jorge:** Analyse in 3–4 Zeilen, Codes, genaue Kosten (Higgsfield + ggf. HeyGen-Kontostand)
  **+ die Avatar-Frage** – dann direkt weiterarbeiten.

## 3. AUSGANGSFOTOS

- Fotos von Jorge haben Vorrang. Sonst Jorges frontales Referenzfoto aus Higgsfield (media_id `2ee5aa8e-128b-4172-a3a3-f84cdd4b53ee`).
- Familie/Kinder/fremde Personen ohne Foto: fiktiv per gpt_image_2_5 erzeugen, in der Beschreibung „KI-generiert“.
  Echte Kinderfotos nur, wenn Jorge sie schickt.
- Uploads: `media_upload` → `curl -X PUT -H "Content-Type: …" -H "If-None-Match: *" --data-binary @datei URL` → `media_confirm`.

## 4. BILDER, STIMME, ANIMATION (Higgsfield)

- **Vor jedem Job Kosten per `get_cost`**, Summe nennen. Budget ohne Rückfrage bis **15 Credits** pro Reel, darüber fragen.
  Keine Varianten/Retakes ohne Grund; bei klarem Fehler **einmal** neu und sagen warum.
- Ergebnisbilder: `gpt_image_2_5`, quality **medium**, 1k, 3:4 (0,5 Credits). Prompts auf Deutsch, „Gesicht exakt wie
  im Original“, Beschriftungen „gut lesbare deutsche Schrift ohne Tippfehler“. Jedes Bild ansehen.
- Freistellen u. Ä. lokal ohne Credits (rembg `u2net_human_seg`).
- **Stimme (absolut verbindlich):** `seed_audio`, voice_type `element`, voice_id `292bf8af-9d89-4758-a455-c8c4cd473d97`
  („Jorge (HeyGen)“), `use_unlim: false`. „Jorge“ = „George“; „Prompt“ als Wort, nie buchstabiert.
  Danach transkribieren und prüfen (vollständig, „Prompt“, „George.ai.studio“ am Ende). Keine Ersatzstimme.
- **Max. 30 s:** zuerst Pausen > 0,6 s auf ~0,44 s kürzen, dann ggf. `atempo` bis 1,08. Nie Wörter schneiden.
- Animation nur bei Szenen-Bildern: Seedance 2.0 Mini, 480p, 5 s, 3:4, ohne Ton (2,5 Credits/Clip). Raster/Infografiken nicht.

## 5. HEYGEN-AVATAR-KREIS (NUR WENN JORGE „JA“ SAGT)

- Kopf aus HeyGen als **Kreis unten rechts** im Bildbereich, die ganze Zeit, lippensynchron zur Higgsfield-Stimme.
- Look: Fotoavatar „Jorge with the marathon guide“ (avatar_id `48ffaa17319a4f529e14bcb5ebd8c017`).
  NIEMALS „Jorge Sakko navy“, keine fremden Avatare.
- Erzeugen: HeyGen `create_video_from_avatar`, audioUrl = cloudfront-URL der GEPRÜFTEN Higgsfield-Stimme,
  aspectRatio 1:1, 720p, fit cover. Dann `get_video` bis completed.
- Kosten: HeyGen hat keine Kostenabfrage → vorher Kontostand (`get_current_user`) nennen; Referenz ~11 Add-on-Credits
  für ~29 s; danach neuen Kontostand nennen.
- Download: files2.heygen.ai ist gesperrt → Higgsfield `media_import_url` (type video) → `show_medias` → cloudfront → curl.
- Zuschnitt 720×720 → `crop=300:300:CROP_X:0` (kein Buch, das beginnt bei y≈315); CROP_X = Kopfmitte − 150.
- Kreis 176 px, weißer Ring 3 px, unten rechts im 480×650-Bild, nie im Untertitelstreifen.
  `scripts/avatar_circle.sh base.mp4 avatar.mp4 voice.wav over.ass subs.ass out.mp4 [CROP_X]` (Ton-Master = Higgsfield-WAV).
- Prüfen: Standbilder bei ~1 s, Mitte, Ende (Kopf mittig, Ring rund, Lippen bewegen sich).
- Beschreibung: „Der Avatar ist KI-generiert.“

## 6. SCHNITT (lokal, ffmpeg)

- Format 480×854: Bild 480×650 oben, Untertitelstreifen 480×204 (0x111111) unten.
- **SCHRIFTGRÖSSEN – IMMER (Jorges feste Vorgabe 13.11.2026):**
  - **Untertitel: DejaVu Sans Bold 34** (MarginL/R 16, MarginV 34) – 38 war zu groß, 30 zu klein.
  - **Bild-Overlays (Hook, „Vorher“, CTA): 32**, Box schwarz 55 %. Hook in kurze Zeilen (max. ~22 Zeichen) umbrechen.
  - **Code-Eingabezeile und Code-Karte: 34** (Kartentitel 40).
- Untertitel selbst aus dem gesprochenen Text, synchron nach Wort-Zeitstempeln, max. zwei Zeilen, keine Schrägstriche als Trenner.
- Sekunde 0: fertiges Ergebnis + Hook-Overlay. **Keine Overlays über Gesichtern:** bei Hook/CTA das Bild mit einem
  **142 px** Streifen oben (Nachtblau) einrücken und den Text dort setzen; „Vorher“-Schild unten links über der Eingabezeile.
- Ende: „Kommentiere PROMPT“ + „@jorge.ai.studio“. Ton `loudnorm=I=-15:TP=-1.5`. Export H.264 High, yuv420p, AAC 160k, faststart.
- Prüfen: Dauer, 8–12 Einzelbilder als Kontaktbogen, Lautstärke.

## 7. COVER (Tool-Hook-Stil, 1080×1920)

- Personenbild: `gpt_image_2_5` quality low, 1k, 9:16 (0,25 Credits), Referenzen = Jorges Foto + ein Ergebnisbild.
  Olivfarbenes Overshirt + weißes T-Shirt, **niemals Sakko/Anzug**, mittig, Kopf im oberen Drittel, hält Handy mit
  Ergebnis und zeigt darauf, einfarbiger Hintergrund in Reel-Farbe (Wechsel: Petrol #2E6B5E, Lila #5B4FB8,
  Rosé #C98A93, Ocker #B8862E, Nachtblau #1E2F4F), kein Text im Bild.
- Freistellen mit rembg `u2net_human_seg`, danach den **Handybildschirm** aus dem Original wieder einsetzen.
- Zusammensetzen: `python3 scripts/cover_toolhook_v5.py person_cut.png cover.jpg --bg "#HEX" --l1 "ZEILE 1|ZEILE 2|ZEILE 3" --script "mit 3 Codes" --tools chatgpt --person-top 400 --extra '[["vorher.jpg",28,250,7,"vorher",[190,240]], …]' [--snow]`
- **COVER-SCHRIFT GROSS – IMMER:** Headline **mindestens 115 px** (Ausgabe „Headline NN px“ prüfen). Dafür den Hook
  auf die Kernwörter kürzen: max. 3 Zeilen à ~12 Zeichen (Beispiel 090: „DEIN FOTO|OHNE FREMDE|ODER MIT DIR?“ = 120 px).
  Lange Hooks nie komplett aufs Cover.
- Pflicht: **alle Ergebnisbilder** als schräge Polaroids + **ein Vorher-Foto** („vorher“); nichts verdeckt Gesicht,
  Handy oder Text. **Nur das ChatGPT-Icon.** Türkise Pointe darunter. Schnee nur bei Weihnachten.
- Titelbild- und Raster-Vorschau (`*_raster34.jpg`) ansehen; nichts abgeschnitten.

## 8. BESCHREIBUNG

- Erster Satz = Hook. Zweiter Satz = was man bekommt. Bei Codes: „⚙️ EINMAL EINRICHTEN“ mit komplettem Einrichtungstext
  + „▶️ SO NUTZT DU ES“; sonst „So geht’s in ChatGPT“ + **alle Prompts vollständig**.
- Ehrlichkeitshinweis (KI-Interpretation / KI-generierte Personen / ggf. Avatar KI-generiert / keine Beratung).
- CTA: „📌 Speicher dir das …“, „💬 Kommentiere PROMPT und folge @jorge.ai.studio“, „📤 Schick das jemandem, der …“.
- **Genau 5 Hashtags** mit echtem `#` (nie `%23`). **Max. 2.200 Zeichen** – zählen.
- DM-Vorlage mit Link zum Google Doc mitliefern.

## 9. GOOGLE DOC, BIBLIOTHEK, PROMPT-SEITE

- Nächste freie Nummer **in Drive** suchen (`title contains 'NNN |'`), nie nur in der Bibliothek. Titel „NNN | Thema | /viralprompt5“.
- Inhalt (HTML per Drive `create_file`): Titel, Anleitung, Einrichtungstext, alle Prompts vollständig, Hinweis,
  „Mehr KI-Tricks: @jorge.ai.studio · Alle Prompts: jorge-prompts.vercel.app“. **Keine internen Infos**
  (Modelle, Higgsfield/HeyGen, Credits, Stimme, Schnitt, Workflows).
- Freigabe „Jeder mit dem Link → Betrachter“ (Drive `share_file` permissionId `anyoneWithLink` reader oder Composio), mit
  `get_file_permissions` prüfen.
- Bibliothek (Doc `1KWSctp9cdz7tMZ4EruC9yaogcJ1qmYofMO7c1qZhzHw`): Eintrag nach dem letzten, mit Status.
- Nach Veröffentlichung: **Prompt-Seite jorge-prompts.vercel.app** (Vercel-Projekt `jorge-prompts`, eine index.html):
  aktuelle Datei per `web_fetch_vercel_url` holen, gelben „NEU“-Knopf aufs neue Doc, Eintrag oben in passende Kategorie,
  Kategorie- und Gesamtzähler hochzählen, per `create_deployment` (target production) veröffentlichen, live prüfen.
  Zusätzlich Doc „Alle Prompts von @jorge.ai.studio“ (`1nBlbkbGtCL-MpFWeS9FxPbSpj_806Fo3NI0wsOQuSEI`): Zeile „Neu:“ + Eintrag.

## 10. ÜBERGABE

- Video und Cover per `media_upload` zu Higgsfield → cloudfront-Links (Handy), zusätzlich `SendUserFile` mit Video,
  Cover, Beschreibung (.txt).
- Liefern: Video-Link, Cover-Link, Beschreibung, Doc-Link, Kosten gesamt, Auffälligkeiten.
- Dann fragen: **„Soll ich es als Testreel oder normal veröffentlichen?“**

## 11. VERÖFFENTLICHEN (immer selbst, erst nach Jorges Antwort)

Konto @jorge.ai.studio (Composio `instagram_heresy-kmet`, ig_user_id `17841458432692282`). Niemals auf @jorgepnt.
- **Testreel (Probe-Reel):** Composio `COMPOSIO_PROXY_EXECUTE` (toolkit instagram) POST
  `https://graph.instagram.com/v21.0/17841458432692282/media` mit JSON `{media_type: REELS, video_url, cover_url,
  share_to_feed: true, trial_params: {graduation_strategy: "MANUAL"}, caption}` → `INSTAGRAM_POST_IG_USER_MEDIA_PUBLISH`
  (creation_id, max_wait_seconds 240) → `INSTAGRAM_GET_IG_MEDIA`: `is_shared_to_feed` = false, Permalink notieren.
  Jorge postet NICHT selbst in der App.
- **Normal:** gleicher Weg ohne `trial_params` (oder `INSTAGRAM_POST_IG_USER_MEDIA` mit share_to_feed true).
- **Danach immer prüfen, ob die Beschreibung zum Reel passt** (bei 089 war versehentlich die von 088 drin). Beschreibungen
  lassen sich per API nicht nachträglich ändern – dann Jorge den richtigen Text zum Einfügen in der App geben.
- Danach: Bibliothek mit Instagram-Link, Prompt-Seite + Alle-Prompts-Doc aktualisieren.

## 12. MANYCHAT (direkt nach jeder Veröffentlichung)

- Mit Claude in Chrome (falls verbunden): app.manychat.com → Automation → New Automation → Vorlage
  „Auto-DM links from comments“. Trigger **nur dieser Beitrag**; Stichwörter PROMPT, Prompt, prompt, Promt;
  öffentliche Antworten an (3 deutsche Varianten); Eröffnungs-DM mit Button; zweite DM mit Button zum Google Doc
  **dieses** Beitrags; Folgen-Pflicht und E-Mail-Abfrage aus; Texte per Formularfeld setzen, Vorschau prüfen,
  Go Live, in der Liste als LIVE prüfen. Bestehende Automationen nicht verändern.
- Ohne Chrome (z. B. Cloud-Sitzung): fertige Texte liefern und klar sagen, dass es nur mit verbundenem Chrome geht.
- Wenn Jorge „live“ meldet: in der Bibliothek „ManyChat-Automation LIVE“ eintragen.

## 13. PERFORMANCE UND COMMUNITY

- **48-Stunden-Check** anbieten (Zeitpunkt nennen): Aufrufe, Reichweite, Saves, Shares, Kommentare, reels_skip_rate,
  ig_reels_avg_watch_time, Anteil gesehen. **Top** Saves/Reichweite ≥ 2 %, Abbruch ≤ 55 %, gesehen ≥ 40 % ·
  **Okay** 0,5–2 % · **Flop** < 0,5 % oder Abbruch ≥ 70 %.
- **Wochen-Review** auf Wunsch: 7 vs. 7 Tage, Top/Flop 5 nach Saves, Phase-0-Regeln nur nach Freigabe anpassen.
- **Kommentare:** einteilen (Frage/Lob/Spam), Antwortvorschläge im lockeren Du-Ton mit 1 Emoji, nie ohne Freigabe antworten.

## ABSCHLUSSKONTROLLE

- [ ] Analyse + eigene Codes/Prompts, ehrlich (Einrichtungstext bei Codes), Themencheck
- [ ] **Avatar-Frage gestellt** und Antwort umgesetzt
- [ ] Kosten genannt, Budget eingehalten
- [ ] Stimme vollständig, ≤ 30 s, „George“ und „Prompt“ korrekt
- [ ] Untertitel 34, Overlays 32, keine Overlays über Gesichtern, synchron
- [ ] Cover: Headline ≥ 115 px, alle Bilder + Vorher, nur ChatGPT-Icon, Raster-Vorschau ok
- [ ] Beschreibung ≤ 2.200 Zeichen, genau 5 Hashtags mit echtem `#`
- [ ] Doc mit freier Nummer, Freigabe geprüft, Bibliothek
- [ ] Übergabe – dann „Testreel oder normal?“ – selbst veröffentlichen, Beschreibung am Reel prüfen
- [ ] Bibliothek, Prompt-Seite, Alle-Prompts-Doc, ManyChat; 48-h-Check angeboten
