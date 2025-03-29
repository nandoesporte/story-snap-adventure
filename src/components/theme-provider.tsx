
import { createContext, useContext, useEffect, useState } from "react"

type Theme = "dark" | "light" | "system"

type ThemeProviderProps = {
  children: React.ReactNode
  defaultTheme?: Theme
  storageKey?: string
  attribute?: string
  enableSystem?: boolean
  disableTransitionOnChange?: boolean
}

type ThemeProviderState = {
  theme: Theme
  setTheme: (theme: Theme) => void
}

const ThemeProviderContext = createContext<ThemeProviderState | undefined>(undefined)

export function ThemeProvider({
  children,
  defaultTheme = "system",
  storageKey = "vite-ui-theme",
  attribute = "data-theme",
  enableSystem = true,
  disableTransitionOnChange = false,
  ...props
}: ThemeProviderProps) {
  const [theme, setTheme] = useState<Theme>(
    () => (localStorage.getItem(storageKey) as Theme) || defaultTheme
  )

  useEffect(() => {
    const root = window.document.documentElement

    if (disableTransitionOnChange) {
      root.classList.add("[&_*]:!transition-none")
      window.setTimeout(() => {
        root.classList.remove("[&_*]:!transition-none")
      }, 0)
    }

    if (theme === "system" && enableSystem) {
      const systemTheme = window.matchMedia("(prefers-color-scheme: dark)")
        .matches
        ? "dark"
        : "light"

      root.setAttribute(attribute, systemTheme)
      return
    }

    root.setAttribute(attribute, theme)
  }, [theme, attribute, enableSystem, disableTransitionOnChange])

  useEffect(() => {
    if (enableSystem) {
      const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)")
      
      const handleChange = () => {
        if (theme === "system") {
          const systemTheme = mediaQuery.matches ? "dark" : "light"
          const root = window.document.documentElement
          root.setAttribute(attribute, systemTheme)
        }
      }

      mediaQuery.addEventListener("change", handleChange)
      
      return () => mediaQuery.removeEventListener("change", handleChange)
    }
  }, [theme, attribute, enableSystem])

  useEffect(() => {
    localStorage.setItem(storageKey, theme)
  }, [theme, storageKey])

  const value = {
    theme,
    setTheme: (theme: Theme) => {
      setTheme(theme)
    },
  }

  return (
    <ThemeProviderContext.Provider value={value} {...props}>
      {children}
    </ThemeProviderContext.Provider>
  )
}

export const useTheme = () => {
  const context = useContext(ThemeProviderContext)

  if (context === undefined)
    throw new Error("useTheme must be used within a ThemeProvider")

  return context
}
