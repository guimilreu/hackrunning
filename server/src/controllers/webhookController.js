import { Order, User, Subscription, AuditLog } from '../models/index.js';
import { PLANS } from '../models/Subscription.js';
import { asaasService } from '../services/asaasService.js';
import { notificationService } from '../services/notificationService.js';
import { trainingPlanGeneratorService } from '../services/trainingPlanGeneratorService.js';
import { logger } from '../utils/logger.js';

/**
 * Webhook do Asaas (pagamentos e assinaturas)
 * Documentação: https://docs.asaas.com/reference/webhooks
 */
export const asaasWebhook = async (req, res) => {
  try {
    const { event, payment, subscription } = req.body;

    // Validar webhook
    if (!asaasService.validateWebhookSignature(req)) {
      logger.warn('Webhook Asaas inválido - token incorreto');
      return res.status(401).json({ error: 'Unauthorized' });
    }

    logger.info('Asaas webhook received:', { 
      event, 
      paymentId: payment?.id,
      subscriptionId: subscription?.id,
      status: payment?.status || subscription?.status
    });

    // Identificar tipo de evento
    if (event.startsWith('PAYMENT_')) {
      await processPaymentEvent(event, payment, req);
    } else if (event.startsWith('SUBSCRIPTION_')) {
      await processSubscriptionEvent(event, subscription, req);
    } else {
      logger.info('Evento Asaas não categorizado:', event);
    }

    res.status(200).json({ received: true });
  } catch (error) {
    logger.error('Erro no webhook Asaas:', error);
    // Sempre retornar 200 para evitar retry infinito
    res.status(200).json({ received: true, error: error.message });
  }
};

// ========== EVENTOS DE PAGAMENTO ==========

async function processPaymentEvent(event, payment, req) {
  // Primeiro, tentar encontrar pedido (para compras únicas)
  let order = await Order.findByPaymentId(payment?.id);
  
  // Se não encontrar pedido, verificar se é pagamento de assinatura
  if (!order && payment?.subscription) {
    return processSubscriptionPayment(event, payment);
  }

  if (!order) {
    logger.warn('Contexto não encontrado para pagamento:', payment?.id);
    return;
  }

  const user = await User.findById(order.user);
  if (!user) {
    logger.error('Usuário não encontrado:', order.user);
    return;
  }

  switch (event) {
    case 'PAYMENT_CREATED':
      await handlePaymentCreated(payment, order);
      break;

    case 'PAYMENT_UPDATED':
      await handlePaymentUpdated(payment, order);
      break;

    case 'PAYMENT_CONFIRMED':
    case 'PAYMENT_RECEIVED':
      await handlePaymentReceived(payment, order, user, req);
      break;

    case 'PAYMENT_OVERDUE':
      await handlePaymentOverdue(payment, order, user);
      break;

    case 'PAYMENT_DELETED':
      await handlePaymentDeleted(payment, order);
      break;

    case 'PAYMENT_REFUNDED':
      await handlePaymentRefunded(payment, order, user);
      break;

    case 'PAYMENT_RESTORED':
      await handlePaymentRestored(payment, order);
      break;

    case 'PAYMENT_AWAITING_RISK_ANALYSIS':
      await handlePaymentRiskAnalysis(payment, order);
      break;

    case 'PAYMENT_APPROVED_BY_RISK_ANALYSIS':
      await handlePaymentApproved(payment, order);
      break;

    case 'PAYMENT_REPROVED_BY_RISK_ANALYSIS':
      await handlePaymentReproved(payment, order, user);
      break;

    case 'PAYMENT_CHARGEBACK_REQUESTED':
    case 'PAYMENT_CHARGEBACK_DISPUTE':
      await handleChargeback(payment, order, user);
      break;

    case 'PAYMENT_AWAITING_CHARGEBACK_REVERSAL':
      await handleChargebackReversal(payment, order);
      break;

    case 'PAYMENT_DUNNING_RECEIVED':
      await handlePaymentDunningReceived(payment, order, user);
      break;

    case 'PAYMENT_DUNNING_REQUESTED':
      await handlePaymentDunningRequested(payment, order, user);
      break;

    case 'PAYMENT_BANK_SLIP_VIEWED':
      await handleBankSlipViewed(payment, order);
      break;

    case 'PAYMENT_CHECKOUT_VIEWED':
      await handleCheckoutViewed(payment, order);
      break;

    case 'PAYMENT_ANTICIPATED':
      await handlePaymentAnticipated(payment, order);
      break;

    case 'PAYMENT_AUTHORIZED':
      await handlePaymentAuthorized(payment, order);
      break;

    case 'PAYMENT_CREDIT_CARD_CAPTURE_REFUSED':
      await handleCreditCardCaptureRefused(payment, order, user);
      break;

    case 'PAYMENT_REFUND_IN_PROGRESS':
      await handleRefundInProgress(payment, order);
      break;

    case 'PAYMENT_REFUND_DENIED':
      await handleRefundDenied(payment, order, user);
      break;

    case 'PAYMENT_PARTIALLY_REFUNDED':
      await handlePartiallyRefunded(payment, order, user);
      break;

    case 'PAYMENT_RECEIVED_IN_CASH_UNDONE':
      await handleReceivedInCashUndone(payment, order, user);
      break;

    case 'PAYMENT_SPLIT_CANCELLED':
      await handleSplitCancelled(payment, order);
      break;

    case 'PAYMENT_SPLIT_DIVERGENCE_BLOCK':
      await handleSplitDivergenceBlock(payment, order);
      break;

    case 'PAYMENT_SPLIT_DIVERGENCE_BLOCK_FINISHED':
      await handleSplitDivergenceBlockFinished(payment, order);
      break;

    default:
      logger.info('Evento de pagamento não tratado:', event);
  }
}

