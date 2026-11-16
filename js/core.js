/* Daily Dose core: dates, storage, results, UI primitives */
import { GAMES, BY_ID, icon } from "./registry.js";

export const START = "2026-11-09";
const pad = (n) => String(n).padStart(2, "0");
export const fmt = (d) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
export const parse = (s) => { const [y, m, d] = s.split("-").map(Number); return new Date(y, m - 1, d); };
export const today = () => { const t = fmt(new Date()); return t < START ? START : t; };
export const addDays = (s, n) => { const d = parse(s); d.setDate(d.getDate() + n); return fmt(d); };
export const diff = (a, b) => Math.round((parse(b) - parse(a)) / 864e5);
export const num = (d) => diff(START, d) + 1;
export const longDate = (s) => parse(s).toLocaleDateString(undefined, { weekday: "long", month: "long", day: "numeric" });
export const shortDate = (s) => parse(s).toLocaleDateString(undefined, { month: "short", day: "numeric" });
export const mmss = (s) => `${Math.floor(s / 60)}:${pad(Math.floor(s % 60))}`;
export const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
export const norm = (s) => String(s).toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/&/g, "and").replace(/^the\s+/, "").replace(/[^a-z0-9]/g, "");

/* seeded RNG */
export function rng(seedStr) {
  let h = 1779033703 ^ seedStr.length;
  for (let i = 0; i < seedStr.length; i++) { h = Math.imul(h ^ seedStr.charCodeAt(i), 3432918353); h = (h << 13) | (h >>> 19); }
  return () => { h = Math.imul(h ^ (h >>> 16), 2246822507); h = Math.imul(h ^ (h >>> 13), 3266489909); h ^= h >>> 16; return (h >>> 0) / 4294967296; };
}
export const shuffle = (arr, r = Math.random) => { const a = arr.slice(); for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(r() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; };

/* ---------- storage ---------- */
export const load = (k, def) => { try { const v = localStorage.getItem("dd:" + k); return v == null ? def : JSON.parse(v); } catch { return def; } };
export const save = (k, v) => { try { localStorage.setItem("dd:" + k, JSON.stringify(v)); } catch {} };

/* results: dd:res:<id> = { "YYYY-MM-DD": { w, b, l, live } } */
export const results = (id) => load("res:" + id, {});
export const resultOn = (id, d) => results(id)[d];
export function record(id, d, r) {
  const all = results(id);
  if (all[d]) return all[d];
  all[d] = { w: !!r.win, b: r.bucket, l: r.line || "", s: r.share || "", live: d === today() };
  save("res:" + id, all);
  return all[d];
}
export function gameStats(id) {
  const all = results(id), keys = Object.keys(all), live = keys.filter((k) => all[k].live);
  const t = today();
  let streak = 0, d = all[t] && all[t].live ? t : addDays(t, -1);
  while (all[d] && all[d].live && all[d].w) { streak++; d = addDays(d, -1); }
  let best = 0, run = 0;
  live.sort().forEach((k, i, a) => { run = all[k].w && (i === 0 || diff(a[i - 1], k) === 1) && all[a[i - 1]]?.w ? run + 1 : all[k].w ? 1 : 0; best = Math.max(best, run); });
  const dist = {}; live.forEach((k) => { const b = all[k].b; if (b != null) dist[b] = (dist[b] || 0) + 1; });
  return { played: keys.length, won: keys.filter((k) => all[k].w).length, streak, best: Math.max(best, streak), dist };
}
export function doneCountOn(d) { return GAMES.filter((g) => resultOn(g.id, d)).length; }
export function dayStreak() {
  const t = today(), days = new Set();
  GAMES.forEach((g) => { const all = results(g.id); Object.keys(all).forEach((k) => { if (all[k].live) days.add(k); }); });
  let cur = 0, d = days.has(t) ? t : addDays(t, -1);
  while (days.has(d)) { cur++; d = addDays(d, -1); }
  let best = 0, run = 0, prev = null;
  [...days].sort().forEach((k) => { run = prev && diff(prev, k) === 1 ? run + 1 : 1; best = Math.max(best, run); prev = k; });
  return { cur, best, days };
}

/* ---------- theme ---------- */
export function applyTheme() {
  const t = load("theme", "auto");
  const dark = t === "dark" || (t === "auto" && matchMedia("(prefers-color-scheme: dark)").matches);
  document.documentElement.dataset.theme = dark ? "dark" : "light";
  const m = document.querySelector('meta[name="theme-color"]'); if (m) m.content = dark ? "#000000" : "#f5f5f7";
}
matchMedia("(prefers-color-scheme: dark)").addEventListener?.("change", applyTheme);

/* ---------- icons ---------- */
const sv = (p, w = 1.8) => `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="${w}" stroke-linecap="round" stroke-linejoin="round">${p}</svg>`;
export const I = {
  close: sv('<path d="M6 6l12 12M18 6L6 18"/>', 2.4),
  back: sv('<path d="M15 5l-7 7 7 7"/>', 2.4),
  chev: sv('<path d="M9 5l7 7-7 7"/>', 2.2),
  help: sv('<circle cx="12" cy="12" r="9"/><path d="M9.6 9.3a2.5 2.5 0 1 1 3.4 2.4c-.6.3-1 .8-1 1.5"/><circle cx="12" cy="16.6" r=".5" fill="currentColor"/>'),
  stats: sv('<path d="M5 20V11M12 20V4M19 20v-6"/>', 2),
  gear: sv('<circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.7 1.7 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.8-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.1a1.7 1.7 0 0 0-1.1-1.5 1.7 1.7 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.8 1.7 1.7 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1a1.7 1.7 0 0 0 1.5-1.1 1.7 1.7 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.8.3H9a1.7 1.7 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.8V9a1.7 1.7 0 0 0 1.5 1H21a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1z"/>'),
  share: sv('<path d="M12 15V3M7.5 7.5L12 3l4.5 4.5M5 12v7a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-7"/>', 2.1),
  check: sv('<path d="M5 12.5l4.5 4.5L19 7.5"/>', 2.6),
  arrow: sv('<path d="M5 12h14M13 6l6 6-6 6"/>', 2.2),
  flame: '<svg viewBox="0 0 24 24"><path fill="currentColor" d="M12.7 2.3c.3 3-1.1 4.9-2.6 6.6C8.6 10.6 7 12.4 7 15.2 7 18.4 9.4 21 12.5 21S18 18.6 18 15.4c0-2.3-1.1-3.9-2.2-5.1-.2 1.5-.9 2.6-2 3 .6-3.6-.1-8.3-1.1-11z"/></svg>',
  sun: sv('<circle cx="12" cy="12" r="4.2"/><path d="M12 2.5v2M12 19.5v2M4.6 4.6L6 6M18 18l1.4 1.4M2.5 12h2M19.5 12h2M4.6 19.4L6 18M18 6l1.4-1.4"/>'),
  moon: sv('<path d="M20.5 14.2A8.5 8.5 0 1 1 9.8 3.5a6.8 6.8 0 0 0 10.7 10.7z"/>'),
  home: sv('<path d="M3.5 10.5L12 3.5l8.5 7V20a1 1 0 0 1-1 1h-5v-6h-5v6h-5a1 1 0 0 1-1-1z"/>'),
  cal: sv('<rect x="3.5" y="4.5" width="17" height="16" rx="3"/><path d="M3.5 9.5h17M8 2.8v3.4M16 2.8v3.4"/>'),
  chart: sv('<path d="M4 20h16M7 16v-5M12 16V6M17 16v-8"/>'),
  undo: sv('<path d="M9 14L4 9l5-5"/><path d="M4 9h11a5 5 0 0 1 0 10h-3"/>'),
  erase: sv('<path d="M20 20H8.5L3.8 15.3a1.5 1.5 0 0 1 0-2.1L13.2 3.8a1.5 1.5 0 0 1 2.1 0l4.9 4.9a1.5 1.5 0 0 1 0 2.1L12 19"/>'),
  pencil: sv('<path d="M12 20h9M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4z"/>'),
  bulb: sv('<path d="M9 18h6M10 21.5h4M12 2.5a6.5 6.5 0 0 0-3.8 11.8c.5.4.8 1 .8 1.7v.5h6V16c0-.7.3-1.3.8-1.7A6.5 6.5 0 0 0 12 2.5z"/>'),
  shuffle: sv('<path d="M16 3h5v5M4 20L21 3M21 16v5h-5M15 15l6 6M4 4l5 5"/>'),
  trash: sv('<path d="M4 7h16M10 11v6M14 11v6M5.5 7l1 12a2 2 0 0 0 2 2h7a2 2 0 0 0 2-2l1-12M9 7V4h6v3"/>'),
  backspace: sv('<path d="M21 5H9l-6 7 6 7h12a1 1 0 0 0 1-1V6a1 1 0 0 0-1-1zM17 9l-6 6M11 9l6 6"/>'),
  grip: sv('<path d="M5 9h14M5 15h14"/>', 2.2),
  up: sv('<path d="M6 15l6-6 6 6"/>'),
  down: sv('<path d="M6 9l6 6 6-6"/>'),
  eye: sv('<path d="M2 12s3.6-7 10-7 10 7 10 7-3.6 7-10 7S2 12 2 12z"/><circle cx="12" cy="12" r="3"/>')
};

/* ---------- toasts ---------- */
export function toast(msg, ms = 1700) {
  let w = document.querySelector(".toasts");
  if (!w) { w = document.createElement("div"); w.className = "toasts"; w.setAttribute("role", "status"); w.setAttribute("aria-live", "polite"); document.body.append(w); }
  const t = document.createElement("div"); t.className = "toast"; t.textContent = msg; w.append(t);
  setTimeout(() => { t.classList.add("out"); setTimeout(() => t.remove(), 260); }, ms);
}

/* ---------- sheets ---------- */
export function sheet(html, opts = {}) {
  const prev = document.activeElement;
  const scrim = document.createElement("div");
  scrim.className = "scrim";
  scrim.innerHTML = `<div class="sheet" role="dialog" aria-modal="true" tabindex="-1" ${opts.style ? `style="${opts.style}"` : ""}><button class="icon-btn close" aria-label="Close">${I.close}</button>${html}</div>`;
  const el = scrim.firstChild;
  const close = () => {
    if (!scrim.isConnected) return;
    scrim.classList.add("out"); document.removeEventListener("keydown", onKey);
    setTimeout(() => scrim.remove(), 200);
    prev?.focus?.(); opts.onClose?.();
  };
  const onKey = (e) => { if (e.key === "Escape") close(); };
  scrim.addEventListener("mousedown", (e) => { if (e.target === scrim) close(); });
  el.querySelector(".close").onclick = close;
  document.addEventListener("keydown", onKey);
  document.body.append(scrim);
  el.focus({ preventScroll: true });
  return { el, close };
}
export const sheetOpen = () => !!document.querySelector(".scrim");

/* ---------- confetti ---------- */
export function confetti(colors) {
  if (matchMedia("(prefers-reduced-motion: reduce)").matches) return;
  const c = document.createElement("canvas"), dpr = Math.min(2, devicePixelRatio || 1);
  c.style.cssText = "position:fixed;inset:0;width:100%;height:100%;pointer-events:none;z-index:150";
  c.width = innerWidth * dpr; c.height = innerHeight * dpr; document.body.append(c);
  const x = c.getContext("2d"); x.scale(dpr, dpr);
  const cols = colors || ["#0071e3", "#34c759", "#ff9f0a", "#ff375f", "#5e5ce6", "#ffd60a"];
  const ps = Array.from({ length: 140 }, (_, i) => ({ x: innerWidth / 2 + (Math.random() - .5) * 120, y: innerHeight * .42, vx: (Math.random() - .5) * 18, vy: -Math.random() * 15 - 5, r: 5 + Math.random() * 5, a: Math.random() * 6, va: (Math.random() - .5) * .3, c: cols[i % cols.length], s: Math.random() < .5 }));
  let f = 0;
  (function loop() {
    x.clearRect(0, 0, innerWidth, innerHeight);
    ps.forEach((p) => { p.vy += .42; p.vx *= .985; p.vy *= .99; p.x += p.vx; p.y += p.vy; p.a += p.va; x.save(); x.translate(p.x, p.y); x.rotate(p.a); x.fillStyle = p.c; x.globalAlpha = Math.max(0, 1 - f / 170); if (p.s) x.fillRect(-p.r / 2, -p.r / 4, p.r, p.r / 2); else { x.beginPath(); x.arc(0, 0, p.r / 2.6, 0, 7); x.fill(); } x.restore(); });
    if (++f < 170) requestAnimationFrame(loop); else c.remove();
  })();
}

/* ---------- share ---------- */
export function siteUrl() { return location.href.split("#")[0].replace(/index\.html$/, ""); }
export async function share(text) {
  if (/Android|iPhone|iPad/i.test(navigator.userAgent) && navigator.share) { try { await navigator.share({ text }); return; } catch {} }
  try { await navigator.clipboard.writeText(text); toast("Copied to clipboard"); }
  catch { const t = document.createElement("textarea"); t.value = text; document.body.append(t); t.select(); try { document.execCommand("copy"); toast("Copied to clipboard"); } catch { toast("Couldn't copy"); } t.remove(); }
}

/* ---------- countdown ---------- */
export function countdown(el) {
  const tick = () => {
    if (!el.isConnected) return clearInterval(iv);
    const n = new Date(), m = new Date(n.getFullYear(), n.getMonth(), n.getDate() + 1), s = Math.max(0, Math.floor((m - n) / 1000));
    el.textContent = `${pad(Math.floor(s / 3600))}:${pad(Math.floor(s / 60) % 60)}:${pad(s % 60)}`;
  };
  const iv = setInterval(tick, 1000); tick();
}

/* ---------- results sheet ---------- */
const WIN = ["Brilliant", "Nicely done", "Superb", "Sharp", "Flawless", "Splendid", "Lovely work"];
export function nextUnplayed(fromId) {
  const t = today(), i0 = GAMES.findIndex((g) => g.id === fromId);
  for (let k = 1; k <= GAMES.length; k++) { const g = GAMES[(i0 + k) % GAMES.length]; if (!resultOn(g.id, t)) return g; }
  return null;
}
export function showResults(game, mod, d) {
  const r = resultOn(game.id, d), s = gameStats(game.id), buckets = mod.buckets || [];
  const head = r ? (r.w ? WIN[num(d) % WIN.length] + "!" : "Next time") : "Statistics";
  const max = Math.max(1, ...buckets.map((b) => s.dist[b] || 0));
  const dist = buckets.length ? `<h4>Distribution</h4><div class="dist">${buckets.map((b) => { const n = s.dist[b] || 0, me = r && String(r.b) === String(b); return `<div class="dist-row"><span>${esc(b)}</span><div class="dist-bar"><i class="${me ? "me" : ""}" style="width:${Math.max(8, (n / max) * 100)}%">${n}</i></div></div>`; }).join("")}</div>` : "";
  const nx = d === today() ? nextUnplayed(game.id) : null;
  const html = `<div class="res-hero" style="--c1:${game.c1};--c2:${game.c2}">${icon(game, "lg")}<h2>${head}</h2><div class="line">${esc(r ? r.l : game.name)}</div></div>
    <div class="res-stats"><div><b>${s.played}</b><span>Played</span></div><div><b>${s.played ? Math.round((100 * s.won) / s.played) : 0}%</b><span>Solved</span></div><div><b>${s.streak}</b><span>Streak</span></div><div><b>${s.best}</b><span>Best streak</span></div></div>
    <div style="--c1:${game.c1};--c2:${game.c2}">${dist}</div>
    ${r ? `<div class="res-foot"><div class="cd"><small>Next ${esc(game.name)} in</small><b data-cd>--:--:--</b></div><button class="btn" data-share>${I.share}Share</button></div>` : ""}
    ${nx ? `<a class="next-row" href="#/play/${nx.id}">${icon(nx, "sm")}<div class="nm"><small>Up next</small><b>${esc(nx.name)}</b></div><svg class="chev" viewBox="0 0 24 24"><path d="M9 5l7 7-7 7"/></svg></a>` : r && d === today() ? `<p class="center" style="margin-top:18px"><b>That's every game today.</b> See you tomorrow.</p>` : ""}`;
  const sh = sheet(html);
  const cd = sh.el.querySelector("[data-cd]"); if (cd) countdown(cd);
  const b = sh.el.querySelector("[data-share]");
  if (b) b.onclick = () => share(`Daily Dose · ${game.name} #${num(d)}\n${r.l}${r.s ? "\n" + r.s : ""}\n${siteUrl()}`);
  sh.el.querySelector(".next-row")?.addEventListener("click", () => sh.close());
  return sh;
}

export function helpSheet(game, mod) {
  sheet(`<div class="help-head">${icon(game)}<div><h2>${esc(game.name)}</h2><small>How to play</small></div></div>${mod.help}`);
}

export function settingsSheet() {
  const th = load("theme", "auto");
  const sh = sheet(`<h2>Settings</h2>
    <div class="settings-row"><div>Appearance</div><div class="seg" role="radiogroup">${["auto", "light", "dark"].map((t) => `<button aria-pressed="${t === th}" data-t="${t}">${t[0].toUpperCase() + t.slice(1)}</button>`).join("")}</div></div>
    <div class="settings-row"><div>Sound effects<small>Subtle taps and chimes</small></div><input type="checkbox" class="switch" id="snd" ${load("sound", false) ? "checked" : ""}></div>
    <p style="font-size:14px;margin-top:18px">Daily Dose saves your progress on this device only. No accounts, no tracking.</p>
    <button class="btn soft block danger" id="reset" style="margin-top:8px">Reset all progress</button>`);
  sh.el.querySelectorAll("[data-t]").forEach((b) => (b.onclick = () => { save("theme", b.dataset.t); applyTheme(); sh.el.querySelectorAll("[data-t]").forEach((x) => x.setAttribute("aria-pressed", x === b)); }));
  sh.el.querySelector("#snd").onchange = (e) => save("sound", e.target.checked);
  sh.el.querySelector("#reset").onclick = () => { if (confirm("Delete all Daily Dose progress, stats and streaks on this device?")) { Object.keys(localStorage).filter((k) => k.startsWith("dd:")).forEach((k) => localStorage.removeItem(k)); location.reload(); } };
}

/* ---------- tiny sound ---------- */
let actx;
export function sound(kind) {
  if (!load("sound", false)) return;
  try {
    actx = actx || new (window.AudioContext || window.webkitAudioContext)();
    const notes = { tap: [[660, .03]], good: [[880, .08], [1320, .12]], bad: [[220, .12]], win: [[660, .1], [880, .1], [1320, .2]] }[kind] || [[600, .05]];
    let t = actx.currentTime;
    notes.forEach(([f, d]) => { const o = actx.createOscillator(), gn = actx.createGain(); o.type = "sine"; o.frequency.value = f; gn.gain.setValueAtTime(.06, t); gn.gain.exponentialRampToValueAtTime(.0001, t + d); o.connect(gn).connect(actx.destination); o.start(t); o.stop(t + d); t += d * .8; });
  } catch {}
}

export { GAMES, BY_ID, icon };
