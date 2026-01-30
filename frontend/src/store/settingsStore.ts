import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'

interface SettingsState {
  model: string
  temperature: number
  maxTokens: number
  setModel: (model: string) => void
  setTemperature: (temp: number) => void
  setMaxTokens: (tokens: number) => void
  reset: () => void
}

const defaultSettings = {
  model: 'gpt-4o-mini',
  temperature: 0.7,
  maxTokens: 2000,
}

export const useSettingsStore = create<SettingsState>()(
  persist(
    (set) => ({
      ...defaultSettings,
      setModel: (model) => set({ model }),
      setTemperature: (temperature) => set({ temperature }),
      setMaxTokens: (maxTokens) => set({ maxTokens }),
      reset: () => set(defaultSettings),
    }),
    {
      name: 'settings-storage',
      storage: createJSONStorage(() => localStorage),
    }
  )
)
