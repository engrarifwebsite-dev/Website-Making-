# CHANGELOG

## 2026-09-22

### Power Grid: two tabs and Training Bill
- The Power Grid page now has subtabs: "বেতন ও ভাতা" (the existing salary
  statement, CPF summary and reports, unchanged) and "ছুটির হিসাব" (new tab).
- "ছুটির হিসাব" tracks earned/taken leave as a simple running-balance ledger,
  reusing the `Leave` tab Setup_PowerGrid.gs already creates (EntryID, Date,
  Type, Days, Balance, Notes). Entries can be "অর্জিত" (Earned — adds to the
  balance) or "ভোগ" (Taken — subtracts). The Balance column is recalculated
  in date order on every add/edit/delete, the same way `Server_Budget.gs`
  recalculates its Ledger.
- New tab UI: three summary cards (total earned, total taken, current
  balance) plus a "নতুন এন্ট্রি" button; an entries table (date, type, days,
  balance, notes, edit/delete); PDF (print → Save as PDF) and Excel (CSV)
  export. The tab's data loads the first time it is opened, not before.
- New earning line "Training Bill" (after Local Training) in the Earnings
  card, the entry form, the details modal, PDF and Excel export. It counts
  in Gross Salary and in Total Allowance.
- Stored in a new `TrainingBill` column (column 39) at the end of
  `SalaryStatements`; the header is added automatically and old rows read 0.
- New server file `Server_Leave.gs`: `getLeaveData`, `saveLeaveEntry`,
  `deleteLeaveEntry`. Reuses `pgSs_`, `pgAuth_`, `pgNum_`, `pgDateStr_` from
  `Server_PowerGrid.gs` (same Apps Script project).
- Files changed: `Page_PowerGrid.html`, `Server_PowerGrid.gs` (Training
  Bill field + CPF-rule comments corrected to match the 2026-09-21 change).
  New file: `Server_Leave.gs`.

## 2026-09-21

### Power Grid: CPF card rule and page cleanup
- The CPF (Provident Fund) card now follows this rule:
  Employee's Contribution to CPF = CPF Deduction − Employer's Contribution to CPF.
  Company's Contribution to CPF = Employer's Contribution to CPF, so the total
  CPF (C = 1 + 2) equals the CPF Deduction. The same numbers are used in the
  previous statements table, the CPF annual summary (YTD, donut, all-years
  total), the CPF list and the PDF/Excel reports.
- A salary entry whose CPF Deduction is smaller than the Employer's Contribution
  is refused (the employee share would be negative); the entry form shows the
  live Employee CPF and a warning.
- Statements saved before this change keep their stored values; open them once
  and check that the CPF Deduction includes the employer's share.
- The information note card ("i" icon) at the end of the right column was
  removed, together with its styles.
- Files changed: `Page_PowerGrid.html` only. No server or sheet change.

### Power Grid page (Phase 8)
- `Page_PowerGrid.html` replaces the placeholder with the approved design:
  four summary cards (gross salary, total allowance, total deduction, net pay)
  plus a "নতুন বেতন এন্ট্রি" button; the salary statement card with the
  employee strip (Employee ID, name, designation, joining date, next increment
  date) and three tables - Earnings (22 lines), Deductions (8 lines) and CPF
  (employee and company contribution) - with totals A, B and C; the salary
  summary (gross salary - total deduction = net pay); the previous statements
  list (last 4 months, eye button opens that month); the CPF annual summary
  with a donut (employee vs company share, year to date); and quick actions
  (the "new entry" button is only at the top).
- Earnings: Basic Salary, Education Allowance, Increment/Arrear, House Rent,
  Officer's Medical Reimbursement, Medical Allowance, Conveyance Allowance,
  Shift Allowance, Responsibility Allowance, Special Allowance, Employer's
  Contribution to CPF, Resident Electricity Allowance, Charge Allowance,
  Tiffin Bill, T.A / D.A, Honorarium, Incentive Bonus, WPPWFM Profit, Festival
  Bonus, Leave Encashment, Bangla Noboborsha, Local Training.
- Deductions: House Rent Deduction, CPF Deduction, Income Tax, CPF Advance,
  Revenue Deduction, Others Deduction, Donation, Tax on WPPWFM.
- CPF section is derived, not typed (see the CPF rule above).
- Earlier CPF contributions (months without a salary statement) can be added,
  edited and deleted from the CPF card ("পূর্বের CPF এন্ট্রি দেখুন ও সম্পাদনা").
  A month that has a salary statement always takes its CPF from the statement.
  The card also shows the all-years total.
- Month switcher (‹ ›) on the statement card; edit / delete the shown month's
  entry; "সব বেতন স্টেটমেন্ট দেখুন" lists every saved month.
- New entry form copies the latest month's values, so a normal month only needs
  a quick check; one statement per month.
- Reports: salary statement, annual summary and CPF summary as PDF (print window,
  choose "Save as PDF"); all data (statements + CPF records) as Excel (UTF-8 CSV).
