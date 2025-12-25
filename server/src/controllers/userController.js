import { User, Workout, HPoint, Redemption, AuditLog } from '../models/index.js';
import { imageService } from '../services/imageService.js';
import { hpointService } from '../services/hpointService.js';

// Fix: Corrigido queries de Workout de 'user' para 'userId'
/**
 * Obter perfil do usuário
 */
export const getProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user._id)
      .populate('currentTrainingPlan', 'objective level startDate endDate adherence workouts')
      .select('-password -security');

    res.json({
      success: true,
      data: { user: user.toSafeObject() }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Erro ao obter perfil'
    });
  }
};

/**
 * Atualizar perfil
 */
export const updateProfile = async (req, res) => {
  try {
    const allowedFields = [
      'name', 'email', 'phone', 'birthDate', 
      'gender', 'shirtSize', 'preferences', 'city'
    ];

    const updates = {};
    const addressUpdates = {};
    
    // Processar campos diretos
    allowedFields.forEach(field => {
      if (req.body[field] !== undefined) {
        if (field === 'city') {
          // Mapear city para address.city
          addressUpdates['address.city'] = req.body[field];
        } else {
          updates[field] = req.body[field];
        }
      }
    });

    // Verificar se o email já está em uso por outro usuário
    if (updates.email) {
      const existingUser = await User.findOne({ 
        email: updates.email.toLowerCase(),
        _id: { $ne: req.user._id }
      });
      
      if (existingUser) {
        return res.status(400).json({
          success: false,
          message: 'Este email já está em uso por outro usuário'
        });
      }
      
      // Normalizar email para lowercase
      updates.email = updates.email.toLowerCase().trim();
    }

    // Combinar atualizações
    const finalUpdates = { ...updates, ...addressUpdates };

    // Se não houver atualizações, retornar erro
    if (Object.keys(finalUpdates).length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Nenhum campo válido para atualizar'
      });
    }

    const user = await User.findByIdAndUpdate(
      req.user._id,
      { $set: finalUpdates },
      { new: true, runValidators: true }
    ).select('-password -security');

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'Usuário não encontrado'
      });
    }

    // Log de auditoria
    await AuditLog.logUpdate(req.user._id, 'user', req.user._id, {}, finalUpdates, req);

    res.json({
      success: true,
      message: 'Perfil atualizado com sucesso',
      data: { user: user.toSafeObject() }
    });
  } catch (error) {
    console.error('Erro ao atualizar perfil:', error);
    
    // Retornar mensagem de erro mais específica
    let errorMessage = 'Erro ao atualizar perfil';
    let statusCode = 500;
    
    if (error.name === 'ValidationError') {
      errorMessage = Object.values(error.errors).map(e => e.message).join(', ');
      statusCode = 400;
    } else if (error.code === 11000) {
      // Duplicação de índice único (email ou cpf)
      if (error.keyPattern?.email) {
        errorMessage = 'Este email já está em uso';
      } else if (error.keyPattern?.cpf) {
        errorMessage = 'Este CPF já está em uso';
      } else {
        errorMessage = 'Dados duplicados. Verifique os campos únicos';
      }
      statusCode = 400;
    } else if (error.message) {
      errorMessage = error.message;
    }
    
    res.status(statusCode).json({
      success: false,
      message: errorMessage
    });
  }
};

/**
 * Atualizar endereço
 */
export const updateAddress = async (req, res) => {
  try {
    const { zipCode, street, number, complement, neighborhood, city, state } = req.body;

    const user = await User.findByIdAndUpdate(
      req.user._id,
      {
        $set: {
          address: { zipCode, street, number, complement, neighborhood, city, state }
        }
      },
      { new: true, runValidators: true }
    ).select('-password -security');

    res.json({
      success: true,
      message: 'Endereço atualizado com sucesso',
      data: { address: user.address }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Erro ao atualizar endereço'
    });
  }
};

/**
 * Upload de foto de perfil
 */
export const uploadProfilePhoto = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'Nenhuma imagem enviada'
      });
    }

    const result = await imageService.processProfilePhoto(
      req.file.buffer,
      req.user._id.toString()
    );

    await User.findByIdAndUpdate(req.user._id, {
      $set: { photo: result.url }
    });

    res.json({
      success: true,
      message: 'Foto atualizada com sucesso',
      data: { url: result.url, photo: result.url }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Erro ao atualizar foto'
    });
  }
};

