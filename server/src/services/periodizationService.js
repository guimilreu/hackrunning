/**
 * Serviço de Periodização de Treinos
 * Implementa periodização por blocos com ondulação semanal
 * Estrutura: 3 blocos de 4 semanas (Base, Build, Peak) = 12 semanas total
 */

/**
 * Definição dos tipos de bloco de treinamento
 * Cada bloco tem características específicas de volume e intensidade
 */
export const BLOCK_TYPES = {
  BASE: {
    name: 'base',
    weeks: 4,
    z2Ratio: 0.80, // 80% do volume em Z2
    intensityAllowed: false, // Sem treinos de alta intensidade
    volumeProgression: [1.0, 1.08, 1.15, 0.70], // Semana 4 = deload (70%)
    description: 'Construção de base aeróbica',
    allowedWorkoutTypes: ['Z2', 'Z1', 'LR']
  },
  BUILD: {
    name: 'build',
    weeks: 4,
    z2Ratio: 0.70, // 70% do volume em Z2
    intensityAllowed: true, // Permite treinos de limiar
    volumeProgression: [1.0, 1.06, 1.12, 0.75],
    description: 'Introdução de trabalho de limiar',
    allowedWorkoutTypes: ['Z2', 'Z1', 'T', 'LR']
  },
  PEAK: {
    name: 'peak',
    weeks: 4,
    z2Ratio: 0.60, // 60% do volume em Z2
    intensityAllowed: true, // Permite intervalados
    volumeProgression: [1.0, 1.04, 1.08, 0.65],
    description: 'Trabalho de VO2max e velocidade',
    allowedWorkoutTypes: ['Z2', 'Z1', 'T', 'I', 'LR']
  }
};

/**
 * Ordem dos blocos no mesociclo
 */
export const BLOCK_SEQUENCE = ['BASE', 'BUILD', 'PEAK'];

/**
 * Gera a estrutura completa de um mesociclo (12 semanas)
 * @param {Object} params - Parâmetros para geração
 * @param {number} params.baseWeekMinutes - Volume base semanal em minutos
 * @param {number} params.daysPerWeek - Dias de treino por semana
 * @param {string} params.level - Nível do runner (iniciante_A, iniciante_B, intermediario)
 * @param {boolean} params.canDoIntensity - Se pode fazer treinos intensos
 * @param {boolean} params.canDoLongRun - Se pode fazer longão
 * @returns {Array} Array de semanas com configurações
 */
export const generateMesocycle = ({ baseWeekMinutes, daysPerWeek, level, canDoIntensity, canDoLongRun }) => {
  const weeks = [];
  let weekNumber = 1;
  let accumulatedVolumeGrowth = 1.0;

  for (const blockName of BLOCK_SEQUENCE) {
    const block = BLOCK_TYPES[blockName];
    
    // Verificar se o nível permite intensidade
    const blockIntensityAllowed = block.intensityAllowed && canDoIntensity;
    
    for (let weekInBlock = 0; weekInBlock < block.weeks; weekInBlock++) {
      const isDeloadWeek = weekInBlock === block.weeks - 1;
      const volumeMultiplier = block.volumeProgression[weekInBlock];
      
      // Volume cresce 5% a cada bloco (exceto deload)
      const blockGrowthFactor = BLOCK_SEQUENCE.indexOf(blockName) * 0.05;
      const weekVolume = Math.round(baseWeekMinutes * volumeMultiplier * (1 + blockGrowthFactor));
      
      weeks.push({
        weekNumber,
        blockName: block.name,
        weekInBlock: weekInBlock + 1,
        isDeloadWeek,
        volumeMinutes: weekVolume,
        volumeMultiplier,
        z2Ratio: block.z2Ratio,
        intensityAllowed: blockIntensityAllowed,
        canDoLongRun,
        allowedWorkoutTypes: getWeekAllowedTypes(block, blockIntensityAllowed, canDoLongRun, isDeloadWeek),
        description: isDeloadWeek ? 'Semana de recuperação' : block.description
      });
      
      weekNumber++;
    }
  }

  return weeks;
};

/**
 * Determina os tipos de treino permitidos para uma semana específica
 */
const getWeekAllowedTypes = (block, intensityAllowed, canDoLongRun, isDeloadWeek) => {
  if (isDeloadWeek) {
    // Em semana de deload, apenas treinos leves
    return ['Z2', 'Z1'];
  }

  const types = ['Z2', 'Z1'];
  
  if (intensityAllowed) {
    if (block.allowedWorkoutTypes.includes('T')) types.push('T');
    if (block.allowedWorkoutTypes.includes('I')) types.push('I');
  }
  
  if (canDoLongRun && block.allowedWorkoutTypes.includes('LR')) {
    types.push('LR');
  }

  return types;
};

/**
 * Gera o template semanal de treinos baseado no bloco atual
 * @param {Object} weekConfig - Configuração da semana
 * @param {number} daysPerWeek - Número de dias de treino
 * @returns {Array} Array de tipos de treino para cada dia
 */
