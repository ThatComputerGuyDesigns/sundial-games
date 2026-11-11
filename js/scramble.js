(function () {
  var HELP = "<h2>How to play Scramble</h2><p>Five words have been jumbled, from <b>four letters</b> up to <b>eight</b>. Tap the tiles (or type) to spell each word. Any real word that uses every letter counts.</p><p>Stuck? <b>Hint</b> locks in the next correct letter (it costs 10 seconds). <b>Skip</b> gives up on a word.</p><p>Your clock runs the whole time. Fewest skips, fastest time.</p>";
  var BK = [5, 4, 3, 2, 1, 0];
  var date = PD.init({ game: "scramble", title: "Scramble", help: HELP, dist: BK });
  var R = SCRAMBLE[PD.index(date, SCRAMBLE.length)];
  var KEY = "sc:" + date;
  var st = PD.load(KEY, { i: 0, res: [], t: 0, hints: 0, status: "play" });
  var app = document.getElementById("app");
  var pick = [], locked = 0, order = null;

  app.innerHTML = '<div class="sc-meta"><span id="rd"></span><span class="timer" id="tm">0:00</span></div><div class="sc-steps" id="steps"></div><div id="stage" style="width:100%"></div>';
  PD.timer(st, "t", document.getElementById("tm"), function () { return st.status === "play"; });
  setInterval(function () { if (st.status === "play") PD.save(KEY, st); }, 3000);

  function target() { return R[st.i][1][0]; }
  function letters() { return R[st.i][0].split(""); }
  function render() {
    document.getElementById("steps").innerHTML = R.map(function (_, i) { var r = st.res[i]; return '<i class="' + (r === 1 ? "ok" : r === 0 ? "sk" : i === st.i && st.status === "play" ? "cur" : "") + '"></i>'; }).join("");
    if (st.status !== "play") return renderDone();
    document.getElementById("rd").textContent = "Word " + (st.i + 1) + " of 5 · " + R[st.i][0].length + " letters";
    if (!order) order = letters().map(function (l, k) { return k; });
    var L = letters(), n = L.length;
    var slots = "", tiles = "";
    for (var k = 0; k < n; k++) {
      var ch = pick[k] != null ? L[pick[k]] : "";
      slots += '<span class="sc-t slot' + (ch ? " f" : "") + (k < locked ? " hint" : "") + '">' + ch + "</span>";
    }
    order.forEach(function (k) { tiles += '<button class="sc-t' + (pick.indexOf(k) >= 0 ? " used" : "") + '" data-k="' + k + '"' + (pick.indexOf(k) >= 0 ? " disabled" : "") + ">" + L[k] + "</button>"; });
    document.getElementById("stage").innerHTML =
      '<div class="sc-tiles sc-ans" id="ans">' + slots + '</div><div class="sc-tiles" id="tiles">' + tiles + "</div>" +
      '<div class="ctrls"><button class="btn ghost" id="shuf">⟳ Shuffle</button><button class="btn ghost" id="clr">Clear</button></div>' +
      '<div class="ctrls"><button class="btn ghost" id="hint">Hint (+10s)</button><button class="btn ghost danger" id="skip">Skip word</button></div>';
    Array.prototype.forEach.call(document.querySelectorAll("#tiles .sc-t"), function (b) { b.onclick = function () { add(+b.dataset.k); }; });
    document.getElementById("shuf").onclick = function () { order = PD.shuffle(order); render(); };
    document.getElementById("clr").onclick = function () { pick = pick.slice(0, locked); render(); };
    document.getElementById("hint").onclick = hint;
    document.getElementById("skip").onclick = function () { if (confirm("Skip this word? It will count as missed.")) next(0); };
  }
  function add(k) {
    if (pick.indexOf(k) >= 0) return;
    pick.push(k); render();
    var L = letters();
    if (pick.length === L.length) {
      var w = pick.map(function (i) { return L[i]; }).join("");
      if (R[st.i][1].indexOf(w) >= 0) {
        document.getElementById("ans").classList.add("win");
        setTimeout(function () { next(1); }, 650);
      } else {
        var a = document.getElementById("ans"); a.classList.add("shake");
        PD.toast("Not a word we know");
        setTimeout(function () { pick = pick.slice(0, locked); render(); }, 420);
      }
    }
  }
  function back() { if (pick.length > locked) { pick.pop(); render(); } }
  function hint() {
    var L = letters(), t = target();
    if (locked >= L.length - 1) return;
    pick = pick.slice(0, locked);
    var need = t[locked];
    for (var k = 0; k < L.length; k++) if (L[k] === need && pick.indexOf(k) < 0) { pick.push(k); break; }
    locked++; st.hints++; st.t += 10; PD.save(KEY, st); render();
  }
  function next(ok) {
    st.res[st.i] = ok; st.i++; pick = []; locked = 0; order = null;
    if (st.i >= R.length) {
      st.status = "done";
      var n = solved();
      PD.record("scramble", date, n >= 3, n);
      if (n === 5) PD.confetti();
      setTimeout(results, 600);
    }
    PD.save(KEY, st); render();
  }
  function solved() { return st.res.filter(function (x) { return x === 1; }).length; }
  function renderDone() {
    document.getElementById("rd").textContent = "Finished · " + solved() + "/5";
    document.getElementById("stage").innerHTML = '<div class="sc-done">' + R.map(function (r, i) { return "<div>" + r[1][0] + "<span>" + (st.res[i] === 1 ? "✓ solved" : "✗ skipped") + (r[1].length > 1 ? " · also " + r[1].slice(1).join(", ") : "") + "</span></div>"; }).join("") + '</div><div class="ctrls"><button class="btn" id="res">See results</button></div>';
    document.getElementById("res").onclick = results;
  }
  function text() { return "Scramble No. " + PD.number(date) + " · " + solved() + "/5 in " + PD.fmtTime(st.t) + "\n" + st.res.map(function (r) { return r === 1 ? "🟩" : "🟥"; }).join("") + (st.hints ? " 💡×" + st.hints : ""); }
  function results() { PD.results("scramble", BK, solved(), text(), "Scramble"); }
  document.addEventListener("keydown", function (e) {
    if (st.status !== "play" || e.ctrlKey || e.metaKey || e.altKey || document.querySelector(".overlay")) return;
    if (e.key === "Backspace") { e.preventDefault(); back(); return; }
    if (/^[a-zA-Z]$/.test(e.key)) {
      var L = letters(), ch = e.key.toLowerCase();
      for (var k = 0; k < L.length; k++) if (L[k] === ch && pick.indexOf(k) < 0) { add(k); return; }
    }
  });
  render();
  if (st.status !== "play") setTimeout(results, 400);
  if (!PD.load("sc:seen", false)) { PD.save("sc:seen", true); setTimeout(function () { PD.modal(HELP, null, "help"); }, 300); }
})();
