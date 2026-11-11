(function () {
  var HELP = "<h2>How to play Safecracker</h2><p>Crack the secret code using the clues. Each clue is a past guess plus how it scored:</p><p><b>✓</b> = right digit in the right place<br><b>~</b> = right digit, wrong place<br><b>✗</b> = none of those digits are in the code</p><p>The clues are enough to find exactly one code. Digits can't repeat when the puzzle says so. When you guess wrong, we show which clues your guess breaks.</p>";
  var date = PD.init({ game: "safecracker", title: "Safecracker", help: HELP, dist: [1, 2, 3, 4, 5, "X"] });
  var P = SAFE[PD.index(date, SAFE.length)], MAX = P.d === 4 ? 6 : 5;
  var KEY = "sc:" + date, st = PD.load(KEY, { guesses: [], status: "play" }), cur = "", app = document.getElementById("app");
  function fb(code, g) { var e = 0, c = 0, i, ds = "0123456789"; for (i = 0; i < code.length; i++) if (code[i] === g[i]) e++; for (i = 0; i < 10; i++) { var d = ds[i]; c += Math.min(code.split(d).length - 1, g.split(d).length - 1); } return [e, c - e]; }
  function fbText(e, m) { if (!e && !m) return "✗ nothing correct"; var s = []; if (e) s.push("✓ " + e + " in place"); if (m) s.push("~ " + m + " misplaced"); return s.join(" · "); }
  function render() {
    var h = '<div class="hint">' + (P.x ? "All " + P.d + " digits are different" : "Digits can repeat") + " · Guess " + Math.min(st.guesses.length + 1, MAX) + " of " + MAX + '</div><div class="safe">';
    P.c.forEach(function (c) { h += '<div class="cl"><span class="digs">' + c[0] + '</span><span class="fb">' + fbText(c[1], c[2]) + "</span></div>"; });
    h += "</div>";
    if (st.guesses.length) {
      h += '<h3 style="text-align:center;font-size:.75rem;letter-spacing:.08em;text-transform:uppercase;color:var(--muted)">Your guesses</h3><div class="safe">';
      st.guesses.forEach(function (g) {
        var ok = g === P.a, broken = P.c.filter(function (c) { var f = fb(g, c[0]); return f[0] !== c[1] || f[1] !== c[2]; }).length;
        h += '<div class="cl ' + (ok ? "good" : "bad") + '"><span class="digs">' + g + '</span><span class="fb">' + (ok ? "Cracked!" : "Breaks " + broken + " clue" + (broken === 1 ? "" : "s")) + "</span></div>";
      });
      h += "</div>";
    }
    if (st.status === "play") {
      h += '<div class="dial">';
      for (var i = 0; i < P.d; i++) h += '<div class="dd">' + (cur[i] || "") + "</div>";
      h += '</div><div class="pad">' + "0123456789".split("").map(function (d) { return '<button data-d="' + d + '">' + d + "</button>"; }).join("") + '<button class="wide" data-d="BACK">⌫ Delete</button><button class="wide" data-d="GO" style="background:var(--accent);color:var(--accent-ink)">Try code</button></div>';
    } else {
      h += '<div class="hint" style="font-size:1.1rem">' + (st.status === "won" ? "Safe cracked!" : "The code was <b>" + P.a + "</b>") + '</div><div class="row"><button class="btn accent" id="res">Results</button></div>';
    }
    app.innerHTML = h;
    Array.prototype.forEach.call(app.querySelectorAll("[data-d]"), function (b) { b.onclick = function () { press(b.dataset.d); }; });
    var r = document.getElementById("res"); if (r) r.onclick = results;
  }
  function press(d) {
    if (st.status !== "play") return;
    if (d === "BACK") cur = cur.slice(0, -1);
    else if (d === "GO") {
      if (cur.length < P.d) { PD.toast("Enter " + P.d + " digits"); return; }
      if (P.x && new Set(cur.split("")).size < P.d) { PD.toast("Digits must all be different"); return; }
      if (st.guesses.indexOf(cur) >= 0) { PD.toast("You already tried that"); return; }
      st.guesses.push(cur);
      if (cur === P.a) { st.status = "won"; PD.record("safecracker", date, true, st.guesses.length); }
      else if (st.guesses.length >= MAX) { st.status = "lost"; PD.record("safecracker", date, false, "X"); }
      cur = ""; PD.save(KEY, st); render();
      if (st.status === "won") { PD.confetti(); setTimeout(results, 800); } else if (st.status === "lost") setTimeout(results, 800);
      return;
    } else if (cur.length < P.d) cur += d;
    render();
  }
  document.addEventListener("keydown", function (e) {
    if (document.querySelector(".overlay") || e.ctrlKey || e.metaKey) return;
    if (/^[0-9]$/.test(e.key)) press(e.key); else if (e.key === "Backspace") press("BACK"); else if (e.key === "Enter") press("GO");
  });
  function text() { return "Safecracker No. " + PD.number(date) + " " + (st.status === "won" ? st.guesses.length : "X") + "/" + MAX + "\n" + st.guesses.map(function (g) { return g === P.a ? "🔓" : "🔒"; }).join(""); }
  function results() { PD.results("safecracker", [1, 2, 3, 4, 5, "X"], st.status === "won" ? st.guesses.length : "X", text(), "Safecracker"); }
  render();
  if (!PD.load("sc:seen", false)) { PD.save("sc:seen", true); setTimeout(function () { PD.modal(HELP); }, 300); }
})();
