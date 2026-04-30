import { useEffect, useState } from 'react';
import { useAuth } from '@clerk/react';
import { useTheme } from '../ThemeContext';

const API = import.meta.env.VITE_API_URL;

const ASSET_CATEGORIES = {
  real_estate:    { label: 'Real estate',    icon: '🏠' },
  vehicle:        { label: 'Vehicle',        icon: '🚗' },
  private_equity: { label: 'Private equity', icon: '📈' },
  retirement:     { label: 'Retirement',     icon: '🏦' },
  cash:           { label: 'Cash',           icon: '💵' },
  other:          { label: 'Other',          icon: '📦' },
};

const LIABILITY_CATEGORIES = {
  mortgage:        { label: 'Mortgage',        icon: '🏠' },
  personal_loan:   { label: 'Personal loan',   icon: '💳' },
  line_of_credit:  { label: 'Line of credit',  icon: '🏦' },
  private_lending: { label: 'Private lending', icon: '🤝' },
  other:           { label: 'Other',           icon: '📋' },
};

function fmtAUD(val) {
  if (val == null || isNaN(val)) return '—';
  const abs = Math.abs(val);
  if (abs >= 1_000_000) return `$${(val / 1_000_000).toFixed(2)}M`;
  if (abs >= 1_000)     return `$${(val / 1_000).toFixed(1)}k`;
  return new Intl.NumberFormat('en-AU', { style: 'currency', currency: 'AUD', maximumFractionDigits: 0 }).format(val);
}

