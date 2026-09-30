/**
 * Utils_Drive.gs
 * Shared Drive helper functions — upload and read-as-data-URI.
 * Used by profile photo upload (Auth.gs) and reused by every page that
 * needs image/document upload (Assets, Emergency Documents, Family Tree,
 * Age Calculator, etc).
 *
 * ------------------------------------------------------------------
 * NOTE (2026-09-27): "broken image" icon fix
 * Every photo/icon shown in this app is rendered as:
 *   <img src="https://drive.google.com/thumbnail?id=FILE_ID&sz=wN">
 * That specific Drive endpoint is effectively an ANONYMOUS/public request —
 * it does NOT reliably use the viewer's own logged-in Drive session, even
 * when the viewer IS the file's owner. Opening the same file directly in
 * Drive's own UI always works (that's a fully authenticated request), which
 * is why a file can look completely fine in Drive but still show as a
 * broken image inside the app.
 * Folder-level "Anyone with the link" sharing on an ancestor folder is not
 * always enough either — a file created via DriveApp.createFile() starts
 * out PRIVATE to the owner regardless of how its parent folder is shared.
 * Fix: explicitly set "Anyone with the link: Viewer" on the file itself,
 * right at upload time, below. This is safe (read-only link access) and
 * matches how every existing photo feature in this app is meant to work.
 * ------------------------------------------------------------------
 */

/** Reads any Drive file and returns it as a base64 data URI. */
function getFileDataUri(fileId) {
  if (!fileId) return '';
  try {
    var blob = DriveApp.getFileById(fileId).getBlob();
    return 'data:' + blob.getContentType() + ';base64,' + Utilities.base64Encode(blob.getBytes());
  } catch (e) {
    return '';
  }
}

/** Uploads a base64 file into the given Drive folder and returns the new file's ID. */
function uploadFileToFolder_(folderId, base64Data, mimeType, fileName) {
  var folder = DriveApp.getFolderById(folderId);
  var blob = Utilities.newBlob(Utilities.base64Decode(base64Data), mimeType, fileName);
  var file = folder.createFile(blob);

  // See the 2026-09-27 note above — without this, "drive.google.com/thumbnail?id=..."
  // links used throughout the app can show a broken-image icon even though
  // the file itself is perfectly valid and opens fine directly in Drive.
  try {
    file.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);
  } catch (e) {
    // Only fails if the Google account's domain policy blocks link sharing —
    // never let that break the upload itself.
  }

  return file.getId();
}
