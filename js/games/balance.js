const SUN = `<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="5" fill="#ff9f0a"/><g stroke="#ff9f0a" stroke-width="2.2" stroke-linecap="round"><path d="M12 2v2.4M12 19.6V22M2 12h2.4M19.6 12H22M4.9 4.9l1.7 1.7M17.4 17.4l1.7 1.7M4.9 19.1l1.7-1.7M17.4 6.6l1.7-1.7"/></g></svg>`;
const MOON = `<svg viewBox="0 0 24 24"><path d="M20.5 14.6A8.6 8.6 0 1 1 9.4 3.5a7 7 0 0 0 11.1 11.1z" fill="#5e5ce6"/></svg>`;
export default {
  buckets: ["<1m", "1-2m", "2-3m", "3-5m", "5m+"],
  help: `<p>Fill every square with a <b>sun</b> or a <b>moon</b>.</p>
  <ul><li>Each row and column has <b>three of each</b>.</li><li>No more than <b>two</b> of the same may sit side by side.</li><li><b>=</b> joins matching squares; <b>×</b> joins opposites.</li></ul>
  <p>Tap once for a sun, twice for a moon, three times to clear. One solution, no guessing.</p>`,
  mount(ctx) {
    const P = ctx.pick(DUO), GIV = [...P.g].map((c) => (c === "." ? -1 : +c)), SOL = [...P.s].map(Number);
    const st = ctx.state({ b: GIV.slice(), t: 0, h: [], hints: 0, done: false });
    ctx.el.innerHTML = `<div class="status-row"><span>Three suns, three moons, every line</span><span class="timer" id="tm"></span></div><div class="bal-board" id="b"></div>
      <div class="tools" id="tl"><button class="tool" id="un">${ctx.I.undo}Undo</button><button class="tool" id="cl">${ctx.I.trash}Clear</button><button class="tool" id="hn">${ctx.I.bulb}Hint</button></div>`;
    const B = ctx.el.querySelector("#b");
    B.innerHTML = GIV.map((v, i) => `<button class="bal-c${v >= 0 ? " fix" : ""}" data-i="${i}"></button>`).join("") +
      P.e.map(([a, c, eq]) => { const r = Math.floor(a / 6), k = a % 6, hz = c === a + 1; return `<span class="bal-sign" style="left:${((hz ? k + 1 : k + 0.5) / 6) * 100}%;top:${((hz ? r + 0.5 : r + 1) / 6) * 100}%">${eq ? "=" : "×"}</span>`; }).join("");
    const cells = [...B.querySelectorAll(".bal-c")];
    ctx.timer(ctx.el.querySelector("#tm"), () => !st.done);
    function errors() {
      const bad = new Set(), b = st.b;
      const line = (idx) => {
        for (let k = 0; k < 4; k++) if (b[idx[k]] >= 0 && b[idx[k]] === b[idx[k + 1]] && b[idx[k]] === b[idx[k + 2]]) [0, 1, 2].forEach((d) => bad.add(idx[k + d]));
        [0, 1].forEach((s) => { if (idx.filter((i) => b[i] === s).length > 3) idx.forEach((i) => b[i] === s && bad.add(i)); });
      };
      for (let r = 0; r < 6; r++) line([0, 1, 2, 3, 4, 5].map((c) => r * 6 + c));
      for (let c = 0; c < 6; c++) line([0, 1, 2, 3, 4, 5].map((r) => r * 6 + c));
      P.e.forEach(([a, c, eq]) => { if (b[a] >= 0 && b[c] >= 0 && (b[a] === b[c]) !== !!eq) { bad.add(a); bad.add(c); } });
      return bad;
    }
    function render() {
      const bad = errors();
      cells.forEach((c, i) => { c.innerHTML = st.b[i] === 0 ? SUN : st.b[i] === 1 ? MOON : ""; c.classList.toggle("err", bad.has(i)); c.setAttribute("aria-label", `Row ${Math.floor(i / 6) + 1} column ${(i % 6) + 1}: ${["empty", "sun", "moon"][st.b[i] + 1]}`); });
      B.classList.toggle("win", st.done); ctx.el.querySelector("#tl").hidden = st.done;
    }
    function check() {
      if (st.b.includes(-1) || errors().size) return;
      st.done = true; ctx.save(); render();
      const t = st.t, b = t < 60 ? "<1m" : t < 120 ? "1-2m" : t < 180 ? "2-3m" : t < 300 ? "3-5m" : "5m+";
      ctx.finish({ win: true, bucket: b, line: `Solved in ${ctx.mmss(t)}`, share: `☀️🌙 ${ctx.mmss(t)}${st.hints ? ` · 💡${st.hints}` : ""}` });
    }
    B.onclick = (e) => {
      const c = e.target.closest(".bal-c"); if (!c || st.done) return; const i = +c.dataset.i; if (GIV[i] >= 0) return;
      st.h.push([i, st.b[i]]); st.b[i] = st.b[i] === -1 ? 0 : st.b[i] === 0 ? 1 : -1; ctx.sound("tap"); ctx.save(); render(); check();
    };
    ctx.el.querySelector("#un").onclick = () => { const h = st.h.pop(); if (h) { st.b[h[0]] = h[1]; ctx.save(); render(); } };
    ctx.el.querySelector("#cl").onclick = () => { if (confirm("Clear the board?")) { st.b = GIV.slice(); st.h = []; ctx.save(); render(); } };
    ctx.el.querySelector("#hn").onclick = () => {
      const w = st.b.findIndex((v, i) => v >= 0 && v !== SOL[i]);
      if (w >= 0) { ctx.toast(`Row ${Math.floor(w / 6) + 1}, column ${(w % 6) + 1} is wrong`); cells[w].focus(); return; }
      const e = st.b.indexOf(-1); if (e < 0) return;
      st.h.push([e, -1]); st.b[e] = SOL[e]; st.hints++; st.t += 10; ctx.save(); render(); check();
    };
    render();
  }
};
