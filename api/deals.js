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
    const providerFlights = await searchProviderFlights(city, search);
    const flights =
      providerFlights.length > 0
        ? providerFlights
        : (await searchDuffelOffers(city, search)).slice(0, 12).map((offer, index) => mapOfferToFlight(offer, city, search, index));
    const deals = flights.slice(0, 8).map((flight, index) => mapFlightToDeal(flight, city, search, index));

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
  const dateFlexDays = clampNumber(Number(query.dateFlexDays ?? 0), 0, 3);

  return { city, origin, startDate, endDate, people, flightType, budget, dateFlexDays };
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

function addDays(date, days) {
  const next = new Date(`${date}T00:00:00Z`);
  next.setUTCDate(next.getUTCDate() + days);
  return next.toISOString().slice(0, 10);
}

async function searchProviderFlights(city, search) {
  const results =
    Number(search.dateFlexDays ?? 0) > 0
      ? await Promise.allSettled([searchGoogleFlexibleFlights(city, search)])
      : await Promise.allSettled([searchGoogleFlights(city, search), searchSkyscannerFlights(city, search)]);
  return results
    .flatMap((result) => (result.status === "fulfilled" ? result.value : []))
    .sort((a, b) => a.pricePerPerson - b.pricePerPerson)
    .slice(0, 12);
}

function buildFlexibleSearches(search) {
  const flexDays = clampNumber(Number(search.dateFlexDays ?? 0), 0, 3);
  const offsets = Array.from({ length: flexDays * 2 + 1 }, (_, index) => index - flexDays);
  return offsets.map((offset) => ({
    ...search,
    startDate: addDays(search.startDate, offset),
    endDate: search.flightType === "roundTrip" ? addDays(search.endDate, offset) : search.endDate,
  }));
}

async function searchGoogleFlights(city, search) {
  const apiKey = process.env.SERPAPI_KEY;
  if (!apiKey) return [];

  const params = buildGoogleFlightsParams(apiKey, city, search);
  const payload = await fetchSerpApi(params);
  const outboundItems = googleFlightItems(payload);

  if (search.flightType === "roundTrip") {
    const pricedRoundTrips = await Promise.all(
      outboundItems
        .filter((item) => item.departure_token)
        .slice(0, 4)
        .map(async (outboundItem, index) => {
          const returnParams = buildGoogleFlightsParams(apiKey, city, search);
          returnParams.set("departure_token", outboundItem.departure_token);
          const returnPayload = await fetchSerpApi(returnParams);
          const returnItem = googleFlightItems(returnPayload).find((item) => Number.isFinite(Number(item.price)));
          return returnItem ? mapGoogleRoundTrip(outboundItem, returnItem, city, search, index) : null;
        }),
    );
    return pricedRoundTrips.filter(Boolean).sort((a, b) => a.pricePerPerson - b.pricePerPerson);
  }

  return outboundItems
    .filter((item) => Number.isFinite(Number(item.price)))
    .map((item, index) => mapGoogleOneWay(item, city, search, index));
}

async function searchGoogleFlexibleFlights(city, search) {
  const apiKey = process.env.SERPAPI_KEY;
  if (!apiKey) return [];

  const candidates = buildFlexibleSearches(search);
  const firstPasses = await Promise.all(
    candidates.map(async (candidate) => ({
      search: candidate,
      payload: await fetchSerpApi(buildGoogleFlightsParams(apiKey, city, candidate)),
    })),
  );
  const pricedCandidates = firstPasses
    .flatMap(({ search: candidateSearch, payload }) => googleFlightItems(payload).map((item) => ({ item, search: candidateSearch })))
    .filter(({ item }) => Number.isFinite(Number(item.price)) || item.departure_token)
    .sort((a, b) => Number(a.item.price ?? Number.MAX_SAFE_INTEGER) - Number(b.item.price ?? Number.MAX_SAFE_INTEGER))
    .slice(0, 4);

  const refined = await Promise.all(
    pricedCandidates.map(async ({ item: outboundItem, search: candidateSearch }, index) => {
      if (candidateSearch.flightType !== "roundTrip" || !outboundItem.departure_token) {
        return Number.isFinite(Number(outboundItem.price)) ? mapGoogleOneWay(outboundItem, city, candidateSearch, index) : null;
      }
      const returnParams = buildGoogleFlightsParams(apiKey, city, candidateSearch);
      returnParams.set("departure_token", outboundItem.departure_token);
      const returnPayload = await fetchSerpApi(returnParams);
      const returnItem = googleFlightItems(returnPayload).find((item) => Number.isFinite(Number(item.price)));
      return returnItem ? mapGoogleRoundTrip(outboundItem, returnItem, city, candidateSearch, index) : null;
    }),
  );

  return refined.filter(Boolean).sort((a, b) => a.pricePerPerson - b.pricePerPerson);
}

