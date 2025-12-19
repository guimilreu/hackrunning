import { trainingPlanService } from '../services/trainingPlanService.js';
import { trainingPlanGeneratorService } from '../services/trainingPlanGeneratorService.js';
import { notificationService } from '../services/notificationService.js';
import { User } from '../models/index.js';

/**
 * Obter plano de treino atual
 */
export const getCurrent = async (req, res) => {
  try {
    const plan = await trainingPlanService.getCurrentPlan(req.user._id);

    if (!plan) {
      return res.status(404).json({
        success: false,
        message: 'Nenhum plano de treino ativo'
      });
    }

    res.json({
      success: true,
      data: { plan }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Erro ao obter plano de treino'
    });
  }
};

/**
 * Verificar dados faltantes para gerar treino
 */
export const checkMissingData = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'Usuário não encontrado'
      });
    }

    const missingFields = [];
    const currentData = {};

    // Verificar dados corporais obrigatórios
    if (!user.onboarding?.bodyMetrics?.altura_cm) missingFields.push('altura_cm');
    else currentData.altura_cm = user.onboarding.bodyMetrics.altura_cm;

    if (!user.onboarding?.bodyMetrics?.peso_kg) missingFields.push('peso_kg');
    else currentData.peso_kg = user.onboarding.bodyMetrics.peso_kg;

    if (!user.onboarding?.bodyMetrics?.cintura_cm) missingFields.push('cintura_cm');
    else currentData.cintura_cm = user.onboarding.bodyMetrics.cintura_cm;

    if (!user.onboarding?.bodyMetrics?.quadril_cm) missingFields.push('quadril_cm');
    else currentData.quadril_cm = user.onboarding.bodyMetrics.quadril_cm;

    // Verificar testes físicos obrigatórios
    if (!user.onboarding?.physicalTests?.teste6_distancia_m) missingFields.push('teste6_distancia_m');
    else currentData.teste6_distancia_m = user.onboarding.physicalTests.teste6_distancia_m;

    if (!user.onboarding?.physicalTests?.teste1km_tempo_segundos) missingFields.push('teste1km_tempo_segundos');
    else currentData.teste1km_tempo_segundos = user.onboarding.physicalTests.teste1km_tempo_segundos;

    // Verificar disponibilidade
    if (!user.onboarding?.availability?.trainingDays || !Array.isArray(user.onboarding.availability.trainingDays) || user.onboarding.availability.trainingDays.length < 2) {
      missingFields.push('trainingDays');
    } else {
      currentData.trainingDays = user.onboarding.availability.trainingDays;
    }

    if (!user.onboarding?.availability?.tempo_max_sessao_min) missingFields.push('tempo_max_sessao_min');
    else currentData.tempo_max_sessao_min = user.onboarding.availability.tempo_max_sessao_min;

    // Verificar objetivo principal
    if (!user.onboarding?.objetivo_principal) missingFields.push('objetivo_principal');
    else currentData.objetivo_principal = user.onboarding.objetivo_principal;

    // Campos opcionais (para preencher se disponível)
    if (user.onboarding?.physicalTests?.teste6_esforco_0_10) currentData.teste6_esforco_0_10 = user.onboarding.physicalTests.teste6_esforco_0_10;
    if (user.onboarding?.physicalTests?.teste1km_esforco_0_10) currentData.teste1km_esforco_0_10 = user.onboarding.physicalTests.teste1km_esforco_0_10;
    if (user.onboarding?.runningHistory) currentData.runningHistory = user.onboarding.runningHistory;
    if (user.onboarding?.pain) currentData.pain = user.onboarding.pain;
    if (user.onboarding?.lifestyle) currentData.lifestyle = user.onboarding.lifestyle;
    if (user.onboarding?.metabolicHealth) currentData.metabolicHealth = user.onboarding.metabolicHealth;

    res.json({
      success: true,
      data: {
        hasAllData: missingFields.length === 0,
        missingFields,
        currentData
      }
    });
  } catch (error) {
    console.error('Erro ao verificar dados faltantes:', error);
    res.status(500).json({
      success: false,
      message: 'Erro ao verificar dados faltantes'
    });
  }
};

