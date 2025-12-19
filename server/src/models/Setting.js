import mongoose from 'mongoose';

const settingSchema = new mongoose.Schema({
  key: { 
    type: String, 
    required: [true, 'Key é obrigatória'],
    unique: true,
    trim: true
  },
  value: { 
    type: mongoose.Schema.Types.Mixed, 
    required: [true, 'Value é obrigatório']
  },
  description: { type: String, default: '' },
  category: { type: String, default: 'general' },
  updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
}, {
  timestamps: true
});

// Índices
// key já tem índice único criado automaticamente pelo unique: true
settingSchema.index({ category: 1 });

// Método estático para buscar por key
settingSchema.statics.get = async function(key, defaultValue = null) {
  const setting = await this.findOne({ key });
  return setting ? setting.value : defaultValue;
};

// Método estático para definir valor
settingSchema.statics.set = async function(key, value, userId = null, description = '') {
  return this.findOneAndUpdate(
    { key },
    { 
      value, 
      updatedBy: userId,
      ...(description && { description })
    },
    { upsert: true, new: true }
  );
};

// Método estático para buscar por categoria
settingSchema.statics.getByCategory = function(category) {
  return this.find({ category }).sort({ key: 1 });
};

// Método estático para buscar todas as configurações
settingSchema.statics.getAll = function() {
  return this.find().sort({ category: 1, key: 1 });
};

// Configurações padrão de HPoints
settingSchema.statics.getHPointsConfig = async function() {
  const defaults = {
    'hpoints.individual_workout': 10,
    'hpoints.together_workout': 15,
    'hpoints.race': 25,
    'hpoints.overall_podium': 50,
    'hpoints.category_podium': 30,
    'hpoints.challenge_completion': 100,
    'hpoints.referral': 50,
    'hpoints.photo_video_quality': 5,
    'hpoints.mediterraneum_cashback_percent': 10,
    'hpoints.expiration_months': 6
  };
  
  const config = {};
  for (const [key, defaultValue] of Object.entries(defaults)) {
    config[key] = await this.get(key, defaultValue);
  }
  
  return config;
};

// Configurações padrão de planos
settingSchema.statics.getPlansConfig = async function() {
  const defaults = {
    // Plano Gratuito
    'plans.free.price': 0,
    'plans.free.monthly_classes': 1,
    'plans.free.human_review': false,
    'plans.free.personalized_plan': false,
    
    // Plano Plus (R$ 150)
    'plans.plus.price': 150,
    'plans.plus.monthly_classes': 999,
    'plans.plus.human_review': false,
    'plans.plus.personalized_plan': true,
    
    // Plano Pro (R$ 220)
    'plans.pro.price': 220,
    'plans.pro.monthly_classes': 999,
    'plans.pro.human_review': true,
    'plans.pro.personalized_plan': true,
    'plans.pro.coach_support': true,
    
    // Kickstart Kit
    'plans.kickstart_price_free': 197,
    'plans.kickstart_price_plus': 147,
    'plans.kickstart_price_pro': 97
  };
  
  const config = {};
  for (const [key, defaultValue] of Object.entries(defaults)) {
    config[key] = await this.get(key, defaultValue);
  }
  
  return config;
};

// Inicializar configurações padrão
settingSchema.statics.initializeDefaults = async function() {
  const defaults = [
    // HPoints
    { key: 'hpoints.individual_workout', value: 10, category: 'hpoints', description: 'Pontos por treino individual' },
    { key: 'hpoints.together_workout', value: 15, category: 'hpoints', description: 'Pontos por treino Together' },
    { key: 'hpoints.race', value: 25, category: 'hpoints', description: 'Pontos por prova' },
    { key: 'hpoints.overall_podium', value: 50, category: 'hpoints', description: 'Pontos por pódio geral' },
    { key: 'hpoints.category_podium', value: 30, category: 'hpoints', description: 'Pontos por pódio de categoria' },
    { key: 'hpoints.challenge_completion', value: 100, category: 'hpoints', description: 'Pontos por completar desafio' },
    { key: 'hpoints.referral', value: 50, category: 'hpoints', description: 'Pontos por indicação' },
    { key: 'hpoints.photo_video_quality', value: 5, category: 'hpoints', description: 'Pontos por foto/vídeo de qualidade' },
    { key: 'hpoints.mediterraneum_cashback_percent', value: 10, category: 'hpoints', description: 'Percentual de cashback Mediterraneum' },
    { key: 'hpoints.expiration_months', value: 6, category: 'hpoints', description: 'Meses até expiração dos pontos' },
    
    // Planos - Preços
    { key: 'plans.free.price', value: 0, category: 'plans', description: 'Preço do plano Gratuito' },
    { key: 'plans.plus.price', value: 150, category: 'plans', description: 'Preço do plano Plus (mensal)' },
    { key: 'plans.pro.price', value: 220, category: 'plans', description: 'Preço do plano Pro (mensal)' },
    
    // Kickstart Kit - Preços por plano
    { key: 'plans.kickstart_price_free', value: 197, category: 'plans', description: 'Preço do Kickstart Kit (plano gratuito)' },
    { key: 'plans.kickstart_price_plus', value: 147, category: 'plans', description: 'Preço do Kickstart Kit (plano Plus)' },
    { key: 'plans.kickstart_price_pro', value: 97, category: 'plans', description: 'Preço do Kickstart Kit (plano Pro)' },
    
    // Geral
    { key: 'general.human_review_enabled', value: true, category: 'general', description: 'Revisão humana de planilhas ativa' },
    { key: 'general.strava_sync_enabled', value: true, category: 'general', description: 'Sincronização Strava ativa' }
  ];
  
  for (const setting of defaults) {
    await this.findOneAndUpdate(
      { key: setting.key },
      setting,
      { upsert: true }
    );
  }
};

const Setting = mongoose.model('Setting', settingSchema);

export default Setting;
