import { useEffect, useId, useState } from 'react';
import './astrology-results.css';

type Planet = {
  key: string;
  nameThai: string;
  number: number | null;
  sign: number;
  signName: string;
  degrees: number;
  minutes: number;
  longitudeDegrees: number;
  house: number | null;
  dignities: string[];
};
type LunarDate = {
  phase: 'waxing' | 'waning';
  day: number;
  month: number;
  secondEighthMonth: boolean;
} | null;
type Snapshot = {
  dateISO: string;
  time: string;
  planets: Record<string, Planet>;
  lunarDate: LunarDate;
};
type Reading = {
  engine: { name: string; version: string; method: string };
  birth: { dateISO: string; referenceTime: string; timeKnown: boolean; province: string };
  natal: {
    planets: Record<string, Planet>;
    ascendant: Planet | null;
    houses: {
      number: number;
      nameThai: string;
      signNameThai: string;
      ruler: { nameThai: string };
      occupants: string[];
    }[];
    taksa: Record<string, string | number> | null;
    factors: { ascendantRulerName: string; tanusethName: string } | null;
    lunarDate: LunarDate;
    civilWeekday: number;
    referenceMode: string;
  };
  period: { label: string; days: number };
  snapshots: Snapshot[];
  changes: {
    dateISO: string;
    time: string;
    key: string;
    nameThai: string;
    fromSignName: string;
    toSignName: string;
  }[];
  generatedAtISO: string;
};

const weekdays = ['', 'อาทิตย์', 'จันทร์', 'อังคาร', 'พุธ', 'พฤหัสบดี', 'ศุกร์', 'เสาร์'];
const taksaLabels = [
  ['boriwan', 'บริวาร'], ['ayu', 'อายุ'], ['det', 'เดช'], ['si', 'ศรี'],
  ['mula', 'มูละ'], ['utsaha', 'อุตสาหะ'], ['montri', 'มนตรี'], ['kalakini', 'กาลกิณี'],
];
const longDate = new Intl.DateTimeFormat('th-TH', {
  timeZone: 'Asia/Bangkok', year: 'numeric', month: 'long', day: 'numeric',
});
const localMoment = new Intl.DateTimeFormat('th-TH', {
  timeZone: 'Asia/Bangkok', year: 'numeric', month: 'long', day: 'numeric',
  hour: '2-digit', minute: '2-digit', hourCycle: 'h23',
});

function dateLabel(iso: string) {
  return longDate.format(new Date(`${iso}T12:00:00+07:00`));
}
function positionLabel(point: Planet) {
  // Fractional ascendant minutes are truncated, never rounded into 60′.
  return `${point.degrees}° ${String(Math.floor(point.minutes)).padStart(2, '0')}′`;
}
function lunarLabel(lunar: LunarDate) {
  if (!lunar) return 'ไม่มีข้อมูลจันทรคติในช่วงปีนี้';
  return `${lunar.phase === 'waxing' ? 'ขึ้น' : 'แรม'} ${lunar.day} ค่ำ เดือน ${lunar.month}${lunar.secondEighthMonth ? ' หลัง' : ''}`;
}

function Position({ point, showHouse }: { point: Planet; showHouse: boolean }) {
  return <>
    <strong>{point.signName}</strong>
    <span className="position-degrees">{positionLabel(point)}</span>
    {showHouse && point.house !== null && <small>ภพ {point.house}</small>}
  </>;
}

