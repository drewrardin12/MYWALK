# Approved standard reading plan

The 350-day schedule starts January 1, 2026, using the existing calendar mapping. Each day has one story card and one non-story card. Story follows canonical OT-to-NT order; non-story follows canonical NT-to-OT order. Acts and all retained passages in 2 Samuel are story. Other classifications match the user-approved split.

The main schedule contains 26,432 unique verses with no repeats; 4,670 optional verses complete the verified 31,102-verse Bible. Daily totals are 60–87; each track has at least 20 verses. Retained printed heading sections are kept together. Ezra 10:12–17 remains main while 18–44 is optional, the sole partially included heading.

Cards contain a main title, short summary, Bible-app link, one completion check, and an accessible icon that expands all printed headings with exact assigned references. The 700 summaries reuse authored passage/chapter previews only where the complete described span is included; additional summaries cover newly divided portions.

## Fresh start

The user explicitly requested a progress reset and preservation of notes in Settings → Catch All notebook. `reading-plan-migration.js` runs once when `plan_version` is `standard-headings-350-v1`. It preserves existing notebook content and appends dated reading reflections and legacy personal notes; resets reading and optional checks and old completion credit; and leaves prayer records, study findings, and other app data intact. A recoverable pre-migration snapshot remains in `walkV2.freshStart.backup`. The migration version prevents a subsequent reload from resetting new progress.

Sync normalizes old remote and base snapshots through this migration before comparing them, preventing unchanged old schedule checks from being restored during the transition. Concurrent conflicting note edits still use the existing sync review flow.

## Validation

- `node --test tests/*.test.cjs`: numerical limits, canonical order, unique coverage, approved inclusions and omissions, sync behavior, note preservation, and migration idempotency.
- `tests/reading-cards.browser.cjs`: isolated mobile-browser checks of both reading cards, expanded headings, Bible app URL, completion persistence, and Catch All note preservation. Uses Playwright and an isolated local preview; screenshots in `validation/standard-*.png` contain synthetic test notes only.
- App cache revision 100 includes the migration script and updated schedule assets.
