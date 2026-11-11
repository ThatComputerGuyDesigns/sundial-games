(function () {
  var HELP = "<h2>How to play Chrono</h2><p>Put the five events in order from <b>earliest to latest</b> using the arrows.</p><p>Press <b>Check</b>. Events in the right spot lock in green. You get <b>4 checks</b>.</p>";
  var date = PD.init({ game: "chrono", title: "Chrono", help: HELP, dist: [1, 2, 3, 4, "X"] });
  var D = CHRONO[PD.index(date, CHRONO.length)], MAX = 4;
  var correct = D.map(function (e, i) { return i; }).sort(function (a, b) { return D[a][1] - D[b][1]; }); // correct order of indices
  var rank = {}; correct.forEach(function (idx, pos) { rank[idx] = pos; });
  var KEY = "ch:" + date;
  var start = PD.shuffle(D.map(function (_, i) { return i; }), PD.number(date) * 7919);
  if (start.every(function (x, i) { return rank[x] === i; })) start.reverse();
  var st = PD.load(KEY, { order: start, tries: [], status: "play" });
  var app = document.getElementById("app");
  function locked(pos) { var l = false; st.tries.forEach(function (t) { if (t[pos]) l = true; }); return l; }
  function render() {
    var done = st.status !== "play", last = st.tries[st.tries.length - 1];
    var h = '<div class="hint">Oldest at the top. Checks left: <b>' + (MAX - st.tries.length) + "</b></div><div class=\"chlist\">";
    st.order.forEach(function (idx, pos) {
      var ok = last && last[pos], cls = "chrow" + (ok ? " ok" : last && !ok ? " bad" : "");
      h += '<div class="' + cls + '"><span class="chn">' + (pos + 1) + '</span><span class="cht">' + D[idx][0] + "</span>" + (done ? '<span class="chy">' + fy(D[idx][1]) + "</span>" : '<span class="chb"><button data-u="' + pos + '"' + (pos === 0 || ok ? " disabled" : "") + '>▲</button><button data-d="' + pos + '"' + (pos === 4 || ok ? " disabled" : "") + ">▼</button></span>") + "</div>";
    });
    h += "</div>";
    if (!done) h += '<div class="ctrls"><button class="btn accent" id="chk">Check</button></div>';
    else h += '<div class="ctrls"><button class="btn accent" id="res">Results</button></div>';
    app.innerHTML = h;
    Array.prototype.forEach.call(app.querySelectorAll("[data-u]"), function (b) { b.onclick = function () { swap(+b.dataset.u, -1); }; });
    Array.prototype.forEach.call(app.querySelectorAll("[data-d]"), function (b) { b.onclick = function () { swap(+b.dataset.d, 1); }; });
    var c = document.getElementById("chk"); if (c) c.onclick = check;
    var r = document.getElementById("res"); if (r) r.onclick = results;
  }
  function fy(y) { return y < 0 ? -y + " BC" : String(y); }
  function swap(p, d) {
    var q = p + d; if (q < 0 || q > 4) return;
    var last = st.tries[st.tries.length - 1]; if (last && (last[p] || last[q])) return;
    var t = st.order[p]; st.order[p] = st.order[q]; st.order[q] = t;
    if (last) { last = last.slice(); st.tries[st.tries.length - 1] = last; }
    PD.save(KEY, st); render();
  }
  function check() {
    var res = st.order.map(function (idx, pos) { return rank[idx] === pos || D[idx][1] === D[correct[pos]][1]; });
    st.tries.push(res); var n = res.filter(Boolean).length;
    if (n === 5) { st.status = "won"; PD.save(KEY, st); PD.record("chrono", date, true, st.tries.length); render(); if (st.tries.length <= 2) PD.confetti(); setTimeout(results, 700); return; }
    if (st.tries.length >= MAX) { st.order = correct.slice(); st.status = "lost"; PD.save(KEY, st); PD.record("chrono", date, false, "X"); render(); setTimeout(results, 700); return; }
    PD.save(KEY, st); PD.toast(n + " of 5 in place"); render();
  }
  function text() { return "Chrono No. " + PD.number(date) + " " + (st.status === "won" ? st.tries.length : "X") + "/" + MAX + "\n" + st.tries.map(function (t) { return t.map(function (b) { return b ? "🟩" : "⬜"; }).join(""); }).join("\n"); }
  function results() { PD.results("chrono", [1, 2, 3, 4, "X"], st.status === "won" ? st.tries.length : "X", text(), "Chrono"); }
  render();
  if (!PD.load("ch:seen", false)) { PD.save("ch:seen", true); setTimeout(function () { PD.modal(HELP); }, 300); }
})();
