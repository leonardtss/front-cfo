import { useContext, useEffect, useState } from 'react';
import { UserButton, useUser } from '@clerk/react';
import { Link } from 'react-router-dom';
import { TweaksCtx } from '../context';
import { T, getAccentTokens } from '../tokens';
import { Wrap, BtnPrimary, scrollTo } from './shared';
import { useMedia } from '../hooks/useMedia';

export default function Nav() {
  const { accent } = useContext(TweaksCtx);
  const A = getAccentTokens(accent);
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const { isSignedIn } = useUser();
  const isMobile = useMedia('(max-width: 767px)');

  useEffect(() => {
    const fn = () => setScrolled(window.scrollY > 30);
    window.addEventListener('scroll', fn);
    return () => window.removeEventListener('scroll', fn);
  }, []);

  // Close menu on resize to desktop
  useEffect(() => {
    if (!isMobile) setMenuOpen(false);
  }, [isMobile]);

  const links = [
    ['How it works', 'how-it-works'],
    ['What we handle', 'what-we-handle'],
    ['Privacy', 'privacy'],
    ['FAQ', 'faq'],
  ];

  const handleNavLink = (id) => {
    setMenuOpen(false);
    setTimeout(() => scrollTo(id), 10);
  };

  return (
    <>
      <nav style={{
        position: 'fixed', top: 0, left: 0, right: 0, zIndex: 100, height: 64,
        background: scrolled || menuOpen ? 'rgba(11,13,11,0.95)' : 'transparent',
        backdropFilter: scrolled || menuOpen ? 'blur(14px)' : 'none',
        borderBottom: scrolled || menuOpen ? `1px solid ${T.border0}` : '1px solid transparent',
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

          {isMobile ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
              {isSignedIn && (
                <UserButton appearance={{ elements: { avatarBox: { width: 32, height: 32 } } }} />
              )}
              <button
                onClick={() => setMenuOpen(o => !o)}
                style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 4, display: 'flex', flexDirection: 'column', gap: 5 }}
                aria-label="Menu"
              >
                <span style={{
                  display: 'block', width: 22, height: 1.5, background: T.fg0, borderRadius: 1,
                  transition: 'transform 200ms, opacity 200ms',
                  transform: menuOpen ? 'translateY(6.5px) rotate(45deg)' : 'none',
                }} />
                <span style={{
                  display: 'block', width: 22, height: 1.5, background: T.fg0, borderRadius: 1,
                  transition: 'opacity 200ms',
                  opacity: menuOpen ? 0 : 1,
                }} />
                <span style={{
                  display: 'block', width: 22, height: 1.5, background: T.fg0, borderRadius: 1,
                  transition: 'transform 200ms, opacity 200ms',
                  transform: menuOpen ? 'translateY(-6.5px) rotate(-45deg)' : 'none',
                }} />
              </button>
            </div>
          ) : (
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
                      Sign in
                    </button>
                  </Link>
                  <Link to="/sign-up" style={{ textDecoration: 'none' }}>
                    <BtnPrimary>Create an account</BtnPrimary>
                  </Link>
                </>
              )}
            </div>
          )}
        </Wrap>
      </nav>

      {/* Mobile menu */}
      {isMobile && menuOpen && (
        <div style={{
          position: 'fixed', top: 64, left: 0, right: 0, zIndex: 99,
          background: 'rgba(11,13,11,0.97)', backdropFilter: 'blur(14px)',
          borderBottom: `1px solid ${T.border0}`,
          padding: '24px 24px 32px',
          display: 'flex', flexDirection: 'column', gap: 0,
        }}>
          {links.map(([label, id]) => (
            <a
              key={label}
              href={`#${id}`}
              onClick={e => { e.preventDefault(); handleNavLink(id); }}
              style={{
                fontFamily: T.sans, fontSize: 16, color: T.fg1, textDecoration: 'none',
                padding: '14px 0',
                borderBottom: `1px solid ${T.border0}`,
              }}
            >
              {label}
            </a>
          ))}

          {!isSignedIn && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginTop: 24 }}>
              <Link to="/sign-in" style={{ textDecoration: 'none' }} onClick={() => setMenuOpen(false)}>
                <button style={{
                  width: '100%', fontFamily: T.sans, fontSize: 15, fontWeight: 400,
                  padding: '13px 20px', borderRadius: 8,
                  background: 'transparent', color: T.fg0,
                  border: `1px solid ${T.border1}`, cursor: 'pointer',
                }}>
                  Sign in
                </button>
              </Link>
              <Link to="/sign-up" style={{ textDecoration: 'none' }} onClick={() => setMenuOpen(false)}>
                <BtnPrimary size="lg">
                  <span style={{ display: 'block', width: '100%', textAlign: 'center' }}>Create an account</span>
                </BtnPrimary>
              </Link>
            </div>
          )}
        </div>
      )}
    </>
  );
}
