import { useState, useEffect } from 'react'
import { useFinance } from '../contexts/FinanceContext'
import { useUI } from '../contexts/UIContext'
import { fmt, fmtCompact, randomColor } from '../utils/finance'

const CATEGORIES = ['housing','food','transport','health','entertainment','utilities','insurance','subscriptions','other']
const CAT_EMOJI  = { housing:'🏠', food:'🛒', transport:'🚗', health:'💊', entertainment:'🎬', utilities:'💡', insurance:'🛡️', subscriptions:'📱', savings:'💰', other:'📦' }
const PIGGY_EMOJIS = ['🐷','🏦','✈️','🎮','👗','🏋️','🎸','🏠','💍','🎓','🚗','🌴']
const COLORS = ['#5E9BFF','#A78BFA','#34D399','#FBBF24','#F87171','#2DD4BF','#FB923C','#EC4899']

export default function Budget() {
  const { setSheetOpen } = useUI()
  const {
    fixedCosts, monthlyFixed, addFixedCost, deleteFixedCost,
    piggyBanks, addPiggyBank, updatePiggyBank, deletePiggyBank,
    totalBalance, savingsBalance, goals
  } = useFinance()

  const [section, setSection] = useState('fixed')
  const [showAddFixed, setShowAddFixed]   = useState(false)
  const [showAddPiggy, setShowAddPiggy]   = useState(false)
  const [showCalculator, setShowCalculator] = useState(false)
  const [showDeposit, setShowDeposit]     = useState(null) // piggy bank id

  useEffect(() => {
    const anyOpen = showAddFixed || showAddPiggy || showCalculator || !!showDeposit
    setSheetOpen(anyOpen)
    return () => setSheetOpen(false)
  }, [showAddFixed, showAddPiggy, showCalculator, showDeposit, setSheetOpen])

  const yearlyFixed = fixedCosts.reduce((s, c) =>
    s + (c.frequency === 'yearly' ? (c.amount || 0) : (c.amount || 0) * 12), 0)

  return (
    <div className="page-scroll fade-in">
      <div className="page-header">
        <h1 className="page-title">Budget</h1>
        <button className="header-action" onClick={() => setShowCalculator(true)}>
          <CalcIcon />
        </button>
      </div>

      {/* Section tabs */}
      <div className="segmented" style={{ marginBottom: 20 }}>
        <button className={`seg-item ${section === 'fixed' ? 'active' : ''}`} onClick={() => setSection('fixed')}>Fixed Costs</button>
        <button className={`seg-item ${section === 'piggy' ? 'active' : ''}`} onClick={() => setSection('piggy')}>Piggy Banks</button>
      </div>

      {/* ── Fixed Costs ── */}
      {section === 'fixed' && (
        <>
          {/* Summary card */}
          <div className="glass" style={{ padding: '20px', marginBottom: 16, position: 'relative', overflow: 'hidden' }}>
            <div style={{ position: 'absolute', inset: 0, background: 'radial-gradient(ellipse at 90% 10%, rgba(248,113,113,0.12) 0%, transparent 60%)', pointerEvents: 'none' }} />
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
              <div>
                <p style={{ fontSize: 14, fontWeight: 600, letterSpacing: 0.08, textTransform: 'uppercase', color: 'var(--text-tertiary)', marginBottom: 4 }}>Monthly Fixed</p>
                <p style={{ fontSize: 36, fontWeight: 700, letterSpacing: -1, color: 'var(--accent-red)' }}>{fmt(monthlyFixed)}</p>
              </div>
              <div style={{ textAlign: 'right' }}>
                <p style={{ fontSize: 14, color: 'var(--text-tertiary)', marginBottom: 2 }}>Yearly total</p>
                <p style={{ fontSize: 19, fontWeight: 700 }}>{fmtCompact(yearlyFixed)}</p>
              </div>
            </div>
            {fixedCosts.length > 0 && (
              <div style={{ marginTop: 14 }}>
                <CategoryBar costs={fixedCosts} />
              </div>
            )}
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
            <p className="section-label" style={{ marginBottom: 0 }}>Monthly Expenses</p>
            <button className="btn-glass" style={{ padding: '8px 14px', fontSize: 15 }} onClick={() => setShowAddFixed(true)}>
              + Add
            </button>
          </div>

          {fixedCosts.length === 0 ? (
            <div className="empty-state">
              <p style={{ fontSize: 33 }}>📋</p>
              <p>No fixed costs yet</p>
              <p style={{ fontSize: 14 }}>Add rent, subscriptions, utilities…</p>
            </div>
          ) : (
            <div className="glass" style={{ overflow: 'hidden' }}>
              {fixedCosts.map((cost, i) => (
                <div key={cost.id}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '13px 16px' }}
                    onLongPress={() => deleteFixedCost(cost.id)}>
                    <div style={{
                      width: 38, height: 38, borderRadius: 12,
                      background: `${cost.color || '#5E9BFF'}18`,
                      display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18,
                    }}>
                      {CAT_EMOJI[cost.category] || '📦'}
                    </div>
                    <div style={{ flex: 1 }}>
                      <p style={{ fontWeight: 600, fontSize: 15 }}>{cost.name}</p>
                      <p style={{ fontSize: 13, color: 'var(--text-tertiary)', marginTop: 1, textTransform: 'capitalize' }}>
                        {cost.category} · {cost.frequency === 'yearly' ? 'yearly' : 'monthly'}
                      </p>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <div style={{ textAlign: 'right' }}>
                        <p style={{ fontSize: 16, fontWeight: 700, color: 'var(--accent-red)' }}>{fmt(cost.amount)}</p>
                        {cost.frequency === 'yearly' && (
                          <p style={{ fontSize: 12, color: 'var(--text-tertiary)' }}>{fmt(cost.amount / 12)}/mo</p>
                        )}
                      </div>
                      <button
                        style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-tertiary)', padding: 4 }}
                        onClick={() => { if (confirm(`Delete ${cost.name}?`)) deleteFixedCost(cost.id) }}
                      >
                        <TrashIcon />
                      </button>
                    </div>
                  </div>
                  {i < fixedCosts.length - 1 && <div className="divider" style={{ margin: '0 16px' }} />}
                </div>
              ))}
            </div>
          )}
        </>
      )}

      {/* ── Piggy Banks ── */}
      {section === 'piggy' && (
        <>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
            <p className="section-label" style={{ marginBottom: 0 }}>Your Jars</p>
            <button className="btn-glass" style={{ padding: '8px 14px', fontSize: 15 }} onClick={() => setShowAddPiggy(true)}>
              + New Jar
            </button>
          </div>

          {piggyBanks.length === 0 ? (
            <div className="empty-state">
              <p style={{ fontSize: 40 }}>🐷</p>
              <p>No piggy banks yet</p>
              <p style={{ fontSize: 14 }}>Create jars for holiday, car, emergency fund…</p>
            </div>
          ) : (
            <div className="card-stack">
              {piggyBanks.map(p => {
                const pct = p.targetAmount > 0 ? Math.min(100, ((p.currentAmount || 0) / p.targetAmount) * 100) : 0
                return (
                  <div key={p.id} className="glass" style={{ padding: '18px 20px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                        <div style={{
                          width: 44, height: 44, borderRadius: 14,
                          background: `${p.color || '#34D399'}18`,
                          display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 23,
                        }}>
                          {p.emoji || '🐷'}
                        </div>
                        <div>
                          <p style={{ fontWeight: 700, fontSize: 17 }}>{p.name}</p>
                          <p style={{ fontSize: 23, fontWeight: 700, color: p.color || '#34D399', marginTop: 2 }}>
                            {fmt(p.currentAmount || 0)}
                          </p>
                        </div>
                      </div>
                      <div style={{ textAlign: 'right' }}>
                        <p style={{ fontSize: 15, fontWeight: 700, color: p.color || '#34D399' }}>{Math.round(pct)}%</p>
                        <p style={{ fontSize: 14, color: 'var(--text-tertiary)' }}>of {fmtCompact(p.targetAmount)}</p>
                      </div>
                    </div>

                    <div className="progress-track" style={{ marginBottom: 12 }}>
                      <div className="progress-fill" style={{ width: `${pct}%`, background: `linear-gradient(90deg, ${p.color || '#34D399'}aa, ${p.color || '#34D399'})` }} />
                    </div>

                    <div style={{ display: 'flex', gap: 8 }}>
                      <button
                        className="btn-glass"
                        style={{ flex: 1, fontSize: 15, padding: '9px' }}
                        onClick={() => setShowDeposit({ id: p.id, name: p.name, mode: 'deposit' })}
                      >
                        + Deposit
                      </button>
                      <button
                        className="btn-glass"
                        style={{ flex: 1, fontSize: 15, padding: '9px' }}
                        onClick={() => setShowDeposit({ id: p.id, name: p.name, mode: 'withdraw' })}
                      >
                        − Withdraw
                      </button>
                      <button
                        className="btn-icon"
                        style={{ width: 38, height: 38, borderRadius: 12 }}
                        onClick={() => { if (confirm(`Delete ${p.name}?`)) deletePiggyBank(p.id) }}
                      >
                        <TrashIcon size={14} />
                      </button>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </>
      )}

      {/* ── Add Fixed Cost Sheet ── */}
      {showAddFixed && (
        <AddFixedCostSheet
          onAdd={async (d) => { await addFixedCost(d); setShowAddFixed(false) }}
          onClose={() => setShowAddFixed(false)}
        />
      )}

      {/* ── Add Piggy Bank Sheet ── */}
      {showAddPiggy && (
        <AddPiggySheet
          onAdd={async (d) => { await addPiggyBank(d); setShowAddPiggy(false) }}
          onClose={() => setShowAddPiggy(false)}
        />
      )}

      {/* ── Deposit/Withdraw Sheet ── */}
      {showDeposit && (
        <DepositSheet
          piggy={showDeposit}
          onAction={async (id, delta) => { await updatePiggyBank(id, delta); setShowDeposit(null) }}
          onClose={() => setShowDeposit(null)}
        />
      )}

      {/* ── Can I Buy This? Calculator ── */}
      {showCalculator && (
        <CanIBuyThisSheet
          savingsBalance={savingsBalance}
          monthlyFixed={monthlyFixed}
          goals={goals}
          onClose={() => setShowCalculator(false)}
        />
      )}
    </div>
  )
}

// ── Sub-components ────────────────────────────────────────────

function CategoryBar({ costs }) {
  const total = costs.reduce((s, c) => s + (c.frequency === 'yearly' ? (c.amount || 0) / 12 : (c.amount || 0)), 0)
  const byCategory = costs.reduce((acc, c) => {
    const monthly = c.frequency === 'yearly' ? (c.amount || 0) / 12 : (c.amount || 0)
    acc[c.category] = (acc[c.category] || 0) + monthly
    return acc
  }, {})

  const entries = Object.entries(byCategory).sort((a, b) => b[1] - a[1])
  const catColors = { housing:'#F87171', food:'#FBBF24', transport:'#5E9BFF', health:'#34D399', entertainment:'#A78BFA', utilities:'#2DD4BF', insurance:'#FB923C', subscriptions:'#EC4899', other:'#94A3B8' }

  return (
    <div>
      <div style={{ height: 8, borderRadius: 4, overflow: 'hidden', display: 'flex', gap: 1 }}>
        {entries.map(([cat, amt]) => (
          <div key={cat} style={{ flex: amt / total, background: catColors[cat] || '#94A3B8', minWidth: 2 }} />
        ))}
      </div>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px 12px', marginTop: 8 }}>
        {entries.map(([cat, amt]) => (
          <div key={cat} style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
            <div style={{ width: 7, height: 7, borderRadius: 2, background: catColors[cat] || '#94A3B8' }} />
            <span style={{ fontSize: 13, color: 'var(--text-secondary)', textTransform: 'capitalize' }}>{cat}</span>
          </div>
        ))}
      </div>
    </div>
  )
}

function AddFixedCostSheet({ onAdd, onClose }) {
  const [form, setForm] = useState({ name: '', amount: '', category: 'other', frequency: 'monthly' })
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }))

  return (
    <div className="sheet-overlay" onClick={onClose}>
      <div className="sheet" onClick={e => e.stopPropagation()}>
        <div className="sheet-handle" />
        <p className="sheet-title">Add Fixed Cost</p>
        <div className="input-group">
          <label className="input-label">Name</label>
          <input className="input-field" placeholder="e.g. Rent, Netflix, Internet" value={form.name} onChange={e => set('name', e.target.value)} />
        </div>
        <div className="input-group">
          <label className="input-label">Amount (€)</label>
          <input className="input-field" type="number" placeholder="0.00" value={form.amount} onChange={e => set('amount', e.target.value)} />
        </div>
        <div className="input-group">
          <label className="input-label">Category</label>
          <select className="input-field" value={form.category} onChange={e => set('category', e.target.value)}>
            {CATEGORIES.map(c => <option key={c} value={c} style={{ textTransform: 'capitalize' }}>{c}</option>)}
          </select>
        </div>
        <div className="input-group">
          <label className="input-label">Frequency</label>
          <div className="segmented">
            <button className={`seg-item ${form.frequency === 'monthly' ? 'active' : ''}`} onClick={() => set('frequency', 'monthly')}>Monthly</button>
            <button className={`seg-item ${form.frequency === 'yearly' ? 'active' : ''}`} onClick={() => set('frequency', 'yearly')}>Yearly</button>
          </div>
        </div>
        <button
          className="btn-primary"
          disabled={!form.name || !form.amount}
          onClick={() => onAdd({ ...form, amount: parseFloat(form.amount), color: randomColor() })}
        >
          Add Cost
        </button>
      </div>
    </div>
  )
}

function AddPiggySheet({ onAdd, onClose }) {
  const [form, setForm] = useState({ name: '', targetAmount: '', emoji: '🐷', color: '#34D399' })
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }))

  return (
    <div className="sheet-overlay" onClick={onClose}>
      <div className="sheet" onClick={e => e.stopPropagation()}>
        <div className="sheet-handle" />
        <p className="sheet-title">New Piggy Bank</p>

        {/* Emoji picker */}
        <div className="input-group">
          <label className="input-label">Emoji</label>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
            {PIGGY_EMOJIS.map(em => (
              <button key={em}
                onClick={() => set('emoji', em)}
                style={{
                  width: 44, height: 44, borderRadius: 12, fontSize: 23,
                  background: form.emoji === em ? 'rgba(255,255,255,0.15)' : 'rgba(255,255,255,0.06)',
                  border: form.emoji === em ? '1px solid rgba(255,255,255,0.30)' : '1px solid rgba(255,255,255,0.08)',
                  cursor: 'pointer',
                }}
              >{em}</button>
            ))}
          </div>
        </div>

        {/* Color picker */}
        <div className="input-group">
          <label className="input-label">Color</label>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            {COLORS.map(c => (
              <button key={c} onClick={() => set('color', c)} style={{
                width: 32, height: 32, borderRadius: '50%', background: c, border: 'none', cursor: 'pointer',
                boxShadow: form.color === c ? `0 0 0 3px rgba(255,255,255,0.5), 0 0 0 1px ${c}` : 'none',
              }} />
            ))}
          </div>
        </div>

        <div className="input-group">
          <label className="input-label">Name</label>
          <input className="input-field" placeholder="e.g. Holiday Fund" value={form.name} onChange={e => set('name', e.target.value)} />
        </div>
        <div className="input-group">
          <label className="input-label">Target Amount (€)</label>
          <input className="input-field" type="number" placeholder="0.00" value={form.targetAmount} onChange={e => set('targetAmount', e.target.value)} />
        </div>
        <button
          className="btn-primary"
          disabled={!form.name || !form.targetAmount}
          onClick={() => onAdd({ ...form, targetAmount: parseFloat(form.targetAmount) })}
        >
          Create Jar
        </button>
      </div>
    </div>
  )
}

