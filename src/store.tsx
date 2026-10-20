import { createContext, useContext, useEffect, useReducer, useState, type Dispatch, type ReactNode } from 'react'
import { todayISO } from './domain/dates'
import { reducer, type Action } from './domain/reducer'
import type { AppData, Category } from './domain/types'
import { loadData, loadLastBackup, requestPersistentStorage, saveData, saveLastBackup } from './storage'

interface Store {
  data: AppData
  dispatch: Dispatch<Action>
  categoryById: (id: string) => Category
  lastBackup: string | null
  markBackedUp: () => void
}

const StoreContext = createContext<Store | null>(null)

const UNKNOWN_CATEGORY: Category = {
  id: 'bilinmeyen', name: 'Bilinmeyen', emoji: '❓', color: '#8E8E93', type: 'expense',
}

export function StoreProvider({ children, initialData }: { children: ReactNode; initialData?: AppData }) {
  const [data, dispatch] = useReducer(reducer, initialData, (init) => init ?? loadData())
  const [lastBackup, setLastBackup] = useState(loadLastBackup)
  const markBackedUp = () => {
    const today = todayISO()
    saveLastBackup(today)
    setLastBackup(today)
  }

  useEffect(() => {
    saveData(data)
  }, [data])

  useEffect(() => {
    requestPersistentStorage()
    const run = () => dispatch({ type: 'recurring/run', today: todayISO() })
    run()
    // iOS ana ekran uygulamaları günlerce arka planda açık kalabilir; öne gelince yeni vadeleri işle.
    const onVisible = () => document.visibilityState === 'visible' && run()
    document.addEventListener('visibilitychange', onVisible)
    return () => document.removeEventListener('visibilitychange', onVisible)
  }, [])

  const categoryById = (id: string) => data.categories.find((c) => c.id === id) ?? UNKNOWN_CATEGORY

  return (
    <StoreContext.Provider value={{ data, dispatch, categoryById, lastBackup, markBackedUp }}>
      {children}
    </StoreContext.Provider>
  )
}

export function useStore(): Store {
  const store = useContext(StoreContext)
  if (!store) throw new Error('useStore StoreProvider dışında kullanıldı')
  return store
}