export const generateWeekTemplate = (weekConfig, daysPerWeek) => {
  const { blockName, isDeloadWeek, intensityAllowed, canDoLongRun, weekInBlock } = weekConfig;
  
  // Templates específicos por bloco e número de dias
  if (isDeloadWeek) {
    return generateDeloadTemplate(daysPerWeek, canDoLongRun);
  }

  switch (blockName) {
    case 'base':
      return generateBaseBlockTemplate(daysPerWeek, canDoLongRun, weekInBlock);
    case 'build':
      return generateBuildBlockTemplate(daysPerWeek, canDoLongRun, weekInBlock);
    case 'peak':
      return generatePeakBlockTemplate(daysPerWeek, canDoLongRun, weekInBlock);
    default:
      return generateBaseBlockTemplate(daysPerWeek, canDoLongRun, weekInBlock);
  }
};

/**
 * Template para semana de deload (recuperação)
 */
const generateDeloadTemplate = (daysPerWeek, canDoLongRun) => {
  const templates = {
    2: ['Z2', canDoLongRun ? 'LR' : 'Z2'],
    3: ['Z2', 'Z1', canDoLongRun ? 'LR' : 'Z2'],
    4: ['Z2', 'Z1', 'Z2', canDoLongRun ? 'LR' : 'Z2'],
    5: ['Z2', 'Z1', 'Z2', 'Z1', canDoLongRun ? 'LR' : 'Z2'],
    6: ['Z2', 'Z1', 'Z2', 'Z1', 'Z2', canDoLongRun ? 'LR' : 'Z2']
  };
  return templates[daysPerWeek] || templates[3];
};

/**
 * Template para bloco BASE (foco aeróbico)
 * Sem intensidade, apenas Z2 e Longão
 */
const generateBaseBlockTemplate = (daysPerWeek, canDoLongRun, weekInBlock) => {
  // Variação baseada na semana dentro do bloco
  const variations = {
    2: {
      1: ['Z2', canDoLongRun ? 'LR' : 'Z2'],
      2: ['Z2', canDoLongRun ? 'LR' : 'Z2'],
      3: ['Z2', canDoLongRun ? 'LR' : 'Z2']
    },
    3: {
      1: ['Z2', 'Z2', canDoLongRun ? 'LR' : 'Z2'],
      2: ['Z2', 'Z2', canDoLongRun ? 'LR' : 'Z2'],
      3: ['Z2', 'Z1', canDoLongRun ? 'LR' : 'Z2']
    },
    4: {
      1: ['Z2', 'Z2', 'Z1', canDoLongRun ? 'LR' : 'Z2'],
      2: ['Z2', 'Z2', 'Z2', canDoLongRun ? 'LR' : 'Z2'],
      3: ['Z2', 'Z1', 'Z2', canDoLongRun ? 'LR' : 'Z2']
    },
    5: {
      1: ['Z2', 'Z2', 'Z1', 'Z2', canDoLongRun ? 'LR' : 'Z2'],
      2: ['Z2', 'Z2', 'Z2', 'Z1', canDoLongRun ? 'LR' : 'Z2'],
      3: ['Z2', 'Z1', 'Z2', 'Z2', canDoLongRun ? 'LR' : 'Z2']
    },
    6: {
      1: ['Z2', 'Z2', 'Z1', 'Z2', 'Z2', canDoLongRun ? 'LR' : 'Z2'],
      2: ['Z2', 'Z2', 'Z2', 'Z1', 'Z2', canDoLongRun ? 'LR' : 'Z2'],
      3: ['Z2', 'Z1', 'Z2', 'Z2', 'Z1', canDoLongRun ? 'LR' : 'Z2']
    }
  };

  return variations[daysPerWeek]?.[weekInBlock] || variations[3][1];
};

/**
 * Template para bloco BUILD (introdução de limiar)
 * Adiciona treinos de Threshold
 */
const generateBuildBlockTemplate = (daysPerWeek, canDoLongRun, weekInBlock) => {
  const variations = {
    2: {
      1: ['Z2', canDoLongRun ? 'LR' : 'Z2'],
      2: ['T', canDoLongRun ? 'LR' : 'Z2'],
      3: ['Z2', canDoLongRun ? 'LR' : 'T']
    },
    3: {
      1: ['Z2', 'T', canDoLongRun ? 'LR' : 'Z2'],
      2: ['Z2', 'T', canDoLongRun ? 'LR' : 'Z2'],
      3: ['T', 'Z2', canDoLongRun ? 'LR' : 'Z2']
    },
    4: {
      1: ['Z2', 'T', 'Z1', canDoLongRun ? 'LR' : 'Z2'],
      2: ['Z2', 'T', 'Z2', canDoLongRun ? 'LR' : 'Z2'],
      3: ['T', 'Z2', 'Z1', canDoLongRun ? 'LR' : 'Z2']
    },
    5: {
      1: ['Z2', 'T', 'Z1', 'Z2', canDoLongRun ? 'LR' : 'Z2'],
      2: ['Z2', 'T', 'Z2', 'T', canDoLongRun ? 'LR' : 'Z2'],
      3: ['T', 'Z2', 'Z1', 'Z2', canDoLongRun ? 'LR' : 'Z2']
    },
    6: {
      1: ['Z2', 'T', 'Z1', 'Z2', 'Z2', canDoLongRun ? 'LR' : 'Z2'],
      2: ['Z2', 'T', 'Z2', 'T', 'Z1', canDoLongRun ? 'LR' : 'Z2'],
      3: ['T', 'Z2', 'Z1', 'Z2', 'T', canDoLongRun ? 'LR' : 'Z2']
    }
  };

  return variations[daysPerWeek]?.[weekInBlock] || variations[3][1];
};

