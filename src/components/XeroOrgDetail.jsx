import { useEffect, useState } from 'react';
import { useAuth } from '@clerk/react';
import { useTheme } from '../ThemeContext';

const API = import.meta.env.VITE_API_URL;

// ── Helpers ───────────────────────────────────────────────────────────────────
function fmt(val, compact = true) {
  if (val == null || isNaN(val)) return '—';
  if (compact && Math.abs(val) >= 1_000_000)
    return `$${(val / 1_000_000).toFixed(2)}M`;
  if (compact && Math.abs(val) >= 1_000)
    return `$${(val / 1_000).toFixed(1)}k`;
  return new Intl.NumberFormat('en-AU', { style: 'currency', currency: 'AUD', maximumFractionDigits: 0 }).format(val);
}

function fmtDate(raw) {
  if (!raw) return '—';
  // Xero dates: "/Date(1234567890000+0000)/" or "YYYY-MM-DD"
  const ms = typeof raw === 'string' ? raw.match(/\/Date\((\d+)/) : null;
  const d  = ms ? new Date(Number(ms[1])) : new Date(raw);
  if (isNaN(d)) return raw;
  return d.toLocaleDateString('fr-AU', { day: '2-digit', month: 'short', year: '2-digit' });
}

function Spinner() {
  const { T } = useTheme();
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none"
      style={{ animation: 'spin 0.8s linear infinite', display: 'block' }}>
      <circle cx="12" cy="12" r="10" stroke={T.border1} strokeWidth="2" />
      <path d="M12 2 A10 10 0 0 1 22 12" stroke={T.greenBright} strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}

// ── KPI card ──────────────────────────────────────────────────────────────────
function KPI({ label, value, sub, color }) {
  const { T } = useTheme();
  return (
    <div style={{
      background: T.bg1, border: `1px solid ${T.border0}`,
      borderRadius: 10, padding: '14px 16px', flex: '1 1 140px',
    }}>
      <div style={{ fontFamily: T.sans, fontSize: 9, color: T.fg2, textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 7 }}>
        {label}
      </div>
      <div style={{ fontFamily: T.mono, fontSize: 20, fontWeight: 500, letterSpacing: '-0.8px', color: color || T.fg0 }}>
        {fmt(value)}
      </div>
      {sub && (
        <div style={{ fontFamily: T.sans, fontSize: 10, color: T.fg2, marginTop: 3 }}>{sub}</div>
      )}
    </div>
  );
}

// ── Horizontal bar ────────────────────────────────────────────────────────────
function HBar({ value, max, color }) {
  const { T } = useTheme();
  const pct = Math.min(100, max > 0 ? (Math.abs(value) / max) * 100 : 0);
  return (
    <div style={{ flex: 1, height: 5, background: T.bg2, borderRadius: 3, overflow: 'hidden' }}>
      <div style={{ width: `${pct}%`, height: '100%', background: color, borderRadius: 3, transition: 'width 400ms ease' }} />
    </div>
  );
}

// ── Status badge ──────────────────────────────────────────────────────────────
function StatusBadge({ status }) {
  const { T } = useTheme();
  const map = {
    AUTHORISED: { label: 'autorisée', color: '#ffb74d' },
    PAID:       { label: 'payée',     color: T.greenText },
    DRAFT:      { label: 'brouillon', color: T.fg3 },
    VOIDED:     { label: 'annulée',   color: '#e05555' },
    DELETED:    { label: 'supprimée', color: '#e05555' },
  };
  const s = map[status] || { label: status?.toLowerCase() || '—', color: T.fg3 };
  return (
    <span style={{
      fontFamily: T.mono, fontSize: 9, padding: '2px 6px', borderRadius: 99,
      border: `1px solid ${s.color}30`, background: `${s.color}10`, color: s.color,
    }}>
      {s.label}
    </span>
  );
}

// ── Section wrapper ───────────────────────────────────────────────────────────
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

// ── Main ──────────────────────────────────────────────────────────────────────
export default function XeroOrgDetail({ clerkUserId, tenant, color }) {
  const { T } = useTheme();
  const { getToken } = useAuth();
  const [sample, setSample] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState(null);

  useEffect(() => {
    if (!clerkUserId || !tenant?.tenantId) return;
    setLoading(true);
    setSample(null);
    setError(null);
    (async () => {
      try {
        const token = await getToken();
        const headers = { Authorization: `Bearer ${token}` };
        const r = await fetch(
          `${API}/api/xero/sample/${clerkUserId}?tenantId=${encodeURIComponent(tenant.tenantId)}`,
          { headers }
        );
        if (r.status === 401) { setError('reauth'); return; }
        if (!r.ok) throw new Error(await r.text());
        const json = await r.json();
        if (json.error) throw new Error(json.error);
        setSample(json.data);
      } catch (e) {
        setError(e.message);
      } finally {
        setLoading(false);
      }
    })();
  }, [clerkUserId, tenant?.tenantId]);

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', paddingTop: 60 }}>
        <Spinner />
      </div>
    );
  }

  if (error === 'reauth') {
    return (
      <div style={{ textAlign: 'center', padding: '24px 0' }}>
        <div style={{ fontFamily: T.sans, fontSize: 13, color: T.fg1, marginBottom: 12 }}>Session Xero expirée.</div>
        <button
          onClick={() => { window.location.href = `${API}/api/xero/login?clerkUserId=${clerkUserId}`; }}
          style={{ fontFamily: T.sans, fontSize: 13, color: T.fg0, background: T.bg2, border: `1px solid ${T.border1}`, padding: '8px 18px', borderRadius: 8, cursor: 'pointer' }}
        >
          Reconnecter Xero
        </button>
      </div>
    );
  }

  if (error || !sample) {
    return (
      <div style={{ fontFamily: T.sans, fontSize: 13, color: '#e05555', textAlign: 'center', padding: '24px 0' }}>
        {error || 'Aucune donnée disponible.'}
      </div>
    );
  }

  const { bankAccounts = [], summary, profitAndLoss, balanceSheet, samples = {} } = sample;

  // ── Extraire les KPIs depuis balanceSheet / summary ───────────────────────
  const bsKeys  = Object.keys(balanceSheet || {});
  const findBS  = (...kws) => {
    const k = bsKeys.find(k => kws.some(kw => k.toLowerCase().includes(kw)));
    return k ? balanceSheet[k] : 0;
  };
  const totalAssets      = findBS('asset');
  const totalLiabilities = findBS('liabilit');
  const totalEquity      = findBS('equity', 'net asset') || (totalAssets - totalLiabilities);
  const cash             = bankAccounts.reduce((s, a) => s + (a.balance ?? 0), 0);
  const receivables      = summary?.invoices?.due ?? 0;

  // ── P&L ─────────────────────────────────────────────────────────────────
  const plKeys = Object.keys(profitAndLoss || {});
  const findPL = (...kws) => {
    const k = plKeys.find(k => kws.some(kw => k.toLowerCase().includes(kw)));
    return k ? profitAndLoss[k] : 0;
  };
  const revenue  = findPL('income', 'revenue', 'trading', 'sales');
  const expenses = findPL('expense', 'cost', 'overhead');
  const netProfit = findPL('net profit', 'profit', 'net loss') || (revenue - expenses);
  const plMax    = Math.max(Math.abs(revenue), Math.abs(expenses), 1);

  // ── Invoices ──────────────────────────────────────────────────────────────
  const invoices = (samples.invoices || []).slice(0, 8);

  // ── Transactions ──────────────────────────────────────────────────────────
  const transactions = (samples.bankTransactions || []).slice(0, 8);

  return (
    <div style={{ width: '100%', maxWidth: 760, margin: '0 auto', display: 'flex', flexDirection: 'column', gap: 14 }}>

      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{ width: 10, height: 10, borderRadius: 3, background: color, flexShrink: 0 }} />
          <div style={{ fontFamily: T.serif, fontSize: 20, color: T.fg0, letterSpacing: '-0.4px' }}>
            {tenant.tenantName}
          </div>
          {tenant.tenantType && (
            <span style={{ fontFamily: T.sans, fontSize: 10, color: T.fg3, textTransform: 'lowercase' }}>
              {tenant.tenantType}
            </span>
          )}
        </div>
        <div style={{ fontFamily: T.mono, fontSize: 10, color: T.fg3 }}>
          {sample.period?.from} → {sample.period?.to}
        </div>
      </div>

      {/* KPI row */}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10 }}>
        <KPI label="Actifs totaux" value={totalAssets} />
        <KPI label="Passifs totaux" value={totalLiabilities} color={totalLiabilities > 0 ? '#ef5350' : T.fg0} />
        <KPI label="Equity" value={totalEquity} color={totalEquity >= 0 ? T.greenText : '#ef5350'} />
        <KPI label="Cash on hand" value={cash} sub={`${bankAccounts.length} compte${bankAccounts.length !== 1 ? 's' : ''}`} />
        <KPI label="À encaisser" value={receivables}
          color={receivables > 0 ? '#ffb74d' : T.fg0}
          sub={`${summary?.invoices?.count ?? 0} facture${(summary?.invoices?.count ?? 0) !== 1 ? 's' : ''}`} />
      </div>

      {/* Bank accounts */}
      {bankAccounts.length > 0 && (
        <Section title="Comptes bancaires">
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            {bankAccounts.map(a => (
              <div key={a.id} style={{
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                padding: '8px 12px', background: T.bg2, borderRadius: 7,
                border: `1px solid ${T.border0}`,
              }}>
                <div>
                  <div style={{ fontFamily: T.sans, fontSize: 12, color: T.fg0 }}>{a.name}</div>
                  {a.code && (
                    <div style={{ fontFamily: T.mono, fontSize: 9, color: T.fg3, marginTop: 2 }}>{a.code}</div>
                  )}
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontFamily: T.mono, fontSize: 14, color: (a.balance ?? 0) >= 0 ? T.fg0 : '#ef5350', letterSpacing: '-0.5px' }}>
                    {fmt(a.balance ?? 0)}
                  </div>
                  {a.currency && (
                    <div style={{ fontFamily: T.sans, fontSize: 9, color: T.fg3, marginTop: 1 }}>{a.currency}</div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </Section>
      )}

      {/* P&L */}
      {(revenue > 0 || expenses > 0) && (
        <Section title={`P&L · ${sample.period?.from?.slice(0, 7) || 'période'}`}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {[
              { label: 'Revenus', value: revenue, color: T.greenBright },
              { label: 'Dépenses', value: expenses, color: '#ef5350' },
            ].map(({ label, value, color: c }) => (
              <div key={label} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <div style={{ width: 56, fontFamily: T.sans, fontSize: 10, color: T.fg2, textAlign: 'right', flexShrink: 0 }}>
                  {label}
                </div>
                <HBar value={value} max={plMax} color={c} />
                <div style={{ fontFamily: T.mono, fontSize: 11, color: T.fg1, width: 70, textAlign: 'right', flexShrink: 0 }}>
                  {fmt(value)}
                </div>
              </div>
            ))}
            <div style={{ borderTop: `1px solid ${T.border0}`, paddingTop: 8, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontFamily: T.sans, fontSize: 11, color: T.fg1 }}>Résultat net</span>
              <span style={{ fontFamily: T.mono, fontSize: 15, fontWeight: 600, letterSpacing: '-0.5px', color: netProfit >= 0 ? T.greenText : '#ef5350' }}>
                {netProfit >= 0 ? '+' : ''}{fmt(netProfit)}
              </span>
            </div>
          </div>
        </Section>
      )}

      {/* Invoices */}
      {invoices.length > 0 && (
        <Section title={`Factures récentes · ${summary?.invoices?.count ?? invoices.length} au total`}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontFamily: T.sans, fontSize: 11 }}>
            <thead>
              <tr>
                {['N°', 'Contact', 'Émise', 'Échéance', 'Montant', 'Restant', 'Statut'].map(h => (
                  <th key={h} style={{
                    textAlign: h === 'Montant' || h === 'Restant' ? 'right' : 'left',
                    color: T.fg2, fontWeight: 400, paddingBottom: 8, paddingRight: 10, fontSize: 10,
                  }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {invoices.map(inv => (
                <tr key={inv.id} style={{ borderTop: `1px solid ${T.border0}` }}>
                  <td style={{ padding: '7px 10px 7px 0', fontFamily: T.mono, fontSize: 10, color: T.fg2 }}>
                    {inv.number || '—'}
                  </td>
                  <td style={{ padding: '7px 10px 7px 0', color: T.fg0, maxWidth: 120, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {inv.contact || '—'}
                  </td>
                  <td style={{ padding: '7px 10px 7px 0', color: T.fg2, fontFamily: T.mono, fontSize: 10, whiteSpace: 'nowrap' }}>
                    {fmtDate(inv.date)}
                  </td>
                  <td style={{ padding: '7px 10px 7px 0', color: T.fg2, fontFamily: T.mono, fontSize: 10, whiteSpace: 'nowrap' }}>
                    {fmtDate(inv.dueDate)}
                  </td>
                  <td style={{ padding: '7px 10px 7px 0', textAlign: 'right', fontFamily: T.mono, color: T.fg1 }}>
                    {fmt(inv.total)}
                  </td>
                  <td style={{ padding: '7px 10px 7px 0', textAlign: 'right', fontFamily: T.mono, color: (inv.amountDue ?? 0) > 0 ? '#ffb74d' : T.fg1 }}>
                    {fmt(inv.amountDue)}
                  </td>
                  <td style={{ padding: '7px 0 7px 0' }}>
                    <StatusBadge status={inv.status} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {/* Summary row */}
          <div style={{ display: 'flex', gap: 20, marginTop: 12, paddingTop: 10, borderTop: `1px solid ${T.border0}` }}>
            {[
              { label: 'total facturé', value: summary?.invoices?.total },
              { label: 'encaissé',      value: summary?.invoices?.paid, color: T.greenText },
              { label: 'restant dû',    value: summary?.invoices?.due,  color: '#ffb74d' },
            ].map(({ label, value, color: c }) => (
              <div key={label} style={{ fontFamily: T.sans, fontSize: 10 }}>
                <span style={{ fontFamily: T.mono, fontWeight: 600, color: c || T.fg0, marginRight: 5 }}>{fmt(value)}</span>
                <span style={{ color: T.fg3 }}>{label}</span>
              </div>
            ))}
          </div>
        </Section>
      )}

      {/* Bank transactions */}
      {transactions.length > 0 && (
        <Section title={`Mouvements bancaires · ${summary?.bankTransactions?.count ?? transactions.length} au total`}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
            {transactions.map((tx, i) => (
              <div key={tx.id || i} style={{
                display: 'flex', alignItems: 'center', gap: 10,
                padding: '8px 0',
                borderBottom: i < transactions.length - 1 ? `1px solid ${T.border0}` : 'none',
              }}>
                {/* Type badge */}
                <div style={{
                  width: 28, height: 28, borderRadius: 6, flexShrink: 0,
                  background: tx.type === 'RECEIVE' || tx.type === 'RECEIVE-OVERPAYMENT'
                    ? `${T.greenBright}15` : `${'#ef5350'}15`,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                  <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
                    {tx.type?.startsWith('RECEIVE')
                      ? <path d="M5 8V2M2 5l3 3 3-3" stroke={T.greenBright} strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"/>
                      : <path d="M5 2v6M2 5l3-3 3 3" stroke="#ef5350" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"/>
                    }
                  </svg>
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontFamily: T.sans, fontSize: 11, color: T.fg0, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {tx.contact || tx.reference || tx.account || tx.type || '—'}
                  </div>
                  <div style={{ fontFamily: T.sans, fontSize: 10, color: T.fg3, marginTop: 1 }}>
                    {fmtDate(tx.date)}{tx.account ? ` · ${tx.account}` : ''}
                  </div>
                </div>
                <div style={{ fontFamily: T.mono, fontSize: 13, color: tx.type?.startsWith('RECEIVE') ? T.greenText : '#ef5350', flexShrink: 0 }}>
                  {tx.type?.startsWith('RECEIVE') ? '+' : '-'}{fmt(Math.abs(tx.amount ?? 0))}
                </div>
              </div>
            ))}
          </div>
        </Section>
      )}

    </div>
  );
}
