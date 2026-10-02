# Dharma Practice: audit and project plan

Written 2026-10-02 for whoever picks this up next (most likely a fresh Claude chat in this project).
Read sections 0–3 before touching code. Section 4 is the plan, 5–7 are ideas and context.

---

## 0. Read this first (handoff rules)

**Who:** Gareth (mrmarks1@gmail.com) owns this. He is not a developer. He wants it simple for
"Buddhists who suck with tech", and he likes lean ("ponytail") solutions: no build step, no
dependencies, native web features first. Use they/them if you need a pronoun.

**His standing instruction:** *"Don't assume, do research, ask me for anything, tell me when you
aren't sure."* Content about the Dharma must be traceable to a source. Never invent quotes,
practices, dates or meanings.

**Where things are**

| What | Where |
|---|---|
| Repo (canonical: GitHub `mrmarks1-blip/DharmaPlusWebsites`) | `C:\Users\GarethLewis\Documents\Claude\Ngondro-webapp\V10 - BigUiUpdate` |
| Working branch | `v10-redesign`. `main` is the live site. |
| The app (one file, ~2,480 lines, CRLF line endings) | `ngondro/index.html` |
| Service worker / manifest / fonts | `ngondro/sw.js`, `ngondro/manifest.json`, `ngondro/fonts/` (self-hosted OFL fonts) |
| Landing page ("Sliced Dharma" home) | `index.html` |
| Printable booklet (design B, 12pp A4) | `print/build.py` → `print/booklet.html` → `ngondro/four-thoughts-refuge-prostrations.pdf` |
| Draft/working notes (not served) | `content/`, `design/`, `print/`, `docs/` (see `.assetsignore`) |
| Older versions (legacy, don't edit) | `../v7…v9` folders next to this repo |
| Claude memory for this project | `C:\Users\GarethLewis\.claude\projects\C--Users-GarethLewis-Documents-Claude-Ngondro-webapp\memory\` |

**Run locally:** the `v10` config in `.claude/launch.json` (python http.server on :8740). Open
`http://localhost:8740/ngondro/`. Node is **not** installed on Gareth's machine; Python is.

**Deploy:** pushing to `main` deploys in ~1 minute (Cloudflare Worker `dharma-plus-websites`, Git
build, static assets only, no `wrangler.jsonc` in the repo yet). Live at https://slicedharma.com and
https://www.slicedharma.com (both Custom Domains on the Worker). Deploy with
`git push origin v10-redesign:main` (fast-forward). **Only push when Gareth says so.**

**Every release:** bump `CACHE` in `ngondro/sw.js` (currently `dp-v10-4`) so installed phones update.
Anything in the repo is publicly served unless listed in `.assetsignore`.

**Rules that bite**
- Existing users' data must survive every change. All data is `localStorage` keys starting `esm_`
  (from East Side Mandala, the sangha that inspired the app). Never rename a key; add new ones.
- The app file is CRLF. When editing with scripts, keep CRLF (`newline=''` in Python).
- Quotes and texts must be openly licensed or public domain, with credit in About
  (Lotsawa House = CC BY-NC 4.0). Modern teachers' books are copyrighted: Gareth supplies quotes
  or gets permission. Lotsawa's Tilopa "Ganges Mahāmudrā" is all-rights-reserved: don't use it.
- Never crop the refuge tree image (`object-fit: contain`).
- The Three Aa guide is a summary of James Low's teaching (his transcript is copyright); keep it
  a summary and keep the link to simplybeing.co.uk.
- Test in the browser pane at phone size (375×812 and 375×667) before calling anything done.

---

## 1. Snapshot: what exists today (live at commit 59414e8)

**Architecture.** Vanilla JS single-page PWA. State lives in `ST`; `render()` rebuilds the screen
from template strings; clicks are routed by `data-act` attributes through one big `switch`.
Layers: a **tab page** (`PAGES`: today, practice, texts, learn), optionally an **overlay**
(`OVERLAYS`, full-screen: session, practice detail, prayer, calendar, journal, meditations, tree…)
and optionally a **sheet** (`SHEETS`, bottom sheet with × and drag-to-close). No router, no
history entries.

**Pages**
- **Today:** greeting + settings · quote card (swipe, 139 quotes, no counter) · first-run welcome ·
  "session in progress" (resume / start fresh) · day card (moon, Tibetan date in English and script,
  phase, hair-cutting advice) · today's observance or "Next special day" with a sentence and a
  Rigpa Wiki link · Your practice card (progress bar, Start session, +quick add, edit) · backup
  reminder · This week (practice diary: coloured rings per day, tap to tick, chime).
- **Practice:** "Count a session" tile · ngöndro list · other practices · add your own. Practice
  detail: counts, bead grid, quick add, edit total, finish date ⇄ pace. Session: tap anywhere,
  hide-number mode (ring changes colour), 5-second hold-to-reset, dedication at the end.
- **Texts:** daily prayers (Tibetan / phonetics / English), smoke offerings (Mipham's brief sang,
  Riwo Sangchö), the 37 Practices, the printable booklet PDF.
- **Learn:** refuge tree (97 figures, zoom, drawer with verified Rigpa Wiki / Wikipedia links),
  "The practices" explained, Tibetan calendar, About, Add to phone.
- **Meditation overlays:** Three Aa (after James Low, signed off), vajra breathing OM AH HUM
  (hold/release, Garchen Rinpoche; Gareth likes this one), the beautiful breath (Ajahn Brahm's
  stages), counting the breath, Nine-Round breathing; shared sitting timer + Web Audio bell.
- **Settings:** themes (9), text size, Tibetan on/off, sound, backup (share to self, restore,
  reminder interval).

**Calendar engine:** Phugpa Tibetan calendar (Svante Janson's maths; checked against the
`tibetan-date-calculator` library 2000–2060 and tibetanbuddhistcalendar.org), Meeus moon,
observances in `AUSP` (days 8, 10, 15, 25, 29, 30), skipped/doubled-day rules in `observedAusp()`,
hair-cutting table `HAIR_DATA`.

**Data model (`localStorage`)**

| Key | Holds |
|---|---|
| `esm_pr_data` | per-practice counter, pace, finish date, image |
| `esm_custom` / `esm_current` | user-added practices / the practice shown on Today |
| `esm_log` | `{date: total counted}` all practices |
| `esm_plog` | `{date: {practiceId: count}}` (use this for monthly charts) |
| `esm_journal` / `esm_activities` | diary ticks per day / the user's activities + colours |
| `esm_tap`, `esm_tap_hide`, `esm_sess_img` | session in progress, hide-number mode, backdrop |
| `esm_snapshots` | rolling daily safety snapshots |
| `esm_theme`, `esm_size`, `esm_tib`, `esm_whole`, `esm_sound` | display prefs |
| `esm_seen`, `esm_bb`, `esm_vj_mode`, `esm_a_form` | first-run done, meditation prefs |
| `esm_last_backup`, `esm_backup_every`, `esm_backup_snooze`, `esm_persist` | backup reminders |

---

## 2. Audit: problems found, with root causes

Ordered by how much they hurt users now.

| # | Problem | Root cause | Lean fix |
|---|---|---|---|
| A1 | **Android back button closes the app** | No history entries at all (`grep pushState` finds nothing except the `#install` cleanup). | In `render()` (the one place every layer goes through): when a sheet/overlay opens or the tab changes, `history.pushState`; one `popstate` listener closes the top layer (sheet → overlay → tab back to Today). Fix once there, not per screen. Test the Android back gesture too. |
| A2 | **Timers stop when you leave the practice** | `openMed()`/`closeMed()` call `sitStop()`; the timer only renders inside the overlay. It is already timestamp-based (`ST.sit.start`), so time isn't lost, just thrown away. | Don't stop on close. Persist `ST.sit` to localStorage, show a small "sitting · 12:40 left" pill in the app shell (tap → back to the practice). On return, if it ended while hidden, say so and buzz. Background bell = R&D (see 5.4). |
| A3 | **"Add to phone" buttons don't install** | The `install` action always opens an instruction sheet; only the sheet's second button calls `installPrompt.prompt()`. | If `installPrompt` exists, call `.prompt()` straight from the first tap. iPhone has no install API: keep the 3-step Share → Add to Home Screen guide (maybe with a picture). The landing page sits outside the app's scope, so its button should go to `/ngondro/?install=1`, which shows one big "Install" button (a prompt needs a user tap). |
| A4 | **Two different calendars** | `ovJournal()` (Gregorian month, diary rings) and `ovCalendar()` (Tibetan month, observances) were built separately; Today also splits the day card, observance card and week strip. | One calendar (Phase 1). |
| A5 | **Observance links are vague** ("Dakini day" → the Rigpa Wiki "Dakini" page) | `SPECIAL_WHY` points at general concept pages. Rigpa Wiki has no page for Dakini Day. | Write a short in-app "What is this day / what people practise" per observance (sourced), then link to *practice texts* (e.g. Lotsawa House topics: `/topics/tsok/`, `/topics/dharma-protectors/`, `/topics/medicine-buddha/`, `/topics/sojong/`). Then audit all ~96 links (Phase 0). |
| A6 | **Calendar rules may be wrong for some users** | We follow one rule set: a skipped day's event is kept the day **before**; a doubled day's on the **second**. tibetanbuddhistcalendar.org follows Men-Tsee-Khang: skipped → the day **after**; doubled → the **first**. Opposite on both. Also: we use **Phugpa**; Karma Kagyu traditionally uses the **Tsurphu** calendar, which sometimes differs. | Don't pick silently. Gareth is happy for the calendar to show several systems if each is right and labelled: *"According to the Tsurphu calendar, Dakini Day is on Tuesday."* Needs research + a decision (see 3). |
| A7 | **Major festivals and anniversaries missing** | `AUSP` only has the monthly days. No Losar, Chötrul Düchen (1st month 15), Saga Dawa Düchen (4th month 15), Chökhor Düchen (6th month 4), Lhabab Düchen (9th month 22), and no masters' anniversaries. | Add a dated table keyed by Tibetan month + day (the engine already gives both). Source every entry. |
| A8 | "Special day" wording | Gareth doesn't like it. | Rename everywhere (see 3). |
| A9 | Breath practices feel weak (beautiful breath, Nine-Round, counting, Three Aa) | Mostly text and taps; nothing works with eyes closed. | Phase 4: sound cues so you can close your eyes; mic for the Three Aa's "Aaa". |
| A10 | Today's "Your practice" is a single huge number (e.g. 3,240 of 111,111) | Shows lifetime totals only. | Phase 1: this month vs what's needed this month, from `esm_plog` + the finish date. |
| A11 | Looks like a Claude-made page | Cream + Fraunces serif + clay accent is the Anthropic house style. | Phase 6. |
| A12 | No calendar regression check | Calendar maths has no test; any edit could silently shift dates. | One `ngondro/tests.html` (not linked, ignored by `.assetsignore` or kept tiny) that asserts known dates (Losar 2025–2030, a few doubled/skipped days) against tibetanbuddhistcalendar.org. Open it in the browser; green or red. |
| A13 | One 2,480-line file | Fine without a build step, but most of it is data. | Optional: move `QUOTES`, `PRAYERS`, `FIGS` into `ngondro/data/*.js` loaded with plain `<script src>` (no bundler). Do it only when an edit gets painful. |
| A14 | Stale files | `design/prototype.html` is the old prototype; `content/three-aa-draft.md` is now signed off. | Leave or delete; they're not served. |
| A15 | Refuge tree image rights unknown | `ngondro/refuge-tree.jpg` is used in the app and on the PDF cover, but its source/licence isn't recorded anywhere. | Ask Gareth where it came from; credit or replace. |
| A16 | Accessibility not checked recently | Sheets have `role="dialog"`, but focus handling, reduced motion and screen-reader labels haven't been audited since the redesign. | Quick pass in Phase 0 (focus moves into a sheet and back out; everything works with `prefers-reduced-motion`). |

---

## 3. Decisions Gareth needs to make (blocking items marked ●)

**Decided 2026-10-02:** (1) Calendar: research properly, then show both systems where they disagree, each labelled; Gareth to ask Lama Rabsang which rules Palpung follows. (2) "Special day" → **Auspicious days**. (3) Notifications: calendar files (.ics) first; push decided later.

1. ● **Calendar systems.** Which is the default for Today (Phugpa or Tsurphu), and which skipped/doubled rule (Men-Tsee-Khang or the current one)? Proposal: a setting "My calendar: Phugpa (most schools) / Tsurphu (Karma Kagyu)", default chosen from the tradition picked at setup. Where systems disagree, show both, labelled. Ask a teacher (Lama Rabsang / Palpung) which their centre follows.
2. ● **A word for "special day".** Options: *Practice days* (plain, works for every school) · *Auspicious days* (the usual Tibetan English) · *Holy days* · *Dharma days* · *Observances*. Recommendation: **Practice days**, with each day's own name (Guru Rinpoche Day, Uposatha…) doing the rest.
3. ● **Notifications approach** (see 4, Phase 2). Start with calendar files (no server, works today), then add real push notifications, which need a small server piece on Cloudflare. OK to add that?
4. **Logo.** Tashi Mannox sells commercial licences for his OM AH HUM artworks and takes commissions ([The Three Doors of oṃ āḥ hūṃ](https://tashimannox.com/artwork/the-three-doors-of-o%E1%B9%83-a%E1%B8%A5-hu%E1%B9%83-tibetan-calligraphy/), [om ah hum](https://tashimannox.com/artwork/om-ah-hum/)). Recommendation: license or commission from him rather than imitate a living artist's style. Budget?
5. **Design direction** (Phase 6): pick from 3 explorations before the big restyle.
6. **Traditions in scope** for v1 of "broad appeal": Tibetan (all four schools + Bön?), Theravada, Zen/Chan, secular/none?
7. **Restricted texts:** honour-system gate vs encrypted texts for a teacher who asks (see Phase 7).
8. **Causes to feature** for generosity, and whether to set up Buy Me a Coffee (see Phase 5).
9. **Refuge tree image source** (A15).
10. **Day-one goal preset:** "1,000 Vajra Guru mantras (OM AH HUM VAJRA GURU PADMA SIDDHI HUM)" as the example in setup. Check that wording/target with a teacher.

---

## 4. The plan

Phases are in order of value and dependency. Each task ends when it works at phone size in the
browser and Gareth has seen it. Commit per task on `v10-redesign`; push to `main` only on his say-so.

### Phase 0 · Fix what's annoying now (small, safe)
- [x] **A1 back button** in `render()` + one `popstate` handler.
- [x] **A2 timers survive navigation**: persistent pill, localStorage (`esm_sit`), "ended while you were away". Background bell still R&D (5.4).
- [x] **A3 install buttons** prompt directly; landing page's `#install` link opens the sheet with one big Install button once the browser allows it; iPhone guide updated (⋯ menu, Chrome on iOS 16.4+).
- [ ] **A8 rename "special day"** once Gareth picks a word (search the app for "special").
- [ ] **A5 link audit.** List every external link (`grep -o -E "https?://[^'\"\` )<>]+" ngondro/index.html | sort -u` — 96 today, 58 Wikipedia, 19 Palpung UK, 2 Rigpa Wiki pages built per figure via `FIG_LINKS`, plus `SPECIAL_WHY`). For each: does it open, is it the page a user needs at that moment, is there a better one? Record the result in `docs/link-audit.md` (URL · where used · verdict · replacement). Prefer: our own short sourced text in the app, then a link to a *practice* (Lotsawa House text or topic), then encyclopaedia pages. Use the browser pane for Rigpa Wiki (curl gets a bot check). Treasury of Lives needs a login: don't log in.
- [ ] **A12 calendar check page.**
- [ ] **A16 accessibility pass.**

### Phase 1 · One calendar, a calmer Today
- [ ] **Unified calendar** (replace `ovJournal` + `ovCalendar` with one month view; keep both features):
  Gregorian month grid (familiar) with the Tibetan day number small in each cell, moon phase,
  observance dot(s), diary ring colours, and marks for reminders/appointments. Header shows the
  Tibetan month(s) the grid spans. Tap a day → one day sheet: observance(s) with meaning +
  practices + "according to which calendar", hair cutting, diary ticks, appointments, and actions
  (remind me · add to my phone's calendar · share · invite a friend). Keep the diary legend and CSV export.
- [ ] **Today, unified:** one calendar card (date, Tibetan date + script, moon, today's or the next
  practice day inline with its sentence, the week strip with diary rings, "Open calendar").
- [ ] **"Your practice" → progress.** Show the practices with recent progress as monthly bars:
  this month's count vs what's needed this month (from `esm_plog` and the finish date via
  `paceFromDate()`). Plain CSS/SVG, no chart library. One button: "Practise" → Practice page.
  Start/edit/change amount live on the Practice page. Ponytail: ship one chart style; add a pie/ring
  option later only if people ask.
- [ ] **Meditation timer** (Gareth, 2026-10-02): one plain "Meditation timer" card on **Today** and
  **Practice**, not tied to any meditation. Preset buttons (5 · 10 · 20 · 30 · 45 min) plus an editable
  time (a number field or −/+ steppers, remembers the last one used). Reuses the existing timer
  (`sitStart`/`esm_sit`, bell, the pill, "ended while you were away", diary minutes), so it's mostly UI.
  Gareth chose **all** of these (2026-10-02):
  - Start and end bell; screen stays awake; minutes go into the diary automatically.
  - **Settling-in time** (10–30 s before the first bell), **interval bells** (every N minutes),
    **open sitting** (counts up, no end), **eyes-closed screen** (dim and quiet; tap to see the time).
  - **Motivation and dedication:** an optional line before and after, following "good in the
    beginning, middle and end" (source it, e.g. Patrul Rinpoche's *Words of My Perfect Teacher*);
    off by default for schools that don't use it.
  - **Bell choice:** the current bell plus one or two more; a recorded bowl only if openly licensed.
  - **Named presets** ("Morning sit, 20 min, 2 interval bells").
  - **Minutes in progress:** days and minutes this week/month in the Phase 1 progress view.
- [ ] **Meditation streak, kindly done** (Gareth is OK with a streak, if it's plain and kind).
  A simple black-and-white strip of days that fills in as you sit, beside overall progress (total
  days, total minutes). A missed day never "breaks" or "loses" anything: it says e.g. *"4 days of
  meditation complete · 1 day since your last sit"* with a quote about beginning again.
  - **Quotes about continuing / beginning again:** research and add a set (tag them `cont` in
    `QUOTES` so they can be picked for this). Same licence rules as all quotes: Dhammapada and
    other public-domain or CC translations, Lotsawa House (CC BY-NC), permission for modern
    teachers. Gareth's example, "The best time to plant a tree was 20 years ago; the second best
    time is now", is usually called a Chinese proverb but its origin is unknown. Gareth is happy to
    use quotes like this: credit them gently and honestly, e.g. *"Proverb, origin unknown"* or
    *"Often attributed to …"*, never as a Buddhist saying. Don't invent attributions.
- [ ] **Kinds of meditation** on the Meditation timer area: short swipeable cards (like the quote
  card), each with what it is, its other names, and its styles; tap → fuller instructions and
  links. Start with:
  - **Vipassanā** (insight; Tib. *lhagthong*; e.g. Mahasi noting, Goenka body-sweeping, insight in
    Tibetan schools).
  - **Śamatha** (calm abiding; Tib. *shiné*; with an object such as the breath or an image, and
    without an object).
  - **Open sitting** (resting without a technique; *shikantaza*, "just sitting", in Sōtō Zen,
    which Gareth loves; other schools' names checked against a source before use).
  - **Open awareness** (Gareth's name for it; includes sky gazing). Covers resting in awareness,
    looking into the open sky, and the teaching "the mind is like the sky". Gareth: it's widely
    taught now, so present it openly, sourced, with the usual "a teacher can take you further".
  - **Different schools' and masters' explanations** of each kind, organised so people can go
    deeper if they want (e.g. Zen: Dōgen on shikantaza; Theravada: Ajahn Chah / Mahasi; Tibetan:
    Mingyur Rinpoche, James Low). Quiet by default: a short card on top, "More from other
    traditions" in `<details>` underneath. Never pushed at people. Licensing as for quotes:
    summarise in our words and link, quote only openly licensed text.
  - Each card links to one good wiki page (Rigpa Wiki / Wikipedia, checked in the link audit) and,
    where there is one, a **short, pointed James Low / Simply Being piece** on that exact topic.
- [ ] **Vajrasound** (vajrasound.com, if that's the one Gareth means: Buddhist chants and prayers
  recited in English, made to chant along with; also on Bandcamp). Link to it from Texts / prayers.
  Ask them before using any recordings in the app (they invite contact and submissions).
- [ ] **More Simply Being links overall:** go through simplybeing.co.uk and pick short articles or
  excerpts that answer one question each (not long retreat talks). Record them in
  `docs/link-audit.md` with where in the app each one belongs. Link only; don't copy text.
- [ ] **Practice page top tile** mirrors the session's hide-number look: the coloured sphere,
  "spiced up" (slow conic-gradient drift with CSS `@property`, respects reduced motion).
- [ ] **Festivals and anniversaries** (A7), each with its source, and the per-system labelling (A6).
- [ ] **About the Tibetan calendar**, rewritten (our words, not copied) to cover what
  tibetanbuddhistcalendar.org's About covers, plus more, in expandable `<details>` sections:
  Phugpa vs Tsurphu; how skipped/doubled days work and whose rules we follow; the Men-Tsee-Khang;
  credit to tibetanbuddhistcalendar.org and its open-source date library (it's theirs:
  `eszthoff/tibetan-date-calculator`) and to the Rigpa calendar that inspired it; why hair-cutting
  days exist (Tibetan astrological tradition, presented as tradition, sourced); elements and
  animals of the year.

### Phase 2 · Reminders and notifications (linked to the calendar)
Climb the ladder: calendar files first, push only for what calendar files can't do.
- [ ] **2a. Calendar files (no server).** Build `.ics` in the browser (a Blob; the format is plain text):
  - "Remind me" on any day → a one-off event with an alarm (`VALARM`), shared via the Web Share
    API (`navigator.share({files})`) or downloaded; plus an "Add to Google Calendar" link
    (`https://calendar.google.com/calendar/render?action=TEMPLATE&text=…&dates=…&details=…`).
  - **Practice with a friend:** same event with a short invite text, shared to WhatsApp/email.
    Afterwards the app's calendar asks "Did it happen?" and ticks the diary.
  - **Daily practice reminder:** a repeating event (`RRULE:FREQ=DAILY`) at the time they choose,
    with an alarm. Native reminder, works on iPhone without installing the app.
  - **Practice-days feed:** a static `ngondro/practice-days.ics` (next ~2 years), generated by a
    small script from the same calendar code; people *subscribe* (`webcal://slicedharma.com/…`) so
    it stays in their own calendar. Regenerate yearly. One feed per calendar system if 3.1 says so.
- [ ] **2b. Push notifications** (needs Gareth's OK: decision 3). For the two things a calendar file
  can't do: a **different quote each day** at the chosen time, and an **evening nudge only if
  nothing was practised today** (with a quote about perseverance; gentle, never guilt).
  - Turns the Worker from assets-only into assets + a tiny script: add `wrangler.jsonc` with
    `main`, `assets`, a Cron Trigger (every 15 min), and D1 (or KV) for subscriptions.
    **Careful:** today's deploy is auto-configured by Cloudflare; adding `wrangler.jsonc` changes
    the build. Try it on a preview branch first.
  - Store only: push endpoint + keys, time zone, chosen times, last date practised. No counts.
    The app pings `/api/done` when anything is logged so the nudge skips that day.
  - VAPID keys as Worker secrets. Use a Workers-compatible Web Push library built on WebCrypto
    (check which is maintained at the time; don't hand-roll RFC 8291 encryption).
  - iPhone: push only works once the app is on the Home Screen (iOS 16.4+). Say so in the opt-in.
  - Opt-in only, from Settings or setup; one tap to stop.
- [ ] **In-app fallback:** whatever happens, the Today page greets with the day's reminder.

### Phase 3 · First-run setup, goals and a short tour
- [ ] Setup (every step skippable, 4 screens max): welcome → **your tradition** (or "none / just
  exploring") → **what you'd like to use** (daily meditation · count a practice · daily words ·
  practice-day calendar) → optional **goal** with a finish date, preset example "1,000 Vajra Guru
  mantras" (check with a teacher, decision 10) → **reminders** opt-in (Phase 2).
- [ ] Short walkthrough (3 cards in a sheet, not coach marks): counting a session, changing the
  finish date and seeing the daily amount change, turning reminders on.
- [ ] Add the Vajra Guru mantra as a built-in practice (other schools: let setup offer the right
  preset, e.g. Metta phrases, Nembutsu, Chenrezig mani).

### Phase 4 · Meditations that work with eyes closed
- [ ] **Shared:** soft sound cues (pre-recorded or synthesised tones; Gareth or a teacher could record
  short spoken cues, with permission) so the screen can be ignored; Wake Lock already on.
- [ ] **Three Aa with the microphone:** detect the start and end of each sounded "Aaa" on the
  device (getUserMedia + an AnalyserNode volume threshold, no recording, nothing leaves the
  phone) and move on by itself; tap stays as the fallback. Explain the mic permission first.
- [ ] **Nine-Round:** audio cues for in/out/change nostril; pace follows the user (Gareth's rule:
  breath tools follow the breath, never impose a pace). Keep the full text.
- [ ] **Beautiful breath (Ajahn Brahm):** fewer words on screen, a stage reminder by sound,
  integrated sitting timer, "move on when…" signs on demand.
- [ ] **Counting the breath:** eyes-closed mode (tap anywhere, a soft click on 10), session summary.
- [ ] Vajra breathing: keep as is (Gareth likes it).

### Phase 5 · Sharing, milestones, generosity
- [ ] **Share a quote as an image:** draw on a `<canvas>` (1080×1350 post, 1080×1920 story) with the
  app's type and logo, then `navigator.share({files})`; download as a fallback. **Must** carry the
  credit line (author, translator, Lotsawa House, CC BY-NC) because the licence requires it.
  Ask Gareth for 3–5 screenshots of "Art of Buddha Dharma" posts he likes as the reference.
- [ ] **Share a practice day:** the observance's image card + a sourced sentence or quote.
- [ ] **Milestones, not badges:** private by default. Idea: the **Eight Auspicious Symbols** as
  eight milestones (first session, 7 days, 1,000, 10,000…), each moment ending in a dedication
  ("Dedicate this to all beings?"). Sharing is framed as an invitation to *rejoice* (rejoicing in
  others' virtue is itself a practice), never a leaderboard.
- [ ] **Invite a friend** (link + short text) and "practise together" (Phase 2a event).
- [ ] **Generosity page** ("Dana"): causes up front (Gareth to choose, decision 8; e.g. ROKPA, his
  centre, Tibetan monasteries/nunneries, local food banks), Buy Me a Coffee small at the bottom of
  About with an honest note of real costs (hosting is currently free on Cloudflare; check the IONOS invoice for the domain cost).
- [ ] Later (needs a server): **group accumulations** (a sangha counting toward one shared goal,
  e.g. 1,000,000 mani for a teacher's long life). Big hit with centres. Needs D1 + simple join codes.

### Phase 6 · Its own look (de-Anthropic it)
- [ ] Explore 3 directions on a design canvas (like the PDF round) before restyling. Starting points:
  1. **Mineral pigments**: deep lapis or warm black ground, malachite, cinnabar, gold leaf (the
     colours of thangka paint), very little cream.
  2. **Pecha / woodblock**: long horizontal cards like loose-leaf texts, printed-paper texture,
     brushed rules, stamp-like accents.
  3. **Himalayan daylight**: snow white and sky blue, crisp, airy, high contrast.
  Avoid what Gareth already rejected: saffron banners, the five-colour prayer-flag motif, red borders.
- [ ] Keep **Atkinson Hyperlegible** for body text (he likes it, and it's an accessibility choice);
  replace Fraunces for headings with something with its own voice.
- [ ] Fewer, better themes: light, dark, high contrast, plus one or two colourways. Others hidden.
- [ ] **Logo:** OM AH HUM in a thigle (bindu). Licensed/commissioned from Tashi Mannox (decision 4),
  then: app icon (maskable 512), favicon, landing page, share-image watermark.
- [ ] Use `oklch()` colours and `light-dark()` so each theme is a handful of variables.

### Phase 7 · For every Buddhist, not one school
Gareth: "I would like any school to be able to use and get value from this, even just tracking
meditation daily and reading the quotes."
- [ ] **The core is school-neutral already:** sitting timer, diary, counter for any mantra, daily words.
  Make sure nothing on Today assumes ngöndro (the "Your practice" card adapts to what they track).
- [ ] **Tradition setting** (from setup) changes only: which text packs are open by default, which
  calendar days show, which practices are suggested, and quote weighting (quotes get a `tr` tag).
- [ ] **Texts grouped in collapsible sections** with native `<details>` (accessible, no JS): Everyone ·
  Tibetan (Kagyu, Nyingma, Gelug, Sakya) · Theravada · Zen/Chan. Theravada and Zen packs need
  licensed sources (e.g. public-domain translations; dhammatalks.org is CC BY-NC; check each).
- [ ] **Calendars per tradition:** Theravada **uposatha** days come almost free from the existing moon
  code (new, full and quarter moons); Vesak's date differs by country, so label it; Zen/Japanese
  observances (Bodhi Day 8 Dec, Nirvana Day 15 Feb, Obon) are Gregorian. Label each with whose
  calendar it is (Gareth's suggestion).
- [ ] **Restricted texts** (decision 7). Honest options:
  - *Honour system (recommended default):* "Traditionally this practice is done after receiving
    [lung / empowerment] from a qualified teacher. Have you received it?" Remember the answer.
    This is how many publishers handle restricted texts, and it's truthful.
  - *Encrypted texts, only when a teacher asks:* the text is stored encrypted (AES-GCM, key from a
    passphrase via PBKDF2, WebCrypto, ~40 lines); the teacher gives students the passphrase.
    Real protection without accounts.
  - *Not this:* a plain password check in JavaScript. The text would still sit readable in the page
    source, so it only looks like protection.
- [ ] Later: translations (Polish first, a nod to the Lublin sangha; then Spanish/German/French).
  Needs the text strings pulled into one table; a big job, so only when there's demand.

---

## 5. New web tech worth using (checked October 2026; re-check support before relying on it)

| Tech | Use here | Notes |
|---|---|---|
| History API (`pushState`/`popstate`) | A1 back button | Works everywhere; simplest fix. |
| `<dialog>` + `closedby="any"` | Sheets as real dialogs: native focus trap, Esc/back closes | Chromium has CloseWatcher, so Android back closes dialogs natively. Good long-term replacement for hand-made sheets. |
| View Transitions (same-document) | Smooth page/sheet/calendar changes without animation code | Chrome, Safari 18+, recent Firefox. Fall back to no animation. |
| `@starting-style`, `interpolate-size`, CSS `@property` | Enter animations, animating to `height:auto`, the animated colour sphere | Progressive enhancement. |
| `oklch()`, `light-dark()`, `color-mix()` | Phase 6 themes in a few variables | Widely supported. |
| Web Install API (`navigator.install()`, `<install>` element) | A real install button, even from the landing page | Experimental: origin trials in Chrome/Edge 143–153; expected to ship around Chrome 156 ([Chrome blog](https://developer.chrome.com/blog/install-element-ot), [InfoQ](https://www.infoq.com/news/2026/03/web-install-api-origin-trial/)). Feature-detect and fall back to `beforeinstallprompt`. |
| Web Push + Cron Triggers on Cloudflare | Phase 2b | iOS needs Home Screen install. |
| Badging API (`navigator.setAppBadge`) | A gentle dot on the icon when today's practice isn't logged | Installed PWAs; iOS 16.4+ and desktop. Only useful with push. |
| Web Share Level 2 (files) | Quote images, `.ics` files, backups | Already used for backups. |
| `<canvas>` / OffscreenCanvas | Share images rendered on the phone | No server, no library. |
| getUserMedia + Web Audio AnalyserNode | Three Aa voice detection | All on-device. |
| Media Session API + `<audio>` | Possible background bell (A2) | R&D: a timer that ends with a bell while the screen is off needs audio playing; test on Android and iPhone before promising it. |
| Screen Wake Lock | Already used | Keep. |
| Temporal API | Time-zone-safe reminders | Shipping in some browsers; check support; current `Date` code works. |
| Passkeys (WebAuthn) + end-to-end encrypted sync | Optional sync between phones, replacing manual backup for those who want it | Later phase; adds a server and a privacy promise. Only if people ask. |
| Playwright in GitHub Actions | A few smoke tests in the cloud (Gareth has no Node locally) | Optional; `tests.html` (A12) covers the calendar for free. |

---

## 6. From a Buddhist and spiritual point of view (things to keep in mind)

- **Streaks and pressure.** Guilt notifications cut against the practice. Gareth is fine with a plain
  streak if a missed day is never framed as a loss ("4 days complete · 1 day since your last sit" + a
  quote about beginning again). Evening nudges should encourage
  (Patrul's "Don't be a fool: for once, just sit tight" tone, Dilgo Khyentse's "never lose heart").
- **Numbers vs. quality.** The 111,111 is traditional, but teachers stress motivation over counting.
  The progress view should also show "sessions" and "days practised", not only totals. Every session
  already ends with dedication: keep it central.
- **Transmission (lung) and empowerment.** Already noted on the PDF. Extend to texts and practices
  that need it (Phase 7). The app supports a teacher; it doesn't replace one. A "my teacher /
  my centre" field in Settings could hold a contact and the centre's calendar link.
- **Prostrations for every body.** Not everyone can do full prostrations (age, injury, disability).
  Teachers give alternatives (half prostrations, bowing, mental prostrations). Add a short sourced note
  and "ask your teacher".
- **Respect for texts and images.** Traditional etiquette: don't put Dharma texts on the floor or step
  over them; when printed texts are worn out, burn them rather than bin them. Add a line to the PDF and
  Texts page. Share images: no deity images used as decoration; always credit the artist.
- **Sacred syllables on a logo.** OM AH HUM is fine for an app icon. Keep it off merchandise that sits
  low or gets walked on (socks, doormats).
- **Hair-cutting and astrology.** Present as living tradition with its sources, not as superstition or
  as fact.
- **Calendar accuracy is a matter of trust.** People plan retreats and offerings around these days.
  Label which calendar and whose rules (A6); fix mistakes fast.
- **Death and grief.** People come to practice around a death. A sensitive optional feature: the 49
  days (bardo) after a death, with the weekly days marked and suitable prayers (sourced: e.g. Lotsawa
  House has many). Also Phowa is already a practice in the list.
- **Missing big days:** the four Düchen, Losar, masters' anniversaries (A7). Practices tied to them:
  merit-multiplying days, animal liberation (tsethar) on Saga Dawa, fasting practice (nyungné) and the
  Mahayana precepts on full moons (sojong is linked already).
- **Generosity done right.** Dana should feel free and joyful, never a nag. Causes first, Gareth last.
  Be transparent about costs.
- **Privacy is part of non-harm.** Practice data is intimate. No analytics or trackers, ever; the push
  server stores the minimum. Say this plainly in About.
- **Mental wellbeing.** Intensive breath practice can bring up difficult experiences for some people.
  A gentle note on breath practices ("if anything feels overwhelming, stop and speak to a teacher").
- **Inclusive teachers in the quotes.** Licensed sources skew to historic male masters. Look for openly
  licensed words by women masters (Machik Labdrön is in; search Lotsawa House for others) and ask
  permission from living teachers (Tenzin Palmo, Khandro Rinpoche, Pema Chödrön).

---

## 7. Other suggestions

- **The name.** Gareth may rebrand from "Sliced Dharma". The name lives in two places only (root
  `index.html` title/wordmark and `APP_NAME`/`BRAND` in the app). Domain and manifest would follow.
- **Retreats and teachings near you (later, Gareth 2026-10-02):** a trusted list of retreat
  centres and Dharma centres, chosen carefully (lineage, safeguarding record, recommended by
  teachers/sangha; Gareth decides who's on it). Then show upcoming retreats and teachings from them
  in one place, because many only post on Facebook or hard-to-find sites. Ways to get the dates,
  simplest first: (1) centres that publish an iCal/Google Calendar feed: read it directly
  (needs a small server piece to fetch and cache, since browsers block cross-site calendar reads);
  (2) centres with an events page: a scheduled fetch that reads structured data (schema.org
  `Event`) if they have it; (3) everyone else, incl. Facebook-only: a simple form or email where
  centres (or trusted volunteers) submit events, checked before they appear. Facebook's API
  has restricted reading other pages' events since 2018 (needs Meta app review; check current
  rules before relying on it), and scraping breaks its terms: don't. Ask centres'
  permission before listing them. Filters: tradition, country, online/in person, date.
- **Teacher/centre mode (later):** a centre shares a link that preloads its practices, calendar
  extras and an accumulation goal. Spreads the app sangha by sangha.
- **"Share the app" card** in Settings and after milestones: one tap shares the link with a line of
  text. No referral counts.
- **Offline-first check:** after Phase 2b, make sure the app still works fully offline (push is extra).
- **Keep the memory notes current** (`memory/` above) when decisions in section 3 are made.

---

## Sources checked for this plan
- tibetanbuddhistcalendar.org/about (Phugpa variant, Men-Tsee-Khang rules, Rigpa calendar, credits).
- Rigpa Wiki search: no "Dakini Day" page. Lotsawa House topics: tsok, dharma-protectors,
  medicine-buddha, sojong.
- Tashi Mannox: licences and commissions available on his artwork pages.
- Web Install API status: Chrome blog and InfoQ (links in section 5).
