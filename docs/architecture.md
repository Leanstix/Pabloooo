# Architecture

The application has four boundaries:

1. `src/domain`: pure exact-money calculations, calendar logic, validation, analytics and an immutable reducer.
2. `src/platform`: Android-facing adapters over testable ports for SQLite, file sharing, notifications and PNG shortcuts.
3. `src/app`: durable application orchestration and React bindings.
4. `src/ui`: themed screens, editors, charts and interaction components. `src/export` generates XLSX without network or Node-only runtime dependencies.

All stored monetary values are safe integer kobo. Display and XLSX naira amounts derive from those values. Validators reject unsupported schemas, malformed timestamps, unsafe amounts, duplicate IDs and broken category/recurrence references. Local calendar boundaries use the phone timezone; ranges include the start and exclude the end internally. Date-picker end dates are converted from inclusive to exclusive.

SQLite holds a checksummed, schema-versioned snapshot in WAL mode. A transaction compares the last loaded revision before updating. A failed read prevents writes through that repository handle. This deliberately simple snapshot design suits a personal journal and makes restore atomic. It rewrites the snapshot on each edit; large multi-user or high-volume ledgers should move to indexed row tables with a schema migration. Backups and snapshots have explicit size bounds.

`FinanceEngine` serializes durable edits and publishes new state only after persistence succeeds. No-op actions do not write stale revisions. The action service orders notification side effects, settings changes, restores and export snapshot reads. A failed settings save attempts to restore the prior Android schedules. Permission revocation reconciles saved reminder intent to disabled. Session management serializes bootstrap/disposal across React development remounts.

Recurring confirmation creates one actual transaction and advances its schedule in the same state change. A repeated transaction ID is idempotent. Original calendar anchors preserve month-end and leap-day behaviour. Deleted transactions remain in backups with a deletion timestamp but leave report totals. Archiving a parent category also archives children and pauses their recurring schedules.

The local Expo Kotlin module accepts only bounded PNG files in app-private storage and requests a pinned shortcut. The launcher user decides whether to approve. Native code verifies the signature and decode bounds independently of TypeScript validation.

XLSX uses pure XML and `fflate` ZIP generation. Tests open its output with an independent ExcelJS reader. No workbook macros, external links or formula execution of user-entered text are included. Reconciliation formulas have cached values for readers that do not recalculate immediately.
