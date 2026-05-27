import { cities } from "../data/cities";
import type { DateRecommendation, Deal, FlightOption, LiveTravelData, SearchState } from "../types/travel";

export const originAirports = [
  { code: "FRA", name: "Frankfurt" },
  { code: "HHN", name: "Frankfurt-Hahn" },
  { code: "STR", name: "Stuttgart" },
  { code: "CGN", name: "Köln/Bonn" },
];

const dealImages: Record<string, string[]> = {
  lisbon: [
    "https://commons.wikimedia.org/wiki/Special:FilePath/Tram%20in%20Lisbon%20%28Unsplash%29.jpg?width=900",
    "https://commons.wikimedia.org/wiki/Special:FilePath/Lisbon%20%28praca%20do%20comercio%29%20-%20Flickr%20-%20Stavrarg%20%281%29.jpg?width=900",
    "https://images.unsplash.com/photo-1585208798174-6cedd86e019a?auto=format&fit=crop&w=900&q=80",
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

const hotelCatalog: Record<string, Array<{ name: string; district: string; address: string }>> = {
  lisbon: [
    { name: "Hotel Lisboa Plaza", district: "Avenida da Liberdade", address: "Tv. Salitre 7, 1269-066 Lissabon, Portugal" },
    { name: "My Story Hotel Tejo", district: "Baixa", address: "Rua dos Condes de Monsanto 2, 1100-159 Lissabon, Portugal" },
    { name: "Hotel Convento do Salvador", district: "Alfama", address: "Rua do Salvador 2B, 1100-465 Lissabon, Portugal" },
    { name: "Moxy Lisboa Oriente", district: "Parque das Nações", address: "Avenida Aquilino Ribeiro Machado 10, 1800-399 Lissabon, Portugal" },
  ],
  porto: [
    { name: "Moov Hotel Porto Centro", district: "Centro", address: "Praça da Batalha 32, 4000-101 Porto, Portugal" },
    { name: "The Editory House Ribeira", district: "Ribeira", address: "Rua Infante Dom Henrique 26, 4050-296 Porto, Portugal" },
    { name: "Hotel da Música", district: "Boavista", address: "Mercado do Bom Sucesso, 4150-323 Porto, Portugal" },
    { name: "PortoBay Teatro", district: "Baixa", address: "Rua Sá da Bandeira 84, 4000-427 Porto, Portugal" },
  ],
  barcelona: [
    { name: "Hotel Jazz", district: "Eixample", address: "Carrer de Pelai 3, 08001 Barcelona, Spanien" },
    { name: "H10 Madison", district: "Gotisches Viertel", address: "Carrer del Dr. Joaquim Pou 2-4-6, 08002 Barcelona, Spanien" },
    { name: "Acta Voraport", district: "Poblenou", address: "Carrer de Ramon Turró 169, 08005 Barcelona, Spanien" },
    { name: "Occidental Atenea Mar", district: "Diagonal Mar", address: "Passeig de Garcia Fària 37-47, 08019 Barcelona, Spanien" },
  ],
  rome: [
    { name: "Hotel Artemide", district: "Repubblica", address: "Via Nazionale 22, 00184 Rom, Italien" },
    { name: "The Hive Hotel", district: "Termini", address: "Via Torino 6, 00184 Rom, Italien" },
    { name: "Hotel Smeraldo", district: "Campo de' Fiori", address: "Via dei Chiavari 20, 00186 Rom, Italien" },
    { name: "Hotel Lancelot", district: "Colosseo", address: "Via Capo d'Africa 47, 00184 Rom, Italien" },
  ],
  naples: [
    { name: "Decumani Hotel De Charme", district: "Centro Storico", address: "Via San Giovanni Maggiore Pignatelli 15, 80134 Neapel, Italien" },
    { name: "Renaissance Naples Hotel Mediterraneo", district: "Quartieri Spagnoli", address: "Via Ponte di Tappia 25, 80133 Neapel, Italien" },
    { name: "Hotel Piazza Bellini", district: "Dante", address: "Via Santa Maria di Costantinopoli 101, 80138 Neapel, Italien" },
    { name: "Grand Hotel Oriente", district: "Toledo", address: "Via Armando Diaz 44, 80134 Neapel, Italien" },
  ],
  paris: [
    { name: "Hotel Malte Astotel", district: "Opéra", address: "63 Rue de Richelieu, 75002 Paris, Frankreich" },
    { name: "Hôtel Le Compostelle", district: "Le Marais", address: "31 Rue du Roi de Sicile, 75004 Paris, Frankreich" },
    { name: "Hotel Eiffel Turenne", district: "Invalides", address: "20 Avenue de Tourville, 75007 Paris, Frankreich" },
    { name: "Hotel Joke Astotel", district: "Pigalle", address: "69 Rue Blanche, 75009 Paris, Frankreich" },
  ],
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
    const roundTripFactor = search.flightType === "oneWay" ? 0.58 : 1;
    const flightPrice = Math.round((base * originFactor + dateFactor * 7 + index * 34) * search.people * roundTripFactor);
    const hotelNightly = base + 42 + index * 28;
    const effectiveTripMode = search.flightType === "oneWay" ? "flight" : search.tripMode;
    const hotelPrice = effectiveTripMode === "flight" ? 0 : Math.round(hotelNightly * durationNights);
    const totalPrice = flightPrice + hotelPrice;
    const hotelRating = Number((9.2 - index * 0.35).toFixed(1));
    const priceDropPercent = [14, 11, 7, 5][index];
    const directFlight = index !== 2;
    const includesCarryOn = index !== 3;
    const includesCheckedBag = index === 1;
    const hotelRefundable = index !== 0;
    const hotel = hotelCatalog[city.id]?.[index % 4] ?? hotelCatalog.lisbon[index % 4];
    const rawScore = Math.round(100 - index * 6 - Math.max(0, totalPrice - search.budget) / 50 + priceDropPercent / 2);
    const score = Math.max(0, Math.min(100, rawScore));
    const priceHistory = buildPriceHistory(totalPrice, priceDropPercent, index);
    const flightSource = index % 2 === 0 ? "Google Flights" : "Skyscanner";

    return {
      id: `${city.id}-${index}`,
      title: buildDealTitle(city.name, effectiveTripMode, index),
      cityId: city.id,
      destinationAirport: city.airportCode,
      originAirport: origin.code,
      originName: origin.name,
      tripMode: effectiveTripMode,
      flightType: search.flightType,
      image: images[index % images.length],
      startDate,
      endDate,
      people: search.people,
      budget: search.budget,
      flightPrice,
      hotelPrice,
      hotelName: effectiveTripMode === "package" ? hotel.name : undefined,
      hotelDistrict: effectiveTripMode === "package" ? hotel.district : undefined,
      hotelAddress: effectiveTripMode === "package" ? hotel.address : undefined,
      hotelMapsUrl: effectiveTripMode === "package" ? buildMapsUrl(hotel.name, hotel.address) : undefined,
      packageProvider: effectiveTripMode === "package" ? "Booking.com Komplettpaket" : undefined,
      packageUrl: effectiveTripMode === "package" ? buildPackageUrl(city.name, hotel.name, hotel.address, origin.code, city.airportCode, startDate, endDate, search.people) : undefined,
      totalPrice,
      hotelRating,
      score,
      priceDropPercent,
      bookingUrl: buildFlightUrl(origin.code, city.airportCode, startDate, endDate, search.people, search.flightType, flightSource),
      hotelUrl: effectiveTripMode === "package" ? buildHotelUrl(city.name, hotel.name, hotel.address, startDate, endDate, search.people) : undefined,
      notes: [
        `${origin.name} (${origin.code}) nach ${city.name} (${city.airportCode})`,
        search.flightType === "oneWay" ? "Nur Hinflug, ohne Rückflug und Hotelkosten" : effectiveTripMode === "flight" ? "Hin- und Rückflug, ohne Hotelkosten berechnet" : "Flug plus Hotel als Paket-Orientierung",
        `${priceDropPercent}% günstiger als der letzte Snapshot`,
        directFlight ? "Direktflug" : "Umstieg einkalkuliert",
        includesCheckedBag ? "Aufgabegepäck inklusive" : includesCarryOn ? "Handgepäck inklusive" : "Nur Personal Item inklusive",
      ],
      directFlight,
      durationNights,
      includesCarryOn,
      includesCheckedBag,
      hotelRefundable,
      flightSource,
      hotelSource: effectiveTripMode === "package" ? (index % 2 === 0 ? "Booking" : "HRS") : undefined,
      lastCheckedAt: new Date().toISOString(),
      priceHistory,
      isLive: false,
    };
  });

  return applyDealFilters(deals, search);
}

