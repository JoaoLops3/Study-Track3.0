-- Função base para atualizar updated_at
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

-- Remover políticas existentes do user_settings
DROP POLICY IF EXISTS "user_settings_select" ON public.user_settings;
DROP POLICY IF EXISTS "user_settings_insert" ON public.user_settings;
DROP POLICY IF EXISTS "user_settings_update" ON public.user_settings;
DROP POLICY IF EXISTS "user_settings_delete" ON public.user_settings;
DROP POLICY IF EXISTS "user_settings_select_policy" ON public.user_settings;
DROP POLICY IF EXISTS "user_settings_insert_policy" ON public.user_settings;
DROP POLICY IF EXISTS "user_settings_update_policy" ON public.user_settings;
DROP POLICY IF EXISTS "user_settings_delete_policy" ON public.user_settings;

-- Remover políticas existentes do bucket de avatares
DROP POLICY IF EXISTS "avatar_select_policy" ON storage.objects;
DROP POLICY IF EXISTS "avatar_insert_policy" ON storage.objects;
DROP POLICY IF EXISTS "avatar_update_policy" ON storage.objects;
DROP POLICY IF EXISTS "avatar_delete_policy" ON storage.objects;
DROP POLICY IF EXISTS "Avatar images are publicly accessible" ON storage.objects;
DROP POLICY IF EXISTS "Users can upload their own avatar" ON storage.objects;
DROP POLICY IF EXISTS "Users can update their own avatar" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete their own avatar" ON storage.objects;

-- Criar tabela de configurações do usuário
CREATE TABLE IF NOT EXISTS public.user_settings (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  settings JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Habilitar RLS
ALTER TABLE public.user_settings ENABLE ROW LEVEL SECURITY;

-- Criar políticas para user_settings
CREATE POLICY "user_settings_select_policy"
  ON public.user_settings FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "user_settings_insert_policy"
  ON public.user_settings FOR INSERT
  WITH CHECK (auth.uid() = id);

CREATE POLICY "user_settings_update_policy"
  ON public.user_settings FOR UPDATE
  USING (auth.uid() = id);

CREATE POLICY "user_settings_delete_policy"
  ON public.user_settings FOR DELETE
  USING (auth.uid() = id);

-- Criar bucket de avatares
INSERT INTO storage.buckets (id, name, public)
VALUES ('avatars', 'avatars', true)
ON CONFLICT (id) DO NOTHING;

-- Criar políticas para o bucket de avatares
CREATE POLICY "avatar_select_policy"
  ON storage.objects FOR SELECT
  USING (
    bucket_id = 'avatars' AND
    (storage.foldername(name))[1] IS NOT NULL
  );

CREATE POLICY "avatar_insert_policy"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'avatars' AND
    auth.uid()::text = (storage.foldername(name))[1] AND
    (storage.foldername(name))[1] IS NOT NULL
  );

CREATE POLICY "avatar_update_policy"
  ON storage.objects FOR UPDATE
  USING (
    bucket_id = 'avatars' AND
    auth.uid()::text = (storage.foldername(name))[1] AND
    (storage.foldername(name))[1] IS NOT NULL
  );

CREATE POLICY "avatar_delete_policy"
  ON storage.objects FOR DELETE
  USING (
    bucket_id = 'avatars' AND
    auth.uid()::text = (storage.foldername(name))[1] AND
    (storage.foldername(name))[1] IS NOT NULL
  );

-- Criar trigger para atualizar updated_at
DROP TRIGGER IF EXISTS update_user_settings_updated_at ON public.user_settings;
CREATE TRIGGER update_user_settings_updated_at
  BEFORE UPDATE ON public.user_settings
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Criar tabela de integrações
CREATE TABLE IF NOT EXISTS public.integrations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  provider TEXT NOT NULL CHECK (provider IN ('google', 'figma', 'discord', 'github')),
  access_token TEXT NOT NULL,
  refresh_token TEXT,
  expires_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  UNIQUE(user_id, provider)
);

-- Criar tabela de eventos
CREATE TABLE IF NOT EXISTS public.events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  start_date TIMESTAMP WITH TIME ZONE NOT NULL,
  end_date TIMESTAMP WITH TIME ZONE NOT NULL,
  all_day BOOLEAN DEFAULT false,
  location TEXT,
  google_event_id TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  CONSTRAINT valid_dates CHECK (end_date > start_date)
);

