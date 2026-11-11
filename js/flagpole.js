(function () {
  var HELP = "<h2>How to play Flagpole</h2><p>Name the country from its <b>flag</b>. You have <b>6 guesses</b>. Each wrong guess unlocks a new hint: continent, then clues, then the capital's first letter.</p><p>Fewer guesses means a better score.</p>";
  var date = PD.init({ game: "flagpole", title: "Flagpole", help: HELP, dist: [1, 2, 3, 4, 5, 6, "X"] });
  var F = FLAGS[PD.index(date, FLAGS.length)], code = F[0], ans = F[1];
  var KEY = "fp:" + date, st = PD.load(KEY, { g: [], status: "play" });
  var app = document.getElementById("app"), MAX = 6;
  function norm(s) { return s.toLowerCase().replace(/[^a-z]/g, ""); }
  function hints() {
    var n = st.g.length, h = [];
    if (n >= 1) h.push(["Continent", F[2]]);
    if (n >= 2) h.push(["Clue", F[4]]);
    if (n >= 3) h.push(["Clue", F[5]]);
    if (n >= 4) h.push(["Letters in name", ans.replace(/[^A-Za-z]/g, "").length + (ans.indexOf(" ") >= 0 ? " (" + ans.split(" ").length + " words)" : "")]);
    if (n >= 5) h.push(["Capital begins with", F[3][0]]);
    return h;
  }
  function render(msg) {
    var h = '<div class="bigcard" style="text-align:center"><img id="flag" alt="Flag" src="https://flagcdn.com/w320/' + code.toLowerCase() + '.png" style="max-width:260px;width:80%;border:1px solid var(--line);border-radius:6px;box-shadow:0 4px 14px rgba(0,0,0,.15)"><div class="hint" style="margin-top:8px">Guess ' + Math.min(st.g.length + 1, MAX) + " of " + MAX + "</div></div>";
    h += hints().map(function (x) { return '<div class="hint" style="text-align:left"><b>' + x[0] + ":</b> " + x[1] + "</div>"; }).join("");
    h += st.g.map(function (g) { return '<div class="bigcard" style="padding:8px 12px;opacity:.9">❌ ' + g + "</div>"; }).join("");
    if (st.status === "play") {
      h += '<div class="row"><input id="gi" list="cl" placeholder="Type a country…" autocomplete="off" style="flex:1;padding:12px;border:2px solid var(--line);border-radius:10px;background:var(--card);color:var(--fg);font-size:1rem"><datalist id="cl">' + FLAGNAMES.map(function (n) { return "<option>" + n + "</option>"; }).join("") + '</datalist><button class="btn accent" id="go">Guess</button></div><div class="hint" id="msg">' + (msg || "") + "</div>";
    } else {
      h += '<div class="bigcard" style="text-align:center"><div style="font-size:1.4rem;font-weight:700">' + (st.status === "won" ? "🎉 " : "") + ans + '</div><div class="hint">Capital: ' + F[3] + '</div><div class="ctrls"><button class="btn accent" id="res">Results</button></div></div>';
    }
    app.innerHTML = h;
    var im = document.getElementById("flag");
    im.onerror = function () { im.outerHTML = '<div style="font-size:7rem;line-height:1">' + String.fromCodePoint.apply(null, code.split("").map(function (c) { return 0x1F1E6 + c.charCodeAt(0) - 65; })) + "</div>"; };
    var inp = document.getElementById("gi"), go = document.getElementById("go"), rs = document.getElementById("res");
    if (inp) { inp.onkeydown = function (e) { if (e.key === "Enter") submit(inp.value); e.stopPropagation(); }; go.onclick = function () { submit(inp.value); }; }
    if (rs) rs.onclick = results;
  }
  function submit(v) {
    var m = FLAGNAMES.filter(function (n) { return norm(n) === norm(v); })[0];
    if (!m) { render("Pick a country from the list"); return; }
    if (st.g.indexOf(m) >= 0) { render("Already guessed"); return; }
    if (m === ans) { st.g.push(m); st.status = "won"; st.n = st.g.length; PD.save(KEY, st); PD.record("flagpole", date, true, st.g.length); render(); if (st.g.length <= 2) PD.confetti(); setTimeout(results, 700); return; }
    st.g.push(m);
    if (st.g.length >= MAX) { st.status = "lost"; PD.save(KEY, st); PD.record("flagpole", date, false, "X"); render(); setTimeout(results, 700); return; }
    PD.save(KEY, st); render();
  }
  function text() { return "Flagpole No. " + PD.number(date) + " " + (st.status === "won" ? st.g.length : "X") + "/" + MAX + "\n" + st.g.map(function (g) { return g === ans ? "🟩" : "🟥"; }).join(""); }
  function results() { PD.results("flagpole", [1, 2, 3, 4, 5, 6, "X"], st.status === "won" ? st.g.length : "X", text(), "Flagpole"); }
  render();
  if (!PD.load("fp:seen", false)) { PD.save("fp:seen", true); setTimeout(function () { PD.modal(HELP); }, 300); }
})();
