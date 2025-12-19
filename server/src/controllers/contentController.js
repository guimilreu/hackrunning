import { Content, AuditLog } from '../models/index.js';
import { imageService } from '../services/imageService.js';
import { s3Service } from '../services/s3Service.js';

/**
 * Listar conteúdos
 */
export const list = async (req, res) => {
  try {
    const { type, category, page = 1, limit = 20 } = req.query;
    const userPlan = req.user.plan.type;

    let contents;
    if (type || category) {
      const query = { active: true };
      if (type) query.type = type;
      if (category) query.category = category;
      
      // Filtrar por plano
      query.$or = [
        { planRestrictions: { $size: 0 } },
        { planRestrictions: userPlan }
      ];

      contents = await Content.find(query)
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(parseInt(limit));
    } else {
      contents = await Content.findForPlan(userPlan);
    }

    const total = await Content.countDocuments({ active: true });

    res.json({
      success: true,
      data: {
        contents,
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
      message: 'Erro ao listar conteúdos'
    });
  }
};

/**
 * Obter conteúdo por ID
 */
export const getById = async (req, res) => {
  try {
    const content = await Content.findById(req.params.id);

    if (!content) {
      return res.status(404).json({
        success: false,
        message: 'Conteúdo não encontrado'
      });
    }

    // Verificar restrição de plano
    if (content.planRestrictions.length > 0) {
      if (!content.planRestrictions.includes(req.user.plan.type)) {
        return res.status(403).json({
          success: false,
          message: 'Conteúdo disponível apenas para planos: ' + content.planRestrictions.join(', ')
        });
      }
    }

    // Incrementar visualização
    await content.incrementViews();

    res.json({
      success: true,
      data: { content }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Erro ao obter conteúdo'
    });
  }
};

/**
 * Listar categorias
 */
export const getCategories = async (req, res) => {
  try {
    const { type } = req.query;

    const query = { active: true };
    if (type) query.type = type;

    const categories = await Content.distinct('category', query);

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

/**
 * Listar tags
 */
export const getTags = async (req, res) => {
  try {
    const tags = await Content.aggregate([
      { $match: { active: true } },
      { $unwind: '$tags' },
      { $group: { _id: '$tags', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 50 }
    ]);

    res.json({
      success: true,
      data: { tags: tags.map(t => ({ name: t._id, count: t.count })) }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Erro ao listar tags'
    });
  }
};

/**
 * Buscar conteúdos
 */
export const search = async (req, res) => {
  try {
    const { q, type, category, tags, page = 1, limit = 20 } = req.query;
    const userPlan = req.user.plan.type;

    const query = { 
      active: true,
      $or: [
        { planRestrictions: { $size: 0 } },
        { planRestrictions: userPlan }
      ]
    };

    if (q) {
      query.$text = { $search: q };
    }
    if (type) query.type = type;
    if (category) query.category = category;
    if (tags) {
      const tagArray = tags.split(',');
      query.tags = { $in: tagArray };
    }

    const [contents, total] = await Promise.all([
      Content.find(query)
        .sort(q ? { score: { $meta: 'textScore' } } : { createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(parseInt(limit)),
      Content.countDocuments(query)
    ]);

    res.json({
      success: true,
      data: {
        contents,
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
      message: 'Erro ao buscar conteúdos'
    });
  }
};

// ========== ADMIN ==========

/**
 * Criar conteúdo (admin)
 */
export const create = async (req, res) => {
  try {
    const {
      type,
      title,
      description,
      content,
      videoUrl,
      category,
      tags,
      planRestrictions
    } = req.body;

    const newContent = new Content({
      type,
      title,
      description,
      content,
      videoUrl,
      category,
      tags: tags || [],
      planRestrictions: planRestrictions || [],
      active: false // Começa como rascunho
    });

    await newContent.save();

    // Log de auditoria
    await AuditLog.logCreate('content', newContent._id, req.user._id, newContent.toObject(), req);

    res.status(201).json({
      success: true,
      message: 'Conteúdo criado como rascunho',
      data: { content: newContent }
    });
  } catch (error) {
    console.error('Erro ao criar conteúdo:', error);
    res.status(500).json({
      success: false,
      message: 'Erro ao criar conteúdo'
    });
  }
};

/**
 * Atualizar conteúdo (admin)
 */
export const update = async (req, res) => {
  try {
    const { id } = req.params;

    const content = await Content.findById(id);
    if (!content) {
      return res.status(404).json({
        success: false,
        message: 'Conteúdo não encontrado'
      });
    }

    const oldData = content.toObject();
    const allowedFields = [
      'type', 'title', 'description', 'content', 'videoUrl',
      'category', 'tags', 'planRestrictions'
    ];

    allowedFields.forEach(field => {
      if (req.body[field] !== undefined) {
        content[field] = req.body[field];
      }
    });

    await content.save();

    // Log de auditoria
    await AuditLog.logUpdate('content', id, req.user._id, oldData, content.toObject(), req);

    res.json({
      success: true,
      message: 'Conteúdo atualizado',
      data: { content }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Erro ao atualizar conteúdo'
    });
  }
};

/**
 * Upload de thumbnail (admin)
 */
export const uploadThumbnail = async (req, res) => {
  try {
    const { id } = req.params;

    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'Nenhuma imagem enviada'
      });
    }

    const content = await Content.findById(id);
    if (!content) {
      return res.status(404).json({
        success: false,
        message: 'Conteúdo não encontrado'
      });
    }

    let result;
    if (content.type === 'video') {
      result = await imageService.processVideoThumbnail(
        req.file.buffer,
        content._id.toString()
      );
    } else {
      result = await imageService.processAndUploadImage(
        req.file.buffer,
        `content/${content._id}`,
        { sizes: [{ width: 800, suffix: '' }, { width: 400, suffix: '-thumb' }] }
      );
    }

    content.thumbnail = result.url;
    await content.save();

    res.json({
      success: true,
      message: 'Thumbnail atualizada',
      data: { thumbnailUrl: result.url }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Erro ao enviar thumbnail'
    });
  }
};

/**
 * Publicar conteúdo (admin)
 */
export const publish = async (req, res) => {
  try {
    const { id } = req.params;

    const content = await Content.findById(id);
    if (!content) {
      return res.status(404).json({
        success: false,
        message: 'Conteúdo não encontrado'
      });
    }

    await content.publish();

    res.json({
      success: true,
      message: 'Conteúdo publicado',
      data: { content }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Erro ao publicar conteúdo'
    });
  }
};

/**
 * Despublicar conteúdo (admin)
 */
export const unpublish = async (req, res) => {
  try {
    const { id } = req.params;

    const content = await Content.findById(id);
    if (!content) {
      return res.status(404).json({
        success: false,
        message: 'Conteúdo não encontrado'
      });
    }

    await content.unpublish();

    res.json({
      success: true,
      message: 'Conteúdo despublicado',
      data: { content }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Erro ao despublicar conteúdo'
    });
  }
};

/**
 * Deletar conteúdo (admin)
 */
export const remove = async (req, res) => {
  try {
    const { id } = req.params;

    const content = await Content.findById(id);
    if (!content) {
      return res.status(404).json({
        success: false,
        message: 'Conteúdo não encontrado'
      });
    }

    await content.deleteOne();

    // Log de auditoria
    await AuditLog.logDelete('content', id, req.user._id, content.toObject(), req);

    res.json({
      success: true,
      message: 'Conteúdo excluído'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Erro ao excluir conteúdo'
    });
  }
};

/**
 * Listar todos os conteúdos (admin)
 */
export const listAll = async (req, res) => {
  try {
    const { page = 1, limit = 50, type, active, search } = req.query;

    const query = {};
    if (type) query.type = type;
    if (active !== undefined) query.active = active === 'true';
    if (search) {
      query.$or = [
        { title: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } }
      ];
    }

    const [contents, total] = await Promise.all([
      Content.find(query)
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(parseInt(limit)),
      Content.countDocuments(query)
    ]);

    res.json({
      success: true,
      data: {
        contents,
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
      message: 'Erro ao listar conteúdos'
    });
  }
};

export default {
  list,
  getById,
  getCategories,
  getTags,
  search,
  create,
  update,
  uploadThumbnail,
  publish,
  unpublish,
  remove,
  listAll
};
