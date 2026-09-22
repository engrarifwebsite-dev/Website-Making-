/**
 * Server_Leave.gs
 * Server support for the পাওয়ার গ্রিড page (Page_PowerGrid.html), tab "ছুটির হিসাব".
 *
 * Leave tab uses the "Leave" sheet in Power_Grid (created/extended by
 * Setup_PowerGrid.gs and leaveSheet_() below):
 *   EntryID, Date, Type, Days, Balance, Notes, EncashmentAmount
 *
 * Accrual is AUTOMATIC — there is no manual "Earned" entry any more.
 * Joining date is read live from "বেতন ও ভাতা" (pgGetEmployee_(), which reads
 * the Employment sheet) every time the tab loads, so editing the Joining
 * Date there is reflected here immediately with no extra sync step.
 *
 * Rule: 1 day of earned leave accrues for every 11 days of service since
 * joining (floor division — partial units don't round up).
 *
 * Type is 'Taken' (ছুটি ভোগ) or 'Encashment' (নগদায়ন) — both subtract from
 * the earned balance. Encashment additionally pays, per day encashed, an
 * amount equal to ONE DAY's Basic Salary (the latest Basic Salary found in
 * "বেতন ও ভাতা" ÷ 30), stored in the EncashmentAmount column.
 *
 * Reuses pgSs_(), pgAuth_(), pgNum_(), pgDateStr_(), pgMonthKey_(),
 * pgStatementSheet_() and pgGetEmployee_() from Server_PowerGrid.gs (same
 * Apps Script project, so these are already in scope here).
 * Requires: Config.gs, Auth.gs (validateSession), Utils_ID.gs (generateUniqueId),
 * Utils_Sheets.gs (ensureSheetWithHeaders), Server_PowerGrid.gs.
 */

var LEAVE_ACCRUAL_UNIT_DAYS = 11; // চাকরির প্রতি ১১ দিনে ১ দিন অর্জিত ছুটি
var LEAVE_HEADERS = ['EntryID', 'Date', 'Type', 'Days', 'Balance', 'Notes', 'EncashmentAmount'];