export async function loadLiveDeals(search: SearchState): Promise<Deal[]> {
  const data = await loadLiveTravelData(search);
  return data.deals;
}

export async function loadLiveTravelData(search: SearchState): Promise<LiveTravelData> {
  const endpoint = import.meta.env.VITE_DEAL_API_URL as string | undefined;
  if (!endpoint) return { deals: [], flights: [] };

  const params = new URLSearchParams({
    city: search.cityId,
    origin: search.originAirport,
    startDate: search.startDate,
    endDate: search.endDate,
    people: String(search.people),
    budget: String(search.budget),
    mode: search.tripMode,
    flightType: search.flightType,
    dateFlexDays: String(search.dateFlexDays),
  });

  const response = await fetch(`${endpoint}?${params.toString()}`);
  if (!response.ok) throw new Error("Live-Daten konnten nicht geladen werden");
  const payload = (await response.json()) as LiveTravelData | Deal[];
  const deals = Array.isArray(payload) ? payload : payload.deals;
  const flights = Array.isArray(payload) ? [] : payload.flights;
  return {
    deals: applyDealFilters((deals ?? []).map((deal) => ({ ...deal, isLive: true })), search),
    flights: applyFlightFilters((flights ?? []).map((flight) => ({ ...flight, isLive: true })), search),
  };
}

