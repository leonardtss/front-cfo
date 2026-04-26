import { useContext } from 'react';
import { TweaksCtx } from '../context';
import { T, getAccentTokens } from '../tokens';
import { Wrap } from './shared';
import { useMedia } from '../hooks/useMedia';

const MESSAGES = [
  { role: 'user', text: "If I sell my Acme shares this quarter, what's my tax hit across all entities?" },
  { role: 'ai',   text: 'Based on your Henderson Trust holding 40% of the position and your current AMT exposure in Q4, a full sale this quarter would trigger ~$186k in federal liability. Deferring to January saves approximately $31k. Want me to model the partial-sale scenario?' },
  { role: 'user', text: 'Yes — model selling 30% now and the rest in January.' },
  { role: 'ai',   text: "Partial sale of 30% now: $55k tax. Remaining 70% in January: ~$112k estimated — total ~$167k vs $186k today. Saves $19k. I'd flag this to your CPA before end of November to ensure the January lot qualifies for long-term treatment in the trust." },
];

export default function AISection() {
  const { accent } = useContext(TweaksCtx);
  const A = getAccentTokens(accent);
  const isMobile = useMedia('(max-width: 767px)');

  return (
    <section style={{ padding: isMobile ? '72px 0' : '140px 0' }}>
      <Wrap>
        <div style={{
          display: 'grid',
          gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr',
          gap: isMobile ? 48 : 88,
          alignItems: 'center',
        }}>
          <div>
            <div style={{ fontFamily: T.sans, fontSize: 11, color: T.fg2, letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 18 }}>
              AI co-pilot
            </div>
            <h2 style={{
              fontFamily: T.serif, fontSize: 'clamp(30px,3.5vw,50px)', fontWeight: 600,
              lineHeight: 1.05, letterSpacing: '-1.2px', color: T.fg0, marginBottom: 22,
            }}>
              Generic tools give<br />
              <em style={{ fontStyle: 'italic', fontWeight: 400 }}>generic answers.</em>
            </h2>
            <p style={{ fontFamily: T.sans, fontSize: 16, lineHeight: 1.75, color: T.fg1, fontWeight: 300, marginBottom: 18 }}>
              Our AI is configured to your structure, your entities, your tax situation, and your goals. It doesn't look up an answer. It reasons about your specific situation.
            </p>
            <p style={{ fontFamily: T.sans, fontSize: 16, lineHeight: 1.75, color: T.fg1, fontWeight: 300 }}>
              Ask it anything. It already knows you have a Henderson Trust, that you're AMT-exposed in Q4, and that three capital calls are coming. It gets smarter as your situation evolves.
            </p>
          </div>

          {/* AI chat mock */}
          <div style={{
            background: T.bg2, border: `1px solid ${T.border1}`,
            borderRadius: 16, overflow: 'hidden', boxShadow: '0 32px 80px rgba(0,0,0,0.55)',
          }}>
            <div style={{
              background: T.bg1, borderBottom: `1px solid ${T.border0}`,
              padding: '13px 18px', display: 'flex', alignItems: 'center', gap: 8,
            }}>
              <div style={{ width: 7, height: 7, borderRadius: '50%', background: A.bright, animation: 'pulse 2s ease-in-out infinite' }} />
              <span style={{ fontFamily: T.sans, fontSize: 12, color: T.fg1 }}>AI co-pilot — your structure loaded</span>
            </div>

            <div style={{ padding: '20px 18px', display: 'flex', flexDirection: 'column', gap: 14 }}>
              {MESSAGES.map((m, i) => (
                <div key={i} style={{ display: 'flex', flexDirection: 'column', gap: 4, alignItems: m.role === 'user' ? 'flex-end' : 'flex-start' }}>
                  <div style={{ fontFamily: T.sans, fontSize: 10, color: T.fg2, letterSpacing: '0.05em', textTransform: 'uppercase' }}>
                    {m.role === 'user' ? 'You' : 'CFO Black AI'}
                  </div>
                  <div style={{
                    fontFamily: T.sans, fontSize: 13, lineHeight: 1.6,
                    padding: '11px 14px', borderRadius: 10, maxWidth: '90%',
                    background: m.role === 'user' ? 'rgba(240,237,228,0.06)' : A.pale,
                    border: m.role === 'user' ? `1px solid ${T.border1}` : `1px solid ${A.bright}28`,
                    color: T.fg0,
                  }}>
                    {m.text}
                  </div>
                </div>
              ))}
            </div>

            <div style={{ borderTop: `1px solid ${T.border0}`, padding: '11px 14px', display: 'flex', gap: 8 }}>
              <div style={{
                flex: 1, background: T.bg1, border: `1px solid ${T.border1}`,
                borderRadius: 8, padding: '9px 14px',
                fontFamily: T.sans, fontSize: 12, color: T.fg2,
              }}>
                Ask anything about your wealth…
              </div>
            </div>
          </div>
        </div>
      </Wrap>
    </section>
  );
}
