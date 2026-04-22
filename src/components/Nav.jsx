import { useContext, useEffect, useState } from 'react';
import { TweaksCtx } from '../context';
import { T, getAccentTokens } from '../tokens';
import { Wrap, BtnPrimary, scrollTo } from './shared';

export default function Nav() {
  const { accent } = useContext(TweaksCtx);
  const A = getAccentTokens(accent);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const fn = () => setScrolled(window.scrollY > 30);
    window.addEventListener('scroll', fn);
    return () => window.removeEventListener('scroll', fn);
  }, []);

  const links = [
    ['How it works', 'how-it-works'],
    ['What we handle', 'what-we-handle'],
    ['Privacy', 'privacy'],
    ['FAQ', 'faq'],
  ];

  return (
    <nav style={{
      position: 'fixed', top: 0, left: 0, right: 0, zIndex: 100, height: 64,
      background: scrolled ? 'rgba(11,13,11,0.88)' : 'transparent',
      backdropFilter: scrolled ? 'blur(14px)' : 'none',
      borderBottom: scrolled ? `1px solid ${T.border0}` : '1px solid transparent',
      transition: 'background 300ms, border-color 300ms',
    }}>
      <Wrap style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <a href="#" style={{ display: 'flex', alignItems: 'center', gap: 10, textDecoration: 'none' }}>
          <svg width="14" height="20" viewBox="0 0 14 20" fill="none">
            <rect x="0" y="0" width="2.5" height="20" rx="1.25" fill={A.bright} />
            <rect x="0" y="0" width="8" height="2.5" rx="1.25" fill={A.bright} />
            <rect x="0" y="17.5" width="8" height="2.5" rx="1.25" fill={A.bright} />
          </svg>
          <span style={{ fontFamily: T.sans, fontSize: 15, fontWeight: 500, color: T.fg0, letterSpacing: '-0.2px' }}>
            CFO Black
          </span>
        </a>

        <div style={{ display: 'flex', alignItems: 'center', gap: 32 }}>
          {links.map(([label, id]) => (
            <a
              key={label}
              href={`#${id}`}
              onClick={e => { e.preventDefault(); scrollTo(id); }}
              style={{ fontFamily: T.sans, fontSize: 13, color: T.fg2, textDecoration: 'none', transition: 'color 150ms' }}
              onMouseEnter={e => e.target.style.color = T.fg0}
              onMouseLeave={e => e.target.style.color = T.fg2}
            >
              {label}
            </a>
          ))}
          <BtnPrimary onClick={() => scrollTo('access-form')}>Request access</BtnPrimary>
        </div>
      </Wrap>
    </nav>
  );
}
