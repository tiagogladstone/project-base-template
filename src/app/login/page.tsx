import { AuthForm } from "@/components/auth/auth-form" // Importa o formulário
import { createClient } from "@/lib/supabase/server" // Cliente Supabase server-side (com async/await)
import { redirect } from "next/navigation" // Função para redirecionamento server-side
import { ModeToggle } from "@/components/ui/mode-toggle" // Botão de tema

// Esta é uma página Server Component por padrão
export default async function LoginPage() {
  // Usa await porque createClient é async
  const supabase = await createClient()
  // Verifica se já existe uma sessão ativa para este usuário
  const { data: { session } } = await supabase.auth.getSession()

  // Se o usuário já estiver logado, redireciona imediatamente para o dashboard
  if (session) {
    console.log("LoginPage: Usuário já logado, redirecionando para /dashboard")
    redirect("/dashboard")
  }

  // Se não estiver logado, renderiza a página com o formulário
  console.log("LoginPage: Usuário não logado, renderizando formulário.")
  return (
    // Container principal centralizado
    <div className="relative flex flex-col items-center justify-center min-h-screen p-4 bg-gradient-to-b from-background to-muted/40 dark:to-black/60">
       {/* Botão de tema no canto */}
       <div className="absolute top-4 right-4 z-10">
         <ModeToggle />
       </div>
       {/* Título (Opcional) */}
       <div className="mb-8 text-center">
            <h1 className="text-3xl font-semibold tracking-tight">Atlas Cloud AI</h1>
            <p className="text-sm text-muted-foreground">Acesse sua conta ou cadastre-se</p>
       </div>
       {/* Renderiza o formulário de autenticação */}
      <AuthForm />
    </div>
  )
} 