# TASK_PROGRESS.md

Status indicators:
```
[x] COMPLETED
[~] IN PROGRESS
[ ] PENDING
[!] BLOCKED
[?] NEEDS VERIFICATION
```

Only items that have actually been opened in a live deployment and clicked
through are marked `[x]`. Everything built in a chat session but not yet
tested live is marked `[?]` until the project owner confirms it — see
`SESSION_STATE.md` → "Testing status" for what still needs a first live check.

## Backend Foundation

- [x] `Config.gs` — spreadsheet IDs, Drive folder IDs, fixed logo file ID
- [x] `Code.gs` — `doGet`, `include()`, `getLogoDataUri()`
- [x] `Utils_ID.gs` — `generateUniqueId()`, `isNewSyncId`, `registerSyncId`
- [x] `Utils_Sheets.gs` — `ensureSheetWithHeaders()`, `removeDefaultSheet1()`
- [x] `Utils_Drive.gs` — `getFileDataUri()`, `uploadFileToFolder_()`
- [x] `Setup_RunAll.gs` + one `Setup_*.gs` per spreadsheet (all 13)

## Authentication

- [x] First-run account setup
- [x] Login / logout
- [x] Change password
- [x] Sessions (7-day expiry, SYS_Master > Sessions)
- [x] Login activity logging
- [x] Account menu (avatar click): change photo, change password, logout
- [ ] Suspicious-login detection (device/IP comparison) — planned Phase 17

## App Shell

- [x] `Index.html` template (sidebar, header, footer, modals, toasts)
- [x] Responsive layout, mobile sidebar, hash-based page routing
- [x] Generic subtab / modal / confirm-dialog / toast systems (`JS_App.html`)
- [x] Global stylesheet (`Stylesheet_Global.html`)
- [x] Global footer — live date, time, weather bar
- [?] Sidebar footer still reads "Version 1.0 · Phase 3" — cosmetic, not fixed

## 1. Home

- [x] Live clock, day name, Bangla/Hijri/English dates
- [x] Prayer times with next-prayer countdown (Aladhan API)
- [x] Weather card incl. Feels Like (Open-Meteo API)
- [x] Hero slideshow (Drive folder, optional captions)
- [ ] Show `getMonthlyHolidays()` data on the page (server function exists,
      nothing calls it yet)
- [ ] Apply the `HijriAdjustment` Settings value to the displayed Hijri date

## 2. Personal Information

- [x] Profile card (independent photo, edit modal)
- [x] Education timeline (multi-entry edit modal)
- [x] Education documents (upload/download/delete per qualification)
- [x] Family Tree UI (photo+name branches, details popup, add/edit/delete,
      spouse pairing)
- [x] Age Calculator — saved green cards (photo, name, live ticking age) +
      two-date calculator
- [?] `EducationDocuments`, `AgeCards`, `FamilyMembers` tabs are created
      automatically on first use — not yet added to `Setup_PersonalInfo.gs`
      itself

## 3. Budget Management

- [x] Dashboard (5 summary cards, income/expense/savings chart, expense donut)
- [x] Budget categories (add/edit/delete/copy previous month)
- [x] Income & expense entries (with Ledger running balance per month)
- [x] Savings goal tracker
- [x] PDF and Excel (CSV) export
- [ ] Link entries to Banks (BankID) and update bank balances
- [ ] Sync Power Grid net salary into monthly Income (GlobalSyncID) — Phase 17
- [ ] Carry the Ledger running balance across months
- [ ] Add `SavingsGoals` tab to `Setup_Budget.gs` (currently created on first use)

## 4. Power Grid (Salary, CPF, Leave, Increment)

- [x] Salary statements — 22-line Earnings, 8-line Deductions, derived CPF
      section (Employee = CPF Deduction − Employer's Contribution; Company =
      Employer's Contribution; total = CPF Deduction)
- [x] Employee info (Employee ID, designation, joining date, next increment
      date) — Joining Date bug fixed (was a Date-object round trip, now
      plain text like Next Increment Date)
- [x] Previous statements list, full list modal, edit/delete
- [x] CPF annual summary + donut, earlier CPF entries (add/edit/delete) for
      months without a salary statement
- [x] PDF (statement / annual / CPF summary) and Excel (CSV) export
- [ ] Leave section (accrual, taken, balance) — not started
- [ ] CPF Loan section — not started
- [ ] Increment history section — not started
- [ ] Sync net salary into Budget monthly Income (GlobalSyncID) — Phase 17
- [ ] Add `SalaryStatements`, `EmployeeInfo`, `CPFHistory` tabs to
      `Setup_PowerGrid.gs` (currently created on first use)
- [?] Confirm "মোট ভাতা" = total earnings − basic salary is the intended
      definition
- [?] Check old salary statements once — CPF Deduction should include the
      employer's share, otherwise Employee's CPF shows too low

## 5. Tax

- [ ] Not started (placeholder page)

## 6. Zakat & Fitra

- [ ] Not started (placeholder page; `Setup_Zakat.gs` already creates all
      tabs incl. Wife_* tabs)

## 7. Prince Account

- [ ] Not started (placeholder page)

## 8. My Transactions

- [ ] Not started (placeholder page)

## 9. Emergency Documents

- [ ] Not started (placeholder page)

## 10. Islamic Corner

- [x] Full dashboard built (Phase 13): upcoming Islamic dates countdown,
      Hajj/Umrah package cards, fasting calendar, prayer times, Qibla
      direction, daily hadith, surah browser (114 surahs), tasbih counter,
      Islamic calendar (Gregorian/Hijri), Quran & Khatm tracker, daily
      dua/amal checklist, Islamic library links, "তথ্য উৎস ও আপডেট" info bar
- [x] New server file `Server_IslamicCorner.gs` (see `SESSION_STATE.md` for
      the full function list)
- [x] `Setup_IslamicCorner.gs` extended with `Events`, `Packages`,
      `FastingCalendar`, `QuranProgress`, `KhatmLog`, `ChecklistDone`,
      `Tasbih`, `LibraryLinks`
- [?] Not yet opened in a live deployment — see `SESSION_STATE.md` →
      "Current error" for the exact first-run checklist
- [ ] Data entry pending (not code): this year's actual Ramadan/Eid/Ashura
      dates (Events), Hajj/Umrah costs (Packages), Ayyamul Bid/Arafah/Ashura
      fasting/Shab-e-Barat dates (FastingCalendar), and the Islamic library
      URLs (LibraryLinks) — all fillable from the page itself once known
- [ ] Decide whether to keep `Server_Footer.gs` (`getFooterHadiths`) as a
      shared helper used by Islamic Corner's daily-hadith card, or fold it
      into `Server_IslamicCorner.gs` — currently kept shared, no change needed

## 11. My Assets & Items

- [ ] Not started (placeholder page)

## 12. AI Assistant Hub

- [ ] Not started (placeholder page; `Setup_AIHub.gs` already creates the
      Cards tab)

## 13. Settings

- [ ] Not started (placeholder page; Settings > Global sheet already holds
      Location + Islamic prayer-method + HijriAdjustment values, seeded by
      `Setup_Settings.gs` and already read by Home/Islamic Corner — a
      dedicated Settings UI to edit these values in-app doesn't exist yet)

## 17. Automation & Cross-Module Refinements

- [ ] Suspicious-login detection
- [ ] Budget ↔ Power Grid salary sync (GlobalSyncID)
- [ ] Any other cross-module data sync identified while building later phases