/**
 * Gerar treino após completar dados faltantes
 */
export const generateFromMissingData = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'Usuário não encontrado'
      });
    }

    // Atualizar dados do usuário com os dados fornecidos
    const updateData = {};
    const { bodyMetrics, physicalTests, availability, objetivo_principal, runningHistory, pain, lifestyle, metabolicHealth } = req.body;

    if (bodyMetrics) {
      const alturaNum = safeParseInt(bodyMetrics.altura_cm);
      if (alturaNum !== undefined) updateData['onboarding.bodyMetrics.altura_cm'] = alturaNum;
      
      const pesoNum = safeParseFloat(bodyMetrics.peso_kg);
      if (pesoNum !== undefined) updateData['onboarding.bodyMetrics.peso_kg'] = pesoNum;
      
      const cinturaNum = safeParseFloat(bodyMetrics.cintura_cm);
      if (cinturaNum !== undefined) updateData['onboarding.bodyMetrics.cintura_cm'] = cinturaNum;
      
      const quadrilNum = safeParseFloat(bodyMetrics.quadril_cm);
      if (quadrilNum !== undefined) updateData['onboarding.bodyMetrics.quadril_cm'] = quadrilNum;
    }

    if (physicalTests) {
      const teste6DistanciaNum = safeParseFloat(physicalTests.teste6_distancia_m);
      if (teste6DistanciaNum !== undefined) updateData['onboarding.physicalTests.teste6_distancia_m'] = teste6DistanciaNum;
      
      if (physicalTests.teste1km_tempo_segundos) {
        // Converter formato "min:seg" para segundos se necessário
        if (typeof physicalTests.teste1km_tempo_segundos === 'string' && physicalTests.teste1km_tempo_segundos.includes(':')) {
          const parts = physicalTests.teste1km_tempo_segundos.split(':');
          const min = safeParseInt(parts[0]);
          const sec = safeParseInt(parts[1]);
          if (min !== undefined && sec !== undefined) {
            updateData['onboarding.physicalTests.teste1km_tempo_segundos'] = min * 60 + sec;
          }
        } else {
          const tempoNum = safeParseInt(physicalTests.teste1km_tempo_segundos);
          if (tempoNum !== undefined) {
            updateData['onboarding.physicalTests.teste1km_tempo_segundos'] = tempoNum;
          }
        }
      }
      
      const teste6EsforcoNum = safeParseInt(physicalTests.teste6_esforco_0_10);
      if (teste6EsforcoNum !== undefined) updateData['onboarding.physicalTests.teste6_esforco_0_10'] = teste6EsforcoNum;
      
      const teste1kmEsforcoNum = safeParseInt(physicalTests.teste1km_esforco_0_10);
      if (teste1kmEsforcoNum !== undefined) updateData['onboarding.physicalTests.teste1km_esforco_0_10'] = teste1kmEsforcoNum;
    }

    if (availability) {
      // Suporte para trainingDays (array de dias da semana)
      if (availability.trainingDays && Array.isArray(availability.trainingDays)) {
        updateData['onboarding.availability.trainingDays'] = availability.trainingDays;
        // Calcular dias_treino_semana baseado no array de dias
        updateData['onboarding.availability.dias_treino_semana'] = availability.trainingDays.length;
      }
      
      const tempoMaxNum = safeParseInt(availability.tempo_max_sessao_min);
      if (tempoMaxNum !== undefined) updateData['onboarding.availability.tempo_max_sessao_min'] = tempoMaxNum;
    }

    if (objetivo_principal) {
      updateData['onboarding.objetivo_principal'] = objetivo_principal;
    }

    if (runningHistory) {
      Object.keys(runningHistory).forEach(key => {
        if (runningHistory[key] !== undefined) {
          // Converter valores numéricos de forma segura
          const value = runningHistory[key];
          if (key === 'tempo_experiencia_meses' || key === 'dias_corrida_semana') {
            const numValue = safeParseInt(value);
            if (numValue !== undefined) {
              updateData[`onboarding.runningHistory.${key}`] = numValue;
            }
          } else if (key === 'maior_distancia_recente_km') {
            const numValue = safeParseFloat(value);
            if (numValue !== undefined) {
              updateData[`onboarding.runningHistory.${key}`] = numValue;
            }
          } else {
            updateData[`onboarding.runningHistory.${key}`] = value;
          }
        }
      });
    }

    if (pain) {
      Object.keys(pain).forEach(key => {
        if (pain[key] !== undefined) {
          // Converter valores numéricos de forma segura
          const value = pain[key];
          if (key === 'dor_intensidade_0_10') {
            const numValue = safeParseInt(value);
            if (numValue !== undefined) {
              updateData[`onboarding.pain.${key}`] = numValue;
            }
          } else {
            updateData[`onboarding.pain.${key}`] = value;
          }
        }
      });
    }

    if (lifestyle) {
      Object.keys(lifestyle).forEach(key => {
        if (lifestyle[key] !== undefined) {
          updateData[`onboarding.lifestyle.${key}`] = lifestyle[key];
        }
      });
    }

    if (metabolicHealth) {
      Object.keys(metabolicHealth).forEach(key => {
        if (metabolicHealth[key] !== undefined) {
          updateData[`onboarding.metabolicHealth.${key}`] = metabolicHealth[key];
        }
      });
    }

    // Atualizar usuário
    await User.findByIdAndUpdate(req.user._id, { $set: updateData }, { new: true });

    // Gerar planilha para 12 semanas
    const trainingPlan = await trainingPlanGeneratorService.generateCompleteTrainingPlan(req.user._id, {
      cycleDuration: 12
    });

    // Notificar usuário
    await notificationService.notifyTrainingPlanReady(req.user._id, trainingPlan.objective);

    res.json({
      success: true,
      message: 'Planilha gerada com sucesso!',
      data: { plan: trainingPlan }
    });
  } catch (error) {
    console.error('Erro ao gerar treino:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Erro ao gerar planilha de treino'
    });
  }
};