export async function createDuffelBookingLink(flight: FlightOption, search: SearchState): Promise<string> {
  const endpoint = import.meta.env.VITE_DEAL_API_URL as string | undefined;
  if (!endpoint) throw new Error("VITE_DEAL_API_URL ist nicht gesetzt.");

  const bookingEndpoint = new URL(endpoint);
  bookingEndpoint.pathname = bookingEndpoint.pathname.replace(/\/api\/deals\/?$/, "/api/duffel-link");

  const response = await fetch(bookingEndpoint.toString(), {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      flightId: flight.id,
      offerId: flight.offerId,
      cityId: flight.cityId,
      originAirport: flight.originAirport,
      destinationAirport: flight.destinationAirport,
      outboundDate: flight.outboundDate,
      returnDate: flight.returnDate,
      flightType: flight.flightType,
      people: search.people,
    }),
  });

  if (!response.ok) throw new Error("Duffel-Buchungslink konnte nicht erstellt werden.");
  const payload = (await response.json()) as { url?: string };
  if (!payload.url) throw new Error("Duffel hat keinen Buchungslink zurückgegeben.");
  return payload.url;
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
    const roundTripFactor = search.flightType === "oneWay" ? 0.58 : 1;
    const flightPrice = Math.round(base * originFactor * weekdayFactor * search.people * roundTripFactor);
    const hotelPrice = search.tripMode === "flight" || search.flightType === "oneWay" ? 0 : Math.round((base + 34 + index * 8) * nights);
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

