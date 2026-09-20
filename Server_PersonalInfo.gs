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
 * { degree, institution, passingYear, gradeType, gradeValue, gradeScale }.
 */
function setEducationList(compositeToken, entries) {
  var user = validateSession(compositeToken);
  if (!user) throw new Error('সেশন মেয়াদোত্তীর্ণ হয়ে গেছে, আবার লগইন করুন।');

  var sheet = SpreadsheetApp.openById(SPREADSHEET_IDS.Personal_Info).getSheetByName('Education');
  var lastRow = sheet.getLastRow();
  if (lastRow > 1) {
    sheet.getRange(2, 1, lastRow - 1, 7).clearContent();
  }

  var rows = (entries || [])
    .filter(function (e) { return e.degree && String(e.degree).trim(); })
    .map(function (e) {
      return [
        generateUniqueId('EDU'),
        e.degree || '', e.institution || '', e.passingYear || '',
        e.gradeType || '', e.gradeValue || '', e.gradeScale || ''
      ];
    });

  if (rows.length) {
    sheet.getRange(2, 1, rows.length, 7).setValues(rows);
  }
  return true;
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
