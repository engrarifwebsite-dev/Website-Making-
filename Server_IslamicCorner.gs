/**
 * Server_IslamicCorner.gs
 * Server support for the ইসলামিক কর্নার page (Page_IslamicCorner.html), Phase 13.
 *
 * Tabs used in the Islamic_Corner spreadsheet (all created by
 * Setup_IslamicCorner.gs — run setupIslamicCorner() once after adding this
 * file, safe to re-run):
 *   Hadiths          - reused from the earlier footer feature (Server_Footer.gs)
 *   Events           - EventID, Name, Date, Notes            (user-maintained)
 *   Packages         - PackageID, Type, Title, AmountText, Source, UpdatedAt
 *   FastingCalendar  - EntryID, Date, Recurring, Name, Type
 *   QuranProgress    - Key, Value, UpdatedAt (SurahName/SurahNumber/Para/Ayat/Page)
 *   KhatmLog         - KhatmID, CompletedDate
 *   ChecklistDone    - Date, ItemKey  (which of the fixed daily items are ticked)
 *   Tasbih           - Key, Value, UpdatedAt (Count/Target/Dhikr)
 *   LibraryLinks     - Key, Name, Icon, Url, UpdatedAt
 *
 * Prayer times, the Hijri date and the Islamic (Hijri) calendar are fetched
 * client-side straight from the Aladhan API, the same way Page_Home.html and
 * Partial_Footer.html already do — no server function needed for those.
 * The Qibla direction is a plain geodesic bearing calculation done in the
 * browser, so it needs no server call or external API either.
 *
 * Location (lat/lng/name) and prayer method/school come from
 * getHomeConfig() (Server_Home.gs), the same source the Home dashboard uses,
 * so changing it once in Settings > Global updates both pages.
 *
 * Requires: Config.gs, Auth.gs (validateSession), Utils_ID.gs
 * (generateUniqueId), Utils_Sheets.gs (ensureSheetWithHeaders),
 * Server_Home.gs (getHomeConfig), Server_Footer.gs (getFooterHadiths).
 * Every function needs a valid session token.
 */

var IC_TZ = 'Asia/Dhaka';

var IC_CHECKLIST_ITEMS = [
  ['fajr', 'ফজরের নামাজ পড়া'],
  ['telawat', 'কুরআন তিলাওয়াত'],
  ['istighfar', 'ইস্তিগফার ১০০ বার'],
  ['durood', 'দুরুদ শরীফ পাঠ'],
  ['kahf', 'সূরা কাহফ তিলাওয়াত (জুমার দিন)']
];

/* ============================================================
 * Small helpers
 * ============================================================ */

function icSs_() { return SpreadsheetApp.openById(SPREADSHEET_IDS.Islamic_Corner); }

function icAuth_(token) {
  var user = validateSession(token);
  if (!user) throw new Error('সেশন মেয়াদোত্তীর্ণ হয়ে গেছে, আবার লগইন করুন।');
  return user;
}

function icDateStr_(v) {
  if (!v) return '';
  if (v instanceof Date) return Utilities.formatDate(v, IC_TZ, 'yyyy-MM-dd');
  var s = String(v).trim();
  var m = /^(\d{4}-\d{2}-\d{2})/.exec(s);
  return m ? m[1] : s;
}

function icToday_() { return Utilities.formatDate(new Date(), IC_TZ, 'yyyy-MM-dd'); }

function icEventsSheet_() { return ensureSheetWithHeaders(icSs_(), 'Events', ['EventID', 'Name', 'Date', 'Notes']); }
function icPackagesSheet_() { return ensureSheetWithHeaders(icSs_(), 'Packages', ['PackageID', 'Type', 'Title', 'AmountText', 'Source', 'UpdatedAt']); }
function icFastingSheet_() { return ensureSheetWithHeaders(icSs_(), 'FastingCalendar', ['EntryID', 'Date', 'Recurring', 'Name', 'Type']); }
function icQuranSheet_() { return ensureSheetWithHeaders(icSs_(), 'QuranProgress', ['Key', 'Value', 'UpdatedAt']); }
function icKhatmSheet_() { return ensureSheetWithHeaders(icSs_(), 'KhatmLog', ['KhatmID', 'CompletedDate']); }
function icChecklistDoneSheet_() { return ensureSheetWithHeaders(icSs_(), 'ChecklistDone', ['Date', 'ItemKey']); }
function icTasbihSheet_() { return ensureSheetWithHeaders(icSs_(), 'Tasbih', ['Key', 'Value', 'UpdatedAt']); }
function icLibrarySheet_() { return ensureSheetWithHeaders(icSs_(), 'LibraryLinks', ['Key', 'Name', 'Icon', 'Url', 'UpdatedAt']); }

