# Pabloooo

An Android money journal built with React Native, TypeScript and Expo. Record money in and money out, see where it goes, and plan the next budget cycle. Currency is Nigerian naira (NGN).

## What works

- Income and expense entry with merchant, notes, local date/time, editing and soft deletion.
- Custom income/expense categories and subcategories, colours, archival and local category suggestions.
- Dashboard, searchable ledger and interactive cashflow charts with exact interval values.
- Day/hour, week, calendar month, quarter, year and inclusive custom-date reports.
- Category totals, transaction frequency and percentage of actual recorded income.
- Configurable budget-cycle start day (1–31), category limits, expected income and daily spending room.
- Recurring bills and income, due-date tracking, pause/resume and manual payment confirmation.
- Savings goals, quick calculator with entry handoff, and a spending-cut calculator.
- Light/dark/system themes, animated entrances, tactile controls and reduced-motion support.
- Local 08:00 and 20:00 reminders, with permission and Android channel checks.
- Styled XLSX exports, versioned JSON backups and explicitly confirmed restore.
- Gallery PNG validation and a native, launcher-confirmed Android home-screen shortcut.

## Privacy and storage

There is no backend, account, bank connection, advertising, analytics SDK, remote push token registration or automatic upload. SQLite persists the journal inside Android app storage. Production configuration removes Internet permission, disables Expo updates, and excludes the database/files from Android cloud backup and device-transfer backup.

Records are not encrypted by this app. Android's app sandbox and device security protect local storage. User-created JSON/XLSX exports contain readable financial information. A system share sheet opens only when you request an export; you choose where it goes. Uninstalling or clearing app storage removes local data, so keep a manual backup when needed.

## Run on Android

Use Node.js 24 and an Android development environment with the JDK/SDK requested by the generated Expo Android project. No hosted Expo account or backend is needed for local builds.

```bash
npm ci
npx expo prebuild --platform android --no-install
npm run android
```

`npm run android` builds and installs the **release** variant, which contains its JavaScript bundle and works without Metro or Internet. The release requires a connected Android device or running emulator. For a standalone APK after prebuild:

```bash
cd android
./gradlew assembleRelease
```

The local Expo template signs release builds with its development key by default. Configure your own private signing key before distributing through Google Play. Do not commit keys or credentials. The custom PNG shortcut needs this native build and a launcher supporting Android pinned shortcuts. It does not replace the installed app's main launcher icon.

## Checks

```bash
npm run check
npm run test:ui
npm run format:check
EXPO_OFFLINE=1 EXPO_NO_TELEMETRY=1 npx expo export --platform android
```

The UI tests render the actual React Native screens through React Native Web, with a memory repository and explicitly scoped browser adapters. They test form/navigation interactions and export generation, not native SQLite, notification delivery or launcher approval. Linux tests use a packaged headless Chromium; macOS/Windows users should run `npx playwright install chromium` first.

See [architecture](docs/architecture.md), [the user guide](docs/user-guide.md), [spreadsheet semantics](docs/export.md), and [native verification](docs/android-verification.md).

## Important behaviour

Recurring schedules do not invent transactions. Confirm each actual payment or income entry. Reports compare spending to recorded income in the selected range; when income is zero, the percentage is unavailable. Planned income is kept separate from actual income. Savings-goal progress is manual and does not change the ledger balance.

Budget cycles clamp days 29–31 to the last day of shorter months. Changing the start day affects the active cycle; old budgets retain their original cycle keys. Calendar reports and budget cycles are separate choices. Notifications are local best-effort Android alarms: permission, disabled channels, force-stop and power management can prevent or delay delivery. Reopen the app after reboot or timezone changes and verify reminders in Settings.

## Future server migration

Schema-versioned backups retain record IDs, timestamps, installation identity, revision and transaction deletion markers. This is preparation for a future migration, not a hidden sync client. Adding a server requires a separately implemented, explicitly user-triggered upload workflow. See [migration notes](docs/future-sync.md).
