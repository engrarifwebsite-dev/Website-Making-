/**
 * Server_Zakat.gs
 * Server support for the যাকাত ও ফিতরা page (Page_Zakat.html) — Phase 10.
 *
 * ------------------------------------------------------------------
 * NOTE (2026-10-03, Phase 10 build): Full dashboard built to match the
 * project owner's reference design image. Uses the schema already laid
 * out in Setup_Zakat.gs (ZakatYears, Assets, Loans_Given, Loans_Received,
 * Payments, Fitra, Wife_Assets, Wife_Payments, ZakatAssetCategories,
 * FitraRates) — no spreadsheet structure changes were needed, the setup
 * file already anticipated this exact build.
 *
 * Key decisions:
 *   - "চলমান যাকাত বছর" (the current ZakatYears row with Status='Active')
 *     is auto-created the first time getZakatData() runs if none exists.
 *     Only one row is ever Active at a time. "বছর শেষে চূড়ান্ত হিসাব
 *     সম্পন্ন করুন" (closeZakatYear) closes it and opens the next one.
 *   - যাকাতযোগ্য সম্পদ (C) only counts asset rows whose category has
 *     Zakatable=TRUE (ZakatAssetCategories), plus outstanding
 *     Loans_Given (money owed TO me — a zakatable receivable). নিট সম্পদ
 *     (B) counts every asset row regardless of category, same Loans_Given
 *     addition. Both subtract outstanding Loans_Received (money I owe).
 *   - দেনা-পাওনা (Net) is meant to eventually sync automatically from
 *     "প্রিন্স হিসাব" (Phase 11, not yet built). Until then this page
 *     manages Loans_Given/Loans_Received directly (a small modal) — the
 *     same two tabs Prince Hisab will read/write later, so nothing will
 *     need to migrate once that phase exists.
 *   - স্ত্রীর জন্য যাকাত হিসাব (Wife_Assets) has no category linkage in
 *     the current schema (see Setup_Zakat.gs note — left unchanged), so
 *     every wife asset row is treated as zakatable: wife's নিট = wife's
 *     যাকাতযোগ্য সম্পদ.
 *   - "আমার লেনদেন" / "বাজেট ও লেনদেন" auto-sync mentioned in the design
 *     (আয়/ব্যয়) depends on modules not yet built (Phase 9/11); the page
 *     shows that as an informational note only, no live sync yet.
 *
 * Requires: Config.gs, Auth.gs (validateSession), Utils_ID.gs
 * (generateUniqueId), Utils_Sheets.gs (ensureSheetWithHeaders),
 * Server_PowerGrid.gs (reused: PG_TZ, pgNum_, pgDateStr_ — already global
 * in this Apps Script project, not redefined here).
 * ------------------------------------------------------------------
 */

var ZK_YEAR_HEADERS = ['ZakatYearID', 'RamadanStart', 'RamadanEnd', 'Status', 'HijriYear', 'StartedAt', 'ClosedAt'];
var ZK_ASSET_HEADERS = ['AssetID', 'SourceModule', 'SourceRecordID', 'AssetType', 'Value', 'LinkedAt', 'CategoryID', 'Notes', 'UpdatedAt'];
var ZK_LOAN_HEADERS = ['LoanID', 'Person', 'Amount', 'Date', 'Status', 'Outstanding'];
var ZK_PAYMENT_HEADERS = ['PaymentID', 'ZakatYearID', 'Date', 'Amount', 'Type', 'Notes', 'Recipient'];
var ZK_FITRA_HEADERS = ['ZakatYearID', 'FamilyMemberCount', 'PerPersonAmount', 'TotalAmount', 'Date', 'CategoryName', 'Notes', 'PaymentID'];
var ZK_WIFE_ASSET_HEADERS = ['AssetID', 'AssetType', 'Value', 'UpdatedAt'];
var ZK_WIFE_PAYMENT_HEADERS = ['PaymentID', 'ZakatYearID', 'Date', 'Amount', 'Type', 'Notes'];
var ZK_CATEGORY_HEADERS = ['CategoryID', 'Name', 'Icon', 'DisplayOrder', 'Zakatable'];
var ZK_RATE_HEADERS = ['RateID', 'CategoryName', 'AmountPerPerson', 'DisplayOrder', 'UpdatedAt'];

