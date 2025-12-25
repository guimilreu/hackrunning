import { User, Cycle, AuditLog } from '../models/index.js';
import { trainingPlanService } from '../services/trainingPlanService.js';
import { notificationService } from '../services/notificationService.js';

/**
 * Obter status do onboarding
 */
export const getStatus = async (req, res) => {
  try {
    const user = await User.findById(req.user._id)
      .select('onboarding name');

    res.json({
      success: true,
      data: {
        completed: user.onboarding?.completed || false,
        currentStep: user.onboarding?.currentStep || 1,
        completedSteps: user.onboarding?.completedSteps || [],
        totalSteps: 7 // Step 1-3: básico, Step 4: anamnese, Step 5: histórico, Step 6: testes, Step 7: kickstart-kit
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Erro ao obter status do onboarding'
    });
  }
};

/**
 * Salvar perfil de corredor (Step 1 do frontend)
 */
export const saveRunnerProfile = async (req, res) => {
  try {
    const { runningTime, kmPerMonth, hasWatch, hasStrava } = req.body;

    const updateData = {
      'onboarding.runningTime': runningTime || '',
      'onboarding.hasWatch': hasWatch === 'yes',
      'onboarding.usesStrava': hasStrava === 'yes',
      'onboarding.currentStep': 2,
      'onboarding.completedSteps': addToCompletedSteps(req.user, 1)
    };

    // Validar e converter kmPerMonth de forma segura
    const kmNum = safeParseInt(kmPerMonth);
    if (kmNum !== undefined) {
      updateData['onboarding.monthlyKm'] = kmNum;
    } else {
      updateData['onboarding.monthlyKm'] = 0;
    }

    const user = await User.findByIdAndUpdate(
      req.user._id,
      { $set: updateData },
      { new: true, runValidators: true }
    );

    res.json({
      success: true,
      message: 'Perfil de corredor salvo',
      data: { 
        nextStep: 2,
        completedSteps: user.onboarding?.completedSteps || []
      }
    });
  } catch (error) {
    console.error('Erro ao salvar perfil de corredor:', error);
    res.status(500).json({
      success: false,
      message: 'Erro ao salvar perfil de corredor'
    });
  }
};

/**
 * Salvar objetivos (Step 2 do frontend)
 */
export const saveObjectives = async (req, res) => {
  try {
    const { objectives } = req.body;

    if (!objectives || !Array.isArray(objectives) || objectives.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Selecione pelo menos um objetivo'
      });
    }

    // Validar objetivos permitidos
    const validObjectives = ['health', 'weight_loss', 'performance', 'race_preparation', 'discipline'];
    const invalidObjectives = objectives.filter(obj => !validObjectives.includes(obj));
    
    if (invalidObjectives.length > 0) {
      return res.status(400).json({
        success: false,
        message: `Objetivos inválidos: ${invalidObjectives.join(', ')}`
      });
    }

    const user = await User.findByIdAndUpdate(
      req.user._id,
      {
        $set: {
          'onboarding.objectives': objectives,
          'onboarding.currentStep': 3,
          'onboarding.completedSteps': addToCompletedSteps(req.user, 2)
        }
      },
      { new: true, runValidators: true }
    );

    res.json({
      success: true,
      message: 'Objetivos salvos',
      data: { 
        nextStep: 3,
        completedSteps: user.onboarding?.completedSteps || []
      }
    });
  } catch (error) {
    console.error('Erro ao salvar objetivos:', error);
    res.status(500).json({
      success: false,
      message: 'Erro ao salvar objetivos'
    });
  }
};

/**
 * Salvar métricas e metas (Step 3 do frontend)
 */
