import { HPoint, User, Setting } from '../models/index.js';
import { logger } from '../utils/logger.js';
import { addMonths } from 'date-fns';

/**
 * Buscar configurações de pontos
 */
export const getPointsConfig = async () => {
  return Setting.getHPointsConfig();
};

/**
 * Calcular pontos para um tipo de atividade
 */
export const calculatePoints = async (type, metadata = {}) => {
  const config = await getPointsConfig();
  
  let points = 0;
  
  switch (type) {
    case 'individual_workout':
      points = config['hpoints.individual_workout'] || 10;
      break;
      
    case 'together_workout':
      points = config['hpoints.together_workout'] || 15;
      break;
      
    case 'race':
      points = config['hpoints.race'] || 25;
      break;
      
    case 'overall_podium':
      points = config['hpoints.overall_podium'] || 50;
      break;
      
    case 'category_podium':
      points = config['hpoints.category_podium'] || 30;
      break;
      
    case 'double_podium':
      points = (config['hpoints.overall_podium'] || 50) + (config['hpoints.category_podium'] || 30);
      break;
      
    case 'challenge':
      points = metadata.bonusPoints || config['hpoints.challenge_completion'] || 100;
      break;
      
    case 'referral':
      points = config['hpoints.referral'] || 50;
      break;
      
    case 'photo_video':
      points = config['hpoints.photo_video_quality'] || 5;
      break;
      
    case 'mediterraneum_cashback':
      const percent = config['hpoints.mediterraneum_cashback_percent'] || 10;
      points = Math.round((metadata.value || 0) * (percent / 100));
      break;
      
    default:
      points = 0;
  }
  
  // Bônus por compartilhamento (se aplicável)
  if (metadata.shares) {
    if (metadata.shares.strava) points += 2;
    if (metadata.shares.instagram) points += 2;
    if (metadata.shares.whatsapp) points += 1;
  }
  
  return points;
};

/**
 * Creditar pontos para um usuário
 */
export const creditPoints = async (userId, type, points, options = {}) => {
  const {
    description = '',
    referenceId = null,
    referenceType = 'Other',
    expirationMonths = null
  } = options;

  try {
    // Buscar configuração de expiração se não especificada
    let expMonths = expirationMonths;
    if (!expMonths) {
      const config = await getPointsConfig();
      expMonths = config['hpoints.expiration_months'] || 6;
    }

    // Criar registro de HPoint
    const hpoint = await HPoint.create({
      userId,
      type,
      points,
      description: description || getDefaultDescription(type),
      referenceId,
      referenceType,
      expirationDate: addMonths(new Date(), expMonths)
    });

    // Atualizar saldo do usuário
    await User.findByIdAndUpdate(userId, {
      $inc: {
        'hpoints.balance': points,
        'hpoints.totalEarned': points
      }
    });

    logger.info('HPoints credited:', { userId, type, points, hpointId: hpoint._id });

    return hpoint;
  } catch (error) {
    logger.error('Error crediting HPoints:', error);
    throw error;
  }
};

/**
 * Debitar pontos de um usuário (para resgate)
 */
export const debitPoints = async (userId, points, redemptionId) => {
  try {
    // Verificar saldo
    const balance = await HPoint.calculateBalance(userId);
    
    if (balance < points) {
      throw new Error('Saldo insuficiente de HPoints');
    }

    // Usar pontos mais antigos primeiro (FIFO)
    const usedPointIds = await HPoint.usePoints(userId, points, redemptionId);

    // Atualizar saldo do usuário
    await User.findByIdAndUpdate(userId, {
      $inc: {
        'hpoints.balance': -points,
        'hpoints.totalRedeemed': points
      }
    });

    logger.info('HPoints debited:', { userId, points, redemptionId, usedCount: usedPointIds.length });

    return usedPointIds;
  } catch (error) {
    logger.error('Error debiting HPoints:', error);
    throw error;
  }
};

/**
 * Estornar pontos de um resgate cancelado
 */
export const refundPoints = async (userId, hpointIds) => {
  try {
    let totalRefunded = 0;

    for (const hpointId of hpointIds) {
      const hpoint = await HPoint.findById(hpointId);
      
      if (hpoint && hpoint.redeemed) {
        hpoint.redeemed = false;
        hpoint.redemptionId = null;
        await hpoint.save();
        totalRefunded += hpoint.points;
      }
    }

    // Atualizar saldo do usuário
    await User.findByIdAndUpdate(userId, {
      $inc: {
        'hpoints.balance': totalRefunded,
        'hpoints.totalRedeemed': -totalRefunded
      }
    });

    logger.info('HPoints refunded:', { userId, totalRefunded });

    return totalRefunded;
  } catch (error) {
    logger.error('Error refunding HPoints:', error);
    throw error;
  }
};

