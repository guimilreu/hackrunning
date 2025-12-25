import { Workout, User, TrainingPlan, AuditLog } from '../models/index.js';
import { imageService } from '../services/imageService.js';
import { hpointService } from '../services/hpointService.js';
import { notificationService } from '../services/notificationService.js';
import { trainingPlanService } from '../services/trainingPlanService.js';

/**
 * Criar novo treino
 */
export const create = async (req, res) => {
  try {
    const { type, date, distance, time, workoutType, notes, trainingPlanWorkoutId, instagramStoryLink } = req.body;

    // Garantir que a data seja processada corretamente
    let workoutDate;
    if (date) {
      // Se já for uma string ISO ou Date, usar diretamente
      workoutDate = date instanceof Date ? date : new Date(date);
      // Validar se a data é válida
      if (isNaN(workoutDate.getTime())) {
        console.warn('Data inválida recebida, usando data atual:', date);
        workoutDate = new Date();
      }
    } else {
      workoutDate = new Date();
    }

    const workout = new Workout({
      userId: req.user._id,
      type: type || 'individual',
      date: workoutDate,
      distance,
      time,
      workoutType,
      notes,
      instagramStoryLink: instagramStoryLink || '',
      trainingPlanId: req.user.currentTrainingPlan?.cycleId || null,
      hpoints: {
        status: 'pending'
      }
    });

    await workout.save();

    // Se é treino do plano, marcar como completo
    if (trainingPlanWorkoutId && req.user.currentTrainingPlan) {
      try {
        await trainingPlanService.completeWorkout(
          req.user._id,
          req.user.currentTrainingPlan,
          trainingPlanWorkoutId,
          { distance, time }
        );
      } catch (err) {
        console.error('Erro ao marcar treino no plano:', err);
      }
    }

    res.status(201).json({
      success: true,
      message: 'Treino registrado com sucesso',
      data: { workout }
    });
  } catch (error) {
    console.error('Erro ao criar treino:', error);
    res.status(500).json({
      success: false,
      message: 'Erro ao registrar treino'
    });
  }
};

/**
 * Upload de foto do treino
 */
export const uploadPhoto = async (req, res) => {
  try {
    const { id } = req.params;

    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'Nenhuma imagem enviada'
      });
    }

    const workout = await Workout.findOne({ _id: id, userId: req.user._id });
    if (!workout) {
      return res.status(404).json({
        success: false,
        message: 'Treino não encontrado'
      });
    }

    const result = await imageService.processWorkoutPhoto(
      req.file.buffer,
      req.user._id.toString(),
      workout._id.toString()
    );

    workout.photo = {
      url: result.url,
      thumbnailUrl: result.thumbnailUrl,
      validated: false
    };
    workout.hpoints.status = 'pending';
    await workout.save();

    res.json({
      success: true,
      message: 'Foto enviada para validação',
      data: { 
        photoUrl: result.url,
        thumbnailUrl: result.thumbnailUrl
      }
    });
  } catch (error) {
    console.error('Erro ao enviar foto:', error);
    res.status(500).json({
      success: false,
      message: 'Erro ao enviar foto'
    });
  }
};

/**
 * Listar treinos do usuário (ou feed de comunidade se status=approved)
 * O feed da comunidade mostra todos os treinos de todos os usuários
 */
