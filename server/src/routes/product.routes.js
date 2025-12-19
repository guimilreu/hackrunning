import { Router } from 'express';
import productController from '../controllers/productController.js';
import { authenticate, requireAdmin } from '../middleware/auth.js';
import { validate, schemas } from '../middleware/validation.js';
import multer from 'multer';

const router = Router();
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 } // 5MB
});

// ========== Rotas Públicas/Membro ==========

/**
 * @route GET /api/products
 * @desc Listar produtos ativos
 * @access Private
 */
router.get('/',
  authenticate,
  validate(schemas.pagination, 'query'),
  productController.list
);

/**
 * @route GET /api/products/categories
 * @desc Listar categorias
 * @access Private
 */
router.get('/categories', authenticate, productController.getCategories);

/**
 * @route GET /api/products/:id
 * @desc Obter produto por ID
 * @access Private
 */
router.get('/:id',
  authenticate,
  validate(schemas.objectId, 'params'),
  productController.getById
);

// ========== Rotas Admin ==========

/**
 * @route GET /api/products/admin/all
 * @desc Listar todos os produtos
 * @access Admin
 */
router.get('/admin/all',
  authenticate,
  requireAdmin,
  productController.listAll
);

/**
 * @route POST /api/products
 * @desc Criar produto
 * @access Admin
 */
router.post('/',
  authenticate,
  requireAdmin,
  validate(schemas.products.create),
  productController.create
);

/**
 * @route PUT /api/products/:id
 * @desc Atualizar produto
 * @access Admin
 */
router.put('/:id',
  authenticate,
  requireAdmin,
  validate(schemas.objectId, 'params'),
  validate(schemas.products.update),
  productController.update
);

/**
 * @route POST /api/products/:id/image
 * @desc Upload de imagem do produto
 * @access Admin
 */
router.post('/:id/image',
  authenticate,
  requireAdmin,
  validate(schemas.objectId, 'params'),
  upload.single('image'),
  productController.uploadImage
);

/**
 * @route PUT /api/products/:id/stock
 * @desc Atualizar estoque
 * @access Admin
 */
router.put('/:id/stock',
  authenticate,
  requireAdmin,
  validate(schemas.objectId, 'params'),
  productController.updateStock
);

/**
 * @route DELETE /api/products/:id
 * @desc Deletar produto
 * @access Admin
 */
router.delete('/:id',
  authenticate,
  requireAdmin,
  validate(schemas.objectId, 'params'),
  productController.remove
);

export default router;
