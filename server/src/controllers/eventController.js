import { Event, User, AuditLog } from '../models/index.js';
import { imageService } from '../services/imageService.js';
import { notificationService } from '../services/notificationService.js';
import { qrcodeService } from '../services/qrcodeService.js';
import { mapboxService } from '../services/index.js';
import { logger } from '../utils/logger.js';

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
      .populate('participants', 'name photo firstName lastName')
      .populate('confirmed', 'name photo firstName lastName');

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

    // Faz geocoding do endereço para obter coordenadas
    let locationWithCoordinates = { ...location };
    if (location && location.address && location.city && location.state) {
      const coordinates = await mapboxService.geocodeAddress(
        location.address,
        location.city,
        location.state
      );
      
      if (coordinates) {
        locationWithCoordinates.coordinates = coordinates;
      }
    }

    const event = new Event({
      type,
      name,
      description,
      date,
      time,
      location: locationWithCoordinates,
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
    await AuditLog.logCreate(req.user._id, 'event', event._id, event.toObject(), req);

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

    // Se a localização foi atualizada e não tem coordenadas, faz geocoding
    if (req.body.location && event.location) {
      const location = event.location;
      if (location.address && location.city && location.state && !location.coordinates) {
        const coordinates = await mapboxService.geocodeAddress(
          location.address,
          location.city,
          location.state
        );
        
        if (coordinates) {
          event.location.coordinates = coordinates;
        }
      }
    }

    await event.save();

    // Log de auditoria
    await AuditLog.logUpdate(req.user._id, 'event', id, oldData, event.toObject(), req);

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
    await AuditLog.logDelete(req.user._id, 'event', id, event.toObject(), req);

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

/**
 * Geocoding de endereço (admin)
 * Converte endereço em coordenadas para validação antes de salvar
 */
export const geocode = async (req, res) => {
  console.log('[GEOCODE] Controller chamado');
  console.log('[GEOCODE] User:', req.user ? { id: req.user._id, role: req.user.role } : 'não autenticado');
  console.log('[GEOCODE] Query params:', req.query);
  
  try {
    // Log dos parâmetros recebidos para debug
    logger.info('Geocode request received', { 
      query: req.query,
      rawQuery: req.url 
    });
    
    // Pega os parâmetros da query string
    let address = req.query.address;
    let city = req.query.city;
    let state = req.query.state;

    // Verifica se os parâmetros existem
    if (!address && !city && !state) {
      return res.status(400).json({
        success: false,
        message: 'Parâmetros não fornecidos. Forneça: address, city, state',
        received: req.query
      });
    }

    // Decodifica os parâmetros (Express já decodifica, mas garantimos)
    if (typeof address === 'string') {
      try {
        address = decodeURIComponent(address).trim();
      } catch (e) {
        address = address.trim();
      }
    } else {
      address = '';
    }

    if (typeof city === 'string') {
      try {
        city = decodeURIComponent(city).trim();
      } catch (e) {
        city = city.trim();
      }
    } else {
      city = '';
    }

    if (typeof state === 'string') {
      try {
        state = decodeURIComponent(state).trim().toUpperCase();
      } catch (e) {
        state = state.trim().toUpperCase();
      }
    } else {
      state = '';
    }

    // Validação mais rigorosa
    if (!address || address.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Endereço é obrigatório',
        received: { address, city, state },
        rawQuery: req.query
      });
    }

    if (!city || city.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Cidade é obrigatória',
        received: { address, city, state },
        rawQuery: req.query
      });
    }

    if (!state || state.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Estado é obrigatório',
        received: { address, city, state },
        rawQuery: req.query
      });
    }

    if (state.length > 2) {
      return res.status(400).json({
        success: false,
        message: 'Estado deve ter 2 caracteres (ex: SP, RJ). Recebido: ' + state,
        received: { address, city, state },
        rawQuery: req.query
      });
    }

    const result = await mapboxService.geocodeAddress(address, city, state);

    if (!result || !result.lat || !result.lng) {
      return res.status(404).json({
        success: false,
        message: 'Localização não encontrada. Verifique o endereço informado e tente ser mais específico (inclua número, bairro, etc).'
      });
    }

    // Extrai apenas coordenadas para compatibilidade
    const coordinates = { lat: result.lat, lng: result.lng };

    res.json({
      success: true,
      data: {
        coordinates,
        placeName: result.placeName || `${address}, ${city}, ${state}`,
        accuracy: result.accuracy,
        relevance: result.relevance,
        address: `${address}, ${city}, ${state}`
      }
    });
  } catch (error) {
    console.error('Erro ao fazer geocoding:', error);
    res.status(500).json({
      success: false,
      message: 'Erro ao buscar localização'
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
  getParticipants,
  geocode
};
