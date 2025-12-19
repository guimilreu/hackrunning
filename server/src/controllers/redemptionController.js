import { Redemption, Product, User, AuditLog } from '../models/index.js';
import { hpointService } from '../services/hpointService.js';
import { qrcodeService } from '../services/qrcodeService.js';
import { notificationService } from '../services/notificationService.js';
import { nanoid } from 'nanoid';

/**
 * Criar resgate
 */
export const create = async (req, res) => {
  try {
    const { productId, quantity = 1 } = req.body;
    const userId = req.user._id;

    // Buscar produto
    const product = await Product.findById(productId);
    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Produto não encontrado'
      });
    }

    // Verificar disponibilidade
    if (!product.isAvailable()) {
      return res.status(400).json({
        success: false,
        message: 'Produto indisponível'
      });
    }

    // Verificar restrições de plano
    if (product.restrictions?.plans?.length > 0) {
      if (!product.restrictions.plans.includes(req.user.plan.type)) {
        return res.status(403).json({
          success: false,
          message: 'Produto disponível apenas para planos: ' + product.restrictions.plans.join(', ')
        });
      }
    }

    // Calcular pontos necessários
    const pointsNeeded = product.pointsCost * quantity;

    // Verificar saldo
    const balance = await hpointService.getBalance(userId);
    if (balance < pointsNeeded) {
      return res.status(400).json({
        success: false,
        message: 'Saldo insuficiente',
        data: { balance, required: pointsNeeded }
      });
    }

    // Gerar código único
    const code = nanoid(10).toUpperCase();

    // Criar resgate
    const redemption = new Redemption({
      user: userId,
      type: product.type,
      item: {
        product: product._id,
        name: product.name,
        description: product.description,
        quantity
      },
      pointsUsed: pointsNeeded,
      code,
      status: 'pending'
    });

    await redemption.save();

    // Debitar pontos
    await hpointService.debitPoints(
      userId,
      pointsNeeded,
      `Resgate: ${product.name}`,
      { type: 'redemption', id: redemption._id }
    );

    // Decrementar estoque
    if (product.stock !== null && product.stock !== undefined) {
      await product.decrementStock(quantity);
    }

    // Gerar QR Code
    const qrCodeUrl = await qrcodeService.generateRedemptionQRCode(
      redemption._id.toString(),
      code
    );
    redemption.qrCodeUrl = qrCodeUrl;
    await redemption.save();

    res.status(201).json({
      success: true,
      message: 'Resgate realizado com sucesso',
      data: {
        redemption,
        qrCodeUrl,
        code
      }
    });
  } catch (error) {
    console.error('Erro ao criar resgate:', error);
    res.status(500).json({
      success: false,
      message: 'Erro ao processar resgate'
    });
  }
};

/**
 * Listar resgates do usuário
 */
