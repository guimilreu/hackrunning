import { Company, User, Workout, AuditLog } from '../models/index.js';
import { hpointService } from '../services/hpointService.js';

/**
 * Obter dashboard da empresa (gestor)
 */
export const getDashboard = async (req, res) => {
  try {
    const { companyId } = req.params;

    const company = await Company.findById(companyId)
      .populate('employees.user', 'firstName lastName email hpointsBalance');

    if (!company) {
      return res.status(404).json({
        success: false,
        message: 'Empresa não encontrada'
      });
    }

    // Verificar acesso
    const isResponsible = company.responsible.email === req.user.email;
    const isAdmin = ['admin', 'super_admin'].includes(req.user.role);
    
    if (!isResponsible && !isAdmin) {
      return res.status(403).json({
        success: false,
        message: 'Acesso negado'
      });
    }

    // Atualizar métricas
    await company.updateDashboard();

    // Buscar estatísticas detalhadas
    const activeEmployees = company.employees.filter(e => e.active);
    const employeeIds = activeEmployees.map(e => e.user._id || e.user);

    // Treinos do mês
    const startOfMonth = new Date();
    startOfMonth.setDate(1);
    startOfMonth.setHours(0, 0, 0, 0);

    const monthWorkouts = await Workout.find({
      user: { $in: employeeIds },
      date: { $gte: startOfMonth }
    });

    const stats = {
      totalEmployees: activeEmployees.length,
      monthWorkouts: monthWorkouts.length,
      monthDistance: monthWorkouts.reduce((sum, w) => sum + (w.distance || 0), 0),
      avgWorkoutsPerEmployee: activeEmployees.length > 0 
        ? (monthWorkouts.length / activeEmployees.length).toFixed(1) 
        : 0
    };

    res.json({
      success: true,
      data: {
        company: {
          id: company._id,
          name: company.name,
          cnpj: company.cnpj,
          plan: company.plan
        },
        employees: activeEmployees.map(e => ({
          ...e.toObject(),
          user: e.user
        })),
        dashboard: company.dashboard,
        stats
      }
    });
  } catch (error) {
    console.error('Erro ao obter dashboard:', error);
    res.status(500).json({
      success: false,
      message: 'Erro ao obter dashboard'
    });
  }
};

/**
 * Listar funcionários
 */
export const getEmployees = async (req, res) => {
  try {
    const { companyId } = req.params;
    const { active, page = 1, limit = 50 } = req.query;

    const company = await Company.findById(companyId)
      .populate('employees.user', 'firstName lastName email hpointsBalance profilePhoto');

    if (!company) {
      return res.status(404).json({
        success: false,
        message: 'Empresa não encontrada'
      });
    }

    let employees = company.employees;
    if (active !== undefined) {
      employees = employees.filter(e => e.active === (active === 'true'));
    }

    // Paginação manual
    const total = employees.length;
    const start = (page - 1) * limit;
    const paginatedEmployees = employees.slice(start, start + parseInt(limit));

    res.json({
      success: true,
      data: {
        employees: paginatedEmployees,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          pages: Math.ceil(total / limit)
        }
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Erro ao listar funcionários'
    });
  }
};

/**
 * Adicionar funcionário
 */
export const addEmployee = async (req, res) => {
  try {
    const { companyId } = req.params;
    const { userId, department, position } = req.body;

    const company = await Company.findById(companyId);
    if (!company) {
      return res.status(404).json({
        success: false,
        message: 'Empresa não encontrada'
      });
    }

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'Usuário não encontrado'
      });
    }

    // Verificar limite do plano
    const activeEmployees = company.employees.filter(e => e.active).length;
    if (company.plan.maxEmployees && activeEmployees >= company.plan.maxEmployees) {
      return res.status(400).json({
        success: false,
        message: 'Limite de funcionários atingido'
      });
    }

    await company.addEmployee(userId, { department, position });

    // Atualizar plano do usuário
    user.plan = {
      type: 'corporate',
      status: 'active',
      company: companyId
    };
    await user.save();

    res.json({
      success: true,
      message: 'Funcionário adicionado',
      data: { employeesCount: company.employees.filter(e => e.active).length }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message || 'Erro ao adicionar funcionário'
    });
  }
};

/**
 * Remover funcionário
 */
export const removeEmployee = async (req, res) => {
  try {
    const { companyId, userId } = req.params;

    const company = await Company.findById(companyId);
    if (!company) {
      return res.status(404).json({
        success: false,
        message: 'Empresa não encontrada'
      });
    }

    await company.removeEmployee(userId);

    // Atualizar plano do usuário para free
    await User.findByIdAndUpdate(userId, {
      plan: { type: 'free', status: 'active' }
    });

    res.json({
      success: true,
      message: 'Funcionário removido'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Erro ao remover funcionário'
    });
  }
};

/**
 * Obter relatório de atividades
 */
