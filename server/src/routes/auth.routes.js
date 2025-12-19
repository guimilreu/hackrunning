import { Router } from 'express';
import authController from '../controllers/authController.js';
import { authenticate, loginLocal } from '../middleware/auth.js';
import { validate, schemas } from '../middleware/validation.js';

const router = Router();

/**
 * @route POST /api/auth/register
 * @desc Registrar novo usuário
 * @access Public
 */
router.post('/register', 
  validate(schemas.auth.register),
  authController.register
);

/**
 * @route POST /api/auth/login
 * @desc Login
 * @access Public
 */
router.post('/login',
  validate(schemas.auth.login),
  loginLocal,
  authController.login
);

/**
 * @route POST /api/auth/logout
 * @desc Logout
 * @access Private
 */
router.post('/logout', authenticate, authController.logout);

/**
 * @route GET /api/auth/me
 * @desc Obter usuário logado
 * @access Private
 */
router.get('/me', authenticate, authController.me);

/**
 * @route POST /api/auth/forgot-password
 * @desc Solicitar reset de senha
 * @access Public
 */
router.post('/forgot-password',
  validate(schemas.auth.forgotPassword),
  authController.forgotPassword
);

/**
 * @route POST /api/auth/reset-password
 * @desc Redefinir senha
 * @access Public
 */
router.post('/reset-password',
  validate(schemas.auth.resetPassword),
  authController.resetPassword
);

/**
 * @route POST /api/auth/change-password
 * @desc Alterar senha
 * @access Private
 */
router.post('/change-password',
  authenticate,
  authController.changePassword
);

/**
 * @route POST /api/auth/refresh
 * @desc Renovar token
 * @access Public
 */
router.post('/refresh', authController.refresh);

export default router;
