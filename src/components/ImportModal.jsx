import { useState, useRef } from 'react';
import { useAuth } from '@clerk/react';
import Papa from 'papaparse';
import * as XLSX from 'xlsx';
import { useTheme } from '../ThemeContext';

const API = import.meta.env.VITE_API_URL;
const CURRENCIES = ['USD', 'AUD', 'EUR', 'GBP', 'CAD', 'CHF', 'JPY', 'SGD'];

// ── Configs ───────────────────────────────────────────────────────────────────

export const ASSET_CONFIG = {
  title:          'Import assets',
  noun:           'asset',
  endpoint:       (clerkUserId) => `${API}/api/assets/${clerkUserId}/bulk`,
  bodyKey:        'assets',
  valueField:     'value',
  fields:         ['name', 'value', 'currency', 'category', 'notes'],
  requiredFields: ['name', 'value'],
  defaultCurrency: 'USD',
  defaultCategory: 'other',
  categories: [
    { value: 'real_estate',    label: 'Real estate' },
    { value: 'vehicle',        label: 'Vehicle' },
    { value: 'private_equity', label: 'Private equity' },
    { value: 'retirement',     label: 'Retirement' },
    { value: 'cash',           label: 'Cash' },
    { value: 'other',          label: 'Other' },
  ],
  guessCategory(raw = '') {
    const s = raw.toLowerCase();
    if (/real.?estate|property|house|apartment|flat|land|immo/.test(s)) return 'real_estate';
    if (/car|vehicle|truck|bike|boat|moto|auto/.test(s))                return 'vehicle';
    if (/equity|share|stock|startup|invest|fund|vc|private/.test(s))   return 'private_equity';
    if (/super|retire|pension|401k|ira|smsf/.test(s))                  return 'retirement';
    if (/cash|bank|saving|deposit|account|liquid/.test(s))             return 'cash';
    return 'other';
  },
  existingKey: 'name', // field used for duplicate detection
};

export const LIABILITY_CONFIG = {
  title:          'Import liabilities',
  noun:           'liability',
  endpoint:       (clerkUserId) => `${API}/api/liabilities/${clerkUserId}/bulk`,
  bodyKey:        'liabilities',
  valueField:     'balance',
  fields:         ['name', 'balance', 'currency', 'category', 'rate', 'notes'],
  requiredFields: ['name', 'balance'],
  defaultCurrency: 'AUD',
  defaultCategory: 'mortgage',
  categories: [
    { value: 'mortgage',        label: 'Mortgage' },
    { value: 'personal_loan',   label: 'Personal loan' },
    { value: 'line_of_credit',  label: 'Line of credit' },
    { value: 'private_lending', label: 'Private lending' },
    { value: 'other',           label: 'Other' },
  ],
  guessCategory(raw = '') {
    const s = raw.toLowerCase();
    if (/mortgage|home.?loan|hypothe/.test(s))              return 'mortgage';
    if (/personal|consumer|unsecured/.test(s))              return 'personal_loan';
    if (/line|credit|overdraft|facility|revol/.test(s))     return 'line_of_credit';
    if (/private|friend|family|peer|lending/.test(s))       return 'private_lending';
    return 'other';
  },
  existingKey: 'name',
};

// ── Helpers ───────────────────────────────────────────────────────────────────

