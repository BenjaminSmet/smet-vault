import { useState, useEffect } from 'react'
import Papa from 'papaparse'
import Sheet from './Sheet'
import { fmt } from '../utils/finance'

/** Parses European-formatted amounts: "1.234,56" or "-45,00" or "45.00" */
function parseAmount(raw) {
  if (typeof raw === 'number') return raw
  if (!raw) return NaN
  let s = String(raw).trim().replace(/€/g, '').trim()
  const hasComma = s.includes(',')
  const hasDot = s.includes('.')
  if (hasComma && hasDot) {
    // assume dot = thousands separator, comma = decimal
    s = s.replace(/\./g, '').replace(',', '.')
  } else if (hasComma) {
    s = s.replace(',', '.')
  }
  return parseFloat(s)
}

/** Tries a handful of common date formats. */
function parseDateFlexible(raw) {
  if (!raw) return null
  const s = String(raw).trim()
  // YYYY-MM-DD
  let m = s.match(/^(\d{4})-(\d{2})-(\d{2})/)
  if (m) return new Date(+m[1], +m[2] - 1, +m[3])
  // DD/MM/YYYY or DD-MM-YYYY
  m = s.match(/^(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{4})/)
  if (m) return new Date(+m[3], +m[2] - 1, +m[1])
  const d = new Date(s)
  return isNaN(d.getTime()) ? null : d
}

function guessColumn(headers, keywords) {
  const lower = headers.map(h => h.toLowerCase())
  for (const kw of keywords) {
    const idx = lower.findIndex(h => h.includes(kw))
    if (idx !== -1) return headers[idx]
  }
  return ''
}

