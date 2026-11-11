(function () {
  var HELP = "<h2>How to play Encore</h2><p>Name the <b>artist</b> from five clues. You start with the hardest clue; every wrong guess reveals an easier one.</p><p>The fewer clues you need, the better. No audio or lyrics, just what you know about the music.</p>";
  var date = PD.init({ game: "encore", title: "Encore", help: HELP, dist: [1, 2, 3, 4, 5, "X"] });
  var A = ENCORE[PD.index(date, ENCORE.length)], MAX = 5;
  var KEY = "en:" + date, st = PD.load(KEY, { g: [], status: "play" });
  var app = document.getElementById("app");
  function norm(s) { return s.toLowerCase().replace(/&/g, "and").replace(/^the /, "").replace(/[^a-z0-9]/g, ""); }
  var accept = [A[0]].concat(A[1]).map(norm);
  function render(msg) {
    var n = st.g.length, done = st.status !== "play", show = done ? 5 : Math.min(n + 1, 5);
    var h = '<div class="hint">Clue <b>' + show + "</b> of 5</div>";
    for (var i = 0; i < show; i++) h += '<div class="bigcard" style="padding:12px 14px;text-align:left"><span class="pill">' + (i + 1) + "</span> " + A[2][i] + "</div>";
    h += st.g.map(function (g) { return '<div class="bigcard" style="padding:8px 12px">❌ ' + g + "</div>"; }).join("");
    if (!done) h += '<div class="row"><input id="gi" list="al" placeholder="Artist or band…" autocomplete="off" style="flex:1;padding:12px;border:2px solid var(--line);border-radius:10px;background:var(--card);color:var(--fg);font-size:1rem"><datalist id="al">' + ARTISTS.map(function (t) { return "<option>" + t.replace(/&/g, "&amp;") + "</option>"; }).join("") + '</datalist><button class="btn accent" id="go">Guess</button></div><div class="hint">' + (msg || "") + "</div>";
    else h += '<div class="bigcard" style="text-align:center"><div style="font-size:1.4rem;font-weight:700">' + (st.status === "won" ? "🎶 " : "") + A[0] + '</div><div class="ctrls"><button class="btn accent" id="res">Results</button></div></div>';
    app.innerHTML = h;
    var gi = document.getElementById("gi");
    if (gi) { gi.onkeydown = function (e) { if (e.key === "Enter") submit(gi.value); e.stopPropagation(); }; document.getElementById("go").onclick = function () { submit(gi.value); }; }
    var rs = document.getElementById("res"); if (rs) rs.onclick = results;
  }
  function submit(v) {
    v = v.trim(); if (!v) return;
    if (accept.indexOf(norm(v)) >= 0) { st.g.push(A[0]); st.status = "won"; PD.save(KEY, st); PD.record("encore", date, true, st.g.length); render(); if (st.g.length <= 2) PD.confetti(); setTimeout(results, 700); return; }
    if (st.g.indexOf(v) >= 0) { render("Already tried"); return; }
    st.g.push(v);
    if (st.g.length >= MAX) { st.status = "lost"; PD.save(KEY, st); PD.record("encore", date, false, "X"); render(); setTimeout(results, 700); return; }
    PD.save(KEY, st); render();
  }
  function text() { var k = st.status === "won" ? st.g.length : "X"; var s = ""; for (var i = 0; i < MAX; i++) s += st.status === "won" && i === st.g.length - 1 ? "🟩" : i < st.g.length ? "🟥" : "⬜"; return "Encore No. " + PD.number(date) + " " + k + "/" + MAX + "\n🎵 " + s; }
  function results() { PD.results("encore", [1, 2, 3, 4, 5, "X"], st.status === "won" ? st.g.length : "X", text(), "Encore"); }
  render();
  if (!PD.load("en:seen", false)) { PD.save("en:seen", true); setTimeout(function () { PD.modal(HELP); }, 300); }
})();
