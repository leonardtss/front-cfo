import { useContext } from 'react';
import { TweaksCtx } from '../context';
import { T, getAccentTokens } from '../tokens';
import { Wrap } from './shared';

const FOR = [
  "You have multiple entities — LLCs, trusts, holdcos — and no single tool sees all of them",
  "You pay significant fees to advisors but feel like you're still the one reconciling everything",
  "You have illiquid positions, upcoming capital calls, or cross-border exposure that breaks every consumer tool",
  "You want private-banking-level intelligence without the condescension, the fees, or the product-pushing",
];

const NOT_FOR = [
  "You have a single brokerage account and a Roth IRA",
  "You're looking for a free budgeting or spending tracker",
  "You want someone to manage your money, not help you understand it",
];

export default function WhoItsFor() {
  const { accent } = useContext(TweaksCtx);
  const A = getAccentTokens(accent);

  return (
    <section style={{ padding: '128px 0' }}>
      <Wrap>
        <div style={{ textAlign: 'center', marginBottom: 56 }}>
          <h2 style={{
            fontFamily: T.serif, fontSize: 'clamp(28px,3.5vw,48px)', fontWeight: 600,
            lineHeight: 1.05, letterSpacing: '-1.2px', color: T.fg0,
          }}>
            Who it's for.
          </h2>
        </div>

        <div style={{
          display: 'grid', gridTemplateColumns: '1fr 1fr',
          gap: 1, background: T.border0, borderRadius: 12, overflow: 'hidden',
          maxWidth: 920, margin: '0 auto',
        }}>
          <div style={{ background: T.bg0, padding: '44px 40px' }}>
            <div style={{ fontFamily: T.sans, fontSize: 11, color: A.text, letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 22 }}>
              Built for you if…
            </div>
            {FOR.map((b, i) => (
              <div key={i} style={{ display: 'flex', gap: 13, marginBottom: 18, alignItems: 'flex-start' }}>
                <div style={{ width: 6, height: 6, borderRadius: '50%', background: A.bright, marginTop: 7, flexShrink: 0 }} />
                <p style={{ fontFamily: T.sans, fontSize: 14, color: T.fg1, lineHeight: 1.65, fontWeight: 300 }}>{b}</p>
              </div>
            ))}
          </div>

          <div style={{ background: T.bg1, padding: '44px 40px' }}>
            <div style={{ fontFamily: T.sans, fontSize: 11, color: T.fg2, letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 22 }}>
              Probably not for you if…
            </div>
            {NOT_FOR.map((b, i) => (
              <div key={i} style={{ display: 'flex', gap: 13, marginBottom: 18, alignItems: 'flex-start' }}>
                <div style={{ width: 6, height: 6, borderRadius: '50%', background: T.border2, marginTop: 7, flexShrink: 0 }} />
                <p style={{ fontFamily: T.sans, fontSize: 14, color: T.fg2, lineHeight: 1.65, fontWeight: 300 }}>{b}</p>
              </div>
            ))}
          </div>
        </div>
      </Wrap>
    </section>
  );
}
