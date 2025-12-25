import { User, Subscription, AuditLog } from '../models/index.js';
import { PLANS } from '../models/Subscription.js';
import { asaasService } from '../services/asaasService.js';
import { notificationService } from '../services/notificationService.js';
import { logger } from '../utils/logger.js';

/**
 * Listar planos disponíveis
 */
export const listPlans = async (req, res) => {
  try {
    const plans = Object.values(PLANS).map(plan => ({
      id: plan.id,
      name: plan.name,
      price: plan.price,
      description: plan.description,
      features: plan.features,
      priceFormatted: plan.price === 0 ? 'Grátis' : `R$ ${plan.price.toFixed(2)}/mês`
    }));

    res.json({
      success: true,
      data: { plans }
    });
  } catch (error) {
    logger.error('Erro ao listar planos:', error);
    res.status(500).json({
      success: false,
      message: 'Erro ao listar planos'
    });
  }
};

/**
 * Obter assinatura atual do usuário
 */
export const getCurrentSubscription = async (req, res) => {
  try {
    const userId = req.user._id;
    
    const subscription = await Subscription.findOrCreateForUser(userId);
    const planConfig = subscription.getPlanConfig();

    res.json({
      success: true,
      data: {
        subscription: {
          id: subscription._id,
          plan: subscription.plan,
          planName: planConfig.name,
          status: subscription.status,
          value: subscription.value,
          billingType: subscription.billingType,
          startDate: subscription.startDate,
          nextBillingDate: subscription.nextBillingDate,
          cancelledAt: subscription.cancelledAt,
          features: planConfig.features,
          limitations: planConfig.limitations
        }
      }
    });
  } catch (error) {
    logger.error('Erro ao obter assinatura:', error);
    res.status(500).json({
      success: false,
      message: 'Erro ao obter assinatura'
    });
  }
};

/**
 * Assinar um plano
 */
export const subscribe = async (req, res) => {
  try {
    const userId = req.user._id;
    const { planId, billingType = 'PIX' } = req.body;

    // Validar plano
    if (!PLANS[planId]) {
      return res.status(400).json({
        success: false,
        message: 'Plano inválido'
      });
    }

    if (planId === 'free') {
      return res.status(400).json({
        success: false,
        message: 'Use o endpoint de cancelamento para voltar ao plano gratuito'
      });
    }

    const plan = PLANS[planId];
    const user = await User.findById(userId);
    const subscription = await Subscription.findOrCreateForUser(userId);

    // Verificar se já tem este plano ativo
    if (subscription.plan === planId && subscription.status === 'active') {
      return res.status(400).json({
        success: false,
        message: 'Você já possui este plano ativo'
      });
    }

    // Criar ou buscar customer no Asaas
    let customerId = user.asaasCustomerId;
    if (!customerId) {
      const customer = await asaasService.createCustomer({
        _id: user._id,
        name: user.name,
        email: user.email,
        cpf: user.cpf,
        phone: user.phone,
        address: user.address
      });
      customerId = customer.id;
      user.asaasCustomerId = customerId;
      await user.save();
    }

    // Calcular próxima data de vencimento
    const nextDueDate = new Date();
    nextDueDate.setDate(nextDueDate.getDate() + 1); // Primeira cobrança amanhã
    const nextDueDateStr = nextDueDate.toISOString().split('T')[0];

    // Criar assinatura no Asaas
    const asaasSubscription = await asaasService.createSubscription({
      customer: customerId,
      billingType: billingType,
      value: plan.price,
      nextDueDate: nextDueDateStr,
      cycle: 'MONTHLY',
      description: `Plano ${plan.name} - Hack Running`,
      externalReference: subscription._id.toString()
    });

    // Atualizar subscription local
    await subscription.activate(planId, {
      subscriptionId: asaasSubscription.id,
      customerId: customerId,
      nextDueDate: asaasSubscription.nextDueDate,
      billingType: billingType
    });

    // Atualizar plano no User
    user.plan = {
      type: planId,
      status: 'pending', // Será 'active' após primeiro pagamento
      startDate: new Date(),
      nextBillingDate: new Date(asaasSubscription.nextDueDate),
      asaasSubscriptionId: asaasSubscription.id,
      autoRenew: true
    };
    await user.save();

    // Buscar informações de pagamento da primeira cobrança
    let paymentInfo = null;
    try {
      const payments = await asaasService.listSubscriptionPayments(asaasSubscription.id);
      if (payments.data && payments.data.length > 0) {
        const firstPayment = payments.data[0];
        paymentInfo = await asaasService.getPaymentInfo(firstPayment.id);
      }
    } catch (err) {
      logger.warn('Não foi possível obter info de pagamento:', err.message);
    }

    // Log de auditoria
    await AuditLog.logCreate(userId, 'subscription', subscription._id, {
      plan: planId,
      value: plan.price,
      asaasSubscriptionId: asaasSubscription.id
    });

    res.status(201).json({
      success: true,
      message: `Assinatura do plano ${plan.name} criada com sucesso`,
      data: {
        subscription: {
          id: subscription._id,
          plan: planId,
          planName: plan.name,
          status: subscription.status,
          value: plan.price,
          nextBillingDate: asaasSubscription.nextDueDate,
          asaasSubscriptionId: asaasSubscription.id
        },
        payment: paymentInfo
      }
    });
  } catch (error) {
    logger.error('Erro ao criar assinatura:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Erro ao criar assinatura'
    });
  }
};

