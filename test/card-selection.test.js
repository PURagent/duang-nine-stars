import test from 'node:test';
import assert from 'node:assert/strict';
import { existsSync } from 'node:fs';
import { buildReading } from '../src/astrology.js';
import { interpretReading } from '../src/fortune-reading.js';

const moduleURL = new URL('../src/card-selection.js', import.meta.url);
let selectionAPI;
async function api() {
  assert.ok(existsSync(moduleURL), 'A real position-based card-selection implementation is required');
  return selectionAPI ??= await import(moduleURL);
}

function fixture() {
  return Object.freeze({
    pool: Object.freeze([50, 18, 64, 2, 7, 30, 76, 11, 5, 19, 17, 59]),
    selectedPositions: Object.freeze([]),
    revealed: false,
    cardIds: Object.freeze([]),
  });
}

// Dealing only three cards or preselecting them removes the visitor's choice.
test('deals twelve distinct hidden options without preselecting or revealing any card', async () => {
  const { createCardSelection } = await api();
  const state = createCardSelection(upper => upper - 1);
  assert.deepEqual(state.pool, [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11]);
  assert.deepEqual(state.selectedPositions, []);
  assert.deepEqual(state.cardIds, []);
  assert.equal(state.revealed, false);
});

// Shuffling an already-truncated twelve-card deck would never offer the other 66 cards.
test('shuffles the full seventy-eight-card deck before dealing the visible options', async () => {
  const { createCardSelection } = await api();
  const requestedBounds = [];
  const state = createCardSelection(upper => { requestedBounds.push(upper); return 0; });
  assert.equal(requestedBounds[0], 78);
  assert.equal(requestedBounds.at(-1), 2);
  assert.equal(requestedBounds.length, 77);
  assert.deepEqual(state.pool, [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12]);
  const lastCardFirst = createCardSelection(upper => upper === 78 ? 0 : upper - 1);
  assert.equal(lastCardFirst.pool[0], 77);
});

test('the production random deal contains twelve valid distinct card identities', async () => {
  const { createCardSelection } = await api();
  const state = createCardSelection();
  assert.equal(state.pool.length, 12);
  assert.equal(new Set(state.pool).size, 12);
  assert.ok(state.pool.every(id => Number.isInteger(id) && id >= 0 && id < 78));
});

// Sorting by board position would silently change which card fills each reading position.
test('selection preserves tap order and tapping again removes that choice without mutating the deal', async () => {
  const { toggleCardSelection } = await api();
  const original = fixture();
  const first = toggleCardSelection(original, 9);
  const second = toggleCardSelection(first, 1);
  const third = toggleCardSelection(second, 10);
  assert.deepEqual(third.selectedPositions, [9, 1, 10]);
  assert.deepEqual(third.cardIds, []);
  const removed = toggleCardSelection(third, 1);
  assert.deepEqual(removed.selectedPositions, [9, 10]);
  assert.deepEqual(toggleCardSelection(removed, 2).selectedPositions, [9, 10, 2]);
  assert.deepEqual(original.selectedPositions, []);
  assert.deepEqual(second.selectedPositions, [9, 1]);
  assert.deepEqual(removed.pool, [50, 18, 64, 2, 7, 30, 76, 11, 5, 19, 17, 59]);
});

test('a fourth card cannot displace the selected three but a selected card remains removable', async () => {
  const { toggleCardSelection } = await api();
  const ready = { ...fixture(), selectedPositions: [9, 1, 10] };
  assert.deepEqual(toggleCardSelection(ready, 0).selectedPositions, [9, 1, 10]);
  assert.deepEqual(toggleCardSelection(ready, 9).selectedPositions, [1, 10]);
});

test('invalid board positions cannot introduce missing or duplicate cards', async () => {
  const { toggleCardSelection } = await api();
  for (const position of [-1, 12, 0.5, NaN, '1', null]) {
    assert.deepEqual(toggleCardSelection(fixture(), position).selectedPositions, []);
  }
});

test('opening is blocked until exactly three distinct valid positions have been selected', async () => {
  const { confirmCardSelection } = await api();
  for (const selectedPositions of [[], [1], [1, 9], [1, 1, 9], [1, 9, 12], [1, 9, 2, 3]]) {
    assert.throws(() => confirmCardSelection({ ...fixture(), selectedPositions }), /เลือกไพ่/);
  }
});

// This literal fixture catches first-three, redraw-on-confirm, and board-order substitutions.
test('opening resolves exactly the chosen positions and locks their identities and order', async () => {
  const { confirmCardSelection, toggleCardSelection } = await api();
  const ready = { ...fixture(), selectedPositions: [9, 1, 10] };
  const result = confirmCardSelection(ready);
  assert.deepEqual(result.cardIds, [19, 18, 17]);
  assert.equal(result.revealed, true);
  assert.deepEqual(result.selectedPositions, [9, 1, 10]);
  assert.deepEqual(ready.cardIds, []);
  assert.deepEqual(confirmCardSelection(result), result);
  assert.deepEqual(toggleCardSelection(result, 9), result);
  assert.deepEqual(toggleCardSelection(result, 0), result);
});

test('a fresh shuffle discards previous selections without changing the previous reading', async () => {
  const { createCardSelection, confirmCardSelection } = await api();
  const previous = confirmCardSelection({ ...fixture(), selectedPositions: [9, 1, 10] });
  const fresh = createCardSelection(upper => upper - 1);
  assert.deepEqual(fresh.selectedPositions, []);
  assert.deepEqual(fresh.cardIds, []);
  assert.equal(fresh.revealed, false);
  assert.deepEqual(previous.cardIds, [19, 18, 17]);
});

// Check the actual downstream reader, not a mock or a second copy of selection logic.
test('the fortune-teller reads the selected identities in the selected order', async () => {
  const { confirmCardSelection, toggleCardSelection } = await api();
  let state = fixture();
  for (const position of [9, 1, 10]) state = toggleCardSelection(state, position);
  const confirmed = confirmCardSelection(state);
  const reading = buildReading({
    date: {year: 2024, era: 'CE', month: 9, day: 15}, time: '', province: 'เชียงใหม่',
    period: '7 วัน', now: new Date('2026-11-14T18:23:45Z'),
  });
  const result = interpretReading({reading, cardIds: confirmed.cardIds, topic: 'การงาน'});
  assert.deepEqual(result.cardReadings.map(card => [card.id, card.name, card.position]), [
    [19, 'พระอาทิตย์', 'สถานการณ์'],
    [18, 'พระจันทร์', 'สิ่งที่ควรใส่ใจ'],
    [17, 'ดวงดาว', 'แนวโน้ม'],
  ]);
  assert.match(result.overview.join(' '), /พระอาทิตย์.*พระจันทร์.*ดวงดาว/);
});