function sheetsUrlToCsv(url) {
  const idMatch  = url.match(/spreadsheets\/d\/([a-zA-Z0-9_-]+)/);
  const gidMatch = url.match(/[#&]gid=(\d+)/);
  if (!idMatch) return null;
  return `https://docs.google.com/spreadsheets/d/${idMatch[1]}/export?format=csv&gid=${gidMatch ? gidMatch[1] : '0'}`;
}

function autoMap(headers, config) {
  const map = {};
  headers.forEach(h => {
    const s = h.toLowerCase().replace(/[^a-z]/g, '');
    if (!map.name     && /name|asset|label|title|description|desc|liability/.test(s)) map.name = h;
    else if (!map[config.valueField] && /value|amount|price|worth|balance|montant|solde|bal/.test(s)) map[config.valueField] = h;
    else if (!map.currency && /currency|ccy|devise|cur/.test(s)) map.currency = h;
    else if (!map.category && /category|type|cat|kind|classe/.test(s)) map.category = h;
    else if (!map.rate     && /rate|taux|interest/.test(s)) map.rate = h;
    else if (!map.notes    && /note|comment|remark|detail/.test(s)) map.notes = h;
  });
  return map;
}

function mapRows(rows, mapping, config, defaultCurrency, defaultCategory) {
  const vf = config.valueField;
  return rows
    .filter(r => Object.values(r).some(v => v !== '' && v != null))
    .map(r => {
      const name     = mapping.name     ? String(r[mapping.name] ?? '').trim() : '';
      const rawVal   = mapping[vf]      ? r[mapping[vf]] : '';
      const value    = parseFloat(String(rawVal).replace(/[^0-9.-]/g, '')) || 0;
      const currency = mapping.currency ? String(r[mapping.currency] ?? '').toUpperCase().trim() || defaultCurrency : defaultCurrency;
      const rawCat   = mapping.category ? String(r[mapping.category] ?? '') : '';
      const category = rawCat ? config.guessCategory(rawCat) : defaultCategory;
      const rate     = mapping.rate     ? parseFloat(r[mapping.rate]) || null : null;
      const notes    = mapping.notes    ? String(r[mapping.notes] ?? '').trim() : '';
      const row = { name, [vf]: value, currency, category, notes, _valid: !!name && value > 0 };
      if (config.fields.includes('rate')) row.rate = rate;
      return row;
    });
}

function isDuplicate(row, existing, config) {
  return existing.some(e =>
    String(e[config.existingKey] ?? '').toLowerCase() === row.name.toLowerCase() &&
    e.category === row.category
  );
}

// ── Step indicator ────────────────────────────────────────────────────────────
function StepIndicator({ step }) {
  const { T } = useTheme();
  const steps = ['Upload', 'Map columns', 'Preview & import'];
  return (
    <div style={{ display: 'flex', alignItems: 'center', marginBottom: 24 }}>
      {steps.map((s, i) => (
        <div key={i} style={{ display: 'flex', alignItems: 'center', flex: i < steps.length - 1 ? 1 : 'none' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 7, flexShrink: 0 }}>
            <div style={{
              width: 22, height: 22, borderRadius: '50%', flexShrink: 0,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontFamily: T.mono, fontSize: 10,
              background: i < step ? T.greenBright : i === step ? `${T.greenBright}20` : T.bg2,
              border: `1px solid ${i <= step ? T.greenBright : T.border0}`,
              color: i < step ? T.bg0 : i === step ? T.greenText : T.fg3,
            }}>
              {i < step ? '✓' : i + 1}
            </div>
            <span style={{ fontFamily: T.sans, fontSize: 11, color: i === step ? T.fg0 : T.fg3 }}>{s}</span>
          </div>
          {i < steps.length - 1 && (
            <div style={{ flex: 1, height: 1, background: i < step ? T.greenBright : T.border0, margin: '0 10px' }} />
          )}
        </div>
      ))}
    </div>
  );
}

// ── Main ──────────────────────────────────────────────────────────────────────
export default function ImportModal({ clerkUserId, config, existing = [], onImported, onClose }) {
  const { T } = useTheme();
  const { getToken } = useAuth();
  const fileRef = useRef(null);

  const [step, setStep]               = useState(0);
  const [headers, setHeaders]         = useState([]);
  const [rawRows, setRawRows]         = useState([]);
  const [mapping, setMapping]         = useState({});
  const [defaultCurrency, setDefaultCurrency] = useState(config.defaultCurrency);
  const [defaultCategory, setDefaultCategory] = useState(config.defaultCategory);
  const [sheetsUrl, setSheetsUrl]     = useState('');
  const [sheetsError, setSheetsError] = useState('');
  const [dragging, setDragging]       = useState(false);
  const [loading, setLoading]         = useState(false);
  const [importError, setImportError] = useState('');
  const [importDone, setImportDone]   = useState(null);

  function afterParse(fields, data) {
    setHeaders(fields);
    setRawRows(data);
    setMapping(autoMap(fields, config));
    setStep(1);
  }

  function handleFile(file) {
    const ext = file.name.split('.').pop().toLowerCase();
    if (ext === 'csv' || file.type === 'text/csv') {
      Papa.parse(file, {
        header: true, skipEmptyLines: true,
        complete: ({ data, meta }) => afterParse(meta.fields ?? [], data),
      });
    } else if (ext === 'xlsx' || ext === 'xls') {
      const reader = new FileReader();
      reader.onload = e => {
        const wb   = XLSX.read(e.target.result, { type: 'array' });
        const ws   = wb.Sheets[wb.SheetNames[0]];
        const rows = XLSX.utils.sheet_to_json(ws, { defval: '' });
        const hdrs = rows.length ? Object.keys(rows[0]) : [];
        afterParse(hdrs, rows);
      };
      reader.readAsArrayBuffer(file);
    } else {
      alert('Unsupported format. Use CSV or Excel (.xlsx/.xls).');
    }
  }

  async function handleSheetsUrl() {
    setSheetsError('');
    const csvUrl = sheetsUrlToCsv(sheetsUrl);
    if (!csvUrl) { setSheetsError('Invalid Google Sheets URL.'); return; }
    setLoading(true);
    try {
      const r = await fetch(csvUrl);
      if (!r.ok) throw new Error('Could not fetch sheet. Make sure sharing is set to "Anyone with the link".');
      Papa.parse(await r.text(), {
        header: true, skipEmptyLines: true,
        complete: ({ data, meta }) => afterParse(meta.fields ?? [], data),
      });
    } catch (e) {
      setSheetsError(e.message);
    } finally {
      setLoading(false);
    }
  }

  const preview = step >= 2 ? mapRows(rawRows, mapping, config, defaultCurrency, defaultCategory) : [];
  const valid   = preview.filter(r => r._valid);
  const dupes   = preview.filter(r => r._valid && isDuplicate(r, existing, config));
  const invalid = preview.filter(r => !r._valid);

  async function doImport() {
    setLoading(true);
    setImportError('');
    try {
      const token = await getToken();
      const r = await fetch(config.endpoint(clerkUserId), {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ [config.bodyKey]: valid }),
      });
      const json = await r.json();
      if (!r.ok) throw new Error(json.error || 'Error');
      setImportDone(json.inserted);
      onImported();
    } catch (e) {
      setImportError(e.message);
    } finally {
      setLoading(false);
    }
  }

  const inputStyle = {
    width: '100%', fontFamily: T.mono, fontSize: 12, color: T.fg0,
    background: T.bg2, border: `1px solid ${T.border1}`,
    borderRadius: 8, padding: '8px 12px', outline: 'none', boxSizing: 'border-box',
  };
  const selectStyle = {
    fontFamily: T.sans, fontSize: 12, color: T.fg0,
    background: T.bg2, border: `1px solid ${T.border1}`,
    borderRadius: 6, padding: '5px 8px', outline: 'none', cursor: 'pointer',
  };
  const vf = config.valueField;

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 100,
      background: 'rgba(0,0,0,0.55)', backdropFilter: 'blur(4px)',
      display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20,
    }} onClick={e => { if (e.target === e.currentTarget) onClose(); }}>
      <div style={{
        background: T.bg1, border: `1px solid ${T.border1}`,
        borderRadius: 14, padding: '28px 30px',
        width: '100%', maxWidth: 640, maxHeight: '90vh', overflowY: 'auto',
      }}>
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 22 }}>
          <div style={{ fontFamily: T.sans, fontSize: 15, fontWeight: 600, color: T.fg0 }}>{config.title}</div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: T.fg3, fontSize: 18, lineHeight: 1, padding: 4 }}>×</button>
        </div>

        <StepIndicator step={step} />

        {/* ── Step 0: Upload ─────────────────────────────────────────────── */}
        {step === 0 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div
              onDragOver={e => { e.preventDefault(); setDragging(true); }}
              onDragLeave={() => setDragging(false)}
              onDrop={e => { e.preventDefault(); setDragging(false); const f = e.dataTransfer.files[0]; if (f) handleFile(f); }}
              onClick={() => fileRef.current?.click()}
              style={{
                border: `2px dashed ${dragging ? T.greenBright : T.border1}`,
                borderRadius: 10, padding: '32px 20px', textAlign: 'center', cursor: 'pointer',
                background: dragging ? `${T.greenBright}06` : T.bg2, transition: 'all 150ms',
              }}>
              <input ref={fileRef} type="file" accept=".csv,.xlsx,.xls" style={{ display: 'none' }}
                onChange={e => { const f = e.target.files?.[0]; if (f) handleFile(f); }} />
              <div style={{ fontSize: 28, marginBottom: 10 }}>📂</div>
              <div style={{ fontFamily: T.sans, fontSize: 13, color: T.fg1, marginBottom: 4 }}>Drop your file here or click to browse</div>
              <div style={{ fontFamily: T.sans, fontSize: 11, color: T.fg3 }}>CSV, Excel (.xlsx, .xls)</div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <div style={{ flex: 1, height: 1, background: T.border0 }} />
              <span style={{ fontFamily: T.sans, fontSize: 11, color: T.fg3 }}>or</span>
              <div style={{ flex: 1, height: 1, background: T.border0 }} />
            </div>

            <div>
              <div style={{ fontFamily: T.sans, fontSize: 11, color: T.fg2, marginBottom: 7 }}>
                Google Sheets URL <span style={{ color: T.fg3 }}>(must be set to "Anyone with the link can view")</span>
              </div>
              <div style={{ display: 'flex', gap: 8 }}>
                <input value={sheetsUrl} onChange={e => setSheetsUrl(e.target.value)}
                  placeholder="https://docs.google.com/spreadsheets/d/…"
                  style={{ ...inputStyle, flex: 1 }} />
                <button onClick={handleSheetsUrl} disabled={!sheetsUrl || loading} style={{
                  fontFamily: T.sans, fontSize: 12, color: T.fg0, flexShrink: 0,
                  background: T.bg2, border: `1px solid ${T.border1}`,
                  borderRadius: 8, padding: '8px 14px', cursor: 'pointer',
                  opacity: (!sheetsUrl || loading) ? 0.5 : 1,
                }}>
                  {loading ? '…' : 'Import'}
                </button>
              </div>
              {sheetsError && <div style={{ fontFamily: T.sans, fontSize: 11, color: '#e05555', marginTop: 6 }}>{sheetsError}</div>}
            </div>
          </div>
        )}

        {/* ── Step 1: Map columns ────────────────────────────────────────── */}
        {step === 1 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
            <div style={{ fontFamily: T.sans, fontSize: 12, color: T.fg2 }}>{rawRows.length} rows detected. Map your columns below.</div>

            <div style={{ background: T.bg2, borderRadius: 10, padding: '14px 16px', display: 'flex', flexDirection: 'column', gap: 10 }}>
              {config.fields.map(field => {
                const isRequired = config.requiredFields.includes(field);
                return (
                  <div key={field} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
                    <div style={{ fontFamily: T.sans, fontSize: 12, color: isRequired ? T.fg0 : T.fg2, width: 90, flexShrink: 0 }}>
                      {field}{isRequired && <span style={{ color: '#e05555' }}> *</span>}
                    </div>
                    <select
                      value={mapping[field] ?? ''}
                      onChange={e => setMapping(m => ({ ...m, [field]: e.target.value || undefined }))}
                      style={{ ...selectStyle, flex: 1 }}>
                      <option value="">— ignore —</option>
                      {headers.map(h => <option key={h} value={h}>{h}</option>)}
                    </select>
                  </div>
                );
              })}
            </div>

            <div style={{ display: 'flex', gap: 12 }}>
              <div style={{ flex: 1 }}>
                <div style={{ fontFamily: T.sans, fontSize: 10, color: T.fg2, textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 6 }}>
                  Default currency <span style={{ color: T.fg3 }}>(if no column)</span>
                </div>
                <select value={defaultCurrency} onChange={e => setDefaultCurrency(e.target.value)} style={{ ...selectStyle, width: '100%' }}>
                  {CURRENCIES.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontFamily: T.sans, fontSize: 10, color: T.fg2, textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 6 }}>
                  Default category <span style={{ color: T.fg3 }}>(if no column)</span>
                </div>
                <select value={defaultCategory} onChange={e => setDefaultCategory(e.target.value)} style={{ ...selectStyle, width: '100%' }}>
                  {config.categories.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
                </select>
              </div>
            </div>

            <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
              <button onClick={() => setStep(0)} style={{ ...selectStyle, padding: '8px 16px' }}>Back</button>
              <button onClick={() => setStep(2)} disabled={!mapping.name || !mapping[vf]} style={{
                fontFamily: T.sans, fontSize: 13, color: T.fg0,
                background: T.bg2, border: `1px solid ${T.greenBright}50`,
                borderRadius: 8, padding: '8px 20px', cursor: 'pointer',
                opacity: (!mapping.name || !mapping[vf]) ? 0.5 : 1,
              }}>Preview →</button>
            </div>
          </div>
        )}

        {/* ── Step 2: Preview & import ───────────────────────────────────── */}
        {step === 2 && !importDone && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div style={{ display: 'flex', gap: 10 }}>
              <div style={{ flex: 1, background: T.bg2, borderRadius: 8, padding: '10px 14px', textAlign: 'center' }}>
                <div style={{ fontFamily: T.mono, fontSize: 18, color: T.greenText }}>{valid.length}</div>
                <div style={{ fontFamily: T.sans, fontSize: 10, color: T.fg2, marginTop: 2 }}>Ready to import</div>
              </div>
              {dupes.length > 0 && (
                <div style={{ flex: 1, background: T.bg2, borderRadius: 8, padding: '10px 14px', textAlign: 'center' }}>
                  <div style={{ fontFamily: T.mono, fontSize: 18, color: '#ffb74d' }}>{dupes.length}</div>
                  <div style={{ fontFamily: T.sans, fontSize: 10, color: T.fg2, marginTop: 2 }}>Potential duplicates</div>
                </div>
              )}
              {invalid.length > 0 && (
                <div style={{ flex: 1, background: T.bg2, borderRadius: 8, padding: '10px 14px', textAlign: 'center' }}>
                  <div style={{ fontFamily: T.mono, fontSize: 18, color: '#e05555' }}>{invalid.length}</div>
                  <div style={{ fontFamily: T.sans, fontSize: 10, color: T.fg2, marginTop: 2 }}>Skipped (missing data)</div>
                </div>
              )}
            </div>

            <div style={{ maxHeight: 280, overflowY: 'auto', borderRadius: 8, border: `1px solid ${T.border0}` }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontFamily: T.sans, fontSize: 11 }}>
                <thead>
                  <tr style={{ background: T.bg2, position: 'sticky', top: 0 }}>
                    {['Name', 'Category', config.valueField === 'balance' ? 'Balance' : 'Value', 'Currency', 'Status'].map(h => (
                      <th key={h} style={{ padding: '8px 12px', textAlign: 'left', color: T.fg2, fontWeight: 500, borderBottom: `1px solid ${T.border0}` }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {preview.map((row, i) => {
                    const isDupe = row._valid && isDuplicate(row, existing, config);
                    const cat = config.categories.find(c => c.value === row.category);
                    return (
                      <tr key={i} style={{ borderBottom: `1px solid ${T.border0}`, opacity: row._valid ? 1 : 0.4 }}>
                        <td style={{ padding: '7px 12px', color: T.fg0 }}>{row.name || '—'}</td>
                        <td style={{ padding: '7px 12px', color: T.fg2 }}>{cat?.label ?? row.category}</td>
                        <td style={{ padding: '7px 12px', color: T.fg0, fontFamily: T.mono }}>{(row[vf] ?? 0).toLocaleString()}</td>
                        <td style={{ padding: '7px 12px', color: T.fg2 }}>{row.currency}</td>
                        <td style={{ padding: '7px 12px' }}>
                          {!row._valid
                            ? <span style={{ color: '#e05555' }}>Skip</span>
                            : isDupe
                              ? <span style={{ color: '#ffb74d' }}>⚠ Duplicate?</span>
                              : <span style={{ color: T.greenText }}>✓ OK</span>}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {dupes.length > 0 && (
              <div style={{ fontFamily: T.sans, fontSize: 11, color: '#ffb74d', background: 'rgba(255,183,77,0.08)', border: '1px solid rgba(255,183,77,0.2)', borderRadius: 8, padding: '10px 14px' }}>
                ⚠ {dupes.length} {config.noun}{dupes.length > 1 ? 's' : ''} may already exist. They will still be imported — delete duplicates manually afterwards if needed.
              </div>
            )}

            {importError && <div style={{ fontFamily: T.sans, fontSize: 11, color: '#e05555' }}>{importError}</div>}

            <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
              <button onClick={() => setStep(1)} style={{ ...selectStyle, padding: '8px 16px' }}>Back</button>
              <button onClick={doImport} disabled={loading || valid.length === 0} style={{
                fontFamily: T.sans, fontSize: 13, color: T.fg0,
                background: T.bg2, border: `1px solid ${T.greenBright}50`,
                borderRadius: 8, padding: '8px 20px', cursor: loading ? 'wait' : 'pointer',
                opacity: (loading || valid.length === 0) ? 0.5 : 1,
              }}>
                {loading ? 'Importing…' : `Import ${valid.length} ${config.noun}${valid.length !== 1 ? 's' : ''}`}
              </button>
            </div>
          </div>
        )}

        {/* ── Done ──────────────────────────────────────────────────────── */}
        {importDone != null && (
          <div style={{ textAlign: 'center', padding: '20px 0' }}>
            <div style={{ fontSize: 36, marginBottom: 14 }}>✅</div>
            <div style={{ fontFamily: T.sans, fontSize: 15, color: T.fg0, marginBottom: 6 }}>
              {importDone} {config.noun}{importDone !== 1 ? 's' : ''} imported
            </div>
            <button onClick={onClose} style={{
              marginTop: 16, fontFamily: T.sans, fontSize: 13, color: T.fg0,
              background: T.bg2, border: `1px solid ${T.border1}`,
              borderRadius: 8, padding: '8px 20px', cursor: 'pointer',
            }}>Done</button>
          </div>
        )}
      </div>
    </div>
  );
}
