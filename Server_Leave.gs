/**
 * Server_Leave.gs
 * Server support for the পাওয়ার গ্রিড page (Page_PowerGrid.html), tab "ছুটির হিসাব".
 *
 * ------------------------------------------------------------------
 * NOTE (2026-09-22, Session 12): ১৮০ দিনের সীমা + কাছাকাছি-সীমা এলার্ট +
 * সরলীকৃত এন্ট্রি-ভিত্তিক স্থিতি সূত্র যোগ করা হয়েছে।
 *
 *   1. "বর্তমান স্থিতি" (usable/available balance) কখনো ১৮০ দিনের বেশি
 *      দেখানো হবে না (LEAVE_MAX_BALANCE)। এর বেশি অর্জিত হলে বাড়তি অংশ
 *      "forfeitedDays" হিসেবে আলাদা রিপোর্ট হয় (জমা রাখা যাবে না, কিন্তু
 *      হারিয়ে যাওয়ার তথ্য হিসেবে দেখানো যায়)।
 *      "মোট অর্জিত ছুটি" (totalEarned) কার্ডটি অপরিবর্তিত — এটি এখনো
 *      প্রকৃত সঞ্চিত (সীমাহীন) সংখ্যা দেখায়, শুধু "বর্তমান স্থিতি"
 *      (usable balance) ১৮০-তে বাঁধা।
 *   2. বর্তমান স্থিতি ১৭০ দিন বা তার বেশি (কিন্তু ১৮০-এর নিচে) হলে
 *      nearCap = true পাঠানো হয়, ১৮০ ছুঁয়ে ফেললে capReached = true।
 *      ফ্রন্টএন্ড এই দুটি ফ্ল্যাগ দিয়ে সতর্কতা ব্যানার দেখাতে পারে।
 *   3. প্রতিটি এন্ট্রির "স্থিতি (দিন)" কলাম এখন ব্যবহারকারীর নির্ধারিত
 *      সরল সূত্র মেনে চলে:
 *          স্থিতি (দিন) = বর্তমান স্থিতি (capped) − সেই এন্ট্রির দিন সংখ্যা
 *      (আগের accrued-as-of-date ভিত্তিক জটিল হিসাব বাদ দেওয়া হয়েছে)।
 *
 * ------------------------------------------------------------------
 * NOTE (2026-09-22, Session 13): "ছুটির এন্ট্রি তালিকা" কার্ডে প্রতিটি
 * এন্ট্রির নিজস্ব "কাগজপত্র" (যেমন ছুটির আবেদন, মেডিকেল সার্টিফিকেট)
 * আপলোড ও ডাউনলোড করার ব্যবস্থা যোগ করা হয়েছে — Education Documents
 * ফিচারের (Server_PersonalInfo.gs) একই প্যাটার্ন অনুসরণ করে:
 *   - নতুন শিট 'LeaveDocuments' (Power_Grid spreadsheet): DocID, EntryID,
 *     FileID, FileName, UploadedAt। প্রথম ব্যবহারে স্বয়ংক্রিয়ভাবে তৈরি হয়।
 *   - ফাইল Drive-এ যায় DRIVE_FOLDER_IDS.PhotosAndFiles ফোল্ডারে (অন্যান্য
 *     আপলোডের মতোই)।
 *   - getLeaveDocumentsMap(), uploadLeaveDocument(), deleteLeaveDocument()
 *     — নতুন ফাংশন, getLeaveData()-এর রিটার্ন কন্ট্র্যাক্ট অপরিবর্তিত।
 *   - একটি এন্ট্রি মুছে ফেলা হলে (deleteLeaveEntry) তার সংযুক্ত সব
 *     কাগজপত্রও মুছে যায় (Drive ট্র্যাশে, পুনরুদ্ধারযোগ্য)।
 *   - এই সেশনে "স্থিতি (দিন)" কলামটি ফ্রন্টএন্ডের এন্ট্রি তালিকা থেকে
 *     সরিয়ে ফেলা হয়েছে (Page_PowerGrid.html) — সার্ভারের হিসাব
 *     (entries[].balance) অপরিবর্তিত রাখা হয়েছে, শুধু আর UI-তে দেখানো
 *     হয় না।
 * ------------------------------------------------------------------
 * ------------------------------------------------------------------
 * NOTE (2026-09-23, Session 14): balance-এর ক্যাপ প্রয়োগের ক্রম ঠিক করা
 * হয়েছে। আগে: min(মোট অর্জিত − ভোগ − নগদায়ন, ১৮০) — অর্থাৎ প্রথমে বিয়োগ,
 * তারপর ক্যাপ। এখন: min(মোট অর্জিত, ১৮০) − ভোগ − নগদায়ন — অর্থাৎ প্রথমে
 * ক্যাপ, তারপর বিয়োগ। উদাহরণ: মোট অর্জিত ২২৫ দিন হলে পুল ধরা হয় ১৮০;
 * প্রথম এন্ট্রি ৬০ দিন হলে স্থিতি ১৮০−৬০=১২০; পরের এন্ট্রি ৪০ দিন হলে
 * স্থিতি ১২০−৪০=৮০। (rawBalance ফিল্ডটি এখন balance-এর সমান রাখা হয়েছে,
 * যেহেতু পুরনো "uncapped তারপর capped" ধারণাটি আর প্রযোজ্য নয়।)
 * saveLeaveEntry()-এর সেভের আগের availability-check-ও একই সূত্রে ঠিক
 * করা হয়েছে। এছাড়া Page_PowerGrid.html-এর এন্ট্রি তালিকায় প্রতি রো-তে
 * ফাইল আপলোড/ডাউনলোড UI যোগ করা হয়েছে, getLeaveDocumentsMap() /
 * uploadLeaveDocument() / deleteLeaveDocument() ব্যবহার করে (এই ফাংশনগুলো
 * অপরিবর্তিত)।
 * ------------------------------------------------------------------
 * (আগের ফিল্ডগুলো অপরিবর্তিত রাখা
 * হয়েছে, নতুন ফিল্ড শুধু যোগ করা হয়েছে — পুরনো ফ্রন্টএন্ড কোড ভাঙবে না):
 *   joiningDate, accrualDays, daysServed, totalEarned, totalUsed,
 *   totalEncashed, balance, entries[]
 *   + নতুন: rawBalance, maxBalance, alertThreshold, forfeitedDays,
 *           nearCap, capReached
 *
 * Leave তাব "Leave" শিট ব্যবহার করে (Power_Grid spreadsheet):
 *   EntryID, Date, Type, Days, Balance, Notes
 *
 * অর্জিত ছুটি ম্যানুয়াল এন্ট্রি নয় — "বেতন ও ভাতা"-তে সংরক্ষিত Joining
 * Date থেকে স্বয়ংক্রিয়ভাবে হিসাব হয় (pgGetEmployee_() পুনরায় ব্যবহার
 * করে): প্রতি LEAVE_ACCRUAL_DAYS দিনের চাকরির মেয়াদে ১ দিন।
 *
 * Type শুধু 'Taken' (ছুটি ভোগ) বা 'Encashed' (নগদায়ন) — দুটোই অর্জিত
 * স্থিতি থেকে বিয়োগ হয়।
 *
 * pgSs_(), pgAuth_(), pgNum_(), pgDateStr_(), pgGetEmployee_() এবং PG_TZ
 * Server_PowerGrid.gs থেকে পুনরায় ব্যবহৃত হয় (একই Apps Script প্রজেক্টে
 * থাকায় এগুলো এমনিতেই scope-এ আছে)। formatIfDate_() Server_PersonalInfo.gs
 * থেকে একইভাবে পুনরায় ব্যবহৃত হয়।
 * Requires: Config.gs, Auth.gs (validateSession), Utils_ID.gs (generateUniqueId),
 * Utils_Sheets.gs (ensureSheetWithHeaders), Utils_Drive.gs (uploadFileToFolder_),
 * Server_PowerGrid.gs, Server_PersonalInfo.gs (formatIfDate_).
 */

