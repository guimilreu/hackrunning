import { User, Workout, AuditLog } from '../models/index.js';
import { stravaService } from '../services/stravaService.js';
import { hpointService } from '../services/hpointService.js';

/**
 * Obter URL de autorização do Strava
 */
export const getStravaAuthUrl = async (req, res) => {
  try {
    const authUrl = stravaService.getAuthorizationUrl(req.user._id.toString());

    res.json({
      success: true,
      data: { authUrl }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Erro ao gerar URL de autorização'
    });
  }
};

/**
 * Callback do OAuth do Strava
 */
export const stravaCallback = async (req, res) => {
  try {
    const { code, state, error } = req.query;

    if (error) {
      // Redirecionar com erro
      return res.redirect(`${process.env.FRONTEND_URL}/integracoes?error=${error}`);
    }

    // O state contém o userId
    const userId = state;

    // Trocar código por tokens
    const tokens = await stravaService.exchangeToken(code);

    // Obter dados do atleta
    const athlete = await stravaService.getAthlete(tokens.access_token);

    // Atualizar usuário com dados do Strava
    const user = await User.findById(userId);
    if (!user) {
      return res.redirect(`${process.env.FRONTEND_URL}/integracoes?error=user_not_found`);
    }

    user.strava = {
      connected: true,
      athleteId: athlete.id.toString(),
      accessToken: stravaService.encryptToken(tokens.access_token),
      refreshToken: stravaService.encryptToken(tokens.refresh_token),
      tokenExpiresAt: new Date(tokens.expires_at * 1000),
      lastSync: new Date()
    };

    await user.save();

    // Log de auditoria
    await AuditLog.logCreate('strava_connect', user._id, user._id, {
      athleteId: athlete.id
    }, req);

    // Redirecionar para o frontend
    res.redirect(`${process.env.FRONTEND_URL}/integracoes?success=strava_connected`);
  } catch (error) {
    console.error('Erro no callback do Strava:', error);
    res.redirect(`${process.env.FRONTEND_URL}/integracoes?error=strava_error`);
  }
};

/**
 * Desconectar Strava
 */
export const disconnectStrava = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);

    if (!user.strava?.connected) {
      return res.status(400).json({
        success: false,
        message: 'Strava não está conectado'
      });
    }

    // Revogar acesso no Strava
    try {
      const accessToken = stravaService.decryptToken(user.strava.accessToken);
      await stravaService.revokeAccess(accessToken);
    } catch (err) {
      console.error('Erro ao revogar acesso no Strava:', err);
    }

    // Limpar dados do usuário
    user.strava = {
      connected: false,
      athleteId: null,
      accessToken: null,
      refreshToken: null,
      tokenExpiresAt: null,
      lastSync: null
    };

    await user.save();

    // Log de auditoria
    await AuditLog.logDelete('strava_connect', user._id, user._id, {}, req);

    res.json({
      success: true,
      message: 'Strava desconectado'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Erro ao desconectar Strava'
    });
  }
};

/**
 * Obter status da conexão Strava
 */
export const getStravaStatus = async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select('strava');

    res.json({
      success: true,
      data: {
        connected: user.strava?.connected || false,
        lastSync: user.strava?.lastSync,
        athleteId: user.strava?.athleteId
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Erro ao obter status'
    });
  }
};

/**
 * Sincronizar atividades do Strava
 */
export const syncStravaActivities = async (req, res) => {
  try {
    const { days = 7 } = req.query;
    const user = await User.findById(req.user._id);

    if (!user.strava?.connected) {
      return res.status(400).json({
        success: false,
        message: 'Strava não está conectado'
      });
    }

    // Garantir token válido
    const tokenData = await stravaService.ensureValidToken(user);
    
    if (tokenData.updated) {
      user.strava.accessToken = stravaService.encryptToken(tokenData.accessToken);
      user.strava.refreshToken = stravaService.encryptToken(tokenData.refreshToken);
      user.strava.tokenExpiresAt = new Date(tokenData.expiresAt * 1000);
      await user.save();
    }

    // Buscar atividades
    const since = new Date();
    since.setDate(since.getDate() - parseInt(days));

    const activities = await stravaService.getActivities(
      tokenData.accessToken,
      Math.floor(since.getTime() / 1000)
    );

    // Filtrar apenas corridas
    const runs = activities.filter(a => a.type === 'Run');

    // Converter e salvar
    const imported = [];
    for (const activity of runs) {
      // Verificar se já foi importada
      const existing = await Workout.findOne({
        user: user._id,
        'strava.activityId': activity.id.toString()
      });

      if (existing) continue;

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
      imported.push(workout);
    }

    // Atualizar última sincronização
    user.strava.lastSync = new Date();
    await user.save();

    res.json({
      success: true,
      message: `${imported.length} atividades importadas`,
      data: {
        imported: imported.length,
        total: runs.length,
        activities: imported
      }
    });
  } catch (error) {
    console.error('Erro ao sincronizar Strava:', error);
    res.status(500).json({
      success: false,
      message: 'Erro ao sincronizar atividades'
    });
  }
};

/**
 * Webhook do Strava (receber eventos)
 */
export const stravaWebhook = async (req, res) => {
  try {
    // Validação do webhook (Strava envia GET para validar)
    if (req.method === 'GET') {
      const { 'hub.mode': mode, 'hub.challenge': challenge, 'hub.verify_token': verifyToken } = req.query;

      if (mode === 'subscribe' && verifyToken === process.env.STRAVA_VERIFY_TOKEN) {
        return res.json({ 'hub.challenge': challenge });
      }

      return res.status(403).json({ error: 'Verification failed' });
    }

    // Processar evento
    const { object_type, aspect_type, object_id, owner_id, subscription_id } = req.body;

    console.log('Strava webhook:', { object_type, aspect_type, object_id, owner_id });

    // Processar apenas atividades criadas
    if (object_type === 'activity' && aspect_type === 'create') {
      // Buscar usuário pelo athleteId
      const user = await User.findOne({ 'strava.athleteId': owner_id.toString() });
      
      if (user && user.strava?.connected) {
        // Agendar importação da atividade (em background)
        setImmediate(async () => {
          try {
            const tokenData = await stravaService.ensureValidToken(user);
            
            if (tokenData.updated) {
              user.strava.accessToken = stravaService.encryptToken(tokenData.accessToken);
              user.strava.refreshToken = stravaService.encryptToken(tokenData.refreshToken);
              user.strava.tokenExpiresAt = new Date(tokenData.expiresAt * 1000);
              await user.save();
            }

            // Buscar atividade específica
            const activity = await stravaService.getActivity(tokenData.accessToken, object_id);
            
            if (activity.type === 'Run') {
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
                console.log('Atividade Strava importada via webhook:', workout._id);
              }
            }
          } catch (err) {
            console.error('Erro ao processar webhook Strava:', err);
          }
        });
      }
    }

    // Sempre retornar 200 para o Strava
    res.status(200).json({ received: true });
  } catch (error) {
    console.error('Erro no webhook Strava:', error);
    res.status(200).json({ received: true }); // Sempre retornar 200
  }
};

export default {
  getStravaAuthUrl,
  stravaCallback,
  disconnectStrava,
  getStravaStatus,
  syncStravaActivities,
  stravaWebhook
};
