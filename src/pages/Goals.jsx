import { useState } from 'react'
import { useFinance } from '../contexts/FinanceContext'
import { fmt, fmtCompact, daysUntil, monthlyNeeded, pct, randomColor } from '../utils/finance'

const GOAL_EMOJIS = ['🎯','✈️','🏠','🚗','💍','🎓','💻','📷','🏝️','🎸','👶','🛋️']
const COLORS = ['#5E9BFF','#A78BFA','#34D399','#FBBF24','#F87171','#2DD4BF','#FB923C','#EC4899']
const RENO_CATEGORIES = ['kitchen','bathroom','living room','bedroom','exterior','flooring','electrical','plumbing','furniture','other']
const RENO_EMOJI = { kitchen:'🍳', bathroom:'🚿', 'living room':'🛋️', bedroom:'🛏️', exterior:'🏡', flooring:'🪵', electrical:'💡', plumbing:'🔧', furniture:'🪑', other:'📦' }

export default function Goals() {
  const {
    goals, addGoal, updateGoal, deleteGoal,
    renovations, addRenovation, updateRenovation, deleteRenovation,
    houseId
  } = useFinance()

  const [section, setSection] = useState('goals')
  const [showAddGoal, setShowAddGoal]   = useState(false)
  const [showDeposit, setShowDeposit]   = useState(null)
  const [showAddReno, setShowAddReno]   = useState(false)
  const [showRenoUpdate, setShowRenoUpdate] = useState(null)

  const totalRenoBudget = renovations.reduce((s, r) => s + (r.budget || 0), 0)
  const totalRenoSpent  = renovations.reduce((s, r) => s + (r.spent || 0), 0)

  return (
    <div className="page-scroll fade-in">
      <div className="page-header">
        <h1 className="page-title">Goals</h1>
        <button className="header-action" onClick={() => section === 'goals' ? setShowAddGoal(true) : setShowAddReno(true)}>
          <PlusIcon />
        </button>
      </div>

      <div className="segmented" style={{ marginBottom: 20 }}>
        <button className={`seg-item ${section === 'goals' ? 'active' : ''}`} onClick={() => setSection('goals')}>🎯 Savings Goals</button>
        <button className={`seg-item ${section === 'reno' ? 'active' : ''}`} onClick={() => setSection('reno')}>🏡 Renovation</button>
      </div>

      {/* ── Savings Goals ── */}
      {section === 'goals' && (
        goals.length === 0 ? (
          <div className="empty-state">
            <p style={{ fontSize: 40 }}>🎯</p>
            <p>No goals yet</p>
            <p style={{ fontSize: 12 }}>Set a target and deadline to start saving</p>
          </div>
        ) : (
          <div className="card-stack">
            {goals.map(g => {
              const progress = pct(g.currentAmount || 0, g.targetAmount)
              const days = daysUntil(g.deadline)
              const monthly = monthlyNeeded(g.targetAmount, g.currentAmount || 0, g.deadline)
              const remaining = Math.max(0, (g.targetAmount || 0) - (g.currentAmount || 0))
              const isComplete = progress >= 100

              return (
                <div key={g.id} className="glass" style={{ padding: '20px', position: 'relative', overflow: 'hidden' }}>
                  {isComplete && (
                    <div style={{ position: 'absolute', top: 12, right: 12, fontSize: 22 }}>🎉</div>
                  )}
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 14 }}>
                    <div style={{
                      width: 46, height: 46, borderRadius: 14,
                      background: `${g.color || '#5E9BFF'}18`,
                      display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22,
                    }}>
                      {g.emoji || '🎯'}
                    </div>
                    <div style={{ flex: 1 }}>
                      <p style={{ fontWeight: 700, fontSize: 17 }}>{g.name}</p>
                      {days !== null && (
                        <p style={{ fontSize: 12, color: days > 0 ? 'var(--text-tertiary)' : 'var(--accent-red)', marginTop: 1 }}>
                          {days > 0 ? `${days} days left` : days === 0 ? 'Due today' : `${Math.abs(days)} days overdue`}
                        </p>
                      )}
                    </div>
                    <button
                      style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-tertiary)', padding: 4 }}
                      onClick={() => { if (confirm(`Delete ${g.name}?`)) deleteGoal(g.id) }}
                    >
                      <TrashIcon />
                    </button>
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 8 }}>
                    <p style={{ fontSize: 24, fontWeight: 700, color: g.color || 'var(--accent-blue)' }}>{fmt(g.currentAmount || 0)}</p>
                    <p style={{ fontSize: 14, color: 'var(--text-tertiary)' }}>of {fmt(g.targetAmount)}</p>
                  </div>

                  <div className="progress-track" style={{ marginBottom: 12 }}>
                    <div className="progress-fill" style={{ width: `${progress}%`, background: `linear-gradient(90deg, ${g.color || '#5E9BFF'}aa, ${g.color || '#5E9BFF'})` }} />
                  </div>

                  {!isComplete && monthly > 0 && (
                    <div style={{
                      display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                      padding: '10px 12px', borderRadius: 12,
                      background: 'rgba(255,255,255,0.04)', marginBottom: 12,
                    }}>
                      <p style={{ fontSize: 12, color: 'var(--text-secondary)' }}>Save monthly to hit deadline</p>
                      <p style={{ fontSize: 15, fontWeight: 700, color: g.color || 'var(--accent-blue)' }}>{fmt(monthly)}/mo</p>
                    </div>
                  )}

                  {!isComplete && (
                    <button className="btn-glass" style={{ width: '100%' }} onClick={() => setShowDeposit({ id: g.id, name: g.name, color: g.color })}>
                      + Add Contribution
                    </button>
                  )}
                </div>
              )
            })}
          </div>
        )
      )}

      {/* ── Renovation Tracker ── */}
      {section === 'reno' && (
        !houseId ? (
          <div className="empty-state">
            <p style={{ fontSize: 40 }}>🏡</p>
            <p>Connect your house first</p>
            <p style={{ fontSize: 12 }}>Set up a shared house in the Accounts tab to track renovation projects together</p>
          </div>
        ) : (
          <>
            {/* Summary */}
            <div className="glass" style={{ padding: '20px', marginBottom: 16, position: 'relative', overflow: 'hidden' }}>
              <div style={{ position: 'absolute', inset: 0, background: 'radial-gradient(ellipse at 90% 10%, rgba(167,139,250,0.14) 0%, transparent 60%)', pointerEvents: 'none' }} />
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: 12 }}>
                <div>
                  <p style={{ fontSize: 12, fontWeight: 600, letterSpacing: 0.08, textTransform: 'uppercase', color: 'var(--text-tertiary)', marginBottom: 4 }}>Total Spent</p>
                  <p style={{ fontSize: 32, fontWeight: 700, letterSpacing: -1, color: 'var(--accent-violet)' }}>{fmt(totalRenoSpent)}</p>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <p style={{ fontSize: 12, color: 'var(--text-tertiary)', marginBottom: 2 }}>Budget</p>
                  <p style={{ fontSize: 18, fontWeight: 700 }}>{fmtCompact(totalRenoBudget)}</p>
                </div>
              </div>
              <div className="progress-track">
                <div className="progress-fill" style={{
                  width: `${totalRenoBudget > 0 ? Math.min(100, (totalRenoSpent / totalRenoBudget) * 100) : 0}%`,
                  background: totalRenoSpent > totalRenoBudget ? 'var(--accent-red)' : 'linear-gradient(90deg, #A78BFAaa, #A78BFA)',
                }} />
              </div>
            </div>

            {renovations.length === 0 ? (
              <div className="empty-state">
                <p style={{ fontSize: 40 }}>🔨</p>
                <p>No renovation projects yet</p>
                <p style={{ fontSize: 12 }}>Add rooms or projects to track shared spending</p>
              </div>
            ) : (
              <div className="card-stack">
                {renovations.map(r => {
                  const progress = pct(r.spent || 0, r.budget)
                  const over = (r.spent || 0) > (r.budget || 0)
                  return (
                    <div key={r.id} className="glass" style={{ padding: '18px 20px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 }}>
                        <div style={{
                          width: 44, height: 44, borderRadius: 14,
                          background: 'rgba(167,139,250,0.15)',
                          display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20,
                        }}>
                          {RENO_EMOJI[r.category] || '📦'}
                        </div>
                        <div style={{ flex: 1 }}>
                          <p style={{ fontWeight: 700, fontSize: 16 }}>{r.name}</p>
                          <div style={{ display: 'flex', gap: 6, marginTop: 3 }}>
                            <span className="chip chip-violet" style={{ textTransform: 'capitalize', fontSize: 11 }}>{r.category}</span>
                            <StatusChip status={r.status} />
                          </div>
                        </div>
                        <button
                          style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-tertiary)', padding: 4 }}
                          onClick={() => { if (confirm(`Delete ${r.name}?`)) deleteRenovation(r.id) }}
                        >
                          <TrashIcon />
                        </button>
                      </div>

                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 8 }}>
                        <p style={{ fontSize: 20, fontWeight: 700, color: over ? 'var(--accent-red)' : 'var(--accent-violet)' }}>{fmt(r.spent || 0)}</p>
                        <p style={{ fontSize: 13, color: 'var(--text-tertiary)' }}>budget {fmt(r.budget)}</p>
                      </div>

                      <div className="progress-track" style={{ marginBottom: 12 }}>
                        <div className="progress-fill" style={{
                          width: `${progress}%`,
                          background: over ? 'var(--accent-red)' : 'linear-gradient(90deg, #A78BFAaa, #A78BFA)',
                        }} />
                      </div>

                      <div style={{ display: 'flex', gap: 8 }}>
                        <button className="btn-glass" style={{ flex: 1, fontSize: 13, padding: '9px' }} onClick={() => setShowRenoUpdate({ ...r, field: 'spent' })}>
                          + Log Spending
                        </button>
                        <select
                          className="input-field"
                          style={{ width: 'auto', padding: '9px 10px', fontSize: 12 }}
                          value={r.status}
                          onChange={e => updateRenovation(r.id, { status: e.target.value })}
                        >
                          <option value="planned">Planned</option>
                          <option value="in_progress">In Progress</option>
                          <option value="done">Done</option>
                        </select>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </>
        )
      )}

      {/* ── Add Goal Sheet ── */}
      {showAddGoal && (
        <AddGoalSheet
          onAdd={async (d) => { await addGoal(d); setShowAddGoal(false) }}
          onClose={() => setShowAddGoal(false)}
        />
      )}

      {/* ── Deposit to Goal Sheet ── */}
      {showDeposit && (
        <ContributeSheet
          goal={showDeposit}
          onAction={async (id, amount) => { await updateGoal(id, amount); setShowDeposit(null) }}
          onClose={() => setShowDeposit(null)}
        />
      )}

      {/* ── Add Renovation Sheet ── */}
      {showAddReno && (
        <AddRenoSheet
          onAdd={async (d) => { await addRenovation(d); setShowAddReno(false) }}
          onClose={() => setShowAddReno(false)}
        />
      )}

      {/* ── Log Spending Sheet ── */}
      {showRenoUpdate && (
        <LogSpendingSheet
          reno={showRenoUpdate}
          onAdd={async (amount) => {
            await updateRenovation(showRenoUpdate.id, { spent: (showRenoUpdate.spent || 0) + amount })
            setShowRenoUpdate(null)
          }}
          onClose={() => setShowRenoUpdate(null)}
        />
      )}
    </div>
  )
}

// ── Sub-components ────────────────────────────────────────────

function StatusChip({ status }) {
  const map = {
    planned: { label: 'Planned', cls: 'chip-blue' },
    in_progress: { label: 'In Progress', cls: 'chip-amber' },
    done: { label: 'Done', cls: 'chip-green' },
  }
  const s = map[status] || map.planned
  return <span className={`chip ${s.cls}`} style={{ fontSize: 11 }}>{s.label}</span>
}

function AddGoalSheet({ onAdd, onClose }) {
  const [form, setForm] = useState({ name: '', targetAmount: '', deadline: '', emoji: '🎯', color: randomColor() })
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }))

  return (
    <div className="sheet-overlay" onClick={onClose}>
      <div className="sheet" onClick={e => e.stopPropagation()}>
        <div className="sheet-handle" />
        <p className="sheet-title">New Goal</p>

        <div className="input-group">
          <label className="input-label">Icon</label>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
            {GOAL_EMOJIS.map(em => (
              <button key={em} onClick={() => set('emoji', em)} style={{
                width: 44, height: 44, borderRadius: 12, fontSize: 22,
                background: form.emoji === em ? 'rgba(255,255,255,0.15)' : 'rgba(255,255,255,0.06)',
                border: form.emoji === em ? '1px solid rgba(255,255,255,0.30)' : '1px solid rgba(255,255,255,0.08)',
                cursor: 'pointer',
              }}>{em}</button>
            ))}
          </div>
        </div>

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
          <label className="input-label">Goal Name</label>
          <input className="input-field" placeholder="e.g. New Couch, Japan Trip" value={form.name} onChange={e => set('name', e.target.value)} />
        </div>
        <div className="input-group">
          <label className="input-label">Target Amount (€)</label>
          <input className="input-field" type="number" placeholder="0.00" value={form.targetAmount} onChange={e => set('targetAmount', e.target.value)} />
        </div>
        <div className="input-group">
          <label className="input-label">Deadline</label>
          <input className="input-field" type="date" value={form.deadline} onChange={e => set('deadline', e.target.value)} />
        </div>
        <button
          className="btn-primary"
          disabled={!form.name || !form.targetAmount}
          onClick={() => onAdd({
            ...form,
            targetAmount: parseFloat(form.targetAmount),
            deadline: form.deadline ? new Date(form.deadline) : null,
          })}
        >
          Create Goal
        </button>
      </div>
    </div>
  )
}