/**
 * Template para bloco PEAK (VO2max e velocidade)
 * Adiciona intervalados
 */
const generatePeakBlockTemplate = (daysPerWeek, canDoLongRun, weekInBlock) => {
  const variations = {
    2: {
      1: ['I', canDoLongRun ? 'LR' : 'Z2'],
      2: ['T', canDoLongRun ? 'LR' : 'Z2'],
      3: ['I', canDoLongRun ? 'LR' : 'T']
    },
    3: {
      1: ['Z2', 'I', canDoLongRun ? 'LR' : 'Z2'],
      2: ['Z2', 'T', canDoLongRun ? 'LR' : 'I'],
      3: ['I', 'Z2', canDoLongRun ? 'LR' : 'T']
    },
    4: {
      1: ['Z2', 'I', 'Z1', canDoLongRun ? 'LR' : 'T'],
      2: ['Z2', 'T', 'I', canDoLongRun ? 'LR' : 'Z2'],
      3: ['I', 'Z2', 'T', canDoLongRun ? 'LR' : 'Z2']
    },
    5: {
      1: ['Z2', 'I', 'Z1', 'T', canDoLongRun ? 'LR' : 'Z2'],
      2: ['Z2', 'T', 'Z2', 'I', canDoLongRun ? 'LR' : 'Z2'],
      3: ['I', 'Z2', 'T', 'Z1', canDoLongRun ? 'LR' : 'Z2']
    },
    6: {
      1: ['Z2', 'I', 'Z1', 'T', 'Z2', canDoLongRun ? 'LR' : 'Z2'],
      2: ['Z2', 'T', 'Z2', 'I', 'Z1', canDoLongRun ? 'LR' : 'Z2'],
      3: ['I', 'Z2', 'T', 'Z2', 'Z1', canDoLongRun ? 'LR' : 'Z2']
    }
  };

  return variations[daysPerWeek]?.[weekInBlock] || variations[3][1];
};

/**
 * Calcula distribuição de volume entre os treinos da semana
 * @param {number} weekVolume - Volume total da semana em minutos
 * @param {Array} template - Template de tipos de treino
 * @returns {Array} Array com duração de cada treino
 */
export const distributeWeeklyVolume = (weekVolume, template) => {
  // Pesos para distribuição de volume por tipo de treino
  const typeWeights = {
    'Z2': 1.0,
    'Z1': 0.7,
    'T': 0.9,
    'I': 0.8,
    'LR': 1.4 // Longão recebe mais tempo
  };

  const totalWeight = template.reduce((sum, type) => sum + typeWeights[type], 0);
  
  return template.map(type => {
    const weight = typeWeights[type];
    return Math.round((weekVolume * weight) / totalWeight);
  });
};

/**
 * Verifica se uma semana é de deload
 * @param {number} weekNumber - Número da semana (1-12)
 * @returns {boolean}
 */
export const isDeloadWeek = (weekNumber) => {
  // Semanas 4, 8, 12 são deload
  return weekNumber % 4 === 0;
};

/**
 * Retorna o bloco atual baseado no número da semana
 * @param {number} weekNumber - Número da semana (1-12)
 * @returns {Object} Configuração do bloco
 */
export const getBlockForWeek = (weekNumber) => {
  if (weekNumber <= 4) return BLOCK_TYPES.BASE;
  if (weekNumber <= 8) return BLOCK_TYPES.BUILD;
  return BLOCK_TYPES.PEAK;
};

/**
 * Retorna nome do bloco baseado no número da semana
 * @param {number} weekNumber - Número da semana (1-12)
 * @returns {string}
 */
export const getBlockNameForWeek = (weekNumber) => {
  if (weekNumber <= 4) return 'base';
  if (weekNumber <= 8) return 'build';
  return 'peak';
};

export default {
  BLOCK_TYPES,
  BLOCK_SEQUENCE,
  generateMesocycle,
  generateWeekTemplate,
  distributeWeeklyVolume,
  isDeloadWeek,
  getBlockForWeek,
  getBlockNameForWeek
};
