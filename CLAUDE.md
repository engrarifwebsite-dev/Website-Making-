# CLAUDE.md

# 🚨 PROJECT DEVELOPMENT & SESSION CONTINUITY PROTOCOL

> **STATUS: MANDATORY**
>
> This file defines the permanent development rules for this repository.
> These instructions MUST be followed throughout the entire project lifecycle.
>
> The project may be developed across multiple Claude accounts and multiple Claude sessions.
> Therefore, the GitHub repository MUST remain self-documenting and recoverable.

---

# 1. CORE PRINCIPLE

## GitHub Repository = Permanent Source of Truth

Conversation history is temporary.

Claude session memory is temporary.

Claude account continuity is NOT guaranteed.

The GitHub repository is the permanent source of truth.

Therefore:

> **Anything another Claude account needs to know MUST eventually exist inside the repository.**

Never depend exclusively on previous conversation history.

Never assume another Claude account knows what the previous Claude account did.

---

# 2. PROJECT OBJECTIVE

This repository contains a personal management web application built primarily with:

* Google Apps Script
* Google Sheets
* HTML
* CSS
* JavaScript

The application is intended to provide a centralized personal information, finance, document, Islamic, asset, and AI-assistant management system.

The application should remain:

* Modular
* Maintainable
* Responsive
* Secure
* User-friendly
* Consistent
* Recoverable across Claude sessions
* Compatible with the existing architecture

---

# 3. TECHNOLOGY PRINCIPLES

Unless explicitly instructed otherwise:

* Preserve the existing technology stack.
* Do not migrate the project to another framework unnecessarily.
* Do not introduce unnecessary dependencies.
* Prefer native HTML/CSS/JavaScript when appropriate.
* Use Google Apps Script for backend/server-side logic where applicable.
* Use Google Sheets as the data layer where that is part of the existing architecture.
* Keep frontend and backend responsibilities clearly separated.
* Reuse existing utilities and components whenever possible.

Do NOT introduce React, Vue, Angular, Node.js, Firebase, Supabase, or another backend/database system simply because it is familiar or convenient.

Only introduce a different technology if explicitly requested or if the existing architecture cannot reasonably support the required functionality.

---

# 4. 🔴 MANDATORY CONTEXT READING

Before starting ANY new task, command, feature, bug fix, redesign, refactor, or code modification:

## STOP AND READ THE PROJECT CONTEXT FIRST.

At minimum inspect:

```text
CLAUDE.md
PROJECT_CONTEXT.md
SESSION_STATE.md
TASK_PROGRESS.md
NEXT_STEPS.md
CHANGELOG.md
```

Then inspect the relevant source files.

Depending on the task, inspect:

```text
.html
.gs
.js
.css
.json
```

and any other relevant files.

---

# 5. CONTEXT READING ORDER

Always follow this order:

```text
CLAUDE.md
↓
PROJECT_CONTEXT.md
↓
SESSION_STATE.md
↓
TASK_PROGRESS.md
↓
NEXT_STEPS.md
↓
CHANGELOG.md
↓
Relevant source files
↓
Git status
↓
Recent commits
↓
Task planning
↓
Implementation
```

Do NOT skip the context stage.

---

# 6. REQUIRED PROJECT MEMORY FILES

The repository MUST maintain the following files:

```text
CLAUDE.md
PROJECT_CONTEXT.md
SESSION_STATE.md
TASK_PROGRESS.md
NEXT_STEPS.md
CHANGELOG.md
```

These files serve different purposes.

---

# 7. PROJECT_CONTEXT.md

## Purpose

Permanent project architecture and decisions.

This file should contain:

### Project identity

* Project name
* Purpose
* Main objectives

### Technology

* Frontend technology
* Backend technology
* Database/data source
* APIs
* External services

### Architecture

* Folder structure
* Page structure
* Component structure
* Backend structure
* Data flow
* Authentication architecture

### Database

Document:

* Google Sheets structure
* Spreadsheet relationships
* Sheet naming conventions
* Column structures
* Important data rules

Never store credentials or secrets.

### UI/UX

Document:

* Approved visual design
* Navigation
* Colors
* Typography
* Layout principles
* Responsive behavior
* Branding
* Logo usage

### Functional modules

Document all implemented modules.

### Permanent decisions

Record architectural and design decisions that future Claude sessions must preserve.

---

# 8. SESSION_STATE.md

