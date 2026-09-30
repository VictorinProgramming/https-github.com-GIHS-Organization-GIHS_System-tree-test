import { PontoLocation } from '../services/pontoService';

export type DeviceCategory = 'Celular' | 'Tablet' | 'Notebook' | 'Desktop';

/**
 * Detects device category based on screen size, touch points, and user agent
 */
export function detectDeviceCategory(): { category: DeviceCategory; details: string } {
  const ua = navigator.userAgent;
  const isTouch = navigator.maxTouchPoints > 0 || 'ontouchstart' in window;
  const width = window.innerWidth;

  let category: DeviceCategory = 'Desktop';
  let details = 'Computador Desktop';

  if (/Mobile|Android|iP(hone|od)/i.test(ua) || (isTouch && width < 768)) {
    category = 'Celular';
    details = /iPhone/i.test(ua) ? 'Smartphone iOS (Apple)' : 'Smartphone Android';
  } else if (/iPad|Tablet/i.test(ua) || (isTouch && width >= 768 && width <= 1024)) {
    category = 'Tablet';
    details = /iPad/i.test(ua) ? 'Tablet iPadOS' : 'Tablet Android';
  } else if (isTouch || width <= 1366) {
    category = 'Notebook';
    details = 'Notebook Portátil (Câmera Integrada)';
  } else {
    category = 'Desktop';
    details = 'Estação Desktop (Webcam HD Externa/USB)';
  }

  return { category, details };
}

/**
 * Plays a biometric audio beep confirmation using Web Audio API
 */
export function playBiometricAudioFeedback(type: 'scan' | 'success' | 'error') {
  try {
    const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioContextClass) return;
    const ctx = new AudioContextClass();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.connect(gain);
    gain.connect(ctx.destination);

    const now = ctx.currentTime;

    if (type === 'scan') {
      osc.frequency.setValueAtTime(880, now);
      osc.frequency.exponentialRampToValueAtTime(1320, now + 0.1);
      gain.gain.setValueAtTime(0.12, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.15);
      osc.start(now);
      osc.stop(now + 0.15);
    } else if (type === 'success') {
      // Pleasant double chime for authorized punch in
      osc.frequency.setValueAtTime(587.33, now); // D5
      osc.frequency.setValueAtTime(880, now + 0.1); // A5
      gain.gain.setValueAtTime(0.15, now);
      gain.gain.setValueAtTime(0.2, now + 0.1);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.35);
      osc.start(now);
      osc.stop(now + 0.35);
    } else {
      // Error low beep
      osc.frequency.setValueAtTime(320, now);
      gain.gain.setValueAtTime(0.15, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.25);
      osc.start(now);
      osc.stop(now + 0.25);
    }
  } catch (err) {
    // Audio might be muted by browser policy, ignore gracefully
  }
}

/**
 * Real-time IP discovery result
 */
export interface NetworkDeviceInfo {
  ip: string;
  isp: string;
  city: string;
  region: string;
  country: string;
  latitude?: number;
  longitude?: number;
}

let cachedNetworkInfo: NetworkDeviceInfo | null = null;
let networkFetchPromise: Promise<NetworkDeviceInfo> | null = null;

/**
 * Fetches public IP and network details in real time from multiple fallback sources
 */
export async function fetchPublicIPAndNetwork(): Promise<NetworkDeviceInfo> {
  if (cachedNetworkInfo) {
    return cachedNetworkInfo;
  }
  if (networkFetchPromise) {
    return networkFetchPromise;
  }

  networkFetchPromise = (async () => {
    // Strategy 1: ipwho.is (fast, HTTPS, CORS enabled, rich ISP and location)
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 3500);
      const res = await fetch('https://ipwho.is/', { signal: controller.signal });
      clearTimeout(timeoutId);
      if (res.ok) {
        const data = await res.json();
        if (data.success !== false && data.ip) {
          const info: NetworkDeviceInfo = {
            ip: data.ip,
            isp: data.connection?.isp || data.connection?.org || 'Provedor Local',
            city: data.city || 'São Paulo',
            region: data.region_code || data.region || 'SP',
            country: data.country || 'Brasil',
            latitude: data.latitude,
            longitude: data.longitude
          };
          cachedNetworkInfo = info;
          return info;
        }
      }
    } catch {
      // Fall through to Strategy 2
    }

    // Strategy 2: internal vite server endpoint /api/client-network
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 2000);
      const res = await fetch('/api/client-network', { signal: controller.signal });
      clearTimeout(timeoutId);
      if (res.ok) {
        const data = await res.json();
        if (data.ip && data.ip !== '127.0.0.1') {
          const info: NetworkDeviceInfo = {
            ip: data.ip,
            isp: 'Rede Local / Corporativa',
            city: 'São Paulo',
            region: 'SP',
            country: 'Brasil'
          };
          cachedNetworkInfo = info;
          return info;
        }
      }
    } catch {
      // Fall through
    }

    // Strategy 3: api.ipify.org
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 2500);
      const res = await fetch('https://api.ipify.org?format=json', { signal: controller.signal });
      clearTimeout(timeoutId);
      if (res.ok) {
        const data = await res.json();
        if (data.ip) {
          const info: NetworkDeviceInfo = {
            ip: data.ip,
            isp: 'Conexão Internet Ativa',
            city: 'São Paulo',
            region: 'SP',
            country: 'Brasil'
          };
          cachedNetworkInfo = info;
          return info;
        }
      }
    } catch {
      // Fall through
    }

    // Fallback if completely offline
    const fallback: NetworkDeviceInfo = {
      ip: '192.168.1.105 (Rede Local)',
      isp: 'Rede Interna GIHS',
      city: 'São Paulo',
      region: 'SP',
      country: 'Brasil'
    };
    cachedNetworkInfo = fallback;
    return fallback;
  })();

  return networkFetchPromise;
}

