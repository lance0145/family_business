# CLAUDE.md

Guidance for Claude Code when working in this repository.

## What this is

Static marketing site for **IntelliAgent**, an AI & automation services business. Plain HTML/CSS/vanilla JS: no framework, no package.json, no build step, no tests — plus one small serverless function (`netlify/functions/chat.js`) that backs the chat widget with a real Gemini-powered reply. Deployed on **Netlify** (publish directory `/`, no build command; `netlify.toml` points it at the functions directory). Every push to `main` auto-deploys. `README.md` has launch and deploy notes for the site owner.

## Running locally

```bash
python -m http.server 8000   # or: npx serve .
```

Open `http://localhost:8000`. The contact form only submits when deployed on Netlify. Locally, the `fetch("/")` POST fails and shows the error alert, which is expected. The chat widget's Gemini backend needs the serverless function, which this static server doesn't run — it 404s locally and the widget silently falls back to the scripted `demoRules` (see below), so local dev still shows something working. To test the real AI path locally, run `npx netlify-cli dev` instead, which serves both the static site and the function together on `http://localhost:8888`.

## Layout

- `*.html` at the root: one file per page (`index`, `services`, `pricing`, `portfolio`, `about`, `contact`, `privacy`, `terms`, `404`).
- `css/style.css`: the entire design system and all component styles, in one file split by `/* ---------- Section ---------- */` comments.
- `js/main.js`: all behavior in one IIFE, written in ES5 style (`var`, `function`, `forEach`). Keep that style and don't add modules or a bundler.
- `netlify/functions/chat.js`: the one piece of server-side code in this repo — a Node serverless function (no npm dependencies, uses the Node 18+ global `fetch`) that proxies chat messages to the Gemini API. See "Chat widget" below for how it fits together.
- `assets/images/`: Unsplash photos. When you add or replace one, record it in `assets/images/CREDITS.md`.
- `robots.txt`, `sitemap.xml`, `favicon.svg` (a bare "A" monogram, kept on purpose).
- `.env` (git-ignored, local only): holds `NETLIFY_AUTH_TOKEN` (for querying the Netlify API — e.g. reading form submissions — see the "Chat widget" section) and `GEMINI_API_KEYS` (for local `netlify dev` testing). The production value of `GEMINI_API_KEYS` lives in Netlify's dashboard (Site settings → Environment variables), not in any committed file.

## Shared markup is duplicated in every page

There are no includes or templates. The header/nav, footer, chat widget, `<head>` meta block, and `<script src="js/main.js">` are **copied into each page**. A change to any of them (nav links, brand wordmark, footer contents, fonts) must go into **every** HTML file. Before you finish, grep to confirm:

```bash
grep -c "site-header" *.html
```

Which page has which component:
- Full pages (index, services, pricing, portfolio, about, contact) have the header, footer and chat widget.
- `privacy.html` and `terms.html` have the header and footer but no chat widget.
- `404.html` is standalone: it has no header or footer and uses the `.error-page` styles.
- Only `index.html` has JSON-LD structured data.

Each page's `<head>` has its own `<title>`, meta description, canonical URL, and OG tags. All of them use the real domain `https://www.intelliagent.pro`, which also appears in `robots.txt` and `sitemap.xml`. When you add a page, add it to `sitemap.xml` and to the nav in every page.

## Conventions

