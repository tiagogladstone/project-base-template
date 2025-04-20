"use client" // Hooks que usam outros hooks de cliente (useQuery, useMutation, useToast) devem ser client components

import { useQuery, useMutation, useQueryClient, QueryKey } from "@tanstack/react-query"
import { createClient } from "@/lib/supabase/client" // Cliente Supabase para browser
import { toast } from "sonner" // Usando o toast do sonner

// Interface para tipar os dados da tabela 'items' do nosso banco
// É uma boa prática definir interfaces para os dados que vêm da API/DB
export interface Item {
  id: string // UUID é string em JS/TS
  user_id: string
  title: string
  description: string | null // Pode ser nulo no banco
  is_complete: boolean
  created_at: string // Timestamptz vem como string ISO 8601
  updated_at: string
}
// Tipos para os dados que enviamos ao criar ou atualizar um item.
// Omitimos campos que são gerenciados pelo banco (id, user_id, created_at, updated_at).
export type NewItem = Pick<Item, "title" | "description"> // Apenas title e description são necessários para criar
export type UpdateItemData = Partial<Pick<Item, "title" | "description" | "is_complete">> // Permite atualizar qualquer um desses campos

// Chave de query base para os itens. Usada pelo TanStack Query para identificar e gerenciar o cache desta query.
// É um array que pode conter strings ou objetos.
const itemsQueryKey: QueryKey = ["items"]

// --- Hook customizado para BUSCAR todos os itens do usuário logado ---
export function useItems() {
  const supabase = createClient() // Cria cliente Supabase (browser)

  // useQuery: Hook principal do TanStack Query para buscar dados.
  return useQuery<Item[], Error>({ // Tipagem explícita: retorna um array de Item[] ou um Error
    queryKey: itemsQueryKey, // Chave única para esta query no cache
    queryFn: async () => { // Função assíncrona que busca os dados
      const { data, error, status } = await supabase
        .from("items") // Da tabela 'items'
        .select("*") // Seleciona todas as colunas
        .order("created_at", { ascending: false }) // Ordena pelos mais recentes primeiro

      // Tratamento de erro específico da Supabase
      if (error) {
        console.error("Erro ao buscar itens:", status, error.message)
        // Mostra um toast de erro. O toast do sonner é simples.
        toast.error("Erro ao carregar itens", { description: error.message })
        throw new Error(error.message) // Lança o erro para que o TanStack Query o capture (e coloque no estado 'error')
      }
      // Se não houver erro, retorna os dados (ou um array vazio se data for null/undefined)
      return data || []
    },
    // Opções adicionais do useQuery podem ser colocadas aqui:
    // enabled: false, // Para desabilitar a query inicialmente
    // refetchInterval: 5000, // Para fazer refetch a cada 5 segundos
  })
}

// --- Hook customizado para ADICIONAR um novo item ---
export function useAddItem() {
  const supabase = createClient()
  const queryClient = useQueryClient() // Hook para acessar a instância do QueryClient (para invalidar cache, etc.)

  // useMutation: Hook do TanStack Query para operações que modificam dados (POST, PUT, DELETE).
  return useMutation<Item, Error, NewItem>({ // Tipos: Retorno da mutationFn (Item), Erro (Error), Input da mutationFn (NewItem)
    mutationFn: async (newItem) => { // Função assíncrona que executa a mutação
      // Busca o usuário autenticado para obter o ID
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        // Lança um erro claro se não conseguir obter o usuário (não deveria acontecer se chegou aqui)
        throw new Error("Usuário não autenticado. Não é possível adicionar item.");
      }
      // Monta o objeto completo para inserção, incluindo o user_id
      const itemData = { ...newItem, user_id: user.id };

      const { data, error } = await supabase
        .from("items")
        .insert(itemData) // <--- Usa itemData com user_id
        .select() // Pede para retornar o registro inserido
        .single() // Espera que retorne exatamente um registro

      if (error) {
         console.error("Erro ao adicionar item:", error.message)
         throw new Error(error.message) // Lança erro para o onError tratar
      }
      if (!data) {
          // Isso não deveria acontecer se o insert foi bem-sucedido, mas é uma checagem extra.
          throw new Error("Nenhum dado retornado após inserção.");
      }
      // Retorna o item recém-criado (será passado para o onSuccess)
      return data
    },
    // Callbacks que rodam após a mutação:
    onSuccess: (newItemData) => { // Roda se mutationFn for bem-sucedida
      // Mostra um toast de sucesso
      toast.success("Item Adicionado!", { description: `"${newItemData.title}" foi criado.`})
      // Invalida o cache da query 'items'. Isso diz ao TanStack Query que os dados
      // cacheados para a chave 'items' estão desatualizados e precisam ser buscados novamente
      // na próxima vez que o hook useItems for renderizado.
      queryClient.invalidateQueries({ queryKey: itemsQueryKey })

      // Opcional: Atualização Otimista (Update Otimista) - Mais avançado
      // Antes da mutação começar (no onMutate), você adicionaria o novo item ao cache localmente.
      // Se a mutação falhar (no onError), você reverteria essa adição.
      // Se tiver sucesso (onSuccess ou onSettled), você confirma ou invalida como acima.
      // Exemplo simples de adicionar ao cache (não inclui rollback em caso de erro):
      // queryClient.setQueryData(itemsQueryKey, (oldData: Item[] | undefined) => [newItemData, ...(oldData || [])] )
    },
     onError: (error) => { // Roda se mutationFn lançar um erro
         // Mostra um toast de erro genérico para esta mutação
         toast.error("Erro ao adicionar item", { description: error.message })
         console.error("Mutation Error (AddItem):", error.message)
     }
  })
}

