/**
 * Server_Assets.gs
 * Server support for "আমার সম্পদ ও সামগ্রী" (Page_Assets.html), Phase 14.
 *
 * Tabs used in the Assets_Items spreadsheet (all created/extended by
 * Setup_Assets.gs — run setupAssetsItems() or setupAllSpreadsheets() once
 * after adding this file, to add the new columns/tabs):
 *   "Assets"      : one row per asset/item (see assetsReadAll_ for fields)
 *   "Categories"  : CategoryID, Name, Icon, DisplayOrder — user-managed
 *   "Maintenance" : MaintID, AssetID, Date, Description, Cost, CreatedAt
 *   "Documents"   : DocID, AssetID (blank = general document), DocName,
 *                   FileID, UploadedAt
 *
 * Current value is a simple straight-line depreciation estimate:
 *   perYear = (PurchasePrice − SalvageValue) / UsefulLifeYears
 *   currentValue = max(SalvageValue, PurchasePrice − perYear × ageInYears)
 * If UsefulLifeYears is 0/blank, the current value is just the purchase
 * price (no depreciation data entered yet for that item).
 *
 * Warranty is tracked as WarrantyMonths (the "Warranty" column) counted
 * from PurchaseDate. Status buckets: active / warn (≤180 days left) /
 * critical (≤60 days left) / expired / na (no warranty months set).
 *
 * Requires: Config.gs, Auth.gs (validateSession), Utils_ID.gs
 * (generateUniqueId), Utils_Sheets.gs (ensureSheetWithHeaders),
 * Utils_Drive.gs (uploadFileToFolder_). Every function needs a valid
 * session token.
 */

var ASSETS_TZ = 'Asia/Dhaka';
var ASSETS_WARN_DAYS = 180;   // warranty flagged once expiry is within this many days
var ASSETS_CRIT_DAYS = 60;    // stronger flag

function assetsSs_() { return SpreadsheetApp.openById(SPREADSHEET_IDS.Assets_Items); }

function assetsAuth_(token) {
  var user = validateSession(token);
  if (!user) throw new Error('সেশন মেয়াদোত্তীর্ণ হয়ে গেছে, আবার লগইন করুন।');
  return user;
}

function assetsNum_(v) {
  var n = parseFloat(String(v === null || v === undefined ? '' : v).replace(/,/g, ''));
  return isFinite(n) ? n : 0;
}

function assetsDateStr_(v) {
  if (!v) return '';
  if (v instanceof Date) return Utilities.formatDate(v, ASSETS_TZ, 'yyyy-MM-dd');
  var m = /^(\d{4}-\d{2}-\d{2})/.exec(String(v).trim());
  return m ? m[1] : '';
}

function assetsToday_() { return Utilities.formatDate(new Date(), ASSETS_TZ, 'yyyy-MM-dd'); }

function assetsDaysBetween_(fromStr, toStr) {
  if (!fromStr || !toStr) return 0;
  var a = Utilities.parseDate(fromStr, ASSETS_TZ, 'yyyy-MM-dd');
  var b = Utilities.parseDate(toStr, ASSETS_TZ, 'yyyy-MM-dd');
  return Math.round((b.getTime() - a.getTime()) / 86400000);
}

function assetsSheet_() {
  var sheet = ensureSheetWithHeaders(assetsSs_(), 'Assets', [
    'AssetID', 'ProductName', 'PurchasePrice', 'PurchaseDate', 'Warranty',
    'SerialNumber', 'PhotoFileID', 'Condition', 'Location',
    'SalvageValue', 'UsefulLifeYears', 'ParentAssetID', 'Notes'
  ]);
  var extraHeaders = ['Category', 'Brand', 'Model', 'CreatedAt', 'UpdatedAt'];
  var firstRow = sheet.getRange(1, 14, 1, extraHeaders.length).getValues()[0];
  for (var i = 0; i < extraHeaders.length; i++) {
    if (!firstRow[i]) sheet.getRange(1, 14 + i).setValue(extraHeaders[i]).setFontWeight('bold');
  }
  return sheet;
}
function categoriesSheet_() { return ensureSheetWithHeaders(assetsSs_(), 'Categories', ['CategoryID', 'Name', 'Icon', 'DisplayOrder']); }
function maintenanceSheet_() { return ensureSheetWithHeaders(assetsSs_(), 'Maintenance', ['MaintID', 'AssetID', 'Date', 'Description', 'Cost', 'CreatedAt']); }
function assetDocsSheet_() { return ensureSheetWithHeaders(assetsSs_(), 'Documents', ['DocID', 'AssetID', 'DocName', 'FileID', 'UploadedAt']); }

