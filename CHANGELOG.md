# CHANGELOG

## 2026-09-20

### Age Calculator (Personal Information > এজ ক্যালকুলেটর)
- New subtab next to ফ্যামিলি ট্রি: pick two dates and get the exact age in
  years, months and days.
- Also shows total months, weeks, days and hours, the weekday of the start
  date, and the days left until the next birthday (Feb 29 births are handled).
- "আজ" fills today's date; "আমার জন্ম তারিখ" pulls the DOB saved in the
  Profile; results update as soon as a date changes.
- Runs fully in the browser; no server code needed.
- New file: `Partial_AgeCalculator.html`. `Index.html` gets one more include line.
  The partial adds its own subtab button and panel to the Personal Info page at
  load time, so `Page_PersonalInfo.html` is unchanged.

### Family Tree (Personal Information > ফ্যামিলি ট্রি)
- New colourful family tree: every branch shows a round photo (gender-coloured
  ring) and the name; each generation has its own line/name colour. Couples are
  shown side by side with a heart link, children hang below them.
- Click a photo to open a popup with birth year (and full date), death year,
  age (age at death for deceased members), gender/status, parent, spouse,
  children and notes. Click the same photo again (or anywhere else, or Esc)
  to hide it.
- "+" on each photo adds a new branch under that member; the toolbar button adds
  a new root member; the popup also has edit, add spouse and delete.
- Deceased members show a grey ring, greyscale photo and a dove badge.
- Zoom in/out/reset for large trees, and summary chips (total, living,
  deceased, generations).
- Photos are resized in the browser (max 600px) before upload.
- New files: `Partial_FamilyTree.html`, `Server_FamilyTree.gs`.
  `Index.html` now includes the partial (one added line).
  `Page_PersonalInfo.html` and `Server_PersonalInfo.gs` are unchanged.
- New server functions: `saveFamilyTreeMember` (keeps spouse links two-way,
  blocks a member from becoming a child of their own descendant) and
  `deleteFamilyTreeMember` (refuses if the member still has children, clears the
  spouse link, sends the photo to the Drive trash).

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
- Footer hadith rotation every 5 minutes, sourced from the
  Islamic_Corner > Hadiths sheet.

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
- Family Tree server functions: `listFamilyMembers`,
  `saveFamilyMember`, `deleteFamilyMember`.

### Current Status
- Completed: Home, Personal Info (Profile, Education, Family Tree), Auth,
  app shell, all spreadsheet setups.
- In progress: none.
- Placeholder pages: Budget, Power Grid, Tax, Zakat, Prince Hisab,
  My Transactions, Emergency Documents, Islamic Corner, Assets, AI Hub,
  Settings.

## 2026-09-19

### Project Setup
- Created the GitHub repository.
- Added the initial README.md.
- Added PROJECT_CONTEXT.md.
- Established GitHub as the source of truth for the project.
