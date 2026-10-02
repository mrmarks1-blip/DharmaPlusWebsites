# Calendar research: skipped/doubled days and Tsurphu

2026-10-03, for Gareth (A6). Not served.

## 1. Which day keeps an auspicious day that is skipped or doubled?

Every source agrees *why* days are skipped or doubled (the lunar day is counted at daybreak, so
occasionally two lunar days end on one solar day, or none does). They **disagree on what to do**,
and, oddly, two of them both say they follow the Men-Tsee-Khang:

| Source | Skipped day | Doubled day | Notes |
|---|---|---|---|
| **This app (today)** | day **before** | **second** day | Took the FPMT rule. |
| FPMT, *Explanations of Dharma Practice Days* ("based on Tibetan Medical and Astrological Institute's calendar", i.e. Men-Tsee-Khang) | "usually … on the **preceding** day" | "usually … on the **second** day, but may be celebrated on the first day if it is more convenient" | Gelug network. |
| Mindrolling tradition (as quoted by Lotus Gardens / search summaries) | day **before** (Tse Chu on the 9th if the 10th is missing) | **second** day | Nyingma. The Mindrolling Lotus Garden calendar page this came from is now gone (404); only a search-engine copy remains, so treat as unconfirmed. |
| Alexander Berzin, *The Tibetan Calendar* (Study Buddhism) | day **before** ("held on the ninth") | **first** day | Says "this rule is followed for all religious practices". |
| tibetanbuddhistcalendar.org (Rigpa students; "guidelines of … Men Tse Khang") | day **after** | **first** day | Their About page. Based on the Rigpa calendar. |
| Dharma Wheel thread *Tibetan Calendar* (via search summaries; the page itself is behind a "prove you're human" check) | Men-Tsee-Khang: next day, "however, some do celebrate on the day before" | first day | Notes the Rigpa calendar once put Guru Rinpoche Day on the 11th when the 10th was skipped. |

**What this means**
- There is **no single rule**. Two well-known Men-Tsee-Khang-based calendars (FPMT and
  tibetanbuddhistcalendar.org) contradict each other on both cases.
- For **skipped days**, three of the four named sources say the **day before** (FPMT, Berzin, and
  Mindrolling if the lost page is right); only tibetanbuddhistcalendar.org/Rigpa says the day after.
- For **doubled days** it's split: FPMT and Mindrolling say the **second**; Berzin and
  tibetanbuddhistcalendar.org say the **first**. FPMT adds that either is fine.
- Only a teacher or the centre's own calendar settles it for a given person. This is a good
  question for Lama Rabsang: "When the 10th is skipped or doubled, which day does Palpung keep?"

**What the app does now (Phase 1).** Keep the current rule (day before / second day) as the main
date, because it has the most support. On the days where the other rule gives a different date, show
a short labelled note on the day page and in the calendar, e.g. *"Some calendars (e.g.
tibetanbuddhistcalendar.org) keep it on Tuesday instead."* The "About the Tibetan calendar" section
explains why. One setting can flip the default later if Gareth's centre does it differently.

## 2. Tsurphu (Karma Kagyu)

- Two main systems: **Phugpa** (from 1447; the Dalai Lama, Men-Tsee-Khang, Rigpa, most calendars)
  and **Tsurphu/Tsurluk** (from the 3rd Karmapa Rangjung Dorje's *Compendium of Astrology*; the
  official calendar of the Karma Kamtsang, kept today for the 17th Karmapa).
  Sources: Rigpa Wiki *Rigpa Tibetan Calendar*; Kagyu Office, *Gyalwang Karmapa celebrates Tsurluk
  Losar in Bodhgaya* (Feb 2014); Wikipedia *Tibetan calendar*.
- They can differ by **a whole month**. Example, checked with this app's engine: in 2014 Tsurluk Losar
  was **31 January** (Kagyu Office), while Phugpa Losar was **2 March** (the app gives 31 Jan as
  Phugpa month 12, day 1).
- Day numbers can also differ by a day here and there (different rules for skipped/doubled days).
- **Doing it properly later:** Janson's paper (already credited in About) gives the Tsurphu maths
  and a table of Losar dates for all versions 2000–2030; Edward Henning's kalacakra.org has Tsurphu
  calendar data; an open-source project (kitsuyui/hyper-calendar PR #171) implemented Tsurphu and
  checked it against Janson's tables, Henning and the Karmapa office. Plan: implement from Janson,
  check against his Losar table plus a year of day-by-day dates from a published Tsurphu calendar
  (e.g. a Karma Kagyu centre's), then show it as a labelled option.
- Phase 1: explain it in "About the Tibetan calendar"; no Tsurphu dates yet (Gareth, 2026-10-03).

## Sources
- FPMT, Explanations of Dharma Practice Days: https://fpmt.org/media/resources/dharma-dates/dates-explained/
- tibetanbuddhistcalendar.org, About: https://tibetanbuddhistcalendar.org/about
- Alexander Berzin, The Tibetan Calendar (Study Buddhism): https://studybuddhism.com/en/advanced-studies/history-culture/tibetan-astrology/the-tibetan-calendar
- Dharma Wheel, Tibetan Calendar thread: https://www.dharmawheel.net/viewtopic.php?t=1349&start=60
- Rigpa Wiki, Rigpa Tibetan Calendar: https://www.rigpawiki.org/index.php?title=Rigpa_Tibetan_Calendar
- Kagyu Office, Tsurluk Losar 2014: https://kagyuoffice.org/gyalwang-karmapa-celebrates-tsurluk-losar-in-bodhgaya/
- Svante Janson, Tibetan Calendar Mathematics: https://www2.math.uu.se/~svantejs/papers/calendars/tibet.pdf
- kitsuyui/hyper-calendar PR #171: https://github.com/kitsuyui/hyper-calendar/pull/171
