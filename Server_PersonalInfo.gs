/**
 * Server_PersonalInfo.gs
 * Server-side support for the ব্যক্তিগত তথ্য page — both the Profile
 * subtab and the Family Tree subtab (Section 5 & 6 of the blueprint).
 *
 * The profile PHOTO here is INDEPENDENT of the header/account avatar
 * (Auth.gs uploadProfilePhoto, Users.ProfilePhotoFileID) — it's stored
 * separately as the 'PhotoFileID' key in Personal_Info > Profile, so
 * changing one does not affect the other.
 */

/* ============================================================
 * Profile (key/value fields in Personal_Info > Profile)
 * ============================================================ */

var PROFILE_FIELDS = [
  'NameBn', 'NameEn', 'Father', 'Mother', 'DOB', 'BloodGroup', 'Nationality', 'Religion', 'MaritalStatus',
  'Spouse', 'Children', 'PermanentAddress', 'CurrentAddress', 'Phone', 'Email', 'Occupation', 'Notes'
];

function getProfile() {
  var sheet = SpreadsheetApp.openById(SPREADSHEET_IDS.Personal_Info).getSheetByName('Profile');
  var data = sheet.getDataRange().getValues();
  var map = {};
  for (var i = 1; i < data.length; i++) {
    var key = data[i][0];
    if (!key) continue;
    var value = data[i][1];
    // google.script.run's transport can silently fail (returns null to the
    // client) when a raw Date object is inside the response — DOB in
    // particular gets auto-typed as a Date by Sheets. Always send plain
    // strings instead, never a raw Date object.
    if (value instanceof Date) {
      value = Utilities.formatDate(value, 'Asia/Dhaka', 'yyyy-MM-dd');
    }
    map[key] = value;
  }
  return map;
}

/** Uploads this page's own profile photo — separate from the header/account avatar. Saves the file ID as 'PhotoFileID' in the Profile sheet and returns it. */
function uploadProfileMainPhoto(compositeToken, base64Data, mimeType) {
  var user = validateSession(compositeToken);
  if (!user) throw new Error('সেশন মেয়াদোত্তীর্ণ হয়ে গেছে, আবার লগইন করুন।');

  var fileId = uploadFileToFolder_(DRIVE_FOLDER_IDS.PhotosAndFiles, base64Data, mimeType, 'personal-info-photo');

  var sheet = SpreadsheetApp.openById(SPREADSHEET_IDS.Personal_Info).getSheetByName('Profile');
  var data = sheet.getDataRange().getValues();
  var now = new Date();
  var found = false;
  for (var i = 1; i < data.length; i++) {
    if (data[i][0] === 'PhotoFileID') {
      sheet.getRange(i + 1, 2).setValue(fileId);
      sheet.getRange(i + 1, 3).setValue(now);
      found = true;
      break;
    }
  }
  if (!found) sheet.appendRow(['PhotoFileID', fileId, now]);

  return fileId;
}

function saveProfile(compositeToken, fields) {
  var user = validateSession(compositeToken);
  if (!user) throw new Error('সেশন মেয়াদোত্তীর্ণ হয়ে গেছে, আবার লগইন করুন।');

  var sheet = SpreadsheetApp.openById(SPREADSHEET_IDS.Personal_Info).getSheetByName('Profile');
  var data = sheet.getDataRange().getValues();
  var now = new Date();

  PROFILE_FIELDS.forEach(function (key) {
    if (!(key in fields)) return;
    var value = fields[key];
    var found = false;

    for (var i = 1; i < data.length; i++) {
      if (data[i][0] === key) {
        sheet.getRange(i + 1, 2).setValue(value);
        sheet.getRange(i + 1, 3).setValue(now);
        found = true;
        break;
      }
    }
    if (!found) {
      sheet.appendRow([key, value, now]);
      data.push([key, value, now]); // keep local copy in sync for subsequent keys in this loop
    }
  });

  return true;
}

/* ============================================================
 * Education timeline (Personal_Info > Education)
 * A dedicated multi-entry list, separate from the flat Profile fields.
 * ============================================================ */

