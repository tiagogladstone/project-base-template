"use client" // Necessário para usar hooks (useState) e o contexto do provider

import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
// Opcional: Ferramentas de desenvolvimento para React Query.
// Descomente a linha abaixo e a inclusão no JSX se quiser usá-las.
// import { ReactQueryDevtools } from "@tanstack/react-query-devtools"
import { useState } from "react"

export default function TanstackQueryProvider({
  children,
}: {
  children: React.ReactNode
}) {
  // Cria uma instância do QueryClient uma vez por renderização do provider.
  // Usar useState garante que a mesma instância seja reutilizada em re-renders,
  // evitando que o cache seja perdido a cada renderização.
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            // staleTime: Tempo em milissegundos que os dados são considerados "frescos".
            // Durante este tempo, o React Query retornará os dados do cache sem fazer refetch.
            // Após este tempo, os dados são "stale" (velhos) e um refetch pode ocorrer
            // (dependendo de outras configurações como refetchOnWindowFocus).
            staleTime: 60 * 1000, // 1 minuto (ajuste conforme a necessidade da sua aplicação)

            // refetchOnWindowFocus: Buscar dados novamente quando a janela/aba do navegador
            // ganha foco? Útil para manter os dados atualizados, mas pode gerar muitas requisições.
            // Definimos como false para um comportamento mais previsível inicialmente.
            refetchOnWindowFocus: false,

            // retry: Quantas vezes tentar refetch automaticamente em caso de erro na query.
            retry: 1, // Tenta mais 1 vez após a falha inicial.
          },
        },
      })
  )

  return (
    // Fornece a instância do QueryClient para toda a árvore de componentes abaixo dele.
    <QueryClientProvider client={queryClient}>
      {children}
      {/* Opcional: Ferramentas de Desenvolvimento do React Query.
          Elas só aparecem em ambiente de desenvolvimento e permitem inspecionar
          o cache, forçar refetches, etc. Muito útil para depuração.
          Descomente para usar: */}
      {/* <ReactQueryDevtools initialIsOpen={false} /> */}
    </QueryClientProvider>
  )
} 