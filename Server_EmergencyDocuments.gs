/**
 * Server_EmergencyDocuments.gs
 * Server support for "জরুরি ডকুমেন্টস" (Page_EmergencyDocuments.html), Phase 12.
 *
 * Tabs used in the Emergency_Documents spreadsheet (created/extended by
 * Setup_EmergencyDocuments.gs — run setupEmergencyDocuments() or
 * setupAllSpreadsheets() once after adding this file):
 *   "Categories"  : CategoryID, Name, Icon, DisplayOrder — user-managed
 *   "Documents"   : DocID, Name, CategoryID, FileID, MimeType, SizeBytes,
 *                   Important (TRUE/FALSE), UploadedAt, UpdatedAt, Notes
 *   "ActivityLog" : LogID, DocID, DocName, Action, Timestamp
 *                   (Action: 'uploaded' | 'updated' | 'downloaded' | 'deleted')
 *
 * Files are stored in Drive under Photos and Files > EmergencyDocuments
 * (a dedicated subfolder, separate from other modules' uploads, so this
 * page's storage stats stay accurate to this feature only).
 *
 * Requires: Config.gs, Auth.gs (validateSession), Utils_ID.gs
 * (generateUniqueId), Utils_Sheets.gs (ensureSheetWithHeaders),
 * Utils_Drive.gs (uploadFileToFolder_). Every function needs a valid
 * session token.
 */

var EDOC_TZ = 'Asia/Dhaka';
var EDOC_RECENT_LIMIT = 8;
var EDOC_ACTIVITY_LIMIT = 12;
var EDOC_IMPORTANT_LIMIT = 6;

function edocSs_() { return SpreadsheetApp.openById(SPREADSHEET_IDS.Emergency_Documents); }

function edocAuth_(token) {
  var user = validateSession(token);
  if (!user) throw new Error('সেশন মেয়াদোত্তীর্ণ হয়ে গেছে, আবার লগইন করুন।');
  return user;
}

function edocNum_(v) {
  var n = parseFloat(String(v === null || v === undefined ? '' : v).replace(/,/g, ''));
  return isFinite(n) ? n : 0;
}

function edocBool_(v) { return v === true || v === 'TRUE' || v === 'true' || v === 1; }

function edocDateStr_(v) {
  if (!v) return '';
  if (v instanceof Date) return Utilities.formatDate(v, EDOC_TZ, 'yyyy-MM-dd');
  var m = /^(\d{4}-\d{2}-\d{2})/.exec(String(v).trim());
  return m ? m[1] : String(v).trim();
}

function categoriesSheet_edoc_() { return ensureSheetWithHeaders(edocSs_(), 'Categories', ['CategoryID', 'Name', 'Icon', 'DisplayOrder']); }
function documentsSheet_() {
  return ensureSheetWithHeaders(edocSs_(), 'Documents', [
    'DocID', 'Name', 'CategoryID', 'FileID', 'MimeType', 'SizeBytes',
    'Important', 'UploadedAt', 'UpdatedAt', 'Notes'
  ]);
}
function activitySheet_() { return ensureSheetWithHeaders(edocSs_(), 'ActivityLog', ['LogID', 'DocID', 'DocName', 'Action', 'Timestamp']); }

function getOrCreateEmergencyDocsFolder_() {
  var parent = DriveApp.getFolderById(DRIVE_FOLDER_IDS.PhotosAndFiles);
  var existing = parent.getFoldersByName('EmergencyDocuments');
  if (existing.hasNext()) return existing.next();
  return parent.createFolder('EmergencyDocuments');
}

function edocLogActivity_(docId, docName, action) {
  var sheet = activitySheet_();
  sheet.appendRow([generateUniqueId('ELOG'), docId, docName, action, new Date()]);
}

/* ============================================================
 * Categories
 * ============================================================ */

