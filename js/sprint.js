(function () {
  var HELP = "<h2>How to play Sprint</h2><p>You have <b>60 seconds</b> to answer as many sums as you can. Everyone gets the same questions each day, and they get tougher as you go.</p><p>Type the answer. It's checked as soon as you've typed enough digits, so there's no need to press enter. Stuck? <b>Pass</b> skips a question but costs 3 seconds.</p><p>You get <b>one run</b> per day, so warm up those fingers.</p>";
  var BK = ["0-9", "10-14", "15-19", "20-24", "25+"];
  var date = PD.init({ game: "sprint", title: "Sprint", help: HELP, dist: BK });
  var KEY = "sp:" + date, DUR = 60;
  var st = PD.load(KEY, { status: "ready", log: [], left: DUR });
  var rnd = PD.rng("sprint");
  function ri(a, b) { return a + Math.floor(rnd() * (b - a + 1)); }
  var Q = [];
  for (var k = 0; k < 200; k++) {
    var lvl = Math.min(4, Math.floor(k / 6)), t = ri(0, lvl < 1 ? 1 : 3), a, b, q, ans;
    if (t === 0) { a = ri(2 + lvl * 4, 12 + lvl * 18); b = ri(2 + lvl * 3, 9 + lvl * 15); q = a + " + " + b; ans = a + b; }
    else if (t === 1) { a = ri(8 + lvl * 6, 20 + lvl * 20); b = ri(2, a - 1); q = a + " − " + b; ans = a - b; }
    else if (t === 2) { a = ri(2, 6 + lvl * 2); b = ri(2, 9 + lvl); q = a + " × " + b; ans = a * b; }
    else { b = ri(2, 6 + lvl * 2); ans = ri(2, 9 + lvl); a = b * ans; q = a + " ÷ " + b; }
    Q.push([q, ans]);
  }
  var app = document.getElementById("app"), timer = null, input = "";
  function score() { return st.log.filter(function (x) { return x[1] === 1; }).length; }
  function bucket(n) { return n < 10 ? "0-9" : n < 15 ? "10-14" : n < 20 ? "15-19" : n < 25 ? "20-24" : "25+"; }
  function ring(left) { var c = 2 * Math.PI * 46; return '<div class="sp-clock"><svg viewBox="0 0 100 100"><circle class="bg" cx="50" cy="50" r="46"/><circle class="fg" cx="50" cy="50" r="46" stroke-dasharray="' + c + '" stroke-dashoffset="' + (c - c * left / DUR) + '"/></svg><b id="sec">' + Math.ceil(left) + "</b></div>"; }
  function render() {
    if (st.status === "ready") {
      app.innerHTML = '<div class="sp-intro"><div class="big">60</div><p class="muted" style="margin:6px 0 20px">seconds · mental maths · one run per day</p><button class="btn sun" id="go" style="min-width:200px;font-size:1.05rem">Start sprint</button><p class="hint" style="margin-top:16px">Tip: on a computer, use your number keys.</p></div>';
      document.getElementById("go").onclick = start; return;
    }
    if (st.status === "run") {
      var cur = Q[st.log.length];
      app.innerHTML = '<div class="sp-stage">' + ring(st.left) + '<div class="sp-score"><span>Correct <b id="ok">' + score() + '</b></span><span>Passed <b>' + st.log.filter(function (x) { return x[1] === 0; }).length + '</b></span></div><div class="sp-q" id="q">' + cur[0] + '</div><div class="sp-a" id="a" aria-live="polite">' + (input || "&nbsp;") + '</div><div class="sp-pad" id="pad"></div></div>';
      var pad = document.getElementById("pad");
      ["1", "2", "3", "4", "5", "6", "7", "8", "9", "⌫", "0", "Pass"].forEach(function (x) { var b = document.createElement("button"); b.textContent = x; if (x === "Pass") b.style.fontSize = "1rem"; b.onclick = function () { key(x === "⌫" ? "BACK" : x === "Pass" ? "PASS" : x); }; pad.appendChild(b); });
      return;
    }
    var n = score();
    app.innerHTML = '<div class="sp-intro" style="padding-bottom:4px"><div class="big">' + n + '</div><p class="muted" style="margin:6px 0 0">correct answers in 60 seconds</p></div><div class="sp-log">' +
      st.log.map(function (x) { var q = Q[x[0]]; return '<span class="' + (x[1] ? "ok" : "no") + '">' + q[0] + " = " + q[1] + (x[1] ? " ✓" : " ✗") + "</span>"; }).join("") + '</div><div class="ctrls"><button class="btn" id="res">See results</button></div>';
    document.getElementById("res").onclick = results;
  }
  function start() {
    st.status = "run"; st.left = DUR; st.log = []; st.started = Date.now(); PD.save(KEY, st); input = ""; render();
    var last = performance.now();
    timer = setInterval(function () {
      var now = performance.now(); st.left -= (now - last) / 1000; last = now;
      if (st.left <= 0) { st.left = 0; finish(); return; }
      var s = document.getElementById("sec"); if (s) s.textContent = Math.ceil(st.left);
      var fg = document.querySelector(".sp-clock .fg"); if (fg) { var c = 2 * Math.PI * 46; fg.setAttribute("stroke-dashoffset", c - c * st.left / DUR); }
      PD.save(KEY, st);
    }, 100);
  }
  function finish() {
    clearInterval(timer); st.status = "done"; PD.save(KEY, st);
    var n = score(); PD.record("sprint", date, n >= 10, bucket(n));
    if (n >= 20) PD.confetti();
    render(); setTimeout(results, 700);
  }
  function key(k) {
    if (st.status !== "run") return;
    var cur = Q[st.log.length], a = document.getElementById("a");
    if (k === "BACK") { input = input.slice(0, -1); a.innerHTML = input || "&nbsp;"; return; }
    if (k === "PASS") { st.log.push([st.log.length, 0]); st.left -= 3; input = ""; if (st.log.length >= Q.length) { finish(); return; } render(); return; }
    if (input.length >= 4) return;
    input += k; a.textContent = input;
    var want = String(cur[1]);
    if (input === want) {
      st.log.push([st.log.length, 1]); input = "";
      if (st.log.length >= Q.length) { finish(); return; }
      a.classList.add("ok");
      setTimeout(render, 120);
    } else if (input.length >= want.length) {
      a.classList.add("no");
      setTimeout(function () { input = ""; var el = document.getElementById("a"); if (el) { el.classList.remove("no"); el.innerHTML = "&nbsp;"; } }, 300);
    }
  }
  document.addEventListener("keydown", function (e) {
    if (document.querySelector(".overlay")) return;
    if (st.status === "ready" && e.key === "Enter") { start(); return; }
    if (/^[0-9]$/.test(e.key)) key(e.key);
    else if (e.key === "Backspace") key("BACK");
    else if (e.key === "Tab" && st.status === "run") { e.preventDefault(); key("PASS"); }
  });
  /* a run interrupted by leaving the page ends where it stopped */
  if (st.status === "run") { st.status = "done"; PD.save(KEY, st); if (!PD.done("sprint")[date]) PD.record("sprint", date, score() >= 10, bucket(score())); }
  function text() { var n = score(); return "Sprint No. " + PD.number(date) + " · " + n + " in 60s\n" + "⚡".repeat(Math.min(10, Math.round(n / 3))) + (n >= 25 ? " 🏆" : ""); }
  function results() { PD.results("sprint", BK, bucket(score()), text(), "Sprint"); }
  render();
  if (st.status === "done") setTimeout(results, 400);
})();
