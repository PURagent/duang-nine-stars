import test, { after } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, rm } from 'node:fs/promises';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';
import { join } from 'node:path';
import { build } from 'esbuild';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { buildReading } from '../src/astrology.js';

const root = fileURLToPath(new URL('..', import.meta.url));
const buildDir = await mkdtemp(join(root, '.test-ui-'));
after(() => rm(buildDir, {recursive:true, force:true}));
await build({
  entryPoints:[join(root, 'src/AstrologyResults.tsx')],
  bundle:true, platform:'node', format:'cjs', jsx:'automatic',
  external:['react', 'react/jsx-runtime'], loader:{'.css':'empty'},
  outfile:join(buildDir, 'component.cjs'),
});
const {default:AstrologyResults} = createRequire(import.meta.url)(join(buildDir, 'component.cjs'));
function fixture({known = true, days = 7} = {}) {
  return buildReading({
    date:{year:2024,era:'CE',month:9,day:15},time:known?'08:30':'',province:'เชียงใหม่',
    period:days===1?'วันนี้':`${days} วัน`,now:new Date('2026-11-14T18:23:45.000Z'),
  });
}
const render = reading => renderToStaticMarkup(React.createElement(AstrologyResults,{reading}));

test('known birth time renders the library factors and Thai calendar, not geometric lunar day', () => {
  const html = render(fixture());
  assert.match(html,/ลัคนากำเนิด/);
  assert.match(html,/กันย์/);
  assert.match(html,/27° 56′/);
  assert.match(html,/ขึ้น 13 ค่ำ เดือน 10/);
  assert.match(html,/ภพกำเนิดทั้ง 12/);
  assert.match(html,/ทักษาตามวันเกิด/);
  assert.match(html,/มรณะ/);
  assert.match(html,/ยูเรนัส/);
  assert.match(html,/thai-astrology 0\.3\.2/);
});

test('unknown time explains noon reference and cannot render fabricated ascendant or houses', () => {
  const html = render(fixture({known:false}));
  assert.match(html,/ไม่ทราบเวลาเกิด/);
  assert.match(html,/12:00/);
  assert.match(html,/เวลาอ้างอิง/);
  assert.doesNotMatch(html,/ลัคนากำเนิด/);
  assert.doesNotMatch(html,/ภพกำเนิดทั้ง 12/);
  assert.doesNotMatch(html,/ทักษาตามวันเกิด/);
  assert.doesNotMatch(html,/ภพ [0-9]/);
  assert.match(html,/สิงห์/);
});

test('the daily selector includes each snapshot rather than only changing a period heading', () => {
  const html = render(fixture());
  assert.match(html,/aria-label="วันที่ดูดาวจร"/);
  assert.equal((html.match(/<option /g)||[]).length,7);
  assert.match(html,/21 พฤศจิกายน 2569/);
  assert.match(html,/วันละ 1 จุด/);
  assert.match(html,/ไม่ใช่เวลาย้ายราศีที่แน่นอน/);
  assert.match(html,/01:23/);
});

test('out-of-range lunar calendar is a clear unavailable message rather than undefined', () => {
  const r = fixture({days:1});
  r.natal.lunarDate = null;
  r.snapshots[0].lunarDate = null;
  const html = render(r);
  assert.match(html,/ไม่มีข้อมูลจันทรคติในช่วงปีนี้/);
  assert.doesNotMatch(html,/undefined|NaN/);
});

test('fractional ascendant minutes never display an invalid 60-minute position', () => {
  const r = fixture({days:1});
  r.natal.ascendant = {...r.natal.ascendant,degrees:29,minutes:59.9};
  const html = render(r);
  assert.match(html,/29° 59′/);
  assert.doesNotMatch(html,/60′/);
});

test('lunar second eighth month is distinguished from ordinary eighth month', () => {
  const r = fixture({days:1});
  r.natal.lunarDate = {...r.natal.lunarDate,phase:'waning',day:8,month:8,secondEighthMonth:true};
  assert.match(render(r),/แรม 8 ค่ำ เดือน 8 หลัง/);
});

test('calculation timestamp uses Bangkok date even though UTC is on the preceding day', () => {
  const html = render(fixture({days:1}));
  assert.match(html,/15 พฤศจิกายน 2569/);
  assert.doesNotMatch(html,/14 พฤศจิกายน 2569/);
  assert.match(html,/Asia\/Bangkok/);
});