export const saveMetrics = async (req, res) => {
  try {
    const { 
      weight, height, frequency, paceTarget, time5k,
      // Novos campos corporais
      cintura_cm, quadril_cm, foto_url,
      // Disponibilidade
      tempo_max_sessao_min,
      trainingDays // Novo: array de dias da semana
    } = req.body;

    const goals = {};
    if (weight) {
      const weightNum = safeParseFloat(weight);
      if (weightNum !== undefined) goals.currentWeight = weightNum;
    }
    if (paceTarget) {
      // Converter pace de string "5:00" para número (minutos)
      const paceParts = paceTarget.split(':');
      if (paceParts.length === 2) {
        const min = safeParseInt(paceParts[0]);
        const sec = safeParseInt(paceParts[1]);
        if (min !== undefined && sec !== undefined) {
          goals.targetPace = min * 60 + sec;
        }
      }
    }
    if (time5k) {
      // Converter tempo de string "25:00" para número (segundos)
      const timeParts = time5k.split(':');
      if (timeParts.length === 2) {
        const min = safeParseInt(timeParts[0]);
        const sec = safeParseInt(timeParts[1]);
        if (min !== undefined && sec !== undefined) {
          goals.current5KTime = min * 60 + sec;
        }
      }
    }

    const updateData = {
      'onboarding.currentStep': 4,
      'onboarding.completedSteps': addToCompletedSteps(req.user, 3)
    };

    if (frequency) {
      const freqNum = safeParseInt(frequency);
      if (freqNum !== undefined) {
        updateData['onboarding.goals.weeklyFrequency'] = freqNum;
      }
    }
    if (Object.keys(goals).length > 0) {
      Object.keys(goals).forEach(key => {
        updateData[`onboarding.goals.${key}`] = goals[key];
      });
    }

    // Salvar dados corporais
    const alturaNum = safeParseInt(height);
    if (alturaNum !== undefined) updateData['onboarding.bodyMetrics.altura_cm'] = alturaNum;
    
    const pesoNum = safeParseFloat(weight);
    if (pesoNum !== undefined) updateData['onboarding.bodyMetrics.peso_kg'] = pesoNum;
    
    const cinturaNum = safeParseFloat(cintura_cm);
    if (cinturaNum !== undefined) updateData['onboarding.bodyMetrics.cintura_cm'] = cinturaNum;
    
    const quadrilNum = safeParseFloat(quadril_cm);
    if (quadrilNum !== undefined) updateData['onboarding.bodyMetrics.quadril_cm'] = quadrilNum;
    
    if (foto_url) updateData['onboarding.bodyMetrics.foto_url'] = foto_url;

    // Salvar disponibilidade
    // Priorizar trainingDays se fornecido, caso contrário usar frequency
    if (trainingDays && Array.isArray(trainingDays) && trainingDays.length >= 2) {
      updateData['onboarding.availability.trainingDays'] = trainingDays;
      updateData['onboarding.availability.dias_treino_semana'] = trainingDays.length;
    } else if (frequency) {
      const freqNum = safeParseInt(frequency);
      if (freqNum !== undefined) {
        updateData['onboarding.availability.dias_treino_semana'] = freqNum;
      }
    }
    
    const tempoNum = safeParseInt(tempo_max_sessao_min);
    if (tempoNum !== undefined && [30, 45, 60, 90].includes(tempoNum)) {
      updateData['onboarding.availability.tempo_max_sessao_min'] = tempoNum;
    }

    const user = await User.findByIdAndUpdate(
      req.user._id,
      { $set: updateData },
      { new: true, runValidators: true }
    );

    res.json({
      success: true,
      message: 'Métricas e metas salvas',
      data: { 
        nextStep: 4,
        completedSteps: user.onboarding?.completedSteps || []
      }
    });
  } catch (error) {
    console.error('Erro ao salvar métricas:', error);
    res.status(500).json({
      success: false,
      message: 'Erro ao salvar métricas'
    });
  }
};

/**
 * Salvar anamnese completa (Step 4 - Saúde e estilo de vida)
 */