var ZK_RATE_PERCENT = 2.5;

/* ============================================================
 * Small helpers
 * ============================================================ */

function zkSs_() { return SpreadsheetApp.openById(SPREADSHEET_IDS.Zakat_Fitra); }

function zkAuth_(token) {
  var user = validateSession(token);
  if (!user) throw new Error('সেশন মেয়াদোত্তীর্ণ হয়ে গেছে, আবার লগইন করুন।');
  return user;
}

function zkSheet_(name, headers) { return ensureSheetWithHeaders(zkSs_(), name, headers); }

function zkRows_(sheetName, headers) {
  var sheet = zkSheet_(sheetName, headers);
  var lastRow = sheet.getLastRow();
  if (lastRow < 2) return [];
  return sheet.getRange(2, 1, lastRow - 1, headers.length).getValues();
}

function zkRound_(n) { return Math.round((Number(n) || 0) * 100) / 100; }

/* ============================================================
 * চলমান যাকাত বছর (ZakatYears)
 * ============================================================ */

function zkGetActiveYear_(hijriYearHint) {
  var sheet = zkSheet_('ZakatYears', ZK_YEAR_HEADERS);
  var data = zkRows_('ZakatYears', ZK_YEAR_HEADERS);
  for (var i = 0; i < data.length; i++) {
    if (String(data[i][3]) === 'Active') {
      return { id: String(data[i][0]), hijriYear: String(data[i][4] || ''), startedAt: data[i][5] };
    }
  }
  // কোনো Active বছর নেই — প্রথমবার ব্যবহারে নতুন একটি বছর শুরু করা হচ্ছে।
  var id = generateUniqueId('ZY');
  var now = new Date();
  sheet.appendRow(['', '', '', 'Active', hijriYearHint || '', now, '']);
  var lastRow = sheet.getLastRow();
  sheet.getRange(lastRow, 1).setValue(id);
  return { id: id, hijriYear: hijriYearHint || '', startedAt: now };
}

/** Starts a fresh year (Status='Active') and closes whichever one is currently active. */
function closeZakatYear(token, newHijriYearLabel) {
  zkAuth_(token);
  var sheet = zkSheet_('ZakatYears', ZK_YEAR_HEADERS);
  var data = sheet.getDataRange().getValues();
  var now = new Date();
  for (var i = 1; i < data.length; i++) {
    if (String(data[i][3]) === 'Active') {
      sheet.getRange(i + 1, 4).setValue('Closed');
      sheet.getRange(i + 1, 7).setValue(now);
    }
  }
  var id = generateUniqueId('ZY');
  sheet.appendRow([id, '', '', 'Active', newHijriYearLabel || '', now, '']);
  return getZakatData(token);
}

/* ============================================================
 * ক্যাটাগরি / ফিতরা রেট (seeded by Setup_Zakat.gs — read-only lookups here,
 * plus simple edit for Fitra rates since those change every year)
 * ============================================================ */

function zkCategoriesMap_() {
  var rows = zkRows_('ZakatAssetCategories', ZK_CATEGORY_HEADERS);
  var map = {};
  var list = [];
  rows.forEach(function (r) {
    var cat = { id: String(r[0]), name: String(r[1] || ''), icon: String(r[2] || '📁'), order: Number(r[3]) || 0, zakatable: r[4] === true || String(r[4]).toUpperCase() === 'TRUE' };
    map[cat.id] = cat;
    list.push(cat);
  });
  list.sort(function (a, b) { return a.order - b.order; });
  return { map: map, list: list };
}

/* ============================================================
 * আমার সম্পদ (Assets)
 * ============================================================ */

