(function () {
  var HELP = "<h2>How to play Duo</h2><p>Fill every square with a <b>sun</b> or a <b>moon</b>.</p><ul><li>Each row and column holds <b>three suns and three moons</b>.</li><li>No more than <b>two</b> of the same symbol may sit next to each other in a line.</li><li>Squares joined by <b>=</b> are the same. Squares joined by <b>×</b> are opposite.</li></ul><p>Tap once for a sun, twice for a moon, three times to clear. There's exactly one solution, no guessing needed.</p>";
  var BK = ["<1m", "1-2m", "2-3m", "3-5m", "5m+"];
  var date = PD.init({ game: "duo", title: "Duo", help: HELP, dist: BK });
  var P = DUO[PD.index(date, DUO.length)];
  var KEY = "du:" + date;
  var GIV = P.g.split("").map(function (c) { return c === "." ? -1 : +c; });
  var st = PD.load(KEY, { b: GIV.slice(), t: 0, status: "play", hist: [] });
  var SUN = '<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="5.2" fill="#f59f00"/><g stroke="#f59f00" stroke-width="2.2" stroke-linecap="round"><path d="M12 1.8v2.6M12 19.6v2.6M1.8 12h2.6M19.6 12h2.6M4.8 4.8l1.8 1.8M17.4 17.4l1.8 1.8M4.8 19.2l1.8-1.8M17.4 6.6l1.8-1.8"/></g></svg>';
  var MOON = '<svg viewBox="0 0 24 24"><path d="M20 14.5A8.5 8.5 0 1 1 9.5 4a7 7 0 0 0 10.5 10.5z" fill="#4c6ef5"/></svg>';
  var app = document.getElementById("app");
  app.innerHTML = '<div class="gbar"><span>Balance every line</span><span class="timer" id="tm">0:00</span></div><div class="duo-board" id="bd" role="grid" aria-label="Duo board"></div>' +
    '<div class="gtools"><button class="btn ghost" id="undo">Undo</button><button class="btn ghost" id="clr">Clear</button><button class="btn ghost" id="hint">Hint</button></div><div id="after"></div>';
  var bd = document.getElementById("bd");
  PD.timer(st, "t", document.getElementById("tm"), function () { return st.status === "play"; });
  setInterval(function () { if (st.status === "play") PD.save(KEY, st); }, 3000);
  var cells = [];
  for (var i = 0; i < 36; i++) {
    var b = document.createElement("button");
    b.className = "duo-c" + (GIV[i] >= 0 ? " fix" : "");
    if (i >= 30) b.style.borderBottom = "0";
    b.dataset.i = i;
    b.onclick = (function (i) { return function () { tap(i); }; })(i);
    bd.appendChild(b); cells.push(b);
  }
  P.e.forEach(function (e) {
    var a = e[0], c = e[1], s = document.createElement("span");
    s.className = "duo-sign"; s.textContent = e[2] ? "=" : "×"; s.setAttribute("aria-hidden", "true");
    var ra = Math.floor(a / 6), ca = a % 6;
    if (c === a + 1) { s.style.left = ((ca + 1) / 6 * 100) + "%"; s.style.top = ((ra + 0.5) / 6 * 100) + "%"; }
    else { s.style.left = ((ca + 0.5) / 6 * 100) + "%"; s.style.top = ((ra + 1) / 6 * 100) + "%"; }
    bd.appendChild(s);
  });
  function errors() {
    var bad = {}, B = st.b;
    function line(idx) {
      var v = idx.map(function (i) { return B[i]; });
      for (var k = 0; k < 4; k++) if (v[k] >= 0 && v[k] === v[k + 1] && v[k] === v[k + 2]) { bad[idx[k]] = bad[idx[k + 1]] = bad[idx[k + 2]] = 1; }
      [0, 1].forEach(function (s) { if (v.filter(function (x) { return x === s; }).length > 3) idx.forEach(function (i) { if (B[i] === s) bad[i] = 1; }); });
    }
    for (var r = 0; r < 6; r++) line([0, 1, 2, 3, 4, 5].map(function (c) { return r * 6 + c; }));
    for (var c = 0; c < 6; c++) line([0, 1, 2, 3, 4, 5].map(function (r) { return r * 6 + c; }));
    P.e.forEach(function (e) { if (B[e[0]] >= 0 && B[e[1]] >= 0 && ((B[e[0]] === B[e[1]]) !== !!e[2])) bad[e[0]] = bad[e[1]] = 1; });
    return bad;
  }
  function paint() {
    var bad = errors();
    cells.forEach(function (b, i) {
      var v = st.b[i];
      b.innerHTML = v === 0 ? SUN : v === 1 ? MOON : "";
      b.classList.toggle("err", !!bad[i]);
      b.setAttribute("aria-label", "Row " + (Math.floor(i / 6) + 1) + ", column " + (i % 6 + 1) + ": " + (v === 0 ? "sun" : v === 1 ? "moon" : "empty") + (GIV[i] >= 0 ? " (given)" : ""));
    });
    document.querySelector(".gtools").style.display = st.status === "play" ? "" : "none";
    if (st.status !== "play") {
      bd.classList.add("win");
      document.getElementById("after").innerHTML = '<div class="done-card"><h3>Perfect balance</h3><p>Solved in ' + PD.fmtTime(st.t) + '</p><button class="btn" id="res">See results</button></div>';
      document.getElementById("res").onclick = results;
    }
  }
  function tap(i) {
    if (st.status !== "play" || GIV[i] >= 0) return;
    st.hist.push([i, st.b[i]]);
    st.b[i] = st.b[i] === -1 ? 0 : st.b[i] === 0 ? 1 : -1;
    paint(); check(); PD.save(KEY, st);
  }
  function check() {
    if (st.b.indexOf(-1) >= 0 || Object.keys(errors()).length) return;
    st.status = "won"; PD.save(KEY, st);
    PD.record("duo", date, true, bucket(st.t)); PD.confetti(); paint(); setTimeout(results, 900);
  }
  function bucket(t) { return t < 60 ? "<1m" : t < 120 ? "1-2m" : t < 180 ? "2-3m" : t < 300 ? "3-5m" : "5m+"; }
  document.getElementById("undo").onclick = function () { var h = st.hist.pop(); if (h) { st.b[h[0]] = h[1]; paint(); PD.save(KEY, st); } };
  document.getElementById("clr").onclick = function () { if (confirm("Clear the board?")) { st.b = GIV.slice(); st.hist = []; paint(); PD.save(KEY, st); } };
  document.getElementById("hint").onclick = function () {
    var S = P.s.split("").map(Number);
    for (var i = 0; i < 36; i++) if (st.b[i] !== -1 && st.b[i] !== S[i]) { PD.toast("Row " + (Math.floor(i / 6) + 1) + ", column " + (i % 6 + 1) + " isn't right"); cells[i].focus(); return; }
    for (i = 0; i < 36; i++) if (st.b[i] === -1) { st.hist.push([i, -1]); st.b[i] = S[i]; st.t += 10; PD.toast("Filled one square for you (+10s)"); paint(); check(); PD.save(KEY, st); return; }
  };
  function text() { return "Duo No. " + PD.number(date) + "\n☀️🌙 " + PD.fmtTime(st.t); }
  function results() { PD.results("duo", BK, bucket(st.t), text(), "Duo"); }
  paint();
  if (!PD.load("du:seen", false)) { PD.save("du:seen", true); setTimeout(function () { PD.modal(HELP, null, "help"); }, 300); }
})();
