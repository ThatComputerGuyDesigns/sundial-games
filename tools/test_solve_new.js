const { chromium } = require('playwright');
const B = 'http://127.0.0.1:8765/games/';
(async () => {
  const b = await chromium.launch(); const res = {};
  const ctx = await b.newContext({ viewport: { width: 430, height: 900 } });
  await ctx.addInitScript(() => { ['hv','sc','cr','du','nn','px','sw'].forEach(k=>localStorage.setItem('pd:'+k+':seen','true')); window.confirm = () => true; });
  const errs = [];
  async function open(name) { const p = await ctx.newPage(); p.on('pageerror', e => errs.push(name + ': ' + e.message)); await p.goto(B + name + '.html'); await p.waitForTimeout(300); return p; }
  async function done(p, id) { await p.waitForTimeout(1500); return p.evaluate(id => PD.done(id)[PD.date()], id); }
  let p;
  // Hive
  p = await open('hive');
  const words = await p.evaluate(() => HIVE[PD.index(PD.date(), HIVE.length)].w);
  for (const w of words) { await p.keyboard.type(w); await p.keyboard.press('Enter'); if (await p.evaluate(() => !!PD.done('hive')[PD.date()])) break; }
  res.hive = await done(p, 'hive');
  // Scramble
  p = await open('scramble');
  const R = await p.evaluate(() => SCRAMBLE[PD.index(PD.date(), SCRAMBLE.length)]);
  for (const r of R) { await p.keyboard.type(r[1][0], { delay: 20 }); await p.waitForTimeout(900); }
  res.scramble = await done(p, 'scramble');
  // Crowns
  p = await open('crowns');
  const C = await p.evaluate(() => CROWNS[PD.index(PD.date(), CROWNS.length)]);
  const N = C[1].length;
  for (let r = 0; r < N; r++) { const el = p.locator('.cr-c').nth(r * N + +C[1][r]); await el.click(); await el.click(); }
  res.crowns = await done(p, 'crowns');
  // Duo
  p = await open('duo');
  const D = await p.evaluate(() => DUO[PD.index(PD.date(), DUO.length)]);
  for (let i = 0; i < 36; i++) if (D.g[i] === '.') { const el = p.locator('.duo-c').nth(i); await el.click(); if (D.s[i] === '1') await el.click(); }
  res.duo = await done(p, 'duo');
  // Nine
  p = await open('nine');
  const S = await p.evaluate(() => NINE[PD.index(PD.date(), NINE.length)]);
  for (let i = 0; i < 81; i++) if (S[0][i] === '0') { await p.locator('.nn-c').nth(i).click(); await p.keyboard.press(S[1][i]); }
  res.nine = await done(p, 'nine');
  // Pixel
  p = await open('pixel');
  const X = await p.evaluate(() => PIXEL[PD.index(PD.date(), PIXEL.length)]);
  for (let i = 0; i < X.g.length; i++) if (X.g[i] === '1') await p.locator('.px-c').nth(i).click();
  res.pixel = await done(p, 'pixel');
  // Sweep
  p = await open('sweep');
  const W = await p.evaluate(() => SWEEP[PD.index(PD.date(), SWEEP.length)]);
  const mines = new Set(W.m);
  for (let i = 0; i < W.w * W.h; i++) if (!mines.has(i)) { const cls = await p.locator('.sw-c').nth(i).getAttribute('class'); if (!/\bo\b/.test(cls)) await p.locator('.sw-c').nth(i).click(); if (await p.evaluate(() => !!PD.done('sweep')[PD.date()])) break; }
  res.sweep = await done(p, 'sweep');
  // Sprint
  p = await open('sprint');
  await p.click('#go');
  const t0 = Date.now();
  while (Date.now() - t0 < 30000) {
    const q = await p.locator('#q').textContent().catch(() => null); if (!q) break;
    const a = Function('return ' + q.replace('×', '*').replace('÷', '/').replace('−', '-'))();
    await p.keyboard.type(String(a)); await p.waitForTimeout(160);
  }
  await p.waitForTimeout(32000);
  res.sprint = await done(p, 'sprint') + ' score=' + await p.evaluate(() => JSON.parse(localStorage.getItem('pd:sp:' + PD.date())).log.length);
  await p.screenshot({ path: process.argv[2] + '/sprint_done.png' });
  console.log(JSON.stringify(res, null, 1)); console.log(errs.join('\n') || 'no page errors');
  await b.close();
})();