var LEAVE_ACCRUAL_DAYS = 11;   // চাকরির প্রতি ১১ দিনে ১ দিন অর্জিত ছুটি
var LEAVE_MAX_BALANCE = 180;   // বর্তমান স্থিতি (usable balance) সর্বোচ্চ এই পরিমাণ
var LEAVE_ALERT_THRESHOLD = 170; // এই বা এর বেশি (কিন্তু সীমার নিচে) হলে "কাছাকাছি সীমা" সতর্কতা
var LEAVE_HEADERS = ['EntryID', 'Date', 'Type', 'Days', 'Balance', 'Notes'];
var LEAVE_DOC_HEADERS = ['DocID', 'EntryID', 'FileID', 'FileName', 'UploadedAt'];

function leaveSheet_() {
  return ensureSheetWithHeaders(pgSs_(), 'Leave', LEAVE_HEADERS);
}

function leaveParseIsoUtc_(s) {
  var m = /^(\d{4})-(\d{2})-(\d{2})/.exec(String(s || ''));
  return m ? Date.UTC(Number(m[1]), Number(m[2]) - 1, Number(m[3])) : null;
}

/** যোগদানের তারিখ থেকে asOfDate পর্যন্ত চাকরির দিন সংখ্যা (ঋণাত্মক/অবৈধ হলে ০)। */
function leaveServiceDays_(joiningDateStr, asOfDateStr) {
  var j = leaveParseIsoUtc_(joiningDateStr);
  var a = leaveParseIsoUtc_(asOfDateStr);
  if (j === null || a === null) return 0;
  var days = Math.floor((a - j) / 86400000);
  return days > 0 ? days : 0;
}

