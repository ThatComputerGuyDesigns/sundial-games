export default {
  buckets: ["<2m", "2-4m", "4-7m", "7-12m", "12m+"],
  help: `<p>Paint squares to reveal a hidden picture. The numbers by each <b>row</b> and above each <b>column</b> are the lengths of its painted runs, in order.</p>
  <p><b>3 1</b> means three painted squares, a gap of at least one, then one more.</p>
  <p>Switch to <b>Cross</b> to mark squares you know are blank. Drag to paint several at once. Every picture can be solved by logic.</p>`,
  mount(ctx) {
    const P = ctx.pick(PIXEL), N = P.n, SOL = [...P.g].map(Number);
    const st = ctx.state({ b: Array(N * N).fill(0), t: 0, h: [], done: false });
    let mode = 1;
    const runs = (a) => { const o = []; let r = 0; a.forEach((v) => { if (v === 1) r++; else if (r) { o.push(r); r = 0; } }); if (r) o.push(r); return o.length ? o : [0]; };
    const row = (a, r) => a.slice(r * N, r * N + N), col = (a, c) => Array.from({ length: N }, (_, r) => a[r * N + c]);
    const RC = [...Array(N).keys()].map((r) => runs(row(SOL, r))), CC = [...Array(N).keys()].map((c) => runs(col(SOL, c)));
    const lab = Math.max(1.8, Math.max(...RC.map((x) => x.length)) * 1.1);
    const XS = `<svg viewBox="0 0 10 10"><path d="M2 2l6 6M8 2L2 8" fill="none" stroke-linecap="round"/></svg>`;
    ctx.el.innerHTML = `<div class="status-row"><div class="seg" role="group" aria-label="Tool"><button data-m="1" aria-pressed="true">Paint</button><button data-m="2" aria-pressed="false">Cross</button></div><span class="timer" id="tm"></span></div>
      <div class="px" id="px" style="grid-template-columns:${lab}fr ${N}fr;--pc:${P.c}"><div></div>
      <div style="display:grid;grid-template-columns:repeat(${N},1fr)">${CC.map((c, k) => `<div class="px-cc" id="cc${k}">${c.map((x) => `<span>${x}</span>`).join("")}</div>`).join("")}</div>
      <div style="display:grid;grid-template-rows:repeat(${N},1fr)">${RC.map((c, k) => `<div class="px-rc" id="rc${k}">${c.map((x) => `<span>${x}</span>`).join("")}</div>`).join("")}</div>
      <div class="px-grid" id="g" style="grid-template-columns:repeat(${N},1fr)">${SOL.map((_, i) => { const r = Math.floor(i / N), c = i % N; return `<button class="px-c${c % 5 === 4 && c < N - 1 ? " r5" : ""}${r % 5 === 4 && r < N - 1 ? " b5" : ""}" data-i="${i}" aria-label="Row ${r + 1} column ${c + 1}"></button>`; }).join("")}</div></div>
      <div class="tools" id="tl"><button class="tool" id="un">${ctx.I.undo}Undo</button><button class="tool" id="cl">${ctx.I.trash}Clear</button><button class="tool" id="ck">${ctx.I.eye}Check</button></div>`;
    const Gd = ctx.el.querySelector("#g"), cells = [...Gd.children];
    ctx.timer(ctx.el.querySelector("#tm"), () => !st.done);
    const same = (a, b) => a.length === b.length && a.every((x, i) => x === b[i]);
    function render() {
      cells.forEach((c, i) => { c.classList.toggle("on", st.b[i] === 1); c.classList.toggle("x", st.b[i] === 2); c.innerHTML = st.b[i] === 2 ? XS : ""; });
      for (let k = 0; k < N; k++) { ctx.el.querySelector("#rc" + k).classList.toggle("ok", same(runs(row(st.b, k)), RC[k])); ctx.el.querySelector("#cc" + k).classList.toggle("ok", same(runs(col(st.b, k)), CC[k])); }
      ctx.el.querySelectorAll("[data-m]").forEach((b) => b.setAttribute("aria-pressed", +b.dataset.m === mode));
      ctx.el.querySelector("#px").classList.toggle("win", st.done);
      ctx.el.querySelector("#tl").hidden = st.done; ctx.el.querySelector(".seg").hidden = st.done;
    }
    function check() {
      if (!SOL.every((v, i) => (st.b[i] === 1) === (v === 1))) return;
      st.done = true; st.b = st.b.map((v) => (v === 1 ? 1 : 0)); ctx.save(); render();
      const t = st.t, b = t < 120 ? "<2m" : t < 240 ? "2-4m" : t < 420 ? "4-7m" : t < 720 ? "7-12m" : "12m+";
      ctx.finish({ win: true, bucket: b, line: `${N}×${N} in ${ctx.mmss(t)}`, share: `🎨 ${N}×${N} · ${ctx.mmss(t)}`, delay: 1500 });
    }
    let drag = null;
    const apply = (i) => { if (st.b[i] === drag.v || (drag.v && st.b[i] && st.b[i] !== drag.v)) return; drag.batch.push([i, st.b[i]]); st.b[i] = drag.v; render(); };
    ctx.on(Gd, "pointerdown", (e) => { const c = e.target.closest(".px-c"); if (!c || st.done) return; e.preventDefault(); const i = +c.dataset.i; drag = { v: st.b[i] === mode ? 0 : mode, batch: [] }; apply(i); try { Gd.setPointerCapture(e.pointerId); } catch {} });
    ctx.on(Gd, "pointermove", (e) => { if (!drag) return; const c = document.elementFromPoint(e.clientX, e.clientY)?.closest?.(".px-c"); if (c) apply(+c.dataset.i); });
    const end = () => { if (!drag) return; if (drag.batch.length) { st.h.push(drag.batch); ctx.sound("tap"); } drag = null; ctx.save(); check(); };
    ctx.on(Gd, "pointerup", end); ctx.on(Gd, "pointercancel", end);
    ctx.on(Gd, "keydown", (e) => {
      const c = e.target.closest(".px-c"); if (!c) return; const i = +c.dataset.i;
      const m = { ArrowLeft: -1, ArrowRight: 1, ArrowUp: -N, ArrowDown: N }[e.key];
      if (m) { e.preventDefault(); cells[Math.min(N * N - 1, Math.max(0, i + m))].focus(); }
      if ((e.key === "Enter" || e.key === " " || e.key === "x") && !st.done) { e.preventDefault(); const v = e.key === "x" ? 2 : mode; st.h.push([[i, st.b[i]]]); st.b[i] = st.b[i] === v ? 0 : v; ctx.save(); render(); check(); }
    });
    ctx.el.querySelectorAll("[data-m]").forEach((b) => (b.onclick = () => { mode = +b.dataset.m; render(); }));
    ctx.el.querySelector("#un").onclick = () => { const h = st.h.pop(); if (h) { h.slice().reverse().forEach(([i, v]) => (st.b[i] = v)); ctx.save(); render(); } };
    ctx.el.querySelector("#cl").onclick = () => { if (confirm("Clear the grid?")) { st.b.fill(0); st.h = []; ctx.save(); render(); } };
    ctx.el.querySelector("#ck").onclick = () => { const w = st.b.filter((v, i) => v === 1 && SOL[i] !== 1).length; st.t += 5; ctx.toast(w ? `${w} square${w > 1 ? "s are" : " is"} wrong` : "No mistakes so far"); };
    render();
  }
};
