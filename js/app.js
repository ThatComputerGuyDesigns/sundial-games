import * as C from "./core.js";
import { GAMES, BY_ID, CATS, icon } from "./registry.js";
const { I, esc } = C;

C.applyTheme();
const root = document.getElementById("root");
const MARK = `<svg class="mark" viewBox="0 0 32 32" aria-hidden="true"><defs><linearGradient id="mk" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#5ac8fa"/><stop offset="1" stop-color="#0071e3"/></linearGradient></defs><g transform="rotate(-40 16 16)"><rect x="4" y="10" width="24" height="12" rx="6" fill="url(#mk)"/><path d="M16 10h6a6 6 0 0 1 0 12h-6z" fill="var(--ink)"/></g></svg>`;

/* ---------------- data loading ---------------- */
const loaded = {};
function loadData(name) {
  return (loaded[name] ||= new Promise((res, rej) => { const s = document.createElement("script"); s.src = `data/${name}.js`; s.onload = res; s.onerror = rej; document.head.append(s); }));
}

/* ---------------- chrome ---------------- */
function navBar(active) {
  const l = (h, n, k) => `<a href="${h}" class="${active === k ? "on" : ""}">${n}</a>`;
  return `<header class="nav"><a class="brand" href="#/">${MARK}Daily Dose</a>
    <nav class="navlinks" aria-label="Main">${l("#/", "Today", "home")}${l("#/archive", "Archive", "archive")}${l("#/stats", "Stats", "stats")}</nav>
    <div class="nav-right"><button class="icon-btn" data-theme-toggle aria-label="Toggle dark mode">${document.documentElement.dataset.theme === "dark" ? I.sun : I.moon}</button><button class="icon-btn" data-settings aria-label="Settings">${I.gear}</button></div></header>`;
}
function tabBar(active) {
  const t = (h, n, ic, k) => `<a href="${h}" class="${active === k ? "on" : ""}">${ic}${n}</a>`;
  return `<nav class="tabbar" aria-label="Sections">${t("#/", "Today", I.home, "home")}${t("#/archive", "Archive", I.cal, "archive")}${t("#/stats", "Stats", I.chart, "stats")}</nav>`;
}
function footer() {
  return `<footer class="foot"><div class="container foot-in"><span>© 2026 Daily Dose. New puzzles every day at midnight.</span><span>Progress is saved privately on this device.</span></div></footer>`;
}
function wireChrome() {
  root.querySelector("[data-theme-toggle]")?.addEventListener("click", (e) => {
    C.save("theme", document.documentElement.dataset.theme === "dark" ? "light" : "dark"); C.applyTheme();
    e.currentTarget.innerHTML = document.documentElement.dataset.theme === "dark" ? I.sun : I.moon;
  });
  root.querySelector("[data-settings]")?.addEventListener("click", C.settingsSheet);
}

