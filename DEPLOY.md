# MY WALK — Deploy Instructions

## Push to GitHub Pages
1. Create a new repo named **MYWALK** on github.com (account: drewrardin12), public, empty (no README).
2. Upload everything in this folder to the repo root — easiest way on iPhone/desktop web:
   repo page → **Add file → Upload files** → drag the whole folder contents in
   (index.html, sw.js, DEPLOY.md, and the data/ folder) → Commit.
3. Repo **Settings → Pages** → Source: *Deploy from a branch* → Branch: **main**, folder **/ (root)** → Save.
4. Wait ~1 minute, then open **https://drewrardin12.github.io/MYWALK/**

## Add to iPhone home screen
1. Open the link in Safari.
2. Share button → **Add to Home Screen** → name it *MY WALK*.
3. First open loads ~9 MB of data (KJV, Nave's, Strong's); after that it works fully offline.

## Notes
- All state (readings, streak, prayer list, notes, memory verses) lives on the phone in localStorage. The **Download backup** button in Study → Notes exports notes as a text file.
- Album & sermon queues start empty: Devo → Album Queue / Sermon Queue → **Paste list** accepts your whole album-queue.md / sermon-queue.md contents, one item per line.
- If you ever update the data files in the repo, bump the `V` string in sw.js (e.g. `mywalk-v2`) so phones fetch the new versions.