export function buildFlights(search: SearchState): FlightOption[] {
  const city = cities.find((item) => item.id === search.cityId) ?? cities[0];
  const base = cityBasePrice[city.id] ?? 160;
  const origin = originAirports.find((airport) => airport.code === search.originAirport) ?? originAirports[0];
  const originFactor = originPriceFactor[origin.code] ?? 1;
  const offsets = buildDateOffsets(search.dateFlexDays);
  const timeSlots = [
    { key: "morning", outboundDeparture: "06:35", outboundArrival: "08:45", returnDeparture: "09:30", returnArrival: "13:35", airline: "Lufthansa" },
    { key: "midday", outboundDeparture: "11:20", outboundArrival: "13:35", returnDeparture: "14:15", returnArrival: "18:20", airline: "Eurowings" },
    { key: "evening", outboundDeparture: "18:05", outboundArrival: "20:20", returnDeparture: "20:55", returnArrival: "00:55", airline: "Ryanair" },
  ];

  return offsets.flatMap((offset, dateIndex) => {
    const outboundDate = addDays(search.startDate, offset);
    const returnDate = search.flightType === "oneWay" ? undefined : addDays(search.endDate, offset);

    return timeSlots.map((slot, slotIndex) => {
      const includesCheckedBag = slotIndex === 1 || search.baggage === "checked";
      const includesCarryOn = slotIndex !== 2 || search.baggage !== "personal";
      const directFlight = slotIndex !== 2;
      const roundTripFactor = search.flightType === "oneWay" ? 0.58 : 1;
      const baggagePrice = search.baggage === "checked" ? 42 : search.baggage === "carryOn" ? 18 : 0;
      const pricePerPerson = Math.round((base * originFactor * roundTripFactor + dateIndex * 12 + slotIndex * 24 + baggagePrice) * (directFlight ? 1 : 0.88));
      const source = slotIndex === 1 ? "Skyscanner" : "Google Flights";
      const bookingUrl = buildFlightUrl(origin.code, city.airportCode, outboundDate, returnDate ?? outboundDate, search.people, search.flightType, source);

      return {
        id: `${city.id}-${origin.code}-${search.flightType}-${outboundDate}-${slot.key}`,
        cityId: city.id,
        originAirport: origin.code,
        destinationAirport: city.airportCode,
        flightType: search.flightType,
        outboundDate,
        returnDate,
        outboundDeparture: slot.outboundDeparture,
        outboundArrival: slot.outboundArrival,
        returnDeparture: search.flightType === "roundTrip" ? slot.returnDeparture : undefined,
        returnArrival: search.flightType === "roundTrip" ? slot.returnArrival : undefined,
        airline: slot.airline,
        directFlight,
        includesCarryOn,
        includesCheckedBag,
        pricePerPerson,
        totalPrice: pricePerPerson * search.people,
        source,
        bookingUrl,
      };
    });
  }).filter((flight) => {
    return matchesFlightFilters(flight, search);
  }).sort((a, b) => a.pricePerPerson - b.pricePerPerson);
}

function applyFlightFilters(flights: FlightOption[], search: SearchState) {
  return flights.filter((flight) => matchesFlightFilters(flight, search)).sort((a, b) => a.pricePerPerson - b.pricePerPerson);
}