export default function ImportTransactions({ account, isShared, allKnownIbans, onImport, onClose }) {
  const [step, setStep] = useState('upload') // upload | map | preview | done
  const [headers, setHeaders] = useState([])
  const [rows, setRows] = useState([])
  const [mapping, setMapping] = useState({ date: '', amount: '', description: '', iban: '' })
  const [parsedRows, setParsedRows] = useState([])
  const [summary, setSummary] = useState(null)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleFile = (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    setError('')
    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: (result) => {
        if (!result.data.length) { setError('No rows found in that file.'); return }
        const cols = result.meta.fields || []
        setHeaders(cols)
        setRows(result.data)
        setMapping({
          date: guessColumn(cols, ['date', 'datum']),
          amount: guessColumn(cols, ['amount', 'bedrag', 'montant']),
          description: guessColumn(cols, ['description', 'communication', 'memo', 'mededeling', 'omschrijving']),
          iban: guessColumn(cols, ['iban', 'counterparty', 'tegenpartij']),
        })
        setStep('map')
      },
      error: (err) => setError(err.message),
    })
  }

  const buildPreview = () => {
    if (!mapping.date || !mapping.amount) {
      setError('Date and Amount columns are required.')
      return
    }
    const parsed = rows.map(r => {
      const date = parseDateFlexible(r[mapping.date])
      const amount = parseAmount(r[mapping.amount])
      return {
        date,
        amount,
        description: mapping.description ? r[mapping.description] : '',
        counterpartyIban: mapping.iban ? r[mapping.iban] : '',
        valid: !!date && !isNaN(amount),
      }
    })
    const invalidCount = parsed.filter(p => !p.valid).length
    if (invalidCount > 0) {
      setError(`${invalidCount} row(s) couldn't be parsed and will be skipped.`)
    } else {
      setError('')
    }
    setParsedRows(parsed.filter(p => p.valid))
    setStep('preview')
  }

  const confirmImport = async () => {
    setLoading(true)
    try {
      const result = await onImport(account.id, isShared, parsedRows, allKnownIbans)
      setSummary(result)
      setStep('done')
    } catch (e) {
      setError(e.message || 'Import failed.')
    }
    setLoading(false)
  }

  return (
    <Sheet title={`Import to ${account.name}`} onClose={onClose}>
      {step === 'upload' && (
        <div>
          <p style={{ fontSize: 15, color: 'var(--text-secondary)', marginBottom: 20, lineHeight: 1.5 }}>
            Upload a CSV export from your bank. Transactions dated before this account's tracking start date are skipped automatically, and duplicates from re-imports are detected.
          </p>
          <label className="btn-primary" style={{ display: 'block', textAlign: 'center', cursor: 'pointer' }}>
            Choose CSV File
            <input type="file" accept=".csv" onChange={handleFile} style={{ display: 'none' }} />
          </label>
          {error && <p style={{ color: 'var(--accent-red)', fontSize: 14, marginTop: 12 }}>{error}</p>}
        </div>
      )}

      {step === 'map' && (
        <div>
          <p style={{ fontSize: 15, color: 'var(--text-secondary)', marginBottom: 16 }}>
            Match the columns from your file. We guessed where we could.
          </p>
          <ColumnSelect label="Date *" headers={headers} value={mapping.date} onChange={v => setMapping(m => ({ ...m, date: v }))} />
          <ColumnSelect label="Amount *" headers={headers} value={mapping.amount} onChange={v => setMapping(m => ({ ...m, amount: v }))} />
          <ColumnSelect label="Description (optional)" headers={headers} value={mapping.description} onChange={v => setMapping(m => ({ ...m, description: v }))} allowNone />
          <ColumnSelect label="Counterparty IBAN (optional)" headers={headers} value={mapping.iban} onChange={v => setMapping(m => ({ ...m, iban: v }))} allowNone />
          <p style={{ fontSize: 13, color: 'var(--text-tertiary)', marginBottom: 16, lineHeight: 1.5 }}>
            IBAN lets us auto-tag transfers between your own accounts instead of counting them as regular spending.
          </p>
          {error && <p style={{ color: 'var(--accent-red)', fontSize: 14, marginBottom: 12 }}>{error}</p>}
          <button className="btn-primary" onClick={buildPreview}>Preview Import</button>
        </div>
      )}

      {step === 'preview' && (
        <div>
          <p style={{ fontSize: 15, color: 'var(--text-secondary)', marginBottom: 12 }}>
            {parsedRows.length} transaction{parsedRows.length !== 1 ? 's' : ''} ready to import.
          </p>
          {error && <p style={{ color: 'var(--accent-amber)', fontSize: 14, marginBottom: 12 }}>{error}</p>}
          <div className="glass-sm" style={{ maxHeight: 280, overflowY: 'auto', marginBottom: 16 }}>
            {parsedRows.slice(0, 30).map((r, i) => (
              <div key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 14px', borderBottom: i < parsedRows.length - 1 ? '1px solid rgba(255,255,255,0.06)' : 'none' }}>
                <div style={{ minWidth: 0, flex: 1 }}>
                  <p style={{ fontSize: 14, fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{r.description || '—'}</p>
                  <p style={{ fontSize: 12, color: 'var(--text-tertiary)' }}>{r.date.toLocaleDateString('nl-BE')}</p>
                </div>
                <p style={{ fontSize: 14, fontWeight: 700, color: r.amount >= 0 ? 'var(--accent-green)' : 'var(--accent-red)' }}>
                  {r.amount >= 0 ? '+' : ''}{fmt(r.amount)}
                </p>
              </div>
            ))}
            {parsedRows.length > 30 && (
              <p style={{ textAlign: 'center', padding: 10, fontSize: 12, color: 'var(--text-tertiary)' }}>
                +{parsedRows.length - 30} more
              </p>
            )}
          </div>
          <button className="btn-primary" onClick={confirmImport} disabled={loading}>
            {loading ? 'Importing…' : `Import ${parsedRows.length} Transactions`}
          </button>
        </div>
      )}

      {step === 'done' && summary && (
        <div style={{ textAlign: 'center' }}>
          <p style={{ fontSize: 42, marginBottom: 12 }}>✅</p>
          <p style={{ fontSize: 19, fontWeight: 700, marginBottom: 16 }}>Import complete</p>
          <div className="glass-sm" style={{ padding: 16, textAlign: 'left', marginBottom: 16 }}>
            <SummaryRow label="Imported" value={summary.imported} color="var(--accent-green)" />
            <SummaryRow label="Tagged as transfers" value={summary.transfers} color="var(--accent-blue)" />
            <SummaryRow label="Skipped — before tracking start" value={summary.skippedOld} />
            <SummaryRow label="Skipped — duplicates" value={summary.skippedDupe} />
          </div>
          <button className="btn-primary" onClick={onClose}>Done</button>
        </div>
      )}
    </Sheet>
  )
}

function ColumnSelect({ label, headers, value, onChange, allowNone }) {
  return (
    <div className="input-group">
      <label className="input-label">{label}</label>
      <select className="input-field" value={value} onChange={e => onChange(e.target.value)}>
        {allowNone && <option value="">— None —</option>}
        {headers.map(h => <option key={h} value={h}>{h}</option>)}
      </select>
    </div>
  )
}

function SummaryRow({ label, value, color }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0' }}>
      <p style={{ fontSize: 14, color: 'var(--text-secondary)' }}>{label}</p>
      <p style={{ fontSize: 14, fontWeight: 700, color: color || 'var(--text-primary)' }}>{value}</p>
    </div>
  )
}
