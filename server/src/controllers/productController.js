import { Product, AuditLog } from '../models/index.js';
import { imageService } from '../services/imageService.js';

/**
 * Listar produtos ativos
 */
export const list = async (req, res) => {
  try {
    const { type, category, plan, page = 1, limit = 20 } = req.query;

    const query = { active: true };
    if (type) query.type = type;
    if (category) query.category = category;

    let products;
    if (plan) {
      products = await Product.findForPlan(plan);
    } else {
      products = await Product.find(query)
        .sort({ pointsCost: 1 })
        .skip((page - 1) * limit)
        .limit(parseInt(limit));
    }

    const total = await Product.countDocuments(query);

    res.json({
      success: true,
      data: {
        products,
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
      message: 'Erro ao listar produtos'
    });
  }
};

/**
 * Obter produto por ID
 */
export const getById = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);

    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Produto não encontrado'
      });
    }

    res.json({
      success: true,
      data: { product }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Erro ao obter produto'
    });
  }
};

/**
 * Listar categorias disponíveis
 */
export const getCategories = async (req, res) => {
  try {
    const categories = await Product.distinct('category', { active: true });

    res.json({
      success: true,
      data: { categories }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Erro ao listar categorias'
    });
  }
};

// ========== ADMIN ==========

/**
 * Criar produto (admin)
 */
export const create = async (req, res) => {
  try {
    const {
      name,
      description,
      type,
      category,
      pointsCost,
      monetaryValue,
      stock,
      restrictions
    } = req.body;

    const product = new Product({
      name,
      description,
      type: type || 'physical',
      category,
      pointsCost,
      monetaryValue,
      stock,
      restrictions,
      active: true
    });

    await product.save();

    // Log de auditoria
    await AuditLog.logCreate('product', product._id, req.user._id, product.toObject(), req);

    res.status(201).json({
      success: true,
      message: 'Produto criado com sucesso',
      data: { product }
    });
  } catch (error) {
    console.error('Erro ao criar produto:', error);
    res.status(500).json({
      success: false,
      message: 'Erro ao criar produto'
    });
  }
};

/**
 * Atualizar produto (admin)
 */
export const update = async (req, res) => {
  try {
    const { id } = req.params;

    const product = await Product.findById(id);
    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Produto não encontrado'
      });
    }

    const oldData = product.toObject();
    const allowedFields = [
      'name', 'description', 'type', 'category',
      'pointsCost', 'monetaryValue', 'stock', 'active', 'restrictions'
    ];

    allowedFields.forEach(field => {
      if (req.body[field] !== undefined) {
        product[field] = req.body[field];
      }
    });

    await product.save();

    // Log de auditoria
    await AuditLog.logUpdate('product', id, req.user._id, oldData, product.toObject(), req);

    res.json({
      success: true,
      message: 'Produto atualizado',
      data: { product }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Erro ao atualizar produto'
    });
  }
};

/**
 * Upload de imagem do produto (admin)
 */
export const uploadImage = async (req, res) => {
  try {
    const { id } = req.params;

    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'Nenhuma imagem enviada'
      });
    }

    const product = await Product.findById(id);
    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Produto não encontrado'
      });
    }

    const result = await imageService.processProductImage(
      req.file.buffer,
      product._id.toString()
    );

    product.image = result.url;
    await product.save();

    res.json({
      success: true,
      message: 'Imagem atualizada',
      data: { imageUrl: result.url }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Erro ao enviar imagem'
    });
  }
};

/**
 * Deletar produto (admin)
 */
export const remove = async (req, res) => {
  try {
    const { id } = req.params;

    const product = await Product.findById(id);
    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Produto não encontrado'
      });
    }

    // Soft delete
    product.active = false;
    await product.save();

    // Log de auditoria
    await AuditLog.logDelete('product', id, req.user._id, product.toObject(), req);

    res.json({
      success: true,
      message: 'Produto desativado'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Erro ao deletar produto'
    });
  }
};

/**
 * Atualizar estoque (admin)
 */
export const updateStock = async (req, res) => {
  try {
    const { id } = req.params;
    const { quantity, operation } = req.body;

    const product = await Product.findById(id);
    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Produto não encontrado'
      });
    }

    const oldStock = product.stock;

    if (operation === 'add') {
      product.stock = (product.stock || 0) + quantity;
    } else if (operation === 'subtract') {
      product.stock = Math.max(0, (product.stock || 0) - quantity);
    } else if (operation === 'set') {
      product.stock = quantity;
    } else {
      return res.status(400).json({
        success: false,
        message: 'Operação inválida'
      });
    }

    await product.save();

    // Log de auditoria
    await AuditLog.logUpdate('product', id, req.user._id,
      { stock: oldStock },
      { stock: product.stock, operation, quantity },
      req
    );

    res.json({
      success: true,
      message: 'Estoque atualizado',
      data: { stock: product.stock }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Erro ao atualizar estoque'
    });
  }
};

/**
 * Listar todos os produtos (admin)
 */
export const listAll = async (req, res) => {
  try {
    const { page = 1, limit = 50, active, type, search } = req.query;

    const query = {};
    if (active !== undefined) query.active = active === 'true';
    if (type) query.type = type;
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } }
      ];
    }

    const [products, total] = await Promise.all([
      Product.find(query)
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(parseInt(limit)),
      Product.countDocuments(query)
    ]);

    res.json({
      success: true,
      data: {
        products,
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
      message: 'Erro ao listar produtos'
    });
  }
};

export default {
  list,
  getById,
  getCategories,
  create,
  update,
  uploadImage,
  remove,
  updateStock,
  listAll
};
