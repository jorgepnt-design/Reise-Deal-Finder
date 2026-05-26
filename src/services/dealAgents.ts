import { cities } from "../data/cities";
import type { DateRecommendation, Deal, SearchState } from "../types/travel";

export const originAirports = [
  { code: "FRA", name: "Frankfurt" },
  { code: "HHN", name: "Frankfurt-Hahn" },
  { code: "STR", name: "Stuttgart" },
  { code: "CGN", name: "Köln/Bonn" },
];

const dealImages: Record<string, string[]> = {
  lisbon: [
    "https://images.unsplash.com/photo-1585208798174-6cedd86e019a?auto=format&fit=crop&w=900&q=80",
    "https://images.unsplash.com/photo-1513735492246-483525079686?auto=format&fit=crop&w=900&q=80",
    "https://images.unsplash.com/photo-1555881400-74d7acaacd8b?auto=format&fit=crop&w=900&q=80",
  ],
  porto: [
    "https://images.unsplash.com/photo-1555881400-74d7acaacd8b?auto=format&fit=crop&w=900&q=80",
    "https://images.unsplash.com/photo-1596394516093-501ba68a0ba6?auto=format&fit=crop&w=900&q=80",
    "https://images.unsplash.com/photo-1513735492246-483525079686?auto=format&fit=crop&w=900&q=80",
  ],
  barcelona: [
    "https://images.unsplash.com/photo-1583422409516-2895a77efded?auto=format&fit=crop&w=900&q=80",
    "https://images.unsplash.com/photo-1523531294919-4bcd7c65e216?auto=format&fit=crop&w=900&q=80",
    "https://images.unsplash.com/photo-1539037116277-4db20889f2d4?auto=format&fit=crop&w=900&q=80",
  ],
  rome: [
    "https://images.unsplash.com/photo-1529260830199-42c24126f198?auto=format&fit=crop&w=900&q=80",
    "https://images.unsplash.com/photo-1552832230-c0197dd311b5?auto=format&fit=crop&w=900&q=80",
    "https://images.unsplash.com/photo-1515542622106-78bda8ba0e5b?auto=format&fit=crop&w=900&q=80",
  ],
  naples: [
    "https://images.unsplash.com/photo-1533105079780-92b9be482077?auto=format&fit=crop&w=900&q=80",
    "https://images.unsplash.com/photo-1513104890138-7c749659a591?auto=format&fit=crop&w=900&q=80",
    "https://images.unsplash.com/photo-1598275277521-1885382d523a?auto=format&fit=crop&w=900&q=80",
  ],
  paris: [
    "https://images.unsplash.com/photo-1502602898657-3e91760cbb34?auto=format&fit=crop&w=900&q=80",
    "https://images.unsplash.com/photo-1499856871958-5b9627545d1a?auto=format&fit=crop&w=900&q=80",
    "https://images.unsplash.com/photo-1522093007474-d86e9bf7ba6f?auto=format&fit=crop&w=900&q=80",
  ],
};

const cityBasePrice: Record<string, number> = {
  lisbon: 168,
  porto: 146,
  barcelona: 132,
  rome: 154,
  naples: 142,
  paris: 118,
};

const originPriceFactor: Record<string, number> = {
  FRA: 1,
  HHN: 0.82,
  STR: 1.08,
  CGN: 0.96,
};

export const agentStatus = [
  {
    name: "Agent 1",
    title: "Frontend Deal-Board",
    state: "aktiv",
    description: "Dunkles deutsches Interface mit Zeitraum, Budget, Personen, Stadtauswahl und Deal-Karten.",
    sources: [{ name: "React UI", url: "https://react.dev/" }],
  },
  {
    name: "Agent 2",
    title: "Flug-Crawler per Browser",
    state: "Adapter bereit",
    description: "Sucht Deutschland nach Zielstadt, normalisiert Preise pro Datum und speichert die günstigsten Treffer.",
    sources: [
      { name: "Skyscanner", url: "https://www.skyscanner.de/" },
      { name: "Google Flights", url: "https://www.google.com/travel/flights" },
    ],
  },
  {
    name: "Agent 3",
    title: "Hotel-Crawler per Browser",
    state: "Adapter bereit",
    description: "Vergleicht Booking und HRS nach Preis-Leistung, Bewertung, Lage und Stornierungsflexibilität.",
    sources: [
      { name: "Booking", url: "https://www.booking.com/" },
      { name: "HRS", url: "https://www.hrs.de/" },
    ],
  },
  {
    name: "Agent 4",
    title: "Scheduled Task und Push",
    state: "07:00 geplant",
    description: "Vergleicht den heutigen Preis-Snapshot mit gestern und meldet neue Deals oder Preisfälle ab 10 Prozent.",
    sources: [{ name: "Web Notifications", url: "https://developer.mozilla.org/docs/Web/API/Notifications_API" }],
  },
];

