import { useEffect, useState } from 'react';
import { useAuth } from '@clerk/react';
import { T } from '../tokens';

const API = import.meta.env.VITE_API_URL;

// ── JSON Tree ─────────────────────────────────────────────────────────────────
function JsonNode({ label, value, depth = 0 }) {
  const [open, setOpen] = useState(depth < 2);
  const indent = depth * 14;

  const type = Array.isArray(value) ? 'array' : typeof value;
  const isExpandable = value !== null && (type === 'object' || type === 'array');

  const preview = () => {
    if (!isExpandable) return null;
    if (type === 'array') return `[${value.length}]`;
    const keys = Object.keys(value);
    return `{${keys.slice(0, 3).join(', ')}${keys.length > 3 ? '…' : ''}}`;
  };

  const scalar = () => {
    if (value === null)      return <span style={{ color: T.fg3 }}>null</span>;
    if (type === 'boolean')  return <span style={{ color: '#7fb4e0' }}>{String(value)}</span>;
    if (type === 'number')   return <span style={{ color: '#b5d99c' }}>{value}</span>;
    if (type === 'string')   return <span style={{ color: '#d9c07a' }}>"{value.length > 80 ? value.slice(0, 80) + '…' : value}"</span>;
    return <span style={{ color: T.fg2 }}>{String(value)}</span>;
  };

  return (
    <div style={{ paddingLeft: indent, lineHeight: 1.7 }}>
      <span
        onClick={isExpandable ? () => setOpen(o => !o) : undefined}
        style={{ cursor: isExpandable ? 'pointer' : 'default', userSelect: 'none' }}
      >
        {isExpandable && (
          <span style={{ color: T.fg3, fontSize: 9, marginRight: 5, display: 'inline-block', transform: open ? 'rotate(90deg)' : 'none', transition: 'transform 120ms' }}>▶</span>
        )}
        {label && (
          <span style={{ fontFamily: T.mono, fontSize: 11, color: '#9db8d9' }}>{label}: </span>
        )}
        {!isExpandable && scalar()}
        {isExpandable && !open && (
          <span style={{ fontFamily: T.mono, fontSize: 11, color: T.fg3 }}>{preview()}</span>
        )}
      </span>
      {isExpandable && open && (
        <div>
          {type === 'array'
            ? value.map((v, i) => <JsonNode key={i} label={`[${i}]`} value={v} depth={depth + 1} />)
            : Object.entries(value).map(([k, v]) => <JsonNode key={k} label={k} value={v} depth={depth + 1} />)
          }
        </div>
      )}
    </div>
  );
}

