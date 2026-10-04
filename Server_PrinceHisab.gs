/**
 * Server_PrinceHisab.gs
 * Server support for প্রিন্স হিসাব (Page_PrinceHisab.html), Phase 11.
 *
 * Uses the existing 'Ledger' tab in Prince_Hisab (created by
 * Setup_PrinceHisab.gs): EntryID, Date, Type, Amount, PurposeOrMethod,
 * RunningBalance, ZakatLinkID — plus one column appended at the end by this
 * file the first time it runs (same "extend at the end" pattern already
 * used elsewhere in this project, e.g. Power Grid's PG_EXTRA_COL):
 *   UpdatedAt (column 8) — when that row was last saved, so the dashboard
 *   can show "সর্বশেষ ব্যালেন্স হালনাগাদ" with both a date and a time.
 * ZakatLinkID is reserved for a future Zakat_Fitra loan-link automation
 * (Phase 17) — this page never writes to it, only preserves it.
 *
 * Type is one of four values (see PH_TYPES / PH_META below):
 *   lend_to_prince    — আমি Prince-কে ধার দিয়েছি      (increases আমার পাওনা)
 *   prince_lend_to_me — Prince আমাকে ধার দিয়েছে       (increases আমার দেনা)
 *   prince_repay_me   — Prince আমার পাওনা পরিশোধ করেছে (decreases আমার পাওনা)
 *   i_repay_prince    — আমি Prince-এর দেনা পরিশোধ করেছি (decreases আমার দেনা)
 *
 * পাওনা (receivable)  = sum(lend_to_prince) − sum(prince_repay_me)
 * দেনা   (payable)     = sum(prince_lend_to_me) − sum(i_repay_prince)
 * নিট পাওনা            = পাওনা − দেনা
 *
 * Totals are always recomputed fresh from every row on each call (not
 * trusted from a stored running total), the same safe pattern already used
 * by Budget/Power Grid dashboards in this project. RunningBalance (column 6)
 * is still kept up to date for anyone reading the raw sheet / for the PDF
 * report, via phRecalcRunningBalance_().
 *
 * Requires: Config.gs, Auth.gs (validateSession), Utils_ID.gs
 * (generateUniqueId), Utils_Sheets.gs (ensureSheetWithHeaders).
 * Every function needs a valid session token — this is financial data.
 */

var PH_TZ = 'Asia/Dhaka';

var PH_HEADERS = ['EntryID', 'Date', 'Type', 'Amount', 'PurposeOrMethod', 'RunningBalance', 'ZakatLinkID'];
var PH_EXTRA_HEADERS = ['UpdatedAt'];
var PH_EXTRA_COL = 8;

var PH_TYPES = ['lend_to_prince', 'prince_lend_to_me', 'prince_repay_me', 'i_repay_prince'];

/* ============================================================
 * Small helpers
 * ============================================================ */

function phSs_() {
  return SpreadsheetApp.openById(SPREADSHEET_IDS.Prince_Hisab);
}

function phAuth_(token) {
  var user = validateSession(token);
  if (!user) throw new Error('সেশন মেয়াদোত্তীর্ণ হয়ে গেছে, আবার লগইন করুন।');
  return user;
}

function phNum_(v) {
  var n = parseFloat(String(v === null || v === undefined ? '' : v).replace(/,/g, ''));
  return isFinite(n) ? n : 0;
}

function phDateStr_(v) {
  if (!v) return '';
  if (v instanceof Date) return Utilities.formatDate(v, PH_TZ, 'yyyy-MM-dd');
  var m = /^(\d{4}-\d{2}-\d{2})/.exec(String(v).trim());
  return m ? m[1] : '';
}

function phDateTimeStr_(v) {
  if (!v) return '';
  if (v instanceof Date) return Utilities.formatDate(v, PH_TZ, "yyyy-MM-dd'T'HH:mm:ss");
  return String(v).trim();
}

function phSheet_() {
  var sheet = ensureSheetWithHeaders(phSs_(), 'Ledger', PH_HEADERS);
  var head = sheet.getRange(1, PH_EXTRA_COL, 1, PH_EXTRA_HEADERS.length).getValues()[0];
  for (var h = 0; h < PH_EXTRA_HEADERS.length; h++) {
    if (!head[h]) sheet.getRange(1, PH_EXTRA_COL + h).setValue(PH_EXTRA_HEADERS[h]).setFontWeight('bold');
  }
  return sheet;
}

/* ============================================================
 * Read
 * ============================================================ */

/** Every ledger row, oldest first (ties by EntryID). */
function phReadAll_() {
  var sheet = phSheet_();
  var lastRow = sheet.getLastRow();
  var out = [];
  if (lastRow < 2) return out;

  var data = sheet.getRange(2, 1, lastRow - 1, PH_EXTRA_COL).getValues();
  for (var i = 0; i < data.length; i++) {
    var row = data[i];
    if (!row[0]) continue;
    var type = String(row[2] || '');
    out.push({
      id: String(row[0]),
      date: phDateStr_(row[1]),
      type: PH_TYPES.indexOf(type) >= 0 ? type : 'lend_to_prince',
      amount: phNum_(row[3]),
      note: String(row[4] || ''),
      zakatLinkId: String(row[6] || ''),
      updatedAt: phDateTimeStr_(row[7]),
      rowIndex: i + 2
    });
  }
  out.sort(function (a, b) {
    if (a.date !== b.date) return a.date < b.date ? -1 : 1;
    return a.id < b.id ? -1 : 1;
  });
  return out;
}