/** প্রতি LEAVE_ACCRUAL_DAYS দিনে ১ দিন — নির্দিষ্ট তারিখ পর্যন্ত মোট অর্জিত ছুটি (পূর্ণ দিন, সীমাহীন)। */
function leaveAccruedAsOf_(joiningDateStr, asOfDateStr) {
  if (!joiningDateStr) return 0;
  return Math.floor(leaveServiceDays_(joiningDateStr, asOfDateStr) / LEAVE_ACCRUAL_DAYS);
}

/**
 * সব বৈধ এন্ট্রি (Taken/Encashed), তারিখ অনুযায়ী সাজানো (পুরনো আগে)।
 * পুরনো সংস্করণের Type='Earned' সারি থাকলে (যদি কখনো ম্যানুয়ালি যোগ করা
 * হয়ে থাকে) তা এখানে উপেক্ষা করা হয়, কারণ অর্জিত ছুটি এখন সম্পূর্ণ
 * স্বয়ংক্রিয়ভাবে হিসাব হয়।
 */
function leaveReadEntries_() {
  var sheet = leaveSheet_();
  var lastRow = sheet.getLastRow();
  var entries = [];
  if (lastRow > 1) {
    var data = sheet.getRange(2, 1, lastRow - 1, LEAVE_HEADERS.length).getValues();
    for (var i = 0; i < data.length; i++) {
      if (!data[i][0]) continue;
      var type = String(data[i][2] || '');
      if (type !== 'Taken' && type !== 'Encashed') continue;
      entries.push({
        id: String(data[i][0]),
        date: pgDateStr_(data[i][1]),
        type: type,
        days: pgNum_(data[i][3]),
        notes: String(data[i][5] || '')
      });
    }
  }
  entries.sort(function (a, b) {
    if (a.date !== b.date) return a.date < b.date ? -1 : 1;
    return a.id < b.id ? -1 : 1;
  });
  return entries;
}

/**
 * সব হিসাব এক জায়গায়:
 *   - totalEarned      : মোট অর্জিত (raw, সীমাহীন — যোগদানের তারিখ থেকে হিসাব)
 *   - totalUsed / totalEncashed : মোট ভোগ / নগদায়ন
 *   - cappedEarned     : totalEarned-কে ১৮০ দিনে বাঁধা — যত বেশিই অর্জিত হোক,
 *     "ব্যবহারযোগ্য পুল" কখনো ১৮০-র বেশি শুরু হয় না
 *   - balance          : বর্তমান স্থিতি = cappedEarned − totalUsed − totalEncashed
 *     (যেমন: মোট অর্জিত ২২৫ হলেও পুল ধরা হয় ১৮০; প্রথম এন্ট্রি ৬০ দিন হলে
 *      স্থিতি ১৮০−৬০=১২০; পরের এন্ট্রি ৪০ দিন হলে স্থিতি ১২০−৪০=৮০)
 *   - forfeitedDays    : totalEarned যদি ১৮০ ছাড়িয়ে যায়, সেই বাড়তি অংশ
 *     (ব্যবহার-নির্বিশেষে, অর্জনের সময়ই হারিয়ে যাওয়া ধরা হয়)
 *   - nearCap/capReached : সতর্কতা ফ্ল্যাগ (নতুন balance-এর ওপর ভিত্তি করে)
 *   - entries[].balance : সেই এন্ট্রি সেভ হওয়ার মুহূর্তে বর্তমান স্থিতি −
 *     সেই এন্ট্রির দিন সংখ্যা (ফ্রন্টএন্ডে আর দেখানো হয় না, রেফারেন্সের জন্য রাখা)
 */
