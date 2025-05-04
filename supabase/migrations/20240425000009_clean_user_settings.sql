-- Criar tabela temporária para armazenar as configurações mais recentes
CREATE TEMP TABLE temp_user_settings AS
WITH ranked_settings AS (
  SELECT 
    user_id,
    settings,
    created_at,
    updated_at,
    ROW_NUMBER() OVER (PARTITION BY user_id ORDER BY updated_at DESC) as rn
  FROM user_settings
)
SELECT 
  user_id,
  settings,
  created_at,
  updated_at
FROM ranked_settings
WHERE rn = 1;

-- Dropar a tabela existente
DROP TABLE IF EXISTS user_settings CASCADE;

-- Recriar a tabela com a estrutura correta
CREATE TABLE user_settings (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  settings JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  CONSTRAINT user_settings_user_id_key UNIQUE (user_id)
);

-- Habilitar RLS
ALTER TABLE user_settings ENABLE ROW LEVEL SECURITY;

-- Criar políticas de segurança
CREATE POLICY "user_settings_select_policy"
  ON user_settings FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "user_settings_insert_policy"
  ON user_settings FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "user_settings_update_policy"
  ON user_settings FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "user_settings_delete_policy"
  ON user_settings FOR DELETE
  USING (auth.uid() = user_id);

-- Criar função para atualizar o updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
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

-- Criar trigger para atualizar o updated_at
CREATE TRIGGER update_user_settings_updated_at
  BEFORE UPDATE ON user_settings
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Restaurar os dados da tabela temporária
INSERT INTO user_settings (user_id, settings, created_at, updated_at)
SELECT user_id, settings, created_at, updated_at
FROM temp_user_settings;

-- Inserir configurações padrão para usuários que não têm
INSERT INTO user_settings (user_id, settings)
SELECT id, '{}'::jsonb
FROM auth.users
WHERE id NOT IN (SELECT user_id FROM user_settings)
ON CONFLICT (user_id) DO NOTHING;

-- Dropar a tabela temporária
DROP TABLE temp_user_settings;

-- Garantir que as permissões estejam corretas
GRANT ALL ON user_settings TO authenticated;
GRANT USAGE ON SCHEMA public TO authenticated; 