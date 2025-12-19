import { asaasConfig } from '../config/asaas.js';
import { logger } from '../utils/logger.js';
import { validateCPFOrCNPJ } from '../utils/validators.js';

const BASE_URL = asaasConfig.baseUrl;
const API_KEY = asaasConfig.apiKey;

/**
 * Classe de erro customizada para a API Asaas
 */
class AsaasAPIError extends Error {
  constructor(message, code, errors = []) {
    super(message);
    this.name = 'AsaasAPIError';
    this.code = code;
    this.errors = errors;
  }
}

/**
 * Faz requisição para a API do Asaas
 */
const asaasRequest = async (endpoint, options = {}) => {
  const url = `${BASE_URL}${endpoint}`;
  
  try {
    const response = await fetch(url, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        'access_token': API_KEY,
        ...options.headers
      }
    });

    const data = await response.json();

    if (!response.ok) {
      const errorMessage = data.errors?.[0]?.description || 'Erro na API do Asaas';
      const errorCode = data.errors?.[0]?.code || 'unknown_error';
      
      logger.error('Asaas API Error:', { 
        endpoint, 
        status: response.status, 
        errors: data.errors 
      });
      
      throw new AsaasAPIError(errorMessage, errorCode, data.errors);
    }

    return data;
  } catch (error) {
    if (error instanceof AsaasAPIError) {
      throw error;
    }
    
    logger.error('Asaas Request Error:', { endpoint, error: error.message });
    throw new AsaasAPIError(
      'Erro ao comunicar com API do Asaas',
      'network_error',
      [{ description: error.message }]
    );
  }
};

// ========== CUSTOMERS ==========

/**
 * Criar cliente no Asaas
 */
export const createCustomer = async (userData) => {
  // Log dos dados recebidos para debug
  logger.info('Creating Asaas customer with data:', {
    userId: userData._id,
    hasCpf: !!userData.cpf,
    cpfValue: userData.cpf,
    cpfLength: userData.cpf?.length || 0
  });

  const customerData = {
    name: userData.name,
    email: userData.email,
    phone: userData.phone?.replace(/\D/g, ''),
    mobilePhone: userData.mobilePhone?.replace(/\D/g, '') || userData.phone?.replace(/\D/g, ''),
    externalReference: userData._id?.toString(),
    notificationDisabled: userData.notificationDisabled || false
  };

  // Adicionar CPF apenas se fornecido e válido
  if (userData.cpf) {
    const cpfClean = userData.cpf.replace(/\D/g, '');
    logger.info('CPF validation:', { original: userData.cpf, clean: cpfClean, length: cpfClean.length });
    
    // Validar CPF/CNPJ com algoritmo correto
    if (!validateCPFOrCNPJ(cpfClean)) {
      const errorMsg = `CPF/CNPJ inválido: ${cpfClean}`;
      logger.error(errorMsg);
      throw new AsaasAPIError(
        'CPF/CNPJ inválido. Por favor, verifique os dígitos.',
        'invalid_cpf_cnpj',
        [{ code: 'invalid_cpf_cnpj', description: errorMsg }]
      );
    }
    
    if (cpfClean.length === 11 || cpfClean.length === 14) {
      customerData.cpfCnpj = cpfClean;
    } else {
      logger.warn('Invalid CPF length, skipping:', { cpf: userData.cpf, cleanLength: cpfClean.length });
    }
  } else {
    logger.warn('No CPF provided for customer creation');
  }

  // Adicionar endereço apenas se fornecido
  if (userData.address) {
    if (userData.address.zipCode) customerData.postalCode = userData.address.zipCode.replace(/\D/g, '');
    if (userData.address.street) customerData.address = userData.address.street;
    if (userData.address.number) customerData.addressNumber = userData.address.number;
    if (userData.address.complement) customerData.complement = userData.address.complement;
    if (userData.address.neighborhood) customerData.province = userData.address.neighborhood;
    // Nota: O Asaas infere cidade e estado do CEP, mas manteremos os dados completos no nosso banco
    // para garantir que temos todas as informações necessárias para envio físico
  }

  // Adicionar campos opcionais apenas se fornecidos
  if (userData.additionalEmails) customerData.additionalEmails = userData.additionalEmails;
  if (userData.observations) customerData.observations = userData.observations;

  // Remove campos undefined ou vazios
  Object.keys(customerData).forEach(key => 
    (customerData[key] === undefined || customerData[key] === '') && delete customerData[key]
  );

  // Log do payload final
  logger.info('Final customer payload:', { 
    ...customerData, 
    cpfCnpj: customerData.cpfCnpj ? `${customerData.cpfCnpj.substring(0, 3)}***` : 'none' 
  });

  try {
    const customer = await asaasRequest('/customers', {
      method: 'POST',
      body: JSON.stringify(customerData)
    });

    logger.info('Asaas customer created:', { customerId: customer.id, userId: userData._id });
    return customer;
  } catch (error) {
    logger.error('Error creating Asaas customer:', error);
    throw error;
  }
};

