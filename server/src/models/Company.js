import mongoose from 'mongoose';

const addressSchema = new mongoose.Schema({
  street: { type: String, default: '' },
  number: { type: String, default: '' },
  complement: { type: String, default: '' },
  neighborhood: { type: String, default: '' },
  city: { type: String, default: '' },
  state: { type: String, default: '' },
  zipCode: { type: String, default: '' }
}, { _id: false });

const responsibleSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true },
  phone: { type: String, required: true }
}, { _id: false });

const planSchema = new mongoose.Schema({
  type: { 
    type: String, 
    enum: ['basic', 'intermediate', 'premium'],
    default: 'basic'
  },
  monthlyValue: { type: Number, default: 0 },
  maxEmployees: { type: Number, default: 10 },
  activeEmployees: { type: Number, default: 0 },
  status: { 
    type: String, 
    enum: ['active', 'suspended', 'cancelled'],
    default: 'active'
  },
  startDate: { type: Date, default: Date.now },
  endDate: { type: Date }
}, { _id: false });

const dashboardSchema = new mongoose.Schema({
  totalKm: { type: Number, default: 0 },
  averageAdherence: { type: Number, default: 0 },
  totalHpoints: { type: Number, default: 0 },
  totalWorkouts: { type: Number, default: 0 }
}, { _id: false });

const companySchema = new mongoose.Schema({
  corporateName: { 
    type: String, 
    required: [true, 'Razão social é obrigatória'],
    trim: true
  },
  tradeName: { 
    type: String, 
    required: [true, 'Nome fantasia é obrigatório'],
    trim: true
  },
  cnpj: { 
    type: String, 
    required: [true, 'CNPJ é obrigatório'],
    unique: true,
    trim: true
  },
  address: { type: addressSchema, default: () => ({}) },
  responsible: { 
    type: responsibleSchema, 
    required: [true, 'Responsável é obrigatório']
  },
  plan: { type: planSchema, default: () => ({}) },
  employees: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  dashboard: { type: dashboardSchema, default: () => ({}) },
  asaasCustomerId: { type: String },
  active: { type: Boolean, default: true }
}, {
  timestamps: true
});

// Índices
// cnpj já tem índice único criado automaticamente pelo unique: true
companySchema.index({ 'plan.status': 1 });

// Método para adicionar colaborador
companySchema.methods.addEmployee = async function(userId) {
  if (!this.employees.includes(userId)) {
    this.employees.push(userId);
    this.plan.activeEmployees = this.employees.length;
    return this.save();
  }
  return this;
};

// Método para remover colaborador
companySchema.methods.removeEmployee = async function(userId) {
  this.employees = this.employees.filter(id => !id.equals(userId));
  this.plan.activeEmployees = this.employees.length;
  return this.save();
};

// Método para atualizar dashboard
companySchema.methods.updateDashboard = async function() {
  const User = mongoose.model('User');
  const Workout = mongoose.model('Workout');
  const HPoint = mongoose.model('HPoint');
  
  // Buscar dados dos colaboradores
  const employeeIds = this.employees;
  
  // Total de KM
  const kmResult = await Workout.aggregate([
    { $match: { userId: { $in: employeeIds } } },
    { $group: { _id: null, total: { $sum: '$distance' } } }
  ]);
  this.dashboard.totalKm = kmResult.length > 0 ? kmResult[0].total : 0;
  
  // Total de treinos
  const workoutsCount = await Workout.countDocuments({ 
    userId: { $in: employeeIds },
    'hpoints.status': 'approved'
  });
  this.dashboard.totalWorkouts = workoutsCount;
  
  // Total de HPoints
  const hpointsResult = await HPoint.aggregate([
    { $match: { userId: { $in: employeeIds }, expired: false, redeemed: false } },
    { $group: { _id: null, total: { $sum: '$points' } } }
  ]);
  this.dashboard.totalHpoints = hpointsResult.length > 0 ? hpointsResult[0].total : 0;
  
  // Adesão média
  const users = await User.find({ _id: { $in: employeeIds } });
  const adherences = users.map(u => u.currentTrainingPlan?.adherence || 0);
  this.dashboard.averageAdherence = adherences.length > 0 
    ? Math.round(adherences.reduce((a, b) => a + b, 0) / adherences.length)
    : 0;
  
  return this.save();
};

// Método estático para buscar empresas ativas
companySchema.statics.findActive = function() {
  return this.find({ active: true, 'plan.status': 'active' }).sort({ tradeName: 1 });
};

const Company = mongoose.model('Company', companySchema);

export default Company;
