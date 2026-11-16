export default {
  buckets: ["5", "4", "3", "2", "1", "0"],
  help: `<p>Five scrambled words, from <b>four letters</b> up to <b>eight</b>. Tap the letters (or type) to spell each one. Any real word using every letter counts.</p>
  <p><b>Hint</b> locks in the next letter but adds 10 seconds. <b>Skip</b> gives up on a word. Fewest skips, then fastest time, wins the day.</p>`,
  mount(ctx) {
    const R = ctx.pick(SCRAMBLE);
    const st = ctx.state({ i: 0, res: [], t: 0, hints: 0, done: false });
    let pick = [], lock = 0, order = null;
    ctx.el.innerHTML = `<div class="status-row"><span id="lb"></span><span class="timer" id="tm"></span></div><div class="jb-progress" id="pg"></div><div id="s" style="width:100%"></div>`;
    ctx.timer(ctx.el.querySelector("#tm"), () => !st.done);
    const solved = () => st.res.filter((x) => x === 1).length;
    const letters = () => R[st.i][0].split("");
    function render() {
      ctx.el.querySelector("#pg").innerHTML = R.map((_, i) => `<i class="${st.res[i] === 1 ? "ok" : st.res[i] === 0 ? "no" : i === st.i && !st.done ? "cur" : ""}"></i>`).join("");
      const S = ctx.el.querySelector("#s");
      if (st.done) {
        ctx.el.querySelector("#lb").textContent = `${solved()} of 5 solved`;
        S.innerHTML = `<div class="jb-done">${R.map((r, i) => `<div>${r[1][0]}<span>${st.res[i] === 1 ? "Solved" : "Skipped"}${r[1].length > 1 ? " · also " + r[1].slice(1).join(", ") : ""}</span></div>`).join("")}</div>`;
        return;
      }
      const L = letters(); if (!order) order = L.map((_, k) => k);
      ctx.el.querySelector("#lb").textContent = `Word ${st.i + 1} of 5 · ${L.length} letters`;
      S.innerHTML = `<div class="jb-row" id="ans">${L.map((_, k) => `<span class="lt slot${pick[k] != null ? " on" : ""}${k < lock ? " lock" : ""}">${pick[k] != null ? L[pick[k]] : ""}</span>`).join("")}</div>
        <div class="jb-row" style="margin-top:22px">${order.map((k) => `<button class="lt src${pick.includes(k) ? " used" : ""}" data-k="${k}" ${pick.includes(k) ? "disabled" : ""}>${L[k]}</button>`).join("")}</div>
        <div class="tools"><button class="tool" id="sf">${ctx.I.shuffle}Shuffle</button><button class="tool" id="cl">${ctx.I.erase}Clear</button><button class="tool" id="hn">${ctx.I.bulb}Hint</button><button class="tool" id="sk">${ctx.I.arrow}Skip</button></div>`;
      S.querySelectorAll(".src").forEach((b) => (b.onclick = () => add(+b.dataset.k)));
      S.querySelector("#sf").onclick = () => { order = ctx.shuffle(order); render(); };
      S.querySelector("#cl").onclick = () => { pick = pick.slice(0, lock); render(); };
      S.querySelector("#hn").onclick = hint;
      S.querySelector("#sk").onclick = () => { if (confirm("Skip this word?")) next(0); };
    }
    function add(k) {
      if (pick.includes(k)) return;
      pick.push(k); ctx.sound("tap"); render();
      const L = letters();
      if (pick.length === L.length) {
        const w = pick.map((i) => L[i]).join("");
        if (R[st.i][1].includes(w)) { ctx.el.querySelector("#ans").classList.add("win"); ctx.sound("good"); setTimeout(() => next(1), 700); }
        else { ctx.shakeEl(ctx.el.querySelector("#ans")); ctx.toast("Not a word we know"); setTimeout(() => { pick = pick.slice(0, lock); render(); }, 450); }
      }
    }
    function hint() {
      const L = letters(), t = R[st.i][1][0];
      if (lock >= L.length - 1) return;
      pick = pick.slice(0, lock);
      const k = L.findIndex((c, i) => c === t[lock] && !pick.includes(i));
      pick.push(k); lock++; st.hints++; st.t += 10; ctx.save(); render();
    }
    function next(ok) {
      st.res[st.i] = ok; st.i++; pick = []; lock = 0; order = null;
      if (st.i >= R.length) {
        st.done = true; const n = solved();
        ctx.finish({ win: n >= 3, bucket: String(n), line: `${n}/5 in ${ctx.mmss(st.t)}`, share: st.res.map((r) => (r ? "🟩" : "🟥")).join("") + (st.hints ? ` · 💡${st.hints}` : "") });
      }
      ctx.save(); render();
    }
    ctx.key((e) => {
      if (st.done) return;
      if (e.key === "Backspace") { e.preventDefault(); if (pick.length > lock) { pick.pop(); render(); } return; }
      if (/^[a-z]$/i.test(e.key)) { const L = letters(), c = e.key.toLowerCase(), k = L.findIndex((x, i) => x === c && !pick.includes(i)); if (k >= 0) add(k); }
    });
    render();
  }
};
