import express from 'express';
import { authenticate } from '../middleware/auth.js';
import { requireRole } from '../middleware/roles.js';
import subscriptionController from '../controllers/subscriptionController.js';

const router = express.Router();

// ========== ROTAS PÚBLICAS ==========

/**
 * @route   GET /api/subscriptions/plans
 * @desc    Listar planos disponíveis
 * @access  Public
 */
router.get('/plans', subscriptionController.listPlans);

// ========== ROTAS AUTENTICADAS ==========

/**
 * @route   GET /api/subscriptions/current
 * @desc    Obter assinatura atual do usuário
 * @access  Private
 */
router.get('/current', authenticate, subscriptionController.getCurrentSubscription);

/**
 * @route   POST /api/subscriptions/subscribe
 * @desc    Assinar um plano
 * @access  Private
 */
router.post('/subscribe', authenticate, subscriptionController.subscribe);

/**
 * @route   PUT /api/subscriptions/change
 * @desc    Trocar de plano (upgrade/downgrade)
 * @access  Private
 */
router.put('/change', authenticate, subscriptionController.changePlan);

/**
 * @route   POST /api/subscriptions/cancel
 * @desc    Cancelar assinatura
 * @access  Private
 */
router.post('/cancel', authenticate, subscriptionController.cancelSubscription);

/**
 * @route   POST /api/subscriptions/reactivate
 * @desc    Reativar assinatura cancelada
 * @access  Private
 */
router.post('/reactivate', authenticate, subscriptionController.reactivateSubscription);

/**
 * @route   GET /api/subscriptions/history
 * @desc    Obter histórico de assinatura
 * @access  Private
 */
router.get('/history', authenticate, subscriptionController.getSubscriptionHistory);

/**
 * @route   GET /api/subscriptions/payments
 * @desc    Obter pagamentos da assinatura
 * @access  Private
 */
router.get('/payments', authenticate, subscriptionController.getSubscriptionPayments);

/**
 * @route   PUT /api/subscriptions/payment-method
 * @desc    Atualizar método de pagamento
 * @access  Private
 */
router.put('/payment-method', authenticate, subscriptionController.updatePaymentMethod);

// ========== ROTAS ADMIN ==========

/**
 * @route   GET /api/subscriptions/admin/list
 * @desc    Listar todas as assinaturas
 * @access  Admin
 */
router.get(
  '/admin/list',
  authenticate,
  requireRole(['super_admin', 'operational_admin']),
  subscriptionController.listAllSubscriptions
);

/**
 * @route   GET /api/subscriptions/admin/stats
 * @desc    Obter estatísticas de assinaturas
 * @access  Admin
 */
router.get(
  '/admin/stats',
  authenticate,
  requireRole(['super_admin', 'operational_admin']),
  subscriptionController.getSubscriptionStats
);

/**
 * @route   PUT /api/subscriptions/admin/:id
 * @desc    Atualizar assinatura manualmente
 * @access  Admin
 */
router.put(
  '/admin/:id',
  authenticate,
  requireRole(['super_admin']),
  subscriptionController.adminUpdateSubscription
);

export default router;
