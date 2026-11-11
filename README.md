# ☀️ Sundial — daily games for curious minds

23 fresh puzzles every day: words, logic, numbers and trivia. Static site, no build step, no accounts.
Progress, streaks and stats live in the browser (localStorage).

## Games
**Words** Letterbox · Crossbit · Hive *(new)* · Scramble *(new)* · Ladder · Wordscape · Trifecta
**Logic** Fours · Crowns *(new)* · Duo *(new)* · Nine *(new)* · Pixel *(new)* · Sweep *(new)* · Outlier
**Numbers** Target · Sprint *(new)* · Safecracker
**Knowledge** Quizfive · Cinemoji · Encore · Flagpole · Chrono · Hilo

## Structure
```
index.html        today's hub (progress ring, day streak, featured pick, filters)
archive.html      calendar of every past edition
stats.html        lifetime stats, heatmap, per-game streaks
games/*.html      one page per game
js/common.js      shared engine (dates, storage, stats, modals, results card, share)
js/games.js       game registry + pictograms (single source of truth)
data/*.js         puzzle data, one entry per day (day 1 = 2026-11-09)
tools/            puzzle generators and Playwright tests
```

## Puzzle generation
- `python3 tools/gen_logic.py 366` — Nine (sudoku, weekday difficulty), Crowns, Duo, Pixel, Sweep. Every puzzle is
  checked for a unique solution; Pixel is line-solvable and Sweep is guaranteed no-guess.
- `python3 tools/gen_words.py <wordlist-english dir>` — Hive and Scramble from SCOWL common-word lists.

## Run locally
```
python3 -m http.server 8765
node tools/test_solve_new.js /tmp     # solves all new games headlessly
node tools/test_screens.js /tmp 390   # screenshots every page, reports errors/overflow
```
