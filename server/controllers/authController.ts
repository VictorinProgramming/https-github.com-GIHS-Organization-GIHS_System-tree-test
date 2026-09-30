import { Request, Response } from 'express';
import { usersRepository } from '../repositories/usersRepository.js';
import { query } from '../db.js';
import {
  hashPassword,
  verifyPassword,
  checkRateLimit,
  recordLoginFailure,
  resetLoginAttempts,
  recordSecurityAudit,
  sanitizeUser
} from '../security.js';

export interface MasterSeedUser {
  id: string;
  name: string;
  email: string;
  password: string;
  role: string;
  user_role: 'SUPER_ADMIN';
  hierarchy_level: number;
  sector_id: string;
  sector_name: string;
  area: string;
  avatar_url: string;
  phone: string;
  admission_date: string;
  contract_type: 'PJ' | 'CLT';
  status: string;
  current_task: string;
  work_schedule: string;
  emergency_contact: string;
}

export const MASTER_USERS_DATA: MasterSeedUser[] = [
  {
    id: 'user-master-victor-hugo',
    name: 'Victor Hugo',
    email: 'victor.hugo@bycomp.com.br',
    password: '842867@Victor',
    role: 'Diretor Geral & Super Administrador Master',
    user_role: 'SUPER_ADMIN',
    hierarchy_level: 1,
    sector_id: 'sec-10',
    sector_name: 'Gestão',
    area: 'GESTAO',
    avatar_url: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=300&auto=format&fit=crop&q=80',
    phone: '(11) 98765-4321',
    admission_date: '2021-01-10',
    contract_type: 'PJ',
    status: 'Em atividade',
    current_task: 'Governança Corporativa e Gestão Estratégica Global',
    work_schedule: 'Dedicação Exclusiva / Flexível',
    emergency_contact: '(11) 98888-0001'
  },
  {
    id: 'user-master-rebeca',
    name: 'Rebeca',
    email: 'rebeca@bycomp.com.br',
    password: 'Bycomp@2026',
    role: 'Diretora Executiva & Super Administradora Master',
    user_role: 'SUPER_ADMIN',
    hierarchy_level: 1,
    sector_id: 'sec-10',
    sector_name: 'Gestão',
    area: 'GESTAO',
    avatar_url: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=300&auto=format&fit=crop&q=80',
    phone: '(11) 98765-4322',
    admission_date: '2021-02-15',
    contract_type: 'PJ',
    status: 'Em atividade',
    current_task: 'Gestão Executiva de Operações e Governança GIHS',
    work_schedule: 'Dedicação Exclusiva / Flexível',
    emergency_contact: '(11) 98888-0002'
  },
  {
    id: 'user-master-victor-martins',
    name: 'Victor Martins',
    email: 'Victor.martins@bycomp.com.br',
    password: 'Bycomp@2026',
    role: 'Tech Lead Executivo & Super Administrador Master',
    user_role: 'SUPER_ADMIN',
    hierarchy_level: 1,
    sector_id: 'sec-10',
    sector_name: 'Gestão',
    area: 'GESTAO',
    avatar_url: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=300&auto=format&fit=crop&q=80',
    phone: '(11) 98765-4323',
    admission_date: '2021-03-20',
    contract_type: 'PJ',
    status: 'Em atividade',
    current_task: 'Supervisão Arquitetural de Engenharia e Segurança',
    work_schedule: 'Dedicação Exclusiva / Flexível',
    emergency_contact: '(11) 98888-0003'
  },
  {
    id: 'user-master-matheus',
    name: 'Matheus',
    email: 'Matheus@bycomp.com.br',
    password: 'Bycomp@2026',
    role: 'Head de Inteligência & Super Administrador Master',
    user_role: 'SUPER_ADMIN',
    hierarchy_level: 1,
    sector_id: 'sec-10',
    sector_name: 'Gestão',
    area: 'GESTAO',
    avatar_url: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=300&auto=format&fit=crop&q=80',
    phone: '(11) 98765-4324',
    admission_date: '2021-04-01',
    contract_type: 'PJ',
    status: 'Em atividade',
    current_task: 'Governança de IA, Dados e Plataformas Corporativas',
    work_schedule: 'Dedicação Exclusiva / Flexível',
    emergency_contact: '(11) 98888-0004'
  }
];

