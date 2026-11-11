/* Sundial shared helpers (namespace PD kept for backwards-compatible saved data) */
(function () {
  var PD = (window.PD = {});
  PD.BRAND = "Sundial";
  PD.START = "2026-11-09";
  var pad = (PD.pad = function (n) { return String(n).padStart(2, "0"); });
  PD.fmt = function (d) { return d.getFullYear() + "-" + pad(d.getMonth() + 1) + "-" + pad(d.getDate()); };
  PD.parse = function (s) { var p = s.split("-").map(Number); return new Date(p[0], p[1] - 1, p[2]); };
  PD.today = function () { return PD.fmt(new Date()); };
  PD.diff = function (a, b) {
    var x = a.split("-").map(Number), y = b.split("-").map(Number);
    return Math.round((Date.UTC(y[0], y[1] - 1, y[2]) - Date.UTC(x[0], x[1] - 1, x[2])) / 864e5);
  };
  PD.addDays = function (s, n) { var d = PD.parse(s); d.setDate(d.getDate() + n); return PD.fmt(d); };
  PD.label = function (s) { return PD.parse(s).toLocaleDateString(undefined, { weekday: "long", year: "numeric", month: "long", day: "numeric" }); };
  PD.short = function (s) { return PD.parse(s).toLocaleDateString(undefined, { month: "short", day: "numeric" }); };

  PD.maxDate = function () { var t = PD.today(); return t < PD.START ? PD.START : t; };
  PD.date = function () {
    var m = /[?&]date=(\d{4}-\d{2}-\d{2})/.exec(location.search);
    var max = PD.maxDate();
    if (m && m[1] >= PD.START && m[1] <= max) return m[1];
    return max;
  };
  PD.isToday = function (d) { return d === PD.maxDate(); };
  PD.index = function (d, len) { var n = PD.diff(PD.START, d); return ((n % len) + len) % len; };
  PD.number = function (d) { return PD.diff(PD.START, d) + 1; };
  /* deterministic RNG for a date + salt */
  PD.rng = function (salt) {
    var s = 0, str = PD.date() + ":" + (salt || "");
    for (var i = 0; i < str.length; i++) s = (Math.imul(s ^ str.charCodeAt(i), 2654435761) >>> 0);
    return function () { s = (s + 0x6d2b79f5) >>> 0; var t = s; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
  };

  /* storage (never throws) */
  PD.load = function (k, def) { try { var v = localStorage.getItem("pd:" + k); return v == null ? def : JSON.parse(v); } catch (e) { return def; } };
  PD.save = function (k, v) { try { localStorage.setItem("pd:" + k, JSON.stringify(v)); } catch (e) {} };

  /* theme: "light" | "dark" | "auto" */
  PD.applyTheme = function () {
    var t = PD.load("theme", "auto");
    var dark = t === "dark" || (t === "auto" && window.matchMedia && matchMedia("(prefers-color-scheme: dark)").matches);
    document.documentElement.setAttribute("data-theme", dark ? "dark" : "light");
  };
  PD.setTheme = function (t) { PD.save("theme", t); PD.applyTheme(); };
  PD.applyTheme();
  try { matchMedia("(prefers-color-scheme: dark)").addEventListener("change", PD.applyTheme); } catch (e) {}

  /* stats */
  PD.stats = function (game) { return PD.load(game + ":stats", { played: 0, won: 0, streak: 0, max: 0, last: null, dist: {} }); };
  PD.done = function (game) { return PD.load(game + ":done", {}); };
  PD.record = function (game, date, won, bucket) {
    var d = PD.done(game);
    if (d[date]) return;
    d[date] = won ? "w" : "l";
    PD.save(game + ":done", d);
    var log = PD.load("log", {}); log[date] = (log[date] || 0) + 1; PD.save("log", log);
    if (!PD.isToday(date)) return; /* archive plays don't touch streaks */
    var s = PD.stats(game);
    s.played++;
    if (won) {
      s.won++;
      s.streak = s.last === PD.addDays(date, -1) || s.last === date ? s.streak + 1 : 1;
      s.max = Math.max(s.max, s.streak);
      s.last = date;
    } else { s.streak = 0; s.last = date; }
    if (bucket != null) s.dist[bucket] = (s.dist[bucket] || 0) + 1;
    PD.save(game + ":stats", s);
    var ds = PD.load("daystreak", { cur: 0, max: 0, last: null });
    if (ds.last !== date) {
      ds.cur = ds.last === PD.addDays(date, -1) ? ds.cur + 1 : 1;
      ds.max = Math.max(ds.max, ds.cur); ds.last = date; PD.save("daystreak", ds);
    }
  };
  PD.liveStreak = function (game) {
    var s = PD.stats(game), t = PD.maxDate();
    if (!s.last) return 0;
    return s.last === t || s.last === PD.addDays(t, -1) ? s.streak : 0;
  };
  PD.dayStreak = function () {
    var ds = PD.load("daystreak", { cur: 0, max: 0, last: null }), t = PD.maxDate();
    return { cur: ds.last === t || ds.last === PD.addDays(t, -1) ? ds.cur : 0, max: ds.max, today: ds.last === t };
  };

  /* toast */
  PD.toast = function (msg, ms) {
    var w = document.querySelector(".toast-wrap");
    if (!w) { w = document.createElement("div"); w.className = "toast-wrap"; w.setAttribute("role", "status"); w.setAttribute("aria-live", "polite"); document.body.appendChild(w); }
    var t = document.createElement("div");
    t.className = "toast"; t.textContent = msg; w.appendChild(t);
    setTimeout(function () { t.classList.add("out"); setTimeout(function () { t.remove(); }, 200); }, ms || 1600);
  };

  /* modal */
  var X = '<svg viewBox="0 0 24 24"><path d="M6 6l12 12M18 6L6 18"/></svg>';
  PD.modal = function (html, onClose, cls) {
    var prev = document.activeElement;
    var o = document.createElement("div");
    o.className = "overlay";
    o.innerHTML = '<div class="modal ' + (cls || "") + '" role="dialog" aria-modal="true" tabindex="-1"><button class="ibtn x" aria-label="Close">' + X + "</button>" + html + "</div>";
    function close() {
      o.classList.add("closing");
      document.removeEventListener("keydown", esc);
      setTimeout(function () { o.remove(); }, 160);
      if (prev && prev.focus) try { prev.focus(); } catch (e) {}
      if (onClose) onClose();
    }
    function esc(e) { if (e.key === "Escape") close(); }
    o.addEventListener("mousedown", function (e) { if (e.target === o) close(); });
    o.querySelector(".x").onclick = close;
    document.addEventListener("keydown", esc);
    document.body.appendChild(o);
    o.firstChild.focus();
    return { el: o.firstChild, close: close };
  };

  PD.url = function () {
    var p = location.href.split("?")[0].split("#")[0];
    return p.replace(/\/games\/[^/]*$/, "/").replace(/index\.html$/, "");
  };
  PD.share = function (text) {
    text = text + "\n☀️ " + PD.url();
    var isMobile = /Android|iPhone|iPad|iPod/i.test(navigator.userAgent);
    if (isMobile && navigator.share) { navigator.share({ text: text }).catch(function () {}); return; }
    var done = function () { PD.toast("Copied results to clipboard"); };
    if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(text).then(done, fallback);
    else fallback();
    function fallback() {
      var ta = document.createElement("textarea"); ta.value = text; document.body.appendChild(ta); ta.select();
      try { document.execCommand("copy"); done(); } catch (e) { PD.toast("Couldn't copy"); }
      ta.remove();
    }
  };

  PD.countdown = function (el) {
    function tick() {
      var n = new Date(), m = new Date(n.getFullYear(), n.getMonth(), n.getDate() + 1);
      var s = Math.max(0, Math.floor((m - n) / 1000));
      if (!document.body.contains(el)) return clearInterval(iv);
      el.textContent = pad(Math.floor(s / 3600)) + ":" + pad(Math.floor((s % 3600) / 60)) + ":" + pad(s % 60);
    }
    var iv = setInterval(tick, 1000); tick(); return iv;
  };

  var I = {
    back: '<svg viewBox="0 0 24 24"><path d="M15 5l-7 7 7 7"/></svg>',
    home: '<svg viewBox="0 0 24 24"><path d="M4 11l8-7 8 7v9a1 1 0 0 1-1 1h-4v-6H9v6H5a1 1 0 0 1-1-1z"/></svg>',
    help: '<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="9"/><path d="M9.5 9.5a2.5 2.5 0 1 1 3.5 2.3c-.7.4-1 .9-1 1.7M12 17h.01"/></svg>',
    stats: '<svg viewBox="0 0 24 24"><path d="M5 20V10M12 20V4M19 20v-7"/></svg>',
    gear: '<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="3"/><path d="M12 2v3M12 19v3M4.9 4.9l2.1 2.1M17 17l2.1 2.1M2 12h3M19 12h3M4.9 19.1L7 17M17 7l2.1-2.1"/></svg>',
    cal: '<svg viewBox="0 0 24 24"><rect x="4" y="5" width="16" height="15" rx="2"/><path d="M4 10h16M9 3v4M15 3v4"/></svg>',
    sun: '<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4"/></svg>',
    moon: '<svg viewBox="0 0 24 24"><path d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8z"/></svg>',
    arrow: '<svg viewBox="0 0 24 24"><path d="M5 12h14M13 6l6 6-6 6"/></svg>',
    share: '<svg viewBox="0 0 24 24"><path d="M12 15V3M7 8l5-5 5 5M5 13v6a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-6"/></svg>',
    flame: '<svg viewBox="0 0 24 24"><path d="M12 22c4 0 7-3 7-7 0-3-2-5.5-3.5-7-.4 2-1.5 3-2.5 3 0-3-1-6-4-9 0 4-5 7-5 13 0 4 3 7 8 7z"/></svg>'
  };
  PD.icons = I;
  PD.themeIcon = function () { return document.documentElement.getAttribute("data-theme") === "dark" ? I.sun : I.moon; };
  PD.toggleTheme = function () { PD.setTheme(document.documentElement.getAttribute("data-theme") === "dark" ? "light" : "dark"); };

  /* page chrome: PD.init({game,title,help,onStats,settings,dist}) */
  PD.init = function (o) {
    var date = PD.date();
    PD._game = o.game;
    var meta = window.SD_BY_ID && SD_BY_ID[o.game];
    if (meta) document.documentElement.style.setProperty("--game", meta.col);
    document.body.classList.add("game-page");
    var bar = document.createElement("header");
    bar.className = "topbar";
    bar.innerHTML =
      '<a class="brandlink" href="../index.html" aria-label="Sundial home">' + (window.SD_LOGO || "") + '<span class="wordmark">Sundial</span></a>' +
      '<div class="gtitle">' + (meta ? '<span class="gchip" aria-hidden="true">' + meta.icon + "</span>" : "") + "<h1>" + o.title + "</h1></div>" +
      '<div class="icons">' +
      '<button class="ibtn" id="b-arch" aria-label="Archive" title="Archive">' + I.cal + "</button>" +
      '<button class="ibtn" id="b-help" aria-label="How to play" title="How to play">' + I.help + "</button>" +
      '<button class="ibtn" id="b-stats" aria-label="Statistics" title="Statistics">' + I.stats + "</button>" +
      '<button class="ibtn" id="b-set" aria-label="Settings" title="Settings">' + I.gear + "</button>" +
      "</div>";
    document.body.prepend(bar);
    var db = document.createElement("div");
    db.className = "datebar";
    db.innerHTML = "<span>" + PD.label(date) + "</span><span class=\"dot-sep\">·</span><span>No. " + PD.number(date) + "</span>" + (PD.isToday(date) ? "" : '<a class="tag-today" href="' + location.pathname + '">Back to today</a>');
    bar.after(db);
    document.title = o.title + " · Sundial";

    document.getElementById("b-help").onclick = function () { PD.modal(o.help, null, "help"); };
    document.getElementById("b-stats").onclick = function () { (o.onStats || function () { PD.statsModal(o.game, o.dist || []); })(); };
    document.getElementById("b-arch").onclick = function () { PD.archiveModal(o.game); };
    document.getElementById("b-set").onclick = function () {
      var th = PD.load("theme", "auto");
      var m = PD.modal(
        "<h2>Settings</h2>" +
          '<div class="seg-row"><span>Theme</span><div class="seg" role="radiogroup" aria-label="Theme">' +
          ["auto", "light", "dark"].map(function (t) { return '<button role="radio" aria-checked="' + (th === t) + '" data-t="' + t + '">' + t[0].toUpperCase() + t.slice(1) + "</button>"; }).join("") + "</div></div>" +
          (o.settings ? o.settings.map(function (s) { return '<label class="switch"><span>' + s.label + (s.sub ? "<small>" + s.sub + "</small>" : "") + '</span><input type="checkbox" role="switch" data-k="' + s.key + '"' + (PD.load("opt:" + s.key, false) ? " checked" : "") + "></label>"; }).join("") : "") +
          '<p class="center" style="margin-top:22px"><button class="btn ghost danger" id="s-reset">Reset all my Sundial data</button></p>'
      );
      Array.prototype.forEach.call(m.el.querySelectorAll(".seg button"), function (b) {
        b.onclick = function () { PD.setTheme(b.dataset.t); Array.prototype.forEach.call(m.el.querySelectorAll(".seg button"), function (x) { x.setAttribute("aria-checked", x === b); }); };
      });
      Array.prototype.forEach.call(m.el.querySelectorAll("[data-k]"), function (c) {
        c.onchange = function () { PD.save("opt:" + c.dataset.k, c.checked); if (o.onSetting) o.onSetting(c.dataset.k, c.checked); };
      });
      m.el.querySelector("#s-reset").onclick = function () {
        if (confirm("Delete all saved progress, stats and streaks on this device?")) {
          Object.keys(localStorage).filter(function (k) { return k.indexOf("pd:") === 0; }).forEach(function (k) { localStorage.removeItem(k); });
          location.reload();
        }
      };
    };
    return date;
  };

  PD.archiveModal = function (game) {
    var d = PD.done(game), cur = PD.date(), html = '<h2>Archive</h2><p class="center muted">Replay any past puzzle. Archive plays don\'t affect streaks.</p><div class="archive-list">';
    for (var x = PD.maxDate(); x >= PD.START; x = PD.addDays(x, -1)) {
      html += '<a class="' + (d[x] ? (d[x] === "w" ? "done" : "lost") : "") + (x === cur ? " cur" : "") + '" href="?date=' + x + '"><b>' + PD.short(x) + "</b><small>No. " + PD.number(x) + (d[x] ? (d[x] === "w" ? " · ✓" : " · ✗") : "") + "</small></a>";
    }
    PD.modal(html + '</div><p class="center" style="margin-top:14px"><a class="btn ghost" href="../archive.html">Full archive</a></p>');
  };

  PD.statsModal = function (game, buckets, highlight, extra, head) {
    var s = PD.stats(game), max = 1;
    buckets.forEach(function (b) { max = Math.max(max, s.dist[b] || 0); });
    var html = (head || "<h2>Statistics</h2>") +
      '<div class="stats-grid"><div><b>' + s.played + "</b><span>Played</span></div><div><b>" + (s.played ? Math.round((100 * s.won) / s.played) : 0) + "</b><span>Win %</span></div><div><b>" + PD.liveStreak(game) + "</b><span>Current streak</span></div><div><b>" + s.max + "</b><span>Best streak</span></div></div>";
    if (buckets.length) {
      html += '<h3>Distribution</h3><div class="dist">' + buckets.map(function (b) {
        var n = s.dist[b] || 0;
        return '<div class="row"><i>' + b + '</i><div class="track"><div class="bar' + (String(highlight) === String(b) ? " hl" : "") + '" style="width:' + Math.max(7, (n / max) * 100) + '%">' + n + "</div></div></div>";
      }).join("") + "</div>";
    }
    return PD.modal(html + (extra || ""), null, "stats");
  };

  /* next unplayed game for "up next" */
  PD.nextGame = function (current) {
    if (!window.SD_GAMES) return null;
    var t = PD.maxDate(), i0 = 0;
    SD_GAMES.forEach(function (g, i) { if (g.id === current) i0 = i; });
    for (var k = 1; k < SD_GAMES.length; k++) {
      var g = SD_GAMES[(i0 + k) % SD_GAMES.length];
      if (!PD.done(g.id)[t]) return g;
    }
    return null;
  };

  PD.results = function (game, buckets, highlight, text, label) {
    var date = PD.date(), res = PD.done(game)[date], won = res === "w";
    var meta = window.SD_BY_ID && SD_BY_ID[game];
    var line = (text || "").split("\n")[0].replace(/^[^\d]*No\. \d+\s*·?\s*/, "");
    var head = '<div class="res-head ' + (won ? "won" : "lost") + '">' +
      (meta ? '<span class="res-ico" aria-hidden="true">' + meta.icon + "</span>" : "") +
      "<h2>" + (res ? (won ? pick(["Brilliant!", "Nicely done!", "Solved!", "Superb!", "Sharp work!"], date + game) : pick(["So close.", "Not today.", "Next time!"], date + game)) : "Statistics") + "</h2>" +
      (line ? '<p class="res-line">' + line + "</p>" : "") + "</div>";
    var nx = PD.isToday(date) ? PD.nextGame(game) : null;
    var extra = '<div class="share-row"><div class="cd"><small>Next ' + label + ' in</small><b id="cd">--:--:--</b></div><button class="btn accent" id="shr">' + I.share + " Share</button></div>" +
      (nx ? '<a class="upnext" href="' + nx.f + '.html" style="--g:' + nx.col + '"><span class="un-ico">' + nx.icon + '</span><span class="un-t"><small>Up next</small><b>' + nx.n + "</b><em>" + nx.d + "</em></span>" + I.arrow + "</a>"
        : PD.isToday(date) && window.SD_GAMES ? '<p class="center sweep-done">☀️ That\'s every game today. Full sweep!</p>' : "") +
      '<p class="center" style="margin:10px 0 0"><a class="link" href="../index.html">All games</a></p>';
    var m = PD.statsModal(game, buckets, highlight, extra, head);
    m.el.classList.add("results");
    PD.countdown(m.el.querySelector("#cd"));
    m.el.querySelector("#shr").onclick = function () { PD.share(text); };
    return m;
  };
  function pick(arr, seed) { var h = 0; for (var i = 0; i < seed.length; i++) h = (h * 31 + seed.charCodeAt(i)) | 0; return arr[Math.abs(h) % arr.length]; }

  PD.confetti = function () {
    if (window.matchMedia && matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    var c = document.createElement("canvas");
    c.style.cssText = "position:fixed;inset:0;pointer-events:none;z-index:90;width:100%;height:100%";
    c.width = innerWidth; c.height = innerHeight; document.body.appendChild(c);
    var g = c.getContext("2d"), cols = ["#ffb703", "#fb8500", "#8ecae6", "#a7c957", "#e5989b", "#b5a8f0"], ps = [];
    for (var i = 0; i < 120; i++) ps.push({ x: c.width / 2 + (Math.random() - 0.5) * 80, y: c.height * 0.55, r: 4 + Math.random() * 5, vy: -9 - Math.random() * 9, vx: (Math.random() - 0.5) * 16, c: cols[i % cols.length], a: Math.random() * 6, s: Math.random() * 0.3 });
    var f = 0;
    (function loop() {
      g.clearRect(0, 0, c.width, c.height);
      ps.forEach(function (p) { p.vy += 0.32; p.vx *= 0.985; p.y += p.vy; p.x += p.vx; p.a += p.s; g.save(); g.translate(p.x, p.y); g.rotate(p.a); g.fillStyle = p.c; g.fillRect(-p.r / 2, -p.r, p.r, p.r * 1.8); g.restore(); });
      if (++f < 200) requestAnimationFrame(loop); else c.remove();
    })();
  };

  /* on-screen letter keyboard */
  PD.keyboard = function (el, onKey) {
    var rows = ["qwertyuiop", "asdfghjkl", "+zxcvbnm-"];
    el.className = "kb"; el.innerHTML = "";
    rows.forEach(function (r) {
      var d = document.createElement("div"); d.className = "krow";
      r.split("").forEach(function (ch) {
        var b = document.createElement("button");
        if (ch === "+") { b.className = "key wide"; b.textContent = "Enter"; b.dataset.k = "ENTER"; }
        else if (ch === "-") { b.className = "key wide"; b.innerHTML = '<svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="round"><path d="M21 5H9l-7 7 7 7h12zM17 9l-6 6M11 9l6 6"/></svg>'; b.dataset.k = "BACK"; b.setAttribute("aria-label", "Backspace"); }
        else { b.className = "key"; b.textContent = ch; b.dataset.k = ch; }
        b.onclick = function () { onKey(b.dataset.k); b.blur(); };
        d.appendChild(b);
      });
      el.appendChild(d);
    });
    PD._kbHandler = onKey;
    if (!PD._kbBound) {
      PD._kbBound = true;
      document.addEventListener("keydown", function (e) {
        if (!PD._kbHandler || e.ctrlKey || e.metaKey || e.altKey || document.querySelector(".overlay")) return;
        if (e.target && /INPUT|TEXTAREA/.test(e.target.tagName)) return;
        if (e.key === "Enter") { e.preventDefault(); PD._kbHandler("ENTER"); }
        else if (e.key === "Backspace") PD._kbHandler("BACK");
        else if (/^[a-zA-Z]$/.test(e.key)) PD._kbHandler(e.key.toLowerCase());
      });
    }
  };

  PD.shuffle = function (arr, seed) {
    var a = arr.slice(), s = seed == null ? Math.random() * 1e9 : seed;
    function rnd() { s = (s * 1664525 + 1013904223) % 4294967296; return s / 4294967296; }
    for (var i = a.length - 1; i > 0; i--) { var j = Math.floor(rnd() * (i + 1)); var t = a[i]; a[i] = a[j]; a[j] = t; }
    return a;
  };

  PD.fmtTime = function (s) { return Math.floor(s / 60) + ":" + pad(s % 60); };
  /* simple game timer that pauses when tab hidden */
  PD.timer = function (st, key, el, isRunning) {
    function tick() { if (isRunning() && !document.hidden) { st[key] = (st[key] || 0) + 1; } if (el) el.textContent = PD.fmtTime(st[key] || 0); }
    if (el) el.textContent = PD.fmtTime(st[key] || 0);
    return setInterval(tick, 1000);
  };

  if ("serviceWorker" in navigator && location.protocol === "https:") {
    window.addEventListener("load", function () {
      var base = location.pathname.indexOf("/games/") >= 0 ? "../" : "";
      navigator.serviceWorker.register(base + "sw.js").catch(function () {});
    });
  }
})();
