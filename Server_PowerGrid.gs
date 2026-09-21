/**
 * Server_PowerGrid.gs
 * Server support for the পাওয়ার গ্রিড page (Page_PowerGrid.html).
 *
 * Tabs used in the Power_Grid spreadsheet (both are created automatically):
 *   "SalaryStatements" : one row per month (see PG_STATEMENT_HEADERS)
 *   "EmployeeInfo"     : Key, Value, UpdatedAt  (EmployeeID, Designation, NextIncrementDate)
 * The joining date is read from / written to the existing "Employment" tab
 * (JoiningDate, ResignationDate), and the employee's name comes from
 * Personal_Info > Profile (NameEn, else NameBn).
 *
 * The older "Salary" / "CPF" / "Increment" tabs from Setup_PowerGrid.gs are
 * NOT touched. SalaryStatements has one column per line of the approved salary
 * statement design (10 earnings, 6 deductions, employee + company CPF).
 *
 * Requires: Config.gs, Auth.gs (validateSession), Utils_ID.gs (generateUniqueId),
 * Utils_Sheets.gs (ensureSheetWithHeaders), Server_PersonalInfo.gs (getProfile).
 * Every function needs a valid session token — salary data is financial.
 */

var PG_TZ = 'Asia/Dhaka';

/** Statement value fields, in sheet order (columns 3-20). */
var PG_FIELDS = [
  // Earnings
  'basic', 'educationAllowance', 'incrementArrear', 'houseRent', 'officerMedical',
  'medicalAllowance', 'conveyanceAllowance', 'shiftAllowance', 'responsibilityAllowance', 'specialAllowance',
  // Deductions
  'houseRentDeduction', 'cpfDeduction', 'incomeTax', 'cpfAdvance', 'revenueDeduction', 'othersDeduction',
  // CPF
  'employeeCpf', 'companyCpf'
];

var PG_STATEMENT_HEADERS = [
  'StatementID', 'MonthKey',
  'BasicSalary', 'EducationAllowance', 'IncrementArrear', 'HouseRent', 'OfficerMedicalReimbursement',
  'MedicalAllowance', 'ConveyanceAllowance', 'ShiftAllowance', 'ResponsibilityAllowance', 'SpecialAllowance',
  'HouseRentDeduction', 'CPFDeduction', 'IncomeTax', 'CPFAdvance', 'RevenueDeduction', 'OthersDeduction',
  'EmployeeCPF', 'CompanyCPF',
  'Notes', 'GlobalSyncID', 'CreatedAt', 'UpdatedAt'
];

/* ============================================================
 * Small helpers
 * ============================================================ */

function pgSs_() {
  return SpreadsheetApp.openById(SPREADSHEET_IDS.Power_Grid);
}

function pgAuth_(token) {
  var user = validateSession(token);
  if (!user) throw new Error('সেশন মেয়াদোত্তীর্ণ হয়ে গেছে, আবার লগইন করুন।');
  return user;
}

function pgNum_(v) {
  var n = parseFloat(String(v === null || v === undefined ? '' : v).replace(/,/g, ''));
  return isFinite(n) ? n : 0;
}

function pgDateStr_(v) {
  if (!v) return '';
  if (v instanceof Date) return Utilities.formatDate(v, PG_TZ, 'yyyy-MM-dd');
  var s = String(v).trim();
  var m = /^(\d{4}-\d{2}-\d{2})/.exec(s);
  return m ? m[1] : '';
}

/** "2026-07" — also copes with a cell Sheets auto-converted into a date. */
function pgMonthKey_(v) {
  if (!v) return '';
  if (v instanceof Date) return Utilities.formatDate(v, PG_TZ, 'yyyy-MM');
  return String(v).trim();
}

function pgStatementSheet_() {
  return ensureSheetWithHeaders(pgSs_(), 'SalaryStatements', PG_STATEMENT_HEADERS);
}

function pgInfoSheet_() {
  return ensureSheetWithHeaders(pgSs_(), 'EmployeeInfo', ['Key', 'Value', 'UpdatedAt']);
}

function pgReadInfo_() {
  var data = pgInfoSheet_().getDataRange().getValues();
  var map = {};
  for (var i = 1; i < data.length; i++) {
    if (data[i][0]) map[String(data[i][0]).trim()] = data[i][1];
  }
  return map;
}

function pgSetInfo_(sheet, key, value) {
  var data = sheet.getDataRange().getValues();
  var now = new Date();
  for (var i = 1; i < data.length; i++) {
    if (String(data[i][0]).trim() === key) {
      sheet.getRange(i + 1, 2).setNumberFormat('@').setValue(value); // text, so "04025" keeps its zero
      sheet.getRange(i + 1, 3).setValue(now);
      return;
    }
  }
  var row = sheet.getLastRow() + 1;
  sheet.getRange(row, 2).setNumberFormat('@');
  sheet.getRange(row, 1, 1, 3).setValues([[key, value, now]]);
}

/* ============================================================
 * Employee information
 * ============================================================ */