export const list = async (req, res) => {
  try {
    const { 
      page = 1, 
      limit = 20, 
      type, 
      startDate, 
      endDate,
      workoutType,
      status,
      sort = '-date' 
    } = req.query;

    // Se status=approved, retorna feed da comunidade (todos os treinos)
    const isCommunityFeed = status === 'approved';
    
    const query = isCommunityFeed 
      ? {} // Feed da comunidade: todos os treinos de todos os usuários
      : { userId: req.user._id }; // Feed pessoal: apenas treinos do usuário
    
    if (type) query.type = type;
    if (workoutType) query.workoutType = workoutType;
    if (startDate || endDate) {
      query.date = {};
      if (startDate) query.date.$gte = new Date(startDate);
      if (endDate) query.date.$lte = new Date(endDate);
    }
    
    const [workouts, total] = await Promise.all([
      Workout.find(query)
        .populate({ path: 'userId', select: 'name photo' })
        .populate('likes', 'name photo')
        .populate('comments.userId', 'name photo')
        .sort(sort)
        .skip((page - 1) * limit)
        .limit(parseInt(limit)),
      Workout.countDocuments(query)
    ]);

    // Formatar dados para feed da comunidade
    const formattedWorkouts = workouts.map(w => {
      const workoutObj = w.toObject();
      // Verificar se userId está populado (objeto) ou apenas ID (string)
      const userPopulated = w.userId && typeof w.userId === 'object' && w.userId.name;
      return {
        ...workoutObj,
        user: userPopulated ? { 
          _id: w.userId._id,
          name: w.userId.name, 
          photo: w.userId.photo 
        } : null,
        userId: userPopulated ? w.userId._id : w.userId // Manter o userId como ID para comparação
      };
    });

    res.json({
      success: true,
      data: {
        workouts: isCommunityFeed ? formattedWorkouts : workouts,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          pages: Math.ceil(total / limit)
        }
      }
    });
  } catch (error) {
    console.error('Erro ao listar treinos:', error);
    res.status(500).json({
      success: false,
      message: 'Erro ao listar treinos'
    });
  }
};

/**
 * Obter treino por ID
 */
export const getById = async (req, res) => {
  try {
    // Permitir ver qualquer treino (não apenas os próprios)
    const workout = await Workout.findById(req.params.id)
      .populate('userId', 'name photo')
      .populate('likes', 'name photo')
      .populate('comments.userId', 'name photo');

    if (!workout) {
      return res.status(404).json({
        success: false,
        message: 'Treino não encontrado'
      });
    }

    // Formatar resposta com dados do usuário padronizados
    const workoutObj = workout.toObject();
    const userPopulated = workout.userId && typeof workout.userId === 'object' && workout.userId.name;
    
    const formattedWorkout = {
      ...workoutObj,
      user: userPopulated ? {
        _id: workout.userId._id,
        name: workout.userId.name,
        photo: workout.userId.photo
      } : null,
      userId: userPopulated ? workout.userId._id : workout.userId
    };

    res.json({
      success: true,
      data: { workout: formattedWorkout }
    });
  } catch (error) {
    console.error('Erro ao obter treino:', error);
    res.status(500).json({
      success: false,
      message: 'Erro ao obter treino'
    });
  }
};

/**
 * Atualizar treino
 */
export const update = async (req, res) => {
  try {
    const { id } = req.params;
    const { distance, time, notes, workoutType } = req.body;

    const workout = await Workout.findOne({ _id: id, userId: req.user._id });
    if (!workout) {
      return res.status(404).json({
        success: false,
        message: 'Treino não encontrado'
      });
    }

    // Não permite editar treino já validado
    if (workout.hpoints.status === 'approved') {
      return res.status(400).json({
        success: false,
        message: 'Não é possível editar um treino já validado'
      });
    }

    if (distance !== undefined) workout.distance = distance;
    if (time !== undefined) workout.time = time;
    if (notes !== undefined) workout.notes = notes;
    if (workoutType !== undefined) workout.workoutType = workoutType;

    await workout.save();

    res.json({
      success: true,
      message: 'Treino atualizado',
      data: { workout }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Erro ao atualizar treino'
    });
  }
};

/**
 * Deletar treino
 */
export const remove = async (req, res) => {
  try {
    const workout = await Workout.findOne({ 
      _id: req.params.id, 
      userId: req.user._id 
    });

    if (!workout) {
      return res.status(404).json({
        success: false,
        message: 'Treino não encontrado'
      });
    }

    if (workout.hpoints.status === 'approved') {
      return res.status(400).json({
        success: false,
        message: 'Não é possível excluir um treino já validado'
      });
    }

    await workout.deleteOne();

    res.json({
      success: true,
      message: 'Treino excluído'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Erro ao excluir treino'
    });
  }
};

/**
 * Curtir/Descurtir treino
 */
