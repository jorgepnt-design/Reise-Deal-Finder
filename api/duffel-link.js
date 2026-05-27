export default async function handler(req, res) {
  setCorsHeaders(res);

  if (req.method === "OPTIONS") {
    res.status(204).end();
    return;
  }

  if (req.method !== "POST") {
    res.status(405).json({ error: "Method not allowed" });
    return;
  }

  try {
    const token = process.env.DUFFEL_ACCESS_TOKEN;
    if (!token) throw withStatus(new Error("DUFFEL_ACCESS_TOKEN fehlt in Vercel."), 500);

    const body = typeof req.body === "string" ? JSON.parse(req.body || "{}") : req.body ?? {};
    const appUrl = process.env.PUBLIC_APP_URL ?? "https://jorgepnt-design.github.io/Reise-Deal-Finder/";
    const reference = String(body.offerId ?? body.flightId ?? `reise-deal-${Date.now()}`);

    const response = await fetch("https://api.duffel.com/links/sessions", {
      method: "POST",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
        "Duffel-Version": "v2",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        data: {
          reference,
          success_url: appUrl,
          failure_url: appUrl,
          abandonment_url: appUrl,
          primary_color: "#67e8f9",
          traveller_currency: "EUR",
          flights: { enabled: "true" },
          stays: { enabled: "false" },
        },
      }),
    });

    if (!response.ok) {
      const text = await response.text();
      throw withStatus(new Error(`Duffel Link konnte nicht erstellt werden (${response.status}): ${text.slice(0, 240)}`), response.status);
    }

    const payload = await response.json();
    const url = payload.data?.url ?? payload.data?.link_url ?? payload.data?.session_url;
    if (!url) throw withStatus(new Error("Duffel hat keinen Buchungslink zurückgegeben."), 502);

    res.status(200).json({ url });
  } catch (error) {
    const status = error.statusCode ?? 500;
    res.status(status).json({
      error: "Duffel-Buchungslink konnte nicht erstellt werden",
      detail: error.message,
    });
  }
}

function setCorsHeaders(res) {
  const allowedOrigin = process.env.ALLOWED_ORIGIN ?? "https://jorgepnt-design.github.io";
  res.setHeader("Access-Control-Allow-Origin", allowedOrigin);
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
}

function withStatus(error, statusCode) {
  error.statusCode = statusCode;
  return error;
}