function zkReadAssets_() {
  var rows = zkRows_('Assets', ZK_ASSET_HEADERS);
  return rows.map(function (r) {
    return {
      id: String(r[0]),
      sourceModule: String(r[1] || 'Manual'),
      assetType: String(r[3] || ''),
      value: pgNum_(r[4]),
      categoryId: String(r[6] || ''),
      notes: String(r[7] || '')
    };
  }).filter(function (a) { return a.id; });
}

/**
 * asset = { id (blank for new), categoryId, value, notes }
 */
function saveAsset(token, asset) {
  zkAuth_(token);
  asset = asset || {};
  var cats = zkCategoriesMap_();
  var cat = cats.map[String(asset.categoryId || '')];
  if (!cat) throw new Error('সম্পদের ক্যাটাগরি নির্বাচন করুন।');
  var value = pgNum_(asset.value);
  if (!(value >= 0)) throw new Error('সঠিক পরিমাণ দিন।');
  var notes = String(asset.notes || '').trim().substring(0, 300);

  var sheet = zkSheet_('Assets', ZK_ASSET_HEADERS);
  var now = new Date();
  var id = asset.id ? String(asset.id) : '';

  if (id) {
    var data = sheet.getDataRange().getValues();
    var found = -1;
    for (var i = 1; i < data.length; i++) { if (String(data[i][0]) === id) { found = i + 1; break; } }
    if (found < 0) throw new Error('সম্পদের তথ্য পাওয়া যায়নি।');
    sheet.getRange(found, 4, 1, 3).setValues([[cat.name, value, data[found - 1][5] || now]]);
    sheet.getRange(found, 7, 1, 3).setValues([[cat.id, notes, now]]);
  } else {
    id = generateUniqueId('ZAST');
    sheet.appendRow([id, 'Manual', '', cat.name, value, now, cat.id, notes, now]);
  }
  return getZakatData(token);
}

function deleteAsset(token, id) {
  zkAuth_(token);
  var sheet = zkSheet_('Assets', ZK_ASSET_HEADERS);
  var data = sheet.getDataRange().getValues();
  for (var i = 1; i < data.length; i++) {
    if (String(data[i][0]) === String(id)) { sheet.deleteRow(i + 1); return getZakatData(token); }
  }
  throw new Error('সম্পদের তথ্য পাওয়া যায়নি।');
}

/* ============================================================
 * দেনা-পাওনা (Loans_Given / Loans_Received) — ভবিষ্যতে প্রিন্স হিসাব
 * (Phase 11) একই দুটি ট্যাব ব্যবহার করবে, তাই কাঠামো অপরিবর্তিত রাখা হলো।
 * ============================================================ */

function zkLoanSheetName_(kind) {
  if (kind !== 'given' && kind !== 'received') throw new Error('অবৈধ ধরন।');
  return kind === 'given' ? 'Loans_Given' : 'Loans_Received';
}

function zkReadLoans_(kind) {
  var rows = zkRows_(zkLoanSheetName_(kind), ZK_LOAN_HEADERS);
  return rows.map(function (r) {
    return {
      id: String(r[0]),
      person: String(r[1] || ''),
      amount: pgNum_(r[2]),
      date: pgDateStr_(r[3]),
      status: String(r[4] || 'Active'),
      outstanding: pgNum_(r[5])
    };
  }).filter(function (l) { return l.id; });
}

/** loan = { id, person, amount, date, status: 'Active'|'Paid' } */
function saveLoan(token, kind, loan) {
  zkAuth_(token);
  loan = loan || {};
  var person = String(loan.person || '').trim();
  if (!person) throw new Error('ব্যক্তির নাম দিন।');
  var amount = pgNum_(loan.amount);
  if (!(amount > 0)) throw new Error('সঠিক পরিমাণ দিন।');
  var date = pgDateStr_(loan.date) || String(loan.date || '').trim();
  var status = (loan.status === 'Paid') ? 'Paid' : 'Active';
  var outstanding = status === 'Paid' ? 0 : amount;

  var sheet = zkSheet_(zkLoanSheetName_(kind), ZK_LOAN_HEADERS);
  var id = loan.id ? String(loan.id) : '';
  if (id) {
    var data = sheet.getDataRange().getValues();
    var found = -1;
    for (var i = 1; i < data.length; i++) { if (String(data[i][0]) === id) { found = i + 1; break; } }
    if (found < 0) throw new Error('তথ্য পাওয়া যায়নি।');
    sheet.getRange(found, 2).setNumberFormat('@');
    sheet.getRange(found, 2, 1, 5).setValues([[person, amount, date, status, outstanding]]);
  } else {
    id = generateUniqueId('LOAN');
    sheet.appendRow([id, person, amount, date, status, outstanding]);
  }
  return getZakatData(token);
}