export const authController = {
  /**
   * Seed dos 4 Usuários Masters no PostgreSQL com hash seguro PBKDF2 (Salted)
   */
  async seedMasters(req: Request, res: Response) {
    try {
      const results = [];
      for (const master of MASTER_USERS_DATA) {
        // Hashing PBKDF2 seguro com salt individual
        const securePasswordHash = hashPassword(master.password);

        const sql = `
          INSERT INTO users (
            id, name, email, password_hash, role, user_role, hierarchy_level,
            sector_id, sector_name, area, avatar_url, phone, admission_date,
            contract_type, status, current_task, work_schedule, emergency_contact,
            is_active, is_blocked, facial_active, facial_confidence_score, facial_registered_at
          ) VALUES (
            $1, $2, $3, $4, $5, $6, $7,
            $8, $9, $10, $11, $12, $13,
            $14, $15, $16, $17, $18,
            TRUE, FALSE, TRUE, 99.40, CURRENT_TIMESTAMP
          )
          ON CONFLICT (id) DO UPDATE SET
            name = EXCLUDED.name,
            email = EXCLUDED.email,
            password_hash = EXCLUDED.password_hash,
            role = EXCLUDED.role,
            user_role = EXCLUDED.user_role,
            hierarchy_level = EXCLUDED.hierarchy_level,
            sector_name = EXCLUDED.sector_name,
            area = EXCLUDED.area,
            avatar_url = EXCLUDED.avatar_url,
            phone = EXCLUDED.phone,
            is_active = TRUE,
            is_blocked = FALSE,
            updated_at = CURRENT_TIMESTAMP
          RETURNING id, name, email, role, user_role, hierarchy_level;
        `;

        try {
          const dbRes = await query(sql, [
            master.id,
            master.name,
            master.email,
            securePasswordHash,
            master.role,
            master.user_role,
            master.hierarchy_level,
            master.sector_id,
            master.sector_name,
            master.area,
            master.avatar_url,
            master.phone,
            master.admission_date,
            master.contract_type,
            master.status,
            master.current_task,
            master.work_schedule,
            master.emergency_contact
          ]);
          results.push(dbRes.rows[0]);
        } catch (dbErr: any) {
          console.warn(`Could not seed master user ${master.email}:`, dbErr.message);
          results.push({ email: master.email, seeded: false, reason: dbErr.message });
        }
      }

      res.json({
        success: true,
        message: '4 Usuários Masters protegidos com criptografia PBKDF2/Salt no PostgreSQL',
        masters: results
      });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  },

  /**
   * Endpoint de autenticação com proteção de força bruta, verificação timing-safe e auditoria
   */
  async login(req: Request, res: Response) {
    try {
      const { email, password } = req.body;
      const clientIp = (req.headers['x-forwarded-for'] as string)?.split(',')[0]?.trim() || req.socket.remoteAddress || '127.0.0.1';
      const userAgent = req.headers['user-agent'] || 'Desconhecido';

      if (!email || !password) {
        return res.status(400).json({ success: false, message: 'E-mail e senha são obrigatórios.' });
      }

      const cleanEmail = email.trim().toLowerCase();
      const cleanPassword = password.trim();
      const rateLimitKey = `${clientIp}:${cleanEmail}`;

      // 1. Defesa contra Força Bruta (Rate Limiting)
      const rateCheck = checkRateLimit(rateLimitKey);
      if (!rateCheck.allowed) {
        await recordSecurityAudit({
          action: 'LOGIN_BLOCKED_RATE_LIMIT',
          category: 'AUTH',
          user_name: cleanEmail,
          ip_address: clientIp,
          user_agent: userAgent,
          severity: 'Warning',
          details: { reason: 'Tentativas excessivas bloqueadas por segurança.', retryAfterSeconds: rateCheck.retryAfterSeconds }
        });

        return res.status(429).json({
          success: false,
          message: `Muitas tentativas incorretas. Por segurança, tente novamente em ${rateCheck.retryAfterSeconds} segundos.`
        });
      }

      // 2. Consulta de credenciais no PostgreSQL
      let userRow = null;
      try {
        userRow = await usersRepository.findByEmailWithCredentials(cleanEmail);
      } catch (dbErr: any) {
        console.warn('[Cyber-Security] Erro na consulta de credenciais:', dbErr?.message);
      }

      // 3. Validação do usuário existente no banco de dados
      if (userRow) {
        const passwordCheck = verifyPassword(cleanPassword, userRow.password_hash);

        if (passwordCheck.valid) {
          if (userRow.is_blocked) {
            await recordSecurityAudit({
              action: 'LOGIN_REJECTED_BLOCKED_USER',
              category: 'AUTH',
              user_id: userRow.id,
              user_name: userRow.name,
              ip_address: clientIp,
              user_agent: userAgent,
              severity: 'Warning',
              details: { status: 'Usuário bloqueado administrativamente' }
            });
            return res.status(403).json({ success: false, message: 'Usuário bloqueado pelo administrador corporativo.' });
          }

          // Reseta contador de tentativas
          resetLoginAttempts(rateLimitKey);

          // Se a senha estava em formato legado, realiza upgrade automático para PBKDF2 com Salt
          if (passwordCheck.needsUpgrade) {
            try {
              const upgradedHash = hashPassword(cleanPassword);
              await query(`UPDATE users SET password_hash = $1, updated_at = NOW() WHERE id = $2;`, [upgradedHash, userRow.id]);
            } catch (upgradeErr: any) {
              console.warn('[Cyber-Security] Upgrade de hash de senha:', upgradeErr?.message);
            }
          }

          // Registra auditoria de sucesso
          await recordSecurityAudit({
            action: 'LOGIN_SUCCESS',
            category: 'AUTH',
            user_id: userRow.id,
            user_name: userRow.name,
            ip_address: clientIp,
            user_agent: userAgent,
            severity: 'Info',
            details: { method: 'POSTGRESQL_PBKDF2_TIMING_SAFE' }
          });

          return res.json({
            success: true,
            message: 'Autenticação bem-sucedida via PostgreSQL (Credenciais Protegidas)',
            source: 'POSTGRESQL',
            user: {
              id: userRow.id,
              name: userRow.name,
              email: userRow.email,
              role: userRow.role,
              userRole: userRow.user_role,
              hierarchyLevel: userRow.hierarchy_level || 1,
              sector: userRow.sector_name || 'Gestão',
              area: userRow.area || 'GESTAO',
              avatar: userRow.avatar_url,
              phone: userRow.phone,
              admissionDate: userRow.admission_date,
              status: userRow.status,
              currentTask: userRow.current_task,
              contractType: userRow.contract_type,
              workSchedule: userRow.work_schedule,
              emergencyContact: userRow.emergency_contact,
              facialData: userRow.facial_active ? {
                photoUrl: userRow.facial_photo_url || userRow.avatar_url,
                biometricHash: userRow.facial_biometric_hash || 'sha256:master-bio',
                confidenceScore: userRow.facial_confidence_score || 99.4,
                active: true
              } : undefined
            }
          });
        }
      }

      // 4. Verificação de Fallback dos 4 Masters (com Hashing Automático ao autenticar)
      const masterFound = MASTER_USERS_DATA.find(
        (m) => m.email.toLowerCase() === cleanEmail && m.password === cleanPassword
      );

      if (masterFound) {
        resetLoginAttempts(rateLimitKey);

        const secureHash = hashPassword(masterFound.password);
        // Persiste master com hash PBKDF2 seguro no banco
        query(`
          INSERT INTO users (
            id, name, email, password_hash, role, user_role, hierarchy_level,
            sector_name, area, avatar_url, phone, admission_date,
            contract_type, status, current_task, work_schedule, emergency_contact,
            is_active, is_blocked, facial_active, facial_confidence_score, facial_registered_at
          ) VALUES (
            $1, $2, $3, $4, $5, $6, $7,
            $8, $9, $10, $11, $12,
            $13, $14, $15, $16, $17,
            TRUE, FALSE, TRUE, 99.40, CURRENT_TIMESTAMP
          )
          ON CONFLICT (id) DO UPDATE SET
            password_hash = EXCLUDED.password_hash,
            updated_at = CURRENT_TIMESTAMP;
        `, [
          masterFound.id, masterFound.name, masterFound.email, secureHash,
          masterFound.role, masterFound.user_role, masterFound.hierarchy_level,
          masterFound.sector_name, masterFound.area, masterFound.avatar_url, masterFound.phone,
          masterFound.admission_date, masterFound.contract_type, masterFound.status,
          masterFound.current_task, masterFound.work_schedule, masterFound.emergency_contact
        ]).catch(() => {});

        await recordSecurityAudit({
          action: 'LOGIN_SUCCESS_MASTER',
          category: 'AUTH',
          user_id: masterFound.id,
          user_name: masterFound.name,
          ip_address: clientIp,
          user_agent: userAgent,
          severity: 'Info',
          details: { method: 'MASTER_SECURED_PBKDF2' }
        });

        return res.json({
          success: true,
          message: 'Autenticação Master Autorizada (PBKDF2 Ativo)',
          source: 'POSTGRESQL_MASTER',
          user: {
            id: masterFound.id,
            name: masterFound.name,
            email: masterFound.email,
            role: masterFound.role,
            userRole: masterFound.user_role,
            hierarchyLevel: masterFound.hierarchy_level,
            sector: masterFound.sector_name,
            area: masterFound.area,
            avatar: masterFound.avatar_url,
            phone: masterFound.phone,
            admissionDate: masterFound.admission_date,
            status: masterFound.status,
            currentTask: masterFound.current_task,
            contractType: masterFound.contract_type,
            workSchedule: masterFound.work_schedule,
            emergencyContact: masterFound.emergency_contact,
            facialData: {
              photoUrl: masterFound.avatar_url,
              biometricHash: 'sha256:master-bio',
              confidenceScore: 99.4,
              active: true
            }
          }
        });
      }

      // 5. Credenciais inválidas: computa falha e registra auditoria
      const failureResult = recordLoginFailure(rateLimitKey);
      await recordSecurityAudit({
        action: 'LOGIN_FAILED',
        category: 'AUTH',
        user_name: cleanEmail,
        ip_address: clientIp,
        user_agent: userAgent,
        severity: failureResult.blocked ? 'Warning' : 'Info',
        details: {
          remainingAttempts: failureResult.remainingAttempts,
          blocked: failureResult.blocked,
          retryAfterSeconds: failureResult.retryAfterSeconds
        }
      });

      return res.status(401).json({
        success: false,
        message: failureResult.blocked
          ? `Muitas tentativas incorretas. Conta temporariamente suspensa por ${failureResult.retryAfterSeconds} segundos.`
          : 'Credenciais inválidas. Verifique seu e-mail e senha corporativos.'
      });
    } catch (err: any) {
      res.status(500).json({ success: false, error: 'Erro interno no processamento de autenticação segura.' });
    }
  }
};