- New server file `Server_PowerGrid.gs`: `getPowerGridData`,
  `savePowerGridStatement`, `deletePowerGridStatement`, `savePowerGridEmployee`,
  `savePowerGridCpfEntry`, `deletePowerGridCpfEntry`.
  All of them require a valid session token.
- New tabs in Power_Grid, created automatically on first use: `SalaryStatements`
  (one row per month, one column per statement line), `EmployeeInfo`
  (EmployeeID, Designation, NextIncrementDate) and `CPFHistory` (EntryID,
  MonthKey, EmployeeCPF, CompanyCPF, Notes, CreatedAt, UpdatedAt). Lines added
  after the first version are stored in columns 25-38 at the end of
  `SalaryStatements`, so existing rows stay valid (they read 0); the headers are
  added to the sheet automatically. The old EmployeeCPF / CompanyCPF columns
  (19-20) are no longer used. The joining date is kept in the existing
  `Employment` tab and the name comes from Personal Info > Profile. The older
  Salary / CPF / Increment tabs are not used by this page.

### Budget Management page (Phase 7)
- `Page_Budget.html` replaces the placeholder with the full dashboard:
  five summary cards (income, expense, savings, savings goal, remaining
  budget) with change versus last month, an income / expense / savings bar
  chart (last 5, 6 or 12 months), an expense category donut with legend,
  quick actions, the budget category table with usage bars, the savings goal
  tracker and recent activities.
- Month switcher (‹ ›) above the cards; every month reads its own tabs
  ("<Month Year> - Income / Budget / Expense / Ledger").
- Categories: add, edit, delete, and copy last month's budget into an empty
  month. Deleting a category keeps its expenses; they show as "ক্যাটাগরিহীন".
- Income and expense entries can be added and deleted; each entry also writes
  a Ledger row (running balance restarts from 0 each month).
- Reports: PDF (opens the print window, choose "Save as PDF") and Excel
  (UTF-8 CSV that opens directly in Excel).
- New server file `Server_Budget.gs`: `getBudgetDashboard`,
  `saveBudgetCategory`, `deleteBudgetCategory`, `copyBudgetFromPreviousMonth`,
  `setBudgetGoal`, `addBudgetTransaction`, `deleteBudgetTransaction`.
  All of them require a valid session token.
- New tab `SavingsGoals` (MonthLabel, GoalAmount, UpdatedAt) in
  Budget_Management, created automatically on first use.
- Numbers use English digits as in the approved design; set
  `USE_BN_DIGITS = true` at the top of the page script for Bengali digits.

### Family Tree (Personal Information > ফ্যামিলি ট্রি)
- Family tree UI is in place: every branch shows a photo and name, clicking a
  photo opens a details popup (birth/death year, age, other information) and
  clicking again hides it, "+" adds a new branch, members can be edited and
  deleted, spouses are shown as couples.
- Server: `Server_FamilyTree.gs` (`saveFamilyTreeMember`,
  `deleteFamilyTreeMember`) on top of `listFamilyMembers`, `saveFamilyMember`
  and `deleteFamilyMember` in `Server_PersonalInfo.gs`.

### Age Calculator (Personal Information > এজ ক্যালকুলেটর)
- Card 1 "বয়স ক্যালকুলেটর": small square green cards with photo, name and a
  continuously ticking age (years, months, days and a live hh:mm:ss clock).
  Cards are saved in Personal_Info > AgeCards (created on first use); name and
  photo can be edited, the date of birth is fixed once saved (delete and re-add
  if it was wrong).
- Card 2 "Age Calculator": two-date calculator (years/months/days, totals,
  next birthday, weekday) with "আজ" and "আমার জন্ম তারিখ" shortcuts.
- Both cards live inside `Page_PersonalInfo.html` (one subtab); a separate
  `Partial_AgeCalculator` include must not be used.
- Server: `getAgeCards`, `addAgeCard`, `updateAgeCard`, `deleteAgeCard` in
  `Server_PersonalInfo.gs`.

## 2026-09-20

### Weather: Feels Like
- Added "অনুভূত তাপমাত্রা (Feels Like)" to the Home weather card and to
  the global footer weather section (from Open-Meteo `apparent_temperature`).
- On the Home card the last cell ("আকাশের অবস্থা") now spans the full row
  so the nine cells stay balanced in the two-column grid.
- Files: `Page_Home.html`, `Partial_Footer.html`.

### Global Footer (every page)
- The hadith-rotation footer is replaced by a dark info bar with three
  sections: today's date (Bangla, English and Hijri), the current time
  (with day period such as সকাল / দুপুর) and the weather (temperature,
  condition, humidity, wind, location).
- The bar is live: the clock ticks every second, weather refreshes every
  5 minutes, the Hijri date every 10 minutes and on date change.
- Location comes from `getHomeConfig()` (Settings > Global), the same as the
  Home dashboard. On phones the three sections stack vertically.
