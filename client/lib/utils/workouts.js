/**
 * Traduz tipos de treino técnicos para nomes amigáveis em português
 * @param {string} workoutType - Tipo técnico do treino (base, pace, interval, etc)
 * @returns {string} Nome amigável em português
 */
export function formatWorkoutType(workoutType) {
  if (!workoutType) return 'Treino';
  
  const typeMap = {
    'base': 'Corrida Leve',
    'pace': 'Ritmo Controlado',
    'interval': 'Tiros / Intervalado',
    'long_run': 'Longão',
    'recovery': 'Regenerativo',
    'strength': 'Fortalecimento',
    // Novos tipos de zona
    'Z1': 'Zona 1 - Regenerativa',
    'Z2': 'Zona 2 - Aeróbica',
    'T': 'Threshold - Limiar',
    'I': 'Intervalado - VO2',
    'R': 'Rápido - Velocidade',
    'LR': 'Longão',
    // Fallbacks para variações
    'long': 'Longão',
    'easy': 'Corrida Leve',
    'tempo': 'Ritmo Controlado',
    'progression': 'Progressivo',
    'race_pace': 'Ritmo de Prova',
  };
  
  return typeMap[workoutType] || workoutType;
}

/**
 * Retorna uma descrição curta do tipo de treino
 * @param {string} workoutType - Tipo técnico do treino
 * @returns {string} Descrição curta
 */
export function getWorkoutTypeDescription(workoutType) {
  if (!workoutType) return '';
  
  const descriptions = {
    'base': 'Corrida em ritmo confortável para desenvolver base aeróbica',
    'pace': 'Corrida em ritmo controlado, próximo ao ritmo de prova',
    'interval': 'Treino com alternância de ritmo rápido e recuperação',
    'long_run': 'Corrida longa para desenvolver resistência',
    'recovery': 'Corrida leve para recuperação ativa',
    'strength': 'Treino de força e fortalecimento muscular',
    // Novos tipos de zona
    'Z1': 'Ritmo muito leve para recuperação ativa. Você consegue conversar facilmente.',
    'Z2': 'Ritmo confortável onde você desenvolve a base aeróbica. Consegue manter uma conversa.',
    'T': 'Ritmo forte mas sustentável. Melhora seu limiar de lactato. Consegue falar frases curtas.',
    'I': 'Alta intensidade para melhorar VO2 máx. Recuperação ativa entre intervalos.',
    'R': 'Velocidade máxima para melhorar economia de corrida. Tiros curtos com recuperação completa.',
    'LR': 'Corrida longa em ritmo confortável para construir resistência e base aeróbica.',
  };
  
  return descriptions[workoutType] || '';
}

