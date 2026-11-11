(function () {
  var HELP =
    "<h2>How to play Letterbox</h2><p>Guess the hidden five-letter word in six tries. Every day comes with a <b>clue</b> to point you the right way, and after three guesses you get the first letter. After each guess the tiles show how close you were.</p>" +
    '<p><span class="tile correct" style="display:inline-grid;width:30px;vertical-align:middle;font-size:1rem">W</span> in the word and in the right spot.</p>' +
    '<p><span class="tile present" style="display:inline-grid;width:30px;vertical-align:middle;font-size:1rem">I</span> in the word, wrong spot.</p>' +
    '<p><span class="tile absent" style="display:inline-grid;width:30px;vertical-align:middle;font-size:1rem">N</span> not in the word.</p>' +
    "<p>A new word arrives every day at midnight. Turn on <b>Hard mode</b> in settings to make every guess use the hints you've found.</p>";
  var date = PD.init({
    game: "letterbox", title: "Letterbox", help: HELP,
    onStats: showStats, dist: [1, 2, 3, 4, 5, 6, "X"],
    settings: [{ key: "hard", label: "Hard mode", sub: "Revealed hints must be used in later guesses" }],
    onSetting: function (k, v) {
      if (k === "hard" && v && st.guesses.length && st.status === "play") {
        PD.save("opt:hard", false); PD.toast("Hard mode can only be turned on at the start of a game");
        var c = document.querySelector('[data-k="hard"]'); if (c) c.checked = false;
      }
    }
  });
  var ENTRY = CLUES[LB.order[PD.index(date, LB.order.length)]];
  var ANSWER = ENTRY[0], CLUE = ENTRY[1];
  var VALID = {}; LB.valid.forEach(function (w) { VALID[w] = 1; });
  var KEY = "lb:state:" + date;
  var st = PD.load(KEY, { guesses: [], status: "play" });
  var cur = "", busy = false;
  var clueEl = document.getElementById("clue");
  var board = document.getElementById("board"), kb = document.getElementById("kb"), after = document.getElementById("after");

  function evaluate(g) {
    var res = ["absent", "absent", "absent", "absent", "absent"], pool = {};
    for (var i = 0; i < 5; i++) { if (g[i] === ANSWER[i]) res[i] = "correct"; else pool[ANSWER[i]] = (pool[ANSWER[i]] || 0) + 1; }
    for (i = 0; i < 5; i++) { if (res[i] !== "correct" && pool[g[i]] > 0) { res[i] = "present"; pool[g[i]]--; } }
    return res;
  }
  function paintClue() {
    var h = st.guesses.length >= 3 && st.status === "play" ? '<div style="margin-top:6px;font-size:.85rem;color:var(--muted)">Hint: starts with <b>' + ANSWER[0].toUpperCase() + "</b></div>" : "";
    clueEl.innerHTML = "<small>Today's clue</small><b>" + CLUE + "</b>" + h;
  }
  function buildBoard() {
    board.innerHTML = "";
    for (var r = 0; r < 6; r++) {
      var row = document.createElement("div"); row.className = "brow"; row.id = "r" + r;
      for (var c = 0; c < 5; c++) { var t = document.createElement("div"); t.className = "tile"; row.appendChild(t); }
      board.appendChild(row);
    }
  }
  function paintRow(r, word, ev, animate, done) {
    var tiles = board.children[r].children;
    for (var i = 0; i < 5; i++) {
      (function (i) {
        var t = tiles[i]; t.textContent = word[i] || "";
        if (!ev) { t.className = "tile" + (word[i] ? " filled" : ""); return; }
        if (animate) {
          setTimeout(function () { t.classList.add("flip"); setTimeout(function () { t.className = "tile flip " + ev[i]; }, 250); if (i === 4 && done) setTimeout(done, 520); }, i * 300);
        } else t.className = "tile " + ev[i];
      })(i);
    }
  }
  function keyStates() {
    var rank = { absent: 1, present: 2, correct: 3 }, m = {};
    st.guesses.forEach(function (g) {
      evaluate(g).forEach(function (s, i) { if (!m[g[i]] || rank[s] > rank[m[g[i]]]) m[g[i]] = s; });
    });
    return m;
  }
  function paintKeys() {
    var m = keyStates();
    Array.prototype.forEach.call(kb.querySelectorAll(".key[data-k]"), function (k) { k.className = "key" + (m[k.dataset.k] ? " " + m[k.dataset.k] : ""); });
  }
  function buildKb() {
    var rows = ["qwertyuiop", "asdfghjkl", "+zxcvbnm-"];
    kb.innerHTML = "";
    rows.forEach(function (r) {
      var d = document.createElement("div"); d.className = "krow";
      r.split("").forEach(function (ch) {
        var b = document.createElement("button");
        if (ch === "+") { b.className = "key wide"; b.textContent = "Enter"; b.dataset.k = "ENTER"; b.setAttribute("data-a", "1"); }
        else if (ch === "-") { b.className = "key wide"; b.innerHTML = "⌫"; b.dataset.k = "BACK"; b.setAttribute("data-a", "1"); }
        else { b.className = "key"; b.textContent = ch; b.dataset.k = ch; }
        b.onclick = function () { press(b.dataset.k); b.blur(); };
        d.appendChild(b);
      });
      kb.appendChild(d);
    });
    paintKeys();
  }
  function hardCheck(g) {
    if (!PD.load("opt:hard", false) || !st.guesses.length) return null;
    var last = st.guesses[st.guesses.length - 1], ev = evaluate(last);
    for (var i = 0; i < 5; i++) if (ev[i] === "correct" && g[i] !== last[i]) return "Guess must have " + last[i].toUpperCase() + " in position " + (i + 1);
    for (i = 0; i < 5; i++) if (ev[i] === "present" && g.indexOf(last[i]) < 0) return "Guess must contain " + last[i].toUpperCase();
    return null;
  }
  function press(k) {
    if (st.status !== "play" || busy) return;
    if (k === "BACK") { cur = cur.slice(0, -1); paintRow(st.guesses.length, cur); return; }
    if (k === "ENTER") { submit(); return; }
    if (/^[a-z]$/.test(k) && cur.length < 5) { cur += k; paintRow(st.guesses.length, cur); }
  }
  function shake() { var r = board.children[st.guesses.length]; r.classList.remove("shake"); void r.offsetWidth; r.classList.add("shake"); }
  function submit() {
    if (cur.length < 5) { shake(); PD.toast("Not enough letters"); return; }
    if (!VALID[cur]) { shake(); PD.toast("Not in word list"); return; }
    var h = hardCheck(cur); if (h) { shake(); PD.toast(h, 2200); return; }
    var g = cur, r = st.guesses.length, ev = evaluate(g);
    st.guesses.push(g); cur = ""; paintClue();
    var won = g === ANSWER, lost = !won && st.guesses.length >= 6;
    if (won) st.status = "won"; else if (lost) st.status = "lost";
    PD.save(KEY, st);
    busy = true;
    paintRow(r, g, ev, true, function () {
      busy = false; paintKeys();
      if (won) {
        var row = board.children[r]; row.classList.add("bounce");
        PD.toast(["Genius", "Magnificent", "Impressive", "Splendid", "Great", "Phew"][r], 1800);
        PD.record("letterbox", date, true, st.guesses.length);
        setTimeout(function () { PD.confetti(); finish(true); }, 900);
      } else if (lost) {
        PD.toast(ANSWER.toUpperCase(), 4000);
        PD.record("letterbox", date, false, "X");
        setTimeout(function () { finish(true); }, 1500);
      }
    });
  }
  function resultText() {
    var n = st.status === "won" ? st.guesses.length : "X";
    var lines = st.guesses.map(function (g) {
      return evaluate(g).map(function (s) { return s === "correct" ? "🟩" : s === "present" ? "🟨" : "⬛"; }).join("");
    });
    return "Letterbox No. " + PD.number(date) + " " + n + "/6" + (PD.load("opt:hard", false) ? "*" : "") + "\n\n" + lines.join("\n");
  }
  function showStats() {
    var s = PD.stats("letterbox");
    var extra = "";
    if (st.status !== "play") {
      extra = '<div class="share-row"><div class="cd"><small>Next Letterbox</small><b id="cd">--:--:--</b></div><button class="btn accent" id="shr">Share</button></div>';
    }
    var m = PD.statsModal("letterbox", [1, 2, 3, 4, 5, 6, "X"], st.status === "won" ? st.guesses.length : st.status === "lost" ? "X" : null, extra);
    var cd = m.el.querySelector("#cd");
    if (cd) { var iv = PD.countdown(cd); }
    var sh = m.el.querySelector("#shr"); if (sh) sh.onclick = function () { PD.share(resultText()); };
  }
  function finish(open) {
    after.innerHTML = '<div style="text-align:center"><button class="btn accent" id="res">See results</button>' + (st.status === "lost" ? '<p style="margin:8px 0 0">The word was <b>' + ANSWER.toUpperCase() + "</b></p>" : "") + "</div>";
    document.getElementById("res").onclick = showStats;
    if (open) showStats();
  }
  function restore() {
    buildBoard(); paintClue();
    st.guesses.forEach(function (g, r) { paintRow(r, g, evaluate(g), false); });
    if (st.status !== "play") finish(false);
  }
  buildKb(); restore();
  document.addEventListener("keydown", function (e) {
    if (e.ctrlKey || e.metaKey || e.altKey || document.querySelector(".overlay")) return;
    if (e.key === "Enter") { e.preventDefault(); press("ENTER"); }
    else if (e.key === "Backspace") press("BACK");
    else if (/^[a-zA-Z]$/.test(e.key)) press(e.key.toLowerCase());
  });
  if (!PD.load("lb:seen", false)) { PD.save("lb:seen", true); setTimeout(function () { PD.modal(HELP); }, 300); }
})();