export const saveAnamnesis = async (req, res) => {
  try {
    const {
      alimentacao_status,
      acucar_frequencia,
      alcool_frequencia,
      hipertensao,
      diabetes_tipo2,
      pre_diabetes,
      colesterol_alto,
      resistencia_insulina,
      historico_familiar_diabetes,
      historico_familiar_cardio
    } = req.body;

    const updateData = {
      'onboarding.currentStep': 5,
      'onboarding.completedSteps': addToCompletedSteps(req.user, 4)
    };

    // Estilo de vida
    if (alimentacao_status) updateData['onboarding.lifestyle.alimentacao_status'] = alimentacao_status;
    if (acucar_frequencia) updateData['onboarding.lifestyle.acucar_frequencia'] = acucar_frequencia;
    if (alcool_frequencia) updateData['onboarding.lifestyle.alcool_frequencia'] = alcool_frequencia;

    // Saúde metabólica
    if (hipertensao !== undefined) updateData['onboarding.metabolicHealth.hipertensao'] = hipertensao;
    if (diabetes_tipo2 !== undefined) updateData['onboarding.metabolicHealth.diabetes_tipo2'] = diabetes_tipo2;
    if (pre_diabetes !== undefined) updateData['onboarding.metabolicHealth.pre_diabetes'] = pre_diabetes;
    if (colesterol_alto !== undefined) updateData['onboarding.metabolicHealth.colesterol_alto'] = colesterol_alto;
    if (resistencia_insulina !== undefined) updateData['onboarding.metabolicHealth.resistencia_insulina'] = resistencia_insulina;
    if (historico_familiar_diabetes !== undefined) updateData['onboarding.metabolicHealth.historico_familiar_diabetes'] = historico_familiar_diabetes;
    if (historico_familiar_cardio !== undefined) updateData['onboarding.metabolicHealth.historico_familiar_cardio'] = historico_familiar_cardio;

    const user = await User.findByIdAndUpdate(
      req.user._id,
      { $set: updateData },
      { new: true, runValidators: true }
    );

    res.json({
      success: true,
      message: 'Anamnese salva',
      data: { 
        nextStep: 5,
        completedSteps: user.onboarding?.completedSteps || []
      }
    });
  } catch (error) {
    console.error('Erro ao salvar anamnese:', error);
    res.status(500).json({
      success: false,
      message: 'Erro ao salvar anamnese'
    });
  }
};

/**
 * Salvar histórico de corrida e dores (Step 5)
 */
export const saveRunningHistory = async (req, res) => {
  try {
    const {
      corre_atualmente,
      tempo_experiencia_meses,
      dias_corrida_semana,
      maior_distancia_recente_km,
      dor_atual,
      local_dor,
      dor_intensidade_0_10,
      dor_piora_corrida,
      dor_impede_corrida
    } = req.body;

    const updateData = {
      'onboarding.currentStep': 6,
      'onboarding.completedSteps': addToCompletedSteps(req.user, 5)
    };

    // Histórico de corrida
    if (corre_atualmente !== undefined) updateData['onboarding.runningHistory.corre_atualmente'] = corre_atualmente;
    
    const tempoExpNum = safeParseInt(tempo_experiencia_meses);
    if (tempoExpNum !== undefined) updateData['onboarding.runningHistory.tempo_experiencia_meses'] = tempoExpNum;
    
    const diasCorridaNum = safeParseInt(dias_corrida_semana);
    if (diasCorridaNum !== undefined) updateData['onboarding.runningHistory.dias_corrida_semana'] = diasCorridaNum;
    
    const distanciaNum = safeParseFloat(maior_distancia_recente_km);
    if (distanciaNum !== undefined) updateData['onboarding.runningHistory.maior_distancia_recente_km'] = distanciaNum;

    // Dores
    if (dor_atual !== undefined) updateData['onboarding.pain.dor_atual'] = dor_atual;
    if (local_dor && Array.isArray(local_dor)) updateData['onboarding.pain.local_dor'] = local_dor;
    
    const dorIntensidadeNum = safeParseInt(dor_intensidade_0_10);
    if (dorIntensidadeNum !== undefined) updateData['onboarding.pain.dor_intensidade_0_10'] = dorIntensidadeNum;
    
    if (dor_piora_corrida !== undefined) updateData['onboarding.pain.dor_piora_corrida'] = dor_piora_corrida;
    if (dor_impede_corrida !== undefined) updateData['onboarding.pain.dor_impede_corrida'] = dor_impede_corrida;

    const user = await User.findByIdAndUpdate(
      req.user._id,
      { $set: updateData },
      { new: true, runValidators: true }
    );

    res.json({
      success: true,
      message: 'Histórico de corrida salvo',
      data: { 
        nextStep: 6,
        completedSteps: user.onboarding?.completedSteps || []
      }
    });
  } catch (error) {
    console.error('Erro ao salvar histórico de corrida:', error);
    res.status(500).json({
      success: false,
      message: 'Erro ao salvar histórico de corrida'
    });
  }
};

