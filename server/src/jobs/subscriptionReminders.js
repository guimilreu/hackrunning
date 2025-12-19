import cron from 'node-cron';
import { Subscription, User } from '../models/index.js';
import { notificationService } from '../services/notificationService.js';
import logger from '../utils/logger.js';
import { addDays } from 'date-fns';

/**
 * Job para enviar lembretes de cobranças de assinatura
 * Executa diariamente às 09:00
 * 
 * Envia notificações para:
 * - 3 dias antes do vencimento (apenas PIX/Boleto)
 * - No dia do vencimento (todos os métodos)
 * - 1 dia após vencimento (apenas se não pago)
 */
export const subscriptionRemindersJob = () => {
  // Executar todo dia às 09h
  cron.schedule('0 9 * * *', async () => {
    logger.info('Iniciando job de lembretes de assinatura...');
    
    try {
      await sendUpcomingReminders();  // 3 dias antes
      await sendDueTodayReminders();  // Vence hoje
      await sendOverdueReminders();   // Vencido
      
      logger.info('Job de lembretes de assinatura concluído');
    } catch (error) {
      logger.error('Erro no job de lembretes de assinatura', { error: error.message });
    }
  }, {
    timezone: 'America/Sao_Paulo'
  });

  logger.info('Job de lembretes de assinatura agendado para 09:00');
};

/**
 * Envia lembretes para cobranças que vencem em 3 dias
 * Apenas para PIX e Boleto (cartão é automático)
 */
async function sendUpcomingReminders() {
  const targetDate = addDays(new Date(), 3);
  const startOfDay = new Date(targetDate);
  startOfDay.setHours(0, 0, 0, 0);
  const endOfDay = new Date(targetDate);
  endOfDay.setHours(23, 59, 59, 999);

  // Buscar assinaturas que vencem em 3 dias e NÃO são cartão de crédito
  const subscriptions = await Subscription.find({
    status: 'active',
    billingType: { $in: ['PIX', 'BOLETO'] },
    nextBillingDate: { $gte: startOfDay, $lte: endOfDay }
  }).populate('user', 'name email');

  logger.info(`Encontradas ${subscriptions.length} assinaturas vencendo em 3 dias (PIX/Boleto)`);

  for (const subscription of subscriptions) {
    try {
      const user = subscription.user;
      if (!user || !user.active) continue;

      const planName = subscription.plan === 'plus' ? 'Plus' : 'Pro';

      await notificationService.notifySubscriptionUpcoming(user._id, {
        plan: planName,
        billingType: subscription.billingType,
        value: subscription.value,
        daysUntil: 3
      });

      logger.info(`Lembrete de 3 dias enviado para ${user.email}`, {
        plan: subscription.plan,
        billingType: subscription.billingType
      });
    } catch (error) {
      logger.error(`Erro ao enviar lembrete para ${subscription._id}`, { error: error.message });
    }
  }
}

/**
 * Envia lembretes para cobranças que vencem hoje
 * Para PIX/Boleto: lembrete de pagamento
 * Para Cartão: apenas informativo (será cobrado automaticamente)
 */
async function sendDueTodayReminders() {
  const today = new Date();
  const startOfDay = new Date(today);
  startOfDay.setHours(0, 0, 0, 0);
  const endOfDay = new Date(today);
  endOfDay.setHours(23, 59, 59, 999);

  // Buscar assinaturas que vencem hoje
  const subscriptions = await Subscription.find({
    status: 'active',
    nextBillingDate: { $gte: startOfDay, $lte: endOfDay }
  }).populate('user', 'name email');

  logger.info(`Encontradas ${subscriptions.length} assinaturas vencendo hoje`);

  for (const subscription of subscriptions) {
    try {
      const user = subscription.user;
      if (!user || !user.active) continue;

      const planName = subscription.plan === 'plus' ? 'Plus' : 'Pro';

      await notificationService.notifySubscriptionDueToday(user._id, {
        plan: planName,
        billingType: subscription.billingType,
        value: subscription.value
      });

      logger.info(`Lembrete de vencimento hoje enviado para ${user.email}`, {
        plan: subscription.plan,
        billingType: subscription.billingType
      });
    } catch (error) {
      logger.error(`Erro ao enviar lembrete para ${subscription._id}`, { error: error.message });
    }
  }
}

/**
 * Envia lembretes para cobranças vencidas
 * Apenas para assinaturas que ainda estão ativas mas com pagamento atrasado
 */
async function sendOverdueReminders() {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  // Buscar assinaturas vencidas (nextBillingDate no passado)
  const subscriptions = await Subscription.find({
    status: { $in: ['active', 'suspended'] },
    billingType: { $in: ['PIX', 'BOLETO'] },
    nextBillingDate: { $lt: today }
  }).populate('user', 'name email');

  logger.info(`Encontradas ${subscriptions.length} assinaturas vencidas (PIX/Boleto)`);

  for (const subscription of subscriptions) {
    try {
      const user = subscription.user;
      if (!user || !user.active) continue;

      // Calcular dias de atraso
      const daysOverdue = Math.floor((today - subscription.nextBillingDate) / (1000 * 60 * 60 * 24));
      
      // Enviar lembrete apenas nos dias 1, 3, 7, 14 após vencimento
      if (![1, 3, 7, 14].includes(daysOverdue)) continue;

      const planName = subscription.plan === 'plus' ? 'Plus' : 'Pro';

      await notificationService.notifySubscriptionOverdue(user._id, {
        plan: planName,
        value: subscription.value,
        daysOverdue
      });

      logger.info(`Lembrete de atraso enviado para ${user.email}`, {
        plan: subscription.plan,
        daysOverdue
      });
    } catch (error) {
      logger.error(`Erro ao enviar lembrete de atraso para ${subscription._id}`, { error: error.message });
    }
  }
}

/**
 * Execução manual do job
 */
export const runSubscriptionRemindersManually = async (type = 'all') => {
  logger.info(`Executando lembretes de assinatura manualmente (${type})...`);
  
  try {
    if (type === 'all' || type === 'upcoming') {
      await sendUpcomingReminders();
    }
    if (type === 'all' || type === 'due') {
      await sendDueTodayReminders();
    }
    if (type === 'all' || type === 'overdue') {
      await sendOverdueReminders();
    }
    return { success: true };
  } catch (error) {
    logger.error('Erro no lembrete manual', { error: error.message });
    throw error;
  }
};

export default subscriptionRemindersJob;
