import { createContext, useContext, useState } from 'react'

const UIContext = createContext(null)

export function UIProvider({ children }) {
  const [sheetOpen, setSheetOpen] = useState(false)
  return (
    <UIContext.Provider value={{ sheetOpen, setSheetOpen }}>
      {children}
    </UIContext.Provider>
  )
}

export const useUI = () => useContext(UIContext)
