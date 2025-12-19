import mongoose from 'mongoose';

/**
 * Configuração dos planos disponíveis
 */
export const PLANS = {
  free: {
    id: 'free',
    name: 'Gratuito',
    price: 0,
    description: 'Acesso básico à plataforma',
    features: [
      'Acesso ao app',
      'Treinos básicos',
      'Comunidade Hack Running'
    ],
    limitations: {
      monthlyClasses: 1,
      humanReview: false,
      personalizedPlan: false,
      prioritySupport: false
    }
  },
  plus: {
    id: 'plus',
    name: 'Plus',
    price: 150.00,
    description: 'Para corredores que querem evoluir',
    features: [
      'Tudo do plano Gratuito',
      'Planilha de treino personalizada',
      'Aulas ilimitadas',
      'Acesso a conteúdos exclusivos',
      'Suporte prioritário'
    ],
    limitations: {
      monthlyClasses: 999,
      humanReview: false,
      personalizedPlan: true,
      prioritySupport: true
    }
  },
  pro: {
    id: 'pro',
    name: 'Pro',
    price: 220.00,
    description: 'O melhor para resultados máximos',
    features: [
      'Tudo do plano Plus',
      'Revisão humana da planilha',
      'Acompanhamento de coach',
      'Análise de performance avançada',
      'Mentoria mensal'
    ],
    limitations: {
      monthlyClasses: 999,
      humanReview: true,
      personalizedPlan: true,
      prioritySupport: true,
      coachSupport: true
    }
  }
};

const subscriptionHistorySchema = new mongoose.Schema({
  action: {
    type: String,
    enum: ['created', 'upgraded', 'downgraded', 'cancelled', 'reactivated', 'payment_received', 'payment_failed', 'expired'],
    required: true
  },
  fromPlan: { type: String },
  toPlan: { type: String },
  reason: { type: String },
  metadata: { type: mongoose.Schema.Types.Mixed },
  createdAt: { type: Date, default: Date.now }
}, { _id: true });

const subscriptionSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    unique: true,
    index: true
  },
  plan: {
    type: String,
    enum: ['free', 'plus', 'pro'],
    default: 'free'
  },
  status: {
    type: String,
    enum: ['active', 'pending', 'suspended', 'cancelled', 'expired'],
    default: 'pending'
  },
  
  // Asaas
  asaasCustomerId: { type: String },
  asaasSubscriptionId: { type: String, index: true },
  
  // Datas
  startDate: { type: Date },
  endDate: { type: Date },
  nextBillingDate: { type: Date },
  cancelledAt: { type: Date },
  
  // Pagamento
  billingType: {
    type: String,
    enum: ['PIX', 'BOLETO', 'CREDIT_CARD', 'UNDEFINED'],
    default: 'PIX'
  },
  value: { type: Number },
  cycle: {
    type: String,
    enum: ['MONTHLY', 'QUARTERLY', 'SEMIANNUALLY', 'YEARLY'],
    default: 'MONTHLY'
  },
  
  // Histórico
  history: [subscriptionHistorySchema],
  
  // Metadata
  cancelReason: { type: String },
  notes: { type: String }
}, {
  timestamps: true
});

// Índices
subscriptionSchema.index({ status: 1 });
subscriptionSchema.index({ plan: 1 });
subscriptionSchema.index({ nextBillingDate: 1 });

/**
 * Adicionar evento ao histórico
 */
subscriptionSchema.methods.addHistory = function(action, data = {}) {
  this.history.push({
    action,
    fromPlan: data.fromPlan,
    toPlan: data.toPlan,
    reason: data.reason,
    metadata: data.metadata
  });
};

/**
 * Ativar assinatura
 */
subscriptionSchema.methods.activate = async function(planId, asaasData = {}) {
  const previousPlan = this.plan;
  
  this.plan = planId;
  this.status = 'active';
  this.startDate = new Date();
  this.value = PLANS[planId]?.price || 0;
  
  if (asaasData.subscriptionId) {
    this.asaasSubscriptionId = asaasData.subscriptionId;
  }
  if (asaasData.customerId) {
    this.asaasCustomerId = asaasData.customerId;
  }
  if (asaasData.nextDueDate) {
    this.nextBillingDate = new Date(asaasData.nextDueDate);
  }
  if (asaasData.billingType) {
    this.billingType = asaasData.billingType;
  }
  
  // Adicionar ao histórico
  const action = previousPlan === 'free' ? 'created' : 
                 PLANS[planId].price > PLANS[previousPlan].price ? 'upgraded' : 'downgraded';
  
  this.addHistory(action, {
    fromPlan: previousPlan,
    toPlan: planId,
    metadata: asaasData
  });
  
  return this.save();
};

/**
 * Cancelar assinatura
 */
subscriptionSchema.methods.cancel = async function(reason = '', immediate = false) {
  this.cancelledAt = new Date();
  this.cancelReason = reason;
  
  if (immediate) {
    this.status = 'cancelled';
    this.endDate = new Date();
  } else {
    // Mantém ativo até o fim do período pago
    this.status = 'cancelled';
    // O webhook de pagamento vai desativar quando expirar
  }
  
  this.addHistory('cancelled', {
    fromPlan: this.plan,
    reason
  });
  
  return this.save();
};