function DepositSheet({ piggy, onAction, onClose }) {
  const [amount, setAmount] = useState('')
  const isDeposit = piggy.mode === 'deposit'

  return (
    <div className="sheet-overlay" onClick={onClose}>
      <div className="sheet" onClick={e => e.stopPropagation()}>
        <div className="sheet-handle" />
        <p className="sheet-title">{isDeposit ? 'Deposit into' : 'Withdraw from'} {piggy.name}</p>
        <div className="input-group">
          <label className="input-label">Amount (€)</label>
          <input className="input-field" type="number" placeholder="0.00" value={amount} onChange={e => setAmount(e.target.value)} style={{ fontSize: 25, fontWeight: 700 }} />
        </div>
        <button
          className="btn-primary"
          disabled={!amount}
          style={{ background: isDeposit ? 'linear-gradient(135deg, #34D399, #2DD4BF)' : 'linear-gradient(135deg, #F87171, #FB923C)' }}
          onClick={() => onAction(piggy.id, isDeposit ? parseFloat(amount) : -parseFloat(amount))}
        >
          {isDeposit ? `+ Deposit ${amount ? `€${parseFloat(amount).toFixed(2)}` : ''}` : `− Withdraw ${amount ? `€${parseFloat(amount).toFixed(2)}` : ''}`}
        </button>
      </div>
    </div>
  )
}

