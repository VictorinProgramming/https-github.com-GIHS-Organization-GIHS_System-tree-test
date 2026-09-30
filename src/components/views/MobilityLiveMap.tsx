import React, { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import { Layers, MapPin, ZoomIn, ZoomOut, Crosshair, Navigation } from 'lucide-react';
import { RoutePoint, VehicleTrip } from '../../types';

interface MobilityLiveMapProps {
  trip?: VehicleTrip | null;
  routePoints?: RoutePoint[];
  livePoint?: { latitude: number; longitude: number; speed_kmh?: number; accuracy?: number } | null;
  userRealCoords?: { latitude: number; longitude: number; accuracy?: number; address?: string } | null;
  height?: string;
  interactive?: boolean;
}

type MapLayerType = 'STREETS' | 'SATELLITE' | 'DARK';

export const MobilityLiveMap: React.FC<MobilityLiveMapProps> = ({
  trip,
  routePoints = [],
  livePoint,
  userRealCoords,
  height = '420px',
  interactive = true,
}) => {
  const mapContainerRef = useRef<HTMLDivElement | null>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const polylineRef = useRef<L.Polyline | null>(null);
  const targetLineRef = useRef<L.Polyline | null>(null);
  const markersLayerRef = useRef<L.LayerGroup | null>(null);
  const tileLayerRef = useRef<L.TileLayer | null>(null);

  const [activeLayer, setActiveLayer] = useState<MapLayerType>('STREETS');

  // Marcador customizado para Ponto A (Partida Real) e Ponto B (Destino Real)
  const createPinIcon = (color: string, letter: 'A' | 'B', label: string, isPulse = false) => {
    return L.divIcon({
      className: 'gihs-map-marker',
      html: `
        <div style="position: relative; display: flex; flex-direction: column; align-items: center; pointer-events: auto;">
          ${isPulse ? `<div style="position: absolute; width: 38px; height: 38px; border-radius: 50%; background: ${color}; opacity: 0.35; animation: ping 1.5s cubic-bezier(0, 0, 0.2, 1) infinite; top: -7px;"></div>` : ''}
          <div style="width: 26px; height: 26px; border-radius: 50%; background: ${color}; border: 2.5px solid #ffffff; box-shadow: 0 0 14px ${color}; display: flex; align-items: center; justify-content: center; color: #ffffff; font-weight: 900; font-size: 11px; font-family: monospace;">
            ${letter}
          </div>
          <div style="margin-top: 3px; background: rgba(1, 18, 45, 0.95); border: 1px solid rgba(10, 40, 84, 0.9); color: #ffffff; font-size: 10px; font-weight: 700; font-family: monospace; padding: 2px 7px; border-radius: 6px; white-space: nowrap; box-shadow: 0 4px 10px rgba(0,0,0,0.6);">
            ${label}
          </div>
        </div>
      `,
      iconSize: [26, 26],
      iconAnchor: [13, 13],
    });
  };

  const createVehicleIcon = (plate?: string) => {
    return L.divIcon({
      className: 'gihs-vehicle-marker',
      html: `
        <div style="position: relative; display: flex; flex-direction: column; align-items: center;">
          <div style="position: absolute; width: 44px; height: 44px; border-radius: 50%; background: #0067FC; opacity: 0.45; animation: ping 1.2s cubic-bezier(0, 0, 0.2, 1) infinite; top: -10px;"></div>
          <div style="width: 30px; height: 30px; border-radius: 50%; background: #0067FC; border: 2.5px solid #ffffff; box-shadow: 0 0 18px #00A6FC; display: flex; align-items: center; justify-content: center; color: #ffffff;">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
              <path d="M19 17h2c.6 0 1-.4 1-1v-3c0-.9-.7-1.7-1.5-1.9C18.7 10.6 16 10 16 10s-1.3-1.4-2.2-2.3c-.5-.4-1.1-.7-1.8-.7H5c-.6 0-1.1.4-1.4.9l-1.4 2.9A3.7 3.7 0 0 0 2 12v4c0 .6.4 1 1 1h2"/>
              <circle cx="7" cy="17" r="2"/>
              <path d="M9 17h6"/>
              <circle cx="17" cy="17" r="2"/>
            </svg>
          </div>
          <div style="margin-top: 3px; background: #0067FC; color: #ffffff; font-size: 10px; font-weight: 800; font-family: monospace; padding: 2px 7px; border-radius: 6px; white-space: nowrap; box-shadow: 0 4px 10px rgba(0,0,0,0.6);">
            ${plate || 'EM ROTA'}
          </div>
        </div>
      `,
      iconSize: [30, 30],
      iconAnchor: [15, 15],
    });
  };

  const createRealUserGpsIcon = (accuracy?: number) => {
    return L.divIcon({
      className: 'gihs-user-real-gps',
      html: `
        <div style="position: relative; display: flex; flex-direction: column; align-items: center;">
          <div style="position: absolute; width: 48px; height: 48px; border-radius: 50%; background: #10B981; opacity: 0.35; animation: ping 1.5s cubic-bezier(0, 0, 0.2, 1) infinite; top: -12px;"></div>
          <div style="width: 24px; height: 24px; border-radius: 50%; background: #10B981; border: 2.5px solid #ffffff; box-shadow: 0 0 16px #10B981; display: flex; align-items: center; justify-content: center; color: #ffffff;">
            <div style="width: 8px; height: 8px; border-radius: 50%; background: #ffffff;"></div>
          </div>
          <div style="margin-top: 3px; background: #064E3B; border: 1px solid #10B981; color: #6EE7B7; font-size: 10px; font-weight: 800; font-family: monospace; padding: 2px 8px; border-radius: 6px; white-space: nowrap;">
            VOCÊ ESTÁ AQUI (GPS REAL ${accuracy ? `±${accuracy}m` : ''})
          </div>
        </div>
      `,
      iconSize: [24, 24],
      iconAnchor: [12, 12],
    });
  };

  const applyTileLayer = (map: L.Map, layerType: MapLayerType) => {
    if (tileLayerRef.current) {
      map.removeLayer(tileLayerRef.current);
      tileLayerRef.current = null;
    }

    let url = '';
    let attribution = '';
    let maxZoom = 19;
    let className = '';

    if (layerType === 'SATELLITE') {
      url = 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}';
      attribution = 'Esri, Maxar, Earthstar Geographics';
      maxZoom = 19;
    } else if (layerType === 'DARK') {
      url = 'https://tile.openstreetmap.org/{z}/{x}/{y}.png';
      attribution = '&copy; OpenStreetMap contributors';
      maxZoom = 19;
      className = 'gihs-dark-map-tiles';
    } else {
      url = 'https://tile.openstreetmap.org/{z}/{x}/{y}.png';
      attribution = '&copy; OpenStreetMap contributors';
      maxZoom = 19;
    }

    const newLayer = L.tileLayer(url, {
      maxZoom,
      attribution,
      className,
      crossOrigin: true,
    }).addTo(map);

    tileLayerRef.current = newLayer;
  };

  useEffect(() => {
    if (!mapContainerRef.current) return;

    if (mapInstanceRef.current) {
      mapInstanceRef.current.remove();
      mapInstanceRef.current = null;
    }

    const initialLat = userRealCoords?.latitude ?? trip?.start_latitude ?? -26.281311;
    const initialLng = userRealCoords?.longitude ?? trip?.start_longitude ?? -48.865129;

    const map = L.map(mapContainerRef.current, {
      center: [initialLat, initialLng],
      zoom: 15,
      zoomControl: false,
      dragging: interactive,
      scrollWheelZoom: interactive,
      attributionControl: false,
    });

    applyTileLayer(map, activeLayer);

    const markersLayer = L.layerGroup().addTo(map);
    markersLayerRef.current = markersLayer;

    // Rota realizada pelos pontos de GPS
    const polyline = L.polyline([], {
      color: '#0067FC',
      weight: 5,
      opacity: 0.95,
      smoothFactor: 1,
    }).addTo(map);
    polylineRef.current = polyline;

    // Linha de mira / projeção até o Ponto B
    const targetLine = L.polyline([], {
      color: '#10B981',
      weight: 3,
      opacity: 0.7,
      dashArray: '6, 8',
    }).addTo(map);
    targetLineRef.current = targetLine;

    mapInstanceRef.current = map;

    const timer = setTimeout(() => {
      map.invalidateSize();
    }, 150);

    const resizeObserver = new ResizeObserver(() => {
      map.invalidateSize();
    });
    if (mapContainerRef.current) {
      resizeObserver.observe(mapContainerRef.current);
    }

    return () => {
      clearTimeout(timer);
      resizeObserver.disconnect();
      map.remove();
      mapInstanceRef.current = null;
    };
  }, []);

  useEffect(() => {
    if (mapInstanceRef.current) {
      applyTileLayer(mapInstanceRef.current, activeLayer);
    }
  }, [activeLayer]);

  useEffect(() => {
    const map = mapInstanceRef.current;
    const polyline = polylineRef.current;
    const targetLine = targetLineRef.current;
    const markersLayer = markersLayerRef.current;
    if (!map || !polyline || !targetLine || !markersLayer) return;

    markersLayer.clearLayers();

    // Se NÃO houver viagem ativa/selecionada, exibe a localização real do usuário
    if (!trip) {
      if (userRealCoords && userRealCoords.latitude && userRealCoords.longitude) {
        const userMarker = L.marker([userRealCoords.latitude, userRealCoords.longitude], {
          icon: createRealUserGpsIcon(userRealCoords.accuracy),
        });
        userMarker.bindPopup(`
          <div style="font-family: sans-serif; color: #01122D; padding: 2px;">
            <strong style="color: #059669; font-size: 12px;">Sua Localização Real</strong>
            <p style="font-size: 11px; margin: 4px 0 0 0;">${userRealCoords.address || 'Sensor GPS do dispositivo ativo'}</p>
            <span style="font-size: 10px; font-family: monospace; color: #64748B;">
              Lat: ${userRealCoords.latitude.toFixed(6)}, Lng: ${userRealCoords.longitude.toFixed(6)}
            </span>
          </div>
        `);
        markersLayer.addLayer(userMarker);
        map.setView([userRealCoords.latitude, userRealCoords.longitude], 16);
      }
      polyline.setLatLngs([]);
      targetLine.setLatLngs([]);
      map.invalidateSize();
      return;
    }

    // Coordenadas dos pontos registrados de GPS
    const recordedLatLngs: L.LatLngExpression[] = [];

    const sortedPoints = [...routePoints].sort(
      (a, b) => new Date(a.recorded_at).getTime() - new Date(b.recorded_at).getTime()
    );

    sortedPoints.forEach((pt) => {
      if (pt.is_valid && pt.latitude && pt.longitude) {
        recordedLatLngs.push([pt.latitude, pt.longitude]);
      }
    });

    if (livePoint && livePoint.latitude && livePoint.longitude) {
      recordedLatLngs.push([livePoint.latitude, livePoint.longitude]);
    }

    // Identifica coordenadas de PONTO A
    let startCoord: [number, number] | null = null;
    if (trip.start_latitude && trip.start_longitude) {
      startCoord = [Number(trip.start_latitude), Number(trip.start_longitude)];
    } else if (recordedLatLngs.length > 0) {
      startCoord = recordedLatLngs[0] as [number, number];
    } else if (userRealCoords) {
      startCoord = [userRealCoords.latitude, userRealCoords.longitude];
    }

    // Identifica coordenadas de PONTO B (Destino Geocodificado)
    let destCoord: [number, number] | null = null;
    if (trip.destination_latitude && trip.destination_longitude) {
      destCoord = [Number(trip.destination_latitude), Number(trip.destination_longitude)];
    } else if (trip.end_latitude && trip.end_longitude && (trip.end_latitude !== trip.start_latitude || trip.end_longitude !== trip.start_longitude)) {
      destCoord = [Number(trip.end_latitude), Number(trip.end_longitude)];
    }

    // Se a rota não tem o startCoord como primeiro ponto, inclui
    if (startCoord && recordedLatLngs.length === 0) {
      recordedLatLngs.push(startCoord);
    }

    polyline.setLatLngs(recordedLatLngs);

    const boundsPoints: [number, number][] = [];

    // 1. PLOTA PONTO A (Partida Real)
    if (startCoord) {
      boundsPoints.push(startCoord);
      const startMarker = L.marker(startCoord, {
        icon: createPinIcon('#0067FC', 'A', 'Ponto A (Partida Real)'),
      });
      startMarker.bindPopup(`
        <div style="font-family: sans-serif; color: #01122D; padding: 3px;">
          <strong style="color: #0067FC; font-size: 12px;">Origem Real (Ponto A)</strong>
          <p style="font-size: 11px; margin: 4px 0 0 0; color: #334155;">${trip.origin_address || 'Partida'}</p>
          <span style="font-size: 10px; font-family: monospace; color: #64748B;">KM Inicial: ${trip.start_km} km</span>
        </div>
      `);
      markersLayer.addLayer(startMarker);
    }

    // 2. PLOTA PONTO B (Destino Real Geocodificado)
    if (destCoord) {
      boundsPoints.push(destCoord);
      const destMarker = L.marker(destCoord, {
        icon: createPinIcon('#10B981', 'B', 'Ponto B (Destino)', true),
      });
      destMarker.bindPopup(`
        <div style="font-family: sans-serif; color: #01122D; padding: 3px;">
          <strong style="color: #10B981; font-size: 12px;">Destino de Entrega (Ponto B)</strong>
          <p style="font-size: 11px; margin: 4px 0 0 0; color: #1e293b; font-weight: 600;">${trip.destination}</p>
          <span style="font-size: 10px; font-family: monospace; color: #64748B;">
            Lat: ${destCoord[0].toFixed(6)}, Lng: ${destCoord[1].toFixed(6)}
          </span>
        </div>
      `);
      markersLayer.addLayer(destMarker);
    }

    // 3. VEÍCULO / POSIÇÃO ATUAL EM TEMPO REAL
    if (recordedLatLngs.length > 0) {
      const currentPos = recordedLatLngs[recordedLatLngs.length - 1] as [number, number];
      boundsPoints.push(currentPos);

      if (trip.status === 'EM_ANDAMENTO') {
        const vehMarker = L.marker(currentPos, {
          icon: createVehicleIcon(trip.vehicle_plate),
          zIndexOffset: 1000,
        });
        vehMarker.bindPopup(`
          <div style="font-family: sans-serif; color: #01122D; padding: 2px;">
            <strong style="color: #0067FC; font-size: 12px;">Posição Atual em Tempo Real</strong>
            <p style="font-size: 11px; margin: 3px 0 0 0;"><strong>Destino:</strong> ${trip.destination}</p>
            <p style="font-size: 10px; font-family: monospace; color: #64748B; margin-top: 2px;">
              Placa: ${trip.vehicle_plate} • Vel: ${livePoint?.speed_kmh ?? trip.avg_speed_kmh} km/h
            </p>
          </div>
        `);
        markersLayer.addLayer(vehMarker);

        // Se houver Ponto B, traça linha guia da posição atual até o Ponto B
        if (destCoord) {
          targetLine.setLatLngs([currentPos, destCoord]);
        } else {
          targetLine.setLatLngs([]);
        }
      } else {
        targetLine.setLatLngs([]);
      }
    } else {
      targetLine.setLatLngs([]);
    }

    // Ajusta o enquadramento do mapa para exibir PONTO A e PONTO B juntos
    if (boundsPoints.length > 1) {
      const bounds = L.latLngBounds(boundsPoints);
      map.fitBounds(bounds, { padding: [50, 50], maxZoom: 16 });
    } else if (boundsPoints.length === 1) {
      map.setView(boundsPoints[0], 15);
    }

    map.invalidateSize();
  }, [trip, routePoints, livePoint, userRealCoords]);

  const handleZoomIn = () => {
    if (mapInstanceRef.current) mapInstanceRef.current.zoomIn();
  };

  const handleZoomOut = () => {
    if (mapInstanceRef.current) mapInstanceRef.current.zoomOut();
  };

  const handleCenterUser = () => {
    if (!mapInstanceRef.current) return;
    if (userRealCoords) {
      mapInstanceRef.current.setView([userRealCoords.latitude, userRealCoords.longitude], 16);
    } else if (trip?.start_latitude && trip?.start_longitude) {
      mapInstanceRef.current.setView([Number(trip.start_latitude), Number(trip.start_longitude)], 16);
    }
  };

  const handleFitRoute = () => {
    if (!mapInstanceRef.current) return;
    const pts: [number, number][] = [];
    if (trip?.start_latitude && trip?.start_longitude) {
      pts.push([Number(trip.start_latitude), Number(trip.start_longitude)]);
    }
    if (trip?.destination_latitude && trip?.destination_longitude) {
      pts.push([Number(trip.destination_latitude), Number(trip.destination_longitude)]);
    }
    if (pts.length > 1) {
      mapInstanceRef.current.fitBounds(L.latLngBounds(pts), { padding: [50, 50], maxZoom: 16 });
    }
  };

  return (
    <div className="relative w-full rounded-2xl overflow-hidden border border-[#0A2854] bg-[#000B1D] shadow-xl">
      {/* SELETOR DE CAMADAS / ESTILO DO MAPA (RUAS, SATÉLITE, ESCURO) */}
      <div className="absolute top-3 left-3 z-[1000] flex items-center gap-1 p-1 bg-[#01122D]/90 backdrop-blur-md border border-[#0A2854] rounded-xl shadow-lg">
        <button
          type="button"
          onClick={() => setActiveLayer('STREETS')}
          className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold transition-all cursor-pointer ${
            activeLayer === 'STREETS'
              ? 'bg-[#0067FC] text-white shadow'
              : 'text-slate-300 hover:text-white hover:bg-[#041838]'
          }`}
          title="Mapa de Ruas oficial OpenStreetMap"
        >
          Ruas (OSM)
        </button>

        <button
          type="button"
          onClick={() => setActiveLayer('SATELLITE')}
          className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold transition-all cursor-pointer ${
            activeLayer === 'SATELLITE'
              ? 'bg-[#0067FC] text-white shadow'
              : 'text-slate-300 hover:text-white hover:bg-[#041838]'
          }`}
          title="Fotografia de Satélite real (Esri)"
        >
          Satélite Real
        </button>

        <button
          type="button"
          onClick={() => setActiveLayer('DARK')}
          className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold transition-all cursor-pointer ${
            activeLayer === 'DARK'
              ? 'bg-[#0067FC] text-white shadow'
              : 'text-slate-300 hover:text-white hover:bg-[#041838]'
          }`}
          title="Modo Noturno GIHS System"
        >
          Noturno
        </button>
      </div>

      {/* CONTROLES FLUTUANTES DE ZOOM, CENTRALIZAR E ENQUADRAR ROTA */}
      <div className="absolute top-3 right-3 z-[1000] flex flex-col gap-1.5">
        <button
          type="button"
          onClick={handleCenterUser}
          className="w-8 h-8 rounded-xl bg-[#01122D]/90 backdrop-blur-md border border-[#0A2854] text-emerald-400 hover:text-emerald-300 hover:bg-[#041838] flex items-center justify-center shadow-lg transition-all cursor-pointer"
          title="Centralizar na sua localização GPS física atual"
        >
          <Crosshair className="w-4 h-4" />
        </button>

        {trip && (
          <button
            type="button"
            onClick={handleFitRoute}
            className="w-8 h-8 rounded-xl bg-[#01122D]/90 backdrop-blur-md border border-[#0A2854] text-[#00A6FC] hover:text-white hover:bg-[#041838] flex items-center justify-center shadow-lg transition-all cursor-pointer"
            title="Enquadrar Ponto A e Ponto B completos no mapa"
          >
            <Navigation className="w-4 h-4" />
          </button>
        )}

        <button
          type="button"
          onClick={handleZoomIn}
          className="w-8 h-8 rounded-xl bg-[#01122D]/90 backdrop-blur-md border border-[#0A2854] text-white hover:bg-[#041838] flex items-center justify-center shadow-lg transition-all cursor-pointer text-base font-bold"
          title="Aproximar zoom"
        >
          +
        </button>

        <button
          type="button"
          onClick={handleZoomOut}
          className="w-8 h-8 rounded-xl bg-[#01122D]/90 backdrop-blur-md border border-[#0A2854] text-white hover:bg-[#041838] flex items-center justify-center shadow-lg transition-all cursor-pointer text-base font-bold"
          title="Afastar zoom"
        >
          −
        </button>
      </div>

      {/* ESTILO CSS GLOBAL PARA O MODO NOTURNO */}
      <style>{`
        .gihs-dark-map-tiles {
          filter: brightness(0.65) invert(1) contrast(3) hue-rotate(205deg) saturate(0.3) brightness(0.75) !important;
        }
      `}</style>

      {/* CONTÊINER DO MAPA LEAFLET */}
      <div
        ref={mapContainerRef}
        style={{ height, width: '100%' }}
        className="z-0 touch-pan-x touch-pan-y"
      />
    </div>
  );
};
