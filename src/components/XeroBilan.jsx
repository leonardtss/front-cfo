import { useEffect, useState } from 'react';
import { useAuth } from '@clerk/react';
import { T } from '../tokens';

const API = import.meta.env.VITE_API_URL;

function fmt(val, currency = 'AUD') {
  if (val == null) return '—';
  return new Intl.NumberFormat('en-AU', { style: 'currency', currency, maximumFractionDigits: 0 }).format(val);
}

function fmtDate(xeroDate) {
  if (!xeroDate) return '—';
  // Xero dates: "/Date(1234567890000+0000)/" or "YYYY-MM-DD"
  const ms = xeroDate.match?.(/\/Date\((\d+)/)?.[1];
  const d = ms ? new Date(Number(ms)) : new Date(xeroDate);
  if (isNaN(d)) return xeroDate;
  return d.toLocaleDateString('en-AU', { day: '2-digit', month: 'short', year: 'numeric' });
}

function Pill({ label, value, color }) {
  return (
    <div style={{
      background: T.bg2, border: `1px solid ${T.border0}`,
      borderRadius: 8, padding: '10px 14px', flex: '1 1 140px',
    }}>
      <div style={{ fontFamily: T.sans, fontSize: 10, color: T.fg2, marginBottom: 4, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
        {label}
      </div>
      <div style={{ fontFamily: T.mono, fontSize: 15, color: color || T.fg0, fontWeight: 500, letterSpacing: '-0.5px' }}>
        {value}
      </div>
    </div>
  );
}

function SampleTable({ title, rows, columns }) {
  const [open, setOpen] = useState(false);
  if (!rows?.length) return null;
  return (
    <div style={{ marginTop: 10 }}>
      <button
        onClick={() => setOpen(o => !o)}
        style={{
          display: 'flex', alignItems: 'center', gap: 6,
          background: 'none', border: 'none', cursor: 'pointer',
          fontFamily: T.sans, fontSize: 11, color: T.fg2, padding: 0, marginBottom: 6,
        }}
      >
        <svg width="10" height="10" viewBox="0 0 10 10" fill="none"
          style={{ transform: open ? 'rotate(90deg)' : 'rotate(0deg)', transition: 'transform 150ms' }}>
          <path d="M3 2l4 3-4 3" stroke={T.fg2} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
        {title} — {rows.length} ligne{rows.length > 1 ? 's' : ''} (semaine)
      </button>
      {open && (
        <div style={{ overflowX: 'auto', borderRadius: 8, border: `1px solid ${T.border0}` }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontFamily: T.sans, fontSize: 11 }}>
            <thead>
              <tr style={{ background: T.bg2 }}>
                {columns.map(c => (
                  <th key={c.key} style={{
                    padding: '7px 12px', textAlign: 'left',
                    color: T.fg2, fontWeight: 500, whiteSpace: 'nowrap',
                    borderBottom: `1px solid ${T.border0}`,
                  }}>{c.label}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map((row, i) => (
                <tr key={i} style={{ borderBottom: i < rows.length - 1 ? `1px solid ${T.border0}` : 'none' }}>
                  {columns.map(c => (
                    <td key={c.key} style={{
                      padding: '7px 12px', color: c.mono ? T.fg0 : T.fg1,
                      fontFamily: c.mono ? T.mono : T.sans,
                      whiteSpace: 'nowrap',
                    }}>
                      {c.format ? c.format(row[c.key], row) : (row[c.key] ?? '—')}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

function TenantCard({ tenantName, data, error }) {
  if (error) return (
    <div style={{
      background: T.bg1, border: `1px solid ${T.border0}`, borderRadius: 12, padding: '20px 24px',
    }}>
      <div style={{ fontFamily: T.sans, fontSize: 13, fontWeight: 500, color: T.fg0, marginBottom: 6 }}>{tenantName}</div>
      <div style={{ fontFamily: T.sans, fontSize: 12, color: '#e05555' }}>Error: {error}</div>
    </div>
  );

  if (!data) return null;

  const { period, bankAccounts, summary, profitAndLoss, balanceSheet, samples } = data;
  const currency = bankAccounts?.[0]?.currency || 'AUD';

  // P&L keys (Xero returns localized names)
  const plIncome  = profitAndLoss ? Object.values(profitAndLoss)[0] : null;
  const plKeys    = profitAndLoss ? Object.keys(profitAndLoss) : [];
  const plExpKey  = plKeys.find(k => /expense|cost|charges/i.test(k));
  const plNetKey  = plKeys.find(k => /net|profit|loss/i.test(k));
  const plIncome_ = plKeys.find(k => /income|revenue|trading/i.test(k));

  return (
    <div style={{
      background: T.bg1, border: `1px solid ${T.border1}`,
      borderRadius: 12, padding: '20px 24px',
    }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 18 }}>
        <div>
          <div style={{ fontFamily: T.sans, fontSize: 14, fontWeight: 600, color: T.fg0 }}>{tenantName}</div>
          <div style={{ fontFamily: T.sans, fontSize: 11, color: T.fg2, marginTop: 2 }}>
            {period.from} → {period.to}
          </div>
        </div>
        <div style={{
          fontFamily: T.sans, fontSize: 10, color: T.greenText,
          background: `${T.greenBright}12`, border: `1px solid ${T.greenBright}30`,
          padding: '3px 9px', borderRadius: 99,
        }}>
          7 days
        </div>
      </div>

      {/* Bank accounts */}
      {bankAccounts?.length > 0 && (
        <div style={{ marginBottom: 16 }}>
          <div style={{ fontFamily: T.sans, fontSize: 10, color: T.fg2, textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 8 }}>
            Bank accounts
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
            {bankAccounts.map(a => (
              <div key={a.id} style={{
                display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                background: T.bg2, border: `1px solid ${T.border0}`,
                borderRadius: 8, padding: '8px 12px',
              }}>
                <div style={{ fontFamily: T.sans, fontSize: 12, color: T.fg1 }}>{a.name}</div>
                <div style={{
                  fontFamily: T.mono, fontSize: 13, fontWeight: 500,
                  color: a.balance >= 0 ? T.fg0 : '#e05555',
                }}>
                  {fmt(a.balance, a.currency || currency)}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Weekly activity */}
      <div style={{ marginBottom: 16 }}>
        <div style={{ fontFamily: T.sans, fontSize: 10, color: T.fg2, textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 8 }}>
          Activity — last 7 days
        </div>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
          <Pill label={`Bank transactions (${summary.bankTransactions.count})`} value={fmt(summary.bankTransactions.totalAmount, currency)} />
          <Pill label={`Invoices (${summary.invoices.count})`} value={fmt(summary.invoices.total, currency)} />
          <Pill label="Outstanding invoices" value={fmt(summary.invoices.due, currency)} color={summary.invoices.due > 0 ? '#e07755' : T.fg0} />
          <Pill label={`Payments (${summary.payments.count})`} value={fmt(summary.payments.totalAmount, currency)} color={T.greenText} />
        </div>
      </div>

      {/* P&L */}
      {profitAndLoss && Object.keys(profitAndLoss).length > 0 && (
        <div style={{ marginBottom: 16 }}>
          <div style={{ fontFamily: T.sans, fontSize: 10, color: T.fg2, textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 8 }}>
            P&L statement (period)
          </div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
            {Object.entries(profitAndLoss).map(([key, val]) => (
              <Pill
                key={key}
                label={key}
                value={fmt(val, currency)}
                color={/net|profit/i.test(key) ? (val >= 0 ? T.greenText : '#e05555') : T.fg0}
              />
            ))}
          </div>
        </div>
      )}

      {/* Balance sheet */}
      {balanceSheet && Object.keys(balanceSheet).length > 0 && (
        <div style={{ marginBottom: 16 }}>
          <div style={{ fontFamily: T.sans, fontSize: 10, color: T.fg2, textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 8 }}>
            Balance sheet (today)
          </div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
            {Object.entries(balanceSheet).map(([key, val]) => (
              <Pill key={key} label={key} value={fmt(val, currency)} />
            ))}
          </div>
        </div>
      )}

      {/* Samples (collapsibles) */}
      <div style={{ borderTop: `1px solid ${T.border0}`, paddingTop: 12, marginTop: 4 }}>
        <div style={{ fontFamily: T.sans, fontSize: 10, color: T.fg2, textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 8 }}>
          Raw data (sample)
        </div>

        <SampleTable
          title="Bank transactions"
          rows={samples.bankTransactions}
          columns={[
            { key: 'date',      label: 'Date',      format: fmtDate },
            { key: 'contact',   label: 'Contact' },
            { key: 'reference', label: 'Reference' },
            { key: 'type',      label: 'Type' },
            { key: 'amount',    label: 'Amount', mono: true, format: (v, r) => fmt(v, currency) },
            { key: 'account',   label: 'Account' },
          ]}
        />

        <SampleTable
          title="Invoices"
          rows={samples.invoices}
          columns={[
            { key: 'date',      label: 'Date',     format: fmtDate },
            { key: 'number',    label: 'No.' },
            { key: 'contact',   label: 'Contact' },
            { key: 'type',      label: 'Type' },
            { key: 'status',    label: 'Statut' },
            { key: 'total',     label: 'Total',    mono: true, format: (v, r) => fmt(v, r.currency || currency) },
            { key: 'amountDue', label: 'Restant',  mono: true, format: (v, r) => fmt(v, r.currency || currency) },
          ]}
        />

        <SampleTable
          title="Paiements"
          rows={samples.payments}
          columns={[
            { key: 'date',      label: 'Date',    format: fmtDate },
            { key: 'reference', label: 'Référence' },
            { key: 'type',      label: 'Type' },
            { key: 'amount',    label: 'Montant', mono: true, format: (v) => fmt(v, currency) },
            { key: 'account',   label: 'Compte' },
          ]}
        />
      </div>
    </div>
  );
}

// ── Main export ───────────────────────────────────────────────────────────────
export default function XeroBilan({ clerkUserId }) {
  const { getToken } = useAuth();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!clerkUserId) return;
    async function load() {
      try {
        const token = await getToken();
        const r = await fetch(`${API}/api/xero/sample/${clerkUserId}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (r.status === 401) { setError('reauth'); return; }
        if (!r.ok) throw new Error(await r.text());
        setData(await r.json());
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [clerkUserId]);

  if (loading) return (
    <div style={{ display: 'flex', justifyContent: 'center', padding: '32px 0' }}>
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" style={{ animation: 'spin 0.8s linear infinite' }}>
        <circle cx="12" cy="12" r="10" stroke={T.border1} strokeWidth="2" />
        <path d="M12 2 A10 10 0 0 1 22 12" stroke={T.greenBright} strokeWidth="2" strokeLinecap="round" />
      </svg>
    </div>
  );

  if (error === 'reauth') return (
    <div style={{
      background: T.bg1, border: `1px solid ${T.border0}`, borderRadius: 12,
      padding: '20px 24px', textAlign: 'center',
    }}>
      <div style={{ fontFamily: T.sans, fontSize: 13, color: T.fg1, marginBottom: 12 }}>
        La session Xero a expiré. Reconnectez pour continuer.
      </div>
      <button
        onClick={() => { window.location.href = `${API}/api/xero/login?clerkUserId=${clerkUserId}`; }}
        style={{
          fontFamily: T.sans, fontSize: 13, color: T.fg0,
          background: T.bg2, border: `1px solid ${T.border1}`,
          padding: '8px 18px', borderRadius: 8, cursor: 'pointer',
        }}
      >
        Reconnecter Xero
      </button>
    </div>
  );

  if (error) return (
    <div style={{ fontFamily: T.sans, fontSize: 13, color: '#e05555', textAlign: 'center', padding: '24px 0' }}>
      Error: {error}
    </div>
  );

  if (!data?.length) return (
    <div style={{ fontFamily: T.sans, fontSize: 13, color: T.fg2, textAlign: 'center', padding: '24px 0' }}>
      No organization connected.
    </div>
  );

  return (
    <div style={{ width: '100%', maxWidth: 760, margin: '0 auto', display: 'flex', flexDirection: 'column', gap: 20 }}>
      <div style={{
        fontFamily: T.sans, fontSize: 11, color: T.fg2,
        textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 4,
      }}>
        Bilan Xero — {data.length} organisation{data.length > 1 ? 's' : ''}
      </div>
      {data.map(org => (
        <TenantCard
          key={org.tenantId}
          tenantName={org.tenantName}
          data={org.data}
          error={org.error}
        />
      ))}
    </div>
  );
}
