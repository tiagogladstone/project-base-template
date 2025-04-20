
# Project Base Template (v0.1.0)

Template inicial para construir aplicações web full-stack modernas com capacidades de IA. Construído com **[Next.js](https://nextjs.org/)**, Supabase, FastAPI, Tailwind CSS e Shadcn/ui, projetado para desenvolvimento 100% em nuvem (ex: GitHub Codespaces).

## Como Usar

Clone este repositório e siga as instruções de configuração detalhadas em: **[<< LINK PARA SUAS NOVAS INSTRUÇÕES AQUI >>]** para configurar seu próprio projeto Supabase, chaves de API, configurações de deploy e começar a construir suas funcionalidades específicas.

## Recursos Incluídos neste Template (v0.1.0)

*   **Ambiente de Desenvolvimento:** Pré-configurado para GitHub Codespaces (`.devcontainer`).
*   **Frontend (Next.js 14+ App Router):**
    *   Configuração com TypeScript, Tailwind CSS, Shadcn/ui.
    *   Layout de UI base, alternador de tema (light/dark) e componentes de UI comuns.
    *   **Fluxo de Autenticação Completo** via Supabase Auth (`@supabase/ssr`): Email/Senha, Magic Link, Google OAuth, Recuperação de Senha, proteção com Middleware.
    *   TanStack Query para gerenciamento de estado do servidor.
    *   Página de exemplo CRUD (`/dashboard/items`) conectada ao Supabase.
    *   Configuração com Vitest/Testing Library para testes de frontend.
    *   Arquivos de configuração do Sentry (requer DSN do usuário).
*   **Backend (Supabase - BaaS):**
    *   Schema do banco de dados (via Migrations) para `profiles`, `items`, `documents` (com políticas RLS).
    *   Extensão `pgvector` habilitada.
*   **Backend (Python/FastAPI - Serviços de IA):**
    *   Estrutura de API pronta para lógica de IA (RAG, CrewAI, Guardrails).
    *   Endpoints e serviços de placeholder.
    *   CORS pré-configurado.
    *   Configuração com Pytest para testes de backend.
    *   Código de integração com Sentry (requer DSN do usuário).
*   **DevOps:**
    *   Configuração básica para deploy na Vercel (Frontend) e Render (Backend). (Requer configuração do usuário).
    *   Arquivos `.env.example` fornecidos para as variáveis de ambiente necessárias.

## Primeiros Passos (Rodando Localmente)

Após seguir as instruções de configuração (veja "Como Usar" acima) e instalar as dependências (`pnpm install`), você pode rodar o servidor de desenvolvimento do frontend:

```bash
pnpm dev
```

Abra [http://localhost:3000](http://localhost:3000) no seu navegador para ver o resultado. Você pode começar a editar a página principal modificando `app/page.tsx`.

*(Observação: O servidor backend Python precisa ser iniciado separadamente na sua própria pasta e ambiente virtual. Consulte as instruções de configuração para mais detalhes.)*

## Aprenda Mais (Next.js)

Para aprender mais sobre Next.js, consulte os seguintes recursos:

-   [Documentação do Next.js](https://nextjs.org/docs) - aprenda sobre recursos e API do Next.js.
-   [Aprenda Next.js](https://nextjs.org/learn) - um tutorial interativo de Next.js.

Você pode conferir o [repositório GitHub do Next.js](https://github.com/vercel/next.js) - feedback e contribuições são bem-vindos!

## Deploy na Vercel

A forma mais fácil de fazer o deploy do seu frontend Next.js é usando a [Plataforma Vercel](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) dos criadores do Next.js.

Consulte a [documentação de deploy do Next.js](https://nextjs.org/docs/app/building-your-application/deploying) para mais detalhes. Lembre-se de configurar suas variáveis de ambiente na Vercel conforme as instruções de configuração.

## Estrutura do Projeto (Visão Geral)

Este template segue uma estrutura organizada para aplicações full-stack:

*   **`/` (Raiz):** Arquivos de configuração principal (Next.js, Tailwind, TypeScript, Vitest, Docker/Codespaces, pnpm, etc.).
*   **`src/`:** Código fonte do frontend Next.js.
    *   `src/app/`: Rotas e páginas principais (usando App Router).
    *   `src/components/`: Componentes React reutilizáveis (incluindo UI da Shadcn em `src/components/ui/`).
    *   `src/lib/`: Utilitários e lógica compartilhada (ex: clientes Supabase, provider TanStack Query).
    *   `src/hooks/`: Hooks React customizados (ex: `useItems` para dados Supabase).
    *   `src/types/`: Definições TypeScript (ex: tipos gerados do Supabase).
*   **`backend/`:** Código fonte do backend Python/FastAPI.
    *   `backend/app/`: Lógica da API FastAPI (main, routers, services, models).
    *   `backend/tests/`: Testes Pytest para o backend.
    *   `backend/venv/`: Ambiente virtual Python (ignorado pelo Git).
    *   `requirements.txt`: Dependências Python.
*   **`public/`:** Arquivos estáticos servidos diretamente (imagens, fontes, etc.).
*   **`supabase/`:** Configuração e migrações do Supabase CLI.
    *   `supabase/migrations/`: Arquivos SQL para versionamento do schema do banco de dados.

*(Observação: Lembre-se de substituir `[<< LINK PARA SUAS NOVAS INSTRUÇÕES AQUI >>]` pelo link real quando tiver as instruções prontas.)*
```