function getEducationList() {
  var sheet = SpreadsheetApp.openById(SPREADSHEET_IDS.Personal_Info).getSheetByName('Education');
  if (!sheet) return [];
  var data = sheet.getDataRange().getValues();
  var results = [];
  for (var i = 1; i < data.length; i++) {
    if (!data[i][0]) continue;
    results.push({
      id: data[i][0],
      degree: data[i][1] || '',
      institution: data[i][2] || '',
      passingYear: data[i][3] || '',
      gradeType: data[i][4] || '',
      gradeValue: data[i][5] || '',
      gradeScale: data[i][6] || ''
    });
  }
  // Most recent first, matching how a CV usually reads.
  results.sort(function (a, b) { return String(b.passingYear).localeCompare(String(a.passingYear)); });
  return results;
}

/**
 * Replaces the ENTIRE education list with what's passed in — simplest way
 * to support add/edit/remove/reorder all from one "সম্পাদনা" modal without
 * needing separate add/update/delete endpoints. entries = array of
 * { id, degree, institution, passingYear, gradeType, gradeValue, gradeScale }.
 *
 * An entry that comes back with its existing `id` KEEPS that ID, so the
 * documents attached to it (Personal_Info > EducationDocuments) stay linked.
 * Entries that are no longer in the list have their attached documents
 * removed too (files go to the Drive trash, so they are recoverable).
 */
function setEducationList(compositeToken, entries) {
  var user = validateSession(compositeToken);
  if (!user) throw new Error('সেশন মেয়াদোত্তীর্ণ হয়ে গেছে, আবার লগইন করুন।');

  var sheet = SpreadsheetApp.openById(SPREADSHEET_IDS.Personal_Info).getSheetByName('Education');
  var lastRow = sheet.getLastRow();

  var existingIds = {};
  if (lastRow > 1) {
    sheet.getRange(2, 1, lastRow - 1, 1).getValues().forEach(function (r) {
      if (r[0]) existingIds[String(r[0])] = true;
    });
    sheet.getRange(2, 1, lastRow - 1, 7).clearContent();
  }

  var keptIds = {};
  var rows = (entries || [])
    .filter(function (e) { return e.degree && String(e.degree).trim(); })
    .map(function (e) {
      var id = e.id ? String(e.id) : '';
      // Only reuse an ID that really existed, and only once.
      if (!id || !existingIds[id] || keptIds[id]) id = generateUniqueId('EDU');
      keptIds[id] = true;
      return [
        id,
        e.degree || '', e.institution || '', e.passingYear || '',
        e.gradeType || '', e.gradeValue || '', e.gradeScale || ''
      ];
    });

  if (rows.length) {
    sheet.getRange(2, 1, rows.length, 7).setValues(rows);
  }

  var removedIds = Object.keys(existingIds).filter(function (id) { return !keptIds[id]; });
  if (removedIds.length) deleteEducationDocsForEntries_(removedIds);

  return true;
}

/* ============================================================
 * Education documents (Personal_Info > EducationDocuments)
 * Certificates, marksheets and other papers attached to an education
 * entry. Files are stored in Drive under
 *   Photos and Files > EducationDocuments
 * and this sheet keeps one row per file:
 *   DocID, EducationID, DocType, FileName, FileID, MimeType, SizeBytes, UploadedAt
 * The EducationDocuments tab is created automatically on first use.
 * ============================================================ */

var EDU_DOC_HEADERS = [
  'DocID', 'EducationID', 'DocType', 'FileName', 'FileID', 'MimeType', 'SizeBytes', 'UploadedAt'
];
var EDU_DOC_MAX_BYTES = 10 * 1024 * 1024; // 10 MB per file
var EDU_DOC_ALLOWED_MIME = [
  'application/pdf',
  'image/jpeg',
  'image/png',
  'image/webp',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
];

function getEducationDocsSheet_() {
  var ss = SpreadsheetApp.openById(SPREADSHEET_IDS.Personal_Info);
  return ensureSheetWithHeaders(ss, 'EducationDocuments', EDU_DOC_HEADERS);
}

function getOrCreateEducationDocsFolder_() {
  var parent = DriveApp.getFolderById(DRIVE_FOLDER_IDS.PhotosAndFiles);
  var existing = parent.getFoldersByName('EducationDocuments');
  if (existing.hasNext()) return existing.next();
  return parent.createFolder('EducationDocuments');
}

