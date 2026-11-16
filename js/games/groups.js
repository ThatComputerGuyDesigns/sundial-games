const EMO = ["", "🟨", "🟩", "🟦", "🟪"];
export default {
  buckets: ["0", "1", "2", "3", "X"],
  help: `<p>Sixteen words hide <b>four groups of four</b>. Select four that share something, then tap <b>Submit</b>.</p>
  <p>Groups run from <b style="color:#c9a000">straightforward</b> to <b style="color:#8e5bd8">devious</b>. Some words fit more than one group, but only one arrangement works.</p>
  <p>You can make <b>four mistakes</b>.</p>`,
  mount(ctx) {
    const P = ctx.pick(FOURS);
    const all = P.flatMap((g) => g.w);
    const st = ctx.state({ order: ctx.shuffle(all, ctx.rng("o")), solved: [], guesses: [], miss: 0, done: false });
    let sel = [];
    const groupOf = (w) => P.findIndex((g) => g.w.includes(w));
    ctx.el.innerHTML = `<div class="status-row"><span>Create four groups of four</span></div><div class="grp-grid" id="g"></div>
      <div class="status-row" style="justify-content:center;gap:10px;margin:18px 0 0"><span>Mistakes left</span><span class="dots" id="d"></span></div>
      <div class="actions" id="a"><button class="btn soft" id="sh">Shuffle</button><button class="btn soft" id="ds">Deselect</button><button class="btn ink" id="sb">Submit</button></div>`;
    const G = ctx.el.querySelector("#g");
    function render(anim) {
      let h = st.solved.map((i, k) => `<div class="grp-solved lv${P[i].l}" style="${anim === k ? "" : "animation:none"}"><b>${ctx.esc(P[i].t)}</b><span>${P[i].w.join(", ")}</span></div>`).join("");
      if (!st.done || st.solved.length === 4) h += st.order.filter((w) => !st.solved.includes(groupOf(w))).map((w) => `<button class="grp-tile${sel.includes(w) ? " sel" : ""}" data-w="${ctx.esc(w)}">${ctx.esc(w)}</button>`).join("");
      G.innerHTML = h;
      ctx.el.querySelector("#d").innerHTML = [0, 1, 2, 3].map((i) => `<i class="${i < 4 - st.miss ? "" : "off"}"></i>`).join("");
      ctx.el.querySelector("#sb").disabled = sel.length !== 4;
      ctx.el.querySelector("#ds").disabled = !sel.length;
      ctx.el.querySelector("#a").hidden = st.done;
    }
    G.onclick = (e) => {
      const b = e.target.closest(".grp-tile"); if (!b || st.done) return;
      const w = b.dataset.w;
      if (sel.includes(w)) sel = sel.filter((x) => x !== w); else if (sel.length < 4) sel.push(w);
      ctx.sound("tap"); render();
    };
    ctx.el.querySelector("#sh").onclick = () => { st.order = ctx.shuffle(st.order); ctx.save(); render(); };
    ctx.el.querySelector("#ds").onclick = () => { sel = []; render(); };
    ctx.el.querySelector("#sb").onclick = submit;
    const share = () => st.guesses.map((g) => g.map((w) => EMO[P[groupOf(w)].l]).join("")).join("\n");
    function submit() {
      if (sel.length !== 4) return;
      const key = sel.slice().sort().join("|");
      if (st.guesses.some((g) => g.slice().sort().join("|") === key)) return ctx.toast("Already guessed");
      st.guesses.push(sel.slice());
      const counts = {}; sel.forEach((w) => (counts[groupOf(w)] = (counts[groupOf(w)] || 0) + 1));
      const best = Math.max(...Object.values(counts));
      const tiles = [...G.querySelectorAll(".grp-tile.sel")];
      if (best === 4) {
        const gi = groupOf(sel[0]);
        tiles.forEach((t, i) => { t.style.animationDelay = i * 70 + "ms"; t.classList.add("lift"); });
        ctx.sound("good");
        setTimeout(() => {
          st.solved.push(gi); sel = [];
          if (st.solved.length === 4) { st.done = true; ctx.save(); render(3); ctx.finish({ win: true, bucket: String(st.miss), line: st.miss ? `${st.miss} mistake${st.miss > 1 ? "s" : ""}` : "Perfect", share: share() }); }
          else { ctx.save(); render(st.solved.length - 1); }
        }, 520);
      } else {
        st.miss++; tiles.forEach((t) => ctx.shakeEl(t));
        if (best === 3 && st.miss < 4) ctx.toast("One away…");
        setTimeout(() => {
          if (st.miss >= 4) {
            st.done = true; sel = [];
            const rest = [0, 1, 2, 3].filter((i) => !st.solved.includes(i)).sort((a, b) => P[a].l - P[b].l);
            st.solved.push(...rest); ctx.save(); render();
            ctx.finish({ win: false, bucket: "X", line: `${st.solved.length - rest.length}/4 groups`, share: share() });
          } else { ctx.save(); render(); }
        }, 480);
      }
    }
    render();
  }
};