## Purpose

This is the most important CURRENT state file.

It describes exactly where the current development session stands.

It MUST contain:

```text
Session date:
Session number:
Current branch:
Latest commit:
Current task:
Current subtask:
Completed:
In progress:
Pending:
Blocked:
Current file:
Current function/component:
Current error:
Testing status:
Uncommitted changes:
Exact stopping point:
Next exact action:
```

Update this file continuously during significant work.

---

# 9. TASK_PROGRESS.md

Maintain the complete project roadmap.

Use these status indicators:

```text
[x] COMPLETED
[~] IN PROGRESS
[ ] PENDING
[!] BLOCKED
[?] NEEDS VERIFICATION
```

Example:

```text
## Authentication

[x] Login UI
[x] Logout
[x] Password change
[?] Security review

## Dashboard

[x] Main layout
[x] Navigation
[~] Weather integration
[ ] Government holiday integration

## Budget Management

[x] Dashboard UI
[~] Transaction backend
[ ] Monthly reports
[ ] Export
```

Never mark something `[x]` unless it has been verified.

---

# 10. NEXT_STEPS.md

This file is the handoff instruction for the NEXT Claude session.

It MUST answer:

> "If another Claude account opens this repository now, exactly what should it do next?"

Include:

```text
LAST COMPLETED TASK
CURRENT TASK
CURRENT STOPPING POINT
FILES TO INSPECT
FUNCTIONS/COMPONENTS TO INSPECT
KNOWN ERRORS
NEXT ACTION
TESTING REQUIRED
IMPORTANT WARNINGS
```

The instructions must be actionable.

Avoid vague statements such as:

```text
Continue development.
Finish the remaining work.
Complete the feature.
```

Instead write:

```text
Open budget.html and inspect the transaction form.

The frontend validation is complete.

The remaining task is to connect saveTransaction()
in Code.gs to the Monthly Transactions sheet.

After implementation:
1. Test valid transaction.
2. Test invalid transaction.
3. Verify Sheet insertion.
4. Verify dashboard total.
5. Update TASK_PROGRESS.md.
6. Commit and push.
```

---

# 11. CHANGELOG.md

Record meaningful project changes.

Each entry should contain:

```text
Date
Session
Task
Changes
Files
Testing
Commit
Remaining work
```

Example:

```text
## 2026-09-22 — Session 08

### Completed
- Added transaction form validation
- Added backend saveTransaction()

### Files
- budget.html
- Code.gs
- budget.js

### Testing
- Valid transaction: PASS
- Empty amount: PASS
- Invalid date: PASS

### Commit
feat: add budget transaction validation

### Remaining
- Connect transaction data to dashboard
```

---

# 12. 🔴 BEFORE EVERY NEW USER COMMAND

Before acting on a new command:

### Step 1

Read context.

### Step 2

Inspect existing implementation.

### Step 3

Determine whether the requested functionality already exists.

### Step 4

Determine which files are relevant.

### Step 5

Check Git state.

### Step 6

Create a short implementation plan.

### Step 7

Implement.

### Step 8

Test.

### Step 9

Update project memory.

### Step 10

Commit/push when appropriate.

---

# 13. NEVER REBUILD COMPLETED WORK

Before creating anything:

SEARCH THE REPOSITORY.

If something already exists:

* Reuse it.
* Extend it.
* Fix it.
* Refactor only when necessary.

Do NOT create duplicate:

* pages
* functions
* components
* styles
* event handlers
* APIs
* database logic
* authentication systems

unless explicitly required.

---

# 14. 🔴 PRESERVE APPROVED UI DESIGN

Existing approved designs are authoritative.

Do not redesign an existing approved page merely because you prefer another design.

Before changing UI:

Inspect:

* existing HTML
* CSS
* JavaScript
* screenshots/design references
* PROJECT_CONTEXT.md

Preserve:

* layout
* navigation
* colors
* typography
* spacing
* branding
* responsiveness
* approved components

Only make design changes requested by the user or necessary to fix functionality.

---

# 15. CODE QUALITY RULES

Write code that is:

* readable
* modular
* maintainable
* reusable
* documented where necessary
* consistent with the existing project

Avoid:

* unnecessary duplication
* giant functions
* magic values
* unused code
* dead code
* unnecessary dependencies
* destructive refactoring

---

# 16. GOOGLE APPS SCRIPT RULES

