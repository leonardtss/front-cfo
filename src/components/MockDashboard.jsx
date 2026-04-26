import { useContext, useEffect, useState } from 'react';
import { TweaksCtx } from '../context';
import { T, getAccentTokens } from '../tokens';

// ── Smooth bezier path from array of [x,y] points ──────────────────────────
function smoothPath(pts) {
  if (pts.length < 2) return '';
  let d = `M ${pts[0][0]},${pts[0][1]}`;
  for (let i = 0; i < pts.length - 1; i++) {
    const [x0, y0] = pts[i];
    const [x1, y1] = pts[i + 1];
    const dx = (x1 - x0) / 3;
    d += ` C ${x0 + dx},${y0} ${x1 - dx},${y1} ${x1},${y1}`;
  }
  return d;
}

// ── Chart data ───────────────────────────────────────────────────────────────
const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

// Portfolio net worth evolution (M$) — main line
const NW = [15.8, 15.4, 16.1, 16.8, 16.5, 17.2, 17.6, 17.3, 17.9, 18.1, 18.3, 18.42];
// Previous year comparison
const NW_PREV = [13.9, 13.6, 14.2, 14.7, 14.4, 15.0, 15.3, 15.1, 15.5, 15.7, 15.9, 16.2];

// Monthly returns (%)
const RETURNS = [+1.4, -0.6, +1.8, +0.9, -0.5, +1.5, +0.7, -0.4, +1.2, +0.8, +1.6, +2.1];

// Normalize array to SVG y coords in a given height
function toSvgY(arr, height, padT = 10, padB = 10) {
  const min = Math.min(...arr);
  const max = Math.max(...arr);
  const range = max - min || 1;
  return arr.map(v => padT + (1 - (v - min) / range) * (height - padT - padB));
}

function toSvgX(count, width, padL = 0, padR = 0) {
  return Array.from({ length: count }, (_, i) =>
    padL + (i / (count - 1)) * (width - padL - padR)
  );
}

