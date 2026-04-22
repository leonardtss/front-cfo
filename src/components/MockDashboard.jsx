import { useContext, useEffect, useState } from 'react';
import { TweaksCtx } from '../context';
import { T, getAccentTokens } from '../tokens';

export default function MockDashboard() {
  const { accent } = useContext(TweaksCtx);
  const A = getAccentTokens(accent);
  const [animated, setAnimated] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setAnimated(true), 600);
    return () => clearTimeout(t);
  }, []);

  const bars = [
    { label: 'Public equity',   val: 42, color: A.bright },
    { label: 'Private equity',  val: 28, color: T.gold },
    { label: 'Real estate',     val: 18, color: A.text },
    { label: 'Alternatives',    val: 12, color: T.fg2 },
  ];

  const sidebarItems = [
    { label: 'Overview',       active: true },
    { label: 'Net Worth' },
    { label: 'Entities' },
    { label: 'Private equity' },
    { label: 'Real estate' },
    { label: 'Tax & estimates' },
    { label: 'AI co-pilot',    special: true },
  ];

  return (
    <div style={{ marginTop: 80, position: 'relative' }}>
      <div style={{
        background: T.bg2, border: `1px solid ${T.border1}`, borderRadius: 16,
        overflow: 'hidden', maxWidth: 900, margin: '0 auto',
        boxShadow: '0 48px 120px rgba(0,0,0,0.72)',
      }}>
        {/* Window chrome */}
        <div style={{
          background: T.bg1, borderBottom: `1px solid ${T.border0}`,
          padding: '11px 18px', display: 'flex', alignItems: 'center', gap: 7,
        }}>
          {[T.fg3, T.fg3, T.fg3].map((c, i) => (
            <div key={i} style={{ width: 10, height: 10, borderRadius: '50%', background: c }} />
          ))}
          <div style={{
            flex: 1, background: 'rgba(240,237,228,0.04)', borderRadius: 4, height: 22,
            margin: '0 16px', display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <span style={{ fontFamily: T.mono, fontSize: 11, color: T.fg2 }}>
              app.cfoblack.com / overview
            </span>
          </div>
        </div>

        {/* Layout */}
        <div style={{ display: 'grid', gridTemplateColumns: '190px 1fr', minHeight: 360 }}>
          {/* Sidebar */}
          <div style={{ background: T.bg1, borderRight: `1px solid ${T.border0}`, padding: '20px 0' }}>
            <div style={{ padding: '0 14px', marginBottom: 20 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
                <svg width="10" height="15" viewBox="0 0 10 15" fill="none">
                  <rect x="0" y="0" width="2" height="15" rx="1" fill={A.bright} />
                  <rect x="0" y="0" width="6" height="2" rx="1" fill={A.bright} />
                  <rect x="0" y="13" width="6" height="2" rx="1" fill={A.bright} />
                </svg>
                <span style={{ fontFamily: T.sans, fontSize: 11, fontWeight: 500, color: T.fg0 }}>CFO Black</span>
              </div>
            </div>
            {sidebarItems.map(item => (
              <div
                key={item.label}
                style={{
                  padding: '7px 14px', fontSize: 11, fontFamily: T.sans,
                  color: item.active ? T.fg0 : item.special ? T.goldLight : T.fg2,
                  background: item.active ? 'rgba(240,237,228,0.05)' : 'transparent',
                  borderLeft: item.active ? `2px solid ${A.bright}` : '2px solid transparent',
                  cursor: 'pointer',
                }}
              >
                {item.label}
              </div>
            ))}
          </div>

          {/* Main panel */}
          <div style={{ padding: '24px 28px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 22 }}>
              <div>
                <div style={{
                  fontFamily: T.sans, fontSize: 10, color: T.fg2,
                  letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 4,
                }}>
                  Total net worth · all entities
                </div>
                <div style={{
                  fontFamily: T.mono, fontSize: 34, fontWeight: 500, color: T.fg0,
                  letterSpacing: '-1.5px', transition: 'opacity 600ms', opacity: animated ? 1 : 0,
                }}>
                  $18,420,000
                </div>
                <div style={{ fontFamily: T.sans, fontSize: 11, color: A.text, marginTop: 4 }}>
                  +$420k this quarter
                </div>
              </div>
              <div style={{
                background: A.pale, border: `1px solid ${A.bright}22`,
                borderRadius: 8, padding: '10px 16px', textAlign: 'right',
              }}>
                <div style={{ fontFamily: T.sans, fontSize: 10, color: T.fg2, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 3 }}>
                  Liquidity
                </div>
                <div style={{ fontFamily: T.mono, fontSize: 22, color: T.goldLight, fontWeight: 500 }}>34%</div>
                <div style={{ fontFamily: T.sans, fontSize: 10, color: T.fg2, marginTop: 2 }}>below 40% target</div>
              </div>
            </div>

            {/* Allocation bars */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 18 }}>
              {bars.map(a => (
                <div key={a.label} style={{ background: T.bg1, borderRadius: 8, padding: '10px 12px', border: `1px solid ${T.border0}` }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                    <span style={{ fontFamily: T.sans, fontSize: 10, color: T.fg1 }}>{a.label}</span>
                    <span style={{ fontFamily: T.mono, fontSize: 10, color: T.fg0 }}>{a.val}%</span>
                  </div>
                  <div style={{ height: 2, background: T.border0, borderRadius: 9999, overflow: 'hidden' }}>
                    <div style={{
                      height: '100%', borderRadius: 9999, background: a.color,
                      width: animated ? `${a.val}%` : '0%',
                      transition: 'width 900ms cubic-bezier(0.16,1,0.3,1)',
                    }} />
                  </div>
                </div>
              ))}
            </div>

            {/* AI insight */}
            <div style={{
              background: A.pale, border: `1px solid ${A.bright}25`,
              borderRadius: 8, padding: '12px 14px', display: 'flex', gap: 10, alignItems: 'flex-start',
            }}>
              <div style={{
                width: 6, height: 6, borderRadius: '50%', background: A.bright,
                marginTop: 5, flexShrink: 0, animation: 'pulse 2s ease-in-out infinite',
              }} />
              <div>
                <div style={{ fontFamily: T.sans, fontSize: 10, color: A.text, fontWeight: 500, marginBottom: 3, letterSpacing: '0.04em' }}>
                  AI insight
                </div>
                <div style={{ fontFamily: T.sans, fontSize: 12, color: T.fg1, lineHeight: 1.55 }}>
                  3 capital calls due in the next 90 days ($340k total). Your current liquidity position may not cover them without triggering a taxable event in the Henderson Trust.
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom fade */}
      <div style={{
        position: 'absolute', bottom: 0, left: 0, right: 0, height: 100,
        background: `linear-gradient(to bottom, transparent, ${T.bg0})`, pointerEvents: 'none',
      }} />
    </div>
  );
}