/**
 * Ajuste manual de pontos (admin)
 */
export const adjustPoints = async (userId, points, reason, adminId) => {
  try {
    const type = points > 0 ? 'manual_adjustment' : 'manual_adjustment';
    const absPoints = Math.abs(points);

    if (points > 0) {
      // Adicionar pontos
      return creditPoints(userId, type, absPoints, {
        description: `Ajuste manual: ${reason}`,
        referenceId: adminId,
        referenceType: 'User'
      });
    } else {
      // Remover pontos - criar registro negativo e atualizar saldo
      const hpoint = await HPoint.create({
        userId,
        type,
        points: -absPoints,
        description: `Ajuste manual (débito): ${reason}`,
        adjustedBy: adminId,
        adjustmentReason: reason,
        expirationDate: addMonths(new Date(), 999) // Não expira
      });

      await User.findByIdAndUpdate(userId, {
        $inc: { 'hpoints.balance': -absPoints }
      });

      logger.info('HPoints adjusted (debit):', { userId, points: -absPoints, adminId });

      return hpoint;
    }
  } catch (error) {
    logger.error('Error adjusting HPoints:', error);
    throw error;
  }
};

/**
 * Buscar saldo atual do usuário
 */
export const getBalance = async (userId) => {
  const user = await User.findById(userId).select('hpoints');
  return user?.hpoints || { balance: 0, totalEarned: 0, totalRedeemed: 0 };
};

/**
 * Buscar histórico de pontos
 */
export const getHistory = async (userId, options = {}) => {
  const { page = 1, limit = 20, type = null, status = null } = options;
  
  const query = { userId };
  
  if (type) query.type = type;
  if (status === 'active') {
    query.expired = false;
    query.redeemed = false;
  } else if (status === 'expired') {
    query.expired = true;
  } else if (status === 'redeemed') {
    query.redeemed = true;
  }

  const total = await HPoint.countDocuments(query);
  const points = await HPoint.find(query)
    .sort({ createdAt: -1 })
    .skip((page - 1) * limit)
    .limit(limit);

  return {
    data: points,
    pagination: {
      page,
      limit,
      total,
      pages: Math.ceil(total / limit)
    }
  };
};

/**
 * Buscar pontos próximos de expirar
 */
export const getExpiringPoints = async (userId, days = 30) => {
  const futureDate = new Date();
  futureDate.setDate(futureDate.getDate() + days);

  const points = await HPoint.find({
    userId,
    expirationDate: { $lte: futureDate },
    expired: false,
    redeemed: false
  }).sort({ expirationDate: 1 });

  const totalExpiring = points.reduce((sum, p) => sum + p.points, 0);

  return {
    points,
    total: totalExpiring,
    nearestExpiration: points[0]?.expirationDate
  };
};

/**
 * Expirar pontos (job diário)
 */
export const expirePoints = async () => {
  try {
    const expiredCount = await HPoint.expireOldPoints();
    
    if (expiredCount > 0) {
      // Atualizar saldo de todos os usuários afetados
      const expiredPoints = await HPoint.aggregate([
        { $match: { expired: true, redeemed: false } },
        { $group: { _id: '$userId', total: { $sum: '$points' } } }
      ]);

      for (const { _id: userId, total } of expiredPoints) {
        await User.findByIdAndUpdate(userId, {
          $set: { 'hpoints.balance': await HPoint.calculateBalance(userId) }
        });
      }

      logger.info('HPoints expired:', { count: expiredCount });
    }

    return expiredCount;
  } catch (error) {
    logger.error('Error expiring HPoints:', error);
    throw error;
  }
};

/**
 * Obter descrição padrão por tipo
 */
const getDefaultDescription = (type) => {
  const descriptions = {
    'individual_workout': 'Treino individual validado',
    'together_workout': 'Treino Together validado',
    'race': 'Participação em prova',
    'overall_podium': 'Pódio geral em prova',
    'category_podium': 'Pódio de categoria em prova',
    'double_podium': 'Pódio duplo (geral + categoria)',
    'challenge': 'Desafio completado',
    'referral': 'Indicação de novo membro',
    'photo_video': 'Foto/vídeo de qualidade',
    'mediterraneum_cashback': 'Cashback Mediterraneum',
    'goal_achieved': 'Meta atingida',
    'manual_adjustment': 'Ajuste manual'
  };

  return descriptions[type] || 'HPoints creditados';
};

const hpointService = {
  getPointsConfig,
  calculatePoints,
  creditPoints,
  debitPoints,
  refundPoints,
  adjustPoints,
  getBalance,
  getHistory,
  getExpiringPoints,
  expirePoints
};

export { hpointService };
export default hpointService;
