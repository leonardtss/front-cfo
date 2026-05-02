import { useState, useEffect, useRef } from 'react';
import { useAuth } from '@clerk/react';
import * as XLSX from 'xlsx';
import { useTheme } from '../ThemeContext';
import ImportModal, { ASSET_CONFIG, LIABILITY_CONFIG } from './ImportModal';

const API = import.meta.env.VITE_API_URL;
const DEFAULT_HEADERS = ['Name', 'Value', 'Currency', 'Category', 'Notes'];

function emptyRows(n, cols) {
  return Array.from({ length: n }, () => Array(cols).fill(''));
}

function gridToObjects(headers, rows) {
  const nonEmpty = rows.filter(row => row.some(v => v !== ''));
  return nonEmpty.map(row => {
    const obj = {};
    headers.forEach((h, i) => { obj[h] = row[i] ?? ''; });
    return obj;
  });
}

export function SpreadsheetIcon({ size = 13 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 13 13" fill="none" style={{ flexShrink: 0 }}>
      <rect x="0.5" y="0.5" width="12" height="12" rx="1.5" stroke="currentColor" strokeWidth="1.1" opacity="0.7"/>
      <line x1="0.5" y1="4.5" x2="12.5" y2="4.5" stroke="currentColor" strokeWidth="1" opacity="0.7"/>
      <line x1="0.5" y1="8.5" x2="12.5" y2="8.5" stroke="currentColor" strokeWidth="1" opacity="0.7"/>
      <line x1="4.5" y1="0.5" x2="4.5" y2="12.5" stroke="currentColor" strokeWidth="1" opacity="0.7"/>
    </svg>
  );
}

function Btn({ T, children, onClick, disabled, highlight, danger, icon }) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      style={{
        display: 'inline-flex', alignItems: 'center', gap: 5,
        fontFamily: T.sans, fontSize: 12,
        color: danger ? '#e05555' : highlight ? T.greenText : T.fg1,
        background: highlight ? `${T.greenBright}14` : T.bg2,
        border: `1px solid ${danger ? '#e0555530' : highlight ? `${T.greenBright}40` : T.border1}`,
        borderRadius: 7, padding: '7px 13px',
        cursor: disabled ? 'not-allowed' : 'pointer',
        opacity: disabled ? 0.5 : 1, transition: 'all 120ms', whiteSpace: 'nowrap',
      }}
    >
      {icon && <span>{icon}</span>}{children}
    </button>
  );
}

