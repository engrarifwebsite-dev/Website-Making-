/**
 * Code.gs
 * Web App entry point. Contains ONLY routing/rendering — no business logic.
 * Page-specific server functions will live in their own Page_*.gs files,
 * added in later phases (Phase 5 onward).
 */
function doGet(e) {
  return HtmlService.createTemplateFromFile('Index')
    .evaluate()
    .setTitle('আমার ব্যক্তিগত ব্যবস্থাপনা')
    .addMetaTag('viewport', 'width=device-width, initial-scale=1')
    .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
}

/**
 * Includes another HTML file's evaluated content inside a template.
 * Used as: <?!= include('FileName'); ?>  (no .html extension needed)
 */
function include(filename) {
  return HtmlService.createTemplateFromFile(filename).evaluate().getContent();
}

/**
 * Returns the fixed approved logo as a base64 data URI so it can be shown
 * in the sidebar WITHOUT making the Drive file public — doGet runs as the
 * owner ("Execute as: Me"), so DriveApp can read it even though the file
 * stays private. Used as: <img src="<?= getLogoDataUri() ?>">
 */
function getLogoDataUri() {
  try {
    var file = DriveApp.getFileById(DRIVE_FILE_IDS.Logo);
    var blob = file.getBlob();
    var base64 = Utilities.base64Encode(blob.getBytes());
    return 'data:' + blob.getContentType() + ';base64,' + base64;
  } catch (e) {
    return '';
  }
}
