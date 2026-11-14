// Optional end-to-end check: requires Playwright and its Chromium browser.
// SITE_URL can point to a deployed site; otherwise the built docs/ is served locally.
import assert from 'node:assert/strict';
import { createServer } from 'node:http';
import { readFile, mkdir } from 'node:fs/promises';
import { resolve, extname } from 'node:path';
import { fileURLToPath } from 'node:url';

const { chromium } = await import(process.env.PLAYWRIGHT_MODULE || 'playwright');
const project = fileURLToPath(new URL('..', import.meta.url));
const root = resolve(project, 'docs');
const screenDir = process.env.BROWSER_SCREENSHOT_DIR;
let server;
let site = process.env.SITE_URL;
if (!site) {
  server = createServer(async (req, res) => {
    const pathname = decodeURIComponent(new URL(req.url, 'http://localhost').pathname);
    const path = resolve(root, '.' + (pathname === '/' ? '/index.html' : pathname));
    if (!path.startsWith(root + '/')) { res.writeHead(403).end(); return; }
    try {
      const body = await readFile(path);
      const type = {'.html':'text/html; charset=utf-8','.js':'text/javascript; charset=utf-8','.css':'text/css; charset=utf-8','.svg':'image/svg+xml','.txt':'text/plain; charset=utf-8'}[extname(path)] || 'application/octet-stream';
      res.writeHead(200, {'Content-Type':type}); res.end(body);
    } catch { res.writeHead(404).end(); }
  });
  await new Promise(done => server.listen(0, '127.0.0.1', done));
  site = `http://127.0.0.1:${server.address().port}/`;
}

