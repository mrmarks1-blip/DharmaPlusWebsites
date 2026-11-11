# Dharma Practice: working doc

Last reviewed with Gareth on **5 November 2026**. This is the one place for decisions, to-dos and open items.
It replaces the decision lists in the old `PLAN.md` and the review checklist. Both are now in `docs/archive/`
and are history only. If something here conflicts with them, this doc wins.

Codes in brackets (A1, C5…) point back to the review checklist in `docs/archive/DECISIONS-REVIEW-2026-11-05.md`.

---

## 1. Where things are

Moved to dharmasoup.org (brand "Dharma Soup") on 2026-11-09. slicedharma.com lapses on 2026-12-10 (registered at IONOS; not renewing).
Its app shows a "We've moved" card until then. dharmasoup.org is registered with Cloudflare (renews 2027-11-09).

| What | Where |
|---|---|
| Repo (canonical) | GitHub `mrmarks1-blip/DharmaPlusWebsites`, cloned at `Ngondro-webapp\V10 - BigUiUpdate` |
| Working branch | `v10-redesign`. `main` is the live site. |
| The app | `practice/index.html`: one file, about 5,200 lines, **CRLF line endings** on Gareth's PC (keep them; never use sed on it). The repo itself stores it with LF; Git converts on Windows, so a cloud session keeps LF. |
| Service worker | `practice/sw.js`. Live: `dp-v10-24` (main 1ca99a1, 10 Nov 2026: the redesign). `dp-v10-25` is taken by the Dharma Soup logo on branch `claude/great-carson-pmqllo` (not live yet), so the release after that is `dp-v10-26`. |
| Old address | `/ngondro/` serves the same files through the Worker (`worker/index.js`, noindex). It isn't a redirect. |
| Server (`/api/*`) | `worker/` + D1 database `dharma-push`: reminders, groups, automatic backups. Cron every minute (`wrangler.jsonc`). Free Workers plan: each run gets 10 ms CPU and 50 fetches/queries, so reminders go out at most 15 a minute, longest-waiting first, up to 2 hours late. The $5 plan is the fix if that ever bites. Preview builds share the live database. |
| Email | Cloudflare Email Routing: feedback@ and texts@dharmasoup.org (and texts@slicedharma.com) forward to mrmarks1@gmail.com. |
| Rate limit | One Cloudflare rule on dharmasoup.org: more than 20 `/api/` requests per 10 s from one address is blocked for 10 s. |
| Home page | `index.html` ("Dharma Soup") |
| Booklet | `print/build.py` → `practice/four-thoughts-refuge-prostrations.pdf` |
| Drafts and notes (not served) | `content/`, `design/`, `print/`, `docs/`, as listed in `.assetsignore` |
| Local preview | `.claude/launch.json` config `v10` (port 8740) or `v10b` (port 8752), then open `/practice/`. Python serves it; Node is installed (useful for `node --check`). Service workers don't register on localhost in the browser pane, so test service-worker changes on a preview or the live site. |
| Deploy | `git push origin v10-redesign:main` (fast-forward). Live on dharmasoup.org, www and (until it lapses) slicedharma.com in about a minute. Other branches build preview versions, at `https://<first 8 characters of the version ID>-dharma-plus-websites.mrmarks1.workers.dev/` (e.g. `60e8bdc8-…`; find it under Workers → dharma-plus-websites → Deployments, or the Build page). Add `/practice/` for the app. Never click "Promote version" there: that makes it live. |

---

## 2. How we work

- **Easy for people who aren't techy (A1).** What matters is the result: simple for "Buddhists who suck with tech".
  Lean is still the default (one file, no build step, native web features first), but a library, build step or
  service is fine **if it clearly justifies itself**. Say why when proposing one.
- **`main` is live (A2).** Work on `v10-redesign` in the V10 folder. The v5–v9, LiveSite and backup folders are old
  copies, moved into `Ngondro-webapp\_old` on 2026-11-10: don't touch them.
- **Push to `main` only when Gareth says so (A3).**
- **Bump the service worker `CACHE` on every release (A4)** so installed phones update.
- **The app lives at `/practice`; `/ngondro` stays for good (A5).** Phones that installed the old address keep their
  offline copy and reminders. Never remove the alias.
- **Existing users' data survives every change (A6).** Saved data uses `localStorage` keys starting `esm_`. Never
  rename one; add new ones.
- **Keep the brand name easy to swap (A7).** It is "Dharma Soup" since 2026-11-09 (`APP_NAME` / `BRAND` in the app).
- **Test at phone size before calling anything done (A8):** 375×812 and 375×667.
- **Don't assume (A9).** Research, ask Gareth, and say when unsure.
- **Treat saved data as untrusted.** Restoring a backup file writes any `esm_` value, and a file can be doctored.
  Check stored values against known choices before putting them into the page (see `sessBgOK` for the pattern).