function deleteLoan(token, kind, id) {
  zkAuth_(token);
  var sheet = zkSheet_(zkLoanSheetName_(kind), ZK_LOAN_HEADERS);
  var data = sheet.getDataRange().getValues();
  for (var i = 1; i < data.length; i++) {
    if (String(data[i][0]) === String(id)) { sheet.deleteRow(i + 1); return getZakatData(token); }
  }
  throw new Error('তথ্য পাওয়া যায়নি।');
}

/* ============================================================
 * যাকাত আদায় রেকর্ড (Payments) — চলমান বছরের অগ্রিম/চূড়ান্ত আদায়
 * ============================================================ */

function zkReadPayments_(zakatYearId) {
  var rows = zkRows_('Payments', ZK_PAYMENT_HEADERS);
  return rows.map(function (r) {
    return {
      id: String(r[0]),
      zakatYearId: String(r[1] || ''),
      date: pgDateStr_(r[2]),
      amount: pgNum_(r[3]),
      type: String(r[4] || 'Zakat'),
      notes: String(r[5] || ''),
      recipient: String(r[6] || '')
    };
  }).filter(function (p) { return p.id && (!zakatYearId || p.zakatYearId === zakatYearId); })
    .sort(function (a, b) { return a.date < b.date ? -1 : (a.date > b.date ? 1 : 0); });
}

/** payment = { date, amount, recipient, notes } — always recorded against the current active year. */
function savePayment(token, payment) {
  zkAuth_(token);
  payment = payment || {};
  var amount = pgNum_(payment.amount);
  if (!(amount > 0)) throw new Error('সঠিক পরিমাণ দিন।');
  var date = pgDateStr_(payment.date) || String(payment.date || '').trim();
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) throw new Error('সঠিক তারিখ দিন।');
  var recipient = String(payment.recipient || '').trim().substring(0, 150);
  var notes = String(payment.notes || '').trim().substring(0, 300);

  var year = zkGetActiveYear_();
  var sheet = zkSheet_('Payments', ZK_PAYMENT_HEADERS);
  var id = generateUniqueId('ZPAY');
  sheet.getRange(sheet.getLastRow() + 1, 3).setNumberFormat('@');
  sheet.appendRow([id, year.id, date, amount, 'Zakat', notes, recipient]);
  return getZakatData(token);
}

function deletePayment(token, id) {
  zkAuth_(token);
  var sheet = zkSheet_('Payments', ZK_PAYMENT_HEADERS);
  var data = sheet.getDataRange().getValues();
  for (var i = 1; i < data.length; i++) {
    if (String(data[i][0]) === String(id)) { sheet.deleteRow(i + 1); return getZakatData(token); }
  }
  throw new Error('তথ্য পাওয়া যায়নি।');
}

/* ============================================================
 * ফিতরার রেফারেন্স রেট (FitraRates) — প্রতি বছর আপডেট করা যায়
 * ============================================================ */

function zkReadFitraRates_() {
  var rows = zkRows_('FitraRates', ZK_RATE_HEADERS);
  return rows.map(function (r) {
    return { id: String(r[0]), categoryName: String(r[1] || ''), amountPerPerson: pgNum_(r[2]), order: Number(r[3]) || 0, updatedAt: r[4] };
  }).filter(function (r) { return r.id; }).sort(function (a, b) { return a.order - b.order; });
}

