"use client" // Precisa ser client para usar formulário (react-hook-form) e hooks de mutação

import { useRouter } from "next/navigation" // Para redirecionar após sucesso
import { z } from "zod" // Para validação de schema
import { useForm } from "react-hook-form" // Para gerenciar o estado e validação do formulário
import { zodResolver } from "@hookform/resolvers/zod" // Adaptador Zod para react-hook-form
import { useAddItem } from "@/hooks/use-items" // Nosso hook de mutação para adicionar item
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form" // Componentes de formulário Shadcn/ui
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea" // Campo para descrição
// Não precisamos do toast aqui, pois o hook useAddItem já mostra
import { Loader2 } from "lucide-react" // Ícone de loading

// Define o schema de validação usando Zod
const formSchema = z.object({
  // Título: string, remove espaços extras, mínimo 3 caracteres, máximo 280
  title: z.string()
           .trim()
           .min(3, { message: "O título deve ter pelo menos 3 caracteres."})
           .max(280, { message: "O título não pode exceder 280 caracteres."}),
  // Descrição: string, remove espaços extras, máximo 1000 caracteres, opcional (pode ser string vazia ou null)
  description: z.string()
                 .trim()
                 .max(1000, { message: "A descrição não pode exceder 1000 caracteres."})
                 .optional() // Torna o campo opcional
                 .nullable(), // Permite explicitamente que seja null
})

// In fere o tipo dos valores do formulário a partir do schema Zod
type FormValues = z.infer<typeof formSchema>

export default function NewItemForm() {
  // --- Hooks ---
  const addItemMutation = useAddItem() // Pega a função de mutação e o estado do hook
  const router = useRouter() // Hook do Next.js para navegação programática

  // --- Configuração do Formulário ---
  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema), // Conecta a validação Zod ao formulário
    defaultValues: { // Valores iniciais dos campos
      title: "",
      description: "", // Começa como string vazia, mas Zod/RHF tratará como null/undefined se opcional
    },
  })

  // --- Função de Submissão ---
  // Chamada quando o formulário é submetido E passa na validação do Zod
  const onSubmit = (values: FormValues) => {
    console.log("Submetendo novo item:", values) // Log para depuração
    // Chama a função 'mutate' do hook useAddItem
    addItemMutation.mutate(
      {
        title: values.title, // Título validado
        // Passa null para o Supabase se a descrição for vazia/nula, caso contrário passa o valor (trimmed)
        description: values.description?.trim() || null,
      },
      { // Callbacks opcionais específicos para esta chamada de mutação
        onSuccess: (newItemData) => {
          // O toast de sucesso já é mostrado pelo hook useAddItem
          console.log("Item criado com sucesso:", newItemData)
          // Redireciona de volta para a lista de itens após sucesso
          router.push("/dashboard/items")
          // Poderia resetar o formulário se quisesse: form.reset()
        },
        onError: (error) => {
          // O toast de erro já é mostrado pelo hook useAddItem
          console.error("Falha ao criar item (callback onError no componente):", error)
          // Poderia fazer algo extra aqui, como focar no primeiro campo com erro
        }
      }
    )
  }

  // --- Renderização ---
  return (
    // O componente <Form> do react-hook-form provê o contexto necessário para os <FormField>
    <Form {...form}>
      {/* Passa o estado de 'disabled' para o form se a mutação estiver ocorrendo */}
      {/* Usamos form.handleSubmit para envolver nossa função onSubmit, ele cuida da validação */}
      <form
         onSubmit={form.handleSubmit(onSubmit)}
         className={`space-y-6 ${addItemMutation.isPending ? 'opacity-70 pointer-events-none' : ''}`} // Desabilita interação visualmente durante o envio
      >
        {/* Campo Título */}
        <FormField
          control={form.control} // Passa o controle do formulário
          name="title" // Nome do campo (corresponde ao schema Zod)
          render={({ field }) => ( // Função que renderiza o campo
            <FormItem>
              <FormLabel>Título *</FormLabel> {/* Label obrigatório */}
              <FormControl>
                {/* Componente Input do Shadcn, passando as props do field e disabled */}
                <Input placeholder="Ex: Comprar mantimentos" {...field} disabled={addItemMutation.isPending} />
              </FormControl>
              <FormDescription>
                O nome principal do seu item ou tarefa.
              </FormDescription>
              <FormMessage /> {/* Exibe a mensagem de erro de validação Zod, se houver */}
            </FormItem>
          )}
        />

        {/* Campo Descrição */}
        <FormField
          control={form.control}
          name="description"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Descrição</FormLabel> {/* Label opcional */}
              <FormControl>
                {/* Componente Textarea do Shadcn */}
                <Textarea
                  placeholder="Adicione detalhes opcionais aqui... (até 1000 caracteres)"
                  rows={4}
                  {...field} // Passa props do react-hook-form
                  disabled={addItemMutation.isPending} // Desabilita durante o envio
                  // Importante: Garante que o valor seja controlado corretamente (string vazia ou valor)
                  // e envia null se o usuário apagar todo o texto.
                  value={field.value ?? ''}
                  onChange={(e) => field.onChange(e.target.value === '' ? null : e.target.value)}
                />
              </FormControl>
              <FormDescription>
                Forneça mais contexto sobre este item (opcional).
              </FormDescription>
              <FormMessage /> {/* Exibe erro de validação Zod */}
            </FormItem>
          )}
        />

        {/* Botão de Submissão */}
        <Button
          type="submit"
          className="w-full"
          // Desabilita o botão enquanto a mutação (envio) está em andamento
          disabled={addItemMutation.isPending}
        >
          {/* Mostra ícone de loading se isPending for true */}
          {addItemMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          {addItemMutation.isPending ? "Salvando..." : "Salvar Item"}
        </Button>
      </form>
    </Form>
  )
} 