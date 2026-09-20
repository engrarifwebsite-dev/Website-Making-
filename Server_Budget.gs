/**
 * Server_Budget.gs
 * Server support for the বাজেট ব্যবস্থাপনা page (Page_Budget.html).
 *
 * Uses the month tabs already created by Setup_Budget.gs:
 *   "<Month Year> - Income"  : TxnID, Date, Time, Source, Amount, BankID, Notes, GlobalSyncID
 *   "<Month Year> - Budget"  : CategoryID, CategoryName, BudgetAmount, ThresholdWarning, ThresholdCritical
 *   "<Month Year> - Expense" : TxnID, Date, Time, CategoryID, Description, Amount, BankID
 *   "<Month Year> - Ledger"  : TxnID, Date, Time, Description, Debit, Credit, RunningBalance
 * Month label format is the same as getCurrentBengaliMonthLabel(), e.g. "সেপ্টেম্বর 2026".
 *
 * One extra tab is created automatically on first use:
 *   "SavingsGoals" : MonthLabel, GoalAmount, UpdatedAt
 *
 * Requires: Config.gs, Auth.gs (validateSession), Utils_ID.gs (generateUniqueId),
 * Utils_Sheets.gs (ensureSheetWithHeaders) and Setup_Budget.gs (createBudgetMonthTabs).
 *
 * Every function needs a valid session token — budget data is financial.
 */

var BUDGET_TZ = 'Asia/Dhaka';
var BUDGET_MONTHS_BN = [
  'জানুয়ারি', 'ফেব্রুয়ারি', 'মার্চ', 'এপ্রিল', 'মে', 'জুন',
  'জুলাই', 'আগস্ট', 'সেপ্টেম্বর', 'অক্টোবর', 'নভেম্বর', 'ডিসেম্বর'
];
var BUDGET_DEFAULT_WARN = 80;   // % used -> amber
var BUDGET_DEFAULT_CRIT = 95;   // % used -> orange (100% and above is red)

/* ============================================================
 * Small helpers
 * ============================================================ */

function budgetSs_() {
  return SpreadsheetApp.openById(SPREADSHEET_IDS.Budget_Management);
}

function budgetAuth_(token) {
  var user = validateSession(token);
  if (!user) throw new Error('সেশন মেয়াদোত্তীর্ণ হয়ে গেছে, আবার লগইন করুন।');
  return user;
}

function budgetMonthLabel_(y, m) { return BUDGET_MONTHS_BN[m - 1] + ' ' + y; }
function budgetKey_(y, m) { return y + '-' + ('0' + m).slice(-2); }

/** "2026-09" -> {y:2026, m:9}. Falls back to the current Dhaka month. */
function budgetParseKey_(key) {
  var mt = /^(\d{4})-(\d{2})$/.exec(String(key || ''));
  if (mt && Number(mt[2]) >= 1 && Number(mt[2]) <= 12) {
    return { y: Number(mt[1]), m: Number(mt[2]) };
  }
  var now = new Date();
  return {
    y: Number(Utilities.formatDate(now, BUDGET_TZ, 'yyyy')),
    m: Number(Utilities.formatDate(now, BUDGET_TZ, 'M'))
  };
}

function budgetShift_(p, delta) {
  var idx = p.y * 12 + (p.m - 1) + delta;
  return { y: Math.floor(idx / 12), m: (idx % 12) + 1 };
}

function budgetNum_(v) {
  var n = parseFloat(String(v === null || v === undefined ? '' : v).replace(/,/g, ''));
  return isFinite(n) ? n : 0;
}

function budgetDateStr_(v) {
  if (!v) return '';
  if (v instanceof Date) return Utilities.formatDate(v, BUDGET_TZ, 'yyyy-MM-dd');
  return String(v).trim();
}

function budgetTimeStr_(v) {
  if (!v) return '';
  if (v instanceof Date) return Utilities.formatDate(v, BUDGET_TZ, 'HH:mm');
  return String(v).trim();
}

function budgetEnsureMonth_(ss, p) {
  var label = budgetMonthLabel_(p.y, p.m);
  createBudgetMonthTabs(ss, label); // safe to call again — never touches existing data
  return label;
}