/** Makes a file name safe for Drive and for a spreadsheet cell. */
function sanitizeDocFileName_(name) {
  var n = String(name || '')
    .replace(/[\\\/:*?"<>|\r\n\t]/g, '_')
    .replace(/^[=+\-@\s]+/, '_')   // never let a name start like a spreadsheet formula
    .trim();
  if (n.length > 120) {
    var dot = n.lastIndexOf('.');
    var ext = dot > 0 ? n.substring(dot) : '';
    if (ext.length > 10) ext = '';
    n = n.substring(0, 120 - ext.length) + ext;
  }
  return n || 'document';
}

/** Returns the degree name for an education entry, or null if the entry doesn't exist. */
function findEducationDegree_(educationId) {
  var sheet = SpreadsheetApp.openById(SPREADSHEET_IDS.Personal_Info).getSheetByName('Education');
  if (!sheet) return null;
  var data = sheet.getDataRange().getValues();
  for (var i = 1; i < data.length; i++) {
    if (String(data[i][0]) === String(educationId)) return String(data[i][1] || '');
  }
  return null;
}

/** Row -> plain object for the client. The Drive FileID is deliberately NOT sent; downloads go through the server. */
function eduDocToClient_(row) {
  return {
    docId: row[0],
    educationId: row[1],
    docType: row[2] || '',
    fileName: row[3] || '',
    mimeType: row[5] || '',
    size: Number(row[6]) || 0,
    uploadedAt: formatIfDate_(row[7])
  };
}

function trashDriveFile_(fileId) {
  if (!fileId) return;
  try {
    DriveApp.getFileById(fileId).setTrashed(true);
  } catch (e) {
    Logger.log('Could not trash Drive file ' + fileId + ': ' + e.message);
  }
}

/** Lists every education document (metadata only), in upload order. The client groups them by EducationID. */
function getEducationDocuments() {
  var sheet = getEducationDocsSheet_();
  var data = sheet.getDataRange().getValues();
  var results = [];
  for (var i = 1; i < data.length; i++) {
    if (!data[i][0]) continue;
    results.push(eduDocToClient_(data[i]));
  }
  return results;
}

/**
 * Uploads one document for an education entry into
 * Photos and Files > EducationDocuments and records it in the sheet.
 * Returns the new document's metadata.
 */
function uploadEducationDocument(compositeToken, educationId, docType, fileName, base64Data, mimeType) {
  var user = validateSession(compositeToken);
  if (!user) throw new Error('সেশন মেয়াদোত্তীর্ণ হয়ে গেছে, আবার লগইন করুন।');

  if (!educationId) throw new Error('কোন শিক্ষাগত যোগ্যতার জন্য কাগজ যোগ হবে তা নির্বাচন করা হয়নি।');
  if (!base64Data || !fileName) throw new Error('ফাইল পাওয়া যায়নি।');

  var mime = String(mimeType || '').toLowerCase();
  if (EDU_DOC_ALLOWED_MIME.indexOf(mime) === -1) {
    throw new Error('এই ধরনের ফাইল আপলোড করা যাবে না। PDF, JPG, PNG, WEBP বা DOC/DOCX ফাইল দিন।');
  }

  var sizeBytes = Math.floor(String(base64Data).length * 3 / 4);
  if (sizeBytes > EDU_DOC_MAX_BYTES) {
    throw new Error('ফাইলের সাইজ সর্বোচ্চ ১০ MB হতে পারবে।');
  }

  var degree = findEducationDegree_(educationId);
  if (degree === null) throw new Error('এই শিক্ষাগত যোগ্যতাটি পাওয়া যায়নি। পেজ রিফ্রেশ করে আবার চেষ্টা করুন।');

  var cleanName = sanitizeDocFileName_(fileName);
  var driveName = (degree ? degree + ' - ' : '') + cleanName;
  var typeLabel = String(docType || '').trim().substring(0, 60) || 'অন্যান্য';

  var folder = getOrCreateEducationDocsFolder_();
  var fileId = uploadFileToFolder_(folder.getId(), base64Data, mime, driveName);

  var docId = generateUniqueId('EDOC');
  var now = new Date();
  try {
    getEducationDocsSheet_().appendRow([docId, String(educationId), typeLabel, cleanName, fileId, mime, sizeBytes, now]);
  } catch (e) {
    trashDriveFile_(fileId); // don't leave an untracked file behind
    throw e;
  }

  return {
    docId: docId,
    educationId: String(educationId),
    docType: typeLabel,
    fileName: cleanName,
    mimeType: mime,
    size: sizeBytes,
    uploadedAt: formatIfDate_(now)
  };
}

/**
 * Returns the file content as base64 so the browser can save it.
 * Session is checked, and only files registered in EducationDocuments can be
 * read — the client can never ask for an arbitrary Drive file ID.
 */
function getEducationDocumentData(compositeToken, docId) {
  var user = validateSession(compositeToken);
  if (!user) throw new Error('সেশন মেয়াদোত্তীর্ণ হয়ে গেছে, আবার লগইন করুন।');

  var data = getEducationDocsSheet_().getDataRange().getValues();
  for (var i = 1; i < data.length; i++) {
    if (data[i][0] === docId) {
      try {
        var file = DriveApp.getFileById(data[i][4]);
        if (file.isTrashed()) throw new Error('trashed');
        var blob = file.getBlob();
        return {
          fileName: data[i][3] || 'document',
          mimeType: data[i][5] || blob.getContentType(),
          base64: Utilities.base64Encode(blob.getBytes())
        };
      } catch (e) {
        throw new Error('ফাইলটি ড্রাইভে পাওয়া যায়নি।');
      }
    }
  }
  throw new Error('কাগজটি পাওয়া যায়নি।');
}

/** Removes one document: the row is deleted and the Drive file goes to the trash (recoverable). */
function deleteEducationDocument(compositeToken, docId) {
  var user = validateSession(compositeToken);
  if (!user) throw new Error('সেশন মেয়াদোত্তীর্ণ হয়ে গেছে, আবার লগইন করুন।');

  var sheet = getEducationDocsSheet_();
  var data = sheet.getDataRange().getValues();
  for (var i = 1; i < data.length; i++) {
    if (data[i][0] === docId) {
      trashDriveFile_(data[i][4]);
      sheet.deleteRow(i + 1);
      return true;
    }
  }
  return false;
}

/** Internal: removes every document belonging to the given education entry IDs (used when entries are deleted). */
function deleteEducationDocsForEntries_(educationIds) {
  var idSet = {};
  educationIds.forEach(function (id) { idSet[String(id)] = true; });

  var sheet = getEducationDocsSheet_();
  var data = sheet.getDataRange().getValues();
  for (var i = data.length - 1; i >= 1; i--) {
    if (data[i][0] && idSet[String(data[i][1])]) {
      trashDriveFile_(data[i][4]);
      sheet.deleteRow(i + 1);
    }
  }
}


/**
 * ONE-TIME CLEANUP — run this manually (select from the function dropdown,
 * click Run) if the Profile sheet has duplicate FieldName rows. For each
 * FieldName, keeps only the row with the latest UpdatedAt and deletes the
 * rest. Safe to run more than once — it's a no-op once there are no
 * duplicates left.
 */
function cleanupDuplicateProfileFields() {
  var sheet = SpreadsheetApp.openById(SPREADSHEET_IDS.Personal_Info).getSheetByName('Profile');
  var data = sheet.getDataRange().getValues();

  var bestRowForKey = {}; // FieldName -> { rowIndex (0-based, matches `data`), updatedAt }
  for (var i = 1; i < data.length; i++) {
    var key = data[i][0];
    if (!key) continue;
    var updatedAt = data[i][2] ? new Date(data[i][2]).getTime() : 0;
    if (!bestRowForKey[key] || updatedAt >= bestRowForKey[key].updatedAt) {
      bestRowForKey[key] = { rowIndex: i, updatedAt: updatedAt };
    }
  }

  var keepRow = {};
  Object.keys(bestRowForKey).forEach(function (key) {
    keepRow[bestRowForKey[key].rowIndex] = true;
  });

  var deletedCount = 0;
  for (var i = data.length - 1; i >= 1; i--) {
    if (data[i][0] && !keepRow[i]) {
      sheet.deleteRow(i + 1); // +1: sheet rows are 1-indexed, data[0] is the header row
      deletedCount++;
    }
  }

  Logger.log('Cleanup done. Kept ' + Object.keys(bestRowForKey).length + ' unique fields, deleted ' + deletedCount + ' duplicate row(s).');
}

/** Debug helper — run this manually and check Execution log to see exactly what getProfile() returns right now. */
function debugGetProfile() {
  var result = getProfile();
  Logger.log(JSON.stringify(result, null, 2));
}

/* ============================================================
 * Family Tree (Personal_Info > FamilyMembers)
 * Columns: MemberID, Name, PhotoFileID, DOB, Relationship, Gender,
 *          Status, DeathDate, Notes, ParentMemberID, SpouseMemberID
 * ============================================================ */

function listFamilyMembers() {
  var sheet = SpreadsheetApp.openById(SPREADSHEET_IDS.Personal_Info).getSheetByName('FamilyMembers');
  var data = sheet.getDataRange().getValues();
  var results = [];

  for (var i = 1; i < data.length; i++) {
    var row = data[i];
    if (!row[0]) continue;

    results.push({
      memberId: row[0],
      name: row[1],
      photoFileId: row[2],
      dob: formatIfDate_(row[3]),
      relationship: row[4],
      gender: row[5],
      status: row[6] || 'Living',
      deathDate: formatIfDate_(row[7]),
      notes: row[8],
      parentMemberId: row[9],
      spouseMemberId: row[10]
    });
  }
  return results;
}

function formatIfDate_(value) {
  if (!value) return '';
  var date = value instanceof Date ? value : new Date(value);
  if (isNaN(date.getTime())) return '';
  return Utilities.formatDate(date, 'Asia/Dhaka', 'yyyy-MM-dd');
}

/**
 * Adds a new member (no memberId) or updates an existing one (has memberId).
 * If member.photoBase64/photoMimeType are present, uploads a new photo to
 * Drive and uses that file's ID; otherwise keeps member.photoFileId as-is.
 */
function saveFamilyMember(compositeToken, member) {
  var user = validateSession(compositeToken);
  if (!user) throw new Error('সেশন মেয়াদোত্তীর্ণ হয়ে গেছে, আবার লগইন করুন।');

  if (!member.name || !String(member.name).trim()) {
    throw new Error('নাম আবশ্যক।');
  }

  var photoFileId = member.photoFileId || '';
  if (member.photoBase64 && member.photoMimeType) {
    var folder = getOrCreateFamilyPhotosFolder_();
    photoFileId = uploadFileToFolder_(folder.getId(), member.photoBase64, member.photoMimeType, 'family-' + member.name);
  }

  var sheet = SpreadsheetApp.openById(SPREADSHEET_IDS.Personal_Info).getSheetByName('FamilyMembers');
  var rowValues = [
    member.name, photoFileId, member.dob || '', member.relationship || '',
    member.gender || '', member.status || 'Living', member.deathDate || '',
    member.notes || '', member.parentMemberId || '', member.spouseMemberId || ''
  ];

  if (member.memberId) {
    var data = sheet.getDataRange().getValues();
    for (var i = 1; i < data.length; i++) {
      if (data[i][0] === member.memberId) {
        sheet.getRange(i + 1, 2, 1, 10).setValues([rowValues]);
        return member.memberId;
      }
    }
    throw new Error('সদস্য পাওয়া যায়নি।');
  }

  var memberId = generateUniqueId('FAM');
  sheet.appendRow([memberId].concat(rowValues));
  return memberId;
}

function deleteFamilyMember(compositeToken, memberId) {
  var user = validateSession(compositeToken);
  if (!user) throw new Error('সেশন মেয়াদোত্তীর্ণ হয়ে গেছে, আবার লগইন করুন।');

  var sheet = SpreadsheetApp.openById(SPREADSHEET_IDS.Personal_Info).getSheetByName('FamilyMembers');
  var data = sheet.getDataRange().getValues();
  for (var i = 1; i < data.length; i++) {
    if (data[i][0] === memberId) {
      sheet.deleteRow(i + 1);
      return true;
    }
  }
  return false;
}

function getOrCreateFamilyPhotosFolder_() {
  var parent = DriveApp.getFolderById(DRIVE_FOLDER_IDS.PhotosAndFiles);
  var existing = parent.getFoldersByName('FamilyPhotos');
  if (existing.hasNext()) return existing.next();
  return parent.createFolder('FamilyPhotos');
}
