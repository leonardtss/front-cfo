import { T } from '../tokens';
import { Wrap } from './shared';
import { useMedia } from '../hooks/useMedia';

const PILLARS = [
  {
    n: '01',
    title: 'See everything,\nin true context.',
    body: "Full aggregation across entities, trusts, alternatives, cross-border positions, and private holdings. Handles the structures that consumer-grade tools can't model — multi-jurisdiction, multi-entity, multi-asset.",
  },
  {
    n: '02',
    title: 'Understand\nwhat it means.',
    body: 'AI configured to your specific situation: your entities, your tax exposure, your liquidity windows, your goals. Not generic insights dressed as intelligence. Contextual analysis that evolves as your situation does.',
  },
  {
    n: '03',
    title: 'Decide\nwith confidence.',
    body: 'Proactive surfacing of decisions that matter: liquidity gaps, tax optimization windows, concentration risk, upcoming capital calls. Plus a natural-language layer — ask anything, any time.',
  },
];

export default function Pillars() {
  const isMobile = useMedia('(max-width: 767px)');

  return (
    <section
      id="what-we-handle"
      style={{
        padding: isMobile ? '72px 0' : '128px 0',
        background: T.bg1,
        borderTop: `1px solid ${T.border0}`,
        borderBottom: `1px solid ${T.border0}`,
      }}
    >
      <Wrap>
        <div style={{
          display: 'grid',
          gridTemplateColumns: isMobile ? '1fr' : 'repeat(3,1fr)',
          gap: 0,
        }}>
          {PILLARS.map((p, i) => (
            <div
              key={i}
              style={{
                borderRight: !isMobile && i < 2 ? `1px solid ${T.border1}` : 'none',
                borderBottom: isMobile && i < 2 ? `1px solid ${T.border1}` : 'none',
                paddingRight: !isMobile && i < 2 ? 48 : 0,
                paddingLeft: !isMobile && i > 0 ? 48 : 0,
                paddingBottom: isMobile && i < 2 ? 40 : 0,
                paddingTop: isMobile && i > 0 ? 40 : 0,
              }}
            >
              <div style={{ fontFamily: T.mono, fontSize: 11, color: T.fg2, letterSpacing: '0.12em', marginBottom: 22 }}>
                {p.n}
              </div>
              <h3 style={{
                fontFamily: T.serif, fontSize: 'clamp(26px,2.5vw,36px)', fontWeight: 600,
                lineHeight: 1.1, letterSpacing: '-0.8px', color: T.fg0,
                marginBottom: 18, whiteSpace: 'pre-line',
              }}>
                {p.title}
              </h3>
              <p style={{ fontFamily: T.sans, fontSize: 15, lineHeight: 1.7, color: T.fg1, fontWeight: 300 }}>
                {p.body}
              </p>
            </div>
          ))}
        </div>
      </Wrap>
    </section>
  );
}
