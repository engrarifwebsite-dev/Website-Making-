/**
 * Setup_SYS_Master.gs
 * Creates all tabs + header rows for the SYS_Master spreadsheet.
 * Safe to run multiple times.
 */
function setupSYSMaster() {
  var ss = SpreadsheetApp.openById(SPREADSHEET_IDS.SYS_Master);

  ensureSheetWithHeaders(ss, 'Users', [
    'UserID', 'Name', 'Email', 'PasswordHash', 'Salt',
    'ProfilePhotoFileID', 'Status', 'CreatedAt', 'UpdatedAt'
  ]);

  ensureSheetWithHeaders(ss, 'Sessions', [
    'SessionID', 'UserID', 'Token', 'Device', 'IP',
    'CreatedAt', 'ExpiresAt', 'LoggedOutAt'
  ]);

  ensureSheetWithHeaders(ss, 'LoginActivity', [
    'LogID', 'UserID', 'Timestamp', 'Device', 'IP', 'Result', 'SuspiciousFlag'
  ]);

  ensureSheetWithHeaders(ss, 'ID_Registry', [
    'RecordID', 'Module', 'RelatedSheet', 'CreatedAt'
  ]);

  ensureSheetWithHeaders(ss, 'AuditLog', [
    'LogID', 'UserID', 'Module', 'Action', 'RecordID', 'Timestamp', 'Details'
  ]);

  ensureSheetWithHeaders(ss, 'AppConfig', [
    'Key', 'Value', 'UpdatedAt'
  ]);

  removeDefaultSheet1(ss);
  Logger.log('SYS_Master setup complete.');
}
