/**
 * Utils_Sheets.gs
 * Shared helper functions used by all Setup_*.gs files.
 * Keep this file generic — no page-specific logic here.
 */

/**
 * Ensures a tab with the given name exists in the spreadsheet.
 * If it doesn't exist, creates it and writes the header row.
 * If it already exists and already has a header row, existing data
 * (including any rows you've already entered) is left untouched.
 * Safe to run multiple times.
 */
function ensureSheetWithHeaders(spreadsheet, sheetName, headers) {
  var sheet = spreadsheet.getSheetByName(sheetName);
  if (!sheet) {
    sheet = spreadsheet.insertSheet(sheetName);
  }
  var firstRow = sheet.getRange(1, 1, 1, headers.length).getValues()[0];
  var isEmpty = firstRow.join('') === '';
  if (isEmpty) {
    sheet.getRange(1, 1, 1, headers.length).setValues([headers]);
    sheet.setFrozenRows(1);
    sheet.getRange(1, 1, 1, headers.length).setFontWeight('bold');
  }
  return sheet;
}

/**
 * Deletes the default empty "Sheet1" tab once at least one other tab exists.
 * Safe no-op if Sheet1 has already been removed, renamed, or has data.
 */
function removeDefaultSheet1(spreadsheet) {
  var sheet1 = spreadsheet.getSheetByName('Sheet1');
  if (sheet1 && spreadsheet.getSheets().length > 1) {
    var hasData = sheet1.getDataRange().getValues().join('') !== '';
    if (!hasData) {
      spreadsheet.deleteSheet(sheet1);
    }
  }
}
