import { TrainingPlan, Cycle, User, Workout, Setting } from '../models/index.js';
import { addDays, startOfWeek, format, differenceInDays } from 'date-fns';
import { ptBR } from 'date-fns/locale';

/**
 * Serviço para gerenciamento de planos de treino
 */

// Mapear tipos de treino para objetivos
const WORKOUT_TYPE_MAP = {
  '5k': ['easy', 'interval', 'tempo', 'long'],
  '10k': ['easy', 'interval', 'tempo', 'long', 'recovery'],
  'half_marathon': ['easy', 'interval', 'tempo', 'long', 'recovery', 'progression'],
  'marathon': ['easy', 'interval', 'tempo', 'long', 'recovery', 'progression', 'race_pace'],
  'general': ['easy', 'interval', 'tempo', 'long']
};

// Distribuição semanal por nível
const WEEKLY_DISTRIBUTION = {
  beginner: {
    workoutsPerWeek: 3,
    pattern: ['easy', 'interval', 'long']
  },
  intermediate: {
    workoutsPerWeek: 4,
    pattern: ['easy', 'interval', 'tempo', 'long']
  },
  advanced: {
    workoutsPerWeek: 5,
    pattern: ['easy', 'interval', 'tempo', 'easy', 'long']
  }
};

/**
 * Gera um plano de treino personalizado
 */
export const generateTrainingPlan = async (userId, options = {}) => {
  const { objective, level, cycleDuration = 4, startDate } = options;
  
  const user = await User.findById(userId);
  if (!user) {
    throw new Error('Usuário não encontrado');
  }

  // Buscar ciclo correspondente
  const cycle = await Cycle.findByObjectiveAndLevel(objective, level);
  if (!cycle) {
    throw new Error('Ciclo de treino não encontrado para este objetivo e nível');
  }

  const planStartDate = startDate ? new Date(startDate) : startOfWeek(new Date(), { weekStartsOn: 1 });
  const planEndDate = addDays(planStartDate, cycleDuration * 7 - 1);

  // Gerar treinos do plano
  const workouts = generateWorkoutsFromCycle(cycle, planStartDate, cycleDuration);

  // Criar plano de treino
  const trainingPlan = new TrainingPlan({
    userId: userId,
    objective,
    level,
    cycle: mapCycleDaysToValidEnum(cycleDuration * 7), // dias - mapeado para valores válidos do enum
    startDate: planStartDate,
    endDate: planEndDate,
    workouts,
    humanReview: {
      required: level === 'advanced' || objective === 'marathon',
      status: 'pending'
    }
  });

  await trainingPlan.save();

  // Atualizar usuário com referência ao plano
  user.currentTrainingPlan = trainingPlan._id;
  await user.save();

  return trainingPlan;
};

/**
 * Gera treinos a partir de um ciclo template
 */
const generateWorkoutsFromCycle = (cycle, startDate, weeks) => {
  const workouts = [];
  const distribution = WEEKLY_DISTRIBUTION[cycle.level] || WEEKLY_DISTRIBUTION.intermediate;
  
  for (let week = 0; week < weeks; week++) {
    const weekStart = addDays(startDate, week * 7);
    const weekTemplate = cycle.workouts[week % cycle.workouts.length] || cycle.workouts[0];
    
    // Dias típicos de treino: Terça (1), Quinta (3), Sábado (5), Domingo (6)
    const trainingDays = getTrainingDays(distribution.workoutsPerWeek);
    
    trainingDays.forEach((dayOffset, index) => {
      const workoutDate = addDays(weekStart, dayOffset);
      const workoutType = distribution.pattern[index % distribution.pattern.length];
      const templateWorkout = weekTemplate.workouts?.[index] || {};

      workouts.push({
        week: week + 1,
        day: dayOffset + 1,
        date: workoutDate,
        type: workoutType,
        description: templateWorkout.description || getDefaultDescription(workoutType),
        distance: templateWorkout.distance || getDefaultDistance(workoutType, cycle.level),
        estimatedTime: templateWorkout.estimatedTime || getEstimatedTime(workoutType, cycle.level),
        paceTarget: templateWorkout.paceTarget || null,
        notes: templateWorkout.notes || '',
        completed: false
      });
    });
  }

  return workouts;
};

