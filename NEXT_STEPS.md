# NEXT_STEPS.md

This file answers: "If another Claude account (or a fresh session) opens
this repository right now, exactly what should it do next?" Read this after
`CLAUDE.md`, `PROJECT_CONTEXT.md`, `SESSION_STATE.md`, `TASK_PROGRESS.md` and
`CHANGELOG.md`, in that order.

## LAST COMPLETED TASK

Zakat & Fitra (Phase 10) full dashboard build — see `CHANGELOG.md`
(2026-10-03 entry) and `SESSION_STATE.md` for the complete breakdown. Files:
`Page_Zakat.html` (replaces the old placeholder), `Server_Zakat.gs` (new).
`Setup_Zakat.gs` needed no change — it already matched this build's schema.

Before that: Islamic Corner (Phase 13) full dashboard build — see
`CHANGELOG.md` (2026-09-24 entries). Before that: Power Grid Joining Date bug
fix (`Server_PowerGrid.gs`) and the CPF card rule fix (Employee's
Contribution = CPF Deduction − Employer's Contribution).

## CURRENT TASK

None open. The Zakat & Fitra build is finished and code-reviewed but has
**not been live-tested** — that is the immediate next action (see below)
before starting any new feature. The Islamic Corner build from the prior
session is also still only code-reviewed, not live-tested.

## CURRENT STOPPING POINT

Nothing mid-way. All code delivered this session is complete and
self-contained. Nothing was left half-written.

## FILES TO INSPECT (before doing anything else)

1. `SESSION_STATE.md` — exact list of what changed and why, this session.
2. `TASK_PROGRESS.md` — full per-module status; note the `[?]` items,
   meaning "built, not yet verified live."
3. `Page_Zakat.html`, `Server_Zakat.gs` — the new Zakat & Fitra feature, if
   picking up testing or refinement work on it.
4. `Page_IslamicCorner.html`, `Server_IslamicCorner.gs`,
   `Setup_IslamicCorner.gs` — the Islamic Corner feature (prior session),
   also still not live-tested.
5. `Server_PowerGrid.gs`, `Page_PowerGrid.html` — if picking up the Power
   Grid CPF Loan / Increment sections (Leave is already done — see
   `Server_Leave.gs`).

## FUNCTIONS/COMPONENTS TO INSPECT

- `getZakatData()` in `Server_Zakat.gs` — the single dashboard-load
  function; if the live page shows an error banner, this is the first place
  to check (open the Apps Script executions log for the actual thrown
  error).
- `setupZakatFitra()` in `Setup_Zakat.gs` — must be run once (or via
  `setupAllSpreadsheets()`) before the page will have anything to read; the
  page auto-creates its own "Active" ZakatYears row on first load even
  without this, but the default categories/fitra rates need this run to
  exist.
- `getIslamicCornerData()` in `Server_IslamicCorner.gs` — same kind of check
  for the Islamic Corner page, if picking up that testing instead.

## KNOWN ERRORS

None reported yet — neither the Zakat & Fitra nor the Islamic Corner build
has been opened in a live deployment. See `SESSION_STATE.md` → "Current
error" for the exact first-run checklist to run through for Zakat & Fitra.

## NEXT ACTION

1. Deploy `Server_Zakat.gs` and `Page_Zakat.html` (see `SESSION_STATE.md` →
   "Next exact action" for the precise steps) and run `setupZakatFitra()`
   once.
2. Open যাকাত ও ফিতরা in the live app and go through the first-run checklist
   in `SESSION_STATE.md`.
3. Report back anything that errors, looks wrong, or behaves differently
   from the reference image — fix those before starting new feature work.
4. Once Zakat & Fitra is confirmed working, the project owner can either:
   - add real assets / fitra rates / loans / wife assets through the page's
     own forms (data entry, not development), or
   - move on to the next unstarted phase.
5. If moving to a new phase, the most natural next pieces of work, in no
   particular required order, are:
   - Tax (Phase 9) — fully unstarted; `Setup_Tax.gs` already creates the
     Summary / RuleConfig / Planning tabs per year, nothing reads/writes
     them yet.
   - Prince Hisab (Phase 11) — fully unstarted; when built, it should take
     over `Loans_Given`/`Loans_Received` management from the Zakat page
     (currently managed there as a stopgap) using the same two tabs.
   - My Transactions (Phase 11) and Power Grid CPF Loan / Increment
     sections.

## TESTING REQUIRED

- Zakat & Fitra: full first-run checklist (see `SESSION_STATE.md`).
- Islamic Corner: full first-run checklist (see the 2026-09-24
  `SESSION_STATE.md` entry, now superseded in this file but still in
  `CHANGELOG.md`).
- Power Grid: confirm the Joining Date fix persists correctly after a real
  save + page reload (this was fixed in a prior session but also not yet
  live-verified as of this writing).

## IMPORTANT WARNINGS

- Do not re-build Zakat & Fitra or Islamic Corner from scratch if asked
  again to "start" Phase 10 or Phase 13 — they already exist. Re-read
  `CHANGELOG.md` and the files themselves first; extend or fix, don't
  duplicate. (This exact situation — a duplicate "start this phase" request
  after the feature was already built — has happened before in this
  project's history.)
- `Loans_Given`/`Loans_Received` are now actively managed from the Zakat
  page's "দেনা-পাওনা ব্যবস্থাপনা" modal. When Prince Hisab (Phase 11) is
  built, it must read/write the SAME two tabs rather than creating its own,
  or the two pages' numbers will disagree.
- Ramadan/Eid/Ashura dates, Hajj/Umrah costs, and specific fasting dates
  (Ayyamul Bid, Arafah, Shab-e-Barat) are **intentionally not hardcoded or
  algorithmically guessed** anywhere in this app. They depend on moon
  sighting and official announcements and change every year — always leave
  this as a data-entry job for the project owner via the page's own forms,
  never invent or estimate a date for these.
- Per `CLAUDE.md`: always read `SESSION_STATE.md` + `TASK_PROGRESS.md` +
  `CHANGELOG.md` before writing any code, and update all three (plus this
  file) again before ending a substantial session.
