/* Solves every Daily Dose game through the real UI and checks each records a win.
   Usage: (serve the site on :8766) node tools/test_solve.js */
const { chromium } = require('playwright');
const BASE = process.env.BASE || 'http://127.0.0.1:8766/';
const ids = ['five','groups','mini','comb','jumble','steps','link','search','crowns','sudoku','balance','pixels','sweeper','code','bullseye','quickfire','higher','quiz','flags','timeline','movies','artist'];
const only = process.argv[2];
(async () => {
  const b = await chromium.launch();
  const ctx = await b.newContext({ viewport: { width: 430, height: 900 } });
  await ctx.addInitScript((ids) => { ids.forEach(i => localStorage.setItem('dd:seen:' + i, 'true')); window.confirm = () => true; }, ids);
  const out = {}, errs = [];
  for (const id of ids) {
    if (only && only !== id) continue;
    const p = await ctx.newPage();
    p.on('pageerror', e => errs.push(id + ': ' + e.message));
    await p.goto(BASE + '#/play/' + id); await p.waitForTimeout(600);
    const pick = (name) => p.evaluate((name) => { const a = window[name]; const n = Math.round((new Date(new Date().toDateString()) - new Date(2026, 10, 9)) / 864e5); return a[n % a.length]; }, name);
    const key = async (s) => { for (const ch of s) await p.keyboard.press(ch === '\n' ? 'Enter' : ch); };
    try {
      if (id === 'five') { const ord = await pick('LB').catch(() => null); const ans = await p.evaluate(() => { const n = Math.round((new Date(new Date().toDateString()) - new Date(2026, 10, 9)) / 864e5); return CLUES[LB.order[n % LB.order.length]][0]; }); await key(ans + '\n'); }
      if (id === 'groups') { const P = await pick('FOURS'); for (const g of P) { for (const w of g.w) await p.click(`.grp-tile[data-w="${w}"]`); await p.click('#sb'); await p.waitForTimeout(700); } }
      if (id === 'mini') { const P = await pick('XW'); const sol = Array(25).fill(null); P.a.forEach(([w], k) => [...w].forEach((c, j) => sol[k * 10 + j] = c)); P.d.forEach(([w], k) => [...w].forEach((c, r) => sol[r * 5 + k * 2] = c)); for (let i = 0; i < 25; i++) if (sol[i]) { await p.click(`.mc[data-i="${i}"]`); await p.keyboard.press(sol[i]); } }
      if (id === 'comb') { const P = await pick('HIVE'); for (const w of P.w) { await key(w + '\n'); if (await p.evaluate(() => !!localStorage.getItem('dd:res:comb'))) break; } }
      if (id === 'jumble') { const R = await pick('SCRAMBLE'); for (const r of R) { await key(r[1][0]); await p.waitForTimeout(900); } }
      if (id === 'steps') { const P = await pick('LADDER'); for (const w of P.p.slice(1)) await key(w + '\n'); }
      if (id === 'link') { const R = await pick('TRI'); for (const r of R) { await p.fill('#in', r[1]); await p.press('#in', 'Enter'); await p.waitForTimeout(200); } }
      if (id === 'search') {
        const P = await pick('WS');
        const D = [[0,1],[1,0],[1,1],[1,-1],[0,-1],[-1,0],[-1,-1],[-1,1]];
        for (const w of P.w) {
          let cells = null;
          for (let r = 0; r < 6 && !cells; r++) for (let c = 0; c < 6 && !cells; c++) for (const [dr, dc] of D) { let ok = true; for (let k = 0; k < w.length; k++) { const rr = r + dr * k, cc = c + dc * k; if (rr < 0 || rr > 5 || cc < 0 || cc > 5 || P.g[rr][cc] !== w[k]) { ok = false; break; } } if (ok) { cells = [r * 6 + c, (r + dr * (w.length - 1)) * 6 + c + dc * (w.length - 1)]; break; } }
          const a = await p.locator('.ws-c').nth(cells[0]).boundingBox(), z = await p.locator('.ws-c').nth(cells[1]).boundingBox();
          await p.mouse.move(a.x + a.width / 2, a.y + a.height / 2); await p.mouse.down();
          await p.mouse.move(z.x + z.width / 2, z.y + z.height / 2, { steps: 6 }); await p.mouse.up(); await p.waitForTimeout(100);
        }
        await p.fill('#in', P.s); await p.press('#in', 'Enter');
      }
      if (id === 'crowns') { const [, sol] = await pick('CROWNS'); const N = sol.length; for (let r = 0; r < N; r++) { const el = p.locator('.cr-c').nth(r * N + +sol[r]); await el.click(); await el.click(); } }
      if (id === 'sudoku') { const [pz, s] = await pick('NINE'); for (let i = 0; i < 81; i++) if (pz[i] === '0') { await p.locator('.sd-c').nth(i).click(); await p.keyboard.press(s[i]); } }
      if (id === 'balance') { const P = await pick('DUO'); for (let i = 0; i < 36; i++) if (P.g[i] === '.') { const el = p.locator('.bal-c').nth(i); await el.click(); if (P.s[i] === '1') await el.click(); } }
      if (id === 'pixels') { const P = await pick('PIXEL'); for (let i = 0; i < P.g.length; i++) if (P.g[i] === '1') await p.locator('.px-c').nth(i).click(); }
      if (id === 'sweeper') { const P = await pick('SWEEP'); const m = new Set(P.m); for (let i = 0; i < P.w * P.h; i++) if (!m.has(i)) { const cls = await p.locator('.sw-c').nth(i).getAttribute('class'); if (!/\bo\b/.test(cls)) await p.locator('.sw-c').nth(i).click(); if (await p.evaluate(() => !!localStorage.getItem('dd:res:sweeper'))) break; } }
      if (id === 'code') { const P = await pick('SAFE'); await key(P.a + '\n'); }
      if (id === 'bullseye') {
        const P = await pick('TARGET'); const om = { '+': '+', '-': '-', '×': '*', '÷': '/', 'x': '*', '*': '*', '/': '/' };
        for (const s of P.s) {
          const m = s.match(/(\d+)\s*(\S)\s*(\d+)\s*=\s*(\d+)/); const [, x, o, y] = m;
          const btns = p.locator('.be-n'); const n = await btns.count(); let xi = -1, yi = -1;
          for (let k = 0; k < n; k++) { const t = (await btns.nth(k).textContent()).trim(); if (t === x && xi < 0) xi = k; else if (t === y && yi < 0) yi = k; }
          await btns.nth(xi).click(); await p.click(`.be-op[data-o="${om[o]}"]`); await btns.nth(yi).click(); await p.waitForTimeout(80);
        }
      }
      if (id === 'quickfire') {
        await p.click('#go'); const t0 = Date.now();
        while (Date.now() - t0 < 20000) { const q = await p.locator('.qf-q').textContent().catch(() => null); if (!q) break; const a = Function('return ' + q.replace('×', '*').replace('÷', '/').replace('−', '-'))(); await key(String(a)); await p.waitForTimeout(140); }
        await p.waitForTimeout(42000);
      }
      if (id === 'higher') { const D = await pick('HILO'); for (let r = 0; r < D.i.length - 1; r++) { await p.click(D.i[r + 1][1] >= D.i[r][1] ? '[data-a="hi"]' : '[data-a="lo"]'); await p.waitForTimeout(1000); } }
      if (id === 'quiz') { const Q = await pick('QZ'); for (let k = 0; k < 5; k++) { await p.click(`.qz-opt[data-o="${Q[k][2].replace(/"/g, '&quot;')}"]`).catch(async () => { await p.locator('.qz-opt', { hasText: Q[k][2] }).first().click(); }); await p.waitForTimeout(150); if (k < 4) await p.click('#nx'); } }
      if (['flags', 'movies', 'artist'].includes(id)) { const P = await pick({ flags: 'FLAGS', movies: 'CINE', artist: 'ENCORE' }[id]); await p.fill('#in', id === 'flags' ? P[1] : id === 'movies' ? P[1] : P[0]); await p.press('#in', 'Enter'); }
      if (id === 'timeline') {
        const EV = await pick('CHRONO'); const sorted = EV.slice().sort((a, b) => a[1] - b[1]).map(e => e[0]);
        for (let i = 0; i < 5; i++) { for (let guard = 0; guard < 6; guard++) { const txt = await p.locator('.tl-item .tx').allTextContents(); const j = txt.indexOf(sorted[i]); if (j <= i) break; await p.locator('.tl-item').nth(j).locator('[data-mv="-1"]').click(); } }
        await p.click('#ck');
      }
      await p.waitForTimeout(1600);
      const r = await p.evaluate((id) => { const all = JSON.parse(localStorage.getItem('dd:res:' + id) || '{}'); return Object.values(all)[0] || null; }, id);
      out[id] = r ? (r.w ? 'WIN ' : 'LOSS ') + r.l : 'NO RESULT';
      if (id === 'five' || id === 'sudoku') await p.screenshot({ path: (process.env.SHOTS || '/tmp') + `/res_${id}.png` });
    } catch (e) { out[id] = 'ERROR ' + e.message.split('\n')[0]; }
    await p.close();
  }
  console.log(out); console.log(errs.join('\n') || 'no page errors');
  await b.close();
})();