function fmtDate(d) {
  if (!d) return null;
  return new Date(d).toLocaleDateString('en-AU', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
}

function Spinner() {
  const { T } = useTheme();
  return (
    <svg width="28" height="28" viewBox="0 0 28 28" fill="none" style={{ animation: 'spin 0.8s linear infinite' }}>
      <circle cx="14" cy="14" r="11" stroke={T.border1} strokeWidth="2.5" />
      <path d="M14 3 A11 11 0 0 1 25 14" stroke={T.greenBright} strokeWidth="2.5" strokeLinecap="round" />
    </svg>
  );
}

// ── KPI card ──────────────────────────────────────────────────────────────────
function KPI({ label, value, color, sub }) {
  const { T } = useTheme();
  return (
    <div style={{
      background: T.bg1, border: `1px solid ${T.border0}`,
      borderRadius: 12, padding: '18px 20px', flex: '1 1 180px',
    }}>
      <div style={{ fontFamily: T.sans, fontSize: 10, color: T.fg2, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 10 }}>
        {label}
      </div>
      <div style={{ fontFamily: T.mono, fontSize: 26, fontWeight: 500, letterSpacing: '-1.5px', color: color || T.fg0, lineHeight: 1 }}>
        {fmtAUD(value)}
      </div>
      {sub && <div style={{ fontFamily: T.sans, fontSize: 11, color: T.fg3, marginTop: 6 }}>{sub}</div>}
    </div>
  );
}

// ── Breakdown bar ─────────────────────────────────────────────────────────────
function BreakdownBar({ breakdown, totalAUD }) {
  const { T } = useTheme();

  const segments = [
    { label: 'AU Banks',      value: breakdown.auBanks?.totalAUD    ?? 0, color: '#4fc3f7' },
    { label: 'US Banks',      value: breakdown.usBanks?.totalAUD    ?? 0, color: '#7986cb' },
    { label: 'Crypto',        value: breakdown.crypto?.totalAUD     ?? 0, color: '#F0B90B' },
    { label: 'Manual assets', value: breakdown.manualAssets?.totalAUD ?? 0, color: T.greenBright },
  ].filter(s => s.value > 0);

  const total = segments.reduce((s, x) => s + x.value, 0) || 1;

  return (
    <div style={{ background: T.bg1, border: `1px solid ${T.border0}`, borderRadius: 12, padding: '18px 20px' }}>
      <div style={{ fontFamily: T.sans, fontSize: 10, color: T.fg2, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 14 }}>
        Asset breakdown
      </div>

      {/* Bar */}
      <div style={{ display: 'flex', height: 10, borderRadius: 99, overflow: 'hidden', gap: 2, marginBottom: 16 }}>
        {segments.map((s, i) => (
          <div key={i} style={{
            width: `${(s.value / total) * 100}%`,
            background: s.color,
            borderRadius: i === 0 ? '99px 0 0 99px' : i === segments.length - 1 ? '0 99px 99px 0' : 0,
            transition: 'width 600ms ease',
          }} />
        ))}
      </div>

      {/* Legend */}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px 20px' }}>
        {segments.map((s, i) => (
          <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <div style={{ width: 8, height: 8, borderRadius: 2, background: s.color, flexShrink: 0 }} />
            <span style={{ fontFamily: T.sans, fontSize: 11, color: T.fg2 }}>{s.label}</span>
            <span style={{ fontFamily: T.mono, fontSize: 11, color: T.fg1 }}>{fmtAUD(s.value)}</span>
            <span style={{ fontFamily: T.sans, fontSize: 10, color: T.fg3 }}>
              {((s.value / total) * 100).toFixed(0)}%
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Account row ───────────────────────────────────────────────────────────────
function AccountRow({ item, type }) {
  const { T } = useTheme();
  const isLiability = type === 'liability';

  const label = (() => {
    if (type === 'bank') return item.institutionName || item.source?.toUpperCase();
    if (type === 'asset') return ASSET_CATEGORIES[item.category]?.label ?? item.category;
    if (type === 'liability') return LIABILITY_CATEGORIES[item.category]?.label ?? item.category;
    if (type === 'crypto') return 'Crypto';
    return '';
  })();

  const icon = (() => {
    if (type === 'asset') return ASSET_CATEGORIES[item.category]?.icon ?? '📦';
    if (type === 'liability') return LIABILITY_CATEGORIES[item.category]?.icon ?? '📋';
    if (type === 'bank' && item.source === 'basiq') return '🇦🇺';
    if (type === 'bank' && item.source === 'teller') return '🇺🇸';
    if (type === 'crypto') return '₿';
    return '•';
  })();

  const value    = isLiability ? item.balanceAUD : (item.valueAUD ?? item.balanceAUD ?? 0);
  const currency = item.currency;

  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: 12,
      padding: '10px 0', borderBottom: `1px solid ${T.border0}`,
    }}>
      <div style={{
        width: 32, height: 32, borderRadius: 8, flexShrink: 0,
        background: isLiability ? 'rgba(239,83,80,0.08)' : T.bg2,
        border: `1px solid ${isLiability ? 'rgba(239,83,80,0.18)' : T.border0}`,
        display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14,
      }}>
        {icon}
      </div>

      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontFamily: T.sans, fontSize: 12, color: T.fg0,
          whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
          {item.name}
        </div>
        <div style={{ fontFamily: T.sans, fontSize: 10, color: T.fg3, marginTop: 1 }}>
          {label}{item.last4 ? ` ···${item.last4}` : ''}{item.rate ? ` · ${item.rate}%` : ''}
        </div>
      </div>

      <div style={{ textAlign: 'right', flexShrink: 0 }}>
        <div style={{ fontFamily: T.mono, fontSize: 13, color: isLiability ? '#ef5350' : T.fg0 }}>
          {isLiability ? '−' : ''}{fmtAUD(value)}
        </div>
        {currency && currency !== 'AUD' && (
          <div style={{ fontFamily: T.mono, fontSize: 10, color: T.fg3, marginTop: 1 }}>
            {currency}
          </div>
        )}
      </div>
    </div>
  );
}

// ── Section wrapper ───────────────────────────────────────────────────────────
function Section({ title, count, totalAUD, isLiability, children }) {
  const { T } = useTheme();
  return (
    <div style={{ background: T.bg1, border: `1px solid ${T.border0}`, borderRadius: 12, padding: '16px 20px' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ fontFamily: T.sans, fontSize: 10, color: T.fg2, textTransform: 'uppercase', letterSpacing: '0.08em' }}>
            {title}
          </span>
          {count != null && (
            <span style={{ fontFamily: T.mono, fontSize: 9, color: T.fg3, background: T.bg2, padding: '1px 6px', borderRadius: 99 }}>
              {count}
            </span>
          )}
        </div>
        {totalAUD != null && (
          <span style={{ fontFamily: T.mono, fontSize: 12, color: isLiability ? '#ef5350' : T.fg1 }}>
            {isLiability ? '−' : ''}{fmtAUD(totalAUD)}
          </span>
        )}
      </div>
      {children}
    </div>
  );
}

// ── Main ──────────────────────────────────────────────────────────────────────
export default function Overview({ clerkUserId }) {
  const { T } = useTheme();
  const { getToken } = useAuth();
  const [data, setData]       = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState(null);

  async function fetchOverview() {
    setLoading(true);
    setError(null);
    try {
      const token = await getToken();
      const r = await fetch(`${API}/api/overview/${clerkUserId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const json = await r.json();
      if (!r.ok) throw new Error(json.error || 'Error');
      setData(json);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { fetchOverview(); }, [clerkUserId]);

  if (loading) return (
    <div style={{ display: 'flex', justifyContent: 'center', paddingTop: 80 }}>
      <Spinner />
    </div>
  );

  if (error) return (
    <div style={{ fontFamily: T.sans, fontSize: 13, color: '#ef5350', padding: 40 }}>{error}</div>
  );

  if (!data) return null;

  const netPositive = data.netWorthAUD >= 0;
  const hasAnyData  = data.accounts.length || data.assets.length || data.liabilities.length || data.crypto.length;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20, maxWidth: 860 }}>

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
        <div>
          <div style={{ fontFamily: T.serif, fontSize: 13, color: T.fg3, letterSpacing: '0.06em', textTransform: 'uppercase', marginBottom: 6 }}>
            Net worth
          </div>
          <div style={{ fontFamily: T.mono, fontSize: 42, fontWeight: 500, letterSpacing: '-2px', color: netPositive ? T.fg0 : '#ef5350', lineHeight: 1 }}>
            {fmtAUD(data.netWorthAUD)}
          </div>
          <div style={{ fontFamily: T.sans, fontSize: 11, color: T.fg3, marginTop: 8 }}>
            All values in AUD
            {data.oldestSnapshot && (
              <span> · Bank data from {fmtDate(data.oldestSnapshot)}</span>
            )}
          </div>
        </div>
        <button
          onClick={fetchOverview}
          style={{
            display: 'flex', alignItems: 'center', gap: 6,
            fontFamily: T.sans, fontSize: 11, color: T.fg2,
            background: 'none', border: `1px solid ${T.border1}`,
            borderRadius: 8, padding: '6px 12px', cursor: 'pointer',
            transition: 'all 150ms', flexShrink: 0,
          }}>
          <svg width="11" height="11" viewBox="0 0 11 11" fill="none">
            <path d="M9.5 5.5A4 4 0 1 1 8 2.3" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/>
            <path d="M9.5 1.5v3h-3" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
          Refresh
        </button>
      </div>

      {/* KPIs */}
      <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
        <KPI label="Total assets"      value={data.totalAssetsAUD}    color={T.greenText} />
        <KPI label="Total liabilities" value={data.liabilityTotalAUD} color="#ef5350"
          sub={data.breakdown.liabilities.count ? `${data.breakdown.liabilities.count} debt${data.breakdown.liabilities.count !== 1 ? 's' : ''}` : null} />
        <KPI label="Net worth"         value={data.netWorthAUD}       color={netPositive ? T.greenText : '#ef5350'} />
      </div>

      {/* Breakdown bar */}
      {hasAnyData && <BreakdownBar breakdown={data.breakdown} totalAUD={data.totalAssetsAUD} />}

      {/* Empty state */}
      {!hasAnyData && (
        <div style={{ background: T.bg1, border: `1px solid ${T.border0}`, borderRadius: 12, padding: '48px 24px', textAlign: 'center' }}>
          <div style={{ fontSize: 32, marginBottom: 12 }}>📊</div>
          <div style={{ fontFamily: T.sans, fontSize: 14, color: T.fg1, marginBottom: 6 }}>No data yet</div>
          <div style={{ fontFamily: T.sans, fontSize: 12, color: T.fg3 }}>
            Connect your banks, add manual assets or liabilities to see your net worth here.
          </div>
        </div>
      )}

      {/* Bank accounts */}
      {data.accounts.length > 0 && (
        <Section
          title="Bank accounts"
          count={data.accounts.length}
          totalAUD={data.breakdown.auBanks.totalAUD + data.breakdown.usBanks.totalAUD}>
          {data.accounts.map(a => <AccountRow key={a.id} item={a} type="bank" />)}
        </Section>
      )}

      {/* Crypto */}
      {data.crypto.length > 0 && (
        <Section title="Crypto" totalAUD={data.breakdown.crypto.totalAUD}>
          {data.crypto.filter(a => a.usd > 0).slice(0, 20).map((a, i) => (
            <AccountRow key={i} item={{ name: a.asset, balanceAUD: a.usd * (data.rates.USD ?? 1.55), currency: 'USD' }} type="crypto" />
          ))}
        </Section>
      )}

      {/* Manual assets */}
      {data.assets.length > 0 && (
        <Section title="Manual assets" count={data.assets.length} totalAUD={data.breakdown.manualAssets.totalAUD}>
          {data.assets.map(a => <AccountRow key={a.id} item={a} type="asset" />)}
        </Section>
      )}

      {/* Liabilities */}
      {data.liabilities.length > 0 && (
        <Section title="Liabilities" count={data.liabilities.length} totalAUD={data.liabilityTotalAUD} isLiability>
          {data.liabilities.map(l => <AccountRow key={l.id} item={l} type="liability" />)}
        </Section>
      )}
    </div>
  );
}
