import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server" // Server client
import NewItemForm from "./new-item-form" // Componente Client com o formulário (será criado a seguir)
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { ArrowLeft } from "lucide-react" // Ícone

// Metadata opcional para a tag <title> da página
export const metadata = {
    title: "Adicionar Novo Item | Atlas Cloud AI",
};

// Página Server Component
export default async function NewItemPage() {
  const supabase = await createClient() // Usa await!
  // Verifica sessão no servidor (proteção extra)
  const { data: { session } } = await supabase.auth.getSession()

  if (!session) {
    redirect("/login?next=/dashboard/items/new") // Redireciona se não logado
  }

  return (
    // Container principal
    <div className="container mx-auto py-8 px-4">
      {/* Cabeçalho com título e botão de cancelar/voltar */}
      <div className="flex justify-between items-center gap-4 mb-8">
        <h1 className="text-3xl font-bold tracking-tight">Adicionar Novo Item</h1>
        <Button asChild variant="outline" size="sm">
          <Link href="/dashboard/items"><ArrowLeft className="mr-2 h-4 w-4"/> Cancelar</Link>
        </Button>
      </div>

      {/* Container do formulário, centralizado e com estilo de card */}
      <div className="max-w-xl mx-auto bg-card p-6 sm:p-8 rounded-lg shadow">
         {/* Renderiza o componente Client que contém a lógica do formulário */}
         <NewItemForm />
      </div>
    </div>
  )
} 