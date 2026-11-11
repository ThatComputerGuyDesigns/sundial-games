import sys
def shell(title, active, body, script):
    nav = "".join(f'<a href="{h}"{" aria-current=\"page\"" if h==active else ""}{" class=\"hide-s\"" if h=="stats.html" and active!="stats.html" else ""}>{n}</a>' for h,n in [("index.html","Today"),("archive.html","Archive"),("stats.html","Stats")])
    return f'''<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover">
<title>{title} · Sundial</title>
<meta name="theme-color" content="#fbf8f2" media="(prefers-color-scheme: light)">
<meta name="theme-color" content="#12110e" media="(prefers-color-scheme: dark)">
<link rel="icon" href="icons/icon.svg" type="image/svg+xml">
<link rel="apple-touch-icon" href="icons/icon-192.png">
<link rel="manifest" href="manifest.json">
<link rel="stylesheet" href="css/style.css">
<script src="js/common.js"></script>
<script src="js/games.js"></script>
</head>
<body class="hub">
<header class="topbar">
  <a class="brandlink" href="index.html" aria-label="Sundial home"><script>document.write(SD_LOGO)</script><span class="wordmark">Sundial</span></a>
  <nav class="nav" aria-label="Main">{nav}<button class="ibtn" id="theme" aria-label="Switch light and dark theme"></button></nav>
</header>
<main class="wrap" style="max-width:1100px;display:block">
{body}
</main>
<footer class="wrap foot" style="max-width:1100px"><div class="fine" style="margin-top:0;border-top:0"><span>© 2026 Sundial. Made for the morning.</span><span><a href="index.html" style="display:inline">Today's games</a></span></div></footer>
<script>
(function(){{var tb=document.getElementById("theme");function i(){{tb.innerHTML=PD.themeIcon();}}tb.onclick=function(){{PD.toggleTheme();i();}};i();}})();
{script}
</script>
</body>
</html>
'''
