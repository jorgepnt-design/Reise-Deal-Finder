const cityMap = {
  lisbon: { name: "Lissabon", airportCode: "LIS", image: "https://commons.wikimedia.org/wiki/Special:FilePath/Tram%20in%20Lisbon%20%28Unsplash%29.jpg?width=900" },
  porto: { name: "Porto", airportCode: "OPO", image: "https://images.unsplash.com/photo-1555881400-74d7acaacd8b?auto=format&fit=crop&w=900&q=80" },
  barcelona: { name: "Barcelona", airportCode: "BCN", image: "https://images.unsplash.com/photo-1583422409516-2895a77efded?auto=format&fit=crop&w=900&q=80" },
  rome: { name: "Rom", airportCode: "FCO", image: "https://images.unsplash.com/photo-1529260830199-42c24126f198?auto=format&fit=crop&w=900&q=80" },
  naples: { name: "Neapel", airportCode: "NAP", image: "https://images.unsplash.com/photo-1533105079780-92b9be482077?auto=format&fit=crop&w=900&q=80" },
  paris: { name: "Paris", airportCode: "CDG", image: "https://images.unsplash.com/photo-1502602898657-3e91760cbb34?auto=format&fit=crop&w=900&q=80" },
};

const originMap = {
  FRA: "Frankfurt",
  HHN: "Frankfurt-Hahn",
  STR: "Stuttgart",
  CGN: "Köln/Bonn",
};

let tokenCache;

export default async function handler(req, res) {
  setCorsHeaders(res);

  if (req.method === "OPTIONS") {
    res.status(204).end();
    return;
  }

  if (req.method !== "GET") {
    res.status(405).json({ error: "Method not allowed" });
    return;
  }

  try {
    const search = normalizeSearch(req.query);
    const city = cityMap[search.city] ?? cityMap.lisbon;
    const token = await getAmadeusToken();
    const offers = await searchFlightOffers(token, city, search);
    const deals = offers.map((offer, index) => mapOfferToDeal(offer, city, search, index));

    res.setHeader("Cache-Control", "s-maxage=900, stale-while-revalidate=3600");
    res.status(200).json(deals);
  } catch (error) {
    const status = error.statusCode ?? 500;
    res.status(status).json({
      error: "Live-Daten konnten nicht geladen werden",
      detail: error.message,
    });
  }
}

function setCorsHeaders(res) {
  const allowedOrigin = process.env.ALLOWED_ORIGIN ?? "https://jorgepnt-design.github.io";
  res.setHeader("Access-Control-Allow-Origin", allowedOrigin);
  res.setHeader("Access-Control-Allow-Methods", "GET, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
}

function normalizeSearch(query) {
  const city = String(query.city ?? "lisbon");
  const origin = String(query.origin ?? "FRA").toUpperCase();
  const startDate = String(query.startDate ?? new Date().toISOString().slice(0, 10));
  const endDate = String(query.endDate ?? startDate);
  const people = clampNumber(Number(query.people ?? 2), 1, 9);
  const flightType = query.flightType === "oneWay" ? "oneWay" : "roundTrip";
  const budget = clampNumber(Number(query.budget ?? 1400), 1, 100000);

  return { city, origin, startDate, endDate, people, flightType, budget };
}

function clampNumber(value, min, max) {
  if (!Number.isFinite(value)) return min;
  return Math.min(max, Math.max(min, Math.round(value)));
}

async function getAmadeusToken() {
  const clientId = process.env.AMADEUS_CLIENT_ID;
  const clientSecret = process.env.AMADEUS_CLIENT_SECRET;
  if (!clientId || !clientSecret) {
    throw withStatus(new Error("AMADEUS_CLIENT_ID und AMADEUS_CLIENT_SECRET fehlen in Vercel."), 500);
  }

  if (tokenCache && tokenCache.expiresAt > Date.now() + 60_000) return tokenCache.accessToken;

  const baseUrl = amadeusBaseUrl();
  const body = new URLSearchParams({
    grant_type: "client_credentials",
    client_id: clientId,
    client_secret: clientSecret,
  });

  const response = await fetch(`${baseUrl}/v1/security/oauth2/token`, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body,
  });

  if (!response.ok) {
    throw withStatus(new Error(`Amadeus OAuth fehlgeschlagen (${response.status})`), response.status);
  }

  const payload = await response.json();
  tokenCache = {
    accessToken: payload.access_token,
    expiresAt: Date.now() + Number(payload.expires_in ?? 1200) * 1000,
  };
  return tokenCache.accessToken;
}

