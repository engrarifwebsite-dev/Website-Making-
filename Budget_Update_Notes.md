# Budget Management — Update Notes

## 1. CHANGELOG.md-এ যোগ করুন (`## 2026-09-20`-এর ওপরে, নতুন তারিখ দিয়ে)

```markdown
## 2026-09-21

### Budget Management page (Phase 7)
- `Page_Budget.html` replaces the placeholder with the full dashboard:
  five summary cards (income, expense, savings, savings goal, remaining
  budget) with change versus last month, an income / expense / savings bar
  chart (last 5, 6 or 12 months), an expense category donut with legend,
  quick actions, the budget category table with usage bars, the savings goal
  tracker and recent activities.
- Month switcher (‹ ›) above the cards; every month reads its own tabs
  ("<Month Year> - Income / Budget / Expense / Ledger").
- Categories: add, edit, delete, and copy last month's budget into an empty
  month. Deleting a category keeps its expenses; they show as "ক্যাটাগরিহীন".
- Income and expense entries can be added and deleted; each entry also writes
  a Ledger row (running balance restarts from 0 each month).
- Reports: PDF (opens the print window, choose "Save as PDF") and Excel
  (UTF-8 CSV that opens directly in Excel).
- New server file `Server_Budget.gs`: `getBudgetDashboard`,
  `saveBudgetCategory`, `deleteBudgetCategory`, `copyBudgetFromPreviousMonth`,
  `setBudgetGoal`, `addBudgetTransaction`, `deleteBudgetTransaction`.
  All of them require a valid session token.
- New tab `SavingsGoals` (MonthLabel, GoalAmount, UpdatedAt) in
  Budget_Management, created automatically on first use.
- Numbers use English digits as in the approved design; set
  `USE_BN_DIGITS = true` at the top of the page script for Bengali digits.
```

## 2. TODO.md-এ পরিবর্তন

- `Pending` থেকে `- [ ] Budget Management (Phase 7)` সরিয়ে `Completed`-এ নিন:
  `- [x] Budget Management: dashboard, categories, goal, income/expense entries, PDF/Excel export`
- `Known Follow-ups`-এ যোগ করুন:
  - `[ ] Budget: link entries to Banks (BankID) and update bank balances.`
  - `[ ] Budget: sync Salary (Power Grid) into monthly Income using GlobalSyncID (Phase 17).`
  - `[ ] Budget: carry the Ledger running balance across months.`
  - `[ ] Add the SavingsGoals tab to Setup_Budget.gs (currently created on first use).`

## 3. Deploy করার ধাপ

1. `Server_Budget.gs` নতুন ফাইল হিসেবে Apps Script-এ যোগ করুন।
2. `Page_Budget.html` পুরনো ফাইলের সম্পূর্ণ বদলে বসান। `Index.html` বদলাতে হবে না (`Page_Budget` আগে থেকেই include করা)।
3. নতুন ডিপ্লয়মেন্ট ভার্সন প্রকাশ করুন, তারপর পেজ রিফ্রেশ করুন।
