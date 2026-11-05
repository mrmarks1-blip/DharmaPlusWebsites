# Decisions review (5 November 2026)

For each decision, tick **one** box and add a note if you like:

- **Keep**: still applies as written.
- **Change**: still applies, but differently. Say how in the note.
- **Drop**: no longer applies.

To tick a box, change `[ ]` to `[x]`. Leave a note blank if there's nothing to add. You can also add new decisions in the last section.

When you're done, tell Claude. Claude will read this file, write a fresh working doc from your answers and retire the old decision lists.

---

## A. How the app is built and shipped

### A1. Lean and simple

One HTML file, no build step, no dependencies. Native web features first. Aimed at "Buddhists who suck with tech".

- [ ] Keep
- [x] Change
- [ ] Drop

Notes: need to have the end result easy for non techy people. We can have more things if it justifies it

### A2. GitHub `main` is the live site

Work happens on the `v10-redesign` branch in the V10 folder. The v5–v9, LiveSite and backup folders are old copies and stay untouched.

- [x] Keep
- [ ] Change
- [ ] Drop

Notes:

### A3. Only push to `main` when you say so

A push goes live on slicedharma.com in about a minute.

- [x] Keep
- [ ] Change
- [ ] Drop

Notes:

### A4. Every release bumps the service worker version

This makes installed phones update. The next one is `dp-v10-18`.

- [x] Keep
- [ ] Change
- [ ] Drop

Notes:

### A5. The app lives at `/practice`; `/ngondro` is a permanent alias

`/ngondro` isn't a redirect, so phones that installed the old address keep their offline copy and reminders. It is never removed.

- [x] Keep
- [ ] Change
- [ ] Drop

Notes:

### A6. Existing users' data must survive every change

Saved data uses keys starting `esm_` (after East Side Mandala). Never rename one; only add new ones.

- [x] Keep
- [ ] Change
- [ ] Drop

Notes:

### A7. Keep the brand name easy to swap

You're not sold on "Sliced Dharma".

- [x]  Keep
- [ ] Change
- [ ] Drop

Notes:

### A8. Test at phone size before calling anything done

375×812 and 375×667, in the browser pane.

- [x] Keep
- [ ] Change
- [ ] Drop

Notes:

### A9. Don't assume: research, ask, and say when unsure

Your standing instruction to Claude.

- [x] Keep
- [ ] Change
- [ ] Drop

Notes:

---

## B. Content and sources

### B1. Everything about the Dharma must be traceable to a source

No invented quotes, practices, dates or meanings.

- [x] Keep
- [ ] Change
- [ ] Drop

Notes:

### B2. Only openly licensed or public-domain quotes and texts

Credit goes in About. Lotsawa House is CC BY-NC, so the translator is named, including on share images.

- [ ] Keep
- [ ] Change
- [x] Drop

Notes:

### B3. Modern teachers' words need you to supply them or get permission

Examples: Pema Chödrön, Trungpa, Mingyur, the Dalai Lama, James Low, C.R. Lama, Lama Lena. The pending requests are in `docs/requests.md`.

- [ ] Keep
- [ ] Change
- [x] Drop

Notes:

### B4. Texts we don't use

Lotsawa House's Tilopa "Ganges Mahāmudrā" (all rights reserved) and the Testaments of the Buddhas (restricted).

- [ ] Keep
- [ ] Change
- [x] Drop

Notes:

### B5. The Three Aa stays a summary of James Low's teaching

His transcript is copyright, so we paraphrase and link to simplybeing.co.uk.

- [ ] Keep
- [ ] Change
- [x] Drop

Notes:

### B6. Links must fit their purpose

A link has to answer what the person wants to know at that moment. If no single page does, we write sourced content in the app.

- [ ] Keep
- [ ] Change
- [x] Drop

Notes:

### B7. Never crop the refuge tree image

Applies in the app and the PDF booklet.

