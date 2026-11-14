import test from 'node:test';
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { calculateHoroscopeTransits } from 'thai-astrology';
import { PROVINCES, PLANET_KEYS, bangkokMoment, buildReading } from '../src/astrology.js';

const fixture = {
  date: { year: 2024, era: 'CE', month: 9, day: 15 },
  time: '08:30', province: 'เชียงใหม่', period: 'วันนี้',
  now: new Date('2026-11-14T18:23:45Z'),
};
const read = overrides => buildReading({ ...fixture, ...overrides });

test('published Suriyayatra fixture, not the old approximate solar formula', () => {
  const r = read();
  assert.deepEqual(r.engine, { name: 'thai-astrology', version: '0.3.2', method: 'suriyayatra' });
  assert.equal(r.natal.referenceMode, 'auto');
  assert.equal(r.natal.planets.sun.signName, 'สิงห์');
  assert.equal(r.natal.planets.sun.degrees, 27);
  assert.equal(r.natal.planets.sun.minutes, 56);
  assert.equal(r.natal.planets.moon.signName, 'มังกร');
  assert.equal(r.natal.planets.moon.degrees, 19);
  assert.equal(r.natal.planets.moon.minutes, 7);
  assert.equal(r.natal.ascendant.signName, 'กันย์');
  assert.equal(r.natal.houses.length, 12);
  assert.equal(r.natal.lunarDate.phase, 'waxing');
  assert.equal(r.natal.lunarDate.day, 13);
  assert.equal(r.natal.lunarDate.month, 10);
  assert.equal(Object.keys(r.natal.planets).length, 10);
  assert.equal(r.natal.planets.uranus.number, 0);
});

test('Buddhist and Gregorian calendar forms produce exactly the same reading', () => {
  assert.deepEqual(read({date:{...fixture.date,year:2567,era:'BE'}}), read());
});

test('all 77 full Thai province names are supported by the pinned package', () => {
  assert.equal(PROVINCES.length, 77);
  assert.equal(new Set(PROVINCES).size, 77);
  assert.ok(PROVINCES.includes('บึงกาฬ'));
  assert.ok(PROVINCES.includes('ชลบุรี'));
  for (const province of PROVINCES) {
    const r = read({ province });
    assert.equal(r.birth.province, province);
    assert.equal(r.natal.referenceMode, 'auto');
  }
});

test('known time and province actually affect the ascendant', () => {
  assert.notEqual(read().natal.ascendant.longitudeDegrees, read({time:'18:30'}).natal.ascendant.longitudeDegrees);
  assert.notEqual(read().natal.ascendant.longitudeDegrees, read({province:'ชลบุรี'}).natal.ascendant.longitudeDegrees);
});

test('empty time is noon reference, never an inferred ascendant or birth house', () => {
  for (const time of ['', undefined, null]) {
    const r = read({time,period:'7 วัน'});
    assert.equal(r.birth.timeKnown, false);
    assert.equal(r.birth.referenceTime, '12:00');
    assert.equal(r.natal.ascendant, null);
    assert.deepEqual(r.natal.houses, []);
    assert.equal(r.natal.taksa, null);
    assert.equal(r.natal.factors, null);
    assert.equal(r.natal.planets.sun.longitudeDegrees, read({time:'12:00'}).natal.planets.sun.longitudeDegrees);
    for (const p of [...Object.values(r.natal.planets), ...r.snapshots.flatMap(s => Object.values(s.planets))]) {
      assert.equal(p.house, null);
      assert.equal('ruledHouses' in p, false);
    }
    assert.equal('charts' in r.natal, false);
  }
});

test('each reading is independent: known to unknown to known does not retain factors', () => {
  assert.ok(read().natal.taksa);
  assert.equal(read({time:''}).natal.taksa, null);
  assert.equal(read({time:'00:00'}).birth.timeKnown, true);
  assert.ok(read({time:'00:00'}).natal.ascendant);
});

test('Bangkok date/time uses local clock, even when UTC is on the previous day', () => {
  assert.deepEqual(bangkokMoment(fixture.now), {
    date: {year:2026,era:'CE',month:11,day:15}, time:{hour:1,minute:23},
    dateISO:'2026-11-15', timeLabel:'01:23',
  });
  assert.equal(bangkokMoment(new Date('2026-11-14T17:00:00Z')).timeLabel,'00:00');
  assert.equal(read().snapshots[0].dateISO,'2026-11-15');
  assert.equal(read().snapshots[0].time,'01:23');
});