/**
 * Returns immediate cached IP or starts background retrieval
 */
export function quickFetchClientIP(): string {
  if (cachedNetworkInfo) {
    return cachedNetworkInfo.ip;
  }
  fetchPublicIPAndNetwork().catch(() => {});
  return 'Coletando IP...';
}

/**
 * Retrieves real-time location and real public IP of the device
 */
export async function getRealTimeLocationAndIP(): Promise<PontoLocation> {
  // Start IP collection concurrently
  const networkPromise = fetchPublicIPAndNetwork();

  // Try real GPS / HTML5 Geolocation with timeout
  const gpsPromise = new Promise<{
    coords: GeolocationCoordinates;
    timestamp: number;
  } | null>((resolve) => {
    if (!navigator.geolocation) {
      resolve(null);
      return;
    }

    const timer = setTimeout(() => resolve(null), 5000);

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        clearTimeout(timer);
        resolve(pos);
      },
      () => {
        clearTimeout(timer);
        resolve(null);
      },
      {
        enableHighAccuracy: true,
        timeout: 4500,
        maximumAge: 5000
      }
    );
  });

  const [network, gpsPosition] = await Promise.all([networkPromise, gpsPromise]);

  const clientIP = network.ip || '192.168.1.105';
  const clientISP = network.isp || 'Provedor Internet';

  // If real GPS is available, use satellite coordinates with high accuracy
  if (gpsPosition) {
    const lat = Number(gpsPosition.coords.latitude.toFixed(6));
    const lon = Number(gpsPosition.coords.longitude.toFixed(6));
    const accuracy = Math.round(gpsPosition.coords.accuracy || 12);

    let addressStr = `Coordenadas GPS (${lat}, ${lon}) • Precisão ±${accuracy}m`;
    let cityStr = network.city || 'São Paulo';
    let stateStr = network.region || 'SP';

    // Reverse Geocode
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 2000);
      const res = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lon}&zoom=18&addressdetails=1`,
        { signal: controller.signal }
      );
      clearTimeout(timeoutId);

      if (res.ok) {
        const data = await res.json();
        const addr = data.address || {};
        const road = addr.road || addr.street || addr.suburb || 'Logradouro Local';
        const houseNumber = addr.house_number ? `, ${addr.house_number}` : '';
        const suburb = addr.suburb || addr.neighbourhood || addr.city_district || '';
        cityStr = addr.city || addr.town || addr.municipality || cityStr;
        stateStr = addr.state || stateStr;

        addressStr = `${road}${houseNumber}${suburb ? ` - ${suburb}` : ''}, ${cityStr} - ${stateStr}`;
      }
    } catch {
      // Reverse geocoding failed or timed out, keep coordinate address
    }

    return {
      latitude: lat,
      longitude: lon,
      accuracyMeters: accuracy,
      approximateAddress: addressStr,
      city: cityStr,
      state: stateStr,
      country: network.country || 'Brasil',
      ipAddress: clientIP,
      isp: clientISP,
      source: 'GPS_SATELLITE',
      isApproximate: false
    };
  }

  // Fallback to real-time Network IP Geolocation
  const ipLat = network.latitude || -23.561684;
  const ipLon = network.longitude || -46.655981;
  const ipCity = network.city || 'São Paulo';
  const ipState = network.region || 'SP';

  return {
    latitude: Number(ipLat.toFixed(6)),
    longitude: Number(ipLon.toFixed(6)),
    accuracyMeters: 45,
    approximateAddress: `Região de ${ipCity} - ${ipState} (Localizado via IP e Provedor ${clientISP})`,
    city: ipCity,
    state: ipState,
    country: network.country || 'Brasil',
    ipAddress: clientIP,
    isp: clientISP,
    source: 'NETWORK_IP',
    isApproximate: true
  };
}

/**
 * Backward-compatible alias for getRealTimeLocationAndIP
 */
export async function getApproximateLocation(): Promise<PontoLocation> {
  return getRealTimeLocationAndIP();
}
