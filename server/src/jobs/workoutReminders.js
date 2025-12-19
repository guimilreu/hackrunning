import cron from 'node-cron';
import { User, TrainingPlan } from '../models/index.js';
import { notificationService } from '../services/notificationService.js';
import logger from '../utils/logger.js';
import { startOfDay, endOfDay, format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

/**
 * Job para enviar lembretes de treino
 * Executa diariamente às 07:00
 */
export const workoutRemindersJob = () => {
  // Executar todo dia às 7h
  cron.schedule('0 7 * * *', async () => {
    logger.info('Iniciando job de lembretes de treino...');
    
    try {
      const today = new Date();
      const todayStart = startOfDay(today);
      const todayEnd = endOfDay(today);

      // Buscar planos de treino com treinos para hoje
      const plansWithWorkoutsToday = await TrainingPlan.find({
        endDate: { $gte: today },
        'workouts.date': { $gte: todayStart, $lte: todayEnd },
        'workouts.completed': false
      }).populate('user', 'firstName email preferences');

      let remindersCount = 0;

      for (const plan of plansWithWorkoutsToday) {
        try {
          // Verificar preferências do usuário
          if (plan.user?.preferences?.workoutReminders === false) {
            continue;
          }

          // Encontrar treino de hoje
          const todayWorkout = plan.workouts.find(w => {
            const workoutDate = new Date(w.date);
            return workoutDate >= todayStart && workoutDate <= todayEnd && !w.completed;
          });

          if (todayWorkout) {
            await notificationService.notifyWorkoutReminder(plan.user._id, {
              type: todayWorkout.type,
              description: todayWorkout.description,
              distance: todayWorkout.distance
            });
            remindersCount++;
          }
        } catch (error) {
          logger.error(`Erro ao enviar lembrete para ${plan.user?._id}`, { 
            error: error.message 
          });
        }
      }

      logger.info('Job de lembretes de treino concluído', { 
        remindersSent: remindersCount 
      });
    } catch (error) {
      logger.error('Erro no job de lembretes de treino', { error: error.message });
    }
  }, {
    timezone: 'America/Sao_Paulo'
  });

  logger.info('Job de lembretes de treino agendado para 07:00');
};

export default workoutRemindersJob;
