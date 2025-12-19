/**
 * Serviço de Progressão de Ritmos
 * Calcula a evolução dos paces ao longo das semanas
 * Baseado em progressão fisiológica realista
 */

/**
 * Taxas de melhoria por nível de atleta (por bloco de 4 semanas)
 * Valores em porcentagem de melhoria
 */
export const IMPROVEMENT_RATES = {
  iniciante_A: {
    perBlock: 0.02,     // 2% por bloco (8 segundos em pace de 400s/km)
    maxPerCycle: 0.05   // Máximo 5% por ciclo de 12 semanas
  },
  iniciante_B: {
    perBlock: 0.015,    // 1.5% por bloco
    maxPerCycle: 0.04   // Máximo 4% por ciclo
  },
  intermediario: {
    perBlock: 0.008,    // 0.8% por bloco (ganhos menores para mais experientes)
    maxPerCycle: 0.025  // Máximo 2.5% por ciclo
  }
};

/**
 * Fatores de ajuste por tipo de pace
 * Alguns ritmos melhoram mais rápido que outros
 */
const PACE_IMPROVEMENT_FACTORS = {
  z1: 0.8,           // Z1 melhora menos (já é lento)
  z2: 1.0,           // Z2 é a referência
  t_s_per_km: 1.2,   // Limiar melhora um pouco mais
  i_s_per_km: 1.3,   // Intervalado melhora mais rápido
  r_s_per_km: 1.4,   // Repetição melhora mais ainda
  long_run: 0.9      // Longão melhora menos
};

/**
 * Calcula o fator de ajuste de pace para uma semana específica
 * @param {number} weekNumber - Número da semana (1-12)
 * @param {string} level - Nível do atleta
 * @returns {number} Fator de ajuste (ex: 0.98 = 2% mais rápido)
 */
export const calculatePaceAdjustmentFactor = (weekNumber, level) => {
  const rates = IMPROVEMENT_RATES[level] || IMPROVEMENT_RATES.iniciante_B;
  
  // Calcular em qual bloco estamos (1, 2, ou 3)
  const blockNumber = Math.ceil(weekNumber / 4);
  
  // Melhoria acumulada até este bloco
  // Não aplicar melhoria completa na primeira semana do bloco
  const weekInBlock = ((weekNumber - 1) % 4) + 1;
  const blockProgress = weekInBlock / 4; // 0.25, 0.5, 0.75, 1.0
  
  // Melhoria dos blocos anteriores + parcial do bloco atual
  const completedBlocks = blockNumber - 1;
  const totalImprovement = (completedBlocks * rates.perBlock) + (blockProgress * rates.perBlock);
  
  // Limitar ao máximo por ciclo
  const cappedImprovement = Math.min(totalImprovement, rates.maxPerCycle);
  
  // Retornar fator (menor = mais rápido)
  return 1 - cappedImprovement;
};

/**
 * Aplica progressão aos paces originais
 * @param {Object} originalPaces - Paces calculados inicialmente
 * @param {number} weekNumber - Número da semana
 * @param {string} level - Nível do atleta
 * @returns {Object} Paces ajustados
 */
export const applyPaceProgression = (originalPaces, weekNumber, level) => {
  const baseFactor = calculatePaceAdjustmentFactor(weekNumber, level);
  
  const adjustedPaces = {};
  
  // Ajustar Z2
  if (originalPaces.z2) {
    const z2Factor = baseFactor * (2 - PACE_IMPROVEMENT_FACTORS.z2);
    adjustedPaces.z2 = {
      min_s_per_km: Math.round(originalPaces.z2.min_s_per_km * z2Factor),
      max_s_per_km: Math.round(originalPaces.z2.max_s_per_km * z2Factor)
    };
  }
  
  // Ajustar Z1
  if (originalPaces.z1) {
    const z1Factor = baseFactor * (2 - PACE_IMPROVEMENT_FACTORS.z1);
    adjustedPaces.z1 = {
      min_s_per_km: Math.round(originalPaces.z1.min_s_per_km * z1Factor),
      max_s_per_km: Math.round(originalPaces.z1.max_s_per_km * z1Factor)
    };
  }
  
  // Ajustar Threshold
  if (originalPaces.t_s_per_km) {
    const tFactor = baseFactor * (2 - PACE_IMPROVEMENT_FACTORS.t_s_per_km);
    adjustedPaces.t_s_per_km = Math.round(originalPaces.t_s_per_km * tFactor);
  }
  
  // Ajustar Intervalado
  if (originalPaces.i_s_per_km) {
    const iFactor = baseFactor * (2 - PACE_IMPROVEMENT_FACTORS.i_s_per_km);
    adjustedPaces.i_s_per_km = Math.round(originalPaces.i_s_per_km * iFactor);
  }
  
  // Ajustar Repetição
  if (originalPaces.r_s_per_km) {
    const rFactor = baseFactor * (2 - PACE_IMPROVEMENT_FACTORS.r_s_per_km);
    adjustedPaces.r_s_per_km = Math.round(originalPaces.r_s_per_km * rFactor);
  }
  
  // Ajustar Long Run
  if (originalPaces.long_run) {
    const lrFactor = baseFactor * (2 - PACE_IMPROVEMENT_FACTORS.long_run);
    adjustedPaces.long_run = {
      min_s_per_km: Math.round(originalPaces.long_run.min_s_per_km * lrFactor),
      max_s_per_km: Math.round(originalPaces.long_run.max_s_per_km * lrFactor)
    };
  }
  
  // Copiar paces de referência originais
  if (originalPaces.pace6_s_per_km) {
    adjustedPaces.pace6_s_per_km = originalPaces.pace6_s_per_km;
  }
  if (originalPaces.pace1k_s_per_km) {
    adjustedPaces.pace1k_s_per_km = originalPaces.pace1k_s_per_km;
  }
  
  return adjustedPaces;
};