/**
 * Retorna dias de treino baseado na frequência
 */
const getTrainingDays = (workoutsPerWeek) => {
  switch (workoutsPerWeek) {
    case 3:
      return [1, 3, 5]; // Ter, Qui, Sáb
    case 4:
      return [1, 2, 4, 5]; // Ter, Qua, Sex, Sáb
    case 5:
      return [0, 1, 3, 4, 6]; // Seg, Ter, Qui, Sex, Dom
    case 6:
      return [0, 1, 2, 4, 5, 6]; // Seg, Ter, Qua, Sex, Sáb, Dom
    default:
      return [1, 3, 5];
  }
};

/**
 * Descrição padrão por tipo de treino
 */
const getDefaultDescription = (type) => {
  const descriptions = {
    easy: 'Corrida leve em ritmo confortável',
    interval: 'Treino intervalado com estímulos de velocidade',
    tempo: 'Corrida em ritmo moderado-forte sustentado',
    long: 'Corrida longa para construção de base aeróbica',
    recovery: 'Corrida de recuperação em ritmo muito leve',
    progression: 'Corrida progressiva aumentando o ritmo gradualmente',
    race_pace: 'Treino em ritmo de prova'
  };
  return descriptions[type] || 'Treino de corrida';
};

/**
 * Distância padrão por tipo e nível
 */
const getDefaultDistance = (type, level) => {
  const distances = {
    beginner: {
      easy: 4,
      interval: 3,
      tempo: 4,
      long: 6,
      recovery: 3
    },
    intermediate: {
      easy: 6,
      interval: 5,
      tempo: 6,
      long: 10,
      recovery: 4,
      progression: 7
    },
    advanced: {
      easy: 8,
      interval: 8,
      tempo: 10,
      long: 18,
      recovery: 6,
      progression: 12,
      race_pace: 10
    }
  };
  return distances[level]?.[type] || 5;
};

/**
 * Tempo estimado por tipo e nível (em minutos)
 */
const getEstimatedTime = (type, level) => {
  const times = {
    beginner: { easy: 35, interval: 30, tempo: 35, long: 50, recovery: 25 },
    intermediate: { easy: 45, interval: 45, tempo: 45, long: 70, recovery: 30, progression: 50 },
    advanced: { easy: 50, interval: 55, tempo: 60, long: 120, recovery: 40, progression: 70, race_pace: 55 }
  };
  return times[level]?.[type] || 40;
};

/**
 * Mapeia número de dias para valor válido do enum cycle
 * Valores válidos: [30, 45, 60, 90]
 * Retorna o valor válido mais próximo
 */
