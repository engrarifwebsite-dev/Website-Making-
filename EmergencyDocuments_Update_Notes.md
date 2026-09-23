# Emergency Documents (Phase 12) — Update Notes

## 1. CHANGELOG.md-এ যোগ করুন (সবচেয়ে ওপরে, নতুন তারিখ দিয়ে)

```markdown
## 2026-09-24

### জরুরি ডকুমেন্টস (Phase 12) — কাজ শুরু
- `Page_EmergencyDocuments.html` প্লেসহোল্ডারের বদলে সম্পূর্ণ ড্যাশবোর্ড:
  ক্যাটাগরি গ্রিড (৯টি ডিফল্ট ক্যাটাগরি + নতুন যোগ করার অপশন), ড্র্যাগ-ড্রপ
  আপলোড, ফিল্টারসহ সাম্প্রতিক ডকুমেন্টসমূহ টেবিল (দেখুন/ডাউনলোড/সম্পাদনা/
  মুছুন), ⭐ গুরুত্বপূর্ণ ডকুমেন্টস কার্ড, সাম্প্রতিক কার্যকলাপ, স্টোরেজ
  তথ্য এবং দ্রুত অ্যাকশন (Drive ফোল্ডার দেখুন, ব্যাকআপ CSV ইত্যাদি)।
- ডিজাইন প্রজেক্ট মালিকের দেওয়া রেফারেন্স ছবি অনুসরণ করে তৈরি।
- **স্কিমা পরিবর্তন:** Phase 12-এর আগের স্টাব ডিজাইনে (Setup_EmergencyDocuments.gs)
  'My' / 'Family' / 'Official' ট্যাবে এনক্রিপ্টেড আইডি-নম্বর/পাসওয়ার্ড
  ভল্টের পরিকল্পনা ছিল। প্রজেক্ট মালিকের নতুন রেফারেন্স ডিজাইন সেটির বদলে
  একটি ক্যাটাগরি-ভিত্তিক ডকুমেন্ট লাইব্রেরি — তাই এই ফিচারটি নতুন
  'Categories' / 'Documents' / 'ActivityLog' ট্যাবে তৈরি হয়েছে। পুরনো
  তিনটি ট্যাব **মোছা হয়নি** (এখনো তৈরি হয়, ডেটা থাকলে অক্ষত থাকবে), শুধু
  নতুন পেজ সেগুলো ব্যবহার করে না। আইডি/পাসওয়ার্ড ভল্ট এখনো দরকার হলে
  ভবিষ্যতে আলাদা ফিচার হিসেবে যোগ করা যাবে।
- ফাইল Drive-এ যায় Photos and Files > **EmergencyDocuments** নামে একটি
  আলাদা সাবফোল্ডারে (Assets/FamilyPhotos-এর প্যাটার্ন অনুসরণ করে), যাতে
  স্টোরেজ পরিসংখ্যান শুধু এই ফিচারের নিজের হিসাব দেখায়।
- **স্টোরেজ তথ্যের সীমাবদ্ধতা:** ছবির রেফারেন্সে একাধিক Google Drive
  অ্যাকাউন্টের কোটা দেখানো ছিল (Google Drive 01/02/03)। এই অ্যাপ একটিমাত্র
  Google অ্যাকাউন্টে চলে ("Execute as: Me"), তাই বাস্তবসম্মতভাবে এটিকে
  "এই ফোল্ডারে ব্যবহৃত জায়গা" (প্রকৃত ফাইল সাইজের যোগফল) + মোট ডকুমেন্ট +
  এই মাসে আপলোড — এই তিনটি বাস্তব পরিসংখ্যান দিয়ে প্রতিস্থাপন করা হয়েছে।
  বারের সাথে দেখানো শতাংশ প্রকৃত Google অ্যাকাউন্ট কোটা নয়, শুধু ৫ GB
  রেফারেন্স ধরে একটি ভিজ্যুয়াল ইঙ্গিত।
- "ডকুমেন্ট ব্যাকআপ" কুইক অ্যাকশন প্রতিটি ডকুমেন্টের নাম/ক্যাটাগরি/সাইজ/
  Drive-লিংকসহ একটি CSV তালিকা ডাউনলোড করে — সত্যিকারের দ্বিতীয় ক্লাউডে
  অটো-ব্যাকআপ নয় (এই প্রজেক্টে দ্বিতীয় কোনো ক্লাউড অ্যাকাউন্ট সংযুক্ত নেই),
  বরং একটি বাস্তবসম্মত "কোথায় কী আছে" তালিকা।
- নতুন সার্ভার ফাইল `Server_EmergencyDocuments.gs`: `getEmergencyDocumentsData`,
  `saveDocumentCategory`, `deleteDocumentCategory`, `uploadEmergencyDocument`,
  `updateEmergencyDocument`, `toggleDocumentImportant`, `deleteEmergencyDocument`,
  `logDocumentDownload`, `getDocumentBackupManifest`। সবগুলোর জন্য বৈধ
  সেশন টোকেন প্রয়োজন।
- `Setup_EmergencyDocuments.gs` আপডেট: নতুন 'Categories' (৯টি ডিফল্ট
  ক্যাটাগরি সিড করা), 'Documents', 'ActivityLog' ট্যাব তৈরি করে; পুরনো
  'My'/'Family'/'Official' ট্যাব অপরিবর্তিত রাখা হয়েছে।

### Power Grid: Training Bill রিগ্রেশন ফিক্স
- আগের সেশনে Training Bill যোগ করার সময় `Server_PowerGrid.gs`-এর
  `pgStatementSheet_()` থেকে ভুলবশত কলাম-সম্প্রসারণের লজিক বাদ পড়ে
  গিয়েছিল — এর ফলে শিটে পর্যাপ্ত কলাম না থাকলে ডেটা লোড/সংরক্ষণ ব্যর্থ
  হয়ে পুরনো তথ্য দেখাতে থাকত (উদাহরণ: "তথ্য সম্পাদনা" সংরক্ষণ করলেও
  আপডেট দেখা যেত না)। এই সেশনে `Server_PowerGrid.gs` পুনরায় ঠিক করা
  হয়েছে — কলাম-সম্প্রসারণ ফিরিয়ে আনা হয়েছে।
- **এখনো বাকি:** "CPF বার্ষিক সারাংশ" কার্ডের নাম "CPF হিসাব" রাখা এবং
  এই নামে একটি নতুন ট্যাব তৈরি করা — এই অনুরোধটি এখনো প্রয়োগ করা হয়নি।
```