/* ---------------- home ---------------- */
function home() {
  const t = C.today(), done = GAMES.filter((g) => C.resultOn(g.id, t)), ds = C.dayStreak();
  const todo = GAMES.filter((g) => !C.resultOn(g.id, t));
  const feat = GAMES[(C.num(t) * 5) % GAMES.length];
  const h = new Date().getHours();
  const greet = h < 5 ? "Burning the midnight oil." : h < 12 ? "Good morning." : h < 18 ? "Good afternoon." : "Good evening.";
  const head = done.length === GAMES.length ? `All done.<br><span class="soft">See you tomorrow.</span>` : done.length ? `${greet}<br><span class="soft">${todo.length} to go.</span>` : `${greet}<br><span class="soft">Here's today's dose.</span>`;
  const filter = C.load("filter", "all");
  const card = (g) => {
    const r = C.resultOn(g.id, t), st = C.gameStats(g.id).streak;
    const state = r ? (r.w ? `<span class="state done">${I.check}${esc(r.l)}</span>` : `<span class="state lost">Played</span>`) : `<span class="state go">Play</span>`;
    return `<a class="card" href="#/play/${g.id}" data-cat="${g.cat}" style="--c1:${g.c1};--c2:${g.c2}">${icon(g)}${g.isNew && !r ? `<span class="new">New</span>` : ""}
      <div><h3>${g.name}</h3><p>${g.blurb}</p></div><div class="meta"><span class="mins">${st > 1 ? `🔥 ${st} · ` : ""}${g.t} min</span>${state}</div></a>`;
  };
  root.innerHTML = `${navBar("home")}<main class="view view-home"><div class="container">
    <section class="hero">
      <div><div class="eyebrow">${C.longDate(t)} · No. ${C.num(t)}</div><h1 class="display">${head}</h1></div>
      <div class="progress-card">
        <div class="pc-top"><div><div class="pc-count">${done.length}<span> / ${GAMES.length}</span></div><div class="pc-label">games played today</div></div>
          <span class="streak-pill ${ds.cur ? "hot" : ""}">${I.flame}${ds.cur} day${ds.cur === 1 ? "" : "s"}</span></div>
        <div class="pills" style="--n:${GAMES.length}">${GAMES.map((g) => `<i class="${C.resultOn(g.id, t) ? "on" : ""}" style="--c1:${g.c1};--c2:${g.c2}" title="${g.name}"></i>`).join("")}</div>
        <div class="pc-actions">${todo.length ? `<a class="btn" href="#/play/${todo[0].id}">${done.length ? "Continue" : "Start"} with ${todo[0].name}</a><button class="btn soft" data-random>Surprise me</button>` : `<a class="btn" href="#/stats">See your stats</a><a class="btn soft" href="#/archive">Play the archive</a>`}</div>
      </div>
    </section>
    <a class="feature" href="#/play/${feat.id}" style="--c1:${feat.c1};--c2:${feat.c2}">
      <div class="f-glyph">${feat.glyph}</div><div class="f-tag">Game of the day</div><h2>${feat.name}</h2><p>${feat.blurb}</p>
      <span class="btn">${C.resultOn(feat.id, t) ? "View result" : "Play now"}</span></a>
    <div class="games-head"><h2 class="title-1">All games</h2>
      <div class="seg" role="group" aria-label="Filter">${CATS.map(([k, n]) => `<button data-f="${k}" aria-pressed="${k === filter}">${n}</button>`).join("")}</div></div>
    <div class="grid" id="grid">${GAMES.map(card).join("")}</div>
  </div>${footer()}</main>${tabBar("home")}`;
  wireChrome();
  const apply = (f) => { C.save("filter", f); root.querySelectorAll("[data-f]").forEach((b) => b.setAttribute("aria-pressed", b.dataset.f === f)); root.querySelectorAll("#grid .card").forEach((c) => (c.hidden = f !== "all" && c.dataset.cat !== f)); };
  root.querySelectorAll("[data-f]").forEach((b) => (b.onclick = () => apply(b.dataset.f)));
  apply(filter);
  root.querySelector("[data-random]")?.addEventListener("click", () => { location.hash = "#/play/" + todo[Math.floor(Math.random() * todo.length)].id; });
}

