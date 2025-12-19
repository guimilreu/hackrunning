import { Challenge, User, Workout, AuditLog } from '../models/index.js';
import { hpointService } from '../services/hpointService.js';
import { notificationService } from '../services/notificationService.js';

/**
 * Listar desafios ativos
 */
export const list = async (req, res) => {
  try {
    const { active = true, participating } = req.query;

    let challenges;
    if (active === 'true') {
      challenges = await Challenge.findActive();
    } else {
      challenges = await Challenge.find().sort({ startDate: -1 });
    }

    // Filtrar por participação
    if (participating === 'true') {
      challenges = challenges.filter(c => 
        c.participants.some(p => p.userId.toString() === req.user._id.toString())
      );
    }

    // Adicionar status do usuário em cada desafio
    const challengesWithStatus = challenges.map(c => {
      const participant = c.participants.find(
        p => p.userId.toString() === req.user._id.toString()
      );
      return {
        ...c.toObject(),
        userStatus: participant ? {
          isParticipating: true,
          progress: participant.progress,
          completed: participant.completed
        } : {
          isParticipating: false
        }
      };
    });

    res.json({
      success: true,
      data: { challenges: challengesWithStatus }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Erro ao listar desafios'
    });
  }
};

/**
 * Obter desafio por ID
 */
export const getById = async (req, res) => {
  try {
    const challenge = await Challenge.findById(req.params.id)
      .populate('participants.userId', 'name email profilePhoto');

    if (!challenge) {
      return res.status(404).json({
        success: false,
        message: 'Desafio não encontrado'
      });
    }

    const participant = challenge.participants.find(
      p => p.userId?._id?.toString() === req.user._id.toString() ||
           p.userId?.toString() === req.user._id.toString()
    );

    res.json({
      success: true,
      data: { 
        challenge,
        userStatus: participant ? {
          isParticipating: true,
          progress: participant.progress,
          completed: participant.completed,
          completedAt: participant.completedAt
        } : {
          isParticipating: false
        }
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Erro ao obter desafio'
    });
  }
};

/**
 * Participar de um desafio
 */
export const participate = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user._id;

    const challenge = await Challenge.findById(id);
    if (!challenge) {
      return res.status(404).json({
        success: false,
        message: 'Desafio não encontrado'
      });
    }

    if (!challenge.active) {
      return res.status(400).json({
        success: false,
        message: 'Desafio não está ativo'
      });
    }

    // Verificar se já está participando
    const alreadyParticipating = challenge.participants.some(
      p => p.userId.toString() === userId.toString()
    );

    if (alreadyParticipating) {
      return res.status(400).json({
        success: false,
        message: 'Você já está participando deste desafio'
      });
    }

    // Verificar datas
    const now = new Date();
    if (challenge.startDate && now < challenge.startDate) {
      return res.status(400).json({
        success: false,
        message: 'O desafio ainda não começou'
      });
    }

    if (challenge.endDate && now > challenge.endDate) {
      return res.status(400).json({
        success: false,
        message: 'O desafio já terminou'
      });
    }

    await challenge.addParticipant(userId);

    res.json({
      success: true,
      message: 'Inscrição no desafio realizada',
      data: { participantsCount: challenge.participants.length }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Erro ao participar do desafio'
    });
  }
};

/**
 * Atualizar progresso (chamado após treinos)
 */
