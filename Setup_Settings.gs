/**
 * Setup_Settings.gs
 * Creates the Global + Holidays tabs for the Settings spreadsheet, and
 * seeds sensible default values (location, prayer calculation method)
 * WITHOUT overwriting anything the user has already changed.
 * Safe to run multiple times.
 */
function setupSettings() {
  var ss = SpreadsheetApp.openById(SPREADSHEET_IDS.Settings);

  ensureSheetWithHeaders(ss, 'Global', [
    'Category', 'Key', 'Value'
  ]);

  ensureSheetWithHeaders(ss, 'Holidays', [
    'Date', 'HolidayName'
  ]);

  // Defaults for the Home dashboard (Phase 5): location + prayer method.
  // Location defaults to Patuakhali; change the Value cell in the
  // "Global" tab any time — Home page reads it live, nothing is hardcoded.
  seedDefaultSetting_(ss, 'Location', 'LocationName', 'পটুয়াখালী');
  seedDefaultSetting_(ss, 'Location', 'LocationLat', '22.3596');
  seedDefaultSetting_(ss, 'Location', 'LocationLng', '90.3298');
  // Aladhan method 1 = University of Islamic Sciences, Karachi (commonly used in Bangladesh)
  seedDefaultSetting_(ss, 'Islamic', 'PrayerMethod', '1');
  // school=1 = Hanafi (later Asr start time); school=0 would be Shafi/Maliki/Hanbali
  seedDefaultSetting_(ss, 'Islamic', 'PrayerSchool', '1');
  // +/- day correction for local moon-sighting differences vs Aladhan's calculated Hijri date.
  // Change this Value in the Global tab if the Hijri date is consistently off by a day.
  seedDefaultSetting_(ss, 'Islamic', 'HijriAdjustment', '0');

  removeDefaultSheet1(ss);
  Logger.log('Settings setup complete.');
}

/**
 * Adds a default Key/Value row only if that Key doesn't already exist.
 * Never overwrites a value the user has already customized.
 */
function seedDefaultSetting_(ss, category, key, value) {
  var sheet = ss.getSheetByName('Global');
  var data = sheet.getDataRange().getValues();
  for (var i = 1; i < data.length; i++) {
    if (data[i][1] === key) return;
  }
  sheet.appendRow([category, key, value]);
}