function getDocumentCategories() {
  var data = categoriesSheet_edoc_().getDataRange().getValues();
  var out = [];
  for (var i = 1; i < data.length; i++) {
    if (!data[i][0]) continue;
    out.push({ id: String(data[i][0]), name: String(data[i][1] || ''), icon: String(data[i][2] || '📁'), order: edocNum_(data[i][3]) });
  }
  out.sort(function (a, b) { return a.order - b.order; });
  return out;
}

/** cat = { id (blank for new), name, icon (one emoji) } */
function saveDocumentCategory(token, cat) {
  edocAuth_(token);
  cat = cat || {};
  var name = String(cat.name || '').trim();
  if (!name) throw new Error('ক্যাটাগরির নাম আবশ্যক।');
  var icon = String(cat.icon || '📁').trim().substring(0, 4) || '📁';

  var sheet = categoriesSheet_edoc_();
  var data = sheet.getDataRange().getValues();
  var id = cat.id ? String(cat.id) : '';

  for (var i = 1; i < data.length; i++) {
    if (id && String(data[i][0]) === id) {
      sheet.getRange(i + 1, 2, 1, 2).setValues([[name, icon]]);
      return id;
    }
    if (String(data[i][1]).trim().toLowerCase() === name.toLowerCase() && String(data[i][0]) !== id) {
      throw new Error('এই নামে একটি ক্যাটাগরি ইতিমধ্যে আছে।');
    }
  }

  id = generateUniqueId('DCAT');
  var order = data.length;
  sheet.appendRow([id, name, icon, order]);
  return id;
}

/** Refuses deletion if any document still uses this category — reassign or move them first. */
function deleteDocumentCategory(token, id) {
  edocAuth_(token);
  var cats = getDocumentCategories();
  var target = null;
  cats.forEach(function (c) { if (c.id === id) target = c; });
  if (!target) return false;

  var used = edocReadDocuments_().some(function (d) { return d.categoryId === id; });
  if (used) throw new Error('এই ক্যাটাগরিতে ডকুমেন্ট আছে — আগে সেগুলোর ক্যাটাগরি বদলান বা মুছুন।');

  var sheet = categoriesSheet_edoc_();
  var data = sheet.getDataRange().getValues();
  for (var i = 1; i < data.length; i++) {
    if (String(data[i][0]) === String(id)) { sheet.deleteRow(i + 1); return true; }
  }
  return false;
}

/* ============================================================
 * Documents — read / write
 * ============================================================ */

function edocReadDocuments_() {
  var sheet = documentsSheet_();
  var lastRow = sheet.getLastRow();
  var out = [];
  if (lastRow < 2) return out;

  var data = sheet.getRange(2, 1, lastRow - 1, 10).getValues();
  for (var i = 0; i < data.length; i++) {
    var row = data[i];
    if (!row[0]) continue;
    out.push({
      id: String(row[0]),
      name: String(row[1] || ''),
      categoryId: String(row[2] || ''),
      fileId: String(row[3] || ''),
      mimeType: String(row[4] || ''),
      sizeBytes: edocNum_(row[5]),
      important: edocBool_(row[6]),
      uploadedAt: edocDateStr_(row[7]),
      updatedAt: edocDateStr_(row[8]),
      notes: String(row[9] || '')
    });
  }
  return out;
}

