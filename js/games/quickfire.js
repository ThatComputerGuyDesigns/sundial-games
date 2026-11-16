const DUR = 60;
export default {
  buckets: ["0-9", "10-14", "15-19", "20-24", "25+"],
  help: `<p>You have <b>60 seconds</b> to answer as many sums as you can. Everyone gets the same questions, and they get harder as you go.</p>
  <p>Answers are checked as you type, so there's no need to press enter. <b>Pass</b> skips a question but costs 3 seconds. One run per day.</p>`,
  mount(ctx) {
    const R = ctx.rng("q"), ri = (a, b) => a + Math.floor(R() * (b - a + 1)), Q = [];
    for (let k = 0; k < 200; k++) {
      const lv = Math.min(4, Math.floor(k / 6)), t = ri(0, lv < 1 ? 1 : 3);
      let a, b, ans, q;
      if (t === 0) { a = ri(2 + lv * 4, 12 + lv * 18); b = ri(2 + lv * 3, 9 + lv * 15); ans = a + b; q = `${a} + ${b}`; }
      else if (t === 1) { a = ri(8 + lv * 6, 20 + lv * 20); b = ri(2, a - 1); ans = a - b; q = `${a} − ${b}`; }
      else if (t === 2) { a = ri(2, 6 + lv * 2); b = ri(2, 9 + lv); ans = a * b; q = `${a} × ${b}`; }
      else { b = ri(2, 6 + lv * 2); ans = ri(2, 9 + lv); a = b * ans; q = `${a} ÷ ${b}`; }
      Q.push([q, ans]);
    }
    const st = ctx.state({ phase: "ready", log: [], left: DUR });
    let input = "", last = 0, loopOn = false;
    const score = () => st.log.filter((x) => x).length;
    const bucket = (n) => (n < 10 ? "0-9" : n < 15 ? "10-14" : n < 20 ? "15-19" : n < 25 ? "20-24" : "25+");
    const C = 2 * Math.PI * 54;
    function render() {
      if (st.phase === "ready") {
        ctx.el.innerHTML = `<div style="text-align:center;padding:30px 0"><div class="qf-big">60</div><p class="sub" style="margin:10px 0 28px">seconds of mental maths · one run a day</p><button class="btn" id="go" style="min-width:220px;height:54px;font-size:17px">Start</button><p class="muted" style="font-size:14px;margin-top:18px">On a computer, just type the numbers.</p></div>`;
        ctx.el.querySelector("#go").onclick = start; return;
      }
      if (st.phase === "run") {
        ctx.el.innerHTML = `<div class="qf-ring"><svg viewBox="0 0 120 120"><defs><linearGradient id="qfg" x1="0" x2="1"><stop offset="0" stop-color="${ctx.game.c1}"/><stop offset="1" stop-color="${ctx.game.c2}"/></linearGradient></defs><circle class="bg" cx="60" cy="60" r="54"/><circle class="fg" id="fg" cx="60" cy="60" r="54" stroke-dasharray="${C}"/></svg><b id="sec"></b></div>
          <div class="qf-score"><span>Correct <b id="ok">${score()}</b></span><span>Passed <b>${st.log.length - score()}</b></span></div>
          <div class="qf-q">${Q[st.log.length][0]}</div><div class="qf-a" id="a" aria-live="polite">${input || "&nbsp;"}</div>
          <div class="qf-pad" id="pad">${["1", "2", "3", "4", "5", "6", "7", "8", "9", "⌫", "0", "Pass"].map((k) => `<button data-k="${k}" class="${k.length > 1 ? "sm" : ""}">${k}</button>`).join("")}</div>`;
        ctx.el.querySelector("#pad").onclick = (e) => { const b = e.target.closest("[data-k]"); if (b) key(b.dataset.k); };
        tick(); return;
      }
      const n = score();
      ctx.el.innerHTML = `<div style="text-align:center;padding-top:20px"><div class="qf-big">${n}</div><p class="sub" style="margin-top:6px">correct in 60 seconds</p></div>
        <div class="qf-log">${st.log.map((ok, i) => `<span class="${ok ? "ok" : "no"}">${Q[i][0]} = ${Q[i][1]} ${ok ? "✓" : "✗"}</span>`).join("")}</div>`;
    }
    function tick() { const s = ctx.el.querySelector("#sec"), f = ctx.el.querySelector("#fg"); if (s) s.textContent = Math.ceil(st.left); if (f) f.setAttribute("stroke-dashoffset", C - (C * Math.max(0, st.left)) / DUR); }
    ctx.every(100, () => {
      if (!loopOn) return;
      const now = performance.now(); st.left -= (now - last) / 1000; last = now;
      if (st.left <= 0) return finish();
      tick();
    });
    function start() { st.phase = "run"; st.left = DUR; st.log = []; input = ""; ctx.save(); render(); last = performance.now(); loopOn = true; ctx.every(500, () => st.phase === "run" && ctx.save()); }
    function finish() {
      loopOn = false; st.left = 0; st.phase = "done"; ctx.save(); render();
      const n = score(); ctx.finish({ win: n >= 10, bucket: bucket(n), line: `${n} in 60 seconds`, share: `⚡ ${n} correct`, confetti: n >= 20, delay: 600 });
    }
    function key(k) {
      if (st.phase !== "run") return;
      const a = ctx.el.querySelector("#a");
      if (k === "⌫") { input = input.slice(0, -1); a.innerHTML = input || "&nbsp;"; return; }
      if (k === "Pass") { st.log.push(false); st.left -= 3; input = ""; if (st.log.length >= Q.length) return finish(); return render(); }
      if (input.length >= 4) return;
      input += k; a.textContent = input;
      const want = String(Q[st.log.length][1]);
      if (input === want) { st.log.push(true); input = ""; a.classList.add("ok"); ctx.sound("good"); if (st.log.length >= Q.length) return finish(); setTimeout(() => st.phase === "run" && render(), 110); }
      else if (input.length >= want.length) { a.classList.add("no"); ctx.sound("bad"); setTimeout(() => { input = ""; const el = ctx.el.querySelector("#a"); if (el) { el.classList.remove("no"); el.innerHTML = "&nbsp;"; } }, 280); }
    }
    ctx.key((e) => {
      if (st.phase === "ready" && e.key === "Enter") return start();
      if (/^[0-9]$/.test(e.key)) key(e.key);
      else if (e.key === "Backspace") key("⌫");
      else if (e.key === "Tab" && st.phase === "run") { e.preventDefault(); key("Pass"); }
    });
    /* a run interrupted by leaving ends where it stopped */
    if (st.phase === "run") { st.phase = "done"; ctx.save(); if (!ctx.result()) { const n = score(); ctx.finish({ win: n >= 10, bucket: bucket(n), line: `${n} in 60 seconds`, share: `⚡ ${n} correct`, confetti: false, delay: 300 }); } }
    render();
  }
};
