import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { ModeToggle } from "@/components/ui/mode-toggle"
import ResetPasswordRequestForm from "@/components/auth/reset-password-request-form" // Componente Client
import { ArrowLeft } from "lucide-react"

export const metadata = {
    title: "Redefinir Senha",
};

export default async function ResetPasswordPage() {
  const supabase = createClient()
  const { data: { session } } = await supabase.auth.getSession()

  // Se o usuário já estiver logado, redireciona para o dashboard
  if (session) {
    redirect("/dashboard")
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-4 bg-muted/30 relative">
       <div className="absolute top-4 right-4 flex items-center gap-3">
         <Button variant="outline" size="sm" asChild>
             <Link href="/login"><ArrowLeft className="mr-2 h-4 w-4"/> Voltar ao Login</Link>
         </Button>
         <ModeToggle />
       </div>
      <ResetPasswordRequestForm />
    </div>
  )
} 