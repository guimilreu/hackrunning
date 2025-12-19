import mongoose from 'mongoose';

const auditLogSchema = new mongoose.Schema({
  action: { 
    type: String, 
    required: [true, 'Ação é obrigatória']
  },
  userId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User',
    required: [true, 'UserId é obrigatório'],
    index: true
  },
  type: { 
    type: String, 
    enum: [
      'create', 
      'update', 
      'delete', 
      'validation', 
      'points_adjustment', 
      'plan_change',
      'login',
      'logout',
      'password_reset',
      'data_access',
      'data_export',
      'permission_change'
    ],
    required: [true, 'Tipo é obrigatório']
  },
  entity: { 
    type: String,
    required: [true, 'Entidade é obrigatória']
  },
  entityId: { type: mongoose.Schema.Types.ObjectId },
  oldData: { type: mongoose.Schema.Types.Mixed },
  newData: { type: mongoose.Schema.Types.Mixed },
  ip: { type: String },
  userAgent: { type: String },
  metadata: { type: mongoose.Schema.Types.Mixed }
}, {
  timestamps: true
});

// Índices
auditLogSchema.index({ userId: 1, createdAt: -1 });
auditLogSchema.index({ entity: 1, entityId: 1 });
auditLogSchema.index({ type: 1 });
auditLogSchema.index({ createdAt: -1 });

// Método estático para criar log
auditLogSchema.statics.log = async function(data) {
  return this.create(data);
};

// Método estático para buscar logs por entidade
auditLogSchema.statics.findByEntity = function(entity, entityId) {
  return this.find({ entity, entityId })
    .populate('userId', 'name email')
    .sort({ createdAt: -1 });
};

// Método estático para buscar logs por usuário
auditLogSchema.statics.findByUser = function(userId, limit = 100) {
  return this.find({ userId })
    .sort({ createdAt: -1 })
    .limit(limit);
};

// Método estático para buscar logs por tipo
auditLogSchema.statics.findByType = function(type, limit = 100) {
  return this.find({ type })
    .populate('userId', 'name email')
    .sort({ createdAt: -1 })
    .limit(limit);
};

// Método estático para buscar logs por período
auditLogSchema.statics.findByPeriod = function(startDate, endDate, filters = {}) {
  const query = {
    createdAt: { $gte: startDate, $lte: endDate },
    ...filters
  };
  
  return this.find(query)
    .populate('userId', 'name email')
    .sort({ createdAt: -1 });
};

// Helper para criar logs de ações comuns
auditLogSchema.statics.logCreate = function(userId, entity, entityId, newData, req = {}) {
  return this.log({
    action: `${entity} criado`,
    userId,
    type: 'create',
    entity,
    entityId,
    newData,
    ip: req.ip,
    userAgent: req.get?.('user-agent')
  });
};

auditLogSchema.statics.logUpdate = function(userId, entity, entityId, oldData, newData, req = {}) {
  return this.log({
    action: `${entity} atualizado`,
    userId,
    type: 'update',
    entity,
    entityId,
    oldData,
    newData,
    ip: req.ip,
    userAgent: req.get?.('user-agent')
  });
};

auditLogSchema.statics.logDelete = function(userId, entity, entityId, oldData, req = {}) {
  return this.log({
    action: `${entity} deletado`,
    userId,
    type: 'delete',
    entity,
    entityId,
    oldData,
    ip: req.ip,
    userAgent: req.get?.('user-agent')
  });
};

auditLogSchema.statics.logPointsAdjustment = function(userId, targetUserId, points, reason, req = {}) {
  return this.log({
    action: 'Ajuste de HPoints',
    userId,
    type: 'points_adjustment',
    entity: 'HPoint',
    entityId: targetUserId,
    newData: { points, reason, targetUserId },
    ip: req.ip,
    userAgent: req.get?.('user-agent')
  });
};

auditLogSchema.statics.logLogin = function(userId, ip, userAgent) {
  return this.log({
    action: 'Login realizado',
    userId,
    type: 'login',
    entity: 'User',
    entityId: userId,
    ip,
    userAgent
  });
};

auditLogSchema.statics.logAuth = async function(action, userId, metadata = {}, req = {}) {
  const actionMap = {
    'register': { action: 'Registro realizado', type: 'create' },
    'login': { action: 'Login realizado', type: 'login' },
    'logout': { action: 'Logout realizado', type: 'logout' },
    'password_reset_request': { action: 'Solicitação de reset de senha', type: 'password_reset' },
    'password_reset': { action: 'Senha redefinida', type: 'password_reset' },
    'password_change': { action: 'Senha alterada', type: 'password_reset' }
  };

  const config = actionMap[action] || { action, type: 'data_access' };

  return await this.log({
    action: config.action,
    userId,
    type: config.type,
    entity: 'User',
    entityId: userId,
    newData: metadata,
    ip: req.ip,
    userAgent: req.get?.('user-agent')
  });
};

const AuditLog = mongoose.model('AuditLog', auditLogSchema);

export default AuditLog;
