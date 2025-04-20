// Copie e cole para ATUALIZAR o arquivo src/lib/supabase/server.ts
import { createServerClient, type CookieOptions } from '@supabase/ssr'
// Import 'cookies' from 'next/headers' - crucial
import { cookies } from 'next/headers'

// A função não deve ser async, e cookieStore é acessado dentro das funções
export function createClient() {
  // Esta chamada É síncrona neste contexto
  const cookieStore = cookies()

  // Create a server client Supabase client object
  // Remover tipagem <Database> pois o tipo não foi encontrado
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          // cookieStore AQUI deve ser do tipo ReadonlyRequestCookies
          return cookieStore.get(name)?.value
        },
        set(name: string, value: string, options: CookieOptions) {
          try {
            // cookieStore AQUI deve ser do tipo ReadonlyRequestCookies
            cookieStore.set({ name, value, ...options })
          } catch (error) { 
            // O erro pode acontecer durante a renderização estática ou em Server Actions
            // O middleware geralmente lida com a atualização, então podemos apenas logar.
            console.warn(`[Supabase Server Client] Failed to set cookie '${name}'. Error:`, error);
          }
        },
        remove(name: string, options: CookieOptions) {
          try {
            // cookieStore AQUI deve ser do tipo ReadonlyRequestCookies
            // A remoção é feita setando um valor vazio
            cookieStore.set({ name, value: '', ...options })
          } catch (error) { 
            console.warn(`[Supabase Server Client] Failed to remove cookie '${name}'. Error:`, error);
          }
        },
      },
    }
  )
}
