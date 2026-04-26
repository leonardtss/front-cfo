import { useContext, useEffect, useState } from 'react';
import { TweaksCtx } from '../context';
import { T, getAccentTokens } from '../tokens';
import { useMedia } from '../hooks/useMedia';

// ── Shared helpers ────────────────────────────────────────────────────────────
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

function toSvgY(arr, height, padT = 8, padB = 8) {
  const min = Math.min(...arr);
  const max = Math.max(...arr);
  const range = max - min || 1;
  return arr.map(v => padT + (1 - (v - min) / range) * (height - padT - padB));
}

function toSvgX(count, width) {
  return Array.from({ length: count }, (_, i) => (i / (count - 1)) * width);
}

const NW      = [15.8, 15.4, 16.1, 16.8, 16.5, 17.2, 17.6, 17.3, 17.9, 18.1, 18.3, 18.42];
const NW_PREV = [13.9, 13.6, 14.2, 14.7, 14.4, 15.0, 15.3, 15.1, 15.5, 15.7, 15.9, 16.2];
const MONTHS  = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
const RETURNS = [+1.4, -0.6, +1.8, +0.9, -0.5, +1.5, +0.7, -0.4, +1.2, +0.8, +1.6, +2.1];

// ── Mini area chart ───────────────────────────────────────────────────────────
function MiniArea({ data, dataPrev, color, colorPrev, width, height, id }) {
  const xs    = toSvgX(data.length, width);
  const allY  = toSvgY([...data, ...dataPrev], height);
  const ys    = allY.slice(0, data.length);
  const ysPrev = allY.slice(data.length);

  const pts     = xs.map((x, i) => [x, ys[i]]);
  const ptsPrev = xs.map((x, i) => [x, ysPrev[i]]);
  const line    = smoothPath(pts);
  const linePrev = smoothPath(ptsPrev);
  const area    = `${line} L ${xs[xs.length-1]},${height} L ${xs[0]},${height} Z`;
  const areaPrev = `${linePrev} L ${xs[xs.length-1]},${height} L ${xs[0]},${height} Z`;

  const labelIdxs = [0, 2, 5, 8, 11];

  return (
    <svg viewBox={`0 0 ${width} ${height + 14}`} width="100%" style={{ display: 'block', overflow: 'visible' }}>
      <defs>
        <linearGradient id={`ma-${id}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%"   stopColor={color}      stopOpacity="0.28" />
          <stop offset="100%" stopColor={color}      stopOpacity="0" />
        </linearGradient>
        <linearGradient id={`ma-p-${id}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%"   stopColor={colorPrev}  stopOpacity="0.10" />
          <stop offset="100%" stopColor={colorPrev}  stopOpacity="0" />
        </linearGradient>
      </defs>
      {[0.33, 0.66, 1].map(f => (
        <line key={f} x1={0} y1={f * height} x2={width} y2={f * height}
          stroke={T.border0} strokeWidth="0.7" strokeDasharray="3,4" />
      ))}
      <path d={areaPrev} fill={`url(#ma-p-${id})`} />
      <path d={linePrev} fill="none" stroke={colorPrev} strokeWidth="1"
        strokeDasharray="3,3" opacity="0.4" />
      <path d={area}    fill={`url(#ma-${id})`} />
      <path d={line}    fill="none" stroke={color} strokeWidth="1.6" strokeLinecap="round" />
      <circle cx={xs[xs.length-1]} cy={ys[ys.length-1]} r="3" fill={color} />
      <circle cx={xs[xs.length-1]} cy={ys[ys.length-1]} r="5.5" fill={color} opacity="0.2" />
      {labelIdxs.map(i => (
        <text key={i} x={xs[i]} y={height + 11} textAnchor="middle"
          fontFamily={T.sans} fontSize="7.5" fill="rgba(240,237,228,0.28)">
          {MONTHS[i]}
        </text>
      ))}
    </svg>
  );
}

// ── Mini sparkline ────────────────────────────────────────────────────────────
function Spark({ data, color, width = 52, height = 22 }) {
  const xs   = toSvgX(data.length, width);
  const ys   = toSvgY(data, height, 2, 2);
  const pts  = xs.map((x, i) => [x, ys[i]]);
  const line = smoothPath(pts);
  const area = `${line} L ${xs[xs.length-1]},${height} L ${xs[0]},${height} Z`;
  return (
    <svg viewBox={`0 0 ${width} ${height}`} width={width} height={height} style={{ display: 'block' }}>
      <defs>
        <linearGradient id={`sk-${color.replace('#','')}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%"   stopColor={color} stopOpacity="0.3" />
          <stop offset="100%" stopColor={color} stopOpacity="0" />
        </linearGradient>
      </defs>
      <path d={area} fill={`url(#sk-${color.replace('#','')})`} />
      <path d={line} fill="none" stroke={color} strokeWidth="1.4" strokeLinecap="round" />
    </svg>
  );
}

// ── Mini bar chart ────────────────────────────────────────────────────────────
function MiniBar({ data, colorPos, colorNeg, width, height }) {
  const max  = Math.max(...data.map(Math.abs));
  const barW = (width - (data.length - 1) * 2) / data.length;
  const cy   = height / 2;
  const scale = (cy - 5) / max;
  return (
    <svg viewBox={`0 0 ${width} ${height}`} width="100%" style={{ display: 'block' }}>
      <line x1={0} y1={cy} x2={width} y2={cy} stroke={T.border1} strokeWidth="0.6" />
      {data.map((v, i) => {
        const x  = i * (barW + 2);
        const bh = Math.abs(v) * scale;
        const y  = v >= 0 ? cy - bh : cy;
        return (
          <rect key={i} x={x} y={y} width={barW} height={bh}
            fill={v >= 0 ? colorPos : colorNeg} opacity="0.85" rx="1" />
        );
      })}
    </svg>
  );
}

// ── Radar chart ───────────────────────────────────────────────────────────────
function RadarChart({ data, color, size = 80 }) {
  const pad = 18;
  const vb  = size + pad * 2;
  const cx  = vb / 2, cy = vb / 2, r = size * 0.38;
  const n   = data.length;
  const angle = i => (i / n) * 2 * Math.PI - Math.PI / 2;

  const polyPts = (vals, scale = 1) =>
    vals.map((v, i) => {
      const a = angle(i);
      const d = v * r * scale;
      return [cx + d * Math.cos(a), cy + d * Math.sin(a)];
    });

  const toStr = pts => pts.map(p => p.join(',')).join(' ');
  const outer = polyPts(data.map(() => 1));
  const inner = polyPts(data);
  const labels = ['Liq.', 'Div.', 'Tax', 'Growth', 'Income', 'Risk'];

  return (
    <svg viewBox={`0 0 ${vb} ${vb}`} width={size} height={size} style={{ display: 'block' }}>
      {[0.33, 0.66, 1].map(l => (
        <polygon key={l} points={toStr(polyPts(data.map(() => 1), l))}
          fill="none" stroke={T.border0} strokeWidth="0.7" />
      ))}
      {outer.map((pt, i) => (
        <line key={i} x1={cx} y1={cy} x2={pt[0]} y2={pt[1]}
          stroke={T.border0} strokeWidth="0.7" />
      ))}
      <polygon points={toStr(inner)}
        fill={color} fillOpacity="0.18" stroke={color} strokeWidth="1.3" />
      {inner.map((pt, i) => (
        <circle key={i} cx={pt[0]} cy={pt[1]} r="2" fill={color} />
      ))}
      {labels.map((lbl, i) => {
        const a   = angle(i);
        const lx  = cx + (r + 12) * Math.cos(a);
        const ly  = cy + (r + 12) * Math.sin(a);
        const anchor = Math.cos(a) > 0.1 ? 'start' : Math.cos(a) < -0.1 ? 'end' : 'middle';
        return (
          <text key={i} x={lx} y={ly + 3} textAnchor={anchor}
            fontFamily={T.sans} fontSize="7" fill="rgba(240,237,228,0.4)">
            {lbl}
          </text>
        );
      })}
    </svg>
  );
}

// ── Phone mockup (< 768 px) ──────────────────────────────────────────────────
function PhoneMockup({ A, animated, aiMsg, aiTyping }) {
  const metrics = [
    { label: 'Public eq.',   value: '$7.8M',  change: '+12.4%', data: [62,65,60,68,72,70,75,78] },
    { label: 'Private eq.',  value: '$5.2M',  change: '+8.1%',  data: [50,52,49,55,54,58,57,60] },
    { label: 'Real estate',  value: '$3.3M',  change: '+3.2%',  data: [70,68,72,71,73,72,74,75] },
  ];

  return (
    <div style={{
      width: 300, margin: '0 auto',
      background: T.bg2, border: `1.5px solid ${T.border1}`,
      borderRadius: 28, overflow: 'hidden',
      boxShadow: '0 40px 100px rgba(0,0,0,0.75)',
    }}>
      {/* Status bar */}
      <div style={{
        background: T.bg1, padding: '10px 18px 8px',
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
      }}>
        <span style={{ fontFamily: T.mono, fontSize: 9, color: T.fg2 }}>9:41</span>
        <div style={{
          width: 60, height: 14, background: T.bg0, borderRadius: 7,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          <span style={{ fontFamily: T.mono, fontSize: 8, color: T.fg3 }}>cfoblack.com</span>
        </div>
        <div style={{ display: 'flex', gap: 3, alignItems: 'center' }}>
          {[3,3,3].map((_, i) => (
            <div key={i} style={{ width: 3, height: 3, borderRadius: '50%', background: T.fg3 }} />
          ))}
        </div>
      </div>

      {/* App nav row */}
      <div style={{
        background: T.bg1, borderBottom: `1px solid ${T.border0}`,
        padding: '7px 14px', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
          <svg width="8" height="12" viewBox="0 0 8 12" fill="none">
            <rect x="0" y="0" width="2" height="12" rx="1" fill={A.bright} />
            <rect x="0" y="0" width="5" height="1.5" rx="0.75" fill={A.bright} />
            <rect x="0" y="10.5" width="5" height="1.5" rx="0.75" fill={A.bright} />
          </svg>
          <span style={{ fontFamily: T.sans, fontSize: 10, fontWeight: 500, color: T.fg0 }}>CFO Black</span>
        </div>
        <div style={{ display: 'flex', gap: 2 }}>
          {['Overview','Entities','AI'].map((tab, i) => (
            <div key={tab} style={{
              fontFamily: T.sans, fontSize: 8.5, padding: '3px 7px', borderRadius: 4,
              background: i === 0 ? A.pale : 'transparent',
              color: i === 0 ? A.text : T.fg2,
              border: `1px solid ${i === 0 ? A.bright + '44' : 'transparent'}`,
            }}>{tab}</div>
          ))}
        </div>
      </div>

      {/* Content */}
      <div style={{ padding: '14px 14px', display: 'flex', flexDirection: 'column', gap: 10 }}>

        {/* Net worth */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div>
            <div style={{ fontFamily: T.sans, fontSize: 8, color: T.fg2, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 2 }}>
              Total net worth
            </div>
            <div style={{
              fontFamily: T.mono, fontSize: 20, fontWeight: 500, color: T.fg0,
              letterSpacing: '-1px', transition: 'opacity 600ms', opacity: animated ? 1 : 0,
            }}>
              $18.42M
            </div>
          </div>
          <div style={{
            fontFamily: T.sans, fontSize: 9, color: A.text,
            background: A.pale, border: `1px solid ${A.bright}33`,
            padding: '3px 7px', borderRadius: 4, marginTop: 4,
          }}>
            +14.2% YTD
          </div>
        </div>

        {/* Area chart */}
        <div style={{
          background: T.bg1, borderRadius: 7, padding: '8px 8px 4px',
          border: `1px solid ${T.border0}`,
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 5 }}>
            <span style={{ fontFamily: T.sans, fontSize: 8, color: T.fg2 }}>Portfolio performance</span>
            <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
              <div style={{ display: 'flex', gap: 3, alignItems: 'center' }}>
                <div style={{ width: 10, height: 1.5, background: A.bright }} />
                <span style={{ fontFamily: T.sans, fontSize: 7, color: T.fg2 }}>2024</span>
              </div>
              <div style={{ display: 'flex', gap: 3, alignItems: 'center' }}>
                <div style={{ width: 10, height: 0, borderTop: `1.5px dashed ${T.fg3}` }} />
                <span style={{ fontFamily: T.sans, fontSize: 7, color: T.fg2 }}>2023</span>
              </div>
            </div>
          </div>
          <MiniArea data={NW} dataPrev={NW_PREV} color={A.bright} colorPrev={T.fg2} width={272} height={72} id="ph" />
        </div>

        {/* Metric cards */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 5 }}>
          {metrics.map(m => (
            <div key={m.label} style={{
              background: T.bg1, borderRadius: 6, padding: '8px 8px 6px',
              border: `1px solid ${T.border0}`,
            }}>
              <div style={{ fontFamily: T.sans, fontSize: 7.5, color: T.fg2, marginBottom: 2 }}>{m.label}</div>
              <div style={{ fontFamily: T.mono, fontSize: 11, color: T.fg0, letterSpacing: '-0.3px', marginBottom: 1 }}>{m.value}</div>
              <div style={{ fontFamily: T.sans, fontSize: 7.5, color: A.text, marginBottom: 5 }}>{m.change}</div>
              <Spark data={m.data} color={A.bright} width={52} height={18} />
            </div>
          ))}
        </div>

        {/* AI insight */}
        <div style={{
          background: T.bg3, border: `1px solid ${A.bright}`,
          borderRadius: 7, padding: '8px 10px', display: 'flex', gap: 7, alignItems: 'flex-start',
        }}>
          <div style={{
            width: 5, height: 5, borderRadius: '50%', background: A.bright,
            marginTop: 3, flexShrink: 0, boxShadow: `0 0 5px ${A.bright}`,
            animation: aiTyping ? 'pulse 0.6s ease-in-out infinite' : 'pulse 2s ease-in-out infinite',
          }} />
          <div style={{ flex: 1 }}>
            <div style={{ fontFamily: T.sans, fontSize: 8, color: A.bright, fontWeight: 600, letterSpacing: '0.06em', textTransform: 'uppercase', marginBottom: 4 }}>
              AI insight
            </div>
            <div style={{ fontFamily: T.sans, fontSize: 10.5, color: T.fg0, lineHeight: 1.55 }}>
              {aiMsg || ' '}
              {aiTyping && <span style={{ animation: 'pulse 0.7s ease-in-out infinite', color: A.bright }}>▋</span>}
            </div>
          </div>
        </div>

      </div>

      {/* Home indicator */}
      <div style={{
        background: T.bg1, padding: '8px 0 12px',
        display: 'flex', justifyContent: 'center',
      }}>
        <div style={{ width: 80, height: 4, background: T.fg3, borderRadius: 2 }} />
      </div>
    </div>
  );
}

// ── Tablet mockup (768–1023 px) ───────────────────────────────────────────────
function TabletMockup({ A, animated, aiMsg, aiTyping }) {
  const metrics = [
    { label: 'Public equity',  value: '$7.8M',  change: '+12.4%', data: [62,65,60,68,72,70,75,78] },
    { label: 'Private equity', value: '$5.2M',  change: '+8.1%',  data: [50,52,49,55,54,58,57,60] },
    { label: 'Real estate',    value: '$3.3M',  change: '+3.2%',  data: [70,68,72,71,73,72,74,75] },
  ];

  return (
    <div style={{
      width: '100%', maxWidth: 660, margin: '0 auto',
      background: T.bg2, border: `1.5px solid ${T.border1}`,
      borderRadius: 18, overflow: 'hidden',
      boxShadow: '0 44px 110px rgba(0,0,0,0.72)',
    }}>
      {/* Chrome */}
      <div style={{
        background: T.bg1, borderBottom: `1px solid ${T.border0}`,
        padding: '10px 16px', display: 'flex', alignItems: 'center', gap: 6,
      }}>
        {[T.fg3, T.fg3, T.fg3].map((c, i) => (
          <div key={i} style={{ width: 9, height: 9, borderRadius: '50%', background: c }} />
        ))}
        <div style={{
          flex: 1, background: 'rgba(240,237,228,0.04)', borderRadius: 4, height: 20,
          margin: '0 12px', display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          <span style={{ fontFamily: T.mono, fontSize: 10, color: T.fg2 }}>app.cfoblack.com / overview</span>
        </div>
      </div>

      {/* Body: slim sidebar + main */}
      <div style={{ display: 'grid', gridTemplateColumns: '140px 1fr' }}>
        {/* Sidebar */}
        <div style={{ background: T.bg1, borderRight: `1px solid ${T.border0}`, padding: '16px 0' }}>
          <div style={{ padding: '0 12px', marginBottom: 16 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
              <svg width="8" height="12" viewBox="0 0 8 12" fill="none">
                <rect x="0" y="0" width="2" height="12" rx="1" fill={A.bright} />
                <rect x="0" y="0" width="5" height="1.5" rx="0.75" fill={A.bright} />
                <rect x="0" y="10.5" width="5" height="1.5" rx="0.75" fill={A.bright} />
              </svg>
              <span style={{ fontFamily: T.sans, fontSize: 10, fontWeight: 500, color: T.fg0 }}>CFO Black</span>
            </div>
          </div>
          {[
            { label: 'Overview', active: true },
            { label: 'Net Worth' },
            { label: 'Entities' },
            { label: 'Tax & est.' },
            { label: 'AI co-pilot', special: true },
          ].map(item => (
            <div key={item.label} style={{
              padding: '6px 12px', fontSize: 10, fontFamily: T.sans,
              color: item.active ? T.fg0 : item.special ? T.goldLight : T.fg2,
              background: item.active ? 'rgba(240,237,228,0.05)' : 'transparent',
              borderLeft: item.active ? `2px solid ${A.bright}` : '2px solid transparent',
            }}>{item.label}</div>
          ))}
        </div>

        {/* Main */}
        <div style={{ padding: '16px 18px', display: 'flex', flexDirection: 'column', gap: 12 }}>

          {/* Header */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div>
              <div style={{ fontFamily: T.sans, fontSize: 8, color: T.fg2, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 2 }}>
                Total net worth · all entities
              </div>
              <div style={{
                fontFamily: T.mono, fontSize: 22, fontWeight: 500, color: T.fg0,
                letterSpacing: '-1.2px', transition: 'opacity 600ms', opacity: animated ? 1 : 0,
              }}>
                $18,420,000
              </div>
            </div>
            <div style={{ display: 'flex', gap: 3 }}>
              {['1M','3M','1Y','All'].map((p, i) => (
                <div key={p} style={{
                  fontFamily: T.sans, fontSize: 9, padding: '2px 6px', borderRadius: 4,
                  background: i === 2 ? A.pale : 'transparent',
                  border: `1px solid ${i === 2 ? A.bright + '44' : T.border0}`,
                  color: i === 2 ? A.text : T.fg2,
                }}>{p}</div>
              ))}
            </div>
          </div>

          {/* Area chart */}
          <div style={{
            background: T.bg1, borderRadius: 7, padding: '10px 10px 5px',
            border: `1px solid ${T.border0}`,
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
              <span style={{ fontFamily: T.sans, fontSize: 9, color: T.fg2 }}>Portfolio performance</span>
              <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
                <div style={{ display: 'flex', gap: 3, alignItems: 'center' }}>
                  <div style={{ width: 12, height: 1.5, background: A.bright }} />
                  <span style={{ fontFamily: T.sans, fontSize: 8, color: T.fg2 }}>2024</span>
                </div>
                <div style={{ display: 'flex', gap: 3, alignItems: 'center' }}>
                  <div style={{ width: 12, height: 0, borderTop: `1.5px dashed ${T.fg3}` }} />
                  <span style={{ fontFamily: T.sans, fontSize: 8, color: T.fg2 }}>2023</span>
                </div>
              </div>
            </div>
            <MiniArea data={NW} dataPrev={NW_PREV} color={A.bright} colorPrev={T.fg2} width={460} height={95} id="tb" />
          </div>

          {/* Bottom row: metrics + bar + radar */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8 }}>
            {/* Metric cards */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
              {metrics.map(m => (
                <div key={m.label} style={{
                  background: T.bg1, borderRadius: 6, padding: '8px 10px',
                  border: `1px solid ${T.border0}`,
                  display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                }}>
                  <div>
                    <div style={{ fontFamily: T.sans, fontSize: 8.5, color: T.fg2, marginBottom: 1 }}>{m.label}</div>
                    <div style={{ fontFamily: T.mono, fontSize: 12, color: T.fg0, letterSpacing: '-0.4px' }}>{m.value}</div>
                    <div style={{ fontFamily: T.sans, fontSize: 8.5, color: A.text }}>{m.change}</div>
                  </div>
                  <Spark data={m.data} color={A.bright} width={44} height={20} />
                </div>
              ))}
            </div>

            {/* Bar chart */}
            <div style={{
              background: T.bg1, borderRadius: 6, padding: '9px 10px',
              border: `1px solid ${T.border0}`,
            }}>
              <div style={{ fontFamily: T.sans, fontSize: 9, color: T.fg2, marginBottom: 7 }}>Monthly returns</div>
              <MiniBar data={RETURNS} colorPos={A.bright} colorNeg="#e05555" width={160} height={70} />
              <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 6 }}>
                <span style={{ fontFamily: T.sans, fontSize: 8.5, color: T.fg2 }}>YTD</span>
                <span style={{ fontFamily: T.mono, fontSize: 10, color: A.text }}>+16.6%</span>
              </div>
            </div>

            {/* Radar */}
            <div style={{
              background: T.bg1, borderRadius: 6, padding: '9px 10px',
              border: `1px solid ${T.border0}`,
              display: 'flex', flexDirection: 'column', alignItems: 'center',
            }}>
              <div style={{ fontFamily: T.sans, fontSize: 9, color: T.fg2, marginBottom: 5, alignSelf: 'flex-start' }}>Portfolio health</div>
              <RadarChart data={[0.62, 0.85, 0.74, 0.90, 0.68, 0.55]} color={A.bright} size={90} />
            </div>
          </div>

          {/* AI insight */}
          <div style={{
            background: T.bg3, border: `1px solid ${A.bright}`,
            borderRadius: 7, padding: '9px 12px', display: 'flex', gap: 8, alignItems: 'flex-start',
          }}>
            <div style={{
              width: 6, height: 6, borderRadius: '50%', background: A.bright,
              marginTop: 3, flexShrink: 0, boxShadow: `0 0 5px ${A.bright}`,
              animation: aiTyping ? 'pulse 0.6s ease-in-out infinite' : 'pulse 2s ease-in-out infinite',
            }} />
            <div style={{ flex: 1 }}>
              <div style={{ fontFamily: T.sans, fontSize: 8.5, color: A.bright, fontWeight: 600, letterSpacing: '0.06em', textTransform: 'uppercase', marginBottom: 4 }}>
                AI insight
              </div>
              <div style={{ fontFamily: T.sans, fontSize: 11.5, color: T.fg0, lineHeight: 1.55 }}>
                {aiMsg || ' '}
                {aiTyping && <span style={{ animation: 'pulse 0.7s ease-in-out infinite', color: A.bright }}>▋</span>}
              </div>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}

// ── Main export ───────────────────────────────────────────────────────────────
export default function MockDashboardMobile() {
  const { accent } = useContext(TweaksCtx);
  const A = getAccentTokens(accent);
  const isPhone  = useMedia('(max-width: 767px)');
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

  const props = { A, animated, aiMsg, aiTyping };

  return (
    <div style={{ marginTop: 60, position: 'relative', padding: '0 16px' }}>
      {isPhone
        ? <PhoneMockup {...props} />
        : <TabletMockup {...props} />
      }
      <div style={{
        position: 'absolute', bottom: 0, left: 0, right: 0, height: 20,
        background: `linear-gradient(to bottom, transparent, ${T.bg0})`,
        pointerEvents: 'none',
      }} />
    </div>
  );
}
