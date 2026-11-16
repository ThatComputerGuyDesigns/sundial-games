export default {
  buckets: ["1", "2", "3", "4", "5", "6", "X"],
  help: `<p>Guess the hidden <b>five-letter word</b> in six tries. You get a clue to start, and the first letter after three guesses.</p>
  <p>After each guess the tiles change colour:</p>
  <ul><li><b style="color:var(--good)">Green</b>: right letter, right spot.</li><li><b style="color:var(--near)">Orange</b>: in the word, wrong spot.</li><li><b>Grey</b>: not in the word.</li></ul>`,
  mount(ctx) {
    const [ANS, CLUE] = CLUES[ctx.pick(LB.order)];
    const VALID = new Set(LB.valid.concat(CLUES.map((c) => c[0])));
    const st = ctx.state({ g: [], done: false });
    let cur = "", busy = false;
    ctx.el.innerHTML = `<div class="prompt-card"><small>Today's clue</small><div class="big">${ctx.esc(CLUE)}</div><div id="fl" class="muted" style="font-size:14px;margin-top:4px"></div></div>
      <div class="five-board" id="b">${Array.from({ length: 6 }, () => `<div class="five-row">${"<div class='tile'></div>".repeat(5)}</div>`).join("")}</div><div id="kb"></div>`;
    const rows = [...ctx.el.querySelectorAll(".five-row")];
    const kb = ctx.keyboard(ctx.el.querySelector("#kb"), onKey);
    const grid = () => st.g.map((g) => score(g).map((s) => ({ good: "🟩", near: "🟧", miss: "⬜" })[s]).join("")).join("\n");
    function score(g) {
      const res = Array(5).fill("miss"), a = ANS.split(""), used = Array(5).fill(false);
      for (let i = 0; i < 5; i++) if (g[i] === a[i]) { res[i] = "good"; used[i] = true; }
      for (let i = 0; i < 5; i++) if (res[i] !== "good") { const j = a.findIndex((c, k) => !used[k] && c === g[i]); if (j >= 0) { res[i] = "near"; used[j] = true; } }
      return res;
    }
    function paintRow(r, word, res, animate) {
      [...rows[r].children].forEach((t, i) => {
        t.textContent = word[i] || ""; t.className = "tile" + (word[i] && !res ? " typed" : "");
        if (res) { if (animate) { t.style.animationDelay = i * 0.12 + "s"; t.classList.add("flip"); setTimeout(() => t.classList.add("t-" + res[i]), i * 120 + 270); } else t.classList.add("t-" + res[i]); }
      });
    }
    function paintKb() {
      const m = {}, rank = { good: 3, near: 2, miss: 1 };
      st.g.forEach((g) => score(g).forEach((s, i) => { if (!m[g[i]] || rank[s] > rank[m[g[i]]]) m[g[i]] = s; }));
      kb.paint(m);
    }
    function hint() { ctx.el.querySelector("#fl").textContent = st.g.length >= 3 || st.done ? `Starts with “${ANS[0].toUpperCase()}”` : `First letter revealed after 3 guesses`; }
    st.g.forEach((g, i) => paintRow(i, g, score(g)));
    paintKb(); hint();
    if (st.done && !st.g.includes(ANS)) ctx.el.querySelector("#fl").textContent = `The word was ${ANS.toUpperCase()}`;
    function onKey(k) {
      if (st.done || busy) return;
      const r = st.g.length;
      if (k === "BACK") cur = cur.slice(0, -1);
      else if (k === "ENTER") return submit();
      else if (cur.length < 5) cur += k;
      paintRow(r, cur);
    }
    function submit() {
      const r = st.g.length;
      if (cur.length < 5) { ctx.toast("Not enough letters"); return ctx.shakeEl(rows[r]); }
      if (!VALID.has(cur)) { ctx.toast("Not in word list"); return ctx.shakeEl(rows[r]); }
      busy = true; st.g.push(cur); const word = cur; cur = "";
      paintRow(r, word, score(word), true); ctx.save();
      setTimeout(() => {
        busy = false; paintKb(); hint();
        if (word === ANS) {
          st.done = true; ctx.save(); rows[r].classList.add("win");
          ctx.toast(["Genius", "Magnificent", "Impressive", "Splendid", "Great", "Phew"][r]);
          ctx.finish({ win: true, bucket: String(r + 1), line: `${r + 1}/6`, share: grid() });
        } else if (st.g.length === 6) {
          st.done = true; ctx.save(); ctx.toast(ANS.toUpperCase(), 3000);
          ctx.el.querySelector("#fl").textContent = `The word was ${ANS.toUpperCase()}`;
          ctx.finish({ win: false, bucket: "X", line: "X/6", share: grid() });
        } else if (st.g.length === 3) ctx.toast(`Hint: starts with ${ANS[0].toUpperCase()}`);
      }, 900);
    }
  }
};