// ── Area Chart ───────────────────────────────────────────────────────────────
function AreaChart({ data, dataPrev, color, colorPrev, width = 600, height = 130, id }) {
  const xs = toSvgX(data.length, width);
  const ys = toSvgY(data, height);
  const ysPrev = toSvgY([...data, ...dataPrev], height).slice(data.length);
  const xsPrev = xs;

  const pts = xs.map((x, i) => [x, ys[i]]);
  const ptsPrev = xsPrev.map((x, i) => [x, ysPrev[i]]);

  const linePath = smoothPath(pts);
  const linePrevPath = smoothPath(ptsPrev);
  const areaPath = `${linePath} L ${xs[xs.length-1]},${height} L ${xs[0]},${height} Z`;
  const areaPrevPath = `${linePrevPath} L ${xsPrev[xsPrev.length-1]},${height} L ${xsPrev[0]},${height} Z`;

  const labelCount = 6;
  const labelStep = Math.floor((data.length - 1) / (labelCount - 1));
  const labelIdxs = Array.from({ length: labelCount }, (_, i) => i * labelStep);

  return (
    <svg viewBox={`0 0 ${width} ${height + 20}`} width="100%" style={{ display: 'block', overflow: 'visible' }}>
      <defs>
        <linearGradient id={`area-${id}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.25" />
          <stop offset="100%" stopColor={color} stopOpacity="0" />
        </linearGradient>
        <linearGradient id={`area-prev-${id}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={colorPrev} stopOpacity="0.10" />
          <stop offset="100%" stopColor={colorPrev} stopOpacity="0" />
        </linearGradient>
      </defs>

      {/* Grid lines */}
      {[0.25, 0.5, 0.75, 1].map(f => (
        <line key={f}
          x1={0} y1={10 + f * (height - 20)} x2={width} y2={10 + f * (height - 20)}
          stroke={T.border0} strokeWidth="1" strokeDasharray="3,4" />
      ))}

      {/* Prev year area + line */}
      <path d={areaPrevPath} fill={`url(#area-prev-${id})`} />
      <path d={linePrevPath} fill="none" stroke={colorPrev} strokeWidth="1.2"
        strokeDasharray="4,3" opacity="0.45" />

      {/* Main area + line */}
      <path d={areaPath} fill={`url(#area-${id})`} />
      <path d={linePath} fill="none" stroke={color} strokeWidth="1.8" strokeLinecap="round" />

      {/* Last point dot */}
      <circle cx={xs[xs.length-1]} cy={ys[ys.length-1]} r="3.5" fill={color} />
      <circle cx={xs[xs.length-1]} cy={ys[ys.length-1]} r="6" fill={color} opacity="0.2" />

      {/* Month labels */}
      {labelIdxs.map(i => (
        <text key={i} x={xs[i]} y={height + 16} textAnchor="middle"
          fontFamily={T.sans} fontSize="9" fill="rgba(240,237,228,0.3)">
          {MONTHS[i]}
        </text>
      ))}
    </svg>
  );
}

// ── Bar Chart ────────────────────────────────────────────────────────────────
function BarChart({ data, colorPos, colorNeg, width = 260, height = 80 }) {
  const max = Math.max(...data.map(Math.abs));
  const barW = (width - (data.length - 1) * 4) / data.length;
  const centerY = height / 2;
  const scale = (centerY - 8) / max;

  return (
    <svg viewBox={`0 0 ${width} ${height}`} width="100%" style={{ display: 'block' }}>
      {/* Zero line */}
      <line x1={0} y1={centerY} x2={width} y2={centerY}
        stroke={T.border1} strokeWidth="0.8" />

      {data.map((v, i) => {
        const x = i * (barW + 4);
        const barH = Math.abs(v) * scale;
        const y = v >= 0 ? centerY - barH : centerY;
        const color = v >= 0 ? colorPos : colorNeg;
        return (
          <g key={i}>
            <rect x={x} y={y} width={barW} height={barH}
              fill={color} opacity="0.85" rx="1.5" />
          </g>
        );
      })}

      {/* Month labels (every 3) */}
      {data.map((_, i) => i % 3 === 0 ? (
        <text key={i}
          x={i * (barW + 4) + barW / 2} y={height - 1}
          textAnchor="middle" fontFamily={T.sans} fontSize="8"
          fill="rgba(240,237,228,0.28)">
          {MONTHS[i]}
        </text>
      ) : null)}
    </svg>
  );
}

// ── Sparkline ────────────────────────────────────────────────────────────────
function Sparkline({ data, color, width = 80, height = 28 }) {
  const xs = toSvgX(data.length, width);
  const ys = toSvgY(data, height, 3, 3);
  const pts = xs.map((x, i) => [x, ys[i]]);
  const line = smoothPath(pts);
  const area = `${line} L ${xs[xs.length-1]},${height} L ${xs[0]},${height} Z`;

  return (
    <svg viewBox={`0 0 ${width} ${height}`} width={width} height={height} style={{ display: 'block' }}>
      <defs>
        <linearGradient id={`sp-${color.replace('#','')}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.3" />
          <stop offset="100%" stopColor={color} stopOpacity="0" />
        </linearGradient>
      </defs>
      <path d={area} fill={`url(#sp-${color.replace('#','')})`} />
      <path d={line} fill="none" stroke={color} strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  );
}

// ── Radar Chart ─────────────────────────────────────────────────────────────
function RadarChart({ data, color, size = 110 }) {
  const pad = 22; // padding for labels
  const vb = size + pad * 2;
  const cx = vb / 2, cy = vb / 2, r = size * 0.38;
  const n = data.length;
  const angle = (i) => (i / n) * 2 * Math.PI - Math.PI / 2;

  const gridLevels = [0.33, 0.66, 1];

  const polyPoints = (vals, scale = 1) =>
    vals.map((v, i) => {
      const a = angle(i);
      const d = v * r * scale;
      return [cx + d * Math.cos(a), cy + d * Math.sin(a)];
    });

  const toStr = pts => pts.map(p => p.join(',')).join(' ');

  const outerPts = polyPoints(data.map(() => 1));
  const dataPts  = polyPoints(data);
  const labels   = ['Liquid.', 'Divers.', 'Tax eff.', 'Growth', 'Income', 'Risk'];

  return (
    <svg viewBox={`0 0 ${vb} ${vb}`} width={size} height={size} style={{ display: 'block' }}>
      {/* Grid rings */}
      {gridLevels.map(l => (
        <polygon key={l}
          points={toStr(polyPoints(data.map(() => 1), l))}
          fill="none" stroke={T.border0} strokeWidth="0.8" />
      ))}
      {/* Axis lines */}
      {outerPts.map((pt, i) => (
        <line key={i} x1={cx} y1={cy} x2={pt[0]} y2={pt[1]}
          stroke={T.border0} strokeWidth="0.8" />
      ))}
      {/* Data polygon */}
      <polygon points={toStr(dataPts)}
        fill={color} fillOpacity="0.18" stroke={color} strokeWidth="1.5" />
      {/* Data dots */}
      {dataPts.map((pt, i) => (
        <circle key={i} cx={pt[0]} cy={pt[1]} r="2.5" fill={color} />
      ))}
      {/* Labels */}
      {labels.map((label, i) => {
        const a = angle(i);
        const lx = cx + (r + 14) * Math.cos(a);
        const ly = cy + (r + 14) * Math.sin(a);
        const anchor = Math.cos(a) > 0.1 ? 'start' : Math.cos(a) < -0.1 ? 'end' : 'middle';
        return (
          <text key={i} x={lx} y={ly + 3} textAnchor={anchor}
            fontFamily={T.sans} fontSize="8" fill="rgba(240,237,228,0.45)">
            {label}
          </text>
        );
      })}
    </svg>
  );
}

// ── Main component ───────────────────────────────────────────────────────────
export default function MockDashboard() {
  const { accent } = useContext(TweaksCtx);
  const A = getAccentTokens(accent);
  const [animated, setAnimated] = useState(false);
  const [aiTyping, setAiTyping] = useState(false);
  const [aiMsg, setAiMsg] = useState('');

  const AI_TEXT = 'Liquidity at 34% — 3 capital calls due in 90 days. Recommend reallocating $180k from Henderson Trust to avoid a taxable event.';

  useEffect(() => {
    const t = setTimeout(() => setAnimated(true), 600);
    return () => clearTimeout(t);
  }, []);

  useEffect(() => {
    const t = setTimeout(() => {
      setAiTyping(true);
      let i = 0;
      const interval = setInterval(() => {
        i++;
        setAiMsg(AI_TEXT.slice(0, i));
        if (i >= AI_TEXT.length) { clearInterval(interval); setAiTyping(false); }
      }, 28);
      return () => clearInterval(interval);
    }, 2200);
    return () => clearTimeout(t);
  }, []);

  const sidebarItems = [
    { label: 'Overview', active: true },
    { label: 'Net Worth' },
    { label: 'Entities' },
    { label: 'Private equity' },
    { label: 'Real estate' },
    { label: 'Tax & estimates' },
    { label: 'AI co-pilot', special: true },
  ];

  const metrics = [
    { label: 'Public equity', value: '$7.8M', change: '+12.4%', up: true,  data: [62,65,60,68,72,70,75,78] },
    { label: 'Private equity', value: '$5.2M', change: '+8.1%',  up: true,  data: [50,52,49,55,54,58,57,60] },
    { label: 'Real estate',    value: '$3.3M', change: '+3.2%',  up: true,  data: [70,68,72,71,73,72,74,75] },
  ];

  return (
    <div style={{ marginTop: 80, position: 'relative' }}>
      <div style={{
        background: T.bg2, border: `1px solid ${T.border1}`, borderRadius: 16,
        overflow: 'hidden', maxWidth: 900, margin: '0 auto',
        boxShadow: '0 48px 120px rgba(0,0,0,0.72)',
      }}>
        {/* Window chrome */}
        <div style={{
          background: T.bg1, borderBottom: `1px solid ${T.border0}`,
          padding: '11px 18px', display: 'flex', alignItems: 'center', gap: 7,
        }}>
          {[T.fg3, T.fg3, T.fg3].map((c, i) => (
            <div key={i} style={{ width: 10, height: 10, borderRadius: '50%', background: c }} />
          ))}
          <div style={{
            flex: 1, background: 'rgba(240,237,228,0.04)', borderRadius: 4, height: 22,
            margin: '0 16px', display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <span style={{ fontFamily: T.mono, fontSize: 11, color: T.fg2 }}>
              app.cfoblack.com / overview
            </span>
          </div>
        </div>

        {/* Layout */}
        <div style={{ display: 'grid', gridTemplateColumns: '190px 1fr' }}>
          {/* Sidebar */}
          <div style={{ background: T.bg1, borderRight: `1px solid ${T.border0}`, padding: '20px 0' }}>
            <div style={{ padding: '0 14px', marginBottom: 20 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
                <svg width="10" height="15" viewBox="0 0 10 15" fill="none">
                  <rect x="0" y="0" width="2" height="15" rx="1" fill={A.bright} />
                  <rect x="0" y="0" width="6" height="2" rx="1" fill={A.bright} />
                  <rect x="0" y="13" width="6" height="2" rx="1" fill={A.bright} />
                </svg>
                <span style={{ fontFamily: T.sans, fontSize: 11, fontWeight: 500, color: T.fg0 }}>CFO Black</span>
              </div>
            </div>
            {sidebarItems.map(item => (
              <div key={item.label} style={{
                padding: '7px 14px', fontSize: 11, fontFamily: T.sans,
                color: item.active ? T.fg0 : item.special ? T.goldLight : T.fg2,
                background: item.active ? 'rgba(240,237,228,0.05)' : 'transparent',
                borderLeft: item.active ? `2px solid ${A.bright}` : '2px solid transparent',
                cursor: 'pointer',
              }}>
                {item.label}
              </div>
            ))}
          </div>

          {/* Main panel */}
          <div style={{ padding: '20px 24px', display: 'flex', flexDirection: 'column', gap: 16 }}>

            {/* Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div>
                <div style={{ fontFamily: T.sans, fontSize: 10, color: T.fg2, letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 3 }}>
                  Total net worth · all entities
                </div>
                <div style={{
                  fontFamily: T.mono, fontSize: 28, fontWeight: 500, color: T.fg0,
                  letterSpacing: '-1.5px', transition: 'opacity 600ms', opacity: animated ? 1 : 0,
                }}>
                  $18,420,000
                </div>
              </div>
              <div style={{ display: 'flex', gap: 4 }}>
                {['1M','3M','1Y','All'].map((p, i) => (
                  <div key={p} style={{
                    fontFamily: T.sans, fontSize: 10, padding: '3px 8px', borderRadius: 4,
                    background: i === 2 ? A.pale : 'transparent',
                    border: `1px solid ${i === 2 ? A.bright + '44' : T.border0}`,
                    color: i === 2 ? A.text : T.fg2, cursor: 'pointer',
                  }}>{p}</div>
                ))}
              </div>
            </div>

            {/* Area chart */}
            <div style={{ background: T.bg1, borderRadius: 8, padding: '12px 12px 6px', border: `1px solid ${T.border0}` }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                <span style={{ fontFamily: T.sans, fontSize: 10, color: T.fg2 }}>Portfolio performance</span>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                    <div style={{ width: 16, height: 1.5, background: A.bright, borderRadius: 1 }} />
                    <span style={{ fontFamily: T.sans, fontSize: 9, color: T.fg2 }}>2024</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                    <div style={{ width: 16, height: 0, borderTop: `1.5px dashed ${T.fg3}` }} />
                    <span style={{ fontFamily: T.sans, fontSize: 9, color: T.fg2 }}>2023</span>
                  </div>
                </div>
              </div>
              <AreaChart data={NW} dataPrev={NW_PREV} color={A.bright} colorPrev={T.fg2} id="nw" />
            </div>

            {/* Bottom row: metrics + bar chart + radar */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 10 }}>
              {/* Metric cards with sparklines */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                {metrics.map(m => (
                  <div key={m.label} style={{
                    background: T.bg1, borderRadius: 7, padding: '9px 12px',
                    border: `1px solid ${T.border0}`,
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                  }}>
                    <div>
                      <div style={{ fontFamily: T.sans, fontSize: 10, color: T.fg2, marginBottom: 2 }}>{m.label}</div>
                      <div style={{ fontFamily: T.mono, fontSize: 13, color: T.fg0, letterSpacing: '-0.5px' }}>{m.value}</div>
                      <div style={{ fontFamily: T.sans, fontSize: 10, color: m.up ? A.text : '#e05555' }}>{m.change}</div>
                    </div>
                    <Sparkline data={m.data} color={m.up ? A.bright : '#e05555'} />
                  </div>
                ))}
              </div>

              {/* Bar chart: monthly returns */}
              <div style={{
                background: T.bg1, borderRadius: 7, padding: '10px 12px',
                border: `1px solid ${T.border0}`,
              }}>
                <div style={{ fontFamily: T.sans, fontSize: 10, color: T.fg2, marginBottom: 8 }}>Monthly returns</div>
                <BarChart data={RETURNS} colorPos={A.bright} colorNeg="#e05555" />
                <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 6 }}>
                  <span style={{ fontFamily: T.sans, fontSize: 10, color: T.fg2 }}>YTD</span>
                  <span style={{ fontFamily: T.mono, fontSize: 11, color: A.text }}>+16.6%</span>
                </div>
              </div>

              {/* Radar chart: portfolio health */}
              <div style={{
                background: T.bg1, borderRadius: 7, padding: '10px 12px',
                border: `1px solid ${T.border0}`,
                display: 'flex', flexDirection: 'column', alignItems: 'center',
              }}>
                <div style={{ fontFamily: T.sans, fontSize: 10, color: T.fg2, marginBottom: 6, alignSelf: 'flex-start' }}>Portfolio health</div>
                <RadarChart data={[0.62, 0.85, 0.74, 0.90, 0.68, 0.55]} color={A.bright} />
              </div>
            </div>

            {/* AI insight with typewriter */}
            <div style={{
              background: T.bg3, border: `1px solid ${A.bright}`,
              borderRadius: 8, padding: '11px 14px', display: 'flex', gap: 10, alignItems: 'flex-start',
            }}>
              <div style={{
                width: 7, height: 7, borderRadius: '50%', background: A.bright,
                marginTop: 4, flexShrink: 0,
                boxShadow: `0 0 6px ${A.bright}`,
                animation: aiTyping ? 'pulse 0.6s ease-in-out infinite' : 'pulse 2s ease-in-out infinite',
              }} />
              <div style={{ flex: 1 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 5 }}>
                  <span style={{ fontFamily: T.sans, fontSize: 10, color: A.bright, fontWeight: 600, letterSpacing: '0.06em', textTransform: 'uppercase' }}>
                    AI insight
                  </span>
                  {aiTyping && (
                    <span style={{ fontFamily: T.sans, fontSize: 9, color: T.fg2, letterSpacing: '0.04em' }}>analyzing…</span>
                  )}
                </div>
                <div style={{ fontFamily: T.sans, fontSize: 12.5, color: T.fg0, lineHeight: 1.6 }}>
                  {aiMsg || ' '}
                  {aiTyping && <span style={{ animation: 'pulse 0.7s ease-in-out infinite', color: A.bright }}>▋</span>}
                </div>
              </div>
            </div>

          </div>
        </div>
      </div>

      {/* Bottom fade */}
      <div style={{
        position: 'absolute', bottom: 0, left: 0, right: 0, height: 40,
        background: `linear-gradient(to bottom, transparent, ${T.bg0})`, pointerEvents: 'none',
      }} />
    </div>
  );
}
