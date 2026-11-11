"""Write/refresh the <head> of every game page and create pages for new games."""
import re, os
ROOT = os.path.join(os.path.dirname(__file__), "..")
NEW = {"hive": "hive", "scramble": "scramble", "crowns": "crowns", "duo": "duo", "nine": "nine", "pixel": "pixel", "sweep": "sweep", "sprint": None}
def head(title):
    return f'''<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover">
<title>{title} · Sundial</title>
<meta name="theme-color" content="#fbf8f2" media="(prefers-color-scheme: light)">
<meta name="theme-color" content="#12110e" media="(prefers-color-scheme: dark)">
<link rel="icon" href="../icons/icon.svg" type="image/svg+xml">
<link rel="apple-touch-icon" href="../icons/icon-192.png">
<link rel="manifest" href="../manifest.json">
<link rel="stylesheet" href="../css/style.css">
<script src="../js/games.js"></script>
<script src="../js/common.js"></script>
</head>'''
for f in sorted(os.listdir(os.path.join(ROOT, "games"))):
    p = os.path.join(ROOT, "games", f); s = open(p).read()
    t = re.search(r"<title>(.*?) · ", s).group(1)
    s = re.sub(r"<head>.*?</head>", head(t), s, flags=re.S)
    open(p, "w").write(s)
for name, data in NEW.items():
    title = name.capitalize()
    data_tag = f'<script src="../data/{data}.js"></script>\n' if data else ""
    open(os.path.join(ROOT, "games", name + ".html"), "w").write(f'''<!doctype html>
<html lang="en">
{head(title)}
<body>
<main id="app"></main>
{data_tag}<script src="../js/{name}.js"></script>
</body>
</html>
''')
print("ok")
