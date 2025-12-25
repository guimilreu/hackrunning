import { S3Client, PutObjectCommand, DeleteObjectCommand, GetObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { awsConfig } from '../config/aws.js';
import { logger } from '../utils/logger.js';
import { nanoid } from 'nanoid';

const s3Client = new S3Client({
  region: awsConfig.region,
  credentials: {
    accessKeyId: awsConfig.accessKeyId,
    secretAccessKey: awsConfig.secretAccessKey
  }
});

const BUCKET_NAME = awsConfig.bucketName;
const CDN_URL = awsConfig.cdnUrl || `https://${BUCKET_NAME}.s3.${awsConfig.region}.amazonaws.com`;

/**
 * Upload de arquivo para S3
 */
export const uploadFile = async (buffer, key, contentType, options = {}) => {
  try {
    const command = new PutObjectCommand({
      Bucket: BUCKET_NAME,
      Key: key,
      Body: buffer,
      ContentType: contentType,
      // ACL removido - bucket configurado com ACLs desabilitadas
      // Controle de acesso público é feito via políticas de bucket
      CacheControl: options.cacheControl || 'max-age=31536000',
      ...options.metadata && { Metadata: options.metadata }
    });

    await s3Client.send(command);

    const url = options.private ? null : `${CDN_URL}/${key}`;

    logger.info('File uploaded to S3:', { key, size: buffer.length });

    return {
      key,
      url,
      size: buffer.length
    };
  } catch (error) {
    logger.error('Error uploading to S3:', error);
    throw error;
  }
};

/**
 * Upload de arquivo com estrutura de pastas organizada
 */
export const uploadOrganizedFile = async (buffer, folder, contentType, options = {}) => {
  const id = nanoid(12);
  const extension = getExtensionFromContentType(contentType);
  const key = `${folder}/${id}${extension}`;

  return uploadFile(buffer, key, contentType, options);
};

/**
 * Upload para pasta de treinos
 */
export const uploadWorkoutPhoto = async (buffer, userId, workoutId, contentType) => {
  const id = nanoid(8);
  const extension = getExtensionFromContentType(contentType);
  const key = `workouts/${userId}/${workoutId}/${id}${extension}`;

  return uploadFile(buffer, key, contentType);
};

/**
 * Upload para pasta de eventos
 */
export const uploadEventMedia = async (buffer, eventId, contentType, type = 'photo') => {
  const id = nanoid(8);
  const extension = getExtensionFromContentType(contentType);
  const folder = type === 'video' ? 'videos' : 'photos';
  const key = `events/${eventId}/${folder}/${id}${extension}`;

  return uploadFile(buffer, key, contentType);
};

/**
 * Upload para pasta de produtos
 */
export const uploadProductImage = async (buffer, productId, contentType) => {
  const id = nanoid(8);
  const extension = getExtensionFromContentType(contentType);
  const key = `products/${productId}/${id}${extension}`;

  return uploadFile(buffer, key, contentType);
};

/**
 * Upload para pasta de conteúdos
 */
export const uploadContentMedia = async (buffer, contentId, contentType) => {
  const id = nanoid(8);
  const extension = getExtensionFromContentType(contentType);
  const key = `content/${contentId}/${id}${extension}`;

  return uploadFile(buffer, key, contentType);
};

/**
 * Upload para pasta de perfil
 */
export const uploadProfilePhoto = async (buffer, userId, contentType) => {
  const extension = getExtensionFromContentType(contentType);
  const key = `profiles/${userId}/avatar${extension}`;

  return uploadFile(buffer, key, contentType);
};

/**
 * Deletar arquivo do S3
 */
export const deleteFile = async (key) => {
  try {
    const command = new DeleteObjectCommand({
      Bucket: BUCKET_NAME,
      Key: key
    });

    await s3Client.send(command);
    logger.info('File deleted from S3:', { key });

    return true;
  } catch (error) {
    logger.error('Error deleting from S3:', error);
    throw error;
  }
};

/**
 * Gerar URL assinada para acesso temporário
 */
export const getSignedUrlForKey = async (key, expiresIn = 3600) => {
  try {
    const command = new GetObjectCommand({
      Bucket: BUCKET_NAME,
      Key: key
    });

    const url = await getSignedUrl(s3Client, command, { expiresIn });

    return url;
  } catch (error) {
    logger.error('Error generating signed URL:', error);
    throw error;
  }
};

/**
 * Gerar URL assinada para upload direto (presigned URL)
 */
export const getPresignedUploadUrl = async (key, contentType, expiresIn = 300) => {
  try {
    const command = new PutObjectCommand({
      Bucket: BUCKET_NAME,
      Key: key,
      ContentType: contentType
    });

    const url = await getSignedUrl(s3Client, command, { expiresIn });

    return {
      uploadUrl: url,
      key,
      expiresIn
    };
  } catch (error) {
    logger.error('Error generating presigned upload URL:', error);
    throw error;
  }
};

/**
 * Obter URL pública de um arquivo
 */
export const getPublicUrl = (key) => {
  return `${CDN_URL}/${key}`;
};

/**
 * Verificar se arquivo existe
 */
export const fileExists = async (key) => {
  try {
    const command = new GetObjectCommand({
      Bucket: BUCKET_NAME,
      Key: key
    });

    await s3Client.send(command);
    return true;
  } catch (error) {
    if (error.name === 'NoSuchKey') {
      return false;
    }
    throw error;
  }
};

/**
 * Extrair extensão do content type
 */
const getExtensionFromContentType = (contentType) => {
  const mimeToExt = {
    'image/jpeg': '.jpg',
    'image/jpg': '.jpg',
    'image/png': '.png',
    'image/gif': '.gif',
    'image/webp': '.webp',
    'video/mp4': '.mp4',
    'video/webm': '.webm',
    'video/quicktime': '.mov',
    'application/pdf': '.pdf'
  };

  return mimeToExt[contentType] || '';
};

/**
 * Extrair key do URL completo
 */
export const extractKeyFromUrl = (url) => {
  if (!url) return null;
  
  try {
    const urlObj = new URL(url);
    return urlObj.pathname.slice(1); // Remove leading slash
  } catch {
    return url; // Se não for URL válida, retorna como está
  }
};

const s3Service = {
  uploadFile,
  uploadOrganizedFile,
  uploadWorkoutPhoto,
  uploadEventMedia,
  uploadProductImage,
  uploadContentMedia,
  uploadProfilePhoto,
  deleteFile,
  getSignedUrlForKey,
  getPresignedUploadUrl,
  getPublicUrl,
  fileExists,
  extractKeyFromUrl
};

export { s3Service };
export default s3Service;