/** Reads a Key/Value sheet (QuranProgress, Tasbih) into a plain object. */
function icReadKV_(sheet) {
  var data = sheet.getDataRange().getValues();
  var map = {};
  for (var i = 1; i < data.length; i++) {
    if (data[i][0]) map[String(data[i][0])] = data[i][1];
  }
  return map;
}

/** Upserts one Key/Value row (QuranProgress, Tasbih). */
function icSetKV_(sheet, key, value) {
  var data = sheet.getDataRange().getValues();
  var now = new Date();
  for (var i = 1; i < data.length; i++) {
    if (String(data[i][0]) === key) {
      sheet.getRange(i + 1, 2).setValue(value);
      sheet.getRange(i + 1, 3).setValue(now);
      return;
    }
  }
  sheet.appendRow([key, value, now]);
}

/* ============================================================
 * Dashboard — one call returns everything the page needs
 * ============================================================ */

function getIslamicCornerData(token) {
  icAuth_(token);

  var events = [];
  var ed = icEventsSheet_().getDataRange().getValues();
  for (var i = 1; i < ed.length; i++) {
    if (!ed[i][0]) continue;
    events.push({ id: String(ed[i][0]), name: String(ed[i][1] || ''), date: icDateStr_(ed[i][2]), notes: String(ed[i][3] || '') });
  }

  var packages = [];
  var pd = icPackagesSheet_().getDataRange().getValues();
  for (var j = 1; j < pd.length; j++) {
    if (!pd[j][0]) continue;
    packages.push({ id: String(pd[j][0]), type: String(pd[j][1] || ''), title: String(pd[j][2] || ''), amountText: String(pd[j][3] || ''), source: String(pd[j][4] || ''), updatedAt: icDateStr_(pd[j][5]) });
  }

  var fasting = [];
  var fd = icFastingSheet_().getDataRange().getValues();
  for (var k = 1; k < fd.length; k++) {
    if (!fd[k][0]) continue;
    fasting.push({ id: String(fd[k][0]), date: icDateStr_(fd[k][1]), recurring: String(fd[k][2] || ''), name: String(fd[k][3] || ''), type: String(fd[k][4] || '') });
  }

  // Full hadith list + today's index — the client shows today's pick by
  // default and can step through the rest with "আরও হাদিস দেখুন".
  var hadithList = [];
  var hadithTodayIndex = 0;
  try {
    hadithList = getFooterHadiths() || [];
    if (hadithList.length) {
      var startOfYear = new Date(new Date().getFullYear(), 0, 0);
      var doy = Math.floor((Date.now() - startOfYear.getTime()) / 86400000);
      hadithTodayIndex = doy % hadithList.length;
    }
  } catch (e) { hadithList = []; }

  var qMap = icReadKV_(icQuranSheet_());

  var khatm = [];
  var kd = icKhatmSheet_().getDataRange().getValues();
  for (var m = 1; m < kd.length; m++) {
    if (kd[m][0]) khatm.push({ id: String(kd[m][0]), date: icDateStr_(kd[m][1]) });
  }
  khatm.sort(function (a, b) { return a.date < b.date ? 1 : (a.date > b.date ? -1 : 0); });

  var doneToday = {};
  var today = icToday_();
  var cdd = icChecklistDoneSheet_().getDataRange().getValues();
  for (var n = 1; n < cdd.length; n++) {
    if (icDateStr_(cdd[n][0]) === today && cdd[n][1]) doneToday[String(cdd[n][1])] = true;
  }

  var tMap = icReadKV_(icTasbihSheet_());

  var library = [];
  var ld = icLibrarySheet_().getDataRange().getValues();
  for (var p = 1; p < ld.length; p++) {
    if (!ld[p][0]) continue;
    library.push({ key: String(ld[p][0]), name: String(ld[p][1] || ''), icon: String(ld[p][2] || '📘'), url: String(ld[p][3] || '') });
  }

  var homeCfg = {};
  try { homeCfg = getHomeConfig(); } catch (e2) { homeCfg = {}; }

  return {
    location: homeCfg,
    events: events,
    packages: packages,
    fasting: fasting,
    hadiths: hadithList,
    hadithTodayIndex: hadithTodayIndex,
    checklistItems: IC_CHECKLIST_ITEMS.map(function (x) { return { key: x[0], label: x[1] }; }),
    checklistDone: doneToday,
    quran: {
      surahName: qMap.SurahName || '', surahNumber: qMap.SurahNumber || '',
      para: qMap.Para || '', ayat: qMap.Ayat || '', page: qMap.Page || ''
    },
    khatmCount: khatm.length,
    khatmHistory: khatm.slice(0, 10),
    tasbih: { count: Number(tMap.Count) || 0, target: Number(tMap.Target) || 33, dhikr: tMap.Dhikr || 'সুবহানাল্লাহ' },
    library: library
  };
}

