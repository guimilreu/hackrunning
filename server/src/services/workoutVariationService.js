/**
 * Serviço de Variação de Treinos
 * Implementa diferentes variações para cada tipo de treino
 * Evita repetição e mantém o treino interessante
 */

/**
 * Variações disponíveis para cada tipo de treino
 */
export const WORKOUT_VARIATIONS = {
  Z2: {
    easy_run: {
      name: 'Corrida Leve',
      description: 'Corrida contínua em ritmo confortável',
      buildSteps: (duration, paces) => [
        `5 minutos: Aquecimento leve caminhando ou trotando`,
        `${Math.max(duration - 10, 10)} minutos: Corrida contínua em Zona 2 (ritmo de conversa)`,
        `5 minutos: Volta à calma e alongamento`
      ],
      objective: 'Desenvolvimento da base aeróbica'
    },
    progression_run: {
      name: 'Corrida Progressiva',
      description: 'Comece leve e termine em ritmo moderado',
      buildSteps: (duration, paces) => {
        const warmup = 5;
        const cooldown = 5;
        const mainTime = Math.max(duration - warmup - cooldown, 8);
        const easyPortion = Math.round(mainTime * 0.6);
        const fastPortion = mainTime - easyPortion;
        return [
          `${warmup} minutos: Aquecimento leve em Zona 1`,
          `${easyPortion} minutos: Corrida em Zona 2 baixa (ritmo bem confortável)`,
          `${fastPortion} minutos: Aumente gradualmente para Zona 2 alta (ritmo moderado)`,
          `${cooldown} minutos: Volta à calma`
        ];
      },
      objective: 'Desenvolver capacidade de mudança de ritmo'
    },
    tempo_finish: {
      name: 'Finalização Forte',
      description: 'Corrida aeróbica com final em ritmo forte',
      buildSteps: (duration, paces) => {
        const mainTime = Math.max(duration - 15, 15);
        const easyPortion = Math.round(mainTime * 0.7);
        const fastPortion = mainTime - easyPortion;
        return [
          `5 minutos: Aquecimento em Zona 1`,
          `${easyPortion} minutos: Corrida em Zona 2 (ritmo de conversa)`,
          `${fastPortion} minutos: Finalize em ritmo forte (Zona 3 - consegue falar frases curtas)`,
          `5 minutos: Trote leve e volta à calma`
        ];
      },
      objective: 'Preparar o corpo para esforços mais intensos'
    }
  },
  
  Z1: {
    recovery_run: {
      name: 'Corrida Regenerativa',
      description: 'Corrida muito leve para recuperação',
      buildSteps: (duration, paces) => [
        `3 minutos: Caminhada leve`,
        `${Math.max(duration - 8, 10)} minutos: Trote muito leve em Zona 1 (ritmo de passeio)`,
        `5 minutos: Caminhada e alongamento suave`
      ],
      objective: 'Recuperação ativa'
    },
    walk_run: {
      name: 'Caminhada e Trote',
      description: 'Alternância entre caminhada e trote leve',
      buildSteps: (duration, paces) => {
        const intervals = Math.floor((duration - 6) / 4);
        return [
          `3 minutos: Caminhada de aquecimento`,
          `${intervals} ciclos de: 2 minutos trote leve + 2 minutos caminhada`,
          `3 minutos: Caminhada final e alongamento`
        ];
      },
      objective: 'Recuperação ativa suave'
    }
  },

  T: {
    tempo_continuous: {
      name: 'Tempo Contínuo',
      description: 'Corrida contínua no limiar',
      buildSteps: (duration, paces, level) => {
        const warmup = 10;
        const cooldown = 8;
        const tempoTime = Math.min(Math.max(duration - warmup - cooldown, 15), level === 'iniciante_A' ? 15 : 25);
        return [
          `${warmup} minutos: Aquecimento progressivo (Zona 1 → Zona 2)`,
          `${tempoTime} minutos: Corrida contínua em ritmo de limiar (Zona 4 - ritmo forte mas sustentável)`,
          `${cooldown} minutos: Volta à calma em Zona 1`
        ];
      },
      objective: 'Melhoria do limiar de lactato'
    },
    cruise_intervals: {
      name: 'Intervalos de Cruzeiro',
      description: 'Repetições no limiar com recuperação curta',
      buildSteps: (duration, paces, level) => {
        const warmup = 10;
        const cooldown = 8;
        const workTime = Math.max(duration - warmup - cooldown, 12);
        const reps = level === 'iniciante_A' ? 3 : 4;
        const repDuration = Math.floor(workTime / (reps * 1.4)); // inclui recuperação
        const recovery = 2;
        
        const steps = [`${warmup} minutos: Aquecimento progressivo`];
        for (let i = 0; i < reps; i++) {
          steps.push(`${repDuration} minutos: Ritmo de limiar (forte mas controlado)`);
          if (i < reps - 1) {
            steps.push(`${recovery} minutos: Trote leve de recuperação`);
          }
        }
        steps.push(`${cooldown} minutos: Volta à calma`);
        return steps;
      },
      objective: 'Desenvolver resistência no limiar'
    },
    tempo_ladder: {
      name: 'Escada de Tempo',
      description: 'Blocos progressivos no limiar',
      buildSteps: (duration, paces, level) => {
        const warmup = 10;
        const cooldown = 8;
        const isShort = duration < 40 || level === 'iniciante_A';
        
        if (isShort) {
          return [
            `${warmup} minutos: Aquecimento progressivo`,
            `4 minutos: Ritmo de limiar`,
            `2 minutos: Trote de recuperação`,
            `6 minutos: Ritmo de limiar`,
            `2 minutos: Trote de recuperação`,
            `4 minutos: Ritmo de limiar`,
            `${cooldown} minutos: Volta à calma`
          ];
        }
        return [
          `${warmup} minutos: Aquecimento progressivo`,
          `5 minutos: Ritmo de limiar`,
          `2 minutos: Trote de recuperação`,
          `8 minutos: Ritmo de limiar`,
          `2 minutos: Trote de recuperação`,
          `10 minutos: Ritmo de limiar`,
          `2 minutos: Trote de recuperação`,
          `5 minutos: Ritmo de limiar`,
          `${cooldown} minutos: Volta à calma`
        ];
      },
      objective: 'Desenvolver resistência mental e física no limiar'
    }
  },

  I: {
    short_intervals: {
      name: 'Intervalos Curtos',
      description: 'Repetições curtas de alta intensidade',
      buildSteps: (duration, paces, level) => {
        const warmup = 10;
        const cooldown = 8;
        const reps = level === 'iniciante_A' ? 6 : level === 'iniciante_B' ? 8 : 10;
        const recovery = level === 'iniciante_A' ? 2 : 1.5;
        
        const steps = [`${warmup} minutos: Aquecimento progressivo com 3 acelerações de 15 segundos`];
        steps.push(`${reps}x: 1 minuto em ritmo forte (Zona 5 - esforço alto)`);
        steps.push(`Recuperação: ${recovery} minutos de trote leve entre cada repetição`);
        steps.push(`${cooldown} minutos: Volta à calma`);
        return steps;
      },
      objective: 'Melhoria do VO2max'
    },
    long_intervals: {
      name: 'Intervalos Longos',
      description: 'Repetições mais longas em intensidade alta',
      buildSteps: (duration, paces, level) => {
        const warmup = 10;
        const cooldown = 8;
        const reps = level === 'iniciante_A' ? 3 : level === 'iniciante_B' ? 4 : 5;
        const repDuration = 3; // 3 minutos
        const recovery = 2;
        
        const steps = [`${warmup} minutos: Aquecimento progressivo`];
        steps.push(`${reps}x: ${repDuration} minutos em ritmo forte (Zona 5)`);
        steps.push(`Recuperação: ${recovery} minutos de trote leve entre cada repetição`);
        steps.push(`${cooldown} minutos: Volta à calma`);
        return steps;
      },
      objective: 'Desenvolver capacidade aeróbica máxima'
    },
    pyramid: {
      name: 'Pirâmide',
      description: 'Intervalos em formato de pirâmide',
      buildSteps: (duration, paces, level) => {
        const warmup = 10;
        const cooldown = 8;
        
        if (level === 'iniciante_A') {
          return [
            `${warmup} minutos: Aquecimento progressivo`,
            `1 minuto: Ritmo forte → 1 minuto recuperação`,
            `2 minutos: Ritmo forte → 1.5 minutos recuperação`,
            `3 minutos: Ritmo forte → 2 minutos recuperação`,
            `2 minutos: Ritmo forte → 1.5 minutos recuperação`,
            `1 minuto: Ritmo forte`,
            `${cooldown} minutos: Volta à calma`
          ];
        }
        return [
          `${warmup} minutos: Aquecimento progressivo`,
          `1 minuto: Ritmo forte → 1 minuto recuperação`,
          `2 minutos: Ritmo forte → 1.5 minutos recuperação`,
          `3 minutos: Ritmo forte → 2 minutos recuperação`,
          `4 minutos: Ritmo forte → 2 minutos recuperação`,
          `3 minutos: Ritmo forte → 2 minutos recuperação`,
          `2 minutos: Ritmo forte → 1.5 minutos recuperação`,
          `1 minuto: Ritmo forte`,
          `${cooldown} minutos: Volta à calma`
        ];
      },
      objective: 'Desenvolver capacidade de variar intensidade'
    }
  },

  LR: {
    steady_long: {
      name: 'Longão Estável',
      description: 'Corrida longa em ritmo constante',
      buildSteps: (duration, paces) => {
        const warmup = 8;
        const cooldown = 8;
        const mainTime = Math.max(duration - warmup - cooldown, 20);
        return [
          `${warmup} minutos: Aquecimento leve em Zona 1`,
          `${mainTime} minutos: Corrida contínua em Zona 2 (ritmo de conversa, constante)`,
          `${cooldown} minutos: Volta à calma e alongamento`
        ];
      },
      objective: 'Construção de resistência aeróbica'
    },
    progressive_long: {
      name: 'Longão Progressivo',
      description: 'Aumente o ritmo nos últimos 20%',
      buildSteps: (duration, paces) => {
        const warmup = 8;
        const cooldown = 8;
        const mainTime = Math.max(duration - warmup - cooldown, 20);
        const easyPortion = Math.round(mainTime * 0.75);
        const fastPortion = mainTime - easyPortion;
        return [
          `${warmup} minutos: Aquecimento em Zona 1`,
          `${easyPortion} minutos: Corrida em Zona 2 baixa (ritmo bem confortável)`,
          `${fastPortion} minutos: Aumente para Zona 2 alta / início de Zona 3`,
          `${cooldown} minutos: Volta à calma`
        ];
      },
      objective: 'Desenvolver finishing kick e resistência'
    },
    long_with_pickups: {
      name: 'Longão com Surtos',
      description: 'Corrida longa com acelerações periódicas',
      buildSteps: (duration, paces) => {
        const warmup = 8;
        const cooldown = 8;
        const mainTime = Math.max(duration - warmup - cooldown, 20);
        const pickups = Math.floor(mainTime / 12); // Um surto a cada ~12 minutos
        return [
          `${warmup} minutos: Aquecimento em Zona 1`,
          `${mainTime} minutos em Zona 2 com ${pickups} surtos:`,
          `A cada 12 minutos, faça 1 minuto em ritmo forte (Zona 3-4)`,
          `Volte ao ritmo de Zona 2 após cada surto`,
          `${cooldown} minutos: Volta à calma`
        ];
      },
      objective: 'Desenvolver mudança de ritmo em estado de fadiga'
    }
  }
};

