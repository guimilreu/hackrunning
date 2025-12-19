import { Router } from 'express';
import workoutController from '../controllers/workoutController.js';
import { authenticate, requireAdmin, requireOnboarding } from '../middleware/auth.js';
import { validate, schemas } from '../middleware/validation.js';
import multer from 'multer';

const router = Router();
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 } // 10MB
});

// ========== Rotas do Membro ==========

/**
 * @route POST /api/workouts
 * @desc Criar novo treino
 * @access Private
 */
router.post('/',
  authenticate,
  requireOnboarding,
  validate(schemas.workouts.create),
  workoutController.create
);

/**
 * @route GET /api/workouts
 * @desc Listar treinos do usuário
 * @access Private
 */
router.get('/',
  authenticate,
  requireOnboarding,
  validate(schemas.pagination, 'query'),
  workoutController.list
);

/**
 * @route GET /api/workouts/:id
 * @desc Obter treino por ID
 * @access Private
 */
router.get('/:id',
  authenticate,
  requireOnboarding,
  validate(schemas.objectId, 'params'),
  workoutController.getById
);

/**
 * @route PUT /api/workouts/:id
 * @desc Atualizar treino
 * @access Private
 */
router.put('/:id',
  authenticate,
  requireOnboarding,
  validate(schemas.objectId, 'params'),
  validate(schemas.workouts.update),
  workoutController.update
);

/**
 * @route DELETE /api/workouts/:id
 * @desc Deletar treino
 * @access Private
 */
router.delete('/:id',
  authenticate,
  requireOnboarding,
  validate(schemas.objectId, 'params'),
  workoutController.remove
);

/**
 * @route POST /api/workouts/:id/photo
 * @desc Upload de foto do treino
 * @access Private
 */
router.post('/:id/photo',
  authenticate,
  requireOnboarding,
  validate(schemas.objectId, 'params'),
  upload.single('photo'),
  workoutController.uploadPhoto
);

/**
 * @route POST /api/workouts/:id/share
 * @desc Registrar compartilhamento
 * @access Private
 */
router.post('/:id/share',
  authenticate,
  requireOnboarding,
  validate(schemas.objectId, 'params'),
  workoutController.share
);

/**
 * @route POST /api/workouts/:id/like
 * @desc Curtir/Descurtir treino
 * @access Private
 */
router.post('/:id/like',
  authenticate,
  requireOnboarding,
  validate(schemas.objectId, 'params'),
  workoutController.toggleLike
);

/**
 * @route POST /api/workouts/:id/comments
 * @desc Adicionar comentário
 * @access Private
 */
router.post('/:id/comments',
  authenticate,
  requireOnboarding,
  validate(schemas.objectId, 'params'),
  workoutController.addComment
);

/**
 * @route DELETE /api/workouts/:id/comments/:commentId
 * @desc Deletar comentário
 * @access Private
 */
router.delete('/:id/comments/:commentId',
  authenticate,
  requireOnboarding,
  validate(schemas.objectId, 'params'),
  workoutController.deleteComment
);

// ========== Rotas Admin ==========

/**
 * @route GET /api/workouts/admin/pending
 * @desc Listar treinos pendentes de validação
 * @access Admin
 */
router.get('/admin/pending',
  authenticate,
  requireAdmin,
  workoutController.listPending
);

/**
 * @route GET /api/workouts/admin/stats
 * @desc Estatísticas de treinos
 * @access Admin
 */
router.get('/admin/stats',
  authenticate,
  requireAdmin,
  workoutController.getStats
);

/**
 * @route POST /api/workouts/:id/approve
 * @desc Aprovar treino
 * @access Admin
 */
router.post('/:id/approve',
  authenticate,
  requireAdmin,
  validate(schemas.objectId, 'params'),
  validate(schemas.workouts.approve),
  workoutController.approve
);

/**
 * @route POST /api/workouts/:id/reject
 * @desc Rejeitar treino
 * @access Admin
 */
router.post('/:id/reject',
  authenticate,
  requireAdmin,
  validate(schemas.objectId, 'params'),
  validate(schemas.workouts.reject),
  workoutController.reject
);

export default router;
