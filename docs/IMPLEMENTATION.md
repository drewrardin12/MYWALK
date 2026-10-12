# MY WALK implementation

Approved design: dark-only, phone-first; Home with rotating nature scenes and coordinated palettes; immersive Bible-photo Devo; Still Waters Prayer; cinematic category objects in Study; dark lined journals and rich-text writing.

## Data preservation
The original storage key, authentication configuration, and cloud sync are retained. Existing `reads`, `notes`, `prayer`, `study`, memory archives, and queues remain intact. New fields use `walkV2`; new schedule progress is separate from legacy day-index progress. Legacy reading history remains readable with the original plan and source. Backups and cloud snapshots include `walkV2`.

## Reading plan
Authoritative input is the supplied 350-day draft. The corrected verse-numbered source has 66 books, 1,189 chapters and 31,102 verses. Ten chapters had different counts: six missing verses and four split/moved verse-numbering differences. The correction maps passage endpoints by their text, rather than assuming old indexes were standard verse numbers. Revelation 12's extra line maps to 13:1. Day 252 was 111 verses after correction; Mark 7:31–37 (the complete deaf-man healing scene) moves to the start of day 253. Nothing is discarded. Days 252/253 now contain 104/92 verses. Exact source comparison and story-boundary review must be retained with final validation.

`tools/verify_plan.py` checks all 350 days, counts, reference bounds, retained passages, previews and exhaustive optional coverage. Optional progress is separate and synced.

## Validation completed
- All 350 days satisfy counts, reference bounds, minimum track sizes, and the 110-verse ceiling.
- The optional checklist is the exhaustive complement: 4,714 verses in 151 passages.
- All 190 within-chapter story endings were reviewed; source paragraph boundaries and specific scene rationales are recorded in validation/.
- Every canonical chapter count was independently checked against eBible's KJV USFM source. Text variation is documented separately.
- 31 distinct nature scenes are bundled (21 morning, 10 other), approximately 4.2 MB combined. Study has 16 transparent object variants.
- Automated tests cover completion, late totals, data preservation, plan validation, and sync merging. Local browser checks cover navigation, note autosave, prayer progression, and fullscreen.

## Remaining release gates
- User review of this working draft before publication or deployment.
- Two-device live sync and offline conflict checks require an authenticated test account. Existing account configuration is unchanged.
- Final study-pool selection and duration remain undecided; the current pool and schedule are retained.

## Local preview
From this directory run `python3 -m http.server 8765 --bind 127.0.0.1` and open http://127.0.0.1:8765/.
Automated checks: `node --test tests/*.cjs`.
Source verification expects the official eBible KJV USFM archive at `/private/tmp/kjv-usfm.zip` (https://ebible.org/Scriptures/eng-kjv_usfm.zip); run `python3 tools/verify_plan.py` followed by `python3 tools/verify_source.py`.
