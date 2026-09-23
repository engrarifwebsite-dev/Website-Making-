# TODO

## Completed
- [x] GitHub repository setup
- [x] README.md, PROJECT_CONTEXT.md, CHANGELOG.md
- [x] Docs synced with the codebase (page name "Power Grid" now consistent everywhere)
- [x] Project architecture (Apps Script web app, includes-based templates)
- [x] Database structure (13 spreadsheets, Setup_*.gs files, Setup_RunAll.gs)
- [x] Website UI structure (sidebar, header, footer, modals, toasts, subtabs)
- [x] Authentication (setup, login, logout, change password, sessions, login log)
- [x] Home page (clock, dates, prayer times, weather, slideshow)
- [x] Personal Information: Profile (with independent photo)
- [x] Personal Information: Education timeline
- [x] Personal Information: Education documents (upload, download, delete per qualification)
- [x] Personal Information: Family Tree UI (photo + name branches, details popup, add branch/spouse, edit, delete)
- [x] Personal Information: Age Calculator (green age cards with photo/name and live ticking age; two-date calculator)
- [x] Global footer: live date, time and weather bar (replaced the hadith rotation)
- [x] Budget Management: dashboard, categories, goal, income/expense entries, PDF/Excel export
- [x] Power Grid: salary statements, CPF annual summary and earlier CPF entries, PDF/Excel export (Phase 8, first part)
- [x] Power Grid: CPF card rule (Employee's = CPF Deduction − Employer's Contribution) and removal of the info note card
- [x] Power Grid: two subtabs ("বেতন ও ভাতা", "ছুটির হিসাব") and the Training Bill earning line
- [x] My Assets & Items: dashboard, categories, warranty, maintenance, documents, main/sub assets (Phase 14)`

## In Progress
- (none)

## Pending (by phase)
- [ ] Power Grid: CPF Loan and Increment sections (Phase 8, remaining part)
- [ ] Tax (Phase 9)
- [ ] Zakat & Fitra (Phase 10)
- [ ] Prince Account (Phase 11)
- [ ] My Transactions (Phase 11)
- [ ] Emergency Documents (Phase 12)
- [ ] Islamic Corner (Phase 13)
- [ ] AI Assistant Hub (Phase 15)
- [ ] Settings (Phase 16)
- [ ] Automation and cross-module refinements (Phase 17)

## Known Follow-ups (small items found while reviewing the code)
- [ ] Show `getMonthlyHolidays()` data on the Home page; the server function exists but nothing calls it.
- [ ] Apply the `HijriAdjustment` setting on the Home page; it is seeded in Settings but not used yet.
- [ ] Sidebar footer still says "Version 1.0 · Phase 3"; update it.
- [ ] The Family Tree UI file is listed as `Page_FamilyTree.html` but `Index.html` includes `Partial_FamilyTree`; make sure the file name in Apps Script matches the include.
- [ ] `Server_FamilyTree.gs` calls `trashDriveFile_`, but it is not defined in any file reviewed so far; confirm it exists in the repo (deleting a family member with a photo fails without it).
- [ ] Age Calculator: the date of birth of a saved card cannot be edited (by design); the hidden file input created for each add/edit modal is never removed (minor).
- [ ] Add the `EducationDocuments`, `AgeCards` and `FamilyMembers` (with ParentMemberID, SpouseMemberID) tabs to `Setup_PersonalInfo.gs`. `EducationDocuments` and `AgeCards` are created automatically on first use.
- [ ] Do not add a separate `Partial_AgeCalculator` include: the calculator already lives inside `Page_PersonalInfo.html` and a second one creates a duplicate tab.
- [ ] `Stylesheet_Global.html` still has the old `.app-footer*` rules (unused now); delete them when convenient.
- [ ] Decide whether `Server_Footer.gs` (`getFooterHadiths`) is still needed or should move to the Islamic Corner page (Phase 13).
- [ ] Suspicious-login detection in `logLoginActivity_` (planned for Phase 17).
- [ ] Budget: link entries to Banks (BankID) and update bank balances.
- [ ] Budget: sync Salary (Power Grid) into monthly Income using GlobalSyncID (Phase 17).
- [ ] Budget: carry the Ledger running balance across months.
- [ ] Add the SavingsGoals tab to `Setup_Budget.gs` (currently created on first use).
- [ ] Power Grid: sync the net salary into the Budget monthly Income using GlobalSyncID (Phase 17).
- [ ] Power Grid: add the `SalaryStatements`, `EmployeeInfo` and `CPFHistory` tabs to `Setup_PowerGrid.gs` (currently created on first use).
- [ ] Power Grid: "মোট ভাতা" is calculated as total earnings minus basic salary; confirm this is the intended definition.
- [ ] Power Grid: the comments in `Server_PowerGrid.gs` (header and `PG_EXTRA_FIELDS`) still say the employee's CPF is the CPF Deduction; update them to the new rule (Employee's = CPF Deduction − Employer's Contribution). Comments only, no code change.
- [ ] Power Grid: check old salary statements once; the CPF Deduction of each month should include the employer's share, otherwise the Employee's CPF shows too low.
