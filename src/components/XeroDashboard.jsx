import { useEffect, useState } from 'react';
import { useAuth } from '@clerk/react';
import { T } from '../tokens';

const API = import.meta.env.VITE_API_URL;

const ENTITY_COLORS = ['#3ddc84','#4fc3f7','#ffb74d','#f06292','#ab47bc','#26c6da','#ff7043','#9ccc65'];

// ── Multi-line chart ──────────────────────────────────────────────────────────
function smoothPath(pts) {
  if (pts.length < 2) return '';
  let d = `M ${pts[0][0]},${pts[0][1]}`;
  for (let i = 0; i < pts.length - 1; i++) {
    const [x0, y0] = pts[i], [x1, y1] = pts[i + 1];
    const dx = (x1 - x0) / 3;
    d += ` C ${x0+dx},${y0} ${x1-dx},${y1} ${x1},${y1}`;
  }
  return d;
}

function MultiLineChart({ series, width = 660, height = 160 }) {
  // series: [{ label, color, values: number[] }]
  if (!series?.length || !series[0]?.values?.length) return null;

  const n      = series[0].values.length;
  const allVals = series.flatMap(s => s.values).filter(v => !isNaN(v));
  const minV   = Math.min(...allVals);
  const maxV   = Math.max(...allVals);
  const range  = maxV - minV || 1;
  const padT = 12, padB = 24, padL = 0, padR = 0;

  const toX = i => padL + (i / (n - 1)) * (width - padL - padR);
  const toY = v => padT + (1 - (v - minV) / range) * (height - padT - padB);

  // Y axis labels
  const yTicks = [minV, minV + range * 0.5, maxV].map(v => ({
    y: toY(v), label: fmt(v),
  }));

  // X axis: show up to 6 labels evenly spaced
  const months   = series[0].months || series[0].values.map((_, i) => `M${i + 1}`);
  const xStep    = Math.max(1, Math.floor(n / 6));
  const xLabels  = months.map((m, i) => ({ x: toX(i), label: m, show: i % xStep === 0 || i === n - 1 }));

  return (
    <svg viewBox={`0 0 ${width} ${height}`} width="100%" style={{ display: 'block', overflow: 'visible' }}>
      {/* Grid */}
      {yTicks.map((t, i) => (
        <line key={i} x1={0} y1={t.y} x2={width} y2={t.y}
          stroke={T.border0} strokeWidth="1" strokeDasharray="3,5" />
      ))}

      {/* Y labels */}
      {yTicks.map((t, i) => (
        <text key={i} x={4} y={t.y - 3}
          fontFamily={T.mono} fontSize="8" fill="rgba(240,237,228,0.25)">{t.label}</text>
      ))}

      {/* Series */}
      {series.map((s, si) => {
        const pts = s.values.map((v, i) => [toX(i), toY(v)]);
        const line = smoothPath(pts);
        const area = `${line} L ${toX(n-1)},${height - padB} L ${toX(0)},${height - padB} Z`;
        const uid  = `ml-${si}`;
        return (
          <g key={si}>
            <defs>
              <linearGradient id={uid} x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%"   stopColor={s.color} stopOpacity="0.18" />
                <stop offset="100%" stopColor={s.color} stopOpacity="0" />
              </linearGradient>
            </defs>
            <path d={area} fill={`url(#${uid})`} />
            <path d={line} fill="none" stroke={s.color} strokeWidth="1.6" strokeLinecap="round" />
            {/* Last dot */}
            <circle cx={toX(n-1)} cy={toY(s.values[n-1])} r="3" fill={s.color} />
          </g>
        );
      })}

      {/* X labels */}
      {xLabels.filter(l => l.show).map((l, i) => (
        <text key={i} x={l.x} y={height - 6} textAnchor="middle"
          fontFamily={T.sans} fontSize="8" fill="rgba(240,237,228,0.28)">{l.label}</text>
      ))}
    </svg>
  );
}

