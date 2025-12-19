/**
 * Serviço para cálculo de ritmos de treino
 * Baseado no documento técnico Hack Running v1.0
 */

/**
 * Valida testes físicos
 * @param {Object} tests - Dados dos testes
 * @returns {Object} Resultado da validação
 */
export const validatePhysicalTests = (tests) => {
  const warnings = [];

  if (!tests.teste6_distancia_m || tests.teste6_distancia_m < 300) {
    warnings.push('Teste de 6 minutos parece inválido (distância muito baixa). Verifique a medição.');
  }

  if (!tests.teste1km_tempo_segundos) {
    warnings.push('Teste de 1km não informado.');
  } else if (tests.teste1km_tempo_segundos < 180 || tests.teste1km_tempo_segundos > 900) {
    warnings.push('Teste de 1km pode estar incorreto. Confirme o tempo informado.');
  }

  return { valid: warnings.length === 0, warnings };
};

/**
 * Calcula todos os ritmos baseados nos testes físicos
 * @param {Object} tests - Dados dos testes físicos
 * @returns {Object} Ritmos calculados
 */
export const calculatePaces = (tests) => {
  const { teste6_distancia_m, teste1km_tempo_segundos } = tests;

  if (!teste6_distancia_m || !teste1km_tempo_segundos) {
    return {
      error: 'Testes físicos incompletos. Teste de 6 minutos e 1km são obrigatórios.'
    };
  }

  // Conversões básicas
  // v6_mps = teste6_dist_m / 360 (6 minutos = 360 segundos)
  const v6_mps = teste6_distancia_m / 360;
  const v6_kmh = v6_mps * 3.6;
  const pace6_s_per_km = 1000 / v6_mps; // segundos por km
  const pace1k_s_per_km = teste1km_tempo_segundos; // já é em segundos para 1km

  // Usa o melhor teste (mais rápido) como referência principal
  const referencePace = Math.min(pace6_s_per_km, pace1k_s_per_km);
  
  // Ritmo Z2 (aeróbico) - mais agressivo, usando média ponderada dos testes
  // Usa mais o teste de 1km para não ficar muito lento
  const Z2_base = (pace6_s_per_km * 0.6) + (pace1k_s_per_km * 0.4);
  const Z2_min_s_per_km = Math.round(Z2_base * 1.05); // limite mais rápido
  const Z2_max_s_per_km = Math.round(Z2_base * 1.15); // limite mais lento

  // Ritmo de Limiar (T pace) - forte mas sustentável
  const T_s_per_km = Math.round(referencePace * 1.12);

  // Ritmo Intervalado (I pace) - VO2max, bem mais agressivo
  const I_s_per_km = Math.round(pace1k_s_per_km * 1.03);

  // Ritmo Rápido (R pace) - velocidade máxima
  const R_s_per_km = Math.round(pace1k_s_per_km * 0.90);

  // Ritmo Regenerativo (Z1) - mais próximo do Z2
  const Z1_min_s_per_km = Math.round(Z2_max_s_per_km * 1.03);
  const Z1_max_s_per_km = Math.round(Z2_max_s_per_km * 1.12);

  // Longão - próximo do Z2, confortável
  const LR_min_s_per_km = Math.round(Z2_min_s_per_km * 0.98);
  const LR_max_s_per_km = Math.round(Z2_max_s_per_km * 1.05);

  return {
    pace6_s_per_km: Math.round(pace6_s_per_km),
    pace1k_s_per_km: Math.round(pace1k_s_per_km),
    z2: {
      min_s_per_km: Z2_min_s_per_km,
      max_s_per_km: Z2_max_s_per_km
    },
    z1: {
      min_s_per_km: Z1_min_s_per_km,
      max_s_per_km: Z1_max_s_per_km
    },
    t_s_per_km: T_s_per_km,
    i_s_per_km: I_s_per_km,
    r_s_per_km: R_s_per_km,
    long_run: {
      min_s_per_km: LR_min_s_per_km,
      max_s_per_km: LR_max_s_per_km
    }
  };
};

/**
 * Converte segundos por km para formato legível (min:seg/km)
 * @param {Number} secondsPerKm - Segundos por quilômetro
 * @returns {String} Formato "min:seg/km"
 */
export const formatPace = (secondsPerKm) => {
  const minutes = Math.floor(secondsPerKm / 60);
  const seconds = Math.round(secondsPerKm % 60);
  return `${minutes}:${seconds.toString().padStart(2, '0')}/km`;
};

/**
 * Converte formato legível para segundos por km
 * @param {String} paceString - Formato "min:seg" ou "min:seg/km"
 * @returns {Number} Segundos por quilômetro
 */
export const parsePace = (paceString) => {
  if (!paceString) return null;
  
  const cleaned = paceString.replace('/km', '').trim();
  const parts = cleaned.split(':');
  
  if (parts.length !== 2) return null;
  
  const minutes = parseInt(parts[0], 10);
  const seconds = parseInt(parts[1], 10);
  
  if (isNaN(minutes) || isNaN(seconds)) return null;
  
  return minutes * 60 + seconds;
};

export default {
  validatePhysicalTests,
  calculatePaces,
  formatPace,
  parsePace
};
