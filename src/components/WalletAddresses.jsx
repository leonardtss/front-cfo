import { useEffect, useState } from 'react';
import { useAuth } from '@clerk/react';
import { useTheme } from '../ThemeContext';

const API = import.meta.env.VITE_API_URL;

const CHAIN_COLORS = { BTC: '#F7931A', ETH: '#627EEA', SOL: '#9945FF' };
const CHAIN_LABELS = { BTC: 'Bitcoin', ETH: 'Ethereum', SOL: 'Solana' };

function detectChain(address) {
  if (/^(bc1|[13])[a-zA-HJ-NP-Z0-9]{24,}$/.test(address)) return 'BTC';
  if (/^0x[0-9a-fA-F]{40}$/.test(address))                 return 'ETH';
  if (/^[1-9A-HJ-NP-Za-km-z]{32,44}$/.test(address))       return 'SOL';
  return null;
}

function fmt(val) {
  if (val == null || isNaN(val)) return '—';
  if (Math.abs(val) >= 1_000_000) return `$${(val / 1_000_000).toFixed(2)}M`;
  if (Math.abs(val) >= 1_000)     return `$${(val / 1_000).toFixed(1)}k`;
  return `$${val.toFixed(2)}`;
}

function fmtBalance(val, chain) {
  if (val == null || isNaN(val)) return '—';
  if (chain === 'BTC') return val.toFixed(8);
  if (chain === 'ETH') return val.toFixed(6);
  return val.toFixed(4);
}

function truncAddr(addr) {
  if (!addr) return '';
  return `${addr.slice(0, 6)}…${addr.slice(-4)}`;
}

function Spinner({ size = 24 }) {
  const { T } = useTheme();
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none"
      style={{ animation: 'spin 0.8s linear infinite', display: 'block', flexShrink: 0 }}>
      <circle cx="12" cy="12" r="10" stroke={T.border1} strokeWidth="2" />
      <path d="M12 2 A10 10 0 0 1 22 12" stroke={T.greenBright} strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}

function ChainBadge({ chain }) {
  const color = CHAIN_COLORS[chain] || '#888';
  return (
    <span style={{
      fontFamily: 'monospace', fontSize: 10, fontWeight: 700,
      color, background: `${color}18`, border: `1px solid ${color}44`,
      borderRadius: 5, padding: '2px 7px', flexShrink: 0,
    }}>
      {chain}
    </span>
  );
}

