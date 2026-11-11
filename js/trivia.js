(function () {
  var HELP = "<h2>How to play Quizfive</h2><p>Five questions that get <b>harder each time</b>. Worth 100, 200, 300, 400 and 500 points.</p><p>You get one <b>50/50 lifeline</b> to remove two wrong answers, but using it halves that question's points. Get a streak going for bonus points.</p>";
  var date = PD.init({ game: "quizfive", title: "Quizfive", help: HELP, dist: [5, 4, 3, 2, 1, 0] });
  var Q = QZ[PD.index(date, QZ.length)];
  var KEY = "qz:" + date, st = PD.load(KEY, { a: [], life: -1, shown: false }), app = document.getElementById("app");
  var seedBase = PD.number(date) * 104729;
  function opts(i) { return PD.shuffle(Q[i].slice(2), seedBase + i * 31); }
  function pts(i) { return (i + 1) * 100; }
  function correct(i) { return st.a[i] === Q[i][2]; }
  function streakBonus() { var b = 0, s = 0; for (var i = 0; i < st.a.length; i++) { if (correct(i)) { s++; if (s > 1) b += 25 * (s - 1); } else s = 0; } return b; }
  function score() { var t = 0; for (var i = 0; i < st.a.length; i++) if (correct(i)) t += st.life === i ? pts(i) / 2 : pts(i); return t + streakBonus(); }
  function numCorrect() { var n = 0; for (var i = 0; i < st.a.length; i++) if (correct(i)) n++; return n; }
  function render(reveal) {
    var r = st.a.length, done = r >= 5 && !reveal;
    var h = '<div class="qprog">' + Q.map(function (_, i) { return '<i class="' + (i < st.a.length ? (correct(i) ? "ok" : "no") : i === r ? "cur" : "") + '"></i>'; }).join("") + "</div>";
    if (r < 5 || reveal) {
      var i = reveal ? st.a.length - 1 : r, q = Q[i], os = opts(i), hid = (st.life === i && !reveal) ? os.filter(function (o) { return o !== q[2]; }).slice(0, 2) : [];
      if (st.life === i) { var wr = os.filter(function (o) { return o !== q[2]; }); var rm = PD.shuffle(wr, seedBase + 99 + i).slice(0, 2); hid = rm; }
      h += '<div class="qcard"><div class="row" style="justify-content:space-between"><span class="cat">' + q[0] + '</span><span class="pill">' + pts(i) + " pts</span></div><h2>" + q[1] + '</h2><div class="opts">' + os.map(function (o) {
        var cls = "opt", dis = "";
        if (reveal) { dis = " disabled"; if (o === q[2]) cls += " right"; else if (o === st.a[i]) cls += " wrong"; }
        if (hid.indexOf(o) >= 0) { return '<button class="opt" disabled style="opacity:.25;text-decoration:line-through">' + o + "</button>"; }
        return '<button class="' + cls + '" data-o="' + o.replace(/"/g, "&quot;") + '"' + dis + ">" + o + "</button>";
      }).join("") + "</div>";
      if (!reveal) h += '<div class="ctrls"><button class="btn sec" id="life"' + (st.life >= 0 ? " disabled" : "") + ">50/50 (half points)</button></div>";
      else h += '<div class="ctrls"><button class="btn accent" id="nx">' + (st.a.length >= 5 ? "See results" : "Next question") + "</button></div>";
      h += "</div>";
    } else {
      h += '<div class="bigcard" style="text-align:center"><div class="cat" style="color:var(--muted);font-size:.75rem;letter-spacing:.1em">YOUR SCORE</div><div style="font-family:var(--serif);font-size:3rem;font-weight:700">' + score() + '</div><div class="hint">' + numCorrect() + ' of 5 correct</div><div class="ctrls"><button class="btn accent" id="res">Results</button></div></div>';
      h += st.a.map(function (a, i) { return '<div class="bigcard" style="padding:12px"><div class="cat" style="font-size:.72rem;color:var(--muted)">' + (correct(i) ? "✅" : "❌") + " " + Q[i][0] + "</div><div>" + Q[i][1] + "</div><div style=\"margin-top:4px\"><b>" + Q[i][2] + "</b>" + (correct(i) ? "" : ' <span style="color:var(--muted)">(you said ' + a + ")</span>") + "</div></div>"; }).join("");
    }
    app.innerHTML = h;
    Array.prototype.forEach.call(app.querySelectorAll(".opt[data-o]"), function (b) { b.onclick = function () { answer(b.dataset.o); }; });
    var g = function (id, f) { var e = document.getElementById(id); if (e) e.onclick = f; };
    g("life", function () { st.life = st.a.length; PD.save(KEY, st); render(); });
    g("nx", function () { if (st.a.length >= 5) { render(); setTimeout(results, 200); } else render(); });
    g("res", results);
  }
  function answer(o) {
    st.a.push(o); PD.save(KEY, st);
    if (st.a.length === 5) PD.record("quizfive", date, numCorrect() >= 3, numCorrect());
    render(true);
  }
  function text() { return "Quizfive No. " + PD.number(date) + " · " + score() + " pts\n" + Q.map(function (_, i) { return correct(i) ? "🟩" : "🟥"; }).join("") + (st.life >= 0 ? " (50/50)" : ""); }
  function results() { PD.results("quizfive", [5, 4, 3, 2, 1, 0], numCorrect(), text(), "Quizfive"); }
  render(false);
  if (st.a.length >= 5) { render(false); }
  if (!PD.load("qz:seen", false)) { PD.save("qz:seen", true); setTimeout(function () { PD.modal(HELP); }, 300); }
})();
