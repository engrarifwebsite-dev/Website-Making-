# SESSION_STATE.md

Session date: 2026-09-24
Session number: 15 (continues after the 2026-09-22 Power Grid Joining Date fix
in CHANGELOG.md and SESSION_STATE.md's own previous entry)
Current branch: main (assumed — verify with `git branch` before committing)
Latest commit: not verified by this session (no repository checkout available
here — verify with `git log --oneline -10` before pushing)

## Current task
Feature build: ইসলামিক কর্নার (Islamic Corner, Phase 13) — was a placeholder
page; replaced with a full dashboard matching the project owner's reference
image (upcoming Islamic dates, Hajj/Umrah packages, fasting calendar, prayer
times, Qibla direction, daily hadith, surah browser, tasbih counter, Islamic
calendar, Quran/Khatm tracker, daily checklist, library links).

## Completed
- `Page_IslamicCorner.html` — full dashboard (see CHANGELOG.md 2026-09-24
  entry for the complete card-by-card breakdown).
- `Server_IslamicCorner.gs` (new) — `getIslamicCornerData`,
  `saveIslamicEvent`/`deleteIslamicEvent`, `saveIslamicPackage`/
  `deleteIslamicPackage`, `saveFastingEntry`/`deleteFastingEntry`,
  `saveQuranProgress`, `markKhatmComplete`, `toggleChecklistItem`,
  `saveTasbih`, `saveLibraryLink`.
- `Setup_IslamicCorner.gs` updated — new tabs `Events`, `Packages`,
  `FastingCalendar` (weekly Mon/Thu nafl fasting seeded), `QuranProgress`,
  `KhatmLog`, `ChecklistDone`, `Tasbih`, `LibraryLinks` (6 fixed categories
  seeded, URLs left blank for the project owner to fill in). The existing
  `Preferences`, `Cache`, `Hadiths` tabs are untouched.
- Prayer times, live Hijri date and the Islamic calendar grid are fetched
  directly from the Aladhan API in the browser (same pattern as
  `Page_Home.html`) — no new server function needed for those.
- `CHANGELOG.md` — new 2026-09-24 entry with the full feature breakdown and
  an explicit note on what was deliberately left blank and why.
- `TODO.md` — moved "Islamic Corner (Phase 13)" from Pending to Completed;
  added two new Pending follow-ups (enter each year's actual Ramadan/Eid/
  Ashura dates and Hajj/Umrah costs once announced — no code change needed,
  just data entry through the page's own forms).
- Re-verified in this session: `Setup_IslamicCorner.gs` and
  `Server_IslamicCorner.gs` both pass `node --check` (valid JS/Apps-Script
  syntax); the single inline `<script>` block in `Page_IslamicCorner.html`
  also passes `node --check`; `Index.html` already had the
  `include('Page_IslamicCorner')` line from the original placeholder, so no
  routing change was needed.

## In progress
- None — the Islamic Corner first build is complete and self-contained.

## Pending
- Islamic Corner: the project owner still needs to enter, through the page's
  own UI (no code required):
  - Events tab data — actual Gregorian dates for the next Ramadan, Eid-ul-Fitr,
    Eid-ul-Adha and Ashura (depends on moon sighting / official announcement,
    so intentionally not guessed by the app).
  - Packages tab data — current Hajj/Umrah package costs (change yearly).
  - FastingCalendar specific-date entries — Ayyamul Bid, Arafah, Ashura
    fasting, Shab-e-Barat for the current Hijri year (the weekly Mon/Thu nafl
    fasting rows are already seeded since those don't depend on a specific
    date).
  - LibraryLinks tab — the 6 categories are seeded but the actual URLs are
    blank; fill them in from the "ইসলামিক লাইব্রেরি" card or directly in the
    sheet.
- Everything else already listed in `TASK_PROGRESS.md` / `TODO.md` under
  Pending (Tax, Zakat, Prince Hisab, My Transactions, Emergency Documents,
  Assets, AI Hub, Settings, Power Grid Leave/CPF-Loan/Increment sections).

## Blocked
- None.

## Current file
`Page_IslamicCorner.html`

## Current function/component
None specific — the whole page was a green-field build this session, not a
fix to one function.

## Current error
None known — code-reviewed and syntax-checked (see "Completed" above), but
this session had no live Apps Script / Google Sheets environment to run it
in, so it has NOT been verified against a live deployment. The project owner
should, after deploying:
1. Run `setupIslamicCorner()` once (or `setupAllSpreadsheets()`) so the new
   tabs are created in the Islamic_Corner spreadsheet.
2. Open ইসলামিক কর্নার and confirm every card renders without a red error
   banner, prayer times load, and the Qibla compass responds to
   "কিবলা লোকেট করুন".
3. Try each "+ যোগ করুন" / edit form (Events, Packages, Fasting, Library
   links, Quran progress, checklist) once to confirm saves round-trip.

## Testing status
Code-reviewed and syntax-checked only, not yet live-tested (see "Current
error" above).

## Uncommitted changes
- `Page_IslamicCorner.html`, `Server_IslamicCorner.gs`,
  `Setup_IslamicCorner.gs` — new/replaced this feature.
- `CHANGELOG.md`, `TODO.md`, `SESSION_STATE.md` — updated to match.
These were provided as downloadable files in this session; the project owner
still needs to copy them into the Apps Script project / GitHub repo and
commit/push.

## Exact stopping point
The Islamic Corner Phase 13 build is finished and ready to deploy. Nothing
else was touched this session.

## Next exact action
1. Paste `Setup_IslamicCorner.gs`, `Server_IslamicCorner.gs` and
   `Page_IslamicCorner.html` into the Apps Script project (the first two are
   new files; the third replaces the old placeholder — `Index.html` does not
   need to change, it already includes `Page_IslamicCorner`).
2. Run `setupIslamicCorner()` (or `setupAllSpreadsheets()`) once, then deploy
   a new Web App version and test as described above under "Current error".
3. Fill in Events / Packages / FastingCalendar / LibraryLinks data through
   the page's own forms once the current year's actual dates/costs/links are
   known (see "Pending" above) — this is data entry, not development work.
4. Commit `Page_IslamicCorner.html`, `Server_IslamicCorner.gs`,
   `Setup_IslamicCorner.gs`, `CHANGELOG.md`, `TODO.md`, `SESSION_STATE.md` to
   GitHub, e.g.: `feat: Islamic Corner dashboard (Phase 13)`.
5. Pick up the next task: Power Grid Leave/CPF-Loan/Increment (Phase 8
   remainder), or Tax (Phase 9), or whatever the project owner prioritizes.
