# Dharma Soup (dharmasoup.org)

Gareth owns this project and is not a developer. Explain things in plain words, and don't assume: research, ask, and say when you're unsure.

## Read first

**`docs/WORKING.md`** holds every decision, to-do and open item. Read it at the start of every session. It wins over anything else, including this file, old notes, `docs/archive/` and git history. When a decision changes, update WORKING.md and push it, so every session (local or cloud) sees it.

## Rules that bite if missed

- **`main` is the live site.** Pushing to `main` puts it on dharmasoup.org in about a minute. Work on `v10-redesign` (or a branch off it). Push to `main` only when Gareth says so.
- **`practice/index.html` has CRLF line endings.** Keep them, and never use sed on it.
- **Bump `CACHE` in `practice/sw.js` on every release** so installed phones update. WORKING.md section 1 gives the live and next versions.
- **Never remove the `/ngondro` alias.** Old installs depend on it.
- **Never rename a saved-data key** (`localStorage` keys starting `esm_`). Add new ones instead.
- **Test at phone size** (375×812 and 375×667) before calling anything done.
- **Dharma content must trace to a source.** No invented quotes, practices, dates or meanings.
- **Spelling: "practice" everywhere in the app's own words**, verb included. Prayers, translations and quotes keep their source spelling.
- **Leave `Ngondro-webapp\_old`** (old v4–v9 copies) alone.
- **New files at the repo root are served on the website** unless they're listed in `.assetsignore`. Add notes and tooling there.

## Where things are

The domain, deploy, email and server details are in WORKING.md section 1. In short: GitHub `mrmarks1-blip/DharmaPlusWebsites`, a Cloudflare Worker `dharma-plus-websites` with a D1 database, and Cloudflare Git builds (`main` = live, other branches = preview builds that share the live database). slicedharma.com lapses on 2026-12-10, and dharmasoup.org replaces it.

## Cloud sessions

A cloud session only has this repo. It can't see Gareth's PC, the Cloudflare dashboard or his browser sign-ins. Anything worth keeping goes into WORKING.md (or this file) and gets pushed, or the next session won't know it. Preview locally with `python -m http.server 8740` and open `/practice/`.
