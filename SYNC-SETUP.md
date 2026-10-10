# Activate cross-device sync

1. Sign in or create an account at https://supabase.com/dashboard and create a project named MYWALK. Keep its database password in your password manager.
2. Open the SQL Editor. Run the contents of `sync/schema.sql` once. It creates private account storage and a guarded save function.
3. In Authentication → URL Configuration, set Site URL to `https://drewrardin12.github.io/MYWALK/`. The app uses the default email sign-in link template.
4. The default sender is limited to two messages per hour. After your first email-link sign-in, set a MYWALK sign-in password in Sync & Account and use it on your other devices. It is separate from the database password. Configure email delivery for your account. Supabase's default sender may restrict recipients to project team members; use a custom SMTP provider if necessary. Keep provider credentials in Supabase, never in this repository.
5. Copy the project URL and **publishable key** into `sync-config.js`. These values are public by design; the database enforces access. Never use the secret/service-role key.
6. Deploy the updated files to GitHub Pages. Open Settings → Sync & Account on the device with your most complete entries first. Enter your email and open the emailed sign-in link on that device, in the browser where you use MYWALK. It uploads your existing data.
7. On your other devices, sign in with the same email and MYWALK sign-in password. Save a backup file from each device first. If asked to choose, download both copies and choose the cloud version only after preserving any unique entries.

## Behavior and recovery

Edits save locally immediately. Sync runs after edits, when returning to the app, on reconnect, and every 15 seconds while the app is visible. Background apps cannot promise instant syncing. Stay online long enough for “All changes synced” before switching devices.

Changes to separate object fields merge. Existing list formats use positional IDs, so concurrent edits to a list pause for a deliberate choice rather than guessing. The choice applies to the complete snapshot, not just one field. Both snapshots are retained in `mywalk_before_sync_choice` before replacement. Download both versions for a portable recovery copy. Sign-out leaves entries on the device; use this app on your personal devices. A different account cannot automatically upload the previous account's entries.

The old GitHub backup remains separate from account sync. Do not use a stale cloud backup to replace a device with newer entries.

## Validation before release

Run `node --test tests/sync.test.cjs` from the repository. Then use a real test account on two browsers: verify email link login, existing-data migration, reading progress and notes on both devices, offline edit/reconnect, deletion, conflicting edits, sign-out and token refresh. Confirm an unauthenticated request and a second account cannot read the first account's row. The local tests simulate storage and concurrency; they do not prove live Supabase configuration or email delivery.
