import { useContext, useEffect, useState } from 'react';
import { TweaksCtx } from '../context';
import { T, getAccentTokens } from '../tokens';
import { Wrap, Tag, BtnPrimary, BtnGhost, scrollTo } from './shared';
import MockDashboard from './MockDashboard';

const TAGLINES = [
  'Your wealth deserves more than a dashboard.',
  'The command center for complex wealth.',
  'Clarity for people with structures, not just assets.',
];

export default function Hero() {
  const { tagline: taglineIdx, showDashboard, carouselActive, accent } = useContext(TweaksCtx);
  const A = getAccentTokens(accent);
  const [active, setActive] = useState(taglineIdx);
  const [visible, setVisible] = useState(true);

  useEffect(() => { setActive(taglineIdx); }, [taglineIdx]);

  useEffect(() => {
    if (!carouselActive) return;
    const id = setInterval(() => {
      setVisible(false);
      setTimeout(() => { setActive(a => (a + 1) % 3); setVisible(true); }, 300);
    }, 4000);
    return () => clearInterval(id);
  }, [carouselActive]);

  return (
    <section style={{ paddingTop: 168, paddingBottom: 100, position: 'relative', overflow: 'hidden' }}>
      {/* Ambient glow */}
      <div style={{
        position: 'absolute', top: 60, left: '50%', transform: 'translateX(-50%)',
        width: 800, height: 400,
        background: `radial-gradient(ellipse, ${A.pale.replace('0.12', '0.15')} 0%, transparent 65%)`,
        pointerEvents: 'none',
      }} />

      <Wrap style={{ textAlign: 'center', position: 'relative' }}>
        <div className="fade-up fade-up-1">
          <Tag color="green">Invite only · Early access</Tag>
        </div>

        <div className="fade-up fade-up-2" style={{ marginTop: 28 }}>
          <h1 style={{
            fontFamily: T.serif, fontSize: 'clamp(46px,6vw,82px)', fontWeight: 600,
            lineHeight: 1.0, letterSpacing: '-2.5px', color: T.fg0,
            maxWidth: 820, margin: '0 auto',
            opacity: visible ? 1 : 0, transition: 'opacity 300ms ease',
          }}>
            {TAGLINES[active]}
          </h1>

          {carouselActive && (
            <div style={{ display: 'flex', justifyContent: 'center', gap: 6, marginTop: 18 }}>
              {[0, 1, 2].map(i => (
                <button
                  key={i}
                  onClick={() => { setActive(i); setVisible(true); }}
                  style={{
                    width: i === active ? 22 : 6, height: 6, borderRadius: 9999,
                    padding: 0, border: 'none', cursor: 'pointer',
                    background: i === active ? A.bright : T.border2,
                    transition: 'all 350ms',
                  }}
                />
              ))}
            </div>
          )}
        </div>

        <div className="fade-up fade-up-3">
          <p style={{
            fontFamily: T.sans, fontSize: 18, lineHeight: 1.7, color: T.fg1,
            maxWidth: 560, margin: '24px auto 0', fontWeight: 300,
          }}>
            Aggregates everything your current tools can. Then adds the AI that understands your entities, your tax exposure, and your goals — and tells you what to do about them.
          </p>
        </div>

        <div className="fade-up fade-up-4" style={{ display: 'flex', justifyContent: 'center', gap: 12, marginTop: 40 }}>
          <BtnPrimary size="lg" onClick={() => scrollTo('access-form')}>Request access</BtnPrimary>
          <BtnGhost size="lg" onClick={() => scrollTo('how-it-works')}>See how it works</BtnGhost>
        </div>

        {showDashboard && <MockDashboard />}
      </Wrap>
    </section>
  );
}