export const getActivityReport = async (req, res) => {
  try {
    const { companyId } = req.params;
    const { startDate, endDate, groupBy = 'employee' } = req.query;

    const company = await Company.findById(companyId);
    if (!company) {
      return res.status(404).json({
        success: false,
        message: 'Empresa não encontrada'
      });
    }

    const employeeIds = company.employees
      .filter(e => e.active)
      .map(e => e.user);

    const dateFilter = {};
    if (startDate) dateFilter.$gte = new Date(startDate);
    if (endDate) dateFilter.$lte = new Date(endDate);

    const matchStage = { user: { $in: employeeIds } };
    if (Object.keys(dateFilter).length > 0) {
      matchStage.date = dateFilter;
    }

    let groupStage;
    if (groupBy === 'employee') {
      groupStage = {
        _id: '$user',
        workouts: { $sum: 1 },
        totalDistance: { $sum: '$distance' },
        totalTime: { $sum: '$time' }
      };
    } else if (groupBy === 'week') {
      groupStage = {
        _id: { $week: '$date' },
        workouts: { $sum: 1 },
        totalDistance: { $sum: '$distance' },
        activeUsers: { $addToSet: '$user' }
      };
    } else {
      groupStage = {
        _id: { $dateToString: { format: '%Y-%m-%d', date: '$date' } },
        workouts: { $sum: 1 },
        totalDistance: { $sum: '$distance' },
        activeUsers: { $addToSet: '$user' }
      };
    }

    const report = await Workout.aggregate([
      { $match: matchStage },
      { $group: groupStage },
      { $sort: { _id: 1 } }
    ]);

    // Popular nomes se agrupado por employee
    if (groupBy === 'employee' && report.length > 0) {
      const userIds = report.map(r => r._id);
      const users = await User.find({ _id: { $in: userIds } })
        .select('firstName lastName');
      
      const userMap = {};
      users.forEach(u => {
        userMap[u._id.toString()] = `${u.firstName} ${u.lastName}`;
      });

      report.forEach(r => {
        r.employeeName = userMap[r._id.toString()] || 'Desconhecido';
      });
    }

    res.json({
      success: true,
      data: { report, groupBy }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Erro ao gerar relatório'
    });
  }
};

// ========== ADMIN ==========

/**
 * Listar todas as empresas (admin)
 */
export const list = async (req, res) => {
  try {
    const { page = 1, limit = 20, search, active } = req.query;

    const query = {};
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { cnpj: { $regex: search, $options: 'i' } }
      ];
    }
    if (active !== undefined) query.active = active === 'true';

    const [companies, total] = await Promise.all([
      Company.find(query)
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(parseInt(limit)),
      Company.countDocuments(query)
    ]);

    res.json({
      success: true,
      data: {
        companies,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          pages: Math.ceil(total / limit)
        }
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Erro ao listar empresas'
    });
  }
};

/**
 * Criar empresa (admin)
 */
export const create = async (req, res) => {
  try {
    const {
      name,
      cnpj,
      address,
      responsible,
      plan
    } = req.body;

    // Verificar CNPJ único
    const existing = await Company.findOne({ cnpj });
    if (existing) {
      return res.status(400).json({
        success: false,
        message: 'CNPJ já cadastrado'
      });
    }

    const company = new Company({
      name,
      cnpj,
      address,
      responsible,
      plan: {
        type: plan?.type || 'basic',
        maxEmployees: plan?.maxEmployees || 50,
        startDate: new Date(),
        status: 'active'
      },
      active: true
    });

    await company.save();

    // Log de auditoria
    await AuditLog.logCreate(req.user._id, 'company', company._id, company.toObject(), req);

    res.status(201).json({
      success: true,
      message: 'Empresa criada com sucesso',
      data: { company }
    });
  } catch (error) {
    console.error('Erro ao criar empresa:', error);
    res.status(500).json({
      success: false,
      message: 'Erro ao criar empresa'
    });
  }
};

/**
 * Atualizar empresa (admin)
 */
export const update = async (req, res) => {
  try {
    const { id } = req.params;

    const company = await Company.findById(id);
    if (!company) {
      return res.status(404).json({
        success: false,
        message: 'Empresa não encontrada'
      });
    }

    const oldData = company.toObject();
    const allowedFields = ['name', 'address', 'responsible', 'plan', 'active'];

    allowedFields.forEach(field => {
      if (req.body[field] !== undefined) {
        company[field] = req.body[field];
      }
    });

    await company.save();

    // Log de auditoria
    await AuditLog.logUpdate(req.user._id, 'company', id, oldData, company.toObject(), req);

    res.json({
      success: true,
      message: 'Empresa atualizada',
      data: { company }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Erro ao atualizar empresa'
    });
  }
};

/**
 * Obter empresa por ID (admin)
 */
export const getById = async (req, res) => {
  try {
    const company = await Company.findById(req.params.id)
      .populate('employees.user', 'firstName lastName email');

    if (!company) {
      return res.status(404).json({
        success: false,
        message: 'Empresa não encontrada'
      });
    }

    res.json({
      success: true,
      data: { company }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Erro ao obter empresa'
    });
  }
};

/**
 * Desativar empresa (admin)
 */
export const deactivate = async (req, res) => {
  try {
    const { id } = req.params;

    const company = await Company.findById(id);
    if (!company) {
      return res.status(404).json({
        success: false,
        message: 'Empresa não encontrada'
      });
    }

    company.active = false;
    company.plan.status = 'cancelled';
    await company.save();

    // Atualizar plano de todos os funcionários
    const employeeIds = company.employees.map(e => e.user);
    await User.updateMany(
      { _id: { $in: employeeIds } },
      { plan: { type: 'free', status: 'active' } }
    );

    // Log de auditoria
    await AuditLog.logDelete(req.user._id, 'company', id, company.toObject(), req);

    res.json({
      success: true,
      message: 'Empresa desativada'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Erro ao desativar empresa'
    });
  }
};

export default {
  getDashboard,
  getEmployees,
  addEmployee,
  removeEmployee,
  getActivityReport,
  list,
  create,
  update,
  getById,
  deactivate
};
