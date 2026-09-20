/**
 * Setup_PowerGrid.gs
 * Creates all tabs + header rows for the Power_Grid spreadsheet.
 * Safe to run multiple times.
 */
function setupPowerGrid() {
  var ss = SpreadsheetApp.openById(SPREADSHEET_IDS.Power_Grid);

  ensureSheetWithHeaders(ss, 'Employment', [
    'JoiningDate', 'ResignationDate'
  ]);

  ensureSheetWithHeaders(ss, 'CPF', [
    'Date', 'BasicSalary', 'EmployeeContribution', 'OrgContribution', 'Balance'
  ]);

  ensureSheetWithHeaders(ss, 'CPF_Loan', [
    'LoanID', 'Amount', 'Date', 'Purpose', 'Installment', 'Tenure',
    'PaidAmount', 'RemainingAmount', 'OfficeOrderFileID'
  ]);

  ensureSheetWithHeaders(ss, 'Leave', [
    'EntryID', 'Date', 'Type', 'Days', 'Balance', 'Notes'
  ]);

  ensureSheetWithHeaders(ss, 'Salary', [
    'Month', 'Basic', 'HouseRent', 'Medical', 'Transport', 'Incentive', 'Bonus',
    'NewYearAllowance', 'SpecialAllowance', 'WPPWFM', 'OtherAllowance', 'GlobalSyncID'
  ]);

  ensureSheetWithHeaders(ss, 'Increment', [
    'Year', 'OldBasic', 'IncrementPercent', 'NewBasic', 'EffectiveDate'
  ]);

  removeDefaultSheet1(ss);
  Logger.log('Power_Grid setup complete.');
}
