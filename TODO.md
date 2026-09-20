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
- [x] Personal Information: Family Tree UI (colourful tree, photo + name, click photo for details popup, add branch / spouse, edit, delete)
- [x] Global footer hadith rotation

## In Progress
- (none)

## Pending (by phase)
- [ ] Budget Management (Phase 7)
- [ ] Power Grid: Salary, CPF, Leave, Increment (Phase 8)
- [ ] Tax (Phase 9)
- [ ] Zakat & Fitra (Phase 10)
- [ ] Prince Account (Phase 11)
- [ ] My Transactions (Phase 11)
- [ ] Emergency Documents (Phase 12)
- [ ] Islamic Corner (Phase 13)
- [ ] My Assets & Items (Phase 14)
- [ ] AI Assistant Hub (Phase 15)
- [ ] Settings (Phase 16)
- [ ] Automation and cross-module refinements (Phase 17)

## Known Follow-ups (small items found while reviewing the code)
- [ ] Show `getMonthlyHolidays()` data on the Home page; the server function exists but nothing calls it.
- [ ] Apply the `HijriAdjustment` setting on the Home page; it is seeded in Settings but not used yet.
- [ ] Sidebar footer still says "Version 1.0 · Phase 3"; update it.
- [ ] `Page_FamilyTree.html` is an old placeholder and is not included in Index.html; remove it.
- [ ] Family Tree markup lives in `Partial_FamilyTree.html` and is moved into the Personal Info "ফ্যামিলি ট্রি" subtab at load time. When convenient, replace the placeholder inside `Page_PersonalInfo.html` (`#subtab-family-tree`) with `<?!= include('Partial_FamilyTree'); ?>` and remove the include from `Index.html`.
- [ ] Add the `EducationDocuments` tab to `Setup_PersonalInfo.gs` (columns: DocID, EducationID, DocType, FileName, FileID, MimeType, SizeBytes, UploadedAt). It is currently created automatically on first use.
- [ ] Suspicious-login detection in `logLoginActivity_` (planned for Phase 17).
