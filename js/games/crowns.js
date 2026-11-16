const COLS = ["#ffb4a2", "#b5e3a1", "#a8d1ff", "#ffe08a", "#d7b8ff", "#ffc2dd", "#9fe6dc", "#ffd0a6", "#c9d1dc", "#e6f59a"];
const CROWN = `<svg class="crown" viewBox="0 0 24 24"><path d="M4 17.5L3 7.5l5 4 4-6.5 4 6.5 5-4-1 10z" fill="#1d1d1f"/><rect x="4" y="19" width="16" height="2.2" rx="1.1" fill="#1d1d1f"/></svg>`;
const X = `<svg class="x" viewBox="0 0 10 10"><path d="M2 2l6 6M8 2L2 8" stroke="#1d1d1f" stroke-width="1.6" stroke-linecap="round"/></svg>`;
export default {
  buckets: ["<1m", "1-2m", "2-4m", "4-8m", "8m+"],
  help: `<p>Place one <b>crown</b> in every row, every column and every coloured region.</p>
  <p>Crowns can't <b>touch</b>, not even diagonally.</p>
  <p>Tap once for an <b>×</b> (a note that no crown goes there), twice for a crown. Drag across squares to mark several × at once. Boards grow from 6×6 on Monday to 9×9 at the weekend.</p>`,
  mount(ctx) {
    const [regStr, sol] = ctx.pick(CROWNS), N = sol.length, REG = [...regStr].map((c) => c.charCodeAt(0) - 97);
    const st = ctx.state({ b: Array(N * N).fill(0), t: 0, done: false, h: [], hints: 0 });
    ctx.el.innerHTML = `<div class="status-row"><span>${N}×${N} · one crown per row, column &amp; colour</span><span class="timer" id="tm"></span></div><div class="cr-board" id="b" style="grid-template-columns:repeat(${N},1fr);grid-template-rows:repeat(${N},1fr)"></div>
      <div class="tools" id="tl"><button class="tool" id="un">${ctx.I.undo}Undo</button><button class="tool" id="cl">${ctx.I.trash}Clear</button><button class="tool" id="hn">${ctx.I.bulb}Hint</button></div>`;
    const B = ctx.el.querySelector("#b");
    B.innerHTML = REG.map((r, i) => { const c = i % N, row = Math.floor(i / N); return `<button class="cr-c${c < N - 1 && REG[i + 1] !== r ? " bR" : ""}${row < N - 1 && REG[i + N] !== r ? " bB" : ""}" data-i="${i}" style="background:${COLS[r % COLS.length]}"></button>`; }).join("");
    const cells = [...B.children];
    ctx.timer(ctx.el.querySelector("#tm"), () => !st.done);
    function conflicts() {
      const q = st.b.flatMap((v, i) => (v === 2 ? [i] : [])), bad = new Set();
      for (let a = 0; a < q.length; a++) for (let b = a + 1; b < q.length; b++) {
        const i = q[a], j = q[b], ri = Math.floor(i / N), ci = i % N, rj = Math.floor(j / N), cj = j % N;
        if (ri === rj || ci === cj || REG[i] === REG[j] || (Math.abs(ri - rj) <= 1 && Math.abs(ci - cj) <= 1)) { bad.add(i); bad.add(j); }
      }
      return bad;
    }
    function render() {
      const bad = conflicts();
      cells.forEach((c, i) => { c.innerHTML = st.b[i] === 2 ? CROWN : st.b[i] === 1 ? X : ""; c.classList.toggle("err", bad.has(i)); c.setAttribute("aria-label", `Row ${Math.floor(i / N) + 1} column ${(i % N) + 1}: ${["empty", "marked", "crown"][st.b[i]]}`); });
      B.classList.toggle("win", st.done); ctx.el.querySelector("#tl").hidden = st.done;
    }
    const set = (i, v) => { if (st.b[i] !== v) { st.h.push([i, st.b[i]]); st.b[i] = v; } };
    function check() {
      if (st.b.filter((v) => v === 2).length !== N || conflicts().size) return;
      st.done = true; ctx.save(); render();
      const t = st.t, b = t < 60 ? "<1m" : t < 120 ? "1-2m" : t < 240 ? "2-4m" : t < 480 ? "4-8m" : "8m+";
      ctx.finish({ win: true, bucket: b, line: `Solved in ${ctx.mmss(t)}`, share: `👑 ${N}×${N} · ${ctx.mmss(t)}${st.hints ? ` · 💡${st.hints}` : ""}` });
    }
    let drag = null;
    ctx.on(B, "pointerdown", (e) => { const c = e.target.closest(".cr-c"); if (!c || st.done) return; drag = { s: +c.dataset.i, moved: false }; try { B.setPointerCapture(e.pointerId); } catch {} });
    ctx.on(B, "pointermove", (e) => {
      if (!drag) return; const el = document.elementFromPoint(e.clientX, e.clientY)?.closest?.(".cr-c"); if (!el) return;
      const i = +el.dataset.i;
      if (i !== drag.s || drag.moved) { if (!drag.moved) { drag.moved = true; if (!st.b[drag.s]) set(drag.s, 1); } if (!st.b[i]) { set(i, 1); render(); } }
    });
    ctx.on(B, "pointerup", () => { if (!drag) return; if (!drag.moved) { const i = drag.s; set(i, (st.b[i] + 1) % 3); ctx.sound("tap"); } drag = null; ctx.save(); render(); check(); });
    ctx.on(B, "keydown", (e) => {
      const c = e.target.closest(".cr-c"); if (!c) return; const i = +c.dataset.i;
      const m = { ArrowLeft: -1, ArrowRight: 1, ArrowUp: -N, ArrowDown: N }[e.key];
      if (m) { e.preventDefault(); cells[Math.min(N * N - 1, Math.max(0, i + m))].focus(); }
      if ((e.key === "Enter" || e.key === " ") && !st.done) { e.preventDefault(); set(i, (st.b[i] + 1) % 3); ctx.save(); render(); check(); }
    });
    ctx.el.querySelector("#un").onclick = () => { const h = st.h.pop(); if (h) { st.b[h[0]] = h[1]; ctx.save(); render(); } };
    ctx.el.querySelector("#cl").onclick = () => { if (confirm("Clear the board?")) { st.b.fill(0); st.h = []; ctx.save(); render(); } };
    ctx.el.querySelector("#hn").onclick = () => {
      const bad = [...conflicts()].find((i) => +sol[Math.floor(i / N)] !== i % N);
      if (bad != null) { set(bad, 0); ctx.toast("Removed a misplaced crown"); }
      else { for (let r = 0; r < N; r++) { const i = r * N + +sol[r]; if (st.b[i] !== 2) { set(i, 2); ctx.toast("Placed a crown for you (+15s)"); break; } } }
      st.hints++; st.t += 15; ctx.save(); render(); check();
    };
    render();
  }
};
