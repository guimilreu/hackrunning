import { Router } from 'express';
import contentController from '../controllers/contentController.js';
import { authenticate, requireAdmin } from '../middleware/auth.js';
import { validate, schemas } from '../middleware/validation.js';
import multer from 'multer';

const router = Router();
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 } // 5MB
});

// ========== Rotas do Membro ==========

/**
 * @route GET /api/content
 * @desc Listar conteúdos
 * @access Private
 */
router.get('/',
  authenticate,
  validate(schemas.pagination, 'query'),
  contentController.list
);

/**
 * @route GET /api/content/categories
 * @desc Listar categorias
 * @access Private
 */
router.get('/categories', authenticate, contentController.getCategories);

/**
 * @route GET /api/content/tags
 * @desc Listar tags
 * @access Private
 */
router.get('/tags', authenticate, contentController.getTags);

/**
 * @route GET /api/content/search
 * @desc Buscar conteúdos
 * @access Private
 */
router.get('/search', authenticate, contentController.search);

/**
 * @route GET /api/content/:id
 * @desc Obter conteúdo por ID
 * @access Private
 */
router.get('/:id',
  authenticate,
  validate(schemas.objectId, 'params'),
  contentController.getById
);

// ========== Rotas Admin ==========

/**
 * @route GET /api/content/admin/all
 * @desc Listar todos os conteúdos
 * @access Admin
 */
router.get('/admin/all',
  authenticate,
  requireAdmin,
  contentController.listAll
);

/**
 * @route POST /api/content
 * @desc Criar conteúdo
 * @access Admin
 */
router.post('/',
  authenticate,
  requireAdmin,
  validate(schemas.content.create),
  contentController.create
);

/**
 * @route PUT /api/content/:id
 * @desc Atualizar conteúdo
 * @access Admin
 */
router.put('/:id',
  authenticate,
  requireAdmin,
  validate(schemas.objectId, 'params'),
  validate(schemas.content.update),
  contentController.update
);

/**
 * @route POST /api/content/:id/thumbnail
 * @desc Upload de thumbnail
 * @access Admin
 */
router.post('/:id/thumbnail',
  authenticate,
  requireAdmin,
  validate(schemas.objectId, 'params'),
  upload.single('thumbnail'),
  contentController.uploadThumbnail
);

/**
 * @route POST /api/content/:id/publish
 * @desc Publicar conteúdo
 * @access Admin
 */
router.post('/:id/publish',
  authenticate,
  requireAdmin,
  validate(schemas.objectId, 'params'),
  contentController.publish
);

/**
 * @route POST /api/content/:id/unpublish
 * @desc Despublicar conteúdo
 * @access Admin
 */
router.post('/:id/unpublish',
  authenticate,
  requireAdmin,
  validate(schemas.objectId, 'params'),
  contentController.unpublish
);

/**
 * @route DELETE /api/content/:id
 * @desc Deletar conteúdo
 * @access Admin
 */
router.delete('/:id',
  authenticate,
  requireAdmin,
  validate(schemas.objectId, 'params'),
  contentController.remove
);

export default router;
