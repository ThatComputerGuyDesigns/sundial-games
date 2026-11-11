"""Generate Hive (7-letter honeycomb) and Scramble (anagram) puzzles.
Word lists: SCOWL via the npm package `wordlist-english` (levels 10-35 = common words).
Usage: python3 tools/gen_words.py <path-to-wordlist-english-dir>
"""
import json, random, sys, os
from collections import defaultdict

src = sys.argv[1]
out = os.path.join(os.path.dirname(__file__), "..", "data")
BLOCK = set("""anal anus arse bastard bitch boob boobs butt crap damn dick dildo dyke fag faggot fuck fucker
gook homo jerk kike nazi negro nigga nigger penis piss porn prick pube pubes queer rape raped rapist
retard scum semen sex sexy shit slut smut spic tit tits turd twat vagina wank whore hell kill killer
killed suicide slave slaves drug drugs coke heroin cocaine bomb""".split())

def load(levels):
    s = set()
    for l in levels:
        for w in json.load(open(os.path.join(src, "english-words-%d.json" % l))):
            if w.isalpha() and w.islower() and w.isascii():
                s.add(w)
    return s

common = load([10, 20])
mid = load([10, 20, 35])
words = sorted(w for w in mid if len(w) >= 4 and w not in BLOCK and len(set(w)) <= 7)

# ---------- HIVE ----------
rng = random.Random(20261109)
pang = sorted(w for w in common if len(set(w)) == 7 and "s" not in w and w not in BLOCK)
by_set = defaultdict(list)
for w in words:
    by_set[frozenset(w)].append(w)
hive, seen = [], set()
cands = pang[:]
rng.shuffle(cands)
for p in cands:
    L = frozenset(p)
    if L in seen:
        continue
    for center in rng.sample(sorted(L), 7):
        ans = sorted(w for w in words if set(w) <= L and center in w)
        if not (20 <= len(ans) <= 52):
            continue
        pangrams = [w for w in ans if set(w) == L]
        others = sorted(L - {center})
        rng.shuffle(others)
        hive.append({"c": center, "o": "".join(others), "w": ans})
        seen.add(L)
        break
    if len(hive) >= 400:
        break
rng.shuffle(hive)
print("hive puzzles", len(hive))
with open(os.path.join(out, "hive.js"), "w") as f:
    f.write("window.HIVE=" + json.dumps(hive, separators=(",", ":")) + ";\n")

# ---------- SCRAMBLE ----------
def key(w):
    return "".join(sorted(w))
ana = defaultdict(set)
for w in mid:
    if w.isalpha() and w not in BLOCK:
        ana[key(w)].add(w)
pool = {n: sorted(w for w in common if len(w) == n and w not in BLOCK and not w.endswith("s")
                  and len(set(w)) >= n - 2) for n in (4, 5, 6, 7, 8)}
scr, used = [], set()
for day in range(400):
    rounds = []
    for n in (4, 5, 6, 7, 8):
        while True:
            w = rng.choice(pool[n])
            if w in used:
                continue
            letters = list(w)
            for _ in range(30):
                rng.shuffle(letters)
                if "".join(letters) not in ana[key(w)]:
                    break
            s = "".join(letters)
            if s in ana[key(w)]:
                continue
            used.add(w)
            rounds.append([s, sorted(ana[key(w)])])
            break
    scr.append(rounds)
print("scramble days", len(scr), "unique words", len(used))
with open(os.path.join(out, "scramble.js"), "w") as f:
    f.write("window.SCRAMBLE=" + json.dumps(scr, separators=(",", ":")) + ";\n")