function fmt(val, compact = true) {
  if (val == null || isNaN(val)) return '—';
  if (compact && Math.abs(val) >= 1_000_000)
    return `$${(val / 1_000_000).toFixed(2)}M`;
  if (compact && Math.abs(val) >= 1_000)
    return `$${(val / 1_000).toFixed(1)}k`;
  return new Intl.NumberFormat('en-AU', { style: 'currency', currency: 'AUD', maximumFractionDigits: 0 }).format(val);
}

// ── Donut SVG ─────────────────────────────────────────────────────────────────
function Donut({ segments, size = 140, thickness = 26 }) {
  const r   = (size - thickness) / 2;
  const cx  = size / 2, cy = size / 2;
  const circ = 2 * Math.PI * r;
  const total = segments.reduce((s, g) => s + Math.abs(g.value), 0) || 1;

  let cumAngle = -90;
  return (
    <svg width={size} height={size} style={{ display: 'block' }}>
      {segments.map((seg, i) => {
        const pct   = Math.abs(seg.value) / total;
        const angle = pct * 360;
        const dash  = pct * circ;
        const el = (
          <circle key={i}
            cx={cx} cy={cy} r={r}
            fill="none"
            stroke={seg.color}
            strokeWidth={thickness}
            strokeDasharray={`${dash} ${circ}`}
            transform={`rotate(${cumAngle} ${cx} ${cy})`}
            strokeLinecap="butt"
            style={{ transition: 'stroke-dasharray 500ms ease' }}
          />
        );
        cumAngle += angle;
        return el;
      })}
      {/* gap ring */}
      <circle cx={cx} cy={cy} r={r} fill="none" stroke={T.bg2} strokeWidth={thickness + 2}
        strokeDasharray={`0 ${circ}`} />
    </svg>
  );
}

// ── KPI card ─────────────────────────────────────────────────────────────────
function KPI({ label, value, sub, color, positive }) {
  const isPositive = positive ?? value >= 0;
  return (
    <div style={{
      background: T.bg1, border: `1px solid ${T.border0}`,
      borderRadius: 10, padding: '16px 18px', flex: '1 1 160px',
    }}>
      <div style={{ fontFamily: T.sans, fontSize: 10, color: T.fg2, textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 8 }}>
        {label}
      </div>
      <div style={{ fontFamily: T.mono, fontSize: 22, fontWeight: 500, letterSpacing: '-1px', color: color || T.fg0 }}>
        {fmt(value)}
      </div>
      {sub && (
        <div style={{ fontFamily: T.sans, fontSize: 11, color: T.fg2, marginTop: 4 }}>{sub}</div>
      )}
    </div>
  );
}

