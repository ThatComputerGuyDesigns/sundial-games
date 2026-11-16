/* Daily Dose: game catalogue (single source of truth) */
const S = 'fill="none" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round"';
const g = (inner) => `<svg viewBox="0 0 24 24" ${S}>${inner}</svg>`;
const W = 'fill="#fff" stroke="none"';

export const GLYPHS = {
  five: g(`<rect x="2.5" y="8" width="5" height="6" rx="1.3"/><rect x="9.5" y="8" width="5" height="6" rx="1.3" ${W}/><rect x="16.5" y="8" width="5" height="6" rx="1.3"/><path d="M5 18h14"/>`),
  mini: g(`<rect x="3.5" y="3.5" width="17" height="17" rx="2.5"/><path d="M9.2 3.5v17M14.8 3.5v17M3.5 9.2h17M3.5 14.8h17"/><rect x="9.2" y="9.2" width="5.6" height="5.6" ${W}/>`),
  comb: g(`<path d="M12 3.2l3.6 2.1v4.2L12 11.6 8.4 9.5V5.3z" ${W}/><path d="M8.2 10.4l3.6 2.1v4.2l-3.6 2.1-3.6-2.1v-4.2zM15.8 10.4l3.6 2.1v4.2l-3.6 2.1-3.6-2.1v-4.2z"/>`),
  jumble: g(`<path d="M4 7h4.5c3 0 4.5 10 7.5 10H20M4 17h4.5c1.4 0 2.4-2.2 3.3-4.6M14.2 9.3C15 7.9 15.4 7 16 7h4M17.5 4.5L20 7l-2.5 2.5M17.5 14.5L20 17l-2.5 2.5"/>`),
  steps: g(`<path d="M7 3v18M17 3v18M7 7.5h10M7 12h10M7 16.5h10"/>`),
  groups: g(`<rect x="3.5" y="3.5" width="7.5" height="7.5" rx="2" ${W}/><rect x="13" y="3.5" width="7.5" height="7.5" rx="2"/><rect x="3.5" y="13" width="7.5" height="7.5" rx="2"/><rect x="13" y="13" width="7.5" height="7.5" rx="2" ${W}/>`),
  link: g(`<path d="M10 13.5a4 4 0 0 0 5.7.3l2.8-2.8a4 4 0 0 0-5.7-5.7L11.3 6.8"/><path d="M14 10.5a4 4 0 0 0-5.7-.3L5.5 13a4 4 0 0 0 5.7 5.7l1.5-1.5"/>`),
  search: g(`<circle cx="10.5" cy="10.5" r="6.5"/><path d="M15.5 15.5L21 21"/><path d="M8 10.5h5"/>`),
  crowns: g(`<path d="M4 17.5L3 7.5l5 4 4-6.5 4 6.5 5-4-1 10z" ${W}/><path d="M4.5 20.5h15"/>`),
  balance: g(`<circle cx="7.5" cy="12" r="3.2" ${W}/><path d="M7.5 4.5v1.3M7.5 18.2v1.3M2 12h1.3M11.7 12H13M3.6 8.1l.9.9M10.5 15l.9.9M3.6 15.9l.9-.9M10.5 9l.9-.9"/><path d="M21 14.5a5 5 0 1 1-4.8-7.8 4 4 0 0 0 4.8 7.8z"/>`),
  sudoku: g(`<rect x="3.5" y="3.5" width="17" height="17" rx="2.5"/><path d="M9.2 3.5v17M14.8 3.5v17M3.5 9.2h17M3.5 14.8h17"/><path d="M11 6.2l1-.7v2.6" stroke-width="1.3"/><path d="M16.6 11.4h1.6l-1 1.2a.8.8 0 1 1-.7 1.1" stroke-width="1.3"/>`),
  pixels: `<svg viewBox="0 0 24 24"><g fill="#fff"><rect x="5" y="5" width="4" height="4" rx=".6"/><rect x="15" y="5" width="4" height="4" rx=".6"/><rect x="3" y="10" width="18" height="4" rx=".6"/><rect x="5" y="14" width="14" height="3" rx=".6"/><rect x="9" y="17" width="6" height="3" rx=".6"/></g></svg>`,
  sweeper: g(`<circle cx="11" cy="13" r="5" ${W}/><path d="M11 5.5v1.8M11 18.7v1.8M3.5 13h1.8M16.7 13h1.8M5.7 7.7L7 9M15 17l1.3 1.3M5.7 18.3L7 17"/><path d="M17 3v6M17 3l4 1.8L17 6.6"/>`),
  code: g(`<rect x="3" y="4" width="18" height="15" rx="3"/><circle cx="12" cy="11.5" r="4"/><path d="M12 7.5v1.3M16 11.5h-1.3M12 15.5v-1.3M8 11.5h1.3"/><path d="M6.5 19v1.5M17.5 19v1.5"/>`),
  bullseye: g(`<circle cx="12" cy="12" r="8.5"/><circle cx="12" cy="12" r="4.8"/><circle cx="12" cy="12" r="1.6" ${W}/>`),
  quickfire: g(`<path d="M13 2.5L5 13.5h6l-1 8 8-11h-6z" ${W}/>`),
  quiz: g(`<path d="M5 4h14a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2h-7l-5 4v-4H5a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2z"/><path d="M9.8 8.4a2.3 2.3 0 1 1 3.2 2.1c-.6.3-1 .8-1 1.5"/><circle cx="12" cy="14.3" r=".4" ${W}/>`),
  flags: g(`<path d="M5 21V3.5"/><path d="M5 4.5c3-1.8 5.5 1.8 8.5 0s4.5-1 5.5-.5v8.5c-1-.5-2.5-1.3-5.5.5s-5.5-1.8-8.5 0z" ${W}/>`),
  timeline: g(`<path d="M3 12h18"/><circle cx="6" cy="12" r="2" ${W}/><circle cx="12" cy="12" r="2" ${W}/><circle cx="18" cy="12" r="2" ${W}/><path d="M6 9V6M12 15v3M18 9V6"/>`),
  movies: g(`<rect x="3" y="9" width="18" height="11" rx="2"/><path d="M3 9l16.4-4.8.7 2.5L3.7 11.5" ${W}/><path d="M8 7.5l2.6 2.3M13 6l2.6 2.3"/>`),
  artist: g(`<path d="M9 18V6l11-2.5V16"/><circle cx="6.5" cy="18" r="2.6" ${W}/><circle cx="17.5" cy="16" r="2.6" ${W}/>`),
  higher: g(`<path d="M8 20V5M3.5 9.5L8 5l4.5 4.5"/><path d="M16 4v15M11.5 14.5L16 19l4.5-4.5"/>`)
};

