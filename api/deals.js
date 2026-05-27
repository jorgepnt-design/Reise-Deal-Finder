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
    const offers = await searchDuffelOffers(city, search);
    const deals = offers.slice(0, 8).map((offer, index) => mapOfferToDeal(offer, city, search, index));
    const flights = offers.slice(0, 12).map((offer, index) => mapOfferToFlight(offer, city, search, index));

    res.setHeader("Cache-Control", "s-maxage=900, stale-while-revalidate=3600");
    res.status(200).json({ deals, flights });
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

async function searchDuffelOffers(city, search) {
  const token = process.env.DUFFEL_ACCESS_TOKEN;
  if (!token) {
    throw withStatus(new Error("DUFFEL_ACCESS_TOKEN fehlt in Vercel."), 500);
  }

  const slices = [
    {
      origin: search.origin,
      destination: city.airportCode,
      departure_date: search.startDate,
    },
  ];

  if (search.flightType === "roundTrip") {
    slices.push({
      origin: city.airportCode,
      destination: search.origin,
      departure_date: search.endDate,
    });
  }

  const body = {
    data: {
      slices,
      passengers: Array.from({ length: search.people }, () => ({ type: "adult" })),
      cabin_class: "economy",
    },
  };

  const query = new URLSearchParams({
    return_offers: "true",
    supplier_timeout: "5000",
  });
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 8000);

  let response;
  try {
    response = await fetch(`https://api.duffel.com/air/offer_requests?${query.toString()}`, {
      method: "POST",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
        "Duffel-Version": "v2",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(body),
      signal: controller.signal,
    });
  } catch (error) {
    if (error.name === "AbortError") throw withStatus(new Error("Duffel hat nicht rechtzeitig geantwortet. Bitte erneut versuchen."), 504);
    throw error;
  } finally {
    clearTimeout(timeout);
  }

  if (!response.ok) {
    const text = await response.text();
    throw withStatus(new Error(`Duffel Offer Request fehlgeschlagen (${response.status}): ${text.slice(0, 240)}`), response.status);
  }

  const payload = await response.json();
  const offers = payload.data?.offers;
  return Array.isArray(offers) ? offers.sort((a, b) => Number(a.total_amount ?? 0) - Number(b.total_amount ?? 0)) : [];
}

function mapOfferToDeal(offer, city, search, index) {
  const outboundSlice = offer.slices?.[0];
  const returnSlice = offer.slices?.[1];
  const firstSegment = outboundSlice?.segments?.[0];
  const lastOutboundSegment = outboundSlice?.segments?.[outboundSlice.segments.length - 1];
  const totalPrice = Math.round(Number(offer.total_amount ?? 0));
  const airline = offer.owner?.name ?? firstSegment?.operating_carrier?.name ?? firstSegment?.marketing_carrier?.name ?? "Airline";
  const startDate = firstSegment?.departing_at?.slice(0, 10) ?? search.startDate;
  const endDate = returnSlice?.segments?.[0]?.departing_at?.slice(0, 10) ?? search.endDate;
  const directFlight = outboundSlice?.segments?.length === 1 && (!returnSlice || returnSlice.segments?.length === 1);

  return {
    id: `duffel-${offer.id ?? index}`,
    title: `${city.name} Flug: Live-Angebot ${airline}`,
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
    bookingUrl: buildGoogleFlightsUrl(search.origin, city.airportCode, startDate, endDate, search.people, search.flightType),
    notes: [
      "Live-Flugpreis von Duffel Offer Request",
      `${airline}: ${firstSegment?.origin?.iata_code ?? search.origin} nach ${lastOutboundSegment?.destination?.iata_code ?? city.airportCode}`,
      directFlight ? "Direktflug laut Duffel-Angebot" : "Umstieg laut Duffel-Angebot möglich",
      "Hotelpreise folgen in Phase 2 über Booking oder Hotel-API",
    ],
    directFlight,
    durationNights: nightsBetween(startDate, endDate),
    includesCarryOn: hasIncludedBaggage(offer, "carry_on"),
    includesCheckedBag: hasIncludedBaggage(offer, "checked"),
    hotelRefundable: false,
    flightSource: "Duffel",
    lastCheckedAt: new Date().toISOString(),
    priceHistory: [totalPrice, totalPrice, totalPrice, totalPrice, totalPrice, totalPrice, totalPrice],
    isLive: true,
  };
}