/* ============================================================
 * Categories
 * ============================================================ */

function getAssetCategories() {
  var data = categoriesSheet_().getDataRange().getValues();
  var out = [];
  for (var i = 1; i < data.length; i++) {
    if (!data[i][0]) continue;
    out.push({ id: String(data[i][0]), name: String(data[i][1] || ''), icon: String(data[i][2] || '📦'), order: assetsNum_(data[i][3]) });
  }
  out.sort(function (a, b) { return a.order - b.order; });
  return out;
}

/** cat = { id (blank for new), name, icon (one emoji) } */
function saveAssetCategory(token, cat) {
  assetsAuth_(token);
  cat = cat || {};
  var name = String(cat.name || '').trim();
  if (!name) throw new Error('ক্যাটাগরির নাম আবশ্যক।');
  var icon = String(cat.icon || '📦').trim().substring(0, 4) || '📦';

  var sheet = categoriesSheet_();
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

  id = generateUniqueId('CAT');
  var order = data.length;
  sheet.appendRow([id, name, icon, order]);
  return id;
}

/** Refuses deletion if any asset still uses this category — reassign or clear them first. */
function deleteAssetCategory(token, id) {
  assetsAuth_(token);
  var cats = getAssetCategories();
  var target = null;
  cats.forEach(function (c) { if (c.id === id) target = c; });
  if (!target) return false;

  var used = assetsReadAll_().some(function (a) { return a.category === target.name; });
  if (used) throw new Error('এই ক্যাটাগরিতে সম্পদ আছে — আগে সেগুলোর ক্যাটাগরি বদলান বা মুছুন।');

  var sheet = categoriesSheet_();
  var data = sheet.getDataRange().getValues();
  for (var i = 1; i < data.length; i++) {
    if (String(data[i][0]) === String(id)) { sheet.deleteRow(i + 1); return true; }
  }
  return false;
}

/* ============================================================
 * Depreciation / warranty helpers
 * ============================================================ */

function assetCurrentValue_(a) {
  if (!a.purchaseDate) return a.purchasePrice;
  var ageDays = Math.max(0, assetsDaysBetween_(a.purchaseDate, assetsToday_()));
  var ageYears = ageDays / 365;
  if (a.usefulLifeYears > 0) {
    var perYear = (a.purchasePrice - a.salvageValue) / a.usefulLifeYears;
    var v = a.purchasePrice - perYear * ageYears;
    return Math.max(a.salvageValue, Math.round(v));
  }
  return a.purchasePrice;
}

function assetWarrantyInfo_(a) {
  if (!a.warrantyMonths || !a.purchaseDate) return { status: 'na', daysLeft: null, expiry: '' };
  var expiry = Utilities.parseDate(a.purchaseDate, ASSETS_TZ, 'yyyy-MM-dd');
  expiry.setMonth(expiry.getMonth() + a.warrantyMonths);
  var expiryStr = Utilities.formatDate(expiry, ASSETS_TZ, 'yyyy-MM-dd');
  var daysLeft = assetsDaysBetween_(assetsToday_(), expiryStr);
  var status = daysLeft < 0 ? 'expired' : (daysLeft <= ASSETS_CRIT_DAYS ? 'critical' : (daysLeft <= ASSETS_WARN_DAYS ? 'warn' : 'active'));
  return { status: status, daysLeft: daysLeft, expiry: expiryStr };
}

/* ============================================================
 * Assets — read / write
 * ============================================================ */

function assetsReadAll_() {
  var sheet = assetsSheet_();
  var lastRow = sheet.getLastRow();
  var out = [];
  if (lastRow < 2) return out;

  var data = sheet.getRange(2, 1, lastRow - 1, 18).getValues();
  for (var i = 0; i < data.length; i++) {
    var row = data[i];
    if (!row[0]) continue;
    out.push({
      id: String(row[0]),
      name: String(row[1] || ''),
      purchasePrice: assetsNum_(row[2]),
      purchaseDate: assetsDateStr_(row[3]),
      warrantyMonths: assetsNum_(row[4]),
      serialNumber: String(row[5] || ''),
      photoFileId: String(row[6] || ''),
      condition: String(row[7] || 'সক্রিয়'),
      location: String(row[8] || ''),
      salvageValue: assetsNum_(row[9]),
      usefulLifeYears: assetsNum_(row[10]),
      parentAssetId: String(row[11] || ''),
      notes: String(row[12] || ''),
      category: String(row[13] || ''),
      brand: String(row[14] || ''),
      model: String(row[15] || '')
    });
  }
  return out;
}