/**
 * Processa pagamento de assinatura recorrente
 */
async function processSubscriptionPayment(event, payment) {
  const subscription = await Subscription.findByAsaasSubscriptionId(payment.subscription);
  
  if (!subscription) {
    logger.warn('Assinatura não encontrada para pagamento:', payment.subscription);
    return;
  }

  const user = await User.findById(subscription.user);
  if (!user) {
    logger.error('Usuário não encontrado para assinatura:', subscription.user);
    return;
  }

  switch (event) {
    case 'PAYMENT_CREATED':
      await handleSubscriptionPaymentCreated(payment, subscription, user);
      break;

    case 'PAYMENT_CONFIRMED':
    case 'PAYMENT_RECEIVED':
      await handleSubscriptionPaymentReceived(payment, subscription, user);
      break;

    case 'PAYMENT_OVERDUE':
      await handleSubscriptionPaymentOverdue(payment, subscription, user);
      break;

    case 'PAYMENT_REFUNDED':
      await handleSubscriptionPaymentRefunded(payment, subscription, user);
      break;

    case 'PAYMENT_DUNNING_RECEIVED':
      await handleSubscriptionPaymentDunningReceived(payment, subscription, user);
      break;

    case 'PAYMENT_DUNNING_REQUESTED':
      await handleSubscriptionPaymentDunningRequested(payment, subscription, user);
      break;

    default:
      logger.info('Evento de pagamento de assinatura:', event, payment.id);
  }
}

// ========== EVENTOS DE ASSINATURA ==========

async function processSubscriptionEvent(event, subscriptionData, req) {
  const subscription = await Subscription.findByAsaasSubscriptionId(subscriptionData?.id);
  
  if (!subscription) {
    logger.warn('Assinatura local não encontrada:', subscriptionData?.id);
    return;
  }

  const user = await User.findById(subscription.user);

  switch (event) {
    case 'SUBSCRIPTION_CREATED':
      logger.info('Assinatura criada no Asaas:', subscriptionData.id);
      break;

    case 'SUBSCRIPTION_UPDATED':
      await handleSubscriptionUpdated(subscriptionData, subscription, user);
      break;

    case 'SUBSCRIPTION_DELETED':
    case 'SUBSCRIPTION_INACTIVATED':
      await handleSubscriptionCancelled(subscriptionData, subscription, user);
      break;

    case 'SUBSCRIPTION_SPLIT_DISABLED':
      await handleSubscriptionSplitDisabled(subscriptionData, subscription);
      break;

    case 'SUBSCRIPTION_SPLIT_DIVERGENCE_BLOCK':
      await handleSubscriptionSplitBlock(subscriptionData, subscription);
      break;

    case 'SUBSCRIPTION_SPLIT_DIVERGENCE_BLOCK_FINISHED':
      await handleSubscriptionSplitBlockFinished(subscriptionData, subscription);
      break;

    default:
      logger.info('Evento de assinatura não tratado:', event);
  }
}

/**
 * Pagamento de assinatura recebido
 */
// ========== HANDLERS DE SUBSCRIPTION PAYMENTS ==========

/**
 * Handler para quando uma nova cobrança de assinatura é criada
 * Usado para notificar usuários que pagam via PIX/Boleto
 */
