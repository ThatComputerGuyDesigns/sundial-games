export default {
  buckets: ["★★★", "★★", "★"],
  help: `<p>Get from the top word to the bottom word by changing <b>one letter at a time</b>. Every step must be a real word.</p>
  <p>Match the <b>par</b> (the shortest route) for three stars. Stuck? <b>Hint</b> shows the next best word.</p>`,
  mount(ctx) {
    const P = ctx.pick(LADDER), V = new Set(LADDERVALID.concat(P.p));
    const PAR = P.p.length - 1;
    const st = ctx.state({ ch: [P.a], hints: 0, done: false });
    let cur = "";
    const oneOff = (a, b) => { let d = 0; for (let i = 0; i < 4; i++) if (a[i] !== b[i]) d++; return d === 1; };
    function bfs(from) {
      const prev = { [from]: null }, q = [from];
      while (q.length) { const w = q.shift(); if (w === P.b) break; for (let i = 0; i < 4; i++) for (let c = 97; c < 123; c++) { const n = w.slice(0, i) + String.fromCharCode(c) + w.slice(i + 1); if (V.has(n) && !(n in prev)) { prev[n] = w; q.push(n); } } }
      if (!(P.b in prev)) return null;
      const path = []; for (let w = P.b; w; w = prev[w]) path.unshift(w); return path;
    }
    const steps = () => st.ch.length - 1;
    const stars = () => Math.max(1, 3 - Math.max(0, steps() - PAR) - st.hints);
    ctx.el.innerHTML = `<div class="status-row"><span>Par <b style="color:var(--ink)">${PAR}</b> steps</span><span>You <b style="color:var(--ink)" id="ys">0</b></span></div><div class="steps" id="s"></div>
      <div class="actions"><button class="btn soft" id="un">Undo</button><button class="btn soft" id="hn">Hint</button></div><div id="kb"></div>`;
    const kb = ctx.keyboard(ctx.el.querySelector("#kb"), onKey);
    const row = (w, cls, prev) => `<div class="step ${cls}">${[...w.padEnd(4)].map((c, i) => `<div class="tile${prev && c !== " " && prev[i] !== c ? " chg" : ""}">${c.trim()}</div>`).join("")}</div>`;
    function render() {
      const last = st.ch[st.ch.length - 1];
      let h = st.ch.map((w, i) => row(w, i === 0 || (st.done && i === st.ch.length - 1) ? "end" : "", i ? st.ch[i - 1] : null)).join("");
      if (!st.done) h += row(cur, "typing") + `<div class="steps-gap"></div>` + row(P.b, "goal");
      ctx.el.querySelector("#s").innerHTML = h;
      ctx.el.querySelector("#ys").textContent = steps();
      ctx.el.querySelector("#un").disabled = st.ch.length < 2 || st.done;
      ctx.el.querySelector(".actions").hidden = st.done; ctx.el.querySelector("#kb").hidden = st.done;
    }
    function onKey(k) {
      if (st.done) return;
      if (k === "BACK") cur = cur.slice(0, -1);
      else if (k === "ENTER") return submit();
      else if (cur.length < 4) cur += k;
      render();
    }
    function submit() {
      const last = st.ch[st.ch.length - 1];
      const bad = (m) => { ctx.toast(m); ctx.shakeEl(ctx.el.querySelector(".step.typing")); };
      if (cur.length < 4) return bad("Four letters please");
      if (!oneOff(cur, last)) return bad("Change exactly one letter");
      if (!V.has(cur)) return bad("Not in word list");
      if (st.ch.includes(cur)) return bad("Already used");
      st.ch.push(cur); cur = ""; ctx.sound("good");
      if (st.ch[st.ch.length - 1] === P.b) {
        st.done = true; ctx.save(); render();
        const s = stars();
        ctx.finish({ win: true, bucket: "★".repeat(s), line: `${steps()} steps (par ${PAR})`, share: `${P.a.toUpperCase()} → ${P.b.toUpperCase()} ${"⭐".repeat(s)}` });
      } else { ctx.save(); render(); }
    }
    ctx.el.querySelector("#un").onclick = () => { if (st.ch.length > 1) { st.ch.pop(); ctx.save(); render(); } };
    ctx.el.querySelector("#hn").onclick = () => {
      const p = bfs(st.ch[st.ch.length - 1]);
      if (!p) { ctx.toast("Dead end. Try undoing a step."); return; }
      st.hints++; cur = p[1]; ctx.save(); render(); ctx.toast("Hint used: press Enter");
    };
    render();
  }
};
