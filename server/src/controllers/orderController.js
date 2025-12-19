import { Order, User, Product, AuditLog } from '../models/index.js';
import { PLANS } from '../models/Subscription.js';
import { asaasService } from '../services/asaasService.js';
import { notificationService } from '../services/notificationService.js';

/**
 * Criar pedido (Kickstart Kit ou produto)
 * NOTA: Apenas cria o pedido no banco. O pagamento é iniciado em endpoint separado.
 */
export const create = async (req, res) => {
  try {
    const { type, items, deliveryAddress, plan, billingCycle, shirtSize } = req.body;
    const userId = req.user._id;

    // Calcular valor total
    let totalValue = 0;
    const orderItems = [];

    // Lógica especial para Starter Pack
    if (type === 'starter_pack' || type === 'kickstart_kit') {
      let packPrice = 120.00; // Preço padrão (Plano Free)
      let planPrice = 0;
      let planName = '';

      // Verificar regras de preço
      if (plan === 'plus' || plan === 'pro') {
        const planConfig = PLANS[plan];
        
        if (billingCycle === 'QUARTERLY') {
          packPrice = 0; // Grátis no trimestral
          planPrice = planConfig.price * 3; // 3 meses
          planName = `Plano ${planConfig.name} (Trimestral)`;
        } else {
          packPrice = 60.00; // 50% de desconto no mensal
          planPrice = planConfig.price; // 1 mês
          planName = `Plano ${planConfig.name} (Mensal)`;
        }
      } else {
        // Free
        packPrice = 120.00;
      }

      // Adicionar Kit
      orderItems.push({
        name: 'Starter Pack (Camiseta + Welcome + Stickers + Guia)',
        quantity: 1,
        price: packPrice
      });
      totalValue += packPrice;

      // Adicionar Plano se houver
      if (planPrice > 0) {
        orderItems.push({
          name: planName,
          quantity: 1,
          price: planPrice,
          planType: plan
        });
        totalValue += planPrice;
      }

    } else {
      // Lógica padrão para outros produtos
      for (const item of items) {
        if (item.productId) {
          const product = await Product.findById(item.productId);
          if (!product) {
            return res.status(404).json({
              success: false,
              message: `Produto não encontrado: ${item.productId}`
            });
          }
          if (!product.isAvailable()) {
            return res.status(400).json({
              success: false,
              message: `Produto indisponível: ${product.name}`
            });
          }
          orderItems.push({
            product: product._id,
            name: product.name,
            quantity: item.quantity || 1,
            price: product.monetaryValue
          });
          totalValue += (product.monetaryValue || 0) * (item.quantity || 1);
        } else {
          // Item customizado (ex: Kickstart Kit, plano)
          orderItems.push({
            name: item.name,
            quantity: 1,
            price: item.price || 0
          });
          totalValue += item.price || 0;
        }
      }
    }

    const order = new Order({
      user: userId,
      type: type === 'kickstart_kit' ? 'starter_pack' : type,
      items: orderItems,
      totalValue,
      deliveryAddress: deliveryAddress || req.user.address,
      status: 'awaiting_payment', // Aguardando escolha do método de pagamento
      planType: plan,
      billingCycle: billingCycle,
      shirtSize: shirtSize
    });

    await order.save();

    // Sync shirtSize to User profile if provided
    if (shirtSize) {
        await User.findByIdAndUpdate(userId, { shirtSize });
    }

    res.status(201).json({
      success: true,
      message: 'Pedido criado com sucesso',
      data: { order }
    });
  } catch (error) {
    console.error('Erro ao criar pedido:', error);
    res.status(500).json({
      success: false,
      message: 'Erro ao criar pedido'
    });
  }
};

/**
 * Iniciar pagamento de um pedido
 * O usuário escolhe o método (PIX, BOLETO, CREDIT_CARD) e a cobrança é criada no Asaas
 */
