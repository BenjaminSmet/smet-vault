import { useState } from 'react'
import { useFinance } from '../contexts/FinanceContext'
import { useAuth } from '../contexts/AuthContext'
import { fmt, fmtDate, accountTypeLabel, accountTypeColor, randomColor } from '../utils/finance'

export default function Accounts() {
  const { user } = useAuth()
  const {
    accounts, houseAccounts, allTransactions,
    addAccount, addHouseAccount, deleteAccount,
    addTransaction, houseId, createHouse, joinHouse
  } = useFinance()

  const [tab, setTab]                 = useState('private')
  const [showAddAccount, setShowAddAccount] = useState(false)
  const [showAddTx, setShowAddTx]     = useState(false)
  const [showHouseSetup, setShowHouseSetup] = useState(false)
  const [selectedAccount, setSelectedAccount] = useState(null)
  const [houseCode, setHouseCode]     = useState('')
  const [generatedCode, setGeneratedCode] = useState(null)
  const [joinMode, setJoinMode]       = useState(false)
  const [loading, setLoading]         = useState(false)

  const isPrivate = tab === 'private'
  const currentAccounts = isPrivate ? accounts : houseAccounts
  const currentTxs = selectedAccount
    ? allTransactions.filter(tx => tx.accountId === selectedAccount)
    : allTransactions.filter(tx => isPrivate ? !tx.isShared : tx.isShared)

  const handleCreateHouse = async () => {
    setLoading(true)
    try {
      const code = await createHouse()
      setGeneratedCode(code)
    } catch (e) { console.error(e) }
    setLoading(false)
  }

  const handleJoinHouse = async () => {
    if (!houseCode.trim()) return
    setLoading(true)
    try {
      await joinHouse(houseCode.trim().toUpperCase())
      setShowHouseSetup(false)
    } catch (e) {
      alert('House not found. Check the code and try again.')
    }
    setLoading(false)
  }

  return (
    <div className="page-scroll fade-in">
      <div className="page-header">
        <h1 className="page-title">Accounts</h1>
        <button className="header-action" onClick={() => setShowAddAccount(true)}>
          <PlusIcon />
        </button>
      </div>

      {/* Tab switcher */}
      <div className="segmented" style={{ marginBottom: 20 }}>
        <button className={`seg-item ${tab === 'private' ? 'active' : ''}`} onClick={() => { setTab('private'); setSelectedAccount(null) }}>
          🔒 Private
        </button>
        <button className={`seg-item ${tab === 'house' ? 'active' : ''}`} onClick={() => { setTab('house'); setSelectedAccount(null) }}>
          🏠 House
        </button>
      </div>

      {/* House tab — no houseId yet */}
      {tab === 'house' && !houseId && (
        <div className="glass" style={{ padding: '28px 20px', textAlign: 'center' }}>
          <div style={{ fontSize: 40, marginBottom: 12 }}>🏡</div>
          <p style={{ fontSize: 18, fontWeight: 700, marginBottom: 6 }}>Share your home finances</p>
          <p style={{ fontSize: 15, color: 'var(--text-secondary)', marginBottom: 24, lineHeight: 1.5 }}>
            Create a house or join your brother's to share accounts and track house expenses together.
          </p>
          <button className="btn-primary" onClick={() => { setShowHouseSetup(true); setJoinMode(false) }}>
            Create House
          </button>
          <button className="btn-glass" style={{ marginTop: 10, width: '100%' }} onClick={() => { setShowHouseSetup(true); setJoinMode(true) }}>
            Join with a code
          </button>
        </div>
      )}

      {/* Accounts list */}
      {(tab === 'private' || houseId) && (
        <>
          {currentAccounts.length === 0 ? (
            <div className="empty-state">
              <BankIcon />
              <p>No accounts yet</p>
              <p style={{ fontSize: 14, color: 'var(--text-tertiary)' }}>
                Tap + to add your first {isPrivate ? '' : 'shared '}account
              </p>
            </div>
          ) : (
            <div className="card-stack" style={{ marginBottom: 20 }}>
              {currentAccounts.map(acc => (
                <div
                  key={acc.id}
                  className="glass"
                  style={{
                    padding: '18px 20px', cursor: 'pointer',
                    border: selectedAccount === acc.id ? `1px solid ${accountTypeColor[acc.type] || '#5E9BFF'}` : undefined,
                  }}
                  onClick={() => setSelectedAccount(selectedAccount === acc.id ? null : acc.id)}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                      <div style={{
                        width: 44, height: 44, borderRadius: 14,
                        background: `${accountTypeColor[acc.type] || '#5E9BFF'}20`,
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontSize: 21,
                      }}>
                        {accountTypeEmoji[acc.type] || '💳'}
                      </div>
                      <div>
                        <p style={{ fontWeight: 700, fontSize: 17 }}>{acc.name}</p>
                        <p style={{ fontSize: 14, color: 'var(--text-tertiary)', marginTop: 1 }}>
                          {accountTypeLabel[acc.type] || 'Other'}
                          {acc.iban && ` · ${acc.iban.slice(-4)}`}
                        </p>
                      </div>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <p style={{
                        fontSize: 21, fontWeight: 700,
                        color: (acc.balance || 0) >= 0 ? 'var(--text-primary)' : 'var(--accent-red)',
                      }}>
                        {fmt(acc.balance || 0)}
                      </p>
                    </div>
                  </div>

                  {selectedAccount === acc.id && (
                    <div style={{ marginTop: 14, paddingTop: 14, borderTop: '1px solid rgba(255,255,255,0.06)' }}>
                      <button
                        className="btn-primary"
                        style={{ marginBottom: 8 }}
                        onClick={(e) => { e.stopPropagation(); setShowAddTx(true) }}
                      >
                        <PlusIcon size={16} /> Add Transaction
                      </button>
                      <button
                        className="btn-glass"
                        style={{ width: '100%', color: 'var(--accent-red)', fontSize: 15 }}
                        onClick={(e) => { e.stopPropagation(); if (confirm('Delete this account?')) deleteAccount(acc.id) }}
                      >
                        Delete Account
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}

          {/* Transactions */}
          {currentTxs.length > 0 && (
            <>
              <p className="section-label">
                {selectedAccount ? 'Account Transactions' : 'All Transactions'}
              </p>
              <div className="glass" style={{ overflow: 'hidden' }}>
                {currentTxs.slice(0, 20).map((tx, i) => (
                  <div key={tx.id}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 16px' }}>
                      <div style={{
                        width: 36, height: 36, borderRadius: 10,
                        background: tx.type === 'income' ? 'rgba(52,211,153,0.15)' : 'rgba(248,113,113,0.12)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16,
                      }}>
                        {tx.type === 'income' ? '↓' : '↑'}
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <p style={{ fontSize: 15, fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {tx.description || tx.category}
                        </p>
                        <p style={{ fontSize: 13, color: 'var(--text-tertiary)', marginTop: 1 }}>
                          {fmtDate(tx.date)} · {tx.category}
                        </p>
                      </div>
                      <p style={{ fontSize: 16, fontWeight: 700, color: tx.type === 'income' ? 'var(--accent-green)' : 'var(--accent-red)' }}>
                        {tx.type === 'income' ? '+' : '-'}{fmt(Math.abs(tx.amount || 0))}
                      </p>
                    </div>
                    {i < currentTxs.length - 1 && <div className="divider" style={{ margin: '0 16px' }} />}
                  </div>
                ))}
              </div>
            </>
          )}

          {houseId && (
            <p style={{ textAlign: 'center', marginTop: 16, fontSize: 14, color: 'var(--text-tertiary)' }}>
              House code: <span style={{ fontWeight: 700, letterSpacing: 1, color: 'var(--accent-blue)' }}>{houseId}</span>
            </p>
          )}
        </>
      )}

      {/* Add Account Sheet */}
      {showAddAccount && (
        <AddAccountSheet
          isPrivate={isPrivate}
          houseId={houseId}
          onAdd={async (data) => {
            if (isPrivate) await addAccount(data)
            else await addHouseAccount(data)
            setShowAddAccount(false)
          }}
          onClose={() => setShowAddAccount(false)}
        />
      )}

      {/* Add Transaction Sheet */}
      {showAddTx && selectedAccount && (
        <AddTransactionSheet
          accounts={currentAccounts}
          defaultAccountId={selectedAccount}
          isShared={!isPrivate}
          onAdd={async (data) => {
            await addTransaction(data, !isPrivate)
            setShowAddTx(false)
          }}
          onClose={() => setShowAddTx(false)}
        />
      )}

      {/* House Setup Sheet */}
      {showHouseSetup && (
        <div className="sheet-overlay" onClick={() => setShowHouseSetup(false)}>
          <div className="sheet" onClick={e => e.stopPropagation()}>
            <div className="sheet-handle" />
            <p className="sheet-title">{joinMode ? 'Join a House' : 'Create Your House'}</p>

            {!joinMode ? (
              <>
                {generatedCode ? (
                  <div>
                    <p style={{ color: 'var(--text-secondary)', fontSize: 15, marginBottom: 20 }}>
                      Share this code with your brother so he can join your house account.
                    </p>
                    <div className="glass-sm" style={{ padding: '20px', textAlign: 'center', marginBottom: 20 }}>
                      <p style={{ fontSize: 36, fontWeight: 800, letterSpacing: 6, color: 'var(--accent-blue)' }}>{generatedCode}</p>
                      <p style={{ fontSize: 14, color: 'var(--text-tertiary)', marginTop: 6 }}>House code</p>
                    </div>
                    <button className="btn-primary" onClick={() => setShowHouseSetup(false)}>Done</button>
                  </div>
                ) : (
                  <>
                    <p style={{ color: 'var(--text-secondary)', fontSize: 15, marginBottom: 24 }}>
                      Create a shared house to track joint expenses and bank accounts with your brother.
                    </p>
                    <button className="btn-primary" onClick={handleCreateHouse} disabled={loading}>
                      {loading ? 'Creating…' : '🏡 Create House'}
                    </button>
                  </>
                )}
              </>
            ) : (
              <>
                <p style={{ color: 'var(--text-secondary)', fontSize: 15, marginBottom: 20 }}>
                  Enter the house code your brother shared with you.
                </p>
                <div className="input-group">
                  <label className="input-label">House Code</label>
                  <input
                    className="input-field"
                    placeholder="ABC123"
                    value={houseCode}
                    onChange={e => setHouseCode(e.target.value.toUpperCase())}
                    style={{ textAlign: 'center', fontSize: 25, fontWeight: 700, letterSpacing: 4 }}
                    maxLength={6}
                  />
                </div>
                <button className="btn-primary" onClick={handleJoinHouse} disabled={loading || !houseCode}>
                  {loading ? 'Joining…' : 'Join House'}
                </button>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

// ── Sub-components ────────────────────────────────────────────

function AddAccountSheet({ isPrivate, onAdd, onClose }) {
  const [form, setForm] = useState({ name: '', type: 'checking', balance: '', iban: '' })
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }))

  const handleSubmit = async () => {
    if (!form.name || form.balance === '') return
    await onAdd({
      name: form.name,
      type: form.type,
      balance: parseFloat(form.balance) || 0,
      iban: form.iban,
      color: accountTypeColor[form.type] || '#5E9BFF',
    })
  }

  return (
    <div className="sheet-overlay" onClick={onClose}>
      <div className="sheet" onClick={e => e.stopPropagation()}>
        <div className="sheet-handle" />
        <p className="sheet-title">New {isPrivate ? 'Private' : 'House'} Account</p>
        <div className="input-group">
          <label className="input-label">Account Name</label>
          <input className="input-field" placeholder="e.g. BNP Main Account" value={form.name} onChange={e => set('name', e.target.value)} />
        </div>
        <div className="input-group">
          <label className="input-label">Type</label>
          <select className="input-field" value={form.type} onChange={e => set('type', e.target.value)}>
            <option value="checking">Checking</option>
            <option value="savings">Savings</option>
            <option value="investment">Investment</option>
            <option value="cash">Cash</option>
            <option value="other">Other</option>
          </select>
        </div>
        <div className="input-group">
          <label className="input-label">Current Balance (€)</label>
          <input className="input-field" type="number" placeholder="0.00" value={form.balance} onChange={e => set('balance', e.target.value)} />
        </div>
        <div className="input-group">
          <label className="input-label">IBAN (optional)</label>
          <input className="input-field" placeholder="BE68 5390 0754 7034" value={form.iban} onChange={e => set('iban', e.target.value)} />
        </div>
        <button className="btn-primary" onClick={handleSubmit}>Add Account</button>
      </div>
    </div>
  )
}

function AddTransactionSheet({ accounts, defaultAccountId, isShared, onAdd, onClose }) {
  const [form, setForm] = useState({
    type: 'expense', accountId: defaultAccountId || '',
    amount: '', category: 'other', description: '',
  })
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }))

  const CATEGORIES = ['housing','food','transport','health','entertainment','utilities','insurance','subscriptions','income','other']

  return (
    <div className="sheet-overlay" onClick={onClose}>
      <div className="sheet" onClick={e => e.stopPropagation()}>
        <div className="sheet-handle" />
        <p className="sheet-title">New Transaction</p>
        <div className="segmented" style={{ marginBottom: 16 }}>
          <button className={`seg-item ${form.type === 'expense' ? 'active' : ''}`} onClick={() => set('type','expense')}>Expense</button>
          <button className={`seg-item ${form.type === 'income' ? 'active' : ''}`} onClick={() => set('type','income')}>Income</button>
        </div>
        <div className="input-group">
          <label className="input-label">Amount (€)</label>
          <input className="input-field" type="number" placeholder="0.00" value={form.amount} onChange={e => set('amount', e.target.value)} />
        </div>
        <div className="input-group">
          <label className="input-label">Account</label>
          <select className="input-field" value={form.accountId} onChange={e => set('accountId', e.target.value)}>
            {accounts.map(a => <option key={a.id} value={a.id}>{a.name}</option>)}
          </select>
        </div>
        <div className="input-group">
          <label className="input-label">Category</label>
          <select className="input-field" value={form.category} onChange={e => set('category', e.target.value)}>
            {CATEGORIES.map(c => <option key={c} value={c} style={{ textTransform: 'capitalize' }}>{c}</option>)}
          </select>
        </div>
        <div className="input-group">
          <label className="input-label">Description (optional)</label>
          <input className="input-field" placeholder="What was this for?" value={form.description} onChange={e => set('description', e.target.value)} />
        </div>
        <button
          className="btn-primary"
          disabled={!form.amount || !form.accountId}
          onClick={() => onAdd({ ...form, amount: parseFloat(form.amount) })}
        >
          Add {form.type === 'income' ? 'Income' : 'Expense'}
        </button>
      </div>
    </div>
  )
}

const accountTypeEmoji = { checking: '💳', savings: '💰', investment: '📈', cash: '💵', other: '🏦' }

function PlusIcon({ size = 18 }) {
  return (
    <svg width={size} height={size} fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
      <path strokeLinecap="round" d="M12 5v14M5 12h14" />
    </svg>
  )
}
function BankIcon() {
  return (
    <svg width="40" height="40" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
      <path strokeLinecap="round" d="M2 7.5L12 3l10 4.5V9H2V7.5zm2 3h16v8H4v-8zm4 0v8m4-8v8m4-8v8" opacity=".4"/>
    </svg>
  )
}
