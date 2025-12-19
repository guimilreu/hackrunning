import { Router } from 'express';
import cycleController from '../controllers/cycleController.js';
import { authenticate, requireAdmin } from '../middleware/auth.js';
import { validate, schemas } from '../middleware/validation.js';

const router = Router();

/**
 * @route GET /api/cycles
 * @desc Listar ciclos
 * @access Private
 */
router.get('/', authenticate, cycleController.list);

/**
 * @route GET /api/cycles/options
 * @desc Obter opções de objetivos e níveis
 * @access Private
 */
router.get('/options', authenticate, cycleController.getOptions);

/**
 * @route GET /api/cycles/:id
 * @desc Obter ciclo por ID
 * @access Private
 */
router.get('/:id',
  authenticate,
  validate(schemas.objectId, 'params'),
  cycleController.getById
);

// ========== Rotas Admin ==========

/**
 * @route POST /api/cycles
 * @desc Criar ciclo
 * @access Admin
 */
router.post('/',
  authenticate,
  requireAdmin,
  validate(schemas.cycles.create),
  cycleController.create
);

/**
 * @route PUT /api/cycles/:id
 * @desc Atualizar ciclo
 * @access Admin
 */
router.put('/:id',
  authenticate,
  requireAdmin,
  validate(schemas.objectId, 'params'),
  validate(schemas.cycles.update),
  cycleController.update
);

/**
 * @route DELETE /api/cycles/:id
 * @desc Deletar ciclo
 * @access Admin
 */
router.delete('/:id',
  authenticate,
  requireAdmin,
  validate(schemas.objectId, 'params'),
  cycleController.remove
);

/**
 * @route POST /api/cycles/:id/duplicate
 * @desc Duplicar ciclo
 * @access Admin
 */
router.post('/:id/duplicate',
  authenticate,
  requireAdmin,
  validate(schemas.objectId, 'params'),
  cycleController.duplicate
);

export default router;
