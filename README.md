# Reise Deal Finder

Deutsche React-Web-App zum Finden von Reise-Deals für Lissabon und weitere Städte. Die App ist für GitHub Pages vorbereitet und nutzt eine Agenten-Architektur für Frontend, Flugpreise, Hotels und tägliche Preisalarme.

## Funktionen

- Dunkles responsives Frontend mit Stadtauswahl, Reisezeitraum, Budget und Personen
- Deal-Karten mit Bild, Flugpreis, Hotelpreis, Gesamtpreis, Datum, Hotelbewertung und Preisfall
- Bonus-Tab mit Aktivitäten-Empfehlungen für Lissabon und die gewählte Stadt
- Agenten-Tab mit Quellen für Skyscanner, Google Flights, Booking und HRS
- Täglicher Scheduled Task um 07:00 Uhr deutscher Zeit via GitHub Actions
- Preisvergleich gegen Vortag mit Alert-Regel ab mehr als 10 Prozent Preisfall
- Push-Schalter im UI, damit Alarme per Klick deaktivierbar sind

## Agenten

1. Frontend-Agent: React/Vite UI, dunkles Design und Deal-Übersicht.
2. Flug-Agent: Browser-Adapter für Skyscanner und Google Flights, normalisiert Preise pro Datum.
3. Hotel-Agent: Browser-Adapter für Booking und HRS, sortiert nach Preis-Leistung und Bewertung.
4. Scheduled-Agent: `scripts/crawl-deals.mjs` läuft täglich, erzeugt Snapshots unter `public/data/` und markiert Preisalarme.

Die aktuelle Version bringt robuste Seed-Daten und klare Adapterpunkte mit. Echte Browser-Scraper können in `scripts/crawl-deals.mjs` ergänzt werden, ohne das Frontend umzubauen.

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