- Files: `Partial_Footer.html` (markup, styles and script together) and
  `JS_App.html` (the old hadith block removed). `Server_Footer.gs` and the
  Islamic_Corner > Hadiths tab are kept, since they are not used by the
  footer any more but may serve the Islamic Corner page later.

### Education Documents (Personal Information)
- Each qualification in the "শিক্ষাগত যোগ্যতা" card now has its own
  "কাগজপত্র" list: upload certificates, marksheets, admit cards and other
  papers (PDF, JPG, PNG, WEBP, DOC, DOCX; up to 10 MB per file; several
  files can be selected at once).
- Files are stored in Drive under Photos and Files > EducationDocuments;
  the list is tracked in the new Personal_Info > EducationDocuments tab
  (created automatically on first use).
- Each document has a download button and a delete button (the Drive file
  goes to the trash, so it can be recovered).
- `setEducationList()` now keeps an entry's ID when the list is re-saved,
  so attached documents stay linked. Removing an entry also removes its
  documents (files go to the Drive trash); the edit modal warns about this.
- Server functions: `getEducationDocumentsMap`, `uploadEducationDocument`,
  `deleteEducationDocument`.
- Files changed: `Server_PersonalInfo.gs`, `Page_PersonalInfo.html`
  (the new styles live inside the page file; `Stylesheet_Global.html`
  is unchanged).

### Documentation Sync
- Synced CHANGELOG.md and TODO.md with the actual state of the codebase.
- PROJECT_CONTEXT.md: renamed page 4 from "Salary & CPF" to
  "Power Grid (Salary, CPF, Leave, Increment)" to match the app, sidebar
  and Power_Grid spreadsheet. No other content changed.

### Backend Foundation (Google Apps Script)
- `Config.gs`: central IDs for all 13 spreadsheets, Drive folders
  (PhotosAndFiles, HomeSlideshow) and the fixed approved logo.
- `Code.gs`: web app entry point (`doGet`), `include()` helper,
  `getLogoDataUri()` (logo served as data URI, Drive file stays private).
- `Utils_ID.gs`: `generateUniqueId()` (PREFIX-YYYYMMDD-####) and
  ID_Registry helpers (`isNewSyncId`, `registerSyncId`).
- `Utils_Sheets.gs`: `ensureSheetWithHeaders()` and `removeDefaultSheet1()`.
- `Utils_Drive.gs`: `getFileDataUri()` and `uploadFileToFolder_()`.

### Spreadsheet Setup (all 13 spreadsheets)
- `Setup_RunAll.gs` runs every setup function in one click; safe to re-run.
- Setup files exist for: SYS_Master, Personal_Info, Budget_Management,
  Power_Grid, Tax, Zakat_Fitra (including Wife_* tabs), Prince_Hisab,
  My_Transactions, Emergency_Documents, Assets_Items, Islamic_Corner
  (with seeded starter hadiths), AI_Hub and Settings (with default
  location and prayer settings).

### Authentication
- First-run account setup, login, logout, change password.
- Salted SHA-256 password hashing with extra rounds.
- Sessions stored in SYS_Master with a 7-day expiry.
- Login activity logging.
- Account menu on avatar click: change photo, change password, logout.
- Header avatar photo upload (separate from the Personal Info photo).

### App Shell
- `Index.html` template with sidebar, header, footer, modals and toasts.
- Responsive layout with mobile sidebar and hash-based page routing.
- Generic subtab, modal, confirm dialog and toast systems (`JS_App.html`).
- Global stylesheet (`Stylesheet_Global.html`).
- Global footer with live date, time and weather (see Global Footer above).

### Home Dashboard (Phase 5)
- Live clock and day name (Asia/Dhaka).
- Bangla, Hijri (Aladhan API) and English dates.
- Prayer times with next-prayer countdown (Aladhan API).
- Weather card (Open-Meteo API), refreshed every 5 minutes.
- Hero slideshow fed from the HomeSlideshow Drive folder, with optional
  captions from the Drive file description.
- Location and prayer method are read from Settings > Global.
- `getMonthlyHolidays()` exists on the server but is not displayed yet.

### Personal Information (Phase 4)
- Profile card with its own independent photo upload.
- Profile edit modal (main and contact fields), stored as key/value rows.
- Education timeline with a multi-entry edit modal.
- Server helpers: `cleanupDuplicateProfileFields()`, `debugGetProfile()`.

### Current Status
- Completed: Home, Personal Info (Profile, Education, Family Tree, Age
  Calculator), Budget Management, Power Grid (salary and CPF), Auth, app shell,
  all spreadsheet setups.
- In progress: none.
- Placeholder pages: Tax, Zakat, Prince Hisab, My Transactions,
  Emergency Documents, Islamic Corner, Assets, AI Hub, Settings.

## 2026-09-19

### Project Setup
- Created the GitHub repository.
- Added the initial README.md.
- Added PROJECT_CONTEXT.md.
- Established GitHub as the source of truth for the project.
