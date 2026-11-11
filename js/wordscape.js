(function () {
  var HELP = "<h2>How to play Wordscape</h2><p>A hidden word list sits in the grid, running in any direction. <b>Drag across letters</b> to select a word.</p><p>Letters that aren't in any word, read left to right and top to bottom, <b>spell the answer to the riddle</b>.</p><p>The strip under the grid shows the letters still unused, so it shrinks to the answer as you find words. You get 3 wrong answers.</p>";
  var date = PD.init({ game: "wordscape", title: "Wordscape", help: HELP, dist: [1, 2, 3, "X"] });
  var P = WS[PD.index(date, WS.length)], N = 6;
  var KEY = "wsc:" + date, st = PD.load(KEY, { found: [], wrong: [], hints: 0, hint: null, status: "play" });
  var app = document.getElementById("app");
  var G = P.g.map(function (r) { return r.split(""); });
  var PAL = ["#f9df6d", "#a0c35a", "#b0c4ef", "#ba81c5", "#ee9a96", "#8fd0b5", "#f0b58a"];
  var sel = null, drag = false;
  function key(r, c) { return r * N + c; }
  function foundCells() { var m = {}; st.found.forEach(function (f, i) { f.cells.forEach(function (k) { m[k] = i; }); }); return m; }
  function leftover() { var m = foundCells(), s = ""; for (var r = 0; r < N; r++) for (var c = 0; c < N; c++) if (m[key(r, c)] === undefined) s += G[r][c]; return s; }
  function html() {
    var fc = foundCells(), h = '<div class="ws-q"><div class="ws-riddle">' + P.q + '.</div><div class="hint">Theme: <b>' + P.t + "</b> · the answer has <b>" + P.s.length + "</b> letters</div></div>";
    h += '<div class="ws-grid" id="grid">';
    for (var r = 0; r < N; r++) for (var c = 0; c < N; c++) {
      var k = key(r, c), cls = "ws-c", sty = "";
      if (fc[k] !== undefined) { cls += " f"; sty = ' style="background:' + PAL[fc[k] % PAL.length] + '"'; }
      else if (sel && sel.indexOf(k) >= 0) cls += " s";
      if (st.hint === k) cls += " hint";
      h += '<div class="' + cls + '" data-r="' + r + '" data-c="' + c + '"' + sty + ">" + G[r][c] + "</div>";
    }
    h += "</div>";
    var words = P.w.slice().sort(function (a, b) { return a.length - b.length || (a < b ? -1 : 1); });
    h += '<div class="ws-words">' + words.map(function (w) {
      var f = st.found.filter(function (x) { return x.w === w; })[0];
      return '<span class="ws-w' + (f ? " got" : "") + '">' + (f ? w.toUpperCase() : w.split("").map(function () { return "_"; }).join(" ")) + "</span>";
    }).join("") + "</div>";
    var lo = leftover();
    if (st.found.length) h += '<div class="ws-left"><small>Letters not in any word yet</small><div>' + lo.toUpperCase().split("").join(" ") + "</div></div>";
    if (st.status === "play") {
      h += '<div class="row"><input id="gi" placeholder="Answer to the riddle" autocomplete="off" style="flex:1;max-width:260px;padding:12px;border:2px solid var(--line);border-radius:6px;background:var(--bg);color:var(--ink);font-size:1rem"><button class="btn accent" id="go">Answer</button></div>';
      h += st.wrong.map(function (g) { return '<div class="hint">❌ ' + g + "</div>"; }).join("");
      h += '<div class="ctrls"><button class="btn sec" id="hintb">Hint (' + st.hints + ' used)</button></div><div class="hint" id="msg"></div>';
    } else {
      h += '<div class="bigcard" style="text-align:center"><div style="font-family:var(--serif);font-size:1.8rem;font-weight:900;letter-spacing:.04em">' + (st.status === "won" ? "🎉 " : "") + P.s.toUpperCase() + '</div><div class="ctrls"><button class="btn accent" id="res">Results</button></div></div>';
    }
    return h;
  }
  function render() {
    app.innerHTML = html();
    var grid = document.getElementById("grid");
    if (st.status === "play") bindGrid(grid);
    var gi = document.getElementById("gi");
    if (gi) { gi.onkeydown = function (e) { if (e.key === "Enter") answer(gi.value); e.stopPropagation(); }; document.getElementById("go").onclick = function () { answer(gi.value); }; document.getElementById("hintb").onclick = hint; }
    var rs = document.getElementById("res"); if (rs) rs.onclick = results;
  }
  function cellAt(x, y) { var e = document.elementFromPoint(x, y); return e && e.classList && e.classList.contains("ws-c") ? e : null; }
  var start = null;
  function line(a, b) {
    var dr = b.r - a.r, dc = b.c - a.c, ang = Math.atan2(dr, dc), step = Math.round(ang / (Math.PI / 4));
    var DR = [0, 1, 1, 1, 0, -1, -1, -1], DC = [1, 1, 0, -1, -1, -1, 0, 1];
    var idx = ((step % 8) + 8) % 8, vr = [0, 1, 1, 1, 0, -1, -1, -1][(idx + 0) % 8];
    // map angle step -> direction (dc,dr) with atan2(dr,dc)
    var dirs = { 0: [0, 1], 1: [1, 1], 2: [1, 0], 3: [1, -1], 4: [0, -1], "-1": [-1, 1], "-2": [-1, 0], "-3": [-1, -1], "-4": [0, -1] };
    var d = dirs[step]; if (!d) return [key(a.r, a.c)];
    var len = Math.max(Math.abs(dr), Math.abs(dc)), out = [];
    for (var i = 0; i <= len; i++) { var r = a.r + d[0] * i, c = a.c + d[1] * i; if (r < 0 || r >= N || c < 0 || c >= N) break; out.push(key(r, c)); }
    return out;
  }
  function paint() { Array.prototype.forEach.call(document.querySelectorAll(".ws-c"), function (e) { var k = key(+e.dataset.r, +e.dataset.c); e.classList.toggle("s", !!(sel && sel.indexOf(k) >= 0 && !e.classList.contains("f"))); }); }
  function bindGrid(grid) {
    grid.addEventListener("pointerdown", function (e) { var c = cellAt(e.clientX, e.clientY); if (!c) return; drag = true; start = { r: +c.dataset.r, c: +c.dataset.c }; sel = [key(start.r, start.c)]; paint(); e.preventDefault(); });
    grid.addEventListener("pointermove", function (e) { if (!drag) return; var c = cellAt(e.clientX, e.clientY); if (!c) return; sel = line(start, { r: +c.dataset.r, c: +c.dataset.c }); paint(); });
    var up = function () { if (!drag) return; drag = false; check(); };
    grid.addEventListener("pointerup", up); grid.addEventListener("pointercancel", up); grid.addEventListener("pointerleave", function () { if (drag) up(); });
  }
  function check() {
    var s = sel || []; sel = null;
    var str = s.map(function (k) { return G[Math.floor(k / N)][k % N]; }).join(""), rev = str.split("").reverse().join("");
    var hit = null;
    P.w.forEach(function (w) { if (!st.found.some(function (f) { return f.w === w; }) && s.length === w.length && (w === str || w === rev)) hit = w; });
    var fc = foundCells();
    if (hit && !s.some(function (k) { return fc[k] !== undefined; })) { st.found.push({ w: hit, cells: s }); if (st.hint !== null && s.indexOf(st.hint) >= 0) st.hint = null; PD.save(KEY, st); PD.toast(st.found.length === P.w.length ? "All words found" : "Found " + hit.toUpperCase()); }
    render();
  }
  function hint() {
    var rem = P.w.filter(function (w) { return !st.found.some(function (f) { return f.w === w; }); });
    if (!rem.length) { PD.toast("The answer is in the leftover letters"); return; }
    // locate first cell of a remaining word by scanning
    var w = rem[0], dirs = [[0, 1], [1, 0], [1, 1], [0, -1], [-1, 0], [-1, -1], [1, -1], [-1, 1]];
    for (var r = 0; r < N; r++) for (var c = 0; c < N; c++) for (var d = 0; d < 8; d++) {
      var ok = true;
      for (var i = 0; i < w.length; i++) { var rr = r + dirs[d][0] * i, cc = c + dirs[d][1] * i; if (rr < 0 || rr >= N || cc < 0 || cc >= N || G[rr][cc] !== w[i]) { ok = false; break; } }
      if (ok) { st.hint = key(r, c); st.hints++; PD.save(KEY, st); PD.toast("One word starts at the outlined letter"); render(); return; }
    }
  }
  function answer(v) {
    var g = v.trim().toLowerCase().replace(/[^a-z]/g, ""); if (!g) return;
    if (g === P.s) { st.status = "won"; PD.save(KEY, st); PD.record("wordscape", date, true, Math.min(st.wrong.length + 1, 3)); render(); PD.confetti(); setTimeout(results, 700); return; }
    st.wrong.push(g);
    if (st.wrong.length >= 3) { st.status = "lost"; PD.save(KEY, st); PD.record("wordscape", date, false, "X"); render(); setTimeout(results, 700); return; }
    PD.save(KEY, st); render(); PD.toast("Not quite");
  }
  function text2() { var k = st.status === "won" ? st.wrong.length + 1 : "X"; return "Wordscape No. " + PD.number(date) + " " + k + "/3" + (st.hints ? " · " + st.hints + " hint" + (st.hints > 1 ? "s" : "") : "") + "\n" + "🔤".repeat(st.found.length) + "⬜".repeat(P.w.length - st.found.length); }
  function results() { PD.results("wordscape", [1, 2, 3, "X"], st.status === "won" ? st.wrong.length + 1 : "X", text2(), "Wordscape"); }
  render();
  if (!PD.load("ws:seen", false)) { PD.save("ws:seen", true); setTimeout(function () { PD.modal(HELP); }, 300); }
})();
