import { useState, useEffect, useRef } from 'react';
import { bangkokDate, birthDateISO, daysInMonth } from './birth-date.js';
import './horoscope.css';
const signs=['เมษ','พฤษภ','เมถุน','กรกฎ','สิงห์','กันย์','ตุล','พิจิก','ธนู','มังกร','กุมภ์','มีน'];
const symbols=['♈','♉','♊','♋','♌','♍','♎','♏','♐','♑','♒','♓'];
const majors=['ผู้เริ่มต้น','นักมายากล','มหาปุโรหิตหญิง','จักรพรรดินี','จักรพรรดิ','นักบวช','คู่รัก','ราชรถ','ความเข้มแข็ง','ฤๅษี','กงล้อแห่งโชคชะตา','ความยุติธรรม','ผู้เสียสละ','การเปลี่ยนผ่าน','ความสมดุล','พันธนาการ','หอคอย','ดวงดาว','พระจันทร์','พระอาทิตย์','การตื่นรู้','โลก'];
const meanings=['เปิดรับจุดเริ่มต้น','ใช้ศักยภาพของตน','เชื่อสัญชาตญาณพร้อมตรวจข้อมูล','ดูแลการเติบโต','จัดระบบและขอบเขต','เรียนรู้จากประสบการณ์','เลือกตามคุณค่าของตน','มุ่งมั่นไปข้างหน้า','อดทนและเมตตา','ทบทวนตัวเอง','รับจังหวะเปลี่ยนแปลง','ตัดสินใจอย่างเป็นธรรม','เปลี่ยนมุมมอง','วางสิ่งเก่า','สร้างความสมดุล','ระวังความยึดติด','ตั้งหลักใหม่','รักษาความหวัง','ตรวจความไม่ชัดเจน','มองเห็นโอกาส','ทบทวนบทเรียน','ปิดงานให้สมบูรณ์'];
const suits=['ไม้เท้า','ถ้วย','ดาบ','เหรียญ'],ranks=['หนึ่ง','สอง','สาม','สี่','ห้า','หก','เจ็ด','แปด','เก้า','สิบ','เด็กถือไพ่','อัศวิน','ราชินี','ราชา'],phases=['จุดเริ่มต้น','ทางเลือก','การเติบโต','ความมั่นคง','บททดสอบ','การช่วยเหลือ','การประเมิน','ความคืบหน้า','ผลจากความพยายาม','ความสำเร็จ','การเรียนรู้','การลงมือทำ','การดูแล','ภาวะผู้นำ'];
const cards=[...majors.map((name,i)=>({name,meaning:meanings[i],icon:symbols[i%12]})),...suits.flatMap((s,j)=>ranks.map((r,i)=>({name:r+' '+s,meaning:phases[i]+'ด้าน'+['แรงบันดาลใจ','ความรู้สึก','เหตุผล','ทรัพย์สิน'][j],icon:['♧','♡','⚔','◇'][j]})))];
const topics=[['ภาพรวมชีวิต','✧'],['ความรัก','♡'],['การงาน','⚒'],['การเงิน','◈'],['โชคลาภ','✦']];
const places=['กรุงเทพมหานคร','ชลบุรี','ระยอง','เชียงใหม่','เชียงราย','ขอนแก่น','นครราชสีมา','นนทบุรี','ปทุมธานี','พระนครศรีอยุธยา','พิษณุโลก','ภูเก็ต','สงขลา','สุราษฎร์ธานี','อุบลราชธานี','อื่น ๆ'];
function mod(n:number){return (n%360+360)%360}function jd(d:Date){return d.getTime()/86400000+2440587.5}
function sun(d:Date){const t=(jd(d)-2451545)/36525,m=mod(357.52911+35999.05029*t)*Math.PI/180;return mod(280.46646+36000.76983*t+1.914602*Math.sin(m)+.019993*Math.sin(2*m))}
function moon(d:Date){const x=jd(d)-2451545,m=mod(134.963+13.064993*x)*Math.PI/180,a=mod(297.850+12.190749*x)*Math.PI/180;return mod(218.316+13.176396*x+6.289*Math.sin(m)+1.274*Math.sin(2*a-m))}
function sign(deg:number,d:Date){return Math.floor(mod(deg-23.856-.01397*(jd(d)-2451545)/365.25)/30)}
function draw(){const a=Array.from({length:78},(_,i)=>i);for(let i=77;i>0;i--){const n=new Uint32Array(1);crypto.getRandomValues(n);const j=n[0]%(i+1);[a[i],a[j]]=[a[j],a[i]]}return a.slice(0,3)}
export default function Page(){
const [step,S]=useState(0),[day,setDay]=useState(''),[month,setMonth]=useState(''),[year,setYear]=useState(''),[time,T]=useState(''),[province,P]=useState('ชลบุรี'),[topic,Q]=useState('ภาพรวมชีวิต'),[period,R]=useState('วันนี้'),[deck,D]=useState<number[]>([]),[flips,F]=useState(0),[error,E]=useState(''),[now,N]=useState<Date|null>(null),[copied,C]=useState(false);
const headingRef = useRef<HTMLHeadingElement>(null);
const previousStep = useRef(0);
const todayISO = bangkokDate();
const currentYear = Number(todayISO.slice(0,4));
const birthday = birthDateISO(year, month, day);
const monthNames = ['มกราคม','กุมภาพันธ์','มีนาคม','เมษายน','พฤษภาคม','มิถุนายน','กรกฎาคม','สิงหาคม','กันยายน','ตุลาคม','พฤศจิกายน','ธันวาคม'];
const dayCount = daysInMonth(year, month);
useEffect(()=>N(new Date()),[]);
useEffect(()=>{if(day && Number(day)>dayCount)setDay('')},[day,dayCount]);
useEffect(()=>{
  if(previousStep.current===step)return;
  previousStep.current=step;
  headingRef.current?.scrollIntoView({block:'start',behavior:'auto'});
  headingRef.current?.focus({preventScroll:true});
},[step]);
const birth=birthday?new Date(birthday+'T12:00:00+07:00'):null,bs=birth?sign(sun(birth),birth):null,ss=now?sign(sun(now),now):null,ms=now?sign(moon(now),now):null;
const today=now?new Intl.DateTimeFormat('th-TH',{timeZone:'Asia/Bangkok',day:'numeric',month:'long',year:'numeric'}).format(now):'วันนี้';
function next(){
  if(!day||!month||!year){E('กรุณาเลือกวัน เดือน และปีเกิดให้ครบ');return}
  if(!birthday||birthday>todayISO){E('กรุณาเลือกวันเกิดที่ถูกต้องและไม่เกินวันนี้');return}
  E('');S(1);
}
function start(){D(draw());F(0);S(2)}
async function share(){const url=new URL('./',window.location.href).href;try{if(navigator.share)await navigator.share({title:'ดวงชะตา ๙ ดาว',url,text:'มาลองเปิดไพ่ดูดวงกัน'});else{await navigator.clipboard.writeText(url);C(true)}}catch{}}
return <main className="astro"><header><div className="logo"><span>✺</span><div>ดวงชะตา <b>๙ ดาว</b><small>THAI ASTRO · TAROT</small></div></div><small className="live">✦ เปิดรับคำทำนายทุกวัน</small></header>
<section className="hero"><div className="eyebrow">✦ โหราศาสตร์ไทย × ไพ่ทาโรต์ ✦</div><div className="wheel"><div className="core">☼<small>ดวงดาวนำทาง</small></div>{symbols.map((x,i)=><span key={i} style={{left:(50+42*Math.sin(i*Math.PI/6))+'%',top:(50-42*Math.cos(i*Math.PI/6))+'%'}}>{x}</span>)}</div><h1>ทุกดวงดาวมีเรื่องราว<br/><em>ของคุณอยู่ในนั้น</em></h1><p>สำรวจจังหวะชีวิตผ่านแผนที่ดาว<br/>และค้นหามุมมองใหม่จากไพ่ทาโรต์ 3 ใบ</p><a className="gold start-reading" href="#reading">เริ่มดูดวง ↓</a><div className="date">✦ คำทำนายประจำวันที่ {today}</div></section>
<section className="reading" id="reading"><div className="readhead"><div><div className="eyebrow">PERSONAL READING</div><h2 ref={headingRef} tabIndex={-1}>{['เริ่มต้นค้นหาดวงชะตา','เลือกเรื่องที่อยากรู้','เปิดไพ่แห่งชะตา','คำทำนายของคุณ'][step]}</h2></div><small>ขั้นที่ {step+1} / 4</small></div><div className="progress">{[0,1,2,3].map(i=><i key={i} className={i<=step?'on':''}/>)}</div>
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
  <label>จังหวัดเกิด<select value={province} onChange={e=>P(e.target.value)}>{places.map(x=><option key={x}>{x}</option>)}</select></label>
  <p className="note">ข้อมูลใช้เฉพาะในหน้านี้และไม่ถูกบันทึก รุ่นนี้อ่านราศีดาวแบบประมาณ ยังไม่ใช้เวลาและจังหวัดเกิดคำนวณลัคนา</p>
  {error&&<p className="error" role="alert">{error}</p>}
  <button type="submit" className="gold full">ถัดไป — เลือกเรื่องที่อยากรู้ ↗</button>
</form>}

