# Future server migration

No networking transport or server URL exists in this version. Export/share remains a manual user action. Android release Internet permission is removed, so future networking requires a reviewed native configuration change as well as application code.

Before adding an online version:

1. Define a new opt-in migration screen showing the destination server and which records will be sent.
2. Version the wire schema and validate both server and local representations. Preserve IDs, created/updated timestamps, installation identity and transaction deletion markers.
3. Capture one durable snapshot behind the action-service queue. Give the migration attempt its own ID and use an idempotent server import endpoint.
4. Send only after explicit confirmation. Show progress, server acknowledgement and recoverable errors. A cancelled or failed upload must not clear local data.
5. Keep backup/export available. Ongoing two-way sync needs an additional change journal, deletion markers for other entity types, conflict rules and identity/authentication design. The current installation revision alone is not a distributed conflict-resolution algorithm.

Keep the domain and UI usable with the local repository throughout that work. Do not add silent telemetry or background uploads as a side effect of introducing account support.
