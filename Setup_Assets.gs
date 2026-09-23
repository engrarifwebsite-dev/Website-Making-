/**
 * Setup_Assets.gs
 * Creates/extends the tabs for the Assets_Items spreadsheet
 * (আমার সম্পদ ও সামগ্রী, Phase 14). Safe to run multiple times —
 * ensureSheetWithHeaders() never touches existing rows, and the new
 * columns below are only appended if they don't already exist, so
 * re-running this never erases data you've already entered.
 *
 * ParentAssetID links a supporting/sub item (e.g. a bike helmet) to its
 * main asset — used by the "মেইন ও সাব এসেট" card on the dashboard.
 */
function setupAssetsItems() {
  var ss = SpreadsheetApp.openById(SPREADSHEET_IDS.Assets_Items);

  var sheet = ensureSheetWithHeaders(ss, 'Assets', [
    'AssetID', 'ProductName', 'PurchasePrice', 'PurchaseDate', 'Warranty',
    'SerialNumber', 'PhotoFileID', 'Condition', 'Location',
    'SalvageValue', 'UsefulLifeYears', 'ParentAssetID', 'Notes'
  ]);

  // Phase 14 additions — appended AFTER the original 13 columns so nothing
  // already saved (including ParentAssetID-linked sub-assets) is disturbed.
  // Column 5 "Warranty" is interpreted as WarrantyMonths (months of cover
  // from PurchaseDate) by Server_Assets.gs.
  var extraHeaders = ['Category', 'Brand', 'Model', 'CreatedAt', 'UpdatedAt'];
  var firstRow = sheet.getRange(1, 14, 1, extraHeaders.length).getValues()[0];
  for (var i = 0; i < extraHeaders.length; i++) {
    if (!firstRow[i]) sheet.getRange(1, 14 + i).setValue(extraHeaders[i]).setFontWeight('bold');
  }

  ensureSheetWithHeaders(ss, 'Categories', ['CategoryID', 'Name', 'Icon', 'DisplayOrder']);
  seedDefaultAssetCategories_(ss);

  ensureSheetWithHeaders(ss, 'Maintenance', ['MaintID', 'AssetID', 'Date', 'Description', 'Cost', 'CreatedAt']);
  ensureSheetWithHeaders(ss, 'Documents', ['DocID', 'AssetID', 'DocName', 'FileID', 'UploadedAt']);

  removeDefaultSheet1(ss);
  Logger.log('Assets_Items setup complete.');
}

/**
 * Seeds the default category set (matching the approved dashboard design)
 * ONLY if the Categories tab is completely empty — never touches it again
 * after that, so you can freely add/edit/delete/reorder categories.
 */
function seedDefaultAssetCategories_(ss) {
  var sheet = ss.getSheetByName('Categories');
  if (sheet.getLastRow() > 1) return; // already has content — don't touch

  var defaults = [
    ['মোবাইল/ট্যাব', '📱'],
    ['ল্যাপটপ', '💻'],
    ['ইলেকট্রনিক্স', '🖥️'],
    ['আসবাবপত্র', '🛋️'],
    ['যানবাহন', '🚗'],
    ['যন্ত্রপাতি', '🛠️'],
    ['ক্যামেরা', '📷']
  ];
  defaults.forEach(function (d, i) {
    sheet.appendRow([generateUniqueId('CAT'), d[0], d[1], i + 1]);
  });
}
