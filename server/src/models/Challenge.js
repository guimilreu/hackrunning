import mongoose from 'mongoose';

const criteriaSchema = new mongoose.Schema({
  minWorkouts: { type: Number, default: 0 },
  minKm: { type: Number, default: 0 },
  minAdherence: { type: Number, default: 0 }
}, { _id: false });

const participantProgressSchema = new mongoose.Schema({
  workouts: { type: Number, default: 0 },
  km: { type: Number, default: 0 },
  adherence: { type: Number, default: 0 }
}, { _id: false });

const participantSchema = new mongoose.Schema({
  userId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User',
    required: true
  },
  progress: { type: participantProgressSchema, default: () => ({}) },
  completed: { type: Boolean, default: false },
  completedAt: { type: Date },
  pointsEarned: { type: Number, default: 0 }
}, { _id: true });

const challengeSchema = new mongoose.Schema({
  name: { 
    type: String, 
    required: [true, 'Nome é obrigatório'],
    trim: true
  },
  description: { type: String, default: '' },
  duration: { 
    type: Number, 
    enum: [30, 45, 60, 90],
    required: [true, 'Duração é obrigatória']
  },
  startDate: { 
    type: Date, 
    required: [true, 'Data de início é obrigatória']
  },
  endDate: { 
    type: Date, 
    required: [true, 'Data de fim é obrigatória']
  },
  rules: [{ type: String }],
  bonusPoints: { 
    type: Number, 
    required: [true, 'Pontos bônus são obrigatórios'],
    min: [1, 'Pontos bônus devem ser positivos']
  },
  criteria: { type: criteriaSchema, default: () => ({}) },
  participants: [participantSchema],
  active: { type: Boolean, default: true },
  // Restrições de público
  targetPlans: [{ 
    type: String, 
    enum: ['free', 'paid', 'premium', 'corporate'] 
  }],
  targetCompanies: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Company' }],
  isPublic: { type: Boolean, default: true }
}, {
  timestamps: true
});

// Índices
challengeSchema.index({ startDate: 1, endDate: 1 });
challengeSchema.index({ active: 1 });

// Método para adicionar participante
challengeSchema.methods.addParticipant = async function(userId) {
  const exists = this.participants.find(p => p.userId.equals(userId));
  if (!exists) {
    this.participants.push({ userId });
    return this.save();
  }
  return this;
};

// Método para atualizar progresso do participante
challengeSchema.methods.updateParticipantProgress = async function(userId, progressData) {
  const participant = this.participants.find(p => p.userId.equals(userId));
  if (participant) {
    Object.assign(participant.progress, progressData);
    
    // Verificar se completou
    const { minWorkouts, minKm, minAdherence } = this.criteria;
    const { workouts, km, adherence } = participant.progress;
    
    if (
      (minWorkouts === 0 || workouts >= minWorkouts) &&
      (minKm === 0 || km >= minKm) &&
      (minAdherence === 0 || adherence >= minAdherence)
    ) {
      if (!participant.completed) {
        participant.completed = true;
        participant.completedAt = new Date();
        participant.pointsEarned = this.bonusPoints;
      }
    }
    
    return this.save();
  }
  return this;
};

// Método para obter progresso de um participante
challengeSchema.methods.getParticipantProgress = function(userId) {
  return this.participants.find(p => p.userId.equals(userId));
};

// Método para verificar se usuário está participando
challengeSchema.methods.isParticipating = function(userId) {
  return this.participants.some(p => p.userId.equals(userId));
};

// Método estático para buscar desafios ativos
challengeSchema.statics.findActive = function() {
  const now = new Date();
  return this.find({
    active: true,
    startDate: { $lte: now },
    endDate: { $gte: now }
  }).sort({ endDate: 1 });
};

// Método estático para buscar desafios do usuário
challengeSchema.statics.findByUser = function(userId) {
  return this.find({
    'participants.userId': userId
  }).sort({ endDate: -1 });
};

// Método estático para buscar desafios disponíveis para um usuário
challengeSchema.statics.findAvailableForUser = function(userPlan, companyId = null) {
  const now = new Date();
  const query = {
    active: true,
    startDate: { $lte: now },
    endDate: { $gte: now },
    $or: [
      { isPublic: true },
      { targetPlans: userPlan }
    ]
  };
  
  if (companyId) {
    query.$or.push({ targetCompanies: companyId });
  }
  
  return this.find(query).sort({ endDate: 1 });
};

const Challenge = mongoose.model('Challenge', challengeSchema);

export default Challenge;