function leaveComputeSummary_(joining, asOfDate) {
  var daysServed = leaveServiceDays_(joining, asOfDate);
  var totalEarned = leaveAccruedAsOf_(joining, asOfDate);

  var rawEntries = leaveReadEntries_();
  var totalUsed = 0, totalEncashed = 0;
  rawEntries.forEach(function (e) {
    if (e.type === 'Taken') totalUsed += e.days; else totalEncashed += e.days;
  });
  totalUsed = Math.round(totalUsed * 100) / 100;
  totalEncashed = Math.round(totalEncashed * 100) / 100;

  var cappedEarned = Math.min(totalEarned, LEAVE_MAX_BALANCE);
  var balance = Math.round((cappedEarned - totalUsed - totalEncashed) * 100) / 100;
  if (balance < 0) balance = 0; // সুরক্ষামূলক — validation আগেই ঋণাত্মক হওয়া আটকায়
  var forfeitedDays = Math.round(Math.max(0, totalEarned - LEAVE_MAX_BALANCE) * 100) / 100;
  var nearCap = balance >= LEAVE_ALERT_THRESHOLD && balance < LEAVE_MAX_BALANCE;
  var capReached = balance >= LEAVE_MAX_BALANCE;

  var rows = rawEntries.map(function (e) {
    return {
      id: e.id,
      date: e.date,
      type: e.type,
      days: e.days,
      notes: e.notes,
      balance: Math.round((balance - e.days) * 100) / 100
    };
  });

  return {
    daysServed: daysServed,
    totalEarned: totalEarned,
    totalUsed: totalUsed,
    totalEncashed: totalEncashed,
    rawBalance: balance,
    balance: balance,
    maxBalance: LEAVE_MAX_BALANCE,
    alertThreshold: LEAVE_ALERT_THRESHOLD,
    forfeitedDays: forfeitedDays,
    nearCap: nearCap,
    capReached: capReached,
    entries: rows
  };
}

/**
 * Leave শিটের Balance কলামে (কলাম ৫) নতুন সূত্র অনুযায়ী মান লিখে রাখে —
 * শুধু কাঁচা শিটে দেখার সুবিধার জন্য; getLeaveData() সবসময় লাইভ হিসাব
 * করেই পাঠায়, তাই UI এই কলামের ওপর নির্ভর করে না।
 */
function leaveRecalcBalances_() {
  var sheet = leaveSheet_();
  var lastRow = sheet.getLastRow();
  if (lastRow < 2) return;

  var emp = pgGetEmployee_();
  var joining = emp.joiningDate || '';
  var today = Utilities.formatDate(new Date(), PG_TZ, 'yyyy-MM-dd');
  var summary = leaveComputeSummary_(joining, today);

  var balanceById = {};
  summary.entries.forEach(function (r) { balanceById[r.id] = r.balance; });

  var data = sheet.getRange(2, 1, lastRow - 1, LEAVE_HEADERS.length).getValues();
  var out = data.map(function (row) {
    var id = row[0] ? String(row[0]) : '';
    return [id && balanceById.hasOwnProperty(id) ? balanceById[id] : (pgNum_(row[4]) || 0)];
  });
  sheet.getRange(2, 5, out.length, 1).setValues(out);
}

/**
 * Everything the ছুটির হিসাব tab needs in one call. পুরনো ফিল্ডগুলো
 * (joiningDate, accrualDays, daysServed, totalEarned, totalUsed,
 * totalEncashed, balance, entries) অপরিবর্তিত — শুধু নতুন ফিল্ড যোগ:
 * rawBalance, maxBalance, alertThreshold, forfeitedDays, nearCap, capReached.
 */