/**
 * Trocar de plano (upgrade/downgrade)
 */
export const changePlan = async (req, res) => {
  try {
    const userId = req.user._id;
    const { planId } = req.body;

    // Validar plano
    if (!PLANS[planId]) {
      return res.status(400).json({
        success: false,
        message: 'Plano inválido'
      });
    }

    const user = await User.findById(userId);
    const subscription = await Subscription.findOne({ user: userId });

    if (!subscription) {
      return res.status(404).json({
        success: false,
        message: 'Assinatura não encontrada'
      });
    }

    if (subscription.plan === planId) {
      return res.status(400).json({
        success: false,
        message: 'Você já possui este plano'
      });
    }

    // Se for downgrade para free, cancelar assinatura
    if (planId === 'free') {
      return cancelSubscription(req, res);
    }

    const newPlan = PLANS[planId];
    const oldPlan = subscription.plan;

    // Atualizar assinatura no Asaas
    if (subscription.asaasSubscriptionId) {
      await asaasService.updateSubscription(subscription.asaasSubscriptionId, {
        value: newPlan.price,
        description: `Plano ${newPlan.name} - Hack Running`
      });
    }

    // Atualizar subscription local
    const previousPlan = subscription.plan;
    subscription.plan = planId;
    subscription.value = newPlan.price;
    subscription.addHistory(
      newPlan.price > PLANS[previousPlan].price ? 'upgraded' : 'downgraded',
      {
        fromPlan: previousPlan,
        toPlan: planId
      }
    );
    await subscription.save();

    // Atualizar User
    user.plan.type = planId;
    await user.save();

    // Notificar usuário
    const action = newPlan.price > PLANS[oldPlan].price ? 'upgrade' : 'downgrade';
    await notificationService.create({
      userId,
      type: 'subscription',
      title: action === 'upgrade' ? 'Upgrade de Plano' : 'Downgrade de Plano',
      message: `Seu plano foi alterado para ${newPlan.name}.`,
      data: { planId, action }
    });

    // Log de auditoria
    await AuditLog.logUpdate(userId, 'subscription', subscription._id,
      { plan: oldPlan },
      { plan: planId },
      req
    );

    res.json({
      success: true,
      message: `Plano alterado para ${newPlan.name} com sucesso`,
      data: {
        subscription: {
          id: subscription._id,
          plan: planId,
          planName: newPlan.name,
          status: subscription.status,
          value: newPlan.price,
          previousPlan: oldPlan
        }
      }
    });
  } catch (error) {
    logger.error('Erro ao trocar de plano:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Erro ao trocar de plano'
    });
  }
};

/**
 * Cancelar assinatura
 */
