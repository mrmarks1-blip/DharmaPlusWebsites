# Link audit

Done 2026-10-03 (Phase 0, A5). Not served (`docs/` is in `.assetsignore`).

## The test

Gareth's rule: a link must be **fit for purpose**, not just working. Ask *"what does someone want to know
at this moment, and does this page answer it?"* If no single page out there answers it, **keep people in
the app** and write it ourselves, sourced, then link out only to the thing they can *do* (a practice text)
or to the source for people who want more.

Example: the calendar says "Ḍākinī Day" and links to Rigpa Wiki's *Dakini* page, a general definition of
ḍākinīs. Someone tapping it wants: why is there a Ḍākinī Day, what's the thinking behind it, what do
people practise. That page answers none of it.

## Summary

| Group | Links | Do they open? | Fit for purpose? | Action |
|---|---|---|---|---|
| Auspicious days (Today + calendar) | 6 (Rigpa Wiki) | Yes | **No.** All point at general concept pages | Write our own "About this day" in the app (below) |
| Refuge-tree figures: Wikipedia | 64 | Yes, all; no broken redirects or disambiguation pages | Mostly yes ("who is this?") | Keep |
| Refuge-tree figures: Rigpa Wiki | 70 | Yes, all | Mostly yes; **13 are 2–3 line stubs** that add nothing to our own bio | Drop the stubs where Wikipedia has a real article (list below) |
| Unused figure links (`wiki:` field on `FIGS`) | 58 | n/a | Never shown anywhere | **Removed** (FIG_LINKS is the checked list) |
| Practice texts (Palpung PDFs) | 15 | Yes, all 15 PDFs download | Yes: the text itself | Keep |
| Meditation "about" links | 3 | Yes (Simply Being link had moved) | Mixed (below) | **Fixed** the moved link; see notes |
| Calendar "Full calendar" | 1 | Yes | Yes | Keep |
| About / credits | 14 | Yes, all | Yes: they are credits | Keep |

206 distinct links checked (251 uses). Wikipedia checked with its API; Rigpa Wiki read page by page in a
browser (it blocks scripts and rate-limits); everything else fetched directly.

## 1. Auspicious days: build it in the app

No single page covers what Gareth wants (why the day exists, the thinking behind it, what people practise)
for every monthly day, in plain English, for every school. What exists is scattered and sometimes
inconsistent: e.g. one monastery's page puts Chökhor Düchen in the 8th month where most calendars have the
6th month, 4th day; teachers quote different "merit multiplied" figures (100 million, 300 million…). So:

**In-app "About this day" sheet** (tap the day on Today or in the calendar), same shape for every day:
1. **What it is**: one or two plain sentences.
2. **Why this day**: the reason, attributed ("Gönpo Tseten Rinpoche explains…", "Lama Zopa Rinpoche,
   quoting the Vinaya, says…"). Never unattributed claims.
3. **What people do**: for everyone (prayers, offerings, kindness, the Seven-Line Prayer, dedicating
   merit), then for those who have the practice (e.g. tsok "if you have received the empowerment").
4. **Practise / read more**: links to *practice texts* (Lotsawa House topics) and the source text.
5. Which calendar/rule placed it on this date (ties in with A6).

Sources found so far:

| Day | Best sources found | Notes |
|---|---|---|
| 10th · Guru Rinpoche Day | Gönpo Tseten Rinpoche, *Explanation of the Tenth Day: A Bouquet of Uḍumbara Flowers*, tr. Stefan Mang 2018, Lotsawa House, CC BY-NC ([link](https://www.lotsawahouse.org/tibetan-masters/gonpo-tseten-rinpoche/bouquet-of-udumbara-flowers)) | Guru Rinpoche's birth on the 10th of the Monkey month and his promise to come on every tenth day ("On every tenth day I'll come"); recommended: feast offering, prayers with devotion, Seven-Line Prayer, prostrations, circumambulation. Practice links: Lotsawa topics `guru-rinpoche-prayers`, `tsok`. |
| 25th · Ḍākinī Day | Same text: cites the Cakrasaṃvara tantra that ḍākinīs gather in the places of practitioners by day on the 10th and by night on the 25th (the "tenth of the waning moon"); and inwardly the channels, winds and essences gather. | So the 25th is the waning-moon counterpart of the 10th. Practice: tsok (for those with the empowerment), ḍākinī practices, prayers. Lotsawa topics `tsok`, `dakini-treasury`. Practices differ by centre: e.g. patrulrinpoche.net's centre does Rigdzin Düpa on the 10th and Yumka Dechen Gyalmo on the 25th. Check what each school does before generalising. |
| 8th · Medicine Buddha | Rigpa Wiki *Buddha of Medicine* is fine for "who"; for "why the 8th" still need a source | Lotsawa topic `medicine-buddha` for the practice. Jigme Lingpa recommends the Mahāyāna precepts on the 8th, 15th and 30th (source to confirm on Lotsawa House). |
| 15th · Full moon (Amitābha) | Rigpa Wiki *Sojong* (fit for the vows); Lama Zopa Rinpoche, *Practices for the Four Special Days* (Lama Yeshe Wisdom Archive, © LYWA: link only) for merit multiplied | Need a source tying the 15th to Amitābha. Practice: Lotsawa `amitabha`, `sukhavati-aspiration`, `sojong`. |
| 29th · Dharmapāla day | Rigpa Wiki *Dharma Protectors* (who), still need "why the 29th" | Practice: Lotsawa `dharma-protectors`, `sang-offering` (the app already has Mipham's brief sang and Riwo Sangchö). |
| 30th · New moon | Rigpa Wiki *Sojong* (fit) | Practice: Lotsawa `sojong`, `vajrasattva`, `confession`. |

Next step: draft all six sheets from these sources, show Gareth, then build. Then do the same for the
festivals (A7) when they're added.

## 2. Refuge tree

The drawer already shows our own short bio, role and a teaching. A link is only worth showing if it gives
**more**. All 134 links work. Rigpa Wiki pages that are only 2–3 lines (under ~400 characters of text) and
so add nothing:

| Figure | Rigpa Wiki stub | Wikipedia also linked? | Proposal |
|---|---|---|---|
| Rolpé Dorje (4th Karmapa) | yes | yes | drop Rigpa Wiki |
| Changchub Dorje (12th Karmapa) | yes | yes | drop Rigpa Wiki |
| Yeshe Dorje (11th Karmapa) | yes | yes | drop Rigpa Wiki |
| Mikyö Dorje (8th Karmapa) | yes | yes | drop Rigpa Wiki |
| Vajradhara (×2) | yes | yes | drop Rigpa Wiki |
| Hevajra | yes | yes | drop Rigpa Wiki |
| Guhyasamāja | yes | yes (the tantra) | drop Rigpa Wiki |
| Mahāmāyā | yes | yes (the tantra) | drop Rigpa Wiki |
| Bernakchen, Six-arm Mahākāla | yes | yes (general *Mahakala*) | keep both: the stub names the specific form, Wikipedia gives the depth |
| Zhang Tsalpa (Tsalpa Kagyü) | yes | yes | drop Rigpa Wiki |
| Yungtön Dorje Pal | yes | **no** | keep for now; candidate for our own fuller bio |
| Tseringma | yes | **no** | keep for now; candidate for our own fuller bio |

Other notes:
- Deities Chakrasamvara, Guhyasamāja and Mahāmāyā link to Wikipedia pages about the *tantra* (Wikipedia
  has no separate deity page). Acceptable; the label could say "The … Tantra".
- Wikipedia's *Mahakala* covers the Hindu and Buddhist deity together: fine as "more".
- Treasury of Lives would be the better source for many lineage masters (full biographies). The plan
  noted it may need a login; check before relying on it.

## 3. Meditation "About" links

| Practice | Link | Verdict |
|---|---|---|
| Three Aa | James Low, Eifel retreat Oct 2019 "The Happy Twins" (audio), Simply Being | Correct **source**, but it's a whole retreat recording, not a pointed answer. **Fixed**: it had moved to `…/audio-recordings/year/audio2019/james-low-germany-eifel-2019-october-the-happy-twins/`. Label it "Source: James Low's 2019 retreat (audio)" and look for a short Simply Being piece (plan task). |
| Vajra breathing | Garchen Rinpoche, *Vajra Recitation*, Drikung Dharma Surya (2014) | Fit: the teacher's own instructions. Technical in places (channels, winds). Notice on the page: "© 2007 The Gar Chöding Trust. All rights reserved. It is free for verbatim reproduction and distribution", so we may be able to include it **verbatim** in the app with credit (confirm with Gareth). |
| Beautiful breath | Ajahn Brahm, *The Basic Method of Meditation* (free book, BSWA) | Fit: the book itself. |

## 4. Practice texts, calendar, credits

- 15 Palpung PDFs (prayer book, Chenrezig, Medicine Buddha, Konchog Chidu, Shower of Blessings, White
  and Green Tara, 21 Taras, 16th Karmapa, Four-Session and Karma Pakshi guru yogas): all download. Fit:
  they are the texts. Some are practices normally done after empowerment; covered later by the
  restricted-texts decision (Phase 7).
- *Full calendar* → tibetanbuddhistcalendar.org/month: fit.
- About credits (Palpung UK pages, East Side Mandala, original app on GitHub, Janson's paper, the date
  library, tibetanbuddhistcalendar.org, Lotsawa House, CC licence, Simply Being, Garchen Institute, BSWA):
  all open; fit as credits.

## Done in this pass
- Removed the 58 unused `wiki:` links from `FIGS` (never displayed).
- Updated the moved Simply Being link.

## Waiting on Gareth
1. OK to build the in-app "About this day" sheets (section 1), and to draft all six for review?
2. OK to drop the Rigpa Wiki stubs listed in section 2?
3. Include Garchen Rinpoche's vajra recitation instructions verbatim in the app (allowed by its notice)?
