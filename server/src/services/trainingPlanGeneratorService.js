/**
 * Serviço completo de geração de planilhas de treino
 * Versão 2.0 - Com periodização inteligente
 * 
 * Implementa:
 * - Periodização por blocos (Base, Build, Peak)
 * - Variação de treinos para evitar monotonia
 * - Progressão de ritmos ao longo das semanas
 * - Semanas de recuperação (deload)
 */

import { TrainingPlan, User } from '../models/index.js';
import { addDays, startOfWeek } from 'date-fns';
import metabolicRiskService from './metabolicRiskService.js';
import paceCalculationService from './paceCalculationService.js';
import * as athleteClassificationService from './athleteClassificationService.js';
import periodizationService from './periodizationService.js';
import workoutVariationService from './workoutVariationService.js';
import paceProgressionService from './paceProgressionService.js';

/**
 * Gera planilha completa de treinos com periodização inteligente
 * @param {String} userId - ID do usuário
 * @param {Object} options - Opções de geração
 * @returns {Object} Plano de treino gerado
 */
export const generateCompleteTrainingPlan = async (userId, options = {}) => {
  const user = await User.findById(userId);
  if (!user) {
    throw new Error('Usuário não encontrado');
  }

  // Validar dados obrigatórios
  const validation = validateRequiredData(user);
  if (!validation.valid) {
    throw new Error(validation.error);
  }

  // 1. Calcular índices corporais
  const bodyIndices = metabolicRiskService.calculateBodyIndices(user.onboarding.bodyMetrics);
  
  // 2. Calcular risco metabólico
  const metabolicRisk = metabolicRiskService.calculateMetabolicRisk({
    gender: user.gender,
    bodyMetrics: user.onboarding.bodyMetrics
  });

  // 3. Classificar aluno (antes dos paces para usar na validação)
  const classification = athleteClassificationService.classifyAthlete({
    runningHistory: user.onboarding.runningHistory,
    onboarding: user.onboarding,
    physicalTests: user.onboarding.physicalTests,
    pain: user.onboarding.pain,
    metabolicRisk
  });

  // 4. Validar e calcular ritmos iniciais
  const testValidation = paceCalculationService.validatePhysicalTests(user.onboarding.physicalTests);
  const originalPaces = paceCalculationService.calculatePaces(user.onboarding.physicalTests);

  // 6. Calcular volume base e progressão
  const baseWeekMinutes = athleteClassificationService.calculateInitialWeeklyVolume(classification.nivel_experiencia);
  const maxWeekMinutes = user.onboarding.availability.dias_treino_semana * 
                         user.onboarding.availability.tempo_max_sessao_min;
  const finalBaseMinutes = Math.min(baseWeekMinutes, maxWeekMinutes);
  
  const progressionRate = athleteClassificationService.calculateProgressionRate(
    classification.nivel_experiencia,
    classification.reduzir_progressao
  );

  // 6. Configurar periodização
  const cycleDuration = options.cycleDuration || 12; // 12 semanas padrão
  const startDate = options.startDate ? new Date(options.startDate) : startOfWeek(new Date(), { weekStartsOn: 1 });
  const endDate = addDays(startDate, cycleDuration * 7 - 1);
  const daysPerWeek = user.onboarding.availability.dias_treino_semana;
  const trainingDays = user.onboarding.availability.trainingDays || [];

  // 7. Gerar estrutura do mesociclo
  const mesocycle = periodizationService.generateMesocycle({
    baseWeekMinutes: finalBaseMinutes,
    daysPerWeek,
    level: classification.nivel_experiencia,
    canDoIntensity: classification.pode_intensidade,
    canDoLongRun: classification.pode_longao
  });

  // 8. Gerar treinos com variação e progressão
  const workouts = generatePeriodizedWorkouts({
    mesocycle,
    originalPaces,
    classification,
    trainingDays,
    daysPerWeek,
    startDate,
    cycleDuration: Math.min(cycleDuration, 12) // Máximo 12 semanas por vez
  });

  // 9. Configurar blocos de periodização
  const periodizationBlocks = [
    { name: 'base', startWeek: 1, endWeek: 4, focus: 'Construção de base aeróbica' },
    { name: 'build', startWeek: 5, endWeek: 8, focus: 'Desenvolvimento de limiar' },
    { name: 'peak', startWeek: 9, endWeek: 12, focus: 'Trabalho de VO2max' }
  ];

  // 10. Criar plano de treino
  const trainingPlan = new TrainingPlan({
    userId: user._id.toString(),
    objective: user.onboarding.objetivo_principal || mapObjective(user.onboarding.objectives?.[0]),
    level: classification.nivel_experiencia,
    cycle: mapCycleDaysToValidEnum(cycleDuration * 7),
    startDate,
    endDate,
    workouts,
    // Paces atuais (semana 1)
    paces: {
      pace6_s_per_km: originalPaces.pace6_s_per_km,
      pace1k_s_per_km: originalPaces.pace1k_s_per_km,
      z2: originalPaces.z2,
      z1: originalPaces.z1,
      t_s_per_km: originalPaces.t_s_per_km,
      i_s_per_km: originalPaces.i_s_per_km,
      r_s_per_km: originalPaces.r_s_per_km,
      long_run: originalPaces.long_run
    },
    // Paces originais para calcular progressão
    originalPaces: {
      pace6_s_per_km: originalPaces.pace6_s_per_km,
      pace1k_s_per_km: originalPaces.pace1k_s_per_km,
      z2: originalPaces.z2,
      z1: originalPaces.z1,
      t_s_per_km: originalPaces.t_s_per_km,
      i_s_per_km: originalPaces.i_s_per_km,
      r_s_per_km: originalPaces.r_s_per_km,
      long_run: originalPaces.long_run
    },
    load: {
      week_minutes: finalBaseMinutes,
      progression_rate: progressionRate,
      current_week: 1
    },
    // Periodização
    periodization: {
      currentBlock: 'base',
      currentBlockWeek: 1,
      isDeloadWeek: false,
      paceAdjustmentFactor: 1.0,
      baseVolumeMinutes: finalBaseMinutes,
      currentVolumeMultiplier: 1.0,
      totalWeeks: cycleDuration,
      blocks: periodizationBlocks
    },
    classification: {
      level: classification.nivel_final,
      block_intensity: classification.reduzir_progressao && !classification.pode_intensidade,
      reduce_progression: classification.reduzir_progressao
    },
    warnings: testValidation.warnings || [],
    status: 'active'
  });

  await trainingPlan.save();

  // 11. Atualizar usuário com dados calculados
  user.onboarding.bodyMetrics.imc = bodyIndices.imc;
  user.onboarding.bodyMetrics.rcq = bodyIndices.rcq;
  user.onboarding.metabolicRisk = metabolicRisk;
  
  const nivelExperienciaMapped = classification.nivel_experiencia.startsWith('iniciante') 
    ? 'iniciante' 
    : 'intermediario';
  
  user.onboarding.classification = {
    nivel_experiencia: nivelExperienciaMapped,
    nivel_final: classification.nivel_final,
    pode_intensidade: classification.pode_intensidade,
    pode_longao: classification.pode_longao,
    reduzir_progressao: classification.reduzir_progressao
  };
  
  user.currentTrainingPlan.cycleId = trainingPlan._id;
  user.currentTrainingPlan.startDate = startDate;
  user.currentTrainingPlan.endDate = endDate;
  user.currentTrainingPlan.totalWorkouts = workouts.length;
  user.currentTrainingPlan.completedWorkouts = 0;
  await user.save();

  return trainingPlan;
};

