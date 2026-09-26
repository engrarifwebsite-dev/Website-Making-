# NEXT_STEPS.md

This file answers: "If another Claude account (or a fresh session) opens
this repository right now, exactly what should it do next?" Read this after
`CLAUDE.md`, `PROJECT_CONTEXT.md`, `SESSION_STATE.md`, `TASK_PROGRESS.md` and
`CHANGELOG.md`, in that order.

## LAST COMPLETED TASK

Islamic Corner (Phase 13) full dashboard build — see `CHANGELOG.md`
(2026-09-24 entry) and `SESSION_STATE.md` for the complete breakdown. Files:
`Page_IslamicCorner.html` (replaces the old placeholder),
`Server_IslamicCorner.gs` (new), `Setup_IslamicCorner.gs` (extended with 8
new tabs, old `Preferences`/`Cache`/`Hadiths` tabs untouched).

Before that: Power Grid Joining Date bug fix (`Server_PowerGrid.gs`) and the
CPF card rule fix (Employee's Contribution = CPF Deduction − Employer's
Contribution).

## CURRENT TASK

None open. The Islamic Corner build is finished and code-reviewed but has
**not been live-tested** — that is the immediate next action (see below)
before starting any new feature.

## CURRENT STOPPING POINT

Nothing mid-way. All code delivered this session is complete and
self-contained. Nothing was left half-written.

## FILES TO INSPECT (before doing anything else)

1. `SESSION_STATE.md` — exact list of what changed and why, this session.
2. `TASK_PROGRESS.md` — full per-module status; note the `[?]` items,
   meaning "built, not yet verified live."
3. `Page_IslamicCorner.html`, `Server_IslamicCorner.gs`,
   `Setup_IslamicCorner.gs` — the new Islamic Corner feature, if picking up
   testing or refinement work on it.
4. `Server_PowerGrid.gs`, `Page_PowerGrid.html` — if picking up the Power
   Grid Leave / CPF Loan / Increment sections (still not started).

## FUNCTIONS/COMPONENTS TO INSPECT

- `getIslamicCornerData()` in `Server_IslamicCorner.gs` — the single
  dashboard-load function; if the live page shows an error banner, this is
  the first place to check (open the Apps Script executions log for the
  actual thrown error).
- `setupIslamicCorner()` in `Setup_IslamicCorner.gs` — must be run once
  (or via `setupAllSpreadsheets()`) before the page will have anything to
  read; if the page loads but every card is empty, confirm this was run.

## KNOWN ERRORS

None reported yet — the Islamic Corner build has not been opened in a live
deployment. See `SESSION_STATE.md` → "Current error" for the exact
first-run checklist to run through.

## NEXT ACTION

1. Deploy the three Islamic Corner files (see `SESSION_STATE.md` → "Next
   exact action" for the precise steps) and run `setupIslamicCorner()` once.
2. Open ইসলামিক কর্নার in the live app and go through the first-run
   checklist in `SESSION_STATE.md`.
3. Report back anything that errors, looks wrong, or behaves differently
   from the reference image — fix those before starting new feature work.
4. Once Islamic Corner is confirmed working, the project owner can either:
   - fill in this year's real dates/costs/links through the page's own
     forms (data entry, not development — see `TASK_PROGRESS.md` → section
     10 → "Data entry pending"), or
   - move on to the next unstarted phase.
5. If moving to a new phase, the most natural next pieces of work, in no
   particular required order, are:
   - Power Grid: Leave, CPF Loan, Increment sections (Phase 8 remainder —
     `Page_PowerGrid.html` / `Server_PowerGrid.gs` already exist and follow
     an established pattern to extend).
   - Tax (Phase 9) — fully unstarted; `Setup_Tax.gs` already creates the
     Summary / RuleConfig / Planning tabs per year, nothing reads/writes
     them yet.
   - Zakat & Fitra (Phase 10) — fully unstarted; `Setup_Zakat.gs` already
     creates all tabs including the wife's separate Zakat account.

## TESTING REQUIRED

- Islamic Corner: full first-run checklist (see `SESSION_STATE.md`).
- Power Grid: confirm the Joining Date fix persists correctly after a real
  save + page reload (this was fixed in a prior session but also not yet
  live-verified as of this writing).

## IMPORTANT WARNINGS

- Do not re-build Islamic Corner from scratch if asked again to "start"
  Phase 13 — it already exists. Re-read `CHANGELOG.md` and the files
  themselves first; extend or fix, don't duplicate. (This exact situation
  happened once already in this project's history — the request was sent
  a second time after the feature was already built.)
- Ramadan/Eid/Ashura dates, Hajj/Umrah costs, and specific fasting dates
  (Ayyamul Bid, Arafah, Shab-e-Barat) are **intentionally not hardcoded or
  algorithmically guessed** anywhere in this app. They depend on moon
  sighting and official announcements and change every year — always leave
  this as a data-entry job for the project owner via the page's own forms,
  never invent or estimate a date for these.
- Per `CLAUDE.md`: always read `SESSION_STATE.md` + `TASK_PROGRESS.md` +
  `CHANGELOG.md` before writing any code, and update all three (plus this
  file) again before ending a substantial session.
