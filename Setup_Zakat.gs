/**
 * Setup_Zakat.gs
 * Creates all tabs + header rows for the Zakat_Fitra spreadsheet,
 * including a separate Wife_* set of tabs for the wife's own Zakat account.
 *
 * ------------------------------------------------------------------
 * NOTE (2026-10-03, Phase 10): যাকাত ও ফিতরা পেজের পূর্ণাঙ্গ ড্যাশবোর্ড
 * তৈরির সময় নিচের পরিবর্তনগুলো করা হয়েছে — আগের ৮টি ট্যাবের কোনোটিই
 * মোছা বা পুনর্গঠন করা হয়নি, শুধু কিছু ট্যাবে কলাম যোগ এবং দুটি নতুন
 * ট্যাব তৈরি করা হয়েছে (Setup_Assets.gs/Setup_EmergencyDocuments.gs-এর
 * "কলাম শেষে যোগ করা" প্যাটার্ন অনুসরণ করে, তাই পুরনো ডেটা অক্ষত থাকবে):
 *
 *   ZakatYears : HijriYear, StartedAt, ClosedAt যোগ (কলাম ৫-৭)। একটি সময়ে
 *                ঠিক একটি সারি Status='Active' থাকে — এটিই "চলমান বছর"।
 *                "বছর শেষে চূড়ান্ত হিসাব সম্পন্ন করুন" চাপলে এটি Closed
 *                হয়ে নতুন Active সারি তৈরি হয়। রমজান/ঈদের প্রকৃত তারিখ
 *                অনুমান করা হয় না বলে RamadanStart/RamadanEnd ফাঁকা থাকে।
 *   Assets     : CategoryID, Notes, UpdatedAt যোগ (কলাম ৭-৯)। AssetType
 *                কলামে ক্যাটাগরির নাম থাকে (সিঙ্কড থাকে)। SourceModule
 *                ম্যানুয়াল এন্ট্রির জন্য 'Manual' — future automation
 *                (Phase 17) অন্য মডিউল থেকে সিঙ্ক করলে ভিন্ন মান বসাতে
 *                পারবে, কলাম কাঠামো অপরিবর্তিত থাকায় কোনো সমস্যা হবে না।
 *   Payments   : Recipient যোগ (কলাম ৭) — অগ্রিম যাকাত কাকে/কোথায় দেওয়া
 *                হয়েছে তা রেকর্ড রাখতে।
 *   Fitra      : Date, CategoryName, Notes, PaymentID যোগ (কলাম ৫-৮)।
 *                আগে এই শিট এক বছরের একটি সারাংশ সারি হিসেবে ভাবা হয়েছিল,
 *                এখন এটি একটি লগ — প্রতিটি "ফিতরা প্রদান রেকর্ড করুন" চাপলে
 *                একটি নতুন সারি যোগ হয় (মূল ৪টি কলাম অপরিবর্তিত অর্থেই
 *                ব্যবহৃত হচ্ছে: ZakatYearID, FamilyMemberCount,
 *                PerPersonAmount, TotalAmount)।
 *   Loans_Given / Loans_Received / Wife_Assets / Wife_Payments : অপরিবর্তিত।
 *                Loans_Given/Loans_Received-কেই "দেনা-পাওনা (নেট)" হিসেবে
 *                ব্যবহার করা হচ্ছে — Loans_Given (আমি পাব) যাকাতযোগ্য সম্পদ
 *                হিসেবে যোগ হয়, Loans_Received (আমাকে দিতে হবে) নিট সম্পদ
 *                থেকে বিয়োগ হয়।
 *
 * নতুন ট্যাব:
 *   ZakatAssetCategories : CategoryID, Name, Icon, DisplayOrder, Zakatable
 *                           (TRUE/FALSE — কোন ক্যাটাগরি যাকাতের হিসাবে
 *                           ধরা হবে তা নির্ধারণ করে, যেমন ব্যক্তিগত
 *                           ব্যবহারের বাড়ি/গাড়ি বাদ দেওয়া যায়)।
 *                           ডিফল্ট ৮টি ক্যাটাগরি সিড করা হয়েছে।
 *   FitraRates            : RateID, CategoryName, AmountPerPerson,
 *                           DisplayOrder, UpdatedAt — ব্যবহারকারীর নিজের
 *                           সংরক্ষিত ফিতরা রেফারেন্স রেট (যেমন বাংলাদেশ
 *                           ইসলামিক ফাউন্ডেশনের ঘোষণা অনুযায়ী), প্রতি বছর
 *                           আপডেট করা যায়। ডিফল্ট ৫টি সারি সিড করা হয়েছে।
 * ------------------------------------------------------------------
 */
