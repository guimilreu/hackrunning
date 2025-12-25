import mongoose from 'mongoose';
import bcrypt from 'bcrypt';

const addressSchema = new mongoose.Schema({
  street: { type: String, default: '' },
  number: { type: String, default: '' },
  complement: { type: String, default: '' },
  neighborhood: { type: String, default: '' },
  city: { type: String, default: '' },
  state: { type: String, default: '' },
  zipCode: { type: String, default: '' }
}, { _id: false });

const planSchema = new mongoose.Schema({
  type: { 
    type: String, 
    enum: ['free', 'plus', 'pro', 'corporate'],
    default: 'free'
  },
  status: { 
    type: String, 
    enum: ['active', 'inactive', 'suspended', 'cancelled', 'pending'],
    default: 'active'
  },
  startDate: { type: Date },
  endDate: { type: Date },
  nextBillingDate: { type: Date },
  asaasSubscriptionId: { type: String },
  autoRenew: { type: Boolean, default: true },
  cancelledAt: { type: Date },
  cancelReason: { type: String }
}, { _id: false });

// Schema para dados corporais
const bodyMetricsSchema = new mongoose.Schema({
  altura_cm: { type: Number },
  peso_kg: { type: Number },
  cintura_cm: { type: Number },
  quadril_cm: { type: Number },
  foto_url: { type: String, default: '' },
  imc: { type: Number }, // Calculado
  rcq: { type: Number } // Calculado (cintura/quadril)
}, { _id: false });

// Schema para estilo de vida
const lifestyleSchema = new mongoose.Schema({
  alimentacao_status: {
    type: String,
    enum: ['nao_ajuda_emagrecimento', 'sabe_mas_nao_segue', 'relativamente_saudavel', 'estruturada_emagrecimento', 'ja_emagreceu_e_reganhou']
  },
  acucar_frequencia: {
    type: String,
    enum: ['diario', '2_3x_semana', 'raro']
  },
  alcool_frequencia: {
    type: String,
    enum: ['nenhum', '1_2x_semana', '3x_ou_mais']
  }
}, { _id: false });

// Schema para saúde metabólica
const metabolicHealthSchema = new mongoose.Schema({
  hipertensao: { type: Boolean, default: false },
  diabetes_tipo2: { type: Boolean, default: false },
  pre_diabetes: { type: Boolean, default: false },
  colesterol_alto: { type: Boolean, default: false },
  resistencia_insulina: { type: Boolean, default: false },
  historico_familiar_diabetes: { type: Boolean, default: false },
  historico_familiar_cardio: { type: Boolean, default: false }
}, { _id: false });

// Schema para dores
const painSchema = new mongoose.Schema({
  dor_atual: { type: Boolean, default: false },
  local_dor: [{ 
    type: String, 
    enum: ['joelho', 'quadril', 'tornozelo', 'canela', 'lombar', 'pe'] 
  }],
  dor_intensidade_0_10: { type: Number, min: 0, max: 10 },
  dor_piora_corrida: { type: Boolean, default: false },
  dor_impede_corrida: { type: Boolean, default: false }
}, { _id: false });

// Schema para histórico de corrida
const runningHistorySchema = new mongoose.Schema({
  corre_atualmente: { type: Boolean, default: false },
  tempo_experiencia_meses: { type: Number, default: 0 },
  dias_corrida_semana: { type: Number, default: 0 },
  maior_distancia_recente_km: { type: Number, default: 0 }
}, { _id: false });

// Schema para testes físicos
const physicalTestsSchema = new mongoose.Schema({
  teste6_distancia_m: { type: Number },
  teste6_esforco_0_10: { type: Number, min: 0, max: 10 },
  teste1km_tempo_segundos: { type: Number },
  teste1km_esforco_0_10: { type: Number, min: 0, max: 10 }
}, { _id: false });

// Schema para disponibilidade
const availabilitySchema = new mongoose.Schema({
  dias_treino_semana: { type: Number, min: 2, max: 6 },
  tempo_max_sessao_min: { 
    type: Number, 
    enum: [30, 45, 60, 90] 
  },
  trainingDays: { 
    type: [Number], 
    validate: {
      validator: function(arr) {
        return arr.every(day => day >= 0 && day <= 6);
      },
      message: 'Dias da semana devem ser números entre 0 (Domingo) e 6 (Sábado)'
    }
  }
}, { _id: false });

