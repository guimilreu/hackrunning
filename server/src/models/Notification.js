import mongoose from 'mongoose';

const notificationSchema = new mongoose.Schema({
  userId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User',
    required: [true, 'UserId é obrigatório'],
    index: true
  },
  type: { 
    type: String, 
    enum: [
      // Workout
      'workout_approved', 
      'workout_rejected',
      'workout_like',
      'workout_comment',
      'workout_reminder',
      // HPoints
      'hpoints_earned',
      'points_earned',
      'points_expiring',
      // Redemption
      'redemption_approved',
      'redemption_delivered',
      'redemption_ready',
      // Challenge
      'new_challenge',
      'challenge_new',
      'challenge_completed',
      // Event
      'event_new',
      'event_checkin',
      'event_reminder',
      'together_upcoming', 
      'race_upcoming', 
      // Goals
      'goal_achieved',
      // Training Plan
      'training_plan_ready',
      'training_plan_reviewed',
      'training_plan_updated',
      // Kickstart
      'kickstart_shipped',
      'kickstart_delivered',
      // Payment
      'payment',
      'payment_received',
      'payment_failed',
      // Subscription
      'subscription',
      'subscription_upcoming',
      'subscription_due_today',
      'subscription_overdue',
      'subscription_new_charge',
      'subscription_paid',
      // Order
      'order',
      // System
      'system'
    ],
    required: [true, 'Tipo é obrigatório']
  },
  title: { 
    type: String, 
    required: [true, 'Título é obrigatório']
  },
  message: { 
    type: String, 
    required: [true, 'Mensagem é obrigatória']
  },
  read: { type: Boolean, default: false },
  link: { type: String },
  data: { type: mongoose.Schema.Types.Mixed },
  scheduledFor: { type: Date },
  sentAt: { type: Date }
}, {
  timestamps: true
});

// Índices
notificationSchema.index({ userId: 1, read: 1 });
notificationSchema.index({ createdAt: -1 });
notificationSchema.index({ scheduledFor: 1 });

// Método para marcar como lida
notificationSchema.methods.markAsRead = async function() {
  this.read = true;
  return this.save();
};

// Método estático para buscar notificações não lidas
notificationSchema.statics.findUnread = function(userId) {
  return this.find({ userId, read: false })
    .sort({ createdAt: -1 });
};

// Método estático para contar não lidas
notificationSchema.statics.countUnread = function(userId) {
  return this.countDocuments({ userId, read: false });
};

// Método estático para marcar todas como lidas
notificationSchema.statics.markAllAsRead = function(userId) {
  return this.updateMany(
    { userId, read: false },
    { $set: { read: true } }
  );
};

// Método estático para buscar notificações agendadas
notificationSchema.statics.findScheduled = function() {
  return this.find({
    scheduledFor: { $lte: new Date() },
    sentAt: null
  });
};

// Método estático para criar notificação em massa
notificationSchema.statics.createBulk = async function(userIds, notificationData) {
  const notifications = userIds.map(userId => ({
    userId,
    ...notificationData
  }));
  return this.insertMany(notifications);
};

// Método estático para criar notificação do sistema
notificationSchema.statics.createSystemNotification = async function(userId, title, message, link = null) {
  return this.create({
    userId,
    type: 'system',
    title,
    message,
    link
  });
};

const Notification = mongoose.model('Notification', notificationSchema);

export default Notification;