export const cancelSubscription = async (req, res) => {
  try {
    const userId = req.user._id;
    const { reason, immediate = false } = req.body;

    const user = await User.findById(userId);
    const subscription = await Subscription.findOne({ user: userId });

    if (!subscription || subscription.plan === 'free') {
      return res.status(400).json({
        success: false,
        message: 'Você não possui uma assinatura ativa para cancelar'
      });
    }

    // Cancelar no Asaas
    if (subscription.asaasSubscriptionId) {
      try {
        await asaasService.deleteSubscription(subscription.asaasSubscriptionId);
      } catch (err) {
        logger.error('Erro ao cancelar assinatura no Asaas:', err);
        // Continua mesmo se não conseguir cancelar no Asaas
      }
    }

    // Cancelar localmente
    const previousPlan = subscription.plan;
    await subscription.cancel(reason, immediate);

    if (immediate) {
      subscription.plan = 'free';
      subscription.value = 0;
      await subscription.save();
    }

    // Atualizar User
    user.plan = {
      type: immediate ? 'free' : user.plan.type,
      status: 'cancelled',
      cancelledAt: new Date(),
      cancelReason: reason,
      endDate: immediate ? new Date() : subscription.nextBillingDate
    };
    await user.save();

    // Notificar usuário
    await notificationService.create({
      userId,
      type: 'subscription',
      title: 'Assinatura Cancelada',
      message: immediate 
        ? 'Sua assinatura foi cancelada imediatamente.' 
        : `Sua assinatura será cancelada em ${subscription.nextBillingDate?.toLocaleDateString('pt-BR')}.`,
      data: { previousPlan, reason }
    });

    // Log de auditoria
    await AuditLog.logUpdate(userId, 'subscription', subscription._id,
      { plan: previousPlan, status: 'active' },
      { plan: subscription.plan, status: 'cancelled', reason },
      req
    );

    res.json({
      success: true,
      message: immediate 
        ? 'Assinatura cancelada com sucesso' 
        : 'Assinatura será cancelada ao final do período atual',
      data: {
        subscription: {
          id: subscription._id,
          plan: subscription.plan,
          status: subscription.status,
          endDate: immediate ? new Date() : subscription.nextBillingDate
        }
      }
    });
  } catch (error) {
    logger.error('Erro ao cancelar assinatura:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Erro ao cancelar assinatura'
    });
  }
};

/**
 * Reativar assinatura cancelada
 */
export const reactivateSubscription = async (req, res) => {
  try {
    const userId = req.user._id;

    const subscription = await Subscription.findOne({ user: userId });

    if (!subscription) {
      return res.status(404).json({
        success: false,
        message: 'Assinatura não encontrada'
      });
    }

    if (subscription.status !== 'cancelled') {
      return res.status(400).json({
        success: false,
        message: 'Apenas assinaturas canceladas podem ser reativadas'
      });
    }

    // Se a assinatura ainda não expirou, apenas reativar
    if (subscription.nextBillingDate && new Date(subscription.nextBillingDate) > new Date()) {
      await subscription.reactivate();

      const user = await User.findById(userId);
      user.plan.status = 'active';
      user.plan.cancelledAt = null;
      user.plan.cancelReason = null;
      await user.save();

      res.json({
        success: true,
        message: 'Assinatura reativada com sucesso',
        data: { subscription }
      });
    } else {
      // Se já expirou, precisa criar nova assinatura
      return res.status(400).json({
        success: false,
        message: 'Sua assinatura expirou. Por favor, assine novamente.'
      });
    }
  } catch (error) {
    logger.error('Erro ao reativar assinatura:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Erro ao reativar assinatura'
    });
  }
};

/**
 * Obter histórico de assinatura
 */
export const getSubscriptionHistory = async (req, res) => {
  try {
    const userId = req.user._id;

    const subscription = await Subscription.findOne({ user: userId });

    if (!subscription) {
      return res.status(404).json({
        success: false,
        message: 'Assinatura não encontrada'
      });
    }

    res.json({
      success: true,
      data: {
        history: subscription.history.sort((a, b) => 
          new Date(b.createdAt) - new Date(a.createdAt)
        )
      }
    });
  } catch (error) {
    logger.error('Erro ao obter histórico:', error);
    res.status(500).json({
      success: false,
      message: 'Erro ao obter histórico'
    });
  }
};

/**
 * Obter pagamentos da assinatura
 */
export const getSubscriptionPayments = async (req, res) => {
  try {
    const userId = req.user._id;

    const subscription = await Subscription.findOne({ user: userId });

    if (!subscription || !subscription.asaasSubscriptionId) {
      return res.status(404).json({
        success: false,
        message: 'Assinatura não encontrada'
      });
    }

    const payments = await asaasService.listSubscriptionPayments(
      subscription.asaasSubscriptionId
    );

    res.json({
      success: true,
      data: {
        payments: payments.data || []
      }
    });
  } catch (error) {
    logger.error('Erro ao obter pagamentos:', error);
    res.status(500).json({
      success: false,
      message: 'Erro ao obter pagamentos'
    });
  }
};

