import expireHPointsJob from './expireHPoints.js';
import sendExpirationRemindersJob from './sendExpirationReminders.js';
import workoutRemindersJob from './workoutReminders.js';
import cleanupOldDataJob from './cleanupOldData.js';
import syncStravaJob from './syncStrava.js';
import subscriptionRemindersJob from './subscriptionReminders.js';
import logger from '../utils/logger.js';

/**
 * Inicializa todos os jobs agendados
 */
export const initializeJobs = () => {
  logger.info('Inicializando jobs agendados...');

  // Expiração de HPoints - diário às 00:00
  expireHPointsJob();

  // Lembretes de expiração - diário às 10:00
  sendExpirationRemindersJob();

  // Lembretes de treino - diário às 07:00
  workoutRemindersJob();

  // Lembretes de assinatura - diário às 09:00
  subscriptionRemindersJob();

  // Limpeza de dados antigos - domingos às 03:00
  cleanupOldDataJob();

  // Sincronização Strava - a cada 6 horas
  syncStravaJob();

  logger.info('Todos os jobs foram inicializados');
};

// Exportar jobs individuais para execução manual
export { 
  expireHPointsJob,
  sendExpirationRemindersJob,
  workoutRemindersJob,
  cleanupOldDataJob,
  syncStravaJob,
  subscriptionRemindersJob
};

export default initializeJobs;
