import { Router } from 'express';
import hpointController from '../controllers/hpointController.js';
import { authenticate, requireAdmin, requireOnboarding } from '../middleware/auth.js';
import { validate, schemas } from '../middleware/validation.js';

const router = Router();

// ========== Rotas do Membro ==========

/**
 * @route GET /api/hpoints/balance
 * @desc Obter saldo de HPoints
 * @access Private
 */
router.get('/balance', authenticate, requireOnboarding, hpointController.getBalance);

/**
 * @route GET /api/hpoints/history
 * @desc Obter histórico de HPoints
 * @access Private
 */
router.get('/history',
  authenticate,
  requireOnboarding,
  validate(schemas.pagination, 'query'),
  hpointController.getHistory
);

/**
 * @route GET /api/hpoints/expiring
 * @desc Obter pontos expirando
 * @access Private
 */
router.get('/expiring', authenticate, requireOnboarding, hpointController.getExpiring);

/**
 * @route GET /api/hpoints/summary
 * @desc Obter resumo de HPoints
 * @access Private
 */
router.get('/summary', authenticate, requireOnboarding, hpointController.getSummary);

// ========== Rotas Admin ==========

/**
 * @route POST /api/hpoints/credit
 * @desc Creditar pontos manualmente
 * @access Admin
 */
router.post('/credit',
  authenticate,
  requireAdmin,
  validate(schemas.hpoints.credit),
  hpointController.credit
);

/**
 * @route POST /api/hpoints/debit
 * @desc Debitar pontos manualmente
 * @access Admin
 */
router.post('/debit',
  authenticate,
  requireAdmin,
  validate(schemas.hpoints.debit),
  hpointController.debit
);

/**
 * @route POST /api/hpoints/adjust
 * @desc Ajustar pontos
 * @access Admin
 */
router.post('/adjust',
  authenticate,
  requireAdmin,
  validate(schemas.hpoints.adjust),
  hpointController.adjust
);

/**
 * @route GET /api/hpoints/user/:userId
 * @desc Obter histórico de usuário específico
 * @access Admin
 */
router.get('/user/:userId',
  authenticate,
  requireAdmin,
  validate(schemas.objectId, 'params'),
  hpointController.getUserHistory
);

/**
 * @route GET /api/hpoints/stats
 * @desc Estatísticas de HPoints
 * @access Admin
 */
router.get('/stats', authenticate, requireAdmin, hpointController.getStats);

/**
 * @route POST /api/hpoints/expire
 * @desc Expirar pontos manualmente
 * @access Admin
 */
router.post('/expire', authenticate, requireAdmin, hpointController.expirePoints);

export default router;
