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
      const confirmation = mapOrderConfirmation(order, offer, passengers);
      confirmation.emailSent = await sendBookingEmail(confirmation, passengers[0]?.email);
      res.status(201).json(confirmation);
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

function mapOrderConfirmation(order, offer, submittedPassengers = []) {
  const flights = (order.slices ?? offer.slices ?? []).flatMap((slice) =>
    (slice.segments ?? []).map((segment) => {
      const marketingCarrier = segment.marketing_carrier ?? {};
      const operatingCarrier = segment.operating_carrier ?? marketingCarrier;
      return {
        flightNumber: `${marketingCarrier.iata_code ?? operatingCarrier.iata_code ?? ""}${segment.marketing_carrier_flight_number ?? segment.operating_carrier_flight_number ?? ""}`.trim() || "noch nicht verfügbar",
        airline: marketingCarrier.name ?? operatingCarrier.name ?? order.owner?.name ?? offer.owner?.name ?? "Airline",
        operatingCarrier: operatingCarrier.name ?? marketingCarrier.name ?? "Airline",
        origin: segment.origin?.iata_code ?? segment.origin?.id ?? "",
        originName: segment.origin?.name ?? segment.origin?.iata_code ?? "",
        destination: segment.destination?.iata_code ?? segment.destination?.id ?? "",
        destinationName: segment.destination?.name ?? segment.destination?.iata_code ?? "",
        departingAt: segment.departing_at ?? "",
        arrivingAt: segment.arriving_at ?? "",
      };
    }),
  );

  const passengerSource = order.passengers?.length ? order.passengers : submittedPassengers;
  const passengers = passengerSource.map((passenger, index) => ({
    name: `${passenger.given_name ?? submittedPassengers[index]?.given_name ?? ""} ${passenger.family_name ?? submittedPassengers[index]?.family_name ?? ""}`.trim(),
    type: passenger.type ?? submittedPassengers[index]?.type ?? "adult",
  }));

  return {
    id: order.id,
    bookingReference: order.booking_reference ?? order.booking_reference_id ?? order.id,
    totalAmount: order.total_amount ?? offer.total_amount,
    totalCurrency: order.total_currency ?? offer.total_currency,
    status: order.status ?? "created",
    createdAt: order.created_at ?? new Date().toISOString(),
    isLive: Boolean(order.live_mode ?? !String(process.env.DUFFEL_ACCESS_TOKEN ?? "").startsWith("duffel_test_")),
    airline: order.owner?.name ?? offer.owner?.name ?? flights[0]?.airline ?? "Airline",
    supportContact: process.env.SUPPORT_EMAIL ?? "support@jorges-reise-deal-finder.de",
    checkInHint: "Bitte checke ab 24 Stunden vor Abflug direkt bei der Airline mit Booking Reference und Nachnamen ein.",
    emailSent: false,
    passengers,
    flights,
    baggage: collectBaggage(order, offer),
    paymentSummary: `Bezahlt per Duffel Balance: ${order.total_amount ?? offer.total_amount} ${order.total_currency ?? offer.total_currency}`,
  };
}

function collectBaggage(order, offer) {
  const source = order.slices?.length ? order : offer;
  const labels = new Set();

  for (const slice of source.slices ?? []) {
    for (const segment of slice.segments ?? []) {
      for (const passenger of segment.passengers ?? []) {
        for (const baggage of passenger.baggages ?? []) {
          const quantity = Number(baggage.quantity ?? 0);
          if (quantity <= 0) continue;
          if (baggage.type === "checked") labels.add(`${quantity}x Aufgabegepäck`);
          if (baggage.type === "carry_on") labels.add(`${quantity}x Handgepäck`);
        }
      }
    }
  }

  return labels.size > 0 ? [...labels] : ["Gepäckinformationen bitte bei der Airline prüfen."];
}

async function sendBookingEmail(confirmation, to) {
  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.BOOKING_EMAIL_FROM;
  if (!apiKey || !from || !to) return false;

  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from,
      to,
      subject: `Deine Flugbuchung ${confirmation.bookingReference}`,
      html: buildConfirmationEmailHtml(confirmation),
    }),
  });

  return response.ok;
}

function buildConfirmationEmailHtml(confirmation) {
  const rows = confirmation.flights
    .map(
      (flight) => `
        <tr>
          <td>${escapeHtml(flight.airline)} ${escapeHtml(flight.flightNumber)}</td>
          <td>${escapeHtml(formatDateTime(flight.departingAt))}</td>
          <td>${escapeHtml(flight.origin)} ${escapeHtml(flight.originName)}</td>
          <td>${escapeHtml(formatDateTime(flight.arrivingAt))}</td>
          <td>${escapeHtml(flight.destination)} ${escapeHtml(flight.destinationName)}</td>
        </tr>
      `,
    )
    .join("");

  return `
    <div style="font-family:Arial,sans-serif;color:#111827">
      <h1>Deine Flugbuchung ist bestätigt</h1>
      <p><strong>Booking Reference:</strong> ${escapeHtml(confirmation.bookingReference)}</p>
      <p><strong>Order:</strong> ${escapeHtml(confirmation.id)}</p>
      <p><strong>Preis/Zahlung:</strong> ${escapeHtml(confirmation.paymentSummary)}</p>
      <p><strong>Airline:</strong> ${escapeHtml(confirmation.airline)}</p>
      <h2>Flüge</h2>
      <table cellpadding="8" cellspacing="0" border="1" style="border-collapse:collapse">
        <thead><tr><th>Flug</th><th>Abflug</th><th>Von</th><th>Ankunft</th><th>Nach</th></tr></thead>
        <tbody>${rows}</tbody>
      </table>
      <h2>Passagiere</h2>
      <ul>${confirmation.passengers.map((passenger) => `<li>${escapeHtml(passenger.name)}</li>`).join("")}</ul>
      <h2>Gepäck</h2>
      <ul>${confirmation.baggage.map((item) => `<li>${escapeHtml(item)}</li>`).join("")}</ul>
      <p><strong>Check-in:</strong> ${escapeHtml(confirmation.checkInHint)}</p>
      <p><strong>Support:</strong> ${escapeHtml(confirmation.supportContact)}</p>
    </div>
  `;
}

function formatDateTime(value) {
  if (!value) return "noch nicht verfügbar";
  return new Intl.DateTimeFormat("de-DE", { dateStyle: "medium", timeStyle: "short", timeZone: "Europe/Berlin" }).format(new Date(value));
}

function escapeHtml(value) {
  return String(value ?? "").replace(/[&<>"']/g, (char) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", "\"": "&quot;", "'": "&#039;" })[char] ?? char);
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
