import mongoose from 'mongoose';

const stockSchema = new mongoose.Schema({
  available: { type: Boolean, default: true },
  quantity: { type: Number }
}, { _id: false });

const restrictionsSchema = new mongoose.Schema({
  plans: [{ 
    type: String, 
    enum: ['free', 'paid', 'premium', 'corporate'] 
  }],
  limitPerUser: { type: Number }
}, { _id: false });

const productSchema = new mongoose.Schema({
  name: { 
    type: String, 
    required: [true, 'Nome é obrigatório'],
    trim: true
  },
  description: { 
    type: String, 
    default: ''
  },
  type: { 
    type: String, 
    enum: ['hack_product', 'mediterraneum_product', 'paid_plan', 'race_registration', 'service'],
    required: [true, 'Tipo é obrigatório']
  },
  category: { type: String, default: '' },
  points: { 
    type: Number, 
    required: [true, 'Pontos são obrigatórios'],
    min: [1, 'Pontos devem ser positivos']
  },
  monetaryValue: { type: Number },
  image: { type: String, default: '' },
  images: [{ type: String }],
  stock: { type: stockSchema, default: () => ({ available: true }) },
  active: { type: Boolean, default: true },
  restrictions: { type: restrictionsSchema, default: () => ({}) },
  requiresApproval: { type: Boolean, default: true },
  sizes: [{ type: String }],
  colors: [{ type: String }]
}, {
  timestamps: true
});

// Índices
productSchema.index({ type: 1, active: 1 });
productSchema.index({ category: 1 });
productSchema.index({ points: 1 });

// Método estático para buscar produtos ativos
productSchema.statics.findActive = function() {
  return this.find({ active: true }).sort({ name: 1 });
};

// Método estático para buscar por tipo
productSchema.statics.findByType = function(type) {
  return this.find({ type, active: true }).sort({ name: 1 });
};

// Método estático para buscar produtos disponíveis para um plano
productSchema.statics.findAvailableForPlan = function(planType) {
  return this.find({
    active: true,
    'stock.available': true,
    $or: [
      { 'restrictions.plans': { $size: 0 } },
      { 'restrictions.plans': planType }
    ]
  }).sort({ name: 1 });
};

// Método para verificar disponibilidade
productSchema.methods.isAvailable = function() {
  if (!this.active) return false;
  if (!this.stock.available) return false;
  if (this.stock.quantity !== undefined && this.stock.quantity <= 0) return false;
  return true;
};

// Método para decrementar estoque
productSchema.methods.decrementStock = async function() {
  if (this.stock.quantity !== undefined) {
    this.stock.quantity -= 1;
    if (this.stock.quantity <= 0) {
      this.stock.available = false;
    }
    return this.save();
  }
  return this;
};

// Método para verificar se usuário pode resgatar
productSchema.methods.canUserRedeem = function(userPlan) {
  if (this.restrictions.plans && this.restrictions.plans.length > 0) {
    return this.restrictions.plans.includes(userPlan);
  }
  return true;
};

const Product = mongoose.model('Product', productSchema);

export default Product;
