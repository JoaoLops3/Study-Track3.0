-- Remover funções existentes
DROP FUNCTION IF EXISTS public.create_integrations_table();
DROP FUNCTION IF EXISTS public.update_boards_updated_at();
DROP FUNCTION IF EXISTS public.handle_updated_at();
DROP FUNCTION IF EXISTS public.create_initial_board();
DROP FUNCTION IF EXISTS public.can_access_board(UUID);
DROP FUNCTION IF EXISTS public.setup_integration_policies();
DROP FUNCTION IF EXISTS public.update_updated_at_column();

-- Corrigir search_path para create_integrations_table
CREATE OR REPLACE FUNCTION public.create_integrations_table()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Criar tabela de integrações se não existir
  CREATE TABLE IF NOT EXISTS public.integrations (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    provider TEXT NOT NULL CHECK (provider IN ('figma', 'discord', 'github', 'google_calendar')),
    access_token TEXT NOT NULL,
    refresh_token TEXT,
    expires_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
  );

  -- Habilitar RLS
  ALTER TABLE public.integrations ENABLE ROW LEVEL SECURITY;
  
  RETURN;
END;
$$;

-- Corrigir search_path para update_boards_updated_at
CREATE OR REPLACE FUNCTION public.update_boards_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = timezone('utc'::text, now());
  RETURN NEW;
END;
$$;

-- Corrigir search_path para handle_updated_at
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = timezone('utc'::text, now());
  RETURN NEW;
END;
$$;

-- Corrigir search_path para create_initial_board
CREATE OR REPLACE FUNCTION public.create_initial_board()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  new_board_id UUID;
  coluna1_id UUID;
  coluna2_id UUID;
  coluna3_id UUID;
BEGIN
  -- Verificar se já existe um board inicial
  IF EXISTS (
    SELECT 1 FROM public.boards 
    WHERE owner_id = NEW.id AND title = 'Meu Primeiro Board'
  ) THEN
    RETURN NEW;
  END IF;

  -- Iniciar transação
  BEGIN
    -- Criar o board inicial
    INSERT INTO public.boards (title, description, owner_id, is_public)
    VALUES (
      'Meu Primeiro Board',
      'Este é seu primeiro board. Você pode editá-lo ou criar novos!',
      NEW.id,
      false
    )
    RETURNING id INTO new_board_id;

    -- Criar as colunas padrão
    INSERT INTO public.columns (title, board_id, "order")
    VALUES 
      ('To Do', new_board_id, 0),
      ('In Progress', new_board_id, 1),
      ('Done', new_board_id, 2)
    RETURNING id INTO coluna1_id, coluna2_id, coluna3_id;

    -- Criar alguns cards de exemplo
    INSERT INTO public.cards (title, description, column_id, position)
    VALUES 
      ('Bem-vindo!', 'Este é seu primeiro card. Você pode arrastá-lo entre as colunas!', coluna1_id, 0),
      ('Edite este card', 'Clique em um card para editar seu conteúdo', coluna2_id, 0),
      ('Crie novos cards', 'Use o botão + para criar novos cards', coluna3_id, 0);

    RETURN NEW;
  EXCEPTION
    WHEN OTHERS THEN
      -- Log do erro
      RAISE NOTICE 'Erro ao criar board inicial: %', SQLERRM;
      -- Reverter a transação
      ROLLBACK;
      -- Retornar NEW mesmo em caso de erro para não bloquear a criação do usuário
      RETURN NEW;
  END;
END;
$$;

-- Corrigir search_path para can_access_board
CREATE OR REPLACE FUNCTION public.can_access_board(board_id UUID)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.boards
    WHERE id = board_id
    AND (owner_id = auth.uid() OR is_public = true)
  );
END;
$$;

-- Corrigir search_path para setup_integration_policies
CREATE OR REPLACE FUNCTION public.setup_integration_policies()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Primeiro, dropar as políticas existentes
  DROP POLICY IF EXISTS "Users can view their own integrations" ON public.integrations;
  DROP POLICY IF EXISTS "Users can insert their own integrations" ON public.integrations;
  DROP POLICY IF EXISTS "Users can update their own integrations" ON public.integrations;
  DROP POLICY IF EXISTS "Users can delete their own integrations" ON public.integrations;
  DROP POLICY IF EXISTS "integrations_select_policy" ON public.integrations;
  DROP POLICY IF EXISTS "integrations_insert_policy" ON public.integrations;
  DROP POLICY IF EXISTS "integrations_update_policy" ON public.integrations;
  DROP POLICY IF EXISTS "integrations_delete_policy" ON public.integrations;

  -- Política de leitura: usuário só pode ver suas próprias integrações
  CREATE POLICY "integrations_select_policy"
    ON public.integrations
    FOR SELECT
    USING (auth.uid() = user_id);

  -- Política de inserção: usuário só pode criar suas próprias integrações
  CREATE POLICY "integrations_insert_policy"
    ON public.integrations
    FOR INSERT
    WITH CHECK (auth.uid() = user_id);

  -- Política de atualização: usuário só pode atualizar suas próprias integrações
  CREATE POLICY "integrations_update_policy"
    ON public.integrations
    FOR UPDATE
    USING (auth.uid() = user_id);

  -- Política de deleção: usuário só pode deletar suas próprias integrações
  CREATE POLICY "integrations_delete_policy"
    ON public.integrations
    FOR DELETE
    USING (auth.uid() = user_id);
END;
$$;

-- Corrigir search_path para update_updated_at_column
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = timezone('utc'::text, now());
  RETURN NEW;
END;
$$; 