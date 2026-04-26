import { T } from '../tokens';
import { Wrap } from './shared';
import { useMedia } from '../hooks/useMedia';

export default function Footer() {
  const isMobile = useMedia('(max-width: 767px)');

  return (
    <footer style={{ borderTop: `1px solid ${T.border0}`, padding: '36px 0' }}>
      <Wrap style={{
        display: 'flex',
        flexDirection: isMobile ? 'column' : 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        gap: isMobile ? 20 : 0,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <svg width="11" height="16" viewBox="0 0 11 16" fill="none">
            <rect x="0" y="0" width="2" height="16" rx="1" fill={T.greenBright} />
            <rect x="0" y="0" width="7" height="2" rx="1" fill={T.greenBright} />
            <rect x="0" y="14" width="7" height="2" rx="1" fill={T.greenBright} />
          </svg>
          <span style={{ fontFamily: T.sans, fontSize: 13, color: T.fg2 }}>
            CFO Black · Early access · 2025
          </span>
        </div>
        <div style={{ display: 'flex', gap: 24 }}>
          {['Privacy', 'Security', 'Terms'].map(l => (
            <a
              key={l}
              href="#"
              style={{ fontFamily: T.sans, fontSize: 13, color: T.fg2, textDecoration: 'none', transition: 'color 150ms' }}
              onMouseEnter={e => e.target.style.color = T.fg0}
              onMouseLeave={e => e.target.style.color = T.fg2}
            >
              {l}
            </a>
          ))}
        </div>
      </Wrap>
    </footer>
  );
}