export const updateProgress = async (req, res) => {
  try {
    const { id } = req.params;
    const { progressValue } = req.body;
    const userId = req.user._id;

    const challenge = await Challenge.findById(id);
    if (!challenge) {
      return res.status(404).json({
        success: false,
        message: 'Desafio não encontrado'
      });
    }

    const result = await challenge.updateProgress(userId, progressValue);

    // Verificar se completou
    if (result.completed && !result.alreadyCompleted) {
      // Creditar bônus
      await hpointService.creditPoints(
        userId,
        challenge.bonusPoints,
        `Desafio concluído: ${challenge.name}`,
        { type: 'challenge', id: challenge._id }
      );

      // Notificar
      await notificationService.notifyChallengeCompleted(userId, {
        name: challenge.name,
        bonusPoints: challenge.bonusPoints
      });
    }

    res.json({
      success: true,
      message: result.completed ? 'Desafio concluído!' : 'Progresso atualizado',
      data: {
        progress: result.progress,
        completed: result.completed,
        bonusAwarded: result.completed && !result.alreadyCompleted ? challenge.bonusPoints : 0
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message || 'Erro ao atualizar progresso'
    });
  }
};

/**
 * Obter ranking do desafio
 */
export const getRanking = async (req, res) => {
  try {
    const { id } = req.params;
    const { limit = 50 } = req.query;

    const challenge = await Challenge.findById(id)
      .populate('participants.userId', 'name email profilePhoto');

    if (!challenge) {
      return res.status(404).json({
        success: false,
        message: 'Desafio não encontrado'
      });
    }

    // Ordenar por progresso e data de conclusão
    const ranking = [...challenge.participants]
      .sort((a, b) => {
        if (a.completed && !b.completed) return -1;
        if (!a.completed && b.completed) return 1;
        if (a.completed && b.completed) {
          return new Date(a.completedAt) - new Date(b.completedAt);
        }
        // Comparar progresso baseado em km ou workouts
        const aProgress = a.progress?.km || a.progress?.workouts || 0;
        const bProgress = b.progress?.km || b.progress?.workouts || 0;
        return bProgress - aProgress;
      })
      .slice(0, parseInt(limit))
      .map((p, index) => ({
        position: index + 1,
        user: p.userId,
        progress: p.progress,
        completed: p.completed,
        completedAt: p.completedAt
      }));

    res.json({
      success: true,
      data: { ranking }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Erro ao obter ranking'
    });
  }
};

/**
 * Meus desafios
 */
export const myChallenges = async (req, res) => {
  try {
    const userId = req.user._id;
    const challenges = await Challenge.findByUser(userId);

    res.json({
      success: true,
      data: { challenges }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Erro ao listar desafios'
    });
  }
};

// ========== ADMIN ==========

/**
 * Criar desafio (admin)
 */
export const create = async (req, res) => {
  try {
    const {
      name,
      description,
      duration,
      startDate,
      endDate,
      rules,
      bonusPoints,
      completionCriteria
    } = req.body;

    const challenge = new Challenge({
      name,
      description,
      duration,
      startDate: startDate || new Date(),
      endDate,
      rules,
      bonusPoints: bonusPoints || 100,
      completionCriteria,
      active: true
    });

    await challenge.save();

    // Notificar usuários
    const users = await User.find({ active: true }).select('_id');
    const userIds = users.map(u => u._id);
    
    await notificationService.notifyNewChallenge(userIds, {
      id: challenge._id,
      name: challenge.name,
      bonusPoints: challenge.bonusPoints
    });

    // Log de auditoria
    await AuditLog.logCreate('challenge', challenge._id, req.user._id, challenge.toObject(), req);

    res.status(201).json({
      success: true,
      message: 'Desafio criado com sucesso',
      data: { challenge }
    });
  } catch (error) {
    console.error('Erro ao criar desafio:', error);
    res.status(500).json({
      success: false,
      message: 'Erro ao criar desafio'
    });
  }
};

/**
 * Atualizar desafio (admin)
 */
export const update = async (req, res) => {
  try {
    const { id } = req.params;

    const challenge = await Challenge.findById(id);
    if (!challenge) {
      return res.status(404).json({
        success: false,
        message: 'Desafio não encontrado'
      });
    }

    const oldData = challenge.toObject();
    const allowedFields = [
      'name', 'description', 'duration', 'startDate', 'endDate',
      'rules', 'bonusPoints', 'completionCriteria', 'active'
    ];

    allowedFields.forEach(field => {
      if (req.body[field] !== undefined) {
        challenge[field] = req.body[field];
      }
    });

    await challenge.save();

    // Log de auditoria
    await AuditLog.logUpdate('challenge', id, req.user._id, oldData, challenge.toObject(), req);

    res.json({
      success: true,
      message: 'Desafio atualizado',
      data: { challenge }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Erro ao atualizar desafio'
    });
  }
};

/**
 * Deletar desafio (admin)
 */
export const remove = async (req, res) => {
  try {
    const { id } = req.params;

    const challenge = await Challenge.findById(id);
    if (!challenge) {
      return res.status(404).json({
        success: false,
        message: 'Desafio não encontrado'
      });
    }

    challenge.active = false;
    await challenge.save();

    // Log de auditoria
    await AuditLog.logDelete('challenge', id, req.user._id, challenge.toObject(), req);

    res.json({
      success: true,
      message: 'Desafio desativado'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Erro ao deletar desafio'
    });
  }
};

/**
 * Obter estatísticas do desafio (admin)
 */
export const getStats = async (req, res) => {
  try {
    const { id } = req.params;

    const challenge = await Challenge.findById(id);
    if (!challenge) {
      return res.status(404).json({
        success: false,
        message: 'Desafio não encontrado'
      });
    }

    const totalParticipants = challenge.participants.length;
    const completed = challenge.participants.filter(p => p.completed).length;
    const avgProgress = totalParticipants > 0
      ? challenge.participants.reduce((sum, p) => sum + p.progress, 0) / totalParticipants
      : 0;

    res.json({
      success: true,
      data: {
        stats: {
          totalParticipants,
          completed,
          completionRate: totalParticipants > 0 ? (completed / totalParticipants * 100).toFixed(1) : 0,
          avgProgress: avgProgress.toFixed(1),
          totalBonusAwarded: completed * challenge.bonusPoints
        }
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
  getById,
  participate,
  updateProgress,
  getRanking,
  myChallenges,
  create,
  update,
  remove,
  getStats
};
