import { VercelRequest, VercelResponse } from '@vercel/node';
import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Método não permitido' });
  }

  const { to, teamName, inviterEmail, inviteId } = req.body;

  if (!to || !teamName || !inviterEmail || !inviteId) {
    return res.status(400).json({ error: 'Dados incompletos' });
  }

  try {
    const { error } = await resend.emails.send({
      from: 'Study Track <noreply@studytrack.com>',
      to,
      subject: `Convite para participar da equipe ${teamName}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2>Você foi convidado para participar da equipe ${teamName}</h2>
          <p>${inviterEmail} te convidou para participar da equipe ${teamName} no Study Track.</p>
          <p>Para aceitar o convite, clique no botão abaixo:</p>
          <div style="text-align: center; margin: 30px 0;">
            <a href="${process.env.APP_URL}/team/invite/${inviteId}" 
               style="background-color: #4F46E5; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">
              Aceitar Convite
            </a>
          </div>
          <p style="color: #666; font-size: 14px;">
            Este convite expira em 7 dias. Se você não quiser participar, pode ignorar este email.
          </p>
        </div>
      `,
    });

    if (error) {
      return res.status(500).json({ error: 'Erro ao enviar email' });
    }

    return res.status(200).json({ success: true });
  } catch (err) {
    return res.status(500).json({ error: 'Erro ao enviar email' });
  }
} 