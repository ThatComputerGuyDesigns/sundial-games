/* Sundial game registry: one source of truth for the hub, nav, archive, stats and "up next". */
(function () {
  var S = 'fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"';
  var F = 'fill="currentColor"';
  function svg(inner) { return '<svg viewBox="0 0 48 48" aria-hidden="true"><g ' + S + ">" + inner + "</g></svg>"; }
  var ICON = {
    letterbox: svg('<rect x="4" y="17" width="12" height="14" rx="2"/><rect x="18" y="17" width="12" height="14" rx="2" ' + F + '/><rect x="32" y="17" width="12" height="14" rx="2"/><path d="M8 38h32"/>'),
    crossbit: svg('<rect x="7" y="7" width="34" height="34" rx="2"/><path d="M18.3 7v34M29.6 7v34M7 18.3h34M7 29.6h34"/><rect x="29.6" y="7" width="11.4" height="11.3" ' + F + '/><rect x="7" y="29.6" width="11.3" height="11.4" ' + F + "/>"),
    hive: svg('<path d="M24 15l7 4v8l-7 4-7-4v-8z" ' + F + '/><path d="M24 3l7 4v8M17 15V7l7-4M31 27l7 4v8l-7 4-7-4M17 27l-7 4v8l7 4 7-4M38 31V23l-7-4M10 31v-8l7-4"/>'),
    scramble: svg('<path d="M8 16h22l-5-5M8 16l0 0"/><path d="M40 32H18l5 5"/><rect x="31" y="9" width="10" height="12" rx="2"/><rect x="7" y="27" width="10" height="12" rx="2"/>'),
    ladder: svg('<path d="M14 4v40M34 4v40M14 12h20M14 22h20M14 32h20"/>'),
    wordscape: svg('<path d="M6 6h22M6 14h14M6 22h10"/><circle cx="29" cy="27" r="9"/><path d="M36 34l7 7"/>'),
    trifecta: svg('<circle cx="24" cy="10" r="5"/><circle cx="10" cy="37" r="5"/><circle cx="38" cy="37" r="5"/><circle cx="24" cy="27" r="4" ' + F + '/><path d="M24 15v8M14 34l7-5M34 34l-7-5"/>'),
    fours: svg('<rect x="6" y="6" width="16" height="16" rx="3" ' + F + '/><rect x="26" y="6" width="16" height="16" rx="3"/><rect x="6" y="26" width="16" height="16" rx="3"/><rect x="26" y="26" width="16" height="16" rx="3" ' + F + "/>"),
    crowns: svg('<path d="M7 36l-2-22 11 9 8-14 8 14 11-9-2 22z" ' + F + '/><path d="M7 42h34"/>'),
    duo: svg('<circle cx="15" cy="24" r="6" ' + F + '/><path d="M15 9v3M15 36v3M4 24h3M23 24h3M7.2 16.2l2 2M20.8 29.8l2 2M7.2 31.8l2-2M20.8 18.2l2-2"/><path d="M42 30.5A10 10 0 1 1 33.5 16a8 8 0 0 0 8.5 14.5z"/>'),
    nine: svg('<rect x="5" y="5" width="38" height="38" rx="3"/><path d="M17.7 5v38M30.3 5v38M5 17.7h38M5 30.3h38"/><path d="M22 24.5a2.5 2.5 0 1 0 0-.1M26.5 22.5v4.5c0 2-1.5 3-3.5 3" stroke-width="2.2"/>'),
    pixel: '<svg viewBox="0 0 48 48" aria-hidden="true"><g fill="currentColor"><rect x="10" y="10" width="8" height="8"/><rect x="30" y="10" width="8" height="8"/><rect x="4" y="18" width="40" height="8"/><rect x="10" y="26" width="28" height="8"/><rect x="18" y="34" width="12" height="8"/></g></svg>',
    sweep: svg('<circle cx="22" cy="27" r="10" ' + F + '/><path d="M22 11v4M22 39v4M6 27h4M34 27h4M10.7 15.7l2.8 2.8M30.5 35.5l2.8 2.8M10.7 38.3l2.8-2.8"/><path d="M34 4v14M34 4l9 4-9 4"/>'),
    safecracker: svg('<rect x="5" y="7" width="38" height="32" rx="4"/><circle cx="24" cy="23" r="9"/><path d="M24 14v4M33 23h-4M24 32v-4M15 23h4"/><circle cx="24" cy="23" r="2" ' + F + '/><path d="M11 39v3M37 39v3"/>'),
    outlier: svg('<circle cx="11" cy="14" r="6"/><circle cx="37" cy="14" r="6"/><circle cx="11" cy="35" r="6"/><rect x="31" y="29" width="12" height="12" rx="1" ' + F + "/>"),
    target: svg('<circle cx="24" cy="24" r="19"/><circle cx="24" cy="24" r="11"/><circle cx="24" cy="24" r="4" ' + F + "/>"),
    sprint: svg('<circle cx="24" cy="27" r="16"/><path d="M19 5h10M24 5v6M24 27l7-7M37 11l3-3"/>'),
    hilo: svg('<path d="M15 40V9M6 18l9-9 9 9"/><path d="M33 8v31M24 30l9 9 9-9"/>'),
    quizfive: svg('<path d="M8 8h32a3 3 0 0 1 3 3v20a3 3 0 0 1-3 3H22l-9 8v-8H8a3 3 0 0 1-3-3V11a3 3 0 0 1 3-3z"/><path d="M19.5 16.5a4.5 4.5 0 1 1 6.3 4.1c-1.2.6-1.8 1.4-1.8 2.7"/><circle cx="24" cy="28.5" r="1" ' + F + "/>"),
    cinemoji: svg('<rect x="5" y="19" width="38" height="23" rx="2"/><path d="M5 19l35-11 2 7-35 11" ' + F + '/><path d="M14 15l4 7M24 12l4 7"/>'),
    encore: svg('<path d="M18 36V10l22-5v26"/><circle cx="12" cy="36" r="6" ' + F + '/><circle cx="34" cy="31" r="6" ' + F + "/>"),
    flagpole: svg('<path d="M10 44V4"/><path d="M10 6c8-4 14 4 22 0s8-1 8-1v19s-2 3-8 4c-8 2-14-6-22-2z" ' + F + "/>"),
    chrono: svg('<path d="M10 4h28M10 44h28M13 4c0 11 11 13 11 20S13 33 13 44M35 4c0 11-11 13-11 20s11 9 11 20"/><path d="M17 40c2-4 5-5 7-5s5 1 7 5z" ' + F + "/>")
  };

  /* id = storage key used by PD.record, f = page file name */
  var G = [
    { id: "letterbox", f: "word", n: "Letterbox", c: "words", col: "#f6c945", t: 4, d: "Five letters, six tries, one daily clue to tip you off." },
    { id: "crossbit", f: "mini", n: "Crossbit", c: "words", col: "#8fb4f2", t: 3, d: "A tiny five-by-five crossword. Race the clock." },
    { id: "hive", f: "hive", n: "Hive", c: "words", col: "#ffb703", t: 8, isNew: true, d: "Seven letters in a honeycomb. Make words, find the one that uses them all." },
    { id: "scramble", f: "scramble", n: "Scramble", c: "words", col: "#ff8fab", t: 3, isNew: true, d: "Five jumbled words, four letters up to eight. Unscramble them fast." },
    { id: "ladder", f: "ladder", n: "Ladder", c: "words", col: "#c39bd3", t: 3, d: "Change one letter at a time to climb from one word to another." },
    { id: "wordscape", f: "wordscape", n: "Wordscape", c: "words", col: "#84d2b5", t: 5, d: "Find the hidden words. Leftover letters answer the riddle." },
    { id: "trifecta", f: "trifecta", n: "Trifecta", c: "words", col: "#c5dc7c", t: 3, d: "Find the single word that links all three." },
    { id: "fours", f: "fours", n: "Fours", c: "logic", col: "#a7c957", t: 5, d: "Sixteen words, four hidden groups, plenty of red herrings." },
    { id: "crowns", f: "crowns", n: "Crowns", c: "logic", col: "#f4a259", t: 4, isNew: true, d: "One crown in every row, column and colour. None may touch." },
    { id: "duo", f: "duo", n: "Duo", c: "logic", col: "#ffd166", t: 3, isNew: true, d: "Fill the grid with suns and moons. Keep every line in balance." },
    { id: "nine", f: "nine", n: "Nine", c: "logic", col: "#90c2e7", t: 12, isNew: true, d: "Classic number place. Gentle on Monday, fiendish by Sunday." },
    { id: "pixel", f: "pixel", n: "Pixel", c: "logic", col: "#b5a8f0", t: 6, isNew: true, d: "Use the number clues to paint the grid and reveal the picture." },
    { id: "sweep", f: "sweep", n: "Sweep", c: "logic", col: "#9ad1d4", t: 4, isNew: true, d: "Clear the field without a single blind guess. Pure deduction." },
    { id: "outlier", f: "outlier", n: "Outlier", c: "logic", col: "#e9d66b", t: 2, d: "Three belong together. Spot the odd one out, five times." },
    { id: "target", f: "target", n: "Target", c: "numbers", col: "#f19c97", t: 3, d: "Hit the number using six others and four operations." },
    { id: "sprint", f: "sprint", n: "Sprint", c: "numbers", col: "#ff9f1c", t: 1, isNew: true, d: "Sixty seconds of mental maths. Everyone gets the same sums." },
    { id: "safecracker", f: "safecracker", n: "Safecracker", c: "numbers", col: "#d8b28c", t: 4, d: "Deduce the four-digit code from a handful of clues." },
    { id: "quizfive", f: "trivia", n: "Quizfive", c: "knowledge", col: "#f5b27f", t: 3, d: "Five questions climbing from easy to hard. One lifeline." },
    { id: "cinemoji", f: "cinemoji", n: "Cinemoji", c: "knowledge", col: "#f08a70", t: 2, d: "Name the movie from emoji and ever-clearer clues." },
    { id: "encore", f: "encore", n: "Encore", c: "knowledge", col: "#e9a6cb", t: 2, d: "Name the artist from five hints, cryptic to obvious." },
    { id: "flagpole", f: "flagpole", n: "Flagpole", c: "knowledge", col: "#86c5df", t: 2, d: "Name the country from its flag. Misses unlock hints." },
    { id: "chrono", f: "chrono", n: "Chrono", c: "knowledge", col: "#a8b2f0", t: 2, d: "Put five moments from history in the order they happened." },
    { id: "hilo", f: "hilo", n: "Hilo", c: "knowledge", col: "#f7c873", t: 2, d: "Higher or lower? Real numbers about real things." }
  ];
  G.forEach(function (g) { g.icon = ICON[g.id]; });
  var CATS = [
    ["words", "Words", "Spell it, solve it, link it."],
    ["logic", "Logic", "Grids, groups and pure deduction."],
    ["numbers", "Numbers", "Quick sums and codes to crack."],
    ["knowledge", "Knowledge", "What you know, and what you half-remember."]
  ];
  window.SD_GAMES = G;
  window.SD_CATS = CATS;
  window.SD_ICON = ICON;
  window.SD_BY_ID = {}; window.SD_BY_FILE = {};
  G.forEach(function (g) { SD_BY_ID[g.id] = g; SD_BY_FILE[g.f] = g; });
  /* the sundial mark */
  window.SD_LOGO = '<svg class="logo-mark" viewBox="0 0 40 40" aria-hidden="true"><circle cx="20" cy="22" r="17" fill="var(--sun)"/><path d="M3 22h34" stroke="var(--logo-ink)" stroke-width="2.6" stroke-linecap="round"/><path d="M20 22L11 9" stroke="var(--logo-ink)" stroke-width="2.6" stroke-linecap="round"/><path d="M20 22V10M20 22l9-12" stroke="var(--logo-ink)" stroke-width="1.4" stroke-linecap="round" opacity=".45"/><rect x="3" y="22" width="34" height="18" fill="var(--bg)"/></svg>';
})();