{step===1&&<div className="panel"><p className="intro">เลือกหัวข้อที่อยากสำรวจ และช่วงเวลาของคำอ่าน</p><div className="topics">{topics.map(([name,icon])=><button className={topic===name?'active':''} aria-pressed={topic===name} key={name} onClick={()=>Q(name)}><span>{icon}</span>{name}</button>)}</div><h4>ช่วงเวลาของคำทำนาย</h4><div className="periods">{['วันนี้','7 วัน','30 วัน'].map(x=><button className={period===x?'active':''} aria-pressed={period===x} key={x} onClick={()=>R(x)}>{x}</button>)}</div><div className="actions"><button className="outline" onClick={()=>S(0)}>← ย้อนกลับ</button><button className="gold" onClick={start}>เข้าสู่สำรับไพ่ ↗</button></div></div>}
{step===2&&<div className="panel"><p className="intro">สับไพ่ 78 ใบแล้ว แตะไพ่ทีละใบเพื่อเปิดไพ่ 3 ตำแหน่ง</p><div className="deck">{deck.map((id,i)=><button className={'card '+((flips & (1 << i)) !== 0?'flipped':'')} key={i} aria-label={'เปิดไพ่ใบที่ '+(i+1)} aria-pressed={!!(flips & (1 << i))} onClick={()=>F(value=>value | (1 << i))}>{(flips & (1 << i)) !== 0?<div className="front"><small>✦ {i+1} ✦</small><strong>{cards[id].icon}</strong><b>{cards[id].name}</b></div>:<div className="back"><strong>✺</strong><small>๙ ดาว</small></div>}</button>)}</div><div className="labels"><span>สถานการณ์</span><span>สิ่งที่ควรใส่ใจ</span><span>แนวโน้ม</span></div><p className="count">เปิดแล้ว {[0,1,2].filter(i=>flips & (1 << i)).length} / 3 ใบ</p><div className="actions"><button className="outline" onClick={()=>S(1)}>← ย้อนกลับ</button><button className="gold" disabled={flips!==7} onClick={()=>S(3)}>อ่านคำทำนาย ↗</button></div></div>}
{step===3&&<div className="panel result"><div className="resulthead"><div className="eyebrow">✧ YOUR COSMIC READING ✧</div><h3>{topic} · {period}</h3><p>{today} · จังหวัดเกิด {province}</p></div><div className="cosmos"><div><small>☉ อาทิตย์กำเนิด</small><b>{bs===null?'—':symbols[bs]+' '+signs[bs]}</b></div><div><small>☼ อาทิตย์จร</small><b>{ss===null?'—':symbols[ss]+' '+signs[ss]}</b></div><div><small>☽ จันทร์จร</small><b>{ms===null?'—':symbols[ms]+' '+signs[ms]}</b></div></div><h3>ไพ่ทั้งสามที่คุณเปิดได้</h3><div className="results">{deck.map((id,i)=><div key={i}><div className="mini">{cards[id].icon}</div><b>{cards[id].name}</b><small>{['สถานการณ์','สิ่งที่ควรใส่ใจ','แนวโน้ม'][i]}</small><p>{cards[id].meaning}</p></div>)}</div><div className="guidance"><div className="eyebrow">YOUR GUIDANCE</div><h3>สารจากดวงดาวและไพ่</h3><p>สำหรับ<b>{topic}</b>ในช่วง<b>{period}</b> ไพ่ใบแรกชวนพิจารณา “{cards[deck[0]].meaning}” ไพ่ใบที่สองสะท้อน “{cards[deck[1]].meaning}” และไพ่ใบสุดท้ายแนะนำให้มองเรื่อง “{cards[deck[2]].meaning}”</p><p>เมื่อพิจารณาร่วมกับราศีอาทิตย์กำเนิด<b>{bs===null?'':signs[bs]}</b> และอาทิตย์จรในราศี<b>{ss===null?'':signs[ss]}</b> คุณอาจใช้ช่วงนี้เพื่อตรวจสอบข้อเท็จจริง ฟังเสียงของตัวเอง และเลือกลงมือทำสิ่งที่อยู่ในความควบคุม</p><blockquote>✦ ไพ่ไม่ได้กำหนดชะตา การตัดสินใจของคุณยังสำคัญที่สุด</blockquote></div><p className="note">เพื่อความบันเทิงและสะท้อนคิด ไม่ใช่คำทำนายที่พิสูจน์ได้ทางวิทยาศาสตร์ ตำแหน่งดาวเป็นสูตรประมาณ ไม่ใช่ผังสุริยยาตร์ฉบับสมบูรณ์ และไม่ใช่คำแนะนำด้านสุขภาพหรือการเงิน</p><div className="actions"><button className="outline" onClick={()=>{S(0);D([]);F(0);C(false)}}>↻ ดูดวงใหม่</button><button className="gold" onClick={share}>{copied?'คัดลอกลิงก์แล้ว ✓':'แชร์ให้เพื่อน ↗'}</button></div></div>}</section>
<section className="method"><div className="eyebrow">THE RITUAL</div><h2>เมื่อดวงดาวพบกับไพ่</h2><div className="features"><div><span>01</span><h3>พื้นดวง</h3><p>ราศีอาทิตย์จากวันเกิดของคุณ</p></div><div><span>02</span><h3>ดาวปัจจุบัน</h3><p>อาทิตย์และจันทร์จรตามวันจริงแบบประมาณ</p></div><div><span>03</span><h3>ไพ่ทาโรต์</h3><p>เปิดไพ่ 3 ใบจากสำรับครบ 78 ใบ</p></div></div></section><footer><div className="logo">✺ ดวงชะตา ๙ ดาว</div><p>อ่านดวงอย่างมีสติ ใช้ชีวิตด้วยการตัดสินใจของคุณเอง</p></footer></main>
}