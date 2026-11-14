import { TAROT_CARDS } from './tarot-cards.js';

export const VISIBLE_CARD_COUNT = 12;
export const PICK_COUNT = 3;

// Rejection sampling avoids modulo bias. No randomness is used after the deal.
function secureRandomBelow(upperBound) {
  const value = new Uint32Array(1);
  const limit = Math.floor(0x100000000 / upperBound) * upperBound;
  do { globalThis.crypto.getRandomValues(value); } while (value[0] >= limit);
  return value[0] % upperBound;
}

/** Deal a fixed, face-down pool from the entire shuffled deck. */
export function createCardSelection(randomIndex = secureRandomBelow) {
  const shuffled = TAROT_CARDS.map(card => card.id);
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = randomIndex(i + 1);
    if (!Number.isInteger(j) || j < 0 || j > i) throw new RangeError('Invalid shuffle index');
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return {pool: shuffled.slice(0, VISIBLE_CARD_COUNT), selectedPositions: [], revealed: false, cardIds: []};
}

function validPosition(state, position) {
  return Number.isInteger(position) && position >= 0 && position < state.pool.length;
}

/** Preserve tap order; a second tap removes a choice before confirmation. */
export function toggleCardSelection(state, position) {
  if (state.revealed || !validPosition(state, position)) return state;
  if (state.selectedPositions.includes(position)) {
    return {...state, selectedPositions: state.selectedPositions.filter(value => value !== position)};
  }
  if (state.selectedPositions.length >= PICK_COUNT) return state;
  return {...state, selectedPositions: [...state.selectedPositions, position]};
}

/** Reveal the fixed identities at the selected positions, never draw replacements. */
export function confirmCardSelection(state) {
  if (state.revealed) return state;
  if (state.selectedPositions.length !== PICK_COUNT ||
      new Set(state.selectedPositions).size !== PICK_COUNT ||
      !state.selectedPositions.every(position => validPosition(state, position))) {
    throw new Error('กรุณาเลือกไพ่ให้ครบ 3 ใบก่อนเปิด');
  }
  return {...state, revealed: true, cardIds: state.selectedPositions.map(position => state.pool[position])};
}