/**
 * Atualizar cliente no Asaas
 */
export const updateCustomer = async (customerId, userData) => {
  const customerData = {
    name: userData.name,
    email: userData.email,
    cpfCnpj: userData.cpf?.replace(/\D/g, ''),
    phone: userData.phone?.replace(/\D/g, ''),
    mobilePhone: userData.mobilePhone?.replace(/\D/g, ''),
    postalCode: userData.address?.zipCode?.replace(/\D/g, ''),
    address: userData.address?.street,
    addressNumber: userData.address?.number,
    complement: userData.address?.complement,
    province: userData.address?.neighborhood,
    // Nota: O Asaas infere cidade e estado do CEP automaticamente
    notificationDisabled: userData.notificationDisabled,
    additionalEmails: userData.additionalEmails,
    observations: userData.observations
  };

  // Remove campos undefined
  Object.keys(customerData).forEach(key => 
    customerData[key] === undefined && delete customerData[key]
  );

  try {
    return await asaasRequest(`/customers/${customerId}`, {
      method: 'PUT',
      body: JSON.stringify(customerData)
    });
  } catch (error) {
    logger.error('Error updating Asaas customer:', error);
    throw error;
  }
};

/**
 * Buscar cliente por ID
 */
export const getCustomer = async (customerId) => {
  try {
    return await asaasRequest(`/customers/${customerId}`);
  } catch (error) {
    logger.error('Error getting Asaas customer:', error);
    throw error;
  }
};

/**
 * Buscar cliente por ID externo (userId)
 */
export const findCustomerByExternalRef = async (userId) => {
  try {
    const response = await asaasRequest(`/customers?externalReference=${userId}`);
    return response.data?.[0] || null;
  } catch (error) {
    logger.error('Error finding Asaas customer:', error);
    return null;
  }
};

/**
 * Listar clientes
 */
export const listCustomers = async (filters = {}) => {
  try {
    const queryParams = new URLSearchParams(filters).toString();
    const endpoint = `/customers${queryParams ? `?${queryParams}` : ''}`;
    return await asaasRequest(endpoint);
  } catch (error) {
    logger.error('Error listing Asaas customers:', error);
    throw error;
  }
};

/**
 * Deletar cliente
 */
export const deleteCustomer = async (customerId) => {
  try {
    return await asaasRequest(`/customers/${customerId}`, {
      method: 'DELETE'
    });
  } catch (error) {
    logger.error('Error deleting Asaas customer:', error);
    throw error;
  }
};

/**
 * Restaurar cliente removido
 */
export const restoreCustomer = async (customerId) => {
  try {
    return await asaasRequest(`/customers/${customerId}/restore`, {
      method: 'POST'
    });
  } catch (error) {
    logger.error('Error restoring Asaas customer:', error);
    throw error;
  }
};