const browser = await chromium.launch({headless:true,...(process.env.CHROMIUM_PATH ? {executablePath:process.env.CHROMIUM_PATH} : {})});
try {
  const context = await browser.newContext({viewport:{width:360,height:800},isMobile:true,hasTouch:true,locale:'th-TH',timezoneId:'America/Los_Angeles'});
  const page = await context.newPage();
  const errors = [];
  const requests = [];
  page.on('pageerror', error => errors.push(error.message));
  page.on('request', request => requests.push(request.url()));
  await page.clock.install({time:new Date('2026-11-14T18:23:45Z')});
  // Intercept only the outward share action; do not send data to an actual app.
  await page.addInitScript(() => {
    Object.defineProperty(navigator, 'share', {value:async data => {window.__testShare = data;},configurable:true});
  });
  await page.goto(site, {waitUntil:'networkidle'});
  await page.getByRole('link',{name:'เริ่มดูดวง ↓'}).tap();
  await page.getByRole('button',{name:'ถัดไป — เลือกเรื่องที่อยากรู้ ↗'}).tap();
  assert.match(await page.getByRole('alert').innerText(), /เลือกวัน เดือน และปีเกิด/);
  await page.getByLabel('วันเกิด',{exact:true}).selectOption('15');
  await page.getByLabel('เดือนเกิด',{exact:true}).selectOption('9');
  await page.getByLabel('ปีเกิด พ.ศ.',{exact:true}).selectOption('2024');
  await page.getByLabel('จังหวัดเกิด',{exact:true}).selectOption('เชียงใหม่');
  assert.equal(await page.getByLabel('จังหวัดเกิด',{exact:true}).locator('option').count(),77);
  assert.equal(await page.getByLabel('เวลาเกิด (เว้นว่างได้)',{exact:true}).inputValue(),'');
  assert.equal(await page.getByLabel('เวลาเกิด (เว้นว่างได้)',{exact:true}).getAttribute('required'),null);
  for (const label of ['วันเกิด','เดือนเกิด','ปีเกิด พ.ศ.','จังหวัดเกิด']) {
    assert.ok((await page.getByLabel(label,{exact:true}).boundingBox()).height >= 56, `${label}: touch target`);
  }

  async function reveal() {
    await page.getByRole('button',{name:'เข้าสู่สำรับไพ่ ↗'}).tap();
    assert.ok(await page.getByRole('button',{name:'อ่านคำทำนาย ↗'}).isDisabled());
    assert.match(await page.locator('.count').innerText(),/0 \/ 3/);
    for (const n of [3,1,2]) await page.getByRole('button',{name:`เปิดไพ่ใบที่ ${n}`,exact:true}).tap();
    const chosenNames = await page.locator('.deck .front b').allTextContents();
    await page.getByRole('button',{name:'อ่านคำทำนาย ↗'}).tap();
    await page.getByRole('heading',{name:'แม่หมอขออ่านภาพรวมให้คุณฟัง'}).waitFor();
    assert.deepEqual(await page.locator('.fortune-card-body h5').allTextContents(),chosenNames);
    assert.equal(await page.locator('.fortune-card-reading').count(),3);
    assert.equal(await page.locator('.fortune-next-steps li').count(),3);
    assert.match(await page.locator('.fortune-greeting').innerText(),/แม่หมอ/);
    assert.match(await page.locator('.fortune-disclosure').innerText(),/อัตโนมัติ/);
    assert.ok(await page.locator('.fortune-opportunities').isVisible());
    assert.ok(await page.locator('.fortune-cautions').isVisible());
    assert.equal(await page.locator('.technical-reading').getAttribute('open'),null);
    await page.locator('.technical-reading>summary').tap();
    await page.getByRole('heading',{name:'แผนที่ดาวของคุณ'}).waitFor();
    assert.equal(await page.locator('.planet-table tbody tr').count(),10);
  }
  async function noOverflow() {
    const size = await page.evaluate(() => ({scroll:document.documentElement.scrollWidth, viewport:document.documentElement.clientWidth}));
    assert.ok(size.scroll <= size.viewport + 1,`horizontal overflow ${JSON.stringify(size)}`);
  }

  await page.getByRole('button',{name:'ถัดไป — เลือกเรื่องที่อยากรู้ ↗'}).tap();
  await page.getByRole('button',{name:'การเงิน',exact:true}).tap();
  await page.getByRole('button',{name:'เข้าสู่สำรับไพ่ ↗'}).tap();
  await page.getByRole('button',{name:'เปิดไพ่ใบที่ 1',exact:true}).tap();
  assert.match(await page.locator('.count').innerText(),/1 \/ 3/);
  await page.getByRole('button',{name:'← ย้อนกลับ',exact:true}).tap();
  await page.getByRole('button',{name:'การงาน',exact:true}).tap();
  await page.getByRole('button',{name:'7 วัน',exact:true}).tap();
  await reveal();
  assert.match(await page.locator('.fortune-context').innerText(),/การงาน.*7 วัน/s);
  assert.ok(await page.getByText('ไม่ทราบเวลาเกิด — ใช้เวลาอ้างอิง 12:00 น.',{exact:true}).isVisible());
  assert.equal(await page.getByText('ลัคนากำเนิด',{exact:true}).count(),0);
  assert.equal(await page.locator('.house-list').count(),0);
  assert.equal(await page.locator('.taksa-list').count(),0);
  assert.doesNotMatch(await page.locator('.planet-table').innerText(),/ภพ [0-9]/);
  assert.match(await page.locator('.calculation-timestamp').innerText(),/15 พฤศจิกายน 2569/);
  const snapshotSelect = page.getByLabel('วันที่ดูดาวจร',{exact:true});
  assert.equal(await snapshotSelect.locator('option').count(),7);
  const firstMoon = await page.locator('.planet-table tbody tr').nth(1).locator('td').last().innerText();
  await snapshotSelect.selectOption('6');
  assert.match(await page.locator('.sample-lunar').innerText(),/21 พฤศจิกายน 2569/);
  assert.notEqual(await page.locator('.planet-table tbody tr').nth(1).locator('td').last().innerText(), firstMoon);
  await noOverflow();
  if (screenDir) {
    await mkdir(screenDir,{recursive:true});
    await page.locator('.astro-calculation').scrollIntoViewIfNeeded();
    await page.screenshot({path:resolve(screenDir,'unknown-mobile.png')});
  }
  await page.getByRole('button',{name:'แชร์ให้เพื่อน ↗'}).tap();
  const share = await page.evaluate(() => window.__testShare);
  assert.equal(share.url,new URL('./',site).href);
  assert.equal(new URL(share.url).search,'');
  assert.equal(new URL(share.url).hash,'');
  assert.ok(!(JSON.stringify(share).includes('2024') || JSON.stringify(share).includes('เชียงใหม่')));
  assert.deepEqual(await page.evaluate(() => ({local:localStorage.length,session:sessionStorage.length})),{local:0,session:0});

  // Switch the same session to a known time and the full 30-day period.
  await page.getByRole('button',{name:'↻ ดูดวงใหม่'}).tap();
  assert.equal(await page.locator('.fortune-reading').count(),0);
  await page.locator('.optional-time > summary').tap();
  await page.getByLabel('เวลาเกิด (เว้นว่างได้)',{exact:true}).fill('08:30');
  await page.getByRole('button',{name:'ถัดไป — เลือกเรื่องที่อยากรู้ ↗'}).tap();
  await page.getByRole('button',{name:'ความรัก',exact:true}).tap();
  await page.getByRole('button',{name:'30 วัน',exact:true}).tap();
  await reveal();
  assert.match(await page.locator('.fortune-context').innerText(),/ความรัก.*30 วัน/s);
  assert.match(await page.locator('.fortune-next-steps').innerText(),/ความต้องการ.*ขอบเขต/s);
  assert.ok(await page.getByText('ลัคนากำเนิด',{exact:true}).isVisible());
  assert.match(await page.locator('.natal-highlights').innerText(), /กันย์/);
  assert.equal(await page.locator('.birth-time-notice').count(),0);
  assert.equal(await page.getByLabel('วันที่ดูดาวจร',{exact:true}).locator('option').count(),30);
  await page.getByLabel('วันที่ดูดาวจร',{exact:true}).selectOption('29');
  assert.match(await page.locator('.sample-lunar').innerText(),/14 ธันวาคม 2569/);
  await page.getByText('ภพกำเนิดทั้ง 12 และเจ้าเรือน',{exact:true}).tap();
  assert.equal(await page.locator('.house-list li').count(),12);
  await page.getByText('ทักษาตามวันเกิด',{exact:true}).tap();
  assert.equal(await page.locator('.taksa-list > div').count(),8);
  assert.match(await page.locator('.planet-table').innerText(), /ภพ [0-9]/);
  await noOverflow();
  for (const width of [320,390,768,1280]) {
    await page.setViewportSize({width,height:900});
    await noOverflow();
  }
  if (screenDir) {
    await page.locator('.astro-calculation').scrollIntoViewIfNeeded();
    await page.screenshot({path:resolve(screenDir,'known-desktop.png')});
    await page.setViewportSize({width:360,height:800});
    await page.locator('.planet-table-wrap').scrollIntoViewIfNeeded();
    await page.screenshot({path:resolve(screenDir,'known-mobile-table.png')});
  }

  // Reset to unknown again; no calculated birth-time factors may remain.
  await page.getByRole('button',{name:'↻ ดูดวงใหม่'}).tap();
  await page.locator('.optional-time > summary').tap();
  await page.getByLabel('เวลาเกิด (เว้นว่างได้)',{exact:true}).fill('');
  await page.getByRole('button',{name:'ถัดไป — เลือกเรื่องที่อยากรู้ ↗'}).tap();
  await page.getByRole('button',{name:'วันนี้',exact:true}).tap();
  await reveal();
  assert.equal(await page.getByLabel('วันที่ดูดาวจร',{exact:true}).count(),0);
  assert.equal(await page.getByText('ลัคนากำเนิด',{exact:true}).count(),0);
  assert.equal(await page.locator('.house-list').count(),0);
  assert.equal(await page.locator('.taksa-list').count(),0);
  assert.ok(await page.getByText('ไม่ทราบเวลาเกิด — ใช้เวลาอ้างอิง 12:00 น.',{exact:true}).isVisible());
  assert.deepEqual(errors,[]);
  const origin = new URL(site).origin;
  assert.ok(requests.every(url => new URL(url).origin === origin),'unexpected external data request');
  assert.ok(requests.every(url => !url.includes('2024') && !url.includes('%E0%B9%80%E0%B8%8A%E0%B8%B5%E0%B8%A2%E0%B8%87')),'birth data in network request');
  console.log(JSON.stringify({site,passed:true,flows:['unknown-7-days','known-30-days','reset-unknown-today'],widths:[320,360,390,768,1280],planetRows:10,provinces:77,consoleErrors:errors,requests:requests.length,shareContainsPersonalData:false},null,2));
  await context.close();
} finally {
  await browser.close();
  if (server) await new Promise(done => server.close(done));
}
