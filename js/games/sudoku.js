const LEVEL = ["Gentle", "Easy", "Medium", "Tricky", "Hard", "Tough", "Fiendish"];
export default {
  buckets: ["<5m", "5-10m", "10-20m", "20-30m", "30m+"],
  help: `<p>Fill the grid so every <b>row</b>, <b>column</b> and <b>3×3 box</b> contains 1 to 9 exactly once.</p>
  <p>Tap a square, then a number. Use <b>Notes</b> to pencil in candidates. Clashing numbers turn red.</p>
  <p>Difficulty rises through the week, from <b>Gentle</b> on Monday to <b>Fiendish</b> on Sunday. Keyboard: arrows, 1–9, Backspace, N for notes.</p>`,
  mount(ctx) {
    const [ps, ss] = ctx.pick(NINE), P = [...ps].map(Number), S = [...ss].map(Number);
    const lvl = LEVEL[(ctx.num - 1) % 7];
    const st = ctx.state({ b: P.slice(), n: Array(81).fill(0), t: 0, h: [], hints: 0, done: false });
    let sel = P.indexOf(0), notes = false;
    ctx.el.innerHTML = `<div class="status-row"><span class="chip">${lvl}</span><span class="timer" id="tm"></span></div><div class="sd-board" id="b"></div>
      <div class="tools" id="tl"><button class="tool" id="un">${ctx.I.undo}Undo</button><button class="tool" id="er">${ctx.I.erase}Erase</button><button class="tool" id="nt" aria-pressed="false">${ctx.I.pencil}Notes</button><button class="tool" id="hn">${ctx.I.bulb}Hint</button></div>
      <div class="sd-pad" id="pad">${[1, 2, 3, 4, 5, 6, 7, 8, 9].map((d) => `<button data-d="${d}">${d}<small></small></button>`).join("")}</div>`;
    const B = ctx.el.querySelector("#b");
    B.innerHTML = P.map((v, i) => { const r = Math.floor(i / 9), c = i % 9; return `<button class="sd-c${v ? " giv" : ""}${c === 2 || c === 5 ? " br" : ""}${r === 2 || r === 5 ? " bb" : ""}" data-i="${i}"></button>`; }).join("");
    const cells = [...B.children];
    ctx.timer(ctx.el.querySelector("#tm"), () => !st.done);
    const peer = (a, b) => { const ra = Math.floor(a / 9), ca = a % 9, rb = Math.floor(b / 9), cb = b % 9; return ra === rb || ca === cb || (Math.floor(ra / 3) === Math.floor(rb / 3) && Math.floor(ca / 3) === Math.floor(cb / 3)); };
    function clashes() { const bad = new Set(); for (let i = 0; i < 81; i++) if (st.b[i]) for (let j = i + 1; j < 81; j++) if (st.b[j] === st.b[i] && peer(i, j)) { if (!P[i]) bad.add(i); if (!P[j]) bad.add(j); } return bad; }
    function render() {
      const bad = clashes(), sv = sel >= 0 ? st.b[sel] : 0, cnt = {};
      st.b.forEach((v) => v && (cnt[v] = (cnt[v] || 0) + 1));
      cells.forEach((c, i) => {
        const v = st.b[i];
        c.innerHTML = v ? v : st.n[i] ? `<span class="nt">${[1, 2, 3, 4, 5, 6, 7, 8, 9].map((k) => `<span>${st.n[i] >> k & 1 ? k : ""}</span>`).join("")}</span>` : "";
        c.classList.toggle("sel", i === sel && !st.done);
        c.classList.toggle("peer", !st.done && sel >= 0 && i !== sel && peer(i, sel));
        c.classList.toggle("same", !!sv && v === sv && i !== sel);
        c.classList.toggle("err", bad.has(i));
        c.setAttribute("aria-label", `Row ${Math.floor(i / 9) + 1} column ${(i % 9) + 1}: ${v || "empty"}`);
      });
      ctx.el.querySelectorAll("#pad button").forEach((b) => { const d = +b.dataset.d, left = 9 - (cnt[d] || 0); b.disabled = left <= 0 || st.done; b.querySelector("small").textContent = left > 0 ? left : ""; });
      ctx.el.querySelector("#nt").setAttribute("aria-pressed", notes);
      ctx.el.querySelector("#tl").hidden = ctx.el.querySelector("#pad").hidden = st.done;
      B.classList.toggle("win", st.done);
    }
    function put(d) {
      if (st.done || sel < 0 || P[sel]) return;
      st.h.push([sel, st.b[sel], st.n[sel]]);
      if (notes) { st.n[sel] ^= 1 << d; st.b[sel] = 0; }
      else { st.b[sel] = st.b[sel] === d ? 0 : d; if (st.b[sel]) for (let j = 0; j < 81; j++) if (peer(j, sel)) st.n[j] &= ~(1 << d); }
      ctx.sound("tap"); ctx.save(); render(); check();
    }
    function check() {
      if (!st.b.every((v, i) => v === S[i])) return;
      st.done = true; ctx.save(); render();
      const t = st.t, b = t < 300 ? "<5m" : t < 600 ? "5-10m" : t < 1200 ? "10-20m" : t < 1800 ? "20-30m" : "30m+";
      ctx.finish({ win: true, bucket: b, line: `${lvl} in ${ctx.mmss(t)}`, share: `🔢 ${lvl} · ${ctx.mmss(t)}${st.hints ? ` · 💡${st.hints}` : ""}` });
    }
    B.onclick = (e) => { const c = e.target.closest(".sd-c"); if (c) { sel = +c.dataset.i; render(); } };
    ctx.el.querySelector("#pad").onclick = (e) => { const b = e.target.closest("[data-d]"); if (b) put(+b.dataset.d); };
    ctx.el.querySelector("#un").onclick = () => { const h = st.h.pop(); if (h) { [sel, st.b[h[0]], st.n[h[0]]] = [h[0], h[1], h[2]]; ctx.save(); render(); } };
    ctx.el.querySelector("#er").onclick = () => { if (sel >= 0 && !P[sel]) { st.h.push([sel, st.b[sel], st.n[sel]]); st.b[sel] = 0; st.n[sel] = 0; ctx.save(); render(); } };
    ctx.el.querySelector("#nt").onclick = () => { notes = !notes; render(); };
    ctx.el.querySelector("#hn").onclick = () => {
      if (st.done) return;
      const wrong = st.b.findIndex((v, i) => v && v !== S[i]);
      if (wrong >= 0) { sel = wrong; render(); return ctx.toast("This square isn't right"); }
      const t = sel >= 0 && !st.b[sel] ? sel : st.b.indexOf(0);
      st.h.push([t, st.b[t], st.n[t]]); st.b[t] = S[t]; st.hints++; sel = t; ctx.save(); render(); check();
    };
    ctx.key((e) => {
      if (st.done) return;
      const m = { ArrowLeft: -1, ArrowRight: 1, ArrowUp: -9, ArrowDown: 9 }[e.key];
      if (m) { e.preventDefault(); const j = (sel < 0 ? 0 : sel) + m; if (j >= 0 && j < 81 && !(m === 1 && j % 9 === 0) && !(m === -1 && sel % 9 === 0)) { sel = j; render(); } }
      else if (/^[1-9]$/.test(e.key)) put(+e.key);
      else if (e.key === "Backspace" || e.key === "Delete" || e.key === "0") ctx.el.querySelector("#er").click();
      else if (e.key.toLowerCase() === "n") { notes = !notes; render(); }
    });
    render();
  }
};
