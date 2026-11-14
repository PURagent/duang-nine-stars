import { useId } from 'react';
import './fortune-reading.css';

type CardReading = {
  id: number;
  name: string;
  icon: string;
  position: string;
  paragraph: string;
  opportunity: string;
  caution: string;
  advice: string;
};

export type FortuneInterpretation = {
  topic: string;
  periodLabel: string;
  periodRange: string;
  heading: string;
  greeting: string;
  overview: string[];
  cardReadings: CardReading[];
  opportunities: { title: string; text: string }[];
  cautions: { title: string; text: string }[];
  nextSteps: string[];
  astroParagraphs: string[];
  closing: string;
  disclosure: string;
};

export default function FortuneReading({ interpretation }: { interpretation: FortuneInterpretation }) {
  const id = useId();
  const reading = interpretation;

  return <section className="fortune-reading" aria-labelledby={`${id}-heading`}>
    <header className="fortune-introduction">
      <p className="fortune-kicker">คำอ่านอัตโนมัติ · สไตล์แม่หมอ</p>
      <h3 id={`${id}-heading`}>{reading.heading}</h3>
      <p className="fortune-context">เรื่อง{reading.topic} · {reading.periodLabel}<span>{reading.periodRange}</span></p>
      <p className="fortune-greeting">{reading.greeting}</p>
      {reading.overview.map((paragraph, index) => <p key={index}>{paragraph}</p>)}
    </header>

    <section className="fortune-card-section" aria-labelledby={`${id}-cards`}>
      <h4 id={`${id}-cards`}>ไพ่ทั้งสามกำลังบอกอะไรคุณ</h4>
      <div className="fortune-cards">
        {reading.cardReadings.map((card, index) => <article className="fortune-card-reading" key={card.id} aria-labelledby={`${id}-card-${index}`}>
          <div className="fortune-card-symbol" aria-hidden="true">{card.icon}</div>
          <div className="fortune-card-body">
            <p className="fortune-card-position">ใบที่ {index + 1} · {card.position}</p>
            <h5 id={`${id}-card-${index}`}>{card.name}</h5>
            <p>{card.paragraph}</p>
            <details className="fortune-card-details">
              <summary>ดูโอกาสและคำแนะนำจากไพ่{card.name}</summary>
              <dl>
                <div><dt>โอกาส</dt><dd>{card.opportunity}</dd></div>
                <div><dt>ข้อควรระวัง</dt><dd>{card.caution}</dd></div>
                <div><dt>คำแนะนำ</dt><dd>{card.advice}</dd></div>
              </dl>
            </details>
          </div>
        </article>)}
      </div>
    </section>

    <div className="fortune-balance">
      <section className="fortune-opportunities" aria-labelledby={`${id}-opportunities`}>
        <h4 id={`${id}-opportunities`}>เรื่องดีที่อยากให้คุณมองเห็น</h4>
        <ul>{reading.opportunities.map((item, index) => <li key={index}><strong>{item.title}</strong><p>{item.text}</p></li>)}</ul>
      </section>
      <section className="fortune-cautions" aria-labelledby={`${id}-cautions`}>
        <h4 id={`${id}-cautions`}>เรื่องที่ค่อย ๆ ระวังไว้</h4>
        <ul>{reading.cautions.map((item, index) => <li key={index}><strong>{item.title}</strong><p>{item.text}</p></li>)}</ul>
      </section>
    </div>

    <section className="fortune-next-steps" aria-labelledby={`${id}-steps`}>
      <h4 id={`${id}-steps`}>ลองเริ่มจากสิ่งเล็ก ๆ เหล่านี้นะคะ</h4>
      <ol>{reading.nextSteps.map((step, index) => <li key={index}>{step}</li>)}</ol>
    </section>

    <section className="fortune-astro-note" aria-labelledby={`${id}-astro`}>
      <h4 id={`${id}-astro`}>มุมมองจากดาว · การตีความเชิงสัญลักษณ์</h4>
      {reading.astroParagraphs.map((paragraph, index) => <p key={index}>{paragraph}</p>)}
    </section>

    <blockquote className="fortune-closing"><p>{reading.closing}</p></blockquote>
    <p className="fortune-disclosure" role="note">{reading.disclosure}</p>
  </section>;
}