/**
 * Calcula a duração total real baseada nas etapas do treino
 * Extrai os números de minutos de cada etapa e soma
 * @param {Array<string>} steps - Array de strings descrevendo cada etapa
 * @returns {number} Duração total em minutos
 */
const calculateRealDuration = (steps) => {
  let total = 0;
  let lastRepsCount = 0; // Para calcular recuperações
  
  for (const step of steps) {
    // Padrões para extrair minutos:
    // "5 minutos: ..." - formato básico
    // "6x: 3 minutos..." com "Recuperação: 2 minutos" - intervalos
    // "4 ciclos de: 2 minutos trote + 2 minutos caminhada" - ciclos
    
    // Verifica se é descrição de repetições (ex: "6x: 1 minuto")
    const repsMatch = step.match(/^(\d+)x:\s*(\d+(?:\.\d+)?)\s*minutos?/i);
    if (repsMatch) {
      const reps = parseInt(repsMatch[1]);
      const mins = parseFloat(repsMatch[2]);
      total += reps * mins;
      lastRepsCount = reps;
      continue;
    }
    
    // Verifica se é recuperação entre repetições (ex: "Recuperação: 2 minutos")
    const recoveryMatch = step.match(/Recuperação:\s*(\d+(?:\.\d+)?)\s*minutos?/i);
    if (recoveryMatch) {
      // Recuperação acontece (reps - 1) vezes
      const recoveryMins = parseFloat(recoveryMatch[1]);
      const recoveryCount = Math.max(lastRepsCount - 1, 0);
      total += recoveryCount * recoveryMins;
      continue;
    }
    
    // Verifica ciclos (ex: "4 ciclos de: 2 minutos trote + 2 minutos caminhada")
    const cycleMatch = step.match(/(\d+)\s*ciclos?\s*de:\s*(\d+)\s*minutos?\s*\+\s*(\d+)\s*minutos?/i);
    if (cycleMatch) {
      const cycles = parseInt(cycleMatch[1]);
      const time1 = parseInt(cycleMatch[2]);
      const time2 = parseInt(cycleMatch[3]);
      total += cycles * (time1 + time2);
      continue;
    }
    
    // Formato com seta (ex: "3 minutos: Ritmo forte → 2 minutos recuperação")
    const arrowMatch = step.match(/^(\d+(?:\.\d+)?)\s*minutos?.*?→\s*(\d+(?:\.\d+)?)\s*minutos?/i);
    if (arrowMatch) {
      total += parseFloat(arrowMatch[1]) + parseFloat(arrowMatch[2]);
      continue;
    }
    
    // Formato padrão: número no início da string
    const basicMatch = step.match(/^(\d+(?:\.\d+)?)\s*minutos?/i);
    if (basicMatch) {
      total += parseFloat(basicMatch[1]);
    }
  }
  
  return Math.round(total);
};

