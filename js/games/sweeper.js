const FLAG = `<svg viewBox="0 0 24 24"><path d="M6 21V3.5" stroke="#fff" stroke-width="2.2" stroke-linecap="round"/><path d="M6.5 4h11l-2.8 3.8L17.5 11.5h-11z" fill="#fff"/></svg>`;
const MINE = `<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="5.5" fill="currentColor"/><path d="M12 3v3.5M12 17.5V21M3 12h3.5M17.5 12H21M5.6 5.6l2.5 2.5M15.9 15.9l2.5 2.5M5.6 18.4l2.5-2.5M15.9 8.1l2.5-2.5" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>`;
export default {
  buckets: ["<1m", "1-2m", "2-4m", "4m+", "X"],
  help: `<p>Uncover every safe square. Each number shows how many mines touch that square, diagonals included.</p>
  <p>The board opens from the outlined start. From there <b>every move can be deduced</b>. No coin flips.</p>
  <p>Switch to <b>Flag</b> mode, long-press, or right-click to flag a mine. Tap a number whose mines are all flagged to clear around it. You have <b>three lives</b>.</p>`,
  mount(ctx) {
    const P = ctx.pick(SWEEP), W = P.w, H = P.h, M = new Set(P.m);
    const nb = (i) => { const r = Math.floor(i / W), c = i % W, o = []; for (let a = -1; a <= 1; a++) for (let b = -1; b <= 1; b++) if ((a || b) && r + a >= 0 && r + a < H && c + b >= 0 && c + b < W) o.push((r + a) * W + c + b); return o; };
    const NUM = Array.from({ length: W * H }, (_, i) => nb(i).filter((j) => M.has(j)).length);
    const st = ctx.state({ o: [], f: [], boom: [], lives: 3, t: 0, done: false });
    let flagMode = false;
    const O = new Set(st.o), F = new Set(st.f);
    const flood = (i) => { const s = [i]; while (s.length) { const x = s.pop(); if (O.has(x) || F.has(x)) continue; O.add(x); if (!NUM[x]) nb(x).forEach((j) => !O.has(j) && s.push(j)); } };
    if (!O.size) flood(P.s);
    ctx.el.innerHTML = `<div class="status-row"><span id="lv"></span><span id="mc"></span><span class="timer" id="tm"></span></div>
      <div class="sw-board" id="b" style="grid-template-columns:repeat(${W},1fr)">${Array.from({ length: W * H }, (_, i) => `<button class="sw-c" data-i="${i}"></button>`).join("")}</div>
      <div class="seg" style="margin-top:18px" id="md"><button data-f="0" aria-pressed="true">Dig</button><button data-f="1" aria-pressed="false">Flag</button></div>`;
    const B = ctx.el.querySelector("#b"), cells = [...B.children];
    ctx.timer(ctx.el.querySelector("#tm"), () => !st.done);
    const sync = () => { st.o = [...O]; st.f = [...F]; ctx.save(); };
    function render() {
      cells.forEach((c, i) => {
        let cls = "sw-c", h = "";
        if (O.has(i)) { cls += " o" + (NUM[i] ? " n" + NUM[i] : ""); h = NUM[i] || ""; }
        else if (st.boom.includes(i)) { cls += " boom"; h = MINE; }
        else if (F.has(i) || (st.done && M.has(i) && st.lives)) h = FLAG;
        else if (st.done && M.has(i)) h = MINE;
        if (i === P.s) cls += " start";
        c.className = cls; c.innerHTML = h;
        c.setAttribute("aria-label", `Row ${Math.floor(i / W) + 1} column ${(i % W) + 1}: ${O.has(i) ? NUM[i] || "clear" : F.has(i) ? "flagged" : "hidden"}`);
      });
      ctx.el.querySelector("#lv").textContent = "♥".repeat(st.lives) + "♡".repeat(3 - st.lives);
      ctx.el.querySelector("#lv").style.color = "var(--bad)";
      ctx.el.querySelector("#mc").textContent = `${M.size - F.size - st.boom.length} mines`;
      ctx.el.querySelectorAll("#md button").forEach((b) => b.setAttribute("aria-pressed", (b.dataset.f === "1") === flagMode));
      ctx.el.querySelector("#md").hidden = st.done;
    }
    function dig(i) {
      if (st.done || F.has(i) || st.boom.includes(i)) return;
      if (O.has(i)) { const n = nb(i); if (NUM[i] && n.filter((j) => F.has(j) || st.boom.includes(j)).length === NUM[i]) n.forEach((j) => !O.has(j) && !F.has(j) && !st.boom.includes(j) && dig(j)); return; }
      if (M.has(i)) {
        st.lives--; st.boom.push(i); ctx.sound("bad"); navigator.vibrate?.(120);
        if (!st.lives) { st.done = true; sync(); render(); ctx.finish({ win: false, bucket: "X", line: "Out of lives", share: "💥 ♡♡♡" }); }
        else ctx.toast(`Boom. ${st.lives} ${st.lives > 1 ? "lives" : "life"} left`);
        return;
      }
      flood(i);
    }
    function after() {
      if (!st.done && O.size === W * H - M.size) {
        st.done = true; sync(); render();
        const t = st.t, b = t < 60 ? "<1m" : t < 120 ? "1-2m" : t < 240 ? "2-4m" : "4m+";
        ctx.finish({ win: true, bucket: b, line: `Cleared in ${ctx.mmss(t)}`, share: `🚩 ${ctx.mmss(t)} · ${"♥".repeat(st.lives)}${"♡".repeat(3 - st.lives)}` });
        return;
      }
      sync(); render();
    }
    const flag = (i) => { if (st.done || O.has(i) || st.boom.includes(i)) return; F.has(i) ? F.delete(i) : F.add(i); ctx.sound("tap"); };
    let press = null;
    ctx.on(B, "pointerdown", (e) => { const c = e.target.closest(".sw-c"); if (!c || e.button === 2) return; const i = +c.dataset.i; press = { i, long: false, tm: setTimeout(() => { press.long = true; flag(i); after(); navigator.vibrate?.(25); }, 400) }; });
    ctx.on(B, "pointerup", () => { if (!press) return; clearTimeout(press.tm); if (!press.long) { if (flagMode && !O.has(press.i)) flag(press.i); else dig(press.i); after(); } press = null; });
    ctx.on(B, "pointerleave", () => { if (press) { clearTimeout(press.tm); press = null; } });
    ctx.on(B, "contextmenu", (e) => { e.preventDefault(); const c = e.target.closest(".sw-c"); if (c) { flag(+c.dataset.i); after(); } });
    ctx.on(B, "keydown", (e) => {
      const c = e.target.closest(".sw-c"); if (!c) return; const i = +c.dataset.i;
      const m = { ArrowLeft: -1, ArrowRight: 1, ArrowUp: -W, ArrowDown: W }[e.key];
      if (m) { e.preventDefault(); cells[Math.min(W * H - 1, Math.max(0, i + m))].focus(); }
      if (e.key === "Enter" || e.key === " ") { e.preventDefault(); dig(i); after(); }
      if (e.key.toLowerCase() === "f") { flag(i); after(); }
    });
    ctx.el.querySelectorAll("#md button").forEach((b) => (b.onclick = () => { flagMode = b.dataset.f === "1"; render(); }));
    sync(); render();
  }
};
