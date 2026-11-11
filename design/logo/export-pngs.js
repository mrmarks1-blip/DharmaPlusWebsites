// Makes the two logo images from the source file in this folder.
// Run from the repo root:  node design/logo/export-pngs.js
// It removes the cream box behind the full logo, centres the bowl (spoon to the right),
// and writes practice/soup-mark.png (128 px) and practice/soup-logo.png (690 px wide).
const {chromium} = require('playwright');
const fs = require('fs'), path = require('path');
const src = path.join(__dirname, 'dharmasoup_logo_samantabhadraV5.html');
let html = fs.readFileSync(src, 'utf8')
  .replace('<rect width="400" height="400" fill="#F7EFE2"/>\n', '')
  .replace('<g transform="translate(-26 0)"><use href="#bowlBackL"/>', '<g><use href="#bowlBackL"/>')
  .replace('translate(338 110) rotate(7)', 'translate(364 110) rotate(7)');
(async () => {
  const b = await chromium.launch();
  const p = await b.newPage({viewport: {width: 1000, height: 1000}});
  await p.setContent(html); await p.waitForTimeout(500);
  await p.evaluate(() => {
    document.body.style.background = 'transparent';
    const s = document.querySelector('svg[width="64"]');
    s.setAttribute('width', '128'); s.setAttribute('height', '128'); s.id = 'mark';
    document.body.prepend(s);
    const f = document.querySelector('svg[viewBox="0 0 400 400"]');
    f.id = 'full'; f.style.border = '0'; f.style.borderRadius = '0';
    Object.assign(f.parentElement.style, {maxWidth: 'none', flex: 'none', width: '690px'});
    const r = f.getBBox(), half = Math.max(200 - r.x, r.x + r.width - 200) + 4;
    f.setAttribute('viewBox', `${200 - half} ${r.y - 4} ${2 * half} ${r.height + 8}`);
  });
  await (await p.$('#mark')).screenshot({path: 'practice/soup-mark.png', omitBackground: true});
  await (await p.$('#full')).screenshot({path: 'practice/soup-logo.png', omitBackground: true});
  await b.close();
})();
