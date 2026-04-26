import { useContext } from 'react';
import { TweaksCtx } from '../context';
import { T, getAccentTokens } from '../tokens';
import { Wrap } from './shared';
import { useMedia } from '../hooks/useMedia';

const ADVISORS = [
  { label: 'CPA / tax advisor', note: 'Shared tax workspace' },
  { label: 'Wealth manager',    note: 'Portfolio read access' },
  { label: 'Estate attorney',   note: 'Entity & trust docs' },
  { label: 'You',               note: 'Full control, always' },
];

export default function Advisors() {
  const { accent } = useContext(TweaksCtx);
  const A = getAccentTokens(accent);
  const isMobile = useMedia('(max-width: 767px)');

  return (
    <section style={{ padding: isMobile ? '72px 0' : '128px 0', borderTop: `1px solid ${T.border0}` }}>
      <Wrap>
        <div style={{
          display: 'grid',
          gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr',
          gap: isMobile ? 48 : 88,
          alignItems: 'center',
        }}>
          {/* Diagram */}
          <div style={{ background: T.bg2, border: `1px solid ${T.border1}`, borderRadius: 16, padding: isMobile ? '32px 24px' : '40px 36px' }}>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginBottom: 28 }}>
              <div style={{
                background: A.base, borderRadius: 10, padding: '14px 28px', textAlign: 'center',
                boxShadow: 'rgba(255,255,255,0.1) 0 0.5px 0 0 inset, rgba(0,0,0,0.3) 0 0 0 0.5px inset',
              }}>
                <div style={{ fontFamily: T.sans, fontSize: 13, fontWeight: 500, color: T.fg0 }}>CFO Black</div>
                <div style={{ fontFamily: T.sans, fontSize: 11, color: A.text, marginTop: 3 }}>Your unified command center</div>
              </div>
              <div style={{ width: 1, height: 20, background: T.border1 }} />
              <div style={{ width: '80%', height: 1, background: T.border1 }} />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
              {ADVISORS.map((a, i) => (
                <div key={i} style={{
                  background: T.bg1, border: `1px solid ${T.border0}`,
                  borderTop: `1px solid ${T.border1}`, borderRadius: 8, padding: '14px 14px',
                }}>
                  <div style={{ fontFamily: T.sans, fontSize: 12, color: T.fg0, marginBottom: 4, fontWeight: 500 }}>{a.label}</div>
                  <div style={{ fontFamily: T.sans, fontSize: 11, color: T.fg2 }}>{a.note}</div>
                </div>
              ))}
            </div>
          </div>

          <div>
            <div style={{ fontFamily: T.sans, fontSize: 11, color: T.fg2, letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 18 }}>
              Advisor layer
            </div>
            <h2 style={{
              fontFamily: T.serif, fontSize: 'clamp(28px,3.5vw,48px)', fontWeight: 600,
              lineHeight: 1.05, letterSpacing: '-1.2px', color: T.fg0, marginBottom: 22,
            }}>
              Works with your advisors.<br />
              <em style={{ fontStyle: 'italic', fontWeight: 400 }}>Not around them.</em>
            </h2>
            <p style={{ fontFamily: T.sans, fontSize: 16, lineHeight: 1.75, color: T.fg1, fontWeight: 300, marginBottom: 18 }}>
              You already have a CPA, a wealth manager, maybe an estate attorney. CFO Black is the connective layer between them and you — with granular permissions, a shared workspace, and document management.
            </p>
            <p style={{ fontFamily: T.sans, fontSize: 16, lineHeight: 1.75, color: T.fg1, fontWeight: 300 }}>
              We replace the coordination friction. Not the professionals.
            </p>
          </div>
        </div>
      </Wrap>
    </section>
  );
}
