# Corrections to the approved draft

Both independent verse-numbered sources agree on 66 books, 1,189 chapters, and 31,102 verses. Source URLs are stored in validation reports.

The previous source's total of 31,100 concealed ten chapter-count discrepancies:
- Missing verses: Matthew 2, Matthew 22, Matthew 26, Mark 4, Mark 7, Mark 8.
- Split/moved numbering: 1 Samuel 20, 1 Kings 22, 3 John 1, Revelation 12–13.

Passage endpoints were matched to the text to preserve the intended material rather than simply retaining shifted array indexes. Missing verses within the retained passages are restored. Existing repeated readings are not deduplicated.

Material adjustments:
- Day 252 exceeded the limit by one verse after the Mark 7 repair. The complete Mark 7:31–37 healing scene moves to the start of day 253. The resulting totals are 104 and 92.
- Matthew 26's four scene chunks now end at standard verses 46, 56, 68, and 75, restoring the intended Gethsemane/arrest/council/denial divisions.
- The old Revelation 12:18 line belongs to standard 13:1. That assigned occurrence moves alongside the complete beast passage on day 348. It is retained separately in the reference list rather than silently deduplicated. Days 347 and 348 now total 103 and 102.

Final recount: 32,026 assigned verses (including repeats); 26,388 unique verses in the main schedule; 4,714 optional verses grouped into 151 chapter-local contiguous passages. Each day still has both categories with at least 20 verses each and no more than 110 total.

Every within-chapter story stopping point has a review record in `validation/story-boundary-review.json`, distinguishing source paragraph boundaries from manually checked scene/teaching breaks. Approved trims can intentionally end at introductions to optional lists. Chapter endings remain normal stopping points. The preview text for the divided Mark 7 scene was updated; Matthew 26 previews already describe the corrected scenes.

The source text differences in `validation/independent-source-report.json` mainly include heading placement and spelling differences; this report is retained rather than claiming byte-identical sources.