function buildGoogleFlightsParams(apiKey, city, search) {
  const params = new URLSearchParams({
    engine: "google_flights",
    api_key: apiKey,
    departure_id: search.origin,
    arrival_id: city.airportCode,
    outbound_date: search.startDate,
    currency: "EUR",
    hl: "de",
    gl: "de",
    type: search.flightType === "oneWay" ? "2" : "1",
    adults: String(search.people),
    travel_class: "1",
    no_cache: "true",
    deep_search: "true",
  });
  if (search.flightType === "roundTrip") params.set("return_date", search.endDate);
  return params;
}

async function fetchSerpApi(params) {
  const response = await fetch(`https://serpapi.com/search.json?${params.toString()}`);
  if (!response.ok) return {};
  return response.json();
}

function googleFlightItems(payload) {
  return [...(payload.best_flights ?? []), ...(payload.other_flights ?? []), ...(payload.flights ?? [])];
}

function mapGoogleOneWay(item, city, search, index) {
  const first = item.flights?.[0] ?? {};
  const last = item.flights?.[item.flights.length - 1] ?? first;
  return buildGoogleFlightResult({ item, outboundFirst: first, outboundLast: last, returnFirst: null, returnLast: null, city, search, index });
}

function mapGoogleRoundTrip(outboundItem, returnItem, city, search, index) {
  const outboundFirst = outboundItem.flights?.[0] ?? {};
  const outboundLast = outboundItem.flights?.[outboundItem.flights.length - 1] ?? outboundFirst;
  const returnFirst = returnItem.flights?.[0] ?? {};
  const returnLast = returnItem.flights?.[returnItem.flights.length - 1] ?? returnFirst;
  return buildGoogleFlightResult({ item: returnItem, outboundFirst, outboundLast, returnFirst, returnLast, city, search, index, outboundItem });
}

function buildGoogleFlightResult({ item, outboundFirst, outboundLast, returnFirst, returnLast, city, search, index, outboundItem }) {
  const totalPrice = Math.round(Number(item.price));
  const airline = outboundFirst.airline ?? item.airline ?? "Google Flights";
  const outboundDate = dateFromProviderTime(outboundFirst.departure_airport?.time) ?? search.startDate;
  const returnDate = search.flightType === "roundTrip" ? (dateFromProviderTime(returnFirst?.departure_airport?.time) ?? search.endDate) : undefined;
  return {
    id: `google-flights-${item.booking_token ?? item.departure_token ?? outboundItem?.departure_token ?? index}`,
    cityId: search.city,
    originAirport: search.origin,
    destinationAirport: city.airportCode,
    flightType: search.flightType,
    outboundDate,
    returnDate,
    outboundDeparture: formatProviderTime(outboundFirst.departure_airport?.time),
    outboundArrival: formatProviderTime(outboundLast.arrival_airport?.time),
    returnDeparture: search.flightType === "roundTrip" ? formatProviderTime(returnFirst?.departure_airport?.time) : undefined,
    returnArrival: search.flightType === "roundTrip" ? formatProviderTime(returnLast?.arrival_airport?.time) : undefined,
    airline,
    directFlight: isDirectGoogleFlight(outboundItem ?? item) && (!returnFirst || isDirectGoogleFlight(item)),
    includesCarryOn: true,
    includesCheckedBag: item.extensions?.some((extension) => String(extension).toLowerCase().includes("checked")) ?? false,
    pricePerPerson: Math.round(totalPrice / search.people),
    totalPrice,
    source: "Google Flights",
    bookingUrl: buildGoogleFlightsUrl(search.origin, city.airportCode, outboundDate, returnDate ?? outboundDate, search.people, search.flightType, airline, formatProviderTime(outboundFirst.departure_airport?.time), search.flightType === "roundTrip" ? formatProviderTime(returnFirst?.departure_airport?.time) : ""),
    isLive: true,
  };
}

