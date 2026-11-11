(function () {
  var HELP = "<h2>How to play Nine</h2><p>Fill the grid so every <b>row</b>, every <b>column</b> and every <b>3×3 box</b> contains the digits 1 to 9 exactly once.</p><p>Tap a square, then a number. Turn on <b>Notes</b> to pencil in candidates. Clashing digits turn red.</p><p>Difficulty climbs through the week: <b>gentle</b> on Monday, <b>fiendish</b> on Sunday. Every puzzle has one solution.</p><p>Keyboard: arrows to move, 1–9 to fill, Backspace to erase, N for notes.</p>";
  var BK = ["<5m", "5-10m", "10-20m", "20-30m", "30m+"];
  var DIFF = ["Gentle", "Easy", "Medium", "Tricky", "Hard", "Tough", "Fiendish"];
  var date = PD.init({ game: "nine", title: "Nine", help: HELP, dist: BK });
  var idx = PD.index(date, NINE.length);
  var P = NINE[idx][0].split("").map(Number), S = NINE[idx][1].split("").map(Number);
  var KEY = "nn:" + date;
  var st = PD.load(KEY, { b: P.slice(), n: Array(81).fill(0), t: 0, status: "play", hist: [], hints: 0 });
  var sel = P.indexOf(0), notes = false;
  var app = document.getElementById("app");
  var IC = {
    undo: '<svg viewBox="0 0 24 24"><path d="M9 14L4 9l5-5"/><path d="M4 9h10a6 6 0 0 1 0 12h-3"/></svg>',
    erase: '<svg viewBox="0 0 24 24"><path d="M20 20H8l-5-5 10-10 8 8-6 7"/></svg>',
    pen: '<svg viewBox="0 0 24 24"><path d="M12 20h9M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4z"/></svg>',
    bulb: '<svg viewBox="0 0 24 24"><path d="M9 18h6M10 22h4M12 2a7 7 0 0 0-4 12.7V16h8v-1.3A7 7 0 0 0 12 2z"/></svg>'
  };
  app.style.maxWidth = "480px";
  app.innerHTML = '<div class="gbar"><span class="nn-diff">' + DIFF[(PD.number(date) - 1) % 7] + '</span><span class="timer" id="tm">0:00</span></div><div class="nn-board" id="bd" role="grid" aria-label="Sudoku board"></div>' +
    '<div class="nn-tools"><button id="undo">' + IC.undo + 'Undo</button><button id="erase">' + IC.erase + 'Erase</button><button id="notes" aria-pressed="false">' + IC.pen + 'Notes</button><button id="hint">' + IC.bulb + 'Hint</button></div>' +
    '<div class="nn-pad" id="pad"></div><div id="after" style="width:100%"></div>';
  var bd = document.getElementById("bd");
  PD.timer(st, "t", document.getElementById("tm"), function () { return st.status === "play"; });
  setInterval(function () { if (st.status === "play") PD.save(KEY, st); }, 3000);
  var cells = [];
  for (var i = 0; i < 81; i++) {
    var b = document.createElement("button"), r = Math.floor(i / 9), c = i % 9;
    b.className = "nn-c" + (P[i] ? " giv" : "") + (c === 2 || c === 5 ? " bR" : "") + (r === 2 || r === 5 ? " bB" : "");
    if (c === 8) b.style.borderRight = "0";
    if (r === 8) b.style.borderBottom = "0";
    b.dataset.i = i; b.onclick = (function (i) { return function () { sel = i; paint(); }; })(i);
    bd.appendChild(b); cells.push(b);
  }
  var pad = document.getElementById("pad");
  for (var d = 1; d <= 9; d++) { var pb = document.createElement("button"); pb.dataset.d = d; pb.innerHTML = d + "<small></small>"; pb.onclick = (function (d) { return function () { put(d); }; })(d); pad.appendChild(pb); }
  function peers(i) { var r = Math.floor(i / 9), c = i % 9, br = r - r % 3, bc = c - c % 3; return function (j) { var rj = Math.floor(j / 9), cj = j % 9; return rj === r || cj === c || (rj - rj % 3 === br && cj - cj % 3 === bc); }; }
  function clashes() {
    var bad = {};
    for (var i = 0; i < 81; i++) { if (!st.b[i]) continue; var pr = peers(i); for (var j = i + 1; j < 81; j++) if (st.b[j] === st.b[i] && pr(j)) { if (!P[i]) bad[i] = 1; if (!P[j]) bad[j] = 1; } }
    return bad;
  }
  function paint() {
    var bad = clashes(), pr = sel >= 0 ? peers(sel) : null, sv = sel >= 0 ? st.b[sel] : 0, counts = {};
    st.b.forEach(function (v) { if (v) counts[v] = (counts[v] || 0) + 1; });
    cells.forEach(function (b, i) {
      var v = st.b[i];
      if (v) b.innerHTML = v;
      else if (st.n[i]) { var h = '<span class="notes">'; for (var k = 1; k <= 9; k++) h += "<span>" + (st.n[i] >> k & 1 ? k : "") + "</span>"; b.innerHTML = h + "</span>"; }
      else b.innerHTML = "";
      b.classList.toggle("sel", i === sel && st.status === "play");
      b.classList.toggle("peer", !!(pr && pr(i)) && i !== sel && st.status === "play");
      b.classList.toggle("same", !!sv && v === sv && i !== sel);
      b.classList.toggle("err", !!bad[i]);
      b.setAttribute("aria-label", "Row " + (Math.floor(i / 9) + 1) + " column " + (i % 9 + 1) + ": " + (v || "empty"));
    });
    Array.prototype.forEach.call(pad.children, function (b) { var d = +b.dataset.d, left = 9 - (counts[d] || 0); b.disabled = left <= 0 || st.status !== "play"; b.querySelector("small").textContent = left > 0 ? left : ""; });
    document.getElementById("notes").setAttribute("aria-pressed", notes);
    if (st.status !== "play") {
      document.querySelector(".nn-tools").style.display = "none"; pad.style.display = "none";
      document.getElementById("after").innerHTML = '<div class="done-card"><h3>Grid complete</h3><p>' + DIFF[(PD.number(date) - 1) % 7] + " puzzle in " + PD.fmtTime(st.t) + (st.hints ? " · " + st.hints + " hint" + (st.hints > 1 ? "s" : "") : "") + '</p><button class="btn" id="res">See results</button></div>';
      document.getElementById("res").onclick = results;
    }
  }
  function put(d) {
    if (st.status !== "play" || sel < 0 || P[sel]) return;
    if (notes) { st.hist.push([sel, st.b[sel], st.n[sel]]); st.n[sel] ^= 1 << d; st.b[sel] = 0; }
    else {
      st.hist.push([sel, st.b[sel], st.n[sel]]);
      st.b[sel] = st.b[sel] === d ? 0 : d;
      if (st.b[sel]) { var pr = peers(sel); for (var j = 0; j < 81; j++) if (pr(j)) st.n[j] &= ~(1 << d); }
    }
    paint(); check(); PD.save(KEY, st);
  }
  function check() {
    for (var i = 0; i < 81; i++) if (st.b[i] !== S[i]) return;
    st.status = "won"; PD.save(KEY, st);
    PD.record("nine", date, true, bucket(st.t)); PD.confetti(); paint(); setTimeout(results, 900);
  }
  function bucket(t) { return t < 300 ? "<5m" : t < 600 ? "5-10m" : t < 1200 ? "10-20m" : t < 1800 ? "20-30m" : "30m+"; }
  document.getElementById("undo").onclick = function () { var h = st.hist.pop(); if (h) { st.b[h[0]] = h[1]; st.n[h[0]] = h[2]; sel = h[0]; paint(); PD.save(KEY, st); } };
  document.getElementById("erase").onclick = function () { if (sel >= 0 && !P[sel]) { st.hist.push([sel, st.b[sel], st.n[sel]]); st.b[sel] = 0; st.n[sel] = 0; paint(); PD.save(KEY, st); } };
  document.getElementById("notes").onclick = function () { notes = !notes; paint(); };
  document.getElementById("hint").onclick = function () {
    if (st.status !== "play") return;
    var bad = clashes(), k = Object.keys(bad);
    for (var i = 0; i < 81; i++) if (st.b[i] && st.b[i] !== S[i]) { sel = i; paint(); PD.toast("This square isn't right"); return; }
    var t = sel >= 0 && !st.b[sel] ? sel : st.b.indexOf(0);
    if (t < 0) return;
    st.hist.push([t, st.b[t], st.n[t]]); st.b[t] = S[t]; st.hints++; sel = t; paint(); check(); PD.save(KEY, st);
  };
  document.addEventListener("keydown", function (e) {
    if (document.querySelector(".overlay") || e.ctrlKey || e.metaKey || st.status !== "play") return;
    var m = { ArrowLeft: -1, ArrowRight: 1, ArrowUp: -9, ArrowDown: 9 }[e.key];
    if (m) { e.preventDefault(); var j = (sel < 0 ? 0 : sel) + m; if (j >= 0 && j < 81 && !(m === 1 && j % 9 === 0) && !(m === -1 && (sel % 9) === 0)) { sel = j; paint(); } return; }
    if (/^[1-9]$/.test(e.key)) { put(+e.key); return; }
    if (e.key === "Backspace" || e.key === "Delete" || e.key === "0") { document.getElementById("erase").click(); return; }
    if (e.key === "n" || e.key === "N") { notes = !notes; paint(); }
  });
  function text() { return "Nine No. " + PD.number(date) + " · " + DIFF[(PD.number(date) - 1) % 7] + "\n🔢 " + PD.fmtTime(st.t) + (st.hints ? " · 💡×" + st.hints : ""); }
  function results() { PD.results("nine", BK, bucket(st.t), text(), "Nine"); }
  paint();
  if (!PD.load("nn:seen", false)) { PD.save("nn:seen", true); setTimeout(function () { PD.modal(HELP, null, "help"); }, 300); }
})();