function edocFormatLabel_(mimeType, name) {
  var n = String(name || '').toLowerCase();
  if (/\.pdf$/.test(n) || mimeType === 'application/pdf') return 'PDF';
  if (/\.(jpg|jpeg)$/.test(n) || mimeType === 'image/jpeg') return 'JPG';
  if (/\.png$/.test(n) || mimeType === 'image/png') return 'PNG';
  if (/\.docx$/.test(n) || mimeType === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document') return 'DOCX';
  if (/\.doc$/.test(n) || mimeType === 'application/msword') return 'DOC';
  if (mimeType && mimeType.indexOf('image/') === 0) return 'IMG';
  return 'ফাইল';
}

/**
 * Everything the dashboard needs in one call: categories with live counts,
 * the enriched recent documents list, important documents, recent activity
 * and storage stats for the dedicated EmergencyDocuments Drive folder.
 */
function getEmergencyDocumentsData(token) {
  edocAuth_(token);

  var categories = getDocumentCategories();
  var catById = {};
  var catCount = {};
  categories.forEach(function (c) { catById[c.id] = c; catCount[c.id] = 0; });

  var docs = edocReadDocuments_();
  var totalSize = 0;
  var monthKey = Utilities.formatDate(new Date(), EDOC_TZ, 'yyyy-MM');
  var thisMonthCount = 0;

  var enriched = docs.map(function (d) {
    var cat = catById[d.categoryId];
    totalSize += d.sizeBytes;
    if (catCount.hasOwnProperty(d.categoryId)) catCount[d.categoryId]++;
    if (String(d.uploadedAt).substring(0, 7) === monthKey) thisMonthCount++;
    return {
      id: d.id, name: d.name, categoryId: d.categoryId,
      categoryName: cat ? cat.name : 'অন্যান্য', categoryIcon: cat ? cat.icon : '📁',
      fileId: d.fileId, mimeType: d.mimeType, format: edocFormatLabel_(d.mimeType, d.name),
      sizeBytes: d.sizeBytes, important: d.important,
      uploadedAt: d.uploadedAt, updatedAt: d.updatedAt, notes: d.notes
    };
  });
  enriched.sort(function (a, b) { return String(b.uploadedAt + b.id).localeCompare(String(a.uploadedAt + a.id)); });

  var important = enriched.filter(function (d) { return d.important; }).slice(0, EDOC_IMPORTANT_LIMIT);

  var actData = activitySheet_().getDataRange().getValues();
  var activity = [];
  for (var i = 1; i < actData.length; i++) {
    if (!actData[i][0]) continue;
    activity.push({
      id: String(actData[i][0]), docId: String(actData[i][1] || ''), docName: String(actData[i][2] || ''),
      action: String(actData[i][3] || ''), timestamp: actData[i][4] instanceof Date ? actData[i][4].toISOString() : String(actData[i][4] || '')
    });
  }
  activity.sort(function (a, b) { return b.timestamp.localeCompare(a.timestamp); });
  activity = activity.slice(0, EDOC_ACTIVITY_LIMIT);

  // Storage stats for the dedicated Drive folder — real numbers from this
  // feature's own folder, not a whole-account quota (Apps Script's basic
  // Drive service has no simple "account quota used" call).
  var folder = getOrCreateEmergencyDocsFolder_();

  return {
    categories: categories.map(function (c) { return { id: c.id, name: c.name, icon: c.icon, count: catCount[c.id] || 0 }; }),
    documents: enriched.slice(0, EDOC_RECENT_LIMIT),
    documentsAll: enriched,
    important: important,
    activity: activity,
    storage: {
      totalDocuments: enriched.length,
      totalSizeBytes: totalSize,
      thisMonthUploads: thisMonthCount,
      folderUrl: folder.getUrl()
    }
  };
}

/**
 * doc = { name, categoryId, base64, mimeType, fileName, important (bool) }
 * Uploads the file to the dedicated Drive folder and records it.
 * Returns the refreshed getEmergencyDocumentsData() payload.
 */
function uploadEmergencyDocument(token, doc) {
  edocAuth_(token);
  doc = doc || {};

  var name = String(doc.name || doc.fileName || '').trim();
  if (!name) throw new Error('ডকুমেন্টের নাম আবশ্যক।');
  if (!doc.base64 || !doc.mimeType) throw new Error('ফাইল নির্বাচন করুন।');

  var folder = getOrCreateEmergencyDocsFolder_();
  var fileId = uploadFileToFolder_(folder.getId(), doc.base64, doc.mimeType, name);
  var sizeBytes = 0;
  try { sizeBytes = DriveApp.getFileById(fileId).getSize(); } catch (e) { /* ignore */ }

  var sheet = documentsSheet_();
  var id = generateUniqueId('DOC');
  var now = new Date();
  sheet.appendRow([
    id, name, String(doc.categoryId || ''), fileId, String(doc.mimeType || ''), sizeBytes,
    doc.important ? true : false, now, now, String(doc.notes || '').substring(0, 500)
  ]);

  edocLogActivity_(id, name, 'uploaded');
  return getEmergencyDocumentsData(token);
}

/**
 * d = { id, name, categoryId, important, notes }
 * Renames / moves category / toggles important / edits notes. Does not
 * replace the underlying file — delete and re-upload for that.
 */
function updateEmergencyDocument(token, d) {
  edocAuth_(token);
  d = d || {};
  var id = String(d.id || '');
  if (!id) throw new Error('ডকুমেন্ট খুঁজে পাওয়া যায়নি।');

  var name = String(d.name || '').trim();
  if (!name) throw new Error('ডকুমেন্টের নাম আবশ্যক।');

  var sheet = documentsSheet_();
  var data = sheet.getDataRange().getValues();
  for (var i = 1; i < data.length; i++) {
    if (String(data[i][0]) === id) {
      sheet.getRange(i + 1, 2).setValue(name);
      sheet.getRange(i + 1, 3).setValue(String(d.categoryId || ''));
      sheet.getRange(i + 1, 7).setValue(d.important ? true : false);
      sheet.getRange(i + 1, 9).setValue(new Date());
      sheet.getRange(i + 1, 10).setValue(String(d.notes || '').substring(0, 500));
      edocLogActivity_(id, name, 'updated');
      return getEmergencyDocumentsData(token);
    }
  }
  throw new Error('ডকুমেন্ট খুঁজে পাওয়া যায়নি।');
}

/** Quick toggle for the ⭐ button — same effect as updateEmergencyDocument's important flag, without needing the whole edit form. */
function toggleDocumentImportant(token, docId) {
  edocAuth_(token);
  var sheet = documentsSheet_();
  var data = sheet.getDataRange().getValues();
  for (var i = 1; i < data.length; i++) {
    if (String(data[i][0]) === String(docId)) {
      var cur = edocBool_(data[i][6]);
      sheet.getRange(i + 1, 7).setValue(!cur);
      sheet.getRange(i + 1, 9).setValue(new Date());
      return getEmergencyDocumentsData(token);
    }
  }
  throw new Error('ডকুমেন্ট খুঁজে পাওয়া যায়নি।');
}

function deleteEmergencyDocument(token, docId) {
  edocAuth_(token);
  var sheet = documentsSheet_();
  var data = sheet.getDataRange().getValues();
  for (var i = 1; i < data.length; i++) {
    if (String(data[i][0]) === String(docId)) {
      var fileId = data[i][3];
      var name = data[i][1];
      sheet.deleteRow(i + 1);
      if (fileId) { try { DriveApp.getFileById(fileId).setTrashed(true); } catch (e) { /* ignore */ } }
      edocLogActivity_(docId, name, 'deleted');
      return getEmergencyDocumentsData(token);
    }
  }
  return getEmergencyDocumentsData(token);
}

/** Fire-and-forget call from the client when a "⬇ ডাউনলোড" link is clicked, purely to log the activity. */
function logDocumentDownload(token, docId) {
  edocAuth_(token);
  var docs = edocReadDocuments_();
  var name = 'ডকুমেন্ট';
  for (var i = 0; i < docs.length; i++) { if (docs[i].id === String(docId)) { name = docs[i].name; break; } }
  edocLogActivity_(docId, name, 'downloaded');
  return true;
}

/**
 * Returns a plain-text manifest (name, category, format, size, uploaded date,
 * direct Drive link per document) the client turns into a downloadable CSV —
 * a practical "backup list", since this Apps Script project has no access to
 * a second cloud account to mirror files into automatically.
 */
function getDocumentBackupManifest(token) {
  edocAuth_(token);
  var data = getEmergencyDocumentsData(token);
  return data.documentsAll.map(function (d) {
    return {
      name: d.name, category: d.categoryName, format: d.format, sizeBytes: d.sizeBytes,
      uploadedAt: d.uploadedAt, driveLink: 'https://drive.google.com/file/d/' + d.fileId + '/view'
    };
  });
}
