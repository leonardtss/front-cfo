import { useContext, useState } from 'react';
import { TweaksCtx } from '../context';
import { T, getAccentTokens } from '../tokens';
import { useMedia } from '../hooks/useMedia';

export function Wrap({ children, style }) {
  const isMobile = useMedia('(max-width: 767px)');
  return (
    <div style={{ maxWidth: 1200, margin: '0 auto', padding: isMobile ? '0 20px' : '0 48px', ...style }}>
      {children}
    </div>
  );
}

export function Tag({ children, color }) {
  const { accent } = useContext(TweaksCtx);
  const A = getAccentTokens(accent);
  const c = color === 'green'
    ? { bg: A.pale, border: 'rgba(82,168,116,0.2)', color: A.text }
    : { bg: 'rgba(240,237,228,0.06)', border: T.border1, color: T.fg2 };
  return (
    <span style={{
      display: 'inline-block', fontSize: 11, padding: '3px 12px', borderRadius: 9999,
      background: c.bg, border: `1px solid ${c.border}`, color: c.color,
      letterSpacing: '0.05em', fontFamily: T.sans,
    }}>
      {children}
    </span>
  );
}

export function BtnPrimary({ children, onClick, size = 'md' }) {
  const { accent } = useContext(TweaksCtx);
  const A = getAccentTokens(accent);
  const [hov, setHov] = useState(false);
  const pad = size === 'lg' ? '14px 30px' : '10px 20px';
  const fs  = size === 'lg' ? 15 : 14;
  return (
    <button
      onClick={onClick}
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      style={{
        fontFamily: T.sans, fontSize: fs, fontWeight: 400, padding: pad, borderRadius: 8,
        background: hov ? A.mid : A.base, color: T.fg0, border: 'none', cursor: 'pointer',
        boxShadow: 'rgba(255,255,255,0.12) 0px 0.5px 0 0 inset, rgba(0,0,0,0.3) 0 0 0 0.5px inset',
        transition: 'background 150ms', letterSpacing: '-0.1px',
      }}
    >
      {children}
    </button>
  );
}

export function BtnGhost({ children, onClick, size = 'md' }) {
  const [hov, setHov] = useState(false);
  const pad = size === 'lg' ? '14px 30px' : '10px 20px';
  const fs  = size === 'lg' ? 15 : 14;
  return (
    <button
      onClick={onClick}
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      style={{
        fontFamily: T.sans, fontSize: fs, fontWeight: 400, padding: pad, borderRadius: 8,
        background: 'transparent', color: hov ? T.fg0 : T.fg1,
        border: `1px solid ${hov ? T.border2 : T.border1}`, cursor: 'pointer',
        transition: 'border-color 150ms, color 150ms', letterSpacing: '-0.1px',
      }}
    >
      {children}
    </button>
  );
}

export function scrollTo(id) {
  const el = document.getElementById(id);
  if (el) window.scrollTo({ top: el.getBoundingClientRect().top + window.scrollY - 80, behavior: 'smooth' });
}