// ========== PAYMENTS ==========

/**
 * Criar cobrança única
 */
export const createPayment = async (paymentData) => {
  const payload = {
    customer: paymentData.customer,
    billingType: paymentData.billingType || 'UNDEFINED',
    value: paymentData.value,
    dueDate: paymentData.dueDate || new Date().toISOString().split('T')[0],
    description: paymentData.description,
    externalReference: paymentData.externalReference,
    installmentCount: paymentData.installmentCount,
    installmentValue: paymentData.installmentValue,
    discount: paymentData.discount,
    interest: paymentData.interest,
    fine: paymentData.fine,
    postalService: paymentData.postalService || false,
    split: paymentData.split,
    callback: paymentData.callback
  };

  // Remove campos undefined
  Object.keys(payload).forEach(key => 
    payload[key] === undefined && delete payload[key]
  );

  try {
    const payment = await asaasRequest('/payments', {
      method: 'POST',
      body: JSON.stringify(payload)
    });

    logger.info('Asaas payment created:', { paymentId: payment.id, value: payment.value });
    return payment;
  } catch (error) {
    logger.error('Error creating Asaas payment:', error);
    throw error;
  }
};

/**
 * Criar cobrança com cartão de crédito
 */
export const createPaymentWithCreditCard = async (paymentData) => {
  const payload = {
    customer: paymentData.customer,
    billingType: 'CREDIT_CARD',
    value: paymentData.value,
    dueDate: paymentData.dueDate || new Date().toISOString().split('T')[0],
    description: paymentData.description,
    externalReference: paymentData.externalReference,
    creditCard: paymentData.creditCard,
    creditCardHolderInfo: paymentData.creditCardHolderInfo,
    remoteIp: paymentData.remoteIp,
    split: paymentData.split,
    callback: paymentData.callback
  };

  // Remove campos undefined
  Object.keys(payload).forEach(key => 
    payload[key] === undefined && delete payload[key]
  );

  try {
    return await asaasRequest('/payments', {
      method: 'POST',
      body: JSON.stringify(payload)
    });
  } catch (error) {
    logger.error('Error creating payment with credit card:', error);
    throw error;
  }
};

/**
 * Buscar cobrança por ID
 */
export const getPayment = async (paymentId) => {
  try {
    return await asaasRequest(`/payments/${paymentId}`);
  } catch (error) {
    logger.error('Error getting Asaas payment:', error);
    throw error;
  }
};

/**
 * Atualizar cobrança
 */
export const updatePayment = async (paymentId, paymentData) => {
  const payload = {
    billingType: paymentData.billingType,
    value: paymentData.value,
    dueDate: paymentData.dueDate,
    description: paymentData.description,
    externalReference: paymentData.externalReference,
    discount: paymentData.discount,
    interest: paymentData.interest,
    fine: paymentData.fine
  };

  // Remove campos undefined
  Object.keys(payload).forEach(key => 
    payload[key] === undefined && delete payload[key]
  );

  try {
    return await asaasRequest(`/payments/${paymentId}`, {
      method: 'PUT',
      body: JSON.stringify(payload)
    });
  } catch (error) {
    logger.error('Error updating payment:', error);
    throw error;
  }
};

/**
 * Listar cobranças
 */
export const listPayments = async (filters = {}) => {
  try {
    const queryParams = new URLSearchParams(filters).toString();
    const endpoint = `/payments${queryParams ? `?${queryParams}` : ''}`;
    return await asaasRequest(endpoint);
  } catch (error) {
    logger.error('Error listing payments:', error);
    throw error;
  }
};

/**
 * Deletar cobrança
 */
export const deletePayment = async (paymentId) => {
  try {
    return await asaasRequest(`/payments/${paymentId}`, {
      method: 'DELETE'
    });
  } catch (error) {
    logger.error('Error deleting payment:', error);
    throw error;
  }
};

