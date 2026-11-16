export default {
  buckets: ["1", "2", "3", "4", "X"],
  help: `<p>Put the five events in <b>chronological order</b>, earliest at the top. Drag them, or use the arrows.</p>
  <p>Tap <b>Check</b>. Events in the right spot lock in green. You have <b>four attempts</b>.</p>`,
  mount(ctx) {
    const EV = ctx.pick(CHRONO), MAX = 4;
    const sorted = EV.slice().sort((a, b) => a[1] - b[1]).map((e) => e[0]);
    const st = ctx.state({ order: ctx.shuffle(EV.map((e) => e[0]), ctx.rng("o")), tries: [], done: false });
    if (st.order.join() === sorted.join()) st.order.reverse();
    const yr = Object.fromEntries(EV.map((e) => [e[0], e[1]]));
    const fy = (y) => (y < 0 ? `${-y} BC` : y);
    const locked = () => (st.tries.length ? st.tries[st.tries.length - 1].map((v, i) => v && st.order[i]) : []);
    ctx.el.innerHTML = `<div class="status-row"><span>Earliest at the top</span><span id="tr"></span></div><div class="tl-axis"><span>↑ Earliest</span></div><div class="tl" id="l"></div><div class="tl-axis" style="margin-top:8px"><span>↓ Latest</span></div><div class="actions" id="ac"><button class="btn ink" id="ck">Check order</button></div>`;
    const L = ctx.el.querySelector("#l");
    function render() {
      const last = st.tries[st.tries.length - 1] || [];
      L.innerHTML = st.order.map((e, i) => {
        const ok = st.done ? e === sorted[i] : last[i] && locked()[i] === e;
        return `<div class="tl-item ${ok ? "ok" : st.done ? "no" : ""}" data-i="${i}"><svg class="grip" viewBox="0 0 24 24"><path d="M5 9h14M5 15h14"/></svg><div class="tx">${ctx.esc(e)}</div>${st.done || ok ? `<span class="yr">${fy(yr[e])}</span>` : `<div class="tl-mv"><button data-mv="-1" aria-label="Move up" ${i === 0 ? "disabled" : ""}>${ctx.I.up}</button><button data-mv="1" aria-label="Move down" ${i === 4 ? "disabled" : ""}>${ctx.I.down}</button></div>`}</div>`;
      }).join("");
      ctx.el.querySelector("#tr").textContent = st.done ? "" : `Attempt ${st.tries.length + 1} of ${MAX}`;
      ctx.el.querySelector("#ac").hidden = st.done;
    }
    const isLocked = (i) => { const l = locked(); return !!l[i] && l[i] === st.order[i]; };
    function move(i, d) { const j = i + d; if (j < 0 || j > 4 || isLocked(i) || isLocked(j)) return; [st.order[i], st.order[j]] = [st.order[j], st.order[i]]; ctx.sound("tap"); ctx.save(); render(); }
    L.addEventListener("click", (e) => { const b = e.target.closest("[data-mv]"); if (b) move(+b.closest(".tl-item").dataset.i, +b.dataset.mv); });
    let drag = null;
    ctx.on(L, "pointerdown", (e) => {
      const it = e.target.closest(".tl-item"); if (!it || e.target.closest("button") || st.done) return;
      const i = +it.dataset.i; if (isLocked(i)) return;
      drag = { i, y0: e.clientY, el: it, h: it.offsetHeight + 8 }; it.classList.add("drag"); try { L.setPointerCapture(e.pointerId); } catch {}
    });
    ctx.on(L, "pointermove", (e) => {
      if (!drag) return; const dy = e.clientY - drag.y0; drag.el.style.transform = `translateY(${dy}px) scale(1.03)`;
      const steps = Math.round(dy / drag.h), j = Math.max(0, Math.min(4, drag.i + steps));
      if (j !== drag.i && !isLocked(j)) { const [x] = st.order.splice(drag.i, 1); st.order.splice(j, 0, x); drag.y0 += (j - drag.i) * drag.h; drag.i = j; const y = e.clientY - drag.y0; render(); drag.el = L.children[j]; drag.el.classList.add("drag"); drag.el.style.transform = `translateY(${y}px) scale(1.03)`; }
    });
    const end = () => { if (!drag) return; drag = null; ctx.save(); render(); };
    ctx.on(L, "pointerup", end); ctx.on(L, "pointercancel", end);
    ctx.el.querySelector("#ck").onclick = () => {
      const res = st.order.map((e, i) => e === sorted[i]);
      st.tries.push(res);
      const share = st.tries.map((t) => t.map((v) => (v ? "🟩" : "⬜")).join("")).join("\n");
      if (res.every(Boolean)) { st.done = true; ctx.save(); render(); ctx.finish({ win: true, bucket: String(st.tries.length), line: `Ordered in ${st.tries.length}`, share }); return; }
      if (st.tries.length >= MAX) { st.order = sorted.slice(); st.done = true; ctx.save(); render(); ctx.finish({ win: false, bucket: "X", line: "Out of attempts", share }); return; }
      ctx.toast(`${res.filter(Boolean).length} of 5 in place`); ctx.sound("bad"); ctx.save(); render();
    };
    render();
  }
};
