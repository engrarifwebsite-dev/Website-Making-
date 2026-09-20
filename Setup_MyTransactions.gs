/**
 * Setup_MyTransactions.gs
 * Creates the Payable and Receivable tabs for My_Transactions.
 */
function setupMyTransactions() {
  var ss = SpreadsheetApp.openById(SPREADSHEET_IDS.My_Transactions);

  var columns = [
    'TxnID', 'Name', 'Phone', 'Address', 'Date',
    'Purpose', 'Amount', 'DueDate', 'Paid', 'Remaining'
  ];

  ensureSheetWithHeaders(ss, 'Payable', columns);
  ensureSheetWithHeaders(ss, 'Receivable', columns);

  removeDefaultSheet1(ss);
  Logger.log('My_Transactions setup complete.');
}
