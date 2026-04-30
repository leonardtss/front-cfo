import { useEffect, useState } from 'react';
import { useAuth } from '@clerk/react';
import { useTheme } from '../ThemeContext';

const API = import.meta.env.VITE_API_URL;

function fmt(val) {
  if (val == null || isNaN(val)) return '—';
  if (Math.abs(val) >= 1_000_000) return `$${(val / 1_000_000).toFixed(2)}M`;
  if (Math.abs(val) >= 1_000)     return `$${(val / 1_000).toFixed(1)}k`;
  return `$${val.toFixed(2)}`;
}

function fmtCrypto(val) {
  if (val == null || isNaN(val)) return '—';
  if (val >= 1)      return val.toFixed(4);
  if (val >= 0.0001) return val.toFixed(6);
  return val.toExponential(2);
}

function Spinner({ size = 24 }) {
  const { T } = useTheme();
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none"
      style={{ animation: 'spin 0.8s linear infinite', display: 'block' }}>
      <circle cx="12" cy="12" r="10" stroke={T.border1} strokeWidth="2" />
      <path d="M12 2 A10 10 0 0 1 22 12" stroke={T.greenBright} strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}

function CoinbaseLogo({ size = 16 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" fill="none" style={{ flexShrink: 0 }}>
      <rect width="32" height="32" rx="16" fill="#0052FF" />
      <circle cx="16" cy="16" r="9" fill="white" />
      <rect x="11" y="13.5" width="10" height="5" rx="2.5" fill="#0052FF" />
    </svg>
  );
}

