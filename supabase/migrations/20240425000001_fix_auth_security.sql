-- Habilitar proteção contra senhas vazadas
ALTER SYSTEM SET auth.password_strength_check = true;

-- Configurar expiração do OTP para 1 hora (3600 segundos)
ALTER SYSTEM SET auth.email_otp_expiry = 3600;

-- Configurar políticas de segurança adicionais
CREATE POLICY "Enforce password strength requirements"
ON auth.users
FOR INSERT
WITH CHECK (
  length(password) >= 8 AND
  password ~ '[A-Z]' AND
  password ~ '[a-z]' AND
  password ~ '[0-9]' AND
  password ~ '[^A-Za-z0-9]'
);

-- Configurar políticas de segurança para tabelas relacionadas à autenticação
CREATE POLICY "Users can only view their own auth data"
ON auth.users
FOR SELECT
USING (auth.uid() = id);

CREATE POLICY "Users can only update their own auth data"
ON auth.users
FOR UPDATE
USING (auth.uid() = id);

-- Configurar políticas de segurança para tokens
CREATE POLICY "Users can only manage their own tokens"
ON auth.refresh_tokens
FOR ALL
USING (auth.uid() = user_id);

-- Configurar políticas de segurança para sessões
CREATE POLICY "Users can only manage their own sessions"
ON auth.sessions
FOR ALL
USING (auth.uid() = user_id); 