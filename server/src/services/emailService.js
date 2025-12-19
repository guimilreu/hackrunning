import { Resend } from 'resend';
import { resendConfig } from '../config/resend.js';
import { logger } from '../utils/logger.js';

// Validar se a API key existe antes de inicializar
if (!resendConfig.apiKey) {
  logger.warn('RESEND_API_KEY não configurada. Emails não serão enviados.');
}

const resend = resendConfig.apiKey ? new Resend(resendConfig.apiKey) : null;
const FROM_EMAIL = resendConfig.fromEmail || 'Hack Running! <noreply@hackrunning.com.br>';

/**
 * Enviar email genérico
 */
export const sendEmail = async (to, subject, html, options = {}) => {
  if (!resend) {
    logger.warn('Resend não configurado. Email não enviado:', { to, subject });
    return { id: null, error: 'Resend API key não configurada' };
  }

  try {
    const result = await resend.emails.send({
      from: options.from || FROM_EMAIL,
      to: Array.isArray(to) ? to : [to],
      subject,
      html,
      ...options.replyTo && { replyTo: options.replyTo }
    });

    logger.info('Email sent:', { to, subject, id: result.id });
    return result;
  } catch (error) {
    logger.error('Error sending email:', { to, subject, error: error.message });
    throw error;
  }
};

/**
 * Email de boas-vindas
 */