async function handleSubscriptionPaymentCreated(payment, subscription, user) {
  logger.info('Nova cobrança de assinatura criada:', {
    paymentId: payment.id,
    subscriptionId: subscription._id,
    billingType: payment.billingType
  });

  // Notificar apenas para PIX e Boleto (cartão é automático)
  if (payment.billingType === 'PIX' || payment.billingType === 'BOLETO') {
    try {
      const planName = subscription.plan === 'plus' ? 'Plus' : 'Pro';
      
      await notificationService.notifySubscriptionNewCharge(user._id, {
        plan: planName,
        billingType: payment.billingType,
        value: payment.value,
        paymentUrl: payment.invoiceUrl
      });

      logger.info('Notificação de nova cobrança enviada', {
        userId: user._id,
        billingType: payment.billingType
      });
    } catch (error) {
      logger.error('Erro ao enviar notificação de nova cobrança:', error);
    }
  }
}

async function handleSubscriptionPaymentReceived(payment, subscription, user) {
  logger.info('Subscription payment received:', {
    paymentId: payment.id,
    subscriptionId: subscription._id,
    value: payment.value,
    cycle: subscription.cycle
  });

  // Atualizar subscription
  await subscription.registerPayment({
    paymentId: payment.id,
    value: payment.value,
    paidAt: payment.paymentDate || new Date(),
    nextDueDate: payment.dueDate // A próxima cobrança
  });

  // Garantir que o plano está ativo
  if (user.plan.status !== 'active') {
    user.plan.status = 'active';
    user.plan.startDate = user.plan.startDate || new Date();
  }
  
  // Calcular próxima cobrança baseada no ciclo da subscription
  const nextBilling = new Date();
  switch (subscription.cycle) {
    case 'QUARTERLY':
      nextBilling.setMonth(nextBilling.getMonth() + 3);
      break;
    case 'SEMIANNUALLY':
      nextBilling.setMonth(nextBilling.getMonth() + 6);
      break;
    case 'YEARLY':
      nextBilling.setFullYear(nextBilling.getFullYear() + 1);
      break;
    case 'MONTHLY':
    default:
      nextBilling.setMonth(nextBilling.getMonth() + 1);
      break;
  }
  user.plan.nextBillingDate = nextBilling;

  // Limpar status de pagamento pendente do usuário (se houver)
  if (user.kickstartKit?.paymentPending) {
    user.kickstartKit.paymentPending = false;
    user.kickstartKit.pendingOrderId = undefined;
    logger.info('Cleared payment pending status for user (subscription payment):', { userId: user._id });
  }
  
  await user.save();

  // Notificar usuário sobre renovação bem sucedida
  try {
    const planName = subscription.plan === 'plus' ? 'Plus' : 'Pro';
    await notificationService.notifySubscriptionPaid(user._id, {
      plan: planName,
      nextDueDate: nextBilling
    });
  } catch (error) {
    logger.error('Erro ao enviar notificação de renovação:', error);
  }

  // Notificar usuário (notificação legado)
  try {
    await notificationService.create({
      userId: user._id,
      type: 'subscription',
      title: 'Pagamento Confirmado',
      message: `O pagamento do seu plano ${PLANS[subscription.plan]?.name} foi confirmado.`,
      data: { subscriptionId: subscription._id, paymentId: payment.id }
    });
  } catch (err) {
    logger.error('Erro ao notificar pagamento de assinatura:', err);
  }

  // Log de auditoria
  try {
    await AuditLog.logCreate('subscription_payment', subscription._id, null, {
      subscriptionId: subscription._id,
      paymentId: payment.id,
      amount: payment.value,
      event: 'PAYMENT_RECEIVED'
    });
  } catch (err) {
    logger.error('Erro ao criar log de auditoria:', err);
  }
}

/**
 * Pagamento de assinatura vencido
 */
async function handleSubscriptionPaymentOverdue(payment, subscription, user) {
  logger.warn('Subscription payment overdue:', {
    paymentId: payment.id,
    subscriptionId: subscription._id
  });

  await subscription.registerPaymentFailed('payment_overdue');

  // Notificar usuário
  try {
    await notificationService.create({
      userId: user._id,
      type: 'subscription',
      title: 'Pagamento Pendente',
      message: `O pagamento do seu plano ${PLANS[subscription.plan]?.name} está vencido. Regularize para continuar aproveitando os benefícios.`,
      data: { subscriptionId: subscription._id, paymentId: payment.id }
    });
  } catch (err) {
    logger.error('Erro ao notificar pagamento vencido:', err);
  }
}

/**
 * Pagamento de assinatura estornado
 */
async function handleSubscriptionPaymentRefunded(payment, subscription, user) {
  logger.warn('Subscription payment refunded:', {
    paymentId: payment.id,
    subscriptionId: subscription._id
  });

  subscription.addHistory('payment_failed', {
    reason: 'refunded',
    metadata: { paymentId: payment.id }
  });
  await subscription.save();

  // Notificar usuário
  try {
    await notificationService.create({
      userId: user._id,
      type: 'subscription',
      title: 'Pagamento Estornado',
      message: `O pagamento do seu plano foi estornado.`,
      data: { subscriptionId: subscription._id, paymentId: payment.id }
    });
  } catch (err) {
    logger.error('Erro ao notificar estorno:', err);
  }
}

