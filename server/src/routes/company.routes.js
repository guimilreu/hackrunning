import { Router } from 'express';
import companyController from '../controllers/companyController.js';
import { authenticate, requireAdmin } from '../middleware/auth.js';
import { validate, schemas } from '../middleware/validation.js';

const router = Router();

// ========== Rotas do Gestor Corporativo ==========

/**
 * @route GET /api/companies/:companyId/dashboard
 * @desc Obter dashboard da empresa
 * @access Private (gestor ou admin)
 */
router.get('/:companyId/dashboard',
  authenticate,
  validate(schemas.objectId, 'params'),
  companyController.getDashboard
);

/**
 * @route GET /api/companies/:companyId/employees
 * @desc Listar funcionários
 * @access Private (gestor ou admin)
 */
router.get('/:companyId/employees',
  authenticate,
  validate(schemas.objectId, 'params'),
  companyController.getEmployees
);

/**
 * @route POST /api/companies/:companyId/employees
 * @desc Adicionar funcionário
 * @access Private (gestor ou admin)
 */
router.post('/:companyId/employees',
  authenticate,
  validate(schemas.objectId, 'params'),
  companyController.addEmployee
);

/**
 * @route DELETE /api/companies/:companyId/employees/:userId
 * @desc Remover funcionário
 * @access Private (gestor ou admin)
 */
router.delete('/:companyId/employees/:userId',
  authenticate,
  companyController.removeEmployee
);

/**
 * @route GET /api/companies/:companyId/activity-report
 * @desc Obter relatório de atividades
 * @access Private (gestor ou admin)
 */
router.get('/:companyId/activity-report',
  authenticate,
  validate(schemas.objectId, 'params'),
  companyController.getActivityReport
);

// ========== Rotas Admin ==========

/**
 * @route GET /api/companies
 * @desc Listar todas as empresas
 * @access Admin
 */
router.get('/',
  authenticate,
  requireAdmin,
  companyController.list
);

/**
 * @route GET /api/companies/:id
 * @desc Obter empresa por ID
 * @access Admin
 */
router.get('/:id',
  authenticate,
  requireAdmin,
  validate(schemas.objectId, 'params'),
  companyController.getById
);

/**
 * @route POST /api/companies
 * @desc Criar empresa
 * @access Admin
 */
router.post('/',
  authenticate,
  requireAdmin,
  validate(schemas.companies.create),
  companyController.create
);

/**
 * @route PUT /api/companies/:id
 * @desc Atualizar empresa
 * @access Admin
 */
router.put('/:id',
  authenticate,
  requireAdmin,
  validate(schemas.objectId, 'params'),
  validate(schemas.companies.update),
  companyController.update
);

/**
 * @route DELETE /api/companies/:id
 * @desc Desativar empresa
 * @access Admin
 */
router.delete('/:id',
  authenticate,
  requireAdmin,
  validate(schemas.objectId, 'params'),
  companyController.deactivate
);

export default router;