export const initiatePayment = async (req, res) => {
  try {
    const { id } = req.params;
    const { paymentMethod, deliveryAddress, cpf, phone } = req.body; // PIX, BOLETO ou CREDIT_CARD
    const userId = req.user._id;

    // Validar método de pagamento
    const validMethods = ['PIX', 'BOLETO', 'CREDIT_CARD'];
    if (!paymentMethod || !validMethods.includes(paymentMethod)) {
      return res.status(400).json({
        success: false,
        message: 'Método de pagamento inválido. Use: PIX, BOLETO ou CREDIT_CARD'
      });
    }

    // Buscar pedido
    const order = await Order.findOne({ _id: id, user: userId });
    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Pedido não encontrado'
      });
    }

    // Verificar se já tem pagamento
    if (order.payment?.asaasId) {
      // Se já tem cobrança, retornar os dados existentes
      return res.json({
        success: true,
        message: 'Pagamento já iniciado',
        data: { order }
      });
    }

    // Verificar se pode iniciar pagamento
    if (!['awaiting_payment', 'pending'].includes(order.status)) {
      return res.status(400).json({
        success: false,
        message: 'Este pedido não pode receber pagamento'
      });
    }

    // Buscar/criar customer no Asaas
    const user = await User.findById(userId);
    
    // Atualizar CPF e telefone do usuário se fornecidos
    if (cpf) {
      user.cpf = cpf.replace(/\D/g, '');
    }
    if (phone) {
      user.phone = phone.replace(/\D/g, '');
    }
    
    // Atualizar endereço de entrega do pedido se fornecido
    if (deliveryAddress) {
      order.deliveryAddress = {
        street: deliveryAddress.street || '',
        number: deliveryAddress.number || '',
        complement: deliveryAddress.complement || '',
        neighborhood: deliveryAddress.neighborhood || '',
        city: deliveryAddress.city || '',
        state: deliveryAddress.state || '',
        zipCode: deliveryAddress.zipCode ? deliveryAddress.zipCode.replace(/\D/g, '') : ''
      };
      await order.save();
    }
    
    // Atualizar endereço do usuário se não tiver e foi fornecido
    if (deliveryAddress && (!user.address?.zipCode || !user.address?.street)) {
      user.address = {
        street: deliveryAddress.street || '',
        number: deliveryAddress.number || '',
        complement: deliveryAddress.complement || '',
        neighborhood: deliveryAddress.neighborhood || '',
        city: deliveryAddress.city || '',
        state: deliveryAddress.state || '',
        zipCode: deliveryAddress.zipCode ? deliveryAddress.zipCode.replace(/\D/g, '') : ''
      };
    }
    
    if (cpf || phone || deliveryAddress) {
      await user.save();
    }
    
    let customerId = user.asaasCustomerId;
    
    if (!customerId) {
      // Criar customer no Asaas com todos os dados disponíveis
      const customer = await asaasService.createCustomer({
        _id: user._id,
        name: user.name,
        email: user.email,
        cpf: user.cpf,
        phone: user.phone,
        mobilePhone: user.mobilePhone || user.phone,
        address: user.address
      });
      customerId = customer.id;
      user.asaasCustomerId = customerId;
      await user.save();
    } else if (deliveryAddress) {
      // Se já existe customer e recebemos endereço completo, atualizar no Asaas
      // Isso garante que o Asaas tenha os dados mais atualizados para nota fiscal
      try {
        await asaasService.updateCustomer(customerId, {
          name: user.name,
          email: user.email,
          cpf: user.cpf,
          phone: user.phone,
          mobilePhone: user.mobilePhone || user.phone,
          address: user.address
        });
      } catch (error) {
        // Log do erro mas não bloqueia o fluxo
        console.error('Erro ao atualizar customer no Asaas:', error);
      }
    }

    // Calcular data de vencimento (3 dias)
    const dueDate = new Date(Date.now() + 3 * 24 * 60 * 60 * 1000);
    const dueDateStr = dueDate.toISOString().split('T')[0];

    // Criar cobrança no Asaas com o método específico
    const payment = await asaasService.createPayment({
      customer: customerId,
      value: order.totalValue,
      description: `Pedido ${order.type} - Hack Running`,
      billingType: paymentMethod,
      dueDate: dueDateStr,
      externalReference: order._id.toString()
    });

    // Preencher dados de pagamento
    order.payment = {
      asaasId: payment.id,
      customerId: customerId,
      status: 'pending',
      method: payment.billingType,
      value: payment.value,
      netValue: payment.netValue,
      dueDate: payment.dueDate,
      invoiceUrl: payment.invoiceUrl,
      bankSlipUrl: payment.bankSlipUrl,
      nossoNumero: payment.nossoNumero,
      externalReference: payment.externalReference
    };

    // Se for PIX, buscar QR Code
    if (paymentMethod === 'PIX') {
      try {
        const pixInfo = await asaasService.getPixQrCode(payment.id);
        if (pixInfo) {
          order.payment.pixQrCode = pixInfo.encodedImage;
          order.payment.pixCopyPaste = pixInfo.payload;
        }
      } catch (pixErr) {
        console.log('PIX QR Code não disponível ainda:', pixErr.message);
      }
    }

    // Atualizar status do pedido
    order.status = 'pending';
    await order.save();

    // Se for PIX ou Boleto, marcar usuário com pagamento pendente
    if (paymentMethod === 'PIX' || paymentMethod === 'BOLETO') {
      user.kickstartKit = user.kickstartKit || {};
      user.kickstartKit.paymentPending = true;
      user.kickstartKit.pendingOrderId = order._id;
      await user.save();
    }

    res.json({
      success: true,
      message: 'Pagamento iniciado com sucesso',
      data: { order }
    });
  } catch (error) {
    console.error('Erro ao iniciar pagamento:', error);
    res.status(500).json({
      success: false,
      message: 'Erro ao iniciar pagamento',
      error: error.message
    });
  }
};

