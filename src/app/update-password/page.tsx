import Link from "next/link"
import { Button } from "@/components/ui/button"
import { ModeToggle } from "@/components/ui/mode-toggle"
import UpdatePasswordForm from "@/components/auth/update-password-form" // Componente Client
import { ArrowLeft } from "lucide-react"

export const metadata = {
    title: "Atualizar Senha",
};

// Esta página precisa ser renderizada no cliente para acessar o estado da sessão
// que pode ter sido atualizado pelo Supabase após o clique no link de recuperação.
// Não precisamos mais extrair token do hash da URL manualmente com o setup atual do Supabase SSR.
// Se o usuário clicou no link válido, o Supabase Auth Helper (middleware/server client)
// deve ter gerenciado a sessão temporária necessária para permitir a atualização.
export default function UpdatePasswordPage() {

  // Idealmente, o componente UpdatePasswordForm faria uma verificação de sessão
  // no lado do cliente ao montar, mas por simplicidade, vamos renderizá-lo diretamente.
  // Adicionar uma verificação server-side aqui seria redundante se o usuário
  // *acabou* de clicar no link de recuperação.

  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-4 bg-muted/30 relative">
       <div className="absolute top-4 right-4 flex items-center gap-3">
         <Button variant="outline" size="sm" asChild>
             <Link href="/login"><ArrowLeft className="mr-2 h-4 w-4"/> Ir para Login</Link>
         </Button>
         <ModeToggle />
       </div>
      <UpdatePasswordForm />
    </div>
  )
} 