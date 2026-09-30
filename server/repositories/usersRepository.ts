import { query } from '../db.js';
import { hashPassword, validatePasswordRules, sanitizeUser } from '../security.js';

export interface UserRow {
  id: string;
  name: string;
  email: string;
  password_hash?: string;
  role: string;
  user_role: string;
  hierarchy_level?: number;
  sector_id?: string;
  sector_name?: string;
  area?: string;
  avatar_url?: string;
  phone?: string;
  admission_date?: string;
  status: string;
  current_task?: string;
  contract_type?: string;
  salary_bracket?: string;
  work_schedule?: string;
  emergency_contact?: string;
  is_active: boolean;
  is_blocked: boolean;
  facial_active: boolean;
  facial_photo_url?: string;
  facial_biometric_hash?: string;
  facial_landmarks_count?: number;
  facial_confidence_score?: number;
  facial_registered_at?: string;
  created_at: string;
  updated_at: string;
}

export type SafeUserRow = Omit<UserRow, 'password_hash'>;

export const usersRepository = {
  /**
   * Retorna todos os usuários com sanitização estrita de credenciais (sem hashes de senha expostos)
   */
  async findAll(): Promise<SafeUserRow[]> {
    const res = await query<UserRow>(`
      SELECT 
        id, name, email, role, user_role, hierarchy_level,
        sector_id, sector_name, area, avatar_url, phone, admission_date,
        status, current_task, contract_type, salary_bracket, work_schedule,
        emergency_contact, is_active, is_blocked,
        facial_active, facial_photo_url, facial_biometric_hash,
        facial_landmarks_count, facial_confidence_score, facial_registered_at,
        created_at, updated_at
      FROM users
      ORDER BY hierarchy_level ASC, name ASC;
    `);
    return res.rows.map(u => sanitizeUser(u) as SafeUserRow);
  },

  /**
   * Busca usuário por ID sem expor o hash de senha
   */
  async findById(id: string): Promise<SafeUserRow | null> {
    const res = await query<UserRow>(`
      SELECT 
        id, name, email, role, user_role, hierarchy_level,
        sector_id, sector_name, area, avatar_url, phone, admission_date,
        status, current_task, contract_type, salary_bracket, work_schedule,
        emergency_contact, is_active, is_blocked,
        facial_active, facial_photo_url, facial_biometric_hash,
        facial_landmarks_count, facial_confidence_score, facial_registered_at,
        created_at, updated_at
      FROM users
      WHERE id = $1 LIMIT 1;
    `, [id]);
    return sanitizeUser(res.rows[0]) as SafeUserRow || null;
  },

  /**
   * Busca usuário por e-mail sem expor o hash de senha
   */
  async findByEmail(email: string): Promise<SafeUserRow | null> {
    const res = await query<UserRow>(`
      SELECT 
        id, name, email, role, user_role, hierarchy_level,
        sector_id, sector_name, area, avatar_url, phone, admission_date,
        status, current_task, contract_type, salary_bracket, work_schedule,
        emergency_contact, is_active, is_blocked,
        facial_active, facial_photo_url, facial_biometric_hash,
        facial_landmarks_count, facial_confidence_score, facial_registered_at,
        created_at, updated_at
      FROM users
      WHERE LOWER(email) = LOWER($1) LIMIT 1;
    `, [email.trim()]);
    return sanitizeUser(res.rows[0]) as SafeUserRow || null;
  },

  /**
   * Método de uso INTERNO e EXCLUSIVO da camada de autenticação (authController).
   * Retorna o password_hash para validação criptográfica timing-safe.
   */
  async findByEmailWithCredentials(email: string): Promise<UserRow | null> {
    const res = await query<UserRow>(`
      SELECT * FROM users
      WHERE LOWER(email) = LOWER($1) LIMIT 1;
    `, [email.trim()]);
    return res.rows[0] || null;
  },

  /**
   * Criação segura de usuário com hashing PBKDF2 automático de senhas
   */
  async create(user: Partial<UserRow> & { password?: string }): Promise<SafeUserRow> {
    let secureHash: string | null = null;
    const rawPass = user.password || user.password_hash;
    if (rawPass) {
      if (rawPass.startsWith('pbkdf2$')) {
        secureHash = rawPass;
      } else {
        const check = validatePasswordRules(rawPass);
        if (!check.isValid) {
          throw new Error(`A senha não atende aos requisitos de segurança: ${check.errors.join('. ')}`);
        }
        secureHash = hashPassword(rawPass);
      }
    }

    const res = await query<UserRow>(`
      INSERT INTO users (
        id, name, email, password_hash, role, user_role, hierarchy_level,
        sector_id, sector_name, area, avatar_url, phone, admission_date,
        status, current_task, contract_type, salary_bracket, work_schedule,
        emergency_contact, is_active, is_blocked,
        facial_active, facial_photo_url, facial_biometric_hash,
        facial_landmarks_count, facial_confidence_score, facial_registered_at
      ) VALUES (
        $1, $2, $3, $4, $5, $6, $7,
        $8, $9, $10, $11, $12, $13,
        $14, $15, $16, $17, $18,
        $19, $20, $21,
        $22, $23, $24,
        $25, $26, $27
      )
      RETURNING *;
    `, [
      user.id || `user-${Date.now()}`,
      user.name,
      user.email,
      secureHash,
      user.role || 'Colaborador',
      user.user_role || 'COLABORADOR',
      user.hierarchy_level || 4,
      user.sector_id || null,
      user.sector_name || null,
      user.area || null,
      user.avatar_url || null,
      user.phone || null,
      user.admission_date || new Date().toISOString().split('T')[0],
      user.status || 'Em atividade',
      user.current_task || 'Aguardando atribuição',
      user.contract_type || 'CLT',
      user.salary_bracket || null,
      user.work_schedule || '08:00 - 18:00 (Segunda a Sexta)',
      user.emergency_contact || null,
      user.is_active !== undefined ? user.is_active : true,
      user.is_blocked !== undefined ? user.is_blocked : false,
      user.facial_active !== undefined ? user.facial_active : false,
      user.facial_photo_url || null,
      user.facial_biometric_hash || null,
      user.facial_landmarks_count || 68,
      user.facial_confidence_score || 99.4,
      user.facial_registered_at || null,
    ]);
    return sanitizeUser(res.rows[0]) as SafeUserRow;
  },

  /**
   * Atualização segura de usuário com proteção e hashing de credenciais
   */
  async update(id: string, updates: Record<string, any>): Promise<SafeUserRow | null> {
    // If facialData object is passed, flatten it
    if (updates.facialData && typeof updates.facialData === 'object') {
      if (updates.facialData.photoUrl) updates.facial_photo_url = updates.facialData.photoUrl;
      if (updates.facialData.biometricHash) updates.facial_biometric_hash = updates.facialData.biometricHash;
      if (updates.facialData.confidenceScore) updates.facial_confidence_score = updates.facialData.confidenceScore;
      if (updates.facialData.landmarksCount) updates.facial_landmarks_count = updates.facialData.landmarksCount;
      if (updates.facialData.registeredAt) updates.facial_registered_at = updates.facialData.registeredAt;
      if (updates.facialData.active !== undefined) updates.facial_active = updates.facialData.active;
      if (updates.facialData.notes) updates.facial_notes = updates.facialData.notes;
    }

    const keyMap: Record<string, string> = {
      userRole: 'user_role',
      sector: 'sector_name',
      sectorName: 'sector_name',
      sectorId: 'sector_id',
      avatar: 'avatar_url',
      avatarUrl: 'avatar_url',
      admissionDate: 'admission_date',
      currentTask: 'current_task',
      contractType: 'contract_type',
      salaryBracket: 'salary_bracket',
      workSchedule: 'work_schedule',
      emergencyContact: 'emergency_contact',
      isBlocked: 'is_blocked',
      isActive: 'is_active',
      password: 'password_hash',
      passwordHash: 'password_hash',
      temporaryPassword: 'password_hash',
      hierarchyLevel: 'hierarchy_level',
      facialActive: 'facial_active',
      facialPhotoUrl: 'facial_photo_url',
      facialBiometricHash: 'facial_biometric_hash',
      facialConfidenceScore: 'facial_confidence_score',
      facialLandmarksCount: 'facial_landmarks_count',
      facialRegisteredAt: 'facial_registered_at',
      facialNotes: 'facial_notes',
      photoUrl: 'facial_photo_url',
      biometricHash: 'facial_biometric_hash',
      landmarksCount: 'facial_landmarks_count',
      confidenceScore: 'facial_confidence_score',
      registeredAt: 'facial_registered_at'
    };

    const allowedColumns = new Set([
      'name', 'email', 'password_hash', 'role', 'user_role', 'hierarchy_level',
      'sector_id', 'sector_name', 'area', 'avatar_url', 'phone', 'admission_date',
      'status', 'current_task', 'contract_type', 'salary_bracket', 'work_schedule',
      'emergency_contact', 'is_active', 'is_blocked', 'facial_active', 'facial_photo_url',
      'facial_biometric_hash', 'facial_landmarks_count', 'facial_confidence_score', 'facial_registered_at',
      'facial_notes'
    ]);

    // Check if user exists; if not, upsert create
    let existing = await this.findById(id);
    if (!existing && updates.email) {
      existing = await this.findByEmail(updates.email);
    }
    if (!existing) {
      return this.create({
        id,
        name: updates.name || 'Colaborador',
        email: updates.email || `${id}@bycomp.com.br`,
        ...updates
      });
    }

    const fields: string[] = [];
    const values: any[] = [];
    let idx = 1;

    for (const [key, val] of Object.entries(updates)) {
      if (key === 'id' || key === 'created_at' || key === 'updated_at' || key === 'facialData') continue;
      const col = keyMap[key] || key;
      if (!allowedColumns.has(col)) continue;

      let valueToStore = val;
      // Se for alteração de senha, valida requisitos corporativos e obrigatoriamente aplica PBKDF2 com Salt
      if (col === 'password_hash') {
        if (typeof val === 'string' && val.trim()) {
          if (val.startsWith('pbkdf2$')) {
            valueToStore = val;
          } else {
            const check = validatePasswordRules(val);
            if (!check.isValid) {
              throw new Error(`A senha não atende aos requisitos de cyber-security: ${check.errors.join('. ')}`);
            }
            valueToStore = hashPassword(val);
          }
        } else {
          continue; // Não sobrescreve com senha vazia
        }
      }

      fields.push(`${col} = $${idx}`);
      values.push(valueToStore);
      idx++;
    }

    if (fields.length === 0) return this.findById(existing.id);

    values.push(existing.id);
    const sql = `
      UPDATE users
      SET ${fields.join(', ')}
      WHERE id = $${idx}
      RETURNING *;
    `;

    const res = await query<UserRow>(sql, values);
    return sanitizeUser(res.rows[0]) as SafeUserRow || null;
  },

  /**
   * Atualização direta e segura de senha criptografada
   */
  async updatePassword(userId: string, newRawPassword: string): Promise<boolean> {
    const check = validatePasswordRules(newRawPassword);
    if (!check.isValid) {
      throw new Error(`A senha não atende aos requisitos de cyber-security: ${check.errors.join('. ')}`);
    }
    const hashed = hashPassword(newRawPassword);
    const res = await query(`
      UPDATE users
      SET password_hash = $1, updated_at = NOW()
      WHERE id = $2;
    `, [hashed, userId]);
    return (res.rowCount ?? 0) > 0;
  },

  async delete(id: string): Promise<boolean> {
    const res = await query(`DELETE FROM users WHERE id = $1;`, [id]);
    return (res.rowCount ?? 0) > 0;
  }
};
