-- Criar tabela de integrações
CREATE TABLE IF NOT EXISTS public.integrations (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  provider TEXT NOT NULL CHECK (provider IN ('figma', 'discord', 'google_calendar')),
  access_token TEXT NOT NULL,
  refresh_token TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Habilitar RLS
ALTER TABLE public.integrations ENABLE ROW LEVEL SECURITY;

-- Criar função para criar a tabela
CREATE OR REPLACE FUNCTION public.create_integrations_table()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN;
END;
$$;

-- Criar função para configurar políticas
CREATE OR REPLACE FUNCTION public.setup_integration_policies(user_id UUID)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  DROP POLICY IF EXISTS "Users can view their own integrations" ON public.integrations;
  DROP POLICY IF EXISTS "Users can insert their own integrations" ON public.integrations;
  DROP POLICY IF EXISTS "Users can update their own integrations" ON public.integrations;
  DROP POLICY IF EXISTS "Users can delete their own integrations" ON public.integrations;

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

-- Criar função para atualizar updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Criar trigger para atualizar updated_at
CREATE TRIGGER update_integrations_updated_at
BEFORE UPDATE ON public.integrations
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column(); 