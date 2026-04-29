import { useEffect, useState } from 'react';
import { useAuth, useUser } from '@clerk/react';
import { useTheme } from '../ThemeContext';

const API = import.meta.env.VITE_API_URL;

// ── Helpers ───────────────────────────────────────────────────────────────────
function fmt(val) {
  if (val == null || isNaN(val)) return '—';
  if (Math.abs(val) >= 1_000_000) return `$${(val / 1_000_000).toFixed(2)}M`;
  if (Math.abs(val) >= 1_000)     return `$${(val / 1_000).toFixed(1)}k`;
  return new Intl.NumberFormat('en-AU', { style: 'currency', currency: 'AUD', maximumFractionDigits: 0 }).format(val);
}

function fmtDate(raw) {
  if (!raw) return '—';
  const d = new Date(raw);
  if (isNaN(d)) return raw;
  return d.toLocaleDateString('fr-AU', { day: '2-digit', month: 'short' });
}

function Spinner({ size = 20 }) {
  const { T } = useTheme();
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none"
      style={{ animation: 'spin 0.8s linear infinite', display: 'block' }}>
      <circle cx="12" cy="12" r="10" stroke={T.border1} strokeWidth="2" />
      <path d="M12 2 A10 10 0 0 1 22 12" stroke={T.greenBright} strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}

// ── Account card ──────────────────────────────────────────────────────────────
function AccountCard({ account, active, onClick }) {
  const { T } = useTheme();
  return (
    <button onClick={onClick} style={{
      width: '100%', textAlign: 'left', cursor: 'pointer',
      display: 'flex', alignItems: 'center', gap: 10,
      padding: '10px 12px',
      background: active ? `${T.greenBright}08` : T.bg2,
      border: `1px solid ${active ? T.greenBright + '40' : T.border0}`,
      borderRadius: 8, transition: 'all 150ms',
    }}>
      <div style={{
        width: 32, height: 32, borderRadius: 8, flexShrink: 0,
        background: T.bg1, border: `1px solid ${T.border0}`,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}>
        <AccountIcon type={account.type} />
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontFamily: T.sans, fontSize: 12, color: T.fg0, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
          {account.name}
        </div>
        {account.accountNo && (
          <div style={{ fontFamily: T.mono, fontSize: 9, color: T.fg3, marginTop: 2 }}>
            {account.accountNo}
          </div>
        )}
      </div>
      <div style={{ fontFamily: T.mono, fontSize: 13, color: account.balance >= 0 ? T.fg0 : '#ef5350', flexShrink: 0 }}>
        {fmt(account.balance)}
      </div>
    </button>
  );
}

function AccountIcon({ type }) {
  const { T } = useTheme();
  // savings, transaction, credit-card, loan, mortgage, investment
  if (type === 'credit-card') {
    return (
      <svg width="13" height="10" viewBox="0 0 13 10" fill="none">
        <rect x="0.5" y="0.5" width="12" height="9" rx="1.5" stroke={T.fg2} strokeWidth="1"/>
        <line x1="0.5" y1="3.5" x2="12.5" y2="3.5" stroke={T.fg2} strokeWidth="1"/>
        <rect x="2" y="5.5" width="3" height="1.5" rx="0.5" fill={T.fg3}/>
      </svg>
    );
  }
  if (type === 'loan' || type === 'mortgage') {
    return (
      <svg width="13" height="13" viewBox="0 0 13 13" fill="none">
        <path d="M6.5 1L12 5.5V12H1V5.5L6.5 1Z" stroke={T.fg2} strokeWidth="1" strokeLinejoin="round"/>
        <rect x="4.5" y="8" width="4" height="4" rx="0.5" stroke={T.fg2} strokeWidth="1"/>
      </svg>
    );
  }
  return (
    <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
      <rect x="0.5" y="2.5" width="11" height="9" rx="1.5" stroke={T.fg2} strokeWidth="1"/>
      <path d="M3.5 2.5V1.5a1 1 0 011-1h3a1 1 0 011 1v1" stroke={T.fg2} strokeWidth="1"/>
      <line x1="3" y1="6" x2="9" y2="6" stroke={T.fg2} strokeWidth="1" strokeLinecap="round"/>
      <line x1="3" y1="8.5" x2="7" y2="8.5" stroke={T.fg2} strokeWidth="1" strokeLinecap="round"/>
    </svg>
  );
}

// ── Transaction row ───────────────────────────────────────────────────────────
function TxRow({ tx }) {
  const { T } = useTheme();
  const isCredit = tx.direction === 'credit';
  return (
    <div style={{
      display: 'flex', alignItems: 'flex-start', gap: 10,
      padding: '9px 0',
      borderBottom: `1px solid ${T.border0}`,
    }}>
      <div style={{
        width: 28, height: 28, borderRadius: 7, flexShrink: 0, marginTop: 1,
        background: isCredit ? `${T.greenBright}12` : `${'#ef5350'}10`,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}>
        <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
          {isCredit
            ? <path d="M5 8V2M2 5l3 3 3-3" stroke={T.greenBright} strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"/>
            : <path d="M5 2v6M2 5l3-3 3 3" stroke="#ef5350" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"/>
          }
        </svg>
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontFamily: T.sans, fontSize: 11, color: T.fg0, lineHeight: 1.4, marginBottom: 1 }}>
          {tx.description || '—'}
        </div>
        <div style={{ fontFamily: T.sans, fontSize: 10, color: T.fg3 }}>
          {fmtDate(tx.date)}{tx.class ? ` · ${tx.class}` : ''}
        </div>
      </div>
      <div style={{
        fontFamily: T.mono, fontSize: 13,
        color: isCredit ? T.greenText : '#ef5350',
        flexShrink: 0, paddingTop: 1,
      }}>
        {isCredit ? '+' : '-'}{fmt(Math.abs(tx.amount))}
      </div>
    </div>
  );
}

