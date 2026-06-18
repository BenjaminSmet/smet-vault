/** Format a number as EUR */
export const fmt = (n = 0) =>
  new Intl.NumberFormat('nl-BE', { style: 'currency', currency: 'EUR' }).format(n)

/** Format a number as compact EUR (€1.2K) */
export const fmtCompact = (n = 0) => {
  if (Math.abs(n) >= 1000) {
    return '€' + (n / 1000).toFixed(1) + 'K'
  }
  return fmt(n)
}

/** Format a date from Firestore timestamp */
export const fmtDate = (timestamp) => {
  if (!timestamp) return '—'
  const d = timestamp.toDate ? timestamp.toDate() : new Date(timestamp)
  return d.toLocaleDateString('nl-BE', { day: '2-digit', month: 'short' })
}

/** Format a full date (for calendar / due dates) */
export const fmtDateFull = (timestamp) => {
  if (!timestamp) return '—'
  const d = timestamp.toDate ? timestamp.toDate() : new Date(timestamp)
  return d.toLocaleDateString('nl-BE', { day: '2-digit', month: 'short', year: 'numeric' })
}

/** Days until a deadline */
export const daysUntil = (deadline) => {
  if (!deadline) return null
  const d = deadline.toDate ? deadline.toDate() : new Date(deadline)
  const now = new Date()
  return Math.ceil((d - now) / (1000 * 60 * 60 * 24))
}

/** How much per month is needed to hit a goal */
export const monthlyNeeded = (target, current, deadline) => {
  const days = daysUntil(deadline)
  if (!days || days <= 0) return 0
  const months = days / 30
  return Math.max(0, (target - current) / months)
}

/** Percentage, clamped 0–100 */
export const pct = (current, target) =>
  target > 0 ? Math.min(100, Math.round((current / target) * 100)) : 0

/** Frequency quick-presets, in months. "custom" lets the user type any number. */
export const FREQUENCY_PRESETS = [
  { label: 'Monthly',   months: 1 },
  { label: 'Quarterly', months: 3 },
  { label: 'Biannual',  months: 6 },
  { label: 'Yearly',    months: 12 },
]

export const frequencyLabel = (months) => {
  const preset = FREQUENCY_PRESETS.find(f => f.months === months)
  if (preset) return preset.label
  return `Every ${months} mo`
}

/** Account type to label */
export const accountTypeLabel = {
  checking:   'Checking',
  savings:    'Savings',
  investment: 'Investment',
  cash:       'Cash',
  other:      'Other',
}

/** Account type to color */
export const accountTypeColor = {
  checking:   '#5E9BFF',
  savings:    '#34D399',
  investment: '#A78BFA',
  cash:       '#FBBF24',
  other:      '#94A3B8',
}

/** Random accent colors for new items */
const COLORS = ['#5E9BFF','#A78BFA','#34D399','#FBBF24','#F87171','#2DD4BF','#FB923C']
export const randomColor = () => COLORS[Math.floor(Math.random() * COLORS.length)]
