/**
 * Setup_Zakat.gs
 * Creates all tabs + header rows for the Zakat_Fitra spreadsheet,
 * including a separate Wife_* set of tabs for the wife's own Zakat account.
 */
function setupZakatFitra() {
  var ss = SpreadsheetApp.openById(SPREADSHEET_IDS.Zakat_Fitra);

  ensureSheetWithHeaders(ss, 'ZakatYears', [
    'ZakatYearID', 'RamadanStart', 'RamadanEnd', 'Status'
  ]);

  ensureSheetWithHeaders(ss, 'Assets', [
    'AssetID', 'SourceModule', 'SourceRecordID', 'AssetType', 'Value', 'LinkedAt'
  ]);

  ensureSheetWithHeaders(ss, 'Loans_Given', [
    'LoanID', 'Person', 'Amount', 'Date', 'Status', 'Outstanding'
  ]);

  ensureSheetWithHeaders(ss, 'Loans_Received', [
    'LoanID', 'Person', 'Amount', 'Date', 'Status', 'Outstanding'
  ]);

  ensureSheetWithHeaders(ss, 'Payments', [
    'PaymentID', 'ZakatYearID', 'Date', 'Amount', 'Type', 'Notes'
  ]);

  ensureSheetWithHeaders(ss, 'Fitra', [
    'ZakatYearID', 'FamilyMemberCount', 'PerPersonAmount', 'TotalAmount'
  ]);

  // Wife's separate Zakat account
  ensureSheetWithHeaders(ss, 'Wife_Assets', [
    'AssetID', 'AssetType', 'Value', 'UpdatedAt'
  ]);
  ensureSheetWithHeaders(ss, 'Wife_Payments', [
    'PaymentID', 'ZakatYearID', 'Date', 'Amount', 'Type', 'Notes'
  ]);

  removeDefaultSheet1(ss);
  Logger.log('Zakat_Fitra setup complete.');
}