function getLeaveData(token) {
  pgAuth_(token);

  var emp = pgGetEmployee_();
  var joining = emp.joiningDate || '';
  var today = Utilities.formatDate(new Date(), PG_TZ, 'yyyy-MM-dd');
  var summary = leaveComputeSummary_(joining, today);

  return {
    joiningDate: joining,
    accrualDays: LEAVE_ACCRUAL_DAYS,
    daysServed: summary.daysServed,
    totalEarned: summary.totalEarned,
    totalUsed: summary.totalUsed,
    totalEncashed: summary.totalEncashed,
    balance: summary.balance,
    rawBalance: summary.rawBalance,
    maxBalance: summary.maxBalance,
    alertThreshold: summary.alertThreshold,
    forfeitedDays: summary.forfeitedDays,
    nearCap: summary.nearCap,
    capReached: summary.capReached,
    entries: summary.entries
  };
}

/**
 * entry = { id (blank for new), date 'yyyy-MM-dd', type 'Taken'|'Encashed', days, notes }
 * বর্তমান (১৮০ দিনে বাঁধা) স্থিতির চেয়ে বেশি ভোগ/নগদায়ন করা যাবে না।
 * Returns the refreshed getLeaveData() payload so the page can re-render
 * in one round trip.
 */
function saveLeaveEntry(token, entry) {
  pgAuth_(token);
  entry = entry || {};

  var date = pgDateStr_(entry.date) || String(entry.date || '').trim();
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) throw new Error('সঠিক তারিখ দিন।');

  var type = String(entry.type || '').trim();
  if (type !== 'Taken' && type !== 'Encashed') throw new Error('ছুটির ধরন নির্বাচন করুন।');

  var days = pgNum_(entry.days);
  if (!(days > 0)) throw new Error('দিনের সংখ্যা ০-এর বেশি হতে হবে।');

  var notes = String(entry.notes || '').trim().substring(0, 300);
  var id = entry.id ? String(entry.id) : '';

  var emp = pgGetEmployee_();
  var joining = emp.joiningDate || '';
  if (!joining) throw new Error('আগে "বেতন ও ভাতা" ট্যাবে যোগদানের তারিখ সংরক্ষণ করুন।');

  var today = Utilities.formatDate(new Date(), PG_TZ, 'yyyy-MM-dd');
  var totalEarned = leaveAccruedAsOf_(joining, today);

  var usedExcludingThis = 0, encashedExcludingThis = 0;
  leaveReadEntries_().forEach(function (e) {
    if (e.id === id) return;
    if (e.type === 'Taken') usedExcludingThis += e.days; else encashedExcludingThis += e.days;
  });

  var rawAvailable = Math.min(totalEarned, LEAVE_MAX_BALANCE) - usedExcludingThis - encashedExcludingThis;
  var available = Math.round(Math.max(0, rawAvailable) * 100) / 100;

  if (days > available + 1e-9) {
    throw new Error('পর্যাপ্ত অর্জিত ছুটি নেই। বর্তমান স্থিতি: ' + available + ' দিন (সর্বোচ্চ সীমা ' + LEAVE_MAX_BALANCE + ' দিন)।');
  }

  var sheet = leaveSheet_();
  if (id) {
    var data = sheet.getDataRange().getValues();
    var found = -1;
    for (var i = 1; i < data.length; i++) {
      if (String(data[i][0]) === id) { found = i + 1; break; }
    }
    if (found < 0) throw new Error('এন্ট্রি পাওয়া যায়নি।');
    sheet.getRange(found, 2).setNumberFormat('@');
    sheet.getRange(found, 2, 1, 3).setValues([[date, type, days]]); // Date, Type, Days
    sheet.getRange(found, 6).setValue(notes); // Notes (Balance, col 5, recalculated below)
  } else {
    id = generateUniqueId('LEV');
    var row = sheet.getLastRow() + 1;
    sheet.getRange(row, 2).setNumberFormat('@');
    sheet.getRange(row, 1, 1, 6).setValues([[id, date, type, days, 0, notes]]);
  }

  leaveRecalcBalances_();
  return getLeaveData(token);
}

/** Returns the refreshed getLeaveData() payload. Also removes any documents attached to the entry. */
function deleteLeaveEntry(token, entryId) {
  pgAuth_(token);

  var sheet = leaveSheet_();
  var data = sheet.getDataRange().getValues();
  for (var i = 1; i < data.length; i++) {
    if (String(data[i][0]) === String(entryId)) {
      sheet.deleteRow(i + 1);
      removeLeaveDocumentsForEntry_(entryId);
      leaveRecalcBalances_();
      return getLeaveData(token);
    }
  }
  throw new Error('এন্ট্রি পাওয়া যায়নি।');
}

