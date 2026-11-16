export default {
  buckets: ["1", "2", "3", "4", "5", "6", "X"],
  help: `<p>Work out the secret combination from the clues. Each clue shows a code and how close it is:</p>
  <ul><li><b>right place</b>: a correct digit in the correct position.</li><li><b>wrong place</b>: a correct digit in a different position.</li></ul>
  <p>Enter your guess on the keypad. Your own guesses get the same feedback. Every puzzle has exactly one answer.</p>`,
  mount(ctx) {
    const P = ctx.pick(SAFE), D = P.d, MAX = D === 4 ? 6 : 5;
    const st = ctx.state({ g: [], done: false });
    let cur = "";
    const fb = (g, c) => { let a = 0, b = 0; const gu = [], cu = []; for (let i = 0; i < D; i++) if (g[i] === c[i]) a++; else { gu.push(g[i]); cu.push(c[i]); } gu.forEach((x) => { const k = cu.indexOf(x); if (k >= 0) { b++; cu.splice(k, 1); } }); return [a, b]; };
    const fbText = (a, b) => !a && !b ? "Nothing is correct" : [a ? `${a} right place` : "", b ? `${b} wrong place` : ""].filter(Boolean).join(" · ");
    const digits = (s) => `<div class="digits">${[...s].map((c) => `<span>${c}</span>`).join("")}</div>`;
    ctx.el.innerHTML = `<div class="status-row"><span>${D} digits · ${P.x ? "all different" : "repeats allowed"}</span><span id="gl"></span></div><div class="code-clues" id="cl"></div>
      <div class="code-entry" id="en"></div><div class="numpad" id="np">${[1, 2, 3, 4, 5, 6, 7, 8, 9, 0].map((d) => `<button data-d="${d}">${d}</button>`).join("")}<button class="w2" data-d="B">Delete</button><button class="w2 go" data-d="E" style="grid-column:span 3">Try code</button></div>`;
    function render() {
      ctx.el.querySelector("#gl").textContent = st.done ? "" : `Guess ${st.g.length + 1} of ${MAX}`;
      ctx.el.querySelector("#cl").innerHTML = P.c.map(([s, a, b]) => `<div class="code-row">${digits(s)}<div class="fb">${fbText(a, b)}</div></div>`).join("") +
        st.g.map((g) => { const [a, b] = fb(g, P.a); return `<div class="code-row mine ${g === P.a ? "ok" : ""}">${digits(g)}<div class="fb">${g === P.a ? "<b>Unlocked</b>" : "Your guess · " + fbText(a, b)}</div></div>`; }).join("");
      ctx.el.querySelector("#en").innerHTML = st.done ? `<div class="answer-reveal">${st.g.includes(P.a) ? "🔓 " : "🔒 "}${P.a}</div>` : Array.from({ length: D }, (_, i) => `<span class="${i === cur.length ? "cur" : ""}">${cur[i] || ""}</span>`).join("");
      ctx.el.querySelector("#np").hidden = st.done;
    }
    function press(k) {
      if (st.done) return;
      if (k === "B") cur = cur.slice(0, -1);
      else if (k === "E") return submit();
      else if (cur.length < D) { cur += k; ctx.sound("tap"); }
      render();
    }
    function submit() {
      if (cur.length < D) return ctx.toast(`Enter ${D} digits`);
      if (P.x && new Set(cur).size < D) return ctx.toast("Digits must all be different");
      const broken = P.c.filter(([s, a, b]) => { const f = fb(cur, s); return f[0] !== a || f[1] !== b; }).length;
      st.g.push(cur); cur = "";
      const n = st.g.length;
      if (st.g[n - 1] === P.a) { st.done = true; ctx.save(); render(); ctx.finish({ win: true, bucket: String(n), line: `Cracked in ${n}`, share: "🔒".repeat(n - 1) + "🔓" }); return; }
      if (n >= MAX) { st.done = true; ctx.save(); render(); ctx.finish({ win: false, bucket: "X", line: "Still locked", share: "🔒".repeat(n) }); return; }
      ctx.toast(broken ? `That breaks ${broken} clue${broken > 1 ? "s" : ""}` : "Fits every clue, but not it"); ctx.sound("bad"); ctx.save(); render();
    }
    ctx.el.querySelector("#np").onclick = (e) => { const b = e.target.closest("[data-d]"); if (b) press(b.dataset.d); };
    ctx.key((e) => { if (/^[0-9]$/.test(e.key)) press(e.key); else if (e.key === "Backspace") press("B"); else if (e.key === "Enter") press("E"); });
    render();
  }
};
