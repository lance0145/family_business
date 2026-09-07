# AILan — AI & Automation Solutions website

A complete, static, responsive marketing site for an AI & automation services business. No build step required — plain HTML/CSS/JS.

## Structure

```
index.html        Home
services.html      Detailed services (chatbots, automation, custom AI agents, integration, analytics, consulting)
pricing.html        Starter / Growth / Enterprise packages
portfolio.html       Case studies
about.html         Mission, values, team, timeline
contact.html        Contact form + contact details
privacy.html         Privacy policy (placeholder — see below)
terms.html          Terms of service (placeholder — see below)
404.html           Custom not-found page
css/style.css        Design system + all component styles (light/dark theme)
js/main.js          Theme toggle, nav, scroll reveal, FAQ accordion, form validation, demo chat widget
favicon.svg          Tab icon
robots.txt / sitemap.xml   Basic SEO files
```

## Before you launch

1. **Replace placeholder content**
   - Testimonials on `index.html` are samples — swap in real client quotes (or remove the section).
   - Team bios on `about.html` — add real people or remove the placeholder cards.
   - `privacy.html` and `terms.html` are placeholder legal text — have them reviewed by a professional, especially if you'll handle EU (GDPR) or California (CCPA) resident data.
   - Update `https://www.ailan.example` in `robots.txt`, `sitemap.xml`, and every `<link rel="canonical">` / `og:url` / `og:image` tag to your real domain.
   - All photography in `assets/images/` is sourced from Unsplash (free license, no attribution legally required) — swap for your own brand photography, real project screenshots, or team headshots when available. See `assets/images/CREDITS.md` for what each file is and its source.

2. **Contact form — already wired up for Netlify**
   The form in `contact.html` validates client-side, then submits via `fetch()` to Netlify Forms (see `js/main.js`, "Contact form validation"). This **only works once deployed on Netlify** — Netlify detects the `data-netlify="true"` form at deploy time and starts collecting submissions automatically (viewable under Site settings → Forms). No third-party service or backend needed.
   - **New submissions notification:** in the Netlify dashboard, go to Forms → your form → Settings, and add an email notification to `lance0145@gmail.com` so you're alerted per submission (Netlify doesn't email you by default).
   - **If you deploy anywhere other than Netlify** (Vercel, GitHub Pages, Cloudflare Pages, cPanel), this fetch call won't work — swap it for a form backend like [Formspree](https://formspree.io)/[Getform](https://getform.io), or [EmailJS](https://www.emailjs.com/) for client-side sending, or a Next.js API route if you migrate.

3. **Newsletter signup**
   The footer newsletter form is currently a front-end-only stub. Connect it to Mailchimp, ConvertKit, Brevo, or similar when ready.

## Running locally

No build tools needed — but opening `index.html` directly via `file://` will break the mobile menu/relative-fetch-free JS (it's fine) and any future `fetch()`-based includes. Simplest local preview:

```bash
# Python 3
python -m http.server 8000

# or Node
npx serve .
```

Then visit `http://localhost:8000`.

## Deploying

This repo is set up to deploy on **Netlify** (recommended — it's what the contact form above relies on): connect the GitHub repo at [app.netlify.com](https://app.netlify.com) → Add new site → Import an existing project, pick this repo, leave build settings blank (no build command, publish directory `/`), and deploy. Every push to `main` auto-deploys from then on.

Any other static host also works out of the box (Vercel, GitHub Pages, Cloudflare Pages, traditional cPanel hosting) — just note the contact form needs a different backend on those (see above).

## Migrating to Next.js later

This site is structured so a future move to Next.js is straightforward:
- Each `.html` page becomes a route (`app/page.tsx`, `app/services/page.tsx`, etc.).
- The shared header/footer/chat-widget markup (currently duplicated per page) becomes shared `<Header>`, `<Footer>`, `<ChatWidget>` components — a good first refactor once you migrate.
- `css/style.css` can be imported globally almost as-is.
- `js/main.js` behaviors map to small React hooks/components (theme toggle → context, FAQ accordion → `useState`, scroll reveal → a custom hook wrapping `IntersectionObserver`).
- The contact form becomes a natural fit for a Next.js Server Action or API route instead of a third-party form service.

## Customizing the design

Colors, radii, and shadows are all CSS custom properties at the top of `css/style.css` (`:root` and `[data-theme="dark"]`). Change `--primary` and `--primary-2` to re-theme the whole site instantly.