function ContributeSheet({ goal, onAction, onClose }) {
  const [amount, setAmount] = useState('')
  return (
    <div className="sheet-overlay" onClick={onClose}>
      <div className="sheet" onClick={e => e.stopPropagation()}>
        <div className="sheet-handle" />
        <p className="sheet-title">Contribute to {goal.name}</p>
        <div className="input-group">
          <label className="input-label">Amount (€)</label>
          <input className="input-field" type="number" placeholder="0.00" value={amount} onChange={e => setAmount(e.target.value)} style={{ fontSize: 24, fontWeight: 700 }} />
        </div>
        <button
          className="btn-primary"
          disabled={!amount}
          style={{ background: `linear-gradient(135deg, ${goal.color || '#5E9BFF'}aa, ${goal.color || '#5E9BFF'})` }}
          onClick={() => onAction(goal.id, parseFloat(amount))}
        >
          + Add {amount ? `€${parseFloat(amount).toFixed(2)}` : ''}
        </button>
      </div>
    </div>
  )
}

function AddRenoSheet({ onAdd, onClose }) {
  const [form, setForm] = useState({ name: '', category: 'living room', budget: '' })
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }))

  return (
    <div className="sheet-overlay" onClick={onClose}>
      <div className="sheet" onClick={e => e.stopPropagation()}>
        <div className="sheet-handle" />
        <p className="sheet-title">New Renovation Project</p>
        <div className="input-group">
          <label className="input-label">Project Name</label>
          <input className="input-field" placeholder="e.g. Kitchen Cabinets" value={form.name} onChange={e => set('name', e.target.value)} />
        </div>
        <div className="input-group">
          <label className="input-label">Room / Category</label>
          <select className="input-field" value={form.category} onChange={e => set('category', e.target.value)}>
            {RENO_CATEGORIES.map(c => <option key={c} value={c} style={{ textTransform: 'capitalize' }}>{c}</option>)}
          </select>
        </div>
        <div className="input-group">
          <label className="input-label">Budget (€)</label>
          <input className="input-field" type="number" placeholder="0.00" value={form.budget} onChange={e => set('budget', e.target.value)} />
        </div>
        <button
          className="btn-primary"
          disabled={!form.name || !form.budget}
          onClick={() => onAdd({ ...form, budget: parseFloat(form.budget) })}
        >
          Add Project
        </button>
      </div>
    </div>
  )
}

function LogSpendingSheet({ reno, onAdd, onClose }) {
  const [amount, setAmount] = useState('')
  return (
    <div className="sheet-overlay" onClick={onClose}>
      <div className="sheet" onClick={e => e.stopPropagation()}>
        <div className="sheet-handle" />
        <p className="sheet-title">Log Spending — {reno.name}</p>
        <div className="input-group">
          <label className="input-label">Amount (€)</label>
          <input className="input-field" type="number" placeholder="0.00" value={amount} onChange={e => setAmount(e.target.value)} style={{ fontSize: 24, fontWeight: 700 }} />
        </div>
        <button className="btn-primary" disabled={!amount} onClick={() => onAdd(parseFloat(amount))}>
          + Add to Spent
        </button>
      </div>
    </div>
  )
}

function PlusIcon() {
  return (
    <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
      <path strokeLinecap="round" d="M12 5v14M5 12h14" />
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
