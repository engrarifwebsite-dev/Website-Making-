/**
 * Server_Leave.gs
 * Server support for the পাওয়ার গ্রিড page (Page_PowerGrid.html), tab "ছুটির হিসাব".
 *
 * ------------------------------------------------------------------
 * NOTE (2026-09-22): Fixed three bugs reported against the live
 * "ছুটির হিসাব" tab —
 *   1. "মোট অর্জিত ছুটি" (প্রতি ১১ দিনে ১ দিন) always showed 0.
 *   2. "ভোগ/নগদায়নকৃত" never updated (always 0).
 *   3. Selecting "নগদায়ন" (Encashed) in the এন্ট্রি সম্পাদনা modal and
 *      saving silently failed.
 *
 * Root cause: the deployed Server_Leave.gs did not match the field names
 * and Type values the current Page_PowerGrid.html frontend actually
 * sends/expects. The frontend reads d.joiningDate, d.accrualDays,
 * d.daysServed, d.totalEarned, d.totalUsed, d.totalEncashed, d.balance
 * from getLeaveData(), and calls saveLeaveEntry() with type 'Taken' or
 * 'Encashed' — the old file returned different key names (totalTaken
 * instead of totalUsed, no daysServed/accrualDays/totalEarned at all) and
 * only accepted type 'Earned'/'Taken', so every "Encashed" save was
 * rejected and the accrual/usage numbers came back as undefined (→ 0 in
 * the UI). This file's contract now matches the frontend exactly.
 * ------------------------------------------------------------------
 *
 * Leave tab uses the "Leave" sheet in Power_Grid:
 *   EntryID, Date, Type, Days, Balance, Notes
 *
 * There is no manual "Earned" entry — earned leave accrues AUTOMATICALLY
 * from the Joining Date already stored in "বেতন ও ভাতা" (Employment sheet,
 * the same value pgGetEmployee_() already returns): 1 day of earned leave
 * for every LEAVE_ACCRUAL_DAYS days of service since joining (floor
 * division). Editing the Joining Date in the "✏️ তথ্য সম্পাদনা" modal is
 * picked up immediately the next time this tab loads — no separate sync.
 *
 * Type is 'Taken' (ছুটি ভোগ) or 'Encashed' (নগদায়ন) — both subtract from
 * the earned balance. A save is refused if it would record more
 * Taken+Encashed days than have actually accrued as of today.
 *
 * Reuses pgSs_(), pgAuth_(), pgNum_(), pgDateStr_(), pgGetEmployee_() and
 * PG_TZ from Server_PowerGrid.gs (same Apps Script project, so these are
 * already in scope here).
 * Requires: Config.gs, Auth.gs (validateSession), Utils_ID.gs (generateUniqueId),
 * Utils_Sheets.gs (ensureSheetWithHeaders), Server_PowerGrid.gs.
 */

var LEAVE_ACCRUAL_DAYS = 11; // চাকরির প্রতি ১১ দিনে ১ দিন অর্জিত ছুটি
var LEAVE_HEADERS = ['EntryID', 'Date', 'Type', 'Days', 'Balance', 'Notes'];

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

/** প্রতি LEAVE_ACCRUAL_DAYS দিনে ১ দিন — নির্দিষ্ট তারিখ পর্যন্ত মোট অর্জিত ছুটি (পূর্ণ দিন)। */
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
 * প্রতিটি এন্ট্রির পরের "Balance" (accrued-as-of-that-date − used-so-far)
 * পুনরায় হিসাব করে শিটে লিখে রাখে — শুধু কাঁচা শিটে দেখার সুবিধার জন্য;
 * getLeaveData() সবসময় লাইভ হিসাব করেই পাঠায়, তাই UI এই কলামের ওপর
 * নির্ভর করে না।
 */
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
    if (type !== 'Taken' && type !== 'Encashed') continue;
    order.push({ idx: i, id: String(data[i][0]), date: pgDateStr_(data[i][1]), days: pgNum_(data[i][3]) });
  }
  order.sort(function (a, b) {
    if (a.date !== b.date) return a.date < b.date ? -1 : 1;
    return a.id < b.id ? -1 : 1;
  });

  var used = 0;
  var balanceById = {};
  order.forEach(function (o) {
    used += o.days;
    var accrued = leaveAccruedAsOf_(joining, o.date);
    balanceById[o.id] = Math.round((accrued - used) * 100) / 100;
  });

  var out = [];
  for (var j = 0; j < data.length; j++) {
    var idj = data[j][0] ? String(data[j][0]) : '';
    out.push([idj && balanceById.hasOwnProperty(idj) ? balanceById[idj] : (pgNum_(data[j][4]) || 0)]);
  }
  sheet.getRange(2, 5, out.length, 1).setValues(out);
}

/**
 * Everything the ছুটির হিসাব tab needs in one call. Field names match
 * Page_PowerGrid.html exactly:
 *   joiningDate, accrualDays, daysServed, totalEarned, totalUsed,
 *   totalEncashed, balance, entries[{id,date,type,days,balance,notes}]
 */
function getLeaveData(token) {
  pgAuth_(token);

  var emp = pgGetEmployee_();
  var joining = emp.joiningDate || '';
  var today = Utilities.formatDate(new Date(), PG_TZ, 'yyyy-MM-dd');

  var daysServed = leaveServiceDays_(joining, today);
  var totalEarned = leaveAccruedAsOf_(joining, today);

  var rawEntries = leaveReadEntries_();
  var totalUsed = 0, totalEncashed = 0, used = 0;

  var rows = rawEntries.map(function (e) {
    used += e.days;
    if (e.type === 'Taken') totalUsed += e.days; else totalEncashed += e.days;
    var accruedAtDate = leaveAccruedAsOf_(joining, e.date);
    return {
      id: e.id,
      date: e.date,
      type: e.type,
      days: e.days,
      notes: e.notes,
      balance: Math.round((accruedAtDate - used) * 100) / 100
    };
  });

  var balance = Math.round((totalEarned - totalUsed - totalEncashed) * 100) / 100;

  return {
    joiningDate: joining,
    accrualDays: LEAVE_ACCRUAL_DAYS,
    daysServed: daysServed,
    totalEarned: totalEarned,
    totalUsed: Math.round(totalUsed * 100) / 100,
    totalEncashed: Math.round(totalEncashed * 100) / 100,
    balance: balance,
    entries: rows
  };
}

/**
 * entry = { id (blank for new), date 'yyyy-MM-dd', type 'Taken'|'Encashed', days, notes }
 * বর্তমান অর্জিত ছুটির (আজ পর্যন্ত) চেয়ে বেশি ভোগ/নগদায়ন করা যাবে না।
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
  var totalAccrued = leaveAccruedAsOf_(joining, today);

  var usedExcludingThis = 0;
  leaveReadEntries_().forEach(function (e) { if (e.id !== id) usedExcludingThis += e.days; });

  var available = Math.round((totalAccrued - usedExcludingThis) * 100) / 100;
  if (days > available + 1e-9) {
    throw new Error('পর্যাপ্ত অর্জিত ছুটি নেই। বর্তমান স্থিতি: ' + available + ' দিন।');
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
    sheet.getRange(found, 6).setValue(notes); // Notes (Balance, col 5, is recalculated below)
  } else {
    id = generateUniqueId('LEV');
    var row = sheet.getLastRow() + 1;
    sheet.getRange(row, 2).setNumberFormat('@');
    sheet.getRange(row, 1, 1, 6).setValues([[id, date, type, days, 0, notes]]);
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
