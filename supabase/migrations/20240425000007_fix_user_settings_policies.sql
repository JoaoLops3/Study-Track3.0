-- Dropar todas as políticas existentes
DROP POLICY IF EXISTS "Usuários podem ver suas próprias configurações" ON user_settings;
DROP POLICY IF EXISTS "Usuários podem inserir suas próprias configurações" ON user_settings;
DROP POLICY IF EXISTS "Usuários podem atualizar suas próprias configurações" ON user_settings;
DROP POLICY IF EXISTS "Usuários podem deletar suas próprias configurações" ON user_settings;
DROP POLICY IF EXISTS "user_settings_select_policy" ON user_settings;
DROP POLICY IF EXISTS "user_settings_insert_policy" ON user_settings;
DROP POLICY IF EXISTS "user_settings_update_policy" ON user_settings;
DROP POLICY IF EXISTS "user_settings_delete_policy" ON user_settings;

-- Criar novas políticas com permissões mais específicas
CREATE POLICY "user_settings_select_policy"
  ON user_settings FOR SELECT
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

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

-- Garantir que as permissões estejam corretas
GRANT ALL ON user_settings TO authenticated;
GRANT USAGE ON SCHEMA public TO authenticated;

-- Criar função para verificar se o usuário tem acesso
CREATE OR REPLACE FUNCTION check_user_access(user_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN auth.uid() = user_id;
END;
$$;

-- Adicionar trigger para verificar acesso antes de operações
CREATE OR REPLACE FUNCTION check_user_settings_access()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT check_user_access(NEW.user_id) THEN
    RAISE EXCEPTION 'Acesso negado';
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER check_user_settings_access_trigger
  BEFORE INSERT OR UPDATE ON user_settings
  FOR EACH ROW
  EXECUTE FUNCTION check_user_settings_access(); 