/** rate = { id (blank for new), categoryName, amountPerPerson } */
function saveFitraRate(token, rate) {
  zkAuth_(token);
  rate = rate || {};
  var categoryName = String(rate.categoryName || '').trim();
  if (!categoryName) throw new Error('ক্যাটাগরির নাম দিন।');
  var amount = pgNum_(rate.amountPerPerson);
  if (!(amount > 0)) throw new Error('সঠিক পরিমাণ দিন।');
  var now = new Date();

  var sheet = zkSheet_('FitraRates', ZK_RATE_HEADERS);
  var id = rate.id ? String(rate.id) : '';
  if (id) {
    var data = sheet.getDataRange().getValues();
    var found = -1;
    for (var i = 1; i < data.length; i++) { if (String(data[i][0]) === id) { found = i + 1; break; } }
    if (found < 0) throw new Error('রেট পাওয়া যায়নি।');
    sheet.getRange(found, 2, 1, 4).setValues([[categoryName, amount, data[found - 1][3] || 1, now]]);
  } else {
    var order = sheet.getLastRow(); // নতুন সারি শেষে যোগ হবে
    sheet.appendRow([generateUniqueId('FRATE'), categoryName, amount, order, now]);
  }
  return getZakatData(token);
}

function deleteFitraRate(token, id) {
  zkAuth_(token);
  var sheet = zkSheet_('FitraRates', ZK_RATE_HEADERS);
  var data = sheet.getDataRange().getValues();
  for (var i = 1; i < data.length; i++) {
    if (String(data[i][0]) === String(id)) { sheet.deleteRow(i + 1); return getZakatData(token); }
  }
  throw new Error('রেট পাওয়া যায়নি।');
}

/* ============================================================
 * ফিতরা প্রদান (Fitra লগ)
 * ============================================================ */

function zkReadFitraLog_(zakatYearId) {
  var rows = zkRows_('Fitra', ZK_FITRA_HEADERS);
  return rows.map(function (r) {
    return {
      zakatYearId: String(r[0] || ''),
      familyMemberCount: pgNum_(r[1]),
      perPersonAmount: pgNum_(r[2]),
      totalAmount: pgNum_(r[3]),
      date: pgDateStr_(r[4]),
      categoryName: String(r[5] || ''),
      notes: String(r[6] || '')
    };
  }).filter(function (f) { return !zakatYearId || f.zakatYearId === zakatYearId; });
}

/** entry = { categoryName, perPersonAmount, familyMemberCount, notes } */
function saveFitraPayment(token, entry) {
  zkAuth_(token);
  entry = entry || {};
  var perPerson = pgNum_(entry.perPersonAmount);
  var count = pgNum_(entry.familyMemberCount);
  if (!(perPerson > 0)) throw new Error('প্রতি ব্যক্তি ফিতরার পরিমাণ সঠিক নয়।');
  if (!(count > 0)) throw new Error('সদস্য সংখ্যা সঠিক নয়।');
  var categoryName = String(entry.categoryName || '').trim() || 'গম/আটা';
  var notes = String(entry.notes || '').trim().substring(0, 300);
  var total = zkRound_(perPerson * count);

  var year = zkGetActiveYear_();
  var sheet = zkSheet_('Fitra', ZK_FITRA_HEADERS);
  var today = Utilities.formatDate(new Date(), PG_TZ, 'yyyy-MM-dd');
  sheet.getRange(sheet.getLastRow() + 1, 5).setNumberFormat('@');
  sheet.appendRow([year.id, count, perPerson, total, today, categoryName, notes, '']);
  return getZakatData(token);
}

/* ============================================================
 * স্ত্রীর জন্য যাকাত হিসাব (Wife_Assets / Wife_Payments)
 * ============================================================ */

function zkReadWifeAssets_() {
  var rows = zkRows_('Wife_Assets', ZK_WIFE_ASSET_HEADERS);
  return rows.map(function (r) {
    return { id: String(r[0]), assetType: String(r[1] || ''), value: pgNum_(r[2]) };
  }).filter(function (a) { return a.id; });
}

