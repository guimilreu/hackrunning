import mongoose from 'mongoose';
import { addMonths } from 'date-fns';

const hpointSchema = new mongoose.Schema({
  userId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User',
    required: [true, 'UserId é obrigatório'],
    index: true
  },
  type: { 
    type: String, 
    enum: [
      'individual_workout', 
      'together_workout', 
      'race', 
      'overall_podium', 
      'category_podium', 
      'double_podium', 
      'challenge', 
      'referral', 
      'photo_video', 
      'mediterraneum_cashback', 
      'goal_achieved', 
      'manual_adjustment'
    ],
    required: [true, 'Tipo é obrigatório']
  },
  points: { 
    type: Number, 
    required: [true, 'Pontos são obrigatórios']
  },
  description: { type: String, default: '' },
  referenceId: { type: mongoose.Schema.Types.ObjectId },
  referenceType: { 
    type: String,
    enum: ['Workout', 'Challenge', 'Event', 'Order', 'User', 'Other']
  },
  expirationDate: { 
    type: Date,
    default: function() {
      return addMonths(new Date(), 6);
    }
  },
  expired: { type: Boolean, default: false },
  redeemed: { type: Boolean, default: false },
  redemptionId: { type: mongoose.Schema.Types.ObjectId, ref: 'Redemption' },
  adjustedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  adjustmentReason: { type: String }
}, {
  timestamps: true
});

// Índices
hpointSchema.index({ userId: 1, expired: 1, redeemed: 1 });
hpointSchema.index({ expirationDate: 1 });
hpointSchema.index({ createdAt: 1 });

// Método estático para buscar pontos ativos de um usuário
hpointSchema.statics.findActiveByUser = function(userId) {
  return this.find({
    userId,
    expired: false,
    redeemed: false
  }).sort({ createdAt: 1 }); // FIFO - mais antigos primeiro
};

// Método estático para calcular saldo de um usuário
hpointSchema.statics.calculateBalance = async function(userId) {
  const result = await this.aggregate([
    {
      $match: {
        userId: new mongoose.Types.ObjectId(userId),
        expired: false,
        redeemed: false
      }
    },
    {
      $group: {
        _id: null,
        total: { $sum: '$points' }
      }
    }
  ]);
  
  return result.length > 0 ? result[0].total : 0;
};

// Método estático para buscar pontos próximos de expirar
hpointSchema.statics.findExpiringSoon = function(days = 30) {
  const futureDate = addMonths(new Date(), 0);
  futureDate.setDate(futureDate.getDate() + days);
  
  return this.find({
    expirationDate: { $lte: futureDate },
    expired: false,
    redeemed: false
  }).populate('userId', 'name email');
};

// Método estático para expirar pontos
hpointSchema.statics.expireOldPoints = async function() {
  const now = new Date();
  
  const result = await this.updateMany(
    {
      expirationDate: { $lte: now },
      expired: false,
      redeemed: false
    },
    {
      $set: { expired: true }
    }
  );
  
  return result.modifiedCount;
};

// Método estático para usar pontos (FIFO)
hpointSchema.statics.usePoints = async function(userId, pointsNeeded, redemptionId) {
  const availablePoints = await this.findActiveByUser(userId);
  let remainingPoints = pointsNeeded;
  const usedPointIds = [];
  
  for (const point of availablePoints) {
    if (remainingPoints <= 0) break;
    
    if (point.points <= remainingPoints) {
      // Usar todos os pontos deste registro
      point.redeemed = true;
      point.redemptionId = redemptionId;
      await point.save();
      remainingPoints -= point.points;
      usedPointIds.push(point._id);
    } else {
      // Dividir: parte resgatada, parte permanece
      // Criar novo registro com pontos restantes
      const newPoint = new this({
        userId: point.userId,
        type: point.type,
        points: point.points - remainingPoints,
        description: point.description,
        referenceId: point.referenceId,
        referenceType: point.referenceType,
        expirationDate: point.expirationDate
      });
      await newPoint.save();
      
      // Atualizar registro original
      point.points = remainingPoints;
      point.redeemed = true;
      point.redemptionId = redemptionId;
      await point.save();
      
      usedPointIds.push(point._id);
      remainingPoints = 0;
    }
  }
  
  return usedPointIds;
};

// Método para verificar se expirado
hpointSchema.methods.isExpired = function() {
  return new Date() > this.expirationDate || this.expired;
};

const HPoint = mongoose.model('HPoint', hpointSchema);

export default HPoint;