/**
 * Salvar testes físicos (Step 6)
 */
export const savePhysicalTests = async (req, res) => {
  try {
    const {
      teste6_distancia_m,
      teste6_esforco_0_10,
      teste1km_tempo_segundos,
      teste1km_esforco_0_10,
      objetivo_principal
    } = req.body;

    const updateData = {
      'onboarding.currentStep': 7,
      'onboarding.completedSteps': addToCompletedSteps(req.user, 6)
    };

    // Testes físicos
    const teste6DistanciaNum = safeParseFloat(teste6_distancia_m);
    if (teste6DistanciaNum !== undefined) updateData['onboarding.physicalTests.teste6_distancia_m'] = teste6DistanciaNum;
    
    const teste6EsforcoNum = safeParseInt(teste6_esforco_0_10);
    if (teste6EsforcoNum !== undefined) updateData['onboarding.physicalTests.teste6_esforco_0_10'] = teste6EsforcoNum;
    
    // Converter tempo de 1km de formato "min:seg" para segundos
    if (teste1km_tempo_segundos) {
      if (typeof teste1km_tempo_segundos === 'string') {
        const parts = teste1km_tempo_segundos.split(':');
        if (parts.length === 2) {
          const min = safeParseInt(parts[0]);
          const sec = safeParseInt(parts[1]);
          if (min !== undefined && sec !== undefined) {
            updateData['onboarding.physicalTests.teste1km_tempo_segundos'] = min * 60 + sec;
          }
        } else {
          const tempoNum = safeParseInt(teste1km_tempo_segundos);
          if (tempoNum !== undefined) {
            updateData['onboarding.physicalTests.teste1km_tempo_segundos'] = tempoNum;
          }
        }
      } else {
        const tempoNum = safeParseInt(teste1km_tempo_segundos);
        if (tempoNum !== undefined) {
          updateData['onboarding.physicalTests.teste1km_tempo_segundos'] = tempoNum;
        }
      }
    }
    
    const teste1kmEsforcoNum = safeParseInt(teste1km_esforco_0_10);
    if (teste1kmEsforcoNum !== undefined) updateData['onboarding.physicalTests.teste1km_esforco_0_10'] = teste1kmEsforcoNum;

    // Objetivo principal
    if (objetivo_principal) {
      updateData['onboarding.objetivo_principal'] = objetivo_principal;
    }

    const user = await User.findByIdAndUpdate(
      req.user._id,
      { $set: updateData },
      { new: true, runValidators: true }
    );

    res.json({
      success: true,
      message: 'Testes físicos salvos',
      data: { 
        nextStep: 7,
        completedSteps: user.onboarding?.completedSteps || []
      }
    });
  } catch (error) {
    console.error('Erro ao salvar testes físicos:', error);
    res.status(500).json({
      success: false,
      message: 'Erro ao salvar testes físicos'
    });
  }
};

/**
 * Salvar dados pessoais (Step 1)
 */