export const sendWelcomeEmail = async (user) => {
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body { font-family: 'Montserrat', Arial, sans-serif; background-color: #000; color: #fff; margin: 0; padding: 0; }
        .container { max-width: 600px; margin: 0 auto; padding: 40px 20px; }
        .header { text-align: center; margin-bottom: 30px; }
        .logo { font-size: 28px; font-weight: bold; color: #eeff00; }
        .content { background-color: #1a1a1a; border-radius: 12px; padding: 30px; }
        h1 { color: #eeff00; margin-top: 0; }
        p { line-height: 1.6; color: #ccc; }
        .button { display: inline-block; background-color: #eeff00; color: #000; padding: 14px 28px; text-decoration: none; border-radius: 8px; font-weight: bold; margin-top: 20px; }
        .footer { text-align: center; margin-top: 30px; color: #666; font-size: 12px; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <div class="logo">Hack Running!</div>
        </div>
        <div class="content">
          <h1>Bem-vindo(a), ${user.name}! 🏃</h1>
          <p>Estamos muito felizes em ter você na comunidade Hack Running!</p>
          <p>Agora você faz parte de uma comunidade de corredores que buscam evolução constante, seja qual for seu objetivo.</p>
          <p>Próximos passos:</p>
          <ul>
            <li>Complete seu onboarding</li>
            <li>Adquira seu Kickstart Kit</li>
            <li>Receba sua planilha personalizada</li>
            <li>Comece a acumular HPoints!</li>
          </ul>
          <a href="${process.env.FRONTEND_URL}/home" class="button">Acessar o App</a>
        </div>
        <div class="footer">
          <p>© ${new Date().getFullYear()} Hack Running! Todos os direitos reservados.</p>
        </div>
      </div>
    </body>
    </html>
  `;

  return sendEmail(user.email, 'Bem-vindo ao Hack Running! 🏃', html);
};

/**
 * Email de recuperação de senha
 */
export const sendPasswordResetEmail = async (user, token) => {
  const resetUrl = `${process.env.FRONTEND_URL}/reset-password?token=${token}`;
  
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body { font-family: 'Montserrat', Arial, sans-serif; background-color: #000; color: #fff; margin: 0; padding: 0; }
        .container { max-width: 600px; margin: 0 auto; padding: 40px 20px; }
        .header { text-align: center; margin-bottom: 30px; }
        .logo { font-size: 28px; font-weight: bold; color: #eeff00; }
        .content { background-color: #1a1a1a; border-radius: 12px; padding: 30px; }
        h1 { color: #eeff00; margin-top: 0; }
        p { line-height: 1.6; color: #ccc; }
        .button { display: inline-block; background-color: #eeff00; color: #000; padding: 14px 28px; text-decoration: none; border-radius: 8px; font-weight: bold; margin-top: 20px; }
        .footer { text-align: center; margin-top: 30px; color: #666; font-size: 12px; }
        .warning { color: #ff6b6b; font-size: 12px; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <div class="logo">Hack Running!</div>
        </div>
        <div class="content">
          <h1>Recuperação de Senha</h1>
          <p>Olá, ${user.name}!</p>
          <p>Recebemos uma solicitação para redefinir sua senha. Clique no botão abaixo para criar uma nova senha:</p>
          <a href="${resetUrl}" class="button">Redefinir Senha</a>
          <p class="warning">Este link expira em 1 hora. Se você não solicitou a recuperação de senha, ignore este email.</p>
        </div>
        <div class="footer">
          <p>© ${new Date().getFullYear()} Hack Running! Todos os direitos reservados.</p>
        </div>
      </div>
    </body>
    </html>
  `;

  return sendEmail(user.email, 'Recuperação de Senha - Hack Running!', html);
};

/**
 * Email de treino aprovado
 */
export const sendWorkoutApprovedEmail = async (user, workout, points) => {
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body { font-family: 'Montserrat', Arial, sans-serif; background-color: #000; color: #fff; margin: 0; padding: 0; }
        .container { max-width: 600px; margin: 0 auto; padding: 40px 20px; }
        .header { text-align: center; margin-bottom: 30px; }
        .logo { font-size: 28px; font-weight: bold; color: #eeff00; }
        .content { background-color: #1a1a1a; border-radius: 12px; padding: 30px; }
        h1 { color: #eeff00; margin-top: 0; }
        p { line-height: 1.6; color: #ccc; }
        .points { font-size: 36px; color: #eeff00; font-weight: bold; text-align: center; margin: 20px 0; }
        .button { display: inline-block; background-color: #eeff00; color: #000; padding: 14px 28px; text-decoration: none; border-radius: 8px; font-weight: bold; margin-top: 20px; }
        .footer { text-align: center; margin-top: 30px; color: #666; font-size: 12px; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <div class="logo">Hack Running!</div>
        </div>
        <div class="content">
          <h1>Treino Aprovado! ✅</h1>
          <p>Parabéns, ${user.name}!</p>
          <p>Seu treino de ${workout.distance}km foi validado com sucesso!</p>
          <div class="points">+${points} HPoints</div>
          <p>Continue assim! Cada treino te aproxima dos seus objetivos.</p>
          <a href="${process.env.FRONTEND_URL}/hpoints" class="button">Ver Meus HPoints</a>
        </div>
        <div class="footer">
          <p>© ${new Date().getFullYear()} Hack Running! Todos os direitos reservados.</p>
        </div>
      </div>
    </body>
    </html>
  `;

  return sendEmail(user.email, 'Treino Aprovado! +' + points + ' HPoints 🎉', html);
};

/**
 * Email de treino reprovado
 */
export const sendWorkoutRejectedEmail = async (user, workout, reason) => {
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body { font-family: 'Montserrat', Arial, sans-serif; background-color: #000; color: #fff; margin: 0; padding: 0; }
        .container { max-width: 600px; margin: 0 auto; padding: 40px 20px; }
        .header { text-align: center; margin-bottom: 30px; }
        .logo { font-size: 28px; font-weight: bold; color: #eeff00; }
        .content { background-color: #1a1a1a; border-radius: 12px; padding: 30px; }
        h1 { color: #ff6b6b; margin-top: 0; }
        p { line-height: 1.6; color: #ccc; }
        .reason { background-color: #2a2a2a; padding: 15px; border-radius: 8px; margin: 20px 0; }
        .button { display: inline-block; background-color: #eeff00; color: #000; padding: 14px 28px; text-decoration: none; border-radius: 8px; font-weight: bold; margin-top: 20px; }
        .footer { text-align: center; margin-top: 30px; color: #666; font-size: 12px; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <div class="logo">Hack Running!</div>
        </div>
        <div class="content">
          <h1>Treino Não Aprovado</h1>
          <p>Olá, ${user.name}!</p>
          <p>Infelizmente seu treino de ${workout.distance}km não foi aprovado:</p>
          <div class="reason">
            <strong>Motivo:</strong> ${reason}
          </div>
          <p>Você pode registrar outro treino ou entrar em contato conosco se tiver dúvidas.</p>
          <a href="${process.env.FRONTEND_URL}/workouts/new" class="button">Registrar Novo Treino</a>
        </div>
        <div class="footer">
          <p>© ${new Date().getFullYear()} Hack Running! Todos os direitos reservados.</p>
        </div>
      </div>
    </body>
    </html>
  `;

  return sendEmail(user.email, 'Treino Não Aprovado - Hack Running!', html);
};

/**
 * Email de resgate aprovado
 */
export const sendRedemptionApprovedEmail = async (user, redemption) => {
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body { font-family: 'Montserrat', Arial, sans-serif; background-color: #000; color: #fff; margin: 0; padding: 0; }
        .container { max-width: 600px; margin: 0 auto; padding: 40px 20px; }
        .header { text-align: center; margin-bottom: 30px; }
        .logo { font-size: 28px; font-weight: bold; color: #eeff00; }
        .content { background-color: #1a1a1a; border-radius: 12px; padding: 30px; }
        h1 { color: #eeff00; margin-top: 0; }
        p { line-height: 1.6; color: #ccc; }
        .code { font-size: 24px; color: #eeff00; font-weight: bold; text-align: center; margin: 20px 0; background-color: #2a2a2a; padding: 15px; border-radius: 8px; letter-spacing: 3px; }
        .button { display: inline-block; background-color: #eeff00; color: #000; padding: 14px 28px; text-decoration: none; border-radius: 8px; font-weight: bold; margin-top: 20px; }
        .footer { text-align: center; margin-top: 30px; color: #666; font-size: 12px; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <div class="logo">Hack Running!</div>
        </div>
        <div class="content">
          <h1>Resgate Aprovado! 🎁</h1>
          <p>Olá, ${user.name}!</p>
          <p>Seu resgate de <strong>${redemption.itemName}</strong> foi aprovado!</p>
          <p>Use o código abaixo para retirar:</p>
          <div class="code">${redemption.redemptionCode}</div>
          <p>Apresente este código ou o QR Code no momento da retirada.</p>
          <a href="${process.env.FRONTEND_URL}/store/my-redemptions" class="button">Ver Meus Resgates</a>
        </div>
        <div class="footer">
          <p>© ${new Date().getFullYear()} Hack Running! Todos os direitos reservados.</p>
        </div>
      </div>
    </body>
    </html>
  `;

  return sendEmail(user.email, 'Resgate Aprovado! 🎁 - Hack Running!', html);
};

/**
 * Email de pontos próximos de expirar
 */
export const sendPointsExpiringEmail = async (user, points, expirationDate) => {
  const formattedDate = new Date(expirationDate).toLocaleDateString('pt-BR');
  
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body { font-family: 'Montserrat', Arial, sans-serif; background-color: #000; color: #fff; margin: 0; padding: 0; }
        .container { max-width: 600px; margin: 0 auto; padding: 40px 20px; }
        .header { text-align: center; margin-bottom: 30px; }
        .logo { font-size: 28px; font-weight: bold; color: #eeff00; }
        .content { background-color: #1a1a1a; border-radius: 12px; padding: 30px; }
        h1 { color: #ff6b6b; margin-top: 0; }
        p { line-height: 1.6; color: #ccc; }
        .points { font-size: 36px; color: #ff6b6b; font-weight: bold; text-align: center; margin: 20px 0; }
        .button { display: inline-block; background-color: #eeff00; color: #000; padding: 14px 28px; text-decoration: none; border-radius: 8px; font-weight: bold; margin-top: 20px; }
        .footer { text-align: center; margin-top: 30px; color: #666; font-size: 12px; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <div class="logo">Hack Running!</div>
        </div>
        <div class="content">
          <h1>⚠️ Seus HPoints vão expirar!</h1>
          <p>Olá, ${user.name}!</p>
          <p>Você tem HPoints que vão expirar em breve:</p>
          <div class="points">${points} HPoints</div>
          <p>Data de expiração: <strong>${formattedDate}</strong></p>
          <p>Não deixe seus pontos expirarem! Use-os na nossa loja de recompensas.</p>
          <a href="${process.env.FRONTEND_URL}/store" class="button">Usar Meus HPoints</a>
        </div>
        <div class="footer">
          <p>© ${new Date().getFullYear()} Hack Running! Todos os direitos reservados.</p>
        </div>
      </div>
    </body>
    </html>
  `;

  return sendEmail(user.email, '⚠️ Seus HPoints vão expirar! - Hack Running!', html);
};

/**
 * Email de planilha pronta
 */
export const sendTrainingPlanReadyEmail = async (user) => {
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body { font-family: 'Montserrat', Arial, sans-serif; background-color: #000; color: #fff; margin: 0; padding: 0; }
        .container { max-width: 600px; margin: 0 auto; padding: 40px 20px; }
        .header { text-align: center; margin-bottom: 30px; }
        .logo { font-size: 28px; font-weight: bold; color: #eeff00; }
        .content { background-color: #1a1a1a; border-radius: 12px; padding: 30px; }
        h1 { color: #eeff00; margin-top: 0; }
        p { line-height: 1.6; color: #ccc; }
        .button { display: inline-block; background-color: #eeff00; color: #000; padding: 14px 28px; text-decoration: none; border-radius: 8px; font-weight: bold; margin-top: 20px; }
        .footer { text-align: center; margin-top: 30px; color: #666; font-size: 12px; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <div class="logo">Hack Running!</div>
        </div>
        <div class="content">
          <h1>Sua Planilha está Pronta! 📋</h1>
          <p>Olá, ${user.name}!</p>
          <p>Sua planilha de treino personalizada foi gerada com sucesso!</p>
          <p>Baseada nos seus objetivos e nível atual, criamos um programa especialmente para você. Vamos juntos nessa jornada!</p>
          <a href="${process.env.FRONTEND_URL}/training-plan" class="button">Ver Minha Planilha</a>
        </div>
        <div class="footer">
          <p>© ${new Date().getFullYear()} Hack Running! Todos os direitos reservados.</p>
        </div>
      </div>
    </body>
    </html>
  `;

  return sendEmail(user.email, 'Sua Planilha está Pronta! 📋 - Hack Running!', html);
};

/**
 * Email de Kit enviado
 */
export const sendKickstartShippedEmail = async (user, trackingCode) => {
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body { font-family: 'Montserrat', Arial, sans-serif; background-color: #000; color: #fff; margin: 0; padding: 0; }
        .container { max-width: 600px; margin: 0 auto; padding: 40px 20px; }
        .header { text-align: center; margin-bottom: 30px; }
        .logo { font-size: 28px; font-weight: bold; color: #eeff00; }
        .content { background-color: #1a1a1a; border-radius: 12px; padding: 30px; }
        h1 { color: #eeff00; margin-top: 0; }
        p { line-height: 1.6; color: #ccc; }
        .tracking { font-size: 20px; color: #eeff00; font-weight: bold; text-align: center; margin: 20px 0; background-color: #2a2a2a; padding: 15px; border-radius: 8px; }
        .button { display: inline-block; background-color: #eeff00; color: #000; padding: 14px 28px; text-decoration: none; border-radius: 8px; font-weight: bold; margin-top: 20px; }
        .footer { text-align: center; margin-top: 30px; color: #666; font-size: 12px; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <div class="logo">Hack Running!</div>
        </div>
        <div class="content">
          <h1>Seu Kit foi Enviado! 📦</h1>
          <p>Olá, ${user.name}!</p>
          <p>Seu Kickstart Kit está a caminho!</p>
          ${trackingCode ? `
          <p>Código de rastreamento:</p>
          <div class="tracking">${trackingCode}</div>
          ` : ''}
          <p>Em breve você receberá sua camiseta, sacochila, coqueteleira, stickers e guia!</p>
          <a href="${process.env.FRONTEND_URL}/profile" class="button">Acompanhar Pedido</a>
        </div>
        <div class="footer">
          <p>© ${new Date().getFullYear()} Hack Running! Todos os direitos reservados.</p>
        </div>
      </div>
    </body>
    </html>
  `;

  return sendEmail(user.email, 'Seu Kickstart Kit foi Enviado! 📦 - Hack Running!', html);
};

const emailService = {
  sendEmail,
  sendWelcomeEmail,
  sendPasswordResetEmail,
  sendWorkoutApprovedEmail,
  sendWorkoutRejectedEmail,
  sendRedemptionApprovedEmail,
  sendPointsExpiringEmail,
  sendTrainingPlanReadyEmail,
  sendKickstartShippedEmail
};

export { emailService };
export default emailService;
