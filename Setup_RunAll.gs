/**
 * Setup_RunAll.gs
 * Run this ONE function once to set up all 13 spreadsheets in a single click.
 * Safe to re-run any time — existing tabs/headers are left untouched,
 * so re-running never erases data you've already entered.
 *
 * How to run:
 * 1. In the Apps Script editor, select "setupAllSpreadsheets" from the
 *    function dropdown at the top.
 * 2. Click "Run".
 * 3. The first time, Google will ask you to authorize access — approve it
 *    (it's your own script accessing your own spreadsheets).
 * 4. Check "Execution log" for the success message.
 */
function setupAllSpreadsheets() {
  setupSYSMaster();
  setupPersonalInfo();
  setupBudgetManagement();
  setupPowerGrid();
  setupTax();
  setupZakatFitra();
  setupPrinceHisab();
  setupMyTransactions();
  setupEmergencyDocuments();
  setupAssetsItems();
  setupIslamicCorner();
  setupAIHub();
  setupSettings();

  Logger.log('✅ All 13 spreadsheets set up successfully.');
}