/* id: storage key + route; c1/c2: gradient; t: minutes; data: data files to load */
export const GAMES = [
  { id: "five", name: "Five", cat: "words", c1: "#34c759", c2: "#0a9f6e", t: 3, data: ["clues", "words"], blurb: "Guess the five-letter word in six tries, with a clue to start you off." },
  { id: "groups", name: "Groups", cat: "words", c1: "#ffb340", c2: "#ff6a3d", t: 5, data: ["fours"], blurb: "Sixteen words. Four hidden groups. Mind the red herrings." },
  { id: "mini", name: "Mini", cat: "words", c1: "#5ac8fa", c2: "#007aff", t: 3, data: ["cross"], blurb: "A five-by-five crossword you can finish before your coffee cools." },
  { id: "comb", name: "Comb", cat: "words", c1: "#ffcc00", c2: "#ff9500", t: 8, isNew: true, data: ["hive"], blurb: "Seven letters, one golden centre. How many words can you make?" },
  { id: "jumble", name: "Jumble", cat: "words", c1: "#ff7eb3", c2: "#ff2d55", t: 3, data: ["scramble"], blurb: "Five scrambled words, four letters to eight. Beat the clock." },
  { id: "steps", name: "Steps", cat: "words", c1: "#bf8bff", c2: "#8e44ec", t: 3, data: ["gen"], blurb: "Change one letter at a time to get from one word to another." },
  { id: "link", name: "Link", cat: "words", c1: "#64d2ff", c2: "#2f80ed", t: 2, data: ["trifecta"], blurb: "Find the one word that connects all three." },
  { id: "search", name: "Search", cat: "words", c1: "#30d5c8", c2: "#0e9f9a", t: 4, data: ["wordscape"], blurb: "Find the hidden words. The letters left over solve a riddle." },
  { id: "crowns", name: "Crowns", cat: "logic", c1: "#ffa94d", c2: "#f0663a", t: 4, isNew: true, data: ["crowns"], blurb: "One crown in every row, column and colour. None may touch." },
  { id: "sudoku", name: "Sudoku", cat: "logic", c1: "#7d7aff", c2: "#4b47e0", t: 12, isNew: true, data: ["nine"], blurb: "The classic, from a gentle Monday to a fiendish Sunday." },
  { id: "balance", name: "Balance", cat: "logic", c1: "#ffd23f", c2: "#5e8bff", t: 3, isNew: true, data: ["duo"], blurb: "Suns and moons. Three of each in every line, never three in a row." },
  { id: "pixels", name: "Pixels", cat: "logic", c1: "#ff6ec7", c2: "#a64dff", t: 6, isNew: true, data: ["pixel"], blurb: "Paint by numbers to reveal the hidden picture." },
  { id: "sweeper", name: "Sweeper", cat: "logic", c1: "#4cd964", c2: "#1b8a5a", t: 4, isNew: true, data: ["sweep"], blurb: "Clear the minefield. Every move can be deduced. No guessing, ever." },
  { id: "code", name: "Code", cat: "logic", c1: "#8e9aaf", c2: "#4a5568", t: 4, data: ["gen"], blurb: "Crack the combination using a handful of clues." },
  { id: "bullseye", name: "Bullseye", cat: "numbers", c1: "#ff6b6b", c2: "#e8364f", t: 3, data: ["gen"], blurb: "Combine six numbers to hit the target." },
  { id: "quickfire", name: "Quickfire", cat: "numbers", c1: "#ffd60a", c2: "#ff8a00", t: 1, isNew: true, data: [], blurb: "Sixty seconds of mental maths. Everyone gets the same sums." },
  { id: "higher", name: "Higher", cat: "numbers", c1: "#00c7be", c2: "#0071e3", t: 2, data: ["hilo"], blurb: "Higher or lower? Ten real-world numbers, one streak." },
  { id: "quiz", name: "Quiz", cat: "trivia", c1: "#5e5ce6", c2: "#bf5af2", t: 3, data: ["quiz"], blurb: "Five questions, easy to hard. One 50/50 lifeline." },
  { id: "flags", name: "Flags", cat: "trivia", c1: "#ff453a", c2: "#ff9f0a", t: 2, data: ["flags"], blurb: "Name the country from its flag. Each miss earns a hint." },
  { id: "timeline", name: "Timeline", cat: "trivia", c1: "#a2845e", c2: "#6e5233", t: 2, data: ["chrono"], blurb: "Put five moments in history in the right order." },
  { id: "movies", name: "Movies", cat: "trivia", c1: "#ff375f", c2: "#8b1e8f", t: 2, data: ["cinemoji"], blurb: "Name the film from a string of emoji." },
  { id: "artist", name: "Artist", cat: "trivia", c1: "#ff2d92", c2: "#ff6a3d", t: 2, data: ["encore"], blurb: "Name the musician from five clues, cryptic to obvious." }
];
GAMES.forEach((x) => (x.glyph = GLYPHS[x.id]));
export const BY_ID = Object.fromEntries(GAMES.map((x) => [x.id, x]));
export const CATS = [
  ["all", "All"],
  ["words", "Words"],
  ["logic", "Logic"],
  ["numbers", "Numbers"],
  ["trivia", "Trivia"]
];
export const icon = (game, cls = "") =>
  `<span class="app-icon ${cls}" style="--c1:${game.c1};--c2:${game.c2}" aria-hidden="true">${game.glyph}</span>`;
