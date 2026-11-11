import os, sys
sys.path.insert(0, os.path.dirname(__file__))
from page_shell import shell
ROOT = os.path.join(os.path.dirname(__file__), "..")
archive_body = '''<div class="page-h"><h1>The archive</h1><p>Every edition since Sundial began. Pick a day to see and replay its puzzles. Replays never touch your streaks.</p></div>
<div class="months" id="months"></div>
<section class="panel" style="margin-top:26px" id="daypanel"><h2 id="dayh"></h2><div class="daylist" id="daylist"></div></section>'''
archive_js = r'''
(function(){
  var max = PD.maxDate(), G = SD_GAMES, done = {}, sel = PD.load("archsel", max);
  if (sel > max || sel < PD.START) sel = max;
  G.forEach(function(g){ done[g.id] = PD.done(g.id); });
  function count(d){ return G.filter(function(g){ return done[g.id][d]; }).length; }
  var h = "", s = PD.parse(PD.START), e = PD.parse(max);
  var m = new Date(e.getFullYear(), e.getMonth(), 1);
  while (m >= new Date(s.getFullYear(), s.getMonth(), 1)) {
    var y = m.getFullYear(), mo = m.getMonth(), first = new Date(y, mo, 1).getDay(), days = new Date(y, mo + 1, 0).getDate();
    h += '<div class="month panel"><h3>' + m.toLocaleDateString(undefined, {month:"long", year:"numeric"}) + '</h3><div class="mgrid">' + ["S","M","T","W","T","F","S"].map(function(x){return '<span class="dow">'+x+'</span>';}).join("");
    for (var k = 0; k < first; k++) h += "<span></span>";
    for (var d = 1; d <= days; d++) {
      var ds = PD.fmt(new Date(y, mo, d)), ok = ds >= PD.START && ds <= max, c = ok ? count(ds) : 0;
      h += '<button data-d="' + ds + '"' + (ok ? "" : " disabled") + ' class="' + (ds === max ? "today " : "") + (ds === sel ? "sel" : "") + '" aria-label="' + PD.label(ds) + (ok ? ", " + c + " of " + G.length + " played" : "") + '">' + d + (ok ? '<span class="pc"><i style="width:' + (100 * c / G.length) + '%"></i></span>' : "") + "</button>";
    }
    h += "</div></div>";
    m = new Date(y, mo - 1, 1);
  }
  document.getElementById("months").innerHTML = h;
  function show(d){
    sel = d; PD.save("archsel", d);
    Array.prototype.forEach.call(document.querySelectorAll(".mgrid button"), function(b){ b.classList.toggle("sel", b.dataset.d === d); });
    document.getElementById("dayh").textContent = PD.label(d) + " · No. " + PD.number(d) + " · " + count(d) + "/" + G.length + " played";
    document.getElementById("daylist").innerHTML = G.map(function(g){ var r = done[g.id][d]; return '<a class="' + (r === "w" ? "w" : "") + '" href="games/' + g.f + '.html' + (d === max ? "" : "?date=" + d) + '"><i style="background:' + g.col + '">' + g.icon + "</i>" + g.n + "<small>" + (r === "w" ? "✓ Solved" : r ? "Played" : "Play") + "</small></a>"; }).join("");
  }
  document.getElementById("months").onclick = function(e){ var b = e.target.closest("button[data-d]"); if (b && !b.disabled) { show(b.dataset.d); document.getElementById("daypanel").scrollIntoView({behavior:"smooth", block:"start"}); } };
  show(sel);
})();
'''
stats_body = '''<div class="page-h"><h1>Your stats</h1><p>Everything is stored on this device only. No account needed.</p></div>
<div class="kpis" id="kpis"></div>
<section class="panel"><h2>Last six months</h2><div class="heat" id="heat" aria-label="Games played per day"></div><p class="muted" style="font-size:.8rem;margin:8px 0 0">Darker squares mean more games played that day.</p></section>
<section class="panel"><h2>By game</h2><table class="gtable"><thead><tr><th>Game</th><th class="num">Played</th><th class="num hide-s">Win %</th><th class="num">Streak</th><th class="num hide-s">Best</th></tr></thead><tbody id="tbody"></tbody></table></section>'''
stats_js = r'''
(function(){
  var G = SD_GAMES, max = PD.maxDate(), log = PD.load("log", {}), tot = 0, wins = 0, ds = PD.dayStreak();
  var rows = G.map(function(g){ var s = PD.stats(g.id), d = PD.done(g.id), n = Object.keys(d).length, w = Object.keys(d).filter(function(k){return d[k]==="w";}).length; tot += n; wins += w;
    return '<tr><td><a class="gn" href="games/' + g.f + '.html"><i style="background:' + g.col + '">' + g.icon + "</i>" + g.n + '</a></td><td class="num">' + n + '</td><td class="num hide-s">' + (n ? Math.round(100 * w / n) + "%" : "–") + '</td><td class="num">' + PD.liveStreak(g.id) + '</td><td class="num hide-s">' + s.max + "</td></tr>"; });
  document.getElementById("tbody").innerHTML = rows.join("");
  var days = Object.keys(log).length;
  document.getElementById("kpis").innerHTML = [[tot, "Puzzles played"], [tot ? Math.round(100 * wins / tot) + "%" : "–", "Solve rate"], [ds.cur, "Day streak"], [ds.max, "Best day streak"]].map(function(k){ return '<div class="kpi"><b>' + k[0] + "</b><span>" + k[1] + "</span></div>"; }).join("");
  var start = PD.addDays(max, -181), dow = PD.parse(start).getDay(); start = PD.addDays(start, -dow);
  var h = "";
  for (var d = start; d <= PD.addDays(max, 6 - PD.parse(max).getDay()); d = PD.addDays(d, 1)) {
    var n = log[d] || 0, l = n === 0 ? "" : n < 4 ? "l1" : n < 9 ? "l2" : n < 16 ? "l3" : "l4";
    h += '<i class="' + l + (d > max ? " fut" : "") + '" title="' + PD.short(d) + ": " + n + ' played"></i>';
  }
  document.getElementById("heat").innerHTML = h;
})();
'''
open(os.path.join(ROOT, "archive.html"), "w").write(shell("Archive", "archive.html", archive_body, archive_js))
open(os.path.join(ROOT, "stats.html"), "w").write(shell("Your stats", "stats.html", stats_body, stats_js))
print("ok")
