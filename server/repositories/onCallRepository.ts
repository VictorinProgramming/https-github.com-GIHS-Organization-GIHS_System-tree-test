import { query } from '../db.js';

export interface OnCallShiftRow {
  id: string;
  user_id: string;
  user_name: string;
  sector_id?: string;
  sector_name: string;
  device_id?: string;
  device_tag?: string;
  device_phone?: string;
  start_at: string;
  end_at: string;
  status: 'AGENDADO' | 'EM_SOBREAVISO' | 'FINALIZADO' | 'CANCELADO';
  notes?: string;
  created_by?: string;
  created_by_name?: string;
  created_at: string;
  updated_at: string;
}

export const onCallRepository = {
  async findAll(filters?: {
    sector_id?: string;
    user_id?: string;
    status?: string;
    from_date?: string;
    to_date?: string;
  }): Promise<OnCallShiftRow[]> {
    const conditions: string[] = ['1=1'];
    const params: any[] = [];
    let idx = 1;

    if (filters?.sector_id && filters.sector_id !== 'ALL') {
      conditions.push(`sector_id = $${idx++}`);
      params.push(filters.sector_id);
    }

    if (filters?.user_id && filters.user_id !== 'ALL') {
      conditions.push(`user_id = $${idx++}`);
      params.push(filters.user_id);
    }

    if (filters?.status && filters.status !== 'ALL') {
      conditions.push(`status = $${idx++}`);
      params.push(filters.status);
    }

    if (filters?.from_date) {
      conditions.push(`end_at >= $${idx++}`);
      params.push(filters.from_date);
    }

    if (filters?.to_date) {
      conditions.push(`start_at <= $${idx++}`);
      params.push(filters.to_date);
    }

    const sql = `
      SELECT * FROM on_call_shifts
      WHERE ${conditions.join(' AND ')}
      ORDER BY start_at DESC;
    `;

    const res = await query<OnCallShiftRow>(sql, params);
    return res.rows;
  },

  async findById(id: string): Promise<OnCallShiftRow | null> {
    const res = await query<OnCallShiftRow>(
      `SELECT * FROM on_call_shifts WHERE id = $1 LIMIT 1;`,
      [id]
    );
    return res.rows[0] || null;
  },

  async getCurrentActiveShifts(): Promise<OnCallShiftRow[]> {
    const res = await query<OnCallShiftRow>(`
      SELECT * FROM on_call_shifts
      WHERE status IN ('AGENDADO', 'EM_SOBREAVISO')
        AND start_at <= CURRENT_TIMESTAMP
        AND end_at >= CURRENT_TIMESTAMP
      ORDER BY start_at ASC;
    `);
    return res.rows;
  },

  async getUpcomingShifts(limit: number = 10): Promise<OnCallShiftRow[]> {
    const res = await query<OnCallShiftRow>(`
      SELECT * FROM on_call_shifts
      WHERE status = 'AGENDADO'
        AND start_at > CURRENT_TIMESTAMP
      ORDER BY start_at ASC
      LIMIT $1;
    `, [limit]);
    return res.rows;
  },

  /**
   * Validação de Conflito de Horários:
   * Verifica se o usuário já possui escala ativa ou agendada no mesmo período
   */
  async checkConflict(
    userId: string,
    startAt: string,
    endAt: string,
    excludeShiftId?: string
  ): Promise<{ hasConflict: boolean; conflictingShift?: OnCallShiftRow }> {
    const params: any[] = [userId, startAt, endAt];
    let sql = `
      SELECT * FROM on_call_shifts
      WHERE user_id = $1
        AND status IN ('AGENDADO', 'EM_SOBREAVISO')
        AND start_at < $3
        AND end_at > $2
    `;

    if (excludeShiftId) {
      sql += ` AND id != $4`;
      params.push(excludeShiftId);
    }

    sql += ` LIMIT 1;`;

    const res = await query<OnCallShiftRow>(sql, params);
    return {
      hasConflict: res.rows.length > 0,
      conflictingShift: res.rows[0] || undefined
    };
  },

  async create(shift: Partial<OnCallShiftRow>): Promise<OnCallShiftRow> {
    const id = shift.id || `shift-${Date.now()}-${Math.floor(Math.random() * 1000)}`;

    const res = await query<OnCallShiftRow>(`
      INSERT INTO on_call_shifts (
        id, user_id, user_name, sector_id, sector_name,
        device_id, device_tag, device_phone,
        start_at, end_at, status, notes,
        created_by, created_by_name
      ) VALUES (
        $1, $2, $3, $4, $5,
        $6, $7, $8,
        $9, $10, $11, $12,
        $13, $14
      )
      RETURNING *;
    `, [
      id,
      shift.user_id,
      shift.user_name,
      shift.sector_id || null,
      shift.sector_name,
      shift.device_id || null,
      shift.device_tag || null,
      shift.device_phone || null,
      shift.start_at,
      shift.end_at,
      shift.status || 'AGENDADO',
      shift.notes || null,
      shift.created_by || null,
      shift.created_by_name || null
    ]);

    return res.rows[0];
  },

  async update(id: string, updates: Partial<OnCallShiftRow>): Promise<OnCallShiftRow | null> {
    const fields: string[] = [];
    const values: any[] = [];
    let idx = 1;

    for (const [key, val] of Object.entries(updates)) {
      if (key !== 'id' && key !== 'created_at') {
        fields.push(`${key} = $${idx++}`);
        values.push(val);
      }
    }

    if (fields.length === 0) return this.findById(id);

    values.push(id);
    const sql = `
      UPDATE on_call_shifts
      SET ${fields.join(', ')}
      WHERE id = $${idx}
      RETURNING *;
    `;

    const res = await query<OnCallShiftRow>(sql, values);
    return res.rows[0] || null;
  },

  async delete(id: string): Promise<boolean> {
    const res = await query(`DELETE FROM on_call_shifts WHERE id = $1;`, [id]);
    return (res.rowCount || 0) > 0;
  }
};
