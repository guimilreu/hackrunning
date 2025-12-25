import { Setting, AuditLog } from '../models/index.js';

/**
 * Obter configurações públicas
 */
export const getPublic = async (req, res) => {
  try {
    const settings = await Setting.find({ 
      category: 'public' 
    }).select('key value description');

    const settingsObj = {};
    settings.forEach(s => {
      settingsObj[s.key] = s.value;
    });

    res.json({
      success: true,
      data: { settings: settingsObj }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Erro ao obter configurações'
    });
  }
};

/**
 * Obter configurações de HPoints
 */
export const getHPointsConfig = async (req, res) => {
  try {
    const config = await Setting.getByCategory('hpoints');

    const hpointsConfig = {};
    config.forEach(s => {
      hpointsConfig[s.key] = s.value;
    });

    res.json({
      success: true,
      data: { hpoints: hpointsConfig }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Erro ao obter configurações de HPoints'
    });
  }
};

/**
 * Obter configurações de planos
 */
export const getPlansConfig = async (req, res) => {
  try {
    const config = await Setting.getByCategory('plans');

    const plansConfig = {};
    config.forEach(s => {
      plansConfig[s.key] = s.value;
    });

    res.json({
      success: true,
      data: { plans: plansConfig }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Erro ao obter configurações de planos'
    });
  }
};

// ========== ADMIN ==========

/**
 * Listar todas as configurações (admin)
 */
export const list = async (req, res) => {
  try {
    const { category } = req.query;

    let settings;
    if (category) {
      settings = await Setting.getByCategory(category);
    } else {
      settings = await Setting.find().sort({ category: 1, key: 1 });
    }

    res.json({
      success: true,
      data: { settings }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Erro ao listar configurações'
    });
  }
};

/**
 * Obter configuração por chave (admin)
 */
export const getByKey = async (req, res) => {
  try {
    const { key } = req.params;

    const setting = await Setting.findOne({ key });
    if (!setting) {
      return res.status(404).json({
        success: false,
        message: 'Configuração não encontrada'
      });
    }

    res.json({
      success: true,
      data: { setting }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Erro ao obter configuração'
    });
  }
};

/**
 * Criar ou atualizar configuração (admin)
 */
export const upsert = async (req, res) => {
  try {
    const { key, value, description, category } = req.body;

    if (!key || value === undefined) {
      return res.status(400).json({
        success: false,
        message: 'Chave e valor são obrigatórios'
      });
    }

    const existingSetting = await Setting.findOne({ key });
    const isUpdate = !!existingSetting;

    const setting = await Setting.setValue(
      key, 
      value, 
      req.user._id,
      description,
      category
    );

    // Log de auditoria
    if (isUpdate) {
      await AuditLog.logUpdate(req.user._id, 'setting', setting._id,
        { value: existingSetting.value },
        { value },
        req
      );
    } else {
      await AuditLog.logCreate(req.user._id, 'setting', setting._id, setting.toObject(), req);
    }

    res.json({
      success: true,
      message: isUpdate ? 'Configuração atualizada' : 'Configuração criada',
      data: { setting }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Erro ao salvar configuração'
    });
  }
};

/**
 * Atualizar múltiplas configurações (admin)
 */
export const bulkUpdate = async (req, res) => {
  try {
    const { settings } = req.body;

    if (!settings || !Array.isArray(settings)) {
      return res.status(400).json({
        success: false,
        message: 'Lista de configurações é obrigatória'
      });
    }

    const results = [];
    for (const { key, value, description, category } of settings) {
      const setting = await Setting.setValue(key, value, req.user._id, description, category);
      results.push(setting);
    }

    res.json({
      success: true,
      message: `${results.length} configurações atualizadas`,
      data: { settings: results }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Erro ao atualizar configurações'
    });
  }
};

/**
 * Deletar configuração (admin)
 */
export const remove = async (req, res) => {
  try {
    const { key } = req.params;

    const setting = await Setting.findOne({ key });
    if (!setting) {
      return res.status(404).json({
        success: false,
        message: 'Configuração não encontrada'
      });
    }

    await setting.deleteOne();

    // Log de auditoria
    await AuditLog.logDelete(req.user._id, 'setting', setting._id, setting.toObject(), req);

    res.json({
      success: true,
      message: 'Configuração excluída'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Erro ao excluir configuração'
    });
  }
};

/**
 * Inicializar configurações padrão (admin)
 */
export const initDefaults = async (req, res) => {
  try {
    await Setting.initializeDefaults();

    res.json({
      success: true,
      message: 'Configurações padrão inicializadas'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Erro ao inicializar configurações'
    });
  }
};

/**
 * Listar categorias (admin)
 */
export const getCategories = async (req, res) => {
  try {
    const categories = await Setting.distinct('category');

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
 * Obter histórico de alterações de uma configuração (admin)
 */
export const getHistory = async (req, res) => {
  try {
    const { key } = req.params;

    const setting = await Setting.findOne({ key })
      .populate('history.updatedBy', 'firstName lastName email');

    if (!setting) {
      return res.status(404).json({
        success: false,
        message: 'Configuração não encontrada'
      });
    }

    res.json({
      success: true,
      data: { history: setting.history }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Erro ao obter histórico'
    });
  }
};

export default {
  getPublic,
  getHPointsConfig,
  getPlansConfig,
  list,
  getByKey,
  upsert,
  bulkUpdate,
  remove,
  initDefaults,
  getCategories,
  getHistory
};
