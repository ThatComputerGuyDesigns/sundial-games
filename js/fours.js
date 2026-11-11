(function () {
  var HELP = "<h2>How to play Fours</h2><p>Sixteen words hide <b>four secret groups of four</b>. Pick four words you think belong together and hit <b>Submit</b>.</p><p>Groups go from <b>easy</b> (yellow) to <b>devious</b> (purple). Watch for red herrings: a word can fit two groups, but only one arrangement works.</p><p>You have <b>4 lives</b>. If you're stuck, <b>Peek</b> reveals the name of one hidden group, at a cost to your score.</p>";
  var date = PD.init({ game: "fours", title: "Fours", help: HELP, dist: [0, 1, 2, 3, "X"] });
  var P = { g: FOURS[PD.index(date, FOURS.length)] };
  var MAXM = 4, KEY = "fo:" + date;
  var st = PD.load(KEY, { solved: [], guesses: [], mistakes: 0, peeks: [], status: "play", order: null });
  if (!st.order) { st.order = PD.shuffle(P.g.reduce(function (a, g) { return a.concat(g.w); }, []), PD.number(date) * 7919); PD.save(KEY, st); }
  var sel = [], app = document.getElementById("app");
  function gidx(w) { for (var i = 0; i < 4; i++) if (P.g[i].w.indexOf(w) >= 0) return i; }
  function LV(i) { return P.g[i].l; }
  function score() { return Math.max(0, 100 - st.mistakes * 15 - st.peeks.length * 10); }
  function render() {
    var h = "";
    var peeks = st.peeks.filter(function (i) { return st.solved.indexOf(i) < 0; });
    if (peeks.length) h += '<div class="hint">👀 One group is: <b>' + peeks.map(function (i) { return P.g[i].t; }).join(" · ") + "</b></div>";
    h += '<div class="cgrid">';
    st.solved.forEach(function (i) { h += '<div class="found l' + LV(i) + '"><b>' + P.g[i].t + "</b><span>" + P.g[i].w.join(", ") + "</span></div>"; });
    var left = st.order.filter(function (w) { return st.solved.indexOf(gidx(w)) < 0; });
    left.forEach(function (w) { h += '<button class="ctile' + (sel.indexOf(w) >= 0 ? " sel" : "") + '" data-w="' + w.replace(/"/g, "&quot;") + '"' + (st.status !== "play" ? " disabled" : "") + ">" + w + "</button>"; });
    h += "</div>";
    if (st.status === "play") {
      h += '<div class="mistakes">Mistakes remaining: ' + Array.apply(null, Array(MAXM)).map(function (_, i) { return '<span class="dot' + (i < MAXM - st.mistakes ? "" : " off") + '"></span>'; }).join("") + "</div>";
      h += '<div class="ctrls"><button class="btn sec" id="shuf">Shuffle</button><button class="btn sec" id="clr"' + (sel.length ? "" : " disabled") + '>Deselect</button><button class="btn sec" id="peek"' + (peeks.length >= 2 || peeks.length >= 4 - st.solved.length ? " disabled" : "") + '>Peek (-10)</button><button class="btn accent" id="sub"' + (sel.length === 4 ? "" : " disabled") + ">Submit</button></div>";
    } else h += '<div class="ctrls"><button class="btn accent" id="res">Results</button></div>';
    app.innerHTML = h;
    Array.prototype.forEach.call(app.querySelectorAll(".ctile"), function (b) { b.onclick = function () { var w = b.dataset.w, i = sel.indexOf(w); if (i >= 0) sel.splice(i, 1); else if (sel.length < 4) sel.push(w); render(); }; });
    var g = function (id, f) { var e = document.getElementById(id); if (e) e.onclick = f; };
    g("shuf", function () { st.order = PD.shuffle(st.order); PD.save(KEY, st); render(); });
    g("clr", function () { sel = []; render(); });
    g("sub", submit);
    g("res", results);
    g("peek", function () {
      var cand = [0, 1, 2, 3].filter(function (i) { return st.solved.indexOf(i) < 0 && st.peeks.indexOf(i) < 0; });
      if (!cand.length) return; st.peeks.push(cand[Math.floor(Math.random() * cand.length)]); PD.save(KEY, st); render();
    });
  }
  function submit() {
    var g = sel.slice(); st.guesses.push(g);
    var counts = [0, 0, 0, 0]; g.forEach(function (w) { counts[gidx(w)]++; });
    var win = counts.indexOf(4);
    if (win >= 0) {
      st.solved.push(win); sel = [];
      if (st.solved.length === 4) { st.status = "won"; PD.record("fours", date, true, st.mistakes); PD.save(KEY, st); render(); PD.confetti(); setTimeout(results, 900); return; }
    } else {
      st.mistakes++;
      var one = counts.indexOf(3) >= 0;
      PD.toast(one ? "One away!" : "Not a group");
      var tiles = app.querySelectorAll(".ctile.sel"); Array.prototype.forEach.call(tiles, function (t) { t.classList.add("shake"); });
      if (st.mistakes >= MAXM) {
        st.status = "lost"; PD.record("fours", date, false, "X");
        [0, 1, 2, 3].forEach(function (i) { if (st.solved.indexOf(i) < 0) st.solved.push(i); });
        sel = []; PD.save(KEY, st); setTimeout(function () { render(); setTimeout(results, 900); }, 500); return;
      }
      PD.save(KEY, st); setTimeout(render, 450); return;
    }
    PD.save(KEY, st); render();
  }
  function text() {
    var sq = ["", "🟨", "🟩", "🟦", "🟪"];
    return "Fours No. " + PD.number(date) + " · " + (st.status === "won" ? score() + " pts" : "X") + (st.peeks.length ? " 👀×" + st.peeks.length : "") + "\n" + st.guesses.map(function (g) { return g.map(function (w) { return sq[LV(gidx(w))]; }).join(""); }).join("\n");
  }
  function results() { PD.results("fours", [0, 1, 2, 3, "X"], st.status === "won" ? st.mistakes : "X", text(), "Fours"); }
  render();
  if (!PD.load("fo:seen", false)) { PD.save("fo:seen", true); setTimeout(function () { PD.modal(HELP); }, 300); }
})();
