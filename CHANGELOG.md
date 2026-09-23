# CHANGELOG

## 2026-09-23 (Session 15)

### আমার সম্পদ ও সামগ্রী (Phase 14) — কাজ শুরু
- Setup_Assets.gs: Assets শিটে Category/Brand/Model/CreatedAt/UpdatedAt কলাম
  যোগ, নতুন Categories/Maintenance/Documents শিট, ডিফল্ট ৭টি ক্যাটাগরি সিড।
- Server_Assets.gs (নতুন): সম্পদ CRUD, ক্যাটাগরি ব্যবস্থাপনা, মেইনটেনেন্স,
  দলিলপত্র আপলোড, সরল রৈখিক মূল্যহ্রাস ও ওয়ারেন্টি স্ট্যাটাস হিসাব।
- Page_Assets.html: সম্পূর্ণ ড্যাশবোর্ড — KPI, ক্যাটাগরি, সার্চ/ফিল্টার,
  তালিকা, দ্রুত অ্যাকশন, ওয়ারেন্টি/মেইনটেনেন্স সারাংশ, মূল্যহ্রাস ও
  অবস্থান ডোনাট, মেইন/সাব এসেট, দলিলপত্র, দ্রুত তথ্য, PDF/Excel এক্সপোর্ট।
```


2026-09-22 (Session 11)
Power Grid: "ছুটির হিসাব" — accrual, usage totals ও নগদায়ন সেভ না হওয়ার বাগ ফিক্স
তিনটি রিপোর্ট করা বাগ ফিক্স করা হয়েছে:
"মোট অর্জিত ছুটি" (প্রতি ১১ দিনে ১ দিন) সবসময় ০ দেখাচ্ছিল।
"ভোগ/নগদায়নকৃত" কখনো আপডেট হচ্ছিল না (সবসময় ০)।
এন্ট্রি সম্পাদনায় "নগদায়ন" সিলেক্ট করে সংরক্ষণ করলে কাজ করত না।
মূল কারণ: deploy করা Server_Leave.gs-এর রিটার্ন করা ফিল্ডের নাম এবং গ্রহণযোগ্য Type মান, Page_PowerGrid.html-এর "ছুটির হিসাব" ট্যাব যা প্রত্যাশা করে তার সাথে মিলছিল না। ফ্রন্টএন্ড d.joiningDate, d.accrualDays, d.daysServed, d.totalEarned, d.totalUsed, d.totalEncashed, d.balance পড়ে এবং saveLeaveEntry()-কে type: 'Taken' বা type: 'Encashed' পাঠায়; কিন্তু ব্যাকএন্ড ভিন্ন নাম (যেমন totalTaken, totalAccrued) ব্যবহার করত এবং 'Encashed' টাইপ রিজেক্ট করত ("ছুটির ধরন নির্বাচন করুন।" এরর)।
সমাধান: Server_Leave.gs সম্পূর্ণভাবে rewrite করা হয়েছে, ফ্রন্টএন্ডের ঠিক এই কন্ট্র্যাক্ট মেনে —
getLeaveData(token) → { joiningDate, accrualDays, daysServed, totalEarned, totalUsed, totalEncashed, balance, entries[] }।
অর্জিত ছুটি এখন সম্পূর্ণ স্বয়ংক্রিয় — "বেতন ও ভাতা"-তে সংরক্ষিত Joining Date থেকে (pgGetEmployee_() পুনরায় ব্যবহার করে) প্রতি ১১ (LEAVE_ACCRUAL_DAYS) দিনের চাকরির মেয়াদে ১ দিন হিসাবে যোগ হয়।
Type এখন শুধু 'Taken' (ভোগ) বা 'Encashed' (নগদায়ন) — কোনো ম্যানুয়াল 'Earned' এন্ট্রি আর সমর্থিত নয়; পুরনো কোনো 'Earned' সারি থাকলে তা read-এর সময় নীরবে উপেক্ষা করা হয় (এরর দেয় না)।
সংরক্ষণের আগে যাচাই করা হয় যেন মোট (ভোগ + নগদায়ন) আজ পর্যন্ত অর্জিত ছুটির চেয়ে বেশি না হয়।
Leave শিটের কলাম কাঠামো অপরিবর্তিত: EntryID, Date, Type, Days, Balance, Notes (৬ কলাম)। শিটে যদি আগে থেকে ৭ম কলাম (যেমন EncashmentAmount) থেকে থাকে, সেটি স্পর্শ করা হয় না, শুধু ব্যবহার করা হয় না — কোনো ডেটা মুছে যাবে না।
Files changed: Server_Leave.gs (সম্পূর্ণ rewrite)। Page_PowerGrid.html অপরিবর্তিত — এটি আগে থেকেই সঠিক ফিল্ড-নাম/টাইপ প্রত্যাশা করছিল।
টেস্ট করা প্রয়োজন (deploy-এর পর):
Power Grid → বেতন ও ভাতা → Joining Date ঠিকমতো সেট আছে কিনা যাচাই।
ছুটির হিসাব ট্যাবে গিয়ে "চাকরির মেয়াদ" ও "মোট অর্জিত ছুটি" এখন সঠিক সংখ্যা দেখাচ্ছে কিনা (০ নয়)।
নতুন এন্ট্রি → "নগদায়ন" সিলেক্ট করে সংরক্ষণ করলে এখন সেভ হচ্ছে কিনা।
এন্ট্রি সংরক্ষণের পর "ভোগ/নগদায়নকৃত" ও "বর্তমান স্থিতি" কার্ড আপডেট হচ্ছে কিনা।
অর্জিত ছুটির চেয়ে বেশি দিন এন্ট্রি দিলে এখন যথাযথ এরর মেসেজ আসছে কিনা।
Project content
website making
Created by you
engrarifwebsite-dev/Website-Making-

main

GITHUB

Content
1790077638441_Page_PowerGrid.html

HTML

1790077657968_Server_Leave.gs

159 lines

GS

## 2026-09-22 (Session 10)

### Power Grid: "ছুটির হিসাব" — automatic leave accrual, taken vs encashment
- Earned leave is no longer entered manually. It is calculated automatically
  from the Joining Date already stored in "বেতন ও ভাতা" (Employment sheet,
  same value `pgGetEmployee_()` already returns) — 1 day of earned leave for
  every 11 days of service since joining (floor division). Editing the
  Joining Date in the "✏️ তথ্য সম্পাদনা" modal is picked up immediately the
  next time the ছুটির হিসাব tab loads — no separate sync step.
- Two entry types remain, both subtracting from the earned balance:
  - **ছুটি ভোগ (Taken)** — used leave, no payment.
  - **নগদায়ন (Encashment)** — cashed-out leave. Each day encashed pays an
    amount equal to ONE DAY's Basic Salary, computed as
    `latest Basic Salary (from the most recent বেতন ও ভাতা statement) ÷ 30`.
    The computed rate and amount are shown live in the entry form and stored
    per entry.
  - The old manual "Earned" entry type is removed from the UI. Saving now
    refuses to record more Taken+Encashment days than have actually accrued
    as of today, and refuses Encashment entirely if no salary statement with
    a Basic Salary exists yet.
- ছুটির হিসাব tab now shows: total accrued (auto), total taken + encashed,
  current balance, and total money received from encashment — plus an info
  banner with the joining date, the 11-day accrual rule, and the current
  daily Basic rate. It also warns clearly if no Joining Date is set yet.
- The entry table adds an "নগদায়ন (৳)" column; PDF and CSV exports for this
  tab include the encashment amounts, the accrual rule and the daily rate.
- Sheet schema: `Leave` (Power_Grid) gains a 7th column, `EncashmentAmount`.
  Added automatically to existing sheets by `leaveSheet_()` in
  `Server_Leave.gs`, and included for fresh installs in `Setup_PowerGrid.gs`.
  Any old `Type='Earned'` rows (from before this feature existed) are simply
  ignored on read — they cause no error, they're just superseded by the
  automatic calculation.
- Files changed: `Server_Leave.gs` (full rewrite), `Page_PowerGrid.html`
  (ছুটির হিসাব tab: markup, styles, script), `Setup_PowerGrid.gs` (Leave
  header list). No change to `Server_PowerGrid.gs` — it already exposed
  `pgGetEmployee_()`, `pgStatementSheet_()` and `pgMonthKey_()`, which the
  new leave logic reuses directly.

## 2026-09-22 (Session 09)

### Power Grid: Joining Date not saving (bug fix)
- Fixed: in বেতন ও ভাতা → সেলারি স্টেটমেন্ট card → "✏️ তথ্য সম্পাদনা", changing
  the Joining Date appeared not to save (it read back blank after a reload).
- Root cause: `savePowerGridEmployee()` stored Joining Date as a real `Date`
  object in the `Employment` tab with no explicit cell format. Every other
  date-like field in the same flow (NextIncrementDate) is deliberately
  stored as plain text specifically to avoid Google Sheets silently
  reformatting a Date-typed cell in a way the app's string-based date
  parser (`pgDateStr_()`) could no longer recognize on read-back.
- Fix: Joining Date is now stored as plain text (`setNumberFormat('@')` +
  the `'yyyy-MM-dd'` string) exactly like NextIncrementDate, instead of a
  `Date` object. Also removed an unnecessary `getLastRow() > 1` guard before
  reading the cell back in `pgGetEmployee_()`.
- If a Joining Date was already lost under the old code, no manual sheet
  repair is needed — re-entering and saving it once through the same edit
  modal stores it correctly from then on.
- Files changed: `Server_PowerGrid.gs` only. No HTML or sheet-schema change.

### Project memory files populated
- `SESSION_STATE.md`, `TASK_PROGRESS.md` and `NEXT_STEPS.md` were empty
  placeholders; they are now filled in following the format defined in
  `CLAUDE.md`, including a full captured spec for the still-unbuilt
  "ছুটির হিসাব" (Leave) tab so a future session can implement it without
  the rules needing to be re-explained.

## 2026-09-21

### Power Grid: CPF হিসাব tab and card rename
- The CPF card in the right column of "বেতন ও ভাতা" is renamed from
  "CPF বার্ষিক সারাংশ" to "CPF হিসাব". The year moved out of the title into a
  small chip beside it, and a new "সম্পূর্ণ CPF হিসাব দেখুন →" button opens the
  new tab.
- New subtab "CPF হিসাব" (between "বেতন ও ভাতা" and "ছুটির হিসাব"):
  - four cards (total CPF of all years, Employee's CPF, Company's CPF, total of
    the chosen year) and a "নতুন CPF এন্ট্রি" button;
  - monthly list for a chosen year (‹ › to change year), always showing all 12
    months with Employee, Company, total, running cumulative total (all years)
    and the source. A month with no record shows "＋ এন্ট্রি যোগ";
  - Employee's vs Company's monthly bar chart for that year;
  - year-by-year summary table (click a row to jump to that year);
  - Employee/Company ratio donut for the chosen year;
  - quick actions: this year's CPF summary (PDF), CPF list (Excel/CSV),
    earlier CPF entries list.
- Earlier CPF contributions (months without a salary statement) can be added,
  edited and deleted straight from the tab. A month that has a salary statement
  always takes its CPF from the statement (edit it through the statement).
- The existing "CPF সারাংশ (PDF)" quick action on the salary tab works as before.
- Files changed: `Page_PowerGrid.html` only. No server or sheet change; the tab
  uses the data `getPowerGridData` already returns.

### Power Grid: two tabs and Training Bill
- The Power Grid page now has subtabs: "বেতন ও ভাতা" (the existing salary
  statement, CPF summary and reports, unchanged) and "ছুটির হিসাব" (new tab,
  placeholder for now; its content comes in a later step).
- New earning line "Training Bill" (after Local Training) in the Earnings card,
  the entry form, the details modal, PDF and Excel export. It counts in Gross
  Salary and in Total Allowance.
- Stored in a new `TrainingBill` column (column 39) at the end of
  `SalaryStatements`; the header is added automatically and old rows read 0.
- Files changed: `Page_PowerGrid.html`, `Server_PowerGrid.gs`.
  The comments in `Server_PowerGrid.gs` now describe the new CPF rule.

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
  Calculator), Budget Management, Power Grid (salary, CPF and leave), Auth,
  app shell, all spreadsheet setups.
- In progress: none.
- Placeholder pages: Tax, Zakat, Prince Hisab, My Transactions,
  Emergency Documents, Islamic Corner, Assets, AI Hub, Settings.

## 2026-09-19

### Project Setup
- Created the GitHub repository.
- Added the initial README.md.
- Added PROJECT_CONTEXT.md.
- Established GitHub as the source of truth for the project.
