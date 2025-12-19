// Configuração do Resend será implementada depois

export const resendConfig = {
  apiKey: process.env.RESEND_API_KEY,
  fromEmail: process.env.RESEND_FROM_EMAIL || 'noreply@hackrunning.com.br'
};

