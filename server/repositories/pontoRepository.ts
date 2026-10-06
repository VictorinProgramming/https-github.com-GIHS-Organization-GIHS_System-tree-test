import { query } from '../db.ts';

export interface PontoRow {
  id: string;
  nsr: string;
  user_id: string;
  collaborator_name: string;
  collaborator_sector?: string;
  type: string;
  punch_date: string;
  punch_time: string;
  unix_timestamp: number;
  photo_url?: string;
  biometric_match_confidence?: number;
  sha256_hash: string;
  device_type?: string;
  device_details?: string;
  ip_address?: string;
  latitude?: number;
  longitude?: number;
  accuracy_meters?: number;
  approximate_address?: string;
  city?: string;
  state?: string;
  created_at: string;
}

export const pontoRepository = {
  async findAll(limit: number = 100): Promise<PontoRow[]> {
    const res = await query<PontoRow>(`
      SELECT * FROM ponto_records
      ORDER BY unix_timestamp DESC
      LIMIT $1;
    `, [limit]);
    return res.rows;
  },

  async findByUserId(userId: string, limit: number = 50): Promise<PontoRow[]> {
    const res = await query<PontoRow>(`
      SELECT * FROM ponto_records
      WHERE user_id = $1
      ORDER BY unix_timestamp DESC
      LIMIT $2;
    `, [userId, limit]);
    return res.rows;
  },

  async findByDateRange(startDate: string, endDate: string): Promise<PontoRow[]> {
    const res = await query<PontoRow>(`
      SELECT * FROM ponto_records
      WHERE punch_date >= $1 AND punch_date <= $2
      ORDER BY unix_timestamp ASC;
    `, [startDate, endDate]);
    return res.rows;
  },

  async create(record: Partial<PontoRow>): Promise<PontoRow> {
    let normalizedType = record.type || 'ENTRADA';
    if (normalizedType === 'INÍCIO DO INTERVALO' || normalizedType === 'INICIO DO INTERVALO') {
      normalizedType = 'INICIO_INTERVALO';
    } else if (normalizedType === 'SAÍDA') {
      normalizedType = 'SAIDA';
    }

    const res = await query<PontoRow>(`
      INSERT INTO ponto_records (
        id, nsr, user_id, collaborator_name, collaborator_sector,
        type, punch_date, punch_time, unix_timestamp,
        photo_url, biometric_match_confidence, sha256_hash,
        device_type, device_details, ip_address,
        latitude, longitude, accuracy_meters, approximate_address, city, state
      ) VALUES (
        $1, $2, $3, $4, $5,
        $6, $7, $8, $9,
        $10, $11, $12,
        $13, $14, $15,
        $16, $17, $18, $19, $20, $21
      )
      RETURNING *;
    `, [
      record.id || `ponto-${Date.now()}`,
      record.nsr || `NSR-${Date.now()}`,
      record.user_id,
      record.collaborator_name,
      record.collaborator_sector || 'Geral',
      normalizedType,
      record.punch_date || new Date().toISOString().split('T')[0],
      record.punch_time || new Date().toTimeString().split(' ')[0],
      record.unix_timestamp || Date.now(),
      record.photo_url || null,
      record.biometric_match_confidence || 99.4,
      record.sha256_hash || 'SHA256_FALLBACK_HASH',
      record.device_type || 'Desktop/Browser',
      record.device_details || null,
      record.ip_address || '127.0.0.1',
      record.latitude || null,
      record.longitude || null,
      record.accuracy_meters || null,
      record.approximate_address || null,
      record.city || 'São Paulo',
      record.state || 'SP'
    ]);
    const row = res.rows[0];
    if (row && row.type === 'INICIO_INTERVALO') (row as any).type = 'INÍCIO DO INTERVALO';
    if (row && row.type === 'SAIDA') (row as any).type = 'SAÍDA';
    return row;
  }
};
