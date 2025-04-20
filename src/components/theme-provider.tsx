"use client"

import { createContext, useContext, useEffect, useState } from "react"

type Theme = "dark" | "light" | "system"

type ThemeProviderProps = {
  children: React.ReactNode
  defaultTheme?: Theme
  storageKey?: string // Chave para localStorage
  // Adicionando props que serão usadas no layout
  attribute?: string
  enableSystem?: boolean
  disableTransitionOnChange?: boolean
}

type ThemeProviderState = {
  theme: Theme
  setTheme: (theme: Theme) => void
}

const initialState: ThemeProviderState = {
  theme: "system",
  setTheme: () => null, // Função placeholder
}

const ThemeProviderContext = createContext<ThemeProviderState>(initialState)

export function ThemeProvider({
  children,
  defaultTheme = "system",
  storageKey = "vite-ui-theme", // Chave específica (pode mudar o nome se quiser)
  // As props abaixo não são usadas diretamente aqui, mas são comuns em outros providers de tema
  // e são passadas para manter a compatibilidade ou para uso futuro.
  attribute = "class",
  enableSystem = true,
  disableTransitionOnChange: _disableTransitionOnChange,
  ...props // Captura quaisquer outras props passadas
}: ThemeProviderProps) {
  const [theme, setTheme] = useState<Theme>(() => {
    // Tenta carregar do localStorage na inicialização do lado do cliente
    if (typeof window !== 'undefined') {
      return (localStorage.getItem(storageKey) as Theme) || defaultTheme
    }
    return defaultTheme // Default no servidor ou se localStorage não estiver disponível
  })

  useEffect(() => {
    // Efeito só roda no cliente
    const root = window.document.documentElement
    root.classList.remove("light", "dark")

    let effectiveTheme = theme
    if (theme === "system" && enableSystem) { // Considera enableSystem
      effectiveTheme = window.matchMedia("(prefers-color-scheme: dark)").matches
        ? "dark"
        : "light"
    }
    // Usa a prop 'attribute' para definir onde aplicar a classe (ex: 'class' para <html>)
    root.setAttribute(attribute, effectiveTheme); // Usa setAttribute em vez de classList.add
    // Se attribute for 'class', podemos também usar classList:
    // root.classList.add(effectiveTheme)

    // Salva no localStorage quando o tema muda
    if (typeof window !== 'undefined') {
      localStorage.setItem(storageKey, theme)
    }
  }, [theme, storageKey, attribute, enableSystem]) // Adiciona dependências

  const value = {
    theme,
    setTheme: (newTheme: Theme) => {
      setTheme(newTheme)
    },
  }

  return (
    <ThemeProviderContext.Provider {...props} value={value}>
      {children}
    </ThemeProviderContext.Provider>
  )
}

// Hook customizado para usar o tema
export const useTheme = () => {
  const context = useContext(ThemeProviderContext)

  if (context === undefined)
    throw new Error("useTheme must be used within a ThemeProvider")

  return context
} 