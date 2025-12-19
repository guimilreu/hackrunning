/**
 * Valida CPF segundo o algoritmo brasileiro
 * @param {string} cpf - CPF com ou sem formatação
 * @returns {boolean} - true se válido, false se inválido
 */
export const validateCPF = (cpf) => {
  if (!cpf) return false;
  
  // Remove formatação
  const cleanCPF = cpf.replace(/\D/g, '');
  
  // Verifica se tem 11 dígitos
  if (cleanCPF.length !== 11) return false;
  
  // Verifica se todos os dígitos são iguais (ex: 111.111.111-11)
  if (/^(\d)\1{10}$/.test(cleanCPF)) return false;
  
  // Validação do primeiro dígito verificador
  let sum = 0;
  for (let i = 0; i < 9; i++) {
    sum += parseInt(cleanCPF.charAt(i)) * (10 - i);
  }
  let remainder = 11 - (sum % 11);
  let digit1 = remainder >= 10 ? 0 : remainder;
  
  if (digit1 !== parseInt(cleanCPF.charAt(9))) return false;
  
  // Validação do segundo dígito verificador
  sum = 0;
  for (let i = 0; i < 10; i++) {
    sum += parseInt(cleanCPF.charAt(i)) * (11 - i);
  }
  remainder = 11 - (sum % 11);
  let digit2 = remainder >= 10 ? 0 : remainder;
  
  if (digit2 !== parseInt(cleanCPF.charAt(10))) return false;
  
  return true;
};

/**
 * Valida CNPJ segundo o algoritmo brasileiro
 * @param {string} cnpj - CNPJ com ou sem formatação
 * @returns {boolean} - true se válido, false se inválido
 */
export const validateCNPJ = (cnpj) => {
  if (!cnpj) return false;
  
  // Remove formatação
  const cleanCNPJ = cnpj.replace(/\D/g, '');
  
  // Verifica se tem 14 dígitos
  if (cleanCNPJ.length !== 14) return false;
  
  // Verifica se todos os dígitos são iguais
  if (/^(\d)\1{13}$/.test(cleanCNPJ)) return false;
  
  // Validação do primeiro dígito verificador
  let length = cleanCNPJ.length - 2;
  let numbers = cleanCNPJ.substring(0, length);
  const digits = cleanCNPJ.substring(length);
  let sum = 0;
  let pos = length - 7;
  
  for (let i = length; i >= 1; i--) {
    sum += parseInt(numbers.charAt(length - i)) * pos--;
    if (pos < 2) pos = 9;
  }
  
  let result = sum % 11 < 2 ? 0 : 11 - (sum % 11);
  if (result !== parseInt(digits.charAt(0))) return false;
  
  // Validação do segundo dígito verificador
  length = length + 1;
  numbers = cleanCNPJ.substring(0, length);
  sum = 0;
  pos = length - 7;
  
  for (let i = length; i >= 1; i--) {
    sum += parseInt(numbers.charAt(length - i)) * pos--;
    if (pos < 2) pos = 9;
  }
  
  result = sum % 11 < 2 ? 0 : 11 - (sum % 11);
  if (result !== parseInt(digits.charAt(1))) return false;
  
  return true;
};

/**
 * Valida CPF ou CNPJ
 * @param {string} value - CPF/CNPJ com ou sem formatação
 * @returns {boolean} - true se válido, false se inválido
 */
export const validateCPFOrCNPJ = (value) => {
  if (!value) return false;
  
  const clean = value.replace(/\D/g, '');
  
  if (clean.length === 11) {
    return validateCPF(clean);
  } else if (clean.length === 14) {
    return validateCNPJ(clean);
  }
  
  return false;
};
