import test, { after } from 'node:test';
import assert from 'node:assert/strict';
import { existsSync } from 'node:fs';
import { mkdtemp, rm } from 'node:fs/promises';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';
import { join } from 'node:path';
import { build } from 'esbuild';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';

const root = fileURLToPath(new URL('..', import.meta.url));
const buildDir = await mkdtemp(join(root, '.test-fortune-ui-'));
after(() => rm(buildDir, {recursive:true, force:true}));
let component;
async function render(interpretation = fixture()) {
  const entry = join(root, 'src/FortuneReading.tsx');
  assert.ok(existsSync(entry), 'The friendly fortune reading component must exist');
  if (!component) {
    await build({
      entryPoints:[entry], bundle:true, platform:'node', format:'cjs', jsx:'automatic',
      external:['react', 'react/jsx-runtime'], loader:{'.css':'empty'},
      outfile:join(buildDir, 'component.cjs'),
    });
    component = createRequire(import.meta.url)(join(buildDir, 'component.cjs')).default;
  }
  return renderToStaticMarkup(React.createElement(component, {interpretation}));
}

function fixture() {
  return {
    topic:'การงาน', periodLabel:'7 วัน', periodRange:'15–21 พฤศจิกายน 2569',
    heading:'ค่อย ๆ จัดทางให้การงานของคุณ', greeting:'แม่หมอชวนคุณมาดูเรื่องงานในช่วงนี้นะคะ',
    overview:['ช่วงนี้คุณมีพื้นที่ให้เริ่มต้นใหม่ โดยไม่ต้องรีบทำทุกอย่างพร้อมกันค่ะ', 'สิ่งสำคัญคือเลือกเรื่องที่คุณลงมือได้จริงก่อนหนึ่งเรื่องนะคะ'],
    cardReadings:[
      {id:0,name:'ผู้เริ่มต้น',icon:'☀',position:'พื้นฐานของเรื่อง',paragraph:'ไพ่ใบแรกชวนให้คุณมองต้นทุนที่มีอยู่ด้วยใจเปิดกว้างค่ะ',opportunity:'เริ่มคุยเรื่องที่ค้างไว้',caution:'อย่ารีบรับปาก',advice:'จดประเด็นที่จะคุย'},
      {id:1,name:'นักสร้างสรรค์',icon:'✦',position:'สิ่งที่กำลังพบ',paragraph:'ไพ่ใบที่สองสะท้อนว่าทักษะของคุณอาจเป็นประตูสู่โอกาสใหม่ค่ะ',opportunity:'เสนอผลงานชิ้นเล็ก',caution:'อย่าเทียบตัวเองกับคนอื่น',advice:'เลือกทักษะที่อยากฝึก'},
      {id:2,name:'ผู้ดูแล',icon:'☾',position:'แนวทางข้างหน้า',paragraph:'ไพ่ใบที่สามชวนให้คุณรักษาจังหวะที่ทำต่อเนื่องได้ค่ะ',opportunity:'ขอความช่วยเหลือจากทีม',caution:'อย่าแบกไว้ทั้งหมด',advice:'แบ่งงานเป็นขั้น'},
    ],
    opportunities:[{title:'โอกาสจากสิ่งที่ถนัด',text:'ลองทำให้คนรอบตัวเห็นทักษะของคุณผ่านงานชิ้นเล็กค่ะ'}],
    cautions:[{title:'ระวังตารางแน่นเกินไป',text:'เผื่อเวลาให้สิ่งที่อาจต้องแก้ไขด้วยนะคะ'}],
    nextSteps:['เลือกงานสำคัญหนึ่งชิ้นสำหรับวันนี้', 'กำหนดเวลาคุยกับทีมให้ชัดเจน'],
    astroParagraphs:['ในเชิงการตีความ ดาวอาทิตย์เป็นภาพแทนของความมั่นใจ ไม่ใช่ข้อยืนยันว่างานจะสำเร็จค่ะ'],
    closing:'คุณไม่ต้องรีบเก่งทุกเรื่อง แค่เริ่มจากสิ่งที่ทำไหวก็พอค่ะ',
    disclosure:'บทอ่านนี้สร้างอัตโนมัติในบทบาทแม่หมอ ไม่ใช่การอ่านจากมนุษย์ ใช้เพื่อความบันเทิงและทบทวนตนเอง ไม่รับรองเหตุการณ์ในอนาคต',
  };
}

function visibleReading(html) {
  return html.replace(/<details\b[^>]*>[\s\S]*?<\/details>/g, '');
}

// Removing the introduction or concealing it behind a control must break this test.
test('opens with a complete readable narrative and period before the card interpretations', async () => {
  const html = await render();
  const visible = visibleReading(html);
  assert.match(visible, /<h3[^>]*>ค่อย ๆ จัดทางให้การงานของคุณ<\/h3>/);
  for (const text of ['การงาน', '7 วัน', '15–21 พฤศจิกายน 2569', 'แม่หมอชวนคุณมาดูเรื่องงานในช่วงนี้นะคะ', 'ช่วงนี้คุณมีพื้นที่ให้เริ่มต้นใหม่', 'สิ่งสำคัญคือเลือกเรื่องที่คุณลงมือได้จริง']) assert.ok(visible.includes(text), text);
  assert.ok(html.indexOf('สิ่งสำคัญคือเลือกเรื่อง') < html.indexOf('ไพ่ใบแรกชวน'));
});