/** asset = { id (blank for new), assetType, value } */
function saveWifeAsset(token, asset) {
  zkAuth_(token);
  asset = asset || {};
  var assetType = String(asset.assetType || '').trim();
  if (!assetType) throw new Error('সম্পদের ধরন দিন।');
  var value = pgNum_(asset.value);
  if (!(value >= 0)) throw new Error('সঠিক পরিমাণ দিন।');
  var now = new Date();

  var sheet = zkSheet_('Wife_Assets', ZK_WIFE_ASSET_HEADERS);
  var id = asset.id ? String(asset.id) : '';
  if (id) {
    var data = sheet.getDataRange().getValues();
    var found = -1;
    for (var i = 1; i < data.length; i++) { if (String(data[i][0]) === id) { found = i + 1; break; } }
    if (found < 0) throw new Error('তথ্য পাওয়া যায়নি।');
    sheet.getRange(found, 2, 1, 3).setValues([[assetType, value, now]]);
  } else {
    id = generateUniqueId('WZAST');
    sheet.appendRow([id, assetType, value, now]);
  }
  return getZakatData(token);
}

function deleteWifeAsset(token, id) {
  zkAuth_(token);
  var sheet = zkSheet_('Wife_Assets', ZK_WIFE_ASSET_HEADERS);
  var data = sheet.getDataRange().getValues();
  for (var i = 1; i < data.length; i++) {
    if (String(data[i][0]) === String(id)) { sheet.deleteRow(i + 1); return getZakatData(token); }
  }
  throw new Error('তথ্য পাওয়া যায়নি।');
}

function zkReadWifePayments_(zakatYearId) {
  var rows = zkRows_('Wife_Payments', ZK_WIFE_PAYMENT_HEADERS);
  return rows.map(function (r) {
    return { id: String(r[0]), zakatYearId: String(r[1] || ''), date: pgDateStr_(r[2]), amount: pgNum_(r[3]), type: String(r[4] || 'Zakat'), notes: String(r[5] || '') };
  }).filter(function (p) { return p.id && (!zakatYearId || p.zakatYearId === zakatYearId); });
}

/** payment = { date, amount, notes } */
function saveWifePayment(token, payment) {
  zkAuth_(token);
  payment = payment || {};
  var amount = pgNum_(payment.amount);
  if (!(amount > 0)) throw new Error('সঠিক পরিমাণ দিন।');
  var date = pgDateStr_(payment.date) || String(payment.date || '').trim();
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) throw new Error('সঠিক তারিখ দিন।');
  var notes = String(payment.notes || '').trim().substring(0, 300);

  var year = zkGetActiveYear_();
  var sheet = zkSheet_('Wife_Payments', ZK_WIFE_PAYMENT_HEADERS);
  sheet.getRange(sheet.getLastRow() + 1, 3).setNumberFormat('@');
  sheet.appendRow([generateUniqueId('WZPAY'), year.id, date, amount, 'Zakat', notes]);
  return getZakatData(token);
}

function deleteWifePayment(token, id) {
  zkAuth_(token);
  var sheet = zkSheet_('Wife_Payments', ZK_WIFE_PAYMENT_HEADERS);
  var data = sheet.getDataRange().getValues();
  for (var i = 1; i < data.length; i++) {
    if (String(data[i][0]) === String(id)) { sheet.deleteRow(i + 1); return getZakatData(token); }
  }
  throw new Error('তথ্য পাওয়া যায়নি।');
}

/* ============================================================
 * সব হিসাব এক জায়গায় — getZakatData()
 * ============================================================ */

/**
 * hijriYearHint: client-computed current Hijri year label (e.g. "১৪৪৬-১৪৪৭"),
 * only used the very first time a ZakatYears row is bootstrapped.
 */
