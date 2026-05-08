import { Moon, Sun } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useThemeStore } from '@/stores/themeStore'

export function ThemeToggle() {
  const { theme, setTheme } = useThemeStore()

  const isDark = theme === 'dark' || (theme === 'system' &&
    window.matchMedia('(prefers-color-scheme: dark)').matches)

  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={() => setTheme(isDark ? 'light' : 'dark')}
      title={isDark ? 'Modo claro' : 'Modo oscuro'}
    >
      {isDark ? (
        <Sun className="h-5 w-5" />
      ) : (
        <Moon className="h-5 w-5" />
      )}
      <span className="sr-only">Cambiar tema</span>
    </Button>
  )
}
