# Native Android verification

Automated JavaScript tests, browser screen tests, Expo prebuild/autolinking inspection and Android JavaScript export are separate from compiling and running a native APK. A passing bundle does not prove notification delivery or launcher behaviour.

Before distributing, build the release with Android Studio/Gradle and verify these on a real Android device:

1. Launch in airplane mode. Finish onboarding, record income and several expenses, then force-close/reopen and confirm persistence and totals.
2. Edit an entry, create a subcategory, archive/restore it and verify historic reports. Test a cycle starting on day 31 across February.
3. Export XLSX through the share sheet, open it in Excel or LibreOffice, and reconcile Overview to Transactions. Test notes starting with `=` as ordinary text.
4. Export JSON, add a new record, cancel a restore, then confirm a restore. Check replacement semantics and that reminders require re-enabling.
5. Deny then grant notification permission. Enable reminders, verify both scheduled check-ins, revoke app/channel permission in Android settings and reopen. Check the app does not claim effective reminders remain enabled.
6. Check local 08:00/20:00 reminders while backgrounded, after reboot and after timezone changes. Test vendor battery restrictions and force-stop behaviour. Android can delay or suppress best-effort alarms; the app cannot override a user's disabled permissions.
7. Choose a PNG on a supported launcher, approve pinning and open the app through it. Try cancelling, a JPEG renamed `.png`, oversized files and a launcher that does not support pinned shortcuts.
8. Verify dark mode, large text, TalkBack, reduced motion, small screens, keyboard resizing and Android Back dismissal of dialogs.
9. Inspect the merged **release** manifest: Internet/network-state permissions removed, backups disabled, cloud/device-transfer exclusions present, Expo updates disabled.
10. Use a private release signing key for distribution. The generated development key is only suitable for local installation/testing.

This checklist records verification still required in an Android SDK/device environment; it is not a claim those native behaviours have already been observed here.
