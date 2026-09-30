import { query } from '../db.js';

export interface EquipmentRow {
  id: string;
  patrimony_tag: string;
  name: string;
  category: string;
  serial_number?: string;
  assigned_user_id?: string;
  assigned_user_name?: string;
  sector?: string;
  status: string;
  acquisition_date?: string;
  warranty_until?: string;
  specifications?: any;
  created_at: string;
  updated_at: string;
}

export const equipmentRepository = {
  async findAll(): Promise<EquipmentRow[]> {
    const res = await query<EquipmentRow>(`
      SELECT * FROM equipment
      ORDER BY patrimony_tag ASC;
    `);
    return res.rows;
  },

  async findById(id: string): Promise<EquipmentRow | null> {
    const res = await query<EquipmentRow>(`
      SELECT * FROM equipment WHERE id = $1 LIMIT 1;
    `, [id]);
    return res.rows[0] || null;
  },

  async findByTag(tag: string): Promise<EquipmentRow | null> {
    const res = await query<EquipmentRow>(`
      SELECT * FROM equipment WHERE patrimony_tag = $1 LIMIT 1;
    `, [tag]);
    return res.rows[0] || null;
  },

  async create(item: Partial<EquipmentRow>): Promise<EquipmentRow> {
    const res = await query<EquipmentRow>(`
      INSERT INTO equipment (
        id, patrimony_tag, name, category, serial_number,
        assigned_user_id, assigned_user_name, sector, status,
        acquisition_date, warranty_until, specifications
      ) VALUES (
        $1, $2, $3, $4, $5,
        $6, $7, $8, $9,
        $10, $11, $12
      )
      RETURNING *;
    `, [
      item.id || `eq-${Date.now()}`,
      item.patrimony_tag || `GIHS-${Math.floor(10000 + Math.random() * 90000)}`,
      item.name || 'Equipamento Corporativo',
      item.category || 'Informática',
      item.serial_number || null,
      item.assigned_user_id || null,
      item.assigned_user_name || null,
      item.sector || 'TI',
      item.status || 'Operacional',
      item.acquisition_date || new Date().toISOString().split('T')[0],
      item.warranty_until || null,
      item.specifications ? JSON.stringify(item.specifications) : null
    ]);
    return res.rows[0];
  },

  async update(id: string, updates: Partial<EquipmentRow>): Promise<EquipmentRow | null> {
    const fields: string[] = [];
    const values: any[] = [];
    let idx = 1;

    for (const [key, val] of Object.entries(updates)) {
      if (key !== 'id' && key !== 'created_at') {
        fields.push(`${key} = $${idx}`);
        values.push(key === 'specifications' && typeof val === 'object' ? JSON.stringify(val) : val);
        idx++;
      }
    }

    if (fields.length === 0) return this.findById(id);

    values.push(id);
    const sql = `
      UPDATE equipment
      SET ${fields.join(', ')}
      WHERE id = $${idx}
      RETURNING *;
    `;

    const res = await query<EquipmentRow>(sql, values);
    return res.rows[0] || null;
  },

  async delete(id: string): Promise<boolean> {
    const res = await query(`DELETE FROM equipment WHERE id = $1;`, [id]);
    return (res.rowCount ?? 0) > 0;
  },

  async deleteAll(): Promise<number> {
    const res = await query(`DELETE FROM equipment;`);
    return res.rowCount ?? 0;
  }
};
