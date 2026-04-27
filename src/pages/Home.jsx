import { useState, useEffect } from 'react';
import { useUser, useAuth, UserButton } from '@clerk/react';
import { useSearchParams } from 'react-router-dom';
import { T } from '../tokens';
import BankAccounts from '../components/BankAccounts';
import XeroOrgs from '../components/XeroOrgs';

export default function Home() {
  const { user } = useUser();
  const { getToken } = useAuth();
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [xeroStatus, setXeroStatus] = useState(null); // null | 'connected' | 'error'
  const [searchParams, setSearchParams] = useSearchParams();

  useEffect(() => {
    const xero = searchParams.get('xero');
    if (xero) {
      setXeroStatus(xero);
      setSearchParams({}, { replace: true });
    }
  }, []);

  useEffect(() => {
    if (!user?.id) return;

    async function syncProfile() {
      const token = await getToken();
      const headers = {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      };

      const pending = JSON.parse(localStorage.getItem('pending_profile') || 'null');
      if (pending?.firstName) {
        try {
          const r = await fetch(`${import.meta.env.VITE_API_URL}/api/users`, {
            method: 'POST',
            headers,
            body: JSON.stringify({ clerkUserId: user.id, ...pending }),
          });
          if (r.ok) {
            localStorage.removeItem('pending_profile');
            setProfile(await r.json());
          } else {
            console.error('[CFO] POST /api/users failed:', await r.text());
          }
        } catch (err) {
          console.error('[CFO] POST /api/users error:', err);
        }
        return;
      }

      try {
        const r = await fetch(`${import.meta.env.VITE_API_URL}/api/users/${user.id}`, { headers });
        if (r.ok) setProfile(await r.json());
      } catch (err) {
        console.error('[CFO] GET /api/users error:', err);
      }
    }

    syncProfile().finally(() => setLoading(false));
  }, [user?.id]);

  const firstName = profile?.firstName || user?.firstName || user?.username || user?.emailAddresses?.[0]?.emailAddress?.split('@')[0] || 'toi';

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
        {loading ? (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16 }}>
            <svg width="32" height="32" viewBox="0 0 32 32" fill="none" style={{ animation: 'spin 0.8s linear infinite' }}>
              <circle cx="16" cy="16" r="13" stroke={T.border1} strokeWidth="2.5" />
              <path d="M16 3 A13 13 0 0 1 29 16" stroke={T.greenBright} strokeWidth="2.5" strokeLinecap="round" />
            </svg>
            <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
          </div>
        ) : (
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
              margin: '0 auto 40px',
            }}>
              Your CFO Black workspace is being set up. Check back soon.
            </p>

            {/* Xero */}
            {xeroStatus === 'error' && (
              <p style={{ fontFamily: T.sans, fontSize: 13, color: '#e05555', marginBottom: 12 }}>
                Xero connection failed. Please try again.
              </p>
            )}
            <XeroOrgs clerkUserId={user?.id} />
            <BankAccounts />
          </div>
        )}
      </main>
    </div>
  );
}
