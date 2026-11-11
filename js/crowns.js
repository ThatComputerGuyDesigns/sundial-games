(function () {
  var HELP = "<h2>How to play Crowns</h2><p>Place one <b>crown</b> in every row, every column and every coloured region.</p><p>Crowns can't <b>touch</b> each other, not even diagonally.</p><p>Tap a square once to mark it with a <b>×</b> (a note that no crown goes there), and again to place a crown. Drag across squares to mark several at once.</p><p>Every puzzle has exactly one solution and can be solved by logic alone. Boards grow from 6×6 on Monday to 9×9 at the weekend.</p>";
  var BK = ["<1m", "1-2m", "2-4m", "4-8m", "8m+"];
  var date = PD.init({ game: "crowns", title: "Crowns", help: HELP, dist: BK });
  var P = CROWNS[PD.index(date, CROWNS.length)];
  var N = Math.round(Math.sqrt(P[0].length));
  var REG = P[0].split("").map(function (c) { return c.charCodeAt(0) - 97; });
  var COLS = ["#f4b39a", "#b9d7a1", "#a7c7ec", "#f2dd8b", "#d3b6e6", "#f6c1d6", "#a9dfd8", "#e3c9a8", "#c7cbd1", "#f7d1a1"];
  var KEY = "cr:" + date;
  var st = PD.load(KEY, { b: Array(N * N).fill(0), t: 0, status: "play", hist: [] });
  var app = document.getElementById("app");
  app.innerHTML = '<div class="gbar"><span>' + N + "×" + N + ' · one per row, column &amp; colour</span><span class="timer" id="tm">0:00</span></div><div class="cr-board" id="bd" role="grid" aria-label="Crowns board"></div>' +
    '<div class="gtools"><button class="btn ghost" id="undo">Undo</button><button class="btn ghost" id="clr">Clear</button><button class="btn ghost" id="hint">Hint</button></div><div id="after"></div>';
  var bd = document.getElementById("bd");
  bd.style.gridTemplateColumns = "repeat(" + N + ",1fr)";
  PD.timer(st, "t", document.getElementById("tm"), function () { return st.status === "play"; });
  setInterval(function () { if (st.status === "play") PD.save(KEY, st); }, 3000);
  var CROWN = '<svg class="cw" viewBox="0 0 48 48"><path d="M7 36l-2-22 11 9 8-14 8 14 11-9-2 22z" fill="currentColor" stroke="currentColor" stroke-width="2" stroke-linejoin="round"/><rect x="7" y="38" width="34" height="4" rx="1.5" fill="currentColor"/></svg>';
  var XM = '<svg class="xm" viewBox="0 0 10 10"><path d="M1 1l8 8M9 1L1 9" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"/></svg>';

  var cells = [];
  for (var i = 0; i < N * N; i++) {
    var r = Math.floor(i / N), c = i % N;
    var b = document.createElement("button");
    b.className = "cr-c" + (c < N - 1 && REG[i] !== REG[i + 1] ? " bR" : "") + (r < N - 1 && REG[i] !== REG[i + N] ? " bB" : "");
    if (c === N - 1) b.style.borderRight = "0";
    if (r === N - 1) b.style.borderBottom = "0";
    b.style.background = COLS[REG[i] % COLS.length];
    b.dataset.i = i;
    bd.appendChild(b); cells.push(b);
  }
  function conflicts() {
    var bad = {}, q = [];
    st.b.forEach(function (v, i) { if (v === 2) q.push(i); });
    for (var a = 0; a < q.length; a++) for (var b2 = a + 1; b2 < q.length; b2++) {
      var i = q[a], j = q[b2], ri = Math.floor(i / N), ci = i % N, rj = Math.floor(j / N), cj = j % N;
      if (ri === rj || ci === cj || REG[i] === REG[j] || (Math.abs(ri - rj) <= 1 && Math.abs(ci - cj) <= 1)) { bad[i] = bad[j] = 1; }
    }
    return bad;
  }
  function paint() {
    var bad = conflicts();
    cells.forEach(function (b, i) {
      var v = st.b[i];
      b.innerHTML = v === 2 ? CROWN : v === 1 ? XM : "";
      b.classList.toggle("err", !!bad[i]);
      var r = Math.floor(i / N) + 1, c = i % N + 1;
      b.setAttribute("aria-label", "Row " + r + ", column " + c + ": " + (v === 2 ? "crown" : v === 1 ? "marked" : "empty"));
    });
    var tools = document.querySelector(".gtools"); tools.style.display = st.status === "play" ? "" : "none";
    if (st.status !== "play") {
      bd.classList.add("cr-win");
      document.getElementById("after").innerHTML = '<div class="done-card"><h3>All crowns placed</h3><p>Solved in ' + PD.fmtTime(st.t) + '</p><button class="btn" id="res">See results</button></div>';
      document.getElementById("res").onclick = results;
    }
  }
  function set(i, v, rec) {
    if (st.b[i] === v) return;
    if (rec !== false) st.hist.push([i, st.b[i]]);
    st.b[i] = v;
  }
  function check() {
    var q = st.b.filter(function (v) { return v === 2; }).length;
    if (q === N && !Object.keys(conflicts()).length) {
      st.status = "won"; PD.save(KEY, st);
      PD.record("crowns", date, true, bucket(st.t));
      PD.confetti(); paint(); setTimeout(results, 900);
    }
  }
  function bucket(t) { return t < 60 ? "<1m" : t < 120 ? "1-2m" : t < 240 ? "2-4m" : t < 480 ? "4-8m" : "8m+"; }
  /* pointer: tap cycles, drag marks × */
  var drag = null;
  bd.addEventListener("pointerdown", function (e) {
    var b = e.target.closest(".cr-c"); if (!b || st.status !== "play") return;
    drag = { start: +b.dataset.i, moved: false, seen: {} };
    try { bd.setPointerCapture(e.pointerId); } catch (x) {}
  });
  bd.addEventListener("pointermove", function (e) {
    if (!drag) return;
    var el = document.elementFromPoint(e.clientX, e.clientY), b = el && el.closest && el.closest(".cr-c");
    if (!b) return;
    var i = +b.dataset.i;
    if (i !== drag.start || drag.moved) {
      if (!drag.moved) { drag.moved = true; if (st.b[drag.start] === 0) set(drag.start, 1); }
      if (!drag.seen[i] && st.b[i] === 0) { set(i, 1); drag.seen[i] = 1; paint(); }
    }
  });
  function up() {
    if (!drag) return;
    if (!drag.moved) { var i = drag.start; set(i, (st.b[i] + 1) % 3); paint(); check(); }
    else paint();
    drag = null; PD.save(KEY, st);
  }
  bd.addEventListener("pointerup", up); bd.addEventListener("pointercancel", function () { drag = null; });
  bd.addEventListener("keydown", function (e) {
    var b = e.target.closest(".cr-c"); if (!b) return;
    var i = +b.dataset.i, m = { ArrowLeft: -1, ArrowRight: 1, ArrowUp: -N, ArrowDown: N }[e.key];
    if (m) { e.preventDefault(); var j = i + m; if (j >= 0 && j < N * N && !((m === 1 && j % N === 0) || (m === -1 && i % N === 0))) cells[j].focus(); }
    if (e.key === "Enter" || e.key === " ") { e.preventDefault(); if (st.status === "play") { set(i, (st.b[i] + 1) % 3); paint(); check(); PD.save(KEY, st); } }
  });
  document.getElementById("undo").onclick = function () { var h = st.hist.pop(); if (h) { st.b[h[0]] = h[1]; paint(); PD.save(KEY, st); } };
  document.getElementById("clr").onclick = function () { if (confirm("Clear the board?")) { st.b = Array(N * N).fill(0); st.hist = []; paint(); PD.save(KEY, st); } };
  document.getElementById("hint").onclick = function () {
    var sol = P[1].split("").map(Number);
    for (var r = 0; r < N; r++) {
      var i = r * N + sol[r];
      if (st.b[i] !== 2) { set(i, 2); st.t += 15; PD.toast("A crown is placed for you (+15s)"); paint(); check(); PD.save(KEY, st); return; }
    }
  };
  function text() { return "Crowns No. " + PD.number(date) + " · " + N + "×" + N + "\n👑 " + PD.fmtTime(st.t); }
  function results() { PD.results("crowns", BK, bucket(st.t), text(), "Crowns"); }
  paint();
  if (!PD.load("cr:seen", false)) { PD.save("cr:seen", true); setTimeout(function () { PD.modal(HELP, null, "help"); }, 300); }
})();
