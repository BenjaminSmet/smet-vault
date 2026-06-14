import { useState } from 'react'
import { useFinance } from '../contexts/FinanceContext'
import { useAuth } from '../contexts/AuthContext'
import { fmt, fmtCompact, fmtDate } from '../utils/finance'

export default function Home() {
  const { user } = useAuth()
  const {
    totalBalance, privateBalance, houseBalance,
    monthlyFixed, runway, freedomScore,
    allTransactions, goals, piggyBanks
  } = useFinance()

  const firstName = user?.displayName?.split(' ')[0] || 'Hey'
  const hour = new Date().getHours()
  const greeting = hour < 12 ? 'Good morning' : hour < 18 ? 'Good afternoon' : 'Good evening'

  return (
    <div className="page-scroll fade-in">
      {/* Greeting */}
      <div style={{ marginBottom: 24 }}>
        <p style={{ fontSize: 16, color: 'var(--text-secondary)', fontWeight: 500 }}>
          {greeting},
        </p>
        <h1 style={{ fontSize: 31, fontWeight: 700, letterSpacing: -0.5 }}>{firstName} 👋</h1>
      </div>

      {/* Net worth hero card */}
      <div className="glass" style={{ padding: '24px 20px', marginBottom: 12, position: 'relative', overflow: 'hidden' }}>
        <div style={{
          position: 'absolute', top: -20, right: -20,
          width: 120, height: 120, borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(94,155,255,0.15) 0%, transparent 70%)',
          pointerEvents: 'none',
        }} />
        <p style={{ fontSize: 14, fontWeight: 600, letterSpacing: 0.08, textTransform: 'uppercase', color: 'var(--text-tertiary)', marginBottom: 8 }}>
          Total Net Worth
        </p>
        <div className={`big-number ${totalBalance >= 0 ? 'positive' : 'negative'}`}>
          {fmt(totalBalance)}
        </div>

        <div style={{ display: 'flex', gap: 16, marginTop: 16 }}>
          <div style={{ flex: 1 }}>
            <p style={{ fontSize: 13, color: 'var(--text-tertiary)', fontWeight: 600, letterSpacing: 0.05, textTransform: 'uppercase', marginBottom: 2 }}>Private</p>
            <p style={{ fontSize: 17, fontWeight: 700, color: 'var(--text-primary)' }}>{fmtCompact(privateBalance)}</p>
          </div>
          <div style={{ width: 1, background: 'rgba(255,255,255,0.08)' }} />
          <div style={{ flex: 1 }}>
            <p style={{ fontSize: 13, color: 'var(--text-tertiary)', fontWeight: 600, letterSpacing: 0.05, textTransform: 'uppercase', marginBottom: 2 }}>🏠 House</p>
            <p style={{ fontSize: 17, fontWeight: 700, color: 'var(--text-primary)' }}>{fmtCompact(houseBalance)}</p>
          </div>
        </div>
      </div>

      {/* Score + Runway row */}
      <div style={{ display: 'flex', gap: 12, marginBottom: 12 }}>
        {/* Freedom Score */}
        <div className="glass" style={{ flex: 1, padding: '20px 16px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8 }}>
          <FreedomScoreRing score={freedomScore} />
          <div style={{ textAlign: 'center' }}>
            <p style={{ fontSize: 13, fontWeight: 600, letterSpacing: 0.06, textTransform: 'uppercase', color: 'var(--text-tertiary)' }}>Freedom</p>
            <p style={{ fontSize: 13, color: scoreColor(freedomScore), fontWeight: 700, marginTop: 2 }}>{scoreLabel(freedomScore)}</p>
          </div>
        </div>

        {/* Runway */}
        <div className="glass" style={{ flex: 1.4, padding: '20px 16px' }}>
          <p style={{ fontSize: 13, fontWeight: 600, letterSpacing: 0.06, textTransform: 'uppercase', color: 'var(--text-tertiary)', marginBottom: 6 }}>Financial Runway</p>
          {runway !== null ? (
            <>
              <p style={{ fontSize: 29, fontWeight: 700, letterSpacing: -1, color: runwayColor(runway) }}>
                {runway.toFixed(1)}
                <span style={{ fontSize: 15, fontWeight: 600, marginLeft: 4, color: 'var(--text-secondary)' }}>mo</span>
              </p>
              <div style={{ marginTop: 10 }}>
                <div className="progress-track">
                  <div className="progress-fill" style={{
                    width: `${Math.min(100, (runway / 12) * 100)}%`,
                    background: runwayColor(runway),
                  }} />
                </div>
                <p style={{ fontSize: 13, color: 'var(--text-tertiary)', marginTop: 4 }}>
                  {fmt(monthlyFixed)}/mo fixed costs
                </p>
              </div>
            </>
          ) : (
            <p style={{ fontSize: 15, color: 'var(--text-tertiary)', marginTop: 4 }}>
              Add savings & fixed costs to calculate
            </p>
          )}
        </div>
      </div>

      {/* Active goals snapshot */}
      {goals.length > 0 && (
        <>
          <p className="section-label" style={{ marginTop: 20 }}>Active Goals</p>
          <div className="card-stack">
            {goals.slice(0, 2).map(g => {
              const progress = g.targetAmount > 0 ? Math.min(100, ((g.currentAmount || 0) / g.targetAmount) * 100) : 0
              return (
                <div key={g.id} className="glass-sm" style={{ padding: '14px 16px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                    <p style={{ fontWeight: 600, fontSize: 16 }}>{g.name}</p>
                    <p style={{ fontSize: 15, fontWeight: 700, color: g.color || 'var(--accent-blue)' }}>
                      {Math.round(progress)}%
                    </p>
                  </div>
                  <div className="progress-track">
                    <div className="progress-fill" style={{ width: `${progress}%`, background: g.color || 'var(--accent-blue)' }} />
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 6 }}>
                    <p style={{ fontSize: 14, color: 'var(--text-secondary)' }}>{fmt(g.currentAmount || 0)}</p>
                    <p style={{ fontSize: 14, color: 'var(--text-tertiary)' }}>{fmt(g.targetAmount)}</p>
                  </div>
                </div>
              )
            })}
          </div>
        </>
      )}

      {/* Piggy banks snapshot */}
      {piggyBanks.length > 0 && (
        <>
          <p className="section-label" style={{ marginTop: 20 }}>Piggy Banks</p>
          <div style={{ display: 'flex', gap: 10, overflowX: 'auto', paddingBottom: 4 }}>
            {piggyBanks.map(p => {
              const pct = p.targetAmount > 0 ? Math.min(100, ((p.currentAmount || 0) / p.targetAmount) * 100) : 0
              return (
                <div key={p.id} className="glass-sm" style={{ padding: '14px', minWidth: 130, flex: '0 0 auto' }}>
                  <div style={{ fontSize: 25, marginBottom: 6 }}>{p.emoji || '🐷'}</div>
                  <p style={{ fontWeight: 600, fontSize: 15, marginBottom: 4 }}>{p.name}</p>
                  <p style={{ fontSize: 16, fontWeight: 700, color: p.color || 'var(--accent-green)' }}>
                    {fmtCompact(p.currentAmount || 0)}
                  </p>
                  <div className="progress-track" style={{ marginTop: 8 }}>
                    <div className="progress-fill" style={{ width: `${pct}%`, background: p.color || 'var(--accent-green)' }} />
                  </div>
                  <p style={{ fontSize: 12, color: 'var(--text-tertiary)', marginTop: 4 }}>{Math.round(pct)}% of {fmtCompact(p.targetAmount)}</p>
                </div>
              )
            })}
          </div>
        </>
      )}

      {/* Recent transactions */}
      <p className="section-label" style={{ marginTop: 20 }}>Recent Activity</p>
      <div className="glass" style={{ overflow: 'hidden' }}>
        {allTransactions.length === 0 ? (
          <div className="empty-state" style={{ padding: '30px 20px' }}>
            <EmptyIcon />
            <p>No transactions yet</p>
          </div>
        ) : (
          allTransactions.slice(0, 8).map((tx, i) => (
            <div key={tx.id}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 16px' }}>
                <div style={{
                  width: 38, height: 38, borderRadius: 12,
                  background: tx.type === 'income' ? 'rgba(52,211,153,0.15)' : 'rgba(248,113,113,0.12)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 17, flexShrink: 0,
                }}>
                  {tx.type === 'income' ? '↓' : '↑'}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p style={{ fontSize: 15, fontWeight: 600, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {tx.description || tx.category}
                    {tx.isShared && <span className="badge" style={{ marginLeft: 6, fontSize: 12 }}>🏠</span>}
                  </p>
                  <p style={{ fontSize: 14, color: 'var(--text-tertiary)', marginTop: 1 }}>
                    {fmtDate(tx.date)} · {tx.category}
                  </p>
                </div>
                <p style={{ fontSize: 16, fontWeight: 700, flexShrink: 0, color: tx.type === 'income' ? 'var(--accent-green)' : 'var(--accent-red)' }}>
                  {tx.type === 'income' ? '+' : '-'}{fmt(Math.abs(tx.amount || 0))}
                </p>
              </div>
              {i < Math.min(allTransactions.length - 1, 7) && <div className="divider" style={{ margin: '0 16px' }} />}
            </div>
          ))
        )}
      </div>
    </div>
  )
}

// Freedom score ring
function FreedomScoreRing({ score }) {
  const r = 28, cx = 36, cy = 36
  const circ = 2 * Math.PI * r
  const dash = (score / 100) * circ

  return (
    <svg width="72" height="72" viewBox="0 0 72 72">
      <circle cx={cx} cy={cy} r={r} fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="5" />
      <circle
        cx={cx} cy={cy} r={r} fill="none"
        stroke={scoreColor(score)} strokeWidth="5"
        strokeDasharray={`${dash} ${circ}`}
        strokeLinecap="round"
        transform="rotate(-90 36 36)"
        style={{ transition: 'stroke-dasharray 1s cubic-bezier(0.34,1.56,0.64,1)' }}
      />
      <text x="50%" y="50%" textAnchor="middle" dominantBaseline="central"
        fill={scoreColor(score)} fontSize="14" fontWeight="700" fontFamily="-apple-system, sans-serif">
        {score}
      </text>
    </svg>
  )
}

function scoreColor(s) {
  if (s >= 75) return '#34D399'
  if (s >= 50) return '#FBBF24'
  if (s >= 25) return '#FB923C'
  return '#F87171'
}
function scoreLabel(s) {
  if (s >= 80) return 'Excellent'
  if (s >= 60) return 'Good'
  if (s >= 40) return 'Building'
  if (s >= 20) return 'Starting'
  return 'Getting there'
}
function runwayColor(m) {
  if (m >= 6) return '#34D399'
  if (m >= 3) return '#FBBF24'
  return '#F87171'
}

function EmptyIcon() {
  return (
    <svg width="40" height="40" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
      <path strokeLinecap="round" d="M12 6v6m0 0v6m0-6h6m-6 0H6" opacity=".4"/>
    </svg>
  )
}
