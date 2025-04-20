// lib/supabase/server.ts
import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { cookies } from 'next/headers'

// Cria um cliente Supabase para uso no lado do servidor (Server Components, API Routes, Middleware).
export function createClient() {
  const cookieStore = cookies() // Obtém acesso aos cookies da requisição atual

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        // Função para obter um cookie
        get(name: string) {
          return cookieStore.get(name)?.value
        },
        // Função para definir um cookie
        set(name: string, value: string, options: CookieOptions) {
          try {
             cookieStore.set({ name, value, ...options })
          } catch (error) {
             // Ação de set pode falhar em Server Actions ou Route Handlers.
             // Visto que os cookies já foram enviados, isso geralmente é seguro de ignorar.
          }
        },
        // Função para remover um cookie
        remove(name: string, options: CookieOptions) {
           try {
             cookieStore.set({ name, value: '', ...options })
           } catch (error) {
              // Ação de remove pode falhar em Server Actions ou Route Handlers.
           }
        },
      },
    }
  )
}