/**
 * Everything the dashboard needs in one call: summary KPIs, categories
 * with live counts, the enriched asset list (current value + warranty
 * status computed), depreciation-by-category, location breakdown,
 * warranty counts, recent + all maintenance, documents, quick facts and
 * a "main + sub-assets" spotlight.
 */
function getAssetsData(token) {
  assetsAuth_(token);

  var assets = assetsReadAll_();
  var categories = getAssetCategories();
  var catCount = {};
  categories.forEach(function (c) { catCount[c.name] = 0; });

  var totalPurchase = 0, totalCurrent = 0;
  var depByCat = {};
  var locCount = {};
  var warrantyCounts = { active: 0, warn: 0, critical: 0, expired: 0, na: 0 };

  var enriched = assets.map(function (a) {
    var currentValue = assetCurrentValue_(a);
    var dep = Math.max(0, a.purchasePrice - currentValue);
    var w = assetWarrantyInfo_(a);

    totalPurchase += a.purchasePrice;
    totalCurrent += currentValue;
    var catKey = a.category || 'অন্যান্য';
    depByCat[catKey] = (depByCat[catKey] || 0) + dep;
    if (a.location) locCount[a.location] = (locCount[a.location] || 0) + 1;
    if (catCount.hasOwnProperty(a.category)) catCount[a.category]++;
    warrantyCounts[w.status]++;

    return {
      id: a.id, name: a.name, category: a.category, brand: a.brand, model: a.model,
      purchasePrice: a.purchasePrice, purchaseDate: a.purchaseDate, currentValue: currentValue,
      warrantyMonths: a.warrantyMonths, warrantyStatus: w.status, warrantyDaysLeft: w.daysLeft, warrantyExpiry: w.expiry,
      serialNumber: a.serialNumber, photoFileId: a.photoFileId, condition: a.condition, location: a.location,
      salvageValue: a.salvageValue, usefulLifeYears: a.usefulLifeYears, parentAssetId: a.parentAssetId, notes: a.notes
    };
  });

  enriched.sort(function (x, y) { return (y.purchaseDate || '').localeCompare(x.purchaseDate || ''); });

  var nameById = {};
  enriched.forEach(function (e) { nameById[e.id] = e.name; });

  // Maintenance
  var maint = maintenanceReadAll_();
  var totalMaintenance = 0, thisMonthMaintenance = 0;
  var monthKey = Utilities.formatDate(new Date(), ASSETS_TZ, 'yyyy-MM');
  maint.forEach(function (m) {
    totalMaintenance += m.cost;
    if (String(m.date).substring(0, 7) === monthKey) thisMonthMaintenance += m.cost;
    m.assetName = nameById[m.assetId] || 'অজানা সম্পদ';
  });
  maint.sort(function (a, b) { return b.date.localeCompare(a.date); });

  // Documents
  var docs = assetDocsReadAll_();
  docs.forEach(function (d) { d.assetName = d.assetId ? (nameById[d.assetId] || '') : ''; });
  docs.sort(function (a, b) { return String(b.uploadedAt).localeCompare(String(a.uploadedAt)); });

  // Quick facts
  var today = assetsToday_();
  function within(a, years) { return a.purchaseDate ? assetsDaysBetween_(a.purchaseDate, today) <= years * 365 : false; }
  var facts = {
    within10y: enriched.filter(function (a) { return within(a, 10); }).length,
    within5y: enriched.filter(function (a) { return within(a, 5); }).length,
    within1y: enriched.filter(function (a) { return within(a, 1); }).length,
    expiredWarranty: warrantyCounts.expired,
    activeWarranty: warrantyCounts.active + warrantyCounts.warn + warrantyCounts.critical,
    totalPhotos: enriched.filter(function (a) { return !!a.photoFileId; }).length,
    totalDocuments: docs.length
  };

  // Main/sub spotlight — the most recently purchased MAIN asset that has at least one sub-asset
  var subsByParent = {};
  enriched.forEach(function (a) {
    if (a.parentAssetId) (subsByParent[a.parentAssetId] = subsByParent[a.parentAssetId] || []).push(a);
  });
  var spotlight = null;
  for (var i = 0; i < enriched.length; i++) {
    var a2 = enriched[i];
    if (!a2.parentAssetId && subsByParent[a2.id] && subsByParent[a2.id].length) {
      spotlight = { main: a2, subs: subsByParent[a2.id] };
      break;
    }
  }

  return {
    summary: {
      totalAssets: enriched.length,
      totalPurchase: totalPurchase,
      totalCurrent: totalCurrent,
      totalMaintenance: totalMaintenance,
      thisMonthMaintenance: thisMonthMaintenance
    },
    categories: categories.map(function (c) { return { id: c.id, name: c.name, icon: c.icon, count: catCount[c.name] || 0 }; }),
    assets: enriched,
    depreciationByCategory: Object.keys(depByCat).map(function (k) { return { name: k, value: depByCat[k] }; }).filter(function (r) { return r.value > 0; }),
    locationBreakdown: Object.keys(locCount).map(function (k) { return { name: k, count: locCount[k] }; }),
    warrantyCounts: warrantyCounts,
    maintenance: maint.slice(0, 5),
    maintenanceAll: maint,
    documents: docs,
    facts: facts,
    spotlight: spotlight
  };
}

