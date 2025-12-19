/**
 * Serviço para cálculo de risco metabólico e cardiovascular
 * Baseado no documento técnico Hack Running v1.0
 */

/**
 * Calcula o Índice Global de Risco Evitável (IGRE)
 * @param {Object} userData - Dados do usuário
 * @returns {Object} Resultado do cálculo de risco
 */
export const calculateMetabolicRisk = (userData) => {
  const { gender, bodyMetrics } = userData;
  
  if (!bodyMetrics?.cintura_cm || !bodyMetrics?.quadril_cm) {
    return {
      error: 'Dados corporais incompletos. Cintura e quadril são obrigatórios.'
    };
  }

  // Pontos de corte por gênero
  const cintura_base = gender === 'M' ? 94 : 80; // cm
  const excesso_cm = Math.max(0, bodyMetrics.cintura_cm - cintura_base);

  // Incrementos de risco por cm excedente (%)
  const diabetes_risco = excesso_cm * 2.7;
  const neurologico_risco = excesso_cm * 2.4;
  const cancer_risco = excesso_cm * 4.0;
  const cardiovascular_risco = excesso_cm * 6.8;

  // IGRE total
  const igre = diabetes_risco + neurologico_risco + cancer_risco + cardiovascular_risco;

  // Classificação de risco
  let classificacao_risco = 'baixo';
  if (igre >= 120) {
    classificacao_risco = 'alto';
  } else if (igre >= 50) {
    classificacao_risco = 'moderado';
  }

  return {
    excesso_cintura_cm: excesso_cm,
    diabetes_risco: Math.round(diabetes_risco * 10) / 10,
    neurologico_risco: Math.round(neurologico_risco * 10) / 10,
    cancer_risco: Math.round(cancer_risco * 10) / 10,
    cardiovascular_risco: Math.round(cardiovascular_risco * 10) / 10,
    igre: Math.round(igre * 10) / 10,
    classificacao_risco
  };
};

/**
 * Calcula índices corporais (IMC e RCQ)
 * @param {Object} bodyMetrics - Dados corporais
 * @returns {Object} Índices calculados
 */
export const calculateBodyIndices = (bodyMetrics) => {
  const { altura_cm, peso_kg, cintura_cm, quadril_cm } = bodyMetrics;

  if (!altura_cm || !peso_kg) {
    return { error: 'Altura e peso são obrigatórios' };
  }

  // IMC = peso / (altura²)
  const altura_m = altura_cm / 100;
  const imc = Math.round((peso_kg / (altura_m * altura_m)) * 10) / 10;

  // RCQ = cintura / quadril
  let rcq = null;
  if (cintura_cm && quadril_cm && quadril_cm > 0) {
    rcq = Math.round((cintura_cm / quadril_cm) * 100) / 100;
  }

  return { imc, rcq };
};

/**
 * Gera explicação em linguagem simples do risco metabólico
 * @param {Object} riskData - Dados de risco calculados
 * @returns {String} Explicação do risco
 */
export const explainMetabolicRisk = (riskData) => {
  const { igre, classificacao_risco, diabetes_risco, cardiovascular_risco } = riskData;

  let explanation = `Seu Índice Global de Risco Evitável (IGRE) é ${igre.toFixed(1)}%, `;
  
  switch (classificacao_risco) {
    case 'baixo':
      explanation += 'indicando um risco baixo para doenças metabólicas e cardiovasculares. ';
      explanation += 'Continue mantendo hábitos saudáveis!';
      break;
    case 'moderado':
      explanation += 'indicando um risco moderado. ';
      explanation += `Você tem ${diabetes_risco.toFixed(1)}% de risco adicional para diabetes e `;
      explanation += `${cardiovascular_risco.toFixed(1)}% para doenças cardiovasculares. `;
      explanation += 'Com treinos regulares e ajustes na alimentação, você pode reduzir significativamente esses riscos.';
      break;
    case 'alto':
      explanation += 'indicando um risco alto. ';
      explanation += `Você tem ${diabetes_risco.toFixed(1)}% de risco adicional para diabetes e `;
      explanation += `${cardiovascular_risco.toFixed(1)}% para doenças cardiovasculares. `;
      explanation += 'É importante seguir o plano de treinos com cuidado e considerar acompanhamento médico.';
      break;
  }

  return explanation;
};

export default {
  calculateMetabolicRisk,
  calculateBodyIndices,
  explainMetabolicRisk
};
