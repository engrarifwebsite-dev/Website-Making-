/**
 * Auth.gs
 * Login, logout, session management, salted password hashing,
 * change password, login activity logging.
 *
 * This is a personal single-user app. The Web App deployment itself is
 * already restricted to "Execute as: Me" / "Access: Only myself" at the
 * Google account level — this login screen is an EXTRA layer on top of
 * that (useful if the browser/device is ever shared), not a replacement
 * for it.
 *
 * Requires Config.gs (SPREADSHEET_IDS) and Utils_ID.gs (generateUniqueId)
 * to be present in the same project.
 */

var SESSION_DURATION_MS = 7 * 24 * 60 * 60 * 1000; // 7 days

/* ============================================================
 * Password hashing — salted SHA-256 with a few extra rounds.
 * Apps Script has no bcrypt/PBKDF2 built in, so this is a
 * reasonable "poor man's" key-stretching approach instead of
 * storing a single unsalted/unstretched hash.
 * ============================================================ */
function hashPassword_(password, salt) {
  var input = salt + password;
  var digestBytes = Utilities.computeDigest(Utilities.DigestAlgorithm.SHA_256, input);
  var rounds = 3;
  for (var i = 0; i < rounds; i++) {
    digestBytes = Utilities.computeDigest(Utilities.DigestAlgorithm.SHA_256, digestBytes);
  }
  return Utilities.base64Encode(digestBytes);
}

function generateSalt_() {
  return Utilities.getUuid();
}

/* ============================================================
 * First-run detection
 * ============================================================ */
function hasAccount() {
  var sheet = SpreadsheetApp.openById(SPREADSHEET_IDS.SYS_Master).getSheetByName('Users');
  return sheet.getLastRow() > 1;
}

/* ============================================================
 * First-run: create the one owner account
 * ============================================================ */
function setupAccount(name, email, password) {
  if (hasAccount()) {
    throw new Error('অ্যাকাউন্ট ইতিমধ্যে তৈরি হয়ে গেছে। লগইন করুন।');
  }
  name = (name || '').trim();
  email = (email || '').trim();
  if (!name || !email || !password || password.length < 6) {
    throw new Error('নাম, ইমেইল এবং কমপক্ষে ৬ অক্ষরের পাসওয়ার্ড দিন।');
  }

  var userId = generateUniqueId('USR');
  var salt = generateSalt_();
  var hash = hashPassword_(password, salt);
  var now = new Date();

  var sheet = SpreadsheetApp.openById(SPREADSHEET_IDS.SYS_Master).getSheetByName('Users');
  // Column order matches Setup_SYS_Master.gs:
  // UserID, Name, Email, PasswordHash, Salt, ProfilePhotoFileID, Status, CreatedAt, UpdatedAt
  sheet.appendRow([userId, name, email, hash, salt, '', 'Active', now, now]);

  return login(email, password, 'Account setup');
}

/* ============================================================
 * Login
 * ============================================================ */
function login(email, password, deviceInfo) {
  email = (email || '').trim();
  var ss = SpreadsheetApp.openById(SPREADSHEET_IDS.SYS_Master);
  var usersSheet = ss.getSheetByName('Users');
  var data = usersSheet.getDataRange().getValues();

  for (var i = 1; i < data.length; i++) {
    var row = data[i];
    if (row[2] === email) {
      var hash = hashPassword_(password, row[4]);
      var success = (hash === row[3]);
      logLoginActivity_(row[0], deviceInfo, success);

      if (!success) {
        throw new Error('ভুল ইমেইল বা পাসওয়ার্ড।');
      }
      if (row[6] !== 'Active') {
        throw new Error('এই অ্যাকাউন্ট নিষ্ক্রিয় করা আছে।');
      }
      return createSession_(row[0], deviceInfo);
    }
  }
  logLoginActivity_('', deviceInfo, false);
  throw new Error('ভুল ইমেইল বা পাসওয়ার্ড।');
}

function createSession_(userId, deviceInfo) {
  var ss = SpreadsheetApp.openById(SPREADSHEET_IDS.SYS_Master);
  var sessionsSheet = ss.getSheetByName('Sessions');
  var sessionId = generateUniqueId('SES');
  var rawToken = Utilities.getUuid() + '-' + Utilities.getUuid();
  var tokenHash = Utilities.base64Encode(
    Utilities.computeDigest(Utilities.DigestAlgorithm.SHA_256, rawToken)
  );
  var now = new Date();
  var expires = new Date(now.getTime() + SESSION_DURATION_MS);

  // SessionID, UserID, Token, Device, IP, CreatedAt, ExpiresAt, LoggedOutAt
  sessionsSheet.appendRow([sessionId, userId, tokenHash, deviceInfo || '', '', now, expires, '']);

  return { token: sessionId + '.' + rawToken, expiresAt: expires.toISOString() };
}

/* ============================================================
 * Session validation — call this on every page load.
 * Returns { userId, name, email, photoFileId } or null.
 * ============================================================ */
