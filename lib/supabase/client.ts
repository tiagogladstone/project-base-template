// lib/supabase/client.ts
import { createBrowserClient } from '@supabase/ssr'

// Cria um cliente Supabase para uso no lado do cliente (Browser).
export function createClient() {
  // Note: Variáveis de ambiente prefixadas com NEXT_PUBLIC_ são expostas ao browser.
  // NUNCA exponha chaves secretas (service_role ou JWT secret) aqui!
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!, // Exclamação assume que a variável estará definida
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
}
