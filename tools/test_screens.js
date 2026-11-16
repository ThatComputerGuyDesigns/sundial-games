const { chromium } = require('playwright');
const OUT = process.argv[2], W = +(process.argv[3] || 390), THEME = process.argv[4] || 'light', ONLY = process.argv[5];
const ids = ['five','groups','mini','comb','jumble','steps','link','search','crowns','sudoku','balance','pixels','sweeper','code','bullseye','quickfire','higher','quiz','flags','timeline','movies','artist'];
const routes = ['', 'archive', 'stats'].concat(ids.map(i => 'play/' + i));
(async () => {
  const b = await chromium.launch();
  const ctx = await b.newContext({ viewport: { width: W, height: W < 600 ? 844 : 900 }, colorScheme: THEME });
  await ctx.addInitScript((ids) => { ids.forEach(i => localStorage.setItem('dd:seen:' + i, 'true')); }, ids);
  const errs = [];
  for (const r of routes) {
    if (ONLY && !r.includes(ONLY)) continue;
    const p = await ctx.newPage();
    p.on('pageerror', e => errs.push(r + ': ' + e.message));
    p.on('console', m => { if (m.type() === 'error' && !/fonts|flagcdn|ERR_/.test(m.text())) errs.push(r + ' console: ' + m.text()); });
    await p.goto('http://127.0.0.1:8766/#/' + r); await p.waitForTimeout(700);
    await p.screenshot({ path: `${OUT}/${(r || 'home').replace('play/', 'g_')}-${W}-${THEME}.png`, fullPage: r.indexOf('play') < 0 });
    if (await p.evaluate(() => document.documentElement.scrollWidth > innerWidth + 1)) errs.push(r + ': horizontal overflow');
    await p.close();
  }
  console.log(errs.join('\n') || 'no errors'); await b.close();
})();