/** Reads one month's categories, income and expenses. Missing tabs give empty lists. */
function budgetReadMonth_(ss, p) {
  var label = budgetMonthLabel_(p.y, p.m);
  var out = { label: label, categories: [], income: [], expenses: [] };
  var data, i, row;

  var bs = ss.getSheetByName(label + ' - Budget');
  if (bs) {
    data = bs.getDataRange().getValues();
    for (i = 1; i < data.length; i++) {
      row = data[i];
      if (!row[0]) continue;
      out.categories.push({
        id: String(row[0]),
        name: String(row[1] || ''),
        budget: budgetNum_(row[2]),
        warn: row[3] === '' ? BUDGET_DEFAULT_WARN : budgetNum_(row[3]),
        crit: row[4] === '' ? BUDGET_DEFAULT_CRIT : budgetNum_(row[4])
      });
    }
  }

  var is = ss.getSheetByName(label + ' - Income');
  if (is) {
    data = is.getDataRange().getValues();
    for (i = 1; i < data.length; i++) {
      row = data[i];
      if (!row[0]) continue;
      out.income.push({
        id: String(row[0]),
        date: budgetDateStr_(row[1]),
        time: budgetTimeStr_(row[2]),
        source: String(row[3] || ''),
        amount: budgetNum_(row[4]),
        notes: String(row[6] || '')
      });
    }
  }

  var es = ss.getSheetByName(label + ' - Expense');
  if (es) {
    data = es.getDataRange().getValues();
    for (i = 1; i < data.length; i++) {
      row = data[i];
      if (!row[0]) continue;
      out.expenses.push({
        id: String(row[0]),
        date: budgetDateStr_(row[1]),
        time: budgetTimeStr_(row[2]),
        categoryId: String(row[3] || ''),
        description: String(row[4] || ''),
        amount: budgetNum_(row[5])
      });
    }
  }
  return out;
}

function budgetSum_(list) {
  var t = 0;
  for (var i = 0; i < list.length; i++) t += list[i].amount;
  return t;
}

function budgetGetGoal_(ss, label) {
  var sheet = ss.getSheetByName('SavingsGoals');
  if (!sheet) return 0;
  var data = sheet.getDataRange().getValues();
  for (var i = 1; i < data.length; i++) {
    if (String(data[i][0]) === label) return budgetNum_(data[i][1]);
  }
  return 0;
}

/* ============================================================
 * Dashboard — one call returns everything the page needs
 * ============================================================ */

/**
 * monthKey    = "YYYY-MM" (blank = current month)
 * trendMonths = how many months (ending at monthKey) the bar chart shows, 2–12
 */
