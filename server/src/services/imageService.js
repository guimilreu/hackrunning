import sharp from 'sharp';
import { logger } from '../utils/logger.js';
import s3Service from './s3Service.js';
import { nanoid } from 'nanoid';

// Configurações de tamanho
const IMAGE_SIZES = {
  original: { width: 1920, quality: 80 },
  medium: { width: 800, quality: 75 },
  thumbnail: { width: 400, quality: 70 },
  profile: { width: 200, quality: 80 }
};

/**
 * Processar imagem com Sharp
 */
export const processImage = async (buffer, options = {}) => {
  const {
    width = null,
    height = null,
    quality = 80,
    format = 'webp',
    fit = 'inside'
  } = options;

  try {
    let pipeline = sharp(buffer);

    // Redimensionar se especificado
    if (width || height) {
      pipeline = pipeline.resize(width, height, {
        fit,
        withoutEnlargement: true
      });
    }

    // Converter para formato desejado
    switch (format) {
      case 'webp':
        pipeline = pipeline.webp({ quality });
        break;
      case 'jpeg':
      case 'jpg':
        pipeline = pipeline.jpeg({ quality });
        break;
      case 'png':
        pipeline = pipeline.png({ quality });
        break;
      default:
        pipeline = pipeline.webp({ quality });
    }

    const processedBuffer = await pipeline.toBuffer();

    logger.info('Image processed:', {
      originalSize: buffer.length,
      processedSize: processedBuffer.length,
      width,
      format
    });

    return processedBuffer;
  } catch (error) {
    logger.error('Error processing image:', error);
    throw error;
  }
};

/**
 * Processar e fazer upload de imagem em múltiplos tamanhos
 */
export const processAndUploadImage = async (buffer, folder, options = {}) => {
  const {
    sizes = ['original', 'medium', 'thumbnail'],
    format = 'webp'
  } = options;

  const id = nanoid(12);
  const results = {};

  try {
    for (const sizeName of sizes) {
      const sizeConfig = IMAGE_SIZES[sizeName];
      
      if (!sizeConfig) {
        logger.warn(`Unknown image size: ${sizeName}`);
        continue;
      }

      const processedBuffer = await processImage(buffer, {
        width: sizeConfig.width,
        quality: sizeConfig.quality,
        format
      });

      const key = `${folder}/${id}/${sizeName}.${format}`;
      const contentType = format === 'webp' ? 'image/webp' : `image/${format}`;

      const uploadResult = await s3Service.uploadFile(processedBuffer, key, contentType);
      
      results[sizeName] = {
        url: uploadResult.url,
        key: uploadResult.key,
        size: uploadResult.size
      };
    }

    return {
      id,
      ...results
    };
  } catch (error) {
    logger.error('Error processing and uploading image:', error);
    throw error;
  }
};

/**
 * Processar foto de treino
 */
export const processWorkoutPhoto = async (buffer, userId, workoutId) => {
  const folder = `workouts/${userId}/${workoutId}`;
  
  return processAndUploadImage(buffer, folder, {
    sizes: ['original', 'thumbnail']
  });
};

/**
 * Processar foto de evento
 */
export const processEventPhoto = async (buffer, eventId) => {
  const folder = `events/${eventId}/photos`;
  
  return processAndUploadImage(buffer, folder, {
    sizes: ['original', 'medium', 'thumbnail']
  });
};

/**
 * Processar imagem de produto
 */
export const processProductImage = async (buffer, productId) => {
  const folder = `products/${productId}`;
  
  return processAndUploadImage(buffer, folder, {
    sizes: ['original', 'medium', 'thumbnail']
  });
};

/**
 * Processar foto de perfil
 */
export const processProfilePhoto = async (buffer, userId) => {
  const folder = `profiles/${userId}`;
  
  // Foto de perfil é quadrada
  const processedBuffer = await sharp(buffer)
    .resize(200, 200, { fit: 'cover' })
    .webp({ quality: 80 })
    .toBuffer();

  const key = `${folder}/avatar.webp`;
  const uploadResult = await s3Service.uploadFile(processedBuffer, key, 'image/webp');

  return {
    url: uploadResult.url,
    key: uploadResult.key
  };
};

/**
 * Processar thumbnail de vídeo (se necessário)
 */
export const processVideoThumbnail = async (buffer) => {
  return processImage(buffer, {
    width: 400,
    quality: 70,
    format: 'webp'
  });
};

/**
 * Extrair metadados da imagem
 */
export const getImageMetadata = async (buffer) => {
  try {
    const metadata = await sharp(buffer).metadata();
    
    return {
      width: metadata.width,
      height: metadata.height,
      format: metadata.format,
      size: buffer.length,
      hasAlpha: metadata.hasAlpha,
      orientation: metadata.orientation
    };
  } catch (error) {
    logger.error('Error extracting image metadata:', error);
    throw error;
  }
};

/**
 * Validar imagem (tamanho, formato, dimensões)
 */
export const validateImage = async (buffer, options = {}) => {
  const {
    maxSizeMB = 10,
    allowedFormats = ['jpeg', 'jpg', 'png', 'webp', 'gif'],
    minWidth = 100,
    minHeight = 100,
    maxWidth = 4000,
    maxHeight = 4000
  } = options;

  const errors = [];

  // Verificar tamanho
  const sizeMB = buffer.length / (1024 * 1024);
  if (sizeMB > maxSizeMB) {
    errors.push(`Imagem muito grande. Máximo: ${maxSizeMB}MB`);
  }

  try {
    const metadata = await getImageMetadata(buffer);

    // Verificar formato
    if (!allowedFormats.includes(metadata.format)) {
      errors.push(`Formato não permitido. Permitidos: ${allowedFormats.join(', ')}`);
    }

    // Verificar dimensões mínimas
    if (metadata.width < minWidth || metadata.height < minHeight) {
      errors.push(`Imagem muito pequena. Mínimo: ${minWidth}x${minHeight}px`);
    }

    // Verificar dimensões máximas
    if (metadata.width > maxWidth || metadata.height > maxHeight) {
      errors.push(`Imagem muito grande. Máximo: ${maxWidth}x${maxHeight}px`);
    }

    return {
      valid: errors.length === 0,
      errors,
      metadata
    };
  } catch (error) {
    return {
      valid: false,
      errors: ['Arquivo de imagem inválido'],
      metadata: null
    };
  }
};

/**
 * Rotacionar imagem baseado no EXIF
 */
export const autoRotate = async (buffer) => {
  try {
    return await sharp(buffer).rotate().toBuffer();
  } catch (error) {
    logger.error('Error auto-rotating image:', error);
    return buffer;
  }
};

const imageService = {
  processImage,
  processAndUploadImage,
  processWorkoutPhoto,
  processEventPhoto,
  processProductImage,
  processProfilePhoto,
  processVideoThumbnail,
  getImageMetadata,
  validateImage,
  autoRotate,
  IMAGE_SIZES
};

export { imageService };
export default imageService;
