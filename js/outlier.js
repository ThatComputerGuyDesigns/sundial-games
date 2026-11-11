(function () {
  var HELP = "<h2>How to play Outlier</h2><p>Five rounds. Each shows <b>four words</b>. Three belong together. <b>Tap the odd one out.</b></p><p>It's trickier than it sounds: the outlier usually comes from a very similar group. Streaks multiply your score.</p>";
  var date = PD.init({ game: "outlier", title: "Outlier", help: HELP, dist: [5, 4, 3, 2, 1, 0] });
  var R = OUTLIER[PD.index(date, OUTLIER.length)];
  var KEY = "ou:" + date, st = PD.load(KEY, { picks: [] }), app = document.getElementById("app");
  function right(i) { return st.picks[i] === R[i].o; }
  function total() { var n = 0; st.picks.forEach(function (_, i) { if (right(i)) n++; }); return n; }
  function render() {
    var r = st.picks.length, done = r >= 5, h = '<div class="qprog">' + R.map(function (_, i) { return '<i class="' + (i < r ? (right(i) ? "ok" : "no") : i === r ? "cur" : "") + '"></i>'; }).join("") + "</div>";
    var show = Math.min(r, 4);
    if (!done) {
      var q = R[r];
      h += '<div class="qcard"><div class="cat">Round ' + (r + 1) + ' of 5</div><h2>Which one doesn\'t belong?</h2><div class="opts">' + q.w.map(function (w) { return '<button class="opt" data-w="' + w.replace(/"/g, "&quot;") + '">' + w + "</button>"; }).join("") + "</div></div>";
    } else h += '<div class="hint" style="font-size:1.2rem;margin-top:14px"><b>' + total() + " / 5</b></div>";
    h += '<div style="width:100%">';
    st.picks.forEach(function (p, i) {
      var q = R[i];
      h += '<div class="bigcard" style="padding:12px"><div class="row" style="justify-content:flex-start;gap:6px">' + q.w.map(function (w) { return '<span class="pill" style="' + (w === q.o ? "background:var(--good);color:#fff;border-color:var(--good)" : w === p ? "background:var(--err);color:#fff;border-color:var(--err)" : "") + '">' + w + "</span>"; }).join("") + '</div><div class="fact" style="margin-top:8px">' + (right(i) ? "✅ " : "❌ ") + "Three are <b>" + q.a + "</b>. <b>" + q.o + "</b> is from <b>" + q.b + "</b>.</div></div>";
    });
    h += "</div>";
    if (done) h += '<div class="ctrls"><button class="btn accent" id="res">Results</button></div>';
    app.innerHTML = h;
    Array.prototype.forEach.call(app.querySelectorAll(".opt"), function (b) { b.onclick = function () { st.picks.push(b.dataset.w); PD.save(KEY, st); if (st.picks.length === 5) { PD.record("outlier", date, total() >= 3, total()); render(); if (total() === 5) PD.confetti(); setTimeout(results, 900); } else render(); }; });
    var rs = document.getElementById("res"); if (rs) rs.onclick = results;
  }
  function text() { return "Outlier No. " + PD.number(date) + " " + total() + "/5\n" + R.map(function (_, i) { return right(i) ? "🟩" : "🟥"; }).join(""); }
  function results() { PD.results("outlier", [5, 4, 3, 2, 1, 0], total(), text(), "Outlier"); }
  render();
  if (!PD.load("ou:seen", false)) { PD.save("ou:seen", true); setTimeout(function () { PD.modal(HELP); }, 300); }
})();