/* ---------------- archive ---------------- */
function archive() {
  const max = C.today();
  let sel = C.load("archsel", max); if (sel > max || sel < C.START) sel = max;
  let month = C.parse(sel); month = new Date(month.getFullYear(), month.getMonth(), 1);
  root.innerHTML = `${navBar("archive")}<main class="view view-archive"><div class="container">
    <div class="page-head"><h1 class="display" style="font-size:clamp(40px,6vw,64px)">Archive</h1><p class="sub">Every edition since day one. Replays never affect your streaks.</p></div>
    <div class="cal-wrap"><section class="panel"><div class="cal-head"><h2 style="margin:0" id="mn"></h2><div><button class="icon-btn" id="pm" aria-label="Previous month">${I.back}</button><button class="icon-btn" id="nm" aria-label="Next month">${I.chev}</button></div></div><div class="cal" id="cal"></div></section>
    <section class="panel"><h2 id="dh"></h2><div class="list" id="dl"></div></section></div>
  </div>${footer()}</main>${tabBar("archive")}`;
  wireChrome();
  const drawCal = () => {
    const y = month.getFullYear(), m = month.getMonth(), first = new Date(y, m, 1).getDay(), days = new Date(y, m + 1, 0).getDate();
    root.querySelector("#mn").textContent = month.toLocaleDateString(undefined, { month: "long", year: "numeric" });
    let h = ["S", "M", "T", "W", "T", "F", "S"].map((d) => `<span class="dow">${d}</span>`).join("") + "<span></span>".repeat(first);
    for (let d = 1; d <= days; d++) {
      const ds = C.fmt(new Date(y, m, d)), ok = ds >= C.START && ds <= max, n = ok ? C.doneCountOn(ds) : 0, circ = 2 * Math.PI * 15;
      h += `<button data-d="${ds}" ${ok ? "" : "disabled"} class="${ds === sel ? "sel" : ""} ${ds === max ? "today" : ""}" aria-label="${C.longDate(ds)}${ok ? `, ${n} played` : ""}">${ok ? `<svg viewBox="0 0 34 34"><circle class="rb" cx="17" cy="17" r="15"/><circle class="rf" cx="17" cy="17" r="15" stroke-dasharray="${circ}" stroke-dashoffset="${circ - (circ * n) / GAMES.length}"/></svg>` : ""}${d}</button>`;
    }
    root.querySelector("#cal").innerHTML = h;
    const minM = C.parse(C.START), maxM = C.parse(max);
    root.querySelector("#pm").disabled = y === minM.getFullYear() && m === minM.getMonth();
    root.querySelector("#nm").disabled = y === maxM.getFullYear() && m === maxM.getMonth();
  };
  const drawDay = () => {
    root.querySelector("#dh").textContent = `${C.longDate(sel)} · No. ${C.num(sel)}`;
    root.querySelector("#dl").innerHTML = GAMES.map((g) => { const r = C.resultOn(g.id, sel); return `<a class="list-row" href="#/play/${g.id}${sel === max ? "" : "/" + sel}">${icon(g, "sm")}<div class="nm">${g.name}<small>${r ? (r.w ? "Solved · " + esc(r.l) : "Played · " + esc(r.l)) : "Not played"}</small></div><svg class="chev" viewBox="0 0 24 24"><path d="M9 5l7 7-7 7"/></svg></a>`; }).join("");
  };
  root.querySelector("#cal").onclick = (e) => { const b = e.target.closest("button[data-d]"); if (!b) return; sel = b.dataset.d; C.save("archsel", sel); drawCal(); drawDay(); if (innerWidth < 820) root.querySelector("#dh").scrollIntoView({ behavior: "smooth" }); };
  root.querySelector("#pm").onclick = () => { month = new Date(month.getFullYear(), month.getMonth() - 1, 1); drawCal(); };
  root.querySelector("#nm").onclick = () => { month = new Date(month.getFullYear(), month.getMonth() + 1, 1); drawCal(); };
  drawCal(); drawDay();
}