export function buildDeals(search: SearchState): Deal[] {
  const city = cities.find((item) => item.id === search.cityId) ?? cities[0];
  const base = cityBasePrice[city.id] ?? 160;
  const origin = originAirports.find((airport) => airport.code === search.originAirport) ?? originAirports[0];
  const originFactor = originPriceFactor[origin.code] ?? 1;
  const dateFactor = Math.max(0, new Date(search.startDate).getDate() % 9);
  const images = dealImages[city.id] ?? dealImages.lisbon;

  const deals = [0, 1, 2, 3].map((index) => {
    const startDate = chooseStartDate(search, index);
    const durationNights = chooseDuration(search, index);
    const endDate = addDays(startDate, durationNights);
    const flightPrice = Math.round((base * originFactor + dateFactor * 7 + index * 34) * search.people);
    const hotelNightly = base + 42 + index * 28;
    const hotelPrice = search.tripMode === "flight" ? 0 : Math.round(hotelNightly * durationNights);
    const totalPrice = flightPrice + hotelPrice;
    const hotelRating = Number((9.2 - index * 0.35).toFixed(1));
    const priceDropPercent = [14, 11, 7, 5][index];
    const directFlight = index !== 2;
    const includesCarryOn = index !== 3;
    const includesCheckedBag = index === 1;
    const hotelRefundable = index !== 0;
    const rawScore = Math.round(100 - index * 6 - Math.max(0, totalPrice - search.budget) / 50 + priceDropPercent / 2);
    const score = Math.max(0, Math.min(100, rawScore));
    const priceHistory = buildPriceHistory(totalPrice, priceDropPercent, index);

    return {
      id: `${city.id}-${index}`,
      title: `${city.name} ${search.tripMode === "flight" ? "Flug" : "Paket"} ${index === 0 ? "City Sprint" : index === 1 ? "Design Hotel" : "Flex Weekend"}`,
      cityId: city.id,
      destinationAirport: city.airportCode,
      originAirport: origin.code,
      originName: origin.name,
      tripMode: search.tripMode,
      image: images[index % images.length],
      startDate,
      endDate,
      people: search.people,
      budget: search.budget,
      flightPrice,
      hotelPrice,
      totalPrice,
      hotelRating,
      score,
      priceDropPercent,
      bookingUrl: buildFlightUrl(origin.code, city.airportCode, startDate, endDate, search.people),
      hotelUrl: search.tripMode === "package" ? buildHotelUrl(city.name, startDate, endDate, search.people) : undefined,
      notes: [
        `${origin.name} (${origin.code}) nach ${city.name} (${city.airportCode})`,
        search.tripMode === "flight" ? "Nur Flug, ohne Hotelkosten berechnet" : "Flug plus Hotel als Paket-Orientierung",
        `${priceDropPercent}% günstiger als der letzte Snapshot`,
        directFlight ? "Direktflug" : "Umstieg einkalkuliert",
        includesCheckedBag ? "Aufgabegepäck inklusive" : includesCarryOn ? "Handgepäck inklusive" : "Nur Personal Item inklusive",
      ],
      directFlight,
      durationNights,
      includesCarryOn,
      includesCheckedBag,
      hotelRefundable,
      flightSource: index % 2 === 0 ? "Google Flights" : "Skyscanner",
      hotelSource: search.tripMode === "package" ? (index % 2 === 0 ? "Booking" : "HRS") : undefined,
      lastCheckedAt: new Date().toISOString(),
      priceHistory,
      isLive: false,
    };
  });

  return applyDealFilters(deals, search);
}

export async function loadLiveDeals(search: SearchState): Promise<Deal[]> {
  const endpoint = import.meta.env.VITE_DEAL_API_URL as string | undefined;
  if (!endpoint) return [];

  const params = new URLSearchParams({
    city: search.cityId,
    origin: search.originAirport,
    startDate: search.startDate,
    endDate: search.endDate,
    people: String(search.people),
    mode: search.tripMode,
  });

  const response = await fetch(`${endpoint}?${params.toString()}`);
  if (!response.ok) throw new Error("Live-Daten konnten nicht geladen werden");
  const deals = (await response.json()) as Deal[];
  return applyDealFilters(deals.map((deal) => ({ ...deal, isLive: true })), search);
}

