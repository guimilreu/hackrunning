'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';

/**
 * Componente de mapa para eventos usando Mapbox GL JS
 * @param {Object} props
 * @param {number} props.lat - Latitude
 * @param {number} props.lng - Longitude
 * @param {string} props.name - Nome do evento (para popup)
 * @param {string} props.address - Endereço do evento (para popup)
 * @param {number} props.zoom - Nível de zoom (padrão: 14)
 * @param {string} props.className - Classes CSS adicionais
 * @param {boolean} props.showMarker - Se deve mostrar marcador (padrão: true)
 */
export function EventMap({ 
  lat, 
  lng, 
  name = '', 
  address = '', 
  zoom = 14,
  className = '',
  showMarker = true 
}) {
  const mapContainer = useRef(null);
  const map = useRef(null);
  const marker = useRef(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  // Função para adicionar/atualizar o marker
  const addMarker = useCallback(() => {
    if (!map.current || !showMarker) return;

    // Remove marker existente
    if (marker.current) {
      marker.current.remove();
      marker.current = null;
    }

    const popupContent = name || address ? `
      <div style="color: #000; padding: 6px; max-width: 250px;">
        ${name ? `<strong style="font-size: 14px; display: block; margin-bottom: 4px;">${name}</strong>` : ''}
        ${address ? `<span style="font-size: 12px; color: #666;">${address}</span>` : ''}
      </div>
    ` : '';

    const popup = popupContent 
      ? new mapboxgl.Popup({ offset: 25, closeButton: true }).setHTML(popupContent)
      : null;

    marker.current = new mapboxgl.Marker({ color: '#eeff00', scale: 1.2 })
      .setLngLat([lng, lat])
      .setPopup(popup)
      .addTo(map.current);
  }, [lat, lng, name, address, showMarker]);

  // Inicialização do mapa (apenas uma vez)
  useEffect(() => {
    if (map.current) return; // Já inicializado
    if (!mapContainer.current) return;

    const accessToken = process.env.NEXT_PUBLIC_MAPBOX_TOKEN;
    
    if (!accessToken) {
      console.error('[EventMap] NEXT_PUBLIC_MAPBOX_TOKEN não configurado!');
      setError('Token do Mapbox não configurado');
      setIsLoading(false);
      return;
    }

    // Validação de coordenadas
    if (typeof lat !== 'number' || typeof lng !== 'number' || isNaN(lat) || isNaN(lng)) {
      console.error('[EventMap] Coordenadas inválidas:', { lat, lng });
      setError('Coordenadas inválidas');
      setIsLoading(false);
      return;
    }

    mapboxgl.accessToken = accessToken;

    try {
      map.current = new mapboxgl.Map({
        container: mapContainer.current,
        style: 'mapbox://styles/mapbox/dark-v11',
        center: [lng, lat],
        zoom: zoom,
        attributionControl: false,
        antialias: true,
        pitch: 0,
        bearing: 0,
        minZoom: 5,
        maxZoom: 18
      });

      map.current.addControl(new mapboxgl.AttributionControl({ compact: true }));
      map.current.addControl(new mapboxgl.NavigationControl(), 'top-right');

      map.current.on('load', () => {
        setIsLoading(false);
        addMarker();
      });

      map.current.on('error', (e) => {
        console.error('[EventMap] Erro no mapa:', e);
        setError('Erro ao carregar o mapa');
        setIsLoading(false);
      });

    } catch (err) {
      console.error('[EventMap] Erro ao inicializar:', err);
      setError('Erro ao inicializar o mapa');
      setIsLoading(false);
    }

    // Cleanup apenas quando o componente desmontar
    return () => {
      if (marker.current) {
        marker.current.remove();
        marker.current = null;
      }
      if (map.current) {
        map.current.remove();
        map.current = null;
      }
    };
  }, []); // Sem dependências - roda apenas na montagem

  // Atualiza marker quando as props de localização mudam
  useEffect(() => {
    if (!map.current || !map.current.loaded()) return;
    
    // Atualiza o centro do mapa
    map.current.easeTo({
      center: [lng, lat],
      zoom: zoom,
      duration: 500
    });

    // Atualiza o marker
    addMarker();
  }, [lat, lng, name, address, zoom, showMarker, addMarker]);

  if (error) {
    return (
      <div className={`w-full h-full bg-zinc-800 rounded-xl flex flex-col items-center justify-center text-center p-4 ${className}`}>
        <div className="text-red-400 text-xs mb-2">⚠️ {error}</div>
        <div className="text-zinc-500 text-xs">
          Verifique o console para mais detalhes
        </div>
      </div>
    );
  }

  return (
    <div className={`relative w-full h-full ${className}`}>
      {isLoading && (
        <div className="absolute inset-0 bg-zinc-800 rounded-xl flex flex-col items-center justify-center z-10">
          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary mb-2"></div>
          <div className="text-zinc-500 text-xs">Carregando mapa...</div>
        </div>
      )}
      <div 
        ref={mapContainer} 
        className="w-full h-full rounded-xl overflow-hidden"
        style={{ minHeight: '200px' }}
      />
    </div>
  );
}

