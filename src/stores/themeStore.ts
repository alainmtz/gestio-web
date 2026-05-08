import { create } from 'zustand'
import { persist } from 'zustand/middleware'

type Theme = 'light' | 'dark' | 'system'

interface ThemeState {
  theme: Theme
}

interface ThemeActions {
  setTheme: (theme: Theme) => void
}

function isBrowser() {
  return typeof window !== 'undefined' && typeof document !== 'undefined'
}

function resolveIsDark(theme: Theme): boolean {
  if (theme === 'dark') return true
  if (theme === 'light') return false
  return window.matchMedia?.('(prefers-color-scheme: dark)')?.matches ?? false
}

function applyTheme(theme: Theme) {
  if (!isBrowser()) return
  document.documentElement.classList.toggle('dark', resolveIsDark(theme))
}

let systemListenerReady = false

function setupSystemListener() {
  if (systemListenerReady) return
  systemListenerReady = true
  if (!isBrowser()) return
  const mq = window.matchMedia?.('(prefers-color-scheme: dark)')
  if (!mq) return
  const handler = (e: MediaQueryListEvent) => {
    document.documentElement.classList.toggle('dark', e.matches)
  }
  mq.addEventListener('change', handler)
}

export const useThemeStore = create<ThemeState & ThemeActions>()(
  persist(
    (set) => ({
      theme: 'system',

      setTheme: (theme) => {
        set({ theme })
        applyTheme(theme)
      },
    }),
    {
      name: 'gestio-theme',
      partialize: (state) => ({ theme: state.theme }),
      onRehydrateStorage: () => (state) => {
        if (!state) return
        applyTheme(state.theme)
        if (state.theme === 'system') {
          setupSystemListener()
        }
      },
    }
  )
)

export function initTheme() {
  if (!isBrowser()) return

  const stored = (() => {
    try {
      const raw = localStorage.getItem('gestio-theme')
      if (raw) return JSON.parse(raw)?.theme
    } catch {}
    return null
  })()

  const theme = stored || 'system'
  applyTheme(theme)
  useThemeStore.setState({ theme })

  if (theme === 'system') {
    setupSystemListener()
  }
}