/**
 * a = { id (blank for new), name, category, brand, model, purchasePrice,
 *   purchaseDate, warrantyMonths, serialNumber, condition, location,
 *   salvageValue, usefulLifeYears, parentAssetId, notes,
 *   photoBase64, photoMimeType (both optional), photoFileId (kept if no new photo) }
 */
function saveAsset(token, a) {
  assetsAuth_(token);
  a = a || {};

  var name = String(a.name || '').trim();
  if (!name) throw new Error('সম্পদের নাম আবশ্যক।');

  var purchasePrice = assetsNum_(a.purchasePrice);
  if (purchasePrice < 0) throw new Error('ক্রয়মূল্য ঋণাত্মক হতে পারে না।');

  var purchaseDate = assetsDateStr_(a.purchaseDate) || String(a.purchaseDate || '').trim();
  if (purchaseDate && !/^\d{4}-\d{2}-\d{2}$/.test(purchaseDate)) throw new Error('ক্রয়ের তারিখ সঠিক নয়।');

  var id = a.id ? String(a.id) : '';
  if (a.parentAssetId && a.parentAssetId === id) throw new Error('একটি সম্পদ নিজেই নিজের প্যারেন্ট হতে পারে না।');

  var sheet = assetsSheet_();
  var now = new Date();

  var photoFileId = a.photoFileId || '';
  if (a.photoBase64 && a.photoMimeType) {
    photoFileId = uploadFileToFolder_(DRIVE_FOLDER_IDS.PhotosAndFiles, a.photoBase64, a.photoMimeType, 'asset-' + (id || 'new') + '-' + name);
  }

  var values = [
    name, purchasePrice, purchaseDate, assetsNum_(a.warrantyMonths),
    String(a.serialNumber || ''), photoFileId, String(a.condition || 'সক্রিয়'), String(a.location || ''),
    assetsNum_(a.salvageValue), assetsNum_(a.usefulLifeYears), String(a.parentAssetId || ''), String(a.notes || '').substring(0, 1000),
    String(a.category || ''), String(a.brand || ''), String(a.model || '')
  ];

  if (id) {
    var data = sheet.getDataRange().getValues();
    for (var i = 1; i < data.length; i++) {
      if (String(data[i][0]) === id) {
        sheet.getRange(i + 1, 2, 1, values.length).setValues([values]);
        sheet.getRange(i + 1, 18).setValue(now); // UpdatedAt
        return id;
      }
    }
    throw new Error('সম্পদটি পাওয়া যায়নি।');
  }

  id = generateUniqueId('AST');
  var newRow = sheet.getLastRow() + 1;
  sheet.getRange(newRow, 1).setValue(id);
  sheet.getRange(newRow, 2, 1, values.length).setValues([values]);
  sheet.getRange(newRow, 17, 1, 2).setValues([[now, now]]); // CreatedAt, UpdatedAt
  return id;
}

function deleteAsset(token, id) {
  assetsAuth_(token);
  var sheet = assetsSheet_();
  var data = sheet.getDataRange().getValues();

  for (var i = 1; i < data.length; i++) {
    if (String(data[i][0]) === String(id)) {
      for (var j = 1; j < data.length; j++) {
        if (String(data[j][11]) === String(id)) throw new Error('এই সম্পদের সাব-এসেট আছে। আগে সেগুলো সরান বা মুছুন।');
      }
      var photoFileId = data[i][6];
      sheet.deleteRow(i + 1);
      if (photoFileId) { try { DriveApp.getFileById(photoFileId).setTrashed(true); } catch (e) { /* ignore */ } }
      removeMaintenanceForAsset_(id);
      removeDocumentsForAsset_(id);
      return true;
    }
  }
  return false;
}

/* ============================================================
 * Maintenance
 * ============================================================ */

