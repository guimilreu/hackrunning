// Configuração do Asaas será implementada depois

export const asaasConfig = {
  apiKey: process.env.ASAAS_API_KEY,
  apiUrl: process.env.ASAAS_API_URL || 'https://api.asaas.com/v3',
  baseUrl: process.env.ASAAS_API_URL || 'https://api.asaas.com/v3',
  webhookToken: process.env.ASAAS_WEBHOOK_TOKEN
};

