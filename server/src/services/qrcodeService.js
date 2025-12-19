import QRCode from 'qrcode';
import { logger } from '../utils/logger.js';
import s3Service from './s3Service.js';

/**
 * Gerar QR Code como Data URL (para exibição direta)
 */
export const generateDataUrl = async (content, options = {}) => {
  try {
    const defaultOptions = {
      width: 300,
      margin: 2,
      color: {
        dark: '#000000',
        light: '#ffffff'
      },
      errorCorrectionLevel: 'M',
      ...options
    };

    const dataUrl = await QRCode.toDataURL(content, defaultOptions);
    
    logger.info('QR Code generated as data URL:', { content: content.substring(0, 20) });
    
    return dataUrl;
  } catch (error) {
    logger.error('Error generating QR Code data URL:', error);
    throw error;
  }
};

/**
 * Gerar QR Code como Buffer PNG
 */
export const generateBuffer = async (content, options = {}) => {
  try {
    const defaultOptions = {
      width: 300,
      margin: 2,
      color: {
        dark: '#000000',
        light: '#ffffff'
      },
      errorCorrectionLevel: 'M',
      ...options
    };

    const buffer = await QRCode.toBuffer(content, defaultOptions);
    
    logger.info('QR Code generated as buffer:', { content: content.substring(0, 20) });
    
    return buffer;
  } catch (error) {
    logger.error('Error generating QR Code buffer:', error);
    throw error;
  }
};

/**
 * Gerar QR Code como SVG string
 */
export const generateSvg = async (content, options = {}) => {
  try {
    const defaultOptions = {
      width: 300,
      margin: 2,
      color: {
        dark: '#000000',
        light: '#ffffff'
      },
      errorCorrectionLevel: 'M',
      ...options
    };

    const svg = await QRCode.toString(content, { ...defaultOptions, type: 'svg' });
    
    return svg;
  } catch (error) {
    logger.error('Error generating QR Code SVG:', error);
    throw error;
  }
};

/**
 * Gerar QR Code e salvar no S3
 */
export const generateAndUpload = async (content, folder, options = {}) => {
  try {
    const buffer = await generateBuffer(content, options);
    
    const key = `${folder}/${content}.png`;
    const result = await s3Service.uploadFile(buffer, key, 'image/png');
    
    logger.info('QR Code uploaded to S3:', { key });
    
    return {
      url: result.url,
      key: result.key,
      dataUrl: await generateDataUrl(content, options)
    };
  } catch (error) {
    logger.error('Error generating and uploading QR Code:', error);
    throw error;
  }
};

/**
 * Gerar QR Code para resgate
 */
export const generateRedemptionQRCode = async (redemptionCode) => {
  try {
    // O conteúdo do QR Code será o código de resgate
    // Pode ser alterado para incluir URL de validação
    const content = redemptionCode;
    
    // Gerar apenas data URL (não salvar no S3 por enquanto)
    const dataUrl = await generateDataUrl(content, {
      width: 300,
      margin: 2,
      color: {
        dark: '#000000',
        light: '#ffffff'
      }
    });
    
    return {
      code: redemptionCode,
      dataUrl
    };
  } catch (error) {
    logger.error('Error generating redemption QR Code:', error);
    throw error;
  }
};

/**
 * Gerar QR Code para evento
 */
export const generateEventQRCode = async (eventId, eventName) => {
  try {
    // URL do evento no app
    const content = `${process.env.FRONTEND_URL}/events/${eventId}`;
    
    const dataUrl = await generateDataUrl(content, {
      width: 400,
      margin: 3
    });
    
    return {
      eventId,
      url: content,
      dataUrl
    };
  } catch (error) {
    logger.error('Error generating event QR Code:', error);
    throw error;
  }
};

/**
 * Gerar QR Code para check-in de evento
 */
export const generateEventCheckInQRCode = async (eventId, userId) => {
  try {
    // Conteúdo para check-in
    const content = JSON.stringify({
      type: 'event_checkin',
      eventId,
      userId,
      timestamp: Date.now()
    });
    
    const dataUrl = await generateDataUrl(content, {
      width: 300,
      margin: 2
    });
    
    return {
      eventId,
      userId,
      dataUrl
    };
  } catch (error) {
    logger.error('Error generating event check-in QR Code:', error);
    throw error;
  }
};

/**
 * Decodificar conteúdo de QR Code (para validação)
 * Nota: Isso seria feito no frontend, mas incluímos helpers para parsing
 */
export const parseRedemptionCode = (content) => {
  // O código de resgate é simplesmente o conteúdo
  return {
    type: 'redemption',
    code: content
  };
};

export const parseEventCheckIn = (content) => {
  try {
    const data = JSON.parse(content);
    if (data.type === 'event_checkin') {
      return data;
    }
    return null;
  } catch {
    return null;
  }
};

const qrcodeService = {
  generateDataUrl,
  generateBuffer,
  generateSvg,
  generateAndUpload,
  generateRedemptionQRCode,
  generateEventQRCode,
  generateEventCheckInQRCode,
  parseRedemptionCode,
  parseEventCheckIn
};

export { qrcodeService };
export default qrcodeService;