// ── Endpoint card ─────────────────────────────────────────────────────────────
function EndpointCard({ name, result }) {
  const [open, setOpen] = useState(false);

  const count = (() => {
    if (!result?.ok || !result?.data) return null;
    const d = result.data;
    const key = Object.keys(d).find(k => Array.isArray(d[k]));
    return key ? d[key].length : null;
  })();

  const statusColor = !result?.ok ? '#e05555' : count === 0 ? T.fg3 : T.greenText;
  const statusLabel = !result?.ok ? 'erreur' : count !== null ? `${count} item${count > 1 ? 's' : ''}` : 'ok';

  return (
    <div style={{ border: `1px solid ${T.border0}`, borderRadius: 8, overflow: 'hidden' }}>
      <button
        onClick={() => setOpen(o => !o)}
        style={{
          width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          background: T.bg2, border: 'none', cursor: 'pointer',
          padding: '10px 14px',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <span style={{ fontFamily: T.mono, fontSize: 12, color: T.fg0 }}>{name}</span>
          {!result?.ok && result?.error && (
            <span style={{ fontFamily: T.sans, fontSize: 10, color: '#e05555', maxWidth: 300, textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap' }}>
              {result.error}
            </span>
          )}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ fontFamily: T.mono, fontSize: 10, color: statusColor,
            background: `${statusColor}18`, border: `1px solid ${statusColor}30`,
            padding: '2px 7px', borderRadius: 99 }}>
            {statusLabel}
          </span>
          <span style={{ color: T.fg3, fontSize: 10 }}>{open ? '▲' : '▼'}</span>
        </div>
      </button>

      {open && result?.ok && result?.data && (
        <div style={{
          background: T.bg0, padding: '12px 16px',
          borderTop: `1px solid ${T.border0}`,
          maxHeight: 400, overflowY: 'auto',
          fontFamily: T.mono, fontSize: 11,
        }}>
          <JsonNode value={result.data} depth={0} />
        </div>
      )}
    </div>
  );
}

// ── Main ──────────────────────────────────────────────────────────────────────
export default function XeroRaw({ clerkUserId, tenants = [] }) {
  const { getToken } = useAuth();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [selectedTenant, setSelectedTenant] = useState(tenants[0]?.tenantId || '');
  const [error, setError] = useState(null);

  useEffect(() => {
    if (tenants[0]?.tenantId) setSelectedTenant(tenants[0].tenantId);
  }, [tenants]);

  async function load(tenantId) {
    setLoading(true);
    setData(null);
    setError(null);
    try {
      const token = await getToken();
      const r = await fetch(`${API}/api/xero/raw/${clerkUserId}?tenantId=${tenantId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!r.ok) throw new Error(await r.text());
      setData(await r.json());
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }

  const endpoints = data?.endpoints
    ? [
        ...Object.entries(data.endpoints).filter(([k]) => k !== 'reports'),
        ...Object.entries(data.endpoints.reports || {}),
      ]
    : [];

  const okCount  = endpoints.filter(([, v]) => v?.ok && ((() => { const d = v?.data; const key = d && Object.keys(d).find(k => Array.isArray(d[k])); return key ? d[key].length : 1; })()) > 0).length;
  const errCount = endpoints.filter(([, v]) => !v?.ok).length;
  const emptyCount = endpoints.filter(([, v]) => v?.ok && ((() => { const d = v?.data; const key = d && Object.keys(d).find(k => Array.isArray(d[k])); return key ? d[key].length === 0 : false; })())).length;

  return (
    <div style={{ width: '100%', maxWidth: 760, margin: '0 auto' }}>
      {/* Header */}
      <div style={{
        background: T.bg1, border: `1px solid ${T.border1}`,
        borderRadius: 12, padding: '18px 22px', marginBottom: 16,
      }}>
        <div style={{ fontFamily: T.sans, fontSize: 11, color: T.fg2, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 12 }}>
          Xero — explorateur de données brutes
        </div>

        {/* Tenant selector */}
        {tenants.length > 0 && (
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 12 }}>
            {tenants.map(t => (
              <button
                key={t.tenantId}
                onClick={() => setSelectedTenant(t.tenantId)}
                style={{
                  fontFamily: T.sans, fontSize: 12,
                  padding: '5px 12px', borderRadius: 6, cursor: 'pointer',
                  border: `1px solid ${selectedTenant === t.tenantId ? T.greenBright + '60' : T.border1}`,
                  background: selectedTenant === t.tenantId ? `${T.greenBright}12` : T.bg2,
                  color: selectedTenant === t.tenantId ? T.greenText : T.fg1,
                  transition: 'all 150ms',
                }}
              >
                {t.tenantName || t.tenantId}
              </button>
            ))}
          </div>
        )}

        <button
          onClick={() => load(selectedTenant)}
          disabled={!selectedTenant || loading}
          style={{
            display: 'inline-flex', alignItems: 'center', gap: 7,
            fontFamily: T.sans, fontSize: 13, color: T.fg0,
            background: T.bg2, border: `1px solid ${T.border1}`,
            padding: '8px 16px', borderRadius: 8, cursor: loading ? 'wait' : 'pointer',
            opacity: loading ? 0.6 : 1, transition: 'opacity 150ms',
          }}
        >
          {loading
            ? <><svg width="14" height="14" viewBox="0 0 24 24" fill="none" style={{ animation: 'spin 0.8s linear infinite' }}><circle cx="12" cy="12" r="10" stroke={T.border1} strokeWidth="2"/><path d="M12 2 A10 10 0 0 1 22 12" stroke={T.greenBright} strokeWidth="2" strokeLinecap="round"/></svg> Chargement…</>
            : <><svg width="12" height="12" viewBox="0 0 12 12" fill="none"><path d="M6 1v10M1 6h10" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/></svg> Charger les données</>
          }
        </button>

        {/* Stats */}
        {data && (
          <div style={{ display: 'flex', gap: 16, marginTop: 14 }}>
            {[
              { label: 'avec données', val: okCount,    color: T.greenText },
              { label: 'vides',        val: emptyCount, color: T.fg2 },
              { label: 'erreurs',      val: errCount,   color: '#e05555' },
            ].map(s => (
              <div key={s.label} style={{ fontFamily: T.sans, fontSize: 11 }}>
                <span style={{ color: s.color, fontWeight: 600, marginRight: 4 }}>{s.val}</span>
                <span style={{ color: T.fg2 }}>{s.label}</span>
              </div>
            ))}
            <div style={{ fontFamily: T.sans, fontSize: 11, color: T.fg2 }}>
              période : {data.period?.from} → {data.period?.to}
            </div>
          </div>
        )}
      </div>

      {error && (
        <div style={{ fontFamily: T.sans, fontSize: 13, color: '#e05555', marginBottom: 12 }}>Erreur : {error}</div>
      )}

      {/* Endpoint list */}
      {endpoints.length > 0 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          {endpoints.map(([name, result]) => (
            <EndpointCard key={name} name={name} result={result} />
          ))}
        </div>
      )}
    </div>
  );
}