function matchesFlightFilters(flight: FlightOption, search: SearchState) {
  if (search.directOnly && !flight.directFlight) return false;
  if (search.baggage === "carryOn" && !flight.includesCarryOn && !flight.includesCheckedBag) return false;
  if (search.baggage === "checked" && !flight.includesCheckedBag && flight.source !== "Google Flights") return false;
  if (!matchesTimeWindow(flight.outboundDeparture, search.outboundTimeWindow)) return false;
  if (search.flightType === "roundTrip" && flight.returnDeparture && !matchesTimeWindow(flight.returnDeparture, search.returnTimeWindow)) return false;
  return true;
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
    if (search.baggage === "checked" && !deal.includesCheckedBag && deal.flightSource !== "Google Flights") return false;
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

function buildDealTitle(cityName: string, tripMode: SearchState["tripMode"], index: number) {
  const packageTitles = [
    "Flug & Hotel: günstiger Kurztrip",
    "Flug & Hotel: zentrales Hotel mit guter Bewertung",
    "Flug & Hotel: flexibles Wochenendangebot",
    "Flug & Hotel: Budget-Alternative",
  ];
  const flightTitles = [
    "Flug: günstigste Verbindung",
    "Flug: gutes Preis-Zeit-Verhältnis",
    "Flug: flexible Datumsoption",
    "Flug: einfache Budget-Alternative",
  ];
  const titles = tripMode === "flight" ? flightTitles : packageTitles;
  return `${cityName} ${titles[index] ?? titles[0]}`;
}

function buildDateOffsets(flexDays: SearchState["dateFlexDays"]) {
  if (flexDays === 0) return [0];
  return Array.from({ length: flexDays * 2 + 1 }, (_, index) => index - flexDays);
}

function matchesTimeWindow(time: string, window: SearchState["outboundTimeWindow"]) {
  if (window === "any") return true;
  const hour = Number(time.slice(0, 2));
  if (window === "morning") return hour >= 5 && hour < 11;
  if (window === "midday") return hour >= 11 && hour < 17;
  return hour >= 17 || hour < 5;
}

function buildFlightUrl(origin: string, destination: string, startDate: string, endDate: string, people: number, flightType: SearchState["flightType"], source: string) {
  if (source === "Skyscanner") return buildSkyscannerFlightUrl(origin, destination, startDate, endDate, people, flightType);
  const route = flightType === "oneWay" ? `${origin} nach ${destination} ${startDate} nur Hinflug` : `${origin} nach ${destination} ${startDate} ${endDate} Hin und zurück`;
  const query = encodeURIComponent(`${route} ${people} Personen`);
  return `https://www.google.com/travel/flights?q=${query}`;
}

function buildSkyscannerFlightUrl(origin: string, destination: string, startDate: string, endDate: string, people: number, flightType: SearchState["flightType"]) {
  const outbound = formatSkyscannerDate(startDate);
  const inbound = formatSkyscannerDate(endDate);
  const path = flightType === "oneWay" ? `${origin.toLowerCase()}/${destination.toLowerCase()}/${outbound}` : `${origin.toLowerCase()}/${destination.toLowerCase()}/${outbound}/${inbound}`;
  const query = new URLSearchParams({
    adults: String(people),
    adultsv2: String(people),
    cabinclass: "economy",
    children: "0",
    currency: "EUR",
    locale: "de-DE",
    market: "DE",
    rtn: flightType === "oneWay" ? "0" : "1",
  });
  return `https://www.skyscanner.de/transport/flights/${path}/?${query.toString()}`;
}

function formatSkyscannerDate(date: string) {
  const [year, month, day] = date.split("-");
  return `${year.slice(2)}${month}${day}`;
}

function buildMapsUrl(name: string, address: string) {
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${name}, ${address}`)}`;
}

function buildPackageUrl(cityName: string, hotelName: string, hotelAddress: string, origin: string, destination: string, startDate: string, endDate: string, people: number) {
  const exactSearch = `${hotelName}, ${hotelAddress}, ${cityName}`;
  const checkin = dateParts(startDate);
  const checkout = dateParts(endDate);
  const roomAdults = Array.from({ length: people }, () => "A").join(",");
  const params = new URLSearchParams({
    ss: exactSearch,
    ssne: cityName,
    ssne_untouched: cityName,
    ss_raw: hotelName,
    checkin: startDate,
    checkout: endDate,
    checkin_year: checkin.year,
    checkin_month: checkin.month,
    checkin_monthday: checkin.day,
    checkout_year: checkout.year,
    checkout_month: checkout.month,
    checkout_monthday: checkout.day,
    group_adults: String(people),
    no_rooms: "1",
    group_children: "0",
    room1: roomAdults,
    selected_currency: "EUR",
    order: "price",
    sb: "1",
    sb_lp: "1",
    src: "index",
    src_elem: "sb",
    from_sf: "1",
    search_selected: "true",
    sb_price_type: "total",
    label: `reise-deal-finder-${origin}-${destination}`,
  });
  return `https://www.booking.com/searchresults.de.html?${params.toString()}`;
}

function buildHotelUrl(cityName: string, hotelName: string, hotelAddress: string, startDate: string, endDate: string, people: number) {
  const checkin = dateParts(startDate);
  const checkout = dateParts(endDate);
  const roomAdults = Array.from({ length: people }, () => "A").join(",");
  const query = new URLSearchParams({
    ss: `${hotelName}, ${hotelAddress}, ${cityName}`,
    ssne: cityName,
    ssne_untouched: cityName,
    ss_raw: hotelName,
    checkin: startDate,
    checkout: endDate,
    checkin_year: checkin.year,
    checkin_month: checkin.month,
    checkin_monthday: checkin.day,
    checkout_year: checkout.year,
    checkout_month: checkout.month,
    checkout_monthday: checkout.day,
    group_adults: String(people),
    no_rooms: "1",
    group_children: "0",
    room1: roomAdults,
    selected_currency: "EUR",
    sb: "1",
    sb_lp: "1",
    src: "index",
    src_elem: "sb",
    from_sf: "1",
    search_selected: "true",
    sb_price_type: "total",
  });
  return `https://www.booking.com/searchresults.de.html?${query.toString()}`;
}

function dateParts(date: string) {
  const [year, month, day] = date.split("-");
  return { year, month: String(Number(month)), day: String(Number(day)) };
}
