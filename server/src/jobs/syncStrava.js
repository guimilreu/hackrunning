import cron from 'node-cron';
import { User, Workout } from '../models/index.js';
import { stravaService } from '../services/stravaService.js';
import logger from '../utils/logger.js';

/**
 * Job para sincronizar atividades do Strava
 * Executa a cada 6 horas
 */
export const syncStravaJob = () => {
  // Executar a cada 6 horas
  cron.schedule('0 */6 * * *', async () => {
    logger.info('Iniciando job de sincronização Strava...');
    
    try {
      // Buscar usuários com Strava conectado
      const users = await User.find({
        'strava.connected': true,
        'strava.accessToken': { $exists: true }
      });

      let syncedCount = 0;
      let importedCount = 0;

      for (const user of users) {
        try {
          // Garantir token válido
          const tokenData = await stravaService.ensureValidToken(user);
          
          if (tokenData.updated) {
            user.strava.accessToken = stravaService.encryptToken(tokenData.accessToken);
            user.strava.refreshToken = stravaService.encryptToken(tokenData.refreshToken);
            user.strava.tokenExpiresAt = new Date(tokenData.expiresAt * 1000);
          }

          // Buscar atividades das últimas 24 horas
          const since = new Date();
          since.setHours(since.getHours() - 24);

          const activities = await stravaService.getActivities(
            tokenData.accessToken,
            Math.floor(since.getTime() / 1000)
          );

          // Filtrar e importar corridas
          const runs = activities.filter(a => a.type === 'Run');

          for (const activity of runs) {
            const existing = await Workout.findOne({
              user: user._id,
              'strava.activityId': activity.id.toString()
            });

            if (!existing) {
              const workoutData = stravaService.convertToWorkout(activity);
              
              const workout = new Workout({
                user: user._id,
                type: 'strava',
                ...workoutData,
                strava: {
                  activityId: activity.id.toString(),
                  imported: true,
                  importedAt: new Date()
                }
              });

              await workout.save();
              importedCount++;
            }
          }

          // Atualizar última sincronização
          user.strava.lastSync = new Date();
          await user.save();
          
          syncedCount++;
        } catch (error) {
          logger.error(`Erro ao sincronizar Strava para ${user._id}`, { 
            error: error.message 
          });
        }
      }

      logger.info('Job de sincronização Strava concluído', {
        usersSynced: syncedCount,
        activitiesImported: importedCount
      });
    } catch (error) {
      logger.error('Erro no job de sincronização Strava', { error: error.message });
    }
  }, {
    timezone: 'America/Sao_Paulo'
  });

  logger.info('Job de sincronização Strava agendado para cada 6 horas');
};

export default syncStravaJob;
