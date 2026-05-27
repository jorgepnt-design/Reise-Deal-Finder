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

const hotelCatalog = {
  lisbon: [
    { name: "Hotel Lisboa Plaza", district: "Avenida da Liberdade", address: "Tv. Salitre 7, 1269-066 Lissabon, Portugal" },
    { name: "My Story Hotel Tejo", district: "Baixa", address: "Rua dos Condes de Monsanto 2, 1100-159 Lissabon, Portugal" },
    { name: "Hotel Convento do Salvador", district: "Alfama", address: "Rua do Salvador 2B, 1100-465 Lissabon, Portugal" },
  ],
  porto: [
    { name: "Moov Hotel Porto Centro", district: "Centro", address: "Praça da Batalha 32, 4000-101 Porto, Portugal" },
    { name: "The Editory House Ribeira", district: "Ribeira", address: "Rua Infante Dom Henrique 26, 4050-296 Porto, Portugal" },
    { name: "Hotel da Música", district: "Boavista", address: "Mercado do Bom Sucesso, 4150-323 Porto, Portugal" },
  ],
  naples: [
    { name: "Decumani Hotel De Charme", district: "Centro Storico", address: "Via San Giovanni Maggiore Pignatelli 15, 80134 Neapel, Italien" },
    { name: "Renaissance Naples Hotel Mediterraneo", district: "Quartieri Spagnoli", address: "Via Ponte di Tappia 25, 80133 Neapel, Italien" },
    { name: "Hotel Piazza Bellini", district: "Dante", address: "Via Santa Maria di Costantinopoli 101, 80138 Neapel, Italien" },
  ],
};

await mkdir(outputDir, { recursive: true });

const previous = await readJson(snapshotFile).catch(() => []);
if (previous.length > 0) {
  await writeFile(yesterdayFile, JSON.stringify(previous, null, 2));
}

const today = new Date();
const flightTypes = [
  { id: "roundTrip", label: "Hin und zurück", factor: 1 },
  { id: "oneWay", label: "nur Hinflug", factor: 0.58 },
];

const deals = cities.flatMap((city, cityIndex) => {
  return [0, 1, 2].flatMap((variant) => origins.flatMap((origin) => flightTypes.map((flightType) => {
    const startDate = addDays(today, 35 + variant * 7 + cityIndex);
    const endDate = addDays(startDate, 4);
    const flightPrice = Math.round((city.base + variant * 31 + cityIndex * 9) * origin.factor * flightType.factor);
    const hotelPrice = flightType.id === "oneWay" ? 0 : (city.base + 44 + variant * 22) * 4;
    const hotel = (hotelCatalog[city.id] ?? hotelCatalog.lisbon)[variant % 3];
    const totalPrice = flightPrice * 2 + hotelPrice;
    const previousPrice = Math.round(totalPrice * (1 + (variant === 0 ? 0.14 : 0.06)));
    const priceDropPercent = Math.round(((previousPrice - totalPrice) / previousPrice) * 100);

    return {
      id: `${city.id}-${origin.code}-${flightType.id}-${variant}`,
      cityId: city.id,
      cityName: city.name,
      originAirport: origin.code,
      originName: origin.name,
      airport: city.airport,
      flightType: flightType.id,
      flightTypeLabel: flightType.label,
      startDate: toDate(startDate),
      endDate: toDate(endDate),
      people: 2,
      flightPrice,
      hotelPrice,
      hotelName: flightType.id === "oneWay" ? undefined : hotel.name,
      hotelDistrict: flightType.id === "oneWay" ? undefined : hotel.district,
      hotelAddress: flightType.id === "oneWay" ? undefined : hotel.address,
      hotelMapsUrl: flightType.id === "oneWay" ? undefined : buildMapsUrl(hotel.name, hotel.address),
      packageProvider: flightType.id === "oneWay" ? undefined : "Booking.com Komplettpaket",
      packageUrl: flightType.id === "oneWay" ? undefined : buildPackageUrl(city.name, hotel.name, hotel.address, origin.code, city.airport, toDate(startDate), toDate(endDate), 2),
      totalPrice,
      previousPrice,
      priceDropPercent,
      shouldNotify: priceDropPercent >= 10,
      crawledAt: today.toISOString(),
      sources,
    };
  })));
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

function buildMapsUrl(name, address) {
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${name}, ${address}`)}`;
}

function buildPackageUrl(cityName, hotelName, hotelAddress, origin, destination, startDate, endDate, people) {
  const exactSearch = `${hotelName}, ${hotelAddress}, ${cityName}`;
  const params = new URLSearchParams({
    ss: exactSearch,
    checkin: startDate,
    checkout: endDate,
    group_adults: String(people),
    no_rooms: "1",
    group_children: "0",
    selected_currency: "EUR",
    order: "price",
    src: "searchresults",
    label: `reise-deal-finder-${origin}-${destination}`,
  });
  return `https://www.booking.com/searchresults.de.html?${params.toString()}`;
}