function validateSession(compositeToken) {
  var parsed = parseToken_(compositeToken);
  if (!parsed) return null;

  var sheet = SpreadsheetApp.openById(SPREADSHEET_IDS.SYS_Master).getSheetByName('Sessions');
  var data = sheet.getDataRange().getValues();

  for (var i = 1; i < data.length; i++) {
    var row = data[i];
    if (row[0] === parsed.sessionId) {
      var tokenHash = Utilities.base64Encode(
        Utilities.computeDigest(Utilities.DigestAlgorithm.SHA_256, parsed.rawToken)
      );
      if (tokenHash !== row[2]) return null;   // Token mismatch
      if (row[7]) return null;                 // Already logged out
      if (new Date(row[6]).getTime() < Date.now()) return null; // Expired

      return getUserById_(row[1]);
    }
  }
  return null;
}

function parseToken_(compositeToken) {
  if (!compositeToken || compositeToken.indexOf('.') === -1) return null;
  var dotIndex = compositeToken.indexOf('.');
  return {
    sessionId: compositeToken.substring(0, dotIndex),
    rawToken: compositeToken.substring(dotIndex + 1)
  };
}

function getUserById_(userId) {
  var sheet = SpreadsheetApp.openById(SPREADSHEET_IDS.SYS_Master).getSheetByName('Users');
  var data = sheet.getDataRange().getValues();
  for (var i = 1; i < data.length; i++) {
    if (data[i][0] === userId) {
      return {
        userId: data[i][0],
        name: data[i][1],
        email: data[i][2],
        photoFileId: data[i][5]
      };
    }
  }
  return null;
}

/* ============================================================
 * Logout
 * ============================================================ */
function logout(compositeToken) {
  var parsed = parseToken_(compositeToken);
  if (!parsed) return;

  var sheet = SpreadsheetApp.openById(SPREADSHEET_IDS.SYS_Master).getSheetByName('Sessions');
  var data = sheet.getDataRange().getValues();
  for (var i = 1; i < data.length; i++) {
    if (data[i][0] === parsed.sessionId) {
      sheet.getRange(i + 1, 8).setValue(new Date()); // LoggedOutAt (8th column)
      break;
    }
  }
}

/* ============================================================
 * Change password
 * ============================================================ */
function changePassword(compositeToken, oldPassword, newPassword) {
  var user = validateSession(compositeToken);
  if (!user) throw new Error('সেশন মেয়াদোত্তীর্ণ হয়ে গেছে, আবার লগইন করুন।');
  if (!newPassword || newPassword.length < 6) {
    throw new Error('নতুন পাসওয়ার্ড কমপক্ষে ৬ অক্ষরের হতে হবে।');
  }

  var sheet = SpreadsheetApp.openById(SPREADSHEET_IDS.SYS_Master).getSheetByName('Users');
  var data = sheet.getDataRange().getValues();
  for (var i = 1; i < data.length; i++) {
    if (data[i][0] === user.userId) {
      var currentHash = hashPassword_(oldPassword, data[i][4]);
      if (currentHash !== data[i][3]) {
        throw new Error('বর্তমান পাসওয়ার্ড সঠিক নয়।');
      }
      var newSalt = generateSalt_();
      var newHash = hashPassword_(newPassword, newSalt);
      sheet.getRange(i + 1, 4).setValue(newHash);   // PasswordHash
      sheet.getRange(i + 1, 5).setValue(newSalt);   // Salt
      sheet.getRange(i + 1, 9).setValue(new Date()); // UpdatedAt
      return true;
    }
  }
  throw new Error('ইউজার পাওয়া যায়নি।');
}

/* ============================================================
 * Profile photo upload — user-changeable (unlike the fixed app logo).
 * Requires Utils_Drive.gs (uploadFileToFolder_, getFileDataUri) and
 * Config.gs (DRIVE_FOLDER_IDS) in the same project.
 * ============================================================ */
function uploadProfilePhoto(compositeToken, base64Data, mimeType) {
  var user = validateSession(compositeToken);
  if (!user) throw new Error('সেশন মেয়াদোত্তীর্ণ হয়ে গেছে, আবার লগইন করুন।');

  var fileId = uploadFileToFolder_(DRIVE_FOLDER_IDS.PhotosAndFiles, base64Data, mimeType, 'profile-' + user.userId);

  var sheet = SpreadsheetApp.openById(SPREADSHEET_IDS.SYS_Master).getSheetByName('Users');
  var data = sheet.getDataRange().getValues();
  for (var i = 1; i < data.length; i++) {
    if (data[i][0] === user.userId) {
      sheet.getRange(i + 1, 6).setValue(fileId);    // ProfilePhotoFileID
      sheet.getRange(i + 1, 9).setValue(new Date()); // UpdatedAt
      break;
    }
  }
  // Returns the file ID only (not base64) — the client builds a fast
  // Drive thumbnail URL from it instead of waiting on a heavy encode.
  return fileId;
}

/* ============================================================
 * Login activity logging (Section 19 security requirement)
 * ============================================================ */
function logLoginActivity_(userId, deviceInfo, success) {
  var sheet = SpreadsheetApp.openById(SPREADSHEET_IDS.SYS_Master).getSheetByName('LoginActivity');
  var logId = generateUniqueId('LOG');
  // Suspicious-login detection (comparing device/IP history) is a
  // Phase 17 cross-module refinement — placeholder false for now.
  var suspicious = false;
  sheet.appendRow([logId, userId, new Date(), deviceInfo || '', '', success ? 'Success' : 'Fail', suspicious]);
}