/**
 * Listar pedidos do usuário
 */
export const list = async (req, res) => {
  try {
    const { page = 1, limit = 20, status, type } = req.query;

    const query = { user: req.user._id };
    if (status) query.status = status;
    if (type) query.type = type;

    const [orders, total] = await Promise.all([
      Order.find(query)
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(parseInt(limit)),
      Order.countDocuments(query)
    ]);

    res.json({
      success: true,
      data: {
        orders,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          pages: Math.ceil(total / limit)
        }
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Erro ao listar pedidos'
    });
  }
};

/**
 * Obter pedido por ID
 */
export const getById = async (req, res) => {
  try {
    const order = await Order.findOne({
      _id: req.params.id,
      user: req.user._id
    });

    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Pedido não encontrado'
      });
    }

    // Atualizar status do pagamento se pendente
    if (order.payment?.asaasId && order.payment.status === 'pending') {
      try {
        const paymentInfo = await asaasService.getPaymentInfo(order.payment.asaasId);
        if (paymentInfo.status !== order.payment.status) {
          order.payment.status = asaasService.mapPaymentStatus(paymentInfo.status);
          await order.save();
        }
      } catch (err) {
        console.error('Erro ao consultar pagamento:', err);
      }
    }

    res.json({
      success: true,
      data: { order }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Erro ao obter pedido'
    });
  }
};

/**
 * Cancelar apenas o pagamento de um pedido (não o pedido inteiro)
 * Usado quando o usuário quer voltar e escolher outro método
 */
export const cancelPayment = async (req, res) => {
  try {
    const order = await Order.findOne({
      _id: req.params.id,
      user: req.user._id
    });

    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Pedido não encontrado'
      });
    }

    if (!order.payment?.asaasId) {
      return res.status(400).json({
        success: false,
        message: 'Este pedido não possui pagamento para cancelar'
      });
    }

    // Cancelar no Asaas
    try {
      await asaasService.deletePayment(order.payment.asaasId);
    } catch (err) {
      console.error('Erro ao cancelar cobrança no Asaas:', err);
      // Continua mesmo se não conseguir cancelar no Asaas
    }

    // Limpar dados de pagamento e voltar para awaiting_payment
    order.payment = undefined;
    order.status = 'awaiting_payment';
    await order.save();

    res.json({
      success: true,
      message: 'Pagamento cancelado. Escolha outro método.',
      data: { order }
    });
  } catch (error) {
    console.error('Erro ao cancelar pagamento:', error);
    res.status(500).json({
      success: false,
      message: 'Erro ao cancelar pagamento'
    });
  }
};