When working with `.gs` files:

* Preserve existing backend architecture.
* Reuse helper functions.
* Avoid duplicated spreadsheet access logic.
* Validate input.
* Handle errors properly.
* Return predictable responses.
* Avoid exposing sensitive information.
* Keep spreadsheet operations efficient.

When possible:

```text
Read data in batches.
Process data in memory.
Write data in batches.
```

Avoid unnecessary repeated calls to Google Sheets.

---

# 17. GOOGLE SHEETS RULES

When modifying spreadsheet logic:

Never casually change:

* spreadsheet IDs
* sheet names
* column names
* column order
* data formats

unless the change is explicitly required.

If a schema changes:

1. Document the change.
2. Update PROJECT_CONTEXT.md.
3. Update relevant code.
4. Update TASK_PROGRESS.md.
5. Record migration implications in CHANGELOG.md.

---

# 18. FRONTEND RULES

For `.html`, `.css`, `.js`:

* Preserve existing UI.
* Maintain responsive behavior.
* Avoid inline code duplication where possible.
* Reuse components/utilities.
* Validate forms.
* Handle loading states.
* Handle errors.
* Avoid blocking the UI unnecessarily.

---

# 19. SECURITY RULES

NEVER commit:

* passwords
* API keys
* OAuth tokens
* private keys
* service-account credentials
* authentication secrets

Never place secrets in:

```text
PROJECT_CONTEXT.md
SESSION_STATE.md
TASK_PROGRESS.md
NEXT_STEPS.md
CHANGELOG.md
```

Use placeholders such as:

```text
[SECRET STORED OUTSIDE REPOSITORY]
```

---

# 20. GIT SAFETY PROTOCOL

Before modifying code:

Inspect:

```bash
git status
git branch
git log --oneline -10
```

Never blindly execute:

```bash
git reset --hard
git clean -fd
git push --force
```

Never destroy existing work without explicit instruction.

---

# 21. COMMIT STRATEGY

Commit after meaningful logical milestones.

Good examples:

```text
feat: add budget transaction module
fix: resolve dashboard calculation error
refactor: simplify sheet data helper
style: improve responsive dashboard layout
docs: update project context
checkpoint: session handoff
```

Avoid meaningless commits such as:

```text
update
changes
test
new
fix
```

---

# 22. 🔴 SESSION CHECKPOINT SYSTEM

Because Claude Free sessions may end unexpectedly, checkpointing is mandatory.

The project MUST always remain recoverable.

Checkpoint after:

* major feature
* major bug fix
* architecture change
* significant refactor
* meaningful UI milestone

At minimum update:

```text
SESSION_STATE.md
TASK_PROGRESS.md
NEXT_STEPS.md
```

---

# 23. 🚨 APPROXIMATELY 90% SESSION CAPACITY

If the session appears to be approaching approximately 90% of its practical usable capacity, OR Claude provides any warning indicating the session/usage limit is approaching:

IMMEDIATELY ENTER:

# EMERGENCY CHECKPOINT MODE

Do NOT begin another large task.

Do NOT start a large refactor.

Do NOT make unnecessary UI changes.

Instead:

### 1. Save current work.

### 2. Finish only the smallest safe operation if possible.

### 3. Update:

```text
SESSION_STATE.md
TASK_PROGRESS.md
NEXT_STEPS.md
CHANGELOG.md
```

### 4. Update:

```text
PROJECT_CONTEXT.md
```

if architecture/design decisions changed.

### 5. Check all source files.

### 6. Run appropriate tests.

### 7. Check Git status.

### 8. Commit the checkpoint.

### 9. Push to GitHub.

### 10. Confirm the handoff state is recoverable.

Then STOP starting major new work.

---

# 24. NEVER WAIT UNTIL SESSION TERMINATION

Never wait until the final message.

Never assume there will be another response.

Never assume Claude will remember the current task after the session ends.

Always checkpoint before the session becomes critically limited.

---

# 25. EXACT STOPPING POINT REQUIREMENT

Never write:

```text
Some work remains.
```

Instead write:

```text
STOPPING POINT:

Feature:
Budget Management

Current subtask:
Google Sheets transaction insertion

Completed:
- UI form
- Validation
- Error handling

Currently:
saveTransaction() integration

Last verified file:
Code.gs

Remaining:
1. Insert row into Monthly Transactions sheet
2. Return transaction ID
3. Refresh dashboard
4. Test
5. Commit

NEXT ACTION:
Open Code.gs and continue from saveTransaction().
```

