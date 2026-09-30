import { query } from '../db.js';

export interface SystemSettingsRow {
  key: string;
  value: any;
  updated_at: string;
}

export const settingsRepository = {
  async get(key: string): Promise<any> {
    const res = await query<SystemSettingsRow>(`
      SELECT value FROM system_settings WHERE key = $1 LIMIT 1;
    `, [key]);
    return res.rows[0]?.value || null;
  },

  async set(key: string, value: any): Promise<any> {
    const res = await query<SystemSettingsRow>(`
      INSERT INTO system_settings (key, value)
      VALUES ($1, $2)
      ON CONFLICT (key) DO UPDATE SET
        value = EXCLUDED.value,
        updated_at = CURRENT_TIMESTAMP
      RETURNING *;
    `, [key, JSON.stringify(value)]);
    return res.rows[0]?.value;
  },

  async getDatabaseProvider(): Promise<string> {
    const val = await this.get('database_provider');
    return val?.active || 'POSTGRESQL';
  },

  async getLogoConfig(): Promise<any> {
    const val = await this.get('system_logo');
    return val || {
      title: 'GIHS SYSTEMS',
      tagline: 'Enterprise System . 100% Monitorado',
      tagline_color: '#00A6FC',
      primary_color: '#00A6FC',
      secondary_color: '#0067FC',
      source: 'POSTGRESQL_DB',
      logo_url: '/gihs-logo.svg',
      is_custom: true,
      updated_at: new Date().toISOString()
    };
  },

  async setLogoConfig(config: any): Promise<any> {
    const payload = {
      ...config,
      source: 'POSTGRESQL_DB',
      updated_at: new Date().toISOString()
    };
    return await this.set('system_logo', payload);
  }
};