/* ---------------- stats ---------------- */
function stats() {
  const ds = C.dayStreak(), max = C.today();
  let total = 0, wins = 0;
  const rows = GAMES.map((g) => { const s = C.gameStats(g.id); total += s.played; wins += s.won; return `<a class="list-row" href="#/play/${g.id}">${icon(g, "sm")}<div class="nm">${g.name}<small>${s.played ? Math.round((100 * s.won) / s.played) + "% solved" : "Not played yet"}</small></div><div class="num">${s.played}<small>played</small></div><div class="num">${s.streak}<small>streak</small></div><div class="num">${s.best}<small>best</small></div></a>`; });
  const per = {}; GAMES.forEach((g) => Object.keys(C.results(g.id)).forEach((k) => (per[k] = (per[k] || 0) + 1)));
  let start = C.addDays(max, -181); start = C.addDays(start, -C.parse(start).getDay());
  let heat = ""; const end = C.addDays(max, 6 - C.parse(max).getDay());
  for (let d = start; d <= end; d = C.addDays(d, 1)) { const n = per[d] || 0; heat += `<i class="${n ? "h" + Math.min(4, Math.ceil(n / 5)) : ""} ${d > max ? "fut" : ""}" title="${C.shortDate(d)}: ${n}"></i>`; }
  root.innerHTML = `${navBar("stats")}<main class="view view-stats"><div class="container">
    <div class="page-head"><h1 class="display" style="font-size:clamp(40px,6vw,64px)">Your stats</h1><p class="sub">Stored on this device. No account needed.</p></div>
    <div class="kpis"><div class="kpi"><b>${total}</b><span>Puzzles played</span></div><div class="kpi"><b>${total ? Math.round((100 * wins) / total) : 0}%</b><span>Solve rate</span></div><div class="kpi"><b>${ds.cur}</b><span>Day streak</span></div><div class="kpi"><b>${ds.best}</b><span>Best day streak</span></div></div>
    <section class="panel"><h2>Activity</h2><div class="heat">${heat}</div></section>
    <section class="panel"><h2>Games</h2><div class="list">${rows.join("")}</div></section>
  </div>${footer()}</main>${tabBar("stats")}`;
  wireChrome();
}

/* ---------------- game host ---------------- */
let cleanup = [];
function dispose() { cleanup.forEach((f) => { try { f(); } catch {} }); cleanup = []; }