/**
 * Pagamento de assinatura recuperado (dunning received)
 */
async function handleSubscriptionPaymentDunningReceived(payment, subscription, user) {
  logger.info('Subscription payment dunning received:', {
    paymentId: payment.id,
    subscriptionId: subscription._id
  });

  // Atualizar subscription - pagamento recuperado
  await subscription.registerPayment({
    paymentId: payment.id,
    value: payment.value,
    paidAt: payment.paymentDate || new Date(),
    nextDueDate: payment.dueDate
  });

  // Reativar plano se estava suspenso
  if (user.plan.status !== 'active') {
    user.plan.status = 'active';
    await user.save();
  }

  // Notificar usuário
  try {
    await notificationService.create({
      userId: user._id,
      type: 'subscription',
      title: 'Pagamento Recuperado',
      message: `O pagamento do seu plano foi recuperado com sucesso!`,
      data: { subscriptionId: subscription._id, paymentId: payment.id }
    });
  } catch (err) {
    logger.error('Erro ao notificar dunning received:', err);
  }
}

/**
 * Tentativa de recuperação de pagamento de assinatura
 */
async function handleSubscriptionPaymentDunningRequested(payment, subscription, user) {
  logger.info('Subscription payment dunning requested:', {
    paymentId: payment.id,
    subscriptionId: subscription._id
  });

  // Notificar usuário sobre tentativa de cobrança
  try {
    await notificationService.create({
      userId: user._id,
      type: 'subscription',
      title: 'Tentativa de Cobrança',
      message: `Estamos tentando recuperar o pagamento do seu plano ${PLANS[subscription.plan]?.name}.`,
      data: { subscriptionId: subscription._id, paymentId: payment.id }
    });
  } catch (err) {
    logger.error('Erro ao notificar dunning requested:', err);
  }
}

/**
 * Assinatura atualizada no Asaas
 */
async function handleSubscriptionUpdated(subscriptionData, subscription, user) {
  logger.info('Subscription updated:', {
    asaasId: subscriptionData.id,
    localId: subscription._id
  });

  // Sincronizar dados
  if (subscriptionData.value) {
    subscription.value = subscriptionData.value;
  }
  if (subscriptionData.nextDueDate) {
    subscription.nextBillingDate = new Date(subscriptionData.nextDueDate);
  }
  if (subscriptionData.billingType) {
    subscription.billingType = subscriptionData.billingType;
  }

  await subscription.save();

  // Atualizar user
  if (user && subscriptionData.nextDueDate) {
    user.plan.nextBillingDate = new Date(subscriptionData.nextDueDate);
    await user.save();
  }
}

/**
 * Assinatura cancelada/inativada no Asaas
 */
async function handleSubscriptionCancelled(subscriptionData, subscription, user) {
  logger.info('Subscription cancelled:', {
    asaasId: subscriptionData.id,
    localId: subscription._id
  });

  subscription.status = 'cancelled';
  subscription.cancelledAt = new Date();
  subscription.addHistory('cancelled', {
    reason: 'cancelled_by_asaas',
    metadata: { asaasStatus: subscriptionData.status }
  });
  await subscription.save();

  // Atualizar user - voltar para plano free
  if (user) {
    user.plan = {
      type: 'free',
      status: 'active',
      cancelledAt: new Date(),
      cancelReason: 'subscription_cancelled'
    };
    await user.save();
  }

  // Notificar usuário
  try {
    await notificationService.create({
      userId: user._id,
      type: 'subscription',
      title: 'Assinatura Cancelada',
      message: 'Sua assinatura foi cancelada. Você foi movido para o plano gratuito.',
      data: { subscriptionId: subscription._id }
    });
  } catch (err) {
    logger.error('Erro ao notificar cancelamento:', err);
  }
}

// ========== HANDLERS DE PAGAMENTO (ORDERS) ==========

async function handlePaymentCreated(payment, order) {
  logger.info('Payment created:', { paymentId: payment.id, orderId: order._id });
  
  if (!order.payment.asaasId) {
    order.payment.asaasId = payment.id;
    order.payment.status = 'pending';
    await order.save();
  }
}

async function handlePaymentUpdated(payment, order) {
  const mappedStatus = asaasService.mapPaymentStatus(payment.status);
  
  if (mappedStatus !== order.payment.status) {
    logger.info('Payment status changed:', {
      paymentId: payment.id,
      oldStatus: order.payment.status,
      newStatus: mappedStatus
    });
    
    await order.updatePaymentStatus(mappedStatus, {
      netValue: payment.netValue
    });
  }
}

