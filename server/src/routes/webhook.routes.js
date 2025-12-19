import { Router } from 'express';
import webhookController from '../controllers/webhookController.js';

const router = Router();

/**
 * @route POST /api/webhooks/asaas
 * @desc Webhook do Asaas (pagamentos)
 * @access Public (validado por token)
 */
router.post('/asaas', webhookController.asaasWebhook);

/**
 * @route POST /api/webhooks/test
 * @desc Webhook de teste
 * @access Public
 */
router.post('/test', webhookController.testWebhook);

export default router;
