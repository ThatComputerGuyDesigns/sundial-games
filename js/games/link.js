export default {
  buckets: ["3", "2", "1", "0"],
  help: `<p>Three rounds. In each, find the <b>one word</b> that links all three clue words, before or after them.</p>
  <p>Example: <b>FLAT · SWEET · BROWN</b> → <b>BREAD</b> (flatbread, sweetbread, brown bread).</p>
  <p>You get three guesses per round. Each miss reveals another letter.</p>`,
  mount(ctx) {
    const R = ctx.pick(TRI);
    const st = ctx.state({ r: 0, g: [[], [], []], res: [], done: false });
    ctx.el.innerHTML = `<div class="link-rounds" id="rd"></div><div class="link-trio" id="tr"></div><div class="prompt-card" style="padding:14px"><div class="big" id="pt" style="letter-spacing:.2em;font-size:26px"></div></div>
      <form class="field" id="f" autocomplete="off"><input id="in" placeholder="Your answer" aria-label="Your answer" autocapitalize="off" spellcheck="false"><button class="btn" type="submit">Guess</button></form>
      <div class="link-hint" id="hn"></div><div id="after" style="width:100%"></div>`;
    const $ = (s) => ctx.el.querySelector(s);
    const solved = () => st.res.filter(Boolean).length;
    function pattern(ans, miss, reveal) { return [...ans].map((c, i) => (reveal || i < miss ? c.toUpperCase() : "_")).join(" "); }
    function render() {
      $("#rd").innerHTML = R.map((_, i) => `<i class="${st.res[i] === true ? "ok" : st.res[i] === false ? "no" : i === st.r && !st.done ? "cur" : ""}">${i + 1}</i>`).join("");
      const ri = Math.min(st.r, 2), [words, ans] = R[ri];
      if (st.done) {
        $("#tr").innerHTML = R.map(([w, a], i) => `<div style="font-size:16px">${w.join(" · ")} → <span class="ans">${a}</span> ${st.res[i] ? "✓" : "✗"}</div>`).join("");
        $("#pt").parentElement.hidden = true; $("#f").hidden = true; $("#hn").textContent = "";
        return;
      }
      $("#tr").innerHTML = words.map((w) => `<div>${ctx.esc(w)}</div>`).join("");
      $("#pt").textContent = pattern(ans, st.g[ri].length);
      $("#hn").textContent = st.g[ri].length ? `Tried: ${st.g[ri].join(", ")} · ${3 - st.g[ri].length} left` : `${ans.length} letters · 3 guesses`;
    }
    $("#f").onsubmit = (e) => {
      e.preventDefault();
      if (st.done) return;
      const v = ctx.norm($("#in").value); if (!v) return;
      const ans = R[st.r][1];
      $("#in").value = "";
      if (v === ctx.norm(ans)) { st.res[st.r] = true; ctx.sound("good"); ctx.toast(`Yes, ${ans.toUpperCase()}`); advance(); }
      else {
        st.g[st.r].push(v); ctx.shakeEl($("#f"));
        if (st.g[st.r].length >= 3) { st.res[st.r] = false; ctx.toast(`It was ${ans.toUpperCase()}`, 2400); advance(); }
        else { ctx.save(); render(); }
      }
    };
    function advance() {
      st.r++;
      if (st.r >= 3) { st.done = true; const n = solved(); ctx.finish({ win: n >= 2, bucket: String(n), line: `${n}/3 links`, share: st.res.map((x) => (x ? "🟩" : "🟥")).join("") }); }
      ctx.save(); render(); if (!st.done) $("#in").focus();
    }
    render();
  }
};
