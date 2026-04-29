import { useEffect, useState, useRef } from 'react';
import { useAuth } from '@clerk/react';
import { useTheme } from '../ThemeContext';

const API         = import.meta.env.VITE_API_URL;
const TELLER_APP  = import.meta.env.VITE_TELLER_APP_ID;
const TELLER_ENV  = import.meta.env.VITE_TELLER_ENV || 'sandbox';

// ── Helpers ───────────────────────────────────────────────────────────────────
function fmt(val, currency = 'USD') {
  if (val == null || isNaN(val)) return '—';
  if (Math.abs(val) >= 1_000_000) return `$${(val / 1_000_000).toFixed(2)}M`;
  if (Math.abs(val) >= 1_000)     return `$${(val / 1_000).toFixed(1)}k`;
  return new Intl.NumberFormat('en-US', { style: 'currency', currency, maximumFractionDigits: 0 }).format(val);
}

function fmtDate(raw) {
  if (!raw) return '—';
  const d = new Date(raw);
  if (isNaN(d)) return raw;
  return d.toLocaleDateString('en-US', { day: '2-digit', month: 'short' });
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

function Section({ title, children }) {
  const { T } = useTheme();
  return (
    <div style={{ background: T.bg1, border: `1px solid ${T.border0}`, borderRadius: 10, padding: '16px 20px' }}>
      <div style={{ fontFamily: T.sans, fontSize: 9, color: T.fg2, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 14 }}>
        {title}
      </div>
      {children}
    </div>
  );
}

// ── Teller Connect hook ───────────────────────────────────────────────────────
function useTellerConnect(onSuccess) {
  const tellerRef = useRef(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    if (window.TellerConnect) { setReady(true); return; }
    const script = document.createElement('script');
    script.src = 'https://cdn.teller.io/connect/connect.js';
    script.onload = () => setReady(true);
    document.head.appendChild(script);
    return () => { document.head.removeChild(script); };
  }, []);

  function open() {
    if (!window.TellerConnect || !TELLER_APP) return;
    if (!tellerRef.current) {
      tellerRef.current = window.TellerConnect.setup({
        applicationId: TELLER_APP,
        environment:   TELLER_ENV,
        onSuccess,
        onExit:    () => {},
        onFailure: (f) => console.error('[Teller] failure', f),
      });
    }
    tellerRef.current.open();
  }

  return { ready, open };
}