function isDirectGoogleFlight(item) {
  return (item.layovers?.length ?? 0) === 0 || String(item.type ?? "").toLowerCase().includes("nonstop");
}

async function searchSkyscannerFlights(city, search) {
  const apiKey = process.env.SKYSCANNER_API_KEY;
  if (!apiKey) return [];

  const legs = [
    {
      originPlaceId: { iata: search.origin },
      destinationPlaceId: { iata: city.airportCode },
      date: dateObject(search.startDate),
    },
  ];
  if (search.flightType === "roundTrip") {
    legs.push({
      originPlaceId: { iata: city.airportCode },
      destinationPlaceId: { iata: search.origin },
      date: dateObject(search.endDate),
    });
  }

  const createResponse = await fetch("https://partners.api.skyscanner.net/apiservices/v3/flights/live/search/create", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": apiKey,
    },
    body: JSON.stringify({
      query: {
        market: "DE",
        locale: "de-DE",
        currency: "EUR",
        queryLegs: legs,
        adults: search.people,
        cabinClass: "CABIN_CLASS_ECONOMY",
      },
    }),
  });
  if (!createResponse.ok) return [];
  const created = await createResponse.json();
  const token = created.sessionToken ?? created.session_token;
  if (!token) return [];

  const pollResponse = await fetch(`https://partners.api.skyscanner.net/apiservices/v3/flights/live/search/poll/${encodeURIComponent(token)}`, {
    method: "POST",
    headers: { "x-api-key": apiKey },
  });
  if (!pollResponse.ok) return [];
  const payload = await pollResponse.json();
  const itineraries = Object.values(payload.content?.results?.itineraries ?? {});
  const legsById = payload.content?.results?.legs ?? {};
  const carriers = payload.content?.results?.carriers ?? {};

  return itineraries
    .map((item, index) => {
      const pricing = item.pricingOptions?.[0];
      const totalPrice = Number(pricing?.price?.amount ?? pricing?.price?.raw ?? pricing?.price);
      if (!Number.isFinite(totalPrice)) return null;
      const outboundLeg = legsById[item.legIds?.[0]] ?? {};
      const returnLeg = legsById[item.legIds?.[1]] ?? {};
      const carrier = carriers[outboundLeg.marketingCarrierIds?.[0]] ?? carriers[outboundLeg.operatingCarrierIds?.[0]] ?? {};
      return {
        id: `skyscanner-${item.id ?? index}`,
        cityId: search.city,
        originAirport: search.origin,
        destinationAirport: city.airportCode,
        flightType: search.flightType,
        outboundDate: outboundLeg.departureDateTime?.year ? objectDate(outboundLeg.departureDateTime) : search.startDate,
        returnDate: search.flightType === "roundTrip" ? (returnLeg.departureDateTime?.year ? objectDate(returnLeg.departureDateTime) : search.endDate) : undefined,
        outboundDeparture: objectTime(outboundLeg.departureDateTime),
        outboundArrival: objectTime(outboundLeg.arrivalDateTime),
        returnDeparture: search.flightType === "roundTrip" ? objectTime(returnLeg.departureDateTime) : undefined,
        returnArrival: search.flightType === "roundTrip" ? objectTime(returnLeg.arrivalDateTime) : undefined,
        airline: carrier.name ?? "Skyscanner",
        directFlight: outboundLeg.stopCount === 0 && (!returnLeg.id || returnLeg.stopCount === 0),
        includesCarryOn: true,
        includesCheckedBag: false,
        pricePerPerson: Math.round(totalPrice / search.people),
        totalPrice: Math.round(totalPrice),
        source: "Skyscanner",
        bookingUrl: buildSkyscannerFlightUrl(search.origin, city.airportCode, search.startDate, search.endDate, search.people, search.flightType),
        isLive: true,
      };
    })
    .filter(Boolean);
}