/**
 * Reativar assinatura cancelada
 */
subscriptionSchema.methods.reactivate = async function() {
  if (this.status !== 'cancelled') {
    throw new Error('Apenas assinaturas canceladas podem ser reativadas');
  }
  
  this.status = 'active';
  this.cancelledAt = null;
  this.cancelReason = null;
  
  this.addHistory('reactivated', {
    toPlan: this.plan
  });
  
  return this.save();
};

/**
 * Registrar pagamento recebido
 */
subscriptionSchema.methods.registerPayment = async function(paymentData) {
  this.status = 'active';
  
  if (paymentData.nextDueDate) {
    this.nextBillingDate = new Date(paymentData.nextDueDate);
  }
  
  this.addHistory('payment_received', {
    metadata: {
      paymentId: paymentData.paymentId,
      value: paymentData.value,
      paidAt: paymentData.paidAt
    }
  });
  
  return this.save();
};

/**
 * Registrar falha de pagamento
 */
subscriptionSchema.methods.registerPaymentFailed = async function(reason) {
  this.addHistory('payment_failed', {
    reason,
    metadata: { failedAt: new Date() }
  });
  
  return this.save();
};

/**
 * Suspender assinatura (por falta de pagamento)
 */
subscriptionSchema.methods.suspend = async function(reason = 'payment_overdue') {
  this.status = 'suspended';
  
  this.addHistory('expired', {
    fromPlan: this.plan,
    reason
  });
  
  return this.save();
};

/**
 * Verificar se usuário tem acesso a uma feature
 */
subscriptionSchema.methods.hasFeature = function(featureName) {
  const planConfig = PLANS[this.plan];
  if (!planConfig) return false;
  
  return planConfig.limitations[featureName] === true || 
         (typeof planConfig.limitations[featureName] === 'number' && 
          planConfig.limitations[featureName] > 0);
};

/**
 * Obter configuração do plano atual
 */
subscriptionSchema.methods.getPlanConfig = function() {
  return PLANS[this.plan] || PLANS.free;
};

/**
 * Verificar se assinatura está ativa
 */
subscriptionSchema.methods.isActive = function() {
  return this.status === 'active' && this.plan !== 'free';
};

// ========== MÉTODOS ESTÁTICOS ==========

/**
 * Buscar por assinatura Asaas
 */
subscriptionSchema.statics.findByAsaasSubscriptionId = function(subscriptionId) {
  return this.findOne({ asaasSubscriptionId: subscriptionId });
};

/**
 * Buscar assinaturas ativas
 */
subscriptionSchema.statics.findActive = function() {
  return this.find({ status: 'active', plan: { $ne: 'free' } })
    .populate('user', 'name email');
};

/**
 * Buscar assinaturas próximas do vencimento (para notificação)
 */
subscriptionSchema.statics.findNearExpiration = function(daysAhead = 3) {
  const targetDate = new Date();
  targetDate.setDate(targetDate.getDate() + daysAhead);
  
  return this.find({
    status: 'active',
    nextBillingDate: { $lte: targetDate }
  }).populate('user', 'name email');
};

/**
 * Buscar assinaturas expiradas (para suspensão)
 */
subscriptionSchema.statics.findExpired = function() {
  return this.find({
    status: 'active',
    nextBillingDate: { $lt: new Date() }
  }).populate('user', 'name email');
};

/**
 * Obter estatísticas de assinaturas
 */
subscriptionSchema.statics.getStats = async function() {
  const stats = await this.aggregate([
    {
      $group: {
        _id: { plan: '$plan', status: '$status' },
        count: { $sum: 1 },
        totalValue: { $sum: '$value' }
      }
    }
  ]);
  
  const result = {
    byPlan: {},
    byStatus: {},
    totalActive: 0,
    totalMRR: 0
  };
  
  stats.forEach(s => {
    // Por plano
    if (!result.byPlan[s._id.plan]) {
      result.byPlan[s._id.plan] = { count: 0, value: 0 };
    }
    result.byPlan[s._id.plan].count += s.count;
    result.byPlan[s._id.plan].value += s.totalValue;
    
    // Por status
    if (!result.byStatus[s._id.status]) {
      result.byStatus[s._id.status] = 0;
    }
    result.byStatus[s._id.status] += s.count;
    
    // Totais
    if (s._id.status === 'active' && s._id.plan !== 'free') {
      result.totalActive += s.count;
      result.totalMRR += s.totalValue;
    }
  });
  
  return result;
};

/**
 * Criar ou buscar assinatura para um usuário
 */
subscriptionSchema.statics.findOrCreateForUser = async function(userId) {
  let subscription = await this.findOne({ user: userId });
  
  if (!subscription) {
    subscription = new this({
      user: userId,
      plan: 'free',
      status: 'active'
    });
    await subscription.save();
  }
  
  return subscription;
};

const Subscription = mongoose.model('Subscription', subscriptionSchema);

export default Subscription;