async function handlePaymentReceived(payment, order, user, req) {
  logger.info('Payment received:', { 
    paymentId: payment.id, 
    orderId: order._id,
    value: payment.value 
  });

  await order.updatePaymentStatus('paid', {
    method: payment.billingType,
    netValue: payment.netValue,
    paidAt: payment.paymentDate ? new Date(payment.paymentDate) : new Date()
  });

  // Limpar status de pagamento pendente do usuário
  if (user.kickstartKit?.paymentPending) {
    user.kickstartKit.paymentPending = false;
    user.kickstartKit.pendingOrderId = undefined;
    await user.save();
    logger.info('Cleared payment pending status for user:', { userId: user._id });
  }

  try {
    await notificationService.notifyPaymentReceived(order.user, order.type);
  } catch (err) {
    logger.error('Erro ao notificar pagamento:', err);
  }

  if (order.type === 'plan') {
    await handlePlanPayment(order, user);
  } else if (order.type === 'kickstart' || order.type === 'starter_pack') {
    await handleKickstartPayment(order, user);
  } else if (order.type === 'product') {
    await handleProductPayment(order, user);
  }

  try {
    await AuditLog.logCreate('payment_received', order._id, null, {
      orderId: order._id,
      paymentId: payment.id,
      amount: payment.value,
      netValue: payment.netValue,
      event: 'PAYMENT_RECEIVED'
    });
  } catch (err) {
    logger.error('Erro ao criar log de auditoria:', err);
  }
}

async function handlePaymentOverdue(payment, order, user) {
  logger.info('Payment overdue:', { paymentId: payment.id, orderId: order._id });
  
  await order.updatePaymentStatus('overdue');
  
  try {
    await notificationService.create({
      userId: user._id,
      type: 'payment',
      title: 'Pagamento Vencido',
      message: `O pagamento do seu pedido venceu. Por favor, efetue o pagamento.`,
      data: { orderId: order._id, paymentId: payment.id }
    });
  } catch (err) {
    logger.error('Erro ao notificar pagamento vencido:', err);
  }
}

async function handlePaymentDeleted(payment, order) {
  logger.info('Payment deleted:', { paymentId: payment.id, orderId: order._id });
  
  await order.updatePaymentStatus('cancelled');
  order.status = 'cancelled';
  await order.save();
}

async function handlePaymentRefunded(payment, order, user) {
  logger.info('Payment refunded:', { 
    paymentId: payment.id, 
    orderId: order._id,
    value: payment.value 
  });
  
  await order.updatePaymentStatus('refunded');
  
  try {
    await notificationService.create({
      userId: user._id,
      type: 'payment',
      title: 'Pagamento Estornado',
      message: `O pagamento do seu pedido foi estornado.`,
      data: { orderId: order._id, paymentId: payment.id }
    });
  } catch (err) {
    logger.error('Erro ao notificar estorno:', err);
  }
}

async function handlePaymentRestored(payment, order) {
  logger.info('Payment restored:', { paymentId: payment.id, orderId: order._id });
  
  const mappedStatus = asaasService.mapPaymentStatus(payment.status);
  await order.updatePaymentStatus(mappedStatus);
  
  if (order.status === 'cancelled') {
    order.status = 'pending';
    await order.save();
  }
}

async function handlePaymentRiskAnalysis(payment, order) {
  logger.info('Payment awaiting risk analysis:', { 
    paymentId: payment.id, 
    orderId: order._id 
  });
  
  await order.updatePaymentStatus('pending');
}

async function handlePaymentApproved(payment, order) {
  logger.info('Payment approved by risk analysis:', { 
    paymentId: payment.id, 
    orderId: order._id 
  });
  
  const mappedStatus = asaasService.mapPaymentStatus(payment.status);
  await order.updatePaymentStatus(mappedStatus);
}

async function handlePaymentReproved(payment, order, user) {
  logger.warn('Payment reproved by risk analysis:', { 
    paymentId: payment.id, 
    orderId: order._id 
  });
  
  await order.updatePaymentStatus('failed');
  
  try {
    await notificationService.create({
      userId: user._id,
      type: 'payment',
      title: 'Pagamento Recusado',
      message: `Seu pagamento foi recusado pela análise de risco. Entre em contato conosco.`,
      data: { orderId: order._id, paymentId: payment.id }
    });
  } catch (err) {
    logger.error('Erro ao notificar reprovação:', err);
  }
}

async function handleChargeback(payment, order, user) {
  logger.warn('Chargeback requested:', { 
    paymentId: payment.id, 
    orderId: order._id 
  });
  
  await order.updatePaymentStatus('failed');
  
  logger.error('CHARGEBACK ALERT:', { 
    orderId: order._id, 
    userId: user._id,
    value: payment.value 
  });
}

