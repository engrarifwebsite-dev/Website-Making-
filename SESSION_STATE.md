# SESSION_STATE.md

Session date: 2026-10-03
Session number: 16 (continues after Session 15's Islamic Corner build —
see CHANGELOG.md 2026-09-24 entries)
Current branch: main (assumed — verify with `git branch` before committing)
Latest commit: not verified by this session (read-only checkout used here —
verify with `git log --oneline -10` before pushing)

## Current task
Feature build: যাকাত ও ফিতরা (Zakat & Fitra, Phase 10) — was a placeholder
page; replaced with a full dashboard matching the project owner's reference
image (net assets table, zakat calculation, advance zakat payment log, fitra
reference rates + calculator, yearly zakat summary donut, payment history,
year-end finalization, wife's separate zakat account, auto-update info card,
Islamic Corner shortcuts).

## Completed
- `Page_Zakat.html` — full dashboard (see CHANGELOG.md 2026-10-03 entry for
  the complete card-by-card breakdown).
- `Server_Zakat.gs` (new) — `getZakatData`, `saveAsset`/`deleteAsset`,
  `saveLoan`/`deleteLoan`, `savePayment`/`deletePayment`,
  `saveFitraRate`/`deleteFitraRate`, `saveFitraPayment`,
  `saveWifeAsset`/`deleteWifeAsset`, `saveWifePayment`/`deleteWifePayment`,
  `closeZakatYear`.
- `Setup_Zakat.gs` — confirmed it already matches everything this build
  needed (it was written ahead of time for exactly this feature); no change
  made.
- `CHANGELOG.md` — new 2026-10-03 entry with the full feature breakdown and
  the exact net-worth / zakat formulas used.
- Re-verified in this session: `Server_Zakat.gs` passes `node --check`
  (valid JS/Apps-Script syntax, checked via a renamed `.js` copy since
  `node` doesn't recognize `.gs`); the single inline `<script>` block in
  `Page_Zakat.html` also passes `node --check`. `Index.html` already had
  `include('Page_Zakat')` from the original placeholder, so no routing
  change was needed.

## In progress
- None — the Zakat & Fitra first build is complete and self-contained.

## Pending
- Zakat & Fitra: the project owner still needs to, through the page's own
  UI (no code required):
  - Add their real assets via "+ নতুন সম্পদ যোগ করুন" (nothing is pre-seeded
    with values — only the 8 default categories from `Setup_Zakat.gs` exist).
  - Review/update this year's ফিতরা reference rates (seeded with 5 starter
    values; Bangladesh Islamic Foundation announces new ones each year).
  - If there are any outstanding loans (given or received), add them via
    "দেনা-পাওনা ব্যবস্থাপনা" (ⓘ next to that row in the calculation card).
  - If applicable, add the wife's assets via "স্ত্রীর সম্পদ ও যাকাত
    ব্যবস্থাপনা".
- Auto-sync from "আমার লেনদেন" / "বাজেট ব্যবস্থাপনা" (আয়/ব্যয়) and from
  "প্রিন্স হিসাব" (দেনা-পাওনা) is NOT implemented yet — those modules
  (Phase 9/11) are still placeholders. The page shows this as an
  informational note only. Loans are managed directly on this page for now
  using the same `Loans_Given`/`Loans_Received` tabs Prince Hisab will use
  later, so nothing will need to migrate.
- Everything else already listed in `NEXT_STEPS.md` under upcoming phases
  (Tax, Prince Hisab, My Transactions, Emergency Documents — already done,
  Assets — already done, AI Hub, Settings, Power Grid CPF-Loan/Increment
  sections).

## Blocked
- None.

## Current file
`Page_Zakat.html`

## Current function/component
None specific — the whole page was a green-field build this session, not a
fix to one function.

## Current error
None known — code-reviewed and syntax-checked (see "Completed" above), but
this session had no live Apps Script / Google Sheets environment to run it
in, so it has NOT been verified against a live deployment. The project owner
should, after deploying:
1. Run `setupZakatFitra()` once (or `setupAllSpreadsheets()`) so all tabs
   exist and the default categories/fitra rates are seeded (safe to re-run —
   seeding only happens if a tab is completely empty).
2. Open যাকাত ও ফিতরা and confirm it renders without a red error banner —
   on first load it will auto-create one "Active" ZakatYears row with all
   figures at ৳ ০ since no assets exist yet.
3. Add a test asset via "+ নতুন সম্পদ যোগ করুন" and confirm the KPI cards,
   "যাকাত ক্যালকুলেশন" card and donut chart all update after reload.
4. Try "+ অগ্রিম যাকাত যোগ করুন", "দেনা-পাওনা ব্যবস্থাপনা",
   "ফিতরা প্রদান রেকর্ড করুন", and "স্ত্রীর সম্পদ ও যাকাত ব্যবস্থাপনা" once
   each to confirm saves round-trip correctly.
5. Confirm the "ইসলামিক রিসোর্স"/"ইসলামিক টুলস" shortcut buttons correctly
   navigate to ইসলামিক কর্নার.

## Testing status
Code-reviewed and syntax-checked only, not yet live-tested (see "Current
error" above).

## Uncommitted changes
- `Page_Zakat.html`, `Server_Zakat.gs` — new/replaced this feature.
- `CHANGELOG.md`, `SESSION_STATE.md`, `NEXT_STEPS.md` — updated to match.
These were provided as downloadable files in this session; the project owner
still needs to copy them into the Apps Script project / GitHub repo and
commit/push.

## Exact stopping point
The Zakat & Fitra Phase 10 build is finished and ready to deploy. Nothing
else was touched this session.

## Next exact action
1. Paste `Server_Zakat.gs` (new file) and `Page_Zakat.html` (replaces the
   old placeholder — `Index.html` does not need to change, it already
   includes `Page_Zakat`) into the Apps Script project.
2. Run `setupZakatFitra()` (or `setupAllSpreadsheets()`) once, then deploy a
   new Web App version and test as described above under "Current error".
3. Add real assets / fitra rates / loans / wife assets through the page's
   own forms once ready (see "Pending" above) — this is data entry, not
   development work.
4. Commit `Page_Zakat.html`, `Server_Zakat.gs`, `CHANGELOG.md`,
   `SESSION_STATE.md`, `NEXT_STEPS.md` to GitHub, e.g.:
   `feat: Zakat & Fitra dashboard (Phase 10)`.
5. Pick up the next task: Tax (Phase 9), Prince Hisab / My Transactions
   (Phase 11), or Power Grid CPF-Loan/Increment sections, whichever the
   project owner prioritizes next.


## Session 17 (2026-10-04)
- হোম নামাজ কার্ড: ওয়াক্ত/নিষিদ্ধ সময় হিরো কাউন্টডাউন যোগ (Page_Home.html)। Leave ট্যাবের কাজ (১৮০ ক্যাপ, স্থিতি কলাম বাদ, প্রতি রো আপলোড) ইউজারের নির্দেশে থেমে আছে — অসম্পূর্ণ।
