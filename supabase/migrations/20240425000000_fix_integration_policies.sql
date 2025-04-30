-- Remover a função antiga
DROP FUNCTION IF EXISTS public.setup_integration_policies;

-- Criar nova função simplificada
CREATE OR REPLACE FUNCTION public.setup_integration_policies()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Habilitar RLS se ainda não estiver habilitado
  ALTER TABLE public.integrations ENABLE ROW LEVEL SECURITY;

  -- Remover políticas existentes
  DROP POLICY IF EXISTS "Users can view their own integrations" ON public.integrations;
  DROP POLICY IF EXISTS "Users can insert their own integrations" ON public.integrations;
  DROP POLICY IF EXISTS "Users can update their own integrations" ON public.integrations;
  DROP POLICY IF EXISTS "Users can delete their own integrations" ON public.integrations;
  DROP POLICY IF EXISTS "integrations_select_policy" ON public.integrations;
  DROP POLICY IF EXISTS "integrations_insert_policy" ON public.integrations;
  DROP POLICY IF EXISTS "integrations_update_policy" ON public.integrations;
  DROP POLICY IF EXISTS "integrations_delete_policy" ON public.integrations;

  -- Criar novas políticas
  CREATE POLICY "integrations_select_policy"
    ON public.integrations
    FOR SELECT
    USING (auth.uid() = user_id);

  CREATE POLICY "integrations_insert_policy"
    ON public.integrations
    FOR INSERT
    WITH CHECK (auth.uid() = user_id);

  CREATE POLICY "integrations_update_policy"
    ON public.integrations
    FOR UPDATE
    USING (auth.uid() = user_id);

  CREATE POLICY "integrations_delete_policy"
    ON public.integrations
    FOR DELETE
    USING (auth.uid() = user_id);

  -- Garantir que a tabela tenha as colunas necessárias
  DO $$
  BEGIN
    IF NOT EXISTS (
      SELECT 1
      FROM information_schema.columns
      WHERE table_schema = 'public'
      AND table_name = 'integrations'
      AND column_name = 'enabled'
    ) THEN
      ALTER TABLE public.integrations ADD COLUMN enabled BOOLEAN DEFAULT false;
    END IF;

    IF NOT EXISTS (
      SELECT 1
      FROM information_schema.columns
      WHERE table_schema = 'public'
      AND table_name = 'integrations'
      AND column_name = 'settings'
    ) THEN
      ALTER TABLE public.integrations ADD COLUMN settings JSONB DEFAULT '{}'::jsonb;
    END IF;
  END $$;
END;
$$;