---

## 3. Content

- **Everything about the Dharma is traceable to a source (B1).** No invented quotes, practices, dates or meanings.
- **Copyright: basic care, no special-case rules (B2–B5, replaced).** Use work that's public domain, openly
  licensed, or that we have permission for, and credit it. Existing credits stay. Lotsawa House texts (CC BY-NC)
  must keep their translator's name, including on share images, because that's a condition of the licence. When
  something new is unclear, tell Gareth what you found and let him decide.
- **Never crop the refuge tree image (B7)**, in the app or the booklet.
- **Keep both copies of the Seven-Line Prayer in the Library (B8).**
- **Hair cutting and astrology are shown as living tradition (B10)**, with sources, not as superstition or fact.

---

## 4. Tone and values

- **Broad appeal across all Buddhist schools (C1).** Include anything that feels right; exclude nothing on purpose.
- **No guilt (C2).** A missed day is never framed as a loss. Nudges encourage. A plain streak is fine.
- **Breath tools follow the person's breath and never set a pace (C3).**
- **Reminders say "Time for practice" or the person's own label (C4)**, not the practice name. The body is a random
  encouraging quote, and a tap opens that practice.
- **Analytics only with a clear purpose (C5, changed).** Some measurement is fine if it really serves improving the
  app. Nothing intrusive or creepy. Every piece needs a reason that's easy to explain to the user, and that reason
  is shown to them (in About or where it applies). Since 2026-11-09 (SW `dp-v10-21`): Cloudflare Web Analytics on
  dharmasoup.org only (site token in `index.html` and `practice/index.html`, loaded only when the host is
  dharmasoup.org). Reason: to see whether anyone besides Gareth uses the beta. No cookies; it records page, rough
  country, browser/device. About and the welcome sheet say so. slicedharma.com also has an older automatic
  Web Analytics site (home page only), which ends with the domain. The Ko-fi floating widget is still out (third-party
  script on every open, doesn't work offline).
- **Generosity (C6, changed).** The app has running costs. Generosity covers a range of causes, still to be
  researched, **including funding for the app itself**. It should feel free and joyful, never a nag.
- **Milestones are private and use everyday icons (C7):** praying hands, sitter, sprout, tree, sun, hearts,
  mountain. Not the Eight Auspicious Symbols. Each ends with "Dedicate it to all beings" or "Rejoice with a friend".
- **The app supports a teacher; it doesn't replace one (C9).** Mention transmission (lung) and empowerment where a
  practice or text needs them.
- **Motivation matters more than numbers (C10).** Progress shows sessions and days practised, not only totals.
  Every session ends with dedication.

---

## 5. Settled features

- **Calendar (D1):** people choose the skipped/doubled-day rule (`esm_cal_rule`). The default matches
  tibetanbuddhistcalendar.org: skipped day → the day after; doubled day → the first.
- **"Auspicious days" is the term (D2).** Each day keeps its own name (Guru Rinpoche Day, Uposatha and so on).
- **The day-one preset is the Vajra Guru mantra (D3):** OM Aa HUNG BENDZA GURU PEMA SIDDHI HUNG (the second A
  smaller), and it can be edited.
- **Quick-add remembers the last amount (D4, changed).** The person chooses the + amount for each practice. A
  practice they haven't set yet uses the last + amount they chose (`esm_last_pace`), else 100. "Add a number" opens
  with the last number they added (`esm_last_add`).
- **Restricted texts (D5):** a password on the honour system. People email texts@dharmasoup.org (it forwards to
  Gareth's Gmail) to ask. Hidden until a text is added. No texts yet.
- **Share images (D6, changed):** a random drawn background each time the sheet opens. Under the preview, "Pick
  one that suits you" and the thumbnail strip are always on screen (checked at 375×667), with "Surprise me" for
  another random one.
- **Tap-count backgrounds (2026-11-05):** the picture button on the counting screen opens a picker with None,
  the six practice pictures, the 22 drawn patterns from the share images, and the person's own photo. Each practice
  keeps its own (`esm_sess_bg`), and there's a Faint / Medium / Clear strength (`esm_sess_bga`). The count sits on a
  soft disc so it stays readable on any background. The photo is shrunk to 900 px and kept on the phone
  (`esm_sess_photo`). It goes into backup files but not the five daily copies, to save space. The old on/off
  switch (`esm_sess_img`) is still the default for practices that haven't been set.
- **Logo (D7):** made in-house in the spirit of OM AH HUNG, not imitating Tashi Mannox. The current icon is a white
  ཨ in a five-coloured thigle.
- **Dharma Soup logo (2026-11-11), separate from the app icon.** Gareth's Samantabhadra-in-a-bowl logo (source:
  `design/logo/dharmasoup_logo_samantabhadraV5.html`). The app icon stays the ཨ thigle. Used in two places only:
  the home page (small round bowl beside "Dharma Soup" in the top bar; the full logo with the spoon above the
  heading, cream box removed and bowl centred, spoon to the right) and the app's Today page (small bowl to the
  right of the greeting). Images: `practice/soup-mark.png` (128 px, precached for offline) and
  `practice/soup-logo.png` (690 px), made from the source with `design/logo/export-pngs.js`.
