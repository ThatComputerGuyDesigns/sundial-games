(function () {
  var HELP = "<h2>How to play Cinemoji</h2><p>Guess the <b>movie</b> from the emoji. You have <b>5 guesses</b>.</p><p>Each wrong guess unlocks another clue: genre and year, then the plot, then the cast or director, then the first letter.</p>";
  var date = PD.init({ game: "cinemoji", title: "Cinemoji", help: HELP, dist: [1, 2, 3, 4, 5, "X"] });
  var M = CINE[PD.index(date, CINE.length)], MAX = 5;
  var KEY = "cm:" + date, st = PD.load(KEY, { g: [], status: "play" });
  var app = document.getElementById("app");
  function norm(s) { return s.toLowerCase().replace(/&/g, "and").replace(/^(the|a|an) /, "").replace(/[^a-z0-9]/g, ""); }
  var accept = [M[1]].concat(M[6] || []).map(norm);
  function render(msg) {
    var n = st.g.length, done = st.status !== "play";
    var h = '<div class="bigcard" style="text-align:center"><div style="font-size:3.2rem;letter-spacing:.2em;line-height:1.3">' + M[0] + '</div><div class="hint">Guess ' + Math.min(n + 1, MAX) + " of " + MAX + "</div></div>";
    var cl = [];
    if (n >= 1 || done) cl.push(["Genre / year", M[3] + " · " + M[2]]);
    if (n >= 2 || done) cl.push(["Plot", M[4]]);
    if (n >= 3 || done) cl.push(["Who", M[5]]);
    if (n >= 4 || done) cl.push(["Title starts with", M[1][0] + " (" + M[1].split(" ").length + " word" + (M[1].split(" ").length > 1 ? "s" : "") + ")"]);
    h += cl.map(function (x) { return '<div class="hint" style="text-align:left"><b>' + x[0] + ":</b> " + x[1] + "</div>"; }).join("");
    h += st.g.map(function (g) { return '<div class="bigcard" style="padding:8px 12px">❌ ' + g + "</div>"; }).join("");
    if (!done) h += '<div class="row"><input id="gi" list="tl" placeholder="Movie title…" autocomplete="off" style="flex:1;padding:12px;border:2px solid var(--line);border-radius:10px;background:var(--card);color:var(--fg);font-size:1rem"><datalist id="tl">' + CINETITLES.map(function (t) { return "<option>" + t.replace(/&/g, "&amp;") + "</option>"; }).join("") + '</datalist><button class="btn accent" id="go">Guess</button></div><div class="hint">' + (msg || "") + "</div>";
    else h += '<div class="bigcard" style="text-align:center"><div style="font-size:1.3rem;font-weight:700">' + (st.status === "won" ? "🎉 " : "") + M[1] + '</div><div class="ctrls"><button class="btn accent" id="res">Results</button></div></div>';
    app.innerHTML = h;
    var gi = document.getElementById("gi");
    if (gi) { gi.onkeydown = function (e) { if (e.key === "Enter") submit(gi.value); e.stopPropagation(); }; document.getElementById("go").onclick = function () { submit(gi.value); }; }
    var rs = document.getElementById("res"); if (rs) rs.onclick = results;
  }
  function submit(v) {
    v = v.trim(); if (!v) return;
    if (accept.indexOf(norm(v)) >= 0) { st.g.push(M[1]); st.status = "won"; PD.save(KEY, st); PD.record("cinemoji", date, true, st.g.length); render(); if (st.g.length <= 2) PD.confetti(); setTimeout(results, 700); return; }
    if (st.g.indexOf(v) >= 0) { render("Already tried"); return; }
    st.g.push(v);
    if (st.g.length >= MAX) { st.status = "lost"; PD.save(KEY, st); PD.record("cinemoji", date, false, "X"); render(); setTimeout(results, 700); return; }
    PD.save(KEY, st); render();
  }
  function text() { return "Cinemoji No. " + PD.number(date) + " " + (st.status === "won" ? st.g.length : "X") + "/" + MAX + "\n" + M[0] + "\n" + st.g.map(function (g, i) { return st.status === "won" && i === st.g.length - 1 ? "🟩" : "🟥"; }).join(""); }
  function results() { PD.results("cinemoji", [1, 2, 3, 4, 5, "X"], st.status === "won" ? st.g.length : "X", text(), "Cinemoji"); }
  render();
  if (!PD.load("cm:seen", false)) { PD.save("cm:seen", true); setTimeout(function () { PD.modal(HELP); }, 300); }
})();
