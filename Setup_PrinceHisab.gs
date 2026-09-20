/**
 * Setup_PrinceHisab.gs
 * Creates the Ledger tab for the Prince_Hisab spreadsheet.
 */
function setupPrinceHisab() {
  var ss = SpreadsheetApp.openById(SPREADSHEET_IDS.Prince_Hisab);

  ensureSheetWithHeaders(ss, 'Ledger', [
    'EntryID', 'Date', 'Type', 'Amount', 'PurposeOrMethod', 'RunningBalance', 'ZakatLinkID'
  ]);

  removeDefaultSheet1(ss);
  Logger.log('Prince_Hisab setup complete.');
}
