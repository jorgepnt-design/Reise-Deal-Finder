# Jorge's Reise-Deal-Finder

Deutsche React-Web-App zum Finden von Reise-Deals für Lissabon und weitere Städte. Die App ist für GitHub Pages vorbereitet und nutzt eine Agenten-Architektur für Frontend, Flugpreise, Hotels und tägliche Preisalarme.

## Funktionen

- Dunkles responsives Frontend mit Stadtauswahl, Reisezeitraum, Budget und Personen
- Deal-Karten mit Bild, Flugpreis, Hotelpreis, Gesamtpreis, Datum, Hotelbewertung und Preisfall
- Klickbare Deal-Details mit Preisverlauf, Quellen, Prüfzeitpunkt, Gepäckstatus und Stornierungsinfo
- Erweiterte Filter für Direktflug, Reisedauer, Wochenende, Hotelbewertung, Gepäck, Datumstoleranz und Uhrzeitfenster
- Flexible Suche für Juli, lange Wochenenden, Deals unter 500 Euro pro Person und +/- 1 bis 3 Tage
- Eigener Flüge-Tab mit Datum, Abflugzeit, Ankunftzeit, Gepäckstatus, Quelle, Preis pro Person und Gesamtpreis
- Eigener Flug + Hotel-Tab mit Flugdetails, Hotelname, Viertel, Straße, Preisaufteilung und Google-Maps-Link
- Deals zeigen konkrete Hotelinfos, getrennte Flug-/Hotelsuche und Komplettangebote über Booking.com Packages
- Merkliste für gespeicherte Deals, einzelne Flüge, Flug + Hotel-Angebote und Favoriten für Zielstädte
- Bonus-Tab mit Aktivitäten-Empfehlungen für Lissabon und die gewählte Stadt
- Agenten-Tab mit Quellen für Skyscanner, Google Flights, Booking und HRS
- Täglicher Scheduled Task um 07:00 Uhr deutscher Zeit via GitHub Actions
- Preisvergleich gegen Vortag mit Alert-Regel ab mehr als 10 Prozent Preisfall
- Push-Schalter im UI, Browser-Notifications und Service-Worker-Handler für spätere Web-Push-Backends

## Agenten

1. Frontend-Agent: React/Vite UI, dunkles Design und Deal-Übersicht.
2. Flug-Agent: Browser-Adapter für Skyscanner und Google Flights, normalisiert Preise pro Datum.
3. Hotel-Agent: Browser-Adapter für Booking und HRS, sortiert nach Preis-Leistung und Bewertung.
4. Scheduled-Agent: `scripts/crawl-deals.mjs` läuft täglich, erzeugt Snapshots unter `public/data/` und markiert Preisalarme.

Die aktuelle Version bringt robuste Seed-Daten und klare Adapterpunkte mit. Echte Browser-Scraper können in `scripts/crawl-deals.mjs` ergänzt werden, ohne das Frontend umzubauen. Für echte Live-Daten kann `VITE_DEAL_API_URL` auf einen eigenen Flug-/Hotelpreis-Endpunkt zeigen; die App fällt automatisch auf Snapshots zurück, wenn kein Endpoint gesetzt ist.

## Installation

```bash
npm install
```

## Entwicklung

```bash
npm run dev
```

## Build

```bash
npm run build
```

## Deal-Agent lokal ausführen

```bash
npm run crawl:deals
```

## Deployment

Das Repository ist für GitHub Pages auf `/Reise-Deal-Finder/` konfiguriert. Der Workflow `.github/workflows/deploy-pages.yml` baut die App automatisch bei Push auf `main`.

## Echte Flugpreise mit Vercel und Duffel

Das Frontend bleibt auf GitHub Pages. Der Backend-Endpunkt liegt unter `api/deals.js` und kann als Vercel Serverless Function deployed werden.

### 1. Duffel-Zugangstoken erstellen

1. Auf https://app.duffel.com/ einloggen.
2. Oben zu `Entwickler` wechseln.
3. Links `Zugangstoken` öffnen.
4. `Create Token` klicken.
5. Einen Testmodus-Token mit Lesezugriff oder Lese-/Schreibzugriff erstellen.
6. Den vollständigen Token direkt kopieren. Er beginnt mit `duffel_test_`.

### 2. Vercel-Projekt verbinden

1. Repository in Vercel importieren.
2. Als Framework kann `Other`/statisches Projekt verwendet werden.
3. Environment Variables setzen:

```text
DUFFEL_ACCESS_TOKEN=duffel_test_dein_neuer_token
ALLOWED_ORIGIN=https://jorgepnt-design.github.io
PUBLIC_APP_URL=https://jorgepnt-design.github.io/Reise-Deal-Finder/
```

### 3. Frontend mit Backend verbinden

In GitHub Actions bzw. beim GitHub-Pages-Build muss gesetzt werden:

```text
VITE_DEAL_API_URL=https://dein-vercel-projekt.vercel.app/api/deals
```

Danach ruft die App echte Flugangebote über Duffel ab. Wenn der Vercel-Endpunkt nicht erreichbar ist oder keine Credentials gesetzt sind, fällt die App weiter auf Richtpreise zurück.

### 4. Hotels als nächster Schritt

Hotels sind im ersten Backend-Schritt noch nicht live angebunden. Dafür ist später eine Hotel-API nötig, z. B. Booking.com Demand API mit Affiliate-Zugang oder eine andere Hotel-Partnerlösung.
