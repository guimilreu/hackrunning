import { Router } from 'express';
import trainingPlanController from '../controllers/trainingPlanController.js';
import { authenticate, requireAdmin, requireOnboarding } from '../middleware/auth.js';
import { validate, schemas } from '../middleware/validation.js';

const router = Router();

// ========== Rotas do Membro ==========

/**
 * @route GET /api/training-plans/current
 * @desc Obter plano de treino atual
 * @access Private
 */
router.get('/current', authenticate, trainingPlanController.getCurrent);

/**
 * @route GET /api/training-plans/check-missing-data
 * @desc Verificar dados faltantes para gerar treino
 * @access Private (não requer onboarding completo)
 */
router.get('/check-missing-data', authenticate, trainingPlanController.checkMissingData);

/**
 * @route POST /api/training-plans/generate-from-missing-data
 * @desc Gerar treino após completar dados faltantes
 * @access Private (não requer onboarding completo)
 */
router.post('/generate-from-missing-data', authenticate, trainingPlanController.generateFromMissingData);

/**
 * @route GET /api/training-plans/next-workout
 * @desc Obter próximo treino
 * @access Private
 */
router.get('/next-workout', authenticate, requireOnboarding, trainingPlanController.getNextWorkout);

/**
 * @route GET /api/training-plans/week
 * @desc Obter treinos da semana
 * @access Private
 */
router.get('/week', authenticate, requireOnboarding, trainingPlanController.getWeekWorkouts);

/**
 * @route POST /api/training-plans/generate
 * @desc Gerar novo plano
 * @access Private
 */
router.post('/generate',
  authenticate,
  requireOnboarding,
  trainingPlanController.generate
);

/**
 * @route GET /api/training-plans/check-adjustment
 * @desc Verificar necessidade de ajuste
 * @access Private
 */
router.get('/check-adjustment', authenticate, requireOnboarding, trainingPlanController.checkAdjustment);

/**
 * @route POST /api/training-plans/apply-adjustment
 * @desc Aplicar ajuste ao plano
 * @access Private
 */
router.post('/apply-adjustment', authenticate, requireOnboarding, trainingPlanController.applyAdjustment);

/**
 * @route GET /api/training-plans/history
 * @desc Obter histórico de planos
 * @access Private
 */
router.get('/history', authenticate, requireOnboarding, trainingPlanController.getHistory);

/**
 * @route GET /api/training-plans/:planId/stats
 * @desc Obter estatísticas do plano
 * @access Private
 */
router.get('/:planId/stats',
  authenticate,
  requireOnboarding,
  validate(schemas.objectId, 'params'),
  trainingPlanController.getStats
);

/**
 * @route DELETE /api/training-plans/:planId
 * @desc Cancelar plano
 * @access Private
 */
router.delete('/:planId',
  authenticate,
  requireOnboarding,
  validate(schemas.objectId, 'params'),
  trainingPlanController.cancel
);

// ========== Rotas Admin ==========

/**
 * @route GET /api/training-plans/admin/pending-review
 * @desc Listar planos pendentes de revisão
 * @access Admin
 */
router.get('/admin/pending-review',
  authenticate,
  requireAdmin,
  trainingPlanController.listPendingReview
);

/**
 * @route GET /api/training-plans/admin/:id
 * @desc Obter plano por ID
 * @access Admin
 */
router.get('/admin/:id',
  authenticate,
  requireAdmin,
  validate(schemas.objectId, 'params'),
  trainingPlanController.getById
);

/**
 * @route POST /api/training-plans/admin/:id/review
 * @desc Revisar plano
 * @access Admin
 */
router.post('/admin/:id/review',
  authenticate,
  requireAdmin,
  validate(schemas.objectId, 'params'),
  trainingPlanController.review
);

export default router;