test('host timezone cannot shift the reading date or sampled planetary positions', () => {
  // Pass the instant explicitly rather than relying on the wall clock.
  const code = `import {buildReading} from './src/astrology.js'; const args=${JSON.stringify({...fixture,now:undefined})}; args.now=new Date('2026-11-14T18:23:45Z'); console.log(JSON.stringify(buildReading(args)));`;
  const outputs = ['UTC','America/Los_Angeles','Asia/Tokyo'].map(TZ => execFileSync(process.execPath,['--input-type=module','-e',code],{cwd:new URL('..',import.meta.url),env:{...process.env,TZ},encoding:'utf8'}));
  assert.equal(outputs[0], outputs[1]);
  assert.equal(outputs[0], outputs[2]);
});

test('1/7/30 periods have N daily samples, including today, across year rollover', () => {
  for (const [period, count, end] of [['วันนี้',1,'2026-12-31'],['7 วัน',7,'2027-01-06'],['30 วัน',30,'2027-01-29']]) {
    const r = read({period,now:new Date('2026-12-31T16:59:00Z')});
    assert.equal(r.period.days,count);
    assert.equal(r.snapshots.length,count);
    assert.equal(r.snapshots[0].dateISO,'2026-12-31');
    assert.equal(r.snapshots.at(-1).dateISO,end);
    assert.ok(r.snapshots.every(s => s.time === '23:59'));
    if (count > 1) {
      assert.notEqual(r.snapshots[0].planets.moon.longitudeDegrees,r.snapshots.at(-1).planets.moon.longitudeDegrees);
      assert.ok(r.changes.length > 0);
      assert.ok(r.changes.every(c => r.snapshots.some(s => s.dateISO === c.dateISO)));
    }
  }
});

test('transit houses are relative to the natal ascendant, not the transit ascendant', () => {
  const r = read({now:new Date('2026-11-15T05:23:45Z')});
  const pair = calculateHoroscopeTransits(
    {date:fixture.date,time:{hour:8,minute:30},location:{province:'เชียงใหม่'}},
    {date:{year:2026,era:'CE',month:11,day:15},time:{hour:12,minute:23},location:{province:'เชียงใหม่'}},
  );
  for (const key of PLANET_KEYS) {
    assert.equal(r.snapshots[0].planets[key].house, pair.comparison[key].natalHouse);
    assert.equal(r.snapshots[0].planets[key].longitudeDegrees, pair.transit.points[key].longitudeDegrees);
  }
  assert.ok(PLANET_KEYS.some(key => pair.comparison[key].natalHouse !== pair.transit.points[key].house));
});

test('leap dates are checked, and 1900 is not a leap year', () => {
  assert.doesNotThrow(() => read({date:{year:2000,era:'CE',month:2,day:29}}));
  assert.throws(() => read({date:{year:1900,era:'CE',month:2,day:29}}));
  assert.throws(() => read({date:{year:2024,era:'CE',month:4,day:31}}));
  assert.throws(() => read({date:{year:2100,era:'CE',month:2,day:29},now:new Date('2100-03-01T00:00:00Z')}));
});

test('invalid time/province/period/future date is rejected instead of silently defaulted', () => {
  for (const time of ['8:30','24:00','12:60','invalid',0]) assert.throws(() => read({time}));
  for (const province of ['อื่น ๆ','TH-50','',undefined]) assert.throws(() => read({province}));
  assert.throws(() => read({period:'90 วัน'}));
  assert.throws(() => read({date:{year:2026,era:'CE',month:11,day:16}}));
  assert.throws(() => read({date:{year:1899,era:'CE',month:1,day:1}}));
  assert.throws(() => read({now:new Date(NaN)}));
});

test('guard the pinned upstream one-minute historical Uranus anomaly', () => {
  const date = {year:1904,era:'CE',month:2,day:29};
  assert.throws(() => read({date,time:'03:47',province:'แม่ฮ่องสอน'}), /ข้อจำกัด/);
  assert.doesNotThrow(() => read({date,time:'03:46',province:'แม่ฮ่องสอน'}));
  assert.doesNotThrow(() => read({date,time:'03:48',province:'แม่ฮ่องสอน'}));
  assert.doesNotThrow(() => read({date,time:'03:47',province:'เชียงใหม่'}));
});

test('known birth time later today is rejected, while unknown-time noon remains a reference', () => {
  const date = {year:2026,era:'CE',month:11,day:15};
  assert.throws(() => read({date,time:'23:59'}), /เวลาเกิด/);
  assert.doesNotThrow(() => read({date,time:'01:23'}));
  assert.doesNotThrow(() => read({date,time:'01:22'}));
  assert.equal(read({date,time:''}).birth.timeKnown,false);
});

test('Thai lunar dates outside the engine calendar coverage remain null', () => {
  assert.equal(read({now:new Date('2077-01-01T00:00:00Z')}).snapshots[0].lunarDate,null);
});
