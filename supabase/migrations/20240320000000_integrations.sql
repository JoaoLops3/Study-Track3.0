-- Criar tabela de integrações
CREATE TABLE IF NOT EXISTS public.integrations (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  provider TEXT NOT NULL,
  access_token TEXT,
  refresh_token TEXT,
  expires_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Função para criar a tabela de integrações
CREATE OR REPLACE FUNCTION create_integrations_table()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  IF NOT EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'integrations') THEN
    CREATE TABLE public.integrations (
      id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
      user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
      provider TEXT NOT NULL,
      access_token TEXT,
      refresh_token TEXT,
      expires_at TIMESTAMP WITH TIME ZONE,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
      updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
    );
  END IF;
END;
$$;

-- Função para configurar as políticas de integração
CREATE OR REPLACE FUNCTION setup_integration_policies(user_id UUID)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Habilitar RLS
  ALTER TABLE public.integrations ENABLE ROW LEVEL SECURITY;

  -- Criar políticas
  DROP POLICY IF EXISTS "Users can view their own integrations" ON public.integrations;
  CREATE POLICY "Users can view their own integrations"
    ON public.integrations
    FOR SELECT
    USING (auth.uid() = user_id);

  DROP POLICY IF EXISTS "Users can insert their own integrations" ON public.integrations;
  CREATE POLICY "Users can insert their own integrations"
    ON public.integrations
    FOR INSERT
    WITH CHECK (auth.uid() = user_id);

  DROP POLICY IF EXISTS "Users can update their own integrations" ON public.integrations;
  CREATE POLICY "Users can update their own integrations"
    ON public.integrations
    FOR UPDATE
    USING (auth.uid() = user_id);

  DROP POLICY IF EXISTS "Users can delete their own integrations" ON public.integrations;
  CREATE POLICY "Users can delete their own integrations"
    ON public.integrations
    FOR DELETE
    USING (auth.uid() = user_id);
END;
$$; 