function CanIBuyThisSheet({ savingsBalance, monthlyFixed, goals, onClose }) {
  const [price, setPrice] = useState('')
  const [verdict, setVerdict] = useState(null)

  const analyse = () => {
    const p = parseFloat(price)
    if (!p) return
    const totalGoalNeed = goals.reduce((s, g) => s + Math.max(0, (g.targetAmount || 0) - (g.currentAmount || 0)), 0)
    const availableSavings = Math.max(0, savingsBalance - monthlyFixed * 3 - totalGoalNeed)
    const canAfford = p <= availableSavings
    const strainGoals = p > 0 && totalGoalNeed > 0 && p > availableSavings * 0.2
    const impactMonths = monthlyFixed > 0 ? p / monthlyFixed : 0

    setVerdict({ canAfford, p, availableSavings, impactMonths, strainGoals })
  }

  return (
    <div className="sheet-overlay" onClick={onClose}>
      <div className="sheet" onClick={e => e.stopPropagation()}>
        <div className="sheet-handle" />
        <p className="sheet-title">💸 Can I Buy This?</p>

        <div className="input-group">
          <label className="input-label">Item Price (€)</label>
          <input
            className="input-field"
            type="number"
            placeholder="0.00"
            value={price}
            onChange={e => { setPrice(e.target.value); setVerdict(null) }}
            style={{ fontSize: 29, fontWeight: 700, textAlign: 'center' }}
          />
        </div>

        <button className="btn-primary" onClick={analyse} disabled={!price}>
          Analyse
        </button>

        {verdict && (
          <div style={{ marginTop: 20 }}>
            <div className="glass-sm" style={{
              padding: '20px',
              border: `1px solid ${verdict.canAfford ? 'rgba(52,211,153,0.3)' : 'rgba(248,113,113,0.3)'}`,
              textAlign: 'center',
            }}>
              <p style={{ fontSize: 42 }}>{verdict.canAfford ? '✅' : '⚠️'}</p>
              <p style={{ fontSize: 21, fontWeight: 700, marginTop: 8, color: verdict.canAfford ? 'var(--accent-green)' : 'var(--accent-red)' }}>
                {verdict.canAfford ? 'Yes, you can!' : 'Not right now'}
              </p>
            </div>

            <div className="glass-sm" style={{ padding: '16px', marginTop: 12 }}>
              <Row label="Item price" value={fmt(verdict.p)} />
              <div className="divider" />
              <Row label="Available savings" value={fmt(verdict.availableSavings)} color={verdict.availableSavings > 0 ? 'var(--accent-green)' : 'var(--accent-red)'} />
              <div className="divider" />
              <Row label="Months of fixed costs" value={`${verdict.impactMonths.toFixed(1)} mo`} />
              {verdict.strainGoals && (
                <>
                  <div className="divider" />
                  <p style={{ fontSize: 14, color: 'var(--accent-amber)', paddingTop: 8 }}>
                    ⚠️ This purchase may affect your active goals.
                  </p>
                </>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

function Row({ label, value, color }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0' }}>
      <p style={{ fontSize: 15, color: 'var(--text-secondary)' }}>{label}</p>
      <p style={{ fontSize: 15, fontWeight: 700, color: color || 'var(--text-primary)' }}>{value}</p>
    </div>
  )
}

function CalcIcon() {
  return (
    <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
      <rect x="4" y="2" width="16" height="20" rx="2" />
      <path d="M8 6h8M8 10h2m4 0h2M8 14h2m4 0h2M8 18h2m4 0h2" strokeLinecap="round"/>
    </svg>
  )
}

function TrashIcon({ size = 16 }) {
  return (
    <svg width={size} height={size} fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
      <path strokeLinecap="round" d="M3 6h18M8 6V4h8v2M19 6l-1 14H6L5 6"/>
    </svg>
  )
}
