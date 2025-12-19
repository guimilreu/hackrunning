import cron from 'node-cron';
import { HPoint, User } from '../models/index.js';
import { hpointService } from '../services/hpointService.js';
import { notificationService } from '../services/notificationService.js';
import logger from '../utils/logger.js';

/**
 * Job para expirar HPoints
 * Executa diariamente às 00:00
 */
export const expireHPointsJob = () => {
  // Executar todo dia à meia-noite
  cron.schedule('0 0 * * *', async () => {
    logger.info('Iniciando job de expiração de HPoints...');
    
    try {
      const result = await hpointService.expirePoints();
      
      logger.info('Job de expiração concluído', {
        expiredTransactions: result.expiredCount,
        totalPointsExpired: result.totalExpired
      });

      // Atualizar saldos dos usuários afetados
      if (result.affectedUsers && result.affectedUsers.length > 0) {
        for (const userId of result.affectedUsers) {
          const newBalance = await hpointService.getBalance(userId);
          await User.findByIdAndUpdate(userId, { hpointsBalance: newBalance });
        }
        
        logger.info('Saldos atualizados', { 
          usersUpdated: result.affectedUsers.length 
        });
      }
    } catch (error) {
      logger.error('Erro no job de expiração de HPoints', { error: error.message });
    }
  }, {
    timezone: 'America/Sao_Paulo'
  });

  logger.info('Job de expiração de HPoints agendado para 00:00');
};

/**
 * Execução manual do job (para testes ou admin)
 */
export const runExpireHPointsManually = async () => {
  logger.info('Executando expiração de HPoints manualmente...');
  
  try {
    const result = await hpointService.expirePoints();
    
    // Atualizar saldos
    if (result.affectedUsers && result.affectedUsers.length > 0) {
      for (const userId of result.affectedUsers) {
        const newBalance = await hpointService.getBalance(userId);
        await User.findByIdAndUpdate(userId, { hpointsBalance: newBalance });
      }
    }

    return result;
  } catch (error) {
    logger.error('Erro na expiração manual', { error: error.message });
    throw error;
  }
};

export default expireHPointsJob;
