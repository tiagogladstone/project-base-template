import { createClient } from "@/lib/supabase/server" // Cliente server-side
import { NextResponse } from "next/server" // Resposta Next.js
import { type NextRequest } from 'next/server' // Importa o tipo NextRequest

// Handler para requisições POST (o formulário no dashboard envia via POST)
export async function POST(request: NextRequest) { // Usa o tipo NextRequest
  const supabase = await createClient() // Usa await!

  // Tenta fazer o logout do usuário no Supabase
  const { error } = await supabase.auth.signOut()

  // Clona a URL atual para construir a URL de redirecionamento
  const redirectUrl = request.nextUrl.clone()

  if (error) {
    // Se houver erro no logout, loga e redireciona para /login com mensagem de erro
    console.error("Erro ao fazer logout:", error.message)
    redirectUrl.pathname = '/login' // Define o caminho para login
    redirectUrl.searchParams.set('error', 'Logout falhou. Tente novamente.') // Adiciona parâmetro de erro
  } else {
     // Se o logout for bem-sucedido, define o caminho para a raiz (página inicial)
     console.log("Logout bem-sucedido, redirecionando para /")
     redirectUrl.pathname = '/'
     redirectUrl.search = '' // Limpa quaisquer query params existentes
  }

  // Retorna a resposta de redirecionamento
  // O status 302 é importante para redirecionamentos temporários após POST
  return NextResponse.redirect(redirectUrl, {
     status: 302,
  })
}

// Opcional: Adicionar handler GET para redirecionar se acessado diretamente
// Isso evita que a rota /auth/signout seja acessada via GET por engano.
export async function GET(request: NextRequest) {
   console.warn("Rota de logout acessada via GET. Redirecionando para /")
   const redirectUrl = request.nextUrl.clone()
   redirectUrl.pathname = '/'
   redirectUrl.search = ''
   // Redireciona para a página inicial se alguém tentar acessar via GET
   return NextResponse.redirect(redirectUrl)
} 