- [x] Keep
- [ ] Change
- [ ] Drop

Notes:

### B8. Keep both copies of the Seven-Line Prayer on Texts

- [x] Keep
- [ ] Change
- [ ] Drop

Notes:

### B9. Look for women teachers' words

Openly licensed words by women masters (Machik Labdrön is in). Ask permission from living teachers such as Tenzin Palmo, Khandro Rinpoche and Pema Chödrön.

- [ ] Keep
- [ ] Change
- [x] Drop

Notes:

### B10. Hair cutting and astrology are presented as living tradition

They're shown with sources, not as superstition or as fact.

- [x] Keep
- [ ] Change
- [ ] Drop

Notes:

---

## C. Tone and values

### C1. Broad appeal across all Buddhist schools

Include anything that feels right; exclude nothing on purpose.

- [x] Keep
- [ ] Change
- [ ] Drop

Notes:

### C2. No guilt

A missed day is never framed as a loss. Nudges encourage. A plain streak is fine.

- [x] Keep
- [ ] Change
- [ ] Drop

Notes:

### C3. Breath tools follow your breath and never set a pace

- [x] Keep
- [ ] Change
- [ ] Drop

Notes:

### C4. Reminders say "Time for practice" or your own label

Not the practice name. The message is a random encouraging quote, and a tap opens that practice.

- [x] Keep
- [ ] Change
- [ ] Drop

Notes:

### C5. No analytics or trackers, ever

This is also why Ko-fi is a plain link rather than its floating widget. The push server stores the minimum.

- [ ] Keep
- [x] Change
- [ ] Drop

Notes:some are fine as long as they really are for the purposes of improvement of the app. nothing is intrusive or creepy at all, everything needs a reason and easily explainable to the user with the reason

### C6. Generosity: good causes first, you last, costs shown openly

Dana should feel free and joyful, never a nag.

- [ ] Keep
- [x] Change
- [ ] Drop

Notes: the app will have some costs. we can have generosity and a variety of to be researched causes including funding for the app - an idea for later is a monthly funding goal which once hit tells the user to donate to something else or something similar which needs to be workshopped.

### C7. Milestones are private and use everyday icons

Praying hands, sitter, sprout, tree, sun, hearts, mountain. Not the Eight Auspicious Symbols. Each ends with "Dedicate it to all beings" or "Rejoice with a friend".

- [x] Keep
- [ ] Change
- [ ] Drop

Notes:

### C8. Prostrations for every body

A sourced note on alternatives, plus "ask your teacher".

- [ ] Keep
- [ ] Change
- [x] Drop

Notes:

### C9. The app supports a teacher; it doesn't replace one

Transmission (lung) and empowerment are mentioned where a practice or text needs them.

- [x] Keep
- [ ] Change
- [ ] Drop

Notes:

### C10. Numbers matter less than motivation

Progress shows sessions and days practised, not only totals. Every session ends with dedication.

- [x] Keep
- [ ] Change
- [ ] Drop

Notes: 

---

## D. Feature choices already settled

### D1. Calendar: people choose the skipped/doubled-day rule

The default matches tibetanbuddhistcalendar.org (skipped day → the day after; doubled day → the first).

- [x] Keep
- [ ] Change
- [ ] Drop

Notes:

### D2. "Auspicious days" is the term

Each day keeps its own name (Guru Rinpoche Day, Uposatha and so on).

- [x] Keep
- [ ] Change
- [ ] Drop

Notes:

### D3. Day-one preset is the Vajra Guru mantra

OM Aa HUNG BENDZA GURU PEMA SIDDHI HUNG (the second A smaller), and it can be edited.

- [x] Keep
- [ ] Change
- [ ] Drop

Notes:

### D4. Quick-add defaults to 100

A 108 mala counts as 100. The amount can be edited.

- [ ] Keep
- [ ] Change
- [x] Drop

