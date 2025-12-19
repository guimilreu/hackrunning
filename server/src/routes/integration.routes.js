import { Router } from 'express';
import integrationController from '../controllers/integrationController.js';
import { authenticate } from '../middleware/auth.js';

const router = Router();

// ========== Strava ==========

/**
 * @route GET /api/integrations/strava/auth-url
 * @desc Obter URL de autorização do Strava
 * @access Private
 */
router.get('/strava/auth-url', authenticate, integrationController.getStravaAuthUrl);

/**
 * @route GET /api/integrations/strava/callback
 * @desc Callback do OAuth do Strava
 * @access Public (redirecionamento do Strava)
 */
router.get('/strava/callback', integrationController.stravaCallback);

/**
 * @route GET /api/integrations/strava/status
 * @desc Obter status da conexão Strava
 * @access Private
 */
router.get('/strava/status', authenticate, integrationController.getStravaStatus);

/**
 * @route POST /api/integrations/strava/sync
 * @desc Sincronizar atividades do Strava
 * @access Private
 */
router.post('/strava/sync', authenticate, integrationController.syncStravaActivities);

/**
 * @route POST /api/integrations/strava/disconnect
 * @desc Desconectar Strava
 * @access Private
 */
router.post('/strava/disconnect', authenticate, integrationController.disconnectStrava);

/**
 * @route GET /api/integrations/strava/webhook
 * @desc Webhook do Strava (validação)
 * @access Public
 */
router.get('/strava/webhook', integrationController.stravaWebhook);

/**
 * @route POST /api/integrations/strava/webhook
 * @desc Webhook do Strava (eventos)
 * @access Public
 */
router.post('/strava/webhook', integrationController.stravaWebhook);

export default router;
