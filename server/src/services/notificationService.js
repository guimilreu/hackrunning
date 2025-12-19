import { Notification, User, Setting } from '../models/index.js';
import { emailService } from './emailService.js';

/**
 * Serviço para gerenciamento de notificações
 */

// Tipos de notificação e suas configurações
const NOTIFICATION_TYPES = {
  workout_reminder: {
    title: 'Lembrete de Treino',
    sendEmail: false,
    priority: 'normal'
  },
  workout_approved: {
    title: 'Treino Aprovado',
    sendEmail: true,
    priority: 'normal'
  },
  workout_rejected: {
    title: 'Treino Não Aprovado',
    sendEmail: true,
    priority: 'high'
  },
  points_earned: {
    title: 'Pontos Conquistados',
    sendEmail: false,
    priority: 'normal'
  },
  points_expiring: {
    title: 'Pontos Expirando',
    sendEmail: true,
    priority: 'high'
  },
  redemption_approved: {
    title: 'Resgate Aprovado',
    sendEmail: true,
    priority: 'normal'
  },
  redemption_ready: {
    title: 'Resgate Pronto',
    sendEmail: true,
    priority: 'high'
  },
  event_reminder: {
    title: 'Lembrete de Evento',
    sendEmail: true,
    priority: 'normal'
  },
  event_new: {
    title: 'Novo Evento',
    sendEmail: false,
    priority: 'normal'
  },
  challenge_new: {
    title: 'Novo Desafio',
    sendEmail: false,
    priority: 'normal'
  },
  challenge_completed: {
    title: 'Desafio Concluído',
    sendEmail: true,
    priority: 'normal'
  },
  training_plan_ready: {
    title: 'Plano de Treino Pronto',
    sendEmail: true,
    priority: 'high'
  },
  training_plan_updated: {
    title: 'Plano Atualizado',
    sendEmail: false,
    priority: 'normal'
  },
  kickstart_shipped: {
    title: 'Kit Enviado',
    sendEmail: true,
    priority: 'high'
  },
  payment_received: {
    title: 'Pagamento Confirmado',
    sendEmail: true,
    priority: 'normal'
  },
  payment_failed: {
    title: 'Problema no Pagamento',
    sendEmail: true,
    priority: 'high'
  },
  subscription_upcoming: {
    title: 'Cobrança Próxima',
    sendEmail: true,
    priority: 'normal'
  },
  subscription_due_today: {
    title: 'Cobrança Hoje',
    sendEmail: true,
    priority: 'high'
  },
  subscription_overdue: {
    title: 'Cobrança Vencida',
    sendEmail: true,
    priority: 'high'
  },
  subscription_new_charge: {
    title: 'Nova Cobrança Disponível',
    sendEmail: true,
    priority: 'high'
  },
  subscription_paid: {
    title: 'Assinatura Renovada',
    sendEmail: true,
    priority: 'normal'
  },
  system: {
    title: 'Aviso do Sistema',
    sendEmail: false,
    priority: 'low'
  }
};

/**
 * Cria uma notificação para um usuário
 */
export const createNotification = async (userId, type, data = {}) => {
  const config = NOTIFICATION_TYPES[type] || NOTIFICATION_TYPES.system;
  
  const notification = await Notification.create({
    userId: userId,
    type,
    title: data.title || config.title,
    message: data.message,
    link: data.link || null,
    read: false,
    data: data.data || null
  });

  // Enviar email se configurado
  if (config.sendEmail && data.sendEmail !== false) {
    await sendNotificationEmail(userId, type, data);
  }

  return notification;
};

/**
 * Envia email de notificação
 */