export default function AstrologyResults({ reading }: { reading: Reading }) {
  const [selectedIndex, setSelectedIndex] = useState(0);
  const selectorId = useId();
  useEffect(() => setSelectedIndex(0), [reading]);
  const { birth, natal, period, snapshots, changes } = reading;
  const snapshot = snapshots[selectedIndex] || snapshots[0];
  const planets = Object.values(natal.planets);
  const known = birth.timeKnown;
  const planetName = (number: string | number) => planets.find(p => p.number === number)?.nameThai || '—';

  return <section className="astro-calculation" aria-label="ตำแหน่งดาวตามสุริยยาตร์">
    <div className="calculation-heading">
      <div><div className="eyebrow">SURIYAYATRA</div><h3>แผนที่ดาวของคุณ</h3></div>
      <a className="engine-badge" href="https://github.com/kongesque/thai-astrology/tree/v0.3.2" target="_blank" rel="noopener noreferrer">
        {reading.engine.name} {reading.engine.version}
      </a>
    </div>
    <p className="calculation-timestamp">คำนวณ ณ <time dateTime={reading.generatedAtISO}>{localMoment.format(new Date(reading.generatedAtISO))}</time> น. · เวลาไทย (Asia/Bangkok)</p>
    <p className="birth-facts">เกิดวัน{weekdays[natal.civilWeekday]}ที่ {dateLabel(birth.dateISO)}{known ? ` เวลา ${birth.referenceTime} น.` : ''} · {birth.province}</p>

    {!known && <div className="birth-time-notice" role="note">
      <strong>ไม่ทราบเวลาเกิด — ใช้เวลาอ้างอิง {birth.referenceTime} น.</strong>
      <p>ตำแหน่งดาวกำเนิดด้านล่างเป็นค่าอ้างอิงตอนเที่ยง ไม่ใช่เวลาเกิดที่อนุมานให้ ราศีและองศาอาจเปลี่ยนในวันเดียวกัน จึงไม่แสดงลัคนา ภพ และทักษา</p>
    </div>}

    <div className="natal-highlights">
      <div><small>อาทิตย์กำเนิด{!known && ' · เวลาอ้างอิง'}</small><b>{natal.planets.sun.signName}</b><span>{positionLabel(natal.planets.sun)}</span></div>
      {known && natal.ascendant && <div><small>ลัคนากำเนิด</small><b>{natal.ascendant.signName}</b><span>{positionLabel(natal.ascendant)}</span></div>}
      <div className="lunar-highlight"><small>จันทรคติวันเกิด</small><b>{lunarLabel(natal.lunarDate)}</b></div>
    </div>

    <div className="transit-section">
      <h4>ดาวจร · {period.label}</h4>
      <p className="calculation-note">{period.days === 1
        ? 'ตำแหน่งดาวจร ณ นาทีที่เริ่มอ่านดวง'
        : `ตรวจวันละ 1 จุด เป็นเวลา ${period.days} วัน รวมวันนี้ ณ เวลา ${snapshots[0].time} น. เท่ากันทุกวัน`}</p>
      {period.days > 1 && <label className="transit-date-label" htmlFor={selectorId}>เลือกวันที่ดูดาวจร
        <select id={selectorId} aria-label="วันที่ดูดาวจร" value={selectedIndex} onChange={e => setSelectedIndex(Number(e.target.value))}>
          {snapshots.map((sample, i) => <option key={sample.dateISO} value={i}>{dateLabel(sample.dateISO)}{i === 0 ? ' · วันนี้' : ''}</option>)}
        </select>
      </label>}
      <p className="sample-lunar" aria-live="polite">{dateLabel(snapshot.dateISO)} · {snapshot.time} น.<br/>{lunarLabel(snapshot.lunarDate)}</p>
      <div className="planet-table-wrap">
        <table className="planet-table">
          <caption>สมผุสดาวทั้ง 10 · องศาและลิปดา{known ? ' · ภพจรนับจากลัคนากำเนิด' : ' · พื้นดวงใช้เวลาอ้างอิง 12:00 น.'}</caption>
          <thead><tr><th scope="col">ดาว</th><th scope="col">{known ? 'กำเนิด' : 'อ้างอิง 12:00'}</th><th scope="col">จร</th></tr></thead>
          <tbody>{planets.map(point => <tr key={point.key}>
            <th scope="row"><span className="planet-number">{point.number === null ? '' : '๐๑๒๓๔๕๖๗๘๙'[point.number]}</span>{point.nameThai}{point.key === 'uranus' && <small>ยูเรนัส</small>}</th>
            <td><Position point={point} showHouse={known}/></td>
            <td><Position point={snapshot.planets[point.key]} showHouse={known}/></td>
          </tr>)}</tbody>
        </table>
      </div>
      <p className="calculation-note">ดาวจรใช้จังหวัดเกิด {birth.province} เป็นจุดอ้างอิง ไม่ใช่ตำแหน่งที่คุณอยู่ขณะนี้ · แสดงลิปดาถึงนาทีเต็มโดยปัดลง</p>
    </div>

    {known && natal.houses.length > 0 && <details className="calculation-details">
      <summary>ภพกำเนิดทั้ง 12 และเจ้าเรือน</summary>
      <p className="calculation-note">ระบบภพแบบนับตามราศี (whole-sign) ให้ราศีลัคนาเป็นภพที่ 1</p>
      <ol className="house-list">{natal.houses.map(house => <li key={house.number}>
        <div><b>{house.number}. {house.nameThai}</b><span>ราศี{house.signNameThai}</span></div>
        <p>เจ้าเรือน: {house.ruler.nameThai}<br/>ดาวสถิต: {house.occupants.map(key => natal.planets[key]?.nameThai).filter(Boolean).join(' · ') || 'ไม่มี'}</p>
      </li>)}</ol>
      {natal.factors && <p className="calculation-note">ตนุลัคน์: {natal.factors.ascendantRulerName} · ตนุเศษ: {natal.factors.tanusethName}</p>}
    </details>}

    {known && natal.taksa && <details className="calculation-details">
      <summary>ทักษาตามวันเกิด</summary>
      <p className="calculation-note">ใช้เกณฑ์เปลี่ยนวันเวลา 06:00 น. ตามไลบรารี คำเรียกเป็นหมวดตามตำรา ไม่ใช่ข้อยืนยันว่าจะเกิดเหตุการณ์ดีหรือร้าย</p>
      <dl className="taksa-list">{taksaLabels.map(([key, label]) => <div key={key}><dt>{label}</dt><dd>{planetName(natal.taksa![key])}</dd></div>)}</dl>
    </details>}

    {period.days > 1 && <details className="calculation-details">
      <summary>การเปลี่ยนราศีที่พบใน {period.days} วัน</summary>
      <p className="calculation-note">พบเปลี่ยนราศีระหว่างจุดตรวจรายวัน ไม่ใช่เวลาย้ายราศีที่แน่นอน</p>
      {changes.length > 0 ? <ul className="transit-changes">{changes.map((change, i) => <li key={`${change.dateISO}-${change.key}-${i}`}>
        <time dateTime={`${change.dateISO}T${change.time}:00+07:00`}>{dateLabel(change.dateISO)} · {change.time} น.</time>
        <b>{change.nameThai}</b><span>{change.fromSignName} → {change.toSignName}</span>
      </li>)}</ul> : <p className="calculation-note">ไม่พบการเปลี่ยนราศีระหว่างจุดตรวจในช่วงนี้</p>}
    </details>}

    <p className="calculation-note calculation-method">คำนวณตามสุริยยาตร์และใช้พิกัดเมืองศูนย์กลางจังหวัด ไม่ใช่พิกัดสถานที่เกิดจริง วันจันทรคติอาจต่างจากปฏิทินที่เผยแพร่ ผลทางโหราศาสตร์ไม่ได้รับรองความแม่นยำของคำทำนาย</p>
  </section>;
}