/** Leave sheet, with EncashmentAmount added automatically to any older 6-column version. */
function leaveSheet_() {
  var sheet = ensureSheetWithHeaders(pgSs_(), 'Leave', LEAVE_HEADERS);
  var head = sheet.getRange(1, 1, 1, LEAVE_HEADERS.length).getValues()[0];
  for (var i = 0; i < LEAVE_HEADERS.length; i++) {
    if (!head[i]) sheet.getRange(1, i + 1).setValue(LEAVE_HEADERS[i]).setFontWeight('bold');
  }
  return sheet;
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

/** প্রতি ১১ দিনে ১ দিন — নির্দিষ্ট তারিখ পর্যন্ত মোট অর্জিত ছুটি (পূর্ণ দিন)। */
function leaveAccruedAsOf_(joiningDateStr, asOfDateStr) {
  if (!joiningDateStr) return 0;
  return Math.floor(leaveServiceDays_(joiningDateStr, asOfDateStr) / LEAVE_ACCRUAL_UNIT_DAYS);
}

/** "বেতন ও ভাতা"-র সর্বশেষ (সবচেয়ে নতুন মাসের) স্টেটমেন্ট থেকে ১ দিনের বেসিকের হার (Basic ÷ ৩০)। */
function leaveDailyBasicRate_() {
  var sheet = pgStatementSheet_();
  var data = sheet.getDataRange().getValues();
  var latestKey = '', latestBasic = 0;
  for (var i = 1; i < data.length; i++) {
    var row = data[i];
    var key = pgMonthKey_(row[1]);
    if (!row[0] || !key) continue;
    if (key > latestKey) { latestKey = key; latestBasic = pgNum_(row[2]); } // কলাম ৩ = BasicSalary
  }
  return latestBasic > 0 ? Math.round((latestBasic / 30) * 100) / 100 : 0;
}

/** সব বৈধ এন্ট্রি (Taken/Encashment) — পুরনো Type='Earned' সারি থাকলে (আগের সংস্করণ) তা উপেক্ষা করা হয়, কারণ অর্জিত ছুটি এখন স্বয়ংক্রিয়। */
function leaveReadEntries_() {
  var sheet = leaveSheet_();
  var lastRow = sheet.getLastRow();
  var entries = [];
  if (lastRow > 1) {
    var data = sheet.getRange(2, 1, lastRow - 1, LEAVE_HEADERS.length).getValues();
    for (var i = 0; i < data.length; i++) {
      if (!data[i][0]) continue;
      var type = String(data[i][2] || '');
      if (type !== 'Taken' && type !== 'Encashment') continue;
      entries.push({
        id: String(data[i][0]),
        date: pgDateStr_(data[i][1]),
        type: type,
        days: pgNum_(data[i][3]),
        notes: String(data[i][5] || ''),
        encashmentAmount: pgNum_(data[i][6])
      });
    }
  }
  entries.sort(function (a, b) {
    if (a.date !== b.date) return a.date < b.date ? -1 : 1;
    return a.id < b.id ? -1 : 1;
  });
  return entries;
}

/** এন্ট্রি অনুযায়ী প্রতিটি সারির (Balance) কলাম আবার হিসাব করে — শুধু কাঁচা শিটে দেখার জন্য; অ্যাপের হিসাব সবসময় getLeaveData()-এ লাইভ করা হয়। */
function leaveRecalcBalances_() {
  var sheet = leaveSheet_();
  var lastRow = sheet.getLastRow();
  if (lastRow < 2) return;

  var emp = pgGetEmployee_();
  var joining = emp.joiningDate || '';
  var data = sheet.getRange(2, 1, lastRow - 1, LEAVE_HEADERS.length).getValues();

  var order = [];
  for (var i = 0; i < data.length; i++) {
    if (!data[i][0]) continue;
    var type = String(data[i][2] || '');
    if (type !== 'Taken' && type !== 'Encashment') continue;
    order.push({ idx: i, date: pgDateStr_(data[i][1]), days: pgNum_(data[i][3]) });
  }
  order.sort(function (a, b) {
    if (a.date !== b.date) return a.date < b.date ? -1 : 1;
    return a.idx - b.idx;
  });

  var out = data.map(function () { return ['']; });
  var used = 0;
  order.forEach(function (o) {
    used += o.days;
    var accrued = leaveAccruedAsOf_(joining, o.date);
    out[o.idx] = [Math.round((accrued - used) * 100) / 100];
  });

  sheet.getRange(2, 5, out.length, 1).setValues(out);
}

/** Everything the ছুটির হিসাব tab needs in one call. */
function getLeaveData(token) {
  pgAuth_(token);

  var emp = pgGetEmployee_();
  var joining = emp.joiningDate || '';
  var today = Utilities.formatDate(new Date(), PG_TZ, 'yyyy-MM-dd');
  var totalAccrued = leaveAccruedAsOf_(joining, today);
  var dailyRate = leaveDailyBasicRate_();

  var entries = leaveReadEntries_();
  var totalTaken = 0, totalEncashed = 0, totalEncashAmount = 0;
  var usedSoFar = 0;

  var rows = entries.map(function (e) {
    usedSoFar += e.days;
    if (e.type === 'Taken') {
      totalTaken += e.days;
    } else {
      totalEncashed += e.days;
      totalEncashAmount += e.encashmentAmount;
    }
    var accruedAtDate = leaveAccruedAsOf_(joining, e.date);
    return {
      id: e.id,
      date: e.date,
      type: e.type,
      days: e.days,
      notes: e.notes,
      encashmentAmount: e.encashmentAmount,
      balance: Math.round((accruedAtDate - usedSoFar) * 100) / 100
    };
  });

  var balance = Math.round((totalAccrued - totalTaken - totalEncashed) * 100) / 100;

  return {
    joiningDate: joining,
    accrualUnitDays: LEAVE_ACCRUAL_UNIT_DAYS,
    dailyBasicRate: dailyRate,
    totalAccrued: totalAccrued,
    totalTaken: Math.round(totalTaken * 100) / 100,
    totalEncashed: Math.round(totalEncashed * 100) / 100,
    totalEncashAmount: Math.round(totalEncashAmount * 100) / 100,
    balance: balance,
    entries: rows
  };
}

/**
 * entry = { id (blank for new), date 'yyyy-MM-dd', type 'Taken'|'Encashment', days, notes }
 * নগদায়নের টাকার পরিমাণ (days × ১ দিনের বেসিক হার) স্বয়ংক্রিয়ভাবে হিসাব ও সংরক্ষণ হয়।
 * বর্তমান অর্জিত ছুটির (আজ পর্যন্ত) চেয়ে বেশি ভোগ/নগদায়ন করা যাবে না।
 * Returns the refreshed getLeaveData() payload.
 */
function saveLeaveEntry(token, entry) {
  pgAuth_(token);
  entry = entry || {};

  var date = pgDateStr_(entry.date) || String(entry.date || '').trim();
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) throw new Error('সঠিক তারিখ দিন।');

  var type = String(entry.type || '').trim();
  if (type !== 'Taken' && type !== 'Encashment') throw new Error('ছুটির ধরন নির্বাচন করুন।');

  var days = pgNum_(entry.days);
  if (!(days > 0)) throw new Error('দিনের সংখ্যা ০-এর বেশি হতে হবে।');

  var notes = String(entry.notes || '').trim().substring(0, 300);
  var id = entry.id ? String(entry.id) : '';

  var emp = pgGetEmployee_();
  var joining = emp.joiningDate || '';
  if (!joining) throw new Error('আগে "বেতন ও ভাতা" ট্যাবে যোগদানের তারিখ সংরক্ষণ করুন।');

  var today = Utilities.formatDate(new Date(), PG_TZ, 'yyyy-MM-dd');
  var totalAccrued = leaveAccruedAsOf_(joining, today);

  var usedExcludingThis = 0;
  leaveReadEntries_().forEach(function (e) { if (e.id !== id) usedExcludingThis += e.days; });

  var available = Math.round((totalAccrued - usedExcludingThis) * 100) / 100;
  if (days > available + 1e-9) {
    throw new Error('পর্যাপ্ত অর্জিত ছুটি নেই। বর্তমান স্থিতি: ' + available + ' দিন।');
  }

  var encashAmount = 0;
  if (type === 'Encashment') {
    var rate = leaveDailyBasicRate_();
    if (!(rate > 0)) throw new Error('"বেতন ও ভাতা" ট্যাবে বেসিক বেতনসহ একটি বেতন এন্ট্রি না থাকলে নগদায়ন করা যাবে না।');
    encashAmount = Math.round(days * rate * 100) / 100;
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
    sheet.getRange(found, 2, 1, 3).setValues([[date, type, days]]);
    sheet.getRange(found, 6, 1, 2).setValues([[notes, encashAmount]]);
  } else {
    id = generateUniqueId('LEV');
    var row = sheet.getLastRow() + 1;
    sheet.getRange(row, 2).setNumberFormat('@');
    sheet.getRange(row, 1, 1, 7).setValues([[id, date, type, days, '', notes, encashAmount]]);
  }

  leaveRecalcBalances_();
  return getLeaveData(token);
}

/** Returns the refreshed getLeaveData() payload. */
function deleteLeaveEntry(token, entryId) {
  pgAuth_(token);

  var sheet = leaveSheet_();
  var data = sheet.getDataRange().getValues();
  for (var i = 1; i < data.length; i++) {
    if (String(data[i][0]) === String(entryId)) {
      sheet.deleteRow(i + 1);
      leaveRecalcBalances_();
      return getLeaveData(token);
    }
  }
  throw new Error('এন্ট্রি পাওয়া যায়নি।');
}