async function handleChargebackReversal(payment, order) {
  logger.info('Chargeback reversal:', { 
    paymentId: payment.id, 
    orderId: order._id 
  });
  
  await order.updatePaymentStatus('pending');
}

async function handlePaymentDunningReceived(payment, order, user) {
  logger.info('Payment dunning received:', { 
    paymentId: payment.id, 
    orderId: order._id 
  });
  
  // Dunning = pagamento após tentativas de cobrança
  await order.updatePaymentStatus('paid', {
    method: payment.billingType,
    netValue: payment.netValue,
    paidAt: payment.paymentDate ? new Date(payment.paymentDate) : new Date()
  });

  // Limpar status de pagamento pendente do usuário
  if (user.kickstartKit?.paymentPending) {
    user.kickstartKit.paymentPending = false;
    user.kickstartKit.pendingOrderId = undefined;
    await user.save();
    logger.info('Cleared payment pending status for user:', { userId: user._id });
  }

  try {
    await notificationService.create({
      userId: user._id,
      type: 'payment',
      title: 'Pagamento Confirmado',
      message: `Seu pagamento foi confirmado após recuperação.`,
      data: { orderId: order._id, paymentId: payment.id }
    });
  } catch (err) {
    logger.error('Erro ao notificar dunning received:', err);
  }
}

async function handlePaymentDunningRequested(payment, order, user) {
  logger.info('Payment dunning requested:', { 
    paymentId: payment.id, 
    orderId: order._id 
  });
  
  // Tentativa de recuperação de pagamento
  try {
    await notificationService.create({
      userId: user._id,
      type: 'payment',
      title: 'Tentativa de Cobrança',
      message: `Estamos tentando recuperar o pagamento do seu pedido.`,
      data: { orderId: order._id, paymentId: payment.id }
    });
  } catch (err) {
    logger.error('Erro ao notificar dunning requested:', err);
  }
}

async function handleBankSlipViewed(payment, order) {
  logger.info('Bank slip viewed:', { 
    paymentId: payment.id, 
    orderId: order._id 
  });
  
  // Apenas log - usuário visualizou o boleto
}

async function handleCheckoutViewed(payment, order) {
  logger.info('Checkout viewed:', { 
    paymentId: payment.id, 
    orderId: order._id 
  });
  
  // Apenas log - usuário visualizou o checkout
}

async function handlePaymentAnticipated(payment, order) {
  logger.info('Payment anticipated:', { 
    paymentId: payment.id, 
    orderId: order._id 
  });
  
  // Buscar usuário
  const user = await User.findById(order.user);
  
  // Registra antecipação
  await order.updatePaymentStatus('paid', {
    method: payment.billingType,
    netValue: payment.netValue,
    paidAt: payment.paymentDate ? new Date(payment.paymentDate) : new Date(),
    anticipated: true
  });

  // Limpar status de pagamento pendente do usuário
  if (user && user.kickstartKit?.paymentPending) {
    user.kickstartKit.paymentPending = false;
    user.kickstartKit.pendingOrderId = undefined;
    await user.save();
    logger.info('Cleared payment pending status for user:', { userId: user._id });
  }
}

async function handlePaymentAuthorized(payment, order) {
  logger.info('Payment authorized (waiting capture):', { 
    paymentId: payment.id, 
    orderId: order._id 
  });
  
  // Pagamento autorizado, aguardando captura
  await order.updatePaymentStatus('pending');
}

async function handleCreditCardCaptureRefused(payment, order, user) {
  logger.warn('Credit card capture refused:', { 
    paymentId: payment.id, 
    orderId: order._id 
  });
  
  await order.updatePaymentStatus('failed');
  
  try {
    await notificationService.create({
      userId: user._id,
      type: 'payment',
      title: 'Captura de Cartão Recusada',
      message: `A captura do seu pagamento foi recusada. Tente novamente.`,
      data: { orderId: order._id, paymentId: payment.id }
    });
  } catch (err) {
    logger.error('Erro ao notificar captura recusada:', err);
  }
}

async function handleRefundInProgress(payment, order) {
  logger.info('Refund in progress:', { 
    paymentId: payment.id, 
    orderId: order._id 
  });
  
  await order.updatePaymentStatus('refunding');
}

async function handleRefundDenied(payment, order, user) {
  logger.warn('Refund denied:', { 
    paymentId: payment.id, 
    orderId: order._id 
  });
  
  try {
    await notificationService.create({
      userId: user._id,
      type: 'payment',
      title: 'Estorno Negado',
      message: `O estorno do seu pagamento foi negado.`,
      data: { orderId: order._id, paymentId: payment.id }
    });
  } catch (err) {
    logger.error('Erro ao notificar estorno negado:', err);
  }
}