---

# 26. RECOVERY BY ANOTHER CLAUDE ACCOUNT

When another Claude account opens this repository:

DO NOT immediately start coding.

First:

```text
1. Read CLAUDE.md
2. Read PROJECT_CONTEXT.md
3. Read SESSION_STATE.md
4. Read TASK_PROGRESS.md
5. Read NEXT_STEPS.md
6. Read CHANGELOG.md
7. Inspect Git status
8. Inspect recent commits
9. Inspect relevant source files
10. Compare checkpoint with actual code
```

Only then continue development.

---

# 27. CHECKPOINT VS ACTUAL CODE

Context files can become outdated.

Therefore:

> ACTUAL CODE + GIT STATE > OLD CHECKPOINT DESCRIPTION

If the checkpoint says one thing but the repository clearly shows another:

1. Inspect the actual code.
2. Determine the real state.
3. Correct the context files.
4. Continue from the verified state.

Never blindly follow an outdated checkpoint.

---

# 28. MULTIPLE CLAUDE ACCOUNTS

The project may be developed using:

* Claude Account A
* Claude Account B
* Claude Account C

Each account must follow the same repository protocol.

A new account must NOT assume that the previous account completed its stated task.

Verify the repository.

---

# 29. SESSION HANDOFF PACKAGE

Before ending a substantial session, ensure the repository contains:

```text
CLAUDE.md
PROJECT_CONTEXT.md
SESSION_STATE.md
TASK_PROGRESS.md
NEXT_STEPS.md
CHANGELOG.md
```

and all relevant source files.

The handoff package must be sufficient for another Claude account to continue without the previous conversation.

---

# 30. FINAL CHECKLIST

Before ending a substantial session:

```text
[ ] Context files read
[ ] Current task understood
[ ] Existing implementation inspected
[ ] Requested work implemented
[ ] Code saved
[ ] Tests performed
[ ] Errors documented
[ ] SESSION_STATE.md updated
[ ] TASK_PROGRESS.md updated
[ ] NEXT_STEPS.md updated
[ ] CHANGELOG.md updated
[ ] PROJECT_CONTEXT.md updated if needed
[ ] Git status checked
[ ] Relevant changes committed
[ ] Changes pushed to GitHub
[ ] Exact stopping point documented
[ ] Next action documented
[ ] No secrets committed
[ ] Another Claude account can recover the project
```

---

# 31. REQUIRED FINAL RESPONSE FORMAT

At the end of a substantial task/session, provide a concise status report:

```text
## SESSION STATUS

### Completed
- ...

### In Progress
- ...

### Pending
- ...

### Blocked
- ...

### Files Changed
- ...

### Tests
- ...

### Git
- Branch:
- Commit:
- Push:

### Next Claude Action
- ...

### Checkpoint
- SESSION_STATE.md updated
- NEXT_STEPS.md updated
- TASK_PROGRESS.md updated
- CHANGELOG.md updated
```

Do not claim completion unless verified.

---

# 32. MOST IMPORTANT RULE

When in doubt:

```text
DO NOT GUESS.
DO NOT REBUILD.
DO NOT DELETE.
DO NOT OVERWRITE.
DO NOT SKIP CONTEXT.
DO NOT HIDE INCOMPLETE WORK.
DO NOT WAIT UNTIL THE SESSION ENDS.
```

Instead:

```text
READ
↓
VERIFY
↓
PRESERVE
↓
IMPLEMENT
↓
TEST
↓
CHECKPOINT
↓
COMMIT
↓
PUSH
```

---

# 🚨 FINAL DIRECTIVE

From this point forward, treat project continuity as a first-class requirement.

Your job is NOT merely to write code.

Your job is to:

1. Understand the existing project.
2. Preserve previous work.
3. Implement the requested task.
4. Verify the implementation.
5. Maintain accurate project documentation.
6. Maintain a recoverable session state.
7. Create a checkpoint before session limits become critical.
8. Commit meaningful work.
9. Push recoverable state to GitHub.
10. Make it possible for another Claude account to continue exactly where you stopped.

## THE NEXT CLAUDE MUST NEVER HAVE TO ASK:

> "What did the previous Claude do?"

The repository itself must answer that question.

# END OF CLAUDE.md
