const { chromium } = require('playwright');
const OUT = process.argv[2], W = +(process.argv[3]||430), THEME = process.argv[4]||'light', ONLY = process.argv[5];
const pages = ['index','archive','stats','games/word','games/mini','games/hive','games/scramble','games/ladder','games/wordscape','games/trifecta','games/fours','games/crowns','games/duo','games/nine','games/pixel','games/sweep','games/outlier','games/target','games/sprint','games/safecracker','games/trivia','games/cinemoji','games/encore','games/flagpole','games/chrono','games/hilo'];
(async () => {
  const b = await chromium.launch();
  const ctx = await b.newContext({ viewport: { width: W, height: W < 600 ? 860 : 900 }, colorScheme: THEME });
  await ctx.addInitScript(() => { ['hv','sc','cr','du','nn','px','sw','fo','lb','wsc','tri','lad','tg'].forEach(k=>localStorage.setItem('pd:'+k+':seen','true')); });
  let errs = [];
  for (const p of pages) {
    if (ONLY && !p.includes(ONLY)) continue;
    const pg = await ctx.newPage();
    pg.on('pageerror', e => errs.push(p + ': ' + e.message));
    pg.on('console', m => { if (m.type() === 'error' && !/fonts|flagcdn|ERR_/.test(m.text())) errs.push(p + ' console: ' + m.text()); });
    await pg.goto('http://127.0.0.1:8765/' + p + '.html', { waitUntil: 'load' });
    await pg.waitForTimeout(500);
    await pg.keyboard.press('Escape').catch(()=>{});
    await pg.waitForTimeout(250);
    await pg.screenshot({ path: OUT + '/' + p.replace('games/','g_') + '-' + W + '-' + THEME + '.png', fullPage: p.indexOf('games')<0 });
    const ov = await pg.evaluate(() => document.documentElement.scrollWidth > innerWidth + 1);
    if (ov) errs.push(p + ': horizontal overflow');
    await pg.close();
  }
  console.log(errs.join('\n') || 'no errors');
  await b.close();
})();