export const list = async (req, res) => {
  try {
    const { page = 1, limit = 20, status } = req.query;

    const query = { user: req.user._id };
    if (status) query.status = status;

    const [redemptions, total] = await Promise.all([
      Redemption.find(query)
        .populate('item.product', 'name image')
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(parseInt(limit)),
      Redemption.countDocuments(query)
    ]);

    res.json({
      success: true,
      data: {
        redemptions,
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
      message: 'Erro ao listar resgates'
    });
  }
};

/**
 * Obter resgate por ID
 */
export const getById = async (req, res) => {
  try {
    const redemption = await Redemption.findOne({
      _id: req.params.id,
      user: req.user._id
    }).populate('item.product');

    if (!redemption) {
      return res.status(404).json({
        success: false,
        message: 'Resgate não encontrado'
      });
    }

    res.json({
      success: true,
      data: { redemption }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Erro ao obter resgate'
    });
  }
};

/**
 * Cancelar resgate (apenas pendentes)
 */
export const cancel = async (req, res) => {
  try {
    const redemption = await Redemption.findOne({
      _id: req.params.id,
      user: req.user._id,
      status: 'pending'
    });

    if (!redemption) {
      return res.status(404).json({
        success: false,
        message: 'Resgate não encontrado ou não pode ser cancelado'
      });
    }

    // Estornar pontos
    await hpointService.refundPoints(
      req.user._id,
      redemption.pointsUsed,
      `Estorno: ${redemption.item.name}`,
      { type: 'redemption_refund', id: redemption._id }
    );

    // Restaurar estoque
    if (redemption.item.product) {
      const product = await Product.findById(redemption.item.product);
      if (product && product.stock !== null) {
        product.stock += redemption.item.quantity;
        await product.save();
      }
    }

    await redemption.cancel('Cancelado pelo usuário');

    res.json({
      success: true,
      message: 'Resgate cancelado e pontos estornados',
      data: { redemption }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Erro ao cancelar resgate'
    });
  }
};

// ========== ADMIN ==========

/**
 * Listar todos os resgates (admin)
 */
export const listAll = async (req, res) => {
  try {
    const { page = 1, limit = 50, status, type, search } = req.query;

    const query = {};
    if (status) query.status = status;
    if (type) query.type = type;

    // Se houver busca, adiciona filtro por código ou nome do usuário
    let userIds = [];
    if (search) {
      const users = await User.find({
        $or: [
          { firstName: { $regex: search, $options: 'i' } },
          { lastName: { $regex: search, $options: 'i' } },
          { email: { $regex: search, $options: 'i' } }
        ]
      }).select('_id');
      userIds = users.map(u => u._id);

      query.$or = [
        { code: { $regex: search, $options: 'i' } },
        { user: { $in: userIds } }
      ];
    }

    const [redemptions, total] = await Promise.all([
      Redemption.find(query)
        .populate('user', 'firstName lastName email')
        .populate('item.product', 'name')
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(parseInt(limit)),
      Redemption.countDocuments(query)
    ]);

    res.json({
      success: true,
      data: {
        redemptions,
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
      message: 'Erro ao listar resgates'
    });
  }
};

/**
 * Listar resgates pendentes (admin)
 */
export const listPending = async (req, res) => {
  try {
    const { page = 1, limit = 50 } = req.query;

    const [redemptions, total] = await Promise.all([
      Redemption.findPending()
        .skip((page - 1) * limit)
        .limit(parseInt(limit)),
      Redemption.countDocuments({ status: 'pending' })
    ]);

    res.json({
      success: true,
      data: {
        redemptions,
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
      message: 'Erro ao listar resgates pendentes'
    });
  }
};

/**
 * Aprovar resgate (admin)
 */
export const approve = async (req, res) => {
  try {
    const { id } = req.params;
    const { notes } = req.body;

    const redemption = await Redemption.findById(id).populate('user');
    if (!redemption) {
      return res.status(404).json({
        success: false,
        message: 'Resgate não encontrado'
      });
    }

    if (redemption.status !== 'pending') {
      return res.status(400).json({
        success: false,
        message: 'Resgate já foi processado'
      });
    }

    await redemption.approve(req.user._id, notes);

    // Notificar usuário
    await notificationService.createNotification(redemption.user._id, 'redemption_approved', {
      message: `Seu resgate de "${redemption.item.name}" foi aprovado!`,
      itemName: redemption.item.name,
      code: redemption.code
    });

    // Log de auditoria
    await AuditLog.logUpdate('redemption', id, req.user._id,
      { status: 'pending' },
      { status: 'approved' },
      req
    );

    res.json({
      success: true,
      message: 'Resgate aprovado',
      data: { redemption }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Erro ao aprovar resgate'
    });
  }
};

/**
 * Marcar como entregue (admin)
 */
export const deliver = async (req, res) => {
  try {
    const { id } = req.params;
    const { notes } = req.body;

    const redemption = await Redemption.findById(id).populate('user');
    if (!redemption) {
      return res.status(404).json({
        success: false,
        message: 'Resgate não encontrado'
      });
    }

    if (!['pending', 'approved'].includes(redemption.status)) {
      return res.status(400).json({
        success: false,
        message: 'Resgate não pode ser entregue'
      });
    }

    await redemption.deliver(req.user._id, notes);

    // Notificar usuário
    await notificationService.createNotification(redemption.user._id, 'redemption_ready', {
      message: `Seu resgate de "${redemption.item.name}" foi entregue!`,
      itemName: redemption.item.name
    });

    res.json({
      success: true,
      message: 'Resgate marcado como entregue',
      data: { redemption }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Erro ao marcar como entregue'
    });
  }
};

/**
 * Validar resgate por código (admin - leitura QR)
 */
export const validateByCode = async (req, res) => {
  try {
    const { code } = req.body;

    const redemption = await Redemption.findByCode(code);
    if (!redemption) {
      return res.status(404).json({
        success: false,
        message: 'Código inválido'
      });
    }

    if (redemption.status === 'delivered') {
      return res.status(400).json({
        success: false,
        message: 'Este resgate já foi entregue',
        data: { redemption }
      });
    }

    if (redemption.status === 'cancelled') {
      return res.status(400).json({
        success: false,
        message: 'Este resgate foi cancelado'
      });
    }

    // Marcar como entregue
    await redemption.deliver(req.user._id, 'Validado via QR Code');

    res.json({
      success: true,
      message: 'Resgate validado e entregue',
      data: { redemption }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Erro ao validar resgate'
    });
  }
};

/**
 * Cancelar resgate (admin)
 */
export const adminCancel = async (req, res) => {
  try {
    const { id } = req.params;
    const { reason, refundPoints = true } = req.body;

    const redemption = await Redemption.findById(id);
    if (!redemption) {
      return res.status(404).json({
        success: false,
        message: 'Resgate não encontrado'
      });
    }

    if (redemption.status === 'delivered') {
      return res.status(400).json({
        success: false,
        message: 'Não é possível cancelar um resgate já entregue'
      });
    }

    // Estornar pontos se solicitado
    if (refundPoints && redemption.status !== 'cancelled') {
      await hpointService.refundPoints(
        redemption.user,
        redemption.pointsUsed,
        `Estorno admin: ${redemption.item.name}`,
        { type: 'redemption_refund', id: redemption._id }
      );

      // Restaurar estoque
      if (redemption.item.product) {
        const product = await Product.findById(redemption.item.product);
        if (product && product.stock !== null) {
          product.stock += redemption.item.quantity;
          await product.save();
        }
      }
    }

    await redemption.cancel(reason);

    // Log de auditoria
    await AuditLog.logUpdate('redemption', id, req.user._id,
      { status: redemption.status },
      { status: 'cancelled', reason },
      req
    );

    res.json({
      success: true,
      message: 'Resgate cancelado',
      data: { redemption, pointsRefunded: refundPoints }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Erro ao cancelar resgate'
    });
  }
};

/**
 * Obter estatísticas de resgates (admin)
 */
export const getStats = async (req, res) => {
  try {
    const stats = await Redemption.aggregate([
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 },
          totalPoints: { $sum: '$pointsUsed' }
        }
      }
    ]);

    const byType = await Redemption.aggregate([
      {
        $group: {
          _id: '$type',
          count: { $sum: 1 },
          totalPoints: { $sum: '$pointsUsed' }
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

export default {
  create,
  list,
  getById,
  cancel,
  listAll,
  listPending,
  approve,
  deliver,
  validateByCode,
  adminCancel,
  getStats
};
