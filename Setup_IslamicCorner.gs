/**
 * Setup_IslamicCorner.gs
 * Creates all tabs for Islamic_Corner. Safe to run multiple times — every
 * seed function below only writes starter rows the FIRST time a tab is
 * completely empty; it never touches rows you've already added or edited.
 *
 * Existing tabs (from earlier phases, UNCHANGED):
 *   Preferences, Cache, Hadiths (with seeded starter hadiths)
 *
 * New tabs for "ইসলামিক কর্নার" (Phase 13):
 *   Events          - user-maintained Islamic dates (Ramadan start, Eid,
 *                      Ashura, Shab-e-Barat, ...). Left EMPTY on purpose —
 *                      these dates depend on moon sighting / government
 *                      announcement and change every year, so they are not
 *                      guessed here. Add them from the page each year.
 *   Packages        - user-maintained Hajj/Umrah cost estimates + source.
 *                      Left EMPTY on purpose for the same reason (these
 *                      change every year and need a verified source).
 *   FastingCalendar - নফল/সুন্নত/ওয়াজিব রোজার তালিকা. Seeded with ONE
 *                      general, non-date-specific reminder (weekly Monday +
 *                      Thursday nafl fast) — the only entry here that is not
 *                      time-sensitive. Everything else (Ayyamul Bid, Arafah,
 *                      Ashura fast, Shab-e-Barat) is added by the user via
 *                      the page, same reasoning as Events above.
 *   QuranProgress   - Key/Value: last-read Surah/Para/Ayat/Page.
 *   KhatmLog        - one row per completed Khatm.
 *   ChecklistDone   - which daily checklist items are done, per date.
 *   Tasbih          - saved counter (Count/Target/Dhikr) so it survives reload.
 *   LibraryLinks    - the 6 fixed library categories shown on the page;
 *                      each starts with an empty URL until you add your own.
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

  ensureSheetWithHeaders(ss, 'Events', [
    'EventID', 'Name', 'Date', 'Notes'
  ]);

  ensureSheetWithHeaders(ss, 'Packages', [
    'PackageID', 'Type', 'Title', 'AmountText', 'Source', 'UpdatedAt'
  ]);

  ensureSheetWithHeaders(ss, 'FastingCalendar', [
    'EntryID', 'Date', 'Recurring', 'Name', 'Type'
  ]);
  seedDefaultFasting_(ss);

  ensureSheetWithHeaders(ss, 'QuranProgress', [
    'Key', 'Value', 'UpdatedAt'
  ]);

  ensureSheetWithHeaders(ss, 'KhatmLog', [
    'KhatmID', 'CompletedDate'
  ]);

  ensureSheetWithHeaders(ss, 'ChecklistDone', [
    'Date', 'ItemKey'
  ]);

  ensureSheetWithHeaders(ss, 'Tasbih', [
    'Key', 'Value', 'UpdatedAt'
  ]);

  ensureSheetWithHeaders(ss, 'LibraryLinks', [
    'Key', 'Name', 'Icon', 'Url', 'UpdatedAt'
  ]);
  seedDefaultLibraryLinks_(ss);

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

  starterHadiths.forEach(function (row) {
    sheet.appendRow([row[0], row[1]]);
  });
}

/**
 * Seeds ONLY the general weekly-Nafl-fast reminder (Monday + Thursday),
 * which is not tied to a specific date and so is safe to pre-fill. Runs
 * once, only if FastingCalendar is completely empty.
 */
function seedDefaultFasting_(ss) {
  var sheet = ss.getSheetByName('FastingCalendar');
  if (sheet.getLastRow() > 1) return;

  var id = generateUniqueId('FST');
  sheet.appendRow([id, '', 'Mon,Thu', 'সাপ্তাহিক নফল রোজা (সোম ও বৃহস্পতিবার)', 'নফল রোজা']);
}

/**
 * Seeds the 6 fixed library categories shown on the Islamic Corner page,
 * each with an empty URL (fill in your own trusted resource link from the
 * page later). Runs once, only if LibraryLinks is completely empty.
 */
function seedDefaultLibraryLinks_(ss) {
  var sheet = ss.getSheetByName('LibraryLinks');
  if (sheet.getLastRow() > 1) return;

  var defaults = [
    ['quran', 'কুরআন মাজিদ', '📗'],
    ['hadith', 'হাদিস গ্রন্থ', '📘'],
    ['dua', 'দোয়ার বই', '💧'],
    ['amol', 'আমলের বই', '📝'],
    ['app', 'ইসলামিক অ্যাপ', '⚠️'],
    ['video', 'ভিডিও লেকচার', '🎬']
  ];
  var now = new Date();
  defaults.forEach(function (d) {
    sheet.appendRow([d[0], d[1], d[2], '', now]);
  });
}