function getBudgetDashboard(token, monthKey, trendMonths) {
  budgetAuth_(token);

  var ss = budgetSs_();
  var cur = budgetParseKey_(monthKey);
  var n = Math.max(2, Math.min(12, parseInt(trendMonths, 10) || 5));

  var cache = {};
  function get(p) {
    var k = budgetKey_(p.y, p.m);
    if (!cache[k]) cache[k] = budgetReadMonth_(ss, p);
    return cache[k];
  }

  var data = get(cur);
  var income = budgetSum_(data.income);
  var expense = budgetSum_(data.expenses);

  var prevData = get(budgetShift_(cur, -1));
  var prevIncome = budgetSum_(prevData.income);
  var prevExpense = budgetSum_(prevData.expenses);

  // spending per category
  var spentBy = {};
  data.expenses.forEach(function (e) {
    spentBy[e.categoryId] = (spentBy[e.categoryId] || 0) + e.amount;
  });

  var known = {};
  var budgetTotal = 0;
  var categories = data.categories.map(function (c) {
    known[c.id] = true;
    budgetTotal += c.budget;
    return {
      id: c.id, name: c.name, budget: c.budget,
      spent: spentBy[c.id] || 0, warn: c.warn, crit: c.crit, uncat: false
    };
  });

  // expenses whose category was deleted (or never set) are kept visible
  var orphan = 0;
  data.expenses.forEach(function (e) { if (!known[e.categoryId]) orphan += e.amount; });
  if (orphan > 0) {
    categories.push({
      id: '', name: 'ক্যাটাগরিহীন', budget: 0, spent: orphan,
      warn: BUDGET_DEFAULT_WARN, crit: BUDGET_DEFAULT_CRIT, uncat: true
    });
  }

  var catName = {};
  data.categories.forEach(function (c) { catName[c.id] = c.name; });

  var transactions = [];
  data.expenses.forEach(function (e) {
    transactions.push({
      id: e.id, type: 'expense', date: e.date, time: e.time, amount: e.amount,
      title: e.description || catName[e.categoryId] || 'ব্যয়',
      categoryId: e.categoryId, categoryName: catName[e.categoryId] || ''
    });
  });
  data.income.forEach(function (r) {
    transactions.push({
      id: r.id, type: 'income', date: r.date, time: r.time, amount: r.amount,
      title: r.source || 'আয়', categoryId: '', categoryName: ''
    });
  });
  transactions.sort(function (a, b) {
    var ka = a.date + ' ' + a.time, kb = b.date + ' ' + b.time;
    if (ka === kb) return a.id < b.id ? 1 : -1;
    return ka < kb ? 1 : -1; // newest first
  });

  var trend = [];
  for (var i = n - 1; i >= 0; i--) {
    var p = budgetShift_(cur, -i);
    var d = get(p);
    var inc = budgetSum_(d.income);
    var exp = budgetSum_(d.expenses);
    trend.push({
      key: budgetKey_(p.y, p.m),
      name: BUDGET_MONTHS_BN[p.m - 1],
      income: inc, expense: exp, savings: inc - exp
    });
  }

  return {
    monthKey: budgetKey_(cur.y, cur.m),
    monthLabel: data.label,
    year: cur.y,
    month: cur.m,
    income: income,
    expense: expense,
    savings: income - expense,
    budgetTotal: budgetTotal,
    goal: budgetGetGoal_(ss, data.label),
    prev: { income: prevIncome, expense: prevExpense, savings: prevIncome - prevExpense },
    categories: categories,
    transactions: transactions,
    trend: trend
  };
}

/* ============================================================
 * Categories (this month's Budget tab)
 * ============================================================ */

/**
 * cat = { id (blank for new), name, budget, warn, crit }
 * Adds a new category or updates an existing one for that month.
 */
function saveBudgetCategory(token, monthKey, cat) {
  budgetAuth_(token);

  var name = String((cat && cat.name) || '').trim();
  if (!name) throw new Error('ক্যাটাগরির নাম আবশ্যক।');

  var amount = budgetNum_(cat.budget);
  if (amount < 0) throw new Error('বাজেটের পরিমাণ ঋণাত্মক হতে পারে না।');

  var warn = (cat.warn === '' || cat.warn === null || cat.warn === undefined) ? BUDGET_DEFAULT_WARN : budgetNum_(cat.warn);
  var crit = (cat.crit === '' || cat.crit === null || cat.crit === undefined) ? BUDGET_DEFAULT_CRIT : budgetNum_(cat.crit);
  if (warn <= 0 || crit <= 0 || warn > crit) {
    throw new Error('সতর্কতা সীমা ০-র বেশি এবং সংকটকালীন সীমার চেয়ে ছোট বা সমান হতে হবে।');
  }

  var ss = budgetSs_();
  var p = budgetParseKey_(monthKey);
  var label = budgetEnsureMonth_(ss, p);
  var sheet = ss.getSheetByName(label + ' - Budget');
  var data = sheet.getDataRange().getValues();

  var id = cat.id ? String(cat.id) : '';
  var foundRow = -1;
  for (var i = 1; i < data.length; i++) {
    if (!data[i][0]) continue;
    if (String(data[i][0]) === id) foundRow = i + 1;
    if (String(data[i][1]).trim().toLowerCase() === name.toLowerCase() && String(data[i][0]) !== id) {
      throw new Error('এই নামে একটি ক্যাটাগরি ইতিমধ্যে আছে।');
    }
  }

  if (id) {
    if (foundRow < 0) throw new Error('ক্যাটাগরি পাওয়া যায়নি।');
    sheet.getRange(foundRow, 2, 1, 4).setValues([[name, amount, warn, crit]]);
    return id;
  }

  id = generateUniqueId('BUD');
  sheet.appendRow([id, name, amount, warn, crit]);
  return id;
}

