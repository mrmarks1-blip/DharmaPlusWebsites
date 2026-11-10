# Dharma Soup

The website at dharmasoup.org: a home page plus the Dharma Practice app.

**Start with `docs/WORKING.md`.** It holds every decision, to-do and open item, and it wins over anything else.

## What's here

```
index.html      home page
practice/       the app (one file, index.html, plus its service worker, fonts, sounds and pictures)
worker/         the small server behind /api/ (reminders, groups, automatic backups)
design/         mockups (not served)
docs/           working doc, research, archive (not served)
content/        text drafts (not served)
print/          builds the booklet PDF (not served)
tools/          one-off helper pages and scripts (not served)
```

## Preview on this computer

```
python -m http.server 8740
```

then open <http://localhost:8740/practice/>.

## Going live

Work happens on the `v10-redesign` branch. Pushing it to `main` puts it live on dharmasoup.org in about a minute
(Cloudflare Workers; no build step). Only push to `main` when Gareth says so.