function mapOfferToFlight(offer, city, search, index) {
  const outboundSlice = offer.slices?.[0];
  const returnSlice = offer.slices?.[1];
  const firstSegment = outboundSlice?.segments?.[0];
  const lastOutboundSegment = outboundSlice?.segments?.[outboundSlice.segments.length - 1];
  const firstReturnSegment = returnSlice?.segments?.[0];
  const lastReturnSegment = returnSlice?.segments?.[returnSlice.segments.length - 1];
  const totalPrice = Math.round(Number(offer.total_amount ?? 0));
  const pricePerPerson = Math.round(totalPrice / search.people);
  const airline = offer.owner?.name ?? firstSegment?.operating_carrier?.name ?? firstSegment?.marketing_carrier?.name ?? "Airline";
  const outboundDate = firstSegment?.departing_at?.slice(0, 10) ?? search.startDate;
  const returnDate = firstReturnSegment?.departing_at?.slice(0, 10) ?? (search.flightType === "roundTrip" ? search.endDate : undefined);

  return {
    id: `duffel-flight-${offer.id ?? index}`,
    offerId: offer.id,
    cityId: search.city,
    originAirport: search.origin,
    destinationAirport: city.airportCode,
    flightType: search.flightType,
    outboundDate,
    returnDate,
    outboundDeparture: formatTime(firstSegment?.departing_at),
    outboundArrival: formatTime(lastOutboundSegment?.arriving_at),
    returnDeparture: search.flightType === "roundTrip" ? formatTime(firstReturnSegment?.departing_at) : undefined,
    returnArrival: search.flightType === "roundTrip" ? formatTime(lastReturnSegment?.arriving_at) : undefined,
    airline,
    directFlight: outboundSlice?.segments?.length === 1 && (!returnSlice || returnSlice.segments?.length === 1),
    includesCarryOn: hasIncludedBaggage(offer, "carry_on"),
    includesCheckedBag: hasIncludedBaggage(offer, "checked"),
    pricePerPerson,
    totalPrice,
    source: "Duffel",
    bookingUrl: buildGoogleFlightsUrl(search.origin, city.airportCode, outboundDate, returnDate ?? outboundDate, search.people, search.flightType),
    isLive: true,
  };
}

function hasIncludedBaggage(offer, baggageType) {
  return Boolean(
    offer.slices?.some((slice) =>
      slice.segments?.some((segment) =>
        segment.passengers?.some((passenger) =>
          passenger.baggages?.some((baggage) => baggage.type === baggageType && Number(baggage.quantity ?? 0) > 0),
        ),
      ),
    ),
  );
}

function buildGoogleFlightsUrl(origin, destination, startDate, endDate, people, flightType) {
  const route = flightType === "oneWay" ? `${origin} nach ${destination} ${startDate} nur Hinflug` : `${origin} nach ${destination} ${startDate} ${endDate} Hin und zurück`;
  return `https://www.google.com/travel/flights?q=${encodeURIComponent(`${route} ${people} Personen`)}`;
}

function formatTime(value) {
  if (!value) return "--:--";
  return value.slice(11, 16);
}

function nightsBetween(startDate, endDate) {
  const diff = new Date(endDate).getTime() - new Date(startDate).getTime();
  return Math.max(1, Math.round(diff / 86_400_000));
}

function withStatus(error, statusCode) {
  error.statusCode = statusCode;
  return error;
}
