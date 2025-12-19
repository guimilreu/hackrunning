import { Router } from 'express';
import settingController from '../controllers/settingController.js';
import { authenticate, requireAdmin, requireSuperAdmin } from '../middleware/auth.js';
import { validate, schemas } from '../middleware/validation.js';

const router = Router();

// ========== Rotas Públicas/Membro ==========

/**
 * @route GET /api/settings/public
 * @desc Obter configurações públicas
 * @access Public
 */
router.get('/public', settingController.getPublic);

/**
 * @route GET /api/settings/hpoints
 * @desc Obter configurações de HPoints
 * @access Private
 */
router.get('/hpoints', authenticate, settingController.getHPointsConfig);

/**
 * @route GET /api/settings/plans
 * @desc Obter configurações de planos
 * @access Private
 */
router.get('/plans', authenticate, settingController.getPlansConfig);

// ========== Rotas Admin ==========

/**
 * @route GET /api/settings
 * @desc Listar todas as configurações
 * @access Admin
 */
router.get('/',
  authenticate,
  requireAdmin,
  settingController.list
);

/**
 * @route GET /api/settings/categories
 * @desc Listar categorias
 * @access Admin
 */
router.get('/categories',
  authenticate,
  requireAdmin,
  settingController.getCategories
);

/**
 * @route GET /api/settings/:key
 * @desc Obter configuração por chave
 * @access Admin
 */
router.get('/:key',
  authenticate,
  requireAdmin,
  settingController.getByKey
);

/**
 * @route GET /api/settings/:key/history
 * @desc Obter histórico de alterações
 * @access Admin
 */
router.get('/:key/history',
  authenticate,
  requireAdmin,
  settingController.getHistory
);

/**
 * @route POST /api/settings
 * @desc Criar ou atualizar configuração
 * @access Admin
 */
router.post('/',
  authenticate,
  requireAdmin,
  validate(schemas.settings.upsert),
  settingController.upsert
);

/**
 * @route POST /api/settings/bulk
 * @desc Atualizar múltiplas configurações
 * @access Admin
 */
router.post('/bulk',
  authenticate,
  requireAdmin,
  settingController.bulkUpdate
);

/**
 * @route DELETE /api/settings/:key
 * @desc Deletar configuração
 * @access Super Admin
 */
router.delete('/:key',
  authenticate,
  requireSuperAdmin,
  settingController.remove
);

/**
 * @route POST /api/settings/init-defaults
 * @desc Inicializar configurações padrão
 * @access Super Admin
 */
router.post('/init-defaults',
  authenticate,
  requireSuperAdmin,
  settingController.initDefaults
);

export default router;