/**
 * Cancelar pedido inteiro
 */
export const cancel = async (req, res) => {
  try {
    const order = await Order.findOne({
      _id: req.params.id,
      user: req.user._id
    });

    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Pedido não encontrado'
      });
    }

    if (!['pending', 'processing', 'awaiting_payment'].includes(order.status)) {
      return res.status(400).json({
        success: false,
        message: 'Pedido não pode ser cancelado'
      });
    }

    // Cancelar no Asaas
    if (order.payment?.asaasId) {
      try {
        await asaasService.deletePayment(order.payment.asaasId);
        order.payment.status = 'cancelled';
      } catch (err) {
        console.error('Erro ao cancelar cobrança:', err);
        // Continua mesmo se não conseguir cancelar no Asaas
      }
    }

    order.status = 'cancelled';
    await order.save();

    res.json({
      success: true,
      message: 'Pedido cancelado',
      data: { order }
    });
  } catch (error) {
    console.error('Erro ao cancelar pedido:', error);
    res.status(500).json({
      success: false,
      message: 'Erro ao cancelar pedido'
    });
  }
};

// ========== ADMIN ==========

/**
 * Listar todos os pedidos (admin)
 */
export const listAll = async (req, res) => {
  try {
    const { page = 1, limit = 50, status, type, search } = req.query;

    const query = {};
    if (status) query.status = status;
    if (type) query.type = type;

    if (search) {
      const users = await User.find({
        $or: [
          { firstName: { $regex: search, $options: 'i' } },
          { lastName: { $regex: search, $options: 'i' } },
          { email: { $regex: search, $options: 'i' } }
        ]
      }).select('_id');
      query.user = { $in: users.map(u => u._id) };
    }

    const [orders, total] = await Promise.all([
      Order.find(query)
        .populate('user', 'firstName lastName email')
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(parseInt(limit)),
      Order.countDocuments(query)
    ]);

    res.json({
      success: true,
      data: {
        orders,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          pages: Math.ceil(total / limit)
        }
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Erro ao listar pedidos'
    });
  }
};

/**
 * Atualizar status do pedido (admin)
 */
export const updateStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status, trackingCode, notes } = req.body;

    const order = await Order.findById(id).populate('user');
    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Pedido não encontrado'
      });
    }

    const oldStatus = order.status;
    await order.updateStatus(status, trackingCode);

    if (notes) {
      order.notes = notes;
      await order.save();
    }

    // Notificar usuário sobre mudança de status
    if (status === 'shipped' && trackingCode) {
      await notificationService.notifyKickstartShipped(order.user._id, trackingCode);
    } else if (status === 'delivered') {
      await notificationService.create({
        userId: order.user._id,
        type: 'order',
        title: 'Pedido Entregue',
        message: `Seu pedido foi entregue com sucesso!`,
        data: { orderId: order._id }
      });
    }

    // Log de auditoria
    await AuditLog.logUpdate('order', id, req.user._id,
      { status: oldStatus },
      { status, trackingCode, notes },
      req
    );

    res.json({
      success: true,
      message: 'Status atualizado',
      data: { order }
    });
  } catch (error) {
    console.error('Erro ao atualizar status:', error);
    res.status(500).json({
      success: false,
      message: 'Erro ao atualizar status'
    });
  }
};

/**
 * Atualizar pagamento (admin)
 */
export const updatePayment = async (req, res) => {
  try {
    const { id } = req.params;
    const { status, notes } = req.body;

    const order = await Order.findById(id).populate('user');
    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Pedido não encontrado'
      });
    }

    await order.updatePaymentStatus(status);

    // Notificar sobre pagamento
    if (status === 'paid') {
      await notificationService.notifyPaymentReceived(order.user._id, order.type);
      
      // Se é plano, atualizar usuário
      if (order.type === 'plan') {
        const planItem = order.items[0];
        await User.findByIdAndUpdate(order.user._id, {
          'plan.type': planItem.planType || 'pro',
          'plan.status': 'active'
        });
      }
    } else if (status === 'failed') {
      await notificationService.notifyPaymentFailed(order.user._id, 'Pagamento recusado');
    }

    res.json({
      success: true,
      message: 'Pagamento atualizado',
      data: { order }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Erro ao atualizar pagamento'
    });
  }
};

