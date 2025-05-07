-- Função para enviar email de convite de equipe
CREATE OR REPLACE FUNCTION public.send_team_invite_email()
RETURNS TRIGGER AS $$
DECLARE
  team_name TEXT;
  inviter_email TEXT;
BEGIN
  -- Buscar nome da equipe
  SELECT name INTO team_name
  FROM public.teams
  WHERE id = NEW.team_id;

  -- Buscar email do convidador
  SELECT email INTO inviter_email
  FROM auth.users
  WHERE id = NEW.invited_by;

  -- Enviar email usando o serviço de email do Supabase
  PERFORM
    net.http_post(
      url := 'https://api.resend.com/emails',
      headers := jsonb_build_object(
        'Authorization', 'Bearer ' || current_setting('app.settings.resend_api_key'),
        'Content-Type', 'application/json'
      ),
      body := jsonb_build_object(
        'from', 'Study Track <noreply@studytrack.com>',
        'to', NEW.email,
        'subject', 'Convite para Equipe: ' || team_name,
        'html', format(
          '<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #333;">Você foi convidado para uma equipe!</h2>
            <p>Olá!</p>
            <p>%s te convidou para participar da equipe <strong>%s</strong> no Study Track.</p>
            <p>Para aceitar o convite, clique no botão abaixo:</p>
            <div style="text-align: center; margin: 30px 0;">
              <a href="%s/team/invite/%s" style="background-color: #4F46E5; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">
                Aceitar Convite
              </a>
            </div>
            <p style="color: #666; font-size: 14px;">Este convite expira em 7 dias.</p>
          </div>',
          inviter_email,
          team_name,
          current_setting('app.settings.app_url'),
          NEW.id
        )
      )
    );

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger para enviar email quando um novo convite é criado
CREATE TRIGGER send_team_invite_email_trigger
  AFTER INSERT ON public.team_invites
  FOR EACH ROW
  EXECUTE FUNCTION public.send_team_invite_email();

-- Configuração da chave da API do Resend
ALTER DATABASE postgres SET "app.settings.resend_api_key" = 're_123456789'; -- Substitua pela sua chave real
ALTER DATABASE postgres SET "app.settings.app_url" = 'https://seu-dominio.com'; -- Substitua pelo seu domínio 