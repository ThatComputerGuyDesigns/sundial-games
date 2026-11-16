# Daily Dose

22 daily puzzles, beautifully made. Words, logic, numbers and trivia, all new every day at midnight.
A static single-page app with no build step, no accounts and no tracking. Progress lives in the browser.

## Games
| Words | Logic | Numbers | Trivia |
|---|---|---|---|
| Five · Groups · Mini · Comb · Jumble · Steps · Link · Search | Crowns · Sudoku · Balance · Pixels · Sweeper · Code | Bullseye · Quickfire · Higher | Quiz · Flags · Timeline · Movies · Artist |

## Structure
```
index.html            app shell
css/app.css           design system + every game's styles (light & dark)
js/app.js             router (#/, #/archive, #/stats, #/play/<id>[/<date>]) and game host
js/core.js            dates, storage, streaks, sheets, toasts, results, share
js/registry.js        game catalogue and icons
js/games/<id>.js      one module per game: { buckets, help, mount(ctx) }
data/*.js             puzzle data (day 1 = 2026-11-09)
tools/                puzzle generators + Playwright tests
```

## Run & test
```
python3 -m http.server 8766
node tools/test_solve.js          # plays and wins all 22 games through the UI
node tools/test_screens.js /tmp 390   # screenshots every screen, flags errors/overflow
```
