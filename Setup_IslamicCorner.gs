/**
 * Setup_IslamicCorner.gs
 * Creates the Preferences, Cache, and Hadiths tabs for Islamic_Corner.
 * Safe to run multiple times — seeding never overwrites hadiths you've
 * already edited or added, it only adds the starter set if the tab is
 * completely empty.
 */
function setupIslamicCorner() {
  var ss = SpreadsheetApp.openById(SPREADSHEET_IDS.Islamic_Corner);

  ensureSheetWithHeaders(ss, 'Preferences', [
    'Madhhab', 'HijriMethod', 'PrayerCalcMethod', 'Location'
  ]);

  ensureSheetWithHeaders(ss, 'Cache', [
    'DataType', 'Content', 'LastFetched'
  ]);

  ensureSheetWithHeaders(ss, 'Hadiths', [
    'Text', 'Reference'
  ]);
  seedDefaultHadiths_(ss);

  removeDefaultSheet1(ss);
  Logger.log('Islamic_Corner setup complete.');
}

/**
 * Seeds a starter set of well-known hadiths ONLY if the Hadiths tab is
 * completely empty (no rows beyond the header) — never touches it again
 * after that, so you can freely add/edit/delete rows in this sheet and
 * it will always be respected. Add as many more rows as you like any time.
 */
function seedDefaultHadiths_(ss) {
  var sheet = ss.getSheetByName('Hadiths');
  if (sheet.getLastRow() > 1) return; // already has content — don't touch

  var starterHadiths = [
    ['নিশ্চয়ই প্রতিটি কাজ নিয়তের ওপর নির্ভরশীল, আর প্রত্যেক ব্যক্তি তা-ই পাবে যা সে নিয়ত করেছে।', 'সহীহ বুখারী, হাদিস নং ১'],
    ['প্রকৃত মুসলিম সে-ই, যার জিহ্বা ও হাত থেকে অন্য মুসলিমরা নিরাপদ থাকে।', 'সহীহ বুখারী'],
    ['তোমাদের মধ্যে সে-ই সর্বোত্তম, যে কুরআন শেখে এবং অন্যকে শেখায়।', 'সহীহ বুখারী'],
    ['যে ব্যক্তি আল্লাহ ও শেষ দিনের প্রতি বিশ্বাস রাখে, সে যেন ভালো কথা বলে অথবা নীরব থাকে।', 'সহীহ বুখারী ও মুসলিম'],
    ['নিশ্চয় আল্লাহ তোমাদের শারীরিক আকৃতি ও সম্পদের দিকে তাকান না, বরং তিনি তাকান তোমাদের অন্তর ও আমলের দিকে।', 'সহীহ মুসলিম'],
    ['তোমাদের মধ্যে সর্বোত্তম ব্যক্তি সে, যে তার পরিবারের কাছে সর্বোত্তম।', 'জামে তিরমিযী'],
    ['তোমার ভাইয়ের সাথে হাসিমুখে সাক্ষাৎ করাও একটি সদকা।', 'জামে তিরমিযী'],
    ['দ্বীন হলো কল্যাণ কামনা (নাসীহাত) — আল্লাহর জন্য, তাঁর কিতাবের জন্য, তাঁর রাসূলের জন্য এবং মুসলিম জনসাধারণের জন্য।', 'সহীহ মুসলিম'],
    ['আল্লাহ তাআলা তাঁর বান্দার তওবায় তোমাদের কারো হারানো বাহন ফিরে পাওয়ার চেয়েও বেশি আনন্দিত হন।', 'সহীহ বুখারী ও মুসলিম'],
    ['মুমিন ব্যক্তি একই গর্তে দু\'বার দংশিত হয় না।', 'সহীহ বুখারী ও মুসলিম']
  ];

  var now = new Date();
  starterHadiths.forEach(function (row) {
    sheet.appendRow([row[0], row[1]]);
  });
}
