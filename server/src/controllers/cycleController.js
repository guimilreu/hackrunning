import { Cycle, AuditLog } from '../models/index.js';

/**
 * Listar ciclos ativos
 */
export const list = async (req, res) => {
  try {
    const { objective, level, active } = req.query;

    const query = {};
    if (objective) query.objective = objective;
    if (level) query.level = level;
    if (active !== undefined) query.active = active === 'true';

    const cycles = await Cycle.find(query).sort({ objective: 1, level: 1 });

    res.json({
      success: true,
      data: { cycles }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Erro ao listar ciclos'
    });
  }
};

/**
 * Obter ciclo por ID
 */
export const getById = async (req, res) => {
  try {
    const cycle = await Cycle.findById(req.params.id);

    if (!cycle) {
      return res.status(404).json({
        success: false,
        message: 'Ciclo não encontrado'
      });
    }

    res.json({
      success: true,
      data: { cycle }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Erro ao obter ciclo'
    });
  }
};

/**
 * Criar novo ciclo (admin)
 */
export const create = async (req, res) => {
  try {
    const { name, objective, level, duration, workouts } = req.body;

    // Verificar se já existe ciclo com mesmo objetivo/nível
    const existing = await Cycle.findOne({ objective, level, active: true });
    if (existing) {
      return res.status(400).json({
        success: false,
        message: 'Já existe um ciclo ativo para este objetivo e nível'
      });
    }

    const cycle = new Cycle({
      name,
      objective,
      level,
      duration: duration || 4,
      workouts: workouts || [],
      active: true
    });

    await cycle.save();

    // Log de auditoria
    await AuditLog.logCreate('cycle', cycle._id, req.user._id, cycle.toObject(), req);

    res.status(201).json({
      success: true,
      message: 'Ciclo criado com sucesso',
      data: { cycle }
    });
  } catch (error) {
    console.error('Erro ao criar ciclo:', error);
    res.status(500).json({
      success: false,
      message: 'Erro ao criar ciclo'
    });
  }
};

/**
 * Atualizar ciclo (admin)
 */
export const update = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, duration, workouts, active } = req.body;

    const cycle = await Cycle.findById(id);
    if (!cycle) {
      return res.status(404).json({
        success: false,
        message: 'Ciclo não encontrado'
      });
    }

    const oldData = cycle.toObject();

    if (name !== undefined) cycle.name = name;
    if (duration !== undefined) cycle.duration = duration;
    if (workouts !== undefined) cycle.workouts = workouts;
    if (active !== undefined) cycle.active = active;

    await cycle.save();

    // Log de auditoria
    await AuditLog.logUpdate('cycle', id, req.user._id, oldData, cycle.toObject(), req);

    res.json({
      success: true,
      message: 'Ciclo atualizado',
      data: { cycle }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Erro ao atualizar ciclo'
    });
  }
};

/**
 * Deletar ciclo (admin)
 */
export const remove = async (req, res) => {
  try {
    const { id } = req.params;

    const cycle = await Cycle.findById(id);
    if (!cycle) {
      return res.status(404).json({
        success: false,
        message: 'Ciclo não encontrado'
      });
    }

    // Soft delete - apenas desativa
    cycle.active = false;
    await cycle.save();

    // Log de auditoria
    await AuditLog.logDelete('cycle', id, req.user._id, cycle.toObject(), req);

    res.json({
      success: true,
      message: 'Ciclo desativado'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Erro ao deletar ciclo'
    });
  }
};

/**
 * Duplicar ciclo (admin)
 */
export const duplicate = async (req, res) => {
  try {
    const { id } = req.params;
    const { newName, newObjective, newLevel } = req.body;

    const original = await Cycle.findById(id);
    if (!original) {
      return res.status(404).json({
        success: false,
        message: 'Ciclo não encontrado'
      });
    }

    const newCycle = new Cycle({
      name: newName || `${original.name} (cópia)`,
      objective: newObjective || original.objective,
      level: newLevel || original.level,
      duration: original.duration,
      workouts: original.workouts,
      active: false // Começa inativo
    });

    await newCycle.save();

    res.status(201).json({
      success: true,
      message: 'Ciclo duplicado',
      data: { cycle: newCycle }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Erro ao duplicar ciclo'
    });
  }
};

/**
 * Obter objetivos e níveis disponíveis
 */
export const getOptions = async (req, res) => {
  try {
    const cycles = await Cycle.findActive();

    const objectives = [...new Set(cycles.map(c => c.objective))].map(o => ({
      value: o,
      label: getObjectiveLabel(o),
      levels: cycles
        .filter(c => c.objective === o)
        .map(c => ({
          value: c.level,
          label: getLevelLabel(c.level),
          cycleId: c._id
        }))
    }));

    res.json({
      success: true,
      data: { objectives }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Erro ao obter opções'
    });
  }
};

// Helpers
function getObjectiveLabel(objective) {
  const labels = {
    '5k': '5 Quilômetros',
    '10k': '10 Quilômetros',
    'half_marathon': 'Meia Maratona (21km)',
    'marathon': 'Maratona (42km)',
    'general': 'Condicionamento Geral'
  };
  return labels[objective] || objective;
}

function getLevelLabel(level) {
  const labels = {
    'beginner': 'Iniciante',
    'intermediate': 'Intermediário',
    'advanced': 'Avançado'
  };
  return labels[level] || level;
}

export default {
  list,
  getById,
  create,
  update,
  remove,
  duplicate,
  getOptions
};