/**
 * Obter dashboard do membro
 */
export const getDashboard = async (req, res) => {
  try {
    const userId = req.user._id;

    // Buscar dados em paralelo
    const [
      user,
      recentWorkouts,
      hpointsBalance,
      expiringPoints,
      pendingRedemptions
    ] = await Promise.all([
      User.findById(userId)
        .populate('currentTrainingPlan', 'objective level startDate endDate adherence')
        .select('-password -security'),
      Workout.find({ userId: userId })
        .sort({ date: -1 })
        .limit(5)
        .select('date distance time workoutType hpoints.status'),
      hpointService.getBalance(userId),
      hpointService.getExpiringPoints(userId, 30),
      Redemption.find({ user: userId, status: 'pending' }).limit(3)
    ]);

    // Calcular estatísticas do mês
    const startOfMonth = new Date();
    startOfMonth.setDate(1);
    startOfMonth.setHours(0, 0, 0, 0);

    const monthWorkouts = await Workout.find({
      userId: userId,
      date: { $gte: startOfMonth }
    });

    const monthStats = {
      workoutsCount: monthWorkouts.length,
      totalDistance: monthWorkouts.reduce((sum, w) => sum + (w.distance || 0), 0),
      totalTime: monthWorkouts.reduce((sum, w) => sum + (w.time || 0), 0)
    };

    res.json({
      success: true,
      data: {
        user: user.toSafeObject(),
        hpoints: {
          balance: hpointsBalance,
          expiring: expiringPoints
        },
        trainingPlan: user.currentTrainingPlan,
        recentWorkouts,
        pendingRedemptions,
        monthStats,
        kickstartKit: user.kickstartKit
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
 * Obter estatísticas do usuário
 */
export const getStats = async (req, res) => {
  try {
    const userId = req.user._id;
    const { period = 'month' } = req.query;

    let startDate = new Date();
    switch (period) {
      case 'week':
        startDate.setDate(startDate.getDate() - 7);
        break;
      case 'month':
        startDate.setMonth(startDate.getMonth() - 1);
        break;
      case 'year':
        startDate.setFullYear(startDate.getFullYear() - 1);
        break;
      case 'all':
        startDate = new Date(0);
        break;
    }

    const workouts = await Workout.find({
      userId: userId,
      date: { $gte: startDate }
    });

    const stats = {
      period,
      totalWorkouts: workouts.length,
      totalDistance: Math.round(workouts.reduce((sum, w) => sum + (w.distance || 0), 0) * 10) / 10,
      totalTime: workouts.reduce((sum, w) => sum + (w.time || 0), 0),
      averageDistance: workouts.length > 0 
        ? Math.round((workouts.reduce((sum, w) => sum + (w.distance || 0), 0) / workouts.length) * 10) / 10 
        : 0,
      averagePace: calculateAveragePace(workouts),
      workoutsByType: groupWorkoutsByType(workouts),
      weeklyProgress: getWeeklyProgress(workouts, startDate)
    };

    res.json({
      success: true,
      data: { stats }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Erro ao obter estatísticas'
    });
  }
};

/**
 * Obter usuário por ID (admin)
 */
export const getUserById = async (req, res) => {
  try {
    const user = await User.findById(req.params.id)
      .populate('currentTrainingPlan')
      .select('-password -security.passwordResetToken');

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'Usuário não encontrado'
      });
    }

    res.json({
      success: true,
      data: { user }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Erro ao obter usuário'
    });
  }
};

/**
 * Listar usuários (admin)
 */
export const listUsers = async (req, res) => {
  try {
    const { 
      page = 1, 
      limit = 20, 
      search, 
      plan, 
      role, 
      active,
      sort = '-createdAt' 
    } = req.query;

    const query = {};
    
    if (search) {
      query.$or = [
        { firstName: { $regex: search, $options: 'i' } },
        { lastName: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } }
      ];
    }
    
    if (plan) query['plan.type'] = plan;
    if (role) query.role = role;
    if (active !== undefined) query.active = active === 'true';

    const [users, total] = await Promise.all([
      User.find(query)
        .sort(sort)
        .skip((page - 1) * limit)
        .limit(parseInt(limit))
        .select('-password -security'),
      User.countDocuments(query)
    ]);

    res.json({
      success: true,
      data: {
        users,
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
      message: 'Erro ao listar usuários'
    });
  }
};

/**
 * Atualizar usuário (admin)
 */
export const updateUser = async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;

    // Campos que admin pode alterar
    const allowedFields = [
      'firstName', 'lastName', 'phone', 'role', 'active',
      'plan.type', 'plan.status', 'hpointsBalance'
    ];

    const filteredUpdates = {};
    Object.keys(updates).forEach(key => {
      if (allowedFields.includes(key)) {
        filteredUpdates[key] = updates[key];
      }
    });

    const oldUser = await User.findById(id);
    if (!oldUser) {
      return res.status(404).json({
        success: false,
        message: 'Usuário não encontrado'
      });
    }

    const user = await User.findByIdAndUpdate(
      id,
      { $set: filteredUpdates },
      { new: true, runValidators: true }
    ).select('-password -security');

    // Log de auditoria
    await AuditLog.logUpdate(req.user._id, 'user', id, oldUser.toObject(), filteredUpdates, req);

    res.json({
      success: true,
      message: 'Usuário atualizado com sucesso',
      data: { user }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Erro ao atualizar usuário'
    });
  }
};

