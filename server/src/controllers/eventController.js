import { Event, User, AuditLog } from '../models/index.js';
import { imageService } from '../services/imageService.js';
import { notificationService } from '../services/notificationService.js';
import { qrcodeService } from '../services/qrcodeService.js';

/**
 * Listar eventos
 */
export const list = async (req, res) => {
  try {
    const { type, upcoming, page = 1, limit = 20 } = req.query;

    const query = { active: true };
    if (type) query.type = type;

    let events;
    if (upcoming === 'true') {
      events = await Event.findUpcoming(parseInt(limit));
    } else {
      events = await Event.find(query)
        .sort({ date: 1 })
        .skip((page - 1) * limit)
        .limit(parseInt(limit));
    }

    const total = await Event.countDocuments(query);

    res.json({
      success: true,
      data: {
        events,
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
      message: 'Erro ao listar eventos'
    });
  }
};

/**
 * Obter evento por ID
 */
export const getById = async (req, res) => {
  try {
    const event = await Event.findById(req.params.id)
      .populate('participants', 'firstName lastName profilePhoto')
      .populate('confirmed', 'firstName lastName profilePhoto');

    if (!event) {
      return res.status(404).json({
        success: false,
        message: 'Evento não encontrado'
      });
    }

    // Verificar se usuário está participando
    const isParticipating = event.participants.some(
      p => p._id.toString() === req.user._id.toString()
    );
    const isConfirmed = event.confirmed.some(
      p => p._id.toString() === req.user._id.toString()
    );

    res.json({
      success: true,
      data: { 
        event,
        userStatus: {
          isParticipating,
          isConfirmed
        }
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Erro ao obter evento'
    });
  }
};

/**
 * Inscrever-se em evento
 */
export const participate = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user._id;

    const event = await Event.findById(id);
    if (!event) {
      return res.status(404).json({
        success: false,
        message: 'Evento não encontrado'
      });
    }

    if (!event.active) {
      return res.status(400).json({
        success: false,
        message: 'Evento não está ativo'
      });
    }

    // Verificar se já está inscrito
    if (event.participants.includes(userId)) {
      return res.status(400).json({
        success: false,
        message: 'Você já está inscrito neste evento'
      });
    }

    // Verificar limite de participantes
    if (event.maxParticipants && event.participants.length >= event.maxParticipants) {
      return res.status(400).json({
        success: false,
        message: 'Evento lotado'
      });
    }

    event.participants.push(userId);
    await event.save();

    res.json({
      success: true,
      message: 'Inscrição realizada com sucesso',
      data: { participantsCount: event.participants.length }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Erro ao se inscrever'
    });
  }
};

/**
 * Cancelar inscrição
 */
export const cancelParticipation = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user._id;

    const event = await Event.findById(id);
    if (!event) {
      return res.status(404).json({
        success: false,
        message: 'Evento não encontrado'
      });
    }

    const participantIndex = event.participants.indexOf(userId);
    if (participantIndex === -1) {
      return res.status(400).json({
        success: false,
        message: 'Você não está inscrito neste evento'
      });
    }

    event.participants.splice(participantIndex, 1);
    
    // Remover da confirmação também
    const confirmedIndex = event.confirmed.indexOf(userId);
    if (confirmedIndex !== -1) {
      event.confirmed.splice(confirmedIndex, 1);
    }

    await event.save();

    res.json({
      success: true,
      message: 'Inscrição cancelada'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Erro ao cancelar inscrição'
    });
  }
};

/**
 * Confirmar presença
 */
export const confirmPresence = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user._id;

    const event = await Event.findById(id);
    if (!event) {
      return res.status(404).json({
        success: false,
        message: 'Evento não encontrado'
      });
    }

    await event.confirmPresence(userId);

    res.json({
      success: true,
      message: 'Presença confirmada'
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message || 'Erro ao confirmar presença'
    });
  }
};

/**
 * Cancelar confirmação de presença
 */
export const cancelConfirmation = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user._id;

    const event = await Event.findById(id);
    if (!event) {
      return res.status(404).json({
        success: false,
        message: 'Evento não encontrado'
      });
    }

    await event.removeConfirmation(userId);

    res.json({
      success: true,
      message: 'Confirmação cancelada'
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message || 'Erro ao cancelar confirmação'
    });
  }
};

/**
 * Enviar mídia do evento
 */
export const uploadMedia = async (req, res) => {
  try {
    const { id } = req.params;
    const { type = 'photo' } = req.body;

    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'Nenhum arquivo enviado'
      });
    }

    const event = await Event.findById(id);
    if (!event) {
      return res.status(404).json({
        success: false,
        message: 'Evento não encontrado'
      });
    }

    // Verificar se usuário participou
    if (!event.confirmed.includes(req.user._id)) {
      return res.status(403).json({
        success: false,
        message: 'Apenas participantes confirmados podem enviar mídias'
      });
    }

    let url;
    if (type === 'photo') {
      const result = await imageService.processEventPhoto(
        req.file.buffer,
        event._id.toString()
      );
      url = result.url;
    } else {
      // Upload de vídeo direto ao S3
      const { s3Service } = await import('../services/s3Service.js');
      const result = await s3Service.uploadEventFile(
        req.file.buffer,
        event._id.toString(),
        req.file.mimetype
      );
      url = result.url;
    }

    await event.addMedia(url, type, req.user._id);

    res.json({
      success: true,
      message: 'Mídia enviada com sucesso',
      data: { url }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Erro ao enviar mídia'
    });
  }
};

