import { Notification, User } from '../models/index.js';
import { notificationService } from '../services/notificationService.js';

/**
 * Listar notificações do usuário
 */
export const list = async (req, res) => {
  try {
    const { page = 1, limit = 20, unreadOnly } = req.query;

    const result = await notificationService.getUserNotifications(req.user._id, {
      page: parseInt(page),
      limit: parseInt(limit),
      unreadOnly: unreadOnly === 'true'
    });

    res.json({
      success: true,
      data: result
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Erro ao listar notificações'
    });
  }
};

/**
 * Obter contagem de não lidas
 */
export const getUnreadCount = async (req, res) => {
  try {
    const count = await notificationService.getUnreadCount(req.user._id);

    res.json({
      success: true,
      data: { unreadCount: count }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Erro ao contar notificações'
    });
  }
};

/**
 * Marcar notificação como lida
 */
export const markAsRead = async (req, res) => {
  try {
    const { id } = req.params;

    const notification = await notificationService.markAsRead(req.user._id, id);

    if (!notification) {
      return res.status(404).json({
        success: false,
        message: 'Notificação não encontrada'
      });
    }

    res.json({
      success: true,
      message: 'Notificação marcada como lida',
      data: { notification }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Erro ao marcar notificação'
    });
  }
};

/**
 * Marcar todas como lidas
 */
export const markAllAsRead = async (req, res) => {
  try {
    await notificationService.markAllAsRead(req.user._id);

    res.json({
      success: true,
      message: 'Todas as notificações marcadas como lidas'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Erro ao marcar notificações'
    });
  }
};

/**
 * Deletar notificação
 */
export const remove = async (req, res) => {
  try {
    const { id } = req.params;

    const deleted = await notificationService.deleteNotification(req.user._id, id);

    if (!deleted) {
      return res.status(404).json({
        success: false,
        message: 'Notificação não encontrada'
      });
    }

    res.json({
      success: true,
      message: 'Notificação excluída'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Erro ao excluir notificação'
    });
  }
};

// ========== ADMIN ==========

/**
 * Criar notificação do sistema (admin)
 */
export const createSystem = async (req, res) => {
  try {
    const { message, link, userIds } = req.body;

    if (!message) {
      return res.status(400).json({
        success: false,
        message: 'Mensagem é obrigatória'
      });
    }

    let count;
    if (userIds && userIds.length > 0) {
      // Notificar usuários específicos
      await notificationService.createBulkNotifications(userIds, 'system', {
        title: 'Aviso do Sistema',
        message,
        link
      });
      count = userIds.length;
    } else {
      // Notificar todos os usuários - buscar todos os IDs de usuários ativos
      const allUsers = await User.find({ active: true }).select('_id');
      const allUserIds = allUsers.map(u => u._id);
      
      if (allUserIds.length > 0) {
        await notificationService.createBulkNotifications(allUserIds, 'system', {
          title: 'Aviso do Sistema',
          message,
          link
        });
        count = allUserIds.length;
      } else {
        count = 0;
      }
    }

    res.json({
      success: true,
      message: `Notificação enviada para ${count} usuários`
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Erro ao criar notificação'
    });
  }
};

/**
 * Limpar notificações antigas (admin)
 */
export const cleanOld = async (req, res) => {
  try {
    const { daysOld = 30 } = req.body;

    const deletedCount = await notificationService.deleteOldNotifications(daysOld);

    res.json({
      success: true,
      message: `${deletedCount} notificações antigas removidas`
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Erro ao limpar notificações'
    });
  }
};

/**
 * Obter estatísticas de notificações (admin)
 */
export const getStats = async (req, res) => {
  try {
    const stats = await Notification.aggregate([
      {
        $group: {
          _id: '$type',
          total: { $sum: 1 },
          read: { $sum: { $cond: ['$read', 1, 0] } },
          unread: { $sum: { $cond: ['$read', 0, 1] } }
        }
      }
    ]);

    const totals = await Notification.aggregate([
      {
        $group: {
          _id: null,
          total: { $sum: 1 },
          read: { $sum: { $cond: ['$read', 1, 0] } },
          unread: { $sum: { $cond: ['$read', 0, 1] } }
        }
      }
    ]);

    res.json({
      success: true,
      data: {
        byType: stats,
        totals: totals[0] || { total: 0, read: 0, unread: 0 }
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Erro ao obter estatísticas'
    });
  }
};

export default {
  list,
  getUnreadCount,
  markAsRead,
  markAllAsRead,
  remove,
  createSystem,
  cleanOld,
  getStats
};
