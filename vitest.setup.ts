import '@testing-library/jest-dom/vitest'; // Importa matchers do jest-dom para Vitest
import { vi, beforeEach } from 'vitest'; // Utilitário de mock do Vitest

// --- Mocks Globais ---
// Necessário para componentes/hooks que usam APIs do navegador não presentes no JSDOM/HappyDOM

// Mock de matchMedia (usado pelo ThemeProvider e outras libs de UI)
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: vi.fn().mockImplementation(query => ({
    matches: false, // Default para não ser dark mode nos testes
    media: query,
    onchange: null,
    addListener: vi.fn(), // deprecated mas mantido por compatibilidade
    removeListener: vi.fn(), // deprecated mas mantido por compatibilidade
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })),
});

// Mock de localStorage (usado pelo ThemeProvider, TanStack Query Persister, etc.)
const localStorageMock = (() => {
    let store: Record<string, string> = {};
    return {
        getItem(key: string) { return store[key] || null; },
        setItem(key: string, value: string) { store[key] = value.toString(); },
        removeItem(key: string) { delete store[key]; },
        clear() { store = {}; },
        get length() { return Object.keys(store).length; },
        key(index: number) { return Object.keys(store)[index] || null; }
    };
})();
Object.defineProperty(window, 'localStorage', { value: localStorageMock });

// Mock de IntersectionObserver (usado por algumas libs de scroll/animação)
const IntersectionObserverMock = vi.fn(() => ({
  disconnect: vi.fn(),
  observe: vi.fn(),
  takeRecords: vi.fn(),
  unobserve: vi.fn(),
}));
vi.stubGlobal('IntersectionObserver', IntersectionObserverMock);

// Mock de ResizeObserver (usado por algumas libs de UI)
const ResizeObserverMock = vi.fn(() => ({
    disconnect: vi.fn(),
    observe: vi.fn(),
    unobserve: vi.fn(),
}));
vi.stubGlobal('ResizeObserver', ResizeObserverMock);


// --- Mocks Específicos Supabase (Exemplo - Ajuste conforme necessário) ---
// Mock para createClient (evita chamadas reais nos testes unitários)
// Pode ser mais granularmente mockado dentro de cada teste se necessário
vi.mock('@/lib/supabase/client', () => ({
  createClient: vi.fn(() => ({
    auth: {
      // Mock de funções auth que seus componentes podem chamar
      getSession: vi.fn().mockResolvedValue({ data: { session: null }, error: null }),
      signInWithPassword: vi.fn().mockResolvedValue({ data: { session: { /* mock session */ } }, error: null }),
      signUp: vi.fn().mockResolvedValue({ data: { user: { /* mock user */ } }, error: null }),
      signOut: vi.fn().mockResolvedValue({ error: null }),
      onAuthStateChange: vi.fn().mockReturnValue({ data: { subscription: { unsubscribe: vi.fn() } } }),
      // Adicione outros métodos auth que você usa...
    },
    // Mock de funções de DB que seus componentes podem usar (se necessário)
    from: vi.fn().mockReturnValue({
      select: vi.fn().mockResolvedValue({ data: [], error: null }),
      insert: vi.fn().mockResolvedValue({ data: [], error: null }),
      update: vi.fn().mockResolvedValue({ data: [], error: null }),
      delete: vi.fn().mockResolvedValue({ data: [], error: null }),
      // Adicione outros métodos/chaining que você usa...
    }),
  })),
}));


// Limpa mocks ANTES de cada teste (boa prática para isolamento)
beforeEach(() => {
  localStorageMock.clear();
  vi.clearAllMocks(); // Limpa contagens de chamadas, etc.
   // Redefine implementações mockadas se necessário (pode ser feito no teste específico também)
   // Ex: vi.mocked(supabase.auth.getSession).mockResolvedValue({ ... });
});

console.log("Vitest setup concluído com mocks básicos."); // Log para confirmar execução 