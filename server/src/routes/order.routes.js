import { Router } from 'express';
import orderController from '../controllers/orderController.js';
import { authenticate, requireAdmin } from '../middleware/auth.js';
import { validate, schemas } from '../middleware/validation.js';

const router = Router();

// ========== Rotas do Membro ==========

/**
 * @route POST /api/orders
 * @desc Criar pedido
 * @access Private
 */
router.post('/',
  authenticate,
  validate(schemas.orders.create),
  orderController.create
);

/**
 * @route GET /api/orders/my-pending-order
 * @desc Buscar pedido pendente do usuário (PIX/Boleto)
 * @access Private
 */
router.get('/my-pending-order',
  authenticate,
  orderController.getMyPendingOrder
);

/**
 * @route GET /api/orders
 * @desc Listar pedidos do usuário
 * @access Private
 */
router.get('/',
  authenticate,
  validate(schemas.pagination, 'query'),
  orderController.list
);

/**
 * @route GET /api/orders/:id
 * @desc Obter pedido por ID
 * @access Private
 */
router.get('/:id',
  authenticate,
  validate(schemas.objectId, 'params'),
  orderController.getById
);

/**
 * @route POST /api/orders/:id/cancel
 * @desc Cancelar pedido inteiro
 * @access Private
 */
router.post('/:id/cancel',
  authenticate,
  validate(schemas.objectId, 'params'),
  orderController.cancel
);

/**
 * @route POST /api/orders/:id/cancel-payment
 * @desc Cancelar apenas o pagamento (para trocar de método)
 * @access Private
 */
router.post('/:id/cancel-payment',
  authenticate,
  validate(schemas.objectId, 'params'),
  orderController.cancelPayment
);

/**
 * @route POST /api/orders/:id/pay
 * @desc Iniciar pagamento de um pedido (escolher método: PIX, BOLETO, CREDIT_CARD)
 * @access Private
 */
router.post('/:id/pay',
  authenticate,
  validate(schemas.objectId, 'params'),
  orderController.initiatePayment
);

/**
 * @route POST /api/orders/:id/pay-credit-card
 * @desc Processar pagamento com cartão de crédito (checkout transparente)
 * @access Private
 */
router.post('/:id/pay-credit-card',
  authenticate,
  validate(schemas.objectId, 'params'),
  orderController.payWithCreditCard
);

/**
 * @route PUT /api/orders/:id/delivery-address
 * @desc Atualizar endereço de entrega do pedido
 * @access Private
 */
router.put('/:id/delivery-address',
  authenticate,
  validate(schemas.objectId, 'params'),
  orderController.updateDeliveryAddress
);

// ========== Rotas Admin ==========

/**
 * @route GET /api/orders/admin/all
 * @desc Listar todos os pedidos
 * @access Admin
 */
router.get('/admin/all',
  authenticate,
  requireAdmin,
  orderController.listAll
);

/**
 * @route GET /api/orders/admin/stats
 * @desc Estatísticas de pedidos
 * @access Admin
 */
router.get('/admin/stats',
  authenticate,
  requireAdmin,
  orderController.getStats
);

/**
 * @route PUT /api/orders/:id/status
 * @desc Atualizar status do pedido
 * @access Admin
 */
router.put('/:id/status',
  authenticate,
  requireAdmin,
  validate(schemas.objectId, 'params'),
  validate(schemas.orders.updateStatus),
  orderController.updateStatus
);

/**
 * @route PUT /api/orders/:id/payment
 * @desc Atualizar pagamento
 * @access Admin
 */
router.put('/:id/payment',
  authenticate,
  requireAdmin,
  validate(schemas.objectId, 'params'),
  orderController.updatePayment
);

/**
 * @route POST /api/orders/:id/invoice
 * @desc Gerar nota fiscal
 * @access Admin
 */
router.post('/:id/invoice',
  authenticate,
  requireAdmin,
  validate(schemas.objectId, 'params'),
  orderController.generateInvoice
);

export default router;
