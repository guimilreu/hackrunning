import { HPoint, User, AuditLog } from '../models/index.js';
import { hpointService } from '../services/hpointService.js';

/**
 * Obter saldo de HPoints
 */
export const getBalance = async (req, res) => {
  try {
    const balance = await hpointService.getBalance(req.user._id);

    res.json({
      success: true,
      data: { balance }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Erro ao obter saldo'
    });
  }
};

/**
 * Obter histórico de HPoints
 */
export const getHistory = async (req, res) => {
  try {
    const { page = 1, limit = 20, type } = req.query;

    const result = await hpointService.getHistory(req.user._id, {
      page: parseInt(page),
      limit: parseInt(limit),
      type
    });

    res.json({
      success: true,
      data: result
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Erro ao obter histórico'
    });
  }
};

/**
 * Obter pontos expirando
 */
export const getExpiring = async (req, res) => {
  try {
    const { days = 30 } = req.query;
    const expiring = await hpointService.getExpiringPoints(req.user._id, parseInt(days));

    res.json({
      success: true,
      data: { expiring }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Erro ao obter pontos expirando'
    });
  }
};

/**
 * Obter resumo de HPoints
 */
export const getSummary = async (req, res) => {
  try {
    const userId = req.user._id;

    const [balance, expiring, history] = await Promise.all([
      hpointService.getBalance(userId),
      hpointService.getExpiringPoints(userId, 30),
      hpointService.getHistory(userId, { limit: 5 })
    ]);

    // Calcular ganhos/gastos do mês
    const startOfMonth = new Date();
    startOfMonth.setDate(1);
    startOfMonth.setHours(0, 0, 0, 0);

    const monthTransactions = await HPoint.find({
      user: userId,
      createdAt: { $gte: startOfMonth }
    });

    const monthEarned = monthTransactions
      .filter(t => t.type === 'credit')
      .reduce((sum, t) => sum + t.points, 0);

    const monthSpent = monthTransactions
      .filter(t => t.type === 'debit')
      .reduce((sum, t) => sum + t.points, 0);

    res.json({
      success: true,
      data: {
        balance,
        expiring,
        recentTransactions: history.transactions,
        monthStats: {
          earned: monthEarned,
          spent: monthSpent,
          net: monthEarned - monthSpent
        }
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Erro ao obter resumo'
    });
  }
};

// ========== ADMIN ==========

/**
 * Creditar pontos manualmente (admin)
 */
export const credit = async (req, res) => {
  try {
    const { userId, points, description, reason } = req.body;

    if (!userId || !points || points <= 0) {
      return res.status(400).json({
        success: false,
        message: 'Dados inválidos'
      });
    }

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'Usuário não encontrado'
      });
    }

    const hpoint = await hpointService.creditPoints(
      userId,
      points,
      description || 'Crédito manual',
      { type: 'manual', adminId: req.user._id, reason }
    );

    // Log de auditoria
    await AuditLog.logCreate('hpoint', hpoint._id, req.user._id, {
      userId,
      points,
      description,
      reason
    }, req);

    res.json({
      success: true,
      message: `${points} HPoints creditados`,
      data: { hpoint }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Erro ao creditar pontos'
    });
  }
};

/**
 * Debitar pontos manualmente (admin)
 */
export const debit = async (req, res) => {
  try {
    const { userId, points, description, reason } = req.body;

    if (!userId || !points || points <= 0) {
      return res.status(400).json({
        success: false,
        message: 'Dados inválidos'
      });
    }

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'Usuário não encontrado'
      });
    }

    // Verificar saldo
    const balance = await hpointService.getBalance(userId);
    if (balance < points) {
      return res.status(400).json({
        success: false,
        message: 'Saldo insuficiente'
      });
    }

    const hpoint = await hpointService.debitPoints(
      userId,
      points,
      description || 'Débito manual',
      { type: 'manual', adminId: req.user._id, reason }
    );

    // Log de auditoria
    await AuditLog.logCreate('hpoint', hpoint._id, req.user._id, {
      userId,
      points: -points,
      description,
      reason
    }, req);

    res.json({
      success: true,
      message: `${points} HPoints debitados`,
      data: { hpoint }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message || 'Erro ao debitar pontos'
    });
  }
};

/**
 * Ajustar pontos (admin)
 */
export const adjust = async (req, res) => {
  try {
    const { userId, points, description, reason } = req.body;

    if (!userId || points === undefined || points === 0) {
      return res.status(400).json({
        success: false,
        message: 'Dados inválidos'
      });
    }

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'Usuário não encontrado'
      });
    }

    const hpoint = await hpointService.adjustPoints(
      userId,
      points,
      description || 'Ajuste manual',
      req.user._id,
      reason
    );

    res.json({
      success: true,
      message: `Ajuste de ${points} HPoints realizado`,
      data: { hpoint }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message || 'Erro ao ajustar pontos'
    });
  }
};

/**
 * Obter histórico de usuário específico (admin)
 */
export const getUserHistory = async (req, res) => {
  try {
    const { userId } = req.params;
    const { page = 1, limit = 50, type } = req.query;

    const result = await hpointService.getHistory(userId, {
      page: parseInt(page),
      limit: parseInt(limit),
      type
    });

    res.json({
      success: true,
      data: result
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Erro ao obter histórico'
    });
  }
};

/**
 * Obter estatísticas gerais de HPoints (admin)
 */
export const getStats = async (req, res) => {
  try {
    const { startDate, endDate } = req.query;

    const dateFilter = {};
    if (startDate) dateFilter.$gte = new Date(startDate);
    if (endDate) dateFilter.$lte = new Date(endDate);

    const matchStage = {};
    if (Object.keys(dateFilter).length > 0) {
      matchStage.createdAt = dateFilter;
    }

    const stats = await HPoint.aggregate([
      { $match: matchStage },
      {
        $group: {
          _id: '$type',
          total: { $sum: '$points' },
          count: { $sum: 1 }
        }
      }
    ]);

    const totalActive = await HPoint.aggregate([
      { $match: { expired: false, redeemed: false, type: 'credit' } },
      { $group: { _id: null, total: { $sum: '$points' } } }
    ]);

    const expiringNext30Days = await HPoint.aggregate([
      {
        $match: {
          expired: false,
          redeemed: false,
          type: 'credit',
          expiresAt: {
            $gte: new Date(),
            $lte: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
          }
        }
      },
      { $group: { _id: null, total: { $sum: '$points' } } }
    ]);

    res.json({
      success: true,
      data: {
        byType: stats,
        totalActive: totalActive[0]?.total || 0,
        expiringNext30Days: expiringNext30Days[0]?.total || 0
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Erro ao obter estatísticas'
    });
  }
};

/**
 * Expirar pontos manualmente (admin)
 */
export const expirePoints = async (req, res) => {
  try {
    const result = await hpointService.expirePoints();

    res.json({
      success: true,
      message: `${result.expiredCount} transações expiradas`,
      data: result
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Erro ao expirar pontos'
    });
  }
};

export default {
  getBalance,
  getHistory,
  getExpiring,
  getSummary,
  credit,
  debit,
  adjust,
  getUserHistory,
  getStats,
  expirePoints
};
