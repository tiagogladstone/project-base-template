"use client" // Este componente precisa ser Client para usar hooks

import { useState } from "react"
import Link from "next/link" // Para o botão de criar caso a lista esteja vazia
import { useItems, useUpdateItem, useDeleteItem, Item } from "@/hooks/use-items" // Nossos hooks customizados
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Checkbox } from "@/components/ui/checkbox" // Para marcar como completo
// Import do toast não é necessário aqui, pois os hooks já o chamam.
import { Loader2, Trash2, ChevronDown, ChevronUp, AlertCircle } from "lucide-react" // Ícones
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert" // Para exibir erros
import { Skeleton } from "@/components/ui/skeleton" // Para estado de loading

export default function ItemsList() {
  // --- Estados e Hooks ---
  // Hook useItems para buscar os dados. Retorna:
  // data: Os itens (ou undefined se ainda carregando/erro)
  // isLoading: true na primeira busca
  // isFetching: true durante refetches em background
  // error: Objeto de erro se a busca falhar
  // refetch: Função para disparar manualmente uma nova busca
  const { data: items, isLoading, isFetching, error, refetch } = useItems()

  // Hooks de mutação (não chamamos aqui, apenas pegamos a função 'mutate')
  const updateItemMutation = useUpdateItem()
  const deleteItemMutation = useDeleteItem()

  // Estado local para controlar quais descrições de itens estão expandidas
  const [expandedItems, setExpandedItems] = useState<Set<string>>(new Set())

  // --- Funções Handler ---

  // Alterna a expansão de um item pelo ID
  const toggleItemExpand = (id: string) => {
    setExpandedItems((prev) => {
      const newSet = new Set(prev) // Cria cópia do Set
      if (newSet.has(id)) {
        newSet.delete(id) // Remove se já existia (encolhe)
      } else {
        newSet.add(id) // Adiciona se não existia (expande)
      }
      return newSet // Retorna o novo Set para atualizar o estado
    })
  }

  // Lida com o clique no checkbox para marcar/desmarcar
  const handleToggleComplete = (item: Item) => {
    // Chama a função 'mutate' do hook useUpdateItem
    updateItemMutation.mutate(
      { id: item.id, data: { is_complete: !item.is_complete } }, // Passa o ID e os dados a atualizar
      { // Callbacks opcionais específicos para esta chamada (os hooks já têm onError/onSuccess globais)
        onError: (err) => {
           console.error(`Erro específico ao marcar/desmarcar item ${item.id}:`, err)
           // Poderia mostrar um toast específico aqui se quisesse
        }
      }
    )
  }

  // Lida com o clique no botão de deletar
  const handleDelete = (id: string, title: string) => {
     // Pede confirmação ao usuário
     if(confirm(`Tem certeza que deseja excluir o item "${title}"? Esta ação não pode ser desfeita.`)) {
         // Chama a função 'mutate' do hook useDeleteItem, passando o ID
         deleteItemMutation.mutate(id, {
             onError: (err) => {
                 console.error(`Erro específico ao excluir item ${id}:`, err)
             }
         })
     }
  }

  // --- Renderização Condicional ---

  // 1. Estado de Loading Inicial (primeira busca)
  if (isLoading) {
    return (
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {/* Mostra 3 Skeletons de Card enquanto carrega */}
        {[...Array(3)].map((_, i) => (
          <Card key={i} aria-hidden="true">
            <CardHeader><Skeleton className="h-6 w-3/4" /></CardHeader>
            <CardContent><Skeleton className="h-4 w-full" /><Skeleton className="h-4 w-2/3 mt-2" /></CardContent>
            <CardFooter><Skeleton className="h-8 w-20" /></CardFooter>
          </Card>
        ))}
      </div>
    )
  }

  // 2. Estado de Erro na Busca
  if (error) {
    return (
      <Alert variant="destructive">
         <AlertCircle className="h-4 w-4" />
        <AlertTitle>Erro ao Carregar Itens</AlertTitle>
        <AlertDescription>
            Ocorreu um problema ao buscar seus itens: {error.message}
            {/* Botão para tentar buscar novamente */}
            <Button variant="secondary" size="sm" onClick={() => refetch()} className="ml-4">
                Tentar Novamente
            </Button>
        </AlertDescription>
      </Alert>
    )
  }

  // 3. Estado Vazio (Busca bem-sucedida, mas sem itens retornados)
  if (!items || items.length === 0) {
    return (
      <div className="text-center py-16 border border-dashed rounded-lg bg-card">
        <h3 className="text-lg font-semibold">Nenhum item encontrado</h3>
        <p className="text-muted-foreground mt-2">
          Parece que você ainda não adicionou nenhum item.
        </p>
        {/* Botão para ir para a página de criação */}
        <Button asChild size="sm" className="mt-4">
           <Link href="/dashboard/items/new">Criar Primeiro Item</Link>
        </Button>
      </div>
    )
  }

  // 4. Estado com Itens (Renderização da Lista de Cards)
  return (
    <div>
       {/* Indicador opcional de refetching (quando busca em background) */}
       {isFetching && !isLoading && (
           <div className="text-center text-sm text-muted-foreground mb-4 flex items-center justify-center gap-2">
               <Loader2 className="h-4 w-4 animate-spin" /> Atualizando lista...
           </div>
       )}
      {/* Grid responsivo para os cards */}
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {items.map((item) => {
          // Verifica se este item está expandido no estado local
          const isExpanded = expandedItems.has(item.id)
          // Verifica se existe descrição e se ela é longa o suficiente para precisar do "Ver mais"
          const descriptionExists = item.description && item.description.trim().length > 0;
          const showToggle = descriptionExists && item.description!.length > 100; // Limite de 100 caracteres

          // Verifica se alguma mutação (update ou delete) está ocorrendo PARA ESTE item específico
          const isUpdating = updateItemMutation.isPending && updateItemMutation.variables?.id === item.id;
          const isDeleting = deleteItemMutation.isPending && deleteItemMutation.variables === item.id;
          const isMutating = isUpdating || isDeleting; // True se qualquer mutação estiver em andamento para este item

          return (
            <Card
              key={item.id}
              // Aplica estilos condicionais: opacidade se completo, pulse se mutando
              className={`transition-opacity duration-300 ${item.is_complete ? "opacity-60 bg-muted/50" : "bg-card"} ${isMutating ? 'animate-pulse' : ''}`}
            >
              <CardHeader className="pb-2">
                <div className="flex items-start justify-between gap-4">
                  {/* Checkbox e Título */}
                  <div className="flex items-start gap-3 flex-1 min-w-0"> {/* Garante que o título quebre a linha se necessário */}
                    <Checkbox
                      checked={item.is_complete}
                      disabled={isMutating} // Desabilita durante qualquer mutação neste item
                      onCheckedChange={() => handleToggleComplete(item)}
                      id={`complete-${item.id}`}
                      className="mt-1 flex-shrink-0" // Impede que o checkbox encolha
                      aria-label={`Marcar ${item.title} como ${item.is_complete ? 'incompleto' : 'completo'}`}
                    />
                    <div className="flex-1 min-w-0"> {/* Garante que o div do título possa encolher */}
                      <CardTitle
                         className={`text-lg break-words ${item.is_complete ? "line-through text-muted-foreground" : ""}`} // `break-words` para quebrar títulos longos
                      >
                        {item.title}
                      </CardTitle>
                      <CardDescription className="text-xs mt-1">
                        Criado em: {new Date(item.created_at).toLocaleDateString()}
                      </CardDescription>
                    </div>
                  </div>
                  {/* Botão Deletar */}
                  <Button
                    variant="ghost"
                    size="icon"
                    className="flex-shrink-0 text-muted-foreground hover:text-destructive hover:bg-destructive/10 h-8 w-8" // Tamanho menor
                    disabled={isMutating} // Desabilita durante mutação
                    onClick={() => handleDelete(item.id, item.title)}
                    aria-label={`Excluir item ${item.title}`}
                  >
                     {/* Mostra ícone de loading se este item estiver sendo deletado */}
                     {isDeleting ? (
                         <Loader2 className="h-4 w-4 animate-spin" />
                     ) : (
                         <Trash2 className="h-4 w-4" />
                     )}
                  </Button>
                </div>
              </CardHeader>
              {/* Descrição (condicional) */}
              {descriptionExists && (
                <>
                  <CardContent className="pt-0 pb-2">
                    <p className={`text-sm whitespace-pre-wrap break-words ${item.is_complete ? "line-through text-muted-foreground" : ""}`}>
                      {isExpanded || !showToggle
                        ? item.description // Mostra tudo se expandido ou descrição for curta
                        : `${item.description!.substring(0, 100)}...`} {/* Mostra apenas os primeiros 100 caracteres */}
                    </p>
                  </CardContent>
                  {/* Botão "Ver mais/menos" (condicional) */}
                  {showToggle && (
                     <CardFooter className="pt-0">
                       <Button
                         variant="link"
                         size="sm"
                         className="p-0 h-auto text-xs" // Estilo sutil para o link
                         onClick={() => toggleItemExpand(item.id)}
                       >
                         {isExpanded ? (
                            <><ChevronUp className="mr-1 h-3 w-3"/> Ver menos</>
                         ) : (
                            <><ChevronDown className="mr-1 h-3 w-3"/> Ver mais</>
                         )}
                       </Button>
                     </CardFooter>
                  )}
                </>
              )}
            </Card>
          )
        })}
      </div>
    </div>
  )
} 