export function recommendTravelDates(search: SearchState): DateRecommendation[] {
  const city = cities.find((item) => item.id === search.cityId) ?? cities[0];
  const base = cityBasePrice[city.id] ?? 160;
  const nights = nightsBetween(search.startDate, search.endDate);

  return [10, 17, 24, 31].map((offset, index) => {
    const origin = originAirports[(originAirports.findIndex((airport) => airport.code === search.originAirport) + index) % originAirports.length];
    const startDate = addDays(search.startDate, offset);
    const endDate = addDays(startDate, nights);
    const weekdayFactor = new Date(startDate).getDay() === 2 || new Date(startDate).getDay() === 3 ? 0.86 : 1;
    const originFactor = originPriceFactor[origin.code] ?? 1;
    const flightPrice = Math.round(base * originFactor * weekdayFactor * search.people);
    const hotelPrice = search.tripMode === "flight" ? 0 : Math.round((base + 34 + index * 8) * nights);
    const totalPrice = flightPrice + hotelPrice;

    return {
      id: `${city.id}-${origin.code}-${startDate}`,
      startDate,
      endDate,
      totalPrice,
      savingPercent: Math.max(8, Math.round((1.18 - weekdayFactor * originFactor) * 28)),
      originAirport: origin.code,
      originName: origin.name,
    };
  }).sort((a, b) => a.totalPrice - b.totalPrice);
}

export function runDailyPriceCheck(deals: Deal[]) {
  const relevantDeals = deals.filter((deal) => deal.priceDropPercent >= 10);
  const headline =
    relevantDeals.length === 1
      ? "1 neuer Preisalarm"
      : relevantDeals.length > 1
        ? `${relevantDeals.length} neue Preisalarme`
        : "Keine starken Preisfälle";

  return {
    headline,
    shouldPush: relevantDeals.length > 0,
    dealIds: relevantDeals.map((deal) => deal.id),
  };
}

function nightsBetween(startDate: string, endDate: string) {
  const diff = new Date(endDate).getTime() - new Date(startDate).getTime();
  return Math.max(1, Math.round(diff / 86_400_000));
}

function addDays(date: string, days: number) {
  const next = new Date(date);
  next.setDate(next.getDate() + days);
  return next.toISOString().slice(0, 10);
}

function applyDealFilters(deals: Deal[], search: SearchState) {
  return deals.filter((deal) => {
    if (search.directOnly && !deal.directFlight) return false;
    if (search.tripMode === "package" && deal.hotelRating < search.minHotelRating) return false;
    if (search.weekendOnly && !isWeekendTrip(deal.startDate, deal.endDate)) return false;
    if (search.baggage === "carryOn" && !deal.includesCarryOn && !deal.includesCheckedBag) return false;
    if (search.baggage === "checked" && !deal.includesCheckedBag) return false;
    if (search.durationFilter === "short" && (deal.durationNights < 2 || deal.durationNights > 3)) return false;
    if (search.durationFilter === "medium" && (deal.durationNights < 4 || deal.durationNights > 5)) return false;
    if (search.durationFilter === "long" && deal.durationNights < 7) return false;
    if (search.flexibleSearch === "under500" && deal.totalPrice / deal.people > 500) return false;
    return true;
  });
}

function chooseStartDate(search: SearchState, index: number) {
  if (search.flexibleSearch === "july") return `2026-07-${String(8 + index * 5).padStart(2, "0")}`;
  if (search.flexibleSearch === "longWeekend") return addDays(nextFriday(search.startDate), index * 7);
  return addDays(search.startDate, index);
}

function chooseDuration(search: SearchState, index: number) {
  if (search.flexibleSearch === "longWeekend") return 3;
  if (search.durationFilter === "short") return index % 2 === 0 ? 2 : 3;
  if (search.durationFilter === "medium") return index % 2 === 0 ? 4 : 5;
  if (search.durationFilter === "long") return 7 + index;
  return nightsBetween(search.startDate, search.endDate);
}

function nextFriday(date: string) {
  const next = new Date(date);
  const delta = (5 - next.getDay() + 7) % 7;
  next.setDate(next.getDate() + delta);
  return next.toISOString().slice(0, 10);
}

function isWeekendTrip(startDate: string, endDate: string) {
  const startDay = new Date(startDate).getDay();
  const endDay = new Date(endDate).getDay();
  return startDay === 5 || startDay === 6 || endDay === 0 || endDay === 1;
}

function buildPriceHistory(totalPrice: number, priceDropPercent: number, index: number) {
  const peak = Math.round(totalPrice / (1 - priceDropPercent / 100));
  return [peak + 18 + index * 9, peak + 6, peak - 14, peak - 4, totalPrice + 21, totalPrice + 8, totalPrice];
}

function buildFlightUrl(origin: string, destination: string, startDate: string, endDate: string, people: number) {
  const query = encodeURIComponent(`${origin} nach ${destination} ${startDate} ${endDate} ${people} Personen`);
  return `https://www.google.com/travel/flights?q=${query}`;
}

function buildHotelUrl(cityName: string, startDate: string, endDate: string, people: number) {
  const query = new URLSearchParams({
    ss: cityName,
    checkin: startDate,
    checkout: endDate,
    group_adults: String(people),
  });
  return `https://www.booking.com/searchresults.de.html?${query.toString()}`;
}
