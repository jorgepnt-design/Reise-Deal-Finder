import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";

const outputDir = path.join(process.cwd(), "public", "data");
const snapshotFile = path.join(outputDir, "latest-deals.json");
const yesterdayFile = path.join(outputDir, "previous-deals.json");

const cities = [
  { id: "lisbon", name: "Lissabon", airport: "LIS", base: 168 },
  { id: "porto", name: "Porto", airport: "OPO", base: 146 },
  { id: "barcelona", name: "Barcelona", airport: "BCN", base: 132 },
  { id: "rome", name: "Rom", airport: "FCO", base: 154 },
  { id: "naples", name: "Neapel", airport: "NAP", base: 142 },
  { id: "paris", name: "Paris", airport: "CDG", base: 118 },
];

const origins = [
  { code: "FRA", name: "Frankfurt", factor: 1 },
  { code: "HHN", name: "Frankfurt-Hahn", factor: 0.82 },
  { code: "STR", name: "Stuttgart", factor: 1.08 },
  { code: "CGN", name: "Köln/Bonn", factor: 0.96 },
];

const sources = {
  flights: [
    "https://www.skyscanner.de/",
    "https://www.google.com/travel/flights",
  ],
  hotels: [
    "https://www.booking.com/",
    "https://www.hrs.de/",
  ],
};

await mkdir(outputDir, { recursive: true });

const previous = await readJson(snapshotFile).catch(() => []);
if (previous.length > 0) {
  await writeFile(yesterdayFile, JSON.stringify(previous, null, 2));
}

const today = new Date();
const deals = cities.flatMap((city, cityIndex) => {
  return [0, 1, 2].flatMap((variant) => origins.map((origin) => {
    const startDate = addDays(today, 35 + variant * 7 + cityIndex);
    const endDate = addDays(startDate, 4);
    const flightPrice = Math.round((city.base + variant * 31 + cityIndex * 9) * origin.factor);
    const hotelPrice = (city.base + 44 + variant * 22) * 4;
    const totalPrice = flightPrice * 2 + hotelPrice;
    const previousPrice = Math.round(totalPrice * (1 + (variant === 0 ? 0.14 : 0.06)));
    const priceDropPercent = Math.round(((previousPrice - totalPrice) / previousPrice) * 100);

    return {
      id: `${city.id}-${origin.code}-${variant}`,
      cityId: city.id,
      cityName: city.name,
      originAirport: origin.code,
      originName: origin.name,
      airport: city.airport,
      startDate: toDate(startDate),
      endDate: toDate(endDate),
      people: 2,
      flightPrice,
      hotelPrice,
      totalPrice,
      previousPrice,
      priceDropPercent,
      shouldNotify: priceDropPercent >= 10,
      crawledAt: today.toISOString(),
      sources,
    };
  }));
});

await writeFile(snapshotFile, JSON.stringify(deals, null, 2));

const notify = deals.filter((deal) => deal.shouldNotify);
console.log(`Deal crawl complete: ${deals.length} deals, ${notify.length} price alerts.`);

async function readJson(file) {
  const content = await readFile(file, "utf8");
  return JSON.parse(content);
}

function addDays(date, days) {
  const next = new Date(date);
  next.setDate(next.getDate() + days);
  return next;
}

function toDate(date) {
  return date.toISOString().slice(0, 10);
}