/**
 * Restaurar cobrança removida
 */
export const restorePayment = async (paymentId) => {
  try {
    return await asaasRequest(`/payments/${paymentId}/restore`, {
      method: 'POST'
    });
  } catch (error) {
    logger.error('Error restoring payment:', error);
    throw error;
  }
};

/**
 * Buscar QR Code PIX
 */
export const getPixQrCode = async (paymentId) => {
  try {
    return await asaasRequest(`/payments/${paymentId}/pixQrCode`);
  } catch (error) {
    logger.error('Error getting PIX QR Code:', error);
    // Retornar null ao invés de lançar erro, pois o QR Code pode não estar disponível ainda
    return null;
  }
};

/**
 * Buscar informações completas de pagamento (incluindo PIX QR Code)
 */
export const getPaymentInfo = async (paymentId) => {
  try {
    const payment = await getPayment(paymentId);
    
    const paymentInfo = {
      id: payment.id,
      status: payment.status,
      value: payment.value,
      netValue: payment.netValue,
      dueDate: payment.dueDate,
      invoiceUrl: payment.invoiceUrl,
      bankSlipUrl: payment.bankSlipUrl,
      invoiceNumber: payment.invoiceNumber,
      nossoNumero: payment.nossoNumero,
      billingType: payment.billingType
    };

    // Se for PIX específico, buscar QR Code
    if (payment.billingType === 'PIX') {
      const pixInfo = await getPixQrCode(paymentId);
      if (pixInfo) {
        paymentInfo.pixQrCode = pixInfo.encodedImage;
        paymentInfo.pixCopyPaste = pixInfo.payload;
        paymentInfo.expirationDate = pixInfo.expirationDate;
      }
    }

    return paymentInfo;
  } catch (error) {
    logger.error('Error getting payment info:', error);
    throw error;
  }
};

/**
 * Estornar cobrança
 */
export const refundPayment = async (paymentId, value = null) => {
  try {
    const payload = value ? { value } : {};
    return await asaasRequest(`/payments/${paymentId}/refund`, {
      method: 'POST',
      body: JSON.stringify(payload)
    });
  } catch (error) {
    logger.error('Error refunding payment:', error);
    throw error;
  }
};

/**
 * Confirmar recebimento em dinheiro
 */
export const receiveInCash = async (paymentId, paymentDate = null, value = null) => {
  try {
    const payload = {
      paymentDate: paymentDate || new Date().toISOString().split('T')[0],
      value
    };
    
    if (!value) delete payload.value;
    
    return await asaasRequest(`/payments/${paymentId}/receiveInCash`, {
      method: 'POST',
      body: JSON.stringify(payload)
    });
  } catch (error) {
    logger.error('Error confirming cash payment:', error);
    throw error;
  }
};

/**
 * Desfazer recebimento em dinheiro
 */
export const undoReceiveInCash = async (paymentId) => {
  try {
    return await asaasRequest(`/payments/${paymentId}/undoReceivedInCash`, {
      method: 'POST'
    });
  } catch (error) {
    logger.error('Error undoing cash payment:', error);
    throw error;
  }
};

/**
 * Buscar linha digitável do boleto
 */
export const getIdentificationField = async (paymentId) => {
  try {
    return await asaasRequest(`/payments/${paymentId}/identificationField`);
  } catch (error) {
    logger.error('Error getting identification field:', error);
    throw error;
  }
};

/**
 * Buscar status de cobrança
 */
export const getPaymentStatus = async (paymentId) => {
  try {
    return await asaasRequest(`/payments/${paymentId}/status`);
  } catch (error) {
    logger.error('Error getting payment status:', error);
    throw error;
  }
};

// ========== SUBSCRIPTIONS ==========

/**
 * Criar assinatura recorrente
 */
