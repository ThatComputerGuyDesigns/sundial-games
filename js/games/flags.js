import { guessGame } from "./_guess.js";
const emo = (cc) => [...cc.toUpperCase()].map((c) => String.fromCodePoint(127397 + c.charCodeAt(0))).join("");
export default {
  buckets: ["1", "2", "3", "4", "5", "6", "X"],
  help: `<p>Name the country from its flag. You have <b>six guesses</b>, and every miss unlocks a new hint: continent, first letter, capital and more.</p><p>Start typing and pick from the suggestions.</p>`,
  mount(ctx) {
    const [cc, name, cont, cap, h1, h2] = ctx.pick(FLAGS);
    guessGame(ctx, {
      answer: name, max: 6, pool: FLAGS.map((f) => f[1]), emoji: "🏳️", placeholder: "Country name",
      top: `<div class="flag-card"><img src="https://flagcdn.com/w640/${cc.toLowerCase()}.png" alt="Today's flag" onerror="this.outerHTML='<div class=&quot;emoji&quot;>${emo(cc)}</div>'"></div>`,
      hints: [["Continent", cont], ["Starts with", `${name[0]} · ${name.replace(/[^A-Za-z]/g, "").length} letters`], ["Capital", cap], ["Clue", h1], ["Clue", h2]]
    });
  }
};
