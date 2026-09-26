/**
 * Setup_Budget.gs
 * Creates the Banks tab plus the current month's 4 tabs
 * (Income / Budget / Expense / Ledger) for Budget_Management.
 * Future months are created by Automation later (Phase 17) using
 * createBudgetMonthTabs() below — safe to call again for any month.
 *
 * IMPORTANT: Server_Budget.gs (saveBudgetCategory -> budgetEnsureMonth_,
 * and every other function that opens/creates a month's tabs) calls
 * createBudgetMonthTabs() directly, so this file MUST be present in the
 * Apps Script project (all .gs files share one global scope) — if it is
 * ever missing, every budget action that needs a month tab fails with:
 *   ReferenceError: createBudgetMonthTabs is not defined
 */
function setupBudgetManagement() {
  var ss = SpreadsheetApp.openById(SPREADSHEET_IDS.Budget_Management);

  ensureSheetWithHeaders(ss, 'Banks', [
    'BankID', 'BankName', 'AccountNo', 'Balance', 'UpdatedAt'
  ]);

  createBudgetMonthTabs(ss, getCurrentBengaliMonthLabel());

  removeDefaultSheet1(ss);
  Logger.log('Budget_Management setup complete.');
}

/**
 * Creates the 4 tabs for a given "<Month Year>" label,
 * e.g. "সেপ্টেম্বর ২০২৬". Safe to call again for the same month.
 */
function createBudgetMonthTabs(ss, monthLabel) {
  ensureSheetWithHeaders(ss, monthLabel + ' - Income', [
    'TxnID', 'Date', 'Time', 'Source', 'Amount', 'BankID', 'Notes', 'GlobalSyncID'
  ]);
  ensureSheetWithHeaders(ss, monthLabel + ' - Budget', [
    'CategoryID', 'CategoryName', 'BudgetAmount', 'ThresholdWarning', 'ThresholdCritical'
  ]);
  ensureSheetWithHeaders(ss, monthLabel + ' - Expense', [
    'TxnID', 'Date', 'Time', 'CategoryID', 'Description', 'Amount', 'BankID'
  ]);
  ensureSheetWithHeaders(ss, monthLabel + ' - Ledger', [
    'TxnID', 'Date', 'Time', 'Description', 'Debit', 'Credit', 'RunningBalance'
  ]);
}

/** Returns e.g. "সেপ্টেম্বর ২০২৬" for the current Asia/Dhaka date. */
function getCurrentBengaliMonthLabel() {
  var bengaliMonths = [
    'জানুয়ারি', 'ফেব্রুয়ারি', 'মার্চ', 'এপ্রিল', 'মে', 'জুন',
    'জুলাই', 'আগস্ট', 'সেপ্টেম্বর', 'অক্টোবর', 'নভেম্বর', 'ডিসেম্বর'
  ];
  var tz = 'Asia/Dhaka';
  var now = new Date();
  var monthIndex = parseInt(Utilities.formatDate(now, tz, 'M'), 10) - 1;
  var year = Utilities.formatDate(now, tz, 'yyyy');
  return bengaliMonths[monthIndex] + ' ' + year;
}
