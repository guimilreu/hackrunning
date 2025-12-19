import mongoose from 'mongoose';

const workoutTemplateSchema = new mongoose.Schema({
  day: { type: Number, required: true },
  type: { 
    type: String, 
    enum: ['base', 'pace', 'interval', 'long_run', 'recovery', 'strength'],
    required: true
  },
  distance: { type: Number, default: 0 },
  time: { type: Number, default: 0 },
  description: { type: String, default: '' }
}, { _id: true });

const cycleSchema = new mongoose.Schema({
  name: { 
    type: String, 
    required: [true, 'Nome é obrigatório'],
    trim: true
  },
  objective: { 
    type: String, 
    enum: ['health', 'weight_loss', 'performance', 'race_preparation', 'discipline'],
    required: [true, 'Objetivo é obrigatório']
  },
  level: { 
    type: String, 
    enum: ['beginner', 'intermediate', 'advanced'],
    required: [true, 'Nível é obrigatório']
  },
  duration: { 
    type: Number, 
    enum: [30, 45, 60, 90],
    required: [true, 'Duração é obrigatória']
  },
  workouts: [workoutTemplateSchema],
  description: { type: String, default: '' },
  active: { type: Boolean, default: true }
}, {
  timestamps: true
});

// Índices
cycleSchema.index({ objective: 1, level: 1 });
cycleSchema.index({ active: 1 });

// Método estático para buscar ciclo por objetivo e nível
cycleSchema.statics.findByObjectiveAndLevel = function(objective, level) {
  return this.findOne({
    objective,
    level,
    active: true
  });
};

// Método estático para buscar ciclos ativos
cycleSchema.statics.findActive = function() {
  return this.find({ active: true }).sort({ name: 1 });
};

const Cycle = mongoose.model('Cycle', cycleSchema);

export default Cycle;