/* ============================================================
 * Events (আসন্ন ইসলামিক তারিখ)
 * ============================================================ */

/** ev = { id (blank for new), name, date 'yyyy-MM-dd', notes } */
function saveIslamicEvent(token, ev) {
  icAuth_(token);
  ev = ev || {};

  var name = String(ev.name || '').trim();
  if (!name) throw new Error('অনুষ্ঠানের নাম আবশ্যক।');
  var date = String(ev.date || '').trim();
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) throw new Error('সঠিক তারিখ দিন।');
  var notes = String(ev.notes || '').trim().substring(0, 300);

  var sheet = icEventsSheet_();
  var id = ev.id ? String(ev.id) : '';

  if (id) {
    var data = sheet.getDataRange().getValues();
    for (var i = 1; i < data.length; i++) {
      if (String(data[i][0]) === id) {
        sheet.getRange(i + 1, 2).setValue(name);
        sheet.getRange(i + 1, 3).setNumberFormat('@').setValue(date);
        sheet.getRange(i + 1, 4).setValue(notes);
        return id;
      }
    }
    throw new Error('তারিখটি পাওয়া যায়নি।');
  }

  id = generateUniqueId('EVT');
  var row = sheet.getLastRow() + 1;
  sheet.getRange(row, 3).setNumberFormat('@');
  sheet.getRange(row, 1, 1, 4).setValues([[id, name, date, notes]]);
  return id;
}

function deleteIslamicEvent(token, id) {
  icAuth_(token);
  var sheet = icEventsSheet_();
  var data = sheet.getDataRange().getValues();
  for (var i = 1; i < data.length; i++) {
    if (String(data[i][0]) === String(id)) { sheet.deleteRow(i + 1); return true; }
  }
  return false;
}

/* ============================================================
 * Packages (হজ / উমরাহ প্যাকেজ)
 * ============================================================ */

/** pkg = { id (blank for new), type 'Hajj'|'Umrah', title, amountText, source } */
function saveIslamicPackage(token, pkg) {
  icAuth_(token);
  pkg = pkg || {};

  var type = pkg.type === 'Umrah' ? 'Umrah' : 'Hajj';
  var title = String(pkg.title || '').trim();
  if (!title) throw new Error('প্যাকেজের নাম আবশ্যক।');
  var amountText = String(pkg.amountText || '').trim();
  if (!amountText) throw new Error('খরচের পরিমাণ লিখুন।');
  var source = String(pkg.source || '').trim();
  var now = new Date();

  var sheet = icPackagesSheet_();
  var id = pkg.id ? String(pkg.id) : '';

  if (id) {
    var data = sheet.getDataRange().getValues();
    for (var i = 1; i < data.length; i++) {
      if (String(data[i][0]) === id) {
        sheet.getRange(i + 1, 2, 1, 4).setValues([[type, title, amountText, source]]);
        sheet.getRange(i + 1, 6).setValue(now);
        return id;
      }
    }
    throw new Error('প্যাকেজটি পাওয়া যায়নি।');
  }

  id = generateUniqueId('PKG');
  sheet.appendRow([id, type, title, amountText, source, now]);
  return id;
}

function deleteIslamicPackage(token, id) {
  icAuth_(token);
  var sheet = icPackagesSheet_();
  var data = sheet.getDataRange().getValues();
  for (var i = 1; i < data.length; i++) {
    if (String(data[i][0]) === String(id)) { sheet.deleteRow(i + 1); return true; }
  }
  return false;
}

/* ============================================================
 * Fasting calendar (রোজা/ফাস্টিং ক্যালেন্ডার)
 * ============================================================ */

/** entry = { id (blank for new), date 'yyyy-MM-dd' or '' (blank if recurring), recurring 'Mon,Thu' or '', name, type } */
function saveFastingEntry(token, entry) {
  icAuth_(token);
  entry = entry || {};

  var name = String(entry.name || '').trim();
  if (!name) throw new Error('রোজার নাম আবশ্যক।');
  var date = String(entry.date || '').trim();
  var recurring = String(entry.recurring || '').trim();
  if (!date && !recurring) throw new Error('তারিখ দিন অথবা সাপ্তাহিক দিন নির্বাচন করুন।');
  if (date && !/^\d{4}-\d{2}-\d{2}$/.test(date)) throw new Error('সঠিক তারিখ দিন।');
  var type = String(entry.type || 'নফল রোজা').trim();

  var sheet = icFastingSheet_();
  var id = entry.id ? String(entry.id) : '';

  if (id) {
    var data = sheet.getDataRange().getValues();
    for (var i = 1; i < data.length; i++) {
      if (String(data[i][0]) === id) {
        sheet.getRange(i + 1, 2).setNumberFormat('@').setValue(date);
        sheet.getRange(i + 1, 3, 1, 3).setValues([[recurring, name, type]]);
        return id;
      }
    }
    throw new Error('এন্ট্রিটি পাওয়া যায়নি।');
  }

  id = generateUniqueId('FST');
  var row = sheet.getLastRow() + 1;
  sheet.getRange(row, 2).setNumberFormat('@');
  sheet.getRange(row, 1, 1, 5).setValues([[id, date, recurring, name, type]]);
  return id;
}

