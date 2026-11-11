(function () {
  var HELP = "<h2>How to play Target</h2><p>Hit the <b>target number</b> using the six numbers below. Tap a number, an operation, then a second number to combine them. The result becomes a new number you can use again.</p><p>Each number can be used once. No fractions or negatives allowed.</p><p>Get exact for <b>★★★</b>, within 5 for <b>★★</b>, within 10 for <b>★</b>. A new target arrives daily.</p>";
  var date = PD.init({ game: "target", title: "Target", help: HELP, dist: [3, 2, 1, 0] });
  var P = TARGET[PD.index(date, TARGET.length)];
  var KEY = "tg:" + date;
  var st = PD.load(KEY, { hist: [], status: "play" });
  var app = document.getElementById("app");
  var a = null, op = null;
  var SYM = { "+": "+", "-": "−", "*": "×", "/": "÷" };

  function pool() {
    var p = P.n.slice(), seen = P.n.slice();
    st.hist.forEach(function (h) {
      var r = calc(p[h.i], p[h.j], h.op);
      p = p.filter(function (_, k) { return k !== h.i && k !== h.j; }); p.push(r); seen.push(r);
    });
    return { p: p, seen: seen };
  }
  function calc(x, y, o) {
    if (o === "+") return x + y;
    if (o === "-") return x > y ? x - y : null;
    if (o === "*") return x * y;
    if (o === "/") return y !== 0 && x % y === 0 ? x / y : null;
  }
  function best(seen) { return Math.min.apply(null, seen.map(function (v) { return Math.abs(v - P.t); })); }
  function stars(d) { return d === 0 ? 3 : d <= 5 ? 2 : d <= 10 ? 1 : 0; }

  function pick(i) {
    if (st.status !== "play") return;
    var p = pool().p;
    if (a === null) { a = i; render(); return; }
    if (a === i) { a = null; op = null; render(); return; }
    if (!op) { a = i; render(); return; }
    var r = calc(p[a], p[i], op);
    if (r === null) { PD.toast(op === "-" ? "Result must be positive" : "Must divide evenly"); return; }
    st.hist.push({ i: a, j: i, op: op }); a = null; op = null;
    var pl = pool();
    if (best(pl.seen) === 0) { st.status = "done"; finishUp(); }
    PD.save(KEY, st); render();
  }
  function finishUp() {
    var d = best(pool().seen), s = stars(d);
    PD.record("target", date, s > 0, s);
    if (s === 3) PD.confetti();
    setTimeout(showResults, 700);
  }
  function text() {
    var d = best(pool().seen), s = stars(d);
    return "Target No. " + PD.number(date) + " " + (s ? "★".repeat(s) : "✗") + (d ? " (off by " + d + ")" : "") + "\n" + st.hist.length + " steps";
  }
  function showResults() {
    var d = best(pool().seen), s = stars(d);
    var m = PD.results("target", [3, 2, 1, 0], s, text(), "Target");
    var box = document.createElement("div");
    box.innerHTML = '<h3>One solution</h3><div class="hist">' + P.s.map(function (x) { return "<div>" + x + "</div>"; }).join("") + "</div>";
    m.el.appendChild(box);
  }
  function render() {
    var pl = pool(), p = pl.p, d = best(pl.seen);
    var h = '<div class="tgt"><small>Target</small><b>' + P.t + "</b></div>";
    h += '<div class="hint">' + (st.status === "done" ? (d === 0 ? "You hit it!" : "Locked in, off by " + d) : d === 0 ? "" : "Closest so far: off by " + d) + "</div>";
    h += '<div class="nums">' + p.map(function (v, i) {
      var isNew = i >= P.n.length - st.hist.length && st.hist.length;
      return '<button class="num' + (a === i ? " sel" : "") + (v === P.t ? " hit" : "") + '" data-i="' + i + '"' + (st.status !== "play" ? " disabled" : "") + ">" + v + "</button>";
    }).join("") + "</div>";
    h += '<div class="ops">' + ["+", "-", "*", "/"].map(function (o) { return '<button class="op' + (op === o ? " sel" : "") + '" data-o="' + o + '">' + SYM[o] + "</button>"; }).join("") + "</div>";
    h += '<div class="row"><button class="btn sec" id="undo"' + (st.hist.length && st.status === "play" ? "" : " disabled") + '>Undo</button><button class="btn sec" id="reset"' + (st.hist.length && st.status === "play" ? "" : " disabled") + '>Reset</button><button class="btn accent" id="lock"' + (st.status === "play" ? "" : " disabled") + ">Lock in best</button>" + (st.status === "done" ? '<button class="btn" id="res">Results</button>' : "") + "</div>";
    h += '<div class="hist">' + st.hist.map(function (x, n) { return ""; }).join("") + "</div>";
    app.innerHTML = h + '<div class="hist" id="log"></div>';
    var log = document.getElementById("log"), q = P.n.slice();
    st.hist.forEach(function (x) { var r = calc(q[x.i], q[x.j], x.op); log.innerHTML += "<div>" + q[x.i] + " " + SYM[x.op] + " " + q[x.j] + " = <b>" + r + "</b></div>"; q = q.filter(function (_, k) { return k !== x.i && k !== x.j; }); q.push(r); });
    Array.prototype.forEach.call(app.querySelectorAll(".num"), function (b) { b.onclick = function () { pick(+b.dataset.i); }; });
    Array.prototype.forEach.call(app.querySelectorAll(".op"), function (b) { b.onclick = function () { if (st.status !== "play" || a === null) { PD.toast("Pick a number first"); return; } op = op === b.dataset.o ? null : b.dataset.o; render(); }; });
    var u = document.getElementById("undo"); if (u) u.onclick = function () { st.hist.pop(); a = op = null; PD.save(KEY, st); render(); };
    var r = document.getElementById("reset"); if (r) r.onclick = function () { st.hist = []; a = op = null; PD.save(KEY, st); render(); };
    var l = document.getElementById("lock"); if (l) l.onclick = function () { st.status = "done"; PD.save(KEY, st); finishUp(); render(); };
    var rs = document.getElementById("res"); if (rs) rs.onclick = showResults;
  }
  render();
  if (!PD.load("tg:seen", false)) { PD.save("tg:seen", true); setTimeout(function () { PD.modal(HELP); }, 300); }
})();
