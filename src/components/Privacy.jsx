import { useContext } from 'react';
import { TweaksCtx } from '../context';
import { T, getAccentTokens } from '../tokens';
import { Wrap } from './shared';
import { useMedia } from '../hooks/useMedia';

const POINTS = [
  {
    label: 'We sell software',
    body: 'Not financial products, not data, not ads. Our only incentive is your continued subscription.',
  },
  {
    label: 'Bank-grade security',
    body: 'SOC 2 Type II, end-to-end encryption, read-only data connections. Your data is never shared, never sold.',
  },
  {
    label: 'No upsell. Ever.',
    body: 'We have no managed account offering, no affiliate relationships. Zero product-pushing. Full stop.',
  },
];

export default function Privacy() {
  const { accent } = useContext(TweaksCtx);
  const A = getAccentTokens(accent);
  const isMobile = useMedia('(max-width: 767px)');

  return (
    <section
      id="privacy"
      style={{
        padding: isMobile ? '72px 0' : '128px 0',
        background: T.bg1,
        borderTop: `1px solid ${T.border0}`,
        borderBottom: `1px solid ${T.border0}`,
      }}
    >
      <Wrap>
        <div style={{ maxWidth: 660, marginBottom: 48 }}>
          <div style={{ fontFamily: T.sans, fontSize: 11, color: T.fg2, letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 18 }}>
            Privacy & alignment
          </div>
          <h2 style={{
            fontFamily: T.serif, fontSize: 'clamp(28px,3.5vw,48px)', fontWeight: 600,
            lineHeight: 1.05, letterSpacing: '-1.2px', color: T.fg0,
          }}>
            Our incentives are aligned<br />with yours. Full stop.
          </h2>
        </div>

        <div style={{
          display: 'grid',
          gridTemplateColumns: isMobile ? '1fr' : 'repeat(3,1fr)',
          gap: 1, background: T.border0, borderRadius: 12, overflow: 'hidden',
        }}>
          {POINTS.map((p, i) => (
            <div key={i} style={{ background: T.bg1, padding: isMobile ? '28px 24px' : '36px 30px' }}>
              <div style={{
                width: 32, height: 32, borderRadius: 8,
                background: A.pale, border: `1px solid ${A.bright}33`,
                display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 18,
              }}>
                <div style={{ width: 8, height: 8, borderRadius: 2, background: A.bright }} />
              </div>
              <div style={{ fontFamily: T.sans, fontSize: 15, fontWeight: 500, color: T.fg0, marginBottom: 10 }}>
                {p.label}
              </div>
              <p style={{ fontFamily: T.sans, fontSize: 14, color: T.fg1, lineHeight: 1.65, fontWeight: 300 }}>
                {p.body}
              </p>
            </div>
          ))}
        </div>
      </Wrap>
    </section>
  );
}