- **Ko-fi (D8, changed):** a simple link (ko-fi.com/raccoonhands) with a little text on the app's costs and the
  hoped-for benefit to beings. The words are in `KOFI_WHY` and `KOFI_SHORT` in the app (About, Generosity, You)
  and in the home page footer.
- **Generosity page:** people the app's teaching rests on (Palpung, Simply Being, Lama Lena, Garchen Buddhist
  Institute, BSWA for Ajahn Brahm, Lotsawa House), then "This app" as its own card.
- **Sessions (D9):** leaving mid-session offers Resume or Start fresh on Today. There's a 5-second hold-to-reset and
  an option to hide the number.
- **Automatic backup (2026-11-09, opt-in).** The phone encrypts a copy once a day and stores it on our server
  (`/api/backup/*`, table `backups`); the server never sees the 16-character code or the key. The code is offered to
  the phone's password manager (iCloud Keychain / Google) and shown to write down. Restore with the code on a new
  phone. Turning it off deletes the online copy. Capped at 2,000 backups and ~1.4 MB each (photo dropped if too big);
  untouched for 400 days = deleted. Key `esm_cloud`; the code is never put in backup files. File backups still work.
- **Groups (2026-11-09).** Optional join password (6+ characters, per-device lockout after 5 tries, group-wide
  backstop of 50 tries an hour). Each phone gets a member key; every add is recorded. Organisers can remove an add,
  block a phone, cap the size of one add, change the password, invite co-organisers (one-time link) and close the
  group. Still no names or accounts. A blocked person can rejoin a group without a password by clearing their data.
- **Reminders (2026-11-09).** Sent from a cron every minute in batches of 15, longest-waiting first, max 3 per phone
  per run; a reminder can go out up to 2 hours late (bells never catch up). If it's more than 5 minutes late the
  notification says it came from a free server. Saving settings never fires an earlier reminder.
- **Phone safety (2026-11-09).** Storage-full warning, "Used this app before?" card on an empty app, an "Add to Home
  Screen" card for iPhone Safari, Save-to-Files / Drive hints, and a Send feedback button (feedback@dharmasoup.org)
  in About and You.

**In the app but no longer rules (C8, D10).** The prostrations-for-every-body note and the light Material 3 touches
stay as they are. They aren't protected, so later work can change or remove them freely.

---

## 6. To do

**Full redesign (asked for by Gareth on 2026-11-10; this un-drops E2).** Gareth finds the app messy and disjointed:
Settings, backup, About and practice "could be anywhere", Today is too long, the look is inconsistent and the
pop-ups feel clunky. He asked for a new structure and a new look, icons included, and said to set aside earlier
*design* decisions. The safety rules in section 2 still stand (data keys, `/ngondro`, push only when told, phone-size
testing), and so do the content rules in section 3.
- Decided 2026-11-10 after the mockup: four tabs (Today, Practise, Library, You); one colour (saffron) with
  Light / Dark / Automatic / High contrast only, the other themes go; the "Wanna practise?" countdown card goes;
  hair cutting and day details move to the Calendar page; Library gets a search over the texts; daily practice
  reminders must be easy to find (Today prompt, each practice page, You → Reminders).
- Spelling: "practice" everywhere in the app's own words, verb included (Gareth, 2026-11-10). Prayers, translations
  and quotes keep their source spelling.
- **Live since 2026-11-10 (main 1ca99a1, SW `dp-v10-24`), pushed at Gareth's request so he could check it.** The mockup is `design/mockup.html`. What changed in the app:
  - Tabs: Today, Practice, Library (was Texts + Learn; tab key is still `texts`), You (`you`). Old `#learn` links
    open Library → Learn.
  - Today: date and greeting, the day card (tap for the calendar), the practice shown on Today with Start counting
    and +, three shortcuts (Sit, Breathe, Count), this week, words for today, a "Set a daily reminder" row until one
    is set, and the backup nudge when due.
  - Practice: no fold-outs. Library: one search over prayer names and their words (ignores capitals and accents),
    Prayers / Learn / Listen, prayers by kind as chips.
  - Settings is gone as a pop-up. You has pages for Progress, Reminders, Backup, and Look and sound; the rest are
    rows there (calendar, tradition and goals, tour, About, Generosity, share, install, feedback, Ko-fi).
  - Themes: Light, Dark, Automatic, High contrast. A saved older theme falls back to the nearest (`setTheme`).
  - Gone: the "Wanna practise?" countdown, the fold-out sections, the seven extra themes, and the dead code found
    that day. (`feedEvents` looks unused but `tools/make-feed.html` calls it: keep.)
  - Tested in the local preview at 375×812 and 375×667, light and dark. Not tested on a real phone, with real
    saved data, or at desktop width before going live: Gareth is checking on his phone.