/**
 * Histórico de variações usadas para evitar repetição
 * Mantém as últimas 3 variações de cada tipo
 */
const variationHistory = {};

/**
 * Seleciona uma variação para o tipo de treino, evitando repetição
 * @param {string} workoutType - Tipo do treino (Z2, T, I, LR, Z1)
 * @param {number} weekNumber - Número da semana para determinismo
 * @param {string} blockName - Nome do bloco atual
 * @returns {string} ID da variação selecionada
 */
export const selectVariation = (workoutType, weekNumber, blockName) => {
  const variations = WORKOUT_VARIATIONS[workoutType];
  if (!variations) return null;

  const variationIds = Object.keys(variations);
  
  // Para Z1, sempre usar a mesma variação
  if (workoutType === 'Z1') {
    return 'recovery_run';
  }

  // Selecionar baseado na semana para ter determinismo
  // Mas também considerar o bloco para mais variação
  const blockOffset = blockName === 'base' ? 0 : blockName === 'build' ? 1 : 2;
  const index = (weekNumber + blockOffset) % variationIds.length;
  
  return variationIds[index];
};

/**
 * Constrói um treino completo com variação
 * @param {Object} params - Parâmetros do treino
 * @returns {Object} Treino construído
 */
export const buildVariedWorkout = ({ 
  type, 
  duration, 
  paces, 
  level, 
  weekNumber, 
  blockName 
}) => {
  const variations = WORKOUT_VARIATIONS[type];
  if (!variations) {
    throw new Error(`Tipo de treino desconhecido: ${type}`);
  }

  const variationId = selectVariation(type, weekNumber, blockName);
  const variation = variations[variationId];
  
  const pace_range = getPaceRangeForType(type, paces);
  
  if (!variation) {
    // Fallback para primeira variação
    const firstVariation = Object.values(variations)[0];
    const steps = firstVariation.buildSteps(duration, paces, level);
    const realDuration = calculateRealDuration(steps);
    return {
      type,
      variationId: Object.keys(variations)[0],
      name: firstVariation.name,
      description: firstVariation.description,
      duration_min: realDuration,
      steps,
      objective: firstVariation.objective,
      pace_range
    };
  }

  const steps = variation.buildSteps(duration, paces, level);
  const realDuration = calculateRealDuration(steps);

  return {
    type,
    variationId,
    name: variation.name,
    description: variation.description,
    duration_min: realDuration,
    steps,
    objective: variation.objective,
    pace_range
  };
};

