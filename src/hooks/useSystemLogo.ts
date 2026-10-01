import { useState, useEffect, useCallback } from 'react';
import { apiBackendService } from '../services/apiBackendService';

export interface SystemLogoData {
  title?: string;
  tagline?: string;
  tagline_color?: string;
  primary_color?: string;
  secondary_color?: string;
  logo_url?: string | null;
  is_custom?: boolean;
  updated_at?: string;
}

const DEFAULT_LOGO_DATA: SystemLogoData = {
  title: 'GIHS SYSTEMS',
  tagline: 'Enterprise System . 100% Monitorado',
  tagline_color: '#00A6FC',
  primary_color: '#00A6FC',
  secondary_color: '#0067FC',
  logo_url: '/gihs-logo.svg',
  is_custom: true,
  updated_at: new Date().toISOString()
};

const STORAGE_KEY = 'gihs_system_logo_config';
const EVENT_KEY = 'gihs_system_logo_updated';

export function useSystemLogo() {
  const [logoData, setLogoData] = useState<SystemLogoData>(() => {
    try {
      const cached = localStorage.getItem(STORAGE_KEY);
      if (cached) {
        return JSON.parse(cached);
      }
    } catch {
      // fallback
    }
    return DEFAULT_LOGO_DATA;
  });

  const [isLoading, setIsLoading] = useState<boolean>(false);

  const fetchLogo = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await apiBackendService.getSystemLogo();
      if (res && res.success && res.data) {
        setLogoData(res.data);
        localStorage.setItem(STORAGE_KEY, JSON.stringify(res.data));
      }
    } catch (err) {
      console.warn('Could not load logo from server, using local fallback:', err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchLogo();

    const handleSync = (e: CustomEvent<SystemLogoData>) => {
      if (e.detail) {
        setLogoData(e.detail);
      }
    };

    window.addEventListener(EVENT_KEY as any, handleSync);
    return () => {
      window.removeEventListener(EVENT_KEY as any, handleSync);
    };
  }, [fetchLogo]);

  const updateLogoInPostgres = useCallback(async (data: Partial<SystemLogoData>) => {
    setIsLoading(true);
    try {
      const payload: SystemLogoData = {
        ...logoData,
        ...data,
        updated_at: new Date().toISOString()
      };

      const res = await apiBackendService.updateSystemLogo(payload);
      if (res && res.success) {
        const saved = res.data || payload;
        setLogoData(saved);
        localStorage.setItem(STORAGE_KEY, JSON.stringify(saved));
        window.dispatchEvent(new CustomEvent(EVENT_KEY, { detail: saved }));
        return { success: true, data: saved };
      } else {
        // Still save locally for seamless offline UX
        setLogoData(payload);
        localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
        window.dispatchEvent(new CustomEvent(EVENT_KEY, { detail: payload }));
        return { success: true, data: payload };
      }
    } catch (err: any) {
      console.error('Error updating logo in PostgreSQL:', err);
      // Save locally to avoid blocking user experience
      const payload: SystemLogoData = {
        ...logoData,
        ...data,
        updated_at: new Date().toISOString()
      };
      setLogoData(payload);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
      window.dispatchEvent(new CustomEvent(EVENT_KEY, { detail: payload }));
      return { success: true, data: payload, error: err.message };
    } finally {
      setIsLoading(false);
    }
  }, [logoData]);

  const resetLogoInPostgres = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await apiBackendService.resetSystemLogo();
      const target = (res && res.success && res.data) ? res.data : DEFAULT_LOGO_DATA;
      setLogoData(target);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(target));
      window.dispatchEvent(new CustomEvent(EVENT_KEY, { detail: target }));
      return { success: true, data: target };
    } catch (err: any) {
      setLogoData(DEFAULT_LOGO_DATA);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(DEFAULT_LOGO_DATA));
      window.dispatchEvent(new CustomEvent(EVENT_KEY, { detail: DEFAULT_LOGO_DATA }));
      return { success: true, data: DEFAULT_LOGO_DATA };
    } finally {
      setIsLoading(false);
    }
  }, []);

  return {
    logoData,
    isLoading,
    updateLogoInPostgres,
    resetLogoInPostgres,
    refetchLogo: fetchLogo
  };
}
