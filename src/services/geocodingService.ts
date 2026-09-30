/**
 * GIHS System — Serviço de Geolocalização Reversa e Geocodificação de Endereços
 * Utiliza OpenStreetMap Nominatim sem necessidade de chave de API.
 */

export interface GeocodingResult {
  displayName: string;
  shortName: string;
  latitude: number;
  longitude: number;
  address?: {
    road?: string;
    houseNumber?: string;
    suburb?: string;
    city?: string;
    state?: string;
    postcode?: string;
  };
}

class GeocodingService {
  private cache = new Map<string, GeocodingResult[]>();

  /**
   * Converte texto de endereço (Rua, Bairro, Cidade) em Coordenadas GPS (Lat / Lng)
   */
  async searchAddress(
    queryText: string,
    nearLocation?: { latitude: number; longitude: number; city?: string }
  ): Promise<GeocodingResult[]> {
    const trimmed = queryText.trim();
    if (!trimmed || trimmed.length < 3) return [];

    const cacheKey = trimmed.toLowerCase();
    if (this.cache.has(cacheKey)) {
      return this.cache.get(cacheKey)!;
    }

    try {
      // Se não contiver cidade ou estado e temos a cidade atual do usuário, anexa para precisão local
      let enhancedQuery = trimmed;
      if (
        nearLocation?.city &&
        !trimmed.toLowerCase().includes(nearLocation.city.toLowerCase()) &&
        !trimmed.toLowerCase().includes('brasil')
      ) {
        enhancedQuery = `${trimmed}, ${nearLocation.city}`;
      }

      const params = new URLSearchParams({
        q: enhancedQuery,
        format: 'json',
        addressdetails: '1',
        countrycodes: 'br',
        limit: '5',
      });

      if (nearLocation) {
        // Dá prioridade aos arredores da localização do usuário
        const delta = 0.5; // ~50km
        params.append(
          'viewbox',
          `${nearLocation.longitude - delta},${nearLocation.latitude + delta},${nearLocation.longitude + delta},${nearLocation.latitude - delta}`
        );
      }

      let res = await fetch(`https://nominatim.openstreetmap.org/search?${params.toString()}`, {
        headers: { 'User-Agent': 'GIHS-System-Mobility/2.0' },
      });

      let data = await res.json();

      // Se não encontrou com enhancedQuery, tenta com a query original limpa
      if ((!data || data.length === 0) && enhancedQuery !== trimmed) {
        const fallbackParams = new URLSearchParams({
          q: trimmed,
          format: 'json',
          addressdetails: '1',
          countrycodes: 'br',
          limit: '5',
        });
        res = await fetch(`https://nominatim.openstreetmap.org/search?${fallbackParams.toString()}`, {
          headers: { 'User-Agent': 'GIHS-System-Mobility/2.0' },
        });
        data = await res.json();
      }

      if (!Array.isArray(data)) return [];

      const results: GeocodingResult[] = data.map((item: any) => {
        const road = item.address?.road || item.address?.pedestrian || item.name || '';
        const houseNumber = item.address?.house_number || '';
        const suburb = item.address?.suburb || item.address?.neighbourhood || '';
        const city = item.address?.city || item.address?.town || item.address?.municipality || '';
        const state = item.address?.state || '';

        const shortName = [road, houseNumber, suburb, city].filter(Boolean).join(', ') || item.display_name;

        return {
          displayName: item.display_name,
          shortName,
          latitude: parseFloat(item.lat),
          longitude: parseFloat(item.lon),
          address: {
            road,
            houseNumber,
            suburb,
            city,
            state,
            postcode: item.address?.postcode,
          },
        };
      });

      this.cache.set(cacheKey, results);
      return results;
    } catch (err) {
      console.warn('[Geocoding] Falha na busca Nominatim:', err);
      return [];
    }
  }

  /**
   * Converte Coordenadas GPS (Lat / Lng) em Endereço Legível
   */
  async reverseGeocode(latitude: number, longitude: number): Promise<GeocodingResult | null> {
    try {
      const res = await fetch(
        `https://nominatim.openstreetmap.org/reverse?lat=${latitude}&lon=${longitude}&format=json&addressdetails=1`,
        { headers: { 'User-Agent': 'GIHS-System-Mobility/2.0' } }
      );

      if (!res.ok) return null;
      const data = await res.json();
      if (!data || !data.address) return null;

      const road = data.address.road || data.address.pedestrian || '';
      const houseNumber = data.address.house_number || '';
      const suburb = data.address.suburb || data.address.neighbourhood || '';
      const city = data.address.city || data.address.town || data.address.municipality || '';
      const state = data.address.state || '';

      const shortName = [road, houseNumber, suburb, city].filter(Boolean).join(', ') || data.display_name;

      return {
        displayName: data.display_name,
        shortName,
        latitude,
        longitude,
        address: {
          road,
          houseNumber,
          suburb,
          city,
          state,
          postcode: data.address.postcode,
        },
      };
    } catch (err) {
      console.warn('[Geocoding] Falha no reverse geocode:', err);
      return null;
    }
  }
}

export const geocodingService = new GeocodingService();
