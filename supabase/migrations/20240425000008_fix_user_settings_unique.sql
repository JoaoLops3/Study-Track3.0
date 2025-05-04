-- Dropar a tabela existente e recriar com constraints corretas
DROP TABLE IF EXISTS user_settings CASCADE;

-- Criar a tabela user_settings com a estrutura correta
CREATE TABLE user_settings (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  settings JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  CONSTRAINT user_settings_user_id_key UNIQUE (user_id)
);

-- Habilitar RLS
ALTER TABLE user_settings ENABLE ROW LEVEL SECURITY;

-- Dropar todas as políticas existentes
DROP POLICY IF EXISTS "Usuários podem ver suas próprias configurações" ON user_settings;
DROP POLICY IF EXISTS "Usuários podem inserir suas próprias configurações" ON user_settings;
DROP POLICY IF EXISTS "Usuários podem atualizar suas próprias configurações" ON user_settings;
DROP POLICY IF EXISTS "Usuários podem deletar suas próprias configurações" ON user_settings;
DROP POLICY IF EXISTS "user_settings_select_policy" ON user_settings;
DROP POLICY IF EXISTS "user_settings_insert_policy" ON user_settings;
DROP POLICY IF EXISTS "user_settings_update_policy" ON user_settings;
DROP POLICY IF EXISTS "user_settings_delete_policy" ON user_settings;

-- Criar novas políticas
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

-- Limpar dados duplicados e inserir configurações padrão
WITH user_ids AS (
  SELECT DISTINCT ON (user_id) user_id
  FROM user_settings
  ORDER BY user_id, created_at DESC
)
DELETE FROM user_settings
WHERE user_id NOT IN (SELECT user_id FROM user_ids);

-- Inserir configurações padrão para usuários existentes
INSERT INTO user_settings (user_id, settings)
SELECT id, '{}'::jsonb
FROM auth.users
WHERE id NOT IN (SELECT user_id FROM user_settings)
ON CONFLICT (user_id) DO NOTHING;

-- Garantir que as permissões estejam corretas
GRANT ALL ON user_settings TO authenticated;
GRANT USAGE ON SCHEMA public TO authenticated; 