import {
  calculateThaiHoroscope,
  calculateHoroscopeTransits,
  getThaiAstrologyProvinces,
  validateHoroscopeInput,
} from 'thai-astrology';

export const PLANET_KEYS = Object.freeze([
  'sun', 'moon', 'mars', 'mercury', 'jupiter', 'venus', 'saturn', 'rahu', 'ketu', 'uranus',
]);
// 0.3.2 accepts Thai names, not the ISO province codes shown in unreleased docs.
export const PROVINCES = Object.freeze(getThaiAstrologyProvinces().map(p => p.province));
const PERIOD_DAYS = Object.freeze({ 'วันนี้': 1, '7 วัน': 7, '30 วัน': 30 });
const pad = value => String(value).padStart(2, '0');
const dateISO = ({year, month, day}) => `${year}-${pad(month)}-${pad(day)}`;
const bangkokFormatter = new Intl.DateTimeFormat('en-GB-u-ca-gregory-nu-latn', {
  timeZone: 'Asia/Bangkok', year: 'numeric', month: '2-digit', day: '2-digit',
  hour: '2-digit', minute: '2-digit', hourCycle: 'h23',
});

export function bangkokMoment(now = new Date()) {
  if (!(now instanceof Date) || !Number.isFinite(now.getTime())) {
    throw new Error('ไม่สามารถอ่านวันเวลาปัจจุบันได้ กรุณาตรวจสอบนาฬิกาอุปกรณ์');
  }
  const parts = Object.fromEntries(bangkokFormatter.formatToParts(now).map(p => [p.type, p.value]));
  const date = { year: Number(parts.year), era: 'CE', month: Number(parts.month), day: Number(parts.day) };
  const time = { hour: Number(parts.hour), minute: Number(parts.minute) };
  return { date, time, dateISO: dateISO(date), timeLabel: `${pad(time.hour)}:${pad(time.minute)}` };
}

function pointForDisplay(point, house) {
  return {
    key: point.key, nameThai: point.nameThai, number: point.number,
    sign: point.sign, signName: point.signName,
    degrees: point.degrees, minutes: point.minutes, longitudeDegrees: point.longitudeDegrees,
    house, dignities: [...point.dignities],
  };
}

function planetsForDisplay(points, houseFor) {
  return Object.fromEntries(PLANET_KEYS.map(key => [key, pointForDisplay(points[key], houseFor(key))]));
}

function sampleDate(start, offset) {
  // Calendar arithmetic in UTC avoids the host timezone and DST altering the date.
  const value = new Date(Date.UTC(start.year, start.month - 1, start.day + offset));
  return {year:value.getUTCFullYear(),era:'CE',month:value.getUTCMonth()+1,day:value.getUTCDate()};
}