export const toggleLike = async (req, res) => {
  try {
    const { id } = req.params;

    const workout = await Workout.findById(id);
    if (!workout) {
      return res.status(404).json({
        success: false,
        message: 'Treino não encontrado'
      });
    }

    const userId = req.user._id.toString();
    const workoutOwnerId = workout.userId.toString();
    
    // Não permitir curtir próprio treino
    if (userId === workoutOwnerId) {
      return res.status(400).json({
        success: false,
        message: 'Você não pode curtir seu próprio treino'
      });
    }

    // Verificar se já curtiu (comparando strings)
    const likeIndex = workout.likes.findIndex(
      likeId => likeId.toString() === userId
    );

    if (likeIndex > -1) {
      // Remover curtida
      workout.likes.splice(likeIndex, 1);
    } else {
      // Adicionar curtida
      workout.likes.push(userId);
      
      // Notificar dono do treino
      try {
        await notificationService.create({
          userId: workout.userId,
          type: 'workout_like',
          title: 'Nova curtida',
          message: `${req.user.name} curtiu seu treino`,
          data: { workoutId: workout._id }
        });
      } catch (notifError) {
        console.error('Erro ao criar notificação:', notifError);
        // Não falhar a requisição se a notificação falhar
      }
    }

    await workout.save();

    // Popular likes para retornar
    const populatedWorkout = await Workout.findById(workout._id)
      .populate('likes', 'name photo');

    res.json({
      success: true,
      data: { 
        liked: likeIndex === -1,
        totalLikes: workout.likes.length,
        likes: populatedWorkout.likes
      }
    });
  } catch (error) {
    console.error('Erro ao curtir treino:', error);
    res.status(500).json({
      success: false,
      message: 'Erro ao curtir treino'
    });
  }
};

/**
 * Adicionar comentário ao treino
 */
export const addComment = async (req, res) => {
  try {
    const { id } = req.params;
    const { text } = req.body;

    if (!text || text.trim().length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Comentário não pode estar vazio'
      });
    }

    const workout = await Workout.findById(id);
    if (!workout) {
      return res.status(404).json({
        success: false,
        message: 'Treino não encontrado'
      });
    }

    const comment = {
      userId: req.user._id,
      text: text.trim(),
      createdAt: new Date()
    };

    workout.comments.push(comment);
    await workout.save();

    // Popular o usuário do comentário para retornar
    const populatedWorkout = await Workout.findById(workout._id)
      .populate('comments.userId', 'name photo');
    
    const addedComment = populatedWorkout.comments[populatedWorkout.comments.length - 1];

    // Notificar dono do treino (se não for ele mesmo)
    if (workout.userId.toString() !== req.user._id.toString()) {
      await notificationService.create({
        userId: workout.userId,
        type: 'workout_comment',
        title: 'Novo comentário',
        message: `${req.user.name} comentou em seu treino`,
        data: { workoutId: workout._id }
      });
    }

    res.status(201).json({
      success: true,
      message: 'Comentário adicionado',
      data: { comment: addedComment }
    });
  } catch (error) {
    console.error('Erro ao adicionar comentário:', error);
    res.status(500).json({
      success: false,
      message: 'Erro ao adicionar comentário'
    });
  }
};

/**
 * Deletar comentário do treino
 */
export const deleteComment = async (req, res) => {
  try {
    const { id, commentId } = req.params;

    const workout = await Workout.findById(id);
    if (!workout) {
      return res.status(404).json({
        success: false,
        message: 'Treino não encontrado'
      });
    }

    // Buscar comentário usando find
    const comment = workout.comments.find(
      c => c._id.toString() === commentId.toString()
    );

    if (!comment) {
      return res.status(404).json({
        success: false,
        message: 'Comentário não encontrado'
      });
    }

    // Verificar se é o autor do comentário (apenas o autor pode deletar)
    const userId = req.user._id.toString();
    const commentUserId = comment.userId.toString();
    const isCommentAuthor = commentUserId === userId;
    
    if (!isCommentAuthor) {
      return res.status(403).json({
        success: false,
        message: 'Você só pode deletar seus próprios comentários'
      });
    }

    // Remover comentário usando pull com o ObjectId diretamente
    workout.comments.pull(comment._id);
    await workout.save();

    res.json({
      success: true,
      message: 'Comentário excluído'
    });
  } catch (error) {
    console.error('Erro ao deletar comentário:', error);
    res.status(500).json({
      success: false,
      message: 'Erro ao deletar comentário'
    });
  }
};

/**
 * Compartilhar treino nas redes sociais
 */