/**
 * Removes the category from that month's budget. Expenses already recorded
 * under it are NOT deleted — they show up as "ক্যাটাগরিহীন".
 */
function deleteBudgetCategory(token, monthKey, categoryId) {
  budgetAuth_(token);

  var ss = budgetSs_();
  var p = budgetParseKey_(monthKey);
  var sheet = ss.getSheetByName(budgetMonthLabel_(p.y, p.m) + ' - Budget');
  if (!sheet) return false;

  var data = sheet.getDataRange().getValues();
  for (var i = 1; i < data.length; i++) {
    if (String(data[i][0]) === String(categoryId)) {
      sheet.deleteRow(i + 1);
      return true;
    }
  }
  return false;
}

/** Copies the previous month's categories into an EMPTY month. Returns how many were copied. */
function copyBudgetFromPreviousMonth(token, monthKey) {
  budgetAuth_(token);

  var ss = budgetSs_();
  var cur = budgetParseKey_(monthKey);
  var label = budgetEnsureMonth_(ss, cur);

  var existing = budgetReadMonth_(ss, cur).categories;
  if (existing.length) throw new Error('এই মাসে ইতিমধ্যে ক্যাটাগরি আছে।');

  var prev = budgetReadMonth_(ss, budgetShift_(cur, -1)).categories;
  if (!prev.length) throw new Error('আগের মাসে কপি করার মতো কোনো ক্যাটাগরি নেই।');

  var sheet = ss.getSheetByName(label + ' - Budget');
  prev.forEach(function (c) {
    sheet.appendRow([generateUniqueId('BUD'), c.name, c.budget, c.warn, c.crit]);
  });
  return prev.length;
}

/* ============================================================
 * Savings goal (SavingsGoals tab, one row per month)
 * ============================================================ */

function setBudgetGoal(token, monthKey, amount) {
  budgetAuth_(token);

  var value = budgetNum_(amount);
  if (value < 0) throw new Error('লক্ষ্যের পরিমাণ ঋণাত্মক হতে পারে না।');

  var ss = budgetSs_();
  var label = budgetMonthLabel_(budgetParseKey_(monthKey).y, budgetParseKey_(monthKey).m);
  var sheet = ensureSheetWithHeaders(ss, 'SavingsGoals', ['MonthLabel', 'GoalAmount', 'UpdatedAt']);
  var data = sheet.getDataRange().getValues();
  var now = new Date();

  for (var i = 1; i < data.length; i++) {
    if (String(data[i][0]) === label) {
      sheet.getRange(i + 1, 2, 1, 2).setValues([[value, now]]);
      return true;
    }
  }
  var row = sheet.getLastRow() + 1;
  sheet.getRange(row, 1).setNumberFormat('@'); // keep the label as text
  sheet.getRange(row, 1, 1, 3).setValues([[label, value, now]]);
  return true;
}

/* ============================================================
 * Income / expense entries
 * ============================================================ */

/**
 * txn = { type: 'expense' | 'income', date: 'yyyy-MM-dd', time: 'HH:mm' (optional),
 *         amount, categoryId (expense), description (expense),
 *         source (income), notes (income) }
 * The entry goes into the tab of the month the DATE falls in.
 * Returns { monthKey } so the page can jump to that month.
 */