/* ============================================================
 * Leave entry documents (কাগজপত্র) — ছুটির আবেদন, মেডিকেল সার্টিফিকেট
 * ইত্যাদি, প্রতিটি এন্ট্রির নিজস্ব তালিকা। প্যাটার্নটি Education
 * Documents-এর (Server_PersonalInfo.gs) অনুরূপ।
 * Sheet 'LeaveDocuments' (Power_Grid): DocID, EntryID, FileID, FileName, UploadedAt
 * ============================================================ */

function leaveDocumentsSheet_() {
  return ensureSheetWithHeaders(pgSs_(), 'LeaveDocuments', LEAVE_DOC_HEADERS);
}

/**
 * Returns every uploaded document for every leave entry in ONE call,
 * grouped by EntryID: { 'LEV-...': [ { docId, fileId, fileName, uploadedAt }, ... ] }.
 * The client fetches this once alongside getLeaveData().
 */
function getLeaveDocumentsMap() {
  var sheet = leaveDocumentsSheet_();
  var data = sheet.getDataRange().getValues();
  var map = {};
  for (var i = 1; i < data.length; i++) {
    var row = data[i];
    if (!row[0] || !row[1]) continue;
    var entryId = String(row[1]);
    if (!map[entryId]) map[entryId] = [];
    map[entryId].push({
      docId: String(row[0]),
      fileId: row[2],
      fileName: row[3] || 'ডকুমেন্ট',
      uploadedAt: formatIfDate_(row[4])
    });
  }
  return map;
}

/**
 * Uploads one document for a given leave entry into Drive
 * (PhotosAndFiles folder) and records it against that entry.
 * Returns the new document's info so the client can show it immediately
 * without re-fetching the whole map.
 */
function uploadLeaveDocument(compositeToken, entryId, base64Data, mimeType, fileName) {
  var user = validateSession(compositeToken);
  if (!user) throw new Error('সেশন মেয়াদোত্তীর্ণ হয়ে গেছে, আবার লগইন করুন।');
  if (!entryId) throw new Error('ছুটির এন্ট্রি খুঁজে পাওয়া যায়নি — আগে এন্ট্রিটি সংরক্ষণ করুন।');

  var safeName = (fileName && String(fileName).trim()) || 'leave-document';
  var fileId = uploadFileToFolder_(DRIVE_FOLDER_IDS.PhotosAndFiles, base64Data, mimeType, 'leave-' + entryId + '-' + safeName);

  var sheet = leaveDocumentsSheet_();
  var docId = generateUniqueId('LVDOC');
  var now = new Date();
  sheet.appendRow([docId, entryId, fileId, safeName, now]);

  return {
    docId: docId,
    fileId: fileId,
    fileName: safeName,
    uploadedAt: Utilities.formatDate(now, PG_TZ, 'yyyy-MM-dd')
  };
}

/** Deletes one document's record and trashes the underlying Drive file (recoverable). */
function deleteLeaveDocument(compositeToken, docId) {
  var user = validateSession(compositeToken);
  if (!user) throw new Error('সেশন মেয়াদোত্তীর্ণ হয়ে গেছে, আবার লগইন করুন।');

  var sheet = leaveDocumentsSheet_();
  var data = sheet.getDataRange().getValues();
  for (var i = 1; i < data.length; i++) {
    if (String(data[i][0]) === String(docId)) {
      var fileId = data[i][2];
      if (fileId) {
        try { DriveApp.getFileById(fileId).setTrashed(true); } catch (e) { /* file may already be gone — ignore */ }
      }
      sheet.deleteRow(i + 1);
      return true;
    }
  }
  return false;
}

/** Internal: removes all documents (rows + Drive files) belonging to one leave entry — used when that entry itself is deleted. */
function removeLeaveDocumentsForEntry_(entryId) {
  var sheet = leaveDocumentsSheet_();
  var data = sheet.getDataRange().getValues();
  for (var i = data.length - 1; i >= 1; i--) {
    if (String(data[i][1]) === String(entryId)) {
      var fileId = data[i][2];
      if (fileId) {
        try { DriveApp.getFileById(fileId).setTrashed(true); } catch (e) { /* ignore */ }
      }
      sheet.deleteRow(i + 1);
    }
  }
}
