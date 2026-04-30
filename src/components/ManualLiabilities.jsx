import { useEffect, useState } from 'react';
import { useAuth } from '@clerk/react';
import { useTheme } from '../ThemeContext';

const API = import.meta.env.VITE_API_URL;

const CATEGORIES = [
  { value: 'mortgage',        label: 'Mortgage',        icon: '🏠' },
  { value: 'personal_loan',   label: 'Personal loan',   icon: '💳' },
  { value: 'line_of_credit',  label: 'Line of credit',  icon: '🏦' },
  { value: 'private_lending', label: 'Private lending', icon: '🤝' },
  { value: 'other',           label: 'Other',           icon: '📋' },
];

const CURRENCIES = ['USD', 'AUD', 'EUR', 'GBP', 'CAD', 'CHF', 'JPY', 'SGD'];

function fmt(val, currency = 'USD') {
  if (val == null || isNaN(val)) return '—';
  return new Intl.NumberFormat('en-US', {
    style: 'currency', currency, maximumFractionDigits: 0,
  }).format(val);
}

function Spinner({ size = 20 }) {
  const { T } = useTheme();
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none"
      style={{ animation: 'spin 0.8s linear infinite', display: 'block' }}>
      <circle cx="12" cy="12" r="10" stroke={T.border1} strokeWidth="2" />
      <path d="M12 2 A10 10 0 0 1 22 12" stroke="#ef5350" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}

