/**
 * Serviço para classificação do aluno
 * Baseado no documento técnico Hack Running v1.0
 */

/**
 * Classifica o aluno por experiência
 * @param {Object} userData - Dados do usuário
 * @returns {String} Nível de experiência
 */
export const classifyByExperience = (userData) => {
  const { runningHistory, physicalTests, onboarding } = userData;

  const inferExperienceMonthsFromRunningTime = (runningTime) => {
    // Faixas do Step 1 (client/app/app/onboarding/step1/page.jsx)
    switch (runningTime) {
      case '<6m':
        return 3;
      case '6m-1y':
        return 9;
      case '1y-3y':
        return 24;
      case '3y+':
        return 48;
      default:
        return 0;
    }
  };

  // Verificar se corre atualmente
  const correAtualmente = runningHistory?.corre_atualmente || false;
  
  // Tempo de experiência em meses - usa max para conciliar
  const tempoExperienciaInformado = runningHistory?.tempo_experiencia_meses || 0;
  const tempoExperienciaInferido = inferExperienceMonthsFromRunningTime(onboarding?.runningTime);
  const tempoExperiencia = Math.max(tempoExperienciaInformado, tempoExperienciaInferido);
  
  // Maior distância recente
  const maiorDistancia = runningHistory?.maior_distancia_recente_km || 0;
  
  // Teste de 6 minutos (distância em metros)
  const teste6Distancia = physicalTests?.teste6_distancia_m || 0;

  // PRIORIDADE 1: Performance física (teste de 6min) tem peso maior
  // Se performance é muito baixa, é iniciante independente da experiência declarada
  if (teste6Distancia < 900) {
    return 'iniciante_A';
  }

  // PRIORIDADE 2: Combinar experiência + performance
  if (!correAtualmente || tempoExperiencia < 6 || maiorDistancia < 5) {
    // Sem experiência consistente
    if (teste6Distancia < 1200) {
      return 'iniciante_B';
    } else {
      return 'iniciante_B'; // Tem boa base mas sem histórico
    }
  }

  // PRIORIDADE 3: Intermediário só se performance E experiência validam
  // Requer: corre há ≥ 6 meses + distância ≥ 5km + teste6 ≥ 1100m
  if (tempoExperiencia >= 6 && maiorDistancia >= 5 && teste6Distancia >= 1100) {
    return 'intermediario';
  }

  // Fallback: iniciante_B (experiência ok mas performance insuficiente)
  return 'iniciante_B';
};

/**
 * Determina flags de segurança baseado em dor e risco
 * @param {Object} userData - Dados do usuário
 * @returns {Object} Flags de segurança
 */
export const determineSafetyFlags = (userData) => {
  const { pain, metabolicRisk } = userData;
  
  const dorIntensidade = pain?.dor_intensidade_0_10 || 0;
  const dorImpedeCorrida = pain?.dor_impede_corrida || false;
  const igre = metabolicRisk?.igre || 0;

  // Bloquear intensidade se:
  // - Dor impede corrida OU
  // - Intensidade de dor ≥ 7
  const bloquear_intensidade = dorImpedeCorrida || dorIntensidade >= 7;

  // Reduzir progressão se:
  // - Intensidade de dor ≥ 4 OU
  // - IGRE ≥ 120 (alto risco)
  const reduzir_progressao = dorIntensidade >= 4 || igre >= 120;

  // Pode fazer longão se não bloquear intensidade E dor < 7
  const pode_longao = !bloquear_intensidade && dorIntensidade < 7;

  return {
    bloquear_intensidade,
    reduzir_progressao,
    pode_longao
  };
};

/**
 * Classifica o aluno de forma combinada (experiência + risco)
 * @param {Object} userData - Dados do usuário
 * @returns {Object} Classificação completa
 */
export const classifyAthlete = (userData) => {
  const nivelExperiencia = classifyByExperience(userData);
  const classificacaoRisco = userData.metabolicRisk?.classificacao_risco || 'baixo';
  const safetyFlags = determineSafetyFlags(userData);

  // Montar nível final combinado
  // Valores válidos do enum: ['iniciante_baixo_risco', 'iniciante_risco_moderado', 'iniciante_alto_risco', 
  //                           'intermediario_baixo_risco', 'intermediario_risco_moderado', 'intermediario_alto_risco']
  let nivelFinal = '';
  if (nivelExperiencia.startsWith('iniciante')) {
    if (classificacaoRisco === 'alto') {
      nivelFinal = 'iniciante_alto_risco';
    } else if (classificacaoRisco === 'moderado') {
      nivelFinal = 'iniciante_risco_moderado';
    } else {
      nivelFinal = 'iniciante_baixo_risco';
    }
  } else {
    if (classificacaoRisco === 'alto') {
      nivelFinal = 'intermediario_alto_risco';
    } else if (classificacaoRisco === 'moderado') {
      nivelFinal = 'intermediario_risco_moderado';
    } else {
      nivelFinal = 'intermediario_baixo_risco';
    }
  }

  return {
    nivel_experiencia: nivelExperiencia,
    nivel_final: nivelFinal,
    pode_intensidade: !safetyFlags.bloquear_intensidade,
    pode_longao: safetyFlags.pode_longao,
    reduzir_progressao: safetyFlags.reduzir_progressao
  };
};

/**
 * Calcula volume semanal inicial baseado no nível
 * @param {String} nivel - Nível do aluno
 * @returns {Number} Volume semanal em minutos
 */
export const calculateInitialWeeklyVolume = (nivel) => {
  switch (nivel) {
    case 'iniciante_A':
      return 60; // minutos
    case 'iniciante_B':
      return 90;
    case 'intermediario':
      return 120;
    default:
      return 90;
  }
};

/**
 * Calcula taxa de progressão baseado no nível e flags
 * @param {String} nivel - Nível do aluno
 * @param {Boolean} reduzirProgressao - Flag para reduzir progressão
 * @returns {Number} Taxa de progressão (ex: 0.06 = 6%)
 */
export const calculateProgressionRate = (nivel, reduzirProgressao) => {
  if (reduzirProgressao) {
    return 0.06; // 6% por semana
  }

  if (nivel.startsWith('iniciante')) {
    return 0.08; // 8% por semana
  }

  return 0.10; // 10% por semana
};

export default {
  classifyByExperience,
  determineSafetyFlags,
  classifyAthlete,
  calculateInitialWeeklyVolume,
  calculateProgressionRate
};