// ── Main ──────────────────────────────────────────────────────────────────────
export default function TellerAccounts({ clerkUserId }) {
  const { T } = useTheme();
  const { getToken } = useAuth();
  const [data, setData]           = useState(null);
  const [loading, setLoading]     = useState(true);
  const [saving, setSaving]       = useState(false);
  const [activeAccount, setActiveAccount] = useState(null);

  const { ready, open } = useTellerConnect(async (enrollment) => {
    setSaving(true);
    try {
      const token = await getToken();
      await fetch(`${API}/api/teller/enrollment/${clerkUserId}`, {
        method:  'POST',
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          enrollmentId:    enrollment.enrollment.id,
          accessToken:     enrollment.accessToken,
          institutionName: enrollment.enrollment.institution.name,
        }),
      });
      await fetchSummary();
    } finally {
      setSaving(false);
    }
  });

  async function fetchSummary() {
    try {
      const token = await getToken();
      const r = await fetch(`${API}/api/teller/summary/${clerkUserId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!r.ok) throw new Error(await r.text());
      setData(await r.json());
    } catch (e) {
      console.error('[Teller]', e);
      setData({ connected: false });
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (!clerkUserId) return;
    fetchSummary();
  }, [clerkUserId]);

  if (loading) {
    return <div style={{ display: 'flex', justifyContent: 'center', paddingTop: 60 }}><Spinner /></div>;
  }

  const { accounts = [], transactions = [], totalBalance, summary, enrollments = 0 } = data || {};
  const hasAccounts = accounts.length > 0;
  const visibleTx = activeAccount ? transactions.filter(t => t.accountId === activeAccount) : transactions;

  const ConnectBtn = ({ small }) => (
    <button
      onClick={open}
      disabled={!ready || saving}
      style={{
        display: 'inline-flex', alignItems: 'center', gap: 7,
        fontFamily: T.sans, fontSize: small ? 11 : 13, color: T.fg1,
        background: T.bg2, border: `1px solid ${T.border1}`,
        padding: small ? '5px 10px' : '9px 18px',
        borderRadius: 8, cursor: (!ready || saving) ? 'wait' : 'pointer',
        opacity: (!ready || saving) ? 0.6 : 1, transition: 'all 150ms',
      }}
      onMouseEnter={e => { if (ready && !saving) { e.currentTarget.style.borderColor = T.border2; e.currentTarget.style.color = T.fg0; } }}
      onMouseLeave={e => { e.currentTarget.style.borderColor = T.border1; e.currentTarget.style.color = T.fg1; }}
    >
      {saving
        ? <><Spinner size={12} /> Saving…</>
        : <><svg width="11" height="11" viewBox="0 0 11 11" fill="none">
            <path d="M5.5 1v9M1 5.5h9" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
          </svg> {hasAccounts ? 'Connect another bank' : 'Connect my US bank'}</>
      }
    </button>
  );

  if (!hasAccounts) {
    return (
      <div style={{ maxWidth: 440, margin: '0 auto', paddingTop: 40 }}>
        <div style={{ fontFamily: T.serif, fontSize: 28, color: T.fg0, letterSpacing: '-0.8px', marginBottom: 10 }}>
          Connect your US bank.
        </div>
        <p style={{ fontFamily: T.sans, fontSize: 14, color: T.fg1, lineHeight: 1.65, fontWeight: 300, marginBottom: 28 }}>
          CFO Black pulls real-time balances and transactions from your US accounts via Teller.
        </p>
        <ConnectBtn />
      </div>
    );
  }

  return (
    <div style={{ width: '100%', maxWidth: 760, margin: '0 auto', display: 'flex', flexDirection: 'column', gap: 14 }}>

      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ fontFamily: T.sans, fontSize: 11, color: T.fg2, textTransform: 'uppercase', letterSpacing: '0.08em' }}>
          US Bank accounts · {accounts.length} account{accounts.length !== 1 ? 's' : ''} · {enrollments} institution{enrollments !== 1 ? 's' : ''}
        </div>
        <ConnectBtn small />
      </div>

      {/* KPIs */}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10 }}>
        {[
          { label: 'Total balance',   value: totalBalance,    color: T.fg0 },
          { label: 'Inflows (30d)',   value: summary?.credits, color: T.greenText },
          { label: 'Outflows (30d)',  value: summary?.debits,  color: '#ef5350' },
          { label: 'Net (30d)',       value: summary?.net,
            color: (summary?.net ?? 0) >= 0 ? T.greenText : '#ef5350' },
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

      {/* Accounts */}
      <Section title="Accounts">
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          {accounts.map(a => (
            <button
              key={a.id}
              onClick={() => setActiveAccount(prev => prev === a.id ? null : a.id)}
              style={{
                width: '100%', textAlign: 'left', cursor: 'pointer',
                display: 'flex', alignItems: 'center', gap: 10,
                padding: '10px 12px',
                background: activeAccount === a.id ? `${T.greenBright}08` : T.bg2,
                border: `1px solid ${activeAccount === a.id ? T.greenBright + '40' : T.border0}`,
                borderRadius: 8, transition: 'all 150ms',
              }}
            >
              <div style={{
                width: 32, height: 32, borderRadius: 8, flexShrink: 0,
                background: T.bg1, border: `1px solid ${T.border0}`,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                <svg width="14" height="11" viewBox="0 0 14 11" fill="none">
                  <path d="M1 4h12M7 1L13 4H1L7 1Z" stroke={T.fg2} strokeWidth="1.1" strokeLinejoin="round"/>
                  <rect x="2" y="4" width="2.2" height="5" fill={T.fg2} opacity="0.4"/>
                  <rect x="5.9" y="4" width="2.2" height="5" fill={T.fg2} opacity="0.4"/>
                  <rect x="9.8" y="4" width="2.2" height="5" fill={T.fg2} opacity="0.4"/>
                  <line x1="1" y1="9" x2="13" y2="9" stroke={T.fg2} strokeWidth="1.1" strokeLinecap="round"/>
                </svg>
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontFamily: T.sans, fontSize: 12, color: T.fg0 }}>
                  {a.name}
                  {a.last4 && <span style={{ fontFamily: T.mono, fontSize: 10, color: T.fg3, marginLeft: 6 }}>···{a.last4}</span>}
                </div>
                <div style={{ fontFamily: T.sans, fontSize: 10, color: T.fg3, marginTop: 1 }}>
                  {a.institutionName} · {a.subtype || a.type}
                </div>
              </div>
              <div style={{
                fontFamily: T.mono, fontSize: 13,
                color: (a.balance ?? 0) >= 0 ? T.fg0 : '#ef5350',
                flexShrink: 0,
              }}>
                {fmt(a.balance, a.currency || 'USD')}
              </div>
            </button>
          ))}
        </div>
      </Section>

      {/* Transactions */}
      {visibleTx.length > 0 && (
        <Section title={`Recent transactions${activeAccount ? ' · selected account' : ' · all accounts'}`}>
          {activeAccount && (
            <button onClick={() => setActiveAccount(null)} style={{
              fontFamily: T.sans, fontSize: 10, color: T.fg2, background: 'none',
              border: 'none', cursor: 'pointer', textDecoration: 'underline',
              textDecorationColor: T.border1, padding: 0, marginBottom: 10, display: 'block',
            }}>
              Show all
            </button>
          )}
          <div>
            {visibleTx.map((tx, i) => {
              const isCredit = tx.direction === 'credit';
              return (
                <div key={tx.id || i} style={{
                  display: 'flex', alignItems: 'flex-start', gap: 10,
                  padding: '9px 0',
                  borderBottom: i < visibleTx.length - 1 ? `1px solid ${T.border0}` : 'none',
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
                    <div style={{ fontFamily: T.sans, fontSize: 11, color: T.fg0, lineHeight: 1.4 }}>
                      {tx.description || '—'}
                    </div>
                    <div style={{ fontFamily: T.sans, fontSize: 10, color: T.fg3, marginTop: 1 }}>
                      {fmtDate(tx.date)}{tx.institution ? ` · ${tx.institution}` : ''}
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
            })}
          </div>
        </Section>
      )}

    </div>
  );
}
