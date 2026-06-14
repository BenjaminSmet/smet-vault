import { createContext, useContext, useEffect, useState } from 'react'
import { onAuthStateChanged, signInWithPopup, signOut } from 'firebase/auth'
import { doc, setDoc, getDoc, serverTimestamp } from 'firebase/firestore'
import { auth, db, googleProvider } from '../firebase'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        // Ensure user profile exists in Firestore.
        // Wrapped in try/catch so a permission or network error
        // never leaves the app stuck on the loading screen.
        try {
          const ref = doc(db, 'users', firebaseUser.uid, 'profile', 'info')
          const snap = await getDoc(ref)
          if (!snap.exists()) {
            await setDoc(ref, {
              displayName: firebaseUser.displayName,
              email: firebaseUser.email,
              photoURL: firebaseUser.photoURL,
              createdAt: serverTimestamp()
            })
          }
        } catch (err) {
          console.error('Failed to load/create user profile:', err)
        }
        setUser(firebaseUser)
      } else {
        setUser(null)
      }
      setLoading(false)
    })
    return unsub
  }, [])

  const loginWithGoogle = () => signInWithPopup(auth, googleProvider)
  const logout = () => signOut(auth)

  return (
    <AuthContext.Provider value={{ user, loading, loginWithGoogle, logout }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => useContext(AuthContext)