/**
 * Gera treinos periodizados com variação
 */
const generatePeriodizedWorkouts = ({
  mesocycle,
  originalPaces,
  classification,
  trainingDays,
  daysPerWeek,
  startDate,
  cycleDuration
}) => {
  const workouts = [];
  const level = classification.nivel_experiencia;
  const today = new Date();
  today.setHours(0, 0, 0, 0); // Zera as horas para comparação correta de datas

  for (let weekIndex = 0; weekIndex < Math.min(cycleDuration, mesocycle.length); weekIndex++) {
    const weekConfig = mesocycle[weekIndex];
    const weekNumber = weekIndex + 1;
    
    // Calcular paces ajustados para esta semana
    const adjustedPaces = paceProgressionService.applyPaceProgression(originalPaces, weekNumber, level);
    
    // Gerar template da semana baseado no bloco
    const weekTemplate = periodizationService.generateWeekTemplate(weekConfig, daysPerWeek);
    
    // Distribuir volume entre os treinos
    const durations = periodizationService.distributeWeeklyVolume(weekConfig.volumeMinutes, weekTemplate);
    
    // Calcular início da semana
    const weekStart = startOfWeek(addDays(startDate, weekIndex * 7), { weekStartsOn: 0 });
    
    // Determinar os dias da semana para treinar
    const actualTrainingDays = trainingDays.length > 0 
      ? trainingDays 
      : getDefaultTrainingDays(daysPerWeek);

    // Gerar cada treino da semana
    weekTemplate.forEach((workoutType, dayIndex) => {
      if (dayIndex >= actualTrainingDays.length) return;
      
      const dayOfWeek = actualTrainingDays[dayIndex];
      const workoutDate = addDays(weekStart, dayOfWeek);
      
      // ✅ Não gerar treinos antes da data de hoje
      if (workoutDate < today) {
        return;
      }

      const duration = durations[dayIndex];

      // Construir treino com variação
      const workout = workoutVariationService.buildVariedWorkout({
        type: workoutType,
        duration,
        paces: adjustedPaces,
        level,
        weekNumber,
        blockName: weekConfig.blockName
      });

      workouts.push({
        day: (weekIndex * 7) + dayOfWeek + 1,
        date: workoutDate,
        type: workout.type,
        variationId: workout.variationId,
        variationName: workout.name,
        weekNumber,
        blockName: weekConfig.blockName,
        isDeloadWeek: weekConfig.isDeloadWeek,
        duration_min: workout.duration_min,
        pace_range: workout.pace_range,
        steps: workout.steps,
        description: workout.description,
        objective: workout.objective,
        completed: false
      });
    });
  }

  return workouts;
};