export default function CoinbaseAssets({ clerkUserId }) {
  const { T } = useTheme();
  const { getToken } = useAuth();
  const [data, setData]           = useState(null);
  const [loading, setLoading]     = useState(true);
  const [disconnecting, setDisconnecting] = useState(false);

  async function fetchSummary() {
    setLoading(true);
    try {
      const token = await getToken();
      const r = await fetch(`${API}/api/coinbase/summary/${clerkUserId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!r.ok) throw new Error(await r.text());
      setData(await r.json());
    } catch (e) {
      console.error('[Coinbase]', e);
      setData({ connected: false });
    } finally {
      setLoading(false);
    }
  }

  async function disconnect() {
    setDisconnecting(true);
    try {
      const token = await getToken();
      await fetch(`${API}/api/coinbase/disconnect/${clerkUserId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });
      setData({ connected: false });
    } finally {
      setDisconnecting(false);
    }
  }

  useEffect(() => { if (clerkUserId) fetchSummary(); }, [clerkUserId]);

  if (loading) return (
    <div style={{ display: 'flex', justifyContent: 'center', paddingTop: 60 }}>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      <Spinner />
    </div>
  );

  const { connected, accounts = [], totalUSD } = data || {};

  if (!connected) {
    return (
      <div style={{ maxWidth: 480, margin: '0 auto', paddingTop: 40 }}>
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20 }}>
          <CoinbaseLogo size={32} />
          <div style={{ fontFamily: T.serif, fontSize: 28, color: T.fg0, letterSpacing: '-0.8px' }}>
            Connect Coinbase
          </div>
        </div>
        <p style={{ fontFamily: T.sans, fontSize: 14, color: T.fg1, lineHeight: 1.65, fontWeight: 300, marginBottom: 28 }}>
          CFO Black reads your Coinbase wallet balances via secure OAuth.
          Your credentials never touch our servers.
        </p>
        <button
          onClick={() => { window.location.href = `${API}/api/coinbase/connect/${clerkUserId}`; }}
          style={{
            display: 'inline-flex', alignItems: 'center', gap: 10,
            fontFamily: T.sans, fontSize: 14, fontWeight: 500,
            color: 'white', background: '#0052FF',
            border: 'none', borderRadius: 10, padding: '12px 24px',
            cursor: 'pointer', transition: 'opacity 150ms',
          }}
          onMouseEnter={e => e.currentTarget.style.opacity = '0.88'}
          onMouseLeave={e => e.currentTarget.style.opacity = '1'}
        >
          <CoinbaseLogo size={18} />
          Connect with Coinbase
        </button>
      </div>
    );
  }

  return (
    <div style={{ width: '100%', maxWidth: 760, margin: '0 auto', display: 'flex', flexDirection: 'column', gap: 14 }}>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ fontFamily: T.sans, fontSize: 11, color: T.fg2, textTransform: 'uppercase', letterSpacing: '0.08em' }}>
          Crypto · Coinbase{accounts.length > 0 ? ` · ${accounts.length} wallet${accounts.length > 1 ? 's' : ''}` : ''}
        </div>
        <button onClick={disconnect} disabled={disconnecting} style={{
          display: 'inline-flex', alignItems: 'center', gap: 6,
          fontFamily: T.sans, fontSize: 11, color: T.fg2,
          background: 'none', border: `1px solid ${T.border1}`,
          borderRadius: 7, padding: '5px 10px', cursor: 'pointer',
          opacity: disconnecting ? 0.5 : 1,
        }}>
          {disconnecting ? <Spinner size={10} /> : null}
          Disconnect
        </button>
      </div>

      {accounts.length > 0 && (
        <div style={{
          background: T.bg1, border: `1px solid ${T.border0}`,
          borderRadius: 10, padding: '14px 16px',
        }}>
          <div style={{ fontFamily: T.sans, fontSize: 9, color: T.fg2, textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 7 }}>
            Total portfolio value
          </div>
          <div style={{ fontFamily: T.mono, fontSize: 24, fontWeight: 500, letterSpacing: '-1px', color: T.greenText }}>
            {fmt(totalUSD)}
          </div>
        </div>
      )}

      {accounts.length > 0 && (
        <div style={{ background: T.bg1, border: `1px solid ${T.border0}`, borderRadius: 10, overflow: 'hidden' }}>
          <div style={{
            display: 'flex', alignItems: 'center', gap: 8,
            padding: '12px 20px', borderBottom: `1px solid ${T.border0}`, background: T.bg2,
          }}>
            <CoinbaseLogo size={16} />
            <span style={{ fontFamily: T.sans, fontSize: 12, color: T.fg0, fontWeight: 500 }}>Coinbase</span>
          </div>
          <div style={{ padding: '4px 0' }}>
            {accounts.map(a => {
              const pct = totalUSD > 0 && a.valueUSD != null ? (a.valueUSD / totalUSD) * 100 : 0;
              return (
                <div key={a.id} style={{
                  display: 'flex', alignItems: 'center', gap: 12,
                  padding: '9px 20px', borderBottom: `1px solid ${T.border0}`,
                }}>
                  <div style={{ width: 52, fontFamily: T.mono, fontSize: 12, fontWeight: 600, color: T.fg0, flexShrink: 0 }}>
                    {a.asset}
                  </div>
                  <div style={{ flex: 1, height: 4, background: T.bg2, borderRadius: 2, overflow: 'hidden' }}>
                    <div style={{ width: `${pct}%`, height: '100%', background: '#0052FF', borderRadius: 2, transition: 'width 400ms' }} />
                  </div>
                  <div style={{ fontFamily: T.mono, fontSize: 11, color: T.fg2, width: 90, textAlign: 'right', flexShrink: 0 }}>
                    {fmtCrypto(a.total)}
                  </div>
                  <div style={{ fontFamily: T.mono, fontSize: 12, color: T.fg0, width: 80, textAlign: 'right', flexShrink: 0 }}>
                    {a.valueUSD != null ? fmt(a.valueUSD) : <span style={{ color: T.fg3 }}>—</span>}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {accounts.length === 0 && (
        <div style={{ background: T.bg1, border: `1px solid ${T.border0}`, borderRadius: 10, padding: '32px 24px', textAlign: 'center' }}>
          <div style={{ fontFamily: T.sans, fontSize: 13, color: T.fg2 }}>
            Coinbase connected — no wallets with balance found.
          </div>
        </div>
      )}
    </div>
  );
}
