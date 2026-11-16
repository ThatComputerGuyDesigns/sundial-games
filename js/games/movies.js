import { guessGame } from "./_guess.js";
export default {
  buckets: ["1", "2", "3", "4", "5", "X"],
  help: `<p>Name the film from the emoji. You have <b>five guesses</b>. Every miss unlocks a clue: genre and year, the plot, a star, then the first letter.</p><p>Start typing and pick from the suggestions.</p>`,
  mount(ctx) {
    const [em, title, year, genre, plot, star, alts] = ctx.pick(CINE);
    guessGame(ctx, {
      answer: title, accept: alts, max: 5, pool: CINE.map((c) => c[1]), emoji: em, placeholder: "Film title",
      top: `<div class="prompt-card" style="padding:28px 16px"><div class="mv-emoji">${em}</div></div>`,
      hints: [["Genre", `${genre} · ${year}`], ["Plot", plot], ["Credits", star], ["Title", `Starts with “${title[0]}” · ${title.split(" ").length} word${title.split(" ").length > 1 ? "s" : ""}`]]
    });
  }
};
