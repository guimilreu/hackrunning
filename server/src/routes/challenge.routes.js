import { Router } from 'express';
import challengeController from '../controllers/challengeController.js';
import { authenticate, requireAdmin, requireOnboarding } from '../middleware/auth.js';
import { validate, schemas } from '../middleware/validation.js';

const router = Router();

// ========== Rotas do Membro ==========

/**
 * @route GET /api/challenges
 * @desc Listar desafios
 * @access Private
 */
router.get('/', authenticate, requireOnboarding, challengeController.list);

/**
 * @route GET /api/challenges/my
 * @desc Meus desafios
 * @access Private
 */
router.get('/my', authenticate, requireOnboarding, challengeController.myChallenges);

/**
 * @route GET /api/challenges/:id
 * @desc Obter desafio por ID
 * @access Private
 */
router.get('/:id',
  authenticate,
  requireOnboarding,
  validate(schemas.objectId, 'params'),
  challengeController.getById
);

/**
 * @route GET /api/challenges/:id/ranking
 * @desc Obter ranking do desafio
 * @access Private
 */
router.get('/:id/ranking',
  authenticate,
  requireOnboarding,
  validate(schemas.objectId, 'params'),
  challengeController.getRanking
);

/**
 * @route POST /api/challenges/:id/participate
 * @desc Participar de um desafio
 * @access Private
 */
router.post('/:id/participate',
  authenticate,
  requireOnboarding,
  validate(schemas.objectId, 'params'),
  challengeController.participate
);

/**
 * @route POST /api/challenges/:id/progress
 * @desc Atualizar progresso
 * @access Private
 */
router.post('/:id/progress',
  authenticate,
  requireOnboarding,
  validate(schemas.objectId, 'params'),
  challengeController.updateProgress
);

// ========== Rotas Admin ==========

/**
 * @route POST /api/challenges
 * @desc Criar desafio
 * @access Admin
 */
router.post('/',
  authenticate,
  requireAdmin,
  validate(schemas.challenges.create),
  challengeController.create
);

/**
 * @route PUT /api/challenges/:id
 * @desc Atualizar desafio
 * @access Admin
 */
router.put('/:id',
  authenticate,
  requireAdmin,
  validate(schemas.objectId, 'params'),
  validate(schemas.challenges.update),
  challengeController.update
);

/**
 * @route DELETE /api/challenges/:id
 * @desc Deletar desafio
 * @access Admin
 */
router.delete('/:id',
  authenticate,
  requireAdmin,
  validate(schemas.objectId, 'params'),
  challengeController.remove
);

/**
 * @route GET /api/challenges/:id/stats
 * @desc Estatísticas do desafio
 * @access Admin
 */
router.get('/:id/stats',
  authenticate,
  requireAdmin,
  validate(schemas.objectId, 'params'),
  challengeController.getStats
);

export default router;