function addBudgetTransaction(token, txn) {
  budgetAuth_(token);

  var type = txn && txn.type === 'income' ? 'income' : 'expense';
  var amount = budgetNum_(txn.amount);
  if (amount <= 0) throw new Error('পরিমাণ ০-র বেশি হতে হবে।');

  var dateStr = String(txn.date || '').trim();
  if (!/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) throw new Error('সঠিক তারিখ দিন।');
  var dateObj = Utilities.parseDate(dateStr, BUDGET_TZ, 'yyyy-MM-dd');

  var time = String(txn.time || '').trim();
  if (!/^\d{2}:\d{2}$/.test(time)) time = Utilities.formatDate(new Date(), BUDGET_TZ, 'HH:mm');

  var p = budgetParseKey_(dateStr.substring(0, 7));
  var ss = budgetSs_();
  var label = budgetEnsureMonth_(ss, p);

  var id, desc, debit = 0, credit = 0;
  if (type === 'expense') {
    id = generateUniqueId('EXP');
    desc = String(txn.description || '').trim();
    var categoryId = String(txn.categoryId || '');
    var sheet = ss.getSheetByName(label + ' - Expense');
    var row = sheet.getLastRow() + 1;
    sheet.getRange(row, 3).setNumberFormat('@'); // time stays plain text
    sheet.getRange(row, 1, 1, 7).setValues([[id, dateObj, time, categoryId, desc, amount, '']]);
    debit = amount;
    if (!desc) desc = 'ব্যয়';
  } else {
    id = generateUniqueId('INC');
    var source = String(txn.source || '').trim();
    if (!source) throw new Error('আয়ের উৎস লিখুন।');
    var sheetI = ss.getSheetByName(label + ' - Income');
    var rowI = sheetI.getLastRow() + 1;
    sheetI.getRange(rowI, 3).setNumberFormat('@');
    sheetI.getRange(rowI, 1, 1, 8).setValues([[id, dateObj, time, source, amount, '', String(txn.notes || '').trim(), '']]);
    credit = amount;
    desc = source;
  }

  budgetLedgerAppend_(ss, label, id, dateObj, time, desc, debit, credit);
  return { monthKey: budgetKey_(p.y, p.m) };
}

function deleteBudgetTransaction(token, monthKey, type, txnId) {
  budgetAuth_(token);

  var ss = budgetSs_();
  var p = budgetParseKey_(monthKey);
  var label = budgetMonthLabel_(p.y, p.m);
  var sheet = ss.getSheetByName(label + (type === 'income' ? ' - Income' : ' - Expense'));
  if (!sheet) return false;

  var data = sheet.getDataRange().getValues();
  var deleted = false;
  for (var i = 1; i < data.length; i++) {
    if (String(data[i][0]) === String(txnId)) {
      sheet.deleteRow(i + 1);
      deleted = true;
      break;
    }
  }
  if (!deleted) return false;

  // remove the matching Ledger row, then re-number the running balance
  var ledger = ss.getSheetByName(label + ' - Ledger');
  if (ledger) {
    var ld = ledger.getDataRange().getValues();
    for (var j = 1; j < ld.length; j++) {
      if (String(ld[j][0]) === String(txnId)) { ledger.deleteRow(j + 1); break; }
    }
    budgetRecalcLedger_(ledger);
  }
  return true;
}

/* ============================================================
 * Ledger helpers (running balance restarts from 0 each month)
 * ============================================================ */

function budgetLedgerAppend_(ss, label, txnId, dateObj, time, desc, debit, credit) {
  var sheet = ss.getSheetByName(label + ' - Ledger');
  if (!sheet) return;
  var last = sheet.getLastRow();
  var prev = last > 1 ? budgetNum_(sheet.getRange(last, 7).getValue()) : 0;
  var balance = prev + credit - debit;
  var row = last + 1;
  sheet.getRange(row, 3).setNumberFormat('@');
  sheet.getRange(row, 1, 1, 7).setValues([[txnId, dateObj, time, desc, debit || '', credit || '', balance]]);
}

function budgetRecalcLedger_(sheet) {
  var last = sheet.getLastRow();
  if (last < 2) return;
  var data = sheet.getRange(2, 1, last - 1, 7).getValues();
  var balance = 0;
  var out = data.map(function (r) {
    balance += budgetNum_(r[5]) - budgetNum_(r[4]);
    return [balance];
  });
  sheet.getRange(2, 7, out.length, 1).setValues(out);
}