const sendNotificationEmail = async (userId, type, data) => {
  try {
    const user = await User.findById(userId);
    if (!user || !user.email) return;

    // Verificar preferências de email do usuário
    if (user.preferences?.emailNotifications === false) {
      return;
    }

    const emailMethods = {
      workout_approved: () => emailService.sendWorkoutApprovedEmail(
        user,
        data.workout,
        data.points
      ),
      workout_rejected: () => emailService.sendWorkoutRejectedEmail(
        user,
        data.workout,
        data.reason
      ),
      points_expiring: () => emailService.sendPointsExpiringEmail(
        user,
        data.points,
        data.expirationDate
      ),
      redemption_approved: () => emailService.sendRedemptionApprovedEmail(
        user,
        data.redemption
      ),
      training_plan_ready: () => emailService.sendTrainingPlanReadyEmail(
        user
      ),
      kickstart_shipped: () => emailService.sendKickstartShippedEmail(
        user,
        data.trackingCode
      )
    };

    if (emailMethods[type]) {
      await emailMethods[type]();
    }
  } catch (error) {
    console.error(`Erro ao enviar email de notificação (${type}):`, error);
  }
};

/**
 * Cria notificações em lote para múltiplos usuários
 */
export const createBulkNotifications = async (userIds, type, data = {}) => {
  const config = NOTIFICATION_TYPES[type] || NOTIFICATION_TYPES.system;
  
  const notificationData = {
    type,
    title: data.title || config.title,
    message: data.message,
    link: data.link || null,
    read: false,
    data: data.data || null
  };
  
  const notifications = await Notification.createBulk(userIds, notificationData);
  
  // Enviar emails se necessário (em background)
  if (config?.sendEmail && data.sendEmail !== false) {
    setImmediate(async () => {
      for (const userId of userIds) {
        await sendNotificationEmail(userId, type, data);
      }
    });
  }

  return notifications;
};

/**
 * Obter notificações do usuário
 */
export const getUserNotifications = async (userId, options = {}) => {
  const { page = 1, limit = 20, unreadOnly = false } = options;
  const skip = (page - 1) * limit;

  const query = { userId: userId };
  if (unreadOnly) {
    query.read = false;
  }

  const [notifications, total, unreadCount] = await Promise.all([
    Notification.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit),
    Notification.countDocuments(query),
    Notification.countUnread(userId)
  ]);

  return {
    notifications,
    pagination: {
      page,
      limit,
      total,
      pages: Math.ceil(total / limit)
    },
    unreadCount
  };
};

/**
 * Marcar notificação como lida
 */
export const markAsRead = async (userId, notificationId) => {
  const notification = await Notification.findOneAndUpdate(
    { _id: notificationId, user: userId },
    { read: true },
    { new: true }
  );

  return notification;
};

/**
 * Marcar todas as notificações como lidas
 */
export const markAllAsRead = async (userId) => {
  const result = await Notification.markAllAsRead(userId);
  return result;
};

/**
 * Obter contagem de notificações não lidas
 */
export const getUnreadCount = async (userId) => {
  return Notification.countUnread(userId);
};

/**
 * Deletar notificação
 */
export const deleteNotification = async (userId, notificationId) => {
  const result = await Notification.deleteOne({
    _id: notificationId,
    userId: userId
  });

  return result.deletedCount > 0;
};

/**
 * Deletar notificações antigas
 */
export const deleteOldNotifications = async (daysOld = 30) => {
  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - daysOld);

  const result = await Notification.deleteMany({
    read: true,
    createdAt: { $lt: cutoffDate }
  });

  return result.deletedCount;
};

/**
 * Criar notificação de sistema para um usuário
 */
export const createSystemNotification = async (userId, title, message, link = null) => {
  return Notification.createSystemNotification(userId, title, message, link);
};

/**
 * Notificar sobre lembrete de treino
 */
export const notifyWorkoutReminder = async (userId, workoutData) => {
  return createNotification(userId, 'workout_reminder', {
    message: `Você tem um treino de ${workoutData.type} agendado para hoje: ${workoutData.description}`,
    link: '/meu-treino'
  });
};

/**
 * Notificar sobre aprovação de treino
 */
export const notifyWorkoutApproved = async (userId, points) => {
  return createNotification(userId, 'workout_approved', {
    message: `Seu treino foi aprovado! Você ganhou ${points} HPoints.`,
    link: '/hpoints',
    points
  });
};

/**
 * Notificar sobre rejeição de treino
 */