/**
 * Retorna dias de treino padrão quando não especificados
 */
const getDefaultTrainingDays = (daysPerWeek) => {
  const defaults = {
    2: [1, 5],           // Seg, Sex
    3: [1, 3, 5],        // Seg, Qua, Sex
    4: [1, 2, 4, 6],     // Seg, Ter, Qui, Sab
    5: [1, 2, 3, 5, 6],  // Seg, Ter, Qua, Sex, Sab
    6: [1, 2, 3, 4, 5, 6] // Seg a Sab
  };
  return defaults[daysPerWeek] || defaults[3];
};

/**
 * Valida dados obrigatórios
 */
const validateRequiredData = (user) => {
  const { bodyMetrics, physicalTests, availability } = user.onboarding || {};

  if (!bodyMetrics?.altura_cm || !bodyMetrics?.peso_kg || 
      !bodyMetrics?.cintura_cm || !bodyMetrics?.quadril_cm) {
    return {
      valid: false,
      error: 'Dados corporais incompletos. Altura, peso, cintura e quadril são obrigatórios.'
    };
  }

  if (!physicalTests?.teste6_distancia_m || !physicalTests?.teste1km_tempo_segundos) {
    return {
      valid: false,
      error: 'Testes físicos incompletos. Teste de 6 minutos e teste de 1km são obrigatórios.'
    };
  }

  if (!availability?.dias_treino_semana || !availability?.tempo_max_sessao_min) {
    return {
      valid: false,
      error: 'Disponibilidade incompleta. Dias de treino por semana e tempo máximo por sessão são obrigatórios.'
    };
  }

  if (availability?.trainingDays && (!Array.isArray(availability.trainingDays) || availability.trainingDays.length < 2)) {
    return {
      valid: false,
      error: 'Selecione pelo menos 2 dias da semana para treinar.'
    };
  }

  return { valid: true };
};

/**
 * Mapeia objetivo antigo para novo formato
 */
const mapObjective = (oldObjective) => {
  const mapping = {
    'weight_loss': 'emagrecimento',
    'health': 'saude_longevidade',
    'performance': 'performance',
    'race_preparation': 'completar_5km',
    'discipline': 'melhorar_condicionamento'
  };
  return mapping[oldObjective] || 'melhorar_condicionamento';
};

/**
 * Mapeia número de dias para valor válido do enum cycle
 */
const mapCycleDaysToValidEnum = (days) => {
  const validValues = [30, 45, 60, 90];
  let closest = validValues[0];
  let minDiff = Math.abs(days - closest);
  
  for (const value of validValues) {
    const diff = Math.abs(days - value);
    if (diff < minDiff) {
      minDiff = diff;
      closest = value;
    }
  }
  
  return closest;
};

const trainingPlanGeneratorService = {
  generateCompleteTrainingPlan
};

export { trainingPlanGeneratorService };
export default trainingPlanGeneratorService;
