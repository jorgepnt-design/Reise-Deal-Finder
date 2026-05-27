export default async function handler(req, res) {
  setCorsHeaders(res);

  if (req.method === "OPTIONS") {
    res.status(204).end();
    return;
  }

  try {
    if (req.method === "GET") {
      const offerId = String(req.query.offerId ?? "");
      if (!offerId) throw withStatus(new Error("offerId fehlt."), 400);
      const offer = await getDuffelOffer(offerId);
      res.status(200).json(mapOfferForCheckout(offer));
      return;
    }

    if (req.method === "POST") {
      const body = typeof req.body === "string" ? JSON.parse(req.body || "{}") : req.body ?? {};
      const offerId = String(body.offerId ?? "");
      if (!offerId) throw withStatus(new Error("offerId fehlt."), 400);

      const offer = await getDuffelOffer(offerId);
      const passengers = buildPassengers(offer, body.passengers);
      const response = await duffelFetch("/air/orders", {
        method: "POST",
        body: JSON.stringify({
          data: {
            type: "instant",
            selected_offers: [offer.id],
            payments: [
              {
                type: "balance",
                currency: offer.total_currency,
                amount: offer.total_amount,
              },
            ],
            passengers,
            metadata: {
              source: "jorges-reise-deal-finder",
              offer_id: offer.id,
            },
          },
        }),
      });

      const payload = await response.json();
      const order = payload.data;
      res.status(201).json({
        id: order.id,
        bookingReference: order.booking_reference ?? order.booking_reference_id ?? order.id,
        totalAmount: order.total_amount ?? offer.total_amount,
        totalCurrency: order.total_currency ?? offer.total_currency,
        status: order.status ?? "created",
      });
      return;
    }

    res.status(405).json({ error: "Method not allowed" });
  } catch (error) {
    const status = error.statusCode ?? 500;
    res.status(status).json({
      error: "Duffel-Buchung konnte nicht erstellt werden",
      detail: error.message,
    });
  }
}

async function getDuffelOffer(offerId) {
  const response = await duffelFetch(`/air/offers/${encodeURIComponent(offerId)}`);
  const payload = await response.json();
  return payload.data;
}

async function duffelFetch(path, options = {}) {
  const token = process.env.DUFFEL_ACCESS_TOKEN;
  if (!token) throw withStatus(new Error("DUFFEL_ACCESS_TOKEN fehlt in Vercel."), 500);

  const response = await fetch(`https://api.duffel.com${path}`, {
    ...options,
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
      "Duffel-Version": "v2",
      Authorization: `Bearer ${token}`,
      ...(options.headers ?? {}),
    },
  });

  if (!response.ok) {
    const text = await response.text();
    throw withStatus(new Error(`Duffel API Fehler (${response.status}): ${text.slice(0, 500)}`), response.status);
  }

  return response;
}

function mapOfferForCheckout(offer) {
  return {
    offerId: offer.id,
    totalAmount: offer.total_amount,
    totalCurrency: offer.total_currency,
    expiresAt: offer.expires_at,
    airline: offer.owner?.name ?? offer.slices?.[0]?.segments?.[0]?.marketing_carrier?.name ?? "Airline",
    passengers: (offer.passengers ?? []).map((passenger, index) => ({
      id: passenger.id,
      type: passenger.type ?? "adult",
      label: `Reisender ${index + 1}`,
    })),
  };
}

function buildPassengers(offer, passengerInput) {
  const offerPassengers = offer.passengers ?? [];
  if (!Array.isArray(passengerInput) || passengerInput.length !== offerPassengers.length) {
    throw withStatus(new Error(`Es werden genau ${offerPassengers.length} Reisende benötigt.`), 400);
  }

  return offerPassengers.map((offerPassenger, index) => {
    const input = passengerInput[index] ?? {};
    const givenName = clean(input.givenName);
    const familyName = clean(input.familyName);
    const bornOn = clean(input.bornOn);
    const email = clean(input.email);
    const phoneNumber = normalizePhoneNumber(input.phoneNumber);

    if (!givenName || !familyName || !bornOn || !email || !phoneNumber) {
      throw withStatus(new Error("Vorname, Nachname, Geburtsdatum, E-Mail und Telefonnummer sind für alle Reisenden erforderlich. Telefonnummer bitte z. B. als +491723532409 oder 01723532409 eingeben."), 400);
    }

    return {
      id: offerPassenger.id,
      type: offerPassenger.type ?? "adult",
      title: input.title === "mrs" ? "mrs" : "mr",
      gender: input.title === "mrs" ? "f" : "m",
      given_name: givenName,
      family_name: familyName,
      born_on: bornOn,
      email,
      phone_number: phoneNumber,
    };
  });
}

function clean(value) {
  return String(value ?? "").trim();
}

function normalizePhoneNumber(value) {
  const raw = clean(value).replace(/[\s()./-]/g, "");
  if (!raw) return "";
  if (/^\+[1-9]\d{7,14}$/.test(raw)) return raw;
  if (/^00[1-9]\d{7,14}$/.test(raw)) return `+${raw.slice(2)}`;
  if (/^0[1-9]\d{6,13}$/.test(raw)) return `+49${raw.slice(1)}`;
  if (/^49[1-9]\d{6,13}$/.test(raw)) return `+${raw}`;
  return "";
}

function setCorsHeaders(res) {
  const allowedOrigin = process.env.ALLOWED_ORIGIN ?? "https://jorgepnt-design.github.io";
  res.setHeader("Access-Control-Allow-Origin", allowedOrigin);
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
}

function withStatus(error, statusCode) {
  error.statusCode = statusCode;
  return error;
}