// ── Form ──────────────────────────────────────────────────────────────────────
function LiabilityForm({ clerkUserId, initial, onSaved, onCancel }) {
  const { T } = useTheme();
  const { getToken } = useAuth();
  const [form, setForm] = useState({
    name:     initial?.name     ?? '',
    category: initial?.category ?? 'mortgage',
    balance:  initial?.balance  ?? '',
    currency: initial?.currency ?? 'AUD',
    rate:     initial?.rate     ?? '',
    notes:    initial?.notes    ?? '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState(null);

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  async function submit(e) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const token = await getToken();
      const url = initial
        ? `${API}/api/liabilities/${clerkUserId}/${initial._id}`
        : `${API}/api/liabilities/${clerkUserId}`;
      const r = await fetch(url, {
        method: initial ? 'PUT' : 'POST',
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...form,
          balance: parseFloat(form.balance),
          rate: form.rate !== '' ? parseFloat(form.rate) : null,
        }),
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
    boxSizing: 'border-box',
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
              border: `1px solid ${form.category === c.value ? '#ef535060' : T.border1}`,
              background: form.category === c.value ? 'rgba(239,83,80,0.08)' : T.bg2,
              color: form.category === c.value ? '#ef5350' : T.fg2,
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
          placeholder="e.g. Mt Eliza mortgage, ANZ line of credit…"
          style={inputStyle}
          required
        />
      </div>

      {/* Balance + Currency */}
      <div style={{ display: 'flex', gap: 10 }}>
        <div style={{ flex: 1 }}>
          <label style={labelStyle}>Outstanding balance</label>
          <input
            type="number" min="0" step="any"
            value={form.balance}
            onChange={e => set('balance', e.target.value)}
            placeholder="0"
            style={inputStyle}
            required
          />
        </div>
        <div style={{ width: 100 }}>
          <label style={labelStyle}>Currency</label>
          <select value={form.currency} onChange={e => set('currency', e.target.value)}
            style={{ ...inputStyle, appearance: 'none', cursor: 'pointer' }}>
            {CURRENCIES.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
        </div>
      </div>

      {/* Rate + Notes */}
      <div style={{ display: 'flex', gap: 10 }}>
        <div style={{ width: 140 }}>
          <label style={labelStyle}>Interest rate % <span style={{ color: T.fg3 }}>(optional)</span></label>
          <input
            type="number" min="0" max="100" step="0.01"
            value={form.rate}
            onChange={e => set('rate', e.target.value)}
            placeholder="e.g. 5.9"
            style={inputStyle}
          />
        </div>
        <div style={{ flex: 1 }}>
          <label style={labelStyle}>Notes <span style={{ color: T.fg3 }}>(optional)</span></label>
          <input
            value={form.notes}
            onChange={e => set('notes', e.target.value)}
            placeholder="Lender, term, property linked…"
            style={inputStyle}
          />
        </div>
      </div>

      {error && <div style={{ fontFamily: T.sans, fontSize: 11, color: '#ef5350' }}>{error}</div>}

      <div style={{ display: 'flex', gap: 8 }}>
        <button type="submit" disabled={loading || !form.name || form.balance === ''} style={{
          flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 7,
          fontFamily: T.sans, fontSize: 13, color: T.fg0,
          background: T.bg2, border: '1px solid rgba(239,83,80,0.4)',
          borderRadius: 8, padding: '9px 0', cursor: loading ? 'wait' : 'pointer',
          opacity: (!form.name || form.balance === '') ? 0.5 : 1,
          transition: 'all 150ms',
        }}>
          {loading ? <Spinner size={14} /> : (initial ? 'Save changes' : 'Add liability')}
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

// ── Row ───────────────────────────────────────────────────────────────────────
function LiabilityRow({ liability, onEdit, onDelete }) {
  const { T } = useTheme();
  const cat = CATEGORIES.find(c => c.value === liability.category);
  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: 12,
      padding: '11px 0', borderBottom: `1px solid ${T.border0}`,
    }}>
      <div style={{
        width: 34, height: 34, borderRadius: 9, flexShrink: 0,
        background: 'rgba(239,83,80,0.08)', border: '1px solid rgba(239,83,80,0.18)',
        display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16,
      }}>
        {cat?.icon ?? '📋'}
      </div>

      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontFamily: T.sans, fontSize: 13, color: T.fg0, marginBottom: 2,
          whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
          {liability.name}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ fontFamily: T.sans, fontSize: 10, color: T.fg3, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            {cat?.label ?? liability.category}
          </span>
          {liability.rate != null && (
            <span style={{ fontFamily: T.mono, fontSize: 10, color: '#ef5350', opacity: 0.7 }}>
              {liability.rate}%
            </span>
          )}
        </div>
      </div>

      <div style={{ fontFamily: T.mono, fontSize: 14, color: '#ef5350', flexShrink: 0 }}>
        −{fmt(liability.balance, liability.currency)}
      </div>

      <div style={{ display: 'flex', gap: 4, flexShrink: 0 }}>
        <button onClick={onEdit} style={{
          background: 'none', border: `1px solid ${T.border0}`, borderRadius: 6,
          color: T.fg3, cursor: 'pointer', padding: '4px 8px', fontSize: 11,
          fontFamily: T.sans,
        }}>Edit</button>
        <button onClick={onDelete} style={{
          background: 'none', border: `1px solid ${T.border0}`, borderRadius: 6,
          color: '#ef5350', cursor: 'pointer', padding: '4px 8px', fontSize: 11,
          fontFamily: T.sans,
        }}>×</button>
      </div>
    </div>
  );
}

// ── Main ──────────────────────────────────────────────────────────────────────
export default function ManualLiabilities({ clerkUserId }) {
  const { T } = useTheme();
  const { getToken } = useAuth();
  const [liabilities, setLiabilities] = useState([]);
  const [loading, setLoading]         = useState(true);
  const [showForm, setShowForm]       = useState(false);
  const [editing, setEditing]         = useState(null);

  async function fetchLiabilities() {
    try {
      const token = await getToken();
      const r = await fetch(`${API}/api/liabilities/${clerkUserId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const json = await r.json();
      setLiabilities(json.liabilities ?? []);
    } catch (e) {
      console.error('[ManualLiabilities]', e);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { fetchLiabilities(); }, [clerkUserId]);

  async function deleteLiability(id) {
    if (!confirm('Remove this liability?')) return;
    const token = await getToken();
    await fetch(`${API}/api/liabilities/${clerkUserId}/${id}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${token}` },
    });
    setLiabilities(l => l.filter(x => x._id !== id));
  }

  const total = liabilities.reduce((s, l) => s + (l.balance ?? 0), 0);

  const byCat = CATEGORIES.map(c => ({
    ...c,
    items: liabilities.filter(l => l.category === c.value),
  })).filter(c => c.items.length > 0);

  if (loading) return (
    <div style={{ display: 'flex', justifyContent: 'center', padding: 40 }}>
      <Spinner />
    </div>
  );

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20, maxWidth: 720 }}>

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div>
          <div style={{ fontFamily: T.serif, fontSize: 22, color: T.fg0, letterSpacing: '-0.4px' }}>
            Liabilities
          </div>
          {liabilities.length > 0 && (
            <div style={{ fontFamily: T.mono, fontSize: 13, color: '#ef5350', marginTop: 3, opacity: 0.8 }}>
              {liabilities.length} debt{liabilities.length !== 1 ? 's' : ''} · −{fmt(total)}
            </div>
          )}
        </div>
        {!showForm && !editing && (
          <button onClick={() => setShowForm(true)} style={{
            display: 'flex', alignItems: 'center', gap: 6,
            fontFamily: T.sans, fontSize: 12, color: T.fg0,
            background: T.bg2, border: `1px solid ${T.border1}`,
            borderRadius: 8, padding: '7px 14px', cursor: 'pointer',
          }}>
            <svg width="11" height="11" viewBox="0 0 11 11" fill="none">
              <path d="M5.5 1v9M1 5.5h9" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
            </svg>
            Add liability
          </button>
        )}
      </div>

      {/* Add form */}
      {showForm && (
        <div style={{ background: T.bg1, border: '1px solid rgba(239,83,80,0.2)', borderRadius: 12, padding: '20px 22px' }}>
          <div style={{ fontFamily: T.sans, fontSize: 11, color: T.fg2, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 16 }}>
            New liability
          </div>
          <LiabilityForm
            clerkUserId={clerkUserId}
            onSaved={() => { setShowForm(false); fetchLiabilities(); }}
            onCancel={() => setShowForm(false)}
          />
        </div>
      )}

      {/* Edit form */}
      {editing && (
        <div style={{ background: T.bg1, border: '1px solid rgba(239,83,80,0.2)', borderRadius: 12, padding: '20px 22px' }}>
          <div style={{ fontFamily: T.sans, fontSize: 11, color: T.fg2, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 16 }}>
            Edit liability
          </div>
          <LiabilityForm
            clerkUserId={clerkUserId}
            initial={editing}
            onSaved={() => { setEditing(null); fetchLiabilities(); }}
            onCancel={() => setEditing(null)}
          />
        </div>
      )}

      {/* Empty state */}
      {liabilities.length === 0 && !showForm && (
        <div style={{
          background: T.bg1, border: `1px solid ${T.border0}`,
          borderRadius: 12, padding: '40px 24px', textAlign: 'center',
        }}>
          <div style={{ fontSize: 28, marginBottom: 12 }}>📋</div>
          <div style={{ fontFamily: T.sans, fontSize: 14, color: T.fg1, marginBottom: 6 }}>
            No liabilities recorded
          </div>
          <div style={{ fontFamily: T.sans, fontSize: 12, color: T.fg3, marginBottom: 20 }}>
            Add mortgages, loans and credit lines to get an accurate net worth
          </div>
          <button onClick={() => setShowForm(true)} style={{
            fontFamily: T.sans, fontSize: 13, color: T.fg0,
            background: T.bg2, border: `1px solid ${T.border1}`,
            borderRadius: 8, padding: '8px 18px', cursor: 'pointer',
          }}>
            Add your first liability
          </button>
        </div>
      )}

      {/* List grouped by category */}
      {byCat.map(cat => (
        <div key={cat.value} style={{ background: T.bg1, border: `1px solid ${T.border0}`, borderRadius: 12, padding: '16px 20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
              <span style={{ fontSize: 14 }}>{cat.icon}</span>
              <span style={{ fontFamily: T.sans, fontSize: 10, color: T.fg2, textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                {cat.label}
              </span>
            </div>
            <span style={{ fontFamily: T.mono, fontSize: 12, color: '#ef5350', opacity: 0.8 }}>
              −{fmt(cat.items.reduce((s, l) => s + l.balance, 0), cat.items[0]?.currency)}
            </span>
          </div>
          {cat.items.map(l => (
            <LiabilityRow
              key={l._id}
              liability={l}
              onEdit={() => { setShowForm(false); setEditing(l); }}
              onDelete={() => deleteLiability(l._id)}
            />
          ))}
        </div>
      ))}
    </div>
  );
}
