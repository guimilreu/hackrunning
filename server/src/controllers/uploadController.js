import { s3Service } from '../services/s3Service.js';
import { imageService } from '../services/imageService.js';

/**
 * Upload genérico de arquivo
 */
export const upload = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'Nenhum arquivo enviado'
      });
    }

    const { folder = 'uploads', processImage = true } = req.body;

    let result;
    const isImage = req.file.mimetype.startsWith('image/');

    if (isImage && processImage === 'true') {
      // Processar e fazer upload da imagem
      result = await imageService.processAndUploadImage(
        req.file.buffer,
        `${folder}/${Date.now()}`,
        { sizes: [{ width: 1200, suffix: '' }] }
      );
    } else {
      // Upload direto
      const key = `${folder}/${Date.now()}-${req.file.originalname}`;
      result = await s3Service.uploadFile(req.file.buffer, key, req.file.mimetype);
    }

    res.json({
      success: true,
      data: {
        url: result.url,
        key: result.key
      }
    });
  } catch (error) {
    console.error('Erro no upload:', error);
    res.status(500).json({
      success: false,
      message: 'Erro ao fazer upload'
    });
  }
};

/**
 * Upload múltiplo
 */
export const uploadMultiple = async (req, res) => {
  try {
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Nenhum arquivo enviado'
      });
    }

    const { folder = 'uploads' } = req.body;
    const results = [];

    for (const file of req.files) {
      const key = `${folder}/${Date.now()}-${file.originalname}`;
      const result = await s3Service.uploadFile(file.buffer, key, file.mimetype);
      results.push({
        originalName: file.originalname,
        url: result.url,
        key: result.key
      });
    }

    res.json({
      success: true,
      data: { files: results }
    });
  } catch (error) {
    console.error('Erro no upload:', error);
    res.status(500).json({
      success: false,
      message: 'Erro ao fazer upload'
    });
  }
};

/**
 * Gerar URL assinada para upload direto
 */
export const getPresignedUrl = async (req, res) => {
  try {
    const { fileName, contentType, folder = 'uploads' } = req.body;

    if (!fileName || !contentType) {
      return res.status(400).json({
        success: false,
        message: 'fileName e contentType são obrigatórios'
      });
    }

    const key = `${folder}/${Date.now()}-${fileName}`;
    const presignedUrl = await s3Service.getPresignedUploadUrl(key, contentType);

    res.json({
      success: true,
      data: {
        presignedUrl,
        key,
        finalUrl: `https://${process.env.AWS_BUCKET_NAME}.s3.${process.env.AWS_REGION}.amazonaws.com/${key}`
      }
    });
  } catch (error) {
    console.error('Erro ao gerar URL:', error);
    res.status(500).json({
      success: false,
      message: 'Erro ao gerar URL de upload'
    });
  }
};

/**
 * Deletar arquivo
 */
export const remove = async (req, res) => {
  try {
    const { key } = req.body;

    if (!key) {
      return res.status(400).json({
        success: false,
        message: 'Key do arquivo é obrigatória'
      });
    }

    await s3Service.deleteFile(key);

    res.json({
      success: true,
      message: 'Arquivo excluído'
    });
  } catch (error) {
    console.error('Erro ao excluir:', error);
    res.status(500).json({
      success: false,
      message: 'Erro ao excluir arquivo'
    });
  }
};

/**
 * Validar imagem antes do upload
 */
export const validateImage = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'Nenhuma imagem enviada'
      });
    }

    const { maxSize = 10, minWidth = 200, minHeight = 200 } = req.query;

    const validation = await imageService.validateImage(req.file.buffer, {
      maxSizeMB: parseInt(maxSize),
      allowedFormats: ['jpeg', 'jpg', 'png', 'webp'],
      minWidth: parseInt(minWidth),
      minHeight: parseInt(minHeight)
    });

    if (!validation.valid) {
      return res.status(400).json({
        success: false,
        message: validation.error,
        data: validation
      });
    }

    res.json({
      success: true,
      data: validation
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Erro ao validar imagem'
    });
  }
};

/**
 * Obter metadados de imagem
 */
export const getImageMetadata = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'Nenhuma imagem enviada'
      });
    }

    const metadata = await imageService.getImageMetadata(req.file.buffer);

    res.json({
      success: true,
      data: { metadata }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Erro ao obter metadados'
    });
  }
};

export default {
  upload,
  uploadMultiple,
  getPresignedUrl,
  remove,
  validateImage,
  getImageMetadata
};