/**
 * Desativar usuário (admin)
 */
export const deactivateUser = async (req, res) => {
  try {
    const { id } = req.params;

    const user = await User.findByIdAndUpdate(
      id,
      { $set: { active: false } },
      { new: true }
    ).select('-password -security');

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'Usuário não encontrado'
      });
    }

    // Log de auditoria
    await AuditLog.logUpdate(req.user._id, 'user', id, { active: true }, { active: false }, req);

    res.json({
      success: true,
      message: 'Usuário desativado com sucesso',
      data: { user }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Erro ao desativar usuário'
    });
  }
};

// Helpers
function calculateAveragePace(workouts) {
  const validWorkouts = workouts.filter(w => w.distance > 0 && w.time > 0);
  if (validWorkouts.length === 0) return 0;

  const totalPace = validWorkouts.reduce((sum, w) => {
    return sum + (w.time / w.distance);
  }, 0);

  // Retornar em segundos por km (não formatado)
  return Math.round(totalPace / validWorkouts.length);
}

function groupWorkoutsByType(workouts) {
  const groups = {};
  workouts.forEach(w => {
    const type = w.workoutType || 'other';
    if (!groups[type]) {
      groups[type] = { count: 0, distance: 0, time: 0 };
    }
    groups[type].count++;
    groups[type].distance += w.distance || 0;
    groups[type].time += w.time || 0;
  });
  return groups;
}

function getWeeklyProgress(workouts, startDate) {
  const weeks = {};
  const now = new Date();
  
  workouts.forEach(w => {
    const weekNum = Math.floor((w.date - startDate) / (7 * 24 * 60 * 60 * 1000));
    if (!weeks[weekNum]) {
      weeks[weekNum] = { workouts: 0, distance: 0 };
    }
    weeks[weekNum].workouts++;
    weeks[weekNum].distance += w.distance || 0;
  });

  return Object.entries(weeks).map(([week, data]) => ({
    week: parseInt(week) + 1,
    ...data,
    distance: Math.round(data.distance * 10) / 10
  }));
}

/**
 * Obter perfil público de um usuário
 */
export const getPublicProfile = async (req, res) => {
  try {
    const user = await User.findById(req.params.id)
      .populate('currentTrainingPlan', 'objective level startDate endDate adherence workouts')
      .select('-password -security -email -phone -address.street -address.number -address.complement -address.neighborhood -address.zipCode');

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'Usuário não encontrado'
      });
    }

    // Retornar apenas dados públicos
    const safeUser = user.toSafeObject();
    
    // Garantir que apenas city e state do endereço sejam retornados
    if (safeUser.address) {
      safeUser.address = {
        city: safeUser.address.city || '',
        state: safeUser.address.state || ''
      };
    }
    
    res.json({
      success: true,
      data: { user: safeUser }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Erro ao obter perfil'
    });
  }
};

/**
 * Obter estatísticas públicas de um usuário
 */
