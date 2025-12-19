import { User, Workout, Order, Redemption, Event, Challenge, Company, HPoint, AuditLog } from '../models/index.js';
import { hpointService } from '../services/hpointService.js';
import { notificationService } from '../services/notificationService.js';

/**
 * Dashboard administrativo
 */
export const getDashboard = async (req, res) => {
  try {
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const endOfLastMonth = new Date(now.getFullYear(), now.getMonth(), 0);

    // Estatísticas gerais
    const [
      totalUsers,
      activeUsers,
      newUsersThisMonth,
      newUsersLastMonth,
      totalWorkouts,
      workoutsThisMonth,
      pendingWorkouts,
      pendingRedemptions,
      activeEvents,
      activeChallenges
    ] = await Promise.all([
      User.countDocuments(),
      User.countDocuments({ active: true }),
      User.countDocuments({ createdAt: { $gte: startOfMonth } }),
      User.countDocuments({ createdAt: { $gte: startOfLastMonth, $lte: endOfLastMonth } }),
      Workout.countDocuments(),
      Workout.countDocuments({ date: { $gte: startOfMonth } }),
      Workout.countDocuments({ hpointsStatus: 'pending', 'photo.url': { $exists: true } }),
      Redemption.countDocuments({ status: 'pending' }),
      Event.countDocuments({ active: true, date: { $gte: now } }),
      Challenge.countDocuments({ active: true, endDate: { $gte: now } })
    ]);

    // Distribuição por plano
    const usersByPlan = await User.aggregate([
      { $match: { active: true } },
      { $group: { _id: '$plan.type', count: { $sum: 1 } } }
    ]);

    // Receita do mês (pedidos pagos)
    const revenueThisMonth = await Order.aggregate([
      {
        $match: {
          'payment.status': 'paid',
          createdAt: { $gte: startOfMonth }
        }
      },
      { $group: { _id: null, total: { $sum: '$totalValue' } } }
    ]);

    // HPoints emitidos vs resgatados
    const hpointsStats = await HPoint.aggregate([
      {
        $match: { createdAt: { $gte: startOfMonth } }
      },
      {
        $group: {
          _id: '$type',
          total: { $sum: '$points' }
        }
      }
    ]);

    res.json({
      success: true,
      data: {
        users: {
          total: totalUsers,
          active: activeUsers,
          newThisMonth: newUsersThisMonth,
          growthRate: newUsersLastMonth > 0 
            ? ((newUsersThisMonth - newUsersLastMonth) / newUsersLastMonth * 100).toFixed(1)
            : 0,
          byPlan: usersByPlan
        },
        workouts: {
          total: totalWorkouts,
          thisMonth: workoutsThisMonth,
          pendingValidation: pendingWorkouts
        },
        redemptions: {
          pending: pendingRedemptions
        },
        events: {
          active: activeEvents
        },
        challenges: {
          active: activeChallenges
        },
        revenue: {
          thisMonth: revenueThisMonth[0]?.total || 0
        },
        hpoints: {
          creditedThisMonth: hpointsStats.find(h => h._id === 'credit')?.total || 0,
          debitedThisMonth: hpointsStats.find(h => h._id === 'debit')?.total || 0
        }
      }
    });
  } catch (error) {
    console.error('Erro ao obter dashboard:', error);
    res.status(500).json({
      success: false,
      message: 'Erro ao obter dashboard'
    });
  }
};

/**
 * Obter logs de auditoria
 */
export const getAuditLogs = async (req, res) => {
  try {
    const { 
      page = 1, 
      limit = 50, 
      type, 
      entity, 
      userId,
      startDate,
      endDate 
    } = req.query;

    const query = {};
    if (type) query.type = type;
    if (entity) query['entity.type'] = entity;
    if (userId) query.user = userId;
    if (startDate || endDate) {
      query.createdAt = {};
      if (startDate) query.createdAt.$gte = new Date(startDate);
      if (endDate) query.createdAt.$lte = new Date(endDate);
    }

    const [logs, total] = await Promise.all([
      AuditLog.find(query)
        .populate('user', 'firstName lastName email')
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(parseInt(limit)),
      AuditLog.countDocuments(query)
    ]);

    res.json({
      success: true,
      data: {
        logs,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          pages: Math.ceil(total / limit)
        }
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Erro ao obter logs'
    });
  }
};

/**
 * Relatório de usuários
 */
