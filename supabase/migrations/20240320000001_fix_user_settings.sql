-- Primeiro, vamos dropar a tabela se ela existir para recriar corretamente
DROP TABLE IF EXISTS user_settings CASCADE;

-- Criar a tabela user_settings
CREATE TABLE user_settings (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  settings JSONB NOT NULL DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Habilitar RLS
ALTER TABLE user_settings ENABLE ROW LEVEL SECURITY;

-- Dropar políticas existentes se houver
DROP POLICY IF EXISTS "Usuários podem ver suas próprias configurações" ON user_settings;
DROP POLICY IF EXISTS "Usuários podem inserir suas próprias configurações" ON user_settings;
DROP POLICY IF EXISTS "Usuários podem atualizar suas próprias configurações" ON user_settings;

-- Criar políticas de segurança
CREATE POLICY "Usuários podem ver suas próprias configurações"
  ON user_settings FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Usuários podem inserir suas próprias configurações"
  ON user_settings FOR INSERT
  WITH CHECK (auth.uid() = id);

CREATE POLICY "Usuários podem atualizar suas próprias configurações"
  ON user_settings FOR UPDATE
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- Criar função para atualizar o updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = TIMEZONE('utc'::text, NOW());
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Dropar trigger existente se houver
DROP TRIGGER IF EXISTS update_user_settings_updated_at ON user_settings;

-- Criar trigger para atualizar o updated_at
CREATE TRIGGER update_user_settings_updated_at
  BEFORE UPDATE ON user_settings
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Inserir configurações padrão para usuários existentes
INSERT INTO user_settings (id, settings)
SELECT id, '{}'::jsonb
FROM auth.users
WHERE id NOT IN (SELECT id FROM user_settings); 