/*
  Proxies chat widget messages to the Gemini API. Runs server-side so the
  API key(s) never reach the browser. Rotates across GEMINI_API_KEYS (a
  comma-separated env var) starting from a random index on every request,
  so load spreads across keys and a single rate-limited or revoked key
  doesn't take the whole widget down — it just falls through to the next
  one. If every key fails, returns a 502 and js/main.js falls back to the
  scripted demoRules reply, so a visitor never sees a dead chat.
*/

var MODEL = "gemini-3.8-flash";
var MAX_MESSAGE_LENGTH = 500;
var MAX_HISTORY_TURNS = 6;
var MAX_OUTPUT_TOKENS = 300;

var SYSTEM_PROMPT = [
  "You are the IntelliAgent Assistant, a live chat widget on the IntelliAgent website (intelliagent.pro) — an AI & automation services agency based in the Philippines, working with clients worldwide, remote-first.",
  "",
  "Only answer questions about IntelliAgent and its services. If asked something unrelated (general trivia, coding help, personal advice, etc.), politely decline and redirect to IntelliAgent's services or the Contact page. Never claim to be human. Keep replies concise (2-4 sentences), friendly, and conversational.",
  "",
  "Facts to answer from (do not invent anything beyond this):",
  "- Services: AI Chatbots & Virtual Assistants, Business Process Automation, Custom AI Agent & App Development, Workflow & Systems Integration, Data & AI-Powered Analytics, AI Strategy & Consulting.",
  "- Pricing (USD, starting points — final quote after a free consultation): Starter $1,990 one-time (1 chatbot/automation, up to 2 integrations, 2 weeks support). Growth $6,490 one-time (up to 3 automations or 1 custom AI agent, unlimited integrations, 1 month support, most popular). Enterprise: custom pricing (unlimited automations/agents, dedicated team, SLA). Ongoing support retainers start at $650/month. Third-party tool/API costs (OpenAI, Zapier, hosting) are billed separately at cost.",
  "- Team: Allan Abendanio (Founder & AI Automation Lead), Joanna Catalan (Operations Administrator), Aileen De Guzman (Finance & Accounting), Angelyn Cattenoz (Marketing & Advertising), Andy Dan Allada (Security & Compliance). Allan has real freelance AI/automation experience (APEX Co., Titus Global-Tech, SonglabAI) and a Databricks Generative AI certification — see the About page's Track Record section.",
  "- Typical timeline: simple projects 1-3 weeks, larger custom builds 4-8 weeks.",
  "- Location: Philippines, remote-first, works with clients worldwide.",
  "- Contact: lance0145@gmail.com, +63 930 022 8998, or the Contact page form (reply within 1 business day).",
  "- Security/privacy: least-privilege access, data encrypted in transit, no training external models on client data without consent — see the Privacy Policy.",
  "- This chat widget itself is a real example of the kind of assistant IntelliAgent builds for clients.",
  "",
  "If something isn't covered above, say so honestly and point them to the Contact page rather than guessing."
].join("\n");

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

  var message = (payload.message || "").toString().trim().slice(0, MAX_MESSAGE_LENGTH);
  if (!message) {
    return { statusCode: 400, body: JSON.stringify({ error: "Empty message" }) };
  }

  var history = Array.isArray(payload.history) ? payload.history.slice(-MAX_HISTORY_TURNS) : [];
  var contents = history
    .filter(function (turn) { return turn && turn.role && turn.text; })
    .map(function (turn) {
      return {
        role: turn.role === "bot" ? "model" : "user",
        parts: [{ text: String(turn.text).slice(0, MAX_MESSAGE_LENGTH) }]
      };
    });
  contents.push({ role: "user", parts: [{ text: message }] });

  /*
    Each key lives in its own env var (GEMINI_API_KEYS, GEMINI_API_KEYS2,
    GEMINI_API_KEYS3, ...) rather than one comma-joined value, so no
    single var/file ever holds more than one key at a time -- Netlify
    passes them in separately and they're only combined here, in memory,
    at request time. A value may still contain commas (e.g. if someone
    does join two into one var), which still works via the split/flat.
  */
  var keys = [];
  if (process.env.GEMINI_API_KEYS) keys.push(process.env.GEMINI_API_KEYS);
  for (var n = 2; n <= 20; n++) {
    var v = process.env["GEMINI_API_KEYS" + n];
    if (v) keys.push(v);
  }
  keys = keys
    .join(",")
    .split(",")
    .map(function (k) { return k.trim(); })
    .filter(Boolean);

  if (!keys.length) {
    return { statusCode: 500, body: JSON.stringify({ error: "No API keys configured" }) };
  }

  var requestBody = JSON.stringify({
    system_instruction: { parts: [{ text: SYSTEM_PROMPT }] },
    contents: contents,
    generationConfig: { maxOutputTokens: MAX_OUTPUT_TOKENS, temperature: 0.4, thinkingConfig: { thinkingBudget: 0 } }
  });

  var startIndex = Math.floor(Math.random() * keys.length);
  var lastError = "unknown";

  for (var i = 0; i < keys.length; i++) {
    var key = keys[(startIndex + i) % keys.length];
    try {
      var res = await fetch(
        "https://generativelanguage.googleapis.com/v1beta/models/" + MODEL + ":generateContent?key=" + key,
        { method: "POST", headers: { "Content-Type": "application/json" }, body: requestBody }
      );

      if (!res.ok) {
        var errBody = "";
        try { errBody = (await res.text()).slice(0, 300); } catch (e2) {}
        lastError = "Gemini status " + res.status + " " + errBody;
        continue; // rate-limited, revoked, or otherwise bad key -- try the next one
      }

      var data = await res.json();
      var text = data && data.candidates && data.candidates[0] &&
        data.candidates[0].content && data.candidates[0].content.parts &&
        data.candidates[0].content.parts[0] && data.candidates[0].content.parts[0].text;

      if (!text) {
        lastError = "empty response";
        continue;
      }

      return {
        statusCode: 200,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reply: text.trim() })
      };
    } catch (err) {
      lastError = err && err.message ? err.message : String(err);
    }
  }

  return { statusCode: 502, body: JSON.stringify({ error: "All keys failed: " + lastError }) };
};
