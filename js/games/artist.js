import { guessGame } from "./_guess.js";
export default {
  buckets: ["1", "2", "3", "4", "5", "X"],
  help: `<p>Name the musician or band. The first clue is cryptic; each miss unlocks a clearer one. <b>Five guesses</b>.</p><p>Start typing and pick from the suggestions.</p>`,
  mount(ctx) {
    const [name, accept, hints] = ctx.pick(ENCORE);
    guessGame(ctx, {
      answer: name, accept, max: 5, freeHints: 1, pool: ENCORE.map((e) => e[0]), emoji: "🎵", placeholder: "Artist or band",
      top: ``, hints: hints.map((h, i) => [`Clue ${i + 1}`, h])
    });
  }
};
