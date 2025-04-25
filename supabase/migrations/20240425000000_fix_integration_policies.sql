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

  -- Criar novas políticas
  CREATE POLICY "Users can view their own integrations"
    ON public.integrations
    FOR SELECT
    USING (auth.uid() = user_id);

  CREATE POLICY "Users can insert their own integrations"
    ON public.integrations
    FOR INSERT
    WITH CHECK (auth.uid() = user_id);

  CREATE POLICY "Users can update their own integrations"
    ON public.integrations
    FOR UPDATE
    USING (auth.uid() = user_id);

  CREATE POLICY "Users can delete their own integrations"
    ON public.integrations
    FOR DELETE
    USING (auth.uid() = user_id);
END;
$$;