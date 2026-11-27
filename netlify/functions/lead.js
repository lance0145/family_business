/*
  Receives a lead captured by the chat widget's guided "Get a quote" flow
  (see js/main.js, leadFlow) and emails it via the Resend API. Runs
  server-side so the Resend key never reaches the browser — same pattern
  as chat.js's Gemini key handling. Requires a RESEND_API_KEY env var
  (Netlify dashboard, never committed), a single key — Resend doesn't
  have the quota fragility that justified key rotation for Gemini.
*/

var MAX_FIELD_LENGTH = 200;
var NAME_MAX_LENGTH = 100;
var EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
var NOTIFY_TO = "lance0145@gmail.com";
var FROM_ADDRESS = "IntelliAgent Chat <leads@intelliagent.pro>";

// Best-effort only: resets on cold start, not shared across instances.
// A deterrent against casual direct hits on this endpoint, not a guarantee.
var RATE_LIMIT_WINDOW_MS = 10 * 60 * 1000;
var RATE_LIMIT_MAX = 5;
var recentByIp = {};

function isRateLimited(ip) {
  var now = Date.now();
  var hits = (recentByIp[ip] || []).filter(function (t) { return now - t < RATE_LIMIT_WINDOW_MS; });
  hits.push(now);
  recentByIp[ip] = hits;
  return hits.length > RATE_LIMIT_MAX;
}

function escapeHtml(s) {
  return String(s)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

exports.handler = async function (event) {
  if (event.httpMethod !== "POST") {
    return { statusCode: 405, body: JSON.stringify({ error: "Method Not Allowed" }) };
  }

  var payload;
  try {
    payload = JSON.parse(event.body || "{}");
  } catch (e) {
    return { statusCode: 400, body: JSON.stringify({ error: "Invalid JSON" }) };
  }

  // Honeypot: a real visitor never fills this in (it's not a visible field).
  // Pretend success so a bot doesn't learn the field is being checked.
  if (payload.hp) {
    return { statusCode: 200, body: JSON.stringify({ ok: true }) };
  }

  var name = (payload.name || "").toString().trim().slice(0, NAME_MAX_LENGTH);
  var email = (payload.email || "").toString().trim().slice(0, MAX_FIELD_LENGTH);
  var service = (payload.service || "").toString().trim().slice(0, MAX_FIELD_LENGTH);
  var preferredTime = (payload.preferredTime || "").toString().trim().slice(0, MAX_FIELD_LENGTH) || "no preference given";
  var page = (payload.page || "").toString().trim().slice(0, MAX_FIELD_LENGTH);

  if (!name) return { statusCode: 400, body: JSON.stringify({ error: "Name is required" }) };
  if (!email || !EMAIL_RE.test(email)) return { statusCode: 400, body: JSON.stringify({ error: "Valid email is required" }) };
  if (!service) return { statusCode: 400, body: JSON.stringify({ error: "Service is required" }) };

  var ip = (event.headers && (event.headers["x-nf-client-connection-ip"] || event.headers["client-ip"])) || "unknown";
  if (isRateLimited(ip)) {
    return { statusCode: 429, body: JSON.stringify({ error: "Too many requests, please try again later" }) };
  }

  var apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    return { statusCode: 500, body: JSON.stringify({ error: "Email sending is not configured" }) };
  }

  var textBody = [
    "New lead from the chat widget",
    "",
    "Name: " + name,
    "Email: " + email,
    "Service: " + service,
    "Preferred time: " + preferredTime,
    "Page: " + (page || "(unknown)")
  ].join("\n");

  var htmlBody = [
    "<p><strong>New lead from the chat widget</strong></p>",
    "<p>",
    "Name: " + escapeHtml(name) + "<br>",
    "Email: " + escapeHtml(email) + "<br>",
    "Service: " + escapeHtml(service) + "<br>",
    "Preferred time: " + escapeHtml(preferredTime) + "<br>",
    "Page: " + escapeHtml(page || "(unknown)"),
    "</p>"
  ].join("\n");

  try {
    var res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Authorization": "Bearer " + apiKey,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        from: FROM_ADDRESS,
        to: [NOTIFY_TO],
        reply_to: email,
        subject: "New chat lead: " + name + " — " + service,
        text: textBody,
        html: htmlBody
      })
    });

    if (!res.ok) {
      var errBody = "";
      try { errBody = (await res.text()).slice(0, 300); } catch (e2) {}
      return { statusCode: 502, body: JSON.stringify({ error: "Resend failed: " + errBody }) };
    }

    return { statusCode: 200, body: JSON.stringify({ ok: true }) };
  } catch (err) {
    return { statusCode: 502, body: JSON.stringify({ error: err && err.message ? err.message : String(err) }) };
  }
};