/**
 * Meus eventos
 */
export const myEvents = async (req, res) => {
  try {
    const userId = req.user._id;
    const { past = false } = req.query;

    const now = new Date();
    const query = {
      participants: userId,
      date: past === 'true' ? { $lt: now } : { $gte: now }
    };

    const events = await Event.find(query).sort({ date: past === 'true' ? -1 : 1 });

    res.json({
      success: true,
      data: { events }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Erro ao listar eventos'
    });
  }
};

// ========== ADMIN ==========

/**
 * Criar evento (admin)
 */
export const create = async (req, res) => {
  try {
    const {
      type,
      name,
      description,
      date,
      time,
      location,
      maxParticipants,
      requirements
    } = req.body;

    const event = new Event({
      type,
      name,
      description,
      date,
      time,
      location,
      maxParticipants,
      requirements,
      active: true
    });

    await event.save();

    // Gerar QR Code do evento
    const qrCodeUrl = await qrcodeService.generateEventQRCode(
      event._id.toString(),
      event.name
    );
    event.qrCodeUrl = qrCodeUrl;
    await event.save();

    // Notificar usuários sobre novo evento
    const users = await User.find({ active: true }).select('_id');
    const userIds = users.map(u => u._id);
    
    await notificationService.notifyNewEvent(userIds, {
      id: event._id,
      name: event.name,
      date: event.date.toLocaleDateString('pt-BR')
    });

    // Log de auditoria
    await AuditLog.logCreate('event', event._id, req.user._id, event.toObject(), req);

    res.status(201).json({
      success: true,
      message: 'Evento criado com sucesso',
      data: { event }
    });
  } catch (error) {
    console.error('Erro ao criar evento:', error);
    res.status(500).json({
      success: false,
      message: 'Erro ao criar evento'
    });
  }
};

/**
 * Atualizar evento (admin)
 */
export const update = async (req, res) => {
  try {
    const { id } = req.params;

    const event = await Event.findById(id);
    if (!event) {
      return res.status(404).json({
        success: false,
        message: 'Evento não encontrado'
      });
    }

    const oldData = event.toObject();
    const allowedFields = [
      'name', 'description', 'date', 'time', 'location',
      'maxParticipants', 'requirements', 'active'
    ];

    allowedFields.forEach(field => {
      if (req.body[field] !== undefined) {
        event[field] = req.body[field];
      }
    });

    await event.save();

    // Log de auditoria
    await AuditLog.logUpdate('event', id, req.user._id, oldData, event.toObject(), req);

    res.json({
      success: true,
      message: 'Evento atualizado',
      data: { event }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Erro ao atualizar evento'
    });
  }
};

/**
 * Deletar evento (admin)
 */
export const remove = async (req, res) => {
  try {
    const { id } = req.params;

    const event = await Event.findById(id);
    if (!event) {
      return res.status(404).json({
        success: false,
        message: 'Evento não encontrado'
      });
    }

    event.active = false;
    await event.save();

    // Log de auditoria
    await AuditLog.logDelete('event', id, req.user._id, event.toObject(), req);

    res.json({
      success: true,
      message: 'Evento desativado'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Erro ao deletar evento'
    });
  }
};

/**
 * Confirmar presença via QR (admin)
 */
export const confirmByQR = async (req, res) => {
  try {
    const { eventId, userId } = req.body;

    const event = await Event.findById(eventId);
    if (!event) {
      return res.status(404).json({
        success: false,
        message: 'Evento não encontrado'
      });
    }

    await event.confirmPresence(userId);

    res.json({
      success: true,
      message: 'Presença confirmada via QR'
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message || 'Erro ao confirmar presença'
    });
  }
};

/**
 * Listar participantes (admin)
 */
export const getParticipants = async (req, res) => {
  try {
    const { id } = req.params;

    const event = await Event.findById(id)
      .populate('participants', 'firstName lastName email phone profilePhoto')
      .populate('confirmed', 'firstName lastName email');

    if (!event) {
      return res.status(404).json({
        success: false,
        message: 'Evento não encontrado'
      });
    }

    res.json({
      success: true,
      data: {
        participants: event.participants,
        confirmedAttendees: event.confirmed,
        counts: {
          registered: event.participants.length,
          confirmed: event.confirmed.length
        }
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Erro ao listar participantes'
    });
  }
};

export default {
  list,
  getById,
  participate,
  cancelParticipation,
  confirmPresence,
  cancelConfirmation,
  uploadMedia,
  myEvents,
  create,
  update,
  remove,
  confirmByQR,
  getParticipants
};
