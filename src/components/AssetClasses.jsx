import { useContext, useState } from 'react';
import { TweaksCtx } from '../context';
import { T, getAccentTokens } from '../tokens';
import { Wrap } from './shared';

const CLASSES = [
  'Public equity & options',
  'Private equity with capital calls & K-1s',
  'Real estate portfolios',
  'Crypto & DeFi positions',
  'SAFE notes & convertibles',
  'Carried interest',
  'Multi-jurisdiction trusts',
  'Operating companies & holdcos',
  'Art & collectibles',
  'Intellectual property',
  'Private credit',
  'Hedge fund allocations',
  '401k, IRA, pension',
  'Cross-border holdings',
  'Debt & liabilities',
];

export default function AssetClasses() {
  const { accent } = useContext(TweaksCtx);
  const A = getAccentTokens(accent);
  const [hov, setHov] = useState(null);

  return (
    <section style={{ padding: '128px 0', background: T.bg1, borderTop: `1px solid ${T.border0}` }}>
      <Wrap>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 80, alignItems: 'start' }}>
          <div>
            <div style={{ fontFamily: T.sans, fontSize: 11, color: T.fg2, letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 18 }}>
              Built for complexity
            </div>
            <h2 style={{
              fontFamily: T.serif, fontSize: 'clamp(28px,3.5vw,50px)', fontWeight: 600,
              lineHeight: 1.05, letterSpacing: '-1.2px', color: T.fg0, marginBottom: 22,
            }}>
              Wealth that doesn't fit in a template.
            </h2>
            <p style={{ fontFamily: T.sans, fontSize: 16, lineHeight: 1.75, color: T.fg1, fontWeight: 300 }}>
              Most tools list "private equity" as a single line item. We model the actual structure: LP interests, capital calls, distributions, carried interest, and K-1 pass-throughs — across all your entities.
            </p>
            <p style={{ fontFamily: T.sans, fontSize: 16, lineHeight: 1.75, color: T.fg1, fontWeight: 300, marginTop: 16 }}>
              If your wealth has structure, we understand the structure.
            </p>
          </div>

          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, alignContent: 'flex-start' }}>
            {CLASSES.map((c, i) => (
              <span
                key={c}
                onMouseEnter={() => setHov(i)}
                onMouseLeave={() => setHov(null)}
                style={{
                  fontFamily: T.sans, fontSize: 12, padding: '6px 13px', borderRadius: 6, cursor: 'default',
                  background: hov === i ? A.pale : 'rgba(240,237,228,0.04)',
                  border: `1px solid ${hov === i ? A.bright + '44' : T.border1}`,
                  color: hov === i ? T.fg0 : T.fg1,
                  transition: 'all 150ms',
                }}
              >
                {c}
              </span>
            ))}
          </div>
        </div>
      </Wrap>
    </section>
  );
}
