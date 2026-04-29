import { useState, useEffect } from 'react';
import { useUser, useAuth, UserButton } from '@clerk/react';
import { useSearchParams } from 'react-router-dom';
import { useTheme } from '../ThemeContext';
import XeroDashboard   from '../components/XeroDashboard';
import XeroOrgDetail   from '../components/XeroOrgDetail';
import XeroOrgs        from '../components/XeroOrgs';
import BasiqAccounts   from '../components/BasiqAccounts';
import TellerAccounts  from '../components/TellerAccounts';
import BinanceAssets   from '../components/BinanceAssets';

const ENTITY_COLORS = ['#3ddc84','#4fc3f7','#ffb74d','#f06292','#ab47bc','#26c6da','#ff7043','#9ccc65'];
const API = import.meta.env.VITE_API_URL;

function Spinner() {
  return (
    <>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      <svg width="28" height="28" viewBox="0 0 28 28" fill="none" style={{ animation: 'spin 0.8s linear infinite' }}>
        <circle cx="14" cy="14" r="11" stroke={T.border1} strokeWidth="2.5" />
        <path d="M14 3 A11 11 0 0 1 25 14" stroke={T.greenBright} strokeWidth="2.5" strokeLinecap="round" />
      </svg>
    </>
  );
}

export default function Home() {
  const { T, isDark, toggle } = useTheme();
  const { user }       = useUser();
  const { getToken }   = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();

  const [profile, setProfile]       = useState(null);
  const [loading, setLoading]       = useState(true);
  const [xeroStatus, setXeroStatus] = useState(null);
  const [tenants, setTenants]       = useState([]);
  const [page, setPage]             = useState('overview'); // 'overview' | 'au-banks' | 'us-banks' | tenantId

  // Lire ?xero= et ?basiq= au retour des callbacks OAuth
  useEffect(() => {
    const xero  = searchParams.get('xero');
    const basiq = searchParams.get('basiq');
    if (xero)  { setXeroStatus(xero); }
    if (basiq === 'connected') { setPage('au-banks'); }
    if (xero || basiq) setSearchParams({}, { replace: true });
  }, []);

  // Sync profil
  useEffect(() => {
    if (!user?.id) return;
    (async () => {
      const token = await getToken();
      const headers = { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` };
      const pending = JSON.parse(localStorage.getItem('pending_profile') || 'null');
      if (pending?.firstName) {
        try {
          const r = await fetch(`${API}/api/users`, { method: 'POST', headers, body: JSON.stringify({ clerkUserId: user.id, ...pending }) });
          if (r.ok) { localStorage.removeItem('pending_profile'); setProfile(await r.json()); }
        } catch {}
        setLoading(false); return;
      }
      try {
        const r = await fetch(`${API}/api/users/${user.id}`, { headers });
        if (r.ok) setProfile(await r.json());
      } catch {}
      setLoading(false);
    })();
  }, [user?.id]);

  const firstName = profile?.firstName || user?.firstName || user?.emailAddresses?.[0]?.emailAddress?.split('@')[0] || '';

  const selectedTenant = tenants.find(t => t.tenantId === page);

  return (
    <div style={{ minHeight: '100svh', background: T.bg0, display: 'flex', flexDirection: 'column' }}>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>

      {/* Top bar */}
      <header style={{
        borderBottom: `1px solid ${T.border0}`, height: 56,
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '0 24px', flexShrink: 0,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 9 }}>
          <svg width="12" height="18" viewBox="0 0 12 18" fill="none">
            <rect x="0" y="0" width="2.2" height="18" rx="1.1" fill={T.greenBright} />
            <rect x="0" y="0" width="7" height="2.2" rx="1.1" fill={T.greenBright} />
            <rect x="0" y="15.8" width="7" height="2.2" rx="1.1" fill={T.greenBright} />
          </svg>
          <span style={{ fontFamily: T.sans, fontSize: 14, fontWeight: 500, color: T.fg0, letterSpacing: '-0.2px' }}>
            CFO Black
          </span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <button onClick={toggle} title={isDark ? 'Light mode' : 'Dark mode'} style={{
            width: 30, height: 30, borderRadius: 8, border: `1px solid ${T.border1}`,
            background: T.bg2, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
            color: T.fg2, transition: 'all 150ms', flexShrink: 0,
          }}
          onMouseEnter={e => { e.currentTarget.style.borderColor = T.border2; e.currentTarget.style.color = T.fg0; }}
          onMouseLeave={e => { e.currentTarget.style.borderColor = T.border1; e.currentTarget.style.color = T.fg2; }}
          >
            {isDark
              ? <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><circle cx="7" cy="7" r="3" stroke="currentColor" strokeWidth="1.2"/><line x1="7" y1="1" x2="7" y2="2.5" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/><line x1="7" y1="11.5" x2="7" y2="13" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/><line x1="1" y1="7" x2="2.5" y2="7" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/><line x1="11.5" y1="7" x2="13" y2="7" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/><line x1="2.93" y1="2.93" x2="3.99" y2="3.99" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/><line x1="10.01" y1="10.01" x2="11.07" y2="11.07" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/><line x1="11.07" y1="2.93" x2="10.01" y2="3.99" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/><line x1="3.99" y1="10.01" x2="2.93" y2="11.07" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/></svg>
              : <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M11.5 7.5A5 5 0 0 1 6.5 2.5a5 5 0 1 0 5 5z" stroke="currentColor" strokeWidth="1.2" strokeLinejoin="round"/></svg>
            }
          </button>
          <UserButton appearance={{ elements: { avatarBox: { width: 30, height: 30 } } }} />
        </div>
      </header>

      {/* Body */}
      <div style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>

        {/* Sidebar */}
        <aside style={{
          width: 220, flexShrink: 0,
          background: T.bg1, borderRight: `1px solid ${T.border0}`,
          display: 'flex', flexDirection: 'column',
          overflowY: 'auto',
        }}>
          {/* Greeting */}
          <div style={{ padding: '20px 16px 14px', borderBottom: `1px solid ${T.border0}` }}>
            <div style={{ fontFamily: T.sans, fontSize: 11, color: T.fg2, marginBottom: 2 }}>Bonjour,</div>
            <div style={{ fontFamily: T.serif, fontSize: 17, color: T.fg0, letterSpacing: '-0.3px', lineHeight: 1.2 }}>
              {firstName || '—'}
            </div>
          </div>

          {/* Nav */}
          <nav style={{ padding: '10px 0', flex: 1 }}>
            {/* Overview */}
            <NavItem
              label="Vue d'ensemble"
              icon={<GridIcon />}
              active={page === 'overview'}
              onClick={() => setPage('overview')}
            />

            {/* Banques */}
            <div style={{ padding: '12px 16px 4px', fontFamily: T.sans, fontSize: 9, color: T.fg3, textTransform: 'uppercase', letterSpacing: '0.08em' }}>
              Banks
            </div>
            <NavItem
              label="Australian Banks"
              icon={<BankIcon />}
              active={page === 'au-banks'}
              onClick={() => setPage('au-banks')}
            />
            <NavItem
              label="US Banks"
              icon={<BankIcon />}
              active={page === 'us-banks'}
              onClick={() => setPage('us-banks')}
            />

            {/* Crypto */}
            <div style={{ padding: '12px 16px 4px', fontFamily: T.sans, fontSize: 9, color: T.fg3, textTransform: 'uppercase', letterSpacing: '0.08em' }}>
              Crypto
            </div>
            <NavItem
              label="Binance"
              icon={<CryptoIcon />}
              active={page === 'binance'}
              onClick={() => setPage('binance')}
            />

            {/* Organisations */}
            {tenants.length > 0 && (
              <>
                <div style={{ padding: '12px 16px 4px', fontFamily: T.sans, fontSize: 9, color: T.fg3, textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                  Organisations
                </div>
                {tenants.map((t, i) => (
                  <NavItem
                    key={t.tenantId}
                    label={t.tenantName}
                    dot={ENTITY_COLORS[i % ENTITY_COLORS.length]}
                    active={page === t.tenantId}
                    onClick={() => setPage(t.tenantId)}
                  />
                ))}
              </>
            )}
          </nav>

          {/* Bottom: connect buttons */}
          <div style={{ padding: '12px 16px', borderTop: `1px solid ${T.border0}`, display: 'flex', flexDirection: 'column', gap: 6 }}>
            <SidebarConnectBtn
              onClick={() => { window.location.href = `${API}/api/xero/login?clerkUserId=${user?.id}`; }}
              icon={<XeroLogo size={14} />}
              label="Connecter une org. Xero"
            />
            <SidebarConnectBtn
              onClick={() => {
                const email = user?.emailAddresses?.[0]?.emailAddress || '';
                window.location.href = `${API}/api/basiq/connect/${user?.id}?email=${encodeURIComponent(email)}`;
              }}
              icon={<BankIcon size={13} />}
              label="Australian bank"
            />
            <SidebarConnectBtn
              onClick={() => setPage('us-banks')}
              icon={<BankIcon size={13} />}
              label="US bank"
            />
          </div>
        </aside>

        {/* Main content */}
        <main style={{ flex: 1, overflowY: 'auto', padding: '32px 36px' }}>
          {loading ? (
            <div style={{ display: 'flex', justifyContent: 'center', paddingTop: 80 }}><Spinner /></div>
          ) : !user?.id ? null : (
            <>
              {xeroStatus === 'error' && (
                <div style={{ fontFamily: T.sans, fontSize: 12, color: '#e05555', marginBottom: 16 }}>
                  Connexion Xero échouée. Réessayez.
                </div>
              )}

              {/* Fetch tenants silently */}
              <XeroOrgs clerkUserId={user.id} onTenantsLoaded={setTenants} hidden />

              {page === 'au-banks' ? (
                <BasiqAccounts clerkUserId={user.id} />
              ) : page === 'us-banks' ? (
                <TellerAccounts clerkUserId={user.id} />
              ) : page === 'binance' ? (
                <BinanceAssets clerkUserId={user.id} />
              ) : tenants.length === 0 ? (
                /* Pas encore connecté à Xero */
                <div style={{ maxWidth: 440, margin: '0 auto', paddingTop: 40 }}>
                  <div style={{ fontFamily: T.serif, fontSize: 28, color: T.fg0, letterSpacing: '-0.8px', marginBottom: 10 }}>
                    Connectez Xero pour commencer.
                  </div>
                  <p style={{ fontFamily: T.sans, fontSize: 14, color: T.fg1, lineHeight: 1.65, fontWeight: 300, marginBottom: 28 }}>
                    CFO Black agrège vos données financières en temps réel depuis toutes vos entités Xero.
                  </p>
                  <XeroOrgs clerkUserId={user.id} onTenantsLoaded={setTenants} />
                </div>
              ) : page === 'overview' ? (
                <XeroDashboard clerkUserId={user.id} tenants={tenants} />
              ) : selectedTenant ? (
                <XeroOrgDetail
                  clerkUserId={user.id}
                  tenant={selectedTenant}
                  color={ENTITY_COLORS[tenants.indexOf(selectedTenant) % ENTITY_COLORS.length]}
                />
              ) : null}
            </>
          )}
        </main>
      </div>
    </div>
  );
}

// ── Sub-components ────────────────────────────────────────────────────────────
function NavItem({ label, icon, dot, active, onClick }) {
  const { T } = useTheme();
  return (
    <button onClick={onClick} style={{
      width: '100%', display: 'flex', alignItems: 'center', gap: 9,
      padding: '7px 16px', background: active ? `${T.greenBright}08` : 'transparent',
      borderLeft: active ? `2px solid ${T.greenBright}` : '2px solid transparent',
      border: 'none', borderRadius: 0, cursor: 'pointer',
      fontFamily: T.sans, fontSize: 12,
      color: active ? T.fg0 : T.fg2,
      textAlign: 'left', transition: 'color 120ms',
    }}
    onMouseEnter={e => !active && (e.currentTarget.style.color = T.fg1)}
    onMouseLeave={e => !active && (e.currentTarget.style.color = T.fg2)}
    >
      {icon}
      {dot && <div style={{ width: 7, height: 7, borderRadius: 2, background: dot, flexShrink: 0 }} />}
      <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{label}</span>
    </button>
  );
}

function GridIcon() {
  return (
    <svg width="13" height="13" viewBox="0 0 13 13" fill="none" style={{ flexShrink: 0 }}>
      <rect x="0" y="0" width="5.5" height="5.5" rx="1.2" fill="currentColor" opacity="0.6" />
      <rect x="7.5" y="0" width="5.5" height="5.5" rx="1.2" fill="currentColor" opacity="0.6" />
      <rect x="0" y="7.5" width="5.5" height="5.5" rx="1.2" fill="currentColor" opacity="0.6" />
      <rect x="7.5" y="7.5" width="5.5" height="5.5" rx="1.2" fill="currentColor" opacity="0.6" />
    </svg>
  );
}

function XeroLogo({ size = 16 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 40 40" fill="none" style={{ flexShrink: 0 }}>
      <circle cx="20" cy="20" r="20" fill="#13B5EA" />
      <path d="M11 20l5.5 5.5L22 20l-5.5-5.5L11 20z" fill="white" />
      <path d="M29 20l-5.5-5.5L18 20l5.5 5.5L29 20z" fill="white" />
    </svg>
  );
}

function CryptoIcon({ size = 13 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 13 13" fill="none" style={{ flexShrink: 0 }}>
      <circle cx="6.5" cy="6.5" r="5.5" stroke="currentColor" strokeWidth="1.1" opacity="0.6"/>
      <path d="M5 4.5h2.5c.8 0 1.3.4 1.3 1s-.5 1-1.3 1H5M5 6.5h2.8c.9 0 1.4.4 1.4 1.1S8.7 8.5 7.8 8.5H5" stroke="currentColor" strokeWidth="1" strokeLinecap="round"/>
      <line x1="6.5" y1="3.5" x2="6.5" y2="4.5" stroke="currentColor" strokeWidth="1" strokeLinecap="round"/>
      <line x1="6.5" y1="8.5" x2="6.5" y2="9.5" stroke="currentColor" strokeWidth="1" strokeLinecap="round"/>
    </svg>
  );
}

function BankIcon({ size = 13 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 13 13" fill="none" style={{ flexShrink: 0 }}>
      <path d="M1 5h11M6.5 1L12 5H1L6.5 1Z" stroke="currentColor" strokeWidth="1.1" strokeLinejoin="round"/>
      <rect x="2" y="5" width="2" height="5" fill="currentColor" opacity="0.5"/>
      <rect x="5.5" y="5" width="2" height="5" fill="currentColor" opacity="0.5"/>
      <rect x="9" y="5" width="2" height="5" fill="currentColor" opacity="0.5"/>
      <line x1="1" y1="10" x2="12" y2="10" stroke="currentColor" strokeWidth="1.1" strokeLinecap="round"/>
    </svg>
  );
}

function SidebarConnectBtn({ onClick, icon, label }) {
  return (
    <button
      onClick={onClick}
      style={{
        width: '100%', display: 'flex', alignItems: 'center', gap: 7,
        fontFamily: T.sans, fontSize: 11, color: T.fg2,
        background: 'none', border: `1px solid ${T.border0}`,
        borderRadius: 7, padding: '7px 10px', cursor: 'pointer',
        transition: 'border-color 150ms, color 150ms',
      }}
      onMouseEnter={e => { e.currentTarget.style.borderColor = T.border1; e.currentTarget.style.color = T.fg1; }}
      onMouseLeave={e => { e.currentTarget.style.borderColor = T.border0; e.currentTarget.style.color = T.fg2; }}
    >
      {icon}
      {label}
    </button>
  );
}