export const getUsersReport = async (req, res) => {
  try {
    const { startDate, endDate, groupBy = 'day' } = req.query;

    const dateFilter = {};
    if (startDate) dateFilter.$gte = new Date(startDate);
    if (endDate) dateFilter.$lte = new Date(endDate);

    let dateFormat;
    switch (groupBy) {
      case 'month':
        dateFormat = '%Y-%m';
        break;
      case 'week':
        dateFormat = '%Y-W%V';
        break;
      default:
        dateFormat = '%Y-%m-%d';
    }

    const matchStage = {};
    if (Object.keys(dateFilter).length > 0) {
      matchStage.createdAt = dateFilter;
    }

    const report = await User.aggregate([
      { $match: matchStage },
      {
        $group: {
          _id: { $dateToString: { format: dateFormat, date: '$createdAt' } },
          newUsers: { $sum: 1 },
          byPlan: { $push: '$plan.type' }
        }
      },
      { $sort: { _id: 1 } }
    ]);

    // Processar dados por plano
    const processedReport = report.map(r => ({
      period: r._id,
      newUsers: r.newUsers,
      byPlan: r.byPlan.reduce((acc, plan) => {
        acc[plan] = (acc[plan] || 0) + 1;
        return acc;
      }, {})
    }));

    res.json({
      success: true,
      data: { report: processedReport, groupBy }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Erro ao gerar relatório'
    });
  }
};

/**
 * Relatório de treinos
 */
export const getWorkoutsReport = async (req, res) => {
  try {
    const { startDate, endDate, groupBy = 'day' } = req.query;

    const dateFilter = {};
    if (startDate) dateFilter.$gte = new Date(startDate);
    if (endDate) dateFilter.$lte = new Date(endDate);

    let dateFormat;
    switch (groupBy) {
      case 'month':
        dateFormat = '%Y-%m';
        break;
      case 'week':
        dateFormat = '%Y-W%V';
        break;
      default:
        dateFormat = '%Y-%m-%d';
    }

    const matchStage = {};
    if (Object.keys(dateFilter).length > 0) {
      matchStage.date = dateFilter;
    }

    const report = await Workout.aggregate([
      { $match: matchStage },
      {
        $group: {
          _id: { $dateToString: { format: dateFormat, date: '$date' } },
          totalWorkouts: { $sum: 1 },
          totalDistance: { $sum: '$distance' },
          totalTime: { $sum: '$time' },
          uniqueUsers: { $addToSet: '$user' },
          byType: { $push: '$workoutType' }
        }
      },
      { $sort: { _id: 1 } }
    ]);

    const processedReport = report.map(r => ({
      period: r._id,
      totalWorkouts: r.totalWorkouts,
      totalDistance: Math.round(r.totalDistance * 10) / 10,
      totalTime: r.totalTime,
      uniqueUsers: r.uniqueUsers.length,
      byType: r.byType.reduce((acc, type) => {
        acc[type || 'other'] = (acc[type || 'other'] || 0) + 1;
        return acc;
      }, {})
    }));

    res.json({
      success: true,
      data: { report: processedReport, groupBy }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Erro ao gerar relatório'
    });
  }
};

/**
 * Relatório financeiro
 */
