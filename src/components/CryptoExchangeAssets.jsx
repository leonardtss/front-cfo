import { useEffect, useState } from 'react';
import { useAuth } from '@clerk/react';
import { useTheme } from '../ThemeContext';

const API = import.meta.env.VITE_API_URL;

// ── Exchange configurations ───────────────────────────────────────────────────
const EXCHANGES = {
  coinspot: {
    name: 'CoinSpot',
    color: '#00C853',
    fields: [
      { key: 'apiKey',    label: 'API Key',    secret: false },
      { key: 'secretKey', label: 'Secret Key', secret: true  },
    ],
  },
  huobi: {
    name: 'Huobi (HTX)',
    color: '#1673B9',
    fields: [
      { key: 'apiKey',    label: 'API Key',    secret: false },
      { key: 'secretKey', label: 'Secret Key', secret: true  },
    ],
  },
  kucoin: {
    name: 'KuCoin',
    color: '#00A3FF',
    fields: [
      { key: 'apiKey',    label: 'API Key',    secret: false },
      { key: 'secretKey', label: 'Secret Key', secret: true  },
      { key: 'passphrase', label: 'Passphrase', secret: true },
    ],
  },
};

// ── Helpers ───────────────────────────────────────────────────────────────────
function fmt(val) {
  if (val == null || isNaN(val)) return '—';
  if (Math.abs(val) >= 1_000_000) return `$${(val / 1_000_000).toFixed(2)}M`;
  if (Math.abs(val) >= 1_000)     return `$${(val / 1_000).toFixed(1)}k`;
  return `$${val.toFixed(2)}`;
}

function fmtCrypto(val) {
  if (val == null || isNaN(val)) return '—';
  if (val >= 1)       return val.toFixed(4);
  if (val >= 0.0001)  return val.toFixed(6);
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

// ── Exchange logo ─────────────────────────────────────────────────────────────
function ExchangeLogo({ exchange, size = 16 }) {
  const cfg = EXCHANGES[exchange];
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" fill="none" style={{ flexShrink: 0 }}>
      <rect width="32" height="32" rx="16" fill={cfg.color} />
      <text x="16" y="21" textAnchor="middle" fill="white"
        style={{ fontSize: exchange === 'kucoin' ? 10 : 12, fontWeight: 700, fontFamily: 'sans-serif' }}>
        {exchange === 'coinspot' ? 'CS' : exchange === 'huobi' ? 'H' : 'KC'}
      </text>
    </svg>
  );
}

// ── Add key form ──────────────────────────────────────────────────────────────
function AddKeyForm({ exchange, clerkUserId, onAdded }) {
  const { T } = useTheme();
  const { getToken } = useAuth();
  const cfg = EXCHANGES[exchange];

  const emptyForm = Object.fromEntries([...cfg.fields.map(f => [f.key, '']), ['label', '']]);
  const [form, setForm]     = useState(emptyForm);
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState(null);
  const [shown, setShown]     = useState({});

  async function submit(e) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const token = await getToken();
      const r = await fetch(`${API}/api/${exchange}/keys/${clerkUserId}`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      const json = await r.json();
      if (!r.ok) throw new Error(json.error || 'Error');
      setForm(emptyForm);
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

  const allFilled = cfg.fields.every(f => form[f.key]);

  return (
    <form onSubmit={submit} style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
      <input
        placeholder="Label (ex: Mon compte principal)"
        value={form.label}
        onChange={e => setForm(f => ({ ...f, label: e.target.value }))}
        style={{ ...inputStyle, fontFamily: T.sans }}
      />
      {cfg.fields.map(field => (
        <div key={field.key} style={{ position: 'relative' }}>
          <input
            type={field.secret && !shown[field.key] ? 'password' : 'text'}
            placeholder={field.label}
            value={form[field.key]}
            onChange={e => setForm(f => ({ ...f, [field.key]: e.target.value }))}
            style={{ ...inputStyle, paddingRight: field.secret ? 36 : 11 }}
            autoComplete="off"
          />
          {field.secret && (
            <button type="button" onClick={() => setShown(s => ({ ...s, [field.key]: !s[field.key] }))} style={{
              position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)',
              background: 'none', border: 'none', cursor: 'pointer', color: T.fg3, padding: 0,
            }}>
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                {shown[field.key]
                  ? <><path d="M1 7s2-4 6-4 6 4 6 4-2 4-6 4-6-4-6-4z" stroke={T.fg2} strokeWidth="1.2"/><circle cx="7" cy="7" r="1.8" stroke={T.fg2} strokeWidth="1.2"/></>
                  : <><path d="M1 7s2-4 6-4 6 4 6 4-2 4-6 4-6-4-6-4z" stroke={T.fg2} strokeWidth="1.2"/><line x1="2" y1="2" x2="12" y2="12" stroke={T.fg2} strokeWidth="1.2" strokeLinecap="round"/></>
                }
              </svg>
            </button>
          )}
        </div>
      ))}
      {error && <div style={{ fontFamily: T.sans, fontSize: 11, color: '#e05555' }}>{error}</div>}
      <button type="submit" disabled={loading || !allFilled} style={{
        display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 7,
        fontFamily: T.sans, fontSize: 13, color: T.fg0,
        background: T.bg2, border: `1px solid ${T.border1}`,
        borderRadius: 8, padding: '9px 0', cursor: loading ? 'wait' : 'pointer',
        opacity: !allFilled ? 0.5 : 1, transition: 'all 150ms',
      }}>
        {loading ? <Spinner size={14} /> : `Connect ${cfg.name}`}
      </button>
    </form>
  );
}

