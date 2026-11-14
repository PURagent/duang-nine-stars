import test from 'node:test';
import assert from 'node:assert/strict';
import { buildReading } from '../src/astrology.js';
import { interpretReading } from '../src/fortune-reading.js';

const input = {
  date:{year:2024,era:'CE',month:9,day:15}, time:'08:30', province:'เชียงใหม่',
  period:'7 วัน', now:new Date('2026-11-14T18:23:45Z'),
};
const fixture = (overrides = {}) => buildReading({...input,...overrides});
const read = (overrides = {}) => interpretReading({reading:fixture(),cardIds:[19,18,17],topic:'การงาน',...overrides});
const prose = value => JSON.stringify(value);

test('the consultation explains the actual three cards in their drawn positions', () => {
  const result = read();
  assert.deepEqual(result.cardReadings.map(c=>[c.id,c.name,c.position]),[
    [19,'พระอาทิตย์','สถานการณ์'],[18,'พระจันทร์','สิ่งที่ควรใส่ใจ'],[17,'ดวงดาว','แนวโน้ม'],
  ]);
  for (const card of result.cardReadings) {
    assert.ok(card.paragraph.includes(card.name));
    assert.ok(card.opportunity.length > 10);
    assert.ok(card.caution.length > 10);
    assert.ok(card.advice.length > 10);
  }
  assert.match(result.greeting,/แม่หมอ/);
  assert.match(result.overview.join(' '),/พระอาทิตย์.*พระจันทร์.*ดวงดาว/);
  assert.equal(result.opportunities.length,2);
  assert.equal(result.cautions.length,2);
  assert.equal(result.nextSteps.length,3);
});

test('reordering cards changes the reading and its advice, not just the card labels', () => {
  const a = read();
  const b = read({cardIds:[17,19,18]});
  assert.notEqual(a.overview.join(' '),b.overview.join(' '));
  assert.notEqual(a.cardReadings[0].paragraph,b.cardReadings[2].paragraph);
  assert.notDeepEqual(a.nextSteps,b.nextSteps);
});

test('each selected topic changes advice and interpretation beyond its heading', () => {
  const topics = ['ภาพรวมชีวิต','ความรัก','การงาน','การเงิน','โชคลาภ'];
  const results = topics.map(topic=>read({topic}));
  assert.equal(new Set(results.map(r=>r.nextSteps.join(' '))).size,5);
  assert.equal(new Set(results.map(r=>r.cardReadings[0].paragraph)).size,5);
  assert.match(prose(results[1]),/สื่อสาร|ความสัมพันธ์/);
  assert.match(prose(results[2]),/งาน|หน้าที่/);
  assert.match(prose(results[3]),/รายรับ|รายจ่าย|งบ/);
  assert.match(prose(results[4]),/ไม่.*เลข|ไม่.*พนัน/);
});

test('a difficult closing card prompts preparation rather than a guaranteed positive outcome', () => {
  const challenging = read({cardIds:[19,18,16]});
  const supportive = read({cardIds:[19,18,17]});
  assert.match(challenging.overview.join(' '),/ตั้งหลัก|แผนสำรอง|ปรับแผน/);
  assert.notEqual(challenging.overview[1],supportive.overview[1]);
  assert.match(challenging.cardReadings[2].paragraph,/หอคอย/);
  assert.doesNotMatch(prose(challenging),/จะเกิดอุบัติเหตุ|จะเสียชีวิต|สำเร็จแน่นอน|ชนะพนัน/);
});

test('astrology narrative uses actual natal and transit positions with known birth time', () => {
  const result = read({topic:'ความรัก'});
  const text = result.astroParagraphs.join(' ');
  assert.match(text,/15 กันยายน 2567/);
  assert.match(text,/08:30.*เชียงใหม่|เชียงใหม่.*08:30/);
  assert.match(text,/ลัคนา.*กันย์/);
  assert.match(text,/ศุกร์.*กันย์/);
  assert.match(text,/ศุกร์จร.*ตุลย์/);
  assert.match(text,/ภพ 2/);
  assert.match(text,/01:23/);
});