// --- Hook customizado para ATUALIZAR um item existente ---
export function useUpdateItem() {
  const supabase = createClient()
  const queryClient = useQueryClient()

  // Tipos: Retorno (Item), Erro (Error), Input ({ id: string, data: UpdateItemData })
  // O input agora é um objeto contendo o ID do item e os dados a serem atualizados.
  return useMutation<Item, Error, { id: string; data: UpdateItemData }>({ 
    mutationFn: async ({ id, data }) => { // Recebe o objeto como argumento
      const { data: updatedItem, error } = await supabase
        .from("items")
        .update(data) // Aplica as atualizações (ex: { is_complete: true })
        .eq("id", id) // Onde o ID corresponde
        // A política RLS UPDATE garante que só o dono possa fazer isso (USING auth.uid() = user_id)
        .select() // Retorna o item atualizado
        .single() // Espera um único resultado

      if (error) {
         console.error("Erro ao atualizar item:", error.message)
         throw new Error(error.message)
      }
       if (!updatedItem) {
          throw new Error("Nenhum dado retornado após atualização.");
      }
      // Retorna o item atualizado
      return updatedItem
    },
    onSuccess: (updatedItemData) => {
       toast.success("Item Atualizado", { description: `"${updatedItemData.title}" foi modificado.` })
       // Invalida o cache para buscar a lista atualizada
       queryClient.invalidateQueries({ queryKey: itemsQueryKey })

       // Opcional: Atualização otimista
       // Encontra o item no cache e o atualiza localmente antes do refetch.
       // queryClient.setQueryData(itemsQueryKey, (oldData: Item[] | undefined) =>
       //    oldData?.map(item => item.id === updatedItemData.id ? updatedItemData : item) || []
       // )
    },
    onError: (error) => {
         toast.error("Erro ao atualizar item", { description: error.message })
         console.error("Mutation Error (UpdateItem):", error.message)
    }
  })
}

// --- Hook customizado para EXCLUIR um item ---
export function useDeleteItem() {
  const supabase = createClient()
  const queryClient = useQueryClient()

  // Tipos: Retorno (string - o ID do item excluído), Erro (Error), Input (string - ID do item)
  return useMutation<string, Error, string>({ 
    mutationFn: async (id) => { // Recebe o ID do item a ser excluído
      const { error } = await supabase
        .from("items")
        .delete() // Deleta
        .eq("id", id) // Onde o ID corresponde
        // A política RLS DELETE garante permissão (USING auth.uid() = user_id)

      if (error) {
         console.error("Erro ao excluir item:", error.message)
         throw new Error(error.message)
      }
      // Retorna o ID em caso de sucesso, útil para atualização otimista ou logs
      return id
    },
    onSuccess: () => {
       toast.success("Item Excluído", { description: "O item foi removido com sucesso."}) 
       // Invalida o cache para remover o item da lista
       queryClient.invalidateQueries({ queryKey: itemsQueryKey })
    },
    onError: (error) => {
         toast.error("Erro ao excluir item", { description: error.message })
         console.error("Mutation Error (DeleteItem):", error.message)
    }
  })
} 