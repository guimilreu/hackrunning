import { Router } from 'express';
import notificationController from '../controllers/notificationController.js';
import { authenticate, requireAdmin } from '../middleware/auth.js';
import { validate, schemas } from '../middleware/validation.js';

const router = Router();

// ========== Rotas do Membro ==========

/**
 * @route GET /api/notifications
 * @desc Listar notificações
 * @access Private
 */
router.get('/',
  authenticate,
  validate(schemas.pagination, 'query'),
  notificationController.list
);

/**
 * @route GET /api/notifications/unread-count
 * @desc Obter contagem de não lidas
 * @access Private
 */
router.get('/unread-count', authenticate, notificationController.getUnreadCount);

/**
 * @route PUT /api/notifications/:id/read
 * @desc Marcar notificação como lida
 * @access Private
 */
router.put('/:id/read',
  authenticate,
  validate(schemas.objectId, 'params'),
  notificationController.markAsRead
);

/**
 * @route PUT /api/notifications/read-all
 * @desc Marcar todas como lidas
 * @access Private
 */
router.put('/read-all', authenticate, notificationController.markAllAsRead);

/**
 * @route DELETE /api/notifications/:id
 * @desc Deletar notificação
 * @access Private
 */
router.delete('/:id',
  authenticate,
  validate(schemas.objectId, 'params'),
  notificationController.remove
);

// ========== Rotas Admin ==========

/**
 * @route POST /api/notifications/system
 * @desc Criar notificação do sistema
 * @access Admin
 */
router.post('/system',
  authenticate,
  requireAdmin,
  validate(schemas.notifications.create),
  notificationController.createSystem
);

/**
 * @route POST /api/notifications/clean
 * @desc Limpar notificações antigas
 * @access Admin
 */
router.post('/clean',
  authenticate,
  requireAdmin,
  notificationController.cleanOld
);

/**
 * @route GET /api/notifications/stats
 * @desc Estatísticas de notificações
 * @access Admin
 */
router.get('/stats',
  authenticate,
  requireAdmin,
  notificationController.getStats
);

export default router;
