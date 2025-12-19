import cron from 'node-cron';
import { Notification, AuditLog } from '../models/index.js';
import { notificationService } from '../services/notificationService.js';
import logger from '../utils/logger.js';

/**
 * Job para limpeza de dados antigos
 * Executa todo domingo às 03:00
 */
export const cleanupOldDataJob = () => {
  // Executar todo domingo às 3h
  cron.schedule('0 3 * * 0', async () => {
    logger.info('Iniciando job de limpeza de dados antigos...');
    
    try {
      // Limpar notificações lidas com mais de 60 dias
      const notificationsDeleted = await notificationService.deleteOldNotifications(60);
      
      // Limpar logs de auditoria com mais de 90 dias (manter apenas os críticos)
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - 90);
      
      const auditLogsResult = await AuditLog.deleteMany({
        createdAt: { $lt: cutoffDate },
        type: { $nin: ['delete', 'password_reset', 'payment_received'] } // Manter logs importantes
      });

      logger.info('Job de limpeza concluído', {
        notificationsDeleted,
        auditLogsDeleted: auditLogsResult.deletedCount
      });
    } catch (error) {
      logger.error('Erro no job de limpeza', { error: error.message });
    }
  }, {
    timezone: 'America/Sao_Paulo'
  });

  logger.info('Job de limpeza agendado para domingos às 03:00');
};

export default cleanupOldDataJob;