export default function WalletAddresses({ clerkUserId }) {
  const { T } = useTheme();
  const { getToken } = useAuth();

  const [data, setData]         = useState(null);
  const [loading, setLoading]   = useState(true);
  const [adding, setAdding]     = useState(false);
  const [deleting, setDeleting] = useState(null);
  const [form, setForm]         = useState({ label: '', address: '' });
  const [formError, setFormError] = useState('');
  const [showForm, setShowForm] = useState(false);

  async function fetchSummary() {
    setLoading(true);
    try {
      const token = await getToken();
      const r = await fetch(`${API}/api/wallets/summary/${clerkUserId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!r.ok) throw new Error(await r.text());
      setData(await r.json());
    } catch (e) {
      console.error('[Wallets]', e);
      setData({ wallets: [], totalUSD: 0 });
    } finally {
      setLoading(false);
    }
  }

  async function addWallet() {
    const chain = detectChain(form.address.trim());
    if (!form.label.trim()) { setFormError('Label required'); return; }
    if (!chain)              { setFormError('Unrecognized address — must be BTC, ETH, or SOL'); return; }
    setAdding(true);
    setFormError('');
    try {
      const token = await getToken();
      const r = await fetch(`${API}/api/wallets/addresses/${clerkUserId}`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ label: form.label.trim(), address: form.address.trim(), chain }),
      });
      if (!r.ok) throw new Error(await r.text());
      setForm({ label: '', address: '' });
      setShowForm(false);
      await fetchSummary();
    } catch (e) {
      setFormError(e.message);
    } finally {
      setAdding(false);
    }
  }

  async function removeWallet(id) {
    setDeleting(id);
    try {
      const token = await getToken();
      await fetch(`${API}/api/wallets/addresses/${clerkUserId}/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });
      await fetchSummary();
    } finally {
      setDeleting(null);
    }
  }

  useEffect(() => { if (clerkUserId) fetchSummary(); }, [clerkUserId]);

  const detectedChain = detectChain(form.address.trim());

  if (loading) return (
    <div style={{ display: 'flex', justifyContent: 'center', paddingTop: 60 }}>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      <Spinner />
    </div>
  );

  const { wallets = [], totalUSD } = data || {};

  return (
    <div style={{ width: '100%', maxWidth: 760, margin: '0 auto', display: 'flex', flexDirection: 'column', gap: 14 }}>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>

      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ fontFamily: T.sans, fontSize: 11, color: T.fg2, textTransform: 'uppercase', letterSpacing: '0.08em' }}>
          Wallets · Self-custody{wallets.length > 0 ? ` · ${wallets.length} address${wallets.length > 1 ? 'es' : ''}` : ''}
        </div>
        <button onClick={() => { setShowForm(f => !f); setFormError(''); }} style={{
          fontFamily: T.sans, fontSize: 11, color: showForm ? T.fg0 : T.greenText,
          background: 'none', border: `1px solid ${showForm ? T.border1 : T.greenBright}`,
          borderRadius: 7, padding: '5px 10px', cursor: 'pointer',
        }}>
          {showForm ? 'Cancel' : '+ Add address'}
        </button>
      </div>

      {/* Add form */}
      {showForm && (
        <div style={{ background: T.bg1, border: `1px solid ${T.border0}`, borderRadius: 10, padding: '16px 20px', display: 'flex', flexDirection: 'column', gap: 10 }}>
          <div style={{ display: 'flex', gap: 10 }}>
            <input
              placeholder="Label (e.g. Ledger main)"
              value={form.label}
              onChange={e => setForm(f => ({ ...f, label: e.target.value }))}
              style={{
                flex: 1, fontFamily: T.sans, fontSize: 13, color: T.fg0,
                background: T.bg2, border: `1px solid ${T.border1}`, borderRadius: 8,
                padding: '9px 12px', outline: 'none',
              }}
            />
          </div>
          <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
            <input
              placeholder="Public address (BTC, ETH or SOL)"
              value={form.address}
              onChange={e => setForm(f => ({ ...f, address: e.target.value }))}
              style={{
                flex: 1, fontFamily: 'monospace', fontSize: 12, color: T.fg0,
                background: T.bg2, border: `1px solid ${T.border1}`, borderRadius: 8,
                padding: '9px 12px', outline: 'none',
              }}
            />
            {detectedChain && <ChainBadge chain={detectedChain} />}
          </div>
          {formError && (
            <div style={{ fontFamily: T.sans, fontSize: 12, color: '#e05555' }}>{formError}</div>
          )}
          <button
            onClick={addWallet}
            disabled={adding}
            style={{
              alignSelf: 'flex-start', display: 'inline-flex', alignItems: 'center', gap: 8,
              fontFamily: T.sans, fontSize: 13, fontWeight: 500,
              color: T.bg0, background: T.greenBright,
              border: 'none', borderRadius: 8, padding: '9px 20px',
              cursor: adding ? 'default' : 'pointer', opacity: adding ? 0.6 : 1,
            }}
          >
            {adding && <Spinner size={14} />}
            {adding ? 'Adding…' : 'Add wallet'}
          </button>
        </div>
      )}

      {/* Total */}
      {wallets.length > 0 && (
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

      {/* Wallet list */}
      {wallets.length > 0 && (
        <div style={{ background: T.bg1, border: `1px solid ${T.border0}`, borderRadius: 10, overflow: 'hidden' }}>
          <div style={{
            display: 'flex', alignItems: 'center', gap: 8,
            padding: '12px 20px', borderBottom: `1px solid ${T.border0}`, background: T.bg2,
          }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={T.fg2} strokeWidth="1.5" strokeLinecap="round">
              <rect x="2" y="7" width="20" height="14" rx="2"/>
              <path d="M16 7V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v2"/>
              <line x1="12" y1="12" x2="12" y2="16"/>
              <line x1="10" y1="14" x2="14" y2="14"/>
            </svg>
            <span style={{ fontFamily: T.sans, fontSize: 12, color: T.fg0, fontWeight: 500 }}>Self-custody wallets</span>
          </div>
          <div style={{ padding: '4px 0' }}>
            {wallets.map(w => {
              const pct = totalUSD > 0 && w.valueUSD != null ? (w.valueUSD / totalUSD) * 100 : 0;
              const color = CHAIN_COLORS[w.chain] || T.greenBright;
              return (
                <div key={w.id} style={{
                  display: 'flex', alignItems: 'center', gap: 12,
                  padding: '10px 20px', borderBottom: `1px solid ${T.border0}`,
                }}>
                  <ChainBadge chain={w.chain} />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontFamily: T.sans, fontSize: 12, color: T.fg0, fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {w.label}
                    </div>
                    <div style={{ fontFamily: 'monospace', fontSize: 10, color: T.fg3, marginTop: 2 }}>
                      {truncAddr(w.address)}
                    </div>
                  </div>
                  <div style={{ flex: 1, height: 4, background: T.bg2, borderRadius: 2, overflow: 'hidden' }}>
                    <div style={{ width: `${pct}%`, height: '100%', background: color, borderRadius: 2, transition: 'width 400ms' }} />
                  </div>
                  <div style={{ fontFamily: T.mono, fontSize: 11, color: T.fg2, width: 110, textAlign: 'right', flexShrink: 0 }}>
                    {w.balance != null ? fmtBalance(w.balance, w.chain) : <span style={{ color: '#e05555', fontSize: 10 }}>{w.error || 'error'}</span>}
                  </div>
                  <div style={{ fontFamily: T.mono, fontSize: 12, color: T.fg0, width: 80, textAlign: 'right', flexShrink: 0 }}>
                    {w.valueUSD != null ? fmt(w.valueUSD) : <span style={{ color: T.fg3 }}>—</span>}
                  </div>
                  <button
                    onClick={() => removeWallet(w.id)}
                    disabled={deleting === w.id}
                    style={{
                      width: 22, height: 22, borderRadius: 6, border: `1px solid ${T.border1}`,
                      background: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
                      color: T.fg3, flexShrink: 0, opacity: deleting === w.id ? 0.4 : 1,
                    }}
                    title="Remove"
                  >
                    <svg width="10" height="10" viewBox="0 0 10 10" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
                      <line x1="1" y1="1" x2="9" y2="9"/><line x1="9" y1="1" x2="1" y2="9"/>
                    </svg>
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {wallets.length === 0 && !showForm && (
        <div style={{ background: T.bg1, border: `1px solid ${T.border0}`, borderRadius: 10, padding: '40px 24px', textAlign: 'center' }}>
          <div style={{ fontFamily: T.serif, fontSize: 22, color: T.fg0, letterSpacing: '-0.5px', marginBottom: 10 }}>
            Track your wallets
          </div>
          <p style={{ fontFamily: T.sans, fontSize: 13, color: T.fg2, lineHeight: 1.65, fontWeight: 300, marginBottom: 24, maxWidth: 360, margin: '0 auto 24px' }}>
            Add any public BTC, ETH or SOL address — Ledger, Exodus, MetaMask, etc.
            Balances are read-only from public blockchains.
          </p>
          <button
            onClick={() => setShowForm(true)}
            style={{
              fontFamily: T.sans, fontSize: 13, fontWeight: 500,
              color: T.bg0, background: T.greenBright,
              border: 'none', borderRadius: 8, padding: '10px 22px',
              cursor: 'pointer',
            }}
          >
            + Add first address
          </button>
        </div>
      )}
    </div>
  );
}
