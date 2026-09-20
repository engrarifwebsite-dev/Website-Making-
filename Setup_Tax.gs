/**
 * Setup_Tax.gs
 * Creates the current year's 3 tabs (Summary / RuleConfig / Planning)
 * for the Tax spreadsheet. Future years use createTaxYearTabs() below.
 */
function setupTax() {
  var ss = SpreadsheetApp.openById(SPREADSHEET_IDS.Tax);
  var year = Utilities.formatDate(new Date(), 'Asia/Dhaka', 'yyyy');

  createTaxYearTabs(ss, year);

  removeDefaultSheet1(ss);
  Logger.log('Tax setup complete.');
}

/** Creates the 3 tabs for a given tax year, e.g. "2026". */
function createTaxYearTabs(ss, year) {
  ensureSheetWithHeaders(ss, year + ' - Summary', [
    'Income', 'TaxDeducted', 'CPF', 'Investment',
    'EligibleInvestment', 'TaxableIncome', 'CalculatedTax'
  ]);

  ensureSheetWithHeaders(ss, year + ' - RuleConfig', [
    'SlabFrom', 'SlabTo', 'Rate', 'RebateRule'
  ]);

  ensureSheetWithHeaders(ss, year + ' - Planning', [
    'ScenarioID', 'InvestmentAmount', 'EstimatedTax'
  ]);
}