function getZakatData(token, hijriYearHint) {
  zkAuth_(token);

  var year = zkGetActiveYear_(hijriYearHint);
  var cats = zkCategoriesMap_();

  var assets = zkReadAssets_();
  var totalAssetsAll = 0, totalAssetsZakatable = 0;
  var assetsOut = assets.map(function (a) {
    var cat = cats.map[a.categoryId];
    var zakatable = cat ? cat.zakatable : true;
    totalAssetsAll += a.value;
    if (zakatable) totalAssetsZakatable += a.value;
    return {
      id: a.id, categoryId: a.categoryId, categoryName: cat ? cat.name : a.assetType,
      icon: cat ? cat.icon : '📁', value: a.value, notes: a.notes, zakatable: zakatable
    };
  });

  var loansGiven = zkReadLoans_('given');
  var loansReceived = zkReadLoans_('received');
  var loansGivenOutstanding = loansGiven.reduce(function (s, l) { return s + l.outstanding; }, 0);
  var loansReceivedOutstanding = loansReceived.reduce(function (s, l) { return s + l.outstanding; }, 0);
  var netLiabilities = zkRound_(loansReceivedOutstanding);

  var totalAssetsA = zkRound_(totalAssetsAll);
  var netB = zkRound_(totalAssetsAll + loansGivenOutstanding - loansReceivedOutstanding);
  var zakatableC = zkRound_(totalAssetsZakatable + loansGivenOutstanding - loansReceivedOutstanding);
  var zakatAmount = zkRound_(zakatableC * (ZK_RATE_PERCENT / 100));

  var payments = zkReadPayments_(year.id);
  var totalPaid = zkRound_(payments.reduce(function (s, p) { return s + p.amount; }, 0));
  var remaining = zkRound_(Math.max(0, zakatAmount - totalPaid));
  var allPayments = zkReadPayments_(null); // চলমান বছর শেষ হয়ে গেলেও ইতিহাস ধরে রাখার জন্য

  var fitraRates = zkReadFitraRates_();
  var fitraLogThisYear = zkReadFitraLog_(year.id);
  var totalFitraThisYear = zkRound_(fitraLogThisYear.reduce(function (s, f) { return s + f.totalAmount; }, 0));

  var wifeAssets = zkReadWifeAssets_();
  var wifeTotal = zkRound_(wifeAssets.reduce(function (s, a) { return s + a.value; }, 0));
  var wifeZakat = zkRound_(wifeTotal * (ZK_RATE_PERCENT / 100));
  var wifePayments = zkReadWifePayments_(year.id);
  var wifePaid = zkRound_(wifePayments.reduce(function (s, p) { return s + p.amount; }, 0));
  var wifeRemaining = zkRound_(Math.max(0, wifeZakat - wifePaid));

  var percentPaid = zakatAmount > 0 ? Math.min(100, zkRound_((totalPaid / zakatAmount) * 100)) : 0;

  return {
    year: { id: year.id, hijriYear: year.hijriYear, startedAt: pgDateStr_(year.startedAt) },
    ratePercent: ZK_RATE_PERCENT,

    categories: cats.list,
    assets: assetsOut,
    totalAssetsA: totalAssetsA,
    netB: netB,
    zakatableC: zakatableC,
    netLiabilities: netLiabilities,
    zakatAmount: zakatAmount,

    loansGiven: loansGiven,
    loansReceived: loansReceived,
    loansGivenOutstanding: zkRound_(loansGivenOutstanding),
    loansReceivedOutstanding: zkRound_(loansReceivedOutstanding),

    payments: payments,
    paymentsHistory: allPayments,
    totalPaid: totalPaid,
    remaining: remaining,
    percentPaid: percentPaid,

    fitraRates: fitraRates,
    fitraLog: fitraLogThisYear,
    totalFitraThisYear: totalFitraThisYear,

    wifeAssets: wifeAssets,
    wifeTotal: wifeTotal,
    wifeZakatable: wifeTotal,
    wifeZakat: wifeZakat,
    wifePayments: wifePayments,
    wifePaid: wifePaid,
    wifeRemaining: wifeRemaining
  };
}