export const notifyWorkoutRejected = async (userId, reason) => {
  return createNotification(userId, 'workout_rejected', {
    message: `Seu treino não foi aprovado. Motivo: ${reason}`,
    link: '/meus-treinos',
    reason
  });
};

/**
 * Notificar sobre pontos ganhos
 */
export const notifyPointsEarned = async (userId, points, reason) => {
  return createNotification(userId, 'points_earned', {
    message: `Você ganhou ${points} HPoints! ${reason}`,
    link: '/hpoints',
    points
  });
};

/**
 * Notificar sobre pontos expirando
 */
export const notifyPointsExpiring = async (userId, points, expirationDate) => {
  return createNotification(userId, 'points_expiring', {
    message: `Você tem ${points} HPoints expirando em ${expirationDate}. Use antes que expirem!`,
    link: '/loja',
    points,
    expirationDate
  });
};

/**
 * Notificar sobre evento próximo
 */
export const notifyEventReminder = async (userId, eventData) => {
  return createNotification(userId, 'event_reminder', {
    message: `Lembrete: ${eventData.name} acontece ${eventData.timeUntil}!`,
    link: `/eventos/${eventData.id}`
  });
};

/**
 * Notificar sobre novo evento
 */
export const notifyNewEvent = async (userIds, eventData) => {
  return createBulkNotifications(userIds, 'event_new', {
    message: `Novo evento: ${eventData.name} - ${eventData.date}`,
    link: `/eventos/${eventData.id}`
  });
};

/**
 * Notificar sobre novo desafio
 */
export const notifyNewChallenge = async (userIds, challengeData) => {
  return createBulkNotifications(userIds, 'challenge_new', {
    message: `Novo desafio disponível: ${challengeData.name}. Participe e ganhe ${challengeData.bonusPoints} HPoints!`,
    link: `/desafios/${challengeData.id}`
  });
};

/**
 * Notificar sobre conclusão de desafio
 */
export const notifyChallengeCompleted = async (userId, challengeData) => {
  return createNotification(userId, 'challenge_completed', {
    message: `Parabéns! Você completou o desafio "${challengeData.name}" e ganhou ${challengeData.bonusPoints} HPoints!`,
    link: '/hpoints'
  });
};

/**
 * Notificar sobre plano de treino pronto
 */
export const notifyTrainingPlanReady = async (userId, planType) => {
  return createNotification(userId, 'training_plan_ready', {
    message: `Seu plano de treino para ${planType} está pronto! Confira seu primeiro treino.`,
    link: '/meu-treino',
    planType
  });
};

/**
 * Notificar sobre atualização do plano
 */
export const notifyTrainingPlanUpdated = async (userId, updateType) => {
  return createNotification(userId, 'training_plan_updated', {
    message: `Seu plano de treino foi atualizado: ${updateType}`,
    link: '/meu-treino'
  });
};

/**
 * Notificar sobre Kit enviado
 */
export const notifyKickstartShipped = async (userId, trackingCode) => {
  return createNotification(userId, 'kickstart_shipped', {
    message: `Seu Kickstart Kit foi enviado! Código de rastreio: ${trackingCode}`,
    link: '/minha-conta',
    trackingCode
  });
};

/**
 * Notificar sobre pagamento recebido
 */
export const notifyPaymentReceived = async (userId, orderType) => {
  return createNotification(userId, 'payment_received', {
    message: `Pagamento confirmado para ${orderType}. Obrigado!`,
    link: '/minha-conta'
  });
};

/**
 * Notificar sobre falha no pagamento
 */
export const notifyPaymentFailed = async (userId, reason) => {
  return createNotification(userId, 'payment_failed', {
    message: `Houve um problema com seu pagamento: ${reason}. Por favor, verifique seus dados.`,
    link: '/minha-conta'
  });
};

/**
 * Notificar sobre cobrança próxima (3 dias antes)
 */
