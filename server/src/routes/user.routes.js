import { Router } from 'express';
import userController from '../controllers/userController.js';
import { authenticate, requireAdmin, requireOnboarding } from '../middleware/auth.js';
import { validate, schemas } from '../middleware/validation.js';
import multer from 'multer';

const router = Router();
const upload = multer({ 
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 } // 5MB
});

// ========== Rotas do Membro ==========

/**
 * @route GET /api/users/profile
 * @desc Obter perfil do usuário logado
 * @access Private
 */
router.get('/profile', authenticate, requireOnboarding, userController.getProfile);

/**
 * @route PUT /api/users/profile
 * @desc Atualizar perfil
 * @access Private
 */
router.put('/profile', authenticate, requireOnboarding, userController.updateProfile);

/**
 * @route PUT /api/users/address
 * @desc Atualizar endereço
 * @access Private
 */
router.put('/address', authenticate, requireOnboarding, userController.updateAddress);

/**
 * @route POST /api/users/profile-photo
 * @desc Upload de foto de perfil
 * @access Private
 */
router.post('/profile-photo', 
  authenticate, 
  requireOnboarding,
  upload.single('photo'),
  userController.uploadProfilePhoto
);

/**
 * @route GET /api/users/dashboard
 * @desc Obter dashboard do membro
 * @access Private
 */
router.get('/dashboard', authenticate, requireOnboarding, userController.getDashboard);

/**
 * @route GET /api/users/stats
 * @desc Obter estatísticas do usuário
 * @access Private
 */
router.get('/stats', authenticate, requireOnboarding, userController.getStats);

// ========== Rotas Admin ==========

/**
 * @route GET /api/users
 * @desc Listar usuários (admin)
 * @access Admin
 */
router.get('/', 
  authenticate, 
  requireAdmin,
  validate(schemas.pagination, 'query'),
  userController.listUsers
);

/**
 * @route GET /api/users/:id
 * @desc Obter usuário por ID (admin)
 * @access Admin
 */
router.get('/:id',
  authenticate,
  requireAdmin,
  validate(schemas.objectId, 'params'),
  userController.getUserById
);

/**
 * @route PUT /api/users/:id
 * @desc Atualizar usuário (admin)
 * @access Admin
 */
router.put('/:id',
  authenticate,
  requireAdmin,
  validate(schemas.objectId, 'params'),
  userController.updateUser
);

/**
 * @route DELETE /api/users/:id
 * @desc Desativar usuário (admin)
 * @access Admin
 */
router.delete('/:id',
  authenticate,
  requireAdmin,
  validate(schemas.objectId, 'params'),
  userController.deactivateUser
);

export default router;
