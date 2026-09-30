/**
 * Utils_FixDriveSharing.gs
 * ONE-TIME REPAIR — run this manually (select fixAllDriveSharing from the
 * function dropdown in the Apps Script editor, then click Run) if any
 * picture or document uploaded BEFORE the 2026-09-27 fix in
 * Utils_Drive.gs still shows a broken-image icon anywhere in the app
 * (category icons, profile photo, family photos, asset photos, education
 * documents, emergency documents, leave office-orders, etc).
 *
 * Every file uploaded via uploadFileToFolder_() before that fix was left
 * PRIVATE (Apps Script does not auto-inherit a parent folder's sharing),
 * which is why some thumbnails/download links can fail depending on the
 * viewer's browser/cookie behaviour even though the files themselves are
 * perfectly valid. This walks every subfolder under "Photos and Files"
 * (and the Home slideshow folder) and sets "Anyone with the link —
 * Viewer" sharing on every file found.
 *
 * Safe to run more than once — files that are already link-shared are
 * simply left as they are, and no file content or metadata is changed.
 *
 * Requires: Config.gs (DRIVE_FOLDER_IDS).
 */
function fixAllDriveSharing() {
  var rootIds = [DRIVE_FOLDER_IDS.PhotosAndFiles, DRIVE_FOLDER_IDS.HomeSlideshow];
  var fixed = 0, alreadyOk = 0, failed = 0;

  function walk(folder) {
    var files = folder.getFiles();
    while (files.hasNext()) {
      var file = files.next();
      try {
        var access = file.getSharingAccess();
        if (access === DriveApp.Access.ANYONE_WITH_LINK || access === DriveApp.Access.ANYONE) {
          alreadyOk++;
        } else {
          file.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);
          fixed++;
        }
      } catch (e) {
        failed++;
        Logger.log('Could not fix sharing for "' + file.getName() + '" (' + file.getId() + '): ' + e.message);
      }
    }

    var subfolders = folder.getFolders();
    while (subfolders.hasNext()) {
      walk(subfolders.next());
    }
  }

  rootIds.forEach(function (id) {
    if (!id) return;
    try {
      walk(DriveApp.getFolderById(id));
    } catch (e) {
      Logger.log('Could not open root folder ' + id + ': ' + e.message);
    }
  });

  Logger.log('Drive sharing repair complete. Fixed: ' + fixed + ', already OK: ' + alreadyOk + ', failed: ' + failed + '.');
}
