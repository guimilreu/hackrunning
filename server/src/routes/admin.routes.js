import { Router } from 'express';
import adminController from '../controllers/adminController.js';
import { authenticate, requireAdmin, requireSuperAdmin } from '../middleware/auth.js';

const router = Router();

/**
 * @route GET /api/admin/dashboard
 * @desc Dashboard administrativo
 * @access Admin
 */
router.get('/dashboard', authenticate, requireAdmin, adminController.getDashboard);

/**
 * @route GET /api/admin/audit-logs
 * @desc Obter logs de auditoria
 * @access Admin
 */
router.get('/audit-logs', authenticate, requireAdmin, adminController.getAuditLogs);

/**
 * @route GET /api/admin/reports/users
 * @desc Relatório de usuários
 * @access Admin
 */
router.get('/reports/users', authenticate, requireAdmin, adminController.getUsersReport);

/**
 * @route GET /api/admin/reports/workouts
 * @desc Relatório de treinos
 * @access Admin
 */
router.get('/reports/workouts', authenticate, requireAdmin, adminController.getWorkoutsReport);

/**
 * @route GET /api/admin/reports/financial
 * @desc Relatório financeiro
 * @access Admin
 */
router.get('/reports/financial', authenticate, requireAdmin, adminController.getFinancialReport);

/**
 * @route GET /api/admin/reports/companies
 * @desc Relatório de empresas
 * @access Admin
 */
router.get('/reports/companies', authenticate, requireAdmin, adminController.getCompaniesReport);

/**
 * @route GET /api/admin/export
 * @desc Exportar dados
 * @access Super Admin
 */
router.get('/export', authenticate, requireSuperAdmin, adminController.exportData);

/**
 * @route GET /api/admin/search
 * @desc Busca global
 * @access Admin
 */
router.get('/search', authenticate, requireAdmin, adminController.globalSearch);

/**
 * @route GET /api/admin/validation/queue
 * @desc Obter fila de validação de treinos
 * @access Admin
 */
router.get('/validation/queue', authenticate, requireAdmin, adminController.getValidationQueue);

/**
 * @route POST /api/admin/validation/:id/approve
 * @desc Aprovar treino
 * @access Admin
 */
router.post('/validation/:id/approve', authenticate, requireAdmin, adminController.approveValidation);

/**
 * @route POST /api/admin/validation/:id/reject
 * @desc Rejeitar treino
 * @access Admin
 */
router.post('/validation/:id/reject', authenticate, requireAdmin, adminController.rejectValidation);

/**
 * @route GET /api/admin/stats
 * @desc Obter estatísticas gerais
 * @access Admin
 */
router.get('/stats', authenticate, requireAdmin, adminController.getStats);

export default router;
