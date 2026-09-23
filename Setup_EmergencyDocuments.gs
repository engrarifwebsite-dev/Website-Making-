/**
 * Setup_EmergencyDocuments.gs
 * Creates/extends the tabs for the Emergency_Documents spreadsheet
 * (জরুরি ডকুমেন্টস, Phase 12).
 *
 * NOTE (2026-09-23): The original stub for this phase created 'My' /
 * 'Family' / 'Official' tabs (RecordID, Owner, IDName, IDNumberEncrypted,
 * PasswordEncrypted, DocumentFileID, ...) for a per-person encrypted ID/
 * password vault design. The project owner has now given a different,
 * concrete design for this page — a category-based document library
 * (see Page_EmergencyDocuments.html) — so this phase is built on new
 * 'Categories' / 'Documents' / 'ActivityLog' tabs instead. The old three
 * tabs are still created (nothing is deleted — safe if they already hold
 * data) but the new page does not read/write them. Revisit later if the
 * ID/password vault idea is still wanted as a separate feature.
 *
 * Safe to run multiple times — ensureSheetWithHeaders() never touches
 * existing rows, and the default categories are only seeded once.
 */
function setupEmergencyDocuments() {
  var ss = SpreadsheetApp.openById(SPREADSHEET_IDS.Emergency_Documents);

  // ---- Legacy stub tabs (kept, untouched, in case they already hold data) ----
  var legacyColumns = [
    'RecordID', 'Owner', 'IDName', 'IDNumberEncrypted', 'PasswordEncrypted',
    'DocumentFileID', 'CreatedAt', 'UpdatedAt', 'Notes'
  ];
  ensureSheetWithHeaders(ss, 'My', legacyColumns);
  ensureSheetWithHeaders(ss, 'Family', legacyColumns);
  ensureSheetWithHeaders(ss, 'Official', legacyColumns);

  // ---- New tabs for the category-based document library (Phase 12 design) ----
  ensureSheetWithHeaders(ss, 'Categories', ['CategoryID', 'Name', 'Icon', 'DisplayOrder']);
  seedDefaultDocumentCategories_(ss);

  ensureSheetWithHeaders(ss, 'Documents', [
    'DocID', 'Name', 'CategoryID', 'FileID', 'MimeType', 'SizeBytes',
    'Important', 'UploadedAt', 'UpdatedAt', 'Notes'
  ]);

  ensureSheetWithHeaders(ss, 'ActivityLog', [
    'LogID', 'DocID', 'DocName', 'Action', 'Timestamp'
  ]);

  removeDefaultSheet1(ss);
  Logger.log('Emergency_Documents setup complete.');
}

/**
 * Seeds the default category set (matching the approved dashboard design)
 * ONLY if the Categories tab is completely empty — never touches it again
 * after that, so categories can be freely added/edited/deleted/reordered.
 */
function seedDefaultDocumentCategories_(ss) {
  var sheet = ss.getSheetByName('Categories');
  if (sheet.getLastRow() > 1) return; // already has content — don't touch

  var defaults = [
    ['ব্যক্তিগত', '👤'],
    ['শিক্ষা', '🎓'],
    ['চাকরি', '💼'],
    ['সম্পত্তি', '🏠'],
    ['ব্যাংক/আর্থিক', '🏦'],
    ['বীমা', '🛡️'],
    ['যানবাহন', '🚗'],
    ['স্বাস্থ্য', '❤️'],
    ['অন্যান্য', '📁']
  ];
  defaults.forEach(function (d, i) {
    sheet.appendRow([generateUniqueId('DCAT'), d[0], d[1], i + 1]);
  });
}
