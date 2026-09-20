# CHANGELOG

## 2026-09-20

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
- Each document has a download button (served through the server with a
  session check, so the Drive files stay private) and a delete button
  (the Drive file goes to the trash, so it can be recovered).
- `setEducationList()` now keeps an entry's ID when the list is re-saved,
  so attached documents stay linked. Removing an entry also removes its
  documents (files go to the Drive trash); the edit modal warns about this.
- New server functions: `getEducationDocuments`, `uploadEducationDocument`,
  `getEducationDocumentData`, `deleteEducationDocument`.
- Files changed: `Server_PersonalInfo.gs`, `Page_PersonalInfo.html`
  (the new styles live inside the page file; `Stylesheet_Global.html`
  is unchanged).

### Documentation Sync
- Synced CHANGELOG.md and TODO.md with the actual state of the codebase.
  Both files previously stated that application development had not started.
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
- Family Tree server functions ready: `listFamilyMembers`,
  `saveFamilyMember`, `deleteFamilyMember`.

### Current Status
- Completed: Home, Personal Info (Profile and Education), Auth, app shell,
  all spreadsheet setups.
- In progress: Family Tree UI (server ready, UI is still a placeholder).
- Placeholder pages: Budget, Power Grid, Tax, Zakat, Prince Hisab,
  My Transactions, Emergency Documents, Islamic Corner, Assets, AI Hub,
  Settings.

## 2026-09-19

### Project Setup
- Created the GitHub repository.
- Added the initial README.md.
- Added PROJECT_CONTEXT.md.
- Established GitHub as the source of truth for the project.
