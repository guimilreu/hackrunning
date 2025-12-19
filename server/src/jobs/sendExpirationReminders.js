import cron from 'node-cron';
import { HPoint, User } from '../models/index.js';
import { hpointService } from '../services/hpointService.js';
import { notificationService } from '../services/notificationService.js';
import { emailService } from '../services/emailService.js';
import logger from '../utils/logger.js';
import { addDays, format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

/**
 * Job para enviar lembretes de pontos expirando
 * Executa diariamente às 10:00
 */
export const sendExpirationRemindersJob = () => {
  // Executar todo dia às 10h
  cron.schedule('0 10 * * *', async () => {
    logger.info('Iniciando job de lembretes de expiração...');
    
    try {
      await sendReminders(7);  // Pontos expirando em 7 dias
      await sendReminders(3);  // Pontos expirando em 3 dias
      await sendReminders(1);  // Pontos expirando amanhã
      
      logger.info('Job de lembretes concluído');
    } catch (error) {
      logger.error('Erro no job de lembretes', { error: error.message });
    }
  }, {
    timezone: 'America/Sao_Paulo'
  });

  logger.info('Job de lembretes de expiração agendado para 10:00');
};

/**
 * Envia lembretes para pontos expirando em X dias
 */
async function sendReminders(daysUntilExpiration) {
  const targetDate = addDays(new Date(), daysUntilExpiration);
  const startOfDay = new Date(targetDate);
  startOfDay.setHours(0, 0, 0, 0);
  const endOfDay = new Date(targetDate);
  endOfDay.setHours(23, 59, 59, 999);

  // Buscar transações que expiram na data alvo
  const expiringTransactions = await HPoint.aggregate([
    {
      $match: {
        type: 'credit',
        expired: false,
        redeemed: false,
        expiresAt: { $gte: startOfDay, $lte: endOfDay }
      }
    },
    {
      $group: {
        _id: '$user',
        totalPoints: { $sum: '$points' },
        transactions: { $push: '$$ROOT' }
      }
    }
  ]);

  logger.info(`Encontrados ${expiringTransactions.length} usuários com pontos expirando em ${daysUntilExpiration} dia(s)`);

  for (const item of expiringTransactions) {
    try {
      const user = await User.findById(item._id);
      if (!user || !user.active) continue;

      const expirationDateFormatted = format(targetDate, "dd 'de' MMMM", { locale: ptBR });

      // Criar notificação
      await notificationService.notifyPointsExpiring(
        user._id,
        item.totalPoints,
        expirationDateFormatted
      );

      // Enviar email (apenas para 7 e 1 dia)
      if (daysUntilExpiration === 7 || daysUntilExpiration === 1) {
        await emailService.sendPointsExpiringEmail(
          user,
          item.totalPoints,
          targetDate
        );
      }

      logger.info(`Lembrete enviado para ${user.email}`, {
        points: item.totalPoints,
        daysUntil: daysUntilExpiration
      });
    } catch (error) {
      logger.error(`Erro ao enviar lembrete para ${item._id}`, { error: error.message });
    }
  }
}

/**
 * Execução manual do job
 */
export const runExpirationRemindersManually = async (days = 7) => {
  logger.info(`Executando lembretes de expiração manualmente para ${days} dias...`);
  
  try {
    await sendReminders(days);
    return { success: true };
  } catch (error) {
    logger.error('Erro no lembrete manual', { error: error.message });
    throw error;
  }
};

export default sendExpirationRemindersJob;
