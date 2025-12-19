import { Router } from 'express';
import redemptionController from '../controllers/redemptionController.js';
import { authenticate, requireAdmin } from '../middleware/auth.js';
import { validate, schemas } from '../middleware/validation.js';

const router = Router();

// ========== Rotas do Membro ==========

/**
 * @route POST /api/redemptions
 * @desc Criar resgate
 * @access Private
 */
router.post('/',
  authenticate,
  validate(schemas.redemptions.create),
  redemptionController.create
);

/**
 * @route GET /api/redemptions
 * @desc Listar resgates do usuário
 * @access Private
 */
router.get('/',
  authenticate,
  validate(schemas.pagination, 'query'),
  redemptionController.list
);

/**
 * @route GET /api/redemptions/:id
 * @desc Obter resgate por ID
 * @access Private
 */
router.get('/:id',
  authenticate,
  validate(schemas.objectId, 'params'),
  redemptionController.getById
);

/**
 * @route POST /api/redemptions/:id/cancel
 * @desc Cancelar resgate
 * @access Private
 */
router.post('/:id/cancel',
  authenticate,
  validate(schemas.objectId, 'params'),
  redemptionController.cancel
);

// ========== Rotas Admin ==========

/**
 * @route GET /api/redemptions/admin/all
 * @desc Listar todos os resgates
 * @access Admin
 */
router.get('/admin/all',
  authenticate,
  requireAdmin,
  redemptionController.listAll
);

/**
 * @route GET /api/redemptions/admin/pending
 * @desc Listar resgates pendentes
 * @access Admin
 */
router.get('/admin/pending',
  authenticate,
  requireAdmin,
  redemptionController.listPending
);

/**
 * @route GET /api/redemptions/admin/stats
 * @desc Estatísticas de resgates
 * @access Admin
 */
router.get('/admin/stats',
  authenticate,
  requireAdmin,
  redemptionController.getStats
);

/**
 * @route POST /api/redemptions/:id/approve
 * @desc Aprovar resgate
 * @access Admin
 */
router.post('/:id/approve',
  authenticate,
  requireAdmin,
  validate(schemas.objectId, 'params'),
  redemptionController.approve
);

/**
 * @route POST /api/redemptions/:id/deliver
 * @desc Marcar como entregue
 * @access Admin
 */
router.post('/:id/deliver',
  authenticate,
  requireAdmin,
  validate(schemas.objectId, 'params'),
  redemptionController.deliver
);

/**
 * @route POST /api/redemptions/validate-code
 * @desc Validar resgate por código
 * @access Admin
 */
router.post('/validate-code',
  authenticate,
  requireAdmin,
  redemptionController.validateByCode
);

/**
 * @route POST /api/redemptions/:id/admin-cancel
 * @desc Cancelar resgate (admin)
 * @access Admin
 */
router.post('/:id/admin-cancel',
  authenticate,
  requireAdmin,
  validate(schemas.objectId, 'params'),
  redemptionController.adminCancel
);

export default router;