/**
 * Atualizar endereço de entrega do pedido
 */
export const updateDeliveryAddress = async (req, res) => {
  try {
    const { id } = req.params;
    const { street, number, complement, neighborhood, city, state, zipCode } = req.body;
    const userId = req.user._id;

    const order = await Order.findOne({ _id: id, user: userId });
    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Pedido não encontrado'
      });
    }

    // Verificar se pode atualizar endereço (apenas antes do pagamento ser confirmado)
    if (order.payment?.status === 'paid' && order.status !== 'awaiting_payment') {
      return res.status(400).json({
        success: false,
        message: 'Não é possível atualizar o endereço após o pagamento ser confirmado'
      });
    }

    // Atualizar endereço de entrega
    order.deliveryAddress = {
      street: street || '',
      number: number || '',
      complement: complement || '',
      neighborhood: neighborhood || '',
      city: city || '',
      state: state || '',
      zipCode: zipCode ? zipCode.replace(/\D/g, '') : ''
    };

    await order.save();

    res.json({
      success: true,
      message: 'Endereço de entrega atualizado com sucesso',
      data: { order }
    });
  } catch (error) {
    console.error('Erro ao atualizar endereço de entrega:', error);
    res.status(500).json({
      success: false,
      message: 'Erro ao atualizar endereço de entrega'
    });
  }
};

/**
 * Gerar nota fiscal (admin)
 */
export const generateInvoice = async (req, res) => {
  try {
    const { id } = req.params;

    const order = await Order.findById(id);
    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Pedido não encontrado'
      });
    }

    if (order.payment.status !== 'paid') {
      return res.status(400).json({
        success: false,
        message: 'Pedido ainda não foi pago'
      });
    }

    // Nota fiscal ainda não implementada na API do Asaas
    // Este é um placeholder para futura implementação
    try {
      if (order.payment.asaasId) {
        // TODO: Implementar quando Asaas disponibilizar API de NF
        const invoiceData = {
          number: `NF-${Date.now()}`,
          issuedAt: new Date()
        };
        
        await order.addInvoice(invoiceData);
      }
    } catch (err) {
      console.error('Erro ao gerar NF:', err);
      return res.status(500).json({
        success: false,
        message: 'Erro ao gerar nota fiscal'
      });
    }

    res.json({
      success: true,
      message: 'Nota fiscal gerada',
      data: { invoice: order.invoice }
    });
  } catch (error) {
    console.error('Erro ao gerar nota fiscal:', error);
    res.status(500).json({
      success: false,
      message: 'Erro ao gerar nota fiscal'
    });
  }
};

/**
 * Obter estatísticas de pedidos (admin)
 */
export const getStats = async (req, res) => {
  try {
    const { startDate, endDate } = req.query;

    const dateFilter = {};
    if (startDate) dateFilter.$gte = new Date(startDate);
    if (endDate) dateFilter.$lte = new Date(endDate);

    const matchStage = {};
    if (Object.keys(dateFilter).length > 0) {
      matchStage.createdAt = dateFilter;
    }

    const stats = await Order.aggregate([
      { $match: matchStage },
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 },
          totalValue: { $sum: '$totalValue' }
        }
      }
    ]);

    const byType = await Order.aggregate([
      { $match: matchStage },
      {
        $group: {
          _id: '$type',
          count: { $sum: 1 },
          totalValue: { $sum: '$totalValue' }
        }
      }
    ]);

    res.json({
      success: true,
      data: {
        byStatus: stats,
        byType
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Erro ao obter estatísticas'
    });
  }
};

/**
 * Iniciar pagamento com cartão de crédito (checkout transparente)
 */