test('unknown birth time stays usable but never fabricates ascendant or birth houses', () => {
  const result = read({reading:fixture({time:''}),topic:'ความรัก'});
  const text = result.astroParagraphs.join(' ');
  assert.match(text,/ไม่ทราบเวลาเกิด|ไม่ได้ระบุเวลาเกิด/);
  assert.match(text,/12:00/);
  assert.doesNotMatch(text,/ลัคนาราศี|ลัคนาอยู่ราศี|ภพ [0-9]|เวลาเกิด 12:00/);
  assert.equal(result.cardReadings.length,3);
  assert.ok(result.nextSteps.length);
});

test('changing birth data recomposes the grounded astrology instead of retaining prior facts', () => {
  const original = read({topic:'ความรัก'});
  const changed = read({reading:fixture({date:{year:1996,era:'CE',month:12,day:29},province:'ชลบุรี',time:'06:00'}),topic:'ความรัก'});
  assert.notDeepEqual(original.astroParagraphs,changed.astroParagraphs);
  assert.notDeepEqual(original.overview,changed.overview);
  assert.match(original.overview.join(' '),/ศุกร์.*กันย์/);
  assert.match(changed.astroParagraphs.join(' '),/29 ธันวาคม 2539/);
  assert.match(changed.astroParagraphs.join(' '),/ชลบุรี/);
  assert.doesNotMatch(changed.astroParagraphs.join(' '),/15 กันยายน 2567|เชียงใหม่/);
});

test('period wording follows Bangkok daily samples and distinguishes samples from exact ingress', () => {
  const today = read({reading:fixture({period:'วันนี้'}),topic:'ภาพรวมชีวิต'});
  const week = read({topic:'ภาพรวมชีวิต'});
  const month = read({reading:fixture({period:'30 วัน'}),topic:'ภาพรวมชีวิต'});
  assert.equal(today.periodRange,'15 พฤศจิกายน 2569');
  assert.equal(week.periodRange,'15 พฤศจิกายน 2569 – 21 พฤศจิกายน 2569');
  assert.equal(month.periodRange,'15 พฤศจิกายน 2569 – 14 ธันวาคม 2569');
  assert.notEqual(today.nextSteps[2],week.nextSteps[2]);
  assert.match(week.astroParagraphs.join(' '),/18 พฤศจิกายน 2569/);
  assert.match(week.astroParagraphs.join(' '),/ไม่ใช่เวลาย้ายราศีที่แน่นอน/);
  assert.doesNotMatch(prose(today),/14 พฤศจิกายน 2569/);
});

test('identical inputs yield stable prose without mutating the astrology result', () => {
  const reading = fixture();
  const before = structuredClone(reading);
  const ids = [19,18,17];
  const a = read({reading,cardIds:ids});
  const b = read({reading,cardIds:ids});
  assert.deepEqual(a,b);
  assert.deepEqual(reading,before);
  assert.deepEqual(ids,[19,18,17]);
  assert.match(a.disclosure,/อัตโนมัติ/);
  assert.match(a.disclosure,/สวมบทบาท|สไตล์แม่หมอ/);
});

test('incomplete or corrupt selections fail clearly instead of showing a partial consultation', () => {
  for (const cardIds of [[],[1,2],[1,1,2],[1,2,78],[1,2,-1],[1,2,0.5],[1,2,'3']]) {
    assert.throws(()=>read({cardIds}),/ไพ่/);
  }
  assert.throws(()=>read({topic:'__proto__'}),/หัวข้อ/);
  assert.throws(()=>read({reading:null}),/ข้อมูลดวง/);
  assert.throws(()=>read({reading:{...fixture(),snapshots:[]}}),/ข้อมูลดวง/);
});
