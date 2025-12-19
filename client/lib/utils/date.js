import { format as formatDate } from 'date-fns';
import { ptBR } from 'date-fns/locale';

/**
 * Formata uma data de forma segura, retornando string vazia se a data for inválida
 * @param {string|Date|number} date - Data para formatar
 * @param {string} formatStr - Formato desejado (ex: 'dd/MM/yyyy')
 * @param {object} options - Opções adicionais (ex: { locale: ptBR })
 * @returns {string} Data formatada ou string vazia se inválida
 */
export function safeFormatDate(date, formatStr, options = {}) {
  if (!date) return '';
  
  try {
    const dateObj = date instanceof Date ? date : new Date(date);
    
    // Verifica se a data é válida
    if (isNaN(dateObj.getTime())) {
      return '';
    }
    
    return formatDate(dateObj, formatStr, { locale: ptBR, ...options });
  } catch (error) {
    console.warn('Erro ao formatar data:', error);
    return '';
  }
}
