# CLAUDE.md

Guidance for Claude Code when working in this repository.

## What this is

Static marketing site for **AILan**, an AI & automation services business. Plain HTML/CSS/vanilla JS: no framework, no package.json, no build step, no tests. Deployed on **Netlify** (publish directory `/`, no build command). Every push to `main` auto-deploys. `README.md` has launch and deploy notes for the site owner.

## Running locally

```bash
python -m http.server 8000   # or: npx serve .
```

Open `http://localhost:8000`. The contact form only submits when deployed on Netlify. Locally, the `fetch("/")` POST fails and shows the error alert, which is expected.

## Layout

- `*.html` at the root: one file per page (`index`, `services`, `pricing`, `portfolio`, `about`, `contact`, `privacy`, `terms`, `404`).
- `css/style.css`: the entire design system and all component styles, in one file split by `/* ---------- Section ---------- */` comments.
- `js/main.js`: all behavior in one IIFE, written in ES5 style (`var`, `function`, `forEach`). Keep that style and don't add modules or a bundler.
- `assets/images/`: Unsplash photos. When you add or replace one, record it in `assets/images/CREDITS.md`.
- `robots.txt`, `sitemap.xml`, `favicon.svg` (a bare "A" monogram, kept on purpose).

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

Each page's `<head>` has its own `<title>`, meta description, canonical URL, and OG tags. All of them use the placeholder domain `https://www.ailan.example`, which also appears in `robots.txt` and `sitemap.xml`. When you add a page, add it to `sitemap.xml` and to the nav in every page.

## Conventions

- **Brand wordmark:** `<a class="brand"><span class="gradient-text">AI<span class="brand-spark"></span>Lan</span></a>` is a text-only logo with a cyan spark dot. There is no icon badge, so don't reintroduce one.
- **Theming:** all colors, radii, and shadows are CSS custom properties in `:root`. Dark mode overrides them under `[data-theme="dark"]` on `<html>`. Use the variables (`--primary`, `--text-muted`, `--surface`, `--border`, `--gradient`, etc.) and never hard-code colors. The chosen theme is saved in `localStorage` under the key `ailan-theme` and falls back to `prefers-color-scheme`.
- **Fonts:** Inter for body text and Space Grotesk for headings, both loaded from Google Fonts in each `<head>`.
- **JS hooks are plain classes and data attributes.** `main.js` looks elements up by selector and skips anything that isn't on the page, so you can add or remove sections without changing JS. The hooks:
  - `.reveal` fades an element in on scroll (IntersectionObserver adds `.in`).
  - `data-count="120" data-suffix="+"` makes an animated stat counter.
  - `.faq-list > .faq-item > .faq-q + .faq-a` is an accordion where only one item is open at a time.
  - `data-theme-toggle`, `.nav-toggle`/`.nav-links` (mobile menu), `.back-to-top`, `data-year`.
  - The active nav link is set automatically by matching `href` against the current filename.
  - `.chat-widget-btn` / `.chat-panel` is a **demo** chat widget that returns canned random replies from `demoReplies`. No AI backend is involved.
  - `.newsletter-form` is a front-end-only stub that pretends to subscribe.
- **Contact form (`#contact-form` in `contact.html`)** uses Netlify Forms. It relies on `data-netlify="true"`, a hidden `form-name=contact` input, and the `bot-field` honeypot, so keep all three. `main.js` validates the `[required]` fields: it toggles `.invalid` on the parent `.field`, which reveals the `.error-msg` text. It then POSTs the fields URL-encoded to `/` and shows `#form-success`. Each field needs a `name` attribute, or Netlify drops it.
- **Accessibility:** each page starts with a `.skip-link` to `#main`, icon buttons carry `aria-label`, and the nav toggle updates `aria-expanded`. Keep these when you edit.
- Layout helpers: `.container`, `.two-col`, `.section-head(.center)`, `.section-tag`, `.btn` / `.btn-outline` / `.btn-sm`, `.gradient-text`, `.badge`. Pages also use some inline `style=""` for one-off spacing.

## Placeholder content (don't present as real)

The testimonials on `index.html`, the team bios on `about.html`, the privacy and terms text, and the `ailan.example` domain are all placeholders. The contact email in the form's error fallback (`main.js`) and in the README is the owner's real address.

## Future direction

The owner may migrate the site to Next.js. The README's "Migrating to Next.js later" section has the mapping. Until that happens, keep the site buildless and static.