function maintenanceReadAll_() {
  var sheet = maintenanceSheet_();
  var lastRow = sheet.getLastRow();
  var out = [];
  if (lastRow < 2) return out;
  var data = sheet.getRange(2, 1, lastRow - 1, 6).getValues();
  for (var i = 0; i < data.length; i++) {
    if (!data[i][0]) continue;
    out.push({
      id: String(data[i][0]), assetId: String(data[i][1] || ''), date: assetsDateStr_(data[i][2]),
      description: String(data[i][3] || ''), cost: assetsNum_(data[i][4])
    });
  }
  return out;
}

/** m = { assetId, date, description, cost }. Returns the refreshed getAssetsData() payload. */
function addMaintenance(token, m) {
  assetsAuth_(token);
  m = m || {};

  var assetId = String(m.assetId || '').trim();
  if (!assetId) throw new Error('সম্পদ নির্বাচন করুন।');

  var date = assetsDateStr_(m.date) || String(m.date || '').trim();
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) throw new Error('সঠিক তারিখ দিন।');

  var desc = String(m.description || '').trim();
  if (!desc) throw new Error('মেইনটেনেন্সের বিবরণ লিখুন।');

  var cost = assetsNum_(m.cost);
  if (cost < 0) throw new Error('খরচ ঋণাত্মক হতে পারে না।');

  var sheet = maintenanceSheet_();
  var id = generateUniqueId('MNT');
  sheet.appendRow([id, assetId, date, desc, cost, new Date()]);
  return getAssetsData(token);
}

function deleteMaintenance(token, id) {
  assetsAuth_(token);
  var sheet = maintenanceSheet_();
  var data = sheet.getDataRange().getValues();
  for (var i = 1; i < data.length; i++) {
    if (String(data[i][0]) === String(id)) { sheet.deleteRow(i + 1); break; }
  }
  return getAssetsData(token);
}

function removeMaintenanceForAsset_(assetId) {
  var sheet = maintenanceSheet_();
  var data = sheet.getDataRange().getValues();
  for (var i = data.length - 1; i >= 1; i--) {
    if (String(data[i][1]) === String(assetId)) sheet.deleteRow(i + 1);
  }
}

/* ============================================================
 * Documents (সম্পদ দলিলপত্র)
 * ============================================================ */

function assetDocsReadAll_() {
  var sheet = assetDocsSheet_();
  var lastRow = sheet.getLastRow();
  var out = [];
  if (lastRow < 2) return out;
  var data = sheet.getRange(2, 1, lastRow - 1, 5).getValues();
  for (var i = 0; i < data.length; i++) {
    if (!data[i][0]) continue;
    out.push({
      id: String(data[i][0]), assetId: String(data[i][1] || ''), name: String(data[i][2] || 'ডকুমেন্ট'),
      fileId: String(data[i][3] || ''), uploadedAt: assetsDateStr_(data[i][4]) || String(data[i][4] || '')
    });
  }
  return out;
}

/** assetId may be blank for a general (not asset-specific) document, e.g. a purchase invoice covering several items. */
function uploadAssetDocument(token, assetId, base64Data, mimeType, fileName) {
  assetsAuth_(token);
  var safeName = (fileName && String(fileName).trim()) || 'document';
  var fileId = uploadFileToFolder_(DRIVE_FOLDER_IDS.PhotosAndFiles, base64Data, mimeType, 'asset-doc-' + (assetId || 'general') + '-' + safeName);

  var sheet = assetDocsSheet_();
  var id = generateUniqueId('ADOC');
  var now = new Date();
  sheet.appendRow([id, assetId || '', safeName, fileId, now]);
  return getAssetsData(token);
}

function deleteAssetDocument(token, docId) {
  assetsAuth_(token);
  var sheet = assetDocsSheet_();
  var data = sheet.getDataRange().getValues();
  for (var i = 1; i < data.length; i++) {
    if (String(data[i][0]) === String(docId)) {
      var fileId = data[i][3];
      if (fileId) { try { DriveApp.getFileById(fileId).setTrashed(true); } catch (e) { /* ignore */ } }
      sheet.deleteRow(i + 1);
      break;
    }
  }
  return getAssetsData(token);
}

function removeDocumentsForAsset_(assetId) {
  var sheet = assetDocsSheet_();
  var data = sheet.getDataRange().getValues();
  for (var i = data.length - 1; i >= 1; i--) {
    if (String(data[i][1]) === String(assetId)) {
      var fileId = data[i][3];
      if (fileId) { try { DriveApp.getFileById(fileId).setTrashed(true); } catch (e) { /* ignore */ } }
      sheet.deleteRow(i + 1);
    }
  }
}
