import { T } from '../tokens';
import { Wrap } from './shared';

const PAINS = [
  {
    q: '"I have Kubera. It shows me totals."',
    a: "It doesn't tell you what to do about them. Or flag what's about to become a problem.",
  },
  {
    q: '"My CPA sees my picture once a year."',
    a: "Your wealth manager sees part of the portfolio. Nobody sees the whole thing — except you. And you don't have the time.",
  },
  {
    q: '"I\'m making six-figure decisions on spreadsheets."',
    a: "Built on the weekend. Maintained by nobody. Understood by none of the tools your advisors use.",
  },
  {
    q: '"I pay a lot for advisors. I\'m still the one reconciling."',
    a: "The coordination layer doesn't exist yet. You're it. Until now.",
  },
];

export default function Problem() {
  return (
    <section id="how-it-works" style={{ padding: '128px 0' }}>
      <Wrap>
        <div style={{ maxWidth: 700, marginBottom: 64 }}>
          <div style={{ fontFamily: T.sans, fontSize: 11, color: T.fg2, letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 18 }}>
            The problem
          </div>
          <h2 style={{
            fontFamily: T.serif, fontSize: 'clamp(32px,4vw,54px)', fontWeight: 600,
            lineHeight: 1.05, letterSpacing: '-1.5px', color: T.fg0, marginBottom: 22,
          }}>
            Most wealth tools were built for people who{' '}
            <em style={{ fontStyle: 'italic', fontWeight: 400 }}>have</em> wealth.<br />
            Not for people who have structures.
          </h2>
          <p style={{ fontFamily: T.sans, fontSize: 17, lineHeight: 1.7, color: T.fg1, fontWeight: 300 }}>
            There's a ceiling. You hit it when your net worth stopped fitting neatly into categories — when your entities multiplied, when your advisors started asking you to reconcile their inputs.
          </p>
        </div>

        <div style={{
          display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)',
          gap: 1, background: T.border0, borderRadius: 12, overflow: 'hidden',
        }}>
          {PAINS.map((p, i) => (
            <div
              key={i}
              style={{
                background: T.bg0, padding: '36px 32px',
                borderBottom: i < 2 ? `1px solid ${T.border0}` : 'none',
              }}
            >
              <div style={{ fontFamily: T.serif, fontSize: 19, fontStyle: 'italic', color: T.fg0, lineHeight: 1.4, marginBottom: 14 }}>
                {p.q}
              </div>
              <p style={{ fontFamily: T.sans, fontSize: 14, color: T.fg1, lineHeight: 1.65, fontWeight: 300 }}>{p.a}</p>
            </div>
          ))}
        </div>
      </Wrap>
    </section>
  );
}
