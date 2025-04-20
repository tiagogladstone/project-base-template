-- Copie e cole este conteúdo TODO para o arquivo de migração SQL recém-criado:

-- Fase 4: Migração Inicial do Banco de Dados

-- Habilita a extensão UUID se ainda não estiver habilitada (geralmente está por padrão)
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
-- Habilita a extensão pgvector para funcionalidades de IA (RAG)
-- Se der erro aqui no 'db push', pode ser que a extensão não esteja disponível no seu plano Supabase.
-- Nesse caso, comente esta linha ou remova a tabela 'documents' e a função 'match_documents'.
CREATE EXTENSION IF NOT EXISTS vector;

----------------------------------------
-- Tabela de Perfis (public.profiles)
----------------------------------------
-- Guarda informações públicas dos usuários, vinculadas à tabela de autenticação 'auth.users'
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE, -- Chave estrangeira ligada ao usuário autenticado. Se o usuário for deletado em auth.users, o perfil também será.
  username TEXT UNIQUE, -- Nome de usuário opcional e único. Pode ser usado para URLs amigáveis ou menções.
  full_name TEXT,       -- Nome completo do usuário.
  avatar_url TEXT,      -- URL para a imagem de avatar do usuário (pode ser do Supabase Storage).
  bio TEXT,             -- Uma pequena biografia ou descrição.
  created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL, -- Timestamp de criação (sempre em UTC).
  updated_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL  -- Timestamp da última atualização (sempre em UTC).
);

-- Adiciona comentários às tabelas e colunas para documentação no banco de dados.
COMMENT ON TABLE public.profiles IS 'Stores public profile information for each user.';
COMMENT ON COLUMN public.profiles.id IS 'References the internal auth.users table.';

-- Habilita Row Level Security (RLS) para a tabela de perfis. ESSENCIAL para segurança!
-- Isso garante que nenhuma linha possa ser acessada ou modificada a menos que uma política permita explicitamente.
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
-- Força RLS mesmo para o dono da tabela (postgres user). Boa prática para garantir que as políticas sejam sempre aplicadas.
ALTER TABLE public.profiles FORCE ROW LEVEL SECURITY;

-- Políticas RLS para profiles: Definem QUEM pode fazer O QUÊ com os dados.
-- 1. Permitir que qualquer pessoa (autenticada ou não) leia perfis. Útil para páginas de perfil públicas.
--    'USING (true)' significa que a condição para SELECT é sempre verdadeira.
CREATE POLICY "Allow public read access to profiles" ON public.profiles FOR SELECT USING (true);

-- 2. Permitir que usuários autenticados insiram/atualizem seu próprio perfil.
--    `auth.uid()` retorna o ID do usuário autenticado na requisição atual.
--    `WITH CHECK (auth.uid() = id)` garante que um usuário só possa inserir/modificar uma linha onde o 'id' corresponda ao seu próprio ID.
--    (Nota: O trigger handle_new_user geralmente cuida da inserção inicial, mas esta política é útil para updates via INSERT ... ON CONFLICT).
CREATE POLICY "Allow authenticated users to insert/update their own profile" ON public.profiles FOR INSERT WITH CHECK (auth.uid() = id);
CREATE POLICY "Allow authenticated users to update their own profile" ON public.profiles FOR UPDATE USING (auth.uid() = id) WITH CHECK (auth.uid() = id);

-- 3. (Opcional, geralmente não recomendado permitir delete direto) Permitir que usuários deletem seu próprio perfil.
-- CREATE POLICY "Allow authenticated users to delete their own profile" ON public.profiles FOR DELETE USING (auth.uid() = id);
-- Em vez disso, a exclusão geralmente acontece via Supabase Auth e o ON DELETE CASCADE cuida do perfil.