- **Brand wordmark:** `<a class="brand"><span class="gradient-text">Intelli<span class="brand-spark"></span>Agent</span></a>` is a text-only logo with a cyan spark dot. There is no icon badge, so don't reintroduce one.
- **Theming:** all colors, radii, and shadows are CSS custom properties in `:root`. Dark mode overrides them under `[data-theme="dark"]` on `<html>`. Use the variables (`--primary`, `--text-muted`, `--surface`, `--border`, `--gradient`, etc.) and never hard-code colors. The chosen theme is saved in `localStorage` under the key `intelliagent-theme` and falls back to `prefers-color-scheme`.
- **Fonts:** Inter for body text and Space Grotesk for headings, both loaded from Google Fonts in each `<head>`.
- **JS hooks are plain classes and data attributes.** `main.js` looks elements up by selector and skips anything that isn't on the page, so you can add or remove sections without changing JS. The hooks:
  - `.reveal` fades an element in on scroll (IntersectionObserver adds `.in`).
  - `data-count="120" data-suffix="+"` makes an animated stat counter.
  - `.faq-list > .faq-item > .faq-q + .faq-a` is an accordion where only one item is open at a time.
  - `data-theme-toggle`, `.nav-toggle`/`.nav-links` (mobile menu), `.back-to-top`, `data-year`.
  - The active nav link is set automatically by matching `href` against the current filename.
  - `.chat-widget-btn` / `.chat-panel` is a **real AI chat widget**, not just a demo. On submit, `askGemini()` POSTs the message (plus the last few turns of in-memory `chatHistory`) to `/.netlify/functions/chat`, which calls the Gemini API server-side — the API key(s) never reach the browser. The function's system prompt grounds every reply in real IntelliAgent facts (services, pricing, team, timeline, contact, policies) and tells the model to decline off-topic requests and never claim to be human.
    - **Key rotation**: `GEMINI_API_KEYS` is a comma-separated env var (one or more keys from Google AI Studio — real ones look like `AQ.Ab8...`; keep them in Netlify's dashboard env vars for production, never committed). The function tries a random starting key and falls through the rest of the list on any non-2xx response (rate-limited, revoked, etc.), so one bad key doesn't take the widget down. Use `.env` locally with `NETLIFY_AUTH_TOKEN` (for the Netlify API — e.g. pulling the `chat-log`/`contact` form submissions straight from `GET /api/v1/sites/{site_id}/forms` and `/forms/{form_id}/submissions`, no dashboard screenshots needed) and `GEMINI_API_KEYS`.
    - **Scripted fallback**: if the function call fails for any reason (all keys exhausted, network error, or running locally on the plain static server where the function doesn't exist and 404s), `js/main.js` catches it and falls back to the original scripted system: `matchReply()` keyword-matches the message against `demoRules` (~23 topics) and returns `{reply, matched}`, falling back further to a generic `fallbackReplies` line only when nothing matches. **Rule order matters** here too: when one question could match two rules' keywords (e.g. "is my data **secure**" contains both "data" and "secure"), the more specific rule must sit earlier in the array, or the broader one wins — see the comment above the secure/privacy rule for a worked example, and test new keywords against existing ones before adding them (a keyword that's a substring of lots of real phrases, like bare "data" or "offer", is the usual culprit). When the scripted fallback also doesn't match, `logUnmatchedQuestion()` fire-and-forgets the question to the hidden `chat-log` Netlify form so it can be reviewed later.
  - `.newsletter-form` is a front-end-only stub that pretends to subscribe.
- **Contact form (`#contact-form` in `contact.html`)** uses Netlify Forms. It relies on `data-netlify="true"`, a hidden `form-name=contact` input, and the `bot-field` honeypot, so keep all three. `main.js` validates the `[required]` fields: it toggles `.invalid` on the parent `.field`, which reveals the `.error-msg` text. It then POSTs the fields URL-encoded to `/` and shows `#form-success`. Each field needs a `name` attribute, or Netlify drops it.
- **Accessibility:** each page starts with a `.skip-link` to `#main`, icon buttons carry `aria-label`, and the nav toggle updates `aria-expanded`. Keep these when you edit.
- Layout helpers: `.container`, `.two-col`, `.section-head(.center)`, `.section-tag`, `.btn` / `.btn-outline` / `.btn-sm`, `.gradient-text`, `.badge`. Pages also use some inline `style=""` for one-off spacing.

## Placeholder content (don't present as real)

`index.html` has no testimonials section — it was removed rather than shipped with fabricated client quotes/names; add one back once there's a real client quote to use. `about.html` has a real "Track Record" section instead: Allan's actual freelance roles, two genuine LinkedIn recommendations (from former colleague/manager, not IntelliAgent clients — don't relabel them as client testimonials), and his Databricks Gen AI certification, all linking to his real LinkedIn profile for verification. `privacy.html`/`terms.html` now describe what the site actually does (Netlify Forms, chat-log, localStorage theme only) but are not lawyer-reviewed — each still carries an inline disclaimer saying so. The team bios on `about.html` are the real team as of the IntelliAgent rebrand, and `intelliagent.pro` is the real live domain — not placeholders. The contact email in the form's error fallback (`main.js`) and in the README is the owner's real address.

## Future direction

The owner may migrate the site to Next.js. The README's "Migrating to Next.js later" section has the mapping. Until that happens, keep the site buildless and static.
