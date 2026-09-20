/**
 * Server_Footer.gs
 * Serves the hadith list used by the global footer (shown on every page).
 * The list lives in Islamic_Corner > Hadiths — add, edit, or delete rows
 * there any time; no code changes needed to update the rotation content.
 */
function getFooterHadiths() {
  var sheet = SpreadsheetApp.openById(SPREADSHEET_IDS.Islamic_Corner).getSheetByName('Hadiths');
  if (!sheet) return [];

  var data = sheet.getDataRange().getValues();
  var results = [];
  for (var i = 1; i < data.length; i++) {
    if (!data[i][0]) continue;
    results.push({ text: data[i][0], reference: data[i][1] || '' });
  }
  return results;
}