----------------------------------------
-- Tabela de Itens (public.items) - Exemplo de dados específicos do usuário
----------------------------------------
-- Tabela para armazenar itens, tarefas, notas, etc., pertencentes a um usuário específico.
CREATE TABLE IF NOT EXISTS public.items (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY, -- Chave primária UUID gerada automaticamente. `gen_random_uuid()` vem da extensão pgcrypto (geralmente habilitada).
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE, -- Chave estrangeira obrigatória vinculando o item ao seu dono. Se o usuário for deletado, seus itens também serão.
  title TEXT NOT NULL CHECK (char_length(title) > 0 AND char_length(title) <= 280), -- Título obrigatório, com validação de tamanho no banco.
  description TEXT CHECK (char_length(description) <= 1000), -- Descrição opcional, com validação de tamanho.
  is_complete BOOLEAN DEFAULT FALSE NOT NULL, -- Status de completude do item, padrão para falso.
  created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Comentários para a tabela de itens.
COMMENT ON TABLE public.items IS 'Stores user-specific items, tasks, or notes.';
COMMENT ON COLUMN public.items.user_id IS 'The user who owns this item.';

-- Cria um índice na coluna `user_id`. Isso acelera muito as buscas que filtram por usuário (ex: "SELECT * FROM items WHERE user_id = auth.uid()").
CREATE INDEX IF NOT EXISTS items_user_id_idx ON public.items(user_id);

-- Habilita e força RLS para a tabela de itens. CRÍTICO para que usuários só vejam seus próprios itens.
ALTER TABLE public.items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.items FORCE ROW LEVEL SECURITY;

-- Políticas RLS para items: Garantem que cada usuário só possa manipular seus próprios itens.
-- 1. SELECT: Permite ler apenas as linhas onde `user_id` é igual ao ID do usuário autenticado.
CREATE POLICY "Allow users to read their own items" ON public.items FOR SELECT USING (auth.uid() = user_id);
-- 2. INSERT: Permite inserir novas linhas APENAS SE o `user_id` da nova linha for igual ao ID do usuário autenticado.
CREATE POLICY "Allow users to insert their own items" ON public.items FOR INSERT WITH CHECK (auth.uid() = user_id);
-- 3. UPDATE: Permite atualizar linhas existentes APENAS SE o `user_id` da linha for igual ao ID do usuário autenticado. A cláusula WITH CHECK (opcional aqui, mas boa prática) garante que o `user_id` não possa ser modificado para outro usuário.
CREATE POLICY "Allow users to update their own items" ON public.items FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
-- 4. DELETE: Permite deletar linhas existentes APENAS SE o `user_id` da linha for igual ao ID do usuário autenticado.
CREATE POLICY "Allow users to delete their own items" ON public.items FOR DELETE USING (auth.uid() = user_id);


----------------------------------------
-- Tabela de Documentos (public.documents) - Para RAG/IA
----------------------------------------
-- Armazena chunks de texto e seus embeddings vetoriais para busca por similaridade (RAG).
CREATE TABLE IF NOT EXISTS public.documents (
 id BIGSERIAL PRIMARY KEY, -- Chave primária serial. Mais simples que UUID para esta tabela interna.
 content TEXT NOT NULL,    -- O conteúdo textual do chunk/documento.
 metadata JSONB DEFAULT '{}'::jsonb, -- Metadados flexíveis (ex: nome do arquivo fonte, número da página, URL, tags). JSONB é eficiente para buscas.
 embedding vector(1536), -- O vetor de embedding. A dimensão (1536) DEVE CORRESPONDER ao modelo de embedding que você usará (ex: text-embedding-ada-002 da OpenAI usa 1536). Verifique a documentação do seu modelo!
 created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Comentários
COMMENT ON TABLE public.documents IS 'Stores text chunks and their vector embeddings for RAG.';
COMMENT ON COLUMN public.documents.embedding IS 'Vector representation for similarity search. Dimension depends on the embedding model.';
COMMENT ON COLUMN public.documents.metadata IS 'Flexible metadata about the document chunk (e.g., source file, page number).';

-- Cria índice GIN em metadados. Permite buscas eficientes dentro do JSONB (ex: WHERE metadata->>'source' = 'myfile.pdf').
CREATE INDEX IF NOT EXISTS documents_metadata_idx ON public.documents USING gin (metadata);

-- Cria índice para busca vetorial. Essencial para performance de RAG.
-- Use HNSW (recomendado para pgvector >= 0.5.0) ou IVFFlat.
-- Ajuste os parâmetros conforme necessário (m, ef_construction para HNSW; lists para IVFFlat).
-- `vector_cosine_ops` indica que usaremos similaridade de cosseno, comum para embeddings de texto.
-- HNSW:
CREATE INDEX IF NOT EXISTS documents_embedding_hnsw_idx ON public.documents USING hnsw (embedding vector_cosine_ops);
-- IVFFlat (Alternativa, pode ser melhor para datasets muito grandes):
-- CREATE INDEX IF NOT EXISTS documents_embedding_ivfflat_idx ON public.documents USING ivfflat (embedding vector_cosine_ops) WITH (lists = 100); -- Ajuste 'lists'

-- Habilita e força RLS para a tabela de documentos.
ALTER TABLE public.documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.documents FORCE ROW LEVEL SECURITY;

-- Políticas RLS para documents: Controle de acesso aos dados para RAG.
-- EXEMPLO 1: Permitir que qualquer usuário autenticado leia todos os documentos (RAG compartilhado).
CREATE POLICY "Allow authenticated users to read documents" ON public.documents FOR SELECT USING (auth.role() = 'authenticated');

-- EXEMPLO 2 (Comentado): Permitir leitura baseada em metadados (ex: pertence a um grupo específico).
-- CREATE POLICY "Allow users to read documents based on metadata group" ON public.documents
-- FOR SELECT USING (
--   metadata->>'allowed_group' = (SELECT user_group FROM public.profiles WHERE id = auth.uid()) -- Supõe uma coluna 'user_group' em profiles
-- );

-- EXEMPLO 3: Permitir escrita/deleção apenas pela role de serviço (usada pelo backend Python com a chave de serviço).
-- Isso impede que usuários comuns modifiquem os dados de RAG diretamente pela API pública.
CREATE POLICY "Allow service_role to manage documents" ON public.documents FOR ALL USING (auth.role() = 'service_role');


----------------------------------------
-- Funções e Triggers Utilitários
----------------------------------------

-- Função genérica para atualizar automaticamente a coluna 'updated_at' em qualquer tabela que a possua.
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  -- Define o campo NEW.updated_at (o registro sendo atualizado) para o timestamp atual em UTC.
  NEW.updated_at = timezone('utc'::text, now());
  RETURN NEW; -- Retorna o registro modificado para que o UPDATE prossiga.
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
-- SECURITY DEFINER: Permite que a função seja executada com os privilégios de quem a DEFINIU (geralmente um superusuário),
-- o que é necessário para modificar tabelas que podem ter RLS restritivas para o usuário que disparou o trigger.

-- Trigger para chamar handle_updated_at ANTES de qualquer UPDATE na tabela profiles.
DROP TRIGGER IF EXISTS on_profile_update_set_timestamp ON public.profiles; -- Remove trigger antigo se existir, para idempotência.
CREATE TRIGGER on_profile_update_set_timestamp
BEFORE UPDATE ON public.profiles -- Dispara antes da operação de UPDATE
FOR EACH ROW -- Executa para cada linha afetada pelo UPDATE
EXECUTE FUNCTION public.handle_updated_at(); -- Chama a função definida acima

-- Trigger para chamar handle_updated_at ANTES de qualquer UPDATE na tabela items.
DROP TRIGGER IF EXISTS on_item_update_set_timestamp ON public.items;
CREATE TRIGGER on_item_update_set_timestamp
BEFORE UPDATE ON public.items
FOR EACH ROW
EXECUTE FUNCTION public.handle_updated_at();


-- Função para criar automaticamente um registro na tabela 'profiles' quando um novo usuário se cadastra em 'auth.users'.
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
  user_email TEXT;
  user_full_name TEXT;
  max_retries INT := 3;
  retry_delay INTERVAL := '1 second';
  retries INT := 0;
BEGIN
    -- Obtém o email do novo usuário (NEW se refere ao registro inserido em auth.users).
    user_email := NEW.email;
    -- Tenta obter o nome completo dos metadados brutos (pode ser fornecido no signup via API/Client).
    user_full_name := NEW.raw_user_meta_data->>'full_name';

    -- Loop com retries para robustez contra possíveis locks momentâneos.
    LOOP
        BEGIN
            -- Tenta inserir o novo perfil. A chave primária 'id' vem do 'NEW.id' de auth.users.
            INSERT INTO public.profiles (id, username, full_name)
            VALUES (
                NEW.id,
                user_email, -- Usa o email como username inicial (pode ser atualizado depois).
                user_full_name -- Usa o nome completo se disponível, senão será NULL.
            )
            -- Se um perfil com esse ID já existir (improvável, mas seguro garantir), não faz nada.
            ON CONFLICT (id) DO NOTHING;

            -- Se a inserção (ou o DO NOTHING) for bem-sucedida, sai do loop.
            EXIT;

        EXCEPTION
            -- Captura qualquer exceção durante a tentativa de INSERT.
            WHEN OTHERS THEN
                retries := retries + 1; -- Incrementa contador de tentativas.
                IF retries >= max_retries THEN
                    -- Se exceder as tentativas, loga um aviso e desiste (não impede o signup).
                    RAISE WARNING '[handle_new_user] Failed to create profile for user_id % after % retries: %', NEW.id, retries, SQLERRM;
                    EXIT; -- Sai do loop.
                END IF;
                -- Espera um pouco antes de tentar novamente.
                PERFORM pg_sleep(retry_delay::text::numeric);
                RAISE NOTICE '[handle_new_user] Retry % for user_id %: %', retries, NEW.id, SQLERRM;
        END;
    END LOOP;

  -- Retorna o registro NEW (inalterado por esta função) para que o trigger AFTER INSERT em auth.users possa continuar.
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER; -- SECURITY DEFINER necessário para poder inserir na tabela public.profiles.

-- Trigger que chama a função handle_new_user DEPOIS que um novo usuário é inserido em auth.users.
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
AFTER INSERT ON auth.users -- Dispara após a inserção do usuário na tabela de autenticação.
FOR EACH ROW -- Para cada novo usuário inserido.
EXECUTE FUNCTION public.handle_new_user(); -- Chama a função que cria o perfil correspondente.


----------------------------------------
-- Função para Busca por Similaridade (RAG)
----------------------------------------
-- Função SQL que pode ser chamada via RPC (Remote Procedure Call) pelo Supabase Client
-- para encontrar documentos relevantes para uma pergunta do usuário.
CREATE OR REPLACE FUNCTION match_documents (
  query_embedding vector(1536), -- O vetor da pergunta do usuário (a dimensão DEVE corresponder à da coluna 'embedding').
  match_threshold float,        -- Limiar de similaridade. Documentos com similaridade abaixo disso serão descartados. (Ex: 0.75)
  match_count int,              -- Número máximo de documentos semelhantes a retornar. (Ex: 5)
  filter_metadata jsonb DEFAULT '{}'::jsonb -- Filtro opcional JSONB para restringir a busca a documentos com metadados específicos.
)
RETURNS TABLE ( -- Define a estrutura do resultado retornado.
  id bigint,
  content text,
  metadata jsonb,
  similarity float -- A pontuação de similaridade calculada.
)
LANGUAGE sql STABLE PARALLEL SAFE -- SQL: Função escrita em SQL puro. STABLE: Não modifica o banco e retorna os mesmos resultados para os mesmos inputs dentro de uma transação. PARALLEL SAFE: Seguro para ser executado em paralelo.
AS $$
  SELECT
    documents.id,
    documents.content,
    documents.metadata,
    -- Calcula a similaridade do cosseno. O operador '<=>' calcula a distância do cosseno (0 = idêntico, 2 = oposto).
    -- Subtraímos de 1 para obter a similaridade (1 = idêntico, -1 = oposto).
    1 - (documents.embedding <=> query_embedding) AS similarity
  FROM documents
  -- Aplica o filtro de metadados ANTES da busca vetorial, se um filtro for fornecido.
  -- O operador JSONB '@>' verifica se o `metadata` da linha contém todos os pares chave/valor do `filter_metadata`.
  WHERE metadata @> filter_metadata
    -- Filtra os resultados para incluir apenas aqueles ACIMA do limiar de similaridade.
    -- Esta condição é aplicada DEPOIS do cálculo da distância, otimizada pelo índice vetorial.
    AND 1 - (documents.embedding <=> query_embedding) > match_threshold
  -- Ordena os resultados pela similaridade, do mais similar (maior valor) para o menos similar.
  ORDER BY similarity DESC
  -- Limita o número de resultados retornados ao `match_count` especificado.
  LIMIT match_count;
$$;