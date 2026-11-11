(function () {
  var HELP = "<h2>How to play Hive</h2><p>Make words using the seven letters in the honeycomb. Every word must:</p><ul><li>be at least <b>4 letters</b> long</li><li>include the <b>golden centre letter</b></li></ul><p>Letters can be reused as often as you like.</p><p><b>Scoring:</b> four-letter words are worth 1 point; longer words score 1 point per letter. Every puzzle has at least one <b>pangram</b> that uses all seven letters, worth 7 bonus points.</p><p>Climb the ranks as you score. Reach <b>Genius</b> to complete the day, or tap <b>Wrap up</b> to see every answer.</p>";
  var RANKS = [["Larva", 0], ["Hatchling", 2], ["Forager", 5], ["Worker", 8], ["Builder", 15], ["Scout", 25], ["Nectar", 40], ["Golden", 50], ["Genius", 70], ["Queen", 100]];
  var BK = ["Queen", "Genius", "Golden", "Nectar", "Lower"];
  var date = PD.init({ game: "hive", title: "Hive", help: HELP, dist: BK });
  var P = HIVE[PD.index(date, HIVE.length)];
  var LET = P.c + P.o, CEN = P.c;
  var KEY = "hv:" + date;
  var st = PD.load(KEY, { f: [], order: P.o.split(""), status: "play" });
  var cur = "";
  var app = document.getElementById("app");
  function isPan(w) { for (var i = 0; i < 7; i++) if (w.indexOf(LET[i]) < 0) return false; return true; }
  function pts(w) { return (w.length === 4 ? 1 : w.length) + (isPan(w) ? 7 : 0); }
  var MAX = P.w.reduce(function (a, w) { return a + pts(w); }, 0);
  function score() { return st.f.reduce(function (a, w) { return a + pts(w); }, 0); }
  function rankIdx(s) { var p = 100 * s / MAX, r = 0; RANKS.forEach(function (k, i) { if (p >= k[1]) r = i; }); return r; }
  function bucket() { var r = rankIdx(score()); return r >= 9 ? "Queen" : r === 8 ? "Genius" : r === 7 ? "Golden" : r === 6 ? "Nectar" : "Lower"; }

  app.innerHTML =
    '<div class="hv-top"><span class="hv-rank" id="rank"></span><div class="hv-bar" id="bar"></div><span class="hv-score" id="sc"></span></div>' +
    '<details class="hv-found" id="found"><summary><span id="fcount"></span><span>▾</span></summary><div class="hv-words" id="fw"></div></details>' +
    '<div class="hv-input" id="inp" aria-live="polite"></div>' +
    '<div class="comb" id="comb" style="aspect-ratio:1"></div>' +
    '<div class="ctrls"><button class="btn ghost" id="del">Delete</button><button class="btn ghost" id="shuf" aria-label="Shuffle letters">⟳ Shuffle</button><button class="btn" id="ent">Enter</button></div>' +
    '<div class="ctrls" style="margin-top:14px"><button class="btn ghost" id="wrap" style="min-height:36px;padding:6px 14px;font-size:.82rem">Wrap up &amp; reveal</button></div>';
  var POS = [[33.5, 35.71], [33.5, 5.4], [59.7, 20.56], [59.7, 50.86], [33.5, 66], [7.3, 50.86], [7.3, 20.56]];

  function drawComb() {
    var letters = [CEN].concat(st.order);
    document.getElementById("comb").innerHTML = letters.map(function (l, i) {
      return '<button class="cell' + (i === 0 ? " mid" : "") + '" data-l="' + l + '" style="left:' + POS[i][0] + "%;top:" + POS[i][1] + '%" aria-label="' + l.toUpperCase() + (i === 0 ? ", centre letter" : "") + '">' + l + "</button>";
    }).join("");
    Array.prototype.forEach.call(document.querySelectorAll(".cell"), function (b) { b.onclick = function () { type(b.dataset.l); }; });
  }
  function drawInput() {
    var h = cur.split("").map(function (ch) { return '<span class="' + (ch === CEN ? "c" : LET.indexOf(ch) < 0 ? "x" : "") + '">' + ch + "</span>"; }).join("");
    document.getElementById("inp").innerHTML = h + '<span class="caret"></span>';
  }
  function drawScore() {
    var s = score(), r = rankIdx(s);
    document.getElementById("rank").textContent = RANKS[r][0];
    document.getElementById("sc").textContent = s;
    var bar = "";
    for (var i = 0; i < RANKS.length; i++) bar += '<i class="' + (i <= r ? "on" : "") + '" title="' + RANKS[i][0] + " · " + Math.ceil(MAX * RANKS[i][1] / 100) + ' pts"></i>';
    document.getElementById("bar").innerHTML = '<div class="fillr" style="width:' + (r / (RANKS.length - 1) * 100) + '%"></div>' + bar;
    document.getElementById("fcount").textContent = "You have found " + st.f.length + " word" + (st.f.length === 1 ? "" : "s");
    var list = st.status === "play" ? st.f.slice().sort() : P.w;
    document.getElementById("fw").innerHTML = list.map(function (w) { var got = st.f.indexOf(w) >= 0; return '<span class="' + (isPan(w) ? "pg " : "") + (got ? "" : "miss") + '">' + w + (got ? "" : " ·") + "</span>"; }).join("");
    document.getElementById("wrap").style.display = st.status === "play" ? "" : "none";
  }
  function type(ch) { if (cur.length < 19) { cur += ch; drawInput(); } }
  function bad(msg) {
    PD.toast(msg);
    var el = document.getElementById("inp"); el.classList.remove("shake"); void el.offsetWidth; el.classList.add("shake");
    setTimeout(function () { cur = ""; drawInput(); }, 450);
  }
  function enter() {
    var w = cur;
    if (!w) return;
    if (w.length < 4) return bad("Too short");
    for (var i = 0; i < w.length; i++) if (LET.indexOf(w[i]) < 0) return bad("Bad letters");
    if (w.indexOf(CEN) < 0) return bad("Missing centre letter");
    if (st.f.indexOf(w) >= 0) return bad("Already found");
    if (P.w.indexOf(w) < 0) return bad("Not in word list");
    var before = rankIdx(score());
    st.f.push(w); cur = "";
    var p = pts(w);
    PD.toast(isPan(w) ? "Pangram! +" + p : (w.length >= 7 ? "Awesome! +" : w.length >= 5 ? "Nice! +" : "Good! +") + p);
    var after = rankIdx(score());
    if (after > before && after >= 5) setTimeout(function () { PD.toast("New rank: " + RANKS[after][0]); }, 900);
    if (after >= 8 && !PD.done("hive")[date]) { PD.record("hive", date, true, bucket()); PD.confetti(); setTimeout(results, 1200); }
    PD.save(KEY, st); drawInput(); drawScore();
  }
  function results() { PD.results("hive", BK, bucket(), text(), "Hive"); }
  function text() { return "Hive No. " + PD.number(date) + " · " + RANKS[rankIdx(score())][0] + "\n🐝 " + score() + " pts · " + st.f.length + " words" + (st.f.some(isPan) ? " · pangram ✨" : ""); }
  document.getElementById("del").onclick = function () { cur = cur.slice(0, -1); drawInput(); };
  document.getElementById("ent").onclick = enter;
  document.getElementById("shuf").onclick = function () { st.order = PD.shuffle(st.order); PD.save(KEY, st); drawComb(); };
  document.getElementById("wrap").onclick = function () {
    if (!confirm("Reveal every answer and finish today's Hive?")) return;
    st.status = "done"; PD.save(KEY, st);
    if (!PD.done("hive")[date]) PD.record("hive", date, rankIdx(score()) >= 5, bucket());
    drawScore(); document.getElementById("found").open = true; results();
  };
  document.addEventListener("keydown", function (e) {
    if (e.ctrlKey || e.metaKey || e.altKey || document.querySelector(".overlay")) return;
    if (e.key === "Enter") { e.preventDefault(); enter(); }
    else if (e.key === "Backspace") { cur = cur.slice(0, -1); drawInput(); }
    else if (e.key === " ") { e.preventDefault(); document.getElementById("shuf").click(); }
    else if (/^[a-zA-Z]$/.test(e.key)) type(e.key.toLowerCase());
  });
  drawComb(); drawInput(); drawScore();
  if (st.status !== "play" || PD.done("hive")[date]) document.getElementById("found").open = true;
  if (!PD.load("hv:seen", false)) { PD.save("hv:seen", true); setTimeout(function () { PD.modal(HELP, null, "help"); }, 300); }
})();