-- Criar tabela de boards
CREATE TABLE IF NOT EXISTS public.boards (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT,
  owner_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  is_public BOOLEAN DEFAULT false,
  is_favorite BOOLEAN DEFAULT false,
  tags TEXT[] DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Criar tabela de colunas
CREATE TABLE IF NOT EXISTS public.columns (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  board_id UUID NOT NULL REFERENCES public.boards(id) ON DELETE CASCADE,
  position INTEGER NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Criar tabela de cards
CREATE TABLE IF NOT EXISTS public.cards (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT,
  column_id UUID NOT NULL REFERENCES public.columns(id) ON DELETE CASCADE,
  position INTEGER NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Habilitar RLS em todas as tabelas
ALTER TABLE public.integrations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.boards ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.columns ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cards ENABLE ROW LEVEL SECURITY;

-- Criar políticas para integrations
CREATE POLICY "integrations_select" ON public.integrations
FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "integrations_insert" ON public.integrations
FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "integrations_update" ON public.integrations
FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "integrations_delete" ON public.integrations
FOR DELETE USING (auth.uid() = user_id);

-- Criar políticas para events
CREATE POLICY "events_select" ON public.events
FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "events_insert" ON public.events
FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "events_update" ON public.events
FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "events_delete" ON public.events
FOR DELETE USING (auth.uid() = user_id);

-- Criar políticas para boards
CREATE POLICY "boards_select" ON public.boards
FOR SELECT USING (
  owner_id = auth.uid() OR
  is_public = true
);

CREATE POLICY "boards_insert" ON public.boards
FOR INSERT WITH CHECK (auth.uid() = owner_id);

CREATE POLICY "boards_update" ON public.boards
FOR UPDATE USING (auth.uid() = owner_id);

CREATE POLICY "boards_delete" ON public.boards
FOR DELETE USING (auth.uid() = owner_id);

-- Criar políticas para columns
CREATE POLICY "columns_select" ON public.columns
FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM public.boards
    WHERE boards.id = columns.board_id
    AND (boards.owner_id = auth.uid() OR boards.is_public = true)
  )
);

CREATE POLICY "columns_insert" ON public.columns
FOR INSERT WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.boards
    WHERE boards.id = columns.board_id
    AND boards.owner_id = auth.uid()
  )
);

CREATE POLICY "columns_update" ON public.columns
FOR UPDATE USING (
  EXISTS (
    SELECT 1 FROM public.boards
    WHERE boards.id = columns.board_id
    AND boards.owner_id = auth.uid()
  )
);

CREATE POLICY "columns_delete" ON public.columns
FOR DELETE USING (
  EXISTS (
    SELECT 1 FROM public.boards
    WHERE boards.id = columns.board_id
    AND boards.owner_id = auth.uid()
  )
);

-- Criar políticas para cards
CREATE POLICY "cards_select" ON public.cards
FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM public.columns
    JOIN public.boards ON boards.id = columns.board_id
    WHERE columns.id = cards.column_id
    AND (boards.owner_id = auth.uid() OR boards.is_public = true)
  )
);

CREATE POLICY "cards_insert" ON public.cards
FOR INSERT WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.columns
    JOIN public.boards ON boards.id = columns.board_id
    WHERE columns.id = cards.column_id
    AND boards.owner_id = auth.uid()
  )
);

CREATE POLICY "cards_update" ON public.cards
FOR UPDATE USING (
  EXISTS (
    SELECT 1 FROM public.columns
    JOIN public.boards ON boards.id = columns.board_id
    WHERE columns.id = cards.column_id
    AND boards.owner_id = auth.uid()
  )
);

CREATE POLICY "cards_delete" ON public.cards
FOR DELETE USING (
  EXISTS (
    SELECT 1 FROM public.columns
    JOIN public.boards ON boards.id = columns.board_id
    WHERE columns.id = cards.column_id
    AND boards.owner_id = auth.uid()
  )
);

-- Criar índices
CREATE INDEX IF NOT EXISTS idx_integrations_user_id ON public.integrations(user_id);
CREATE INDEX IF NOT EXISTS idx_integrations_provider ON public.integrations(provider);
CREATE INDEX IF NOT EXISTS idx_events_user_id ON public.events(user_id);
CREATE INDEX IF NOT EXISTS idx_events_dates ON public.events(start_date, end_date);
CREATE INDEX IF NOT EXISTS idx_boards_owner_id ON public.boards(owner_id);
CREATE INDEX IF NOT EXISTS idx_boards_favorite ON public.boards(is_favorite);
CREATE INDEX IF NOT EXISTS idx_boards_tags ON public.boards USING GIN(tags);
CREATE INDEX IF NOT EXISTS idx_columns_board_id ON public.columns(board_id);
CREATE INDEX IF NOT EXISTS idx_cards_column_id ON public.cards(column_id);

-- Remover política existente se houver
DROP POLICY IF EXISTS "Users are viewable by authenticated users" ON auth.users;

-- Criar uma view pública dos usuários com um nome diferente
CREATE OR REPLACE VIEW public.user_profiles AS
SELECT 
    id,
    email,
    raw_user_meta_data
FROM auth.users;

-- Garantir acesso de leitura à view
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT SELECT ON public.user_profiles TO authenticated;

-- Criar política para a tabela auth.users
CREATE POLICY "Users are viewable by authenticated users"
    ON auth.users
    FOR SELECT
    TO authenticated
    USING (true); 