function setupZakatFitra() {
  var ss = SpreadsheetApp.openById(SPREADSHEET_IDS.Zakat_Fitra);

  var yearsSheet = ensureSheetWithHeaders(ss, 'ZakatYears', [
    'ZakatYearID', 'RamadanStart', 'RamadanEnd', 'Status'
  ]);
  var yearsExtra = ['HijriYear', 'StartedAt', 'ClosedAt'];
  var yearsFirstRow = yearsSheet.getRange(1, 5, 1, yearsExtra.length).getValues()[0];
  for (var yi = 0; yi < yearsExtra.length; yi++) {
    if (!yearsFirstRow[yi]) yearsSheet.getRange(1, 5 + yi).setValue(yearsExtra[yi]).setFontWeight('bold');
  }

  var assetsSheet = ensureSheetWithHeaders(ss, 'Assets', [
    'AssetID', 'SourceModule', 'SourceRecordID', 'AssetType', 'Value', 'LinkedAt'
  ]);
  var assetsExtra = ['CategoryID', 'Notes', 'UpdatedAt'];
  var assetsFirstRow = assetsSheet.getRange(1, 7, 1, assetsExtra.length).getValues()[0];
  for (var ai = 0; ai < assetsExtra.length; ai++) {
    if (!assetsFirstRow[ai]) assetsSheet.getRange(1, 7 + ai).setValue(assetsExtra[ai]).setFontWeight('bold');
  }

  ensureSheetWithHeaders(ss, 'Loans_Given', [
    'LoanID', 'Person', 'Amount', 'Date', 'Status', 'Outstanding'
  ]);

  ensureSheetWithHeaders(ss, 'Loans_Received', [
    'LoanID', 'Person', 'Amount', 'Date', 'Status', 'Outstanding'
  ]);

  var paymentsSheet = ensureSheetWithHeaders(ss, 'Payments', [
    'PaymentID', 'ZakatYearID', 'Date', 'Amount', 'Type', 'Notes'
  ]);
  var paymentsFirstCell = paymentsSheet.getRange(1, 7).getValue();
  if (!paymentsFirstCell) paymentsSheet.getRange(1, 7).setValue('Recipient').setFontWeight('bold');

  var fitraSheet = ensureSheetWithHeaders(ss, 'Fitra', [
    'ZakatYearID', 'FamilyMemberCount', 'PerPersonAmount', 'TotalAmount'
  ]);
  var fitraExtra = ['Date', 'CategoryName', 'Notes', 'PaymentID'];
  var fitraFirstRow = fitraSheet.getRange(1, 5, 1, fitraExtra.length).getValues()[0];
  for (var fi = 0; fi < fitraExtra.length; fi++) {
    if (!fitraFirstRow[fi]) fitraSheet.getRange(1, 5 + fi).setValue(fitraExtra[fi]).setFontWeight('bold');
  }

  // Wife's separate Zakat account (zakat only — fitra is counted once for the whole family above)
  ensureSheetWithHeaders(ss, 'Wife_Assets', [
    'AssetID', 'AssetType', 'Value', 'UpdatedAt'
  ]);
  ensureSheetWithHeaders(ss, 'Wife_Payments', [
    'PaymentID', 'ZakatYearID', 'Date', 'Amount', 'Type', 'Notes'
  ]);

  ensureSheetWithHeaders(ss, 'ZakatAssetCategories', [
    'CategoryID', 'Name', 'Icon', 'DisplayOrder', 'Zakatable'
  ]);
  zakatSeedDefaultCategories_(ss);

  ensureSheetWithHeaders(ss, 'FitraRates', [
    'RateID', 'CategoryName', 'AmountPerPerson', 'DisplayOrder', 'UpdatedAt'
  ]);
  zakatSeedDefaultFitraRates_(ss);

  removeDefaultSheet1(ss);
  Logger.log('Zakat_Fitra setup complete.');
}

/**
 * Seeds the default asset-category set ONLY if the tab is completely
 * empty — never touches it again after that, so categories (including
 * the Zakatable TRUE/FALSE flag) can be freely added/edited/deleted.
 * "বসতবাড়ি/ব্যক্তিগত ব্যবহারের সম্পদ" is seeded as Zakatable=FALSE
 * since personal-use property is not normally zakatable; others TRUE.
 */
function zakatSeedDefaultCategories_(ss) {
  var sheet = ss.getSheetByName('ZakatAssetCategories');
  if (sheet.getLastRow() > 1) return;

  var defaults = [
    ['নগদ টাকা', '💵', true],
    ['ব্যাংক ও সঞ্চয়', '🏦', true],
    ['সোনাদানা (স্বর্ণ)', '💍', true],
    ['রৌপ্য', '⚪', true],
    ['ব্যবসায়িক পণ্য/মাল', '📦', true],
    ['বিনিয়োগ (শেয়ার/ফান্ড/সঞ্চয়পত্র)', '📈', true],
    ['বসতবাড়ি/ব্যক্তিগত ব্যবহারের সম্পদ', '🏠', false],
    ['অন্যান্য সম্পদ', '📁', true]
  ];
  defaults.forEach(function (d, i) {
    sheet.appendRow([generateUniqueId('ZCAT'), d[0], d[1], i + 1, d[2]]);
  });
}

/**
 * Seeds a starter set of Fitra reference rates ONLY if FitraRates is
 * completely empty. These are reference values the project owner edits
 * each year from the page itself (amounts change annually and vary by
 * announcing body) — never re-seeded or overwritten after the first run.
 */
function zakatSeedDefaultFitraRates_(ss) {
  var sheet = ss.getSheetByName('FitraRates');
  if (sheet.getLastRow() > 1) return;

  var now = new Date();
  var defaults = [
    ['গম/আটা', 120],
    ['যব', 360],
    ['খেজুর', 1440],
    ['কিসমিস', 2160],
    ['পনির', 1800]
  ];
  defaults.forEach(function (d, i) {
    sheet.appendRow([generateUniqueId('FRATE'), d[0], d[1], i + 1, now]);
  });
}