export const savePersonalData = async (req, res) => {
  try {
    const { name, phone, birthDate, gender, cpf } = req.body;

    // Verificar CPF único
    if (cpf) {
      const existingCpf = await User.findOne({ 
        cpf, 
        _id: { $ne: req.user._id } 
      });
      if (existingCpf) {
        return res.status(400).json({
          success: false,
          message: 'Este CPF já está cadastrado'
        });
      }
    }

    const user = await User.findByIdAndUpdate(
      req.user._id,
      {
        $set: {
          name,
          phone,
          birthDate,
          gender,
          cpf,
          'onboarding.currentStep': 2,
          'onboarding.completedSteps': addToCompletedSteps(req.user, 1)
        }
      },
      { new: true, runValidators: true }
    );

    res.json({
      success: true,
      message: 'Dados pessoais salvos',
      data: { 
        nextStep: 2,
        completedSteps: user.onboarding.completedSteps 
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Erro ao salvar dados pessoais'
    });
  }
};

/**
 * Salvar endereço (Step 2)
 */
export const saveAddress = async (req, res) => {
  try {
    const { zipCode, street, number, complement, neighborhood, city, state } = req.body;

    const user = await User.findByIdAndUpdate(
      req.user._id,
      {
        $set: {
          address: { zipCode, street, number, complement, neighborhood, city, state },
          'onboarding.currentStep': 3,
          'onboarding.completedSteps': addToCompletedSteps(req.user, 2)
        }
      },
      { new: true, runValidators: true }
    );

    res.json({
      success: true,
      message: 'Endereço salvo',
      data: { 
        nextStep: 3,
        completedSteps: user.onboarding.completedSteps 
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Erro ao salvar endereço'
    });
  }
};

/**
 * Salvar objetivo de corrida (Step 3)
 */
export const saveRunningGoal = async (req, res) => {
  try {
    const { objective, level, weeklyFrequency, preferredDays } = req.body;

    // Verificar se existe ciclo para este objetivo/nível
    const cycle = await Cycle.findByObjectiveAndLevel(objective, level);
    if (!cycle) {
      return res.status(400).json({
        success: false,
        message: 'Objetivo ou nível inválido'
      });
    }

    const user = await User.findByIdAndUpdate(
      req.user._id,
      {
        $set: {
          'runningProfile.objective': objective,
          'runningProfile.level': level,
          'runningProfile.weeklyFrequency': weeklyFrequency,
          'runningProfile.preferredDays': preferredDays,
          'onboarding.currentStep': 4,
          'onboarding.completedSteps': addToCompletedSteps(req.user, 3)
        }
      },
      { new: true, runValidators: true }
    );

    res.json({
      success: true,
      message: 'Objetivo de corrida salvo',
      data: { 
        nextStep: 4,
        completedSteps: user.onboarding.completedSteps,
        cycleName: cycle.name
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Erro ao salvar objetivo'
    });
  }
};

/**
 * Selecionar tamanho de camiseta (Step 4) - Kickstart Kit
 */
export const saveShirtSize = async (req, res) => {
  try {
    const { shirtSize } = req.body;

    const user = await User.findByIdAndUpdate(
      req.user._id,
      {
        $set: {
          shirtSize,
          'kickstartKit.shirtSize': shirtSize,
          'onboarding.currentStep': 5,
          'onboarding.completedSteps': addToCompletedSteps(req.user, 4)
        }
      },
      { new: true, runValidators: true }
    );

    res.json({
      success: true,
      message: 'Tamanho de camiseta salvo',
      data: { 
        nextStep: 5,
        completedSteps: user.onboarding.completedSteps 
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Erro ao salvar tamanho'
    });
  }
};

/**
 * Finalizar onboarding (Step 5)
 */
export const complete = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);

    // Verificar se todas as etapas foram completadas
    const requiredSteps = [1, 2, 3, 4];
    const hasAllSteps = requiredSteps.every(step => 
      user.onboarding.completedSteps.includes(step)
    );

    if (!hasAllSteps) {
      return res.status(400).json({
        success: false,
        message: 'Complete todas as etapas anteriores primeiro',
        data: {
          completedSteps: user.onboarding.completedSteps,
          missingSteps: requiredSteps.filter(s => !user.onboarding.completedSteps.includes(s))
        }
      });
    }

    // Gerar plano de treino
    let trainingPlan = null;
    if (user.runningProfile?.objective && user.runningProfile?.level) {
      try {
        trainingPlan = await trainingPlanService.generateTrainingPlan(user._id, {
          objective: user.runningProfile.objective,
          level: user.runningProfile.level,
          cycleDuration: 4
        });
      } catch (err) {
        console.error('Erro ao gerar plano de treino:', err);
      }
    }

    // Marcar onboarding como completo
    user.onboarding.completed = true;
    user.onboarding.completedAt = new Date();
    user.onboarding.completedSteps = [...user.onboarding.completedSteps, 5];
    await user.save();

    // Notificar sobre plano pronto
    if (trainingPlan) {
      await notificationService.notifyTrainingPlanReady(
        user._id, 
        user.runningProfile.objective
      );
    }

    // Log de auditoria
    await AuditLog.logCreate(req.user._id, 'onboarding', user._id, {
      objective: user.runningProfile?.objective,
      level: user.runningProfile?.level
    }, req);

    res.json({
      success: true,
      message: 'Onboarding completo! Bem-vindo à Hack Running!',
      data: {
        completed: true,
        trainingPlan: trainingPlan ? {
          id: trainingPlan._id,
          objective: trainingPlan.objective,
          startDate: trainingPlan.startDate
        } : null
      }
    });
  } catch (error) {
    console.error('Erro ao completar onboarding:', error);
    res.status(500).json({
      success: false,
      message: 'Erro ao completar onboarding'
    });
  }
};

/**
 * Obter opções disponíveis para onboarding
 */
export const getOptions = async (req, res) => {
  try {
    const cycles = await Cycle.findActive();
    
    const objectives = [...new Set(cycles.map(c => c.objective))];
    const levels = ['beginner', 'intermediate', 'advanced'];
    const shirtSizes = ['PP', 'P', 'M', 'G', 'GG', 'XGG'];
    const weekDays = [
      { value: 0, label: 'Domingo' },
      { value: 1, label: 'Segunda' },
      { value: 2, label: 'Terça' },
      { value: 3, label: 'Quarta' },
      { value: 4, label: 'Quinta' },
      { value: 5, label: 'Sexta' },
      { value: 6, label: 'Sábado' }
    ];

    res.json({
      success: true,
      data: {
        objectives: objectives.map(o => ({
          value: o,
          label: getObjectiveLabel(o)
        })),
        levels: levels.map(l => ({
          value: l,
          label: getLevelLabel(l)
        })),
        shirtSizes,
        weekDays,
        weeklyFrequencyOptions: [2, 3, 4, 5, 6]
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Erro ao obter opções'
    });
  }
};

/**
 * Voltar para etapa anterior
 */
export const goBack = async (req, res) => {
  try {
    const { step } = req.body;
    const user = await User.findById(req.user._id);

    if (step < 1 || step > 7) {
      return res.status(400).json({
        success: false,
        message: 'Etapa inválida'
      });
    }

    user.onboarding.currentStep = step;
    await user.save();

    res.json({
      success: true,
      data: { currentStep: step }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Erro ao voltar etapa'
    });
  }
};

/**
 * Pular todas as etapas e ir direto para o kickstart-kit
 * Marca todas as etapas como concluídas mas não marca o onboarding como completo
 */
export const skipToKickstart = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);

    // Marcar todas as etapas (1-6) como concluídas
    const allSteps = [1, 2, 3, 4, 5, 6];
    const completedSteps = [...new Set([...(user.onboarding?.completedSteps || []), ...allSteps])];

    // Atualizar o usuário: marcar etapas como concluídas e ir para o kickstart-kit (step 7)
    user.onboarding.completedSteps = completedSteps;
    user.onboarding.currentStep = 7; // kickstart-kit
    // Não marcar como completo, pois o usuário ainda precisa comprar o kit
    await user.save();

    res.json({
      success: true,
      message: 'Etapas puladas com sucesso',
      data: {
        currentStep: 7,
        completedSteps: completedSteps
      }
    });
  } catch (error) {
    console.error('Erro ao pular etapas:', error);
    res.status(500).json({
      success: false,
      message: 'Erro ao pular etapas'
    });
  }
};

// Helpers
function addToCompletedSteps(user, step) {
  const completed = user.onboarding?.completedSteps || [];
  if (!completed.includes(step)) {
    return [...completed, step];
  }
  return completed;
}

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
  getStatus,
  saveRunnerProfile,
  saveObjectives,
  saveMetrics,
  saveAnamnesis,
  saveRunningHistory,
  savePhysicalTests,
  savePersonalData,
  saveAddress,
  saveRunningGoal,
  saveShirtSize,
  complete,
  getOptions,
  goBack,
  skipToKickstart
};