export const getPublicStats = async (req, res) => {
  try {
    const userId = req.params.id;
    const { period = 'all' } = req.query;

    // Verificar se o usuário existe
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'Usuário não encontrado'
      });
    }

    let startDate = new Date();
    switch (period) {
      case 'week':
        startDate.setDate(startDate.getDate() - 7);
        break;
      case 'month':
        startDate.setMonth(startDate.getMonth() - 1);
        break;
      case 'year':
        startDate.setFullYear(startDate.getFullYear() - 1);
        break;
      case 'all':
        startDate = new Date(0);
        break;
    }

    const workouts = await Workout.find({
      userId: userId,
      date: { $gte: startDate }
    });

    const stats = {
      period,
      totalWorkouts: workouts.length,
      totalDistance: Math.round(workouts.reduce((sum, w) => sum + (w.distance || 0), 0) * 10) / 10,
      totalTime: workouts.reduce((sum, w) => sum + (w.time || 0), 0),
      averageDistance: workouts.length > 0 
        ? Math.round((workouts.reduce((sum, w) => sum + (w.distance || 0), 0) / workouts.length) * 10) / 10 
        : 0,
      averagePace: calculateAveragePace(workouts),
      workoutsByType: groupWorkoutsByType(workouts),
      weeklyProgress: getWeeklyProgress(workouts, startDate)
    };

    res.json({
      success: true,
      data: { stats }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Erro ao obter estatísticas'
    });
  }
};

/**
 * Obter atividades públicas de um usuário
 */
export const getPublicWorkouts = async (req, res) => {
  try {
    const userId = req.params.id;
    const { sort = '-date', limit = 50 } = req.query;

    // Verificar se o usuário existe
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'Usuário não encontrado'
      });
    }

    const workouts = await Workout.find({ userId: userId })
      .populate('userId', 'name photo')
      .sort(sort)
      .limit(parseInt(limit));

    res.json({
      success: true,
      data: { workouts }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Erro ao obter atividades'
    });
  }
};

/**
 * Obter top 10 corredores da semana (domingo a sábado)
 */
export const getTopRunners = async (req, res) => {
  try {
    // Calcular início da semana (domingo) e fim (sábado)
    const now = new Date();
    const dayOfWeek = now.getDay(); // 0 = domingo, 6 = sábado
    
    // Calcular domingo da semana atual (meia-noite local)
    const sunday = new Date(now);
    sunday.setDate(now.getDate() - dayOfWeek);
    sunday.setHours(0, 0, 0, 0);
    
    // Calcular sábado da semana atual (23:59:59 local)
    const saturday = new Date(sunday);
    saturday.setDate(sunday.getDate() + 6);
    saturday.setHours(23, 59, 59, 999);

    // Agregar treinos da semana agrupados por usuário
    // Incluindo treinos aprovados e pendentes (não rejeitados)
    const topRunners = await Workout.aggregate([
      {
        $match: {
          date: { $gte: sunday, $lte: saturday },
          $or: [
            { 'hpoints.status': 'approved' },
            { 'hpoints.status': 'pending' },
            { 'hpoints.status': { $exists: false } }
          ]
        }
      },
      {
        $group: {
          _id: '$userId',
          totalDistance: { $sum: '$distance' },
          activityCount: { $sum: 1 }
        }
      },
      {
        $sort: { totalDistance: -1 }
      },
      {
        $limit: 10
      },
      {
        $lookup: {
          from: 'users',
          localField: '_id',
          foreignField: '_id',
          as: 'user'
        }
      },
      {
        $unwind: {
          path: '$user',
          preserveNullAndEmptyArrays: false
        }
      },
      {
        $match: {
          'user.active': true
        }
      },
      {
        $project: {
          _id: 0,
          userId: '$_id',
          name: '$user.name',
          photo: '$user.photo',
          totalDistance: { $round: ['$totalDistance', 2] },
          activityCount: 1
        }
      }
    ]);

    res.json({
      success: true,
      data: { runners: topRunners }
    });
  } catch (error) {
    console.error('Erro ao obter top corredores:', error);
    res.status(500).json({
      success: false,
      message: 'Erro ao obter top corredores'
    });
  }
};

export default {
  getProfile,
  updateProfile,
  updateAddress,
  uploadProfilePhoto,
  getDashboard,
  getStats,
  getUserById,
  listUsers,
  updateUser,
  deactivateUser,
  getPublicProfile,
  getPublicStats,
  getPublicWorkouts,
  getTopRunners
};