/**
 * Retorna o range de pace para o tipo de treino
 */
const getPaceRangeForType = (type, paces) => {
  switch (type) {
    case 'Z1':
      return paces.z1 || { min_s_per_km: paces.z2?.max_s_per_km + 30, max_s_per_km: paces.z2?.max_s_per_km + 60 };
    case 'Z2':
      return paces.z2;
    case 'T':
      return { min_s_per_km: paces.t_s_per_km, max_s_per_km: paces.t_s_per_km };
    case 'I':
      return { min_s_per_km: paces.i_s_per_km, max_s_per_km: paces.i_s_per_km };
    case 'LR':
      return paces.long_run || paces.z2;
    default:
      return paces.z2;
  }
};

/**
 * Lista todas as variações disponíveis para um tipo
 * @param {string} workoutType - Tipo do treino
 * @returns {Array} Lista de variações
 */
export const getVariationsForType = (workoutType) => {
  const variations = WORKOUT_VARIATIONS[workoutType];
  if (!variations) return [];
  
  return Object.entries(variations).map(([id, variation]) => ({
    id,
    name: variation.name,
    description: variation.description,
    objective: variation.objective
  }));
};

export default {
  WORKOUT_VARIATIONS,
  selectVariation,
  buildVariedWorkout,
  getVariationsForType
};