## 2. TODO.md-এ পরিবর্তন

- `Pending` থেকে `- [ ] Emergency Documents (Phase 12)` সরিয়ে `Completed`-এ যোগ করুন:
  `- [x] Emergency Documents: document library dashboard (categories, upload, filters, important docs, activity, storage, backup CSV) (Phase 12)`
- `Known Follow-ups`-এ যোগ করুন:
  - `[ ] Emergency Documents: decide whether the old My/Family/Official encrypted ID/password vault design is still wanted as a separate feature, or can be dropped from Setup_EmergencyDocuments.gs.`
  - `[ ] Power Grid: rename "CPF বার্ষিক সারাংশ" card to "CPF হিসাব" and add a dedicated "CPF হিসাব" subtab — requested, not yet built.`

## 3. Deploy করার ধাপ

1. `Setup_EmergencyDocuments.gs` ও `Server_EmergencyDocuments.gs` Apps Script-এ যোগ/প্রতিস্থাপন করুন।
2. `Page_EmergencyDocuments.html` পুরনো প্লেসহোল্ডার ফাইলের সম্পূর্ণ বদলে বসান। `Index.html` বদলাতে হবে না।
3. ফাংশন ড্রপডাউন থেকে **`setupEmergencyDocuments`** একবার Run করুন (অথবা `setupAllSpreadsheets`) — এতে নতুন ট্যাব ও ডিফল্ট ক্যাটাগরি তৈরি হবে।
4. `Server_PowerGrid.gs`-ও পুনরায় বদলে বসান (Training Bill রিগ্রেশন ফিক্স) — এটি আলাদা ফাইল, এই বার্তার সাথে দেওয়া হয়েছে।
5. নতুন ডিপ্লয়মেন্ট ভার্সন প্রকাশ করে পেজ রিফ্রেশ করুন।
