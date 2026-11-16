export default {
  buckets: ["0-2", "3-4", "5-6", "7-8", "9"],
  help: `<p>Each day has a theme and a chain of ten things. Is the next one <b>higher or lower</b> than the one before?</p>
  <p>Keep the streak going all the way to nine for a perfect score. One wrong call ends the run.</p>`,
  mount(ctx) {
    const D = ctx.pick(HILO), N = D.i.length - 1;
    const st = ctx.state({ r: 0, done: false, lost: false });
    const fmt = (v) => `${v >= 1000 ? Math.round(v).toLocaleString() : v} <small>${ctx.esc(D.s)}</small>`;
    const bucket = (r) => (r <= 2 ? "0-2" : r <= 4 ? "3-4" : r <= 6 ? "5-6" : r <= 8 ? "7-8" : "9");
    function render(reveal) {
      const a = D.i[st.r], b = D.i[Math.min(st.r + 1, N)];
      const track = Array.from({ length: N }, (_, i) => `<i class="${i < st.r ? "ok" : i === st.r && st.lost ? "no" : ""}"></i>`).join("");
      ctx.el.innerHTML = `<div class="hl-track">${track}</div><div class="prompt-card" style="padding:12px"><small>${ctx.esc(D.t)} · ${ctx.esc(D.u)}</small><div style="font-weight:600">${ctx.esc(D.q)}</div></div>
        <div class="hl-pair"><div class="hl-card"><div class="nm">${ctx.esc(a[0])}</div><div class="vl">${fmt(a[1])}</div></div>
        <div class="hl-vs">VS</div>
        <div class="hl-card" style="animation-delay:.06s"><div class="nm">${ctx.esc(b[0])}</div>${reveal || st.done ? `<div class="vl">${fmt(b[1])}</div>` : `<div class="q">Higher or lower than ${ctx.esc(a[0])}?</div>`}</div></div>
        ${st.done ? `<div class="finish-card"><h3>${st.lost ? `Streak of ${st.r}` : "Perfect run"}</h3><p>${st.lost ? "Good effort. Try again tomorrow." : "Nine for nine."}</p></div>` : `<div class="hl-btns"><button class="btn soft" data-a="lo">${ctx.I.down} Lower</button><button class="btn" data-a="hi">${ctx.I.up} Higher</button></div>`}`;
      ctx.el.querySelectorAll("[data-a]").forEach((x) => (x.onclick = () => guess(x.dataset.a)));
    }
    function guess(g) {
      const a = D.i[st.r][1], b = D.i[st.r + 1][1];
      const ok = b === a || (g === "hi" ? b > a : b < a);
      render(true);
      setTimeout(() => {
        if (ok) { st.r++; ctx.sound("good"); if (st.r >= N) { st.done = true; ctx.save(); render(); return ctx.finish({ win: true, bucket: "9", line: "9/9 perfect", share: "🟩".repeat(9) }); } ctx.save(); render(); }
        else { st.done = true; st.lost = true; ctx.save(); render(); ctx.finish({ win: st.r >= 5, bucket: bucket(st.r), line: `Streak of ${st.r}`, share: "🟩".repeat(st.r) + "🟥" + "⬜".repeat(N - st.r - 1), confetti: false }); }
      }, 900);
    }
    ctx.key((e) => { if (st.done) return; if (e.key === "ArrowUp") guess("hi"); if (e.key === "ArrowDown") guess("lo"); });
    render();
  }
};
