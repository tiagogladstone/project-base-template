import Link from "next/link"
import { createClient } from "@/lib/supabase/server" // Server client para verificação inicial
import { redirect } from "next/navigation"
import { Button } from "@/components/ui/button"
import ItemsList from "./items-list" // Componente Client que usará os hooks (será criado a seguir)
import { PlusCircle, ArrowLeft } from "lucide-react" // Ícones

// Página Server Component (pode buscar dados iniciais se necessário, mas delegaremos ao Client Component)
export default async function ItemsPage() {
  const supabase = await createClient() // Usa await!
  // Verifica sessão no servidor para proteção extra (middleware já deve ter feito)
  const { data: { session } } = await supabase.auth.getSession()

  if (!session) {
    // Redireciona para login se não houver sessão, guardando a página atual para 'next'
    redirect("/login?next=/dashboard/items")
  }

  return (
    // Container principal da página de itens
    <div className="container mx-auto py-8 px-4">
      {/* Cabeçalho da página com título e botões de ação */}
      <div className="flex flex-wrap justify-between items-center gap-4 mb-8">
        <h1 className="text-3xl font-bold tracking-tight">Meus Itens</h1>
        <div className="flex gap-3">
          {/* Botão para voltar ao Dashboard principal */}
          <Button asChild variant="outline" size="sm">
            <Link href="/dashboard"><ArrowLeft className="mr-2 h-4 w-4" /> Voltar</Link>
          </Button>
          {/* Botão para navegar para a página de adicionar novo item */}
          <Button asChild size="sm">
            <Link href="/dashboard/items/new"><PlusCircle className="mr-2 h-4 w-4" /> Adicionar Item</Link>
          </Button>
        </div>
      </div>

      {/* Renderiza o componente Client que exibirá a lista real */}
      {/* Passaremos a lógica de fetch/mutação para dentro deste componente */}
      <ItemsList />
    </div>
  )
} 