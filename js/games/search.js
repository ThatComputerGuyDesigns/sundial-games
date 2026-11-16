export default {
  buckets: ["1", "2", "3", "X"],
  help: `<p>Find the hidden words by <b>dragging across letters</b> in a straight line (any direction, even diagonally or backwards).</p>
  <p>When every word is found, the <b>leftover letters</b> spell the answer to the riddle. You can guess the riddle early if you know it. Three guesses.</p>`,
  mount(ctx) {
    const P = ctx.pick(WS), G = P.g.join("");
    const st = ctx.state({ f: [], g: [], hints: 0, hint: -1, done: false });
    const DIRS = [[0, 1], [1, 0], [1, 1], [1, -1], [0, -1], [-1, 0], [-1, -1], [-1, 1]];
    const PLACE = {};
    P.w.forEach((w) => { for (let r = 0; r < 6; r++) for (let c = 0; c < 6; c++) for (const [dr, dc] of DIRS) { const cells = []; for (let k = 0; k < w.length; k++) { const rr = r + dr * k, cc = c + dc * k; if (rr < 0 || rr > 5 || cc < 0 || cc > 5 || P.g[rr][cc] !== w[k]) { cells.length = 0; break; } cells.push(rr * 6 + cc); } if (cells.length && !PLACE[w]) PLACE[w] = cells; } });
    const used = () => new Set(st.f.flatMap((w) => PLACE[w]));
    ctx.el.innerHTML = `<div class="prompt-card"><small>Riddle · ${ctx.esc(P.t)}</small><div class="big">${ctx.esc(P.q)}</div></div>
      <div class="ws-grid" id="g"></div><div class="ws-words" id="wl"></div><div class="ws-left" id="lf"></div>
      <form class="field" id="f" autocomplete="off"><input id="in" placeholder="Answer the riddle" aria-label="Riddle answer" autocapitalize="off" spellcheck="false"><button class="btn" type="submit">Solve</button></form>
      <div class="tools"><button class="tool" id="hn">${ctx.I.bulb}Hint</button></div>`;
    const grid = ctx.el.querySelector("#g");
    grid.innerHTML = [...G].map((ch, i) => `<div class="ws-c" data-i="${i}">${ch}</div>`).join("");
    const cells = [...grid.children];
    let drag = null, sel = [];
    function render() {
      const u = used(), allFound = st.f.length === P.w.length;
      cells.forEach((c, i) => { c.className = "ws-c" + (sel.includes(i) ? " sel" : u.has(i) ? " found" : allFound ? " left" : "") + (i === st.hint && !u.has(i) ? " hint" : ""); });
      ctx.el.querySelector("#wl").innerHTML = P.w.map((w) => `<span class="${st.f.includes(w) ? "got" : ""}">${st.f.includes(w) ? w : "•".repeat(w.length)}</span>`).join("");
      const left = [...G].filter((_, i) => !u.has(i)).join("");
      ctx.el.querySelector("#lf").innerHTML = allFound || st.done ? `Leftover letters<b>${st.done ? P.s : left}</b>` : `${P.w.length - st.f.length} words left · answer has ${P.s.length} letters${st.g.length ? ` · guesses: ${st.g.join(", ")}` : ""}`;
      ctx.el.querySelector("#f").hidden = st.done; ctx.el.querySelector(".tools").hidden = st.done || allFound;
    }
    const at = (x, y) => { const el = document.elementFromPoint(x, y); return el && el.closest && el.closest(".ws-c"); };
    function line(a, b) {
      const ar = Math.floor(a / 6), ac = a % 6, br = Math.floor(b / 6), bc = b % 6, dr = br - ar, dc = bc - ac;
      if (!(dr === 0 || dc === 0 || Math.abs(dr) === Math.abs(dc))) return sel;
      const n = Math.max(Math.abs(dr), Math.abs(dc)), sr = Math.sign(dr), sc = Math.sign(dc), out = [];
      for (let k = 0; k <= n; k++) out.push((ar + sr * k) * 6 + ac + sc * k);
      return out;
    }
    ctx.on(grid, "pointerdown", (e) => { const c = at(e.clientX, e.clientY); if (!c || st.done) return; e.preventDefault(); drag = +c.dataset.i; sel = [drag]; render(); });
    ctx.on(grid, "pointermove", (e) => { if (drag == null) return; const c = at(e.clientX, e.clientY); if (c) { sel = line(drag, +c.dataset.i); render(); } });
    const end = () => {
      if (drag == null) return; drag = null;
      const word = sel.map((i) => G[i]).join(""), rev = [...word].reverse().join("");
      const hit = P.w.find((w) => !st.f.includes(w) && (w === word || w === rev));
      if (hit && sel.length === hit.length) { st.f.push(hit); st.hint = -1; ctx.sound("good"); ctx.toast(hit.toUpperCase()); if (st.f.length === P.w.length) ctx.toast("All found! Read the leftover letters", 2200); ctx.save(); }
      sel = []; render();
    };
    ctx.on(window, "pointerup", end); ctx.on(window, "pointercancel", end);
    ctx.el.querySelector("#hn").onclick = () => { const w = P.w.find((x) => !st.f.includes(x)); if (!w) return; st.hint = PLACE[w][0]; st.hints++; ctx.save(); render(); ctx.toast("A word starts at the highlighted letter"); };
    ctx.el.querySelector("#f").onsubmit = (e) => {
      e.preventDefault(); if (st.done) return;
      const v = ctx.norm(ctx.el.querySelector("#in").value); if (!v) return;
      ctx.el.querySelector("#in").value = "";
      if (v === ctx.norm(P.s)) {
        st.done = true; st.f = P.w.slice(); ctx.save(); render();
        const n = st.g.length + 1;
        ctx.finish({ win: true, bucket: String(n), line: `Solved in ${n} guess${n > 1 ? "es" : ""}`, share: `🔎 ${"🟥".repeat(st.g.length)}🟩${st.hints ? ` · 💡${st.hints}` : ""}` });
      } else {
        st.g.push(v); ctx.shakeEl(ctx.el.querySelector("#f"));
        if (st.g.length >= 3) { st.done = true; ctx.save(); render(); ctx.toast(`It was ${P.s.toUpperCase()}`, 2500); ctx.finish({ win: false, bucket: "X", line: "Riddle unsolved", share: "🔎 🟥🟥🟥" }); }
        else { ctx.toast(`Not it. ${3 - st.g.length} left`); ctx.save(); render(); }
      }
    };
    render();
  }
};