async function play(id, dateArg) {
  const game = BY_ID[id]; if (!game) return (location.hash = "#/");
  const max = C.today(), d = dateArg && dateArg >= C.START && dateArg <= max ? dateArg : max;
  root.innerHTML = `<header class="gbar" style="--c1:${game.c1};--c2:${game.c2}"><a class="back" href="#/">${I.back}<span>Today</span></a>
    <div class="gt">${icon(game, "xs")}${game.name} <small>#${C.num(d)}</small></div>
    <div class="acts"><button class="icon-btn" data-help aria-label="How to play">${I.help}</button><button class="icon-btn" data-stats aria-label="Statistics">${I.stats}</button></div></header>
    <main class="view stage" id="stage" style="--c1:${game.c1};--c2:${game.c2}">${d !== max ? `<div class="archive-note">Archive · ${C.longDate(d)} · <a href="#/play/${id}">Today</a></div>` : ""}<div id="game" style="width:100%;display:flex;flex-direction:column;align-items:center;flex:1"></div></main>`;
  document.title = `${game.name} · Daily Dose`;
  const [mod] = await Promise.all([import(`./games/${id}.js`).then((m) => m.default), ...game.data.map(loadData)]);
  const el = root.querySelector("#game");
  if (!el) return;
  root.querySelector("[data-help]").onclick = () => C.helpSheet(game, mod);
  root.querySelector("[data-stats]").onclick = () => C.showResults(game, mod, d);
  const KEY = `${id}:${d}`;
  let state;
  const ctx = {
    game, date: d, num: C.num(d), el, isToday: d === max,
    pick: (arr) => arr[((C.diff(C.START, d) % arr.length) + arr.length) % arr.length],
    rng: (salt = "") => C.rng(d + ":" + id + ":" + salt),
    state(def) { state = C.load(KEY, null) || def; return state; },
    save() { C.save(KEY, state); },
    result: () => C.resultOn(id, d),
    finish(r) {
      if (C.resultOn(id, d)) return;
      C.record(id, d, r);
      C.sound(r.win ? "win" : "bad");
      if (r.win && r.confetti !== false) C.confetti([game.c1, game.c2, "#ffffff", "#0071e3"]);
      setTimeout(() => { if (root.contains(el)) C.showResults(game, mod, d); }, r.delay ?? 1100);
    },
    results: () => C.showResults(game, mod, d),
    toast: C.toast, sound: C.sound, I, esc, shuffle: C.shuffle, norm: C.norm, mmss: C.mmss,
    on(target, ev, fn, opt) { target.addEventListener(ev, fn, opt); cleanup.push(() => target.removeEventListener(ev, fn, opt)); },
    every(ms, fn) { const iv = setInterval(fn, ms); cleanup.push(() => clearInterval(iv)); return iv; },
    key(fn, allowInputs) {
      ctx.on(document, "keydown", (e) => {
        if (e.ctrlKey || e.metaKey || e.altKey || C.sheetOpen()) return;
        if (!allowInputs && /INPUT|TEXTAREA/.test(document.activeElement?.tagName)) return;
        fn(e);
      });
    },
    /* timer stored in state.t; runs while running() is true and the tab is visible */
    timer(elm, running) {
      const paint = () => { if (elm) elm.textContent = C.mmss(state.t || 0); };
      paint();
      ctx.every(1000, () => { if (running() && !document.hidden) { state.t = (state.t || 0) + 1; paint(); if (state.t % 5 === 0) ctx.save(); } });
      cleanup.push(() => ctx.save());
    },
    keyboard(container, onKey, opts = {}) {
      const rows = ["qwertyuiop", "asdfghjkl", "<zxcvbnm>"];
      container.className = "kb";
      container.innerHTML = rows.map((r) => `<div class="kb-row">${[...r].map((k) => k === "<" ? `<button class="key wide" data-k="ENTER">${opts.enter || "Enter"}</button>` : k === ">" ? `<button class="key wide" data-k="BACK" aria-label="Delete">${I.backspace}</button>` : `<button class="key" data-k="${k}">${k}</button>`).join("")}</div>`).join("");
      container.onclick = (e) => { const b = e.target.closest("[data-k]"); if (b) { onKey(b.dataset.k); C.sound("tap"); } };
      ctx.key((e) => { if (e.key === "Enter") { e.preventDefault(); onKey("ENTER"); } else if (e.key === "Backspace") onKey("BACK"); else if (/^[a-z]$/i.test(e.key)) onKey(e.key.toLowerCase()); });
      return { paint(map) { container.querySelectorAll(".key[data-k]").forEach((b) => { const s = map[b.dataset.k]; b.classList.remove("k-good", "k-near", "k-miss"); if (s) b.classList.add("k-" + s); }); } };
    },
    shakeEl(x) { x.classList.remove("shake"); void x.offsetWidth; x.classList.add("shake"); C.sound("bad"); }
  };
  mod.mount(ctx);
  if (C.resultOn(id, d) && mod.autoResults !== false) setTimeout(() => { if (root.contains(el) && !C.sheetOpen()) C.showResults(game, mod, d); }, 500);
  const seenKey = "seen:" + id;
  if (!C.load(seenKey, false) && !C.resultOn(id, d)) { C.save(seenKey, true); setTimeout(() => C.helpSheet(game, mod), 350); }
}

/* ---------------- router ---------------- */
function route() {
  dispose();
  document.querySelectorAll(".scrim").forEach((s) => s.remove());
  const h = location.hash.replace(/^#\/?/, "").split("/");
  window.scrollTo(0, 0);
  if (h[0] === "play") return play(h[1], h[2]);
  document.title = "Daily Dose · Daily puzzles, beautifully made";
  if (h[0] === "archive") return archive();
  if (h[0] === "stats") return stats();
  home();
}
addEventListener("hashchange", route);
route();
/* refresh the home view if the date rolls over while open */
let lastDay = C.today();
setInterval(() => { if (C.today() !== lastDay) { lastDay = C.today(); if (!location.hash.startsWith("#/play")) route(); } }, 30000);
if ("serviceWorker" in navigator && location.protocol === "https:") navigator.serviceWorker.register("sw.js").catch(() => {});