export const createSubscription = async (subscriptionData) => {
  const payload = {
    customer: subscriptionData.customer,
    billingType: subscriptionData.billingType || 'UNDEFINED',
    value: subscriptionData.value,
    nextDueDate: subscriptionData.nextDueDate || new Date().toISOString().split('T')[0],
    cycle: subscriptionData.cycle || 'MONTHLY',
    description: subscriptionData.description,
    endDate: subscriptionData.endDate,
    maxPayments: subscriptionData.maxPayments,
    externalReference: subscriptionData.externalReference,
    discount: subscriptionData.discount,
    interest: subscriptionData.interest,
    fine: subscriptionData.fine,
    split: subscriptionData.split,
    callback: subscriptionData.callback
  };

  // Remove campos undefined
  Object.keys(payload).forEach(key => 
    payload[key] === undefined && delete payload[key]
  );

  try {
    const subscription = await asaasRequest('/subscriptions', {
      method: 'POST',
      body: JSON.stringify(payload)
    });

    logger.info('Asaas subscription created:', { subscriptionId: subscription.id });
    return subscription;
  } catch (error) {
    logger.error('Error creating Asaas subscription:', error);
    throw error;
  }
};

/**
 * Criar assinatura com cartão de crédito
 */
export const createSubscriptionWithCreditCard = async (subscriptionData) => {
  const payload = {
    customer: subscriptionData.customer,
    billingType: 'CREDIT_CARD',
    value: subscriptionData.value,
    nextDueDate: subscriptionData.nextDueDate || new Date().toISOString().split('T')[0],
    cycle: subscriptionData.cycle || 'MONTHLY',
    description: subscriptionData.description,
    endDate: subscriptionData.endDate,
    maxPayments: subscriptionData.maxPayments,
    externalReference: subscriptionData.externalReference,
    creditCard: subscriptionData.creditCard,
    creditCardHolderInfo: subscriptionData.creditCardHolderInfo,
    remoteIp: subscriptionData.remoteIp,
    split: subscriptionData.split
  };

  // Remove campos undefined
  Object.keys(payload).forEach(key => 
    payload[key] === undefined && delete payload[key]
  );

  try {
    return await asaasRequest('/subscriptions', {
      method: 'POST',
      body: JSON.stringify(payload)
    });
  } catch (error) {
    logger.error('Error creating subscription with credit card:', error);
    throw error;
  }
};

/**
 * Buscar assinatura por ID
 */
export const getSubscription = async (subscriptionId) => {
  try {
    return await asaasRequest(`/subscriptions/${subscriptionId}`);
  } catch (error) {
    logger.error('Error getting subscription:', error);
    throw error;
  }
};

/**
 * Atualizar assinatura
 */
export const updateSubscription = async (subscriptionId, subscriptionData) => {
  const payload = {
    billingType: subscriptionData.billingType,
    value: subscriptionData.value,
    nextDueDate: subscriptionData.nextDueDate,
    cycle: subscriptionData.cycle,
    description: subscriptionData.description,
    endDate: subscriptionData.endDate,
    externalReference: subscriptionData.externalReference,
    discount: subscriptionData.discount,
    interest: subscriptionData.interest,
    fine: subscriptionData.fine
  };

  // Remove campos undefined
  Object.keys(payload).forEach(key => 
    payload[key] === undefined && delete payload[key]
  );

  try {
    return await asaasRequest(`/subscriptions/${subscriptionId}`, {
      method: 'PUT',
      body: JSON.stringify(payload)
    });
  } catch (error) {
    logger.error('Error updating subscription:', error);
    throw error;
  }
};

/**
 * Listar assinaturas
 */
export const listSubscriptions = async (filters = {}) => {
  try {
    const queryParams = new URLSearchParams(filters).toString();
    const endpoint = `/subscriptions${queryParams ? `?${queryParams}` : ''}`;
    return await asaasRequest(endpoint);
  } catch (error) {
    logger.error('Error listing subscriptions:', error);
    throw error;
  }
};