async function searchFlightOffers(token, city, search) {
  const params = new URLSearchParams({
    originLocationCode: search.origin,
    destinationLocationCode: city.airportCode,
    departureDate: search.startDate,
    adults: String(search.people),
    currencyCode: "EUR",
    max: "8",
  });

  if (search.flightType === "roundTrip") params.set("returnDate", search.endDate);

  const response = await fetch(`${amadeusBaseUrl()}/v2/shopping/flight-offers?${params.toString()}`, {
    headers: { Authorization: `Bearer ${token}` },
  });

  if (!response.ok) {
    const text = await response.text();
    throw withStatus(new Error(`Amadeus Flight Offers fehlgeschlagen (${response.status}): ${text.slice(0, 240)}`), response.status);
  }

  const payload = await response.json();
  return Array.isArray(payload.data) ? payload.data : [];
}

function mapOfferToDeal(offer, city, search, index) {
  const firstItinerary = offer.itineraries?.[0];
  const returnItinerary = offer.itineraries?.[1];
  const firstSegment = firstItinerary?.segments?.[0];
  const lastOutboundSegment = firstItinerary?.segments?.[firstItinerary.segments.length - 1];
  const totalPrice = Math.round(Number(offer.price?.grandTotal ?? offer.price?.total ?? 0));
  const directFlight = firstItinerary?.segments?.length === 1 && (!returnItinerary || returnItinerary.segments?.length === 1);
  const carrierCode = firstSegment?.carrierCode ?? "Airline";
  const startDate = firstSegment?.departure?.at?.slice(0, 10) ?? search.startDate;
  const endDate = returnItinerary?.segments?.[0]?.departure?.at?.slice(0, 10) ?? search.endDate;
  const bookingUrl = buildGoogleFlightsUrl(search.origin, city.airportCode, startDate, endDate, search.people, search.flightType);

  return {
    id: `amadeus-${offer.id ?? index}`,
    title: `${city.name} Flug: Live-Angebot ${carrierCode}`,
    cityId: search.city,
    destinationAirport: city.airportCode,
    originAirport: search.origin,
    originName: originMap[search.origin] ?? search.origin,
    tripMode: "flight",
    flightType: search.flightType,
    image: city.image,
    startDate,
    endDate,
    people: search.people,
    budget: search.budget,
    flightPrice: totalPrice,
    hotelPrice: 0,
    totalPrice,
    hotelRating: 0,
    score: Math.max(50, 100 - index * 5),
    priceDropPercent: 0,
    bookingUrl,
    notes: [
      "Live-Flugpreis von Amadeus Flight Offers Search",
      `${carrierCode}: ${firstSegment?.departure?.iataCode ?? search.origin} nach ${lastOutboundSegment?.arrival?.iataCode ?? city.airportCode}`,
      directFlight ? "Direktflug laut Amadeus-Angebot" : "Umstieg laut Amadeus-Angebot möglich",
      "Hotelpreise folgen in Phase 2 über Booking oder Hotel-API",
    ],
    directFlight,
    durationNights: nightsBetween(startDate, endDate),
    includesCarryOn: false,
    includesCheckedBag: false,
    hotelRefundable: false,
    flightSource: "Amadeus",
    lastCheckedAt: new Date().toISOString(),
    priceHistory: [totalPrice, totalPrice, totalPrice, totalPrice, totalPrice, totalPrice, totalPrice],
    isLive: true,
  };
}

function amadeusBaseUrl() {
  return process.env.AMADEUS_ENV === "production" ? "https://api.amadeus.com" : "https://test.api.amadeus.com";
}

function buildGoogleFlightsUrl(origin, destination, startDate, endDate, people, flightType) {
  const route = flightType === "oneWay" ? `${origin} nach ${destination} ${startDate} nur Hinflug` : `${origin} nach ${destination} ${startDate} ${endDate} Hin und zurück`;
  return `https://www.google.com/travel/flights?q=${encodeURIComponent(`${route} ${people} Personen`)}`;
}

function nightsBetween(startDate, endDate) {
  const diff = new Date(endDate).getTime() - new Date(startDate).getTime();
  return Math.max(1, Math.round(diff / 86_400_000));
}

function withStatus(error, statusCode) {
  error.statusCode = statusCode;
  return error;
}