const mapCycleDaysToValidEnum = (days) => {
  const validValues = [30, 45, 60, 90];
  
  // Encontrar o valor válido mais próximo
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

/**
 * Obter plano de treino atual do usuário
 */
export const getCurrentPlan = async (userId) => {
  const plan = await TrainingPlan.findOne({
    userId: userId,
    status: 'active',
    endDate: { $gte: new Date() }
  }).sort({ createdAt: -1 });

  if (!plan) {
    return null;
  }

  return plan;
};

/**
 * Obter próximo treino do plano
 */
export const getNextWorkout = async (userId) => {
  const plan = await getCurrentPlan(userId);
  if (!plan) {
    return null;
  }

  return plan.getNextWorkout();
};

/**
 * Obter treinos da semana atual
 */
export const getWeekWorkouts = async (userId, weekNumber = null) => {
  const plan = await getCurrentPlan(userId);
  if (!plan) {
    return [];
  }

  const today = new Date();
  const currentWeek = weekNumber || Math.ceil(
    (differenceInDays(today, plan.startDate) + 1) / 7
  );

  // Calcular semana baseado na data se não houver campo week
  return plan.workouts.filter(w => {
    if (w.week !== undefined) {
      return w.week === currentWeek;
    }
    // Calcular semana baseado na data
    if (w.date) {
      const workoutWeek = Math.ceil(
        (differenceInDays(new Date(w.date), plan.startDate) + 1) / 7
      );
      return workoutWeek === currentWeek;
    }
    return false;
  });
};

/**
 * Marcar treino como completo
 */
export const completeWorkout = async (userId, planId, workoutId, workoutData) => {
  const plan = await TrainingPlan.findOne({
    _id: planId,
    userId: userId
  });

  if (!plan) {
    throw new Error('Plano de treino não encontrado');
  }

  const planWorkout = plan.workouts.id(workoutId);
  if (!planWorkout) {
    throw new Error('Treino não encontrado no plano');
  }

  // Criar registro de treino real
  const workout = new Workout({
    user: userId,
    type: 'training',
    date: new Date(),
    distance: workoutData.distance,
    time: workoutData.time,
    workoutType: planWorkout.type,
    trainingPlan: planId,
    photo: workoutData.photo || null,
    notes: workoutData.notes || ''
  });

  await workout.save();

  // Marcar no plano
  await plan.markWorkoutComplete(planWorkout.day, workout._id);

  return { plan, workout };
};

/**
 * Verificar se precisa ajuste inteligente
 */
export const checkSmartAdjustment = async (userId) => {
  const plan = await getCurrentPlan(userId);
  if (!plan) {
    return { needsAdjustment: false };
  }

  const needsAdjustment = plan.needsSmartAdjustment();
  
  if (needsAdjustment) {
    return {
      needsAdjustment: true,
      reason: plan.adherence < 50 ? 'low_adherence' : 'missed_workouts',
      adherence: plan.adherence,
      suggestion: getSuggestion(plan)
    };
  }

  return { needsAdjustment: false, adherence: plan.adherence };
};

/**
 * Gerar sugestão de ajuste
 */
const getSuggestion = (plan) => {
  if (plan.adherence < 30) {
    return 'Considere reduzir a frequência semanal de treinos';
  } else if (plan.adherence < 50) {
    return 'Tente manter pelo menos 2 treinos por semana';
  }
  return 'Continue focado no seu plano atual';
};

/**
 * Aplicar ajuste ao plano
 */
export const applyAdjustment = async (userId, planId, adjustmentType) => {
  const plan = await TrainingPlan.findOne({
    _id: planId,
    userId: userId
  });

  if (!plan) {
    throw new Error('Plano de treino não encontrado');
  }

  const today = new Date();
  const remainingWorkouts = plan.workouts.filter(
    w => !w.completed && new Date(w.date) > today
  );

  switch (adjustmentType) {
    case 'reduce_frequency':
      // Remove treinos alternados
      remainingWorkouts.forEach((workout, index) => {
        if (index % 2 === 1) {
          workout.removed = true;
        }
      });
      break;

    case 'reduce_distance':
      // Reduz distância em 20%
      remainingWorkouts.forEach(workout => {
        if (workout.distance) {
          workout.distance = Math.round(workout.distance * 0.8 * 10) / 10;
        }
      });
      break;

    case 'extend_plan':
      // Adiciona uma semana extra
      const lastWorkoutDate = Math.max(...plan.workouts.map(w => new Date(w.date).getTime()));
      const lastWorkouts = plan.workouts.filter(w => new Date(w.date).getTime() === lastWorkoutDate);
      plan.endDate = addDays(plan.endDate, 7);
      // Duplicar últimos treinos adicionando 7 dias
      lastWorkouts.forEach(w => {
        plan.workouts.push({
          ...w.toObject(),
          _id: undefined,
          date: addDays(w.date, 7),
          completed: false
        });
      });
      break;
  }

  plan.humanReview.adjustments = `Ajuste aplicado: ${adjustmentType} em ${format(today, 'dd/MM/yyyy', { locale: ptBR })}`;
  await plan.save();

  return plan;
};

/**
 * Obter histórico de planos
 */
export const getPlanHistory = async (userId, limit = 10) => {
  return TrainingPlan.find({ userId: userId })
    .sort({ createdAt: -1 })
    .limit(limit)
    .select('objective level startDate endDate adherence humanReview.approved');
};

/**
 * Cancelar plano atual
 */
export const cancelPlan = async (userId, planId) => {
  const plan = await TrainingPlan.findOne({
    _id: planId,
    userId: userId
  });

  if (!plan) {
    throw new Error('Plano de treino não encontrado');
  }

  // Marcar treinos não completos como cancelados
  plan.workouts.forEach(w => {
    if (!w.completed) {
      w.removed = true;
    }
  });

  plan.endDate = new Date();
  await plan.save();

  // Remover referência do usuário
  await User.findByIdAndUpdate(userId, { currentTrainingPlan: null });

  return plan;
};

/**
 * Revisar plano (admin)
 */
export const reviewPlan = async (planId, reviewData, reviewerId) => {
  const plan = await TrainingPlan.findById(planId);
  if (!plan) {
    throw new Error('Plano não encontrado');
  }

  plan.humanReview = {
    enabled: true,
    approved: reviewData.approved,
    reviewedBy: reviewerId,
    reviewedAt: new Date(),
    adjustments: reviewData.notes || ''
  };

  await plan.save();

  return plan;
};

/**
 * Obter estatísticas do plano
 */
export const getPlanStats = async (userId, planId = null) => {
  let plan;
  
  if (planId) {
    plan = await TrainingPlan.findOne({ _id: planId, userId: userId });
  } else {
    plan = await getCurrentPlan(userId);
  }

  if (!plan) {
    return null;
  }

  const completedWorkouts = plan.workouts.filter(w => w.completed);
  const totalWorkouts = plan.workouts.filter(w => !w.removed).length;
  
  // Buscar treinos reais vinculados ao plano
  const realWorkouts = await Workout.find({
    user: userId,
    trainingPlan: plan._id
  });

  const totalDistance = realWorkouts.reduce((sum, w) => sum + (w.distance || 0), 0);
  const totalTime = realWorkouts.reduce((sum, w) => sum + (w.time || 0), 0);

  return {
    planId: plan._id,
    objective: plan.objective,
    level: plan.level,
    startDate: plan.startDate,
    endDate: plan.endDate,
    totalWorkouts,
    completedWorkouts: completedWorkouts.length,
    adherence: plan.adherence,
    totalDistance: Math.round(totalDistance * 10) / 10,
    totalTime,
    averageDistance: completedWorkouts.length > 0 
      ? Math.round((totalDistance / completedWorkouts.length) * 10) / 10 
      : 0,
    weeklyProgress: getWeeklyProgress(plan)
  };
};

/**
 * Calcula progresso por semana
 */
const getWeeklyProgress = (plan) => {
  const weeks = {};
  
  plan.workouts.forEach(w => {
    let weekNum;
    if (w.week !== undefined) {
      weekNum = w.week;
    } else if (w.date) {
      // Calcular semana baseado na data
      weekNum = Math.ceil(
        (differenceInDays(new Date(w.date), plan.startDate) + 1) / 7
      );
    } else {
      return; // Skip se não tiver nem week nem date
    }
    
    if (!weeks[weekNum]) {
      weeks[weekNum] = { total: 0, completed: 0 };
    }
    if (!w.removed) {
      weeks[weekNum].total++;
      if (w.completed) {
        weeks[weekNum].completed++;
      }
    }
  });

  return Object.entries(weeks).map(([week, data]) => ({
    week: parseInt(week),
    total: data.total,
    completed: data.completed,
    percentage: data.total > 0 ? Math.round((data.completed / data.total) * 100) : 0
  }));
};

const trainingPlanService = {
  generateTrainingPlan,
  getCurrentPlan,
  getNextWorkout,
  getWeekWorkouts,
  completeWorkout,
  checkSmartAdjustment,
  applyAdjustment,
  getPlanHistory,
  cancelPlan,
  reviewPlan,
  getPlanStats
};

export { trainingPlanService };
export default trainingPlanService;
