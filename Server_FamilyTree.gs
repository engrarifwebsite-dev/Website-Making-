/**
 * Server_FamilyTree.gs
 * Extra server support for the Family Tree UI (Personal Info > ফ্যামিলি ট্রি).
 *
 * It sits ON TOP of the functions already in Server_PersonalInfo.gs
 * (listFamilyMembers, saveFamilyMember, deleteFamilyMember,
 * trashDriveFile_) and does NOT change them. The tree page reads with
 * listFamilyMembers() and writes with the two functions below.
 *
 * FamilyMembers columns (1-based sheet columns):
 *   1 MemberID, 2 Name, 3 PhotoFileID, 4 DOB, 5 Relationship, 6 Gender,
 *   7 Status, 8 DeathDate, 9 Notes, 10 ParentMemberID, 11 SpouseMemberID
 */

var FAMILY_COL_PARENT = 10;  // 1-based column of ParentMemberID
var FAMILY_COL_SPOUSE = 11;  // 1-based column of SpouseMemberID

function getFamilySheet_() {
  return SpreadsheetApp.openById(SPREADSHEET_IDS.Personal_Info).getSheetByName('FamilyMembers');
}

/**
 * Saves (adds or updates) a member AND keeps the spouse link two-way:
 * if A is saved with spouse B, then B's spouse is set to A as well, and any
 * old partner of A or B is cleared. Photo upload is handled by the existing
 * saveFamilyMember() (member.photoBase64 + member.photoMimeType).
 * Returns the member's ID.
 */
function saveFamilyTreeMember(compositeToken, member) {
  var user = validateSession(compositeToken);
  if (!user) throw new Error('সেশন মেয়াদোত্তীর্ণ হয়ে গেছে, আবার লগইন করুন।');

  var memberId = member.memberId ? String(member.memberId) : '';
  var parentId = member.parentMemberId ? String(member.parentMemberId) : '';
  var spouseId = member.spouseMemberId ? String(member.spouseMemberId) : '';

  if (memberId) {
    if (parentId === memberId) {
      throw new Error('কেউ নিজের পিতা/মাতা হতে পারে না।');
    }
    if (spouseId === memberId) {
      throw new Error('কেউ নিজের স্ত্রী/স্বামী হতে পারে না।');
    }
    if (parentId && familyIsDescendant_(memberId, parentId)) {
      throw new Error('নিজের বংশধরকে পিতা/মাতা হিসেবে নির্বাচন করা যাবে না।');
    }
  }

  member.parentMemberId = parentId;
  member.spouseMemberId = spouseId;

  var savedId = saveFamilyMember(compositeToken, member);
  syncFamilySpouseLinks_(savedId, spouseId);
  return savedId;
}

/**
 * Deletes a member. A member who still has children cannot be deleted
 * (that would leave the children hanging with no parent) — move or delete
 * the children first. The spouse's link is cleared and the member's photo
 * goes to the Drive trash (recoverable).
 */
function deleteFamilyTreeMember(compositeToken, memberId) {
  var user = validateSession(compositeToken);
  if (!user) throw new Error('সেশন মেয়াদোত্তীর্ণ হয়ে গেছে, আবার লগইন করুন।');

  memberId = String(memberId || '');
  var data = getFamilySheet_().getDataRange().getValues();
  var photoFileId = '';
  var found = false;

  for (var i = 1; i < data.length; i++) {
    if (String(data[i][0]) === memberId) {
      photoFileId = data[i][2] || '';
      found = true;
    } else if (String(data[i][FAMILY_COL_PARENT - 1] || '') === memberId) {
      throw new Error('এই সদস্যের সন্তান/ডালপালা আছে। আগে তাদের সরান বা মুছুন।');
    }
  }
  if (!found) throw new Error('সদস্য পাওয়া যায়নি।');

  syncFamilySpouseLinks_(memberId, ''); // clears every link that points to this member
  var ok = deleteFamilyMember(compositeToken, memberId);
  if (ok && photoFileId) trashDriveFile_(photoFileId);
  return ok;
}

/**
 * Makes the spouse link two-way for memberId <-> spouseId.
 * Pass spouseId = '' to just remove every link that points to memberId.
 */
function syncFamilySpouseLinks_(memberId, spouseId) {
  var sheet = getFamilySheet_();
  var data = sheet.getDataRange().getValues();
  memberId = String(memberId);
  spouseId = spouseId ? String(spouseId) : '';

  for (var i = 1; i < data.length; i++) {
    var id = String(data[i][0] || '');
    if (!id || id === memberId) continue;
    var current = String(data[i][FAMILY_COL_SPOUSE - 1] || '');

    if (spouseId && id === spouseId) {
      if (current !== memberId) sheet.getRange(i + 1, FAMILY_COL_SPOUSE).setValue(memberId);
    } else if (current === memberId || (spouseId && current === spouseId)) {
      // Someone still pointing at this member (or at the new spouse) = an old partner. Clear it.
      sheet.getRange(i + 1, FAMILY_COL_SPOUSE).setValue('');
    }
  }
}

/** True if candidateId is a child, grandchild, ... of ancestorId. */
function familyIsDescendant_(ancestorId, candidateId) {
  var data = getFamilySheet_().getDataRange().getValues();
  var parentOf = {};
  for (var i = 1; i < data.length; i++) {
    if (data[i][0]) parentOf[String(data[i][0])] = String(data[i][FAMILY_COL_PARENT - 1] || '');
  }
  var current = String(candidateId);
  var guard = 0;
  while (current && guard < 500) {
    if (current === String(ancestorId)) return true;
    current = parentOf[current] || '';
    guard++;
  }
  return false;
}
