/// <reference types="vitest" />
import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'
import path from 'path'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  test: {
    globals: true, // Permite usar APIs do Vitest globalmente (describe, it, expect)
    environment: 'jsdom', // Simula ambiente de navegador com JSDOM (alternativa: 'happy-dom')
    setupFiles: './vitest.setup.ts', // Arquivo de configuração/setup para os testes
    css: false, // Geralmente não precisamos processar CSS em testes unitários/integração
    alias: { // Garante que os aliases de import (@/) funcionem nos testes
        '@': path.resolve(__dirname, './src'),
    },
    // Opcional: Configuração para coverage (requer @vitest/coverage-v8)
    // coverage: {
    //   provider: 'v8', // ou 'istanbul'
    //   reporter: ['text', 'json', 'html'],
    // },
  },
}) 