// ── Main ──────────────────────────────────────────────────────────────────────
export default function BasiqAccounts({ clerkUserId }) {
  const { T } = useTheme();
  const { getToken } = useAuth();
  const { user }     = useUser();
  const [data, setData]           = useState(null);
  const [loading, setLoading]     = useState(true);
  const [connecting, setConnecting] = useState(false);
  const [error, setError]         = useState(null);
  const [activeAccount, setActiveAccount] = useState(null);

  async function fetchSummary() {
    try {
      const token = await getToken();
      const r = await fetch(`${API}/api/basiq/summary/${clerkUserId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!r.ok) throw new Error(await r.text());
      const json = await r.json();
      setData(json);
      if (!json.connected) setData({ connected: false });
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (!clerkUserId) return;
    fetchSummary();
  }, [clerkUserId]);

  async function connectBank() {
    setConnecting(true);
    try {
      const token = await getToken();
      const r = await fetch(
        `${API}/api/basiq/connect/${clerkUserId}?email=${encodeURIComponent(user?.emailAddresses?.[0]?.emailAddress || '')}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      if (!r.ok) throw new Error(await r.text());
      const { url } = await r.json();
      window.location.href = url;
    } catch (e) {
      setError(e.message);
      setConnecting(false);
    }
  }

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', paddingTop: 60 }}>
        <Spinner size={24} />
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ maxWidth: 680, margin: '0 auto' }}>
        <div style={{ fontFamily: T.sans, fontSize: 13, color: '#e05555', padding: '24px 0', textAlign: 'center' }}>
          {error}
        </div>
        <div style={{ display: 'flex', justifyContent: 'center' }}>
          <ConnectButton onClick={connectBank} loading={connecting} hasAccounts={false} />
        </div>
      </div>
    );
  }

  const { accounts = [], transactions = [], totalBalance, summary } = data || {};
  const hasAccounts = accounts.length > 0;

  // Filter transactions by active account
  const visibleTx = activeAccount
    ? transactions.filter(t => t.accountId === activeAccount)
    : transactions;

  if (!hasAccounts) {
    return (
      <div style={{ maxWidth: 440, margin: '0 auto', paddingTop: 40 }}>
        <div style={{ fontFamily: T.serif, fontSize: 28, color: T.fg0, letterSpacing: '-0.8px', marginBottom: 10 }}>
          Connectez votre banque.
        </div>
        <p style={{ fontFamily: T.sans, fontSize: 14, color: T.fg1, lineHeight: 1.65, fontWeight: 300, marginBottom: 28 }}>
          CFO Black récupère vos soldes et mouvements en temps réel depuis votre banque via Basiq.
        </p>
        <ConnectButton onClick={connectBank} loading={connecting} hasAccounts={false} />
      </div>
    );
  }

  return (
    <div style={{ width: '100%', maxWidth: 760, margin: '0 auto', display: 'flex', flexDirection: 'column', gap: 14 }}>

      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ fontFamily: T.sans, fontSize: 11, color: T.fg2, textTransform: 'uppercase', letterSpacing: '0.08em' }}>
          Comptes bancaires · {accounts.length} compte{accounts.length !== 1 ? 's' : ''}
        </div>
        <ConnectButton onClick={connectBank} loading={connecting} hasAccounts small />
      </div>

      {/* Summary KPIs */}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10 }}>
        {[
          { label: 'Solde total',  value: totalBalance, color: T.fg0 },
          { label: 'Entrants (30j)', value: summary?.credits, color: T.greenText },
          { label: 'Sortants (30j)', value: summary?.debits,  color: '#ef5350' },
          { label: 'Net (30j)',    value: summary?.net, color: (summary?.net ?? 0) >= 0 ? T.greenText : '#ef5350' },
        ].map(({ label, value, color }) => (
          <div key={label} style={{
            flex: '1 1 140px', background: T.bg1, border: `1px solid ${T.border0}`,
            borderRadius: 10, padding: '14px 16px',
          }}>
            <div style={{ fontFamily: T.sans, fontSize: 9, color: T.fg2, textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 7 }}>
              {label}
            </div>
            <div style={{ fontFamily: T.mono, fontSize: 20, fontWeight: 500, letterSpacing: '-0.8px', color }}>
              {fmt(value)}
            </div>
          </div>
        ))}
      </div>

      {/* Accounts list */}
      <div style={{ background: T.bg1, border: `1px solid ${T.border0}`, borderRadius: 10, padding: '16px 20px' }}>
        <div style={{ fontFamily: T.sans, fontSize: 9, color: T.fg2, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 12 }}>
          Comptes
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          {accounts.map(a => (
            <AccountCard
              key={a.id}
              account={a}
              active={activeAccount === a.id}
              onClick={() => setActiveAccount(prev => prev === a.id ? null : a.id)}
            />
          ))}
        </div>
      </div>

      {/* Transactions */}
      {visibleTx.length > 0 && (
        <div style={{ background: T.bg1, border: `1px solid ${T.border0}`, borderRadius: 10, padding: '16px 20px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
            <div style={{ fontFamily: T.sans, fontSize: 9, color: T.fg2, textTransform: 'uppercase', letterSpacing: '0.08em' }}>
              Mouvements récents {activeAccount ? '· compte sélectionné' : '· tous comptes'}
            </div>
            {activeAccount && (
              <button onClick={() => setActiveAccount(null)} style={{
                fontFamily: T.sans, fontSize: 10, color: T.fg2, background: 'none',
                border: 'none', cursor: 'pointer', textDecoration: 'underline',
                textDecorationColor: T.border1, padding: 0,
              }}>
                Voir tous
              </button>
            )}
          </div>
          <div>
            {visibleTx.map(tx => <TxRow key={tx.id} tx={tx} />)}
          </div>
        </div>
      )}

    </div>
  );
}

