/**
 * Server_Home.gs
 * Premium Home dashboard support.
 *
 * Keeps the existing data contract used by Page_Home:
 * - getHomeConfig()
 * - getMonthlyHolidays(year, month)
 *
 * Live clock, Hijri/Bengali date, prayer times and weather remain
 * client-side so the dashboard stays responsive.
 */

function getHomeConfig() {
  var map = readSettingsMap_();
  return {
    lat: parseFloat(map.LocationLat || '22.3596'),
    lng: parseFloat(map.LocationLng || '90.3298'),
    locationName: map.LocationName || 'পটুয়াখালী',
    prayerMethod: map.PrayerMethod || '1',
    prayerSchool: map.PrayerSchool || '1'
  };
}

function readSettingsMap_() {
  var ss = SpreadsheetApp.openById(SPREADSHEET_IDS.Settings);
  var sheet = ss.getSheetByName('Global');
  if (!sheet) return {};

  var data = sheet.getDataRange().getValues();
  var map = {};

  for (var i = 1; i < data.length; i++) {
    var key = data[i][1];
    if (key) map[String(key).trim()] = data[i][2];
  }
  return map;
}

/**
 * Returns slideshow image METADATA ONLY (no base64) from the
 * HomeSlideshow Drive folder — fast, so the client can render the card
 * and start the timer immediately, then stream in each image separately.
 * Sorted by filename (name files "01-...", "02-..." to control order).
 * A file's Drive "description" field is used as an optional caption —
 * editable directly in Drive's file info panel, no extra sheet needed.
 */
function getHomeSlideshowMeta() {
  var folder = DriveApp.getFolderById(DRIVE_FOLDER_IDS.HomeSlideshow);
  var files = folder.getFiles();
  var results = [];

  while (files.hasNext()) {
    var file = files.next();
    if (file.getMimeType().indexOf('image/') !== 0) continue;

    results.push({
      id: file.getId(),
      name: file.getName(),
      caption: file.getDescription() || ''
    });
  }

  results.sort(function (a, b) { return a.name.localeCompare(b.name); });
  return results;
}

/**
 * Returns this month's government holidays from Settings > Holidays.
 * The Holidays sheet remains manually maintained.
 *
 * Expected columns:
 * A = Date
 * B = Holiday name
 */
function getMonthlyHolidays(year, month) {
  var ss = SpreadsheetApp.openById(SPREADSHEET_IDS.Settings);
  var sheet = ss.getSheetByName('Holidays');
  if (!sheet) return [];

  var data = sheet.getDataRange().getValues();
  var results = [];

  for (var i = 1; i < data.length; i++) {
    if (!data[i][0]) continue;

    var date = data[i][0] instanceof Date
      ? data[i][0]
      : new Date(data[i][0]);

    if (isNaN(date.getTime())) continue;

    if (date.getFullYear() === Number(year) &&
        (date.getMonth() + 1) === Number(month)) {
      results.push({
        date: Utilities.formatDate(date, 'Asia/Dhaka', 'd MMM'),
        name: data[i][1] ? String(data[i][1]) : ''
      });
    }
  }

  results.sort(function(a, b) {
    return a.date.localeCompare(b.date, 'en');
  });

  return results;
}