// Schema para risco metabólico calculado
const metabolicRiskSchema = new mongoose.Schema({
  excesso_cintura_cm: { type: Number },
  diabetes_risco: { type: Number },
  neurologico_risco: { type: Number },
  cancer_risco: { type: Number },
  cardiovascular_risco: { type: Number },
  igre: { type: Number }, // Índice Global de Risco Evitável
  classificacao_risco: {
    type: String,
    enum: ['baixo', 'moderado', 'alto']
  }
}, { _id: false });

// Schema para classificação do aluno
const classificationSchema = new mongoose.Schema({
  nivel_experiencia: {
    type: String,
    enum: ['iniciante', 'intermediario']
  },
  nivel_final: {
    type: String,
    enum: ['iniciante_baixo_risco', 'iniciante_risco_moderado', 'iniciante_alto_risco', 
           'intermediario_baixo_risco', 'intermediario_risco_moderado', 'intermediario_alto_risco']
  },
  pode_intensidade: { type: Boolean, default: true },
  pode_longao: { type: Boolean, default: true },
  reduzir_progressao: { type: Boolean, default: false }
}, { _id: false });

const onboardingSchema = new mongoose.Schema({
  completed: { type: Boolean, default: false },
  currentStep: { type: Number, default: 1 },
  completedSteps: { type: [Number], default: [] },
  completedAt: { type: Date },
  runningTime: { type: String, default: '' },
  monthlyKm: { type: Number, default: 0 },
  hasWatch: { type: Boolean, default: false },
  usesStrava: { type: Boolean, default: false },
  stravaLink: { type: String, default: '' },
  objectives: [{ 
    type: String, 
    enum: ['health', 'weight_loss', 'performance', 'race_preparation', 'discipline'] 
  }],
  objetivo_principal: {
    type: String,
    enum: ['emagrecimento', 'saude_longevidade', 'iniciar_corrida', 'completar_5km', 'melhorar_condicionamento', 'performance']
  },
  goals: {
    currentWeight: { type: Number },
    targetWeight: { type: Number },
    current5KTime: { type: Number },
    target5KTime: { type: Number },
    currentPace: { type: Number },
    targetPace: { type: Number },
    weeklyFrequency: { type: Number },
    desiredMonthlyKm: { type: Number }
  },
  // Novos campos da anamnese completa
  bodyMetrics: { type: bodyMetricsSchema, default: () => ({}) },
  lifestyle: { type: lifestyleSchema, default: () => ({}) },
  metabolicHealth: { type: metabolicHealthSchema, default: () => ({}) },
  pain: { type: painSchema, default: () => ({}) },
  runningHistory: { type: runningHistorySchema, default: () => ({}) },
  physicalTests: { type: physicalTestsSchema, default: () => ({}) },
  availability: { type: availabilitySchema, default: () => ({}) },
  metabolicRisk: { type: metabolicRiskSchema, default: () => ({}) },
  classification: { type: classificationSchema, default: () => ({}) }
}, { _id: false });

const currentTrainingPlanSchema = new mongoose.Schema({
  cycleId: { type: mongoose.Schema.Types.ObjectId, ref: 'Cycle' },
  adherence: { type: Number, default: 0 },
  startDate: { type: Date },
  endDate: { type: Date },
  completedWorkouts: { type: Number, default: 0 },
  totalWorkouts: { type: Number, default: 0 }
}, { _id: false });

const kickstartKitSchema = new mongoose.Schema({
  purchased: { type: Boolean, default: false },
  orderId: { type: mongoose.Schema.Types.ObjectId, ref: 'Order' },
  deliveryStatus: { 
    type: String, 
    enum: ['pending', 'preparing', 'shipped', 'delivered'],
    default: 'pending'
  },
  trackingCode: { type: String, default: '' },
  // Status de pagamento pendente (para PIX/Boleto)
  paymentPending: { type: Boolean, default: false },
  pendingOrderId: { type: mongoose.Schema.Types.ObjectId, ref: 'Order' }
}, { _id: false });

const stravaIntegrationSchema = new mongoose.Schema({
  connected: { type: Boolean, default: false },
  accessToken: { type: String, default: '' },
  refreshToken: { type: String, default: '' },
  athleteId: { type: String, default: '' },
  lastSync: { type: Date }
}, { _id: false });