export const payWithCreditCard = async (req, res) => {
  try {
    const { id } = req.params;
    const { holderName, number, expiryMonth, expiryYear, ccv, creditCardHolderInfo: holderInfoFromClient, deliveryAddress } = req.body;
    const userId = req.user._id;

    // Validações do cartão
    if (!holderName || !number || !expiryMonth || !expiryYear || !ccv) {
      return res.status(400).json({
        success: false,
        message: 'Dados do cartão incompletos'
      });
    }

    // Validações do titular (obrigatórios para Asaas)
    if (!holderInfoFromClient) {
      return res.status(400).json({
        success: false,
        message: 'Dados do titular do cartão são obrigatórios'
      });
    }

    const { name, email, cpfCnpj, phone, postalCode, addressNumber } = holderInfoFromClient;

    if (!name || !email || !cpfCnpj || !phone || !postalCode || !addressNumber) {
      // Identificar campos faltantes
      const missing = [];
      if (!name) missing.push('nome do titular');
      if (!email) missing.push('email do titular');
      if (!cpfCnpj) missing.push('CPF/CNPJ do titular');
      if (!phone) missing.push('telefone do titular');
      if (!postalCode) missing.push('CEP do titular');
      if (!addressNumber) missing.push('número do endereço');
      
      return res.status(400).json({
        success: false,
        message: `Informe ${missing.join(', ')}`
      });
    }

    // Buscar pedido
    const order = await Order.findOne({ _id: id, user: userId });
    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Pedido não encontrado'
      });
    }

    // Verificar se já tem pagamento
    if (order.payment?.asaasId) {
      return res.status(400).json({
        success: false,
        message: 'Este pedido já possui um pagamento vinculado'
      });
    }

    // Verificar se pode iniciar pagamento
    if (!['awaiting_payment', 'pending'].includes(order.status)) {
      return res.status(400).json({
        success: false,
        message: 'Este pedido não pode receber pagamento'
      });
    }

    // Buscar/criar customer no Asaas
    const user = await User.findById(userId);
    
    // Atualizar CPF e telefone do usuário se fornecidos
    if (cpfCnpj) {
      user.cpf = cpfCnpj.replace(/\D/g, '');
    }
    if (phone) {
      user.phone = phone.replace(/\D/g, '');
    }
    
    // Atualizar endereço de entrega do pedido se fornecido
    if (deliveryAddress) {
      order.deliveryAddress = {
        street: deliveryAddress.street || '',
        number: deliveryAddress.number || '',
        complement: deliveryAddress.complement || '',
        neighborhood: deliveryAddress.neighborhood || '',
        city: deliveryAddress.city || '',
        state: deliveryAddress.state || '',
        zipCode: deliveryAddress.zipCode ? deliveryAddress.zipCode.replace(/\D/g, '') : ''
      };
      await order.save();
    }
    
    // Atualizar endereço do usuário se não tiver e foi fornecido
    if (deliveryAddress && (!user.address?.zipCode || !user.address?.street)) {
      user.address = {
        street: deliveryAddress.street || '',
        number: deliveryAddress.number || '',
        complement: deliveryAddress.complement || '',
        neighborhood: deliveryAddress.neighborhood || '',
        city: deliveryAddress.city || '',
        state: deliveryAddress.state || '',
        zipCode: deliveryAddress.zipCode ? deliveryAddress.zipCode.replace(/\D/g, '') : ''
      };
    }
    
    if (cpfCnpj || phone || deliveryAddress) {
      await user.save();
    }
    
    let customerId = user.asaasCustomerId;
    
    if (!customerId) {
      // Criar customer no Asaas com todos os dados disponíveis
      const customer = await asaasService.createCustomer({
        _id: user._id,
        name: user.name,
        email: user.email,
        cpf: user.cpf,
        phone: user.phone,
        mobilePhone: user.mobilePhone || user.phone,
        address: user.address
      });
      customerId = customer.id;
      user.asaasCustomerId = customerId;
      await user.save();
    } else if (deliveryAddress) {
      // Se já existe customer e recebemos endereço completo, atualizar no Asaas
      // Isso garante que o Asaas tenha os dados mais atualizados para nota fiscal
      try {
        await asaasService.updateCustomer(customerId, {
          name: user.name,
          email: user.email,
          cpf: user.cpf,
          phone: user.phone,
          mobilePhone: user.mobilePhone || user.phone,
          address: user.address
        });
      } catch (error) {
        // Log do erro mas não bloqueia o fluxo
        console.error('Erro ao atualizar customer no Asaas:', error);
      }
    }

    // Calcular data de vencimento
    const dueDate = new Date(Date.now() + 3 * 24 * 60 * 60 * 1000);
    const dueDateStr = dueDate.toISOString().split('T')[0];

    // Preparar dados do cartão
    const creditCard = {
      holderName,
      number,
      expiryMonth,
      expiryYear,
      ccv
    };

    // Dados do titular do cartão (recebidos do frontend)
    const creditCardHolderInfo = {
      name: name,
      email: email,
      cpfCnpj: cpfCnpj.replace(/\D/g, ''),
      postalCode: postalCode.replace(/\D/g, ''),
      addressNumber: addressNumber,
      phone: phone.replace(/\D/g, '')
    };

    // Criar cobrança com cartão de crédito no Asaas (sempre à vista, sem parcelamento)
    const payment = await asaasService.createPaymentWithCreditCard({
      customer: customerId,
      value: order.totalValue,
      description: `Pedido ${order.type} - Hack Running`,
      dueDate: dueDateStr,
      externalReference: order._id.toString(),
      creditCard,
      creditCardHolderInfo,
      remoteIp: req.ip || req.headers['x-forwarded-for'] || req.connection.remoteAddress
    });

    // Preencher dados de pagamento
    order.payment = {
      asaasId: payment.id,
      customerId: customerId,
      status: payment.status === 'CONFIRMED' ? 'paid' : 'pending',
      method: 'CREDIT_CARD',
      value: payment.value,
      netValue: payment.netValue,
      dueDate: payment.dueDate,
      invoiceUrl: payment.invoiceUrl,
      externalReference: payment.externalReference
    };

    // Se foi confirmado, atualizar status do pedido
    if (payment.status === 'CONFIRMED' || payment.status === 'RECEIVED') {
      order.status = 'processing';
      order.payment.paidAt = new Date();

      // Ensure onboarding is completed immediately for credit card
      if (order.type === 'starter_pack' || order.type === 'kickstart_kit' || order.type === 'plan') {
          const userToUpdate = await User.findById(userId);
          if (userToUpdate && !userToUpdate.onboarding?.completed) {
              userToUpdate.onboarding.completed = true;
              userToUpdate.onboarding.completedAt = new Date();
              
              // Add all steps if missing
              const allSteps = [1, 2, 3, 4, 5];
              allSteps.forEach(step => {
                  if (!userToUpdate.onboarding.completedSteps.includes(step)) {
                      userToUpdate.onboarding.completedSteps.push(step);
                  }
              });
              
              await userToUpdate.save();
          }
      }
    }

    await order.save();

    res.json({
      success: true,
      message: payment.status === 'CONFIRMED' ? 'Pagamento aprovado!' : 'Pagamento em análise',
      data: { order }
    });
  } catch (error) {
    console.error('Erro ao processar pagamento com cartão:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Erro ao processar pagamento com cartão',
      error: error.message
    });
  }
};

/**
 * Buscar pedido pendente do usuário (PIX/Boleto aguardando pagamento)
 */
export const getMyPendingOrder = async (req, res) => {
  try {
    const userId = req.user._id;

    // Buscar pedido pendente (PIX ou Boleto com status pending)
    const order = await Order.findOne({
      user: userId,
      'payment.status': 'pending',
      'payment.method': { $in: ['PIX', 'BOLETO'] }
    }).sort({ createdAt: -1 }); // Mais recente primeiro

    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Nenhum pedido pendente encontrado'
      });
    }

    res.json({
      success: true,
      data: { order }
    });
  } catch (error) {
    console.error('Erro ao buscar pedido pendente:', error);
    res.status(500).json({
      success: false,
      message: 'Erro ao buscar pedido pendente'
    });
  }
};

export default {
  create,
  initiatePayment,
  payWithCreditCard,
  cancelPayment,
  list,
  getById,
  cancel,
  listAll,
  updateStatus,
  updatePayment,
  updateDeliveryAddress,
  generateInvoice,
  getStats,
  getMyPendingOrder
};
