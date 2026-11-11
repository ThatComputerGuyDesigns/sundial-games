(function () {
  var HELP = "<h2>How to play Hilo</h2><p>You see one item with its number. Is the <b>next item</b> higher or lower? Tap <b>Higher</b> or <b>Lower</b>.</p><p>Keep a streak going until you slip. Each day uses a different topic.</p>";
  var date = PD.init({ game: "hilo", title: "Hilo", help: HELP, dist: ["0-2", "3-4", "5-6", "7-8", "9"] });
  var D = HILO[PD.index(date, HILO.length)], N = D.i.length - 1;
  var KEY = "hl:" + date, st = PD.load(KEY, { r: 0, picks: [], status: "play" });
  var app = document.getElementById("app");
  function fmt(v) { return (v >= 100 ? Math.round(v).toLocaleString() : String(v)) + " " + D.s; }
  function bucket(n) { return n >= 9 ? "9" : n >= 7 ? "7-8" : n >= 5 ? "5-6" : n >= 3 ? "3-4" : "0-2"; }
  function render(flash) {
    var r = st.r, a = D.i[Math.min(r, N - 0)], b = D.i[Math.min(r + 1, N)];
    var h = '<div class="hint"><b>' + D.t + "</b> · " + D.u + '</div><div class="hint">Streak: <b>' + st.r + "</b> of " + N + "</div>";
    var showUpTo = st.status === "play" ? r : (st.status === "won" ? N : r + 1);
    for (var i = 0; i <= Math.min(showUpTo, N); i++) {
      var it = D.i[i], pk = st.picks[i - 1], bad = st.status === "lost" && i === r + 1;
      h += '<div class="bigcard hl' + (i === Math.min(showUpTo, N) ? " cur" : "") + '" style="display:flex;justify-content:space-between;align-items:center"><span style="font-weight:600">' + it[0] + '</span><span style="font-family:var(--serif);font-weight:700;font-size:1.2rem">' + (i === 0 || i <= st.r || st.status !== "play" ? fmt(it[1]) : "?") + (i > 0 ? (bad ? " ❌" : " ✅") : "") + "</span></div>";
    }
    if (st.status === "play") {
      var nx = D.i[r + 1];
      h += '<div class="bigcard" style="text-align:center;border:2px dashed var(--line)"><div style="font-weight:700;font-size:1.15rem">' + nx[0] + '</div><div class="hint">' + D.q.replace("Which ", "Is ").replace(/\?$/, "") + " than <b>" + D.i[r][0] + "</b>?</div>";
      h += '<div class="ctrls"><button class="btn accent" data-p="h">⬆ Higher</button><button class="btn sec" data-p="l">⬇ Lower</button></div></div>';
    } else {
      h += '<div class="ctrls"><button class="btn accent" id="res">Results</button></div>';
    }
    app.innerHTML = h;
    Array.prototype.forEach.call(app.querySelectorAll("[data-p]"), function (b2) { b2.onclick = function () { pick(b2.dataset.p); }; });
    var rs = document.getElementById("res"); if (rs) rs.onclick = results;
  }
  function pick(p) {
    var r = st.r, cur = D.i[r][1], nx = D.i[r + 1][1], ok = (nx > cur) === (p === "h");
    st.picks.push(p);
    if (ok) { st.r++; if (st.r >= N) { st.status = "won"; PD.save(KEY, st); PD.record("hilo", date, true, bucket(st.r)); render(); PD.confetti(); setTimeout(results, 700); return; } PD.save(KEY, st); render(); }
    else { st.status = "lost"; PD.save(KEY, st); PD.record("hilo", date, st.r >= 5, bucket(st.r)); render(); setTimeout(results, 800); }
  }
  function text() { var s = ""; for (var i = 0; i < N; i++) s += i < st.r ? "🟩" : i === st.r && st.status === "lost" ? "🟥" : "⬜"; return "Hilo No. " + PD.number(date) + " · " + D.t + "\n" + s + " " + st.r + "/" + N; }
  function results() { PD.results("hilo", ["0-2", "3-4", "5-6", "7-8", "9"], bucket(st.r), text(), "Hilo"); }
  render();
  if (!PD.load("hl:seen", false)) { PD.save("hl:seen", true); setTimeout(function () { PD.modal(HELP); }, 300); }
})();
