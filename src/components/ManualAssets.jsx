import { useEffect, useState } from 'react';
import { useAuth } from '@clerk/react';
import { useTheme } from '../ThemeContext';
import ImportAssets from './ImportAssets';

const API = import.meta.env.VITE_API_URL;

const CATEGORIES = [
  { value: 'real_estate',    label: 'Real estate',      icon: '🏠' },
  { value: 'vehicle',        label: 'Vehicle',          icon: '🚗' },
  { value: 'private_equity', label: 'Private equity',   icon: '📈' },
  { value: 'retirement',     label: 'Retirement',       icon: '🏦' },
  { value: 'cash',           label: 'Cash',             icon: '💵' },
  { value: 'other',          label: 'Other',            icon: '📦' },
];

const CURRENCIES = ['USD', 'AUD', 'EUR', 'GBP', 'CAD', 'CHF', 'JPY', 'SGD'];

function fmt(val, currency = 'USD') {
  if (val == null || isNaN(val)) return '—';
  return new Intl.NumberFormat('en-US', {
    style: 'currency', currency,
    maximumFractionDigits: 0,
  }).format(val);
}

function CategoryIcon({ category, size = 14 }) {
  const cat = CATEGORIES.find(c => c.value === category);
  return <span style={{ fontSize: size, lineHeight: 1 }}>{cat?.icon ?? '📦'}</span>;
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

// ── Add / Edit form ───────────────────────────────────────────────────────────
function AssetForm({ clerkUserId, initial, onSaved, onCancel }) {
  const { T } = useTheme();
  const { getToken } = useAuth();
  const [form, setForm] = useState({
    name:     initial?.name     ?? '',
    category: initial?.category ?? 'real_estate',
    value:    initial?.value    ?? '',
    currency: initial?.currency ?? 'USD',
    notes:    initial?.notes    ?? '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState(null);

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  async function submit(e) {
    e.preventDefault();
    if (!form.name || form.value === '') return;
    setLoading(true);
    setError(null);
    try {
      const token = await getToken();
      const url = initial
        ? `${API}/api/assets/${clerkUserId}/${initial._id}`
        : `${API}/api/assets/${clerkUserId}`;
      const r = await fetch(url, {
        method: initial ? 'PUT' : 'POST',
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...form, value: parseFloat(form.value) }),
      });
      const json = await r.json();
      if (!r.ok) throw new Error(json.error || 'Error');
      onSaved();
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }

  const inputStyle = {
    width: '100%', fontFamily: T.sans, fontSize: 13, color: T.fg0,
    background: T.bg2, border: `1px solid ${T.border1}`,
    borderRadius: 8, padding: '9px 12px', outline: 'none',
    boxSizing: 'border-box', transition: 'border-color 150ms',
  };

  const labelStyle = {
    fontFamily: T.sans, fontSize: 10, color: T.fg2,
    textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 5, display: 'block',
  };

  return (
    <form onSubmit={submit} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>

      {/* Category pills */}
      <div>
        <span style={labelStyle}>Category</span>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
          {CATEGORIES.map(c => (
            <button key={c.value} type="button" onClick={() => set('category', c.value)} style={{
              display: 'flex', alignItems: 'center', gap: 5,
              fontFamily: T.sans, fontSize: 12,
              padding: '5px 11px', borderRadius: 99, cursor: 'pointer',
              border: `1px solid ${form.category === c.value ? T.greenBright + '60' : T.border1}`,
              background: form.category === c.value ? `${T.greenBright}12` : T.bg2,
              color: form.category === c.value ? T.greenText : T.fg2,
              transition: 'all 150ms',
            }}>
              <span>{c.icon}</span>{c.label}
            </button>
          ))}
        </div>
      </div>

      {/* Name */}
      <div>
        <label style={labelStyle}>Name</label>
        <input
          value={form.name}
          onChange={e => set('name', e.target.value)}
          placeholder="e.g. Sydney apartment, Tesla Model 3…"
          style={inputStyle}
          required
        />
      </div>

      {/* Value + Currency */}
      <div style={{ display: 'flex', gap: 10 }}>
        <div style={{ flex: 1 }}>
          <label style={labelStyle}>Value</label>
          <input
            type="number"
            min="0"
            step="any"
            value={form.value}
            onChange={e => set('value', e.target.value)}
            placeholder="0"
            style={inputStyle}
            required
          />
        </div>
        <div style={{ width: 100 }}>
          <label style={labelStyle}>Currency</label>
          <select value={form.currency} onChange={e => set('currency', e.target.value)} style={{
            ...inputStyle, appearance: 'none', cursor: 'pointer',
          }}>
            {CURRENCIES.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
        </div>
      </div>

      {/* Notes */}
      <div>
        <label style={labelStyle}>Notes <span style={{ color: T.fg3 }}>(optional)</span></label>
        <input
          value={form.notes}
          onChange={e => set('notes', e.target.value)}
          placeholder="Address, co-ownership %, etc."
          style={inputStyle}
        />
      </div>

      {error && <div style={{ fontFamily: T.sans, fontSize: 11, color: '#e05555' }}>{error}</div>}

      <div style={{ display: 'flex', gap: 8 }}>
        <button type="submit" disabled={loading || !form.name || form.value === ''} style={{
          flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 7,
          fontFamily: T.sans, fontSize: 13, color: T.fg0,
          background: T.bg2, border: `1px solid ${T.greenBright}50`,
          borderRadius: 8, padding: '9px 0', cursor: loading ? 'wait' : 'pointer',
          opacity: (!form.name || form.value === '') ? 0.5 : 1,
          transition: 'all 150ms',
        }}>
          {loading ? <Spinner size={14} /> : (initial ? 'Save changes' : 'Add asset')}
        </button>
        <button type="button" onClick={onCancel} style={{
          fontFamily: T.sans, fontSize: 13, color: T.fg2,
          background: 'none', border: `1px solid ${T.border1}`,
          borderRadius: 8, padding: '9px 16px', cursor: 'pointer',
        }}>
          Cancel
        </button>
      </div>
    </form>
  );
}

// ── Asset row ─────────────────────────────────────────────────────────────────
function AssetRow({ asset, onEdit, onDelete }) {
  const { T } = useTheme();
  const cat = CATEGORIES.find(c => c.value === asset.category);
  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: 12,
      padding: '11px 0', borderBottom: `1px solid ${T.border0}`,
    }}>
      <div style={{
        width: 34, height: 34, borderRadius: 9, flexShrink: 0,
        background: T.bg2, border: `1px solid ${T.border0}`,
        display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16,
      }}>
        {cat?.icon ?? '📦'}
      </div>

      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontFamily: T.sans, fontSize: 13, color: T.fg0, marginBottom: 2,
          whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
          {asset.name}
        </div>
        <div style={{ fontFamily: T.sans, fontSize: 10, color: T.fg3, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
          {cat?.label ?? asset.category}
        </div>
      </div>

      <div style={{ fontFamily: T.mono, fontSize: 14, color: T.fg0, flexShrink: 0 }}>
        {fmt(asset.value, asset.currency)}
      </div>

      <div style={{ display: 'flex', gap: 4, flexShrink: 0 }}>
        <button onClick={onEdit} style={{
          background: 'none', border: `1px solid ${T.border0}`, borderRadius: 6,
          color: T.fg3, cursor: 'pointer', padding: '4px 8px', fontSize: 11,
          fontFamily: T.sans, transition: 'all 150ms',
        }}>Edit</button>
        <button onClick={onDelete} style={{
          background: 'none', border: `1px solid ${T.border0}`, borderRadius: 6,
          color: '#e05555', cursor: 'pointer', padding: '4px 8px', fontSize: 11,
          fontFamily: T.sans, transition: 'all 150ms',
        }}>×</button>
      </div>
    </div>
  );
}

// ── Main ──────────────────────────────────────────────────────────────────────
export default function ManualAssets({ clerkUserId }) {
  const { T } = useTheme();
  const { getToken } = useAuth();
  const [assets, setAssets]       = useState([]);
  const [loading, setLoading]     = useState(true);
  const [showForm, setShowForm]   = useState(false);
  const [showImport, setShowImport] = useState(false);
  const [editing, setEditing]     = useState(null);

  async function fetchAssets() {
    try {
      const token = await getToken();
      const r = await fetch(`${API}/api/assets/${clerkUserId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const json = await r.json();
      setAssets(json.assets ?? []);
    } catch (e) {
      console.error('[ManualAssets]', e);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { fetchAssets(); }, [clerkUserId]);

  async function deleteAsset(assetId) {
    if (!confirm('Remove this asset?')) return;
    const token = await getToken();
    await fetch(`${API}/api/assets/${clerkUserId}/${assetId}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${token}` },
    });
    setAssets(a => a.filter(x => x._id !== assetId));
  }

  const total = assets.reduce((s, a) => s + (a.value ?? 0), 0);

  // Group by category
  const byCat = CATEGORIES.map(c => ({
    ...c,
    items: assets.filter(a => a.category === c.value),
  })).filter(c => c.items.length > 0);

  if (loading) return (
    <div style={{ display: 'flex', justifyContent: 'center', padding: 40 }}>
      <Spinner />
    </div>
  );

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20, maxWidth: 720 }}>

      {showImport && (
        <ImportAssets
          clerkUserId={clerkUserId}
          existingAssets={assets}
          onImported={() => { setShowImport(false); fetchAssets(); }}
          onClose={() => setShowImport(false)}
        />
      )}

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div>
          <div style={{ fontFamily: T.serif, fontSize: 22, color: T.fg0, letterSpacing: '-0.4px' }}>
            Manual assets
          </div>
          {assets.length > 0 && (
            <div style={{ fontFamily: T.mono, fontSize: 13, color: T.fg2, marginTop: 3 }}>
              {assets.length} asset{assets.length !== 1 ? 's' : ''} · Total {fmt(total)}
            </div>
          )}
        </div>
        {!showForm && !editing && (
          <div style={{ display: 'flex', gap: 8 }}>
            <button onClick={() => setShowImport(true)} style={{
              display: 'flex', alignItems: 'center', gap: 6,
              fontFamily: T.sans, fontSize: 12, color: T.fg2,
              background: 'none', border: `1px solid ${T.border1}`,
              borderRadius: 8, padding: '7px 14px', cursor: 'pointer',
              transition: 'all 150ms',
            }}>
              <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                <path d="M6 1v7M3 5l3 3 3-3" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M1 9v1.5a.5.5 0 00.5.5h9a.5.5 0 00.5-.5V9" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"/>
              </svg>
              Import
            </button>
            <button onClick={() => setShowForm(true)} style={{
              display: 'flex', alignItems: 'center', gap: 6,
              fontFamily: T.sans, fontSize: 12, color: T.fg0,
              background: T.bg2, border: `1px solid ${T.border1}`,
              borderRadius: 8, padding: '7px 14px', cursor: 'pointer',
              transition: 'all 150ms',
            }}>
              <svg width="11" height="11" viewBox="0 0 11 11" fill="none">
                <path d="M5.5 1v9M1 5.5h9" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
              </svg>
              Add asset
            </button>
          </div>
        )}
      </div>

      {/* Add form */}
      {showForm && (
        <div style={{ background: T.bg1, border: `1px solid ${T.border1}`, borderRadius: 12, padding: '20px 22px' }}>
          <div style={{ fontFamily: T.sans, fontSize: 11, color: T.fg2, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 16 }}>
            New asset
          </div>
          <AssetForm
            clerkUserId={clerkUserId}
            onSaved={() => { setShowForm(false); fetchAssets(); }}
            onCancel={() => setShowForm(false)}
          />
        </div>
      )}

      {/* Edit form */}
      {editing && (
        <div style={{ background: T.bg1, border: `1px solid ${T.border1}`, borderRadius: 12, padding: '20px 22px' }}>
          <div style={{ fontFamily: T.sans, fontSize: 11, color: T.fg2, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 16 }}>
            Edit asset
          </div>
          <AssetForm
            clerkUserId={clerkUserId}
            initial={editing}
            onSaved={() => { setEditing(null); fetchAssets(); }}
            onCancel={() => setEditing(null)}
          />
        </div>
      )}

      {/* Empty state */}
      {assets.length === 0 && !showForm && (
        <div style={{
          background: T.bg1, border: `1px solid ${T.border0}`,
          borderRadius: 12, padding: '40px 24px', textAlign: 'center',
        }}>
          <div style={{ fontSize: 28, marginBottom: 12 }}>🏠</div>
          <div style={{ fontFamily: T.sans, fontSize: 14, color: T.fg1, marginBottom: 6 }}>
            No assets yet
          </div>
          <div style={{ fontFamily: T.sans, fontSize: 12, color: T.fg3, marginBottom: 20 }}>
            Add real estate, vehicles, private investments and more
          </div>
          <button onClick={() => setShowForm(true)} style={{
            fontFamily: T.sans, fontSize: 13, color: T.fg0,
            background: T.bg2, border: `1px solid ${T.border1}`,
            borderRadius: 8, padding: '8px 18px', cursor: 'pointer',
          }}>
            Add your first asset
          </button>
        </div>
      )}

      {/* Asset list grouped by category */}
      {byCat.map(cat => (
        <div key={cat.value} style={{ background: T.bg1, border: `1px solid ${T.border0}`, borderRadius: 12, padding: '16px 20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
              <span style={{ fontSize: 14 }}>{cat.icon}</span>
              <span style={{ fontFamily: T.sans, fontSize: 10, color: T.fg2, textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                {cat.label}
              </span>
            </div>
            <span style={{ fontFamily: T.mono, fontSize: 12, color: T.fg2 }}>
              {fmt(cat.items.reduce((s, a) => s + a.value, 0), cat.items[0]?.currency)}
            </span>
          </div>
          {cat.items.map(asset => (
            <AssetRow
              key={asset._id}
              asset={asset}
              onEdit={() => { setShowForm(false); setEditing(asset); }}
              onDelete={() => deleteAsset(asset._id)}
            />
          ))}
        </div>
      ))}
    </div>
  );
}