// ── Main ──────────────────────────────────────────────────────────────────────
export default function XeroDashboard({ clerkUserId }) {
  const { getToken } = useAuth();
  const [data, setData]         = useState(null);
  const [history, setHistory]   = useState(null);
  const [loading, setLoading]   = useState(true);
  const [error, setError]       = useState(null);

  useEffect(() => {
    if (!clerkUserId) return;
    (async () => {
      try {
        const token = await getToken();
        const headers = { Authorization: `Bearer ${token}` };

        const [dashRes, histRes] = await Promise.all([
          fetch(`${API}/api/xero/dashboard/${clerkUserId}`, { headers }),
          fetch(`${API}/api/xero/history/${clerkUserId}`,   { headers }),
        ]);

        if (dashRes.status === 401) { setError('reauth'); return; }
        if (!dashRes.ok) throw new Error(await dashRes.text());
        setData(await dashRes.json());
        if (histRes.ok) setHistory(await histRes.json());
      } catch (e) {
        setError(e.message);
      } finally {
        setLoading(false);
      }
    })();
  }, [clerkUserId]);

  if (loading) return (
    <div style={{ display: 'flex', justifyContent: 'center', padding: '40px 0' }}>
      <svg width="28" height="28" viewBox="0 0 28 28" fill="none" style={{ animation: 'spin 0.8s linear infinite' }}>
        <circle cx="14" cy="14" r="11" stroke={T.border1} strokeWidth="2.5" />
        <path d="M14 3 A11 11 0 0 1 25 14" stroke={T.greenBright} strokeWidth="2.5" strokeLinecap="round" />
      </svg>
    </div>
  );

  if (error === 'reauth') return (
    <div style={{ textAlign: 'center', padding: '24px 0' }}>
      <div style={{ fontFamily: T.sans, fontSize: 13, color: T.fg1, marginBottom: 12 }}>Session Xero expirée.</div>
      <button onClick={() => { window.location.href = `${API}/api/xero/login?clerkUserId=${clerkUserId}`; }}
        style={{ fontFamily: T.sans, fontSize: 13, color: T.fg0, background: T.bg2, border: `1px solid ${T.border1}`, padding: '8px 18px', borderRadius: 8, cursor: 'pointer' }}>
        Reconnecter Xero
      </button>
    </div>
  );

  if (error || !data) return (
    <div style={{ fontFamily: T.sans, fontSize: 13, color: '#e05555', textAlign: 'center', padding: '24px 0' }}>
      {error || 'Aucune donnée disponible.'}
    </div>
  );

  const { aggregated, entities, asOf, period } = data;

  // Segments pour le donut — actifs par entité
  const donutSegments = entities
    .filter(e => e.totalAssets > 0)
    .map((e, i) => ({ label: e.tenantName, value: e.totalAssets, color: ENTITY_COLORS[i % ENTITY_COLORS.length] }));

  // Si tous les actifs sont 0, utilise le cash
  const usesCash = donutSegments.length === 0;
  const cashSegments = entities
    .filter(e => e.cash > 0)
    .map((e, i) => ({ label: e.tenantName, value: e.cash, color: ENTITY_COLORS[i % ENTITY_COLORS.length] }));
  const segments = donutSegments.length ? donutSegments : cashSegments;
  const donutTotal = segments.reduce((s, g) => s + g.value, 0);

  return (
    <div style={{ width: '100%', maxWidth: 760, margin: '0 auto', display: 'flex', flexDirection: 'column', gap: 16 }}>

      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ fontFamily: T.sans, fontSize: 11, color: T.fg2, textTransform: 'uppercase', letterSpacing: '0.08em' }}>
          Vue consolidée · {entities.length} entité{entities.length > 1 ? 's' : ''}
        </div>
        <div style={{ fontFamily: T.mono, fontSize: 10, color: T.fg3 }}>
          au {asOf} · période : {period.from} → {period.to}
        </div>
      </div>

      {/* KPI row 1 */}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10 }}>
        <KPI label="Net Worth" value={aggregated.netWorth} color={T.greenText} />
        <KPI label="Total Actifs" value={aggregated.totalAssets} />
        <KPI label="Total Passifs" value={aggregated.totalLiabilities} color={aggregated.totalLiabilities > 0 ? '#ef5350' : T.fg0} />
        <KPI label="Cash on hand" value={aggregated.cash} sub={`${entities.filter(e=>e.cash>0).length} compte${entities.filter(e=>e.cash>0).length>1?'s':''}`} />
      </div>

      {/* KPI row 2 */}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10 }}>
        <KPI label="À encaisser" value={aggregated.receivables}
          color={aggregated.receivables > 0 ? '#ffb74d' : T.fg0}
          sub={`${entities.reduce((s,e)=>s+e.invoiceCount,0)} facture${entities.reduce((s,e)=>s+e.invoiceCount,0)>1?'s':''} en attente`} />
        <KPI label={`Revenus (${period.from.slice(0,7)})`} value={aggregated.revenue} color={T.greenText} />
        <KPI label="Dépenses" value={aggregated.expenses} color="#ef5350" />
        <KPI label="Profit net" value={aggregated.netProfit}
          color={aggregated.netProfit >= 0 ? T.greenText : '#ef5350'} />
      </div>

      {/* Multi-line chart — Net Worth par entité sur 12 mois */}
      {history?.some(h => h.equity?.length > 1) && (
        <div style={{ background: T.bg1, border: `1px solid ${T.border0}`, borderRadius: 10, padding: '16px 20px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
            <div style={{ fontFamily: T.sans, fontSize: 10, color: T.fg2, textTransform: 'uppercase', letterSpacing: '0.07em' }}>
              Net Worth par entité — 12 mois
            </div>
            <div style={{ display: 'flex', gap: 14 }}>
              {history.filter(h => h.equity?.length > 1).map((h, i) => (
                <div key={h.tenantId} style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                  <div style={{ width: 16, height: 2, background: ENTITY_COLORS[i % ENTITY_COLORS.length], borderRadius: 1 }} />
                  <span style={{ fontFamily: T.sans, fontSize: 9, color: T.fg2 }}>
                    {h.tenantName?.split(' ').slice(0, 2).join(' ')}
                  </span>
                </div>
              ))}
            </div>
          </div>
          <MultiLineChart
            series={history
              .filter(h => h.equity?.length > 1)
              .map((h, i) => ({
                label:  h.tenantName,
                color:  ENTITY_COLORS[i % ENTITY_COLORS.length],
                values: h.equity,
                months: h.months,
              }))
            }
          />
        </div>
      )}

      {/* Donut + entités */}
      <div style={{
        background: T.bg1, border: `1px solid ${T.border0}`,
        borderRadius: 10, padding: '20px 22px',
        display: 'flex', gap: 28, flexWrap: 'wrap', alignItems: 'center',
      }}>
        {/* Donut */}
        {segments.length > 0 && (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10 }}>
            <div style={{ position: 'relative' }}>
              <Donut segments={segments} size={140} thickness={26} />
              <div style={{
                position: 'absolute', top: '50%', left: '50%',
                transform: 'translate(-50%,-50%)', textAlign: 'center',
              }}>
                <div style={{ fontFamily: T.mono, fontSize: 13, fontWeight: 500, color: T.fg0, letterSpacing: '-0.5px' }}>
                  {fmt(donutTotal)}
                </div>
                <div style={{ fontFamily: T.sans, fontSize: 9, color: T.fg2 }}>
                  {usesCash ? 'cash' : 'actifs'}
                </div>
              </div>
            </div>
            {/* Legend */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
              {segments.map(s => (
                <div key={s.label} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <div style={{ width: 8, height: 8, borderRadius: 2, background: s.color, flexShrink: 0 }} />
                  <span style={{ fontFamily: T.sans, fontSize: 10, color: T.fg1 }}>
                    {s.label?.split(' ').slice(0, 2).join(' ')}
                  </span>
                  <span style={{ fontFamily: T.mono, fontSize: 10, color: T.fg2, marginLeft: 4 }}>
                    {((s.value / donutTotal) * 100).toFixed(0)}%
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Entity table */}
        <div style={{ flex: 1, minWidth: 260 }}>
          <div style={{ fontFamily: T.sans, fontSize: 10, color: T.fg2, textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 10 }}>
            Détail par entité
          </div>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontFamily: T.sans, fontSize: 11 }}>
            <thead>
              <tr>
                {['Entité','Actifs','Passifs','Equity','Cash','À enc.'].map(h => (
                  <th key={h} style={{ textAlign: h==='Entité'?'left':'right', color: T.fg2, fontWeight: 400, paddingBottom: 6, paddingRight: h==='À enc.'?0:8 }}>
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {entities.map((e, i) => (
                <tr key={e.tenantId} style={{ borderTop: `1px solid ${T.border0}` }}>
                  <td style={{ padding: '7px 8px 7px 0', color: T.fg0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      <div style={{ width: 6, height: 6, borderRadius: 1, background: ENTITY_COLORS[i % ENTITY_COLORS.length], flexShrink: 0 }} />
                      <span style={{ fontSize: 11 }}>{e.tenantName?.split(' ').slice(0,2).join(' ')}</span>
                    </div>
                  </td>
                  {[e.totalAssets, e.totalLiabilities, e.totalEquity, e.cash, e.receivables].map((v, j) => (
                    <td key={j} style={{
                      padding: '7px 8px 7px 0', textAlign: 'right',
                      fontFamily: T.mono, color: j===4&&v>0 ? '#ffb74d' : j===2&&v<0 ? '#ef5350' : T.fg1,
                    }}>
                      {fmt(v)}
                    </td>
                  ))}
                </tr>
              ))}
              {/* Total row */}
              <tr style={{ borderTop: `1px solid ${T.border1}` }}>
                <td style={{ padding: '8px 8px 0 0', color: T.fg0, fontWeight: 600, fontSize: 11 }}>Total</td>
                {[aggregated.totalAssets, aggregated.totalLiabilities, aggregated.netWorth, aggregated.cash, aggregated.receivables].map((v, j) => (
                  <td key={j} style={{
                    padding: '8px 8px 0 0', textAlign: 'right',
                    fontFamily: T.mono, fontWeight: 600,
                    color: j===2 ? T.greenText : j===1 ? '#ef5350' : T.fg0,
                  }}>
                    {fmt(v)}
                  </td>
                ))}
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* P&L par entité */}
      {entities.some(e => e.revenue > 0 || e.expenses > 0) && (
        <div style={{ background: T.bg1, border: `1px solid ${T.border0}`, borderRadius: 10, padding: '16px 22px' }}>
          <div style={{ fontFamily: T.sans, fontSize: 10, color: T.fg2, textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 12 }}>
            P&L — mois courant · par entité
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {entities.filter(e => e.revenue > 0 || e.expenses > 0).map((e, i) => {
              const max = Math.max(...entities.map(x => Math.max(x.revenue, x.expenses)), 1);
              return (
                <div key={e.tenantId}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                    <span style={{ fontFamily: T.sans, fontSize: 11, color: T.fg1 }}>{e.tenantName}</span>
                    <span style={{ fontFamily: T.mono, fontSize: 11, color: e.netProfit >= 0 ? T.greenText : '#ef5350' }}>
                      {e.netProfit >= 0 ? '+' : ''}{fmt(e.netProfit)}
                    </span>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                    {/* Revenue bar */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <div style={{ width: 40, fontFamily: T.sans, fontSize: 9, color: T.fg2, textAlign: 'right' }}>rev.</div>
                      <div style={{ flex: 1, height: 6, background: T.bg2, borderRadius: 3, overflow: 'hidden' }}>
                        <div style={{ width: `${(e.revenue/max)*100}%`, height: '100%', background: T.greenBright, borderRadius: 3 }} />
                      </div>
                      <div style={{ fontFamily: T.mono, fontSize: 9, color: T.fg2, width: 56, textAlign: 'right' }}>{fmt(e.revenue)}</div>
                    </div>
                    {/* Expenses bar */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <div style={{ width: 40, fontFamily: T.sans, fontSize: 9, color: T.fg2, textAlign: 'right' }}>dép.</div>
                      <div style={{ flex: 1, height: 6, background: T.bg2, borderRadius: 3, overflow: 'hidden' }}>
                        <div style={{ width: `${(e.expenses/max)*100}%`, height: '100%', background: '#ef5350', borderRadius: 3 }} />
                      </div>
                      <div style={{ fontFamily: T.mono, fontSize: 9, color: T.fg2, width: 56, textAlign: 'right' }}>{fmt(e.expenses)}</div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

    </div>
  );
}
