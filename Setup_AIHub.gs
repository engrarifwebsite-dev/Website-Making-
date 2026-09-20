/**
 * Setup_AIHub.gs
 * Creates the Cards tab for the AI_Hub spreadsheet.
 */
function setupAIHub() {
  var ss = SpreadsheetApp.openById(SPREADSHEET_IDS.AI_Hub);

  ensureSheetWithHeaders(ss, 'Cards', [
    'AIName', 'LogoFileIDOrURL', 'Description', 'OfficialURL', 'DisplayOrder'
  ]);

  removeDefaultSheet1(ss);
  Logger.log('AI_Hub setup complete.');
}
