import { useContext, useEffect, useState } from 'react';
import { UserButton, useUser } from '@clerk/react';
import { Link } from 'react-router-dom';
import { TweaksCtx } from '../context';
import { T, getAccentTokens } from '../tokens';
import { Wrap, BtnPrimary, scrollTo } from './shared';

export default function Nav() {
  const { accent } = useContext(TweaksCtx);
  const A = getAccentTokens(accent);
  const [scrolled, setScrolled] = useState(false);
  const { isSignedIn } = useUser();

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
        <Link to="/" style={{ display: 'flex', alignItems: 'center', gap: 10, textDecoration: 'none' }}>
          <svg width="14" height="20" viewBox="0 0 14 20" fill="none">
            <rect x="0" y="0" width="2.5" height="20" rx="1.25" fill={A.bright} />
            <rect x="0" y="0" width="8" height="2.5" rx="1.25" fill={A.bright} />
            <rect x="0" y="17.5" width="8" height="2.5" rx="1.25" fill={A.bright} />
          </svg>
          <span style={{ fontFamily: T.sans, fontSize: 15, fontWeight: 500, color: T.fg0, letterSpacing: '-0.2px' }}>
            CFO Black
          </span>
        </Link>

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

          {isSignedIn ? (
            <UserButton appearance={{ elements: { avatarBox: { width: 34, height: 34 } } }} />
          ) : (
            <>
              <Link to="/sign-in" style={{ textDecoration: 'none' }}>
                <button style={{
                  fontFamily: T.sans, fontSize: 14, fontWeight: 400,
                  padding: '10px 20px', borderRadius: 8,
                  background: 'transparent', color: T.fg1,
                  border: `1px solid ${T.border1}`, cursor: 'pointer',
                  transition: 'border-color 150ms, color 150ms', letterSpacing: '-0.1px',
                }}
                  onMouseEnter={e => { e.currentTarget.style.color = T.fg0; e.currentTarget.style.borderColor = T.border2; }}
                  onMouseLeave={e => { e.currentTarget.style.color = T.fg1; e.currentTarget.style.borderColor = T.border1; }}
                >
                  Se connecter
                </button>
              </Link>
              <Link to="/sign-up" style={{ textDecoration: 'none' }}>
                <BtnPrimary>Demander l'accès</BtnPrimary>
              </Link>
            </>
          )}
        </div>
      </Wrap>
    </nav>
  );
}
