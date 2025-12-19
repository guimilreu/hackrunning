import { Router } from 'express';
import eventController from '../controllers/eventController.js';
import { authenticate, requireAdmin, requireOnboarding } from '../middleware/auth.js';
import { validate, schemas } from '../middleware/validation.js';
import multer from 'multer';

const router = Router();
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 20 * 1024 * 1024 } // 20MB para fotos/vídeos
});

// ========== Rotas do Membro ==========

/**
 * @route GET /api/events
 * @desc Listar eventos
 * @access Private
 */
router.get('/',
  authenticate,
  requireOnboarding,
  validate(schemas.pagination, 'query'),
  eventController.list
);

/**
 * @route GET /api/events/my
 * @desc Meus eventos
 * @access Private
 */
router.get('/my', authenticate, requireOnboarding, eventController.myEvents);

/**
 * @route GET /api/events/:id
 * @desc Obter evento por ID
 * @access Private
 */
router.get('/:id',
  authenticate,
  requireOnboarding,
  validate(schemas.objectId, 'params'),
  eventController.getById
);

/**
 * @route POST /api/events/:id/participate
 * @desc Inscrever-se em evento
 * @access Private
 */
router.post('/:id/participate',
  authenticate,
  requireOnboarding,
  validate(schemas.objectId, 'params'),
  eventController.participate
);

/**
 * @route POST /api/events/:id/cancel-participation
 * @desc Cancelar inscrição
 * @access Private
 */
router.post('/:id/cancel-participation',
  authenticate,
  requireOnboarding,
  validate(schemas.objectId, 'params'),
  eventController.cancelParticipation
);

/**
 * @route POST /api/events/:id/confirm-presence
 * @desc Confirmar presença
 * @access Private
 */
router.post('/:id/confirm-presence',
  authenticate,
  requireOnboarding,
  validate(schemas.objectId, 'params'),
  eventController.confirmPresence
);

/**
 * @route POST /api/events/:id/cancel-confirmation
 * @desc Cancelar confirmação de presença
 * @access Private
 */
router.post('/:id/cancel-confirmation',
  authenticate,
  requireOnboarding,
  validate(schemas.objectId, 'params'),
  eventController.cancelConfirmation
);

/**
 * @route POST /api/events/:id/media
 * @desc Enviar mídia do evento
 * @access Private
 */
router.post('/:id/media',
  authenticate,
  requireOnboarding,
  validate(schemas.objectId, 'params'),
  upload.single('media'),
  eventController.uploadMedia
);

// ========== Rotas Admin ==========

/**
 * @route POST /api/events
 * @desc Criar evento
 * @access Admin
 */
router.post('/',
  authenticate,
  requireAdmin,
  validate(schemas.events.create),
  eventController.create
);

/**
 * @route PUT /api/events/:id
 * @desc Atualizar evento
 * @access Admin
 */
router.put('/:id',
  authenticate,
  requireAdmin,
  validate(schemas.objectId, 'params'),
  validate(schemas.events.update),
  eventController.update
);

/**
 * @route DELETE /api/events/:id
 * @desc Deletar evento
 * @access Admin
 */
router.delete('/:id',
  authenticate,
  requireAdmin,
  validate(schemas.objectId, 'params'),
  eventController.remove
);

/**
 * @route GET /api/events/:id/participants
 * @desc Listar participantes
 * @access Admin
 */
router.get('/:id/participants',
  authenticate,
  requireAdmin,
  validate(schemas.objectId, 'params'),
  eventController.getParticipants
);

/**
 * @route POST /api/events/confirm-qr
 * @desc Confirmar presença via QR
 * @access Admin
 */
router.post('/confirm-qr',
  authenticate,
  requireAdmin,
  eventController.confirmByQR
);

export default router;