export default function Spreadsheet({ clerkUserId }) {
  const { T } = useTheme();
  const { getToken } = useAuth();

  const [sheets, setSheets]           = useState([]);
  const [loadingSheets, setLoadingSheets] = useState(true);

  // Current sheet
  const [sheetId, setSheetId]         = useState(null);
  const [sheetName, setSheetName]     = useState('Sheet 1');
  const [headers, setHeaders]         = useState([...DEFAULT_HEADERS]);
  const [rows, setRows]               = useState(emptyRows(20, DEFAULT_HEADERS.length));
  const [dirty, setDirty]             = useState(false);
  const [saving, setSaving]           = useState(false);

  // Editing
  const [sel, setSel]                 = useState({ r: 0, c: 0 });
  const [editing, setEditing]         = useState(null); // { r, c } — r=-1 for header
  const [editVal, setEditVal]         = useState('');
  const [editingName, setEditingName] = useState(false);
  const [nameVal, setNameVal]         = useState('Sheet 1');

  // Import modal
  const [showImport, setShowImport]   = useState(false);
  const [importConfig, setImportConfig] = useState(null);
  const [importData, setImportData]   = useState(null);

  const gridRef = useRef(null);
  const inputRef = useRef(null);
  const fileRef = useRef(null);

  useEffect(() => {
    if (!clerkUserId) return;
    initLoad();
  }, [clerkUserId]);

  useEffect(() => {
    if (editing !== null && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [editing]);

  async function initLoad() {
    setLoadingSheets(true);
    try {
      const token = await getToken();
      const r = await fetch(`${API}/api/spreadsheet/${clerkUserId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await r.json();
      setSheets(data);
      if (data.length > 0) await loadSheet(data[0]._id, token);
    } catch (e) {
      console.error('[Spreadsheet]', e);
    } finally {
      setLoadingSheets(false);
    }
  }

  async function refreshSheetList() {
    const token = await getToken();
    const r = await fetch(`${API}/api/spreadsheet/${clerkUserId}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    const data = await r.json();
    setSheets(data);
    return { token, data };
  }

  async function loadSheet(id, existingToken) {
    try {
      const token = existingToken || await getToken();
      const r = await fetch(`${API}/api/spreadsheet/${clerkUserId}/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await r.json();
      const hdrs = data.headers?.length ? data.headers : [...DEFAULT_HEADERS];
      const raw = Array.isArray(data.rows) ? data.rows : [];
      const normalized = raw.map(row => {
        const arr = Array.isArray(row) ? [...row] : [];
        while (arr.length < hdrs.length) arr.push('');
        return arr.slice(0, hdrs.length).map(String);
      });
      while (normalized.length < 5) normalized.push(Array(hdrs.length).fill(''));

      setSheetId(data._id);
      setSheetName(data.name);
      setNameVal(data.name);
      setHeaders(hdrs);
      setRows(normalized);
      setDirty(false);
      setSel({ r: 0, c: 0 });
      setEditing(null);
    } catch (e) {
      console.error('[Spreadsheet loadSheet]', e);
    }
  }

  function newSheet() {
    setSheetId(null);
    setSheetName('Sheet 1');
    setNameVal('Sheet 1');
    setHeaders([...DEFAULT_HEADERS]);
    setRows(emptyRows(20, DEFAULT_HEADERS.length));
    setDirty(false);
    setSel({ r: 0, c: 0 });
    setEditing(null);
  }

  async function saveSheet() {
    setSaving(true);
    try {
      const token = await getToken();
      const url = sheetId
        ? `${API}/api/spreadsheet/${clerkUserId}/${sheetId}`
        : `${API}/api/spreadsheet/${clerkUserId}`;
      const r = await fetch(url, {
        method: sheetId ? 'PUT' : 'POST',
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: sheetName, headers, rows }),
      });
      const data = await r.json();
      if (!r.ok) throw new Error(data.error || 'Save failed');
      setSheetId(data._id);
      setDirty(false);
      await refreshSheetList();
      setSheetId(data._id);
    } catch (e) {
      alert(e.message);
    } finally {
      setSaving(false);
    }
  }

  async function deleteSheet() {
    if (!sheetId || !confirm(`Delete "${sheetName}"?`)) return;
    const token = await getToken();
    await fetch(`${API}/api/spreadsheet/${clerkUserId}/${sheetId}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${token}` },
    });
    newSheet();
    await refreshSheetList();
  }

  // ── Mutations ──────────────────────────────────────────────────────────────

  const mark = () => setDirty(true);

  function setCell(r, c, v) {
    setRows(prev => prev.map((row, i) => i === r ? row.map((val, j) => j === c ? v : val) : row));
    mark();
  }

  function setHeader(i, v) {
    setHeaders(prev => prev.map((h, j) => j === i ? v : h));
    mark();
  }

  function addRow() {
    setRows(prev => [...prev, Array(headers.length).fill('')]);
    mark();
  }

  function removeLastRow() {
    if (rows.length <= 1) return;
    setRows(prev => prev.slice(0, -1));
    if (sel.r >= rows.length - 1) setSel(s => ({ ...s, r: Math.max(0, s.r - 1) }));
    mark();
  }

  function addCol() {
    const label = `Col ${headers.length + 1}`;
    setHeaders(prev => [...prev, label]);
    setRows(prev => prev.map(row => [...row, '']));
    mark();
  }

  function removeLastCol() {
    if (headers.length <= 1) return;
    setHeaders(prev => prev.slice(0, -1));
    setRows(prev => prev.map(row => row.slice(0, -1)));
    if (sel.c >= headers.length - 1) setSel(s => ({ ...s, c: Math.max(0, s.c - 1) }));
    mark();
  }

  // ── Edit flow ──────────────────────────────────────────────────────────────

  function startEdit(r, c, initial = null) {
    const cur = r === -1 ? (headers[c] ?? '') : (rows[r]?.[c] ?? '');
    setEditing({ r, c });
    setEditVal(initial !== null ? initial : cur);
  }

  function commitEdit() {
    if (editing === null) return;
    if (editing.r === -1) setHeader(editing.c, editVal);
    else setCell(editing.r, editing.c, editVal);
    setEditing(null);
  }

  function handleInputKey(e) {
    const { r, c } = editing;
    const nCols = headers.length;
    const nRows = rows.length;

    if (e.key === 'Escape') {
      setEditing(null);
      gridRef.current?.focus();
      return;
    }
    if (e.key === 'Enter') {
      e.preventDefault();
      if (r === -1) setHeader(c, editVal); else setCell(r, c, editVal);
      setEditing(null);
      if (r !== -1) setSel({ r: Math.min(nRows - 1, r + 1), c });
      gridRef.current?.focus();
      return;
    }
    if (e.key === 'Tab') {
      e.preventDefault();
      if (r === -1) setHeader(c, editVal); else setCell(r, c, editVal);
      const nextC = c + (e.shiftKey ? -1 : 1);
      if (nextC < 0 || nextC >= nCols) {
        setEditing(null);
        gridRef.current?.focus();
      } else {
        const nextR = r === -1 ? -1 : r;
        const nextVal = nextR === -1 ? (headers[nextC] ?? '') : (rows[nextR]?.[nextC] ?? '');
        setEditing({ r: nextR, c: nextC });
        setEditVal(nextVal);
        setSel({ r: Math.max(0, nextR), c: nextC });
      }
    }
  }

  function handleGridKey(e) {
    if (editing !== null) return;
    const { r, c } = sel;
    const nRows = rows.length;
    const nCols = headers.length;

    if (e.key === 'ArrowDown')  { e.preventDefault(); setSel({ r: Math.min(nRows - 1, r + 1), c }); return; }
    if (e.key === 'ArrowUp')    { e.preventDefault(); setSel({ r: Math.max(0, r - 1), c }); return; }
    if (e.key === 'ArrowRight') { e.preventDefault(); setSel({ r, c: Math.min(nCols - 1, c + 1) }); return; }
    if (e.key === 'ArrowLeft')  { e.preventDefault(); setSel({ r, c: Math.max(0, c - 1) }); return; }
    if (e.key === 'Tab')        { e.preventDefault(); setSel({ r, c: e.shiftKey ? Math.max(0, c - 1) : Math.min(nCols - 1, c + 1) }); return; }
    if (e.key === 'Enter' || e.key === 'F2') { e.preventDefault(); startEdit(r, c); return; }
    if (e.key === 'Delete' || e.key === 'Backspace') { setCell(r, c, ''); return; }
    if (e.key.length === 1 && !e.ctrlKey && !e.metaKey) { startEdit(r, c, e.key); }
  }

  // ── File import ────────────────────────────────────────────────────────────

  function handleFile(file) {
    const ext = file.name.split('.').pop().toLowerCase();
    if (ext === 'xlsx' || ext === 'xls') {
      const reader = new FileReader();
      reader.onload = e => {
        const wb = XLSX.read(e.target.result, { type: 'array' });
        const ws = wb.Sheets[wb.SheetNames[0]];
        const data = XLSX.utils.sheet_to_json(ws, { header: 1, defval: '' });
        if (!data.length) return;
        const hdrs = data[0].map(String);
        const importedRows = data.slice(1).map(row => row.map(String));
        applyImport(hdrs, importedRows);
      };
      reader.readAsArrayBuffer(file);
    } else {
      const reader = new FileReader();
      reader.onload = e => {
        const lines = e.target.result.split('\n').filter(l => l.trim());
        if (!lines.length) return;
        const parse = line => line.split(',').map(v => v.trim().replace(/^"|"$/g, ''));
        const hdrs = parse(lines[0]);
        const importedRows = lines.slice(1).map(parse);
        applyImport(hdrs, importedRows);
      };
      reader.readAsText(file);
    }
  }

  function applyImport(hdrs, importedRows) {
    const cols = hdrs.length;
    const normalizedRows = importedRows.map(row => {
      const r = [...row.map(String)];
      while (r.length < cols) r.push('');
      return r.slice(0, cols);
    });
    if (normalizedRows.length < 5) {
      while (normalizedRows.length < 5) normalizedRows.push(Array(cols).fill(''));
    }
    setHeaders(hdrs);
    setRows(normalizedRows);
    mark();
  }

  function openAsImport(config) {
    setImportConfig(config);
    setImportData({ headers, rows: gridToObjects(headers, rows) });
    setShowImport(true);
  }

  // ── Styles ─────────────────────────────────────────────────────────────────

  const TH = {
    height: 28, minWidth: 90, padding: '0 8px',
    fontFamily: T.mono, fontSize: 11, fontWeight: 500,
    color: T.fg2, background: T.bg2,
    border: `1px solid ${T.border0}`,
    position: 'sticky', top: 0, zIndex: 4,
    textAlign: 'left', lineHeight: '28px',
    userSelect: 'none', whiteSpace: 'nowrap',
    overflow: 'hidden', textOverflow: 'ellipsis',
    cursor: 'default', boxSizing: 'border-box',
  };

  const TD = (r, c) => ({
    height: 28, minWidth: 90, padding: '0 8px',
    fontFamily: T.mono, fontSize: 11,
    color: T.fg0,
    background: sel.r === r && sel.c === c ? `${T.greenBright}0e` : T.bg0,
    border: `1px solid ${T.border0}`,
    outline: sel.r === r && sel.c === c ? `2px solid ${T.greenBright}55` : 'none',
    outlineOffset: -2,
    lineHeight: '28px', whiteSpace: 'nowrap',
    overflow: 'hidden', textOverflow: 'ellipsis',
    cursor: 'default', userSelect: 'none',
    boxSizing: 'border-box', position: 'relative',
  });

  const inputSt = {
    position: 'absolute', inset: 0, width: '100%', height: '100%',
    fontFamily: T.mono, fontSize: 11, color: T.fg0,
    background: T.bg1, border: `2px solid ${T.greenBright}`,
    borderRadius: 1, padding: '0 6px', outline: 'none',
    boxSizing: 'border-box', zIndex: 10,
  };

  if (loadingSheets) return (
    <div style={{ display: 'flex', justifyContent: 'center', padding: 60 }}>
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" style={{ animation: 'spin 0.8s linear infinite' }}>
        <circle cx="12" cy="12" r="10" stroke={T.border1} strokeWidth="2"/>
        <path d="M12 2 A10 10 0 0 1 22 12" stroke={T.greenBright} strokeWidth="2" strokeLinecap="round"/>
      </svg>
    </div>
  );

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 0, height: 'calc(100vh - 130px)', minHeight: 400 }}>
      {showImport && importConfig && (
        <ImportModal
          clerkUserId={clerkUserId}
          config={importConfig}
          existing={[]}
          initialData={importData}
          onImported={() => setShowImport(false)}
          onClose={() => setShowImport(false)}
        />
      )}

      {/* ── Toolbar ─────────────────────────────────────────────────────── */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap', marginBottom: 14 }}>
        {/* Sheet name */}
        <div style={{ flex: 1, minWidth: 0, display: 'flex', alignItems: 'center', gap: 8 }}>
          {editingName ? (
            <input
              autoFocus
              value={nameVal}
              onChange={e => setNameVal(e.target.value)}
              onBlur={() => { setSheetName(nameVal); setEditingName(false); mark(); }}
              onKeyDown={e => {
                if (e.key === 'Enter' || e.key === 'Escape') {
                  setSheetName(nameVal); setEditingName(false); mark();
                }
              }}
              style={{
                fontFamily: T.serif, fontSize: 20, color: T.fg0, letterSpacing: '-0.4px',
                background: 'transparent', border: 'none',
                borderBottom: `2px solid ${T.greenBright}`, outline: 'none', padding: '1px 0',
              }}
            />
          ) : (
            <span
              onDoubleClick={() => { setNameVal(sheetName); setEditingName(true); }}
              title="Double-click to rename"
              style={{ fontFamily: T.serif, fontSize: 20, color: T.fg0, letterSpacing: '-0.4px', cursor: 'text', userSelect: 'none' }}
            >
              {sheetName}
            </span>
          )}
          {dirty && <span style={{ fontFamily: T.sans, fontSize: 11, color: T.fg3 }} title="Unsaved changes">●</span>}
        </div>

        <input ref={fileRef} type="file" accept=".csv,.xlsx,.xls" style={{ display: 'none' }}
          onChange={e => { const f = e.target.files?.[0]; if (f) handleFile(f); e.target.value = ''; }} />

        <Btn T={T} onClick={() => fileRef.current?.click()} icon="↑">Import file</Btn>
        <Btn T={T} onClick={() => openAsImport(ASSET_CONFIG)}>Save as assets</Btn>
        <Btn T={T} onClick={() => openAsImport(LIABILITY_CONFIG)}>Save as liabilities</Btn>
        <Btn T={T} onClick={saveSheet} disabled={saving || !dirty} highlight>
          {saving ? 'Saving…' : 'Save'}
        </Btn>
      </div>

      {/* ── Sheet tabs ───────────────────────────────────────────────────── */}
      {(sheets.length > 0 || sheetId) && (
        <div style={{ display: 'flex', gap: 4, marginBottom: 10, flexWrap: 'wrap', alignItems: 'center' }}>
          {sheets.map(s => (
            <button key={s._id}
              onClick={() => loadSheet(s._id)}
              style={{
                fontFamily: T.sans, fontSize: 11,
                padding: '4px 11px', borderRadius: 6, cursor: 'pointer',
                border: `1px solid ${s._id === sheetId ? T.greenBright + '55' : T.border0}`,
                background: s._id === sheetId ? `${T.greenBright}12` : T.bg1,
                color: s._id === sheetId ? T.greenText : T.fg2,
                transition: 'all 100ms',
              }}
            >{s.name}</button>
          ))}
          <button onClick={newSheet} style={{
            fontFamily: T.sans, fontSize: 11, padding: '4px 11px',
            borderRadius: 6, cursor: 'pointer',
            border: `1px solid ${T.border0}`,
            background: 'transparent', color: T.fg3,
          }}>+ New sheet</button>
        </div>
      )}

      {/* ── Grid ────────────────────────────────────────────────────────── */}
      <div
        ref={gridRef}
        tabIndex={0}
        onKeyDown={handleGridKey}
        onClick={() => gridRef.current?.focus()}
        style={{
          flex: 1, overflow: 'auto', outline: 'none',
          border: `1px solid ${T.border0}`, borderRadius: 8,
        }}
      >
        <table style={{ borderCollapse: 'collapse', tableLayout: 'auto' }}>
          <thead>
            <tr>
              {/* Row-number column */}
              <th style={{
                ...TH, width: 38, minWidth: 38, textAlign: 'center',
                color: T.fg3, zIndex: 5,
              }}>
                #
              </th>

              {headers.map((h, c) => (
                <th
                  key={c}
                  onDoubleClick={() => startEdit(-1, c)}
                  style={{ ...TH, cursor: 'pointer' }}
                >
                  {editing?.r === -1 && editing.c === c ? (
                    <input
                      ref={inputRef}
                      value={editVal}
                      onChange={e => setEditVal(e.target.value)}
                      onBlur={commitEdit}
                      onKeyDown={handleInputKey}
                      style={inputSt}
                    />
                  ) : h}
                </th>
              ))}

              {/* Add-column button */}
              <th style={{ ...TH, width: 34, minWidth: 34, textAlign: 'center', padding: 0 }}>
                <button onClick={addCol}
                  style={{ background: 'none', border: 'none', cursor: 'pointer', color: T.fg3, fontSize: 16, lineHeight: '28px', width: '100%', padding: 0 }}
                  title="Add column"
                >+</button>
              </th>
            </tr>
          </thead>

          <tbody>
            {rows.map((row, r) => (
              <tr key={r}>
                <td style={{
                  ...TD(r, -1),
                  background: T.bg1, color: T.fg3, textAlign: 'center',
                  fontSize: 10, width: 38, minWidth: 38, outline: 'none',
                  userSelect: 'none', padding: '0 4px',
                }}>
                  {r + 1}
                </td>

                {row.map((val, c) => (
                  <td
                    key={c}
                    onClick={() => { setEditing(null); setSel({ r, c }); gridRef.current?.focus(); }}
                    onDoubleClick={() => startEdit(r, c)}
                    style={TD(r, c)}
                  >
                    {editing?.r === r && editing.c === c ? (
                      <input
                        ref={inputRef}
                        value={editVal}
                        onChange={e => setEditVal(e.target.value)}
                        onBlur={commitEdit}
                        onKeyDown={handleInputKey}
                        style={inputSt}
                      />
                    ) : val}
                  </td>
                ))}

                {/* filler cell */}
                <td style={{ background: T.bg0, border: `1px solid ${T.border0}`, width: 34 }} />
              </tr>
            ))}

            {/* Add-row row */}
            <tr>
              <td colSpan={headers.length + 2}
                style={{ border: `1px solid ${T.border0}`, padding: 0 }}>
                <button onClick={addRow}
                  style={{
                    width: '100%', background: 'none', border: 'none', cursor: 'pointer',
                    fontFamily: T.sans, fontSize: 11, color: T.fg3,
                    padding: '7px 0', transition: 'color 150ms',
                  }}
                  onMouseEnter={e => e.currentTarget.style.color = T.fg1}
                  onMouseLeave={e => e.currentTarget.style.color = T.fg3}
                >
                  + Add row
                </button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      {/* ── Bottom bar ───────────────────────────────────────────────────── */}
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        paddingTop: 10,
        fontFamily: T.sans, fontSize: 10, color: T.fg3,
      }}>
        <span>
          {rows.length} row{rows.length !== 1 ? 's' : ''} · {headers.length} col{headers.length !== 1 ? 's' : ''}
          {sel && <span style={{ marginLeft: 10, color: T.fg3 }}>
            Cell {String.fromCharCode(65 + sel.c)}{sel.r + 1}
          </span>}
        </span>
        <div style={{ display: 'flex', gap: 6 }}>
          <Btn T={T} onClick={addRow}>+ Row</Btn>
          <Btn T={T} onClick={removeLastRow}>− Row</Btn>
          <Btn T={T} onClick={addCol}>+ Col</Btn>
          <Btn T={T} onClick={removeLastCol}>− Col</Btn>
          {sheetId && <Btn T={T} onClick={deleteSheet} danger>Delete</Btn>}
        </div>
      </div>
    </div>
  );
}
