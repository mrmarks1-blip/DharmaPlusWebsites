# Website

A small static site: a landing page plus self-contained mini-apps, one folder each.
No build step, no dependencies — just HTML/CSS/JS served as files.

## Structure

```
/                ← landing page (index.html)
/ngondro/        ← ESM Ngöndro app (PWA)  →  /ngondro/
```

To add a new thing: create a folder with its own `index.html`, then add a card
linking to it in the root `index.html`. That's the whole workflow.

## Local preview

Any static file server works, e.g.:

```
python -m http.server 8731
```

then open <http://localhost:8731/>.

## Deploy

Hosted on a static host (Cloudflare Pages / Netlify) that auto-deploys from this
repo's `main` branch. No build command; output directory is the repo root.