// ── Connect button ────────────────────────────────────────────────────────────
function ConnectButton({ onClick, loading, hasAccounts, small }) {
  return (
    <button
      onClick={onClick}
      disabled={loading}
      style={{
        display: 'inline-flex', alignItems: 'center', gap: 7,
        fontFamily: T.sans,
        fontSize: small ? 11 : 13,
        color: T.fg1,
        background: T.bg2,
        border: `1px solid ${T.border1}`,
        padding: small ? '5px 10px' : '9px 18px',
        borderRadius: 8, cursor: loading ? 'wait' : 'pointer',
        opacity: loading ? 0.6 : 1, transition: 'all 150ms',
      }}
      onMouseEnter={e => { if (!loading) { e.currentTarget.style.borderColor = T.border2; e.currentTarget.style.color = T.fg0; } }}
      onMouseLeave={e => { e.currentTarget.style.borderColor = T.border1; e.currentTarget.style.color = T.fg1; }}
    >
      {loading
        ? <><svg width="12" height="12" viewBox="0 0 24 24" fill="none" style={{ animation: 'spin 0.8s linear infinite' }}>
            <circle cx="12" cy="12" r="10" stroke={T.border1} strokeWidth="2"/>
            <path d="M12 2 A10 10 0 0 1 22 12" stroke={T.greenBright} strokeWidth="2" strokeLinecap="round"/>
          </svg> Connexion…</>
        : <><svg width="11" height="11" viewBox="0 0 11 11" fill="none">
            <path d="M5.5 1v9M1 5.5h9" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
          </svg> {hasAccounts ? 'Connecter une autre banque' : 'Connecter ma banque'}</>
      }
    </button>
  );
}