Live since 2026-11-09 (main 1cbf57b, SW `dp-v10-20`): Dharma Soup rename and dharmasoup.org, automatic backup,
group organiser tools, minute-by-minute reminders, phone-safety cards and feedback (section 5).

To check:
- **On a real iPhone:** does Safari offer to save the backup code to Passwords, and fill it in on restore?
- **Reminder runs:** look at Workers → Observability for "exceeded CPU" errors once more people use reminders. If
  they appear, lower `CAP` in `worker/index.js` to 8–10 or move to the $5 plan.
- **Before 2026-12-10:** move your own phones from slicedharma.com (Back up now, then restore with the code on
  dharmasoup.org).

Waiting on Gareth to choose:
1. **Wider causes for the Generosity page (C6).** Checked and working on 2026-11-05. Pick any to add:
   - SuttaCentral: free early Buddhist texts and translations (suttacentral.net/donate)
   - 84000: translating the Kangyur and Tengyur, free to read (84000.co/ways-to-support/overview)
   - Tibetan Nuns Project: education and support for Tibetan nuns in India (tnp.org/youcanhelp/donate/)
   - Tibet Relief Fund: Tibetan communities in exile, UK charity (tibetrelieffund.co.uk/donate)
   - Amaravati Buddhist Monastery: Thai Forest tradition, UK (amaravati.org/support/)
   - Plum Village: Thich Nhat Hanh's community (plumvillage.org/donate; at the moment this is a building appeal)

Later, to talk through first:
2. **Monthly funding goal (C6).** Once the month's app costs are met, the app says so and suggests giving to another
   cause instead, or something similar.
3. **Retreat list (E5).** Find a way to do this without a lot of manual work before restarting it.

---

## 7. Waiting on Gareth

- **Long-life prayers from James Low and Lama Rabsang (F1).** Gareth will send them.
- **Check the Vajra Guru wording and the prostration note with Lama Rabsang (F7).**
- **Google Search Console (F6).** This gets Google to list the new site. Steps:
  1. Gareth signs in at search.google.com/search-console with his Google account and adds a **Domain** property
     for `dharmasoup.org`.
  2. Google shows a TXT record. Claude adds it in Cloudflare DNS (or Gareth pastes it there).
  3. Click **Verify**, submit `https://dharmasoup.org/sitemap.xml`, and request indexing of the home page.
  This takes about 10 minutes. Only the sign-in has to be Gareth.

---

## 8. Paused

- **Locked texts (E1).** The gate is built (section 5, D5); no texts are being added for now.
- **Retreat list (E5).** See item 3 in section 6.
- **Translations of the app (E6).**

---

## 9. Dropped (don't bring back unless Gareth asks)

- ~~The big redesign (E2).~~ Back on since 2026-11-10: see section 6. The old Phase 6 mockup stays dropped
  (`docs/archive/prototype-2026-09.html`).
- Other schools' text packs (E3).
- More calendars, including Tsurphu (E4).
- Chasing permissions from Lama Lena and Simply Being (F2). The drafts are in `docs/archive/requests-2026-10.md`.
- Linking a specific Emerson College talk from the Three Aa (F3).
- Finding the refuge tree image source (F4).
- The "can't add my own practices to the calendar" report (F8). Dropped until further notice.
- These are no longer rules: "links must fit their purpose" (B6), looking for women teachers' words (B9), the
  separate copyright rules (B2–B5; section 3 replaces them), and protecting the prostrations note and the Material 3
  touches (C8, D10).

---

## 10. Other docs

- `docs/archive/PLAN-2026-10.md`: the old audit, phases and round notes. History only.
- `docs/archive/DECISIONS-REVIEW-2026-11-05.md`: Gareth's ticked review that this doc is built from.
- `docs/archive/AUDIT-2026-10.md`: the October "where things live" audit. History only; the redesign replaces it.
- `docs/link-audit.md`, `docs/calendar-research.md`, `docs/auspicious-days-draft.md`: background research, still
  useful for reference.
