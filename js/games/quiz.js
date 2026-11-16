const PTS = [100, 200, 300, 400, 500];
export default {
  buckets: ["5", "4", "3", "2", "1", "0"],
  help: `<p>Five questions that climb in difficulty and value, from 100 to 500 points.</p>
  <p>You have one <b>50/50</b> lifeline that removes two wrong answers, but halves that question's points.</p>`,
  mount(ctx) {
    const Q = ctx.pick(QZ);
    const st = ctx.state({ i: 0, a: [], life: -1, done: false });
    const opts = Q.map((q, k) => ctx.shuffle([q[2], q[3], q[4], q[5]], ctx.rng("q" + k)));
    const right = (k) => st.a[k] === Q[k][2];
    const points = () => Q.reduce((s, _, k) => s + (right(k) ? (st.life === k ? PTS[k] / 2 : PTS[k]) : 0), 0);
    const correct = () => Q.filter((_, k) => right(k)).length;
    function render(showAns) {
      const k = Math.min(st.i, 4), q = Q[k];
      const steps = Q.map((_, j) => `<i class="${j < st.i || (st.done && j <= 4) ? (right(j) ? "ok" : "no") : j === st.i ? "cur" : ""}"></i>`).join("");
      if (st.done && !showAns) {
        ctx.el.innerHTML = `<div class="qz-steps">${steps}</div><div class="finish-card" style="margin-top:0"><h3>${points()} points</h3><p>${correct()} of 5 correct</p></div>
          <div class="list" style="width:100%;margin-top:14px">${Q.map((x, j) => `<div class="list-row"><div class="nm">${ctx.esc(x[1])}<small>${ctx.esc(x[2])}${right(j) ? "" : ` · you said ${ctx.esc(st.a[j])}`}</small></div><span style="color:${right(j) ? "var(--good-strong)" : "var(--bad)"};font-weight:700">${right(j) ? "✓" : "✗"}</span></div>`).join("")}</div>`;
        return;
      }
      const removed = st.life === k ? opts[k].filter((o) => o !== q[2]).slice(0, 2) : [];
      ctx.el.innerHTML = `<div class="qz-steps">${steps}</div><div class="qz-card"><div class="qz-cat">${ctx.esc(q[0])}<span>${st.life === k ? PTS[k] / 2 : PTS[k]} pts</span></div><div class="qz-q">${ctx.esc(q[1])}</div>
        <div class="qz-opts">${opts[k].map((o) => { let c = ""; if (showAns) { if (o === q[2]) c = "right"; else if (o === st.a[k]) c = "wrong"; } else if (removed.includes(o)) c = "gone"; return `<button class="qz-opt ${c}" data-o="${ctx.esc(o)}" ${showAns || removed.includes(o) ? "disabled" : ""}>${ctx.esc(o)}${c === "right" ? ctx.I.check : c === "wrong" ? ctx.I.close : ""}</button>`; }).join("")}</div></div>
        <div class="actions">${showAns ? `<button class="btn" id="nx">${st.i >= 5 ? "See score" : "Next question"}</button>` : st.life < 0 ? `<button class="btn soft" id="ff">50/50 lifeline</button>` : ""}</div>`;
      ctx.el.querySelectorAll(".qz-opt:not(:disabled)").forEach((b) => (b.onclick = () => answer(b.dataset.o)));
      ctx.el.querySelector("#ff")?.addEventListener("click", () => { st.life = st.i; ctx.save(); render(); });
      ctx.el.querySelector("#nx")?.addEventListener("click", () => render());
    }
    function answer(o) {
      const k = st.i; st.a[k] = o; st.i++; ctx.sound(o === Q[k][2] ? "good" : "bad");
      if (st.i >= 5) { st.done = true; ctx.save(); render(true); const n = correct(); ctx.finish({ win: n >= 3, bucket: String(n), line: `${points()} pts · ${n}/5`, share: Q.map((_, j) => (right(j) ? "🟩" : "🟥")).join("") + (st.life >= 0 ? " ½" : ""), delay: 1600 }); return; }
      ctx.save(); render(true);
    }
    render();
  }
};
