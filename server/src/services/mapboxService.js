import axios from 'axios';
import { mapboxConfig } from '../config/mapbox.js';
import { logger } from '../utils/logger.js';

/**
 * Serviço para integração com Mapbox API
 * - Geocoding: converter endereço em coordenadas
 * - Reverse Geocoding: converter coordenadas em endereço
 */

const MAPBOX_API_BASE = 'https://api.mapbox.com';

/**
 * Converte um endereço em coordenadas (lat, lng)
 * @param {string} address - Endereço completo
 * @param {string} city - Cidade
 * @param {string} state - Estado
 * @returns {Promise<{lat: number, lng: number, placeName?: string, accuracy?: string} | null>}
 */
export const geocodeAddress = async (address, city, state) => {
  try {
    if (!mapboxConfig.accessToken) {
      logger.warn('Mapbox access token não configurado');
      return null;
    }

    // Validação básica
    if (!address || !city || !state) {
      logger.warn('Dados de endereço incompletos para geocoding');
      return null;
    }

    // Monta o endereço completo para busca
    const fullAddress = `${address}, ${city}, ${state}, Brasil`.trim();
    
    // Codifica o endereço para URL
    const encodedAddress = encodeURIComponent(fullAddress);
    
    const url = `${MAPBOX_API_BASE}/geocoding/v5/mapbox.places/${encodedAddress}.json`;
    
    // Bounding box aproximado do Brasil para melhorar precisão
    // [minLng, minLat, maxLng, maxLat]
    const bboxBrazil = '-73.9904,-33.7512,-28.8404,5.2718';
    
    const response = await axios.get(url, {
      params: {
        access_token: mapboxConfig.accessToken,
        country: 'BR', // Limita busca ao Brasil
        bbox: bboxBrazil, // Melhora precisão limitando ao território brasileiro
        limit: 1,
        types: 'address,poi,place' // Prioriza endereços e pontos de interesse
      },
      timeout: 10000 // Timeout de 10 segundos
    });

    if (response.data && response.data.features && response.data.features.length > 0) {
      const feature = response.data.features[0];
      const [lng, lat] = feature.center;
      
      // Validação de coordenadas (Brasil está entre essas coordenadas)
      if (lat < -33.7512 || lat > 5.2718 || lng < -73.9904 || lng > -28.8404) {
        logger.warn(`Coordenadas fora do Brasil: (${lat}, ${lng}) para ${fullAddress}`);
        // Mesmo assim retorna, pode ser um erro do Mapbox
      }
      
      const result = {
        lat,
        lng,
        placeName: feature.place_name || fullAddress,
        accuracy: feature.properties?.accuracy || 'unknown',
        relevance: feature.relevance || 0
      };
      
      logger.info(`Geocoding bem-sucedido: ${fullAddress} -> (${lat}, ${lng}), relevância: ${result.relevance}`);
      
      // Se a relevância for muito baixa (< 0.5), avisa mas ainda retorna
      if (result.relevance < 0.5) {
        logger.warn(`Baixa relevância (${result.relevance}) para: ${fullAddress}`);
      }
      
      return result;
    }

    logger.warn(`Nenhum resultado encontrado para: ${fullAddress}`);
    return null;
  } catch (error) {
    if (error.response) {
      logger.error('Erro na resposta do Mapbox:', {
        status: error.response.status,
        data: error.response.data,
        address,
        city,
        state
      });
    } else if (error.request) {
      logger.error('Erro de conexão com Mapbox:', {
        error: error.message,
        address,
        city,
        state
      });
    } else {
      logger.error('Erro ao fazer geocoding:', {
        error: error.message,
        address,
        city,
        state
      });
    }
    return null;
  }
};

/**
 * Converte coordenadas em endereço (reverse geocoding)
 * @param {number} lat - Latitude
 * @param {number} lng - Longitude
 * @returns {Promise<string | null>}
 */
export const reverseGeocode = async (lat, lng) => {
  try {
    if (!mapboxConfig.accessToken) {
      logger.warn('Mapbox access token não configurado');
      return null;
    }

    const url = `${MAPBOX_API_BASE}/geocoding/v5/mapbox.places/${lng},${lat}.json`;
    
    const response = await axios.get(url, {
      params: {
        access_token: mapboxConfig.accessToken,
        country: 'BR',
        limit: 1
      }
    });

    if (response.data && response.data.features && response.data.features.length > 0) {
      const feature = response.data.features[0];
      return feature.place_name;
    }

    return null;
  } catch (error) {
    logger.error('Erro ao fazer reverse geocoding:', {
      error: error.message,
      lat,
      lng
    });
    return null;
  }
};

/**
 * Busca sugestões de endereços (autocomplete)
 * @param {string} query - Texto de busca
 * @param {string} proximity - Coordenadas de proximidade (lng,lat) - opcional
 * @param {string} bbox - Bounding box (minLng,minLat,maxLng,maxLat) - opcional
 * @returns {Promise<Array>}
 */
export const searchPlaces = async (query, proximity = null, bbox = null) => {
  try {
    if (!mapboxConfig.accessToken) {
      logger.warn('Mapbox access token não configurado');
      return [];
    }

    if (!query || query.trim().length < 3) {
      return [];
    }

    const encodedQuery = encodeURIComponent(query.trim());
    const url = `${MAPBOX_API_BASE}/geocoding/v5/mapbox.places/${encodedQuery}.json`;
    
    // Bounding box do Brasil por padrão
    const bboxBrazil = '-73.9904,-33.7512,-28.8404,5.2718';
    
    const params = {
      access_token: mapboxConfig.accessToken,
      country: 'BR',
      limit: 5,
      types: 'address,poi,place',
      bbox: bbox || bboxBrazil
    };

    // Proximity deve ser no formato "lng,lat"
    if (proximity) {
      params.proximity = proximity;
    }

    const response = await axios.get(url, { 
      params,
      timeout: 10000
    });

    if (response.data && response.data.features) {
      return response.data.features.map(feature => ({
        id: feature.id,
        name: feature.place_name,
        address: feature.text,
        coordinates: {
          lat: feature.center[1],
          lng: feature.center[0]
        },
        context: feature.context,
        relevance: feature.relevance || 0,
        types: feature.place_type || []
      }));
    }

    return [];
  } catch (error) {
    logger.error('Erro ao buscar lugares:', {
      error: error.message,
      query
    });
    return [];
  }
};

export default {
  geocodeAddress,
  reverseGeocode,
  searchPlaces
};