function deleteFastingEntry(token, id) {
  icAuth_(token);
  var sheet = icFastingSheet_();
  var data = sheet.getDataRange().getValues();
  for (var i = 1; i < data.length; i++) {
    if (String(data[i][0]) === String(id)) { sheet.deleteRow(i + 1); return true; }
  }
  return false;
}

/* ============================================================
 * Quran progress + Khatm tracker
 * ============================================================ */

/** progress = { surahName, surahNumber, para, ayat, page } */
function saveQuranProgress(token, progress) {
  icAuth_(token);
  progress = progress || {};
  var sheet = icQuranSheet_();
  icSetKV_(sheet, 'SurahName', String(progress.surahName || '').trim());
  icSetKV_(sheet, 'SurahNumber', String(progress.surahNumber || '').trim());
  icSetKV_(sheet, 'Para', String(progress.para || '').trim());
  icSetKV_(sheet, 'Ayat', String(progress.ayat || '').trim());
  icSetKV_(sheet, 'Page', String(progress.page || '').trim());
  return true;
}

/** Records one completed Khatm and returns the refreshed count + history. */
function markKhatmComplete(token) {
  icAuth_(token);
  var sheet = icKhatmSheet_();
  var id = generateUniqueId('KHT');
  var now = new Date();
  sheet.getRange(sheet.getLastRow() + 1, 2).setNumberFormat('@');
  sheet.appendRow([id, Utilities.formatDate(now, IC_TZ, 'yyyy-MM-dd')]);

  var data = sheet.getDataRange().getValues();
  var history = [];
  for (var i = 1; i < data.length; i++) {
    if (data[i][0]) history.push({ id: String(data[i][0]), date: icDateStr_(data[i][1]) });
  }
  history.sort(function (a, b) { return a.date < b.date ? 1 : -1; });
  return { khatmCount: history.length, khatmHistory: history.slice(0, 10) };
}

/* ============================================================
 * Daily checklist (দৈনিক দোয়া ও আমল)
 * ============================================================ */

/** Toggles one item for today. Returns true if now done, false if now un-done. */
function toggleChecklistItem(token, itemKey) {
  icAuth_(token);
  itemKey = String(itemKey || '').trim();
  if (!itemKey) throw new Error('আইটেম পাওয়া যায়নি।');

  var sheet = icChecklistDoneSheet_();
  var today = icToday_();
  var data = sheet.getDataRange().getValues();

  for (var i = 1; i < data.length; i++) {
    if (icDateStr_(data[i][0]) === today && String(data[i][1]) === itemKey) {
      sheet.deleteRow(i + 1);
      return false;
    }
  }
  sheet.getRange(sheet.getLastRow() + 1, 1).setNumberFormat('@');
  sheet.appendRow([today, itemKey]);
  return true;
}

/* ============================================================
 * Tasbih counter (তাসবিহ কাউন্টার)
 * ============================================================ */

/** state = { count, target, dhikr } */
function saveTasbih(token, state) {
  icAuth_(token);
  state = state || {};
  var sheet = icTasbihSheet_();
  icSetKV_(sheet, 'Count', Math.max(0, Number(state.count) || 0));
  icSetKV_(sheet, 'Target', Math.max(1, Number(state.target) || 33));
  icSetKV_(sheet, 'Dhikr', String(state.dhikr || 'সুবহানাল্লাহ').trim().substring(0, 60));
  return true;
}

/* ============================================================
 * Library links (ইসলামিক লাইব্রেরি) — 6 fixed categories, editable URL
 * ============================================================ */

/** key must match one of the categories seeded by Setup_IslamicCorner.gs. */
function saveLibraryLink(token, key, url) {
  icAuth_(token);
  key = String(key || '').trim();
  if (!key) throw new Error('ক্যাটাগরি পাওয়া যায়নি।');
  url = String(url || '').trim();
  if (url && !/^https?:\/\//i.test(url)) throw new Error('লিংকটি http:// অথবা https:// দিয়ে শুরু হতে হবে।');

  var sheet = icLibrarySheet_();
  var data = sheet.getDataRange().getValues();
  for (var i = 1; i < data.length; i++) {
    if (String(data[i][0]) === key) {
      sheet.getRange(i + 1, 4).setValue(url);
      sheet.getRange(i + 1, 5).setValue(new Date());
      return true;
    }
  }
  throw new Error('ক্যাটাগরিটি পাওয়া যায়নি।');
}
