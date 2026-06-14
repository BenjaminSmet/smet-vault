import { createContext, useContext, useEffect, useState, useCallback } from 'react'
import {
  collection, doc, addDoc, updateDoc, deleteDoc,
  onSnapshot, serverTimestamp, query, orderBy, setDoc, getDoc
} from 'firebase/firestore'
import { db } from '../firebase'
import { useAuth } from './AuthContext'

const FinanceContext = createContext(null)

export function FinanceProvider({ children }) {
  const { user } = useAuth()
  const uid = user?.uid

  const [accounts, setAccounts]         = useState([])
  const [transactions, setTransactions] = useState([])
  const [fixedCosts, setFixedCosts]     = useState([])
  const [piggyBanks, setPiggyBanks]     = useState([])
  const [goals, setGoals]               = useState([])
  const [renovations, setRenovations]   = useState([])
  const [houseId, setHouseId]           = useState(null)
  const [houseAccounts, setHouseAccounts]     = useState([])
  const [houseTransactions, setHouseTransactions] = useState([])

  // ── Private collections ────────────────────────────────────
  const col = (path) => collection(db, 'users', uid, path)
  const ref = (path, id) => doc(db, 'users', uid, path, id)

  useEffect(() => {
    if (!uid) return
    const unsubs = []

    unsubs.push(onSnapshot(query(col('accounts'), orderBy('createdAt', 'desc')), s =>
      setAccounts(s.docs.map(d => ({ id: d.id, ...d.data() })))))

    unsubs.push(onSnapshot(query(col('transactions'), orderBy('date', 'desc')), s =>
      setTransactions(s.docs.map(d => ({ id: d.id, ...d.data() })))))

    unsubs.push(onSnapshot(query(col('fixedCosts'), orderBy('createdAt', 'desc')), s =>
      setFixedCosts(s.docs.map(d => ({ id: d.id, ...d.data() })))))

    unsubs.push(onSnapshot(query(col('piggyBanks'), orderBy('createdAt', 'desc')), s =>
      setPiggyBanks(s.docs.map(d => ({ id: d.id, ...d.data() })))))

    unsubs.push(onSnapshot(query(col('goals'), orderBy('createdAt', 'desc')), s =>
      setGoals(s.docs.map(d => ({ id: d.id, ...d.data() })))))

    // House code check
    const profileRef = doc(db, 'users', uid, 'profile', 'info')
    unsubs.push(onSnapshot(profileRef, snap => {
      const data = snap.data()
      if (data?.houseId) setHouseId(data.houseId)
    }))

    return () => unsubs.forEach(u => u())
  }, [uid])

  // ── House shared data ──────────────────────────────────────
  useEffect(() => {
    if (!houseId) return
    const hCol = (path) => collection(db, 'houses', houseId, path)
    const unsubs = []

    unsubs.push(onSnapshot(query(hCol('accounts'), orderBy('createdAt', 'desc')), s =>
      setHouseAccounts(s.docs.map(d => ({ id: d.id, ...d.data(), isShared: true })))))

    unsubs.push(onSnapshot(query(hCol('transactions'), orderBy('date', 'desc')), s =>
      setHouseTransactions(s.docs.map(d => ({ id: d.id, ...d.data(), isShared: true })))))

    unsubs.push(onSnapshot(query(hCol('renovations'), orderBy('createdAt', 'desc')), s =>
      setRenovations(s.docs.map(d => ({ id: d.id, ...d.data() })))))

    return () => unsubs.forEach(u => u())
  }, [houseId])

  // ── House management ───────────────────────────────────────
  const createHouse = useCallback(async () => {
    const code = Math.random().toString(36).substring(2, 8).toUpperCase()
    await setDoc(doc(db, 'houses', code), {
      members: [uid],
      createdAt: serverTimestamp(),
      createdBy: uid
    })
    await updateDoc(doc(db, 'users', uid, 'profile', 'info'), { houseId: code })
    setHouseId(code)
    return code
  }, [uid])

  const joinHouse = useCallback(async (code) => {
    const houseRef = doc(db, 'houses', code)
    const snap = await getDoc(houseRef)
    if (!snap.exists()) throw new Error('House not found')
    const data = snap.data()
    if (!data.members.includes(uid)) {
      await updateDoc(houseRef, { members: [...data.members, uid] })
    }
    await updateDoc(doc(db, 'users', uid, 'profile', 'info'), { houseId: code })
    setHouseId(code)
  }, [uid])

  // ── Accounts ───────────────────────────────────────────────
  const addAccount = useCallback(async (data) => {
    await addDoc(col('accounts'), { ...data, createdAt: serverTimestamp() })
  }, [uid])

  const deleteAccount = useCallback(async (id) => {
    await deleteDoc(ref('accounts', id))
  }, [uid])

  const addHouseAccount = useCallback(async (data) => {
    if (!houseId) return
    await addDoc(collection(db, 'houses', houseId, 'accounts'), { ...data, createdAt: serverTimestamp(), addedBy: uid })
  }, [houseId, uid])

  // ── Transactions ───────────────────────────────────────────
  const addTransaction = useCallback(async (data, shared = false) => {
    const timestamp = serverTimestamp()
    if (shared && houseId) {
      await addDoc(collection(db, 'houses', houseId, 'transactions'), { ...data, date: timestamp, addedBy: uid })
      // Update house account balance
      const accRef = doc(db, 'houses', houseId, 'accounts', data.accountId)
      const accSnap = await getDoc(accRef)
      if (accSnap.exists()) {
        const delta = data.type === 'income' ? data.amount : -data.amount
        await updateDoc(accRef, { balance: (accSnap.data().balance || 0) + delta })
      }
    } else {
      await addDoc(col('transactions'), { ...data, date: timestamp })
      // Update private account balance
      const accRef = ref('accounts', data.accountId)
      const accSnap = await getDoc(accRef)
      if (accSnap.exists()) {
        const delta = data.type === 'income' ? data.amount : -data.amount
        await updateDoc(accRef, { balance: (accSnap.data().balance || 0) + delta })
      }
    }
  }, [uid, houseId])

  // ── Fixed costs ────────────────────────────────────────────
  const addFixedCost = useCallback(async (data) => {
    await addDoc(col('fixedCosts'), { ...data, createdAt: serverTimestamp() })
  }, [uid])

  const deleteFixedCost = useCallback(async (id) => {
    await deleteDoc(ref('fixedCosts', id))
  }, [uid])

  // ── Piggy banks ────────────────────────────────────────────
  const addPiggyBank = useCallback(async (data) => {
    await addDoc(col('piggyBanks'), { ...data, currentAmount: 0, createdAt: serverTimestamp() })
  }, [uid])

  const updatePiggyBank = useCallback(async (id, delta) => {
    const snap = await getDoc(ref('piggyBanks', id))
    if (snap.exists()) {
      const current = snap.data().currentAmount || 0
      await updateDoc(ref('piggyBanks', id), { currentAmount: Math.max(0, current + delta) })
    }
  }, [uid])

  const deletePiggyBank = useCallback(async (id) => {
    await deleteDoc(ref('piggyBanks', id))
  }, [uid])

  // ── Goals ──────────────────────────────────────────────────
  const addGoal = useCallback(async (data) => {
    await addDoc(col('goals'), { ...data, currentAmount: 0, createdAt: serverTimestamp() })
  }, [uid])

  const updateGoal = useCallback(async (id, delta) => {
    const snap = await getDoc(ref('goals', id))
    if (snap.exists()) {
      const current = snap.data().currentAmount || 0
      await updateDoc(ref('goals', id), { currentAmount: Math.max(0, current + delta) })
    }
  }, [uid])

  const deleteGoal = useCallback(async (id) => {
    await deleteDoc(ref('goals', id))
  }, [uid])

  // ── Renovations ────────────────────────────────────────────
  const addRenovation = useCallback(async (data) => {
    if (!houseId) return
    await addDoc(collection(db, 'houses', houseId, 'renovations'), {
      ...data, spent: 0, status: 'planned', createdAt: serverTimestamp(), addedBy: uid
    })
  }, [houseId, uid])

  const updateRenovation = useCallback(async (id, updates) => {
    if (!houseId) return
    await updateDoc(doc(db, 'houses', houseId, 'renovations', id), updates)
  }, [houseId])

  const deleteRenovation = useCallback(async (id) => {
    if (!houseId) return
    await deleteDoc(doc(db, 'houses', houseId, 'renovations', id))
  }, [houseId])

  // ── Computed values ────────────────────────────────────────
  const allAccounts   = [...accounts, ...houseAccounts]
  const allTransactions = [...transactions, ...houseTransactions]
    .sort((a, b) => (b.date?.seconds || 0) - (a.date?.seconds || 0))

  const totalBalance    = allAccounts.reduce((s, a) => s + (a.balance || 0), 0)
  const privateBalance  = accounts.reduce((s, a) => s + (a.balance || 0), 0)
  const houseBalance    = houseAccounts.reduce((s, a) => s + (a.balance || 0), 0)

  const monthlyFixed    = fixedCosts.reduce((s, c) =>
    s + (c.frequency === 'yearly' ? (c.amount || 0) / 12 : (c.amount || 0)), 0)

  const savingsBalance  = accounts
    .filter(a => a.type === 'savings')
    .reduce((s, a) => s + (a.balance || 0), 0)

  const runway = monthlyFixed > 0 ? savingsBalance / monthlyFixed : null

  // Freedom score (0–100)
  const freedomScore = (() => {
    let score = 0
    if (runway !== null) score += Math.min(25, (runway / 6) * 25)
    const totalGoals = goals.length
    if (totalGoals > 0) {
      const avgProgress = goals.reduce((s, g) =>
        s + Math.min(1, (g.currentAmount || 0) / (g.targetAmount || 1)), 0) / totalGoals
      score += avgProgress * 25
    }
    const piggyProgress = piggyBanks.reduce((s, p) =>
      s + Math.min(1, (p.currentAmount || 0) / (p.targetAmount || 1)), 0)
    if (piggyBanks.length > 0) score += (piggyProgress / piggyBanks.length) * 25
    if (privateBalance > 0) score += Math.min(25, (privateBalance / 10000) * 25)
    return Math.round(Math.min(100, score))
  })()

  return (
    <FinanceContext.Provider value={{
      accounts, houseAccounts, allAccounts,
      transactions, houseTransactions, allTransactions,
      fixedCosts, piggyBanks, goals, renovations,
      houseId, totalBalance, privateBalance, houseBalance,
      monthlyFixed, savingsBalance, runway, freedomScore,
      addAccount, deleteAccount, addHouseAccount,
      addTransaction, addFixedCost, deleteFixedCost,
      addPiggyBank, updatePiggyBank, deletePiggyBank,
      addGoal, updateGoal, deleteGoal,
      addRenovation, updateRenovation, deleteRenovation,
      createHouse, joinHouse
    }}>
      {children}
    </FinanceContext.Provider>
  )
}

export const useFinance = () => useContext(FinanceContext)
