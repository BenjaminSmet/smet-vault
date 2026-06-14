import { useState } from 'react'
import { useAuth } from './contexts/AuthContext'
import { FinanceProvider } from './contexts/FinanceContext'
import Login from './pages/Login'
import Home from './pages/Home'
import Accounts from './pages/Accounts'
import Budget from './pages/Budget'
import Goals from './pages/Goals'

const TABS = [
  { id: 'home',     label: 'Home',     icon: HomeIcon },
  { id: 'accounts', label: 'Accounts', icon: WalletIcon },
  { id: 'budget',   label: 'Budget',   icon: PieIcon },
  { id: 'goals',    label: 'Goals',    icon: TargetIcon },
]

export default function App() {
  const { user, loading } = useAuth()
  const [activeTab, setActiveTab] = useState('home')

  if (loading) {
    return (
      <div className="loading-screen">
        <div className="loading-logo">Smet Vault</div>
        <div className="loading-dot" />
      </div>
    )
  }

  if (!user) {
    return <Login />
  }

  return (
    <FinanceProvider>
      <div className="app-root">
        <div className="app-layout">
          {activeTab === 'home'     && <Home />}
          {activeTab === 'accounts' && <Accounts />}
          {activeTab === 'budget'   && <Budget />}
          {activeTab === 'goals'    && <Goals />}

          <nav className="tab-bar">
            {TABS.map(tab => {
              const Icon = tab.icon
              const active = activeTab === tab.id
              return (
                <button
                  key={tab.id}
                  className={`tab-item ${active ? 'active' : ''}`}
                  onClick={() => setActiveTab(tab.id)}
                >
                  <Icon filled={active} />
                  <span className="tab-label">{tab.label}</span>
                </button>
              )
            })}
          </nav>
        </div>
      </div>
    </FinanceProvider>
  )
}

// ── Icons (SF Symbols-inspired) ─────────────────────────────────

function HomeIcon({ filled }) {
  return (
    <svg viewBox="0 0 24 24" fill={filled ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth={filled ? '0' : '1.8'}>
      <path d="M3 11.5L12 4l9 7.5V20a1 1 0 01-1 1h-5v-6h-6v6H4a1 1 0 01-1-1v-8.5z" strokeLinejoin="round" strokeLinecap="round"/>
    </svg>
  )
}

function WalletIcon({ filled }) {
  return (
    <svg viewBox="0 0 24 24" fill={filled ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth={filled ? '0' : '1.8'}>
      <rect x="3" y="6" width="18" height="13" rx="2.5" strokeLinejoin="round"/>
      <path d="M3 10h18" strokeLinecap="round"/>
      <circle cx="16.5" cy="14.5" r="1.2" fill="currentColor" stroke="none"/>
    </svg>
  )
}

function PieIcon({ filled }) {
  return (
    <svg viewBox="0 0 24 24" fill={filled ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth={filled ? '0' : '1.8'}>
      <path d="M12 3a9 9 0 109 9h-9V3z" strokeLinejoin="round" strokeLinecap="round"/>
      <path d="M14 2.5A9 9 0 0121.5 10H14V2.5z" strokeLinejoin="round" strokeLinecap="round" opacity={filled ? '0.5' : '1'}/>
    </svg>
  )
}

function TargetIcon({ filled }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={filled ? '0' : '1.8'}>
      <circle cx="12" cy="12" r="9" fill={filled ? 'currentColor' : 'none'} opacity={filled ? '0.18' : '1'}/>
      <circle cx="12" cy="12" r="9"/>
      <circle cx="12" cy="12" r="5" fill={filled ? 'currentColor' : 'none'} opacity={filled ? '0.35' : '1'}/>
      <circle cx="12" cy="12" r="5"/>
      <circle cx="12" cy="12" r="1.5" fill="currentColor" stroke="none"/>
    </svg>
  )
}
