import { useEffect, useState } from 'react';
import { useAuth } from '@clerk/react';
import { useTheme } from '../ThemeContext';

const API = import.meta.env.VITE_API_URL;

function fmt(val, digits = 2) {
  if (val == null || isNaN(val)) return '—';
  if (Math.abs(val) >= 1_000_000) return `$${(val / 1_000_000).toFixed(2)}M`;
  if (Math.abs(val) >= 1_000)     return `$${(val / 1_000).toFixed(1)}k`;
  return `$${val.toFixed(digits)}`;
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

// ── Add key form ──────────────────────────────────────────────────────────────
function AddKeyForm({ clerkUserId, onAdded }) {
  const { T } = useTheme();
  const { getToken } = useAuth();
  const [form, setForm]     = useState({ label: '', apiKey: '', secretKey: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState(null);
  const [showSecret, setShowSecret] = useState(false);

  async function submit(e) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const token = await getToken();
      const r = await fetch(`${API}/api/binance/keys/${clerkUserId}`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      const json = await r.json();
      if (!r.ok) throw new Error(json.error || 'Error');
      setForm({ label: '', apiKey: '', secretKey: '' });
      onAdded();
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }

  const inputStyle = {
    width: '100%', fontFamily: T.mono, fontSize: 12, color: T.fg0,
    background: T.bg2, border: `1px solid ${T.border1}`,
    borderRadius: 7, padding: '8px 11px', outline: 'none',
    boxSizing: 'border-box',
  };

  return (
    <form onSubmit={submit} style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
      <input
        placeholder="Label (e.g. Client name)"
        value={form.label}
        onChange={e => setForm(f => ({ ...f, label: e.target.value }))}
        style={{ ...inputStyle, fontFamily: T.sans }}
      />
      <input
        placeholder="API Key"
        value={form.apiKey}
        onChange={e => setForm(f => ({ ...f, apiKey: e.target.value }))}
        style={inputStyle}
        autoComplete="off"
      />
      <div style={{ position: 'relative' }}>
        <input
          type={showSecret ? 'text' : 'password'}
          placeholder="Secret Key"
          value={form.secretKey}
          onChange={e => setForm(f => ({ ...f, secretKey: e.target.value }))}
          style={{ ...inputStyle, paddingRight: 36 }}
          autoComplete="off"
        />
        <button type="button" onClick={() => setShowSecret(s => !s)} style={{
          position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)',
          background: 'none', border: 'none', cursor: 'pointer', color: T.fg3, padding: 0,
        }}>
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
            {showSecret
              ? <><path d="M1 7s2-4 6-4 6 4 6 4-2 4-6 4-6-4-6-4z" stroke={T.fg2} strokeWidth="1.2"/><circle cx="7" cy="7" r="1.8" stroke={T.fg2} strokeWidth="1.2"/></>
              : <><path d="M1 7s2-4 6-4 6 4 6 4-2 4-6 4-6-4-6-4z" stroke={T.fg2} strokeWidth="1.2"/><line x1="2" y1="2" x2="12" y2="12" stroke={T.fg2} strokeWidth="1.2" strokeLinecap="round"/></>
            }
          </svg>
        </button>
      </div>
      {error && <div style={{ fontFamily: T.sans, fontSize: 11, color: '#e05555' }}>{error}</div>}
      <button type="submit" disabled={loading || !form.apiKey || !form.secretKey} style={{
        display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 7,
        fontFamily: T.sans, fontSize: 13, color: T.fg0,
        background: T.bg2, border: `1px solid ${T.border1}`,
        borderRadius: 8, padding: '9px 0', cursor: loading ? 'wait' : 'pointer',
        opacity: (!form.apiKey || !form.secretKey) ? 0.5 : 1,
        transition: 'all 150ms',
      }}>
        {loading ? <Spinner size={14} /> : 'Connect Binance account'}
      </button>
    </form>
  );
}

// ── Main ──────────────────────────────────────────────────────────────────────
export default function BinanceAssets({ clerkUserId }) {
  const { T } = useTheme();
  const { getToken } = useAuth();
  const [data, setData]         = useState(null);
  const [loading, setLoading]   = useState(true);
  const [showForm, setShowForm] = useState(false);

  async function fetchSummary() {
    try {
      const token = await getToken();
      const r = await fetch(`${API}/api/binance/summary/${clerkUserId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!r.ok) throw new Error(await r.text());
      setData(await r.json());
    } catch (e) {
      console.error('[Binance]', e);
      setData({ connected: false });
    } finally {
      setLoading(false);
    }
  }

  async function removeKey(keyId) {
    const token = await getToken();
    await fetch(`${API}/api/binance/keys/${clerkUserId}/${keyId}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${token}` },
    });
    fetchSummary();
  }

  useEffect(() => { if (clerkUserId) fetchSummary(); }, [clerkUserId]);

  if (loading) return (
    <div style={{ display: 'flex', justifyContent: 'center', paddingTop: 60 }}><Spinner /></div>
  );

  const { accounts = [], totalUSD } = data || {};
  const hasAccounts = accounts.length > 0;

  return (
    <div style={{ width: '100%', maxWidth: 760, margin: '0 auto', display: 'flex', flexDirection: 'column', gap: 14 }}>

      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ fontFamily: T.sans, fontSize: 11, color: T.fg2, textTransform: 'uppercase', letterSpacing: '0.08em' }}>
          Crypto · Binance{accounts.length > 0 ? ` · ${accounts.length} account${accounts.length > 1 ? 's' : ''}` : ''}
        </div>
        <button onClick={() => setShowForm(s => !s)} style={{
          display: 'inline-flex', alignItems: 'center', gap: 6,
          fontFamily: T.sans, fontSize: 11, color: T.fg1,
          background: T.bg2, border: `1px solid ${T.border1}`,
          borderRadius: 7, padding: '5px 10px', cursor: 'pointer',
        }}>
          <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
            <path d="M5 1v8M1 5h8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
          </svg>
          Add account
        </button>
      </div>

      {/* Add key form */}
      {(showForm || !hasAccounts) && (
        <div style={{ background: T.bg1, border: `1px solid ${T.border0}`, borderRadius: 10, padding: '18px 20px' }}>
          <div style={{ fontFamily: T.sans, fontSize: 9, color: T.fg2, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 14 }}>
            {hasAccounts ? 'Add another Binance account' : 'Connect your Binance account'}
          </div>
          {!hasAccounts && (
            <p style={{ fontFamily: T.sans, fontSize: 13, color: T.fg1, lineHeight: 1.6, marginBottom: 16 }}>
              Enter a read-only Binance API key. The secret key is stored securely on the server and never exposed.
            </p>
          )}
          <AddKeyForm clerkUserId={clerkUserId} onAdded={() => { setShowForm(false); fetchSummary(); }} />
        </div>
      )}

      {/* Total KPI */}
      {hasAccounts && (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10 }}>
          <div style={{
            flex: '1 1 140px', background: T.bg1, border: `1px solid ${T.border0}`,
            borderRadius: 10, padding: '14px 16px',
          }}>
            <div style={{ fontFamily: T.sans, fontSize: 9, color: T.fg2, textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 7 }}>
              Total portfolio value
            </div>
            <div style={{ fontFamily: T.mono, fontSize: 24, fontWeight: 500, letterSpacing: '-1px', color: T.greenText }}>
              {fmt(totalUSD)}
            </div>
          </div>
        </div>
      )}

      {/* Per-account breakdown */}
      {accounts.map(account => (
        <div key={account.keyId} style={{ background: T.bg1, border: `1px solid ${T.border0}`, borderRadius: 10, overflow: 'hidden' }}>
          {/* Account header */}
          <div style={{
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            padding: '12px 20px', borderBottom: `1px solid ${T.border0}`,
            background: T.bg2,
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <BinanceLogo size={16} />
              <span style={{ fontFamily: T.sans, fontSize: 12, color: T.fg0, fontWeight: 500 }}>{account.label}</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <span style={{ fontFamily: T.mono, fontSize: 13, color: T.greenText }}>{fmt(account.totalUSD)}</span>
              <button onClick={() => removeKey(account.keyId)} style={{
                background: 'none', border: 'none', cursor: 'pointer', color: T.fg3, padding: 2,
                fontSize: 14, lineHeight: 1,
              }} title="Remove">×</button>
            </div>
          </div>

          {/* Balance table */}
          <div style={{ padding: '4px 0' }}>
            {account.balances.map(b => {
              const pct = account.totalUSD > 0 && b.valueUSD != null
                ? (b.valueUSD / account.totalUSD) * 100 : 0;
              return (
                <div key={b.asset} style={{
                  display: 'flex', alignItems: 'center', gap: 12,
                  padding: '9px 20px',
                  borderBottom: `1px solid ${T.border0}`,
                }}>
                  {/* Asset */}
                  <div style={{ width: 52, fontFamily: T.mono, fontSize: 12, fontWeight: 600, color: T.fg0, flexShrink: 0 }}>
                    {b.asset}
                  </div>
                  {/* Bar */}
                  <div style={{ flex: 1, height: 4, background: T.bg2, borderRadius: 2, overflow: 'hidden' }}>
                    <div style={{ width: `${pct}%`, height: '100%', background: '#F0B90B', borderRadius: 2, transition: 'width 400ms' }} />
                  </div>
                  {/* Amount */}
                  <div style={{ fontFamily: T.mono, fontSize: 11, color: T.fg2, width: 90, textAlign: 'right', flexShrink: 0 }}>
                    {fmtCrypto(b.total)}
                  </div>
                  {/* USD value */}
                  <div style={{ fontFamily: T.mono, fontSize: 12, color: T.fg0, width: 80, textAlign: 'right', flexShrink: 0 }}>
                    {b.valueUSD != null ? fmt(b.valueUSD) : <span style={{ color: T.fg3 }}>—</span>}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ))}

    </div>
  );
}

function BinanceLogo({ size = 18 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" fill="none" style={{ flexShrink: 0 }}>
      <rect width="32" height="32" rx="16" fill="#F0B90B"/>
      <path d="M16 6l2.5 2.5-6.5 6.5-2.5-2.5L16 6z" fill="white"/>
      <path d="M16 6l-2.5 2.5 6.5 6.5 2.5-2.5L16 6z" fill="white" opacity="0.6"/>
      <path d="M8 14l2.5 2.5L8 19l-2.5-2.5L8 14z" fill="white"/>
      <path d="M24 14l2.5 2.5-2.5 2.5-2.5-2.5L24 14z" fill="white"/>
      <path d="M16 26l-2.5-2.5 6.5-6.5 2.5 2.5L16 26z" fill="white"/>
      <path d="M16 26l2.5-2.5-6.5-6.5-2.5 2.5L16 26z" fill="white" opacity="0.6"/>
      <path d="M13.5 13.5l2.5-2.5 2.5 2.5-2.5 2.5z" fill="white"/>
    </svg>
  );
}