export function buildReading({ date, time, province, period = 'วันนี้', now = new Date() }) {
  const current = bangkokMoment(now);
  const periodDays = Object.hasOwn(PERIOD_DAYS, period) ? PERIOD_DAYS[period] : null;
  if (!periodDays) throw new Error('กรุณาเลือกช่วงเวลา วันนี้ 7 วัน หรือ 30 วัน');
  if (!PROVINCES.includes(province)) throw new Error('กรุณาเลือกจังหวัดเกิดจากรายการ 77 จังหวัด');
  const timeKnown = time !== '' && time !== undefined && time !== null;
  if (timeKnown && (typeof time !== 'string' || !/^(?:[01]\d|2[0-3]):[0-5]\d$/.test(time))) {
    throw new Error('กรุณาระบุเวลาเกิดเป็นชั่วโมงและนาที เช่น 08:30 หรือเว้นว่างไว้');
  }
  const referenceTime = timeKnown ? time : '12:00';
  const [hour, minute] = referenceTime.split(':').map(Number);
  // Do not spread the province record: an explicit localTimeCorrectionMinutes
  // would disable the library's automatic daily sunrise/historical-offset mode.
  const natalInput = {date, time:{hour,minute}, location:{province}};
  const validated = validateHoroscopeInput(natalInput);
  if (!validated.valid) throw new Error('วันเดือนปีเกิดหรือเวลาไม่ถูกต้อง กรุณาตรวจสอบข้อมูลอีกครั้ง');
  const normalizedDate = validated.value.date;
  const birthISO = dateISO({year:normalizedDate.yearCe,month:normalizedDate.month,day:normalizedDate.day});
  if (normalizedDate.yearCe < 1900 || normalizedDate.yearCe > 2100) {
    throw new Error('รุ่นนี้รองรับวันเกิดตั้งแต่ ค.ศ. 1900 ถึง 2100');
  }
  if (birthISO > current.dateISO) throw new Error('วันเกิดต้องไม่เกินวันปัจจุบันตามเวลาไทย');
  if (timeKnown && birthISO === current.dateISO && referenceTime > current.timeLabel) {
    throw new Error('เวลาเกิดต้องไม่เกินเวลาปัจจุบันตามเวลาไทย');
  }
  if (current.date.year < 1900 || sampleDate(current.date, periodDays - 1).year > 2100) {
    throw new Error('ช่วงเวลาคำนวณดาวจรอยู่นอกช่วง ค.ศ. 1900–2100 ที่รองรับ');
  }
  // Upstream 0.3.2 includes a date-specific +30° Uranus adjustment at this minute.
  // Refuse this one known discontinuity; do not silently rewrite upstream math.
  // See README and upstream src/engine/astro/suriyayatra.ts at tag v0.3.2.
  if (birthISO === '1904-02-29' && referenceTime === '03:47' && province === 'แม่ฮ่องสอน') {
    throw new Error('ไลบรารีรุ่นนี้มีข้อจำกัดกับวัน เวลา และจังหวัดนี้ จึงยังไม่แสดงผลเพื่อป้องกันข้อมูลคลาดเคลื่อน');
  }

  const rawNatal = calculateThaiHoroscope(natalInput);
  const natal = {
    planets: planetsForDisplay(rawNatal.points, key => timeKnown ? rawNatal.points[key].house : null),
    ascendant: timeKnown ? pointForDisplay(rawNatal.points.ascendant, 1) : null,
    houses: timeKnown ? rawNatal.houses : [],
    taksa: timeKnown ? rawNatal.taksa : null,
    factors: timeKnown ? {
      ascendantRulerName: rawNatal.points[rawNatal.factors.ascendantRuler].nameThai,
      tanusethName: rawNatal.factors.tanuseth.nameThai,
    } : null,
    lunarDate: rawNatal.calendar.thaiLunarDate,
    civilWeekday: rawNatal.calendar.civilWeekday,
    referenceMode: rawNatal.profile.referenceMode,
  };

  const snapshots = Array.from({length:periodDays}, (_, offset) => {
    const transitDate = sampleDate(current.date, offset);
    const pair = calculateHoroscopeTransits(natalInput, {
      date:transitDate, time:current.time, location:{province},
    });
    return {
      dateISO: dateISO(transitDate), time:current.timeLabel,
      // points[key].house is the TRANSIT ascendant's house. Use comparison
      // explicitly so visitors see transits relative to their NATAL ascendant.
      planets: planetsForDisplay(pair.transit.points, key => timeKnown ? pair.comparison[key].natalHouse : null),
      lunarDate: pair.transit.calendar.thaiLunarDate,
    };
  });
  const changes = snapshots.slice(1).flatMap((snapshot, index) => PLANET_KEYS
    .filter(key => snapshots[index].planets[key].sign !== snapshot.planets[key].sign)
    .map(key => ({
      dateISO:snapshot.dateISO, time:snapshot.time, key, nameThai:snapshot.planets[key].nameThai,
      fromSignName:snapshots[index].planets[key].signName, toSignName:snapshot.planets[key].signName,
    })));

  return {
    engine:{name:'thai-astrology',version:'0.3.2',method:'suriyayatra'},
    birth:{dateISO:birthISO,referenceTime,timeKnown,province},
    natal, period:{label:period,days:periodDays}, snapshots, changes,
    generatedAtISO:now.toISOString(),
  };
}