Notes: allow the user to choose the amount, have the amount stay the same as the previous amount entered

### D5. Restricted texts sit behind a password on the honour system

People email texts@slicedharma.com (forwards to your Gmail) to ask. It stays hidden until you add a text. No texts yet.

- [x] Keep
- [ ] Change
- [ ] Drop

Notes:

### D6. Share images default to the "Brocade" style

"Plain" is kept as an option.

- [ ] Keep
- [x] Change
- [ ] Drop

Notes: allow it to be random, always ensure the user is prompted via text or ideally ui to pick one which suits the text / them / that moment

### D7. Logo is made in-house in the spirit of OM AH HUNG

It doesn't imitate Tashi Mannox. The current icon is a white ཨ in a five-coloured thigle.

- [x] Keep
- [ ] Change
- [ ] Drop

Notes:

### D8. Ko-fi (raccoonhands) as a plain link

It's in About, Settings and the home page footer.

- [ ] Keep
- [x] Change
- [ ] Drop

Notes: A simple link is fine, it can have a small amount of text explaining the costs and hopeful benefit to beings by being able to create more dharma projects.

### D9. Leaving mid-session offers Resume or Start fresh on Today

The session also has a 5-second hold-to-reset and an option to hide the number.

- [x] Keep
- [ ] Change
- [ ] Drop

Notes:

### D10. Material 3 touches stay light

Tonal cards (borders kept in the high-contrast, neon, neuro and night themes), one press state, a nav pill on phones only, and soft buttons.

- [ ] Keep
- [ ] Change
- [x] Drop

Notes:

---

## E. Paused

Tick **Still paused**, **Restart**, or **Drop for good**.

### E1. Locked texts

- [x] Still paused
- [ ] Restart
- [ ] Drop for good

Notes:

### E2. The big redesign (Phase 6 look and mockups)

- [ ] Still paused
- [ ] Restart
- [x] Drop for good

Notes:

### E3. Other schools' text packs

- [ ] Still paused
- [ ] Restart
- [x] Drop for good

Notes:

### E4. More calendars, including Tsurphu

- [ ] Still paused
- [ ] Restart
- [x] Drop for good

Notes:

### E5. Retreat list

- [x] Still paused
- [ ] Restart
- [ ] Drop for good

Notes: I am unsure how we can pull this without a load of manual work

### E6. Translations of the app

- [x] Still paused
- [ ] Restart
- [ ] Drop for good

Notes:

---

## F. Waiting on you

Tick **Still to do**, **Done**, or **No longer needed**.

### F1. Long-life prayers from James Low and Lama Rabsang

- [x] Still to do
- [ ] Done
- [ ] No longer needed

Notes:

### F2. Permission replies (Lama Lena; Simply Being for the C.R. Lama prayer, the Khordong refuge tree and James Low quotes)

- [ ] Still to do
- [ ] Done
- [x] No longer needed

Notes:

### F3. Which Emerson College talk (year and session) to link from the Three Aa

- [ ] Still to do
- [ ] Done
- [x] No longer needed

Notes:

### F4. Refuge tree image source

- [ ] Still to do
- [ ] Done
- [x] No longer needed

Notes:

### F5. Causes for the Generosity page

- [x] Still to do
- [ ] Done
- [ ] No longer needed

Notes: add the donation page for james low / simply being and the palpung wales sites

### F6. Google Search Console setup (Claude can add the DNS record)

- [x] Still to do
- [ ] Done
- [ ] No longer needed

Notes:what is needed with this?

### F7. Check the prostration note and the Vajra Guru wording with Lama Rabsang

- [x] Still to do
- [ ] Done
- [ ] No longer needed

Notes:

### F8. "Can't add my own practices to the calendar": exact steps to reproduce

- [ ] Still to do
- [ ] Done
- [x] No longer needed

Notes:not sure about this, we will drop until further notice

---

## G. New decisions

Add anything that isn't above.

-
