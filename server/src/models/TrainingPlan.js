import mongoose from 'mongoose';

const workoutPlanSchema = new mongoose.Schema({
  day: { type: Number, required: true },
  date: { type: Date },
  type: { 
    type: String, 
    enum: ['Z1', 'Z2', 'T', 'I', 'R', 'LR', 'base', 'pace', 'interval', 'long_run', 'recovery', 'strength'],
    required: true
  },
  // Campos de variação de treino
  variationId: { type: String }, // ID da variação usada (ex: 'easy_run', 'progression_run')
  variationName: { type: String }, // Nome amigável da variação
  weekNumber: { type: Number }, // Número da semana no ciclo (1-12)
  blockName: { type: String, enum: ['base', 'build', 'peak'] }, // Bloco de periodização
  isDeloadWeek: { type: Boolean, default: false }, // Se é semana de recuperação
  distance: { type: Number, default: 0 },
  time: { type: Number, default: 0 }, // Tempo total em minutos
  duration_min: { type: Number }, // Duração do treino principal em minutos
  pace_range: {
    min_s_per_km: { type: Number }, // Ritmo mínimo em segundos por km
    max_s_per_km: { type: Number } // Ritmo máximo em segundos por km
  },
  steps: [{ 
    type: String // Ex: "5' Z1", "15' Z2", "5' Z1"
  }],
  description: { type: String, default: '' },
  objective: { type: String }, // Objetivo do treino
  completed: { type: Boolean, default: false },
  workoutId: { type: mongoose.Schema.Types.ObjectId, ref: 'Workout' }
}, { _id: true });

const humanReviewSchema = new mongoose.Schema({
  enabled: { type: Boolean, default: false },
  reviewedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  reviewedAt: { type: Date },
  approved: { type: Boolean },
  adjustments: { type: String }
}, { _id: false });

// Schema para ritmos calculados
const pacesSchema = new mongoose.Schema({
  pace6_s_per_km: { type: Number }, // Pace do teste de 6 min
  pace1k_s_per_km: { type: Number }, // Pace do teste de 1km
  z2: {
    min_s_per_km: { type: Number },
    max_s_per_km: { type: Number }
  },
  z1: {
    min_s_per_km: { type: Number },
    max_s_per_km: { type: Number }
  },
  t_s_per_km: { type: Number }, // Threshold pace
  i_s_per_km: { type: Number }, // Interval pace
  r_s_per_km: { type: Number }, // Rapid pace
  long_run: {
    min_s_per_km: { type: Number },
    max_s_per_km: { type: Number }
  }
}, { _id: false });

// Schema para parâmetros de carga
const loadSchema = new mongoose.Schema({
  week_minutes: { type: Number }, // Volume semanal inicial em minutos
  progression_rate: { type: Number }, // Taxa de progressão (ex: 0.06 = 6%)
  current_week: { type: Number, default: 1 }
}, { _id: false });

// Schema para periodização (NOVO)
const periodizationSchema = new mongoose.Schema({
  // Bloco atual (base, build, peak)
  currentBlock: { 
    type: String, 
    enum: ['base', 'build', 'peak'],
    default: 'base'
  },
  // Semana dentro do bloco atual (1-4)
  currentBlockWeek: { type: Number, default: 1 },
  // Se a semana atual é de recuperação (deload)
  isDeloadWeek: { type: Boolean, default: false },
  // Fator de ajuste de pace (1.0 = original, 0.98 = 2% mais rápido)
  paceAdjustmentFactor: { type: Number, default: 1.0 },
  // Volume base em minutos (usado para calcular progressão)
  baseVolumeMinutes: { type: Number },
  // Multiplicador de volume atual
  currentVolumeMultiplier: { type: Number, default: 1.0 },
  // Total de semanas no ciclo
  totalWeeks: { type: Number, default: 12 },
  // Configuração dos blocos
  blocks: [{
    name: { type: String, enum: ['base', 'build', 'peak'] },
    startWeek: { type: Number },
    endWeek: { type: Number },
    focus: { type: String }
  }]
}, { _id: false });

// Schema para paces originais (para calcular progressão)
const originalPacesSchema = new mongoose.Schema({
  pace6_s_per_km: { type: Number },
  pace1k_s_per_km: { type: Number },
  z2: {
    min_s_per_km: { type: Number },
    max_s_per_km: { type: Number }
  },
  z1: {
    min_s_per_km: { type: Number },
    max_s_per_km: { type: Number }
  },
  t_s_per_km: { type: Number },
  i_s_per_km: { type: Number },
  r_s_per_km: { type: Number },
  long_run: {
    min_s_per_km: { type: Number },
    max_s_per_km: { type: Number }
  }
}, { _id: false });

