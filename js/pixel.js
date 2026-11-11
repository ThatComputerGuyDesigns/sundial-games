(function () {
  var HELP = "<h2>How to play Pixel</h2><p>Paint squares to reveal a hidden picture. The numbers beside each <b>row</b> and above each <b>column</b> give the lengths of the painted runs in that line, in order.</p><p>For example, <b>3 1</b> means a run of three painted squares, at least one gap, then a single square.</p><p>Use <b>Paint</b> mode to fill and <b>Cross</b> mode to mark squares you know are empty. Drag to paint several squares at once.</p><p>Every picture can be solved by logic alone, line by line.</p>";
  var BK = ["<2m", "2-4m", "4-7m", "7-12m", "12m+"];
  var date = PD.init({ game: "pixel", title: "Pixel", help: HELP, dist: BK });
  var P = PIXEL[PD.index(date, PIXEL.length)], N = P.n, SOL = P.g.split("").map(Number);
  var KEY = "px:" + date;
  var st = PD.load(KEY, { b: Array(N * N).fill(0), t: 0, status: "play", hist: [] });
  var mode = 1;
  var app = document.getElementById("app");
  app.style.maxWidth = "520px";
  function runs(a) { var o = [], r = 0; a.forEach(function (v) { if (v === 1) r++; else if (r) { o.push(r); r = 0; } }); if (r) o.push(r); return o.length ? o : [0]; }
  function rowOf(arr, r) { return arr.slice(r * N, r * N + N); }
  function colOf(arr, c) { var o = []; for (var r = 0; r < N; r++) o.push(arr[r * N + c]); return o; }
  var RC = [], CC = [];
  for (var k = 0; k < N; k++) { RC.push(runs(rowOf(SOL, k))); CC.push(runs(colOf(SOL, k))); }
  var maxR = Math.max.apply(null, RC.map(function (x) { return x.length; }));
  app.innerHTML = '<div class="gbar"><span>' + N + "×" + N + ' picture</span><span class="timer" id="tm">0:00</span></div>' +
    '<div class="px-mode" role="group" aria-label="Tool"><button id="m1" aria-pressed="true"><i></i>Paint</button><button id="m2" aria-pressed="false"><i class="xx"></i>Cross</button></div>' +
    '<div class="px-wrap" id="wrap"></div><div class="gtools"><button class="btn ghost" id="undo">Undo</button><button class="btn ghost" id="clr">Clear</button><button class="btn ghost" id="chk">Check</button></div><div id="after" style="width:100%"></div>';
  var wrap = document.getElementById("wrap");
  var lab = Math.max(1.6, maxR * 1.05);
  wrap.style.gridTemplateColumns = lab + "fr " + N + "fr";
  PD.timer(st, "t", document.getElementById("tm"), function () { return st.status === "play"; });
  setInterval(function () { if (st.status === "play") PD.save(KEY, st); }, 3000);
  var h = "<div></div><div style=\"display:grid;grid-template-columns:repeat(" + N + ',1fr)">';
  for (k = 0; k < N; k++) h += '<div class="px-colc" id="cc' + k + '">' + CC[k].map(function (x) { return "<span>" + x + "</span>"; }).join("") + "</div>";
  h += '</div><div style="display:grid;grid-template-rows:repeat(' + N + ',1fr)">';
  for (k = 0; k < N; k++) h += '<div class="px-rowc" id="rc' + k + '">' + RC[k].map(function (x) { return "<span>" + x + "</span>"; }).join("") + "</div>";
  h += '</div><div class="px-grid" id="grid" style="grid-template-columns:repeat(' + N + ',1fr)">';
  for (var i = 0; i < N * N; i++) {
    var r = Math.floor(i / N), c = i % N;
    h += '<button class="px-c' + (c % 5 === 4 && c < N - 1 ? " g5r" : "") + (r % 5 === 4 && r < N - 1 ? " g5b" : "") + '" data-i="' + i + '" aria-label="Row ' + (r + 1) + " column " + (c + 1) + '"></button>';
  }
  wrap.innerHTML = h + "</div>";
  var grid = document.getElementById("grid"), cells = grid.children;
  grid.style.setProperty("--pc", P.c);
  function eqArr(a, b) { return a.length === b.length && a.every(function (x, i) { return x === b[i]; }); }
  function paint() {
    for (var i = 0; i < N * N; i++) { cells[i].className = cells[i].className.replace(/ ?\b(on|x)\b/g, "") + (st.b[i] === 1 ? " on" : st.b[i] === 2 ? " x" : ""); }
    for (var k = 0; k < N; k++) {
      document.getElementById("rc" + k).classList.toggle("ok", eqArr(runs(rowOf(st.b, k)), RC[k]));
      document.getElementById("cc" + k).classList.toggle("ok", eqArr(runs(colOf(st.b, k)), CC[k]));
    }
    document.getElementById("m1").setAttribute("aria-pressed", mode === 1);
    document.getElementById("m2").setAttribute("aria-pressed", mode === 2);
    if (st.status !== "play") {
      wrap.classList.add("px-win");
      document.querySelector(".px-mode").style.display = "none"; document.querySelector(".gtools").style.display = "none";
      document.getElementById("after").innerHTML = '<div class="done-card"><h3>Picture revealed</h3><p>Painted in ' + PD.fmtTime(st.t) + '</p><button class="btn" id="res">See results</button></div>';
      document.getElementById("res").onclick = results;
    }
  }
  function check() {
    for (var i = 0; i < N * N; i++) if ((st.b[i] === 1) !== (SOL[i] === 1)) return;
    st.status = "won"; for (i = 0; i < N * N; i++) if (st.b[i] === 2) st.b[i] = 0;
    PD.save(KEY, st); PD.record("pixel", date, true, bucket(st.t)); PD.confetti(); paint(); setTimeout(results, 1100);
  }
  function bucket(t) { return t < 120 ? "<2m" : t < 240 ? "2-4m" : t < 420 ? "4-7m" : t < 720 ? "7-12m" : "12m+"; }
  var drag = null;
  grid.addEventListener("pointerdown", function (e) {
    var b = e.target.closest(".px-c"); if (!b || st.status !== "play") return;
    e.preventDefault();
    var i = +b.dataset.i, v = st.b[i] === mode ? 0 : mode;
    drag = { v: v, batch: [] };
    apply(i);
    try { grid.setPointerCapture(e.pointerId); } catch (x) {}
  });
  grid.addEventListener("pointermove", function (e) {
    if (!drag) return;
    var el = document.elementFromPoint(e.clientX, e.clientY), b = el && el.closest && el.closest(".px-c");
    if (b) apply(+b.dataset.i);
  });
  function apply(i) {
    if (st.b[i] === drag.v) return;
    if (drag.v !== 0 && st.b[i] !== 0 && st.b[i] !== drag.v) return;
    drag.batch.push([i, st.b[i]]); st.b[i] = drag.v; paint();
  }
  function end() { if (!drag) return; if (drag.batch.length) st.hist.push(drag.batch); drag = null; PD.save(KEY, st); check(); }
  grid.addEventListener("pointerup", end); grid.addEventListener("pointercancel", end);
  grid.addEventListener("keydown", function (e) {
    var b = e.target.closest(".px-c"); if (!b) return;
    var i = +b.dataset.i, m = { ArrowLeft: -1, ArrowRight: 1, ArrowUp: -N, ArrowDown: N }[e.key];
    if (m) { e.preventDefault(); var j = i + m; if (j >= 0 && j < N * N) cells[j].focus(); }
    if ((e.key === "Enter" || e.key === " " || e.key === "x") && st.status === "play") {
      e.preventDefault(); var v = e.key === "x" ? 2 : mode; st.hist.push([[i, st.b[i]]]); st.b[i] = st.b[i] === v ? 0 : v; paint(); PD.save(KEY, st); check();
    }
  });
  document.getElementById("m1").onclick = function () { mode = 1; paint(); };
  document.getElementById("m2").onclick = function () { mode = 2; paint(); };
  document.getElementById("undo").onclick = function () { var bt = st.hist.pop(); if (bt) { bt.slice().reverse().forEach(function (x) { st.b[x[0]] = x[1]; }); paint(); PD.save(KEY, st); } };
  document.getElementById("clr").onclick = function () { if (confirm("Clear the grid?")) { st.b = Array(N * N).fill(0); st.hist = []; paint(); PD.save(KEY, st); } };
  document.getElementById("chk").onclick = function () {
    var wrong = 0; for (var i = 0; i < N * N; i++) if (st.b[i] === 1 && SOL[i] !== 1) wrong++;
    PD.toast(wrong ? wrong + " painted square" + (wrong > 1 ? "s are" : " is") + " wrong" : "No mistakes so far");
    st.t += 5;
  };
  function text() { return "Pixel No. " + PD.number(date) + " · " + N + "×" + N + "\n🎨 " + PD.fmtTime(st.t); }
  function results() { PD.results("pixel", BK, bucket(st.t), text(), "Pixel"); }
  paint();
  if (!PD.load("px:seen", false)) { PD.save("px:seen", true); setTimeout(function () { PD.modal(HELP, null, "help"); }, 300); }
})();
