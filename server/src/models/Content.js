import mongoose from 'mongoose';

const contentSchema = new mongoose.Schema({
  type: { 
    type: String, 
    enum: ['class', 'article', 'video'],
    required: [true, 'Tipo é obrigatório']
  },
  title: { 
    type: String, 
    required: [true, 'Título é obrigatório'],
    trim: true
  },
  description: { type: String, default: '' },
  content: { type: String, default: '' },
  videoUrl: { type: String },
  thumbnail: { type: String, default: '' },
  category: { type: String, default: '' },
  tags: [{ type: String }],
  planRestriction: [{ 
    type: String, 
    enum: ['free', 'paid', 'premium', 'corporate']
  }],
  views: { type: Number, default: 0 },
  active: { type: Boolean, default: true },
  publishedAt: { type: Date },
  author: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  duration: { type: Number },
  attachments: [{
    name: { type: String },
    url: { type: String },
    type: { type: String }
  }]
}, {
  timestamps: true
});

// Índices
contentSchema.index({ type: 1, active: 1 });
contentSchema.index({ category: 1 });
contentSchema.index({ tags: 1 });
contentSchema.index({ publishedAt: -1 });

// Método para incrementar visualizações
contentSchema.methods.incrementViews = async function() {
  this.views += 1;
  return this.save();
};

// Método para publicar
contentSchema.methods.publish = async function() {
  this.active = true;
  this.publishedAt = new Date();
  return this.save();
};

// Método para despublicar
contentSchema.methods.unpublish = async function() {
  this.active = false;
  return this.save();
};

// Método estático para buscar conteúdos ativos
contentSchema.statics.findActive = function(type = null) {
  const query = { active: true };
  if (type) query.type = type;
  return this.find(query).sort({ publishedAt: -1 });
};

// Método estático para buscar conteúdos por categoria
contentSchema.statics.findByCategory = function(category, type = null) {
  const query = { category, active: true };
  if (type) query.type = type;
  return this.find(query).sort({ publishedAt: -1 });
};

// Método estático para buscar conteúdos disponíveis para um plano
contentSchema.statics.findAvailableForPlan = function(planType, type = null) {
  const query = {
    active: true,
    $or: [
      { planRestriction: { $size: 0 } },
      { planRestriction: planType }
    ]
  };
  if (type) query.type = type;
  return this.find(query).sort({ publishedAt: -1 });
};

// Método para verificar se usuário pode acessar
contentSchema.methods.canUserAccess = function(userPlan) {
  if (!this.planRestriction || this.planRestriction.length === 0) {
    return true;
  }
  return this.planRestriction.includes(userPlan);
};

const Content = mongoose.model('Content', contentSchema);

export default Content;
