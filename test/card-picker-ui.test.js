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
import { TAROT_CARDS } from '../src/tarot-cards.js';

const root = fileURLToPath(new URL('..', import.meta.url));
const buildDir = await mkdtemp(join(root, '.test-card-picker-ui-'));
after(() => rm(buildDir, { recursive: true, force: true }));
let component;

async function render(selectedPositions = [], cardCount = 12) {
  const entry = join(root, 'src/CardPicker.tsx');
  assert.ok(existsSync(entry), 'The personal face-down card picker must exist');
  if (!component) {
    await build({
      entryPoints: [entry], bundle: true, platform: 'node', format: 'cjs', jsx: 'automatic',
      external: ['react', 'react/jsx-runtime'], loader: { '.css': 'empty' },
      outfile: join(buildDir, 'component.cjs'),
    });
    component = createRequire(import.meta.url)(join(buildDir, 'component.cjs')).default;
  }
  return renderToStaticMarkup(React.createElement(component, {
    cardCount, selectedPositions, onToggle() {}, onShuffle() {}, onConfirm() {}, onBack() {},
  }));
}

function buttons(html) {
  return [...html.matchAll(/<button\b([^>]*)>([\s\S]*?)<\/button>/g)]
    .map(([, attributes, content]) => ({ attributes, content }));
}

function backs(html) {
  return buttons(html).filter(button => /aria-label="ไพ่คว่ำใบที่ \d+"/.test(button.attributes));
}

function confirm(html) {
  return buttons(html).find(button => button.content.includes('เปิดไพ่ที่เลือก'));
}

// An accidental hidden/revealed board, duplicate position, or initially disabled card must fail.
test('renders twelve distinct face-down native buttons ready for personal selection', async () => {
  const html = await render();
  assert.match(html, /^<div class="panel card-picker"/);
  const cards = backs(html);
  assert.equal(cards.length, 12);
  assert.equal(buttons(html).length, 15);
  for (const [position, card] of cards.entries()) {
    assert.ok(card.attributes.includes(`aria-label="ไพ่คว่ำใบที่ ${position + 1}"`));
    assert.match(card.attributes, /type="button"/);
    assert.match(card.attributes, /aria-pressed="false"/);
    assert.doesNotMatch(card.attributes, /\bdisabled/);
  }
  assert.doesNotMatch(html, /role="button"|<a\b|<input\b/);
  assert.match(html, /aria-live="polite"/);
  assert.match(html, /class="[^"]*\bpicker-count\b[^"]*"/);
  assert.match(html, /class="[^"]*\bpicker-grid\b[^"]*"/);
  assert.equal(confirm(html).content, 'เปิดไพ่ที่เลือก');
  assert.match(html, /เลือกแล้ว 0 \/ 3 ใบ/);
  assert.match(html, /เลือกใบที่ 1 · สถานการณ์/);
});

// Premature confirmation or disabling remaining choices at one/two selections must fail.
test('requires three choices before opening and announces the next ordered slot', async () => {
  for (const [selected, instruction] of [
    [[], 'เลือกใบที่ 1 · สถานการณ์'],
    [[9], 'เลือกใบที่ 2 · สิ่งที่ควรใส่ใจ'],
    [[9, 1], 'เลือกใบที่ 3 · แนวโน้ม'],
  ]) {
    const html = await render(selected);
    assert.match(confirm(html).attributes, /\bdisabled/);
    assert.ok(html.includes(instruction));
    assert.ok(html.includes(`เลือกแล้ว ${selected.length} / 3 ใบ`));
    assert.equal(backs(html).filter(card => /\bdisabled/.test(card.attributes)).length, 0);
  }
});

// Sorting choices by board position or locking selected cards would break ordered reselection.
test('preserves selection order and allows deselection while blocking a fourth card', async () => {
  const html = await render([9, 1, 10]);
  const cards = backs(html);
  assert.doesNotMatch(confirm(html).attributes, /\bdisabled/);
  assert.equal(cards.filter(card => /\bdisabled/.test(card.attributes)).length, 9);
  for (const [position, rank] of [[9, 1], [1, 2], [10, 3]]) {
    assert.match(cards[position].attributes, /aria-pressed="true"/);
    assert.doesNotMatch(cards[position].attributes, /\bdisabled/);
    assert.match(cards[position].content, new RegExp(`class="card-picker-rank"[^>]*>${rank}<`));
    assert.ok(cards[position].attributes.includes(`aria-label="ไพ่คว่ำใบที่ ${position + 1}"`));
  }
  const previews = [...html.matchAll(/<li\b[^>]*>([\s\S]*?)<\/li>/g)].map(match => match[1]);
  assert.equal(previews.length, 3);
  for (const [index, label, position] of [[0, 'สถานการณ์', 10], [1, 'สิ่งที่ควรใส่ใจ', 2], [2, 'แนวโน้ม', 11]]) {
    assert.ok(previews[index].includes(label));
    assert.ok(previews[index].includes(`ตำแหน่งที่ ${position}`));
  }
  assert.match(html, /เลือกครบแล้ว/);
});

// Loading identities into the picker or failing to update after deselection must fail.
test('keeps identities private and updates slot previews from controlled selections', async () => {
  const html = await render([9, 10]);
  assert.match(html, /เลือกแล้ว 2 \/ 3 ใบ/);
  assert.match(html, /เลือกใบที่ 3 · แนวโน้ม/);
  assert.match(backs(html)[10].content, /class="card-picker-rank"[^>]*>2</);
  assert.match(backs(html)[1].attributes, /aria-pressed="false"/);
  for (const card of TAROT_CARDS) assert.ok(!html.includes(card.name), `Must not disclose ${card.name}`);
  assert.doesNotMatch(html, /card-id|data-id|<img\b/);
  assert.ok(buttons(html).some(button => button.content.includes('สับไพ่ใหม่')));
  assert.ok(buttons(html).some(button => button.content.includes('ย้อนกลับ')));
  assert.match(html, /สับใหม่จะล้างไพ่ที่เลือก/);
});
