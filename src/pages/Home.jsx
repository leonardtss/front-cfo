import { useUser } from '@clerk/react';
import { UserButton } from '@clerk/react';
import { T } from '../tokens';

export default function Home() {
  const { user } = useUser();

  const firstName = user?.firstName || user?.username || user?.emailAddresses?.[0]?.emailAddress?.split('@')[0] || 'toi';

  return (
    <div style={{
      minHeight: '100svh',
      background: T.bg0,
      display: 'flex',
      flexDirection: 'column',
    }}>
      {/* Header */}
      <header style={{
        borderBottom: `1px solid ${T.border0}`,
        padding: '0 48px',
        height: 64,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <svg width="14" height="20" viewBox="0 0 14 20" fill="none">
            <rect x="0" y="0" width="2.5" height="20" rx="1.25" fill={T.greenBright} />
            <rect x="0" y="0" width="8" height="2.5" rx="1.25" fill={T.greenBright} />
            <rect x="0" y="17.5" width="8" height="2.5" rx="1.25" fill={T.greenBright} />
          </svg>
          <span style={{ fontFamily: T.sans, fontSize: 15, fontWeight: 500, color: T.fg0, letterSpacing: '-0.2px' }}>
            CFO Black
          </span>
        </div>
        <UserButton appearance={{ elements: { avatarBox: { width: 34, height: 34 } } }} />
      </header>

      {/* Content */}
      <main style={{
        flex: 1,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '48px',
      }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{
            fontFamily: T.sans,
            fontSize: 11,
            color: T.greenText,
            letterSpacing: '0.1em',
            textTransform: 'uppercase',
            marginBottom: 20,
          }}>
            Dashboard
          </div>
          <h1 style={{
            fontFamily: T.serif,
            fontSize: 'clamp(40px,5vw,72px)',
            fontWeight: 600,
            lineHeight: 1.05,
            letterSpacing: '-2px',
            color: T.fg0,
            marginBottom: 16,
          }}>
            Hello, {firstName}.
          </h1>
          <p style={{
            fontFamily: T.sans,
            fontSize: 17,
            lineHeight: 1.7,
            color: T.fg1,
            fontWeight: 300,
            maxWidth: 480,
            margin: '0 auto',
          }}>
            Your CFO Black workspace is being set up. Check back soon.
          </p>
        </div>
      </main>
    </div>
  );
}