async function handlePartiallyRefunded(payment, order, user) {
  logger.info('Payment partially refunded:', { 
    paymentId: payment.id, 
    orderId: order._id,
    value: payment.value 
  });
  
  await order.updatePaymentStatus('partially_refunded');
  
  try {
    await notificationService.create({
      userId: user._id,
      type: 'payment',
      title: 'Estorno Parcial',
      message: `Parte do seu pagamento foi estornada.`,
      data: { orderId: order._id, paymentId: payment.id }
    });
  } catch (err) {
    logger.error('Erro ao notificar estorno parcial:', err);
  }
}

async function handleReceivedInCashUndone(payment, order, user) {
  logger.warn('Received in cash undone:', { 
    paymentId: payment.id, 
    orderId: order._id 
  });
  
  await order.updatePaymentStatus('pending');
  
  try {
    await notificationService.create({
      userId: user._id,
      type: 'payment',
      title: 'Pagamento em Dinheiro Desfeito',
      message: `O recebimento em dinheiro foi desfeito.`,
      data: { orderId: order._id, paymentId: payment.id }
    });
  } catch (err) {
    logger.error('Erro ao notificar cash undone:', err);
  }
}

async function handleSplitCancelled(payment, order) {
  logger.info('Payment split cancelled:', { 
    paymentId: payment.id, 
    orderId: order._id 
  });
  
  // Log apenas - split cancelado
}

async function handleSplitDivergenceBlock(payment, order) {
  logger.warn('Payment split divergence block:', { 
    paymentId: payment.id, 
    orderId: order._id 
  });
  
  // Bloqueio por divergência de split
}

async function handleSplitDivergenceBlockFinished(payment, order) {
  logger.info('Payment split divergence block finished:', { 
    paymentId: payment.id, 
    orderId: order._id 
  });
  
  // Bloqueio finalizado
}

async function handleSubscriptionSplitDisabled(subscriptionData, subscription) {
  logger.info('Subscription split disabled:', {
    asaasId: subscriptionData.id,
    localId: subscription._id
  });
  
  // Log apenas
}

async function handleSubscriptionSplitBlock(subscriptionData, subscription) {
  logger.warn('Subscription split divergence block:', {
    asaasId: subscriptionData.id,
    localId: subscription._id
  });
  
  // Bloqueio por divergência
}

async function handleSubscriptionSplitBlockFinished(subscriptionData, subscription) {
  logger.info('Subscription split block finished:', {
    asaasId: subscriptionData.id,
    localId: subscription._id
  });
  
  // Bloqueio finalizado
}

// ========== HANDLERS ESPECÍFICOS POR TIPO ==========

async function handlePlanPayment(order, user) {
  try {
    const planItem = order.items[0];
    const planType = planItem.planType || 'pro';

    user.plan = {
      type: planType,
      status: 'active',
      startDate: new Date(),
      asaasSubscriptionId: order.payment.subscriptionId
    };

    // Ensure onboarding is completed
    if (!user.onboarding?.completed) {
      user.onboarding.completed = true;
      user.onboarding.completedAt = new Date();
      if (!user.onboarding.completedSteps.includes(5)) {
        user.onboarding.completedSteps.push(5);
      }
    }

    await user.save();

    logger.info('Plano ativado via order:', { userId: user._id, plan: planType });
  } catch (error) {
    logger.error('Erro ao processar pagamento de plano:', error);
  }
}

