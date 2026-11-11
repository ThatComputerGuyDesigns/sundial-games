(function () {
  var HELP = "<h2>How to play Trifecta</h2><p>Three words are linked by a <b>fourth word</b> that can join each of them, before or after, to make a new word or phrase.</p><p>Example: <b>SOUR · LOSER · THROAT</b> → <b>SORE</b>.</p><p>Three rounds, getting trickier. You get <b>3 guesses</b> per round, and a letter hint after the second.</p>";
  var date = PD.init({ game: "trifecta", title: "Trifecta", help: HELP, dist: [0, 1, 2, 3] });
  var D = TRI[PD.index(date, TRI.length)];
  var KEY = "tf:" + date, st = PD.load(KEY, { r: 0, res: [], g: [] });
  var app = document.getElementById("app");
  function valid(a, w) { var m = TRIFAM[a]; return m && w.every(function (x) { return m.indexOf(x) >= 0; }); }
  function check(guess) {
    var rd = D[st.r], g = guess.toLowerCase().replace(/[^a-z]/g, "");
    if (g === rd[1]) return true;
    return Object.keys(TRIFAM).some(function (a) { return a === g && valid(a, rd[0]); });
  }
  function render(msg) {
    var done = st.r >= 3, h = '<div class="hint">Round <b>' + Math.min(st.r + 1, 3) + "</b> of 3</div>";
    var pips = D.map(function (_, i) { return i < st.res.length ? (st.res[i] ? "🟩" : "🟥") : "⬜"; }).join(" ");
    h += '<div class="hint" style="font-size:1.1rem">' + pips + "</div>";
    if (!done) {
      var rd = D[st.r];
      h += '<div class="bigcard" style="text-align:center"><div class="row" style="justify-content:center;gap:10px;flex-wrap:wrap">' + rd[0].map(function (w) { return '<span class="pill" style="font-size:1.15rem;padding:10px 16px">' + w.toUpperCase() + "</span>"; }).join("") + '</div><div class="hint" style="margin-top:10px">What word goes with all three?</div>';
      if (st.g.length >= 2) h += '<div class="hint">Hint: starts with <b>' + rd[1][0].toUpperCase() + "</b>, " + rd[1].length + " letters</div>";
      h += st.g.map(function (x) { return '<div style="opacity:.7">❌ ' + x + "</div>"; }).join("");
      h += '<div class="row" style="margin-top:8px"><input id="gi" placeholder="Your answer" autocomplete="off" style="flex:1;padding:12px;border:2px solid var(--line);border-radius:10px;background:var(--card);color:var(--fg);font-size:1rem"><button class="btn accent" id="go">Guess</button></div><div class="hint" id="msg">' + (msg || "") + "</div><div class=\"ctrls\"><button class=\"btn sec\" id=\"skip\">Give up</button></div></div>";
    } else {
      h += '<div class="bigcard">' + D.map(function (rd, i) { return "<div>" + (st.res[i] ? "✅" : "❌") + " " + rd[0].join(" · ") + " → <b>" + rd[1] + "</b></div>"; }).join("") + '</div><div class="ctrls"><button class="btn accent" id="res">Results</button></div>';
    }
    app.innerHTML = h;
    var gi = document.getElementById("gi");
    if (gi) { gi.focus(); gi.onkeydown = function (e) { if (e.key === "Enter") guess(gi.value); e.stopPropagation(); }; document.getElementById("go").onclick = function () { guess(gi.value); }; document.getElementById("skip").onclick = function () { end(false); }; }
    var rs = document.getElementById("res"); if (rs) rs.onclick = results;
  }
  function guess(v) {
    var g = v.trim().toLowerCase(); if (!g) return;
    if (check(g)) { end(true); return; }
    st.g.push(g);
    if (st.g.length >= 3) { end(false); return; }
    PD.save(KEY, st); render("Not that one");
  }
  function end(ok) {
    st.res.push(ok); st.r++; st.g = []; PD.save(KEY, st);
    if (st.r >= 3) { var n = st.res.filter(Boolean).length; PD.record("trifecta", date, n >= 2, n); render(); if (n === 3) PD.confetti(); setTimeout(results, 700); }
    else { PD.toast(ok ? "Correct!" : "Next round"); render(); }
  }
  function score() { return st.res.filter(Boolean).length; }
  function text() { return "Trifecta No. " + PD.number(date) + " " + score() + "/3\n" + st.res.map(function (b) { return b ? "🟩" : "🟥"; }).join(""); }
  function results() { PD.results("trifecta", [0, 1, 2, 3], score(), text(), "Trifecta"); }
  render();
  if (!PD.load("tf:seen", false)) { PD.save("tf:seen", true); setTimeout(function () { PD.modal(HELP); }, 300); }
})();