/**
 * Obter próximo treino
 */
export const getNextWorkout = async (req, res) => {
  try {
    const nextWorkout = await trainingPlanService.getNextWorkout(req.user._id);

    if (!nextWorkout) {
      return res.status(404).json({
        success: false,
        message: 'Nenhum treino próximo encontrado'
      });
    }

    res.json({
      success: true,
      data: nextWorkout
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Erro ao obter próximo treino'
    });
  }
};

/**
 * Obter treinos da semana
 */
export const getWeekWorkouts = async (req, res) => {
  try {
    const { week } = req.query;
    const weekNumber = week ? parseInt(week) : null;
    
    const workouts = await trainingPlanService.getWeekWorkouts(req.user._id, weekNumber);

    res.json({
      success: true,
      data: { workouts }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Erro ao obter treinos da semana'
    });
  }
};

/**
 * Gerar novo plano
 */
export const generate = async (req, res) => {
  try {
    const { cycleDuration, startDate } = req.body;
    
    const trainingPlan = await trainingPlanGeneratorService.generateCompleteTrainingPlan(req.user._id, {
      cycleDuration: cycleDuration || 4,
      startDate
    });

    // Notificar usuário
    await notificationService.notifyTrainingPlanReady(req.user._id, trainingPlan.objective);

    res.json({
      success: true,
      message: 'Plano gerado com sucesso!',
      data: { plan: trainingPlan }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message || 'Erro ao gerar plano de treino'
    });
  }
};

/**
 * Verificar necessidade de ajuste
 */
export const checkAdjustment = async (req, res) => {
  try {
    const result = await trainingPlanService.checkSmartAdjustment(req.user._id);

    res.json({
      success: true,
      data: result
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Erro ao verificar ajuste'
    });
  }
};

/**
 * Aplicar ajuste ao plano
 */
