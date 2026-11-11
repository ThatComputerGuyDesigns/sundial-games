(function () {
  var HELP = "<h2>How to play Ladder</h2><p>Turn the <b>top word</b> into the <b>bottom word</b> by changing <b>one letter at a time</b>. Every step must be a real word.</p><p>Example: <b>COLD → CORD → CARD → WARD → WARM</b>.</p><p>Beat or match <b>par</b> for ★★★. Need a nudge? The hint button shows the next move but costs a step.</p>";
  var date = PD.init({ game: "ladder", title: "Ladder", help: HELP, dist: [3, 2, 1] });
  var P = LADDER[PD.index(date, LADDER.length)], PAR = P.p.length - 1;
  var V = {}; LADDERVALID.forEach(function (w) { V[w] = 1; }); P.p.forEach(function (w) { V[w] = 1; });
  var KEY = "ld:" + date;
  var st = PD.load(KEY, { chain: [P.a], hints: 0, status: "play" });
  var cur = "", app = document.getElementById("app"), msg = "";
  var buckets = {}; Object.keys(V).forEach(function (w) { for (var i = 0; i < 4; i++) { var k = w.slice(0, i) + "_" + w.slice(i + 1); (buckets[k] = buckets[k] || []).push(w); } });
  function nbrs(w) { var o = []; for (var i = 0; i < 4; i++) (buckets[w.slice(0, i) + "_" + w.slice(i + 1)] || []).forEach(function (x) { if (x !== w) o.push(x); }); return o; }
  function bfs(a, b) {
    var prev = {}; prev[a] = null; var q = [a];
    while (q.length) { var u = q.shift(); if (u === b) break; nbrs(u).forEach(function (v) { if (!(v in prev)) { prev[v] = u; q.push(v); } }); }
    if (!(b in prev)) return null; var p = [b]; while (prev[p[0]] !== null) p.unshift(prev[p[0]]); return p;
  }
  function diffPos(a, b) { var d = -1, n = 0; for (var i = 0; i < 4; i++) if (a[i] !== b[i]) { n++; d = i; } return n === 1 ? d : -1; }
  function steps() { return st.chain.length - 1; }
  function score() { var s = steps() + st.hints; return s <= PAR ? 3 : s <= PAR + 2 ? 2 : 1; }
  function row(w, cls, prev) {
    var h = '<div class="lw ' + cls + '">';
    for (var i = 0; i < 4; i++) h += '<div class="lt' + (prev && prev[i] !== w[i] ? " ch" : "") + '">' + (w[i] || "") + "</div>";
    return h + "</div>";
  }
  function render() {
    var h = '<div class="hint">Par <b>' + PAR + "</b> steps · You: <b>" + steps() + "</b>" + (st.hints ? " · Hints: " + st.hints : "") + "</div><div class=\"lad\">";
    st.chain.forEach(function (w, i) { h += row(w, i === 0 ? "start" : i === st.chain.length - 1 && st.status === "done" ? "end" : "", i ? st.chain[i - 1] : null); });
    if (st.status === "play") h += row((cur + "    ").slice(0, 4).replace(/ /g, ""), "typing", null).replace(/<div class="lt">(<\/div>)/g, '<div class="lt">$1');
    h += '<div class="lstep">↓</div>' + row(P.b, "goalrow", null) + "</div>";
    h += '<div class="hint" id="msg">' + (msg || (st.status === "play" ? "Change one letter to make a new word" : "")) + "</div>";
    h += '<div class="row"><button class="btn sec" id="undo"' + (steps() && st.status === "play" ? "" : " disabled") + '>Undo</button><button class="btn sec" id="hint"' + (st.status === "play" ? "" : " disabled") + ">Hint</button>" + (st.status === "done" ? '<button class="btn accent" id="res">Results</button>' : "") + "</div>";
    h += '<div id="kb" style="width:100%"></div>';
    app.innerHTML = h;
    var u = document.getElementById("undo"); if (u) u.onclick = function () { st.chain.pop(); msg = ""; PD.save(KEY, st); render(); };
    var hb = document.getElementById("hint"); if (hb) hb.onclick = hint;
    var rs = document.getElementById("res"); if (rs) rs.onclick = results;
    if (st.status === "play") { PD.keyboard(document.getElementById("kb"), key); }
  }
  function hint() {
    var last = st.chain[st.chain.length - 1], p = bfs(last, P.b);
    if (!p || p.length < 2) { msg = "No path from here, try Undo"; render(); return; }
    var n = p[1], i = diffPos(last, n); st.hints++; PD.save(KEY, st);
    msg = "Hint: change letter " + (i + 1) + " to “" + n[i].toUpperCase() + "”"; render();
  }
  function key(k) {
    if (st.status !== "play") return;
    if (k === "BACK") cur = cur.slice(0, -1);
    else if (k === "ENTER") return submit();
    else if (cur.length < 4) cur += k;
    msg = ""; render();
  }
  function submit() {
    var last = st.chain[st.chain.length - 1];
    if (cur.length < 4) { PD.toast("Need 4 letters"); return; }
    if (!V[cur]) { PD.toast("Not in word list"); return; }
    if (diffPos(last, cur) < 0) { PD.toast("Change exactly one letter"); return; }
    if (st.chain.indexOf(cur) >= 0) { PD.toast("Already used"); return; }
    st.chain.push(cur); cur = ""; msg = "";
    if (st.chain[st.chain.length - 1] === P.b) { st.status = "done"; PD.save(KEY, st); PD.record("ladder", date, true, score()); render(); if (score() === 3) PD.confetti(); setTimeout(results, 800); return; }
    PD.save(KEY, st); render();
  }
  function text() { var s = score(); return "Ladder No. " + PD.number(date) + " " + "★".repeat(s) + "\n" + P.a.toUpperCase() + " → " + P.b.toUpperCase() + " in " + steps() + " (par " + PAR + ")" + (st.hints ? ", " + st.hints + " hint" + (st.hints > 1 ? "s" : "") : ""); }
  function results() {
    var m = PD.results("ladder", [3, 2, 1], score(), text(), "Ladder");
    var d = document.createElement("div");
    d.innerHTML = '<h3>Shortest ladder</h3><p style="text-align:center;font-weight:700;letter-spacing:.05em">' + P.p.map(function (w) { return w.toUpperCase(); }).join(" → ") + "</p>";
    m.el.appendChild(d);
  }
  render();
  if (!PD.load("ld:seen", false)) { PD.save("ld:seen", true); setTimeout(function () { PD.modal(HELP); }, 300); }
})();
