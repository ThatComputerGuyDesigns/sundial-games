/* 5x5 crossword: across words on rows 0,2,4; down words on cols 0,2,4; blocks at odd/odd */
export default {
  buckets: ["<1m", "1-2m", "2-3m", "3-5m", "5m+", "X"],
  help: `<p>Fill the grid using the clues. Tap a square to select it; tap again to switch between <b>across</b> and <b>down</b>.</p>
  <p>Type on your keyboard or the one on screen. The clock is running. <b>Check</b> highlights wrong letters, <b>Reveal</b> fills a square (each adds 10 seconds).</p>`,
  mount(ctx) {
    const P = ctx.pick(XW);
    const SOL = Array(25).fill(null);
    P.a.forEach(([w], k) => [...w].forEach((ch, c) => (SOL[k * 2 * 5 + c] = ch)));
    P.d.forEach(([w], k) => [...w].forEach((ch, r) => (SOL[r * 5 + k * 2] = ch)));
    const NUMS = { 0: 1, 2: 2, 4: 3, 10: 4, 20: 5 };
    const CL = [
      { n: 1, dir: "a", cells: [0, 1, 2, 3, 4], clue: P.a[0][1] }, { n: 4, dir: "a", cells: [10, 11, 12, 13, 14], clue: P.a[1][1] }, { n: 5, dir: "a", cells: [20, 21, 22, 23, 24], clue: P.a[2][1] },
      { n: 1, dir: "d", cells: [0, 5, 10, 15, 20], clue: P.d[0][1] }, { n: 2, dir: "d", cells: [2, 7, 12, 17, 22], clue: P.d[1][1] }, { n: 3, dir: "d", cells: [4, 9, 14, 19, 24], clue: P.d[2][1] }
    ];
    const st = ctx.state({ b: Array(25).fill(""), t: 0, done: false, bad: [], helps: 0 });
    let cur = 0, dir = "a";
    ctx.el.innerHTML = `<div class="status-row"><span class="chip" id="hp">No help used</span><span class="timer" id="tm">0:00</span></div>
      <div class="mini-clue"><button id="pv" aria-label="Previous clue"><svg viewBox="0 0 24 24"><path d="M15 5l-7 7 7 7"/></svg></button><b id="cn"></b><span id="ct"></span><button id="nx" aria-label="Next clue"><svg viewBox="0 0 24 24"><path d="M9 5l7 7-7 7"/></svg></button></div>
      <div class="mini-grid" id="g"></div>
      <div class="tools" id="tl"><button class="tool" id="ck">${ctx.I.eye}Check</button><button class="tool" id="rv">${ctx.I.bulb}Reveal</button><button class="tool" id="gu">${ctx.I.erase}Give up</button></div>
      <div class="clue-lists" id="lists"></div><div id="kb"></div>`;
    const G = ctx.el.querySelector("#g");
    G.innerHTML = SOL.map((s, i) => `<div class="mc${s ? "" : " blk"}" data-i="${i}" ${s ? 'role="button"' : ""}>${NUMS[i] ? `<span class="no">${NUMS[i]}</span>` : ""}<span class="ch"></span></div>`).join("");
    const cells = [...G.children];
    ctx.timer(ctx.el.querySelector("#tm"), () => !st.done);
    const kb = ctx.keyboard(ctx.el.querySelector("#kb"), onKey, { enter: "Next" });
    const clueFor = (i, d) => CL.find((c) => c.dir === d && c.cells.includes(i)) || CL.find((c) => c.cells.includes(i));
    function render() {
      const cl = clueFor(cur, dir); dir = cl.dir;
      cells.forEach((el, i) => {
        if (!SOL[i]) return;
        el.querySelector(".ch").textContent = st.b[i];
        el.className = "mc" + (i === cur && !st.done ? " cur" : cl.cells.includes(i) && !st.done ? " word" : "") + (st.bad.includes(i) ? " bad" : "");
      });
      ctx.el.querySelector("#cn").textContent = cl.n + (cl.dir === "a" ? "A" : "D");
      ctx.el.querySelector("#ct").textContent = cl.clue;
      ctx.el.querySelector("#hp").textContent = st.helps ? `+${st.helps * 10}s help` : "No help used";
      ctx.el.querySelector("#lists").innerHTML = ["a", "d"].map((d) => `<div><h5>${d === "a" ? "Across" : "Down"}</h5>${CL.filter((c) => c.dir === d).map((c) => `<button data-c="${CL.indexOf(c)}" class="${c === cl ? "act" : ""} ${c.cells.every((i) => st.b[i]) ? "done" : ""}"><b>${c.n}</b>${ctx.esc(c.clue)}</button>`).join("")}</div>`).join("");
      G.classList.toggle("solved", st.done && st.b.every((v, i) => !SOL[i] || v === SOL[i]));
      ctx.el.querySelector("#tl").hidden = st.done; ctx.el.querySelector("#kb").hidden = st.done;
    }
    function step(delta) {
      const cl = clueFor(cur, dir), k = cl.cells.indexOf(cur) + delta;
      if (k >= 0 && k < 5) cur = cl.cells[k];
    }
    function nextClue(delta = 1) {
      const i = CL.indexOf(clueFor(cur, dir)), c = CL[(i + delta + CL.length) % CL.length];
      dir = c.dir; cur = c.cells.find((x) => !st.b[x]) ?? c.cells[0];
    }
    function onKey(k) {
      if (st.done) return;
      if (k === "ENTER") nextClue();
      else if (k === "BACK") { if (st.b[cur]) st.b[cur] = ""; else { step(-1); st.b[cur] = ""; } }
      else {
        st.b[cur] = k; st.bad = st.bad.filter((x) => x !== cur);
        const cl = clueFor(cur, dir), nextEmpty = cl.cells.slice(cl.cells.indexOf(cur) + 1).find((x) => !st.b[x]);
        if (nextEmpty != null) cur = nextEmpty; else if (cl.cells.every((x) => st.b[x])) nextClue(); else step(1);
      }
      ctx.save(); check(); render();
    }
    function check() {
      if (!SOL.every((s, i) => !s || st.b[i])) return;
      if (SOL.every((s, i) => !s || st.b[i] === s)) {
        st.done = true; ctx.save(); render();
        const t = st.t, b = t < 60 ? "<1m" : t < 120 ? "1-2m" : t < 180 ? "2-3m" : t < 300 ? "3-5m" : "5m+";
        ctx.finish({ win: true, bucket: b, line: `Solved in ${ctx.mmss(t)}`, share: `⏱️ ${ctx.mmss(t)}${st.helps ? ` · ${st.helps} assist${st.helps > 1 ? "s" : ""}` : " · no help"}` });
      } else ctx.toast("Not quite. Something's wrong.");
    }
    G.onclick = (e) => { const c = e.target.closest(".mc"); if (!c || c.classList.contains("blk") || st.done) return; const i = +c.dataset.i; if (i === cur) dir = dir === "a" ? "d" : "a"; cur = i; render(); };
    ctx.el.querySelector("#lists").onclick = (e) => { const b = e.target.closest("[data-c]"); if (!b || st.done) return; const c = CL[+b.dataset.c]; dir = c.dir; cur = c.cells.find((x) => !st.b[x]) ?? c.cells[0]; render(); };
    ctx.el.querySelector("#nx").onclick = () => { nextClue(1); render(); };
    ctx.el.querySelector("#pv").onclick = () => { nextClue(-1); render(); };
    ctx.el.querySelector("#ck").onclick = () => { st.bad = SOL.map((s, i) => (s && st.b[i] && st.b[i] !== s ? i : -1)).filter((i) => i >= 0); st.helps++; st.t += 10; ctx.toast(st.bad.length ? `${st.bad.length} wrong` : "All good so far"); ctx.save(); render(); };
    ctx.el.querySelector("#rv").onclick = () => { st.b[cur] = SOL[cur]; st.bad = st.bad.filter((x) => x !== cur); st.helps++; st.t += 10; ctx.save(); step(1); check(); render(); };
    ctx.el.querySelector("#gu").onclick = () => {
      if (!confirm("Reveal the whole puzzle?")) return;
      st.b = SOL.map((s) => s || ""); st.done = true; ctx.save(); render();
      ctx.finish({ win: false, bucket: "X", line: "Revealed", share: "🏳️" });
    };
    ctx.key((e) => { const m = { ArrowLeft: [-1, "a"], ArrowRight: [1, "a"], ArrowUp: [-5, "d"], ArrowDown: [5, "d"] }[e.key]; if (!m || st.done) return; e.preventDefault(); if (dir !== m[1]) { dir = m[1]; } else { let j = cur + m[0]; while (j >= 0 && j < 25 && !SOL[j]) j += m[0]; if (j >= 0 && j < 25 && Math.abs((j % 5) - (cur % 5)) <= 4 && (m[1] === "d" || Math.floor(j / 5) === Math.floor(cur / 5))) cur = j; } render(); });
    render();
  }
};
