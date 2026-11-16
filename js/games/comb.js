const RANKS = [["Starter", 0], ["Warming up", 3], ["Steady", 8], ["Good", 15], ["Solid", 25], ["Great", 40], ["Amazing", 55], ["Genius", 70], ["Perfect", 100]];
export default {
  buckets: ["Perfect", "Genius", "Amazing", "Great", "Lower"],
  help: `<p>Make words from the seven letters. Every word must be <b>4+ letters</b> and use the <b>centre letter</b>. Letters can repeat.</p>
  <p>4-letter words score 1 point; longer words score their length. A <b>pangram</b> uses all seven letters and earns 7 bonus points.</p>
  <p>Reach <b>Genius</b> to finish the day, or tap <b>Finish</b> at any time to see every answer.</p>`,
  mount(ctx) {
    const P = ctx.pick(HIVE), L = P.c + P.o;
    const st = ctx.state({ f: [], ord: P.o.split(""), done: false });
    let cur = "";
    const isPan = (w) => [...L].every((c) => w.includes(c));
    const pts = (w) => (w.length === 4 ? 1 : w.length) + (isPan(w) ? 7 : 0);
    const MAX = P.w.reduce((a, w) => a + pts(w), 0);
    const score = () => st.f.reduce((a, w) => a + pts(w), 0);
    const rank = () => { const p = (100 * score()) / MAX; let r = 0; RANKS.forEach((k, i) => { if (p >= k[1]) r = i; }); return r; };
    const bucket = () => { const r = rank(); return r >= 8 ? "Perfect" : r === 7 ? "Genius" : r === 6 ? "Amazing" : r === 5 ? "Great" : "Lower"; };
    const POS = [[33.5, 35.7], [33.5, 5], [60, 20.4], [60, 51], [33.5, 66.4], [7, 51], [7, 20.4]];
    ctx.el.innerHTML = `<div class="comb-rank"><b id="rk"></b><div class="comb-track"><i id="tr"></i></div><span class="comb-score" id="sc"></span></div>
      <details class="comb-found" id="fd"><summary><span id="fc"></span><span>Show</span></summary><div class="comb-words" id="fw"></div></details>
      <div class="comb-entry" id="en" aria-live="polite"></div><div class="comb" id="cb"></div>
      <div class="actions"><button class="btn soft" id="dl">Delete</button><button class="btn soft" id="sh" aria-label="Shuffle">${ctx.I.shuffle}</button><button class="btn ink" id="ok">Enter</button></div>
      <div class="actions" style="margin-top:8px"><button class="btn ghost small" id="fin">Finish &amp; reveal answers</button></div>`;
    const $ = (s) => ctx.el.querySelector(s);
    function comb() {
      $("#cb").innerHTML = [P.c, ...st.ord].map((l, i) => `<button class="hex${i ? "" : " mid"}" data-l="${l}" style="left:${POS[i][0]}%;top:${POS[i][1]}%" aria-label="${l}">${l}</button>`).join("");
    }
    function entry() { $("#en").innerHTML = [...cur].map((c) => `<span class="${c === P.c ? "c" : L.includes(c) ? "" : "x"}">${c}</span>`).join("") + `<span class="caret"></span>`; }
    function status() {
      const r = rank();
      $("#rk").textContent = RANKS[r][0]; $("#sc").textContent = score();
      $("#tr").style.width = Math.min(100, (100 * score()) / (MAX * 0.7)) + "%";
      $("#fc").textContent = `${st.f.length} word${st.f.length === 1 ? "" : "s"} found`;
      const list = st.done ? P.w : st.f.slice().sort();
      $("#fw").innerHTML = list.map((w) => `<span class="${isPan(w) ? "pg" : ""} ${st.f.includes(w) ? "" : "ms"}">${w}</span>`).join("");
      $("#fin").hidden = st.done;
    }
    function add(ch) { if (cur.length < 20) { cur += ch; entry(); ctx.sound("tap"); } }
    function fail(m) { ctx.toast(m); ctx.shakeEl($("#en")); setTimeout(() => { cur = ""; entry(); }, 450); }
    function enter() {
      const w = cur; if (!w) return;
      if (w.length < 4) return fail("Too short");
      if ([...w].some((c) => !L.includes(c))) return fail("Bad letters");
      if (!w.includes(P.c)) return fail("Missing centre letter");
      if (st.f.includes(w)) return fail("Already found");
      if (!P.w.includes(w)) return fail("Not in word list");
      const before = rank(); st.f.push(w); cur = ""; ctx.save(); entry(); status(); ctx.sound("good");
      ctx.toast(isPan(w) ? `Pangram! +${pts(w)}` : `${w.length >= 7 ? "Wonderful" : w.length >= 5 ? "Nice" : "Good"} +${pts(w)}`);
      if (rank() > before && rank() >= 4) setTimeout(() => ctx.toast(`You're now ${RANKS[rank()][0]}`), 900);
      if (rank() >= 7 && !ctx.result()) ctx.finish({ win: true, bucket: bucket(), line: `${RANKS[rank()][0]} · ${score()} pts`, share: `🍯 ${st.f.length} words${st.f.some(isPan) ? " · pangram ✨" : ""}` });
    }
    $("#cb").onclick = (e) => { const b = e.target.closest(".hex"); if (b) add(b.dataset.l); };
    $("#dl").onclick = () => { cur = cur.slice(0, -1); entry(); };
    $("#ok").onclick = enter;
    $("#sh").onclick = () => { st.ord = ctx.shuffle(st.ord); ctx.save(); comb(); };
    $("#fin").onclick = () => {
      if (!confirm("Finish today's Comb and reveal every answer?")) return;
      st.done = true; ctx.save(); status(); $("#fd").open = true;
      if (!ctx.result()) ctx.finish({ win: rank() >= 4, bucket: bucket(), line: `${RANKS[rank()][0]} · ${score()} pts`, share: `🍯 ${st.f.length} words`, confetti: false, delay: 300 });
      else ctx.results();
    };
    ctx.key((e) => {
      if (e.key === "Enter") { e.preventDefault(); enter(); }
      else if (e.key === "Backspace") { cur = cur.slice(0, -1); entry(); }
      else if (e.key === " ") { e.preventDefault(); $("#sh").click(); }
      else if (/^[a-z]$/i.test(e.key)) add(e.key.toLowerCase());
    });
    comb(); entry(); status();
    if (st.done) $("#fd").open = true;
  },
  autoResults: false
};