function pgGetEmployee_() {
  var ss = pgSs_();
  var info = pgReadInfo_();

  var joining = '';
  var empSheet = ss.getSheetByName('Employment');
  if (empSheet && empSheet.getLastRow() > 1) {
    joining = pgDateStr_(empSheet.getRange(2, 1).getValue());
  }

  var name = '';
  try {
    var profile = getProfile();
    name = profile.NameEn || profile.NameBn || '';
  } catch (e) { /* profile is optional */ }

  return {
    employeeId: info.EmployeeID === undefined ? '' : String(info.EmployeeID),
    name: String(name),
    designation: info.Designation === undefined ? '' : String(info.Designation),
    joiningDate: joining,
    nextIncrementDate: pgDateStr_(info.NextIncrementDate)
  };
}

/** info = { employeeId, designation, joiningDate 'yyyy-MM-dd' or '', nextIncrementDate 'yyyy-MM-dd' or '' } */
function savePowerGridEmployee(token, info) {
  pgAuth_(token);
  info = info || {};

  var joining = String(info.joiningDate || '').trim();
  var nextInc = String(info.nextIncrementDate || '').trim();
  if (joining && !/^\d{4}-\d{2}-\d{2}$/.test(joining)) throw new Error('যোগদানের তারিখ সঠিক নয়।');
  if (nextInc && !/^\d{4}-\d{2}-\d{2}$/.test(nextInc)) throw new Error('পরবর্তী ইনক্রিমেন্টের তারিখ সঠিক নয়।');

  var sheet = pgInfoSheet_();
  pgSetInfo_(sheet, 'EmployeeID', String(info.employeeId || '').trim());
  pgSetInfo_(sheet, 'Designation', String(info.designation || '').trim());
  pgSetInfo_(sheet, 'NextIncrementDate', nextInc);

  var emp = ensureSheetWithHeaders(pgSs_(), 'Employment', ['JoiningDate', 'ResignationDate']);
  var cell = emp.getRange(2, 1);
  if (joining) cell.setValue(Utilities.parseDate(joining, PG_TZ, 'yyyy-MM-dd'));
  else cell.clearContent();

  return true;
}

/* ============================================================
 * Salary statements
 * ============================================================ */

/** One call returns everything the page needs: employee info + every monthly statement (oldest first). */
function getPowerGridData(token) {
  pgAuth_(token);

  var sheet = pgStatementSheet_();
  var data = sheet.getDataRange().getValues();
  var statements = [];

  for (var i = 1; i < data.length; i++) {
    var row = data[i];
    var key = pgMonthKey_(row[1]);
    if (!row[0] || !key) continue;

    var st = { id: String(row[0]), monthKey: key };
    for (var f = 0; f < PG_FIELDS.length; f++) {
      st[PG_FIELDS[f]] = pgNum_(row[2 + f]);
    }
    st.notes = String(row[20] || '');
    statements.push(st);
  }

  statements.sort(function (a, b) { return a.monthKey < b.monthKey ? -1 : (a.monthKey > b.monthKey ? 1 : 0); });

  return { employee: pgGetEmployee_(), statements: statements };
}

/**
 * st = { monthKey 'yyyy-MM', notes, basic, educationAllowance, ... (see PG_FIELDS) }
 * One statement per month: saving an existing month updates it.
 * Returns the month key.
 */
function savePowerGridStatement(token, st) {
  pgAuth_(token);
  st = st || {};

  var monthKey = String(st.monthKey || '').trim();
  if (!/^\d{4}-(0[1-9]|1[0-2])$/.test(monthKey)) throw new Error('সঠিক মাস নির্বাচন করুন।');

  var values = [];
  for (var f = 0; f < PG_FIELDS.length; f++) {
    var n = pgNum_(st[PG_FIELDS[f]]);
    if (n < 0) throw new Error('পরিমাণ ঋণাত্মক হতে পারে না।');
    values.push(n);
  }
  var notes = String(st.notes || '').trim().substring(0, 500);

  var sheet = pgStatementSheet_();
  var data = sheet.getDataRange().getValues();
  var now = new Date();

  for (var i = 1; i < data.length; i++) {
    if (pgMonthKey_(data[i][1]) === monthKey) {
      // update: keep StatementID, MonthKey, GlobalSyncID and CreatedAt as they are
      sheet.getRange(i + 1, 3, 1, PG_FIELDS.length + 1).setValues([values.concat([notes])]);
      sheet.getRange(i + 1, 24).setValue(now);
      return monthKey;
    }
  }

  var id = generateUniqueId('SAL');
  var newRow = sheet.getLastRow() + 1;
  sheet.getRange(newRow, 2).setNumberFormat('@'); // keep "2026-07" as text, not a date
  sheet.getRange(newRow, 1, 1, PG_STATEMENT_HEADERS.length)
    .setValues([[id, monthKey].concat(values, [notes, '', now, now])]);
  return monthKey;
}

function deletePowerGridStatement(token, monthKey) {
  pgAuth_(token);

  var sheet = pgStatementSheet_();
  var data = sheet.getDataRange().getValues();
  for (var i = 1; i < data.length; i++) {
    if (pgMonthKey_(data[i][1]) === String(monthKey)) {
      sheet.deleteRow(i + 1);
      return true;
    }
  }
  return false;
}