// ── Main ──────────────────────────────────────────────────────────────────────
export default function CryptoExchangeAssets({ exchange, clerkUserId }) {
  const { T } = useTheme();
  const { getToken } = useAuth();
  const cfg = EXCHANGES[exchange];

  const [data, setData]         = useState(null);
  const [loading, setLoading]   = useState(true);
  const [showForm, setShowForm] = useState(false);

  async function fetchSummary() {
    setLoading(true);
    try {
      const token = await getToken();
      const r = await fetch(`${API}/api/${exchange}/summary/${clerkUserId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!r.ok) throw new Error(await r.text());
      setData(await r.json());
    } catch (e) {
      console.error(`[${exchange}]`, e);
      setData({ connected: false });
    } finally {
      setLoading(false);
    }
  }

  async function removeKey(keyId) {
    const token = await getToken();
    await fetch(`${API}/api/${exchange}/keys/${clerkUserId}/${keyId}`, {
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
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>

      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ fontFamily: T.sans, fontSize: 11, color: T.fg2, textTransform: 'uppercase', letterSpacing: '0.08em' }}>
          Crypto · {cfg.name}{accounts.length > 0 ? ` · ${accounts.length} account${accounts.length > 1 ? 's' : ''}` : ''}
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
            {hasAccounts ? `Add another ${cfg.name} account` : `Connect your ${cfg.name} account`}
          </div>
          {!hasAccounts && (
            <p style={{ fontFamily: T.sans, fontSize: 13, color: T.fg1, lineHeight: 1.6, marginBottom: 16 }}>
              Enter a read-only {cfg.name} API key. The secret is stored securely on the server and never exposed.
            </p>
          )}
          <AddKeyForm exchange={exchange} clerkUserId={clerkUserId} onAdded={() => { setShowForm(false); fetchSummary(); }} />
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
          <div style={{
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            padding: '12px 20px', borderBottom: `1px solid ${T.border0}`, background: T.bg2,
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <ExchangeLogo exchange={exchange} size={16} />
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

          <div style={{ padding: '4px 0' }}>
            {account.balances.map(b => {
              const pct = account.totalUSD > 0 && b.valueUSD != null
                ? (b.valueUSD / account.totalUSD) * 100 : 0;
              return (
                <div key={b.asset} style={{
                  display: 'flex', alignItems: 'center', gap: 12,
                  padding: '9px 20px', borderBottom: `1px solid ${T.border0}`,
                }}>
                  <div style={{ width: 52, fontFamily: T.mono, fontSize: 12, fontWeight: 600, color: T.fg0, flexShrink: 0 }}>
                    {b.asset}
                  </div>
                  <div style={{ flex: 1, height: 4, background: T.bg2, borderRadius: 2, overflow: 'hidden' }}>
                    <div style={{ width: `${pct}%`, height: '100%', background: cfg.color, borderRadius: 2, transition: 'width 400ms' }} />
                  </div>
                  <div style={{ fontFamily: T.mono, fontSize: 11, color: T.fg2, width: 90, textAlign: 'right', flexShrink: 0 }}>
                    {fmtCrypto(b.total)}
                  </div>
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