// Dropping, reversing or collapsing the three card narratives must break this test.
test('reads all three cards in supplied order without requiring an action', async () => {
  const html = await render();
  const visible = visibleReading(html);
  const paragraphs = ['ไพ่ใบแรกชวนให้คุณมองต้นทุน', 'ไพ่ใบที่สองสะท้อนว่าทักษะ', 'ไพ่ใบที่สามชวนให้คุณรักษาจังหวะ'];
  const positions = paragraphs.map(text => visible.indexOf(text));
  assert.ok(positions.every(i => i >= 0));
  assert.ok(positions[0] < positions[1] && positions[1] < positions[2]);
  for (const text of ['ผู้เริ่มต้น', 'นักสร้างสรรค์', 'ผู้ดูแล', 'พื้นฐานของเรื่อง', 'สิ่งที่กำลังพบ', 'แนวทางข้างหน้า']) assert.ok(visible.includes(text), text);
  assert.equal((html.match(/<article\b/g) || []).length, 3);
});

// Hiding balanced guidance, actions, interpretation limits or disclosure must break this test.
test('keeps positives, cautions, next steps, astro interpretation and disclosure visible', async () => {
  const html = visibleReading(await render());
  for (const text of ['โอกาสจากสิ่งที่ถนัด', 'ลองทำให้คนรอบตัวเห็นทักษะ', 'ระวังตารางแน่นเกินไป', 'เผื่อเวลาให้สิ่งที่อาจต้องแก้ไข', 'เลือกงานสำคัญหนึ่งชิ้นสำหรับวันนี้', 'กำหนดเวลาคุยกับทีมให้ชัดเจน', 'ในเชิงการตีความ', 'ไม่ใช่ข้อยืนยันว่างานจะสำเร็จ', 'คุณไม่ต้องรีบเก่งทุกเรื่อง', 'บทอ่านนี้สร้างอัตโนมัติในบทบาทแม่หมอ', 'ไม่ใช่การอ่านจากมนุษย์']) assert.ok(html.includes(text), text);
  assert.match(html, /<ol\b[^>]*>[\s\S]*เลือกงานสำคัญหนึ่งชิ้นสำหรับวันนี้[\s\S]*<\/ol>/);
  assert.match(html, /<blockquote\b/);
  assert.doesNotMatch(html, /\shidden(?:=|\s|>)|aria-hidden="true"[^>]*>[\s\S]*แม่หมอชวน/);
});

// Collapsed per-card extras must remain discoverable, named, native and distinct.
test('uses three native named details for optional card guidance without duplicating the main narrative', async () => {
  const html = await render();
  const details = [...html.matchAll(/<details\b[^>]*>([\s\S]*?)<\/details>/g)].map(match => match[1]);
  assert.equal(details.length, 3);
  for (const [index, text] of ['ผู้เริ่มต้น', 'นักสร้างสรรค์', 'ผู้ดูแล'].entries()) {
    assert.match(details[index], /<summary[^>]*>/);
    assert.ok(details[index].slice(0, details[index].indexOf('</summary>')).includes(text));
    assert.match(details[index], /โอกาส/);
    assert.match(details[index], /ข้อควรระวัง/);
    assert.match(details[index], /คำแนะนำ/);
    assert.doesNotMatch(details[index], /ไพ่ใบ(?:แรก|ที่สอง|ที่สาม)/);
  }
});

// Rendering supplied text as HTML would allow markup injection in the public reading.
test('preserves hostile supplied text as escaped readable text rather than executable markup', async () => {
  const input = fixture();
  input.heading = '<script>alert("heading")</script>';
  input.overview[0] = '<img src=x onerror="alert(1)">';
  input.cardReadings[0].paragraph = '<svg onload="alert(2)"> & card';
  input.cardReadings[0].advice = '<button autofocus>fake</button>';
  input.disclosure = '<a href="javascript:alert(3)">unsafe</a>';
  const html = await render(input);
  assert.doesNotMatch(html, /<script|<img|<svg|<button|<a /);
  assert.match(html, /&lt;script&gt;alert\(&quot;heading&quot;\)&lt;\/script&gt;/);
  assert.match(html, /&lt;img src=x onerror=&quot;alert\(1\)&quot;&gt;/);
  assert.match(html, /&lt;svg onload=&quot;alert\(2\)&quot;&gt; &amp; card/);
  assert.match(html, /&lt;button autofocus&gt;fake&lt;\/button&gt;/);
  assert.match(html, /&lt;a href=&quot;javascript:alert\(3\)&quot;&gt;unsafe&lt;\/a&gt;/);
});
