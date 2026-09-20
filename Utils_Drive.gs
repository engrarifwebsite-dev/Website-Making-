/**
 * Utils_Drive.gs
 * Shared Drive helper functions — upload and read-as-data-URI.
 * Used by profile photo upload (Auth.gs) and will be reused by every
 * future page that needs image/document upload (Assets, Emergency
 * Documents, Family Tree, etc).
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
  return file.getId();
}