/** Net effect of one transaction on (পাওনা − দেনা): + for lend_to_prince/i_repay_prince, − for the other two. */
function phNetDelta_(type, amount) {
  return (type === 'lend_to_prince' || type === 'i_repay_prince') ? amount : -amount;
}

/** Rewrites RunningBalance (column 6) for every row in chronological order. Reference/PDF only — dashboard totals always recompute fresh. */
function phRecalcRunningBalance_() {
  var sheet = phSheet_();
  var rows = phReadAll_();
  var balance = 0;
  rows.forEach(function (r) {
    balance = Math.round((balance + phNetDelta_(r.type, r.amount)) * 100) / 100;
    sheet.getRange(r.rowIndex, 6).setValue(balance);
  });
}

/** One call returns everything the প্রিন্স হিসাব dashboard needs. */
function getPrinceHisabData(token) {
  phAuth_(token);

  var rows = phReadAll_(); // chronological, oldest first
  var lent = 0, repaidToMe = 0, borrowed = 0, repaidByMe = 0;
  var receivableCount = 0, payableCount = 0;
  var lastUpdated = '';

  var enriched = rows.map(function (r) {
    var signedAmount;
    if (r.type === 'lend_to_prince') { lent += r.amount; receivableCount++; signedAmount = r.amount; }
    else if (r.type === 'prince_repay_me') { repaidToMe += r.amount; receivableCount++; signedAmount = -r.amount; }
    else if (r.type === 'prince_lend_to_me') { borrowed += r.amount; payableCount++; signedAmount = -r.amount; }
    else { repaidByMe += r.amount; payableCount++; signedAmount = r.amount; } // i_repay_prince

    if (r.updatedAt && r.updatedAt > lastUpdated) lastUpdated = r.updatedAt;

    return {
      id: r.id, date: r.date, type: r.type, amount: r.amount, note: r.note,
      signedAmount: Math.round(signedAmount * 100) / 100
    };
  });

  var receivable = Math.round((lent - repaidToMe) * 100) / 100;
  var payable = Math.round((borrowed - repaidByMe) * 100) / 100;
  var net = Math.round((receivable - payable) * 100) / 100;

  // client wants newest first
  enriched.sort(function (a, b) {
    if (a.date !== b.date) return a.date < b.date ? 1 : -1;
    return a.id < b.id ? 1 : -1;
  });

  return {
    transactions: enriched,
    receivable: receivable,
    payable: payable,
    net: net,
    receivableCount: receivableCount,
    payableCount: payableCount,
    totalCount: rows.length,
    firstDate: rows.length ? rows[0].date : '',
    lastDate: rows.length ? rows[rows.length - 1].date : '',
    lastUpdatedAt: lastUpdated
  };
}

/* ============================================================
 * Write
 * ============================================================ */

/**
 * txn = { id (blank for new), date 'yyyy-MM-dd', type (see PH_TYPES),
 *         amount, note }
 * Returns the refreshed getPrinceHisabData() payload.
 */
function savePrinceHisabTransaction(token, txn) {
  phAuth_(token);
  txn = txn || {};

  var date = String(txn.date || '').trim();
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) throw new Error('সঠিক তারিখ দিন।');

  var type = String(txn.type || '').trim();
  if (PH_TYPES.indexOf(type) < 0) throw new Error('লেনদেনের ধরন নির্বাচন করুন।');

  var amount = phNum_(txn.amount);
  if (amount <= 0) throw new Error('পরিমাণ ০-র বেশি হতে হবে।');

  var note = String(txn.note || '').trim().substring(0, 500);
  var id = txn.id ? String(txn.id) : '';
  var now = new Date();

  var sheet = phSheet_();

  if (id) {
    var data = sheet.getDataRange().getValues();
    var found = -1;
    for (var i = 1; i < data.length; i++) {
      if (String(data[i][0]) === id) { found = i + 1; break; }
    }
    if (found < 0) throw new Error('লেনদেনটি পাওয়া যায়নি।');
    sheet.getRange(found, 2).setNumberFormat('@');
    sheet.getRange(found, 2, 1, 4).setValues([[date, type, amount, note]]);
    sheet.getRange(found, PH_EXTRA_COL).setValue(now);
  } else {
    id = generateUniqueId('PH');
    var row = sheet.getLastRow() + 1;
    sheet.getRange(row, 2).setNumberFormat('@'); // date as plain text, avoids Sheets date-format drift
    sheet.getRange(row, 1, 1, 7).setValues([[id, date, type, amount, note, 0, '']]);
    sheet.getRange(row, PH_EXTRA_COL).setValue(now);
  }

  phRecalcRunningBalance_();
  return getPrinceHisabData(token);
}

/** Returns the refreshed getPrinceHisabData() payload. */
function deletePrinceHisabTransaction(token, id) {
  phAuth_(token);

  var sheet = phSheet_();
  var data = sheet.getDataRange().getValues();
  for (var i = 1; i < data.length; i++) {
    if (String(data[i][0]) === String(id)) {
      sheet.deleteRow(i + 1);
      phRecalcRunningBalance_();
      break;
    }
  }
  return getPrinceHisabData(token);
}