export const getFinancialReport = async (req, res) => {
  try {
    const { startDate, endDate, groupBy = 'month' } = req.query;

    const dateFilter = {};
    if (startDate) dateFilter.$gte = new Date(startDate);
    if (endDate) dateFilter.$lte = new Date(endDate);

    let dateFormat;
    switch (groupBy) {
      case 'day':
        dateFormat = '%Y-%m-%d';
        break;
      case 'week':
        dateFormat = '%Y-W%V';
        break;
      default:
        dateFormat = '%Y-%m';
    }

    const matchStage = { 'payment.status': 'paid' };
    if (Object.keys(dateFilter).length > 0) {
      matchStage.createdAt = dateFilter;
    }

    const report = await Order.aggregate([
      { $match: matchStage },
      {
        $group: {
          _id: {
            period: { $dateToString: { format: dateFormat, date: '$createdAt' } },
            type: '$type'
          },
          totalRevenue: { $sum: '$totalValue' },
          orderCount: { $sum: 1 }
        }
      },
      { $sort: { '_id.period': 1 } }
    ]);

    // Reorganizar por período
    const byPeriod = {};
    report.forEach(r => {
      if (!byPeriod[r._id.period]) {
        byPeriod[r._id.period] = { period: r._id.period, total: 0, byType: {} };
      }
      byPeriod[r._id.period].total += r.totalRevenue;
      byPeriod[r._id.period].byType[r._id.type] = {
        revenue: r.totalRevenue,
        orders: r.orderCount
      };
    });

    res.json({
      success: true,
      data: { 
        report: Object.values(byPeriod),
        groupBy
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Erro ao gerar relatório'
    });
  }
};

/**
 * Relatório de empresas
 */
export const getCompaniesReport = async (req, res) => {
  try {
    const companies = await Company.find({ active: true })
      .populate('employees.user', 'firstName lastName email hpointsBalance')
      .select('name cnpj plan employees dashboard');

    const report = companies.map(c => ({
      id: c._id,
      name: c.name,
      cnpj: c.cnpj,
      plan: c.plan,
      employeesCount: c.employees.filter(e => e.active).length,
      dashboard: c.dashboard
    }));

    res.json({
      success: true,
      data: { report }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Erro ao gerar relatório'
    });
  }
};

/**
 * Exportar dados
 */
export const exportData = async (req, res) => {
  try {
    const { entity, format = 'json', startDate, endDate } = req.query;

    const dateFilter = {};
    if (startDate) dateFilter.$gte = new Date(startDate);
    if (endDate) dateFilter.$lte = new Date(endDate);

    let data;
    const matchStage = Object.keys(dateFilter).length > 0 ? { createdAt: dateFilter } : {};

    switch (entity) {
      case 'users':
        data = await User.find(matchStage)
          .select('-password -security.passwordResetToken')
          .lean();
        break;
      case 'workouts':
        data = await Workout.find(matchStage)
          .populate('user', 'firstName lastName email')
          .lean();
        break;
      case 'orders':
        data = await Order.find(matchStage)
          .populate('user', 'firstName lastName email')
          .lean();
        break;
      case 'redemptions':
        data = await Redemption.find(matchStage)
          .populate('user', 'firstName lastName email')
          .lean();
        break;
      default:
        return res.status(400).json({
          success: false,
          message: 'Entidade inválida'
        });
    }

    if (format === 'csv') {
      // Converter para CSV
      const fields = Object.keys(data[0] || {});
      const csv = [
        fields.join(','),
        ...data.map(row => 
          fields.map(f => JSON.stringify(row[f] || '')).join(',')
        )
      ].join('\n');

      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', `attachment; filename=${entity}-export.csv`);
      return res.send(csv);
    }

    res.json({
      success: true,
      data: { [entity]: data, count: data.length }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Erro ao exportar dados'
    });
  }
};

/**
 * Busca global
 */
export const globalSearch = async (req, res) => {
  try {
    const { q, limit = 10 } = req.query;

    if (!q || q.length < 2) {
      return res.status(400).json({
        success: false,
        message: 'Termo de busca deve ter pelo menos 2 caracteres'
      });
    }

    const [users, events, challenges] = await Promise.all([
      User.find({
        $or: [
          { firstName: { $regex: q, $options: 'i' } },
          { lastName: { $regex: q, $options: 'i' } },
          { email: { $regex: q, $options: 'i' } }
        ]
      })
        .select('firstName lastName email plan.type')
        .limit(parseInt(limit)),
      
      Event.find({
        name: { $regex: q, $options: 'i' }
      })
        .select('name date type')
        .limit(parseInt(limit)),
      
      Challenge.find({
        name: { $regex: q, $options: 'i' }
      })
        .select('name startDate endDate')
        .limit(parseInt(limit))
    ]);

    res.json({
      success: true,
      data: {
        users: users.map(u => ({ ...u.toObject(), _type: 'user' })),
        events: events.map(e => ({ ...e.toObject(), _type: 'event' })),
        challenges: challenges.map(c => ({ ...c.toObject(), _type: 'challenge' }))
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Erro na busca'
    });
  }
};

/**
 * Obter fila de validação de treinos
 */
export const getValidationQueue = async (req, res) => {
  try {
    const workouts = await Workout.find({
      hpointsStatus: 'pending',
      'photo.url': { $exists: true }
    })
      .populate('user', 'firstName lastName email photo')
      .sort({ createdAt: -1 })
      .limit(50);

    res.json({
      success: true,
      data: { queue: workouts }
    });
  } catch (error) {
    console.error('Erro ao obter fila de validação:', error);
    res.status(500).json({
      success: false,
      message: 'Erro ao obter fila de validação'
    });
  }
};

/**
 * Aprovar treino (via admin)
 */
export const approveValidation = async (req, res) => {
  try {
    const { id } = req.params;
    const { points, podiumPosition, bonusReason } = req.body;

    const workout = await Workout.findById(id).populate('user');
    if (!workout) {
      return res.status(404).json({
        success: false,
        message: 'Treino não encontrado'
      });
    }

    if (workout.hpointsStatus === 'approved') {
      return res.status(400).json({
        success: false,
        message: 'Treino já foi aprovado'
      });
    }

    // Calcular pontos
    const basePoints = points || await hpointService.calculatePoints('workout', {
      distance: workout.distance,
      workoutType: workout.workoutType
    });

    let totalPoints = basePoints;
    
    // Bônus de pódio
    if (podiumPosition && podiumPosition >= 1 && podiumPosition <= 3) {
      workout.podium = {
        position: podiumPosition,
        awardedAt: new Date()
      };
      const podiumBonus = { 1: 50, 2: 30, 3: 20 };
      totalPoints += podiumBonus[podiumPosition] || 0;
    }

    // Atualizar treino
    workout.hpointsStatus = 'approved';
    workout.hpointsAwarded = totalPoints;
    workout.photo.validated = true;
    workout.photo.validatedAt = new Date();
    workout.photo.validatedBy = req.user._id;
    await workout.save();

    // Creditar pontos
    await hpointService.creditPoints(
      workout.user._id,
      'workout',
      totalPoints,
      {
        description: `Treino aprovado - ${workout.distance}km`,
        referenceId: workout._id,
        referenceType: 'Workout'
      }
    );

    // Notificar usuário
    await notificationService.notifyWorkoutApproved(workout.user._id, totalPoints);

    // Log de auditoria
    await AuditLog.logUpdate('workout', id, req.user._id, 
      { hpointsStatus: 'pending' }, 
      { hpointsStatus: 'approved', hpointsAwarded: totalPoints }, 
      req
    );

    res.json({
      success: true,
      message: 'Treino aprovado',
      data: { 
        workout,
        pointsAwarded: totalPoints
      }
    });
  } catch (error) {
    console.error('Erro ao aprovar validação:', error);
    res.status(500).json({
      success: false,
      message: 'Erro ao aprovar treino'
    });
  }
};

/**
 * Rejeitar treino (via admin)
 */
export const rejectValidation = async (req, res) => {
  try {
    const { id } = req.params;
    const { reason } = req.body;

    if (!reason) {
      return res.status(400).json({
        success: false,
        message: 'Motivo da rejeição é obrigatório'
      });
    }

    const workout = await Workout.findById(id).populate('user');
    if (!workout) {
      return res.status(404).json({
        success: false,
        message: 'Treino não encontrado'
      });
    }

    workout.hpointsStatus = 'rejected';
    workout.photo.validated = false;
    workout.photo.rejectionReason = reason;
    await workout.save();

    // Notificar usuário
    await notificationService.notifyWorkoutRejected(workout.user._id, reason);

    // Log de auditoria
    await AuditLog.logUpdate('workout', id, req.user._id,
      { hpointsStatus: 'pending' },
      { hpointsStatus: 'rejected', reason },
      req
    );

    res.json({
      success: true,
      message: 'Treino rejeitado',
      data: { workout }
    });
  } catch (error) {
    console.error('Erro ao rejeitar validação:', error);
    res.status(500).json({
      success: false,
      message: 'Erro ao rejeitar treino'
    });
  }
};

/**
 * Obter estatísticas gerais
 */
export const getStats = async (req, res) => {
  try {
    const [
      totalMembers,
      totalWorkouts,
      totalHPoints,
      totalRedemptions
    ] = await Promise.all([
      User.countDocuments({ active: true }),
      Workout.countDocuments(),
      HPoint.aggregate([
        { $group: { _id: null, total: { $sum: '$points' } } }
      ]),
      Redemption.countDocuments()
    ]);

    // Calcular adesão média (usuários com pelo menos 1 treino no último mês)
    const oneMonthAgo = new Date();
    oneMonthAgo.setMonth(oneMonthAgo.getMonth() - 1);
    
    const activeUsersThisMonth = await User.countDocuments({
      active: true,
      _id: {
        $in: (await Workout.distinct('user', { date: { $gte: oneMonthAgo } }))
      }
    });

    const totalActiveUsers = await User.countDocuments({ active: true });
    const averageAdherence = totalActiveUsers > 0 
      ? Math.round((activeUsersThisMonth / totalActiveUsers) * 100)
      : 0;

    // Calcular KM total
    const kmStats = await Workout.aggregate([
      { $group: { _id: null, totalKm: { $sum: '$distance' } } }
    ]);
    const totalKm = Math.round((kmStats[0]?.totalKm || 0) * 10) / 10;

    // HPoints gerados
    const hpointsGenerated = await HPoint.aggregate([
      { $match: { type: 'credit' } },
      { $group: { _id: null, total: { $sum: '$points' } } }
    ]);

    res.json({
      success: true,
      data: {
        totalMembers,
        averageAdherence,
        totalKm,
        totalHPoints: hpointsGenerated[0]?.total || 0,
        totalWorkouts,
        totalRedemptions
      }
    });
  } catch (error) {
    console.error('Erro ao obter estatísticas:', error);
    res.status(500).json({
      success: false,
      message: 'Erro ao obter estatísticas'
    });
  }
};

export default {
  getDashboard,
  getAuditLogs,
  getUsersReport,
  getWorkoutsReport,
  getFinancialReport,
  getCompaniesReport,
  exportData,
  globalSearch,
  getValidationQueue,
  approveValidation,
  rejectValidation,
  getStats
};
