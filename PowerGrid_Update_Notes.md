# Power Grid — Tabs and Training Bill Update Notes

## 1. CHANGELOG.md-এ যোগ করুন (`## 2026-09-21`-এর ভেতরে, "Power Grid: CPF card rule and page cleanup"-এর ওপরে)

```markdown
### Power Grid: two tabs and Training Bill
- The Power Grid page now has two subtabs: "বেতন ও ভাতা" (the existing salary
  statement, CPF summary and reports, unchanged) and "ছুটির হিসাব" (new tab,
  placeholder for now; its content comes in a later step).
- New earning line "Training Bill" (after Local Training) in the Earnings card,
  the entry form, the details modal, PDF and Excel export. It counts in Gross
  Salary and in Total Allowance.
- Stored in a new `TrainingBill` column (column 39) at the end of
  `SalaryStatements`; the header is added automatically and old rows read 0.
- Files changed: `Page_PowerGrid.html`, `Server_PowerGrid.gs`.
  The comments in `Server_PowerGrid.gs` now describe the new CPF rule.
```

## 2. TODO.md-এ পরিবর্তন

- `Pending` এর `Power Grid: Leave, CPF Loan and Increment sections` লাইনটি বদলে লিখুন:
  `- [ ] Power Grid: ছুটির হিসাব tab content (Leave), then CPF Loan and Increment sections (Phase 8, remaining part)`
- `Known Follow-ups` থেকে এই লাইনটি সরিয়ে দিন (মন্তব্য ঠিক করা হয়েছে):
  `Power Grid: the comments in Server_PowerGrid.gs ... still say ...`

## 3. Deploy করার ধাপ

1. `Page_PowerGrid.html` ও `Server_PowerGrid.gs` পুরনো ফাইলের সম্পূর্ণ বদলে বসান।
2. নতুন ডিপ্লয়মেন্ট ভার্সন প্রকাশ করে পেজ রিফ্রেশ করুন।
3. পুরনো স্টেটমেন্টে Training Bill ০ দেখাবে; প্রয়োজনে সম্পাদনা করে মান বসান।
