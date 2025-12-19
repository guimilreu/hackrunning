import { Router } from 'express';
import onboardingController from '../controllers/onboardingController.js';
import { authenticate } from '../middleware/auth.js';
import { validate, schemas } from '../middleware/validation.js';

const router = Router();

/**
 * @route GET /api/onboarding/status
 * @desc Obter status do onboarding
 * @access Private
 */
router.get('/status', authenticate, onboardingController.getStatus);

/**
 * @route GET /api/onboarding/options
 * @desc Obter opções para onboarding
 * @access Private
 */
router.get('/options', authenticate, onboardingController.getOptions);

/**
 * @route POST /api/onboarding/runner-profile
 * @desc Salvar perfil de corredor (Step 1 do frontend)
 * @access Private
 */
router.post('/runner-profile',
  authenticate,
  onboardingController.saveRunnerProfile
);

/**
 * @route POST /api/onboarding/objectives
 * @desc Salvar objetivos (Step 2 do frontend)
 * @access Private
 */
router.post('/objectives',
  authenticate,
  onboardingController.saveObjectives
);

/**
 * @route POST /api/onboarding/metrics
 * @desc Salvar métricas e metas (Step 3 do frontend)
 * @access Private
 */
router.post('/metrics',
  authenticate,
  onboardingController.saveMetrics
);

/**
 * @route POST /api/onboarding/anamnesis
 * @desc Salvar anamnese completa - saúde e estilo de vida (Step 4)
 * @access Private
 */
router.post('/anamnesis',
  authenticate,
  onboardingController.saveAnamnesis
);

/**
 * @route POST /api/onboarding/running-history
 * @desc Salvar histórico de corrida e dores (Step 5)
 * @access Private
 */
router.post('/running-history',
  authenticate,
  onboardingController.saveRunningHistory
);

/**
 * @route POST /api/onboarding/physical-tests
 * @desc Salvar testes físicos (Step 6)
 * @access Private
 */
router.post('/physical-tests',
  authenticate,
  onboardingController.savePhysicalTests
);

/**
 * @route POST /api/onboarding/personal
 * @desc Salvar dados pessoais (Step 1)
 * @access Private
 */
router.post('/personal',
  authenticate,
  validate(schemas.onboarding.personal),
  onboardingController.savePersonalData
);

/**
 * @route POST /api/onboarding/address
 * @desc Salvar endereço (Step 2)
 * @access Private
 */
router.post('/address',
  authenticate,
  validate(schemas.onboarding.address),
  onboardingController.saveAddress
);

/**
 * @route POST /api/onboarding/running-goal
 * @desc Salvar objetivo de corrida (Step 3)
 * @access Private
 */
router.post('/running-goal',
  authenticate,
  validate(schemas.onboarding.runningGoal),
  onboardingController.saveRunningGoal
);

/**
 * @route POST /api/onboarding/shirt-size
 * @desc Salvar tamanho de camiseta (Step 4)
 * @access Private
 */
router.post('/shirt-size',
  authenticate,
  validate(schemas.onboarding.shirtSize),
  onboardingController.saveShirtSize
);

/**
 * @route POST /api/onboarding/complete
 * @desc Finalizar onboarding (Step 5)
 * @access Private
 */
router.post('/complete', authenticate, onboardingController.complete);

/**
 * @route POST /api/onboarding/back
 * @desc Voltar para etapa anterior
 * @access Private
 */
router.post('/back', authenticate, onboardingController.goBack);

/**
 * @route POST /api/onboarding/skip-to-kickstart
 * @desc Pular todas as etapas e ir direto para o kickstart-kit
 * @access Private
 */
router.post('/skip-to-kickstart', authenticate, onboardingController.skipToKickstart);

export default router;
