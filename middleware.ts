import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function middleware(request: NextRequest) {
  // Cria uma resposta inicial que simplesmente passa a requisição adiante.
  // Isso é importante porque precisamos potencialmente modificar os cookies da *resposta*.
  let response = NextResponse.next({
    request: { headers: request.headers },
  })

  // Cria um cliente Supabase adaptado para Middleware.
  // É crucial que a lógica de get/set/remove cookies aqui funcione
  // tanto para a requisição (request.cookies) quanto para a resposta (response.cookies).
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return request.cookies.get(name)?.value
        },
        set(name: string, value: string, options: CookieOptions) {
          // O Middleware precisa definir o cookie tanto na requisição (para uso interno imediato do Supabase client)
          // quanto na resposta (para enviar de volta ao navegador).
          request.cookies.set({ name, value, ...options })
          // Recria a resposta para garantir que os headers atualizados da requisição sejam usados
          // e então define o cookie na resposta.
          response = NextResponse.next({
            request: { headers: request.headers },
          })
          response.cookies.set({ name, value, ...options })
        },
        remove(name: string, options: CookieOptions) {
          // Mesma lógica para remover o cookie.
          request.cookies.set({ name, value: '', ...options })
          response = NextResponse.next({
            request: { headers: request.headers },
          })
          response.cookies.set({ name, value: '', ...options })
        },
      },
    }
  )

  // IMPORTANTE: Atualiza a sessão do usuário a cada requisição.
  // Essencial para o refresh automático de tokens e para garantir que a verificação abaixo
  // use o estado de sessão mais recente.
  // O objeto `supabase` criado acima LERÁ os cookies da `request` para fazer isso.
  // Se um token for atualizado, as funções `set` e `remove` acima serão chamadas
  // para definir o novo cookie na `response`.
  const { data: { session } } = await supabase.auth.getSession()

  // Pega o caminho da URL sendo acessada (ex: '/', '/dashboard', '/login')
  const { pathname } = request.nextUrl

  // Define quais rotas são consideradas públicas (não exigem login)
  const publicPaths = ['/', '/login', '/auth/callback'] // Raiz, login e callback são públicos

  // Protege rotas não públicas:
  // Verifica se o caminho atual NÃO está na lista de rotas públicas
  // E se NÃO começa com /api (para não bloquear suas próprias APIs)
  // E se NÃO há uma sessão de usuário ativa...
  if (
      !publicPaths.includes(pathname) &&   // Não é rota pública
      !pathname.startsWith('/api') &&      // Não é rota de API
      !session                             // E não tem sessão
     )
  {
    // ...redireciona o usuário para a página de login.
    const redirectUrl = new URL('/login', request.url) // Cria URL /login
    // Guarda a página que o usuário tentou acessar para redirecioná-lo de volta após o login.
    if (pathname !== '/') { // Evita adicionar ?next=/ se o usuário estava na raiz
       redirectUrl.searchParams.set('next', pathname)
    }
    console.log(`Middleware: Usuário não autenticado acessando ${pathname}. Redirecionando para ${redirectUrl.toString()}`)
    // Retorna a resposta que instrui o navegador a redirecionar.
    return NextResponse.redirect(redirectUrl)
  }

   // Redireciona usuários logados que tentam acessar /login:
  // Se o usuário TEM uma sessão E está tentando acessar a página de login...
  if (session && pathname === '/login') {
     // ...redireciona imediatamente para o dashboard.
     console.log(`Middleware: Usuário autenticado acessando /login. Redirecionando para /dashboard`)
     return NextResponse.redirect(new URL('/dashboard', request.url))
  }


  // Se nenhuma das condições de redirecionamento acima foi atendida,
  // permite que a requisição continue normalmente, retornando a resposta
  // (que pode ter sido atualizada com novos cookies de sessão pelo Supabase).
  return response
}

// Configuração do matcher: Define PARA QUAIS rotas o middleware deve rodar.
export const config = {
  matcher: [
    /*
     * Corresponde a todas as rotas exceto as que começam com:
     * - api (Rotas de API do Next.js ou suas APIs customizadas)
     * - _next/static (Arquivos estáticos: JS, CSS gerados pelo build)
     * - _next/image (Otimização de imagem do Next.js)
     * - favicon.ico (Ícone do site)
     * Isso garante que o middleware rode apenas para PÁGINAS e não para assets ou APIs.
     */
    '/((?!api|_next/static|_next/image|favicon.ico).*)',
  ],
} 