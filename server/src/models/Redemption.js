import mongoose from 'mongoose';
import { nanoid } from 'nanoid';

const redemptionSchema = new mongoose.Schema({
  userId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User',
    required: [true, 'UserId é obrigatório'],
    index: true
  },
  type: { 
    type: String, 
    enum: ['hack_product', 'mediterraneum_product', 'paid_plan', 'race_registration', 'service'],
    required: [true, 'Tipo é obrigatório']
  },
  itemId: { 
    type: mongoose.Schema.Types.ObjectId,
    required: [true, 'ItemId é obrigatório']
  },
  itemName: { 
    type: String, 
    required: [true, 'Nome do item é obrigatório']
  },
  pointsUsed: { 
    type: Number, 
    required: [true, 'Pontos usados são obrigatórios'],
    min: [1, 'Pontos usados devem ser positivos']
  },
  redemptionCode: { 
    type: String, 
    unique: true,
    default: () => nanoid(8).toUpperCase()
  },
  qrCode: { type: String },
  status: { 
    type: String, 
    enum: ['pending', 'approved', 'delivered', 'cancelled'],
    default: 'pending'
  },
  hpointIds: [{ type: mongoose.Schema.Types.ObjectId, ref: 'HPoint' }],
  approvedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  approvedAt: { type: Date },
  deliveredBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  deliveredAt: { type: Date },
  cancelledBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  cancelledAt: { type: Date },
  cancelReason: { type: String },
  notes: { type: String, default: '' }
}, {
  timestamps: true
});

// Índices
// redemptionCode já tem índice único criado automaticamente pelo unique: true
redemptionSchema.index({ status: 1 });
redemptionSchema.index({ userId: 1, status: 1 });

// Método estático para buscar resgates pendentes
redemptionSchema.statics.findPending = function(limit = 50) {
  return this.find({ status: 'pending' })
    .populate('userId', 'name email')
    .sort({ createdAt: 1 })
    .limit(limit);
};

// Método estático para buscar por código
redemptionSchema.statics.findByCode = function(code) {
  return this.findOne({ redemptionCode: code.toUpperCase() })
    .populate('userId', 'name email phone');
};

// Método para aprovar resgate
redemptionSchema.methods.approve = async function(adminId) {
  this.status = 'approved';
  this.approvedBy = adminId;
  this.approvedAt = new Date();
  return this.save();
};

// Método para marcar como entregue
redemptionSchema.methods.deliver = async function(adminId) {
  this.status = 'delivered';
  this.deliveredBy = adminId;
  this.deliveredAt = new Date();
  return this.save();
};

// Método para cancelar resgate
redemptionSchema.methods.cancel = async function(adminId, reason) {
  this.status = 'cancelled';
  this.cancelledBy = adminId;
  this.cancelledAt = new Date();
  this.cancelReason = reason;
  return this.save();
};

const Redemption = mongoose.model('Redemption', redemptionSchema);

export default Redemption;