async function handleKickstartPayment(order, user) {
  try {
    // Marcar Kit como comprado
    if (user.kickstartKit) {
      user.kickstartKit.purchased = true;
      user.kickstartKit.orderId = order._id;
    }

    // Ensure onboarding is completed
    if (!user.onboarding?.completed) {
      user.onboarding.completed = true;
      user.onboarding.completedAt = new Date();
      // Add all steps if missing to prevent "missing steps" errors later
      const allSteps = [1, 2, 3, 4, 5];
      allSteps.forEach(step => {
        if (!user.onboarding.completedSteps.includes(step)) {
          user.onboarding.completedSteps.push(step);
        }
      });
    }

    // Gerar planilha de treinos automaticamente após pagamento confirmado
    // Só gera se tiver todos os dados necessários
    try {
      // Verificar se já tem planilha ativa
      if (!user.currentTrainingPlan?.cycleId) {
        // Verificar se tem todos os dados necessários
        const hasAllRequiredData = 
          user.onboarding?.bodyMetrics?.altura_cm &&
          user.onboarding?.bodyMetrics?.peso_kg &&
          user.onboarding?.bodyMetrics?.cintura_cm &&
          user.onboarding?.bodyMetrics?.quadril_cm &&
          user.onboarding?.physicalTests?.teste6_distancia_m &&
          user.onboarding?.physicalTests?.teste1km_tempo_segundos &&
          user.onboarding?.availability?.dias_treino_semana &&
          user.onboarding?.availability?.tempo_max_sessao_min &&
          user.onboarding?.objetivo_principal;

        if (hasAllRequiredData) {
          const trainingPlan = await trainingPlanGeneratorService.generateCompleteTrainingPlan(user._id, {
            cycleDuration: 4 // 4 semanas inicialmente
          });
          
          logger.info('Planilha de treinos gerada automaticamente após pagamento:', {
            userId: user._id,
            planId: trainingPlan._id,
            orderId: order._id
          });

          // Notificar usuário sobre planilha pronta
          await notificationService.notifyTrainingPlanReady(user._id, trainingPlan.objective);
        } else {
          logger.info('Dados insuficientes para gerar planilha automaticamente. Usuário precisará completar na página de treinos.', {
            userId: user._id,
            orderId: order._id
          });
        }
      }
    } catch (planError) {
      logger.error('Erro ao gerar planilha após pagamento:', planError);
      // Não falhar o webhook, apenas logar o erro
    }

    // Se houver plano associado (Starter Pack Bundle)
    if (order.planType && (order.planType === 'plus' || order.planType === 'pro')) {
      logger.info('Ativando plano via Starter Pack:', { plan: order.planType, cycle: order.billingCycle });

      // Calcular próxima data de vencimento baseada na data do pagamento
      const paymentDate = order.payment?.paidAt ? new Date(order.payment.paidAt) : new Date();
      const nextDueDate = new Date(paymentDate);
      
      if (order.billingCycle === 'QUARTERLY') {
        nextDueDate.setMonth(nextDueDate.getMonth() + 3);
      } else {
        nextDueDate.setMonth(nextDueDate.getMonth() + 1);
      }
      const nextDueDateStr = nextDueDate.toISOString().split('T')[0];

      // Criar ou buscar assinatura local
      let subscription = await Subscription.findOne({ user: user._id });
      if (!subscription) {
        subscription = new Subscription({
          user: user._id,
          plan: 'free',
          status: 'active'
        });
      }

      // Preço do plano
      const planConfig = PLANS[order.planType];
      let planValue = planConfig.price;
      if (order.billingCycle === 'QUARTERLY') {
        planValue = planConfig.price * 3; // Mantendo coerência com a cobrança inicial
      }

      // Criar assinatura no Asaas (cobrança futura)
      try {
        const asaasSubscription = await asaasService.createSubscription({
          customer: user.asaasCustomerId,
          billingType: order.payment.method || 'PIX',
          value: planValue,
          nextDueDate: nextDueDateStr,
          cycle: order.billingCycle || 'MONTHLY',
          description: `Plano ${planConfig.name} - Hack Running`,
          externalReference: subscription._id.toString()
        });

        // Atualizar Subscription Local
        await subscription.activate(order.planType, {
          subscriptionId: asaasSubscription.id,
          customerId: user.asaasCustomerId,
          nextDueDate: asaasSubscription.nextDueDate,
          billingType: order.payment.method
        });
        
        // Se for trimestral, atualizar ciclo no modelo local (campo cycle não existe no modelo atual, mas asaasData guarda tudo? Não, preciso atualizar)
        // O modelo Subscription tem campo 'cycle'.
        subscription.cycle = order.billingCycle;
        await subscription.save();

        // Atualizar User
        user.plan = {
          type: order.planType,
          status: 'active',
          startDate: new Date(),
          nextBillingDate: new Date(asaasSubscription.nextDueDate),
          asaasSubscriptionId: asaasSubscription.id,
          autoRenew: true
        };

        logger.info('Assinatura criada com sucesso via Bundle:', asaasSubscription.id);

      } catch (subError) {
        logger.error('Erro ao criar assinatura no Asaas via Bundle:', subError);
        // Não falhar o webhook, mas logar erro grave
      }
    }

    await user.save();

    logger.info('Kickstart/StarterPack processado:', { userId: user._id, orderId: order._id });
  } catch (error) {
    logger.error('Erro ao processar pagamento de Kickstart:', error);
  }
}

async function handleProductPayment(order, user) {
  try {
    logger.info('Produto pago:', { userId: user._id, orderId: order._id });
  } catch (error) {
    logger.error('Erro ao processar pagamento de produto:', error);
  }
}

/**
 * Webhook genérico para testes
 */
export const testWebhook = async (req, res) => {
  try {
    logger.info('Test webhook received:', {
      headers: req.headers,
      body: req.body
    });

    res.status(200).json({
      received: true,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    logger.error('Erro no webhook de teste:', error);
    res.status(500).json({ error: 'Internal error' });
  }
};

export default {
  asaasWebhook,
  testWebhook
};