export const applyAdjustment = async (req, res) => {
  try {
    const { planId, adjustmentType } = req.body;

    if (!planId || !adjustmentType) {
      return res.status(400).json({
        success: false,
        message: 'planId e adjustmentType são obrigatórios'
      });
    }

    const plan = await trainingPlanService.applyAdjustment(req.user._id, planId, adjustmentType);

    res.json({
      success: true,
      message: 'Ajuste aplicado com sucesso!',
      data: { plan }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message || 'Erro ao aplicar ajuste'
    });
  }
};

/**
 * Obter histórico de planos
 */
export const getHistory = async (req, res) => {
  try {
    const { limit } = req.query;
    const plans = await trainingPlanService.getPlanHistory(req.user._id, limit ? parseInt(limit) : 10);

    res.json({
      success: true,
      data: { plans }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Erro ao obter histórico'
    });
  }
};

/**
 * Obter estatísticas do plano
 */
export const getStats = async (req, res) => {
  try {
    const { planId } = req.params;
    const stats = await trainingPlanService.getPlanStats(req.user._id, planId);

    if (!stats) {
      return res.status(404).json({
        success: false,
        message: 'Plano não encontrado'
      });
    }

    res.json({
      success: true,
      data: { stats }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Erro ao obter estatísticas'
    });
  }
};

/**
 * Cancelar plano
 */
export const cancel = async (req, res) => {
  try {
    const { planId } = req.params;
    const plan = await trainingPlanService.cancelPlan(req.user._id, planId);

    res.json({
      success: true,
      message: 'Plano cancelado com sucesso!',
      data: { plan }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message || 'Erro ao cancelar plano'
    });
  }
};

/**
 * Listar planos pendentes de revisão (Admin)
 */
export const listPendingReview = async (req, res) => {
  try {
    const { TrainingPlan } = await import('../models/index.js');
    
    const plans = await TrainingPlan.find({
      'humanReview.enabled': true,
      'humanReview.approved': null
    })
      .populate('userId', 'name email')
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      data: { plans }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Erro ao listar planos pendentes'
    });
  }
};

/**
 * Obter plano por ID (Admin)
 */
export const getById = async (req, res) => {
  try {
    const { id } = req.params;
    const { TrainingPlan } = await import('../models/index.js');
    
    const plan = await TrainingPlan.findById(id)
      .populate('userId', 'name email');

    if (!plan) {
      return res.status(404).json({
        success: false,
        message: 'Plano não encontrado'
      });
    }

    res.json({
      success: true,
      data: { plan }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Erro ao obter plano'
    });
  }
};

/**
 * Revisar plano (Admin)
 */
export const review = async (req, res) => {
  try {
    const { id } = req.params;
    const { approved, notes } = req.body;

    const plan = await trainingPlanService.reviewPlan(id, {
      approved,
      notes
    }, req.user._id);

    res.json({
      success: true,
      message: approved ? 'Plano aprovado!' : 'Plano rejeitado',
      data: { plan }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message || 'Erro ao revisar plano'
    });
  }
};

/**
 * Converte valor para inteiro de forma segura
 * Retorna undefined se o valor não puder ser convertido
 */
function safeParseInt(value) {
  if (value === undefined || value === null || value === '') {
    return undefined;
  }
  const parsed = parseInt(value, 10);
  return isNaN(parsed) ? undefined : parsed;
}

/**
 * Converte valor para float de forma segura
 * Retorna undefined se o valor não puder ser convertido
 */
function safeParseFloat(value) {
  if (value === undefined || value === null || value === '') {
    return undefined;
  }
  const parsed = parseFloat(value);
  return isNaN(parsed) ? undefined : parsed;
}

export default {
  getCurrent,
  checkMissingData,
  generateFromMissingData,
  getNextWorkout,
  getWeekWorkouts,
  generate,
  checkAdjustment,
  applyAdjustment,
  getHistory,
  getStats,
  cancel,
  listPendingReview,
  getById,
  review
};
