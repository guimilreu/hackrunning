import mongoose from 'mongoose';

const photoSchema = new mongoose.Schema({
  url: { type: String, default: '' },
  s3Key: { type: String, default: '' },
  validated: { type: Boolean, default: false }
}, { _id: false });

const sharesSchema = new mongoose.Schema({
  strava: { type: Boolean, default: false },
  instagram: { type: Boolean, default: false },
  whatsapp: { type: Boolean, default: false }
}, { _id: false });

const commentSchema = new mongoose.Schema({
  userId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User',
    required: true
  },
  text: { 
    type: String, 
    required: true,
    trim: true
  },
  createdAt: { 
    type: Date, 
    default: Date.now 
  }
}, { _id: true });

const hpointsSchema = new mongoose.Schema({
  points: { type: Number, default: 0 },
  status: { 
    type: String, 
    enum: ['pending', 'approved', 'rejected'],
    default: 'pending'
  },
  validatedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  validatedAt: { type: Date },
  rejectionReason: { type: String }
}, { _id: false });

const podiumSchema = new mongoose.Schema({
  achieved: { type: Boolean, default: false },
  type: { 
    type: String, 
    enum: ['overall', 'category', 'double']
  },
  position: { type: Number },
  category: { type: String }
}, { _id: false });

const workoutSchema = new mongoose.Schema({
  userId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User',
    required: [true, 'UserId é obrigatório'],
    index: true
  },
  type: { 
    type: String, 
    enum: ['individual', 'together', 'race'],
    required: [true, 'Tipo é obrigatório']
  },
  date: { 
    type: Date, 
    required: [true, 'Data é obrigatória'],
    index: true
  },
  distance: { 
    type: Number, 
    required: [true, 'Distância é obrigatória'],
    min: [0, 'Distância não pode ser negativa']
  },
  time: { 
    type: Number, 
    required: [true, 'Tempo é obrigatório'],
    min: [0, 'Tempo não pode ser negativo']
  },
  pace: { 
    type: Number,
    default: 0
  },
  workoutType: { 
    type: String, 
    enum: ['base', 'pace', 'interval', 'long_run', 'recovery', 'strength']
  },
  trainingPlanId: { type: mongoose.Schema.Types.ObjectId, ref: 'TrainingPlan' },
  cycleId: { type: mongoose.Schema.Types.ObjectId, ref: 'Cycle' },
  photo: { type: photoSchema, default: () => ({}) },
  shares: { type: sharesSchema, default: () => ({}) },
  likes: [{ 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User' 
  }],
  comments: [commentSchema],
  hpoints: { type: hpointsSchema, default: () => ({}) },
  podium: { type: podiumSchema, default: () => ({}) },
  eventId: { type: mongoose.Schema.Types.ObjectId, ref: 'Event' },
  importedFromStrava: { type: Boolean, default: false },
  stravaActivityId: { type: String },
  notes: { type: String, default: '' },
  instagramStoryLink: { type: String, default: '' }
}, {
  timestamps: true
});

// Índices compostos
workoutSchema.index({ userId: 1, date: -1 });
workoutSchema.index({ userId: 1, 'hpoints.status': 1 });
workoutSchema.index({ 'hpoints.status': 1 });

// Calcular pace automaticamente antes de salvar
workoutSchema.pre('save', function(next) {
  if (this.distance > 0 && this.time > 0) {
    this.pace = Math.round(this.time / this.distance);
  }
  next();
});

// Método estático para buscar treinos pendentes de validação
workoutSchema.statics.findPendingValidation = function(limit = 50) {
  return this.find({ 'hpoints.status': 'pending' })
    .populate('userId', 'name email')
    .sort({ createdAt: 1 })
    .limit(limit);
};

// Método estático para buscar treinos por período
workoutSchema.statics.findByPeriod = function(userId, startDate, endDate) {
  return this.find({
    userId,
    date: { $gte: startDate, $lte: endDate }
  }).sort({ date: -1 });
};

// Método para formatar pace em min:seg
workoutSchema.methods.getFormattedPace = function() {
  if (!this.pace) return '00:00';
  const minutes = Math.floor(this.pace / 60);
  const seconds = this.pace % 60;
  return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
};

// Método para formatar tempo em hh:mm:ss
workoutSchema.methods.getFormattedTime = function() {
  const hours = Math.floor(this.time / 3600);
  const minutes = Math.floor((this.time % 3600) / 60);
  const seconds = this.time % 60;
  return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
};

const Workout = mongoose.model('Workout', workoutSchema);

export default Workout;