const trainingPlanSchema = new mongoose.Schema({
  userId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User',
    required: [true, 'UserId é obrigatório'],
    index: true
  },
  objective: { 
    type: String, 
    enum: ['health', 'weight_loss', 'performance', 'race_preparation', 'discipline', 
           'emagrecimento', 'saude_longevidade', 'iniciar_corrida', 'completar_5km', 
           'melhorar_condicionamento', 'performance'],
    required: [true, 'Objetivo é obrigatório']
  },
  level: { 
    type: String, 
    enum: ['beginner', 'intermediate', 'advanced', 'iniciante_A', 'iniciante_B', 'intermediario'],
    required: [true, 'Nível é obrigatório']
  },
  cycle: { 
    type: Number, 
    enum: [30, 45, 60, 90],
    required: [true, 'Duração do ciclo é obrigatória']
  },
  startDate: { 
    type: Date, 
    required: [true, 'Data de início é obrigatória']
  },
  endDate: { 
    type: Date, 
    required: [true, 'Data de fim é obrigatória']
  },
  workouts: [workoutPlanSchema],
  // Campos de paces e carga
  paces: { type: pacesSchema, default: () => ({}) },
  originalPaces: { type: originalPacesSchema, default: () => ({}) }, // Paces originais para calcular progressão
  load: { type: loadSchema, default: () => ({}) },
  // Campos de periodização (NOVO)
  periodization: { type: periodizationSchema, default: () => ({}) },
  classification: {
    level: { type: String },
    block_intensity: { type: Boolean, default: false },
    reduce_progression: { type: Boolean, default: false }
  },
  warnings: [{ type: String }], // Warnings do sistema
  humanReview: { type: humanReviewSchema, default: () => ({}) },
  adherence: { type: Number, default: 0 },
  status: {
    type: String,
    enum: ['active', 'completed', 'cancelled', 'pending_review'],
    default: 'active'
  }
}, {
  timestamps: true
});

// Índices
trainingPlanSchema.index({ userId: 1, status: 1 });
trainingPlanSchema.index({ startDate: 1, endDate: 1 });

// Método para calcular adesão
trainingPlanSchema.methods.calculateAdherence = function() {
  const totalWorkouts = this.workouts.length;
  if (totalWorkouts === 0) return 0;
  
  const completedWorkouts = this.workouts.filter(w => w.completed).length;
  return Math.round((completedWorkouts / totalWorkouts) * 100);
};

// Método para atualizar adesão
trainingPlanSchema.methods.updateAdherence = async function() {
  this.adherence = this.calculateAdherence();
  return this.save();
};

// Método para marcar treino como concluído
trainingPlanSchema.methods.markWorkoutComplete = async function(day, workoutId) {
  const workout = this.workouts.find(w => w.day === day);
  if (workout) {
    workout.completed = true;
    workout.workoutId = workoutId;
    await this.updateAdherence();
  }
  return this;
};

// Método para buscar próximo treino
trainingPlanSchema.methods.getNextWorkout = function() {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  return this.workouts
    .filter(w => !w.completed && new Date(w.date) >= today)
    .sort((a, b) => new Date(a.date) - new Date(b.date))[0];
};

// Método estático para buscar planilha ativa do usuário
trainingPlanSchema.statics.findActiveByUser = function(userId) {
  return this.findOne({
    userId,
    status: 'active'
  }).populate('workouts.workoutId');
};

// Método estático para buscar planilhas pendentes de revisão
trainingPlanSchema.statics.findPendingReview = function(limit = 50) {
  return this.find({ status: 'pending_review' })
    .populate('userId', 'name email')
    .sort({ createdAt: 1 })
    .limit(limit);
};

// Método para verificar se precisa ajuste inteligente
trainingPlanSchema.methods.needsSmartAdjustment = function() {
  const workouts = this.workouts.sort((a, b) => a.day - b.day);
  let missedConsecutive = 0;
  
  const today = new Date();
  for (const workout of workouts) {
    if (new Date(workout.date) < today && !workout.completed) {
      missedConsecutive++;
      if (missedConsecutive >= 2) return true;
    } else {
      missedConsecutive = 0;
    }
  }
  
  return false;
};

const TrainingPlan = mongoose.model('TrainingPlan', trainingPlanSchema);

export default TrainingPlan;
