import { useState, useMemo } from 'react'
import Sheet from './Sheet'
import { useUI } from '../contexts/UIContext'
import { fmt, fmtCompact } from '../utils/finance'

const WEEKDAYS = ['Mo','Tu','We','Th','Fr','Sa','Su']

export default function SpendingCalendar({ transactions }) {
  const { setSheetOpen } = useUI()
  const [monthOffset, setMonthOffset] = useState(0)
  const [selectedDay, setSelectedDay] = useState(null)

  const viewDate = useMemo(() => {
    const d = new Date()
    d.setMonth(d.getMonth() + monthOffset)
    return d
  }, [monthOffset])

  const year = viewDate.getFullYear()
  const month = viewDate.getMonth()

  const dayTotals = useMemo(() => {
    const map = {}
    transactions.forEach(tx => {
      if (!tx.date?.toDate) return
      const d = tx.date.toDate()
      if (d.getFullYear() !== year || d.getMonth() !== month) return
      const key = d.getDate()
      if (!map[key]) map[key] = { income: 0, expense: 0, txs: [] }
      if (tx.type === 'income') map[key].income += tx.amount || 0
      else map[key].expense += tx.amount || 0
      map[key].txs.push(tx)
    })
    return map
  }, [transactions, year, month])

  const monthIncome = Object.values(dayTotals).reduce((s, d) => s + d.income, 0)
  const monthExpense = Object.values(dayTotals).reduce((s, d) => s + d.expense, 0)

  const firstOfMonth = new Date(year, month, 1)
  const startOffset = (firstOfMonth.getDay() + 6) % 7 // Monday = 0
  const totalDays = new Date(year, month + 1, 0).getDate()
  const todayKey = new Date()
  const isCurrentMonth = todayKey.getFullYear() === year && todayKey.getMonth() === month

  const cells = []
  for (let i = 0; i < startOffset; i++) cells.push(null)
  for (let d = 1; d <= totalDays; d++) cells.push(d)

  const openDay = (day) => {
    if (!dayTotals[day]) return
    setSelectedDay(day)
    setSheetOpen(true)
  }
  const closeDay = () => { setSelectedDay(null); setSheetOpen(false) }

  return (
    <div className="glass" style={{ padding: '18px 16px', marginBottom: 12 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
        <button className="btn-icon" style={{ width: 32, height: 32 }} onClick={() => setMonthOffset(o => o - 1)}>
          <ChevronIcon dir="left" />
        </button>
        <p style={{ fontWeight: 700, fontSize: 16 }}>
          {viewDate.toLocaleDateString('en-GB', { month: 'long', year: 'numeric' })}
        </p>
        <button className="btn-icon" style={{ width: 32, height: 32 }} onClick={() => setMonthOffset(o => o + 1)}>
          <ChevronIcon dir="right" />
        </button>
      </div>

      <div style={{ display: 'flex', justifyContent: 'space-around', marginBottom: 12 }}>
        <div style={{ textAlign: 'center' }}>
          <p style={{ fontSize: 11, color: 'var(--text-tertiary)', fontWeight: 600, textTransform: 'uppercase' }}>In</p>
          <p style={{ fontSize: 15, fontWeight: 700, color: 'var(--accent-green)' }}>{fmtCompact(monthIncome)}</p>
        </div>
        <div style={{ textAlign: 'center' }}>
          <p style={{ fontSize: 11, color: 'var(--text-tertiary)', fontWeight: 600, textTransform: 'uppercase' }}>Out</p>
          <p style={{ fontSize: 15, fontWeight: 700, color: 'var(--accent-red)' }}>{fmtCompact(monthExpense)}</p>
        </div>
        <div style={{ textAlign: 'center' }}>
          <p style={{ fontSize: 11, color: 'var(--text-tertiary)', fontWeight: 600, textTransform: 'uppercase' }}>Net</p>
          <p style={{ fontSize: 15, fontWeight: 700, color: monthIncome - monthExpense >= 0 ? 'var(--accent-green)' : 'var(--accent-red)' }}>
            {fmtCompact(monthIncome - monthExpense)}
          </p>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 4, marginBottom: 4 }}>
        {WEEKDAYS.map(w => (
          <p key={w} style={{ textAlign: 'center', fontSize: 11, color: 'var(--text-tertiary)', fontWeight: 600 }}>{w}</p>
        ))}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 4 }}>
        {cells.map((day, i) => {
          if (day === null) return <div key={i} />
          const data = dayTotals[day]
          const net = data ? data.income - data.expense : 0
          const isToday = isCurrentMonth && todayKey.getDate() === day
          return (
            <button
              key={i}
              onClick={() => openDay(day)}
              style={{
                aspectRatio: '1', borderRadius: 10, border: 'none', cursor: data ? 'pointer' : 'default',
                background: isToday ? 'rgba(94,155,255,0.18)' : data ? 'rgba(255,255,255,0.05)' : 'transparent',
                display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                padding: 2,
              }}
            >
              <span style={{ fontSize: 12, fontWeight: isToday ? 700 : 500, color: isToday ? 'var(--accent-blue)' : 'var(--text-primary)' }}>
                {day}
              </span>
              {data && (
                <span style={{
                  fontSize: 8, fontWeight: 700, marginTop: 1,
                  color: net >= 0 ? 'var(--accent-green)' : 'var(--accent-red)',
                }}>
                  {net >= 0 ? '+' : ''}{Math.abs(net) >= 1000 ? `${(net/1000).toFixed(1)}K` : Math.round(net)}
                </span>
              )}
            </button>
          )
        })}
      </div>

      {selectedDay && dayTotals[selectedDay] && (
        <Sheet
          title={new Date(year, month, selectedDay).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })}
          onClose={closeDay}
        >
          <div className="card-stack">
            {dayTotals[selectedDay].txs.map(tx => (
              <div key={tx.id} className="glass-sm" style={{ padding: '12px 16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <p style={{ fontSize: 14, fontWeight: 600 }}>{tx.description || tx.category}</p>
                  <p style={{ fontSize: 12, color: 'var(--text-tertiary)' }}>{tx.category}{tx.subcategory ? ` · ${tx.subcategory}` : ''}</p>
                </div>
                <p style={{ fontSize: 15, fontWeight: 700, color: tx.type === 'income' ? 'var(--accent-green)' : 'var(--accent-red)' }}>
                  {tx.type === 'income' ? '+' : '-'}{fmt(Math.abs(tx.amount || 0))}
                </p>
              </div>
            ))}
          </div>
        </Sheet>
      )}
    </div>
  )
}

function ChevronIcon({ dir }) {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
      <path strokeLinecap="round" strokeLinejoin="round" d={dir === 'left' ? 'M15 18l-6-6 6-6' : 'M9 18l6-6-6-6'} />
    </svg>
  )
}
