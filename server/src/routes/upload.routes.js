import { Router } from 'express';
import uploadController from '../controllers/uploadController.js';
import { authenticate, requireAdmin } from '../middleware/auth.js';
import multer from 'multer';

const router = Router();
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 50 * 1024 * 1024 } // 50MB máximo
});

/**
 * @route POST /api/upload
 * @desc Upload de arquivo
 * @access Private
 */
router.post('/',
  authenticate,
  upload.single('file'),
  uploadController.upload
);

/**
 * @route POST /api/upload/multiple
 * @desc Upload múltiplo
 * @access Private
 */
router.post('/multiple',
  authenticate,
  upload.array('files', 10),
  uploadController.uploadMultiple
);

/**
 * @route POST /api/upload/presigned-url
 * @desc Gerar URL assinada para upload direto
 * @access Private
 */
router.post('/presigned-url',
  authenticate,
  uploadController.getPresignedUrl
);

/**
 * @route POST /api/upload/validate-image
 * @desc Validar imagem antes do upload
 * @access Private
 */
router.post('/validate-image',
  authenticate,
  upload.single('image'),
  uploadController.validateImage
);

/**
 * @route POST /api/upload/image-metadata
 * @desc Obter metadados de imagem
 * @access Private
 */
router.post('/image-metadata',
  authenticate,
  upload.single('image'),
  uploadController.getImageMetadata
);

/**
 * @route DELETE /api/upload
 * @desc Deletar arquivo
 * @access Admin
 */
router.delete('/',
  authenticate,
  requireAdmin,
  uploadController.remove
);

export default router;