/**
 * Deletar assinatura
 */
export const deleteSubscription = async (subscriptionId) => {
  try {
    return await asaasRequest(`/subscriptions/${subscriptionId}`, {
      method: 'DELETE'
    });
  } catch (error) {
    logger.error('Error deleting subscription:', error);
    throw error;
  }
};

/**
 * Listar pagamentos de uma assinatura
 */
export const listSubscriptionPayments = async (subscriptionId, filters = {}) => {
  try {
    const queryParams = new URLSearchParams(filters).toString();
    const endpoint = `/subscriptions/${subscriptionId}/payments${queryParams ? `?${queryParams}` : ''}`;
    return await asaasRequest(endpoint);
  } catch (error) {
    logger.error('Error listing subscription payments:', error);
    throw error;
  }
};

// ========== INSTALLMENTS ==========

/**
 * Criar parcelamento
 */
export const createInstallment = async (installmentData) => {
  const payload = {
    customer: installmentData.customer,
    billingType: installmentData.billingType || 'UNDEFINED',
    value: installmentData.value,
    dueDate: installmentData.dueDate,
    description: installmentData.description,
    externalReference: installmentData.externalReference,
    installmentCount: installmentData.installmentCount,
    installmentValue: installmentData.installmentValue,
    discount: installmentData.discount,
    interest: installmentData.interest,
    fine: installmentData.fine,
    postalService: installmentData.postalService || false,
    split: installmentData.split
  };

  // Remove campos undefined
  Object.keys(payload).forEach(key => 
    payload[key] === undefined && delete payload[key]
  );

  try {
    return await asaasRequest('/installments', {
      method: 'POST',
      body: JSON.stringify(payload)
    });
  } catch (error) {
    logger.error('Error creating installment:', error);
    throw error;
  }
};

/**
 * Buscar parcelamento por ID
 */
export const getInstallment = async (installmentId) => {
  try {
    return await asaasRequest(`/installments/${installmentId}`);
  } catch (error) {
    logger.error('Error getting installment:', error);
    throw error;
  }
};

/**
 * Listar parcelamentos
 */
export const listInstallments = async (filters = {}) => {
  try {
    const queryParams = new URLSearchParams(filters).toString();
    const endpoint = `/installments${queryParams ? `?${queryParams}` : ''}`;
    return await asaasRequest(endpoint);
  } catch (error) {
    logger.error('Error listing installments:', error);
    throw error;
  }
};

/**
 * Deletar parcelamento
 */
export const deleteInstallment = async (installmentId) => {
  try {
    return await asaasRequest(`/installments/${installmentId}`, {
      method: 'DELETE'
    });
  } catch (error) {
    logger.error('Error deleting installment:', error);
    throw error;
  }
};

/**
 * Estornar parcelamento
 */
export const refundInstallment = async (installmentId) => {
  try {
    return await asaasRequest(`/installments/${installmentId}/refund`, {
      method: 'POST'
    });
  } catch (error) {
    logger.error('Error refunding installment:', error);
    throw error;
  }
};

// ========== WEBHOOKS ==========

/**
 * Validar assinatura do webhook
 */
export const validateWebhookSignature = (req) => {
  const webhookToken = asaasConfig.webhookToken;
  
  if (webhookToken) {
    const receivedToken = req.headers['asaas-access-token'];
    return receivedToken === webhookToken;
  }
  
  // Se não houver token configurado, log de aviso
  logger.warn('Webhook token not configured - accepting all webhooks (NOT RECOMMENDED)');
  return true;
};

/**
 * Mapear status do Asaas para status interno
 */
