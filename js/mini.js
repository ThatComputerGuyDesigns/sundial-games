(function () {
  var HELP = "<h2>How to play Crossbit</h2><p>A mini crossword with six words. Tap a square, type letters, tap it again to switch between <b>Across</b> and <b>Down</b>.</p><p>Stuck? <b>Hint</b> reveals the selected letter and <b>Check</b> shows what's wrong. Neither stops you winning, but they show up in your share. Your time counts up, so be quick!</p>";
  var BK = ["<1m", "1-2m", "2-4m", "4-8m", "8m+"];
  var date = PD.init({ game: "crossbit", title: "Crossbit", help: HELP, dist: BK });
  var P = XW[PD.index(date, XW.length)];
  var KEY = "xb:" + date;
  var st = PD.load(KEY, { g: ["     ", "     ", "     ", "     ", "     "], status: "play", t: 0, hints: 0, checks: 0, given: [] });
  var app = document.getElementById("app"), sel = { r: 0, c: 0, d: "a" }, wrong = {}, timer = null;
  function blk(r, c) { return r % 2 === 1 && c % 2 === 1; }
  function ans(r, c) { return r % 2 === 0 ? P.a[r / 2][0][c] : P.d[c / 2][0][r]; }
  function inWord(r, c, d) { return d === "a" ? r % 2 === 0 : c % 2 === 0; }
  function wordCells(r, c, d) { var o = [], i; if (d === "a") for (i = 0; i < 5; i++) o.push([r, i]); else for (i = 0; i < 5; i++) o.push([i, c]); return o; }
  function num(r, c) { return r === 0 && c === 0 ? 1 : r === 0 && c === 2 ? 2 : r === 0 && c === 4 ? 3 : r === 2 && c === 0 ? 4 : r === 4 && c === 0 ? 5 : null; }
  function clueFor(r, c, d) { return d === "a" ? P.a[r / 2] : P.d[c / 2]; }
  function clueLabel(r, c, d) { var n = d === "a" ? [1, 4, 5][r / 2] : [1, 2, 3][c / 2]; return n + (d === "a" ? "A" : "D"); }
  function cell(r, c) { return st.g[r][c]; }
  function setCell(r, c, ch) { var row = st.g[r].split(""); row[c] = ch; st.g[r] = row.join(""); }
  function fmt(s) { return Math.floor(s / 60) + ":" + String(s % 60).padStart(2, "0"); }
  function bucket(s) { return s < 60 ? BK[0] : s < 120 ? BK[1] : s < 240 ? BK[2] : s < 480 ? BK[3] : BK[4]; }

  function build() {
    var h = '<div class="xwrap"><div class="row" style="width:100%;max-width:420px;justify-content:space-between"><span class="timer" id="tm">' + fmt(st.t) + '</span><span class="pill">' + (st.hints ? st.hints + " hint" + (st.hints > 1 ? "s" : "") : "no hints") + '</span></div><div class="clue-bar" id="cb"></div><div class="xgrid" id="xg">';
    for (var r = 0; r < 5; r++) for (var c = 0; c < 5; c++) h += '<div class="xc' + (blk(r, c) ? " blk" : "") + '" data-r="' + r + '" data-c="' + c + '">' + (num(r, c) ? '<span class="n">' + num(r, c) + "</span>" : "") + '<span class="L"></span></div>';
    h += '</div><div class="row"><button class="btn sec" id="hint">Hint</button><button class="btn sec" id="check">Check</button><button class="btn sec" id="giveup">Give up</button></div>';
    h += '<div class="xlists"><div><h4>Across</h4>' + P.a.map(function (x, i) { return '<div class="cl" data-r="' + i * 2 + '" data-c="0" data-d="a">' + [1, 4, 5][i] + ". " + x[1] + "</div>"; }).join("") + '</div><div><h4>Down</h4>' + P.d.map(function (x, i) { return '<div class="cl" data-r="0" data-c="' + i * 2 + '" data-d="d">' + [1, 2, 3][i] + ". " + x[1] + "</div>"; }).join("") + "</div></div></div>";
    h += '<div id="kb" style="width:100%;margin-top:14px"></div>';
    app.innerHTML = h;
    Array.prototype.forEach.call(app.querySelectorAll(".xc:not(.blk)"), function (e) { e.onclick = function () { tap(+e.dataset.r, +e.dataset.c); }; });
    Array.prototype.forEach.call(app.querySelectorAll(".cl"), function (e) { e.onclick = function () { sel = { r: +e.dataset.r, c: +e.dataset.c, d: e.dataset.d }; paint(); }; });
    document.getElementById("hint").onclick = hint;
    document.getElementById("check").onclick = check;
    document.getElementById("giveup").onclick = giveup;
    PD.keyboard(document.getElementById("kb"), key);
  }
  function tap(r, c) {
    if (st.status !== "play") return;
    var both = r % 2 === 0 && c % 2 === 0;
    if (sel.r === r && sel.c === c && both) sel.d = sel.d === "a" ? "d" : "a";
    else { sel.r = r; sel.c = c; if (!inWord(r, c, sel.d)) sel.d = sel.d === "a" ? "d" : "a"; }
    paint();
  }
  function paint() {
    var cells = app.querySelectorAll(".xc"), wc = wordCells(sel.r, sel.c, sel.d).map(function (x) { return x[0] + "," + x[1]; });
    Array.prototype.forEach.call(cells, function (e) {
      var r = +e.dataset.r, c = +e.dataset.c; if (blk(r, c)) return;
      e.className = "xc" + (wc.indexOf(r + "," + c) >= 0 ? " inword" : "") + (r === sel.r && c === sel.c ? " cur" : "") + (wrong[r + "," + c] ? " wrong" : "");
      e.querySelector(".L").textContent = cell(r, c).trim();
    });
    var cl = clueFor(sel.r, sel.c, sel.d);
    document.getElementById("cb").innerHTML = "<b>" + clueLabel(sel.r, sel.c, sel.d) + "</b> " + cl[1];
    Array.prototype.forEach.call(app.querySelectorAll(".cl"), function (e) { e.classList.toggle("act", e.dataset.d === sel.d && ((sel.d === "a" && +e.dataset.r === sel.r) || (sel.d === "d" && +e.dataset.c === sel.c))); });
    document.getElementById("cb").onclick = function () { if (sel.r % 2 === 0 && sel.c % 2 === 0) { sel.d = sel.d === "a" ? "d" : "a"; paint(); } };
  }
  function next(step) {
    var cs = wordCells(sel.r, sel.c, sel.d), i = cs.findIndex(function (x) { return x[0] === sel.r && x[1] === sel.c; }), j = i + step;
    if (j >= 0 && j < 5) { sel.r = cs[j][0]; sel.c = cs[j][1]; }
  }
  function nextWord() {
    var order = [["a", 0, 0], ["d", 0, 0], ["a", 2, 0], ["d", 0, 2], ["a", 4, 0], ["d", 0, 4]], i = order.findIndex(function (o) { return o[0] === sel.d && (o[0] === "a" ? o[1] === sel.r : o[2] === sel.c); });
    var o = order[(i + 1) % 6]; sel = { d: o[0], r: o[1], c: o[2] };
  }
  function key(k) {
    if (st.status !== "play") return;
    if (k === "ENTER") { nextWord(); paint(); return; }
    if (k === "BACK") {
      if (cell(sel.r, sel.c) !== " " && st.given.indexOf(sel.r + "," + sel.c) < 0) setCell(sel.r, sel.c, " "); else { next(-1); if (st.given.indexOf(sel.r + "," + sel.c) < 0) setCell(sel.r, sel.c, " "); }
      delete wrong[sel.r + "," + sel.c]; save(); paint(); return;
    }
    if (st.given.indexOf(sel.r + "," + sel.c) >= 0) { next(1); paint(); return; }
    setCell(sel.r, sel.c, k); delete wrong[sel.r + "," + sel.c]; next(1); save(); paint(); finishCheck();
  }
  function filled() { for (var r = 0; r < 5; r++) for (var c = 0; c < 5; c++) if (!blk(r, c) && cell(r, c) === " ") return false; return true; }
  function correct() { for (var r = 0; r < 5; r++) for (var c = 0; c < 5; c++) if (!blk(r, c) && cell(r, c) !== ans(r, c)) return false; return true; }
  function finishCheck() {
    if (!filled()) return;
    if (correct()) { st.status = "won"; save(); PD.record("crossbit", date, true, bucket(st.t)); clearInterval(timer); paint(); PD.confetti(); setTimeout(results, 800); }
    else PD.toast("Something's not right");
  }
  function hint() {
    if (st.status !== "play") return;
    if (cell(sel.r, sel.c) === ans(sel.r, sel.c) && st.given.indexOf(sel.r + "," + sel.c) < 0 && false) return;
    setCell(sel.r, sel.c, ans(sel.r, sel.c)); if (st.given.indexOf(sel.r + "," + sel.c) < 0) { st.given.push(sel.r + "," + sel.c); st.hints++; }
    delete wrong[sel.r + "," + sel.c]; save(); document.querySelector(".pill").textContent = st.hints + " hint" + (st.hints > 1 ? "s" : ""); next(1); paint(); finishCheck();
  }
  function check() {
    if (st.status !== "play") return; var n = 0; wrong = {};
    for (var r = 0; r < 5; r++) for (var c = 0; c < 5; c++) if (!blk(r, c) && cell(r, c) !== " " && cell(r, c) !== ans(r, c)) { wrong[r + "," + c] = 1; n++; }
    if (n) st.checks++; save(); PD.toast(n ? n + " wrong letter" + (n > 1 ? "s" : "") + " (in red)" : "All good so far"); paint();
  }
  function giveup() {
    if (st.status !== "play" || !confirm("Reveal the answers and end this puzzle?")) return;
    for (var r = 0; r < 5; r++) for (var c = 0; c < 5; c++) if (!blk(r, c)) setCell(r, c, ans(r, c));
    st.status = "lost"; save(); PD.record("crossbit", date, false, null); clearInterval(timer); paint(); setTimeout(results, 400);
  }
  function save() { PD.save(KEY, st); }
  function text() { return "Crossbit No. " + PD.number(date) + " ⏱ " + fmt(st.t) + (st.hints ? " · " + st.hints + " hint" + (st.hints > 1 ? "s" : "") : "") + (st.checks ? " · " + st.checks + " check" + (st.checks > 1 ? "s" : "") : "") + (st.status === "lost" ? " · gave up" : ""); }
  function results() { PD.results("crossbit", BK, st.status === "won" ? bucket(st.t) : null, text(), "Crossbit"); }
  build(); paint();
  if (st.status === "play") timer = setInterval(function () { if (document.hidden || document.querySelector(".overlay")) return; st.t++; var e = document.getElementById("tm"); if (e) e.textContent = fmt(st.t); if (st.t % 5 === 0) save(); }, 1000);
  else if (st.status !== "play") { var b = document.createElement("div"); b.className = "row"; b.style.marginTop = "10px"; b.innerHTML = '<button class="btn accent" id="rs">Results</button>'; app.firstChild.appendChild(b); document.getElementById("rs").onclick = results; }
  if (!PD.load("xb:seen", false)) { PD.save("xb:seen", true); setTimeout(function () { PD.modal(HELP); }, 300); }
})();
