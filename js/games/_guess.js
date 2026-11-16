/* Shared engine for "guess the thing, each miss unlocks a hint" games, with type-ahead suggestions. */
export function guessGame(ctx, cfg) {
  /* cfg: { answer, accept:[...], hints:[[label,text]...], max, pool:[names], top(html), emoji(share) } */
  const st = ctx.state({ g: [], done: false, won: false });
  const ok = new Set([cfg.answer, ...(cfg.accept || [])].map(ctx.norm));
  const pool = [...new Set(cfg.pool)].sort();
  let act = -1;
  ctx.el.innerHTML = `${cfg.top}<div class="guesses" id="gs"></div><div class="hints" id="hs"></div><div id="rv" style="width:100%"></div>
    <form class="field" id="f" autocomplete="off"><input id="in" placeholder="${cfg.placeholder || "Your guess"}" aria-label="Your guess" autocapitalize="off" spellcheck="false" role="combobox" aria-autocomplete="list" aria-expanded="false"><button class="btn" type="submit">Guess</button><div class="suggest" id="sg" hidden role="listbox"></div></form>
    <div class="status-row" style="justify-content:center;margin-top:12px" id="left"></div>`;
  const $ = (s) => ctx.el.querySelector(s);
  const inp = $("#in"), sg = $("#sg");
  function render() {
    const shown = st.done ? cfg.hints.length : Math.min(cfg.hints.length, st.g.length + (cfg.freeHints || 0));
    $("#hs").innerHTML = cfg.hints.map(([l, t], i) => i < shown ? `<div class="hint-row"><small>${l}</small><span>${ctx.esc(t)}</span></div>` : i === shown && !st.done ? `<div class="hint-row locked"><small>${l}</small><span>Unlocks after a miss</span></div>` : "").join("");
    $("#gs").innerHTML = st.g.map((g) => `<span class="${ok.has(ctx.norm(g)) ? "ok" : ""}">${ctx.esc(g)}</span>`).join("");
    $("#rv").innerHTML = st.done ? `<div class="finish-card" style="margin-top:0"><p style="margin:0 0 2px">${st.won ? "You got it" : "The answer was"}</p><div class="answer-reveal">${ctx.esc(cfg.answer)}</div>${cfg.after ? `<p style="margin:4px 0 0">${cfg.after}</p>` : ""}</div>` : "";
    $("#f").hidden = st.done;
    $("#left").textContent = st.done ? "" : `${cfg.max - st.g.length} guess${cfg.max - st.g.length === 1 ? "" : "es"} left`;
    cfg.onRender?.(st);
  }
  function suggest() {
    const v = ctx.norm(inp.value);
    if (!v || !pool.length) { sg.hidden = true; inp.setAttribute("aria-expanded", "false"); return; }
    const m = pool.filter((p) => ctx.norm(p).startsWith(v)).concat(pool.filter((p) => !ctx.norm(p).startsWith(v) && ctx.norm(p).includes(v))).slice(0, 5);
    act = -1;
    sg.innerHTML = m.map((p, i) => `<button type="button" role="option" data-v="${ctx.esc(p)}">${ctx.esc(p)}</button>`).join("");
    sg.hidden = !m.length; inp.setAttribute("aria-expanded", String(!!m.length));
  }
  inp.addEventListener("input", suggest);
  inp.addEventListener("keydown", (e) => {
    const items = [...sg.querySelectorAll("button")];
    if (sg.hidden || !items.length) return;
    if (e.key === "ArrowDown" || e.key === "ArrowUp") { e.preventDefault(); act = (act + (e.key === "ArrowDown" ? 1 : -1) + items.length) % items.length; items.forEach((b, i) => b.classList.toggle("act", i === act)); }
    else if (e.key === "Enter" && act >= 0) { e.preventDefault(); inp.value = items[act].dataset.v; sg.hidden = true; submit(); }
    else if (e.key === "Escape") sg.hidden = true;
  });
  sg.addEventListener("mousedown", (e) => { const b = e.target.closest("button"); if (b) { e.preventDefault(); inp.value = b.dataset.v; sg.hidden = true; submit(); } });
  inp.addEventListener("blur", () => setTimeout(() => (sg.hidden = true), 150));
  $("#f").onsubmit = (e) => { e.preventDefault(); submit(); };
  function submit() {
    if (st.done) return;
    const raw = inp.value.trim(); if (!raw) return;
    if (st.g.some((g) => ctx.norm(g) === ctx.norm(raw))) { ctx.toast("Already tried that"); return; }
    inp.value = ""; sg.hidden = true;
    st.g.push(raw);
    const n = st.g.length, share = st.g.map((g) => (ok.has(ctx.norm(g)) ? "🟩" : "🟥")).join("");
    if (ok.has(ctx.norm(raw))) { st.done = st.won = true; ctx.save(); render(); ctx.finish({ win: true, bucket: String(n), line: `Got it in ${n}`, share: (cfg.emoji ? cfg.emoji + " " : "") + share }); return; }
    ctx.shakeEl($("#f"));
    if (n >= cfg.max) { st.done = true; ctx.save(); render(); ctx.finish({ win: false, bucket: "X", line: "Missed it", share: (cfg.emoji ? cfg.emoji + " " : "") + share }); return; }
    ctx.save(); render(); inp.focus();
  }
  render();
}