/**
 * Calcula a melhoria esperada após um ciclo completo
 * @param {Object} originalPaces - Paces iniciais
 * @param {string} level - Nível do atleta
 * @returns {Object} Objeto com paces projetados e porcentagem de melhoria
 */
export const projectEndOfCycleImprovement = (originalPaces, level) => {
  const rates = IMPROVEMENT_RATES[level] || IMPROVEMENT_RATES.iniciante_B;
  const expectedImprovement = Math.min(rates.perBlock * 3, rates.maxPerCycle);
  
  const projectedPaces = applyPaceProgression(originalPaces, 12, level);
  
  return {
    originalPaces,
    projectedPaces,
    improvementPercentage: expectedImprovement * 100,
    description: `Melhoria esperada de ${(expectedImprovement * 100).toFixed(1)}% após 12 semanas`
  };
};

/**
 * Formata pace em segundos para string min:seg
 * @param {number} paceSeconds - Pace em segundos por km
 * @returns {string} Pace formatado (ex: "5:30")
 */
export const formatPace = (paceSeconds) => {
  const minutes = Math.floor(paceSeconds / 60);
  const seconds = paceSeconds % 60;
  return `${minutes}:${seconds.toString().padStart(2, '0')}`;
};

/**
 * Calcula a diferença entre dois paces
 * @param {number} originalPace - Pace original em segundos
 * @param {number} newPace - Novo pace em segundos
 * @returns {Object} Diferença em segundos e porcentagem
 */
export const calculatePaceDifference = (originalPace, newPace) => {
  const diffSeconds = originalPace - newPace;
  const diffPercentage = ((originalPace - newPace) / originalPace) * 100;
  
  return {
    seconds: diffSeconds,
    percentage: diffPercentage,
    description: diffSeconds > 0 
      ? `${diffSeconds}s mais rápido (${diffPercentage.toFixed(1)}% de melhoria)`
      : `${Math.abs(diffSeconds)}s mais lento`
  };
};

/**
 * Gera relatório de progressão de paces para todas as semanas
 * @param {Object} originalPaces - Paces iniciais
 * @param {string} level - Nível do atleta
 * @returns {Array} Array com paces para cada semana
 */
export const generatePaceProgressionReport = (originalPaces, level) => {
  const report = [];
  
  for (let week = 1; week <= 12; week++) {
    const adjustedPaces = applyPaceProgression(originalPaces, week, level);
    const factor = calculatePaceAdjustmentFactor(week, level);
    const blockNumber = Math.ceil(week / 4);
    const blockNames = ['Base', 'Build', 'Peak'];
    
    report.push({
      week,
      block: blockNames[blockNumber - 1],
      weekInBlock: ((week - 1) % 4) + 1,
      isDeload: week % 4 === 0,
      adjustmentFactor: factor,
      improvementPercentage: ((1 - factor) * 100).toFixed(1),
      paces: adjustedPaces,
      z2Formatted: adjustedPaces.z2 ? 
        `${formatPace(adjustedPaces.z2.min_s_per_km)} - ${formatPace(adjustedPaces.z2.max_s_per_km)}` : 
        null
    });
  }
  
  return report;
};

export default {
  IMPROVEMENT_RATES,
  calculatePaceAdjustmentFactor,
  applyPaceProgression,
  projectEndOfCycleImprovement,
  formatPace,
  calculatePaceDifference,
  generatePaceProgressionReport
};
