(function () {
  var HELP = "<h2>How to play Sweep</h2><p>Uncover every safe square without digging up a mine. Each number tells you how many mines touch that square, including diagonally.</p><p>The board opens from the outlined start square. From there, <b>every move can be worked out by logic</b>. No coin-flip guesses, ever.</p><p><b>Dig</b> mode uncovers squares; <b>Flag</b> mode marks mines. You can also long-press or right-click to flag. Tap a number whose mines are all flagged to clear its neighbours.</p><p>You have <b>three lives</b> for slips of the finger.</p>";
  var BK = ["<1m", "1-2m", "2-4m", "4m+", "X"];
  var date = PD.init({ game: "sweep", title: "Sweep", help: HELP, dist: BK });
  var P = SWEEP[PD.index(date, SWEEP.length)], W = P.w, H = P.h, M = P.m.length;
  var MINE = {}; P.m.forEach(function (i) { MINE[i] = 1; });
  var KEY = "sw:" + date;
  var st = PD.load(KEY, { o: [], f: [], t: 0, lives: 3, boom: [], status: "play" });
  var OPEN = {}, FLAG = {}; st.o.forEach(function (i) { OPEN[i] = 1; }); st.f.forEach(function (i) { FLAG[i] = 1; });
  var flagMode = false;
  function nb(i) { var r = Math.floor(i / W), c = i % W, o = []; for (var a = -1; a <= 1; a++) for (var b = -1; b <= 1; b++) { if (!a && !b) continue; var rr = r + a, cc = c + b; if (rr >= 0 && rr < H && cc >= 0 && cc < W) o.push(rr * W + cc); } return o; }
  var NUM = []; for (var i = 0; i < W * H; i++) NUM.push(nb(i).filter(function (j) { return MINE[j]; }).length);
  var FLAGSVG = '<svg viewBox="0 0 24 24"><path d="M6 21V3" stroke="#1b1813" stroke-width="2.2" stroke-linecap="round"/><path d="M6 4h12l-3 4 3 4H6z" fill="#d0453a"/></svg>';
  var MINESVG = '<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="6" fill="#1b1813"/><path d="M12 2v4M12 18v4M2 12h4M18 12h4M5 5l3 3M16 16l3 3M5 19l3-3M16 8l3-3" stroke="#1b1813" stroke-width="2" stroke-linecap="round"/></svg>';
  var app = document.getElementById("app");
  app.innerHTML = '<div class="gbar"><span id="lives"></span><span id="left"></span><span class="timer" id="tm">0:00</span></div>' +
    '<div class="sw-board" id="bd" style="grid-template-columns:repeat(' + W + ',1fr)" role="grid" aria-label="Minefield"></div>' +
    '<div class="px-mode" role="group" aria-label="Tool" style="margin-top:14px"><button id="mdig" aria-pressed="true">⛏ Dig</button><button id="mflag" aria-pressed="false">🚩 Flag</button></div><div id="after" style="width:100%"></div>';
  var bd = document.getElementById("bd");
  PD.timer(st, "t", document.getElementById("tm"), function () { return st.status === "play"; });
  setInterval(function () { if (st.status === "play") save(); }, 3000);
  var cells = [];
  for (i = 0; i < W * H; i++) { var b = document.createElement("button"); b.className = "sw-c"; b.dataset.i = i; bd.appendChild(b); cells.push(b); }
  function save() { st.o = Object.keys(OPEN).map(Number); st.f = Object.keys(FLAG).map(Number); PD.save(KEY, st); }
  function flood(i) {
    var stack = [i];
    while (stack.length) { var x = stack.pop(); if (OPEN[x] || FLAG[x]) continue; OPEN[x] = 1; if (NUM[x] === 0) nb(x).forEach(function (j) { if (!OPEN[j]) stack.push(j); }); }
  }
  if (!st.o.length) { flood(P.s); save(); }
  function paint() {
    var lost = st.status === "lost";
    cells.forEach(function (b, i) {
      var o = OPEN[i], cls = "sw-c";
      if (o) { cls += " o" + (NUM[i] ? " n" + NUM[i] : ""); b.innerHTML = NUM[i] || ""; }
      else if (st.boom.indexOf(i) >= 0) { cls += " boom"; b.innerHTML = MINESVG; }
      else if (FLAG[i]) b.innerHTML = FLAGSVG;
      else if ((lost || st.status === "won") && MINE[i]) b.innerHTML = st.status === "won" ? FLAGSVG : MINESVG;
      else b.innerHTML = "";
      if (i === P.s) cls += " start";
      b.className = cls;
      b.setAttribute("aria-label", "Row " + (Math.floor(i / W) + 1) + " column " + (i % W + 1) + ": " + (o ? (NUM[i] || "clear") : FLAG[i] ? "flagged" : "covered"));
    });
    var hearts = ""; for (var k = 0; k < 3; k++) hearts += k < st.lives ? "❤️" : "🤍";
    document.getElementById("lives").textContent = hearts;
    document.getElementById("left").textContent = "💣 " + (M - Object.keys(FLAG).length - st.boom.length);
    document.getElementById("mdig").setAttribute("aria-pressed", !flagMode);
    document.getElementById("mflag").setAttribute("aria-pressed", flagMode);
    if (st.status !== "play") {
      document.querySelector(".px-mode").style.display = "none";
      document.getElementById("after").innerHTML = '<div class="done-card"><h3>' + (st.status === "won" ? "Field cleared" : "Out of lives") + "</h3><p>" + (st.status === "won" ? "Swept in " + PD.fmtTime(st.t) + (st.lives < 3 ? " with " + st.lives + " li" + (st.lives > 1 ? "ves" : "fe") + " left" : ", flawless") : "The mines are shown above. Try again tomorrow.") + '</p><button class="btn" id="res">See results</button></div>';
      document.getElementById("res").onclick = results;
    }
  }
  function dig(i) {
    if (st.status !== "play" || FLAG[i]) return;
    if (OPEN[i]) {
      if (!NUM[i]) return;
      var n = nb(i), fl = n.filter(function (j) { return FLAG[j] || st.boom.indexOf(j) >= 0; }).length;
      if (fl === NUM[i]) n.forEach(function (j) { if (!OPEN[j] && !FLAG[j] && st.boom.indexOf(j) < 0) dig(j); });
      return;
    }
    if (MINE[i]) {
      st.lives--; st.boom.push(i);
      if (navigator.vibrate) try { navigator.vibrate(120); } catch (e) {}
      PD.toast(st.lives ? "Boom! " + st.lives + " li" + (st.lives > 1 ? "ves" : "fe") + " left" : "Boom!");
      if (!st.lives) { st.status = "lost"; save(); PD.record("sweep", date, false, "X"); paint(); setTimeout(results, 1000); }
      return;
    }
    flood(i);
  }
  function flag(i) { if (st.status !== "play" || OPEN[i] || st.boom.indexOf(i) >= 0) return; if (FLAG[i]) delete FLAG[i]; else FLAG[i] = 1; }
  function after() {
    var safe = W * H - M;
    if (st.status === "play" && Object.keys(OPEN).length === safe) {
      st.status = "won"; save(); PD.record("sweep", date, true, bucket(st.t)); PD.confetti(); paint(); setTimeout(results, 900); return;
    }
    save(); paint();
  }
  function bucket(t) { return t < 60 ? "<1m" : t < 120 ? "1-2m" : t < 240 ? "2-4m" : "4m+"; }
  var press = null;
  bd.addEventListener("pointerdown", function (e) {
    var b = e.target.closest(".sw-c"); if (!b) return;
    if (e.button === 2) return;
    var i = +b.dataset.i;
    press = { i: i, long: false, tm: setTimeout(function () { press.long = true; flag(i); after(); if (navigator.vibrate) try { navigator.vibrate(30); } catch (x) {} }, 420) };
  });
  bd.addEventListener("pointerup", function (e) {
    if (!press) return; clearTimeout(press.tm);
    if (!press.long) { if (flagMode && !OPEN[press.i]) flag(press.i); else dig(press.i); after(); }
    press = null;
  });
  bd.addEventListener("pointerleave", function () { if (press) { clearTimeout(press.tm); press = null; } });
  bd.addEventListener("contextmenu", function (e) { e.preventDefault(); var b = e.target.closest(".sw-c"); if (b) { flag(+b.dataset.i); after(); } });
  bd.addEventListener("keydown", function (e) {
    var b = e.target.closest(".sw-c"); if (!b) return;
    var i = +b.dataset.i, m = { ArrowLeft: -1, ArrowRight: 1, ArrowUp: -W, ArrowDown: W }[e.key];
    if (m) { e.preventDefault(); var j = i + m; if (j >= 0 && j < W * H) cells[j].focus(); }
    if (e.key === "Enter" || e.key === " ") { e.preventDefault(); dig(i); after(); }
    if (e.key === "f" || e.key === "F") { flag(i); after(); }
  });
  document.getElementById("mdig").onclick = function () { flagMode = false; paint(); };
  document.getElementById("mflag").onclick = function () { flagMode = true; paint(); };
  function text() { return "Sweep No. " + PD.number(date) + " · " + (st.status === "won" ? PD.fmtTime(st.t) : "X") + "\n" + "❤️".repeat(st.lives) + "🤍".repeat(3 - st.lives) + (st.status === "won" ? " 🚩 cleared" : " 💥"); }
  function results() { PD.results("sweep", BK, st.status === "won" ? bucket(st.t) : "X", text(), "Sweep"); }
  paint();
  if (!PD.load("sw:seen", false)) { PD.save("sw:seen", true); setTimeout(function () { PD.modal(HELP, null, "help"); }, 300); }
})();