export const share = async (req, res) => {
  try {
    const { id } = req.params;
    const { platform } = req.body;

    const workout = await Workout.findById(id);
    if (!workout) {
      return res.status(404).json({
        success: false,
        message: 'Treino não encontrado'
      });
    }

    // Atualizar contador de compartilhamentos
    if (platform === 'strava') workout.shares.strava = true;
    if (platform === 'instagram') workout.shares.instagram = true;
    if (platform === 'whatsapp') workout.shares.whatsapp = true;
    
    await workout.save();

    res.json({
      success: true,
      message: 'Compartilhamento registrado'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Erro ao registrar compartilhamento'
    });
  }
};

// ========== ADMIN ==========

/**
 * Listar treinos pendentes de validação (admin)
 */
export const listPending = async (req, res) => {
  try {
    const { page = 1, limit = 20 } = req.query;

    const [workouts, total] = await Promise.all([
      Workout.findPendingValidation()
        .skip((page - 1) * limit)
        .limit(parseInt(limit))
        .populate('user', 'firstName lastName email'),
      Workout.countDocuments({ 
        'hpoints.status': 'pending',
        'photo.url': { $exists: true }
      })
    ]);

    res.json({
      success: true,
      data: {
        workouts,
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
      message: 'Erro ao listar treinos pendentes'
    });
  }
};

/**
 * Aprovar treino (admin)
 */
export const approve = async (req, res) => {
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

    if (workout.hpoints.status === 'approved') {
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
    workout.hpoints.status = 'approved';
    workout.hpoints.points = totalPoints;
    workout.hpoints.validatedBy = req.user._id;
    workout.hpoints.validatedAt = new Date();
    workout.photo.validated = true;
    await workout.save();

    // Creditar pontos
    await hpointService.creditPoints(
      workout.user._id,
      totalPoints,
      `Treino aprovado - ${workout.getFormattedDistance()}`,
      { type: 'workout', id: workout._id }
    );

    // Notificar usuário
    await notificationService.notifyWorkoutApproved(workout.user._id, totalPoints);

    // Log de auditoria
    await AuditLog.logUpdate(req.user._id, 'workout', id, 
      { 'hpoints.status': 'pending' }, 
      { 'hpoints.status': 'approved', 'hpoints.points': totalPoints }, 
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
    console.error('Erro ao aprovar treino:', error);
    res.status(500).json({
      success: false,
      message: 'Erro ao aprovar treino'
    });
  }
};

/**
 * Rejeitar treino (admin)
 */
export const reject = async (req, res) => {
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

    workout.hpoints.status = 'rejected';
    workout.hpoints.rejectionReason = reason;
    workout.photo.validated = false;
    await workout.save();

    // Notificar usuário
    await notificationService.notifyWorkoutRejected(workout.user._id, reason);

    // Log de auditoria
    await AuditLog.logUpdate(req.user._id, 'workout', id,
      { 'hpoints.status': 'pending' },
      { 'hpoints.status': 'rejected', 'hpoints.rejectionReason': reason },
      req
    );

    res.json({
      success: true,
      message: 'Treino rejeitado',
      data: { workout }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Erro ao rejeitar treino'
    });
  }
};

/**
 * Obter estatísticas de treinos (admin)
 */
export const getStats = async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    
    const dateFilter = {};
    if (startDate) dateFilter.$gte = new Date(startDate);
    if (endDate) dateFilter.$lte = new Date(endDate);

    const matchStage = {};
    if (Object.keys(dateFilter).length > 0) {
      matchStage.date = dateFilter;
    }

    const stats = await Workout.aggregate([
      { $match: matchStage },
      {
        $group: {
          _id: null,
          totalWorkouts: { $sum: 1 },
          totalDistance: { $sum: '$distance' },
          totalTime: { $sum: '$time' },
          avgDistance: { $avg: '$distance' },
          pendingValidation: {
            $sum: { $cond: [{ $eq: ['$hpoints.status', 'pending'] }, 1, 0] }
          },
          approved: {
            $sum: { $cond: [{ $eq: ['$hpoints.status', 'approved'] }, 1, 0] }
          },
          rejected: {
            $sum: { $cond: [{ $eq: ['$hpoints.status', 'rejected'] }, 1, 0] }
          }
        }
      }
    ]);

    res.json({
      success: true,
      data: { stats: stats[0] || {} }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Erro ao obter estatísticas'
    });
  }
};

export default {
  create,
  uploadPhoto,
  list,
  getById,
  update,
  remove,
  toggleLike,
  addComment,
  deleteComment,
  share,
  listPending,
  approve,
  reject,
  getStats
};
