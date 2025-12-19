import { stravaConfig } from '../config/strava.js';
import { logger } from '../utils/logger.js';
import crypto from 'crypto';

const CLIENT_ID = stravaConfig.clientId;
const CLIENT_SECRET = stravaConfig.clientSecret;
const REDIRECT_URI = stravaConfig.redirectUri;
const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY || 'default-encryption-key-32chars!';

/**
 * Criptografar token antes de salvar no banco
 */
export const encryptToken = (token) => {
  if (!token) return '';
  
  const iv = crypto.randomBytes(16);
  const cipher = crypto.createCipheriv('aes-256-cbc', Buffer.from(ENCRYPTION_KEY.slice(0, 32)), iv);
  let encrypted = cipher.update(token, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  
  return iv.toString('hex') + ':' + encrypted;
};

/**
 * Descriptografar token ao usar
 */
export const decryptToken = (encryptedToken) => {
  if (!encryptedToken || !encryptedToken.includes(':')) return '';
  
  try {
    const [ivHex, encrypted] = encryptedToken.split(':');
    const iv = Buffer.from(ivHex, 'hex');
    const decipher = crypto.createDecipheriv('aes-256-cbc', Buffer.from(ENCRYPTION_KEY.slice(0, 32)), iv);
    let decrypted = decipher.update(encrypted, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    
    return decrypted;
  } catch (error) {
    logger.error('Error decrypting token:', error);
    return '';
  }
};

/**
 * Gerar URL de autorização do Strava
 */
export const getAuthorizationUrl = (state = '') => {
  const params = new URLSearchParams({
    client_id: CLIENT_ID,
    redirect_uri: REDIRECT_URI,
    response_type: 'code',
    scope: 'activity:read_all',
    state
  });

  return `https://www.strava.com/oauth/authorize?${params.toString()}`;
};

/**
 * Trocar código de autorização por tokens
 */
export const exchangeCodeForTokens = async (code) => {
  try {
    const response = await fetch('https://www.strava.com/oauth/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        client_id: CLIENT_ID,
        client_secret: CLIENT_SECRET,
        code,
        grant_type: 'authorization_code'
      })
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || 'Erro ao trocar código por tokens');
    }

    logger.info('Strava tokens obtained successfully');

    return {
      accessToken: encryptToken(data.access_token),
      refreshToken: encryptToken(data.refresh_token),
      expiresAt: data.expires_at,
      athleteId: data.athlete?.id?.toString()
    };
  } catch (error) {
    logger.error('Error exchanging Strava code:', error);
    throw error;
  }
};

/**
 * Renovar tokens usando refresh token
 */
export const refreshTokens = async (encryptedRefreshToken) => {
  try {
    const refreshToken = decryptToken(encryptedRefreshToken);
    
    const response = await fetch('https://www.strava.com/oauth/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        client_id: CLIENT_ID,
        client_secret: CLIENT_SECRET,
        refresh_token: refreshToken,
        grant_type: 'refresh_token'
      })
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || 'Erro ao renovar tokens');
    }

    logger.info('Strava tokens refreshed successfully');

    return {
      accessToken: encryptToken(data.access_token),
      refreshToken: encryptToken(data.refresh_token),
      expiresAt: data.expires_at
    };
  } catch (error) {
    logger.error('Error refreshing Strava tokens:', error);
    throw error;
  }
};

/**
 * Verificar se token expirou e renovar se necessário
 */
export const ensureValidToken = async (user) => {
  const strava = user.integrations?.strava;
  
  if (!strava?.connected || !strava?.refreshToken) {
    throw new Error('Strava não conectado');
  }

  // Verificar se o token expirou (com margem de 5 minutos)
  const now = Math.floor(Date.now() / 1000);
  const expiresAt = strava.expiresAt || 0;
  
  if (now >= expiresAt - 300) {
    // Token expirado ou próximo de expirar, renovar
    const newTokens = await refreshTokens(strava.refreshToken);
    
    // Atualizar no usuário
    user.integrations.strava.accessToken = newTokens.accessToken;
    user.integrations.strava.refreshToken = newTokens.refreshToken;
    user.integrations.strava.expiresAt = newTokens.expiresAt;
    await user.save();
    
    return decryptToken(newTokens.accessToken);
  }

  return decryptToken(strava.accessToken);
};

