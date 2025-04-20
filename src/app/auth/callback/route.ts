import { createClient } from "@/lib/supabase/server" // Cliente Supabase para Server-side (agora com async/await!)
import { NextResponse } from "next/server" // Objeto de resposta do Next.js

// Handler para requisições GET nesta rota
export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url) // Pega parâmetros da URL
  const code = searchParams.get("code") // Código de autorização enviado pelo Supabase
  // Pega a URL de redirecionamento (opcional, default é /dashboard)
  const next = searchParams.get("next") || "/dashboard"

  // Se o código existir na URL
  if (code) {
    // Usa await pois createClient agora é async
    const supabase = await createClient()
    // Troca o código por uma sessão de usuário
    const { error } = await supabase.auth.exchangeCodeForSession(code)
    if (!error) {
       // Se a troca for bem-sucedida, redireciona para a página 'next'
       console.log(`Callback: Código trocado com sucesso. Redirecionando para ${origin}${next}`)
       return NextResponse.redirect(`${origin}${next}`)
    } else {
        console.error("Callback: Erro ao trocar código por sessão:", error.message)
        // Redireciona para uma página de erro se a troca falhar
        return NextResponse.redirect(`${origin}/login?error=Falha na autenticação`)
    }
  }

  // Se não houver código, redireciona para uma página de erro genérica ou login
  console.warn("Callback: Chamado sem código de autenticação.")
  return NextResponse.redirect(`${origin}/login?error=Código de autenticação inválido`)
} 