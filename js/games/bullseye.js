const SYM = { "+": "+", "-": "−", "*": "×", "/": "÷" };
export default {
  buckets: ["★★★", "★★", "★", "–"],
  help: `<p>Reach the <b>target</b> using the six numbers. Tap a number, an operation, then another number. The result replaces them and can be used again.</p>
  <p>Each number is used at most once. No fractions or negatives.</p>
  <p>Hit it exactly for <b>★★★</b>, within 5 for <b>★★</b>, within 10 for <b>★</b>. Tap <b>Lock in</b> when you're happy with your closest.</p>`,
  mount(ctx) {
    const P = ctx.pick(TARGET);
    const st = ctx.state({ h: [], done: false });
    let a = null, op = null;
    const calc = (x, y, o) => o === "+" ? x + y : o === "-" ? (x > y ? x - y : null) : o === "*" ? x * y : y && x % y === 0 ? x / y : null;
    function pool() {
      let p = P.n.map((v, k) => ({ v, k: "o" + k })), seen = P.n.slice();
      st.h.forEach((s) => { const x = p.find((q) => q.k === s.a), y = p.find((q) => q.k === s.b); const r = calc(x.v, y.v, s.op); p = p.filter((q) => q !== x && q !== y); p.push({ v: r, k: s.id, fresh: true }); seen.push(r); });
      return { p, seen };
    }
    const best = () => Math.min(...pool().seen.map((v) => Math.abs(v - P.t)));
    const stars = (d) => (d === 0 ? 3 : d <= 5 ? 2 : d <= 10 ? 1 : 0);
    ctx.el.innerHTML = `<div class="be-target"><small>Target</small><b>${P.t}</b><div class="be-best" id="bs"></div></div>
      <div class="be-nums" id="ns"></div><div class="be-ops" id="ops">${Object.keys(SYM).map((o) => `<button class="be-op" data-o="${o}" aria-label="${o}">${SYM[o]}</button>`).join("")}</div>
      <div class="actions"><button class="btn soft" id="un">Undo</button><button class="btn soft" id="rs">Reset</button><button class="btn ink" id="lk">Lock in</button></div><div class="be-log" id="lg"></div>`;
    const $ = (s) => ctx.el.querySelector(s);
    function render() {
      const { p } = pool(), d = best();
      $("#ns").innerHTML = p.map((q) => `<button class="be-n${a === q.k ? " sel" : ""}${q.v === P.t ? " hit" : ""}" data-k="${q.k}" ${st.done ? "disabled" : ""}>${q.v}</button>`).join("");
      $("#ops").querySelectorAll(".be-op").forEach((b) => b.classList.toggle("sel", b.dataset.o === op));
      $("#bs").textContent = d === 0 ? "Bullseye!" : `Closest so far: ${d} away`;
      $("#lg").innerHTML = st.h.map((s) => `<div>${s.x} ${SYM[s.op]} ${s.y} = <b style="color:var(--ink)">${s.r}</b></div>`).join("") + (st.done ? `<div style="margin-top:10px"><b style="color:var(--ink)">One way:</b> ${P.s.join(" · ")}</div>` : "");
      $("#ops").hidden = $(".actions").hidden = st.done;
      $("#un").disabled = !st.h.length;
    }
    $("#ns").onclick = (e) => {
      const b = e.target.closest(".be-n"); if (!b || st.done) return;
      const k = b.dataset.k;
      if (a && op && k !== a) {
        const { p } = pool(), x = p.find((q) => q.k === a), y = p.find((q) => q.k === k), r = calc(x.v, y.v, op);
        if (r == null) { ctx.toast(op === "-" ? "No negatives or zero" : "Must divide evenly"); ctx.sound("bad"); a = null; op = null; return render(); }
        st.h.push({ a, b: k, op, x: x.v, y: y.v, r, id: "n" + st.h.length }); a = null; op = null; ctx.sound("good"); ctx.save();
        if (r === P.t) return finish();
      } else { a = a === k ? null : k; op = null; ctx.sound("tap"); }
      render();
    };
    $("#ops").onclick = (e) => { const b = e.target.closest(".be-op"); if (b && a) { op = b.dataset.o; render(); } };
    $("#un").onclick = () => { st.h.pop(); a = op = null; ctx.save(); render(); };
    $("#rs").onclick = () => { st.h = []; a = op = null; ctx.save(); render(); };
    $("#lk").onclick = () => { if (best() > 0 && !confirm(`Lock in ${best()} away?`)) return; finish(); };
    function finish() {
      st.done = true; ctx.save(); render();
      const d = best(), s = stars(d);
      ctx.finish({ win: s > 0, bucket: s ? "★".repeat(s) : "–", line: d === 0 ? "Bullseye" : `${d} away`, share: `🎯 ${P.t} · ${s ? "⭐".repeat(s) : "missed"}`, confetti: s === 3 });
    }
    render();
  }
};
