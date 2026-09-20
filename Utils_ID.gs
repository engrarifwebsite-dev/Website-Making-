/**
 * Utils_ID.gs
 * Central Unique ID generation + duplicate-prevention registry helper.
 * ID format: PREFIX-YYYYMMDD-####  (e.g. BUD-20260908-0001)
 * Requires Config.gs to be present in the same project.
 */

function generateUniqueId(prefix) {
  var props = PropertiesService.getScriptProperties();
  var dateStr = Utilities.formatDate(new Date(), 'Asia/Dhaka', 'yyyyMMdd');
  var todayKey = prefix + '_' + dateStr;
  var lock = LockService.getScriptLock();
  lock.waitLock(10000);
  try {
    var current = parseInt(props.getProperty(todayKey) || '0', 10);
    current += 1;
    props.setProperty(todayKey, String(current));
    var seq = ('0000' + current).slice(-4);
    return prefix + '-' + dateStr + '-' + seq;
  } finally {
    lock.releaseLock();
  }
}

/**
 * Checks SYS_Master > ID_Registry for a given GlobalSyncID before writing
 * a cross-module synced record (e.g. Salary -> Budget Income), to prevent
 * duplicates. Returns true if the ID is new (safe to write).
 */
function isNewSyncId(globalSyncId) {
  var sysSs = SpreadsheetApp.openById(SPREADSHEET_IDS.SYS_Master);
  var sheet = sysSs.getSheetByName('ID_Registry');
  var data = sheet.getDataRange().getValues();
  for (var i = 1; i < data.length; i++) {
    if (data[i][0] === globalSyncId) return false;
  }
  return true;
}

/** Registers a GlobalSyncID as "already synced" after a successful write. */
function registerSyncId(globalSyncId, module, relatedSheet) {
  var sysSs = SpreadsheetApp.openById(SPREADSHEET_IDS.SYS_Master);
  var sheet = sysSs.getSheetByName('ID_Registry');
  sheet.appendRow([globalSyncId, module, relatedSheet, new Date()]);
}