/**
 * Atualizar método de pagamento
 */
export const updatePaymentMethod = async (req, res) => {
  try {
    const userId = req.user._id;
    const { billingType } = req.body;

    if (!['PIX', 'BOLETO', 'CREDIT_CARD'].includes(billingType)) {
      return res.status(400).json({
        success: false,
        message: 'Método de pagamento inválido'
      });
    }

    const subscription = await Subscription.findOne({ user: userId });

    if (!subscription || !subscription.asaasSubscriptionId) {
      return res.status(404).json({
        success: false,
        message: 'Assinatura não encontrada'
      });
    }

    // Atualizar no Asaas
    await asaasService.updateSubscription(subscription.asaasSubscriptionId, {
      billingType
    });

    // Atualizar local
    subscription.billingType = billingType;
    await subscription.save();

    res.json({
      success: true,
      message: 'Método de pagamento atualizado',
      data: {
        billingType
      }
    });
  } catch (error) {
    logger.error('Erro ao atualizar método de pagamento:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Erro ao atualizar método de pagamento'
    });
  }
};

// ========== ADMIN ==========

/**
 * Listar todas as assinaturas (admin)
 */
export const listAllSubscriptions = async (req, res) => {
  try {
    const { page = 1, limit = 50, status, plan } = req.query;

    const query = {};
    if (status) query.status = status;
    if (plan) query.plan = plan;

    const [subscriptions, total] = await Promise.all([
      Subscription.find(query)
        .populate('user', 'name email phone')
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(parseInt(limit)),
      Subscription.countDocuments(query)
    ]);

    res.json({
      success: true,
      data: {
        subscriptions,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          pages: Math.ceil(total / limit)
        }
      }
    });
  } catch (error) {
    logger.error('Erro ao listar assinaturas:', error);
    res.status(500).json({
      success: false,
      message: 'Erro ao listar assinaturas'
    });
  }
};

/**
 * Obter estatísticas de assinaturas (admin)
 */
export const getSubscriptionStats = async (req, res) => {
  try {
    const stats = await Subscription.getStats();

    res.json({
      success: true,
      data: { stats }
    });
  } catch (error) {
    logger.error('Erro ao obter estatísticas:', error);
    res.status(500).json({
      success: false,
      message: 'Erro ao obter estatísticas'
    });
  }
};

/**
 * Atualizar assinatura manualmente (admin)
 */
export const adminUpdateSubscription = async (req, res) => {
  try {
    const { id } = req.params;
    const { plan, status, notes } = req.body;

    const subscription = await Subscription.findById(id);
    if (!subscription) {
      return res.status(404).json({
        success: false,
        message: 'Assinatura não encontrada'
      });
    }

    const oldData = {
      plan: subscription.plan,
      status: subscription.status
    };

    if (plan && PLANS[plan]) {
      subscription.plan = plan;
      subscription.value = PLANS[plan].price;
    }
    if (status) {
      subscription.status = status;
    }
    if (notes) {
      subscription.notes = notes;
    }

    subscription.addHistory('upgraded', {
      fromPlan: oldData.plan,
      toPlan: plan,
      reason: 'Atualização manual pelo admin',
      metadata: { adminId: req.user._id }
    });

    await subscription.save();

    // Atualizar User também
    const user = await User.findById(subscription.user);
    if (user) {
      user.plan.type = subscription.plan;
      user.plan.status = subscription.status === 'active' ? 'active' : 'inactive';
      await user.save();
    }

    // Log de auditoria
    await AuditLog.logUpdate(req.user._id, 'subscription', id,
      oldData,
      { plan, status },
      req
    );

    res.json({
      success: true,
      message: 'Assinatura atualizada',
      data: { subscription }
    });
  } catch (error) {
    logger.error('Erro ao atualizar assinatura:', error);
    res.status(500).json({
      success: false,
      message: 'Erro ao atualizar assinatura'
    });
  }
};

export default {
  listPlans,
  getCurrentSubscription,
  subscribe,
  changePlan,
  cancelSubscription,
  reactivateSubscription,
  getSubscriptionHistory,
  getSubscriptionPayments,
  updatePaymentMethod,
  listAllSubscriptions,
  getSubscriptionStats,
  adminUpdateSubscription
};
