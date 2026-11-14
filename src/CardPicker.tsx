import { useId } from 'react';
import './card-picker.css';

export type CardPickerProps = {
  cardCount: number;
  selectedPositions: number[];
  onToggle: (position: number) => void;
  onShuffle: () => void;
  onConfirm: () => void;
  onBack: () => void;
};

const slots = ['สถานการณ์', 'สิ่งที่ควรใส่ใจ', 'แนวโน้ม'];

export default function CardPicker({ cardCount, selectedPositions, onToggle, onShuffle, onConfirm, onBack }: CardPickerProps) {
  const id = useId();
  const complete = selectedPositions.length === slots.length;
  const instruction = complete
    ? 'เลือกครบแล้ว · พร้อมเปิดไพ่ที่คุณเลือก'
    : `เลือกใบที่ ${selectedPositions.length + 1} · ${slots[selectedPositions.length]}`;

  return <div className="panel card-picker">
    <div className="card-picker-intro">
      <p className="card-picker-kicker">ช่วงเวลาที่คุณเป็นผู้เลือก</p>
      <h3 id={`${id}-heading`}>เลือกไพ่ด้วยตัวคุณเอง</h3>
      <p>สับสำรับ 78 ใบ แล้ววางไพ่คว่ำ 12 ใบให้คุณเลือก</p>
      <p id={`${id}-help`}>แตะเลือก 3 ใบตามลำดับ แตะซ้ำเพื่อเปลี่ยนใจก่อนเปิด</p>
    </div>

    <div className="card-picker-status" role="status" aria-live="polite" aria-atomic="true">
      <span className="card-picker-count picker-count">เลือกแล้ว {selectedPositions.length} / 3 ใบ</span>
      <strong>{instruction}</strong>
    </div>

    <div className="card-picker-board picker-grid" role="group" aria-labelledby={`${id}-heading`} aria-describedby={`${id}-help`}>
      {Array.from({ length: cardCount }, (_, position) => {
        const selectedIndex = selectedPositions.indexOf(position);
        const selected = selectedIndex !== -1;
        return <button
          key={position}
          type="button"
          className={`card-picker-card${selected ? ' is-selected' : ''}`}
          aria-label={`ไพ่คว่ำใบที่ ${position + 1}`}
          aria-pressed={selected}
          aria-describedby={selected ? `${id}-selection-${position}` : undefined}
          disabled={complete && !selected}
          onClick={() => onToggle(position)}
        >
          <span className="card-picker-ornament" aria-hidden="true">✺</span>
          <span className="card-picker-brand" aria-hidden="true">๙ ดาว</span>
          <span className="card-picker-position" aria-hidden="true">{position + 1}</span>
          {selected && <>
            <span className="card-picker-rank" aria-hidden="true">{selectedIndex + 1}</span>
            <span className="card-picker-sr" id={`${id}-selection-${position}`}>เลือกเป็นใบที่ {selectedIndex + 1} · {slots[selectedIndex]} · แตะซ้ำเพื่อยกเลิก</span>
          </>}
        </button>;
      })}
    </div>

    <ol className="card-picker-slots" aria-label="ลำดับไพ่ที่เลือก">
      {slots.map((slot, index) => <li key={slot} className={selectedPositions[index] === undefined ? '' : 'is-filled'}>
        <span className="card-picker-slot-number" aria-hidden="true">{index + 1}</span>
        <div><strong>{slot}</strong><span>{selectedPositions[index] === undefined ? 'รอคุณเลือก' : `ตำแหน่งที่ ${selectedPositions[index] + 1}`}</span></div>
      </li>)}
    </ol>

    <p className="card-picker-reshuffle-note" id={`${id}-reshuffle`}>อยากเริ่มเลือกใหม่ไหม? สับใหม่จะล้างไพ่ที่เลือกทั้งหมด</p>
    <div className="card-picker-actions">
      <button type="button" className="card-picker-secondary" onClick={onBack}>← ย้อนกลับ</button>
      <button type="button" className="card-picker-secondary" onClick={onShuffle} aria-describedby={`${id}-reshuffle`}>สับไพ่ใหม่</button>
      <button type="button" className="card-picker-confirm" onClick={onConfirm} disabled={!complete}>เปิดไพ่ที่เลือก</button>
    </div>
  </div>;
}