export const notifySubscriptionUpcoming = async (userId, subscriptionData) => {
  const { plan, billingType, value, daysUntil } = subscriptionData;
  
  const paymentMethodText = billingType === 'CREDIT_CARD' 
    ? 'será cobrado automaticamente no seu cartão'
    : 'estará disponível para pagamento';
  
  return createNotification(userId, 'subscription_upcoming', {
    message: `Seu plano ${plan} vence em ${daysUntil} dias. O valor de R$ ${value.toFixed(2)} ${paymentMethodText}.`,
    link: '/app/subscription'
  });
};

/**
 * Notificar sobre cobrança hoje
 */
export const notifySubscriptionDueToday = async (userId, subscriptionData) => {
  const { plan, billingType, value } = subscriptionData;
  
  const paymentMethodText = billingType === 'CREDIT_CARD'
    ? 'será cobrado automaticamente no seu cartão hoje'
    : 'está disponível para pagamento. Pague hoje para manter seu plano ativo';
  
  return createNotification(userId, 'subscription_due_today', {
    message: `Seu plano ${plan} vence hoje! O valor de R$ ${value.toFixed(2)} ${paymentMethodText}.`,
    link: '/app/subscription'
  });
};

/**
 * Notificar sobre cobrança vencida
 */
export const notifySubscriptionOverdue = async (userId, subscriptionData) => {
  const { plan, value, daysOverdue } = subscriptionData;
  
  return createNotification(userId, 'subscription_overdue', {
    message: `Seu plano ${plan} está vencido há ${daysOverdue} dias. Pague R$ ${value.toFixed(2)} para manter seu acesso.`,
    link: '/app/subscription'
  });
};

/**
 * Notificar sobre nova cobrança disponível (PIX/Boleto)
 */
export const notifySubscriptionNewCharge = async (userId, subscriptionData) => {
  const { plan, billingType, value, paymentUrl } = subscriptionData;
  
  const methodText = billingType === 'PIX' ? 'PIX' : 'boleto';
  
  return createNotification(userId, 'subscription_new_charge', {
    message: `Nova cobrança de R$ ${value.toFixed(2)} do seu plano ${plan} disponível. Clique para pagar via ${methodText}.`,
    link: paymentUrl || '/app/subscription'
  });
};

/**
 * Notificar sobre assinatura renovada com sucesso
 */
export const notifySubscriptionPaid = async (userId, subscriptionData) => {
  const { plan, nextDueDate } = subscriptionData;
  
  const nextDate = new Date(nextDueDate).toLocaleDateString('pt-BR');
  
  return createNotification(userId, 'subscription_paid', {
    message: `Seu plano ${plan} foi renovado com sucesso! Próxima cobrança: ${nextDate}.`,
    link: '/app/subscription'
  });
};

/**
 * Método genérico create para compatibilidade com código existente
 * Aceita objeto com userId, type, title, message, link, data
 */
export const create = async (notificationData) => {
  const { userId, type, title, message, link, data } = notificationData;
  
  if (!userId) {
    throw new Error('UserId é obrigatório');
  }
  
  if (!type) {
    throw new Error('Tipo é obrigatório');
  }
  
  return createNotification(userId, type, {
    title,
    message,
    link,
    data
  });
};

const notificationService = {
  create,
  createNotification,
  createBulkNotifications,
  getUserNotifications,
  markAsRead,
  markAllAsRead,
  getUnreadCount,
  deleteNotification,
  deleteOldNotifications,
  createSystemNotification,
  notifyWorkoutReminder,
  notifyWorkoutApproved,
  notifyWorkoutRejected,
  notifyPointsEarned,
  notifyPointsExpiring,
  notifyEventReminder,
  notifyNewEvent,
  notifyNewChallenge,
  notifyChallengeCompleted,
  notifyTrainingPlanReady,
  notifyTrainingPlanUpdated,
  notifyKickstartShipped,
  notifyPaymentReceived,
  notifyPaymentFailed,
  notifySubscriptionUpcoming,
  notifySubscriptionDueToday,
  notifySubscriptionOverdue,
  notifySubscriptionNewCharge,
  notifySubscriptionPaid
};

export { notificationService };
export default notificationService;