const userSchema = new mongoose.Schema({
  name: { 
    type: String, 
    required: [true, 'Nome é obrigatório'],
    trim: true
  },
  email: { 
    type: String, 
    required: [true, 'Email é obrigatório'],
    unique: true,
    lowercase: true,
    trim: true,
    match: [/^\S+@\S+\.\S+$/, 'Email inválido']
  },
  photo: { type: String, default: '' },
  phone: { 
    type: String, 
    required: [true, 'Telefone é obrigatório'],
    trim: true
  },
  cpf: { 
    type: String, 
    required: false, // Não obrigatório no cadastro inicial
    unique: true,
    sparse: true, // Permite múltiplos documentos sem CPF
    trim: true
  },
  birthDate: { 
    type: Date
  },
  gender: { 
    type: String, 
    enum: ['M', 'F', 'Other']
  },
  address: addressSchema,
  shirtSize: { 
    type: String, 
    enum: ['PP', 'P', 'M', 'G', 'GG', 'XG']
  },
  password: { 
    type: String, 
    required: [true, 'Senha é obrigatória'],
    minlength: [6, 'Senha deve ter no mínimo 6 caracteres'],
    select: false
  },
  role: { 
    type: String, 
    enum: ['member', 'operational_admin', 'content_admin', 'company_admin', 'media_moderator', 'coach', 'super_admin'],
    default: 'member'
  },
  plan: { type: planSchema, default: () => ({}) },
  companyId: { type: mongoose.Schema.Types.ObjectId, ref: 'Company' },
  onboarding: { type: onboardingSchema, default: () => ({}) },
  currentTrainingPlan: { type: currentTrainingPlanSchema, default: () => ({}) },
  hpoints: {
    balance: { type: Number, default: 0 },
    totalEarned: { type: Number, default: 0 },
    totalRedeemed: { type: Number, default: 0 }
  },
  kickstartKit: { type: kickstartKitSchema, default: () => ({}) },
  integrations: {
    strava: { type: stravaIntegrationSchema, default: () => ({}) }
  },
  asaasCustomerId: { type: String },
  active: { type: Boolean, default: true },
  emailVerified: { type: Boolean, default: false },
  emailVerificationToken: { type: String },
  passwordResetToken: { type: String },
  passwordResetExpires: { type: Date },
  lastAccess: { type: Date },
  consent: {
    accepted: { type: Boolean, default: false },
    acceptedAt: { type: Date },
    version: { type: String }
  }
}, {
  timestamps: true
});

// Índices
// email e cpf já têm índices únicos criados automaticamente pelo unique: true
userSchema.index({ 'plan.status': 1 });
userSchema.index({ companyId: 1 });
userSchema.index({ active: 1 });

// Campos virtuais para compatibilidade com código que usa firstName/lastName
userSchema.virtual('firstName').get(function() {
  return this.name?.split(' ')[0] || '';
});

userSchema.virtual('lastName').get(function() {
  const parts = this.name?.split(' ');
  return parts?.slice(1).join(' ') || '';
});

// Campo virtual para compatibilidade com código que usa city diretamente
userSchema.virtual('city').get(function() {
  return this.address?.city || '';
});

// Garantir que campos virtuais sejam incluídos na serialização JSON
userSchema.set('toJSON', { virtuals: true });
userSchema.set('toObject', { virtuals: true });

// Hash de senha antes de salvar
userSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();
  
  try {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error);
  }
});

// Método para comparar senhas
userSchema.methods.comparePassword = async function(candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password);
};

// Método para atualizar saldo de HPoints
userSchema.methods.updateHPointsBalance = async function(points, type = 'add') {
  if (type === 'add') {
    this.hpoints.balance += points;
    this.hpoints.totalEarned += points;
  } else if (type === 'subtract') {
    this.hpoints.balance -= points;
    this.hpoints.totalRedeemed += points;
  }
  return this.save();
};

// Método para calcular adesão
userSchema.methods.calculateAdherence = function() {
  const { completedWorkouts, totalWorkouts } = this.currentTrainingPlan;
  if (!totalWorkouts || totalWorkouts === 0) return 0;
  return Math.round((completedWorkouts / totalWorkouts) * 100);
};

// Método para retornar dados seguros (sem senha)
userSchema.methods.toSafeObject = function() {
  const obj = this.toObject();
  delete obj.password;
  delete obj.passwordResetToken;
  delete obj.passwordResetExpires;
  delete obj.emailVerificationToken;
  return obj;
};

const User = mongoose.model('User', userSchema);

export default User;