function mapFlightToDeal(flight, city, search, index) {
  return {
    id: `deal-${flight.id}`,
    title: `${city.name} Flug: ${flight.source} Angebot ${flight.airline}`,
    cityId: search.city,
    destinationAirport: city.airportCode,
    originAirport: search.origin,
    originName: originMap[search.origin] ?? search.origin,
    tripMode: "flight",
    flightType: search.flightType,
    image: city.image,
    startDate: flight.outboundDate,
    endDate: flight.returnDate ?? flight.outboundDate,
    people: search.people,
    budget: search.budget,
    flightPrice: flight.totalPrice,
    hotelPrice: 0,
    totalPrice: flight.totalPrice,
    hotelRating: 0,
    score: Math.max(50, 100 - index * 5),
    priceDropPercent: 0,
    bookingUrl: flight.bookingUrl,
    notes: [
      `Preis direkt aus ${flight.source}`,
      `${flight.airline}: ${search.origin} nach ${city.airportCode}`,
      flight.directFlight ? "Direktflug" : "Umstieg möglich",
      "Endgültige Buchung und Preisbestätigung erfolgen beim Anbieter.",
    ],
    directFlight: flight.directFlight,
    durationNights: nightsBetween(flight.outboundDate, flight.returnDate ?? flight.outboundDate),
    includesCarryOn: flight.includesCarryOn,
    includesCheckedBag: flight.includesCheckedBag,
    hotelRefundable: false,
    flightSource: flight.source,
    lastCheckedAt: new Date().toISOString(),
    priceHistory: [flight.totalPrice, flight.totalPrice, flight.totalPrice, flight.totalPrice, flight.totalPrice, flight.totalPrice, flight.totalPrice],
    isLive: true,
  };
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

function buildGoogleFlightsUrl(origin, destination, startDate, endDate, people, flightType, airline = "", outboundTime = "", returnTime = "") {
  const route = flightType === "oneWay" ? `${origin} nach ${destination} ${startDate} ${outboundTime} nur Hinflug` : `${origin} nach ${destination} ${startDate} ${outboundTime} ${endDate} ${returnTime} Hin und zurück`;
  return `https://www.google.com/travel/flights?q=${encodeURIComponent(`${route} ${people} Personen ${airline}`.trim())}`;
}

function buildSkyscannerFlightUrl(origin, destination, startDate, endDate, people, flightType) {
  const outbound = formatSkyscannerDate(startDate);
  const inbound = formatSkyscannerDate(endDate);
  const path = flightType === "oneWay" ? `${origin.toLowerCase()}/${destination.toLowerCase()}/${outbound}` : `${origin.toLowerCase()}/${destination.toLowerCase()}/${outbound}/${inbound}`;
  const query = new URLSearchParams({
    adults: String(people),
    cabinclass: "economy",
    currency: "EUR",
    locale: "de-DE",
    market: "DE",
    rtn: flightType === "oneWay" ? "0" : "1",
  });
  return `https://www.skyscanner.de/transport/flights/${path}/?${query.toString()}`;
}

function formatSkyscannerDate(date) {
  const [year, month, day] = date.split("-");
  return `${year.slice(2)}${month}${day}`;
}

function dateObject(date) {
  const [year, month, day] = date.split("-").map(Number);
  return { year, month, day };
}

function objectDate(value) {
  return `${String(value.year).padStart(4, "0")}-${String(value.month).padStart(2, "0")}-${String(value.day).padStart(2, "0")}`;
}

function objectTime(value) {
  if (!value) return "--:--";
  return `${String(value.hour ?? 0).padStart(2, "0")}:${String(value.minute ?? 0).padStart(2, "0")}`;
}

function formatProviderTime(value) {
  if (!value) return "--:--";
  const match = String(value).match(/(\d{1,2}):(\d{2})/);
  return match ? `${match[1].padStart(2, "0")}:${match[2]}` : "--:--";
}

function dateFromProviderTime(value) {
  if (!value) return null;
  const isoMatch = String(value).match(/(\d{4}-\d{2}-\d{2})/);
  if (isoMatch) return isoMatch[1];
  const shortMatch = String(value).match(/(\d{1,2})[./-](\d{1,2})[./-](\d{2,4})/);
  if (!shortMatch) return null;
  const year = shortMatch[3].length === 2 ? `20${shortMatch[3]}` : shortMatch[3];
  return `${year}-${shortMatch[2].padStart(2, "0")}-${shortMatch[1].padStart(2, "0")}`;
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
