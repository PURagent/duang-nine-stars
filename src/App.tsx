import { useState, useEffect, useRef } from 'react';
import { bangkokDate, birthDateISO, daysInMonth } from './birth-date.js';
import { PROVINCES, buildReading } from './astrology.js';
import AstrologyResults from './AstrologyResults';
import FortuneReading from './FortuneReading';
import CardPicker from './CardPicker';
import { TAROT_CARDS as cards } from './tarot-cards.js';
import { interpretReading } from './fortune-reading.js';
import { createCardSelection, toggleCardSelection, confirmCardSelection } from './card-selection.js';
import './horoscope.css';
const symbols=['♈','♉','♊','♋','♌','♍','♎','♏','♐','♑','♒','♓'];
const topics=[['ภาพรวมชีวิต','✧'],['ความรัก','♡'],['การงาน','⚒'],['การเงิน','◈'],['โชคลาภ','✦']];
export default function Page(){
const [step,S]=useState(0),[day,setDay]=useState(''),[month,setMonth]=useState(''),[year,setYear]=useState(''),[time,T]=useState(''),[province,P]=useState('ชลบุรี'),[topic,Q]=useState('ภาพรวมชีวิต'),[period,R]=useState('วันนี้'),[error,E]=useState(''),[now,N]=useState<Date|null>(null),[copied,C]=useState(false);
const [reading,setReading]=useState<ReturnType<typeof buildReading>|null>(null);
const [interpretation,setInterpretation]=useState<ReturnType<typeof interpretReading>|null>(null);
const [selection,setSelection]=useState<ReturnType<typeof createCardSelection>|null>(null);
const headingRef = useRef<HTMLHeadingElement>(null);
const screen = `${step}-${step === 2 && selection?.revealed ? 'revealed' : 'selecting'}`;
const previousScreen = useRef(screen);
const todayISO = bangkokDate();
const currentYear = Number(todayISO.slice(0,4));
const birthday = birthDateISO(year, month, day);
const monthNames = ['มกราคม','กุมภาพันธ์','มีนาคม','เมษายน','พฤษภาคม','มิถุนายน','กรกฎาคม','สิงหาคม','กันยายน','ตุลาคม','พฤศจิกายน','ธันวาคม'];
const dayCount = daysInMonth(year, month);
useEffect(()=>N(new Date()),[]);
useEffect(()=>{if(day && Number(day)>dayCount)setDay('')},[day,dayCount]);
useEffect(()=>{
  if(previousScreen.current===screen)return;
  previousScreen.current=screen;
  headingRef.current?.scrollIntoView({block:'start',behavior:'auto'});
  headingRef.current?.focus({preventScroll:true});
},[screen]);
const today=now?new Intl.DateTimeFormat('th-TH',{timeZone:'Asia/Bangkok',day:'numeric',month:'long',year:'numeric'}).format(now):'วันนี้';
function next(){
  if(!day||!month||!year){E('กรุณาเลือกวัน เดือน และปีเกิดให้ครบ');return}
  if(!birthday||birthday>todayISO){E('กรุณาเลือกวันเกิดที่ถูกต้องและไม่เกินวันนี้');return}
  E('');S(1);
}
function start(){
  try {
    const instant=new Date();
    const result=buildReading({date:{year:Number(year),era:'CE',month:Number(month),day:Number(day)},time,province,period,now:instant});
    const dealt=createCardSelection();
    setReading(result);setInterpretation(null);setSelection(dealt);N(instant);E('');S(2);
  } catch (cause) {
    E(cause instanceof Error?cause.message:'คำนวณไม่สำเร็จ กรุณาตรวจสอบข้อมูลแล้วลองใหม่');
  }
}
function confirmCards(){
  if(!selection||!reading)return;
  try {
    const confirmed=confirmCardSelection(selection);
    const narrative=interpretReading({reading,cardIds:confirmed.cardIds,topic});
    setSelection(confirmed);setInterpretation(narrative);E('');
  } catch (cause) {
    E(cause instanceof Error?cause.message:'เปิดไพ่ไม่สำเร็จ กรุณาลองใหม่');
  }
}
function shuffleCards(){
  if(selection?.revealed)return;
  try {setSelection(createCardSelection());setInterpretation(null);E('');}
  catch {E('สับไพ่ไม่สำเร็จ กรุณาลองใหม่');}
}
async function share(){const url=new URL('./',window.location.href).href;try{if(navigator.share)await navigator.share({title:'ดวงชะตา ๙ ดาว',url,text:'มาลองเปิดไพ่ดูดวงกัน'});else{await navigator.clipboard.writeText(url);C(true)}}catch{}}
return <main className="astro"><header><div className="logo"><span>✺</span><div>ดวงชะตา <b>๙ ดาว</b><small>THAI ASTRO · TAROT</small></div></div><small className="live">✦ เปิดรับคำทำนายทุกวัน</small></header>
<section className="hero"><div className="eyebrow">✦ โหราศาสตร์ไทย × ไพ่ทาโรต์ ✦</div><div className="wheel"><div className="core">☼<small>ดวงดาวนำทาง</small></div>{symbols.map((x,i)=><span key={i} style={{left:(50+42*Math.sin(i*Math.PI/6))+'%',top:(50-42*Math.cos(i*Math.PI/6))+'%'}}>{x}</span>)}</div><h1>ทุกดวงดาวมีเรื่องราว<br/><em>ของคุณอยู่ในนั้น</em></h1><p>สำรวจจังหวะชีวิตผ่านแผนที่ดาว<br/>และค้นหามุมมองใหม่จากไพ่ทาโรต์ 3 ใบ</p><a className="gold start-reading" href="#reading">เริ่มดูดวง ↓</a><div className="date">✦ คำทำนายประจำวันที่ {today}</div></section>
<section className="reading" id="reading"><div className="readhead"><div><div className="eyebrow">PERSONAL READING</div><h2 ref={headingRef} tabIndex={-1}>{['เริ่มต้นค้นหาดวงชะตา','เลือกเรื่องที่อยากรู้',selection?.revealed?'ไพ่ที่คุณเลือก':'เลือกไพ่ด้วยตัวคุณเอง','คำทำนายของคุณ'][step]}</h2></div><small>ขั้นที่ {step+1} / 4</small></div><div className="progress">{[0,1,2,3].map(i=><i key={i} className={i<=step?'on':''}/>)}</div>
{step===0&&<form className="panel" onSubmit={e=>{e.preventDefault();next()}} noValidate>
  <p className="intro">เลือกวันเกิดของคุณ แล้วกดถัดไปได้เลย ไม่จำเป็นต้องระบุเวลาเกิด</p>
  <fieldset className="birth-fields"><legend>วันเดือนปีเกิด</legend>
    <div className="birth-selects">
      <label>วัน<select aria-label="วันเกิด" value={day} onChange={e=>{setDay(e.target.value);E('')}}><option value="">เลือกวัน</option>{Array.from({length:dayCount},(_,i)=><option key={i+1} value={i+1}>{i+1}</option>)}</select></label>
      <label>เดือน<select aria-label="เดือนเกิด" value={month} onChange={e=>{setMonth(e.target.value);E('')}}><option value="">เลือกเดือน</option>{monthNames.map((name,i)=><option key={name} value={i+1}>{name}</option>)}</select></label>
      <label>ปี พ.ศ.<select aria-label="ปีเกิด พ.ศ." value={year} onChange={e=>{setYear(e.target.value);E('')}}><option value="">เลือกปี</option>{Array.from({length:currentYear-1899},(_,i)=>currentYear-i).map(y=><option key={y} value={y}>{y+543} (ค.ศ. {y})</option>)}</select></label>
    </div>
  </fieldset>
  <details className="optional-time"><summary>เพิ่มเวลาเกิด <span>(ไม่บังคับ)</span></summary><label>เวลาเกิด (เว้นว่างได้)<input aria-label="เวลาเกิด (เว้นว่างได้)" type="time" value={time} onChange={e=>T(e.target.value)}/></label></details>
  <label>จังหวัดเกิด<select aria-label="จังหวัดเกิด" value={province} onChange={e=>P(e.target.value)}>{PROVINCES.map(x=><option key={x}>{x}</option>)}</select></label>
  <p className="note">คำนวณสุริยยาตร์ด้วย thai-astrology ใช้จังหวัดและเวลาเกิดหาลัคนา หากไม่ทราบเวลา จะใช้ 12:00 น. เป็นจุดอ้างอิงตำแหน่งดาวเท่านั้น โดยไม่แสดงลัคนา ภพ หรือทักษา</p>
  <p className="note">วันเกิดประมวลผลในอุปกรณ์ของคุณ ไม่ส่งไปเซิร์ฟเวอร์และไม่ถูกบันทึก จังหวัดใช้พิกัดเมืองศูนย์กลาง ไม่ใช่พิกัดสถานที่เกิดจริง</p>
  {error&&<p className="error" role="alert">{error}</p>}
  <button type="submit" className="gold full">ถัดไป — เลือกเรื่องที่อยากรู้ ↗</button>
</form>}

{step===1&&<div className="panel">
  <p className="intro">เลือกหัวข้อที่อยากสำรวจ และช่วงเวลาของคำอ่าน</p>
  <div className="topics">{topics.map(([name,icon])=><button className={topic===name?'active':''} aria-pressed={topic===name} key={name} onClick={()=>Q(name)}><span>{icon}</span>{name}</button>)}</div>
  <h4>ช่วงเวลาของคำทำนาย</h4>
  <div className="periods">{['วันนี้','7 วัน','30 วัน'].map(x=><button className={period===x?'active':''} aria-pressed={period===x} key={x} onClick={()=>R(x)}>{x}</button>)}</div>
  <p className="note">ดาวจรเริ่มจากเวลาที่เปิดคำอ่านตามเวลาไทย ช่วง 7/30 วันตรวจวันละ 1 จุด ณ เวลาเดียวกัน รวมวันนี้ ไม่ใช่เวลาย้ายราศีที่แน่นอน</p>
  {error&&<p className="error" role="alert">{error}</p>}
  <div className="actions"><button className="outline" onClick={()=>{E('');S(0)}}>← ย้อนกลับ</button><button className="gold" onClick={start}>เข้าสู่สำรับไพ่ ↗</button></div>
</div>}
{step===2&&selection&&<>
  {error&&<p className="error" role="alert">{error}</p>}
  {!selection.revealed?<CardPicker
    cardCount={selection.pool.length}
    selectedPositions={selection.selectedPositions}
    onToggle={position=>{setSelection(current=>current?toggleCardSelection(current,position):current);E('')}}
    onShuffle={shuffleCards}
    onConfirm={confirmCards}
    onBack={()=>{E('');S(1)}}
  />:<div className="panel chosen-cards">
    <p className="intro">ไพ่ 3 ใบที่คุณเลือก เรียงตามลำดับที่แตะ<br/>แม่หมอจะอ่านจากไพ่ชุดนี้ พร้อมข้อมูลที่คุณให้ไว้ค่ะ</p>
    <div className="deck">{selection.cardIds.map((id,i)=><div className="card flipped" key={id}>
      <div className="front"><small>✦ {i+1} ✦</small><strong aria-hidden="true">{cards[id].icon}</strong><b>{cards[id].name}</b></div>
    </div>)}</div>
    <div className="labels"><span>สถานการณ์</span><span>สิ่งที่ควรใส่ใจ</span><span>แนวโน้ม</span></div>
    <p className="count">เลือกจากใบที่ {selection.selectedPositions.map(position=>position+1).join(' · ')}</p>
    <div className="actions"><button className="outline" onClick={()=>{E('');S(1)}}>← เปลี่ยนหัวข้อและเลือกใหม่</button><button className="gold" onClick={()=>S(3)}>อ่านคำทำนาย ↗</button></div>
  </div>}
</>}
{step===3&&reading&&interpretation&&<div className="panel result">
  <FortuneReading interpretation={interpretation}/>
  <details className="technical-reading">
    <summary>ดูข้อมูลคำนวณดาวและปฏิทินที่ใช้ประกอบคำอ่าน</summary>
    <AstrologyResults reading={reading}/>
  </details>
  <p className="note">เพื่อความบันเทิงและสะท้อนคิด สุริยยาตร์เป็นวิธีคำนวณตามตำรา ไม่ใช่หลักฐานรับรองความแม่นของคำทำนาย และไม่ใช่คำแนะนำด้านสุขภาพหรือการเงิน</p>
  <div className="actions"><button className="outline" onClick={()=>{S(0);setSelection(null);C(false);E('');setReading(null);setInterpretation(null)}}>↻ ดูดวงใหม่</button><button className="gold" onClick={share}>{copied?'คัดลอกลิงก์แล้ว ✓':'แชร์ให้เพื่อน ↗'}</button></div>
</div>}</section>
<section className="method"><div className="eyebrow">THE RITUAL</div><h2>เมื่อดวงดาวพบกับไพ่</h2><div className="features">
  <div><span>01</span><h3>พื้นดวงสุริยยาตร์</h3><p>สมผุสดาวทั้งสิบ ลัคนาและภพเมื่อทราบเวลาเกิด</p></div>
  <div><span>02</span><h3>สำรวจดาวจร</h3><p>ดูตำแหน่งดาวตามวันและเวลาไทย พร้อมเลือกดูรายวันในช่วง 7 หรือ 30 วัน</p></div>
  <div><span>03</span><h3>ไพ่ที่คุณเลือกเอง</h3><p>เลือก 3 ใบจากไพ่คว่ำ 12 ใบที่สับจากสำรับครบ 78 ใบ เพื่อสะท้อนมุมมองของคุณ</p></div>
</div></section>
<footer>
  <div><div className="logo">✺ ดวงชะตา ๙ ดาว</div><p>อ่านดวงอย่างมีสติ ใช้ชีวิตด้วยการตัดสินใจของคุณเอง</p></div>
  <div className="credits"><p>คำนวณด้วย <a href="https://github.com/kongesque/thai-astrology/tree/v0.3.2" target="_blank" rel="noreferrer">thai-astrology 0.3.2</a></p><p>พิกัดเมืองศูนย์กลางจังหวัดจาก <a href="https://www.geonames.org/" target="_blank" rel="noreferrer">GeoNames</a> (<a href="https://creativecommons.org/licenses/by/4.0/" target="_blank" rel="noreferrer">CC BY 4.0</a>) ผ่านไลบรารี</p><a href="./THIRD_PARTY_NOTICES.txt" target="_blank" rel="noreferrer">เครดิตและสัญญาอนุญาตโอเพนซอร์ส</a></div>
</footer></main>
}
