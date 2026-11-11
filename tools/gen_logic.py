"""Generate logic puzzles with unique, no-guess solutions:
Nine (sudoku), Crowns (one crown per row/col/region, no touching), Duo (sun/moon balance grid),
Pixel (nonogram, line-solvable), Sweep (no-guess minesweeper).
Usage: python3 tools/gen_logic.py [count]
"""
import json, random, os, sys, itertools

OUT = os.path.join(os.path.dirname(__file__), "..", "data")
N_DAYS = int(sys.argv[1]) if len(sys.argv) > 1 else 366
rng = random.Random(1109)

def write(name, var, data):
    with open(os.path.join(OUT, name), "w") as f:
        f.write("window.%s=%s;\n" % (var, json.dumps(data, separators=(",", ":"))))
    print(name, len(data))

# ---------------- SUDOKU ----------------
def sud_solve(g, limit=2):
    rows = [0] * 9; cols = [0] * 9; box = [0] * 9; empt = []
    for i, v in enumerate(g):
        r, c = divmod(i, 9)
        if v:
            b = 1 << v
            rows[r] |= b; cols[c] |= b; box[r // 3 * 3 + c // 3] |= b
        else:
            empt.append(i)
    g = g[:]; sols = []
    def rec():
        if not empt:
            sols.append(g[:]); return len(sols) >= limit
        best, bm, bc = None, 0, 10
        for idx, i in enumerate(empt):
            r, c = divmod(i, 9)
            m = ~(rows[r] | cols[c] | box[r // 3 * 3 + c // 3]) & 0x3FE
            n = bin(m).count("1")
            if n < bc:
                best, bm, bc = idx, m, n
                if n <= 1: break
        if bc == 0: return False
        i = empt.pop(best); r, c = divmod(i, 9); bx = r // 3 * 3 + c // 3
        vals = [v for v in range(1, 10) if bm >> v & 1]
        rng.shuffle(vals)
        for v in vals:
            b = 1 << v
            g[i] = v; rows[r] |= b; cols[c] |= b; box[bx] |= b
            if rec(): return True
            rows[r] ^= b; cols[c] ^= b; box[bx] ^= b
        g[i] = 0; empt.insert(best, i)
        return False
    rec()
    return sols

def gen_sudoku(target):
    best = None
    for attempt in range(12):
        sol = sud_solve([0] * 81, 1)[0]
        g = sol[:]
        order = list(range(81)); rng.shuffle(order)
        for sym in (True, False):
            for i in order:
                if sum(1 for v in g if v) <= target: break
                j = 80 - i if sym else i
                if not g[i] or not g[j]: continue
                save = g[i], g[j]
                g[i] = 0; g[j] = 0
                if len(sud_solve(g)) != 1:
                    g[i], g[j] = save
        clues = sum(1 for v in g if v)
        if best is None or abs(clues - target) < abs(best[0] - target):
            best = (clues, g[:], sol)
        if clues <= target + 1: break
    return "".join(map(str, best[1])), "".join(map(str, best[2]))

# ---------------- CROWNS ----------------
def crowns_solutions(reg, n, limit=2):
    sols = []; cols = [False] * n; regs = [False] * n; pos = []
    def rec(r):
        if r == n:
            sols.append(pos[:]); return len(sols) >= limit
        for c in range(n):
            if cols[c] or regs[reg[r][c]]: continue
            if pos and abs(pos[-1] - c) <= 1: continue
            cols[c] = regs[reg[r][c]] = True; pos.append(c)
            if rec(r + 1): return True
            cols[c] = regs[reg[r][c]] = False; pos.pop()
        return False
    rec(0)
    return sols

def gen_crowns(n):
    while True:
        # random valid placement
        perm = None
        for _ in range(2000):
            p = list(range(n)); rng.shuffle(p)
            if all(abs(p[i] - p[i + 1]) > 1 for i in range(n - 1)):
                perm = p; break
        reg = [[-1] * n for _ in range(n)]
        front = []
        for r, c in enumerate(perm):
            reg[r][c] = r; front.append((r, c))
        # grow regions randomly, with uneven sizes
        weights = [rng.random() ** 2 + 0.05 for _ in range(n)]
        left = n * n - n
        while left:
            k = rng.choices(range(n), weights)[0]
            cells = [(r, c) for r in range(n) for c in range(n) if reg[r][c] == k]
            rng.shuffle(cells)
            grown = False
            for r, c in cells:
                nb = [(r + dr, c + dc) for dr, dc in ((1, 0), (-1, 0), (0, 1), (0, -1))]
                nb = [(a, b) for a, b in nb if 0 <= a < n and 0 <= b < n and reg[a][b] == -1]
                if nb:
                    a, b = rng.choice(nb); reg[a][b] = k; left -= 1; grown = True; break
            if not grown:
                weights[k] = 0.0001
        if len(crowns_solutions(reg, n)) == 1:
            return "".join("".join("abcdefghij"[x] for x in row) for row in reg), "".join(map(str, perm))

# ---------------- DUO (6x6) ----------------
def duo_ok_line(line):
    for i in range(len(line) - 2):
        if line[i] != -1 and line[i] == line[i + 1] == line[i + 2]: return False
    n = len(line) // 2
    return line.count(0) <= n and line.count(1) <= n

def duo_solve(given, eq, limit=2):
    # given: list of 36 (-1/0/1); eq: dict ((i,j)) -> True for '=', False for 'x'
    g = given[:]; sols = []
    cons = {}
    for (a, b), v in eq.items():
        cons.setdefault(a, []).append((b, v)); cons.setdefault(b, []).append((a, v))
    def ok(i):
        r, c = divmod(i, 6)
        if not duo_ok_line(g[r * 6:r * 6 + 6]): return False
        if not duo_ok_line(g[c::6]): return False
        for j, v in cons.get(i, []):
            if g[j] != -1 and (g[j] == g[i]) != v: return False
        return True
    def rec(i):
        if i == 36:
            sols.append(g[:]); return len(sols) >= limit
        if g[i] != -1:
            return rec(i + 1)
        for v in (0, 1):
            g[i] = v
            if ok(i) and rec(i + 1): return True
        g[i] = -1
        return False
    rec(0)
    return sols

def gen_duo():
    while True:
        sol = duo_solve([-1] * 36, {}, 1)
        # randomise: solve from random seeds
        seed = [-1] * 36
        for i in rng.sample(range(36), 5): seed[i] = rng.randint(0, 1)
        s = duo_solve(seed, {}, 1)
        if s: sol = s[0]; break
    edges = [(i, i + 1) for i in range(36) if i % 6 < 5] + [(i, i + 6) for i in range(30)]
    eq = {e: sol[e[0]] == sol[e[1]] for e in rng.sample(edges, rng.randint(5, 8))}
    given = sol[:]
    order = list(range(36)); rng.shuffle(order)
    for i in order:
        v = given[i]; given[i] = -1
        if len(duo_solve(given, eq)) != 1: given[i] = v
    gs = "".join("." if v == -1 else str(v) for v in given)
    return {"g": gs, "s": "".join(map(str, sol)), "e": [[a, b, 1 if v else 0] for (a, b), v in eq.items()]}

# ---------------- PIXEL (nonogram) ----------------
def clues(line):
    out, run = [], 0
    for v in line:
        if v: run += 1
        elif run: out.append(run); run = 0
    if run: out.append(run)
    return out or [0]

def line_options(n, cl):
    if cl == [0]: return [[0] * n]
    res = []
    def rec(i, k, acc):
        if k == len(cl):
            res.append(acc + [0] * (n - len(acc))); return
        rem = sum(cl[k:]) + len(cl) - k - 1
        for s in range(i, n - rem + 1):
            a = acc + [0] * (s - len(acc)) + [1] * cl[k]
            if k < len(cl) - 1: a = a + [0]
            rec(len(a), k + 1, a)
    rec(0, 0, [])
    return [r[:n] for r in res]

def nono_solvable(grid, n):
    rc = [clues(grid[r]) for r in range(n)]
    cc = [clues([grid[r][c] for r in range(n)]) for c in range(n)]
    ro = [line_options(n, x) for x in rc]; co = [line_options(n, x) for x in cc]
    cur = [[-1] * n for _ in range(n)]
    changed = True
    while changed:
        changed = False
        for r in range(n):
            ro[r] = [o for o in ro[r] if all(cur[r][c] in (-1, o[c]) for c in range(n))]
            for c in range(n):
                vs = {o[c] for o in ro[r]}
                if len(vs) == 1 and cur[r][c] == -1: cur[r][c] = vs.pop(); changed = True
        for c in range(n):
            co[c] = [o for o in co[c] if all(cur[r][c] in (-1, o[r]) for r in range(n))]
            for r in range(n):
                vs = {o[r] for o in co[c]}
                if len(vs) == 1 and cur[r][c] == -1: cur[r][c] = vs.pop(); changed = True
    return all(v != -1 for row in cur for v in row)

PAL = ["#e8590c", "#2b8a3e", "#1971c2", "#9c36b5", "#c2255c", "#0c8599", "#e67700", "#5f3dc4", "#d6336c", "#2f9e44"]
def gen_pixel(n):
    while True:
        half = (n + 1) // 2
        g = [[1 if rng.random() < 0.55 else 0 for _ in range(half)] for _ in range(n)]
        # smooth once (cellular automaton) for blobby sprite shapes
        h = [[0] * half for _ in range(n)]
        for r in range(n):
            for c in range(half):
                s = sum(g[a][b] for a in range(r - 1, r + 2) for b in range(c - 1, c + 2)
                        if 0 <= a < n and 0 <= b < half)
                h[r][c] = 1 if s >= 5 or (g[r][c] and s >= 4) else 0
        full = [row + row[::-1][(n % 2):] for row in h]
        full = [row[:n] for row in full]
        fill = sum(map(sum, full)) / (n * n)
        if not (0.4 <= fill <= 0.68): continue
        if any(sum(row) == 0 for row in full): continue
        if nono_solvable(full, n):
            return {"n": n, "g": "".join("".join(map(str, row)) for row in full), "c": rng.choice(PAL)}

# ---------------- SWEEP (no-guess minesweeper) ----------------
def sweep_gen(W, H, M):
    while True:
        cells = list(range(W * H))
        sr, sc = rng.randint(2, H - 3), rng.randint(2, W - 3)
        start = sr * W + sc
        safe = {(sr + a) * W + (sc + b) for a in (-1, 0, 1) for b in (-1, 0, 1)}
        mines = set(rng.sample([c for c in cells if c not in safe], M))
        def nbrs(i):
            r, c = divmod(i, W)
            return [(r + a) * W + (c + b) for a in (-1, 0, 1) for b in (-1, 0, 1)
                    if (a or b) and 0 <= r + a < H and 0 <= c + b < W]
        num = [sum(1 for j in nbrs(i) if j in mines) for i in cells]
        opened = set(); flagged = set()
        def open_(i):
            stack = [i]
            while stack:
                x = stack.pop()
                if x in opened: continue
                opened.add(x)
                if num[x] == 0:
                    stack.extend(j for j in nbrs(x) if j not in opened)
        open_(start)
        progress = True
        while progress:
            progress = False
            constraints = []
            for i in list(opened):
                unk = [j for j in nbrs(i) if j not in opened and j not in flagged]
                if not unk: continue
                need = num[i] - sum(1 for j in nbrs(i) if j in flagged)
                if need == 0:
                    for j in unk: open_(j)
                    progress = True
                elif need == len(unk):
                    flagged.update(unk); progress = True
                else:
                    constraints.append((frozenset(unk), need))
            if progress: continue
            # subset rule
            for a, na in constraints:
                for b, nb in constraints:
                    if a < b:
                        d = b - a; dn = nb - na
                        if dn == 0:
                            for j in d: open_(j)
                            progress = True
                        elif dn == len(d):
                            flagged.update(d); progress = True
                if progress: break
        if len(opened) == W * H - M:
            return {"w": W, "h": H, "s": start, "m": sorted(mines)}

# ---------------- run ----------------
if __name__ == "__main__":
    which = os.environ.get("ONLY", "nine,crowns,duo,pixel,sweep").split(",")
    if "nine" in which:
        # weekday difficulty by puzzle number (day 1 = Mon 2026-11-09): Mon easiest .. Sun hardest
        targets = [36, 33, 30, 28, 26, 25, 24]
        nine = []
        for d in range(N_DAYS):
            p, s = gen_sudoku(targets[d % 7])
            nine.append([p, s])
        write("nine.js", "NINE", nine)
    if "crowns" in which:
        sizes = [6, 7, 7, 8, 8, 9, 9]
        write("crowns.js", "CROWNS", [list(gen_crowns(sizes[d % 7])) for d in range(N_DAYS)])
    if "duo" in which:
        write("duo.js", "DUO", [gen_duo() for d in range(N_DAYS)])
    if "pixel" in which:
        sizes = [10, 10, 10, 12, 12, 12, 15]
        write("pixel.js", "PIXEL", [gen_pixel(sizes[d % 7]) for d in range(N_DAYS)])
    if "sweep" in which:
        write("sweep.js", "SWEEP", [sweep_gen(9, 12, 18 + (d % 7)) for d in range(N_DAYS)])