export const mapPaymentStatus = (asaasStatus) => {
  const statusMap = {
    'PENDING': 'pending',
    'RECEIVED': 'paid',
    'CONFIRMED': 'paid',
    'OVERDUE': 'overdue',
    'REFUNDED': 'refunded',
    'RECEIVED_IN_CASH': 'paid',
    'REFUND_REQUESTED': 'pending',
    'REFUND_IN_PROGRESS': 'pending',
    'CHARGEBACK_REQUESTED': 'failed',
    'CHARGEBACK_DISPUTE': 'failed',
    'AWAITING_CHARGEBACK_REVERSAL': 'failed',
    'DUNNING_REQUESTED': 'overdue',
    'DUNNING_RECEIVED': 'paid',
    'AWAITING_RISK_ANALYSIS': 'pending'
  };

  return statusMap[asaasStatus] || 'pending';
};

// ========== FINANCIAL ==========

/**
 * Buscar saldo da conta
 */
export const getBalance = async () => {
  try {
    return await asaasRequest('/finance/balance');
  } catch (error) {
    logger.error('Error getting balance:', error);
    throw error;
  }
};

/**
 * Buscar extrato financeiro
 */
export const getFinancialTransactions = async (filters = {}) => {
  try {
    const queryParams = new URLSearchParams(filters).toString();
    const endpoint = `/financialTransactions${queryParams ? `?${queryParams}` : ''}`;
    return await asaasRequest(endpoint);
  } catch (error) {
    logger.error('Error getting financial transactions:', error);
    throw error;
  }
};

/**
 * Buscar estatísticas de cobrança
 */
export const getPaymentStatistics = async () => {
  try {
    return await asaasRequest('/finance/payment/statistics');
  } catch (error) {
    logger.error('Error getting payment statistics:', error);
    throw error;
  }
};

// ========== SANDBOX ONLY ==========

/**
 * (SANDBOX) Confirmar pagamento manualmente
 */
export const sandboxConfirmPayment = async (paymentId) => {
  if (BASE_URL.includes('api.asaas.com')) {
    throw new Error('Sandbox methods only work in sandbox environment');
  }
  
  try {
    return await asaasRequest(`/sandbox/payment/${paymentId}/confirm`, {
      method: 'POST'
    });
  } catch (error) {
    logger.error('Error confirming payment in sandbox:', error);
    throw error;
  }
};

/**
 * (SANDBOX) Forçar cobrança como vencida
 */
export const sandboxMarkPaymentOverdue = async (paymentId) => {
  if (BASE_URL.includes('api.asaas.com')) {
    throw new Error('Sandbox methods only work in sandbox environment');
  }
  
  try {
    return await asaasRequest(`/sandbox/payment/${paymentId}/overdue`, {
      method: 'POST'
    });
  } catch (error) {
    logger.error('Error marking payment as overdue in sandbox:', error);
    throw error;
  }
};

// Exports

const asaasService = {
  // Customers
  createCustomer,
  updateCustomer,
  getCustomer,
  findCustomerByExternalRef,
  listCustomers,
  deleteCustomer,
  restoreCustomer,
  
  // Payments
  createPayment,
  createPaymentWithCreditCard,
  getPayment,
  updatePayment,
  listPayments,
  deletePayment,
  restorePayment,
  getPixQrCode,
  getPaymentInfo,
  refundPayment,
  receiveInCash,
  undoReceiveInCash,
  getIdentificationField,
  getPaymentStatus,
  
  // Subscriptions
  createSubscription,
  createSubscriptionWithCreditCard,
  getSubscription,
  updateSubscription,
  listSubscriptions,
  deleteSubscription,
  listSubscriptionPayments,
  
  // Installments
  createInstallment,
  getInstallment,
  listInstallments,
  deleteInstallment,
  refundInstallment,
  
  // Webhooks
  validateWebhookSignature,
  mapPaymentStatus,
  
  // Financial
  getBalance,
  getFinancialTransactions,
  getPaymentStatistics,
  
  // Sandbox
  sandboxConfirmPayment,
  sandboxMarkPaymentOverdue,
  
  // Error class
  AsaasAPIError
};

export { asaasService, AsaasAPIError };
export default asaasService;
