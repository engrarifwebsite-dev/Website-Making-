/**
 * Setup_Assets.gs
 * Creates the Assets tab for the Assets_Items spreadsheet.
 * ParentAssetID links a supporting item (e.g. bicycle horn) to its main asset.
 */
function setupAssetsItems() {
  var ss = SpreadsheetApp.openById(SPREADSHEET_IDS.Assets_Items);

  ensureSheetWithHeaders(ss, 'Assets', [
    'AssetID', 'ProductName', 'PurchasePrice', 'PurchaseDate', 'Warranty',
    'SerialNumber', 'PhotoFileID', 'Condition', 'Location',
    'SalvageValue', 'UsefulLifeYears', 'ParentAssetID', 'Notes'
  ]);

  removeDefaultSheet1(ss);
  Logger.log('Assets_Items setup complete.');
}
