import { useState } from 'react'
import { useAuth } from '../contexts/AuthContext'

export default function Login() {
  const { loginWithGoogle } = useAuth()
  const [loading, setLoading] = useState(false)
  const [error, setError]     = useState('')

  const handleGoogle = async () => {
    setLoading(true)
    setError('')
    try {
      await loginWithGoogle()
    } catch (e) {
      setError('Sign-in failed. Try again.')
      setLoading(false)
    }
  }

  return (
    <div style={{
      position: 'fixed', inset: 0,
      display: 'flex', flexDirection: 'column',
      alignItems: 'center', justifyContent: 'center',
      background: 'var(--bg)',
      padding: '0 32px',
    }}>
      {/* Mesh background */}
      <div style={{
        position: 'absolute', inset: 0, pointerEvents: 'none',
        background: `
          radial-gradient(ellipse 70% 60% at 20% 10%, rgba(94,155,255,0.22) 0%, transparent 60%),
          radial-gradient(ellipse 60% 70% at 80% 90%, rgba(167,139,250,0.18) 0%, transparent 55%),
          radial-gradient(ellipse 45% 45% at 65% 20%, rgba(52,211,153,0.10) 0%, transparent 50%)
        `
      }} />

      {/* Logo */}
      <div style={{ position: 'relative', zIndex: 1, textAlign: 'center', marginBottom: 48 }}>
        <div style={{
          fontSize: 56, fontWeight: 800, letterSpacing: -2,
          background: 'linear-gradient(135deg, #5E9BFF, #A78BFA, #34D399)',
          WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
          backgroundClip: 'text', lineHeight: 1,
        }}>
          Smet Vault
        </div>
        <div style={{
          marginTop: 8, fontSize: 16, fontWeight: 500,
          color: 'var(--text-secondary)', letterSpacing: 0.2,
        }}>
          Your home finances, together.
        </div>
      </div>

      {/* Glass card */}
      <div className="glass" style={{
        position: 'relative', zIndex: 1,
        width: '100%', maxWidth: 360,
        padding: '32px 24px',
      }}>
        {/* Feature pills */}
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 28, justifyContent: 'center' }}>
          {['Net worth', 'Budgeting', 'Goals', 'Shared house'].map(f => (
            <span key={f} style={{
              padding: '4px 12px', borderRadius: 20,
              fontSize: 12, fontWeight: 600,
              background: 'rgba(255,255,255,0.07)',
              border: '1px solid rgba(255,255,255,0.10)',
              color: 'var(--text-secondary)',
            }}>{f}</span>
          ))}
        </div>

        <button
          className="btn-glass"
          onClick={handleGoogle}
          disabled={loading}
          style={{ width: '100%', justifyContent: 'center' }}
        >
          {loading ? (
            <div style={{ width: 18, height: 18, borderRadius: '50%', border: '2px solid rgba(255,255,255,0.3)', borderTopColor: '#fff', animation: 'spin 0.7s linear infinite' }} />
          ) : (
            <GoogleIcon />
          )}
          {loading ? 'Signing in…' : 'Continue with Google'}
        </button>

        {error && (
          <p style={{ marginTop: 12, textAlign: 'center', fontSize: 13, color: 'var(--accent-red)' }}>
            {error}
          </p>
        )}

        <p style={{ marginTop: 20, textAlign: 'center', fontSize: 11, color: 'var(--text-tertiary)', lineHeight: 1.5 }}>
          Your data is private by default. Share only what you choose.
        </p>
      </div>

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  )
}

function GoogleIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
      <path d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844c-.209 1.125-.843 2.078-1.796 2.717v2.258h2.908c1.702-1.567 2.684-3.875 2.684-6.615z" fill="#4285F4"/>
      <path d="M9 18c2.43 0 4.467-.806 5.956-2.18l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 009 18z" fill="#34A853"/>
      <path d="M3.964 10.71c-.18-.54-.282-1.117-.282-1.71s.102-1.17.282-1.71V4.958H.957A8.996 8.996 0 000 9c0 1.452.348 2.827.957 4.042l3.007-2.332z" fill="#FBBC05"/>
      <path d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 00.957 4.958L3.964 7.29C4.672 5.163 6.656 3.58 9 3.58z" fill="#EA4335"/>
    </svg>
  )
}
