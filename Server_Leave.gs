/**
 * Server_Leave.gs
 * Server support for the পাওয়ার গ্রিড page (Page_PowerGrid.html), tab "ছুটির হিসাব".
 *
 * Reuses the "Leave" tab that Setup_PowerGrid.gs already creates:
 *   EntryID, Date, Type, Days, Balance, Notes
 * Type is 'Earned' (অর্জিত ছুটি, adds to the balance) or 'Taken' (ছুটি ভোগ,
 * subtracts from the balance). Balance is a running total, recalculated in
 * date order every time an entry is added, edited or deleted — the same
 * pattern Server_Budget.gs uses for its Ledger tab.
 *
 * Reuses pgSs_(), pgAuth_(), pgNum_() and pgDateStr_() from Server_PowerGrid.gs
 * (same Apps Script project, so these are already in scope here).
 * Requires: Config.gs, Auth.gs (validateSession), Utils_ID.gs (generateUniqueId),
 * Utils_Sheets.gs (ensureSheetWithHeaders), Server_PowerGrid.gs.
 */

function leaveSheet_() {
  return ensureSheetWithHeaders(pgSs_(), 'Leave', ['EntryID', 'Date', 'Type', 'Days', 'Balance', 'Notes']);
}

/**
 * Recomputes the Balance column for every row, in date order (ties keep the
 * sheet's existing row order). Writes the whole column back in one call.
 */
function leaveRecalc_(sheet) {
  var lastRow = sheet.getLastRow();
  if (lastRow < 2) return;

  var data = sheet.getRange(2, 1, lastRow - 1, 6).getValues();
  var rows = [];
  for (var i = 0; i < data.length; i++) {
    if (!data[i][0]) continue;
    rows.push({
      idx: i,
      id: String(data[i][0]),
      date: pgDateStr_(data[i][1]),
      type: String(data[i][2] || ''),
      days: pgNum_(data[i][3])
    });
  }
  rows.sort(function (a, b) {
    if (a.date !== b.date) return a.date < b.date ? -1 : 1;
    return a.idx - b.idx;
  });

  var balance = 0;
  var balanceById = {};
  rows.forEach(function (r) {
    balance = Math.round((balance + (r.type === 'Earned' ? r.days : -r.days)) * 100) / 100;
    balanceById[r.id] = balance;
  });

  var out = [];
  for (var j = 0; j < data.length; j++) {
    var idj = data[j][0] ? String(data[j][0]) : '';
    out.push([idj && balanceById.hasOwnProperty(idj) ? balanceById[idj] : (pgNum_(data[j][4]) || 0)]);
  }
  sheet.getRange(2, 5, out.length, 1).setValues(out);
}

/** Every entry (oldest first) plus totals. */
function getLeaveData(token) {
  pgAuth_(token);

  var sheet = leaveSheet_();
  var lastRow = sheet.getLastRow();
  var entries = [];

  if (lastRow > 1) {
    var data = sheet.getRange(2, 1, lastRow - 1, 6).getValues();
    for (var i = 0; i < data.length; i++) {
      if (!data[i][0]) continue;
      entries.push({
        id: String(data[i][0]),
        date: pgDateStr_(data[i][1]),
        type: String(data[i][2] || ''),
        days: pgNum_(data[i][3]),
        balance: pgNum_(data[i][4]),
        notes: String(data[i][5] || '')
      });
    }
  }

  entries.sort(function (a, b) {
    if (a.date !== b.date) return a.date < b.date ? -1 : 1;
    return a.id < b.id ? -1 : 1;
  });

  var totalEarned = 0, totalTaken = 0;
  entries.forEach(function (e) {
    if (e.type === 'Earned') totalEarned += e.days; else totalTaken += e.days;
  });

  return {
    entries: entries,
    totalEarned: Math.round(totalEarned * 100) / 100,
    totalTaken: Math.round(totalTaken * 100) / 100,
    balance: entries.length ? entries[entries.length - 1].balance : 0
  };
}

/**
 * entry = { id (blank for new), date 'yyyy-MM-dd', type 'Earned'|'Taken', days, notes }
 * Returns the refreshed getLeaveData() payload so the page can re-render in one round trip.
 */
function saveLeaveEntry(token, entry) {
  pgAuth_(token);
  entry = entry || {};

  var date = pgDateStr_(entry.date) || String(entry.date || '').trim();
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) throw new Error('সঠিক তারিখ দিন।');

  var type = String(entry.type || '').trim();
  if (type !== 'Earned' && type !== 'Taken') throw new Error('ছুটির ধরন নির্বাচন করুন।');

  var days = pgNum_(entry.days);
  if (!(days > 0)) throw new Error('দিনের সংখ্যা ০-এর বেশি হতে হবে।');

  var notes = String(entry.notes || '').trim().substring(0, 300);
  var sheet = leaveSheet_();
  var id = entry.id ? String(entry.id) : '';

  if (id) {
    var data = sheet.getDataRange().getValues();
    var found = -1;
    for (var i = 1; i < data.length; i++) {
      if (String(data[i][0]) === id) { found = i + 1; break; }
    }
    if (found < 0) throw new Error('এন্ট্রি পাওয়া যায়নি।');
    sheet.getRange(found, 2).setNumberFormat('@');
    sheet.getRange(found, 2, 1, 5).setValues([[date, type, days, sheet.getRange(found, 5).getValue(), notes]]);
  } else {
    id = generateUniqueId('LEV');
    var row = sheet.getLastRow() + 1;
    sheet.getRange(row, 2).setNumberFormat('@');
    sheet.getRange(row, 1, 1, 6).setValues([[id, date, type, days, 0, notes]]);
  }

  leaveRecalc_(sheet);
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
      leaveRecalc_(sheet);
      return getLeaveData(token);
    }
  }
  throw new Error('এন্ট্রি পাওয়া যায়নি।');
}
