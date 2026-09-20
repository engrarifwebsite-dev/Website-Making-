/**
 * Setup_EmergencyDocuments.gs
 * Creates the My / Family / Official tabs for Emergency_Documents.
 * Note: actual encryption of IDNumberEncrypted / PasswordEncrypted values
 * is handled by Page_EmergencyDocuments.gs (Phase 12), not by this setup file.
 */
function setupEmergencyDocuments() {
  var ss = SpreadsheetApp.openById(SPREADSHEET_IDS.Emergency_Documents);

  var columns = [
    'RecordID', 'Owner', 'IDName', 'IDNumberEncrypted', 'PasswordEncrypted',
    'DocumentFileID', 'CreatedAt', 'UpdatedAt', 'Notes'
  ];

  ensureSheetWithHeaders(ss, 'My', columns);
  ensureSheetWithHeaders(ss, 'Family', columns);
  ensureSheetWithHeaders(ss, 'Official', columns);

  removeDefaultSheet1(ss);
  Logger.log('Emergency_Documents setup complete.');
}