/**
 * Buscar atividades do Strava
 */
export const getActivities = async (accessToken, options = {}) => {
  const {
    after = null,
    before = null,
    page = 1,
    perPage = 30
  } = options;

  try {
    const params = new URLSearchParams({
      page: page.toString(),
      per_page: perPage.toString()
    });

    if (after) params.append('after', Math.floor(new Date(after).getTime() / 1000).toString());
    if (before) params.append('before', Math.floor(new Date(before).getTime() / 1000).toString());

    const response = await fetch(`https://www.strava.com/api/v3/athlete/activities?${params.toString()}`, {
      headers: {
        'Authorization': `Bearer ${accessToken}`
      }
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || 'Erro ao buscar atividades');
    }

    return data;
  } catch (error) {
    logger.error('Error fetching Strava activities:', error);
    throw error;
  }
};

/**
 * Buscar detalhes de uma atividade específica
 */
export const getActivity = async (accessToken, activityId) => {
  try {
    const response = await fetch(`https://www.strava.com/api/v3/activities/${activityId}`, {
      headers: {
        'Authorization': `Bearer ${accessToken}`
      }
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || 'Erro ao buscar atividade');
    }

    return data;
  } catch (error) {
    logger.error('Error fetching Strava activity:', error);
    throw error;
  }
};

/**
 * Buscar informações do atleta
 */
export const getAthlete = async (accessToken) => {
  try {
    const response = await fetch('https://www.strava.com/api/v3/athlete', {
      headers: {
        'Authorization': `Bearer ${accessToken}`
      }
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || 'Erro ao buscar atleta');
    }

    return data;
  } catch (error) {
    logger.error('Error fetching Strava athlete:', error);
    throw error;
  }
};

/**
 * Verificar se atividade pertence ao clube Hack Running
 * (Requer configuração do ID do clube no Strava)
 */
export const isClubActivity = async (accessToken, activityId) => {
  const clubId = process.env.STRAVA_CLUB_ID;
  
  if (!clubId) {
    // Se não tiver clube configurado, aceitar todas
    return true;
  }

  try {
    const activity = await getActivity(accessToken, activityId);
    
    // Verificar se a atividade tem o clube
    // A API do Strava não retorna diretamente se pertence a um clube
    // Seria necessário verificar manualmente ou usar outro critério
    
    return true; // Por enquanto, aceitar todas
  } catch (error) {
    logger.error('Error checking club activity:', error);
    return false;
  }
};

/**
 * Converter atividade do Strava para formato interno
 */
export const convertActivityToWorkout = (activity) => {
  return {
    date: new Date(activity.start_date_local),
    distance: activity.distance / 1000, // metros para km
    time: activity.moving_time, // segundos
    pace: activity.distance > 0 ? Math.round(activity.moving_time / (activity.distance / 1000)) : 0,
    stravaActivityId: activity.id.toString(),
    importedFromStrava: true,
    notes: activity.name,
    workoutType: mapStravaTypeToWorkoutType(activity.type)
  };
};

/**
 * Mapear tipo de atividade do Strava para tipo de treino interno
 */
const mapStravaTypeToWorkoutType = (stravaType) => {
  const typeMap = {
    'Run': 'base',
    'VirtualRun': 'base',
    'TrailRun': 'long_run',
    'Walk': 'recovery',
    'Workout': 'strength'
  };

  return typeMap[stravaType] || 'base';
};

/**
 * Revogar acesso do Strava
 */
export const revokeAccess = async (encryptedAccessToken) => {
  try {
    const accessToken = decryptToken(encryptedAccessToken);
    
    await fetch('https://www.strava.com/oauth/deauthorize', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`
      }
    });

    logger.info('Strava access revoked');
    return true;
  } catch (error) {
    logger.error('Error revoking Strava access:', error);
    return false;
  }
};

const stravaService = {
  encryptToken,
  decryptToken,
  getAuthorizationUrl,
  exchangeCodeForTokens,
  refreshTokens,
  ensureValidToken,
  getActivities,
  getActivity,
  getAthlete,
  isClubActivity,
  convertActivityToWorkout,
  revokeAccess
};

export { stravaService };
export default stravaService;
