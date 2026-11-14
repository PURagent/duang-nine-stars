import test from 'node:test';
import assert from 'node:assert/strict';
import { TAROT_CARDS } from '../src/tarot-cards.js';

// Consumers store drawn numeric IDs: a missing row or reordered suit must not
// silently turn a previously drawn card into a different card.
test('all 78 draw IDs resolve to the established names and symbols', () => {
  assert.equal(TAROT_CARDS.length, 78);
  assert.equal(new Set(TAROT_CARDS.map(c => c.name)).size, 78);
  const majors = ['ผู้เริ่มต้น','นักมายากล','มหาปุโรหิตหญิง','จักรพรรดินี','จักรพรรดิ','นักบวช','คู่รัก','ราชรถ','ความเข้มแข็ง','ฤๅษี','กงล้อแห่งโชคชะตา','ความยุติธรรม','ผู้เสียสละ','การเปลี่ยนผ่าน','ความสมดุล','พันธนาการ','หอคอย','ดวงดาว','พระจันทร์','พระอาทิตย์','การตื่นรู้','โลก'];
  const zodiac = ['♈','♉','♊','♋','♌','♍','♎','♏','♐','♑','♒','♓'];
  const ranks = ['หนึ่ง','สอง','สาม','สี่','ห้า','หก','เจ็ด','แปด','เก้า','สิบ','เด็กถือไพ่','อัศวิน','ราชินี','ราชา'];
  for (let id = 0; id < 78; id++) assert.equal(TAROT_CARDS[id].id, id);
  majors.forEach((name, id) => {
    assert.equal(TAROT_CARDS[id].name, name);
    assert.equal(TAROT_CARDS[id].icon, zodiac[id % 12]);
  });
  ['ไม้เท้า','ถ้วย','ดาบ','เหรียญ'].forEach((suit, suitIndex) => {
    ranks.forEach((rank, rankIndex) => {
      const card = TAROT_CARDS[22 + suitIndex * 14 + rankIndex];
      assert.equal(card.name, `${rank} ${suit}`);
      assert.equal(card.icon, ['♧','♡','⚔','◇'][suitIndex]);
    });
  });
});

test('every drawn card can supply all narrative roles without generic missing text', () => {
  for (const card of TAROT_CARDS) {
    for (const key of ['meaning','opportunity','caution','advice']) {
      assert.equal(typeof card[key], 'string', `${card.name}: ${key}`);
      assert.ok(card[key].trim().length > 12, `${card.name}: ${key}`);
      assert.match(card[key], /[ก-๙]/);
      assert.doesNotMatch(card[key], /^(ค่ะ|ครับ|สวัสดี)/);
    }
    assert.ok(['supportive','reflective','challenging'].includes(card.tone));
  }
  assert.equal(new Set(TAROT_CARDS.map(c => c.meaning)).size, 78);
});

// These guard the old rank-template bug: every ten was called success,
// and every five was simply called a test regardless of suit.
test('ten wands expresses overload while ten swords expresses an ending and recovery', () => {
  const wands = TAROT_CARDS[31];
  const swords = TAROT_CARDS[59];
  assert.match(wands.meaning, /ภาระ|แบก|รับผิดชอบ/);
  assert.match(wands.advice, /แบ่ง|ลด|มอบหมาย/);
  assert.match(swords.meaning, /จบ|สิ้นสุด/);
  assert.match(swords.opportunity + swords.advice, /ฟื้น|พัก|เริ่มใหม่/);
  assert.equal(wands.tone, 'challenging');
  assert.equal(swords.tone, 'challenging');
  assert.match(TAROT_CARDS[45].meaning, /อบอุ่น|ผูกพัน|พร้อมหน้า/);
  assert.match(TAROT_CARDS[73].meaning, /ระยะยาว|ครอบครัว|รากฐาน/);
});

test('five cups acknowledges loss without erasing remaining support', () => {
  const card = TAROT_CARDS[40];
  assert.match(card.meaning, /สูญเสีย|ผิดหวัง|เสียใจ/);
  assert.match(card.meaning + card.opportunity, /ยังเหลือ|ยังมี|ที่เหลือ/);
  assert.match(card.advice, /ยอมรับ|อนุญาต|เสียใจ/);
});

test('court cards offer qualities to practise rather than asserting a stranger will arrive', () => {
  for (const start of [32, 46, 60, 74]) {
    for (const card of TAROT_CARDS.slice(start, start + 4)) {
      assert.doesNotMatch(card.meaning + card.opportunity, /ชายคนหนึ่ง|หญิงคนหนึ่ง|ผู้ชายจะ|ผู้หญิงจะ|จะเข้ามาในชีวิต/);
    }
  }
  assert.match(TAROT_CARDS[61].meaning, /เร็ว|เด็ดขาด/);
  assert.match(TAROT_CARDS[75].meaning, /สม่ำเสมอ|รอบคอบ/);
});
